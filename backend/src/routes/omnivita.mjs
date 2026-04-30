import { requireAuth } from '../auth.mjs';
import { getCharacterByOwnerUserId, getCharacterRowById, saveCharacter } from '../characters.mjs';
import { getMasterData } from '../master-data.mjs';
import {
  manifestationStateMeetsRequirement,
  matchesOmnivitaSequence,
  normalizeOmnivitaCodeConfig,
  normalizeOmnivitaDirection,
  OMNIVITA_MASTER_CONTROL_CODE
} from '../omnivita.mjs';
import { withTransaction } from '../db.mjs';

function buildTrail(trail) {
  if (!Array.isArray(trail)) return [];
  return trail.map((entry) => normalizeOmnivitaDirection(entry)).filter(Boolean).slice(-24);
}

function isCompanionForm(entry) {
  const type = String(entry?.type || '').trim().toLowerCase();
  if (!type) return false;
  return ['forma', 'transformacao', 'transformação'].includes(type);
}

function isCompanionHidden(entry) {
  return Boolean(entry?.isHidden || entry?.hidden || String(entry?.visibility || '').trim().toLowerCase() === 'hidden');
}

function usesOmnivitaCharacter(character) {
  const lookup = [
    character?.ownerUsername,
    character?.identity?.name,
    character?.identity?.manifestationOrigin,
    character?.manifestation?.origin,
    character?.manifestation?.name,
    character?.equipment?.primaryWeapon
  ]
    .map((entry) => String(entry || '').trim().toLowerCase())
    .join(' ');

  return lookup.includes('cael') || lookup.includes('omnivita');
}

function pickMatchingCode(config, trail, manifestationState) {
  const candidates = [];

  if (
    config.masterControl.enabled
    && manifestationStateMeetsRequirement(manifestationState, config.masterControl.requiredState)
    && matchesOmnivitaSequence(trail, config.masterControl.sequence)
  ) {
    candidates.push({
      action: 'master-control',
      sequenceLength: config.masterControl.sequence.length,
      codeId: OMNIVITA_MASTER_CONTROL_CODE.id
    });
  }

  for (const entry of config.unlockCodes) {
    if (!entry.enabled || !entry.targetCompanionId) continue;
    if (!manifestationStateMeetsRequirement(manifestationState, entry.requiredState)) continue;
    if (!matchesOmnivitaSequence(trail, entry.sequence)) continue;
    candidates.push({
      action: 'unlock-form',
      sequenceLength: entry.sequence.length,
      codeId: entry.id,
      targetCompanionId: entry.targetCompanionId
    });
  }

  candidates.sort((left, right) => {
    if (right.sequenceLength !== left.sequenceLength) return right.sequenceLength - left.sequenceLength;
    if (left.action === 'master-control' && right.action !== 'master-control') return -1;
    if (right.action === 'master-control' && left.action !== 'master-control') return 1;
    return 0;
  });

  return candidates[0] || null;
}

export default async function registerOmnivitaRoutes(app) {
  app.post('/api/omnivita/evaluate', async (request, reply) => {
    const auth = await requireAuth(request, reply);
    if (!auth) return;

    if (auth.user.role !== 'player') {
      reply.code(403).send({ message: 'Somente players usam o OmniVita.' });
      return;
    }

    const trail = buildTrail(request.body?.trail);
    if (!trail.length) {
      reply.send({ matched: false });
      return;
    }

    const transactionResult = await withTransaction(async (client) => {
      const character = await getCharacterByOwnerUserId(auth.user.id, client);
      if (!character) {
        const error = new Error('Ficha nao encontrada para este player.');
        error.statusCode = 404;
        throw error;
      }
      if (!usesOmnivitaCharacter(character)) {
        return { matched: false };
      }

      const existingRow = await getCharacterRowById(character.id, client);
      if (!existingRow) {
        const error = new Error('Ficha nao encontrada para este player.');
        error.statusCode = 404;
        throw error;
      }

      const config = normalizeOmnivitaCodeConfig((await getMasterData('omnivita-codes', client)).data);
      const manifestationState = character?.manifestation?.state || 'Parcial';
      const matched = pickMatchingCode(config, trail, manifestationState);
      if (!matched) {
        return { matched: false };
      }

      if (matched.action === 'master-control') {
        const hasHiddenForms = Array.isArray(character.companions) && character.companions.some((entry) => isCompanionForm(entry) && isCompanionHidden(entry));
        const alreadyUnlocked = Boolean(character?.manifestation?.omnivitaMasterControlUnlocked);
        let nextCharacter = character;

        if (!alreadyUnlocked || hasHiddenForms) {
          nextCharacter = await saveCharacter(existingRow, {
            ...character,
            manifestation: {
              ...(character.manifestation || {}),
              omnivitaMasterControlUnlocked: true
            },
            companions: (character.companions || []).map((entry) => ({
              ...entry,
              isHidden: isCompanionForm(entry) ? false : entry.isHidden
            }))
          }, client);
        }

        return {
          matched: true,
          action: 'master-control',
          codeId: matched.codeId,
          message: OMNIVITA_MASTER_CONTROL_CODE.message,
          character: nextCharacter
        };
      }

      const targetCompanionId = String(matched.targetCompanionId || '');
      const targetCompanion = (character.companions || []).find((entry) => String(entry.id || '') === targetCompanionId);
      if (!targetCompanion) {
        return { matched: false };
      }

      let nextCharacter = character;
      const alreadyVisible = !isCompanionHidden(targetCompanion);
      if (!alreadyVisible) {
        nextCharacter = await saveCharacter(existingRow, {
          ...character,
          companions: (character.companions || []).map((entry) => (
            String(entry.id || '') === targetCompanionId
              ? { ...entry, isHidden: false }
              : entry
          ))
        }, client);
      }

      return {
        matched: true,
        action: 'unlock-form',
        codeId: matched.codeId,
        targetCompanionId,
        message: alreadyVisible
          ? `${targetCompanion.name || 'Forma'} ja estava publicada.`
          : `${targetCompanion.name || 'Forma'} liberado.`,
        character: nextCharacter
      };
    }).catch((error) => {
      if (error?.statusCode) {
        reply.code(error.statusCode).send({ message: error.message });
        return null;
      }
      throw error;
    });

    if (!transactionResult) return;
    reply.send(transactionResult);
  });
}
