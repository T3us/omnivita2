import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { api } from '../api/client';
import type { CharacterSheet, CombatState, Combatant, CompanionSheet } from '../api/types';
import {
  APTITUDE_TIERS,
  APTITUDE_CATALOG,
  ATTRIBUTES,
  SKILL_ATTRIBUTE_DEFAULTS,
  SKILLS,
  SKILL_LABELS,
  calculateDerived,
  calculateSkillTotal,
  createCompanion,
  createCompanionFacetEntry,
  createCompanionSkillEntry,
  getAptitudeById,
  getAptitudeCostByTier,
  getAptitudeEffectOptions,
  getAptitudeTier,
  getSkillFixedBonus,
  getSkillFixedBonusSources,
  getSkillSituationalBonuses,
  hasAptitudeAutoEffect,
  hydrateAptitudeEntry,
  hydrateCharacter,
  normalizeCompanion
} from '../domain/system';
import {
  OMNIVITA_MASTER_SCAN_LOOPS,
  OMNIVITA_MASTER_SCAN_SPEED_MULTIPLIER,
  getOmnivitaStepDuration,
  type OmnivitaSecretDirection
} from '../domain/omnivita';
import { downloadJson, readJsonFile } from '../utils/json';
import { optimizeCharacterImages, readFileAsOptimizedDataUrl } from '../utils/images';
import { Badge, Button, Card, ResourceMeter } from './Ui';
import { OmniVitaCoreSelector } from './OmniVitaCoreSelector';
import type { OmniVitaCoreSelectorHandle, OmniVitaSelectorForm } from './OmniVitaCoreSelector';

type TabId = 'geral' | 'combate' | 'pericias' | 'aptidoes' | 'manifestacao' | 'omnivita' | 'formas' | 'inventario';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'geral', label: 'Geral' },
  { id: 'combate', label: 'Combate' },
  { id: 'pericias', label: 'Pericias' },
  { id: 'aptidoes', label: 'Aptidoes' },
  { id: 'manifestacao', label: 'Manifestacao' },
  { id: 'omnivita', label: 'OmniVita' },
  { id: 'formas', label: 'Formas' },
  { id: 'inventario', label: 'Inventario' }
];
const ACTIVE_TAB_STORAGE_KEY = 'omnivita-active-tab';

const STATUS_OPTIONS = ['Vivo', 'Morrendo', 'Morto'];
const MANIFESTATION_STATES = ['Parcial', 'Completa', 'Alem'];

interface Props {
  character: CharacterSheet;
  combatState?: CombatState | null;
  saving?: boolean;
  combatControlPending?: boolean;
  onSave(character: CharacterSheet): void;
  onCombatControl?(control: Record<string, unknown>): Promise<unknown>;
}

export function CharacterSheetEditor({ character, combatState, saving = false, combatControlPending = false, onSave, onCombatControl }: Props) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const combatSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(() => readStoredTab());
  const [activeCompanionIndex, setActiveCompanionIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<CharacterSheet>(() => hydrateCharacter(character));
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillAttributeFilter, setSkillAttributeFilter] = useState('all');
  const [aptitudeSearch, setAptitudeSearch] = useState('');
  const [aptitudeTierFilter, setAptitudeTierFilter] = useState('all');
  const latestDraftRef = useRef<CharacterSheet>(draft);
  const dirtyRef = useRef(false);
  const saveRef = useRef(onSave);

  useEffect(() => {
    latestDraftRef.current = draft;
    dirtyRef.current = dirty;
    saveRef.current = onSave;
  }, [dirty, draft, onSave]);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (combatSyncTimerRef.current) {
      clearTimeout(combatSyncTimerRef.current);
      combatSyncTimerRef.current = null;
    }
    setDraft(hydrateCharacter(character));
    setActiveCompanionIndex(null);
    setMessage('');
    setDirty(false);
  }, [character.id]);

  useEffect(() => () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (combatSyncTimerRef.current) clearTimeout(combatSyncTimerRef.current);
    if (dirtyRef.current) saveRef.current(hydrateCharacter(latestDraftRef.current));
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    } catch {
      // sessionStorage may be blocked; the tab still works without persistence.
    }
  }, [activeTab]);

  useEffect(() => {
    if (!dirty) return undefined;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      onSave(hydrateCharacter(draft));
      setDirty(false);
      setMessage('Salvo automaticamente.');
    }, 650);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [dirty, draft, onSave]);

  const hydrated = useMemo(() => hydrateCharacter(draft), [draft]);
  const derived = useMemo(() => calculateDerived(hydrated), [hydrated]);
  const manifestation = (hydrated.manifestation || {}) as Record<string, unknown>;
  const visibleCompanionRows = hydrated.companions
    .map((companion, index) => ({ companion, index }))
    .filter(({ companion }) => isCompanionVisibleToPlayer(companion));
  const visibleCompanions = visibleCompanionRows.map(({ companion }) => companion);
  const image = hydrated.identity.image || '/Gemini_Generated_Image_rvnvryrvnvryrvnv.png';
  const combatOwnership = getCombatOwnership(hydrated, combatState?.combatants || []);
  const activeCombatForm = combatOwnership.activeFormEntry
    ? visibleCompanions.find((entry) => entry.id === combatOwnership.activeFormEntry?.sourceCompanionId) || null
    : null;
  const identityLinks = splitInlineList(hydrated.identity.links);
  const normalizedSkillSearch = normalizeSearchText(skillSearch);
  const filteredSkills = SKILLS.filter((skill) => {
    const attributeKey = hydrated.skillAttributes?.[skill] || SKILL_ATTRIBUTE_DEFAULTS[skill] || 'destreza';
    const matchesAttribute = skillAttributeFilter === 'all' || attributeKey === skillAttributeFilter;
    const matchesSearch = !normalizedSkillSearch || normalizeSearchText(`${SKILL_LABELS[skill]} ${attributeKey}`).includes(normalizedSkillSearch);
    return matchesAttribute && matchesSearch;
  });
  const aptitudeRows = hydrated.aptitudes.map((aptitude, index) => {
    const catalog = getAptitudeById(aptitude.catalogId);
    const tier = getAptitudeTier(aptitude);
    return { aptitude, catalog, index, tier };
  });
  const normalizedAptitudeSearch = normalizeSearchText(aptitudeSearch);
  const filteredAptitudes = aptitudeRows.filter(({ aptitude, catalog, tier }) => {
    const matchesTier = aptitudeTierFilter === 'all' || tier === aptitudeTierFilter;
    const text = normalizeSearchText([
      resolveAptitudeName(aptitude),
      catalog?.group,
      catalog?.summary,
      catalog?.prerequisites,
      tier,
      aptitude.notes
    ].join(' '));
    return matchesTier && (!normalizedAptitudeSearch || text.includes(normalizedAptitudeSearch));
  });
  const availableAptitudeCatalog = getVisibleAptitudeCatalogForClass(hydrated.identity.className);
  const showOmnivitaTab = usesOmnivitaStandaloneUi(hydrated);
  const visibleTabs = tabs.filter((tab) => tab.id !== 'omnivita' || showOmnivitaTab);

  useEffect(() => {
    if (activeTab === 'omnivita' && !showOmnivitaTab) setActiveTab('geral');
  }, [activeTab, showOmnivitaTab]);

  function patch(nextPatch: Partial<CharacterSheet>) {
    setDraft((current) => hydrateCharacter({ ...current, ...nextPatch }));
    setDirty(true);
  }

  function patchIdentity(key: string, value: string | number) {
    patch({ identity: { ...draft.identity, [key]: value } });
  }

  function patchResource(key: string, value: string | number) {
    const nextResources = { ...draft.resources, [key]: value };
    if (key === 'pvCurrent') {
      nextResources.status = normalizeStatusForPv(nextResources.status, value);
    }
    if (key === 'status') {
      nextResources.status = normalizeCombatStatus(value, 'Vivo');
    }
    const nextCharacter = hydrateCharacter({ ...draft, resources: nextResources });
    setDraft(nextCharacter);
    setDirty(true);
    if (key === 'pvCurrent' || key === 'status') {
      scheduleCombatResourceSync(nextCharacter);
    }
  }

  function patchProgression(key: string, value: string | number) {
    patch({ progression: { ...draft.progression, [key]: value } });
  }

  function patchManifestation(key: string, value: unknown) {
    patch({ manifestation: { ...((draft.manifestation || {}) as Record<string, unknown>), [key]: value } });
  }

  function buildCombatResourceControl(nextCharacter: CharacterSheet) {
    const combatants = combatState?.combatants || [];
    if (!combatState?.active || !combatants.length) return null;
    const ownership = getCombatOwnership(nextCharacter, combatants);
    if (!ownership.ownEntries.length) return null;

    const sharedInitiative = ownership.selfEntry
      ? Number(ownership.selfEntry.initiativeTotal || 0)
      : (ownership.activeFormEntry ? Number(ownership.activeFormEntry.initiativeTotal || 0) : null);
    const companions: Array<Record<string, unknown>> = [];

    ownership.forms.forEach((entry) => {
      const active = ownership.activeFormEntry
        && String(ownership.activeFormEntry.sourceCompanionId || '') === String(entry.id || '');
      if (!active) return;
      companions.push({
        companionId: entry.id,
        inEncounter: true,
        pvCurrent: Number(entry.pvCurrent || 0),
        initiativeTotal: null
      });
    });

    ownership.supportRows.forEach(({ companion, activeEntry }) => {
      if (!activeEntry) return;
      companions.push({
        companionId: companion.id,
        inEncounter: true,
        pvCurrent: Number(companion.pvCurrent || 0),
        initiativeTotal: Number(activeEntry.initiativeTotal || 0)
      });
    });

    return {
      requestId: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
      self: {
        inEncounter: null,
        initiativeTotal: sharedInitiative,
        pvCurrent: Number(nextCharacter.resources.pvCurrent || 0)
      },
      companions
    };
  }

  function scheduleCombatResourceSync(nextCharacter: CharacterSheet) {
    if (!onCombatControl) return;
    if (!combatState?.active || !combatState.combatants?.length) return;
    if (combatSyncTimerRef.current) clearTimeout(combatSyncTimerRef.current);
    combatSyncTimerRef.current = setTimeout(() => {
      combatSyncTimerRef.current = null;
      const control = buildCombatResourceControl(nextCharacter);
      if (!control) return;
      void onCombatControl(control).catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Falha ao sincronizar combate.');
      });
    }, 500);
  }

  function exportCharacter() {
    const filename = buildCharacterExportFilename(hydrated);
    downloadJson(filename, createCharacterTransferEnvelope(createPlayerVisibleCharacter(hydrated), { source: 'manual-export' }));
    setMessage('JSON exportado.');
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      setMessage('Otimizando imagens do JSON...');
      const payload = await readJsonFile(file);
      const imported = extractCharacterFromPayload(payload);
      if (!imported) {
        setMessage('JSON nao contem uma ficha reconhecida.');
        return;
      }
      const optimized = await optimizeCharacterImages(hydrateCharacter(imported));
      setDraft(preserveCurrentCharacterIdentity(optimized.character, hydrated));
      setDirty(true);
      setActiveTab('geral');
      setMessage('JSON carregado. Salvando automaticamente...');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Arquivo JSON invalido.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  function createCharacterTransferEnvelope(character: CharacterSheet, metadata: Record<string, unknown> = {}) {
    return {
      app: 'OmniVita',
      format: 'omnivita-character-transfer',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      metadata,
      character: hydrateCharacter(character)
    };
  }

  function preserveCurrentCharacterIdentity(nextCharacter: CharacterSheet, currentCharacter: CharacterSheet) {
    return hydrateCharacter({
      ...nextCharacter,
      id: currentCharacter.id,
      ownerUserId: currentCharacter.ownerUserId,
      ownerUsername: currentCharacter.ownerUsername,
      companions: mergeImportedCompanionsWithHidden(nextCharacter.companions, currentCharacter.companions),
      masterSession: currentCharacter.masterSession
    });
  }

  function addAptitude() {
    const usedCatalogIds = new Set(hydrated.aptitudes.map((aptitude) => String(aptitude.catalogId || '')).filter(Boolean));
    const catalog = availableAptitudeCatalog.find((entry) => !usedCatalogIds.has(entry.id)) || availableAptitudeCatalog[0];
    if (!catalog) {
      setMessage('Nenhuma aptidao disponivel para esta classe.');
      return;
    }

    patch({
      aptitudes: [
        ...hydrated.aptitudes,
        hydrateAptitudeEntry({ catalogId: catalog.id, tier: catalog.tier })
      ]
    });
  }

  function updateAptitude(index: number, key: string, value: string) {
    const aptitudes = hydrated.aptitudes.map((entry, currentIndex) => (
      currentIndex === index ? { ...entry, [key]: value } : entry
    ));
    patch({ aptitudes });
  }

  function updateAptitudeCatalog(index: number, catalogId: string) {
    const catalog = getAptitudeById(catalogId);
    const effectOptions = getAptitudeEffectOptions(catalogId);
    const aptitudes = hydrated.aptitudes.map((entry, currentIndex) => (
      currentIndex === index
        ? {
            ...entry,
            catalogId,
            tier: catalog?.tier || String(entry.tier || 'Basica'),
            customName: '',
            effectChoice: effectOptions[0]?.value || ''
          }
        : entry
    ));
    patch({ aptitudes });
  }

  function removeAptitude(index: number) {
    patch({ aptitudes: hydrated.aptitudes.filter((_, currentIndex) => currentIndex !== index) });
  }

  function addFacet() {
    patch({ facets: [...hydrated.facets, { name: '', rank: 1, xp: 0, notes: '' }] });
  }

  function updateFacet(index: number, key: string, value: string | number) {
    const facets = hydrated.facets.map((entry, currentIndex) => (
      currentIndex === index ? { ...entry, [key]: value } : entry
    ));
    patch({ facets });
  }

  function addFacetSkill(index: number) {
    const facet = hydrated.facets[index] || {};
    const skills = getFacetSkillEntries(facet);
    const limit = getFacetSkillLimit(facet);
    if (skills.length >= limit) {
      setMessage(limit > 0 ? `Essa faceta ja tem ${limit}/${limit} skill(s).` : 'Rank 1 ainda nao libera skills de faceta.');
      return;
    }

    const facets = hydrated.facets.map((entry, currentIndex) => (
      currentIndex === index ? { ...entry, skills: [...skills, { name: '', effect: '' }] } : entry
    ));
    patch({ facets });
  }

  function updateFacetSkill(facetIndex: number, skillIndex: number, key: string, value: string) {
    const facets = hydrated.facets.map((entry, currentIndex) => {
      if (currentIndex !== facetIndex) return entry;
      const skills = getFacetSkillEntries(entry);
      const nextSkills = skills.map((skill, currentSkillIndex) => (
        currentSkillIndex === skillIndex ? { ...skill, [key]: value } : skill
      ));
      return { ...entry, skills: nextSkills };
    });
    patch({ facets });
  }

  function removeFacetSkill(facetIndex: number, skillIndex: number) {
    const facets = hydrated.facets.map((entry, currentIndex) => (
      currentIndex === facetIndex
        ? { ...entry, skills: getFacetSkillEntries(entry).filter((_, currentSkillIndex) => currentSkillIndex !== skillIndex) }
        : entry
    ));
    patch({ facets });
  }

  function removeFacet(index: number) {
    patch({ facets: hydrated.facets.filter((_, currentIndex) => currentIndex !== index) });
  }

  function addCompanion() {
    const companions = [...hydrated.companions, createCompanion({ isHidden: false })];
    patch({ companions });
    setActiveCompanionIndex(companions.length - 1);
  }

  function updateCompanion(index: number, companion: CompanionSheet) {
    const nextCharacter = hydrateCharacter({
      ...draft,
      companions: hydrated.companions.map((entry, currentIndex) => currentIndex === index ? normalizeCompanion(companion, index) : entry)
    });
    setDraft(nextCharacter);
    setDirty(true);
    scheduleCombatResourceSync(nextCharacter);
  }

  function removeCompanion(index: number) {
    patch({ companions: hydrated.companions.filter((_, currentIndex) => currentIndex !== index) });
    setActiveCompanionIndex(null);
  }

  function openCompanionById(companionId: string) {
    const index = hydrated.companions.findIndex((entry) => entry.id === companionId);
    if (index >= 0 && isCompanionVisibleToPlayer(hydrated.companions[index])) setActiveCompanionIndex(index);
  }

  return (
    <motion.div
      className="grid gap-3 md:gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <section className="relative overflow-hidden rounded-lg border border-vita/20 bg-[#090611] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.38)] md:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(139,92,246,0.22),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(194,157,255,0.1),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-vita/50 to-transparent" />
        <div className="relative grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)_310px]">
          <aside className="grid content-start gap-3 rounded-lg border border-vita/20 bg-black/30 p-4 text-center">
            <span className="mx-auto inline-flex min-h-6 items-center rounded-full border border-vita/25 bg-vita/10 px-3 text-xs font-black uppercase tracking-[0.08em] text-violet">
              Jogador
            </span>
            <Avatar image={image} name={hydrated.identity.name} className="mx-auto h-36 w-36 border-vita/25 shadow-[0_0_34px_rgba(139,92,246,0.22)]" />
            <div>
              <strong className="block text-lg">{hydrated.identity.className}</strong>
              <p className="text-sm text-textMuted">Nivel {hydrated.identity.level}</p>
            </div>
          </aside>

          <div className="min-w-0 self-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={hydrated.resources.status === 'Vivo' ? 'good' : 'warn'}>{hydrated.resources.status}</Badge>
              <Badge>{cleanTextValue(hydrated.identity.manifestationOrigin) || 'Origem indefinida'}</Badge>
              {activeCombatForm ? <Badge tone="accent">Forma ativa: {activeCombatForm.name}</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{hydrated.identity.name || 'Personagem'}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-textMuted md:text-base">
              {cleanTextValue(hydrated.identity.summary) || cleanTextValue(hydrated.identity.concept) || 'Resumo do personagem.'}
            </p>
            {identityLinks.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {identityLinks.slice(0, 6).map((link) => <Badge key={link}>{link}</Badge>)}
              </div>
            ) : null}
          </div>

          <aside className="grid content-start gap-3 rounded-lg border border-line bg-white/[0.04] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Ficha</span>
              <Badge tone={saving || dirty ? 'warn' : 'good'}>{saving ? 'Salvando' : dirty ? 'Alteracoes locais' : 'Pronto'}</Badge>
            </div>
            <ResourceMeter label="PV" current={Number(hydrated.resources.pvCurrent || 0)} max={derived.maxPv} />
            <ResourceMeter label="PE" current={Number(hydrated.resources.peCurrent || 0)} max={derived.maxPe} tone="warn" />
            <ResourceMeter label="PD" current={Number(hydrated.resources.pdCurrent || 0)} max={derived.maxPd} tone="danger" />
            <div className="grid grid-cols-2 gap-2">
              <DossierMetric label="PeV livres" value={derived.peVAvailable} />
              <DossierMetric label="Instabilidade" value={`${hydrated.resources.instability}/6`} />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" onClick={exportCharacter}>Exportar JSON</Button>
              <Button type="button" onClick={() => importInputRef.current?.click()}>Importar JSON</Button>
              <input
                ref={importInputRef}
                className="hidden"
                type="file"
                accept="application/json,.json"
                onChange={(event) => void handleImport(event.target.files?.[0])}
              />
            </div>
          </aside>
        </div>
        {message ? <p className="relative mt-4 rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-textMuted">{message}</p> : null}
      </section>

      <nav className="rounded-lg border border-line bg-panel/90 p-2 shadow-soft" aria-label="Abas da ficha">
        <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:pb-0">
          {visibleTabs.map((tab) => (
            <motion.button
              className={clsx(
                'min-h-10 shrink-0 rounded-lg border px-4 text-sm font-black transition',
                activeTab === tab.id
                  ? 'border-vita/60 bg-vita/25 text-textMain shadow-[0_0_24px_rgba(139,92,246,0.18)]'
                  : 'border-white/10 bg-white/5 text-textMuted hover:border-vita/30 hover:bg-white/10 hover:text-textMain'
              )}
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </nav>

      {activeTab === 'geral' ? (
        <div className="grid gap-3 md:gap-4">
          <Card className="overflow-hidden">
            <SectionHeading
              eyebrow="Identidade"
              title="Ficha"
              actions={(
                <>
                  <Badge>{derived.classConfig.notes}</Badge>
                  <Badge>Atributo limite {derived.attributeLimit}</Badge>
                  <Badge>Pericia limite {derived.skillLimit}</Badge>
                </>
              )}
            >
              Identidade, historia e limites principais.
            </SectionHeading>
            <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <article className="grid content-start gap-3 rounded-lg border border-vita/20 bg-black/25 p-4 text-center">
                <h3 className="font-black">Retrato</h3>
                <Avatar image={image} name={hydrated.identity.name} className="mx-auto h-36 w-36 border-vita/25" />
                <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold transition hover:bg-white/10">
                  Escolher imagem
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) => readImageFile(event, (value) => patchIdentity('image', value))}
                  />
                </label>
                <Button tone="danger" type="button" onClick={() => patchIdentity('image', '')}>Remover foto</Button>
                <p className="text-sm text-textMuted">Imagem do personagem, forma social ou retrato usado na mesa.</p>
              </article>
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <TextInput label="Nome" value={hydrated.identity.name} onChange={(value) => patchIdentity('name', value)} />
                  <NumberInput label="Idade" value={Number(hydrated.identity.age || 0)} min={0} onChange={(value) => patchIdentity('age', value)} />
                  <NumberInput label="Nivel" value={hydrated.identity.level} min={1} onChange={(value) => patchIdentity('level', value)} />
                  <SelectInput label="Classe" value={hydrated.identity.className} options={['Alterado', 'Especialista', 'Combatente']} onChange={(value) => patchIdentity('className', value)} />
                  <TextInput label="Origem da Manifestacao" value={String(hydrated.identity.manifestationOrigin || '')} onChange={(value) => patchIdentity('manifestationOrigin', value)} />
                  <TextInput label="Vinculos" value={String(hydrated.identity.links || '')} onChange={(value) => patchIdentity('links', value)} />
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <NarrativeField label="Conceito">
                    <TextArea label="Conceito" value={String(hydrated.identity.concept || '')} onChange={(value) => patchIdentity('concept', value)} />
                  </NarrativeField>
                  <NarrativeField label="Resumo">
                    <TextArea label="Resumo" value={String(hydrated.identity.summary || '')} onChange={(value) => patchIdentity('summary', value)} />
                  </NarrativeField>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-3 md:gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card>
              <SectionHeading
                eyebrow="Base"
                title="Atributos"
                actions={(
                  <>
                    <Badge>Gastos {derived.attributePointsSpent}</Badge>
                    <Badge tone={derived.attributePointsAvailable >= 0 ? 'good' : 'danger'}>Disponiveis {derived.attributePointsAvailable}</Badge>
                  </>
                )}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ATTRIBUTES.map((attribute) => (
                  <article className="rounded-lg border border-line bg-white/5 p-3 transition hover:border-vita/30 hover:bg-white/[0.07]" key={attribute.key}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{attribute.label}</span>
                        <strong className="mt-1 block text-3xl">{Number(hydrated.attributes[attribute.key] || 0)}</strong>
                      </div>
                      <Badge>max {derived.attributeLimit}</Badge>
                    </div>
                    <NumberInput
                      label={`Editar ${attribute.label}`}
                      value={Number(hydrated.attributes[attribute.key] || 0)}
                      min={0}
                      max={derived.attributeLimit}
                      onChange={(value) => patch({ attributes: { ...draft.attributes, [attribute.key]: value } })}
                    />
                  </article>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeading
                eyebrow="Recursos"
                title="Nucleo de combate"
                actions={(
                  <>
                    <Badge>PeV totais {derived.peVGranted}</Badge>
                    <Badge>Gastos {derived.peVSpent.total}</Badge>
                    <Badge tone={derived.peVAvailable >= 0 ? 'good' : 'danger'}>Livres {derived.peVAvailable}</Badge>
                  </>
                )}
              />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ResourceInputCard label="PV" current={Number(hydrated.resources.pvCurrent || 0)} max={derived.maxPv} formula={formatResourceFormula(derived.breakdown.pv)} tone="pv" onChange={(value) => patchResource('pvCurrent', value)} />
                <ResourceInputCard label="PE" current={Number(hydrated.resources.peCurrent || 0)} max={derived.maxPe} formula={formatResourceFormula(derived.breakdown.pe)} tone="pe" onChange={(value) => patchResource('peCurrent', value)} />
                <ResourceInputCard label="PD" current={Number(hydrated.resources.pdCurrent || 0)} max={derived.maxPd} formula={formatResourceFormula(derived.breakdown.pd)} tone="pd" onChange={(value) => patchResource('pdCurrent', value)} />
                <ResourceInputCard label="Instabilidade" current={Number(hydrated.resources.instability || 0)} max={6} formula="Trilha separada de PV, PE e PD." tone="instability" onChange={(value) => patchResource('instability', value)} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <SelectInput label="Status atual" value={hydrated.resources.status} options={STATUS_OPTIONS} onChange={(value) => patchResource('status', value)} />
                <NumberInput label="Bonus de Armadura" value={hydrated.resources.armorBonus} min={0} onChange={(value) => patchResource('armorBonus', value)} />
                <SelectInput label="Base do Bloqueio" value={hydrated.resources.blockMode} options={['vigor', 'forca']} onChange={(value) => patchResource('blockMode', value)} />
                <TextInput className="md:col-span-3" label="Fonte da Armadura / protecao" value={String(hydrated.resources.armorEquipment || '')} onChange={(value) => patchResource('armorEquipment', value)} />
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeading eyebrow="Derivados" title="Leitura rapida de jogo" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <DerivedTile label="Esquiva" value={formatSigned(derived.esquivaMod)} helper="Reacao" />
              <DerivedTile label="Bloqueio" value={derived.selectedBlock} helper={`Forca ${derived.blockForce} / Vigor ${derived.blockVigor}`} />
              <DerivedTile label="Iniciativa" value={formatSigned(derived.initiativeMod)} helper="Inicio do conflito" />
              <DerivedTile label="Manifestacao" value={formatSigned(derived.manifestationMod)} helper="Teste principal" />
              <DerivedTile label="Armadura" value={derived.armor} helper="Classe + bonus" />
              <DerivedTile label="Dano de corpo" value={derived.bodyDamageBonus} helper={`Corpo ${derived.bodyDamageLevel} | Forca ${Number(hydrated.attributes.forca || 0)}`} />
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === 'combate' ? (
        <PlayerCombatSection
          character={hydrated}
          combatControlPending={combatControlPending}
          combatState={combatState}
          derived={derived}
          onCombatControl={onCombatControl}
          onOpenCompanion={openCompanionById}
        />
      ) : null}

      {activeTab === 'pericias' ? (
        <Card>
          <SectionHeading
            eyebrow="Pericias"
            title="Lista de testes"
            actions={<Badge>{derived.peVSpent.skillsSpent} PeV em pericias</Badge>}
          >
            Totais, atributos base e valores investidos.
          </SectionHeading>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Buscar pericia</span>
              <input className={fieldClass} value={skillSearch} placeholder="Reflexos, luta, manifestacao..." onChange={(event) => setSkillSearch(event.target.value)} />
            </label>
            <SelectInput
              label="Atributo"
              value={skillAttributeFilter}
              options={[{ value: 'all', label: 'Todos' }, ...ATTRIBUTES.map((attribute) => ({ value: attribute.key, label: attribute.label }))]}
              onChange={setSkillAttributeFilter}
            />
          </div>
          <div className="mt-4 grid gap-3">
            {filteredSkills.length ? filteredSkills.map((skill) => {
              const attributeKey = hydrated.skillAttributes?.[skill] || SKILL_ATTRIBUTE_DEFAULTS[skill] || 'destreza';
              const fixedBonus = getSkillFixedBonus(hydrated, skill);
              const fixedBonusSources = getSkillFixedBonusSources(hydrated, skill);
              const situationalBonuses = getSkillSituationalBonuses(hydrated, skill);
              const total = calculateSkillTotal(hydrated.skills[skill], attributeKey, hydrated.attributes) + fixedBonus;
              return (
                <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3 transition hover:border-vita/30 hover:bg-white/[0.07] lg:grid-cols-[minmax(180px,0.7fr)_120px_minmax(260px,1fr)] lg:items-center" key={skill}>
                  <div className="min-w-0">
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{getAttributeLabel(attributeKey)}</span>
                    <strong className="mt-1 block truncate text-lg">{SKILL_LABELS[skill]}</strong>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fixedBonus ? <Badge tone="accent">Fixo {formatSigned(fixedBonus)}</Badge> : null}
                      {situationalBonuses.length ? <Badge tone="warn">{situationalBonuses.length} {situationalBonuses.length > 1 ? 'situacionais' : 'situacional'}</Badge> : null}
                    </div>
                  </div>
                  <div className="rounded-lg border border-vita/20 bg-vita/10 p-3 text-center">
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Total</span>
                    <strong className="block text-3xl">{formatSigned(total)}</strong>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                    <NumberInput
                      label="Valor investido"
                      value={Number(hydrated.skills[skill] || 0)}
                      min={0}
                      max={derived.skillLimit}
                      onChange={(value) => patch({ skills: { ...draft.skills, [skill]: value } })}
                    />
                    <SelectInput
                      label="Atributo base"
                      value={attributeKey}
                      options={ATTRIBUTES.map((attribute) => ({ value: attribute.key, label: attribute.label }))}
                      onChange={(value) => patch({ skillAttributes: { ...(draft.skillAttributes || {}), [skill]: value } })}
                    />
                  </div>
                  {fixedBonusSources.length || situationalBonuses.length ? (
                    <div className="grid gap-3 lg:col-span-3 lg:grid-cols-2">
                      {fixedBonusSources.length ? (
                        <div className="rounded-lg border border-vita/20 bg-vita/10 p-3">
                          <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">Bonus fixos</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {fixedBonusSources.map((entry, entryIndex) => (
                              <Badge key={`${entry.source}-${entry.bonus}-${entryIndex}`} tone="accent">
                                {entry.source} {formatSigned(entry.bonus)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {situationalBonuses.length ? (
                        <div className="rounded-lg border border-amber/20 bg-amber/10 p-3">
                          <span className="text-xs font-black uppercase tracking-[0.08em] text-amber">Lembretes situacionais</span>
                          <div className="mt-2 grid gap-2">
                            {situationalBonuses.map((entry, entryIndex) => (
                              <div className="flex flex-wrap items-start gap-2 text-sm text-textMuted" key={`${entry.source}-${entry.note}-${entryIndex}`}>
                                <Badge tone="warn">{entry.source} {formatSigned(entry.bonus)}</Badge>
                                <span className="flex-1">{entry.note}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma pericia encontrada.</p>}
          </div>
        </Card>
      ) : null}

      {activeTab === 'aptidoes' ? (
        <Card>
          <div className="grid gap-4">
            <SectionHeading
              eyebrow="Aptidoes"
              title="Biblioteca de aptidoes"
              actions={<Button type="button" onClick={addAptitude}>Adicionar aptidao</Button>}
            >
              Aptidoes, custos e progresso.
            </SectionHeading>
            <div className="grid gap-4 md:grid-cols-4">
              <NumberInput label="PeV extras manuais" value={Number(hydrated.progression.extraPeV || 0)} min={0} onChange={(value) => patchProgression('extraPeV', value)} />
              <NumberInput label="Gastos manuais de PeV" value={Number(hydrated.progression.manualPeVSpent || 0)} min={0} onChange={(value) => patchProgression('manualPeVSpent', value)} />
              <NumberInput label="Despertar novas Facetas" value={Number(hydrated.progression.facetaUnlocks || 0)} min={0} onChange={(value) => patchProgression('facetaUnlocks', value)} />
              <NumberInput label="Estabilizar Facetas" value={Number(hydrated.progression.facetaStabilizations || 0)} min={0} onChange={(value) => patchProgression('facetaStabilizations', value)} />
              <TextInput className="md:col-span-4" label="Observacoes de progressao" value={String(hydrated.progression.notes || '')} onChange={(value) => patchProgression('notes', value)} />
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-textMuted">Buscar aptidao</span>
                <input className={fieldClass} value={aptitudeSearch} placeholder="Nome, efeito, pre-requisito..." onChange={(event) => setAptitudeSearch(event.target.value)} />
              </label>
              <SelectInput
                label="Grau"
                value={aptitudeTierFilter}
                options={[{ value: 'all', label: 'Todos' }, ...APTITUDE_TIERS.map((tier) => ({ value: tier, label: tier }))]}
                onChange={setAptitudeTierFilter}
              />
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
            {hydrated.aptitudes.length ? (filteredAptitudes.length ? filteredAptitudes.map(({ aptitude, catalog, index, tier }) => {
              const effectOptions = getAptitudeEffectOptions(aptitude.catalogId);
              return (
                <article className="rounded-lg border border-line bg-white/5 p-4 transition hover:border-vita/30 hover:bg-white/[0.07]" key={String(aptitude.id || index)}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">{catalog?.group || 'Personalizada'}</span>
                      <h3 className="mt-1 truncate text-xl font-black">{resolveAptitudeName(aptitude)}</h3>
                      <p className="mt-1 text-sm text-textMuted">{catalog?.summary || 'Aptidao personalizada.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="accent">{tier}</Badge>
                      <Badge>{getAptitudeCostByTier(tier)} PeV</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <AptitudeCatalogSelect
                      catalog={availableAptitudeCatalog}
                      value={String(aptitude.catalogId || '')}
                      onChange={(value) => updateAptitudeCatalog(index, value)}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(170px,0.35fr)_minmax(0,1fr)]">
                    <StaticInfo label="Pre-requisitos" value={catalog?.prerequisites || 'Personalizado.'} />
                    <StaticInfo label="Efeito" value={getAptitudeEffectText(catalog)} />
                    <StaticInfo
                      label="Aplicacao automatica"
                      value={hasAptitudeAutoEffect(aptitude.catalogId) ? 'Bonus fixo aplicado.' : 'Sem bonus fixo.'}
                      className={effectOptions.length ? '' : 'md:col-span-2'}
                    />
                    {effectOptions.length ? (
                      <SelectInput
                        label="Bonus fixo em"
                        value={String(aptitude.effectChoice || effectOptions[0]?.value || '')}
                        options={effectOptions}
                        onChange={(value) => updateAptitude(index, 'effectChoice', value)}
                      />
                    ) : null}
                    <TextArea className="md:col-span-2" label="Notas" value={String(aptitude.notes || '')} onChange={(value) => updateAptitude(index, 'notes', value)} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button tone="danger" type="button" onClick={() => removeAptitude(index)}>Remover</Button>
                  </div>
                </article>
              );
            }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted xl:col-span-2">Nenhuma aptidao encontrada.</p>) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted xl:col-span-2">Nenhuma aptidao cadastrada.</p>}
            </div>
          </div>
        </Card>
      ) : null}

      {activeTab === 'manifestacao' ? (
        <div className="grid gap-3 md:gap-4">
          <Card className="overflow-hidden">
            <SectionHeading
              eyebrow="Manifestacao"
              title={cleanTextValue(manifestation.name) || 'Manifestacao principal'}
              actions={(
                <>
                  <Badge>Teste {formatSigned(derived.manifestationMod)}</Badge>
                  <Badge>{cleanTextValue(manifestation.state) || 'Parcial'}</Badge>
                </>
              )}
            >
              Nucleo, estado e efeitos ativos.
            </SectionHeading>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <article className="rounded-lg border border-vita/20 bg-vita/10 p-4">
                <div className="mb-4 rounded-lg border border-vita/20 bg-black/20 p-3">
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">Nucleo</span>
                  <strong className="mt-1 block text-2xl">{cleanTextValue(manifestation.name) || 'Manifestacao'}</strong>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <DossierMetric label="Origem" value={cleanTextValue(manifestation.origin) || '-'} />
                    <DossierMetric label="Estado" value={cleanTextValue(manifestation.state) || 'Parcial'} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput label="Nome da Manifestacao" value={cleanTextValue(manifestation.name)} onChange={(value) => patchManifestation('name', value)} />
                  <TextInput label="Origem" value={cleanTextValue(manifestation.origin)} onChange={(value) => patchManifestation('origin', value)} />
                  <SelectInput className="md:col-span-2" label="Estado" value={cleanTextValue(manifestation.state) || 'Parcial'} options={MANIFESTATION_STATES} onChange={(value) => patchManifestation('state', value)} />
                </div>
              </article>
              <div className="grid gap-4">
                <TextArea label="Glitches / efeitos ativos" value={cleanTextValue(manifestation.glitches)} onChange={(value) => patchManifestation('glitches', value)} />
                <TextArea label="Efeitos ativos / observacoes" value={cleanTextValue(manifestation.activeEffects)} onChange={(value) => patchManifestation('activeEffects', value)} />
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeading
              eyebrow="Facetas"
              title="Arsenal de poder"
              actions={<Button type="button" onClick={addFacet}>Adicionar faceta</Button>}
            >
              Ranks, XP, notas e skills.
            </SectionHeading>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {hydrated.facets.length ? hydrated.facets.map((facet, index) => {
                const facetSkills = getFacetSkillEntries(facet);
                const facetSkillLimit = getFacetSkillLimit(facet);
                const isOverLimit = facetSkills.length > facetSkillLimit;
                return (
                  <article className="rounded-lg border border-line bg-white/5 p-4 transition hover:border-vita/30 hover:bg-white/[0.07]" key={`manifestation-facet-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">Faceta</span>
                        <h3 className="mt-1 text-xl font-black">{String(facet.name || 'Sem nome')}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Rank {Number(facet.rank || 1)}</Badge>
                        <Badge>XP {Number(facet.xp || 0)}</Badge>
                        <Badge tone={isOverLimit ? 'danger' : 'accent'}>Skills {facetSkills.length}/{facetSkillLimit}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_110px_110px]">
                      <TextInput label="Nome da Faceta" value={String(facet.name || '')} onChange={(value) => updateFacet(index, 'name', value)} />
                      <NumberInput label="Rank" value={Number(facet.rank || 1)} min={1} max={10} onChange={(value) => updateFacet(index, 'rank', value)} />
                      <NumberInput label="XP" value={Number(facet.xp || 0)} min={0} onChange={(value) => updateFacet(index, 'xp', value)} />
                    </div>
                    <TextInput className="mt-3" label="Notas" value={String(facet.notes || '')} onChange={(value) => updateFacet(index, 'notes', value)} />

                    <details className="mt-3 rounded-lg border border-vita/20 bg-black/20 p-3">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm font-black text-textMain">
                        <span>Skills da faceta</span>
                      </summary>
                      <div className="mt-3 grid gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm text-textMuted">
                            Skills liberadas: {facetSkills.length}/{facetSkillLimit}
                          </p>
                          <Button
                            type="button"
                            disabled={facetSkills.length >= facetSkillLimit}
                            onClick={() => addFacetSkill(index)}
                          >
                            Adicionar skill
                          </Button>
                        </div>
                        {isOverLimit ? (
                          <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                            Essa faceta tem mais skills que o rank atual permite. Remova as extras ou aumente o rank.
                          </p>
                        ) : null}
                        {facetSkills.length ? facetSkills.map((skill, skillIndex) => (
                          <div className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={`facet-${index}-skill-${skillIndex}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <strong>{skill.name || `Skill ${skillIndex + 1}`}</strong>
                              <Button tone="danger" type="button" onClick={() => removeFacetSkill(index, skillIndex)}>Remover</Button>
                            </div>
                            <TextInput
                              label="Nome da skill"
                              value={skill.name}
                              onChange={(value) => updateFacetSkill(index, skillIndex, 'name', value)}
                            />
                            <TextArea
                              label="Efeito"
                              value={skill.effect}
                              onChange={(value) => updateFacetSkill(index, skillIndex, 'effect', value)}
                            />
                          </div>
                        )) : (
                          <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">
                            Nenhuma skill criada para esta faceta.
                          </p>
                        )}
                      </div>
                    </details>

                    <div className="mt-3">
                      <Button tone="danger" type="button" onClick={() => removeFacet(index)}>Remover</Button>
                    </div>
                  </article>
                );
              }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted xl:col-span-2">Nenhuma faceta cadastrada.</p>}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === 'omnivita' ? (
        <div className="grid gap-3 md:gap-4">
          <OmnivitaSandboxPanel
            character={hydrated}
            onOpenCompanion={openCompanionById}
            onApplyOmnivitaCharacter={(nextCharacter) => {
              setDraft(nextCharacter);
              setDirty(false);
            }}
          />
        </div>
      ) : null}

      {activeTab === 'formas' ? (
        <div className="grid gap-3 md:gap-4">
          <Card>
            <SectionHeading
              eyebrow="Formas"
              title="Transformacoes"
              actions={<Button type="button" onClick={addCompanion}>Adicionar</Button>}
            >
              Transformacoes e mini-fichas vinculadas.
            </SectionHeading>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleCompanionRows.length ? visibleCompanionRows.map(({ companion, index }) => {
                const combatEntry = combatOwnership.companionEntries.find((entry) => entry.sourceCompanionId === companion.id) || null;
                const isActiveForm = combatOwnership.activeFormEntry?.sourceCompanionId === companion.id;
                return (
                  <article className={clsx(
                    'grid min-w-0 gap-3 overflow-hidden rounded-lg border bg-white/5 p-3 transition hover:bg-white/[0.07]',
                    isActiveForm ? 'border-vita/50 shadow-[0_0_28px_rgba(139,92,246,0.18)]' : 'border-line hover:border-vita/30'
                  )} key={companion.id || index}>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar image={companion.image || ''} name={companion.name || 'Forma'} className="h-16 w-16 shrink-0 rounded-lg border-vita/20" />
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black">{companion.name || 'Sem nome'}</h3>
                          <p className="truncate text-sm text-textMuted">{companion.type || 'Mini-ficha'}</p>
                        </div>
                      </div>
                      <Button className="shrink-0" type="button" onClick={() => setActiveCompanionIndex(index)}>Abrir</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>PV {combatEntry?.pvCurrent ?? companion.pvCurrent}/{combatEntry?.pvMax || companion.pvMax}</Badge>
                      <Badge>Armadura {companion.armor}</Badge>
                      <Badge tone={companion.status === 'Vivo' ? 'good' : 'warn'}>{combatEntry?.status || companion.status}</Badge>
                      {isActiveForm ? <Badge tone="accent">Forma ativa</Badge> : null}
                      {combatEntry && !isActiveForm ? <Badge>Em cena</Badge> : null}
                    </div>
                    <ResourceMeter label="PV" current={combatEntry?.pvCurrent ?? companion.pvCurrent} max={combatEntry?.pvMax || companion.pvMax || 1} />
                    <div className="grid grid-cols-2 gap-2">
                      <DossierMetric label="Pericias" value={(companion.skills || []).length} />
                      <DossierMetric label="Facetas" value={(companion.facets || []).length} />
                    </div>
                    <p className="line-clamp-3 text-sm text-textMuted">{companion.notes || 'Sem notas.'}</p>
                    <Button tone="danger" type="button" onClick={() => removeCompanion(index)}>Remover</Button>
                  </article>
                );
              }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted xl:col-span-3">Nenhuma forma, ajudante ou entidade publicada.</p>}
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === 'inventario' ? (
        <Card>
          <SectionHeading eyebrow="Inventario" title="Loadout e anotacoes">
            Equipamentos, aparencia, itens e notas do personagem.
          </SectionHeading>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <LoadoutPanel title="Arma principal" value={String(hydrated.equipment?.primaryWeapon || 'Nao definida')}>
              <TextInput label="Arma principal" value={String(hydrated.equipment?.primaryWeapon || '')} onChange={(value) => patch({ equipment: { ...(draft.equipment || {}), primaryWeapon: value } })} />
            </LoadoutPanel>
            <LoadoutPanel title="Arma secundaria" value={String(hydrated.equipment?.secondaryWeapon || 'Nao definida')}>
              <TextInput label="Arma secundaria" value={String(hydrated.equipment?.secondaryWeapon || '')} onChange={(value) => patch({ equipment: { ...(draft.equipment || {}), secondaryWeapon: value } })} />
            </LoadoutPanel>
            <LoadoutPanel title="Aparencia" value={String(hydrated.identity.appearance || 'Sem descricao')}>
              <TextInput label="Aparencia" value={String(hydrated.identity.appearance || '')} onChange={(value) => patchIdentity('appearance', value)} />
            </LoadoutPanel>
            <div className="lg:col-span-3">
              <TextArea label="Itens" value={String(hydrated.equipment?.items || '')} onChange={(value) => patch({ equipment: { ...(draft.equipment || {}), items: value } })} />
              {splitInlineList(hydrated.equipment?.items).length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {splitInlineList(hydrated.equipment?.items).slice(0, 18).map((item) => <Badge key={item}>{item}</Badge>)}
                </div>
              ) : null}
            </div>
            <TextArea className="lg:col-span-3" label="Notas do personagem" value={String(hydrated.notes || '')} onChange={(value) => patch({ notes: value })} />
          </div>
        </Card>
      ) : null}

      {activeCompanionIndex !== null && hydrated.companions[activeCompanionIndex] ? (
        <CompanionEditor
          companion={hydrated.companions[activeCompanionIndex]}
          onChange={(next) => updateCompanion(activeCompanionIndex, next)}
          onClose={() => setActiveCompanionIndex(null)}
          onDelete={() => removeCompanion(activeCompanionIndex)}
        />
      ) : null}
    </motion.div>
  );
}

function SectionHeading({
  actions,
  children,
  eyebrow,
  title
}: {
  actions?: ReactNode;
  children?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">{eyebrow}</span> : null}
        <h2 className="mt-1 text-xl font-black leading-tight md:text-2xl">{title}</h2>
        {children ? <p className="mt-1 max-w-3xl text-sm leading-relaxed text-textMuted">{children}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

function DossierMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <motion.div className="rounded-lg border border-line bg-white/5 px-3 py-2" whileHover={{ y: -1 }} transition={{ duration: 0.16 }}>
      <span className="block text-xs font-black uppercase tracking-[0.08em] text-textMuted">{label}</span>
      <strong className="mt-1 block truncate text-lg">{value}</strong>
    </motion.div>
  );
}

function NarrativeField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <article className="rounded-lg border border-line bg-white/5 p-3">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{label}</span>
      <div className="mt-3">{children}</div>
    </article>
  );
}

function DerivedTile({ helper, label, value }: { helper: string; label: string; value: ReactNode }) {
  return (
    <motion.article className="min-h-28 rounded-lg border border-line bg-white/5 p-4 transition hover:border-vita/30 hover:bg-white/[0.07]" whileHover={{ y: -2 }} transition={{ duration: 0.16 }}>
      <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{label}</span>
      <strong className="mt-3 block text-3xl leading-none text-textMain">{value}</strong>
      <p className="mt-2 text-sm text-textMuted">{helper}</p>
    </motion.article>
  );
}

function LoadoutPanel({ children, title, value }: { children: ReactNode; title: string; value: string }) {
  return (
    <motion.article className="rounded-lg border border-line bg-white/5 p-4 transition hover:border-vita/30 hover:bg-white/[0.07]" whileHover={{ y: -2 }} transition={{ duration: 0.16 }}>
      <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">{title}</span>
      <strong className="mt-2 block min-h-12 break-words text-lg">{value}</strong>
      <div className="mt-4">{children}</div>
    </motion.article>
  );
}

type AptitudeCatalogEntry = typeof APTITUDE_CATALOG[number];

function AptitudeCatalogSelect({
  catalog,
  value,
  onChange
}: {
  catalog: AptitudeCatalogEntry[];
  value: string;
  onChange(value: string): void;
}) {
  const selected = value ? getAptitudeById(value) : null;
  const hasSelected = Boolean(selected && catalog.some((entry) => entry.id === selected.id));

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">Aptidao</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {!value ? <option value="" disabled>Selecionar aptidao</option> : null}
        {selected && !hasSelected ? (
          <option value={selected.id}>{selected.group} - {selected.name}</option>
        ) : null}
        {catalog.map((entry) => (
          <option key={entry.id} value={entry.id}>{entry.group} - {entry.name}</option>
        ))}
      </select>
    </label>
  );
}

const CLASS_APTITUDE_GROUPS = ['Alterado', 'Especialista', 'Combatente'];

function getVisibleAptitudeCatalogForClass(className: unknown) {
  const characterClass = String(className || '');
  return APTITUDE_CATALOG.filter((entry) => (
    !CLASS_APTITUDE_GROUPS.includes(entry.group) || entry.group === characterClass
  ));
}

function PlayerCombatSection({
  character,
  combatState,
  derived,
  combatControlPending,
  onCombatControl,
  onOpenCompanion
}: {
  character: CharacterSheet;
  combatState?: CombatState | null;
  derived: ReturnType<typeof calculateDerived>;
  combatControlPending: boolean;
  onCombatControl?(control: Record<string, unknown>): Promise<unknown>;
  onOpenCompanion(companionId: string): void;
}) {
  const combatants = combatState?.combatants || [];
  const active = Boolean(combatState?.active && combatants.length);
  const livingCombatants = combatants.filter(isLivingCombatant);
  const rawCurrent = combatants.find((entry) => entry.isCurrentTurn) || null;
  const current = rawCurrent && isLivingCombatant(rawCurrent) ? rawCurrent : livingCombatants[0] || null;
  const next = getNextCombatant(combatants, current);
  const ownership = getCombatOwnership(character, combatants);
  const ownEntries = ownership.ownEntries;
  const activeForm = ownership.activeFormEntry
    ? ownership.forms.find((entry) => entry.id === ownership.activeFormEntry?.sourceCompanionId) || null
    : null;
  const sharedStatus = normalizeCombatStatus(
    ownership.activeFormEntry?.status || ownership.selfEntry?.status || character.resources.status,
    'Vivo'
  );
  const canSwapForms = sharedStatus === 'Vivo';
  const sharedInitiative = ownership.selfEntry
    ? Number(ownership.selfEntry.initiativeTotal || 0)
    : (ownership.activeFormEntry ? Number(ownership.activeFormEntry.initiativeTotal || 0) : 0);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [initiativeDraft, setInitiativeDraft] = useState(String(sharedInitiative));
  const [supportDrafts, setSupportDrafts] = useState<Record<string, { inEncounter: boolean; initiativeTotal: string }>>({});
  const [combatMessage, setCombatMessage] = useState('');
  const [omnivitaVisualState, setOmnivitaVisualState] = useState<OmnivitaVisualState>('ready');
  const omnivitaDischargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formIdsSignature = ownership.forms.map((entry) => entry.id).join('|');
  const supportSignature = ownership.supportRows
    .map(({ companion, activeEntry }) => `${companion.id}:${activeEntry ? '1' : '0'}:${Number(activeEntry?.initiativeTotal || 0)}`)
    .join('|');
  const selectedForm = ownership.forms.find((entry) => entry.id === selectedFormId)
    || ownership.forms.find((entry) => entry.id === ownership.activeFormEntry?.sourceCompanionId)
    || ownership.forms[0]
    || null;
  const selectedFormActiveEntry = selectedForm
    ? ownership.companionEntries.find((entry) => entry.sourceCompanionId === selectedForm.id) || null
    : null;
  const representedEntry = ownership.activeFormEntry || ownership.selfEntry || ownEntries[0] || null;
  const isOwnTurn = Boolean(current && ownEntries.some((entry) => entry.instanceId === current.instanceId));
  const roundBadge = !active ? 'Sem combate' : !ownEntries.length ? 'Combate oculto' : isOwnTurn ? 'Sua vez' : `Rodada ${Math.max(1, Number(combatState?.round || 1))}`;
  const actorName = activeForm ? (activeForm.name || 'Forma') : character.identity.name;
  const actorImage = activeForm ? (activeForm.image || ownership.activeFormEntry?.image || '') : (character.identity.image || '');
  const actorSubtitle = activeForm ? `Transformado | ${character.identity.name}` : `${character.identity.className} | Nivel ${character.identity.level}`;
  const currentTurnImage = current?.image || (isOwnTurn ? actorImage : '');
  const currentTurnName = current?.name || actorName;
  const currentTurnSubtitle = current?.subtitle || actorSubtitle;
  const currentTurnStatus = current ? normalizeCombatStatus(current.status, 'Vivo') : sharedStatus;
  const controlDisabled = !onCombatControl || combatControlPending;
  const syncLabel = combatControlPending ? 'Sincronizando acao...' : getCombatSyncLabel(combatState?.updatedAt);
  const useOmnivitaUi = ownership.forms.length > 0 && usesOmnivitaCombatUi(character);
  const sharedStatusClass = getCombatStatusVisualClass({
    status: sharedStatus,
    pvCurrent: activeForm && ownership.activeFormEntry ? ownership.activeFormEntry.pvCurrent : character.resources.pvCurrent
  });

  useEffect(() => () => {
    if (omnivitaDischargeTimerRef.current) clearTimeout(omnivitaDischargeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!ownership.forms.length) {
      if (selectedFormId) setSelectedFormId('');
      return;
    }

    if (!selectedFormId || !ownership.forms.some((entry) => entry.id === selectedFormId)) {
      setSelectedFormId(ownership.activeFormEntry?.sourceCompanionId || ownership.forms[0].id);
    }
  }, [formIdsSignature, ownership.activeFormEntry?.sourceCompanionId, ownership.forms, selectedFormId]);

  useEffect(() => {
    setInitiativeDraft(String(sharedInitiative));
    setSupportDrafts(Object.fromEntries(ownership.supportRows.map(({ companion, activeEntry }) => [
      companion.id,
      {
        inEncounter: Boolean(activeEntry),
        initiativeTotal: activeEntry ? String(Number(activeEntry.initiativeTotal || 0)) : ''
      }
    ])));
  }, [combatState?.updatedAt, sharedInitiative, supportSignature]);

  function makeBaseSelf(inEncounter: boolean | null = null) {
    return {
      inEncounter,
      initiativeTotal: parseOptionalNumber(initiativeDraft),
      pvCurrent: Number(character.resources.pvCurrent || 0)
    };
  }

  function makeSupportControls() {
    return ownership.supportRows.map(({ companion }) => {
      const draft = supportDrafts[companion.id] || { inEncounter: false, initiativeTotal: '' };
      return {
        companionId: companion.id,
        inEncounter: draft.inEncounter,
        pvCurrent: Number(companion.pvCurrent || 0),
        initiativeTotal: parseOptionalNumber(draft.initiativeTotal)
      };
    });
  }

  async function submitControl(control: Record<string, unknown>, successMessage: string) {
    if (!onCombatControl) return;
    setCombatMessage('Sincronizando acao...');
    try {
      await onCombatControl(control);
      setCombatMessage(successMessage);
    } catch (error) {
      setCombatMessage(error instanceof Error ? error.message : 'Falha ao sincronizar combate.');
    }
  }

  function buildControl(extra: { self?: Record<string, unknown> | null; companions?: Array<Record<string, unknown>> }) {
    return {
      requestId: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: new Date().toISOString(),
      self: extra.self === undefined ? makeBaseSelf(null) : extra.self,
      companions: extra.companions || []
    };
  }

  function sendPanelControl() {
    const control = buildControl({
      self: makeBaseSelf(null),
      companions: makeSupportControls()
    });
    void submitControl(control, 'Controle de combate enviado.');
  }

  async function toggleSelectedForm(nextActive: boolean) {
    if (!selectedFormId) return;
    const formControls = ownership.forms.map((entry) => ({
      companionId: entry.id,
      inEncounter: entry.id === selectedFormId ? nextActive : false,
      pvCurrent: Number(entry.pvCurrent || 0),
      initiativeTotal: null
    }));
    const control = buildControl({
      self: makeBaseSelf(null),
      companions: [...formControls, ...makeSupportControls()]
    });
    await submitControl(control, nextActive ? 'Forma preparada para assumir a cena.' : 'Retorno ao personagem enviado.');
  }

  function stepOmnivitaSelection(direction: number) {
    if (omnivitaVisualState !== 'ready' || activeForm) return;
    if (!ownership.forms.length) return;
    const currentIndex = Math.max(0, ownership.forms.findIndex((entry) => entry.id === selectedFormId));
    const nextIndex = (currentIndex + direction + ownership.forms.length) % ownership.forms.length;
    setSelectedFormId(ownership.forms[nextIndex]?.id || '');
  }

  function rechargeOmnivita() {
    if (omnivitaVisualState !== 'cooldown') return;
    setOmnivitaVisualState('ready');
    setCombatMessage('OmniVita recarregado.');
  }

  function beginOmnivitaDischarge() {
    if (omnivitaVisualState !== 'ready' || omnivitaDischargeTimerRef.current) return;
    setOmnivitaVisualState('discharging');
    setCombatMessage('OmniVita descarregando...');
    omnivitaDischargeTimerRef.current = setTimeout(() => {
      omnivitaDischargeTimerRef.current = null;
      void toggleSelectedForm(false).finally(() => {
        setOmnivitaVisualState('cooldown');
        setCombatMessage('OmniVita descarregado.');
      });
    }, 2400);
  }

  function handleOmnivitaMainAction() {
    if (!selectedFormId) return;
    if (omnivitaVisualState === 'discharging') return;
    if (omnivitaVisualState === 'cooldown') {
      rechargeOmnivita();
      return;
    }
    if (ownership.activeFormEntry) {
      beginOmnivitaDischarge();
      return;
    }
    if (!canSwapForms) {
      setCombatMessage(`Nao da para transformar enquanto estiver ${sharedStatus}.`);
      return;
    }
    void toggleSelectedForm(true);
  }

  function requestCombatExit() {
    const control = buildControl({
      self: {
        inEncounter: false,
        initiativeTotal: parseOptionalNumber(initiativeDraft)
      },
      companions: ownership.forms.map((entry) => ({
        companionId: entry.id,
        inEncounter: false,
        initiativeTotal: null
      }))
    });
    void submitControl(control, 'Saida da cena enviada.');
  }

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="Combate"
        title="HUD de turno"
        actions={(
          <>
            <Badge>{roundBadge}</Badge>
            <Badge>{syncLabel}</Badge>
          </>
        )}
      >
        Ordem, turno atual e controle em cena.
      </SectionHeading>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {!active ? (
          <article className="rounded-lg border border-line bg-white/5 p-4">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Combate</span>
            <strong className="mt-2 block text-2xl">Inativo</strong>
            <p className="mt-2 text-sm text-textMuted">Nenhum encontro ativo no momento.</p>
          </article>
        ) : !ownEntries.length ? (
          <>
            <article className="rounded-lg border border-line bg-white/5 p-4">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Combate</span>
              <strong className="mt-2 block text-2xl">Fora da cena</strong>
              <p className="mt-2 text-sm text-textMuted">Voce nao participa deste combate no momento.</p>
            </article>
            <article className="rounded-lg border border-line bg-white/5 p-4">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Sincronizacao</span>
              <strong className="mt-2 block text-2xl">{syncLabel}</strong>
              <p className="mt-2 text-sm text-textMuted">A cena existe, mas voce nao esta representado nela agora.</p>
            </article>
          </>
        ) : (
          <article className={clsx('combat-turn-hero md:col-span-2 xl:col-span-3', isOwnTurn ? 'is-your-turn' : 'is-waiting', sharedStatusClass)}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{isOwnTurn ? 'Sua vez' : 'Aguardando'}</span>
                <h3 className="mt-2 text-3xl font-black leading-tight">{current ? `${current.name} esta agindo agora` : 'O mestre ainda nao definiu o turno atual'}</h3>
                <p className="mt-2 text-sm text-textMuted">{next ? `Proximo: ${next.name}` : `Rodada ${Math.max(1, Number(combatState?.round || 1))}`}</p>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar image={currentTurnImage} name={currentTurnName} className="h-20 w-20 rounded-lg border-vita/25" />
                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{isOwnTurn ? 'Voce no turno' : 'Ator atual'}</span>
                  <strong className="mt-1 block truncate text-lg">{currentTurnName}</strong>
                  <p className="text-sm text-textMuted">{currentTurnSubtitle} | {currentTurnStatus}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{activeForm ? 'Transformado' : ownership.selfEntry ? 'Em cena' : 'Representado'}</Badge>
              <Badge>{sharedStatus}</Badge>
              <Badge>Inic {sharedInitiative}</Badge>
              <Badge>Rodada {Math.max(1, Number(combatState?.round || 1))}</Badge>
            </div>
          </article>
        )}
      </div>

      {active && ownEntries.length ? (
        <div className="combat-initiative-rail mt-4" aria-label="Trilho de iniciativa">
          {combatants.map((entry) => {
            const statusClass = getCombatStatusVisualClass(entry);
            const isCurrentEntry = current?.instanceId === entry.instanceId && isLivingCombatant(entry);
            const isNextEntry = next?.instanceId === entry.instanceId && !isCurrentEntry;
            const representsYou = representedEntry?.instanceId === entry.instanceId;
            return (
              <span
                className={clsx(
                  'combat-initiative-pill',
                  statusClass,
                  isCurrentEntry && 'is-current',
                  isNextEntry && 'is-next',
                  statusClass === 'is-alive' && !isCurrentEntry && !isNextEntry && 'border-vita/15 bg-white/[0.025] shadow-none',
                  isCurrentEntry && 'border-emerald-400/70 bg-emerald-400/15 text-emerald-50 shadow-[0_14px_34px_rgba(74,222,128,0.16)]',
                  isNextEntry && 'border-blue-400/70 bg-blue-400/15 text-blue-50 shadow-[0_14px_34px_rgba(96,165,250,0.16)]',
                  representsYou && 'is-you'
                )}
                key={`rail-${entry.instanceId}`}
              >
                <span className="truncate">{entry.name || 'Combatente'}</span>
                <small>{Number(entry.initiativeTotal || 0)}</small>
              </span>
            );
          })}
        </div>
      ) : null}

      {active && ownEntries.length ? (
        <div className="mt-4 grid gap-3">
          <div className={ownership.forms.length ? 'grid gap-3 xl:grid-cols-2' : 'grid gap-3'}>
            <article className="rounded-lg border border-line bg-white/5 p-4 transition hover:border-vita/30 hover:bg-white/[0.07]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar image={actorImage} name={actorName} className="h-16 w-16 rounded-lg border-vita/20" />
                  <div className="min-w-0">
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{activeForm ? 'Transformado' : 'Voce'}</span>
                    <strong className="block truncate">{actorName}</strong>
                    <p className="text-sm text-textMuted">{actorSubtitle}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeForm ? <Button type="button" onClick={() => onOpenCompanion(activeForm.id)}>Abrir ficha</Button> : null}
                  {ownership.forms.length ? <Button type="button" onClick={() => selectedForm ? onOpenCompanion(selectedForm.id) : undefined}>Trocar forma</Button> : null}
                  {(ownership.selfEntry || ownership.activeFormEntry) ? (
                    <Button tone="danger" type="button" disabled={controlDisabled} onClick={requestCombatExit}>Sair da cena</Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {activeForm && ownership.activeFormEntry ? (
                  <ResourceMeter label="PV da forma" current={ownership.activeFormEntry.pvCurrent} max={ownership.activeFormEntry.pvMax || activeForm.pvMax || 1} />
                ) : (
                  <>
                    <ResourceMeter label="PV atual" current={character.resources.pvCurrent} max={derived.maxPv} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <ResourceMeter label="PE" current={character.resources.peCurrent} max={derived.maxPe} tone="warn" />
                      <ResourceMeter label="PD" current={character.resources.pdCurrent} max={derived.maxPd} tone="danger" />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge>{sharedStatus}</Badge>
                <Badge>{activeForm ? 'Transformado' : ownership.selfEntry ? 'Em cena' : 'Aguardando'}</Badge>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                <NumberInput
                  label="Iniciativa compartilhada"
                  value={Number(initiativeDraft || 0)}
                  min={-99}
                  max={999}
                  onChange={(value) => setInitiativeDraft(String(value))}
                />
                <div className="rounded-lg border border-line bg-black/20 p-3">
                  <strong>{activeForm ? 'Forma ativa na ordem' : 'Iniciativa do seu turno'}</strong>
                  <p className="mt-1 text-sm text-textMuted">Personagem e formas compartilham essa iniciativa na cena.</p>
                </div>
              </div>
            </article>

            {ownership.forms.length ? (
              useOmnivitaUi ? (
                <OmnivitaCombatFormsCard
                  activeEntry={ownership.activeFormEntry}
                  activeForm={activeForm}
                  canSwapForms={canSwapForms}
                  controlDisabled={controlDisabled}
                  forms={ownership.forms}
                  onMainAction={handleOmnivitaMainAction}
                  onOpenCompanion={onOpenCompanion}
                  onSelectForm={setSelectedFormId}
                  onStep={stepOmnivitaSelection}
                  selectedForm={selectedForm}
                  selectedFormActiveEntry={selectedFormActiveEntry}
                  sharedStatus={sharedStatus}
                  visualState={omnivitaVisualState}
                />
              ) : (
                <article className="rounded-lg border border-line bg-white/5 p-4 transition hover:border-vita/30 hover:bg-white/[0.07]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{activeForm ? 'Controle da transformacao' : 'Formas'}</span>
                    <strong className="mt-1 block">{activeForm ? (activeForm.name || 'Forma ativa') : (selectedForm?.name || 'Forma')}</strong>
                    <p className="mt-1 text-sm text-textMuted">
                      {activeForm ? 'Forma ativa no combate.' : 'Selecione uma forma.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedForm ? <Button type="button" onClick={() => onOpenCompanion(selectedForm.id)}>Abrir ficha</Button> : null}
                    {activeForm ? (
                      <Button type="button" disabled={controlDisabled || !canSwapForms} onClick={() => void toggleSelectedForm(false)}>Voltar ao personagem</Button>
                    ) : (
                      <Button tone="primary" type="button" disabled={controlDisabled || !canSwapForms || !selectedForm} onClick={() => void toggleSelectedForm(true)}>Usar esta forma</Button>
                    )}
                  </div>
                </div>

                <label className="mt-4 grid gap-2">
                  <span className="text-sm font-semibold text-textMuted">Forma selecionada</span>
                  <select className={fieldClass} value={selectedForm?.id || ''} onChange={(event) => setSelectedFormId(event.target.value)}>
                    {ownership.forms.map((entry) => (
                      <option key={entry.id} value={entry.id}>{entry.name || 'Forma'}</option>
                    ))}
                  </select>
                </label>

                {selectedForm ? (
                  <div className="mt-4 grid gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar image={selectedForm.image || ''} name={selectedForm.name || 'Forma'} className="h-14 w-14 rounded-lg" />
                      <div className="min-w-0">
                        <strong className="block truncate">{selectedForm.name || 'Forma'}</strong>
                        <p className="text-sm text-textMuted">
                          {selectedFormActiveEntry ? 'Ativa na ordem.' : 'Disponivel.'}
                        </p>
                      </div>
                    </div>
                    <ResourceMeter label="PV da forma" current={selectedFormActiveEntry?.pvCurrent ?? selectedForm.pvCurrent} max={selectedFormActiveEntry?.pvMax || selectedForm.pvMax || 1} />
                    <div className="flex flex-wrap gap-2">
                      <Badge>{selectedFormActiveEntry ? 'Transformado' : 'Disponivel'}</Badge>
                      <Badge>PV {selectedFormActiveEntry?.pvCurrent ?? selectedForm.pvCurrent}/{selectedFormActiveEntry?.pvMax || selectedForm.pvMax}</Badge>
                      {getCombatAttributeTags(selectedForm.attributes).map((attribute) => (
                        <Badge key={attribute.key}>{attribute.label} {attribute.value}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {canSwapForms ? null : <p className="mt-3 text-sm text-textMuted">Troca bloqueada enquanto estiver {sharedStatus}.</p>}
                </article>
              )
            ) : null}
          </div>

          {ownership.supportRows.length ? (
            <article className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong>Outras mini-fichas</strong>
                  <p className="mt-1 text-sm text-textMuted">Ajudantes e entidades que nao substituem voce no combate.</p>
                </div>
                <Button type="button" disabled={controlDisabled} onClick={sendPanelControl}>Enviar controle</Button>
              </div>
              <div className="mt-4 grid gap-3">
                {ownership.supportRows.map(({ companion, activeEntry }) => {
                  const draft = supportDrafts[companion.id] || { inEncounter: Boolean(activeEntry), initiativeTotal: activeEntry ? String(activeEntry.initiativeTotal || 0) : '' };
                  return (
                    <article className="rounded-lg border border-line bg-black/20 p-3" key={companion.id}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <strong>{companion.name || 'Mini-ficha'}</strong>
                          <p className="text-sm text-textMuted">{companion.type || 'Mini-ficha'}</p>
                        </div>
                        <label className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-line bg-white/5 px-3 text-sm font-bold">
                          <input
                            checked={draft.inEncounter}
                            type="checkbox"
                            onChange={(event) => setSupportDrafts((current) => ({
                              ...current,
                              [companion.id]: { ...draft, inEncounter: event.target.checked }
                            }))}
                          />
                          <span>Em cena</span>
                        </label>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                        <NumberInput
                          label="Iniciativa"
                          value={Number(draft.initiativeTotal || 0)}
                          min={-99}
                          max={999}
                          onChange={(value) => setSupportDrafts((current) => ({
                            ...current,
                            [companion.id]: { ...draft, initiativeTotal: String(value) }
                          }))}
                        />
                        <div className="rounded-lg border border-line bg-white/5 p-3">
                          <strong>Status</strong>
                          <p className="mt-1 text-sm text-textMuted">{normalizeCombatStatus(activeEntry ? activeEntry.status : companion.status, 'Vivo')}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          ) : (
            <div className="flex justify-end">
              <Button type="button" disabled={controlDisabled} onClick={sendPanelControl}>Enviar controle</Button>
            </div>
          )}

          {combatMessage || combatControlPending ? (
            <p className="rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-textMuted">{combatControlPending ? 'Sincronizando acao...' : combatMessage}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">Ordem de iniciativa</span>
            <h3 className="mt-1 text-lg font-black">Cena atual</h3>
          </div>
        </div>
        {!active ? (
          <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum combate ativo no momento.</p>
        ) : !ownEntries.length ? (
          <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Voce nao participa deste combate no momento.</p>
        ) : combatants.map((entry) => {
          const statusLabel = normalizeCombatStatus(entry.status, 'Vivo');
          const isOwnCharacter = entry.combatantType === 'character' && entry.sourceCharacterId === character.id;
          const isOwnCompanion = entry.combatantType === 'companion' && entry.sourceCharacterId === character.id;
          const representsYou = representedEntry?.instanceId === entry.instanceId;
          const localCompanion = isOwnCompanion ? character.companions.find((companion) => companion.id === entry.sourceCompanionId) : null;
          const isCurrentEntry = current?.instanceId === entry.instanceId && isLivingCombatant(entry);
          const isNextEntry = next?.instanceId === entry.instanceId && !isCurrentEntry;
          const statusClass = getCombatStatusVisualClass(entry);
          return (
            <article className={clsx(
              'combat-state-card',
              statusClass,
              isCurrentEntry && 'is-current',
              isNextEntry && 'is-next',
              statusClass === 'is-alive' && !isCurrentEntry && !isNextEntry && 'border-vita/15 bg-white/[0.025] shadow-none',
              isCurrentEntry && 'border-emerald-400/70 bg-emerald-400/15 shadow-[0_20px_54px_rgba(74,222,128,0.16)]',
              isNextEntry && 'border-blue-400/70 bg-blue-400/15 shadow-[0_18px_46px_rgba(96,165,250,0.14)]',
              representsYou && 'is-you'
            )} key={entry.instanceId}>
              <div className="combat-card-content flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar image={entry.image || localCompanion?.image || ''} name={entry.name || 'Combatente'} className="h-12 w-12 rounded-lg border-vita/20" />
                  <div className="min-w-0">
                    <strong className="block truncate">#{Number(entry.order || 0)} {entry.name || 'Combatente'}</strong>
                    <p className="text-sm text-textMuted">{entry.subtitle || 'Sem detalhe'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={getCombatStatusBadgeTone(statusLabel)}>{statusLabel}</Badge>
                  {isOwnCharacter ? <Badge>Voce</Badge> : null}
                  {isOwnCompanion && !isCompanionForm(localCompanion || entry) ? <Badge>Sua mini-ficha</Badge> : null}
                  {representsYou && isCompanionForm(localCompanion || entry) ? <Badge>Transformado</Badge> : null}
                  {isCurrentEntry ? <span className="combat-turn-badge is-current">Vez atual</span> : null}
                  {isNextEntry ? <span className="combat-turn-badge is-next">Proximo</span> : null}
                  {statusClass === 'is-dead' ? <Badge tone="danger">Pulando na ordem</Badge> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

type OmnivitaVisualState = 'ready' | 'discharging' | 'cooldown';

function OmnivitaCombatFormsCard({
  activeEntry,
  activeForm,
  canSwapForms,
  controlDisabled,
  forms,
  onMainAction,
  onOpenCompanion,
  onSelectForm,
  onStep,
  selectedForm,
  selectedFormActiveEntry,
  sharedStatus,
  visualState
}: {
  activeEntry: Combatant | null;
  activeForm: CompanionSheet | null;
  canSwapForms: boolean;
  controlDisabled: boolean;
  forms: CompanionSheet[];
  onMainAction(): void;
  onOpenCompanion(companionId: string): void;
  onSelectForm(companionId: string): void;
  onStep(direction: number): void;
  selectedForm: CompanionSheet | null;
  selectedFormActiveEntry: Combatant | null;
  sharedStatus: string;
  visualState: OmnivitaVisualState;
}) {
  const selectorRef = useRef<OmniVitaCoreSelectorHandle | null>(null);
  const activeFormId = String(activeEntry?.sourceCompanionId || '');
  const hasActiveForm = Boolean(activeFormId);
  const displayForm = activeFormId && activeForm ? activeForm : selectedForm || forms[0] || null;
  const selectedIndex = Math.max(0, forms.findIndex((entry) => entry.id === displayForm?.id));
  const selectedIsActive = Boolean(activeFormId && displayForm?.id === activeFormId);
  const isDischarging = visualState === 'discharging';
  const isCooldown = visualState === 'cooldown' && !activeFormId;
  const canBrowseForms = canSwapForms && !activeFormId && !isDischarging && !isCooldown && !controlDisabled;
  const activePvCurrent = Number(activeEntry?.pvCurrent ?? activeForm?.pvCurrent ?? 0);
  const activePvMax = Number(activeEntry?.pvMax ?? activeForm?.pvMax ?? 0);
  const selectedPvCurrent = Number(selectedFormActiveEntry?.pvCurrent ?? displayForm?.pvCurrent ?? 0);
  const selectedPvMax = Number(selectedFormActiveEntry?.pvMax ?? displayForm?.pvMax ?? 0);
  const selectorForms: OmniVitaSelectorForm[] = forms.map((entry) => ({
    id: entry.id,
    name: entry.name || 'Forma',
    image: getOmnivitaSilhouetteImage(entry),
    bg: ''
  }));
  const mainActionLabel = isCooldown
    ? 'Recarregar'
    : isDischarging
      ? 'Descarregando'
      : hasActiveForm
        ? 'Descarregar'
        : 'Transformar';
  const mainActionDisabled = controlDisabled || isDischarging || (!hasActiveForm && !isCooldown && !canSwapForms);
  const statusLabel = isCooldown
      ? 'Descarregado'
      : isDischarging
        ? 'Descarregando'
        : hasActiveForm
          ? `${activeForm?.name || 'Forma'} ativo`
          : !canSwapForms
            ? `Bloqueado: ${sharedStatus}`
            : `${displayForm?.name || 'Forma'} selecionado`;

  function stepSelection(direction: -1 | 1) {
    if (!selectorRef.current?.step(direction)) onStep(direction);
  }

  return (
    <article
      className={[
        'player-omnivita-combat-card',
        activeFormId ? 'is-transformed' : '',
        isDischarging ? 'is-discharging' : '',
        isCooldown ? 'is-cooldown' : '',
        canSwapForms ? '' : 'is-disabled'
      ].filter(Boolean).join(' ')}
      data-active={activeFormId ? 'true' : 'false'}
    >
      <div className="omnivita-combat-head">
        <div>
          <strong>OmniVita</strong>
          <p>{statusLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayForm ? <Button type="button" onClick={() => onOpenCompanion(displayForm.id)}>Abrir ficha</Button> : null}
        </div>
      </div>

      <div className="omnivita-combat-stage" aria-label="Controle visual de transformacao do Cael">
        <button
          className="omnivita-combat-device"
          type="button"
          disabled={mainActionDisabled}
          onClick={onMainAction}
          aria-label={mainActionLabel}
        >
          <span className="omnivita-combat-cylinder">
            <span className="omnivita-combat-cap top" />
            <span className="omnivita-combat-cap bottom" />
            <span className="omnivita-combat-core" />
          </span>
        </button>

        <OmniVitaCoreSelector
          ref={selectorRef}
          forms={selectorForms}
          selectedIndex={selectedIndex}
          status={isCooldown ? 'cooldown' : isDischarging ? 'discharging' : activeFormId ? 'transformed' : 'open'}
          actionLabel={mainActionLabel}
          disabled={controlDisabled || isDischarging}
          locked={Boolean(activeFormId) || isCooldown || !canSwapForms}
          onActivate={onMainAction}
          onSelectIndex={(index) => {
            const nextForm = forms[index];
            if (nextForm) onSelectForm(nextForm.id);
          }}
        />
      </div>

      <div className="omnivita-combat-controls">
        <Button type="button" disabled={!canBrowseForms} onClick={() => stepSelection(-1)}>Subir</Button>
        <Button tone="primary" type="button" disabled={mainActionDisabled} onClick={onMainAction}>{mainActionLabel}</Button>
        <Button type="button" disabled={!canBrowseForms} onClick={() => stepSelection(1)}>Descer</Button>
      </div>

      <div className="omnivita-combat-footer">
        <Badge tone={activeFormId ? 'accent' : 'neutral'}>{isCooldown ? 'Sem carga' : activeFormId ? 'Transformado' : 'Em espera'}</Badge>
        <Badge>PV {activeFormId && selectedIsActive ? `${activePvCurrent}/${activePvMax}` : `${selectedPvCurrent}/${selectedPvMax}`}</Badge>
        {displayForm ? <Badge>{displayForm.name || 'Forma'}</Badge> : null}
      </div>
      {canSwapForms ? null : <p className="mt-3 text-sm text-textMuted">Nao da para transformar enquanto estiver {sharedStatus}.</p>}
    </article>
  );
}

function OmnivitaSandboxPanel({
  character,
  onOpenCompanion,
  onApplyOmnivitaCharacter
}: {
  character: CharacterSheet;
  onOpenCompanion(companionId: string): void;
  onApplyOmnivitaCharacter(nextCharacter: CharacterSheet): void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const selectorRef = useRef<OmniVitaCoreSelectorHandle | null>(null);
  const dischargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unlockRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const masterScanRef = useRef(false);
  const allForms = useMemo(
    () => character.companions.filter(isCompanionForm),
    [character.companions]
  );
  const masterControlUnlocked = Boolean(
    ((character.manifestation || {}) as Record<string, unknown>).omnivitaMasterControlUnlocked
  );
  const availableForms = useMemo(
    () => allForms.filter((entry) => masterControlUnlocked || isCompanionVisibleToPlayer(entry)),
    [allForms, masterControlUnlocked]
  );
  const [selectedFormId, setSelectedFormId] = useState('');
  const [activeFormId, setActiveFormId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [visualState, setVisualState] = useState<OmnivitaVisualState>('ready');
  const [, setInputTrail] = useState<OmnivitaSecretDirection[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isMasterScanActive, setIsMasterScanActive] = useState(false);
  const [pendingUnlockFormId, setPendingUnlockFormId] = useState('');
  const [isUnlockRevealActive, setIsUnlockRevealActive] = useState(false);
  const selectedForm = availableForms.find((entry) => entry.id === selectedFormId) || availableForms[0] || null;
  const activeForm = availableForms.find((entry) => entry.id === activeFormId)
    || allForms.find((entry) => entry.id === activeFormId)
    || null;
  const displayForm = activeForm || selectedForm;
  const selectedIndex = Math.max(0, availableForms.findIndex((entry) => entry.id === displayForm?.id));
  const selectorForms: OmniVitaSelectorForm[] = availableForms.map((entry) => ({
    id: entry.id,
    name: entry.name || 'Forma',
    image: getOmnivitaSilhouetteImage(entry),
    bg: ''
  }));
  const selectorStatus = visualState === 'cooldown'
    ? 'cooldown'
    : visualState === 'discharging'
      ? 'discharging'
      : activeFormId
        ? 'transformed'
        : isOpen
          ? 'open'
          : 'closed';
  const mainActionLabel = visualState === 'cooldown'
    ? 'Recarregar'
    : visualState === 'discharging'
      ? 'Descarregando'
      : activeFormId
        ? masterControlUnlocked ? 'Recolher' : 'Descarregar'
        : isOpen
          ? 'Transformar'
          : 'Abrir';

  useEffect(() => () => {
    if (dischargeTimerRef.current) clearTimeout(dischargeTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (unlockRevealTimerRef.current) clearTimeout(unlockRevealTimerRef.current);
    masterScanRef.current = false;
  }, []);

  useEffect(() => {
    if (!availableForms.length) {
      if (selectedFormId) setSelectedFormId('');
      if (pendingUnlockFormId) setPendingUnlockFormId('');
      return;
    }

    if (!selectedFormId || !availableForms.some((entry) => entry.id === selectedFormId)) {
      setSelectedFormId(availableForms[0].id);
    }
  }, [availableForms, selectedFormId]);

  useEffect(() => {
    if (!pendingUnlockFormId) return;
    if (!availableForms.some((entry) => entry.id === pendingUnlockFormId)) return;

    if (unlockRevealTimerRef.current) {
      clearTimeout(unlockRevealTimerRef.current);
      unlockRevealTimerRef.current = null;
    }

    setSelectedFormId(pendingUnlockFormId);
    setIsOpen(true);
    setIsUnlockRevealActive(true);
    unlockRevealTimerRef.current = setTimeout(() => {
      unlockRevealTimerRef.current = null;
      setIsUnlockRevealActive(false);
    }, prefersReducedMotion ? 260 : 920);
    setPendingUnlockFormId('');
  }, [availableForms, pendingUnlockFormId, prefersReducedMotion]);

  useEffect(() => {
    if (activeFormId && !allForms.some((entry) => entry.id === activeFormId)) {
      setActiveFormId('');
    }
  }, [activeFormId, allForms]);

  useEffect(() => {
    if (visualState === 'cooldown' && masterControlUnlocked) {
      setVisualState('ready');
    }
  }, [masterControlUnlocked, visualState]);

  function sleep(ms: number) {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function clearDischargeTimer() {
    if (dischargeTimerRef.current) {
      clearTimeout(dischargeTimerRef.current);
      dischargeTimerRef.current = null;
    }
  }

  function showFeedback(nextFeedback: string, duration = 2400) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    setFeedback(nextFeedback);
    if (!nextFeedback) return;
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      setFeedback('');
    }, duration);
  }

  async function activateMasterControl(nextCharacter: CharacterSheet, message: string) {
    if (masterScanRef.current) return;

    masterScanRef.current = true;
    setIsMasterScanActive(true);
    clearDischargeTimer();
    setVisualState('ready');
    setIsOpen(true);
    setInputTrail([]);
    const nextForms = nextCharacter.companions.filter(isCompanionForm);
    onApplyOmnivitaCharacter(nextCharacter);

    if (nextForms.length && !selectedFormId) {
      setSelectedFormId(nextForms[0].id);
    }

    showFeedback(message);

    try {
      await sleep(90);
      if (nextForms.length > 1) {
        const steps = nextForms.length * OMNIVITA_MASTER_SCAN_LOOPS;
        const waitMs = getOmnivitaStepDuration(OMNIVITA_MASTER_SCAN_SPEED_MULTIPLIER, Boolean(prefersReducedMotion)) + 30;
        for (let index = 0; index < steps; index += 1) {
          selectorRef.current?.step(1, {
            force: true,
            speedMultiplier: OMNIVITA_MASTER_SCAN_SPEED_MULTIPLIER
          });
          await sleep(waitMs);
        }
      }
    } finally {
      masterScanRef.current = false;
      setIsMasterScanActive(false);
    }
  }

  async function evaluateTrail(nextTrail: OmnivitaSecretDirection[]) {
    try {
      const result = await api.evaluateOmnivitaCode(nextTrail);
      if (!result?.matched || !result.action) return;
      const nextCharacter = result.character ? hydrateCharacter(result.character) : null;

      if (result.action === 'master-control') {
        if (nextCharacter) {
          await activateMasterControl(nextCharacter, result.message || 'Controle mestre liberado.');
        } else if (result.message) {
          showFeedback(result.message);
        }
        return;
      }

      if (result.action === 'unlock-form') {
        if (nextCharacter) {
          onApplyOmnivitaCharacter(nextCharacter);
        }
        if (result.targetCompanionId) {
          setPendingUnlockFormId(result.targetCompanionId);
          setIsOpen(true);
        }
        if (result.message) {
          showFeedback(result.message);
        }
      }
    } catch (error) {
      const apiError = error as { status?: number; message?: string } | undefined;
      if (apiError?.status === 401) {
        showFeedback('Sessao expirada. Entre de novo para usar o OmniVita.', 3400);
        return;
      }
      showFeedback(apiError?.message || 'Nao foi possivel validar o codigo do OmniVita.', 3400);
    }
  }

  function registerDirection(direction: OmnivitaSecretDirection) {
    if (masterScanRef.current) return;
    setInputTrail((current) => {
      const next = [...current, direction].slice(-12);
      void evaluateTrail(next);
      return next;
    });
  }

  function moveSelection(direction: -1 | 1) {
    if (!availableForms.length || availableForms.length < 2 || visualState !== 'ready' || isMasterScanActive) return false;
    if (!masterControlUnlocked && activeFormId) return false;
    const currentIndex = Math.max(0, availableForms.findIndex((entry) => entry.id === selectedFormId));
    const nextIndex = (currentIndex + direction + availableForms.length) % availableForms.length;
    const nextForm = availableForms[nextIndex];
    if (!nextForm) return false;
    setSelectedFormId(nextForm.id);
    if (masterControlUnlocked && activeFormId) {
      setActiveFormId(nextForm.id);
    }
    setIsOpen(true);
    registerDirection(direction === -1 ? 'up' : 'down');
    return true;
  }

  function stepSelection(direction: -1 | 1) {
    if (selectorRef.current?.step(direction)) return;
    moveSelection(direction);
  }

  function transform() {
    if (!displayForm || visualState !== 'ready') return;
    setActiveFormId(displayForm.id);
    setIsOpen(true);
    showFeedback(`${displayForm.name || 'Forma'} travado no nucleo.`);
  }

  function discharge() {
    if (!activeFormId || visualState !== 'ready') return;
    if (masterControlUnlocked) {
      setActiveFormId('');
      setIsOpen(false);
      showFeedback('Nucleo recolhido.');
      return;
    }

    setVisualState('discharging');
    setIsOpen(true);
    showFeedback('Descarga iniciada.', 1800);
    dischargeTimerRef.current = setTimeout(() => {
      dischargeTimerRef.current = null;
      setActiveFormId('');
      setVisualState('cooldown');
      setIsOpen(false);
      showFeedback('OmniVita descarregado.');
    }, 2400);
  }

  function recharge() {
    if (visualState === 'discharging') return;
    setVisualState('ready');
    setIsOpen(false);
    showFeedback('Carga estabilizada.');
  }

  function handleMainAction() {
    if (visualState === 'discharging') return;
    if (visualState === 'cooldown') {
      recharge();
      return;
    }
    if (activeFormId) {
      discharge();
      return;
    }
    if (isOpen) {
      transform();
      return;
    }
    setIsOpen(true);
  }

  return (
    <Card className="overflow-hidden">
      <SectionHeading
        eyebrow="OmniVita"
        title="Nucleo fora de combate"
        actions={(
          <>
            {masterControlUnlocked ? <Badge tone="accent">Controle mestre</Badge> : null}
            <Badge tone={selectorStatus === 'transformed' ? 'accent' : selectorStatus === 'cooldown' ? 'warn' : 'neutral'}>
              {selectorStatus === 'closed' ? 'Fechado' : selectorStatus === 'open' ? 'Aberto' : selectorStatus === 'transformed' ? 'Transformado' : selectorStatus === 'discharging' ? 'Descarregando' : 'Sem carga'}
            </Badge>
          </>
        )}
      >
        Painel livre do OmniVita do Cael.
      </SectionHeading>

      <div className="mt-4 grid gap-4">
        <article
          className={[
            'player-omnivita-combat-card',
            activeFormId ? 'is-transformed' : '',
            visualState === 'discharging' ? 'is-discharging' : '',
            visualState === 'cooldown' ? 'is-cooldown' : '',
            isMasterScanActive ? 'pointer-events-none' : ''
          ].filter(Boolean).join(' ')}
        >
          <div className="omnivita-combat-head">
            <div>
              <strong>OmniVita</strong>
              <p>{activeFormId ? `${activeForm?.name || 'Forma'} ativo` : `${displayForm?.name || 'Forma'} selecionado`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayForm ? <Button type="button" onClick={() => onOpenCompanion(displayForm.id)}>Abrir ficha</Button> : null}
            </div>
          </div>

          {availableForms.length ? (
            <>
              <motion.div
                className="omnivita-combat-stage relative overflow-hidden"
                aria-label="Controle livre do OmniVita do Cael"
                animate={isUnlockRevealActive
                  ? {
                      scale: prefersReducedMotion ? 1 : [1, 1.012, 1],
                      boxShadow: prefersReducedMotion
                        ? '0 0 0 rgba(167, 139, 250, 0.28)'
                        : [
                            '0 0 0 rgba(167, 139, 250, 0)',
                            '0 0 28px rgba(167, 139, 250, 0.28), 0 0 62px rgba(139, 92, 246, 0.22)',
                            '0 0 0 rgba(167, 139, 250, 0)'
                          ],
                      filter: prefersReducedMotion
                        ? 'brightness(1.08)'
                        : ['brightness(1)', 'brightness(1.18)', 'brightness(1.03)']
                    }
                  : {
                      scale: 1,
                      boxShadow: '0 0 0 rgba(167, 139, 250, 0)',
                      filter: 'brightness(1)'
                    }}
                transition={{
                  duration: prefersReducedMotion ? 0.22 : 0.88,
                  ease: 'easeOut'
                }}
              >
                <motion.span
                  className="pointer-events-none absolute inset-4 rounded-[32px] border border-violet/35"
                  animate={isUnlockRevealActive
                    ? prefersReducedMotion
                      ? { opacity: [0, 0.42, 0], scale: [0.98, 1.01, 1.02] }
                      : {
                          opacity: [0, 0.85, 0],
                          scale: [0.9, 1.02, 1.08]
                        }
                    : { opacity: 0, scale: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.22 : 0.9,
                    ease: 'easeOut'
                  }}
                />
                <button
                  className="omnivita-combat-device"
                  type="button"
                  disabled={!availableForms.length || visualState === 'discharging' || isMasterScanActive}
                  onClick={handleMainAction}
                  aria-label={mainActionLabel}
                >
                  <span className="omnivita-combat-cylinder">
                    <span className="omnivita-combat-cap top" />
                    <span className="omnivita-combat-cap bottom" />
                    <span className="omnivita-combat-core" />
                  </span>
                </button>

                <OmniVitaCoreSelector
                  ref={selectorRef}
                  forms={selectorForms}
                  selectedIndex={selectedIndex}
                  status={selectorStatus}
                  actionLabel={mainActionLabel}
                  disabled={!availableForms.length || visualState === 'discharging' || isMasterScanActive}
                  locked={isMasterScanActive || (!masterControlUnlocked && (Boolean(activeFormId) || visualState === 'cooldown'))}
                  onActivate={handleMainAction}
                  onStep={(direction) => registerDirection(direction === -1 ? 'up' : 'down')}
                  onSelectIndex={(index) => {
                    const nextForm = availableForms[index];
                    if (!nextForm) return;
                    setSelectedFormId(nextForm.id);
                    if (masterControlUnlocked && activeFormId) {
                      setActiveFormId(nextForm.id);
                    }
                    setIsOpen(true);
                  }}
                />
              </motion.div>

              <div className="omnivita-combat-controls">
                <Button
                  type="button"
                  disabled={availableForms.length < 2 || visualState !== 'ready' || isMasterScanActive || (!masterControlUnlocked && Boolean(activeFormId))}
                  onClick={() => stepSelection(-1)}
                >
                  Subir
                </Button>
                <Button
                  tone="primary"
                  type="button"
                  disabled={!availableForms.length || visualState === 'discharging' || isMasterScanActive}
                  onClick={handleMainAction}
                >
                  {mainActionLabel}
                </Button>
                <Button
                  type="button"
                  disabled={availableForms.length < 2 || visualState !== 'ready' || isMasterScanActive || (!masterControlUnlocked && Boolean(activeFormId))}
                  onClick={() => stepSelection(1)}
                >
                  Descer
                </Button>
              </div>

              <div className="omnivita-combat-footer">
                <Badge tone={activeFormId ? 'accent' : 'neutral'}>
                  {activeFormId ? (masterControlUnlocked ? 'Troca livre' : 'Forma travada') : visualState === 'cooldown' ? 'Sem carga' : 'Livre'}
                </Badge>
                {displayForm ? <Badge>{displayForm.name || 'Forma'}</Badge> : null}
                {displayForm ? <Badge>PV {displayForm.pvCurrent}/{displayForm.pvMax}</Badge> : null}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-white/5 px-4 py-6 text-sm text-textMuted">
              Nenhuma forma publicada no OmniVita ainda.
            </div>
          )}
        </article>

        {feedback ? (
          <motion.p
            className="text-sm font-semibold text-violet"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {feedback}
          </motion.p>
        ) : null}
      </div>
    </Card>
  );
}

const OMNIVITA_SILHOUETTE_ASSETS: Record<string, string> = {
  armoguana: '/legacy/assets/armoguana%20silhueta.png',
  cinetico: '/legacy/assets/cinetico%20silhueta.png',
  desmodus: '/legacy/assets/desmodus%20silhueta.png',
  eciton: '/legacy/assets/eciton%20silhueta.png',
  geck: '/legacy/assets/geck%20silhueta.png',
  gecko: '/legacy/assets/geck%20silhueta.png',
  landslide: '/legacy/assets/landslide%20silhueta.png',
  pelagornis: '/legacy/assets/pelagornis%20silhueta.png',
  sidarta: '/legacy/assets/sidarta%20silhueta.png'
};

function normalizeOmnivitaLookup(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function usesOmnivitaCombatUi(character: CharacterSheet) {
  const equipment = (character.equipment || {}) as Record<string, unknown>;
  const lookup = normalizeOmnivitaLookup([
    character.ownerUsername,
    character.identity?.name,
    character.identity?.manifestationOrigin,
    character.manifestation?.origin,
    character.manifestation?.name,
    equipment.primaryWeapon
  ].join(' '));

  return lookup.includes('cael') || lookup.includes('omnivita');
}

function usesOmnivitaStandaloneUi(character: CharacterSheet) {
  const identityLookup = normalizeOmnivitaLookup([
    character.ownerUsername,
    character.identity?.name
  ].join(' '));

  return usesOmnivitaCombatUi(character) && identityLookup.includes('cael');
}

function getOmnivitaSilhouetteImage(entry: CompanionSheet) {
  const customSilhouette = String(entry.omnivitaSilhouette || '').trim();
  if (customSilhouette) return customSilhouette;
  const lookup = normalizeOmnivitaLookup(`${entry.name || ''} ${entry.id || ''}`);
  const directKey = Object.keys(OMNIVITA_SILHOUETTE_ASSETS).find((key) => lookup.includes(key));
  return directKey ? OMNIVITA_SILHOUETTE_ASSETS[directKey] : (entry.image || '');
}

function getCombatOwnership(character: CharacterSheet, combatants: Combatant[]) {
  const ownEntries = combatants.filter((entry) => entry.sourceCharacterId === character.id);
  const selfEntry = ownEntries.find((entry) => entry.combatantType === 'character') || null;
  const companionEntries = ownEntries.filter((entry) => entry.combatantType === 'companion');
  const visibleCompanions = character.companions.filter(isCompanionVisibleToPlayer);
  const forms = visibleCompanions.filter(isCompanionForm);
  const supportCompanions = visibleCompanions.filter((entry) => !isCompanionForm(entry));
  const activeFormEntry = companionEntries.find((entry) => {
    const companion = visibleCompanions.find((item) => item.id === entry.sourceCompanionId);
    return isCompanionForm(companion || entry);
  }) || null;
  const supportRows = supportCompanions.map((companion) => ({
    companion,
    activeEntry: companionEntries.find((entry) => entry.sourceCompanionId === companion.id) || null
  }));

  return {
    ownEntries,
    selfEntry,
    companionEntries,
    forms,
    supportRows,
    activeFormEntry
  };
}

function isCompanionHidden(entry: Partial<CompanionSheet> | Record<string, unknown> | null | undefined) {
  const record = (entry || {}) as Record<string, unknown>;
  return Boolean(record.isHidden || record.hidden || String(record.visibility || '').toLowerCase() === 'hidden');
}

function isCompanionVisibleToPlayer(entry: Partial<CompanionSheet> | Record<string, unknown> | null | undefined) {
  return !isCompanionHidden(entry);
}

function createPlayerVisibleCharacter(character: CharacterSheet) {
  return hydrateCharacter({
    ...character,
    companions: character.companions.filter(isCompanionVisibleToPlayer)
  });
}

function mergeImportedCompanionsWithHidden(importedCompanions: CompanionSheet[], currentCompanions: CompanionSheet[]) {
  const importedIds = new Set(importedCompanions.map((entry) => String(entry.id || '')));
  const preservedHidden = currentCompanions.filter((entry) => isCompanionHidden(entry) && !importedIds.has(String(entry.id || '')));
  return [...importedCompanions, ...preservedHidden];
}

function getNextCombatant(combatants: Combatant[], currentEntry: Combatant | null) {
  const living = combatants.filter(isLivingCombatant);
  if (!living.length) return null;
  if (!currentEntry || !isLivingCombatant(currentEntry)) return living[0] || null;
  const currentIndex = combatants.findIndex((entry) => entry.instanceId === currentEntry.instanceId);
  if (currentIndex < 0) return living[0] || null;

  for (let offset = 1; offset <= combatants.length; offset += 1) {
    const candidate = combatants[(currentIndex + offset) % combatants.length];
    if (candidate && isLivingCombatant(candidate)) return candidate;
  }

  return null;
}

function isLivingCombatant(entry: Pick<Combatant, 'status'> | null | undefined) {
  if (!entry) return false;
  const status = normalizeCombatStatus(entry.status, 'Vivo');
  return status !== 'Morto';
}

function getCombatStatusVisualClass(entryOrStatus: Pick<Combatant, 'pvCurrent' | 'status'> | { status: unknown; pvCurrent?: unknown } | string | null | undefined) {
  const record = typeof entryOrStatus === 'object' && entryOrStatus !== null ? entryOrStatus as Record<string, unknown> : { status: entryOrStatus };
  const status = normalizeCombatStatus(record.status, 'Vivo');
  if (status === 'Morrendo') return 'is-dying';
  if (status === 'Morto') return 'is-dead';
  return 'is-alive';
}

function getCombatStatusBadgeTone(status: string): 'neutral' | 'good' | 'warn' | 'danger' | 'accent' {
  const normalized = normalizeCombatStatus(status, 'Vivo');
  if (normalized === 'Morto') return 'danger';
  if (normalized === 'Morrendo') return 'warn';
  return 'good';
}

function getCombatAttributeTags(attributes: CompanionSheet['attributes'], limit = 4) {
  return ATTRIBUTES
    .filter((attribute) => Number(attributes?.[attribute.key] || 0) > 0)
    .slice(0, limit)
    .map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      value: Number(attributes?.[attribute.key] || 0)
    }));
}

function parseOptionalNumber(value: string) {
  return value === '' ? null : Number(value || 0);
}

function getCombatSyncLabel(updatedAt: string | undefined) {
  if (!updatedAt) return 'Aguardando sync';
  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp)) return 'Aguardando sync';
  const secondsAgo = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (secondsAgo <= 1) return 'Atualizado agora';
  if (secondsAgo < 60) return `Atualizado ha ${secondsAgo}s`;
  const minutesAgo = Math.max(1, Math.round(secondsAgo / 60));
  return `Atualizado ha ${minutesAgo}min`;
}

function normalizeCombatStatus(value: unknown, fallback = 'Vivo') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) return fallback;
  if (normalized.includes('morto') || normalized.includes('derrotado')) return 'Morto';
  if (normalized.includes('morrendo') || normalized.includes('agonizando')) return 'Morrendo';
  return 'Vivo';
}

function normalizeStatusForPv(currentStatus: unknown, pvCurrent: unknown) {
  const status = normalizeCombatStatus(currentStatus, 'Vivo');
  const pv = Number(pvCurrent || 0);
  if (pv <= 0) return status === 'Morto' ? 'Morto' : 'Morrendo';
  if (status === 'Morrendo') return 'Vivo';
  return status;
}

function isCompanionForm(entry: Partial<CompanionSheet> | Partial<Combatant> | null | undefined) {
  const record = (entry || {}) as Record<string, unknown>;
  const typeLookup = String(record.type || record.typeLabel || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return typeLookup.includes('forma') || typeLookup.includes('alien') || Boolean(record.isForm);
}

function CompanionEditor({
  companion,
  onChange,
  onClose,
  onDelete
}: {
  companion: CompanionSheet;
  onChange(companion: CompanionSheet): void;
  onClose(): void;
  onDelete(): void;
}) {
  function patch(nextPatch: Partial<CompanionSheet>) {
    onChange(normalizeCompanion({ ...companion, ...nextPatch }));
  }

  function patchAttribute(key: string, value: number) {
    patch({ attributes: { ...(companion.attributes || {}), [key]: value } });
  }

  function updateSkill(index: number, key: string, value: string | number) {
    const skills = (companion.skills || []).map((entry, currentIndex) => (
      currentIndex === index ? createCompanionSkillEntry({ ...entry, [key]: value }) : entry
    ));
    patch({ skills });
  }

  function updateFacet(index: number, key: string, value: string | number) {
    const facets = (companion.facets || []).map((entry, currentIndex) => (
      currentIndex === index ? createCompanionFacetEntry({ ...entry, [key]: value }) : entry
    ));
    patch({ facets });
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="max-h-[calc(100vh-24px)] w-[min(1040px,calc(100vw-24px))] overflow-auto rounded-lg border border-line bg-deep p-5 text-textMain shadow-soft">
        <div className="mb-3 flex justify-end">
          <Button type="button" onClick={onClose}>Fechar</Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">Mini-ficha - {companion.name || 'Sem nome'}</h2>
          <Button tone="danger" type="button" onClick={onDelete}>Excluir</Button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <article className="sticky top-3 grid content-start gap-3 self-start rounded-lg border border-line bg-white/5 p-4 text-center">
            <h3 className="font-black">Foto da forma / ajudante</h3>
            <Avatar image={companion.image || ''} name={companion.name || 'Forma'} className="mx-auto h-36 w-36 rounded-lg" />
            <div className="grid gap-1">
              <strong className="text-lg">{companion.name || 'Sem nome'}</strong>
              <span className="text-sm text-textMuted">{companion.type || 'Sem tipo'}</span>
              <small className="text-textMuted">{companion.status || 'Sem status'}</small>
            </div>
            <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold hover:bg-white/10">
              Escolher imagem
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(event) => readImageFile(event, (value) => patch({ image: value }))}
              />
            </label>
            <Button tone="danger" type="button" onClick={() => patch({ image: '' })}>Remover foto</Button>
          </article>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Nome" value={companion.name || ''} onChange={(value) => patch({ name: value })} />
              <TextInput label="Tipo" value={companion.type || ''} onChange={(value) => patch({ type: value })} />
              <SelectInput label="Status" value={companion.status || 'Vivo'} options={STATUS_OPTIONS} onChange={(value) => patch({ status: value })} />
              <NumberInput label="Armadura" value={Number(companion.armor || 0)} min={0} onChange={(value) => patch({ armor: value })} />
              <NumberInput label="PV atual" value={Number(companion.pvCurrent || 0)} min={0} onChange={(value) => patch({ pvCurrent: value })} />
              <NumberInput label="PV maximo" value={Number(companion.pvMax || 0)} min={0} onChange={(value) => patch({ pvMax: value })} />
            </div>

            <section className="rounded-lg border border-line bg-white/5 p-4">
              <h3 className="font-black">Atributos</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {ATTRIBUTES.map((attribute) => (
                  <NumberInput
                    key={attribute.key}
                    label={attribute.label}
                    value={Number(companion.attributes?.[attribute.key] || 0)}
                    min={0}
                    onChange={(value) => patchAttribute(attribute.key, value)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black">Pericias</h3>
                <Button type="button" onClick={() => patch({ skills: [...(companion.skills || []), createCompanionSkillEntry({ _draft: true })] })}>Adicionar</Button>
              </div>
              <div className="mt-3 grid gap-3">
                {(companion.skills || []).length ? (companion.skills || []).map((skill, index) => {
                  const total = getCompanionSkillTotal(companion, skill);
                  return (
                    <div className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={`skill-${index}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>Pericia {index + 1}</strong>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{formatSigned(total)}</Badge>
                          <Button tone="danger" type="button" onClick={() => patch({ skills: (companion.skills || []).filter((_, currentIndex) => currentIndex !== index) })}>Remover</Button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_100px_minmax(0,160px)_110px]">
                        <TextInput label="Nome" value={String(skill.name || '')} onChange={(value) => updateSkill(index, 'name', value)} />
                        <NumberInput label="Valor" value={Number(skill.value || 0)} min={0} onChange={(value) => updateSkill(index, 'value', value)} />
                        <SelectInput label="Atributo" value={String(skill.attribute || 'destreza')} options={ATTRIBUTES.map((attribute) => ({ value: attribute.key, label: attribute.label }))} onChange={(value) => updateSkill(index, 'attribute', value)} />
                        <div className="grid content-center rounded-lg border border-line bg-white/5 px-3 py-2">
                          <span className="text-sm text-textMuted">Total</span>
                          <strong className="text-lg">{formatSigned(total)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma pericia cadastrada.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black">Facetas</h3>
                <Button type="button" onClick={() => patch({ facets: [...(companion.facets || []), createCompanionFacetEntry({ _draft: true })] })}>Adicionar</Button>
              </div>
              <div className="mt-3 grid gap-3">
                {(companion.facets || []).length ? (companion.facets || []).map((facet, index) => (
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_90px_90px_auto]" key={`facet-${index}`}>
                    <TextInput label={`Faceta ${index + 1}`} value={String(facet.name || '')} onChange={(value) => updateFacet(index, 'name', value)} />
                    <NumberInput label="Rank" value={Number(facet.rank || 1)} min={1} max={10} onChange={(value) => updateFacet(index, 'rank', value)} />
                    <NumberInput label="XP" value={Number(facet.xp || 0)} min={0} onChange={(value) => updateFacet(index, 'xp', value)} />
                    <Button tone="danger" className="self-end" type="button" onClick={() => patch({ facets: (companion.facets || []).filter((_, currentIndex) => currentIndex !== index) })}>Remover</Button>
                  </div>
                )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma faceta cadastrada.</p>}
              </div>
            </section>

            <TextArea label="Notas" value={companion.notes || ''} onChange={(value) => patch({ notes: value })} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceInputCard({
  label,
  current,
  max,
  formula,
  tone = 'pv',
  onChange
}: {
  label: string;
  current: number;
  max: number;
  formula?: string;
  tone?: 'pv' | 'pe' | 'pd' | 'instability';
  onChange(value: number): void;
}) {
  const safeMax = Math.max(1, Number(max || 0));
  const safeCurrent = Math.max(0, Math.min(safeMax, Number(current || 0)));
  const percent = Math.max(0, Math.min(100, Math.round((safeCurrent / safeMax) * 100)));
  const fills = {
    pv: 'from-[#ff636d] to-[#ff9c64]',
    pe: 'from-[#855cff] to-[#a88bff]',
    pd: 'from-[#60d9ff] to-[#7fffd5]',
    instability: 'from-[#ff5f7a] to-[#855cff]'
  };

  return (
    <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black">{label}</h3>
        <strong className="text-lg">{current}/{max}</strong>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
        <input
          aria-label={`${label} atual`}
          className={fieldClass}
          type="number"
          min={0}
          max={max}
          value={current}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span className="text-textMuted">/</span>
        <strong className="text-lg">{max}</strong>
      </div>
      <div className="grid gap-1">
        <div className="h-2 overflow-hidden rounded-lg border border-line bg-black/40">
          <div className={`h-full rounded-lg bg-gradient-to-r ${fills[tone]} transition-all`} style={{ width: `${percent}%` }} />
        </div>
        <div className="flex justify-between text-xs font-semibold text-textMuted">
          <span>{safeCurrent}/{safeMax}</span>
          <span>{percent}%</span>
        </div>
      </div>
      {formula ? <small className="text-textMuted">{formula}</small> : null}
    </article>
  );
}

function formatResourceFormula(breakdown: { base: number; level: number; attribute: number; aptitudes: number; attributeName: string }) {
  return `Base ${breakdown.base} + nivel ${breakdown.level} + ${breakdown.attributeName} ${breakdown.attribute} + aptidoes ${breakdown.aptitudes}`;
}

function readStoredTab(): TabId {
  try {
    if (typeof window === 'undefined') return 'geral';
    const stored = window.sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return tabs.some((tab) => tab.id === stored) ? stored as TabId : 'geral';
  } catch {
    return 'geral';
  }
}

function StaticInfo({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-white/5 p-4 ${className}`}>
      <strong className="block">{label}</strong>
      <p className="mt-2 text-textMuted">{value}</p>
    </div>
  );
}

function Avatar({ image, name, className = '' }: { image: string; name: string; className?: string }) {
  const initials = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <div className={`grid place-items-center overflow-hidden rounded-full border border-line bg-vita/10 ${className}`}>
      {image ? <img className="h-full w-full object-cover" src={image} alt="" /> : <span className="text-xl font-black text-violet">{initials || '?'}</span>}
    </div>
  );
}

const fieldClass = 'w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain outline-none transition focus:border-vita focus:ring-2 focus:ring-vita/20 disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-textMuted';

type SelectOption = string | { value: string; label: string };

function TextInput({ label, value, onChange, className, disabled = false }: { label: string; value: string; onChange(value: string): void; className?: string; disabled?: boolean }) {
  return (
    <label className={`grid gap-2 ${className || ''}`}>
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <input className={fieldClass} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberInput({ label, value, onChange, min, max, className }: { label: string; value: number; onChange(value: number): void; min?: number; max?: number; className?: string }) {
  return (
    <label className={`grid gap-2 ${className || ''}`}>
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <input className={fieldClass} type="number" min={min} max={max} value={Number(value || 0)} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectInput({ label, value, options, onChange, className }: { label: string; value: string; options: SelectOption[]; onChange(value: string): void; className?: string }) {
  return (
    <label className={`grid gap-2 ${className || ''}`}>
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const normalized = typeof option === 'string' ? { value: option, label: option } : option;
          return <option key={normalized.value} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, className }: { label: string; value: string; onChange(value: string): void; className?: string }) {
  return (
    <label className={`grid gap-2 ${className || ''}`}>
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <textarea className={`${fieldClass} min-h-24 resize-y`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function readImageFile(event: ChangeEvent<HTMLInputElement>, onLoad: (value: string) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  void readFileAsOptimizedDataUrl(file)
    .then(onLoad)
    .catch(() => {
      const reader = new FileReader();
      reader.onload = () => onLoad(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
  event.target.value = '';
}

function extractCharacterFromPayload(payload: unknown): Partial<CharacterSheet> | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (raw.character && typeof raw.character === 'object') return raw.character as Partial<CharacterSheet>;
  if (raw.identity && raw.resources) return raw as Partial<CharacterSheet>;
  if (Array.isArray(raw.characters) && raw.characters[0] && typeof raw.characters[0] === 'object') {
    return raw.characters[0] as Partial<CharacterSheet>;
  }
  return null;
}

function resolveAptitudeName(entry: Record<string, unknown>) {
  const catalogId = String(entry.catalogId || '').trim();
  if (!catalogId) return 'Aptidao personalizada';
  const catalog = getAptitudeById(catalogId);
  if (catalog?.name) return catalog.name;
  return catalogId.split('-').filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function getAptitudeEffectText(catalog: ReturnType<typeof getAptitudeById>) {
  if (!catalog) return 'Aptidao personalizada.';
  return catalog.summary;
}

function normalizeSearchText(value: unknown) {
  return cleanTextValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function splitInlineList(value: unknown) {
  return cleanTextValue(value)
    .split(/[,;\n]+/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function cleanTextValue(value: unknown) {
  const text = String(value ?? '');
  const normalized = text.trim().toLowerCase();
  return normalized === 'null' || normalized === 'undefined' ? '' : text;
}

function getFacetRank(facet: Record<string, unknown>) {
  return Math.max(1, Number(facet.rank || 1));
}

function getFacetSkillLimit(facet: Record<string, unknown>) {
  return Math.max(0, getFacetRank(facet) - 1);
}

function getFacetSkillEntries(facet: Record<string, unknown>) {
  const rawSkills = Array.isArray(facet.skills)
    ? facet.skills
    : (Array.isArray(facet.skillEffects) ? facet.skillEffects : []);

  return rawSkills.map((entry) => {
    if (typeof entry === 'string') return { name: '', effect: cleanTextValue(entry) };
    if (!entry || typeof entry !== 'object') return { name: '', effect: '' };
    const record = entry as Record<string, unknown>;
    return {
      name: cleanTextValue(record.name || record.title || record.label),
      effect: cleanTextValue(record.effect || record.description || record.notes)
    };
  });
}

function getAttributeLabel(key: string) {
  return ATTRIBUTES.find((attribute) => attribute.key === key)?.label || key;
}

function formatSigned(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function getCompanionSkillTotal(companion: CompanionSheet, skill: Record<string, unknown>) {
  const attributeKey = String(skill.attribute || 'destreza');
  const attributeValue = Number(companion.attributes?.[attributeKey] || 0);
  return Number(skill.value || 0) + Math.floor(attributeValue / 2);
}

function slugForFile(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'personagem';
}

function buildCharacterExportFilename(character: CharacterSheet) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${slugForFile(character.identity.name || 'personagem')}-${stamp}.json`;
}
