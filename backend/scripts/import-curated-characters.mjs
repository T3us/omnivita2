import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import dotenv from 'dotenv';
import { getCharacterRowById, saveCharacter } from '../src/characters.mjs';
import { pool } from '../src/db.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const caelSourceCandidates = [
  process.env.CAEL_SOURCE_PATH,
  path.join(repoRoot, 'migration-input', 'recovery-bundles', 'cael-silveira-gomes.json'),
  'c:/Users/Nean/Downloads/cael-silveira-gomes-2026-04-07-14-51-58.json'
].filter(Boolean);

dotenv.config({ path: path.join(backendRoot, '.env') });

async function loadAppSystem() {
  const systemPath = path.join(repoRoot, 'assets', 'js', 'system.js');
  const source = await fs.readFile(systemPath, 'utf8');
  const context = {
    window: {},
    console,
    Math,
    Date
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'system.js' });
  return context.window.AppSystem;
}

function basicAptitude(catalogId) {
  return {
    catalogId,
    tier: 'B\u00e1sica',
    customName: '',
    notes: '',
    effectChoice: ''
  };
}

function createManualCharacters() {
  return [
    {
      id: 'greg',
      ownerUsername: 'greg',
      identity: {
        name: 'Greg',
        age: 16,
        className: 'Combatente',
        level: 2,
        manifestationOrigin: '',
        links: '',
        concept: '',
        summary: '',
        appearance: '',
        image: ''
      },
      attributes: {
        forca: 1,
        destreza: 0,
        sentidos: 0,
        vigor: 4,
        inteligencia: 0,
        nexo: 3
      },
      resources: {
        pvCurrent: 46,
        peCurrent: 16,
        pdCurrent: 12,
        instability: 0,
        armorBonus: 0,
        armorEquipment: '',
        blockMode: 'vigor',
        status: 'Estavel'
      },
      skills: {
        fortitude: 3,
        iniciativa: 2,
        luta: 3,
        manifestacao: 2,
        reflexos: 3,
        vontade: 3
      },
      aptitudes: [
        basicAptitude('guarda-fechada'),
        basicAptitude('folego-extra'),
        basicAptitude('reserva-tecnica')
      ],
      manifestation: {
        name: 'Controle de Musculos',
        origin: '',
        state: 'Parcial',
        glitches: '',
        activeEffects: ''
      },
      facets: [
        { name: 'Armadura de Musculos' },
        { name: 'Ataques Musculares' }
      ],
      mastery: [
        { facet: 'Armadura de Musculos', rank: 2, xp: 5 },
        { facet: 'Ataques Musculares', rank: 2, xp: 5 }
      ],
      equipment: {
        primaryWeapon: 'Soco',
        secondaryWeapon: 'Soco 2',
        items: 'Celularzin dele so e a mochila'
      },
      notes: '',
      masterNotes: ''
    },
    {
      id: 'serena',
      ownerUsername: 'serena',
      identity: {
        name: 'Serena Matos',
        age: 17,
        className: 'Especialista',
        level: 2,
        manifestationOrigin: 'Nanites',
        links: '',
        concept: '',
        summary: '',
        appearance: '',
        image: ''
      },
      attributes: {
        forca: 0,
        destreza: 1,
        sentidos: 1,
        vigor: 0,
        inteligencia: 2,
        nexo: 4
      },
      resources: {
        pvCurrent: 23,
        peCurrent: 26,
        pdCurrent: 20,
        instability: 0,
        armorBonus: 0,
        armorEquipment: '',
        blockMode: 'vigor',
        status: 'Estavel'
      },
      skills: {
        atualidades: 1,
        ciencias: 2,
        diplomacia: 1,
        enganacao: 1,
        furtividade: 3,
        iniciativa: 3,
        intuicao: 1,
        investigacao: 3,
        manifestacao: 3,
        reflexos: 3,
        tecnologia: 3,
        vontade: 1
      },
      aptitudes: [
        basicAptitude('reserva-tecnica'),
        basicAptitude('rastro-invisivel')
      ],
      manifestation: {
        name: 'Nanites',
        origin: 'Nanites',
        state: 'Parcial',
        glitches: '',
        activeEffects: ''
      },
      facets: [
        { name: 'Tecnopatia' },
        { name: 'Reconfiguracao' },
        { name: 'Revestimento' },
        { name: 'Fisiologia Bionica' }
      ],
      mastery: [
        { facet: 'Tecnopatia', rank: 1, xp: 1 },
        { facet: 'Reconfiguracao', rank: 2, xp: 0 },
        { facet: 'Revestimento', rank: 1, xp: 1 },
        { facet: 'Fisiologia Bionica', rank: 1, xp: 0 }
      ],
      equipment: {
        primaryWeapon: 'SOCO',
        secondaryWeapon: 'SOCO',
        items: 'Celular, luvas, uma luneta e uma bolsa com um kit de ferramentas eletronicas'
      },
      notes: '',
      masterNotes: ''
    },
    {
      id: 'k',
      ownerUsername: 'k',
      identity: {
        name: 'Kendrick Lamar',
        age: 17,
        className: 'Combatente',
        level: 2,
        manifestationOrigin: 'Mimer',
        links: '',
        concept: '',
        summary: '',
        appearance: '',
        image: ''
      },
      attributes: {
        forca: 1,
        destreza: 0,
        sentidos: 0,
        vigor: 5,
        inteligencia: 0,
        nexo: 2
      },
      resources: {
        pvCurrent: 44,
        peCurrent: 9,
        pdCurrent: 23,
        instability: 0,
        armorBonus: 1,
        armorEquipment: 'Mimer / defesa corporal',
        blockMode: 'vigor',
        status: 'Estavel'
      },
      skills: {
        atletismo: 3,
        ciencias: 2,
        fortitude: 3,
        iniciativa: 3,
        luta: 3,
        reflexos: 3,
        vontade: 2
      },
      aptitudes: [
        basicAptitude('leitura-de-ambiente'),
        basicAptitude('guarda-fechada'),
        basicAptitude('folego-extra')
      ],
      manifestation: {
        name: 'Mimer',
        origin: 'Mimer',
        state: 'Parcial',
        glitches: '',
        activeEffects: ''
      },
      facets: [
        { name: 'Esticar membros' },
        { name: 'Mimica' },
        { name: 'Transformacao' }
      ],
      mastery: [
        { facet: 'Mimica', rank: 1, xp: 4 },
        { facet: 'Esticar membros', rank: 1, xp: 4 }
      ],
      equipment: {
        primaryWeapon: 'Tudo que Mimer ver',
        secondaryWeapon: 'Tudo que Mimer ver',
        items: 'TqMv'
      },
      progression: {
        extraPeV: 0,
        manualPeVSpent: 9,
        facetaUnlocks: 0,
        facetaStabilizations: 0,
        progressionNotes: ''
      },
      notes: '',
      masterNotes: ''
    }
  ];
}

async function loadCaelCharacter() {
  let raw = null;
  let sourcePath = '';

  for (const candidate of caelSourceCandidates) {
    try {
      raw = JSON.parse(await fs.readFile(candidate, 'utf8'));
      sourcePath = candidate;
      break;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  if (!raw) {
    throw new Error(`Arquivo do Cael nao encontrado. Caminhos tentados: ${caelSourceCandidates.join(', ')}`);
  }

  const character = raw.character || raw;
  console.log(`Importando Cael a partir de: ${sourcePath}`);
  return {
    ...character,
    id: 'cael',
    ownerUsername: 'cael'
  };
}

function summarize(system, character) {
  const derived = system.calculateDerived(character);
  return {
    id: character.id,
    name: character.identity.name,
    className: character.identity.className,
    level: character.identity.level,
    pv: `${character.resources.pvCurrent}/${derived.maxPv}`,
    pe: `${character.resources.peCurrent}/${derived.maxPe}`,
    pd: `${character.resources.pdCurrent}/${derived.maxPd}`,
    aptitudes: character.aptitudes.length,
    facets: character.facets.length,
    companions: character.companions.length
  };
}

const AppSystem = await loadAppSystem();
const client = await pool.connect();

try {
  const curated = [
    await loadCaelCharacter(),
    ...createManualCharacters()
  ];

  const results = [];

  for (const rawCharacter of curated) {
    const existing = await getCharacterRowById(rawCharacter.id, client);
    if (!existing) {
      throw new Error(`Ficha nao encontrada no banco para id: ${rawCharacter.id}`);
    }

    const hydrated = AppSystem.hydrateCharacter(rawCharacter);
    const saved = await saveCharacter(existing, hydrated, client);
    results.push(summarize(AppSystem, saved));
  }

  console.log(JSON.stringify(results, null, 2));
} finally {
  client.release();
  await pool.end();
}
