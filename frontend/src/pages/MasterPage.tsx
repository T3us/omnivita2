import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import type { ChangeEvent, ReactNode } from 'react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { BootstrapPayload, CharacterSheet, Combatant, CombatState, CompanionSheet, ScenarioState } from '../api/types';
import { useAuth } from '../auth/auth-context';
import { AppLayout } from '../components/AppLayout';
import { Badge, Button, Card, ResourceMeter } from '../components/Ui';
import { useBootstrap } from '../hooks/useBootstrap';
import {
  ATTRIBUTES,
  SKILL_ATTRIBUTE_DEFAULTS,
  SKILL_LABELS,
  calculateDerived,
  createCompanion,
  createCompanionFacetEntry,
  createCompanionSkillEntry,
  hydrateCharacter,
  normalizeCompanion
} from '../domain/system';
import {
  createOmnivitaUnlockCode,
  normalizeOmnivitaCodeConfig,
  OMNIVITA_MANIFESTATION_STATES,
  formatOmnivitaSequence,
  type OmnivitaCodeConfig,
  type OmnivitaManifestationState,
  type OmnivitaSecretDirection
} from '../domain/omnivita';
import { optimizeCharacterImages, readFileAsOptimizedDataUrl } from '../utils/images';
import { downloadJson, readJsonFile } from '../utils/json';

const TabletopPage = lazy(() => import('../components/tabletop/TabletopPage').then((module) => ({ default: module.TabletopPage })));

type QuickFilter = 'all' | 'alert' | 'instability' | 'entities' | 'absent' | 'focus';
type MasterTab = 'session' | 'combat' | 'players' | 'omnivita' | 'tabletop' | 'scenarios' | 'libraries' | 'editor';
type CombatantDraft = Combatant & Record<string, unknown>;
type MasterLibraryKind = 'npcs' | 'locations' | 'items' | 'clues' | 'templates';

interface MasterLogEntry {
  id?: string;
  name: string;
  message: string;
  time: string;
  category?: string;
  createdAt?: string;
  details?: Record<string, unknown>;
}

interface MasterSnapshotEntry {
  id: string;
  name: string;
  pv: number;
  pe: number;
  pd: number;
  instability: number;
  status: string;
  masterNotes: string;
  companions: number;
  companionsSignature: string;
  sessionTagsSignature: string;
}

interface EnemyRecord {
  id: string;
  name: string;
  role: string;
  image: string;
  status: string;
  countCurrent: number;
  countMax: number;
  pvCurrent: number;
  pvMax: number;
  armor: number;
  dodge: number;
  block: number;
  initiative: number;
  attack: number;
  pe: number;
  pd: number;
  damageLabel: string;
  damageExpression: string;
  damageAverage: number;
  basicDamageLabel: string;
  basicDamageExpression: string;
  basicDamageAverage: number;
  source: string;
  notes: string;
  attributes: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface MasterLibraryEntry {
  id: string;
  title: string;
  type: string;
  summary: string;
  tags: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

type MasterLibrariesState = Record<MasterLibraryKind, MasterLibraryEntry[]>;

interface ImportOptions {
  characters: boolean;
  scenarios: boolean;
  enemyLibrary: boolean;
  masterLibraries: boolean;
  sessionLog: boolean;
  combatState: boolean;
}

interface ImportPreview {
  payload: unknown;
  options: ImportOptions;
  summary: {
    characters: CharacterSheet[];
    scenarios: ReturnType<typeof getScenarioImportSummary> | null;
    enemyLibrary: EnemyRecord[] | null;
    masterLibraries: MasterLibrariesState | null;
    sessionLog: MasterLogEntry[] | null;
    combatState: CombatState | null;
  };
}

const MASTER_ENEMY_LIBRARY_KEY = 'omnivita-master-enemies-v1';
const MASTER_ENCOUNTER_STORAGE_KEY = 'omnivita-master-encounter-v1';
const MASTER_SCENARIO_STORAGE_KEY = 'omnivita-master-scenarios-v1';
const MASTER_LOG_STORAGE_KEY = 'omnivita-master-log-v31';
const COMBAT_STATUS_OPTIONS = ['Vivo', 'Morrendo', 'Morto'];
const MASTER_LIBRARY_GROUPS: Array<{ key: MasterLibraryKind; label: string; singular: string; helper: string }> = [
  { key: 'npcs', label: 'NPCs', singular: 'NPC', helper: 'Aliados, contatos, rivais e figuras recorrentes.' },
  { key: 'locations', label: 'Locais', singular: 'Local', helper: 'Bases, bairros, salas, zonas anomalas e pontos de interesse.' },
  { key: 'items', label: 'Itens', singular: 'Item', helper: 'Equipamentos, artefatos, documentos e recursos especiais.' },
  { key: 'clues', label: 'Pistas', singular: 'Pista', helper: 'Evidencias soltas que podem entrar em cenas diferentes.' },
  { key: 'templates', label: 'Modelos', singular: 'Modelo', helper: 'Templates de encontro, cena, complicacao ou recompensa.' }
];

const tabs: Array<{ id: MasterTab; label: string }> = [
  { id: 'session', label: 'Sessao' },
  { id: 'combat', label: 'Combate' },
  { id: 'players', label: 'Players' },
  { id: 'omnivita', label: 'OmniVita' },
  { id: 'tabletop', label: 'Mesa' },
  { id: 'scenarios', label: 'Cenarios' },
  { id: 'libraries', label: 'Bibliotecas' },
  { id: 'editor', label: 'Edicao' }
];

export function MasterPage() {
  const query = useBootstrap();
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<MasterTab>('session');
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [importMessage, setImportMessage] = useState('');
  const [optimizeMessage, setOptimizeMessage] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [companionDialogSignal, setCompanionDialogSignal] = useState(0);
  const [enemyLibrary, setEnemyLibraryState] = useState<EnemyRecord[]>(() => loadEnemyLibrary());
  const [masterLogEntries, setMasterLogEntries] = useState<MasterLogEntry[]>(() => loadMasterLog());
  const [masterLibraries, setMasterLibrariesState] = useState<MasterLibrariesState>(() => createEmptyMasterLibraries());
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const characters = useMemo(() => (query.data?.characters || []).map(hydrateCharacter), [query.data?.characters]);
  const combat = query.data?.combatState;
  const repairedCombat = useMemo(() => repairCombatStateWithCharacters(combat, characters), [characters, combat]);
  const currentCombatants = repairedCombat.combatants as CombatantDraft[];
  const scenarios = query.data?.masterData?.scenarios || null;
  const scenarioList = Array.isArray(scenarios?.scenarios) ? scenarios.scenarios : [];
  const selectedCharacter = characters.find((character) => character.id === selectedCharacterId) || characters[0] || null;
  const caelOmnivitaCharacter = useMemo(() => findCaelOmnivitaCharacter(characters), [characters]);
  const omnivitaCodesQuery = useQuery({
    queryKey: ['master-data', 'omnivita-codes'],
    queryFn: () => api.getMasterData('omnivita-codes'),
    enabled: Boolean(session?.user?.role === 'master')
  });
  const omnivitaCodes = useMemo(
    () => normalizeOmnivitaCodeConfig(omnivitaCodesQuery.data?.data),
    [omnivitaCodesQuery.data?.data]
  );
  const masterControlEnabled = Boolean(
    ((caelOmnivitaCharacter?.manifestation || {}) as Record<string, unknown>).omnivitaMasterControlUnlocked
  );

  function patchBootstrapCache(updater: (current: BootstrapPayload) => BootstrapPayload) {
    queryClient.setQueryData<BootstrapPayload>(['bootstrap'], (current) => {
      if (!current) return current;
      return updater(current);
    });
  }

  const updateMutation = useMutation({
    mutationFn: ({ characterId, character }: { characterId: string; character: CharacterSheet }) => api.updateCharacter(characterId, character),
    onMutate: async ({ character }) => {
      await queryClient.cancelQueries({ queryKey: ['bootstrap'] });
      const previousBootstrap = queryClient.getQueryData<BootstrapPayload>(['bootstrap']);
      patchBootstrapCache((current) => ({
        ...current,
        characters: current.characters.map((entry) => (
          entry.id === character.id ? hydrateCharacter(character) : entry
        ))
      }));
      return { previousBootstrap };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBootstrap) {
        queryClient.setQueryData(['bootstrap'], context.previousBootstrap);
      }
      setImportMessage('Falha ao salvar a ficha.');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  });
  const combatMutation = useMutation({
    mutationFn: (state: CombatState) => api.putCombat(state, { reason: 'master-react' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  });
  const scenarioMutation = useMutation({
    mutationFn: (state: ScenarioState) => api.putMasterData('scenarios', state),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  });
  const enemyLibraryMutation = useMutation({
    mutationFn: (library: EnemyRecord[]) => api.putMasterData('enemy-library', { enemies: library.map(hydrateEnemyRecord) })
  });
  const masterLogMutation = useMutation({
    mutationFn: (entries: MasterLogEntry[]) => api.putMasterData('session-log', { entries })
  });
  const masterLibrariesMutation = useMutation({
    mutationFn: (libraries: MasterLibrariesState) => api.putMasterData('libraries', normalizeMasterLibraries(libraries))
  });
  const omnivitaCodesMutation = useMutation({
    mutationFn: (codes: OmnivitaCodeConfig) => api.putMasterData('omnivita-codes', codes),
    onMutate: async (codes) => {
      await queryClient.cancelQueries({ queryKey: ['master-data', 'omnivita-codes'] });
      const previousCodes = queryClient.getQueryData<{ key: string; data: unknown; updatedAt?: string }>(['master-data', 'omnivita-codes']);
      queryClient.setQueryData(['master-data', 'omnivita-codes'], {
        key: 'omnivita-codes',
        data: codes,
        updatedAt: new Date().toISOString()
      });
      return { previousCodes };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCodes) {
        queryClient.setQueryData(['master-data', 'omnivita-codes'], context.previousCodes);
      }
      setImportMessage('Falha ao salvar os codigos do OmniVita.');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-data', 'omnivita-codes'] })
  });

  const importMutation = useMutation({
    mutationFn: async ({ payload, options }: { payload: unknown; options: ImportOptions }) => {
      const importedCharacters = extractCharactersFromPayload(payload);
      if (options.characters) {
        if (!importedCharacters.length) throw new Error('Nenhuma ficha encontrada no JSON.');
        for (const character of importedCharacters) {
          const hydrated = hydrateCharacter(character);
          await api.updateCharacter(hydrated.id, hydrated);
        }
      }

      const importedScenarios = extractScenariosFromPayload(payload);
      if (options.scenarios && importedScenarios) {
        await api.putMasterData('scenarios', importedScenarios);
      }

      const importedEnemyLibrary = extractEnemyLibraryFromPayload(payload);
      if (options.enemyLibrary && importedEnemyLibrary) {
        await api.putMasterData('enemy-library', { enemies: importedEnemyLibrary.map(hydrateEnemyRecord) });
      }

      const importedMasterLibraries = extractMasterLibrariesFromPayload(payload);
      if (options.masterLibraries && importedMasterLibraries) {
        await api.putMasterData('libraries', importedMasterLibraries);
      }

      const importedSessionLog = extractMasterLogFromPayload(payload);
      if (options.sessionLog && importedSessionLog) {
        await api.putMasterData('session-log', { entries: importedSessionLog });
      }

      const combatRepairCharacters = importedCharacters.length ? importedCharacters : characters;
      const importedCombatState = extractCombatStateFromPayload(payload, combatRepairCharacters);
      if (options.combatState && importedCombatState) {
        await api.putCombat(importedCombatState, { reason: 'master-react-import' });
      }

      return {
        characterCount: options.characters ? importedCharacters.length : 0,
        importedScenarios: Boolean(options.scenarios && importedScenarios),
        enemyLibrary: options.enemyLibrary ? importedEnemyLibrary : null,
        masterLibraries: options.masterLibraries ? importedMasterLibraries : null,
        sessionLog: options.sessionLog ? importedSessionLog : null,
        importedSessionLog: Boolean(options.sessionLog && importedSessionLog),
        importedCombat: Boolean(options.combatState && importedCombatState)
      };
    },
    onSuccess: (result) => {
      if (result.enemyLibrary) {
        const hydrated = result.enemyLibrary.map(hydrateEnemyRecord);
        setEnemyLibraryState(hydrated);
        saveEnemyLibrary(hydrated);
      }
      if (result.masterLibraries) setMasterLibrariesState(normalizeMasterLibraries(result.masterLibraries));
      if (result.sessionLog) {
        setMasterLogEntries(result.sessionLog);
        saveMasterLog(result.sessionLog);
      }
      const extras = [
        result.importedScenarios ? 'cenarios' : '',
        result.enemyLibrary ? 'biblioteca de inimigos' : '',
        result.masterLibraries ? 'bibliotecas' : '',
        result.importedSessionLog ? 'log' : '',
        result.importedCombat ? 'encontro ativo' : ''
      ].filter(Boolean);
      setImportMessage(`Importado: ${result.characterCount} ficha(s)${extras.length ? ` + ${extras.join(', ')}` : ''}.`);
      setImportPreview(null);
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
    onError: (error) => {
      setImportMessage(error instanceof Error ? error.message : 'Falha ao importar JSON.');
    }
  });

  const optimizeImagesMutation = useMutation({
    mutationFn: async (sourceCharacters: CharacterSheet[]) => {
      let changedCharacters = 0;
      let optimizedImages = 0;
      let bytesSaved = 0;
      let failures = 0;

      for (let index = 0; index < sourceCharacters.length; index += 1) {
        const currentCharacter = hydrateCharacter(sourceCharacters[index]);
        setOptimizeMessage(`Otimizando ${index + 1}/${sourceCharacters.length}: ${currentCharacter.identity.name || 'Ficha'}`);

        try {
          const result = await optimizeCharacterImages(currentCharacter);
          if (!result.changed) {
            await waitForBrowser();
            continue;
          }

          await api.updateCharacter(result.character.id, result.character);
          changedCharacters += 1;
          optimizedImages += result.optimizedImages;
          bytesSaved += result.bytesSaved;
        } catch (error) {
          console.error(error);
          failures += 1;
        }

        await waitForBrowser();
      }

      return { changedCharacters, optimizedImages, bytesSaved, failures };
    },
    onSuccess: (result) => {
      setOptimizeMessage('');
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      const savedMb = result.bytesSaved / (1024 * 1024);
      if (!result.changedCharacters) {
        setImportMessage(result.failures ? 'Nenhuma imagem otimizada; algumas fichas falharam' : 'Nenhuma imagem grande encontrada');
        return;
      }
      setImportMessage(result.failures
        ? `${result.changedCharacters} ficha(s), ${result.optimizedImages} imagem(ns), ${savedMb.toFixed(1)} MB salvos; ${result.failures} falha(s)`
        : `${result.changedCharacters} ficha(s), ${result.optimizedImages} imagem(ns), ${savedMb.toFixed(1)} MB salvos`);
    },
    onError: (error) => {
      setOptimizeMessage('');
      setImportMessage(error instanceof Error ? error.message : 'Falha ao otimizar imagens.');
    }
  });

  useEffect(() => {
    if (!query.data) return;
    const remoteLibrary = extractEnemyLibraryFromMasterData(query.data.masterData?.enemyLibrary);
    if (!remoteLibrary) return;
    setEnemyLibraryState(remoteLibrary);
    saveEnemyLibrary(remoteLibrary);
  }, [query.data]);

  useEffect(() => {
    if (!query.data) return;
    const remoteLog = extractMasterLogFromMasterData(query.data.masterData?.sessionLog);
    if (!remoteLog) return;
    setMasterLogEntries(remoteLog);
    saveMasterLog(remoteLog);
  }, [query.data]);

  useEffect(() => {
    if (!query.data) return;
    const remoteLibraries = extractMasterLibrariesFromMasterData(query.data.masterData?.libraries);
    if (!remoteLibraries) return;
    setMasterLibrariesState(remoteLibraries);
  }, [query.data]);

  const filteredCharacters = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return characters.filter((character) => {
      const derived = calculateDerived(character);
      const alertData = getCharacterAlertData(character, derived);
      const haystack = [
        character.identity.name,
        character.identity.className,
        character.identity.summary,
        character.resources.status,
        character.masterNotes,
        character.ownerUsername,
        getSessionTags(character).map(getSessionTagLabel).join(' '),
        character.companions.map((entry) => `${entry.name || ''} ${entry.type || ''} ${entry.status || ''}`).join(' ')
      ].join(' ').toLowerCase();

      if (searchText && !haystack.includes(searchText)) return false;
      if (quickFilter === 'instability' && !alertData.highInstability) return false;
      if (quickFilter === 'entities' && !alertData.hasCompanions) return false;
      if (quickFilter === 'absent' && !alertData.isAbsent) return false;
      if (quickFilter === 'focus' && !alertData.isFocus) return false;
      if (quickFilter === 'alert' && !alertData.isAlert) return false;
      return true;
    }).sort((left, right) => {
      const alertDelta = getCharacterAlertData(right).alertScore - getCharacterAlertData(left).alertScore;
      if (alertDelta) return alertDelta;
      return String(left.identity.name || '').localeCompare(String(right.identity.name || ''), 'pt-BR');
    });
  }, [characters, quickFilter, search]);

  function updateCharacter(next: CharacterSheet) {
    updateMutation.mutate({ characterId: next.id, character: hydrateCharacter(next) });
  }

  function revokeOmnivitaMasterControl() {
    if (!caelOmnivitaCharacter || !masterControlEnabled) return;
    updateCharacter({
      ...caelOmnivitaCharacter,
      manifestation: {
        ...((caelOmnivitaCharacter.manifestation || {}) as Record<string, unknown>),
        omnivitaMasterControlUnlocked: false
      }
    });
    addMasterLogEntry({
      name: 'OmniVita',
      category: 'sessao',
      message: 'Controle mestre removido da ficha do Cael.',
      time: formatLogTime(new Date().toISOString())
    });
  }

  function setEnemyLibrary(nextLibrary: EnemyRecord[]) {
    const hydrated = nextLibrary
      .map((entry) => hydrateEnemyRecord(entry))
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
    setEnemyLibraryState(hydrated);
    saveEnemyLibrary(hydrated);
    enemyLibraryMutation.mutate(hydrated);
  }

  function persistMasterLog(nextEntries: MasterLogEntry[]) {
    const saved = saveMasterLog(nextEntries);
    setMasterLogEntries(saved);
    masterLogMutation.mutate(saved);
  }

  function addMasterLogEntries(entries: MasterLogEntry[]) {
    if (!entries.length) return;
    const saved = saveMasterLog([...entries.map(hydrateMasterLogEntry), ...masterLogEntries]);
    setMasterLogEntries(saved);
    masterLogMutation.mutate(saved);
  }

  function addMasterLogEntry(entry: MasterLogEntry) {
    addMasterLogEntries([entry]);
  }

  function clearMasterLog() {
    persistMasterLog([]);
  }

  function setMasterLibraries(nextLibraries: MasterLibrariesState) {
    const normalized = normalizeMasterLibraries(nextLibraries);
    setMasterLibrariesState(normalized);
    masterLibrariesMutation.mutate(normalized);
  }

  function updateResource(character: CharacterSheet, key: 'pvCurrent' | 'peCurrent' | 'pdCurrent' | 'instability', value: number) {
    updateCharacter({
      ...character,
      resources: {
        ...character.resources,
        [key]: value
      }
    });
  }

  function addCharacterToCombat(character: CharacterSheet) {
    const state = repairedCombat;
    const combatants = state.combatants as CombatantDraft[];
    if (hasSharedActorInEncounter(combatants, character.id)) {
      setImportMessage('Esse player ja esta representado em cena por ele mesmo ou por uma forma');
      return;
    }

    const nextState = finalizeCombatState([buildCharacterCombatant(character), ...combatants], {
      currentInstanceId: state.currentInstanceId,
      round: state.round
    });
    combatMutation.mutate(nextState);
    setImportMessage('Player entrou em cena');
  }

  function addCompanionToCombat(characterId: string, companionId: string) {
    const character = characters.find((entry) => entry.id === characterId);
    const companion = character?.companions.find((entry) => entry.id === companionId);
    if (!character || !companion) return;
    if (isCompanionHidden(companion)) {
      setImportMessage('Essa mini-ficha esta oculta. Publique antes de usar em cena.');
      return;
    }
    if (isCompanionForm(companion)) {
      setImportMessage('Formas sao controladas pelo jogador; quando ele transforma, a forma assume o lugar dele na iniciativa');
      return;
    }

    const state = repairedCombat;
    const combatants = state.combatants as CombatantDraft[];
    const draft = buildCompanionCombatant(character, companion, combatants);
    const sourceKey = getCombatantSourceKey(draft);
    if (sourceKey && combatants.some((entry) => getCombatantSourceKey(entry) === sourceKey)) {
      setImportMessage('Essa mini-ficha ja esta em cena');
      return;
    }

    const nextState = finalizeCombatState([draft, ...combatants], {
      currentInstanceId: state.currentInstanceId,
      round: state.round
    });
    combatMutation.mutate(nextState);
    setImportMessage('Mini-ficha entrou em cena');
  }

  function openCompanionsForCharacter(characterId: string) {
    setSelectedCharacterId(characterId);
    setActiveTab('editor');
    setCompanionDialogSignal((value) => value + 1);
  }

  function exportCampaign() {
    const currentCombat = query.data?.combatState ? repairedCombat : null;
    downloadJson(`omnivita-campaign-${new Date().toISOString().slice(0, 10)}.json`, {
      app: 'OmniVita',
      format: 'omnivita-campaign-export',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      metadata: {
        source: 'master-export-all',
        exportedBy: session?.user.username || session?.user.email || 'mestre'
      },
      characters: characters.map((character) => createCharacterTransferEnvelope(character)),
      enemyLibrary: enemyLibrary.map(hydrateEnemyRecord),
      activeEncounter: currentCombat?.combatants || [],
      activeEncounterTurn: {
        currentInstanceId: currentCombat?.currentInstanceId || '',
        round: Math.max(1, Number(currentCombat?.round || 1))
      },
      masterScenarios: scenarios || null,
      masterLibraries,
      sessionLog: { entries: masterLogEntries },
      masterData: {
        ...(query.data?.masterData || {}),
        enemyLibrary: { enemies: enemyLibrary.map(hydrateEnemyRecord) },
        libraries: masterLibraries,
        sessionLog: { entries: masterLogEntries }
      },
      combatState: currentCombat
    });
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    try {
      setImportMessage('Lendo backup...');
      const payload = await readJsonFile(file);
      const preview = buildImportPreview(payload, characters);
      if (!hasImportableData(preview)) {
        setImportMessage('Nao encontrei fichas, cenarios, bibliotecas, log ou combate nesse JSON.');
        if (importInputRef.current) importInputRef.current.value = '';
        return;
      }
      setImportPreview(preview);
      setImportMessage('Confira a previa antes de importar.');
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Falha ao ler JSON.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  function handleOptimizeImages() {
    if (!characters.length) {
      setImportMessage('Nenhuma ficha carregada');
      return;
    }

    const confirmed = window.confirm('Otimizar as imagens salvas de todas as fichas? Isso pode demorar um pouco, mas deixa backup e banco bem mais leves.');
    if (!confirmed) return;

    setImportMessage('');
    optimizeImagesMutation.mutate(characters);
  }

  const headerStatus = optimizeImagesMutation.isPending
    ? optimizeMessage || 'Otimizando imagens'
    : importMutation.isPending
      ? 'Importando campanha'
      : updateMutation.isPending
        ? 'Salvando'
        : 'Atualizado ao vivo';
  const headerStatusTone = optimizeImagesMutation.isPending || importMutation.isPending || updateMutation.isPending ? 'warn' : 'good';

  return (
    <AppLayout
      title="Fichas da campanha"
      eyebrow="DASHBOARD"
      sidebarWidth="master"
      sidebar={<MasterSidebar username={session?.user.username || '-'} onLogout={() => void logout()} />}
      actions={
        <>
          <Button type="button" onClick={exportCampaign}>Exportar todas as fichas</Button>
          <Button type="button" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending}>Importar campanha</Button>
          <Button type="button" onClick={handleOptimizeImages} disabled={optimizeImagesMutation.isPending}>Otimizar imagens</Button>
          <input
            ref={importInputRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
          <Badge tone={headerStatusTone}>{headerStatus}</Badge>
        </>
      }
    >
      {query.isLoading ? <Card>Carregando dados da campanha...</Card> : null}
      {query.error ? <Card className="border-coral/40 text-coral">{query.error instanceof Error ? query.error.message : 'Erro ao carregar.'}</Card> : null}
      {importMessage ? <Card className={importMessage.startsWith('Importado') ? 'border-aqua/40 text-aqua' : 'border-amber/40 text-amber'}>{importMessage}</Card> : null}

      <section className="rounded-lg border border-line bg-panel/90 p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className={activeTab === tab.id
                ? 'min-h-10 rounded-lg border border-vita/50 bg-vita/25 px-4 text-sm font-black text-textMain'
                : 'min-h-10 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-black text-textMain hover:bg-white/10'}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-3 grid gap-3 md:mt-4 md:gap-4">
        {activeTab === 'session' ? (
          <SessionPanel
            characters={characters}
            filteredCharacters={filteredCharacters}
            search={search}
            quickFilter={quickFilter}
            setSearch={setSearch}
            setQuickFilter={setQuickFilter}
            combatants={currentCombatants}
            logEntries={masterLogEntries}
            onAddLogEntries={addMasterLogEntries}
            onClearLog={clearMasterLog}
            onAddToCombat={addCharacterToCombat}
            onOpenCompanions={openCompanionsForCharacter}
            selectCharacter={(id) => {
              setSelectedCharacterId(id);
              setActiveTab('editor');
            }}
          />
        ) : null}

        {activeTab === 'players' ? (
          <PlayersPanel
            characters={filteredCharacters}
            search={search}
            quickFilter={quickFilter}
            setSearch={setSearch}
            setQuickFilter={setQuickFilter}
            onResourceChange={updateResource}
            onNotesBlur={(character, notes) => updateCharacter({ ...character, masterNotes: notes })}
            combatants={currentCombatants}
            onAddToCombat={addCharacterToCombat}
            onOpenCompanions={openCompanionsForCharacter}
            selectCharacter={(id) => {
              setSelectedCharacterId(id);
              setActiveTab('editor');
            }}
          />
        ) : null}
        {activeTab === 'omnivita' ? (
          <OmnivitaCodesPanel
            character={caelOmnivitaCharacter}
            codes={omnivitaCodes}
            saving={omnivitaCodesMutation.isPending || updateMutation.isPending}
            masterControlEnabled={masterControlEnabled}
            onSave={(nextCodes) => omnivitaCodesMutation.mutate(nextCodes)}
            onRevokeMasterControl={revokeOmnivitaMasterControl}
          />
        ) : null}

        {activeTab === 'combat' ? (
          <CombatPanel
            combat={repairedCombat}
            characters={characters}
            visibleCharacters={filteredCharacters}
            enemyLibrary={enemyLibrary}
            logEntries={masterLogEntries}
            saving={combatMutation.isPending || updateMutation.isPending}
            onCharacterChange={updateCharacter}
            onEnemyLibraryChange={setEnemyLibrary}
            onLog={addMasterLogEntry}
            onSaveCombat={(state) => combatMutation.mutate(state)}
          />
        ) : null}
        {activeTab === 'tabletop' ? (
          <Suspense fallback={<Card>Carregando mesa...</Card>}>
            <TabletopPage
              characters={characters}
              combatants={currentCombatants}
            />
          </Suspense>
        ) : null}
        {activeTab === 'scenarios' ? (
          <ScenariosPanel
            scenarios={scenarios}
            saving={scenarioMutation.isPending}
            onSave={(state) => scenarioMutation.mutate(state)}
          />
        ) : null}
        {activeTab === 'libraries' ? (
          <LibrariesPanel
            libraries={masterLibraries}
            saving={masterLibrariesMutation.isPending}
            onSave={setMasterLibraries}
          />
        ) : null}
        {activeTab === 'editor' ? (
          <EditorPanel
            characters={characters}
            selectedCharacter={selectedCharacter}
            selectedCharacterId={selectedCharacter?.id || ''}
            setSelectedCharacterId={setSelectedCharacterId}
            onResourceChange={updateResource}
            onCharacterChange={updateCharacter}
            combatants={currentCombatants}
            onAddCompanionToCombat={addCompanionToCombat}
            openCompanionDialogSignal={companionDialogSignal}
          />
        ) : null}
      </div>
      {importPreview ? (
        <ImportPreviewDialog
          preview={importPreview}
          importing={importMutation.isPending}
          onCancel={() => {
            setImportPreview(null);
            setImportMessage('Importacao cancelada.');
          }}
          onChangeOptions={(options) => setImportPreview({ ...importPreview, options })}
          onConfirm={() => importMutation.mutate({ payload: importPreview.payload, options: importPreview.options })}
        />
      ) : null}
    </AppLayout>
  );
}

function MasterSidebar({ username, onLogout }: { username: string; onLogout(): void }) {
  return (
    <div className="grid gap-4 rounded-lg border border-line bg-panel/90 p-4 shadow-soft backdrop-blur-xl">
      <div>
        <span className="inline-flex min-h-6 items-center rounded-full border border-vita/20 bg-vita/10 px-3 text-xs font-black uppercase tracking-[0.08em] text-violet">
          Mestre
        </span>
        <h1 className="mt-3 text-2xl font-black leading-tight">Painel Geral</h1>
        <p className="mt-3 text-sm leading-relaxed text-textMuted">Visao consolidada das fichas e dos recursos atuais dos jogadores.</p>
      </div>

      <section className="grid gap-2 rounded-lg border border-line bg-panelSoft/75 p-3">
        <p className="text-sm"><strong>Usuario:</strong> <span className="text-textMuted">{username}</span></p>
        <p className="text-sm"><strong>Permissao:</strong> <span className="text-textMuted">acesso total</span></p>
      </section>

      <div className="grid gap-2">
        <Link className="inline-flex min-h-10 items-center justify-center rounded-lg border border-vita/40 bg-vita/20 px-3 text-sm font-bold text-textMain hover:bg-vita/30" to="/omnivita">
          Abrir OmniVita
        </Link>
        <a className="inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold hover:bg-white/10" href="/personagem">
          Ir para painel do personagem
        </a>
        <Button type="button" onClick={onLogout}>Sair</Button>
      </div>
    </div>
  );
}

function SessionPanel({
  characters,
  filteredCharacters,
  search,
  quickFilter,
  setSearch,
  setQuickFilter,
  combatants,
  logEntries,
  onAddLogEntries,
  onClearLog,
  onAddToCombat,
  onOpenCompanions,
  selectCharacter
}: {
  characters: CharacterSheet[];
  filteredCharacters: CharacterSheet[];
  search: string;
  quickFilter: QuickFilter;
  setSearch(value: string): void;
  setQuickFilter(value: QuickFilter): void;
  combatants: CombatantDraft[];
  logEntries: MasterLogEntry[];
  onAddLogEntries(entries: MasterLogEntry[]): void;
  onClearLog(): void;
  onAddToCombat(character: CharacterSheet): void;
  onOpenCompanions(characterId: string): void;
  selectCharacter(id: string): void;
}) {
  const visibleAlerts = filteredCharacters.filter((character) => getCharacterAlertData(character).isAlert).length;
  const highInstability = characters.filter((character) => getCharacterAlertData(character).highInstability).length;
  const absentCount = characters.filter((character) => getCharacterAlertData(character).isAbsent).length;
  const focusCount = characters.filter((character) => getCharacterAlertData(character).isFocus).length;
  const companionOwners = characters.filter((character) => getCharacterAlertData(character).hasCompanions).length;
  const totalCompanions = characters.reduce((total, character) => total + getCharacterAlertData(character).companionCount, 0);
  const previousSnapshotRef = useRef<Map<string, MasterSnapshotEntry> | null>(null);
  const snapshotSignature = useMemo(() => JSON.stringify(characters.map(snapshotCharacterForLog)), [characters]);

  useEffect(() => {
    const nextSnapshot = cloneMasterSnapshot(characters);
    const previousSnapshot = previousSnapshotRef.current;
    if (previousSnapshot) {
      const entries = diffMasterSnapshots(previousSnapshot, nextSnapshot);
      if (entries.length) {
        onAddLogEntries(entries);
      }
    }
    previousSnapshotRef.current = nextSnapshot;
  }, [characters, snapshotSignature]);

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Panorama da sessao</h2>
            <p className="mt-1 text-sm text-textMuted">Busca rapida, filtros e sinais de alerta para acompanhar a rodada.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{filteredCharacters.length}/{characters.length} visiveis</Badge>
            <Badge>{visibleAlerts} alertas</Badge>
          </div>
        </div>
        <FilterRow search={search} quickFilter={quickFilter} setSearch={setSearch} setQuickFilter={setQuickFilter} />
        <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
          <OverviewCard label="Painel atual" value={filteredCharacters.length} helper="Fichas batendo com a busca e o filtro rapido." />
          <OverviewCard label="Alertas" value={visibleAlerts} helper="Ausentes, instabilidade alta ou recursos em zona de risco." />
          <OverviewCard label="Instabilidade alta" value={highInstability} helper="Personagens em 4+ ou marcados como instaveis." />
          <OverviewCard label="Entidades ativas" value={totalCompanions} helper={`${companionOwners} fichas com mini-fichas abertas na sessao.`} />
          <OverviewCard label="Sessao" value={absentCount} helper={`Ausentes agora. ${focusCount} personagem(ns) estao marcados em foco.`} />
        </div>
      </Card>

      <MasterActivityLog entries={logEntries} onClear={onClearLog} />

      <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
        {filteredCharacters.map((character) => (
          <MasterQuickCard
            character={character}
            combatants={combatants}
            key={character.id}
            onAddToCombat={() => onAddToCombat(character)}
            onEdit={() => selectCharacter(character.id)}
            onOpenCompanions={() => onOpenCompanions(character.id)}
          />
        ))}
        {!filteredCharacters.length ? <Card>Nenhuma ficha encontrada para os filtros atuais.</Card> : null}
      </section>
    </>
  );
}

function OmnivitaCodesPanel({
  character,
  codes,
  saving,
  masterControlEnabled,
  onSave,
  onRevokeMasterControl
}: {
  character: CharacterSheet | null;
  codes: OmnivitaCodeConfig;
  saving: boolean;
  masterControlEnabled: boolean;
  onSave(codes: OmnivitaCodeConfig): void;
  onRevokeMasterControl(): void;
}) {
  const [draft, setDraft] = useState<OmnivitaCodeConfig>(() => normalizeOmnivitaCodeConfig(codes));
  const forms = useMemo(
    () => (character?.companions || []).filter(isCompanionForm),
    [character]
  );
  const hiddenForms = useMemo(
    () => forms.filter(isCompanionHidden),
    [forms]
  );
  const savedSignature = JSON.stringify(codes);
  const draftSignature = JSON.stringify(draft);
  const hasChanges = savedSignature !== draftSignature;

  useEffect(() => {
    setDraft(normalizeOmnivitaCodeConfig(codes));
  }, [savedSignature, character?.id]);

  function patchMasterControl(patch: Partial<OmnivitaCodeConfig['masterControl']>) {
    setDraft((current) => ({
      ...current,
      masterControl: {
        ...current.masterControl,
        ...patch
      }
    }));
  }

  function patchUnlockCode(codeId: string, patch: Partial<OmnivitaCodeConfig['unlockCodes'][number]>) {
    setDraft((current) => ({
      ...current,
      unlockCodes: current.unlockCodes.map((entry) => (
        entry.id === codeId ? { ...entry, ...patch } : entry
      ))
    }));
  }

  function appendMasterControlStep(direction: OmnivitaSecretDirection) {
    patchMasterControl({ sequence: [...draft.masterControl.sequence, direction] });
  }

  function removeMasterControlStep() {
    patchMasterControl({ sequence: draft.masterControl.sequence.slice(0, -1) });
  }

  function clearMasterControlSequence() {
    patchMasterControl({ sequence: [] });
  }

  function appendUnlockCodeStep(codeId: string, direction: OmnivitaSecretDirection) {
    const entry = draft.unlockCodes.find((item) => item.id === codeId);
    if (!entry) return;
    patchUnlockCode(codeId, { sequence: [...entry.sequence, direction] });
  }

  function removeUnlockCodeStep(codeId: string) {
    const entry = draft.unlockCodes.find((item) => item.id === codeId);
    if (!entry) return;
    patchUnlockCode(codeId, { sequence: entry.sequence.slice(0, -1) });
  }

  function clearUnlockCodeSequence(codeId: string) {
    patchUnlockCode(codeId, { sequence: [] });
  }

  function addUnlockCode() {
    setDraft((current) => ({
      ...current,
      unlockCodes: [
        ...current.unlockCodes,
        createOmnivitaUnlockCode({
          targetCompanionId: hiddenForms[0]?.id || ''
        })
      ]
    }));
  }

  function removeUnlockCode(codeId: string) {
    setDraft((current) => ({
      ...current,
      unlockCodes: current.unlockCodes.filter((entry) => entry.id !== codeId)
    }));
  }

  function getFormLabel(companionId: string) {
    const form = forms.find((entry) => entry.id === companionId);
    if (!form) return 'Forma nao encontrada';
    return `${form.name || 'Forma'}${isCompanionHidden(form) ? ' · Oculta' : ' · Publicada'}`;
  }

  function getUnlockTargetOptions(targetCompanionId: string) {
    const selectedForm = forms.find((entry) => entry.id === targetCompanionId) || null;
    if (!selectedForm) return hiddenForms;
    if (hiddenForms.some((entry) => entry.id === selectedForm.id)) return hiddenForms;
    return [selectedForm, ...hiddenForms];
  }

  function isUnlockTargetHidden(targetCompanionId: string) {
    const targetForm = forms.find((entry) => entry.id === targetCompanionId) || null;
    return targetForm ? isCompanionHidden(targetForm) : false;
  }

  if (!character) {
    return <Card>Cael nao foi encontrado nas fichas atuais.</Card>;
  }

  return (
    <div className="grid gap-4">
      <Card className="border-vita/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">OmniVita // Codigos</h2>
            <p className="mt-1 text-sm text-textMuted">Sequencias ocultas do Cael, liberacoes de forma e trava por estado da manifestacao.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Cael</Badge>
            <Badge tone={masterControlEnabled ? 'accent' : 'neutral'}>
              {masterControlEnabled ? 'Controle mestre ativo' : 'Controle mestre desligado'}
            </Badge>
            <Button type="button" disabled={!masterControlEnabled || saving} onClick={onRevokeMasterControl}>
              Remover controle mestre
            </Button>
            <Button tone="primary" type="button" disabled={saving || !hasChanges} onClick={() => onSave(draft)}>
              {saving ? 'Salvando...' : 'Salvar codigos'}
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-white/5 p-4 text-sm text-textMuted">
          Estados validos: <strong className="text-textMain">Parcial</strong> &gt; <strong className="text-textMain">Completa</strong> &gt; <strong className="text-textMain">Alem</strong>.
          Se um codigo exigir <strong className="text-textMain">Completa</strong>, o estado <strong className="text-textMain">Alem</strong> tambem libera.
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">Controle mestre</span>
            <h3 className="mt-1 text-xl font-black">Funcao fixa</h3>
            <p className="mt-1 text-sm text-textMuted">Libera mini-fichas ocultas, troca livre entre formas e remove a recarga.</p>
          </div>
          <Badge>{formatOmnivitaSequence(draft.masterControl.sequence)}</Badge>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-lg border border-line bg-white/5 p-4">
            <span className="text-sm font-semibold text-textMuted">Sequencia</span>
            <div className="mt-3 flex min-h-[44px] flex-wrap gap-2 rounded-lg border border-line bg-black/20 p-3">
              {draft.masterControl.sequence.length ? draft.masterControl.sequence.map((step, index) => (
                <Badge key={`master-step-${step}-${index}`} tone={step === 'up' ? 'accent' : 'warn'}>
                  {step === 'up' ? 'Cima' : 'Baixo'}
                </Badge>
              )) : <span className="text-sm text-textMuted">Sem passos definidos.</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => appendMasterControlStep('up')}>+ Cima</Button>
              <Button type="button" onClick={() => appendMasterControlStep('down')}>+ Baixo</Button>
              <Button type="button" onClick={removeMasterControlStep}>Apagar ultimo</Button>
              <Button type="button" onClick={clearMasterControlSequence}>Limpar</Button>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-textMuted">Estado minimo</span>
            <select
              className={fieldClass}
              value={draft.masterControl.requiredState}
              onChange={(event) => patchMasterControl({ requiredState: event.target.value as OmnivitaManifestationState })}
            >
              {OMNIVITA_MANIFESTATION_STATES.map((state) => (
                <option key={`master-state-${state}`} value={state}>{state}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.08em] text-violet">Desbloqueios</span>
            <h3 className="mt-1 text-xl font-black">Formas ocultas</h3>
            <p className="mt-1 text-sm text-textMuted">Cada codigo pode liberar uma forma especifica e obedecer ao estado minimo da manifestacao.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{hiddenForms.length} forma(s) oculta(s)</Badge>
            <Button type="button" onClick={addUnlockCode}>Adicionar codigo</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {draft.unlockCodes.length ? draft.unlockCodes.map((entry) => (
            <article className="grid gap-4 rounded-lg border border-line bg-white/5 p-4" key={entry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-2 md:min-w-[280px] md:flex-1">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-textMuted">Nome interno</span>
                    <input
                      className={fieldClass}
                      placeholder="Codigo de desbloqueio"
                      value={entry.name}
                      onChange={(event) => patchUnlockCode(entry.id, { name: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-textMuted">Forma vinculada</span>
                    <select
                      className={fieldClass}
                      value={entry.targetCompanionId}
                      onChange={(event) => patchUnlockCode(entry.id, { targetCompanionId: event.target.value })}
                    >
                      {!hiddenForms.length && !entry.targetCompanionId ? <option value="">Nenhuma forma oculta encontrada</option> : null}
                      {getUnlockTargetOptions(entry.targetCompanionId).map((form) => (
                        <option key={`unlock-form-${form.id}`} value={form.id}>
                          {getFormLabel(form.id)}
                        </option>
                      ))}
                    </select>
                    <span className={`text-xs ${entry.targetCompanionId && !isUnlockTargetHidden(entry.targetCompanionId) ? 'text-amber' : 'text-textMuted'}`}>
                      {entry.targetCompanionId
                        ? isUnlockTargetHidden(entry.targetCompanionId)
                          ? 'Esse codigo revela essa forma para o Cael quando a sequencia bater.'
                          : 'Essa forma ja esta publicada. O codigo vai bater, mas nao libera nada novo ate ela voltar a ficar oculta.'
                        : 'So formas ocultas entram como desbloqueio.'}
                    </span>
                  </label>
                </div>
                <div className="grid gap-2 md:w-[220px]">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-textMuted">Estado minimo</span>
                    <select
                      className={fieldClass}
                      value={entry.requiredState}
                      onChange={(event) => patchUnlockCode(entry.id, { requiredState: event.target.value as OmnivitaManifestationState })}
                    >
                      {OMNIVITA_MANIFESTATION_STATES.map((state) => (
                        <option key={`${entry.id}-state-${state}`} value={state}>{state}</option>
                      ))}
                    </select>
                  </label>
                  <Button tone="danger" type="button" onClick={() => removeUnlockCode(entry.id)}>
                    Remover codigo
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-textMuted">Sequencia</span>
                  <Badge>{formatOmnivitaSequence(entry.sequence)}</Badge>
                </div>
                <div className="mt-3 flex min-h-[44px] flex-wrap gap-2 rounded-lg border border-line bg-white/[0.04] p-3">
                  {entry.sequence.length ? entry.sequence.map((step, index) => (
                    <Badge key={`${entry.id}-${step}-${index}`} tone={step === 'up' ? 'accent' : 'warn'}>
                      {step === 'up' ? 'Cima' : 'Baixo'}
                    </Badge>
                  )) : <span className="text-sm text-textMuted">Sem passos definidos.</span>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => appendUnlockCodeStep(entry.id, 'up')}>+ Cima</Button>
                  <Button type="button" onClick={() => appendUnlockCodeStep(entry.id, 'down')}>+ Baixo</Button>
                  <Button type="button" onClick={() => removeUnlockCodeStep(entry.id)}>Apagar ultimo</Button>
                  <Button type="button" onClick={() => clearUnlockCodeSequence(entry.id)}>Limpar</Button>
                </div>
              </div>
            </article>
          )) : (
            <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">
              Nenhum codigo de desbloqueio criado ainda.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function MasterActivityLog({ entries, onClear }: { entries: MasterLogEntry[]; onClear(): void }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Log da campanha</h2>
          <p className="mt-1 text-sm text-textMuted">Registro persistente de ficha, combate e acoes do mestre.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{entries.length} registro(s)</Badge>
          <Button type="button" onClick={onClear}>Limpar log</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {entries.length ? entries.map((entry, index) => (
          <article className="rounded-lg border border-line bg-white/5 p-3" key={`${entry.time}-${entry.name}-${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{entry.name}</strong>
                {entry.category ? <Badge>{getLogCategoryLabel(entry.category)}</Badge> : null}
              </div>
              <span className="text-sm text-textMuted">{entry.time}</span>
            </div>
            <p className="mt-2 text-sm text-textMuted">{entry.message}</p>
          </article>
        )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma mudanca detectada ainda.</p>}
      </div>
    </Card>
  );
}

function CombatActivityLog({ entries }: { entries: MasterLogEntry[] }) {
  return (
    <section className="mt-4 rounded-lg border border-line bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black">Linha do tempo do combate</h3>
          <p className="mt-1 text-sm text-textMuted">Dano, cura, turno, status e entradas recentes da cena.</p>
        </div>
        <Badge>{entries.length} evento(s)</Badge>
      </div>
      <div className="mt-3 grid gap-2">
        {entries.length ? entries.map((entry) => {
          const details = entry.details || {};
          const action = String(details.action || '');
          const round = details.round ? `Rodada ${details.round}` : '';
          return (
            <article className={clsx('rounded-lg border p-3', getCombatLogCardClass(action))} key={entry.id || `${entry.createdAt}-${entry.name}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <strong className="truncate">{entry.name}</strong>
                  {action ? <Badge>{getCombatActionLabel(action)}</Badge> : null}
                  {round ? <Badge>{round}</Badge> : null}
                </div>
                <span className="text-sm text-textMuted">{entry.time}</span>
              </div>
              <p className="mt-2 text-sm text-textMuted">{entry.message}</p>
              {hasCombatLogDetails(details) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {details.before !== undefined && details.after !== undefined ? <Badge>{String(details.before)}{' -> '}{String(details.after)}</Badge> : null}
                  {details.delta !== undefined ? <Badge>{Number(details.delta) > 0 ? '+' : ''}{String(details.delta)}</Badge> : null}
                  {details.status ? <Badge>Status {String(details.status)}</Badge> : null}
                  {details.type ? <Badge>{getCombatLogTypeLabel(details.type)}</Badge> : null}
                  {details.owner ? <Badge>{String(details.owner)}</Badge> : null}
                </div>
              ) : null}
            </article>
          );
        }) : <p className="rounded-lg border border-dashed border-line bg-black/20 px-3 py-4 text-sm text-textMuted">Nenhum evento de combate registrado ainda.</p>}
      </div>
    </section>
  );
}

function hasCombatLogDetails(details: Record<string, unknown>) {
  return ['before', 'after', 'delta', 'status', 'type', 'owner'].some((key) => details[key] !== undefined && details[key] !== '');
}

function getCombatActionLabel(action: string) {
  return {
    dano: 'Dano',
    cura: 'Cura',
    turno: 'Turno',
    status: 'Status',
    derrotado: 'Derrotado',
    entrada: 'Entrada',
    saida: 'Saida',
    ordenar: 'Ordem',
    limpar: 'Limpo',
    'reset-global': 'Reset',
    'definir-turno': 'Turno',
    imagem: 'Imagem',
    'imagem-removida': 'Imagem'
  }[action] || action;
}

function getCombatLogTypeLabel(type: unknown) {
  const normalized = String(type || '');
  return {
    character: 'Player',
    player: 'Player',
    companion: 'Mini-ficha',
    enemy: 'Inimigo'
  }[normalized] || normalized;
}

function getCombatLogCardClass(action: string) {
  if (action === 'dano' || action === 'derrotado') return 'border-coral/30 bg-coral/10';
  if (action === 'cura') return 'border-vita/30 bg-vita/10';
  if (action === 'turno' || action === 'definir-turno') return 'border-blue-400/30 bg-blue-400/10';
  if (action === 'status') return 'border-amber/30 bg-amber/10';
  return 'border-line bg-black/20';
}

function OverviewCard({ label, value, helper }: { label: string; value: ReactNode; helper: string }) {
  return (
    <article className="grid gap-2 rounded-lg border border-line bg-white/5 p-4">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{label}</span>
      <strong className="text-3xl font-black">{value}</strong>
      <p className="text-sm text-textMuted">{helper}</p>
    </article>
  );
}

function LibrariesPanel({
  libraries,
  saving,
  onSave
}: {
  libraries: MasterLibrariesState;
  saving: boolean;
  onSave(libraries: MasterLibrariesState): void;
}) {
  const normalized = normalizeMasterLibraries(libraries);
  const [activeKind, setActiveKind] = useState<MasterLibraryKind>('npcs');
  const [editingId, setEditingId] = useState('');
  const [draft, setDraft] = useState<MasterLibraryEntry>(() => createMasterLibraryEntry('npcs'));
  const activeGroup = MASTER_LIBRARY_GROUPS.find((group) => group.key === activeKind) || MASTER_LIBRARY_GROUPS[0];
  const entries = normalized[activeKind] || [];
  const editing = entries.find((entry) => entry.id === editingId) || null;

  useEffect(() => {
    setEditingId('');
    setDraft(createMasterLibraryEntry(activeKind));
  }, [activeKind]);

  function patchDraft(patch: Partial<MasterLibraryEntry>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function editEntry(entry: MasterLibraryEntry) {
    setEditingId(entry.id);
    setDraft(hydrateMasterLibraryEntry(entry, activeKind));
  }

  function resetDraft() {
    setEditingId('');
    setDraft(createMasterLibraryEntry(activeKind));
  }

  function saveEntry() {
    const safeEntry = hydrateMasterLibraryEntry({
      ...draft,
      id: editingId || draft.id,
      updatedAt: new Date().toISOString()
    }, activeKind);
    if (!safeEntry.title.trim()) return;
    const nextEntries = editing
      ? entries.map((entry) => entry.id === editing.id ? safeEntry : entry)
      : [safeEntry, ...entries];
    onSave({
      ...normalized,
      [activeKind]: nextEntries
    });
    resetDraft();
  }

  function deleteEntry(entryId: string) {
    onSave({
      ...normalized,
      [activeKind]: entries.filter((entry) => entry.id !== entryId)
    });
    if (editingId === entryId) resetDraft();
  }

  return (
    <div className="grid gap-3 md:gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Bibliotecas do mestre</h2>
            <p className="mt-1 text-sm text-textMuted">NPCs, locais, itens, pistas e modelos salvos no banco local da campanha.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{countMasterLibraries(normalized)} registro(s)</Badge>
            {saving ? <Badge tone="warn">Salvando</Badge> : <Badge tone="good">Persistido</Badge>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {MASTER_LIBRARY_GROUPS.map((group) => (
            <Button
              key={group.key}
              type="button"
              tone={activeKind === group.key ? 'primary' : 'secondary'}
              onClick={() => setActiveKind(group.key)}
            >
              {group.label} ({normalized[group.key].length})
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1fr)]">
        <Card>
          <div>
            <h3 className="text-lg font-black">{editing ? `Editar ${activeGroup.singular}` : `Novo ${activeGroup.singular}`}</h3>
            <p className="mt-1 text-sm text-textMuted">{activeGroup.helper}</p>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Titulo</span>
              <input className={fieldClass} value={draft.title} onChange={(event) => patchDraft({ title: event.target.value })} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Tipo</span>
              <input className={fieldClass} placeholder={activeGroup.singular} value={draft.type} onChange={(event) => patchDraft({ type: event.target.value })} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Resumo</span>
              <textarea className={`${fieldClass} min-h-24`} value={draft.summary} onChange={(event) => patchDraft({ summary: event.target.value })} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Tags</span>
              <input className={fieldClass} placeholder="separe por virgula" value={draft.tags} onChange={(event) => patchDraft({ tags: event.target.value })} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Notas</span>
              <textarea className={`${fieldClass} min-h-28`} value={draft.notes} onChange={(event) => patchDraft({ notes: event.target.value })} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" tone="primary" disabled={!draft.title.trim() || saving} onClick={saveEntry}>{editing ? 'Salvar alteracoes' : 'Adicionar'}</Button>
              <Button type="button" disabled={saving} onClick={resetDraft}>Novo em branco</Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">{activeGroup.label}</h3>
              <p className="mt-1 text-sm text-textMuted">{entries.length ? 'Clique em um item para editar.' : 'Nada salvo nessa biblioteca ainda.'}</p>
            </div>
            <Badge>{entries.length} item(ns)</Badge>
          </div>
          <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {entries.length ? entries.map((entry) => (
              <article className="grid min-w-0 gap-3 rounded-lg border border-line bg-white/5 p-3" key={entry.id}>
                <div className="min-w-0">
                  <strong className="block break-words">{entry.title || 'Sem titulo'}</strong>
                  <p className="mt-1 text-sm text-textMuted">{entry.type || activeGroup.singular}</p>
                </div>
                {entry.summary ? <p className="line-clamp-4 text-sm text-textMuted">{entry.summary}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {entry.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 4).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => editEntry(entry)}>Editar</Button>
                  <Button type="button" tone="danger" onClick={() => deleteEntry(entry.id)}>Excluir</Button>
                </div>
              </article>
            )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Crie o primeiro registro no formulario ao lado.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabletopPrototypePanel({
  characters,
  combatants
}: {
  characters: CharacterSheet[];
  combatants: CombatantDraft[];
}) {
  const [selectedAsset, setSelectedAsset] = useState('Arvore');
  const [selectedLayer, setSelectedLayer] = useState('Objetos');
  const selectedCombatants = combatants.slice(0, 4);
  const selectedCharacters = characters.slice(0, 4);
  const previewTokens = buildTabletopPreviewTokens(selectedCharacters, selectedCombatants);
  const rows = 14;
  const cols = 22;

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge tone="accent">PROTOTIPO DO MESTRE</Badge>
            <h2 className="mt-3 text-2xl font-black">Mesa modular</h2>
            <p className="mt-2 max-w-3xl text-sm text-textMuted">
              Editor pixelado para montar mapas por pecas, posicionar tokens, objetos, NPCs e preparar cenas antes de publicar para os jogadores.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Somente mestre</Badge>
            <Badge tone="warn">Preview visual</Badge>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="self-start">
          <div>
            <h3 className="text-lg font-black">Assets</h3>
            <p className="mt-1 text-sm text-textMuted">Pecas separadas para montar mundo, props e cena.</p>
          </div>

          <div className="mt-4 grid gap-2">
            {TABLETOP_ASSETS.map((asset) => (
              <button
                className={clsx(
                  'flex min-h-12 items-center gap-3 rounded-lg border px-3 text-left transition',
                  selectedAsset === asset.name ? 'border-vita/60 bg-vita/20 text-textMain' : 'border-line bg-white/5 text-textMuted hover:border-vita/30 hover:bg-white/10'
                )}
                key={asset.name}
                type="button"
                onClick={() => setSelectedAsset(asset.name)}
              >
                <span className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-md border border-black/30 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.06)]', asset.swatch)} />
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{asset.name}</strong>
                  <span className="block truncate text-xs">{asset.kind}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">Mapa de teste</h3>
              <p className="mt-1 text-sm text-textMuted">Composicao top-down: terreno, caminho, agua, predios, props e tokens.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{cols} x {rows}</Badge>
              <Badge>{selectedLayer}</Badge>
              <Badge>{selectedAsset}</Badge>
            </div>
          </div>

          <div className="mt-4 overflow-auto rounded-lg border border-line bg-black/40 p-3">
            <div
              className="relative grid min-w-[760px] overflow-hidden rounded-lg border border-black/50 bg-black shadow-[0_18px_80px_rgba(0,0,0,0.45)] [image-rendering:pixelated]"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: rows * cols }).map((_, index) => {
                const row = Math.floor(index / cols);
                const col = index % cols;
                const tile = getTabletopPrototypeTile(row, col);
                const object = TABLETOP_OBJECTS.find((entry) => entry.row === row && entry.col === col);
                const token = previewTokens.find((entry) => entry.row === row && entry.col === col);

                return (
                  <div
                    className={clsx(
                      'relative aspect-square min-h-8 overflow-hidden border border-black/10',
                      TABLETOP_TILE_CLASSES[tile]
                    )}
                    key={`${row}-${col}`}
                  >
                    <span className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(45deg,rgba(255,255,255,.45)_25%,transparent_25%),linear-gradient(-45deg,rgba(0,0,0,.35)_25%,transparent_25%)] [background-position:0_0,8px_8px] [background-size:16px_16px]" />
                    {object ? <TabletopPixelObject kind={object.kind} label={object.label} /> : null}
                    {token ? <TabletopPixelToken token={token} /> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <TabletopStat title="Cena" value="Rua jardim" helper="Mapa editavel por grid e camadas." />
            <TabletopStat title="Tokens" value={previewTokens.length} helper="Players, formas, NPCs e inimigos." />
            <TabletopStat title="Assets" value={TABLETOP_ASSETS.length} helper="Tiles e props modulares." />
          </div>
        </Card>

        <Card className="self-start">
          <div>
            <h3 className="text-lg font-black">Camadas</h3>
            <p className="mt-1 text-sm text-textMuted">A ordem define o que fica travado, movel ou oculto.</p>
          </div>
          <div className="mt-4 grid gap-2">
            {TABLETOP_LAYERS.map((layer) => (
              <button
                className={clsx(
                  'rounded-lg border px-3 py-3 text-left transition',
                  selectedLayer === layer.name ? 'border-vita/60 bg-vita/20' : 'border-line bg-white/5 hover:border-vita/30 hover:bg-white/10'
                )}
                key={layer.name}
                type="button"
                onClick={() => setSelectedLayer(layer.name)}
              >
                <span className="flex items-center justify-between gap-3">
                  <strong>{layer.name}</strong>
                  <Badge tone={layer.status === 'Oculta' ? 'warn' : 'neutral'}>{layer.status}</Badge>
                </span>
                <span className="mt-1 block text-sm text-textMuted">{layer.helper}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black">Plano da Mesa</h3>
            <p className="mt-1 text-sm text-textMuted">Primeiro nasce no mestre. Depois entra sync e permissao dos players.</p>
          </div>
          <Badge tone="accent">Roteiro</Badge>
        </div>

        <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
          {TABLETOP_PLAN.map((item, index) => (
            <article className="rounded-lg border border-line bg-white/5 p-4" key={item.title}>
              <Badge>{String(index + 1).padStart(2, '0')}</Badge>
              <h4 className="mt-3 font-black">{item.title}</h4>
              <p className="mt-2 text-sm text-textMuted">{item.text}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

type TabletopTile = 'grass' | 'deepGrass' | 'path' | 'stone' | 'water' | 'floor' | 'roof' | 'void';
type TabletopObjectKind = 'tree' | 'bush' | 'fence' | 'flower' | 'rock' | 'building' | 'waterProp' | 'anomaly';
type TabletopPreviewToken = { id: string; name: string; image: string; type: string; row: number; col: number; tone: 'player' | 'npc' | 'enemy' };

const TABLETOP_TILE_CLASSES: Record<TabletopTile, string> = {
  grass: 'bg-[#4aa86b]',
  deepGrass: 'bg-[#2f7a45]',
  path: 'bg-[#d6ba79]',
  stone: 'bg-[#b5bac8]',
  water: 'bg-[#5aa3cf]',
  floor: 'bg-[#af8f6a]',
  roof: 'bg-[#c36b78]',
  void: 'bg-[#15121d]'
};

const TABLETOP_ASSETS = [
  { name: 'Grama', kind: 'Tile', swatch: 'bg-[#4aa86b]' },
  { name: 'Caminho', kind: 'Tile', swatch: 'bg-[#d6ba79]' },
  { name: 'Agua', kind: 'Tile', swatch: 'bg-[#5aa3cf]' },
  { name: 'Arvore', kind: 'Prop', swatch: 'bg-[#2f7a45]' },
  { name: 'Cerca', kind: 'Prop', swatch: 'bg-[#b77854]' },
  { name: 'Casa', kind: 'Estrutura', swatch: 'bg-[#c36b78]' },
  { name: 'NPC', kind: 'Token', swatch: 'bg-[#f3b06e]' },
  { name: 'Objeto', kind: 'Movel', swatch: 'bg-[#b5bac8]' },
  { name: 'Anomalia', kind: 'Efeito', swatch: 'bg-vita' }
];

const TABLETOP_LAYERS = [
  { name: 'Terreno', status: 'Travada', helper: 'Chao, agua, ruas e base do mapa.' },
  { name: 'Objetos', status: 'Editavel', helper: 'Arvores, cercas, casas, portas e props.' },
  { name: 'Tokens', status: 'Movel', helper: 'Players, formas, inimigos e NPCs.' },
  { name: 'Ocultos', status: 'Oculta', helper: 'Coisas preparadas para revelar na hora.' },
  { name: 'Efeitos', status: 'Editavel', helper: 'Areas, anomalias, luz, fumaca e marcadores.' }
];

const TABLETOP_OBJECTS: Array<{ row: number; col: number; kind: TabletopObjectKind; label: string }> = [
  { row: 1, col: 1, kind: 'tree', label: 'Arvore' },
  { row: 1, col: 2, kind: 'tree', label: 'Arvore' },
  { row: 1, col: 14, kind: 'tree', label: 'Arvore' },
  { row: 1, col: 15, kind: 'tree', label: 'Arvore' },
  { row: 2, col: 7, kind: 'waterProp', label: 'Lago' },
  { row: 2, col: 17, kind: 'flower', label: 'Flor' },
  { row: 3, col: 10, kind: 'building', label: 'Casa' },
  { row: 3, col: 18, kind: 'building', label: 'Loja' },
  { row: 4, col: 5, kind: 'rock', label: 'Rocha' },
  { row: 5, col: 8, kind: 'fence', label: 'Cerca' },
  { row: 5, col: 9, kind: 'fence', label: 'Cerca' },
  { row: 5, col: 14, kind: 'fence', label: 'Cerca' },
  { row: 8, col: 3, kind: 'bush', label: 'Moita' },
  { row: 9, col: 16, kind: 'anomaly', label: 'Fenda' },
  { row: 10, col: 7, kind: 'tree', label: 'Arvore' },
  { row: 11, col: 8, kind: 'tree', label: 'Arvore' }
];

const TABLETOP_PLAN = [
  { title: 'MVP do mestre', text: 'Criar, nomear e editar mapas com grid, pan, zoom e ferramentas de selecao.' },
  { title: 'Assets modulares', text: 'Importar tiles e props separados: terreno, agua, casas, decoracao, obstaculos e efeitos.' },
  { title: 'Tokens e NPCs', text: 'Posicionar players, formas, inimigos e NPCs como pecas moveis com imagem, nome e camada.' },
  { title: 'Persistencia', text: 'Salvar mundos e cenas em master-data, sem mexer no schema das fichas existentes.' },
  { title: 'Publicacao', text: 'Manter cena privada no mestre e publicar uma versao controlada para os jogadores depois.' },
  { title: 'Combate', text: 'Ligar tokens ao encontro ativo: vez atual, proximo, morrendo, morto, alcance e marcadores.' },
  { title: 'Ocultos', text: 'Camada de segredo para preparar NPCs, portas, armadilhas e anomalias antes de revelar.' },
  { title: 'Biblioteca', text: 'Guardar pacotes de assets por tema: cidade, floresta, laboratorio, esgoto, base e zonas anomalas.' }
];

function getTabletopPrototypeTile(row: number, col: number): TabletopTile {
  if (row < 1 || row > 12 || col < 1 || col > 20) return 'void';
  if ((row <= 2 && col <= 4) || (row >= 10 && col <= 5) || (row >= 9 && col >= 6 && col <= 9) || (row <= 2 && col >= 13 && col <= 16)) return 'deepGrass';
  if ((row >= 2 && row <= 4 && col >= 6 && col <= 8) || (row >= 2 && row <= 3 && col >= 2 && col <= 3)) return 'water';
  if ((row >= 6 && row <= 7 && col <= 11) || (col >= 12 && col <= 13 && row >= 5) || (row >= 6 && row <= 7 && col >= 12 && col <= 20)) return 'path';
  if (col >= 17 && row >= 2 && row <= 10) return 'stone';
  if (row >= 3 && row <= 5 && col >= 9 && col <= 11) return row === 3 ? 'roof' : 'floor';
  if (row >= 3 && row <= 5 && col >= 18 && col <= 19) return row === 3 ? 'roof' : 'floor';
  return 'grass';
}

function buildTabletopPreviewTokens(characters: CharacterSheet[], combatants: CombatantDraft[]): TabletopPreviewToken[] {
  const playerTokens = characters.slice(0, 3).map((character, index) => ({
    id: `character-${character.id || index}`,
    name: character.identity.name || `Player ${index + 1}`,
    image: character.identity.image || '',
    type: 'Player',
    row: [7, 8, 4][index] || 7,
    col: [11, 5, 10][index] || 10,
    tone: 'player' as const
  }));

  const combatTokens = combatants.slice(0, 2).map((combatant, index) => ({
    id: `combat-${combatant.instanceId || combatant.id || index}`,
    name: String(combatant.name || `NPC ${index + 1}`),
    image: String(combatant.image || ''),
    type: String(combatant.type || 'NPC'),
    row: [4, 9][index] || 4,
    col: [15, 18][index] || 15,
    tone: String(combatant.type || '').toLowerCase() === 'enemy' ? 'enemy' as const : 'npc' as const
  }));

  return [...playerTokens, ...combatTokens];
}

function TabletopPixelObject({ kind, label }: { kind: TabletopObjectKind; label: string }) {
  const classes: Record<TabletopObjectKind, string> = {
    tree: 'bg-[#2c7b38] before:bg-[#6f4a2c]',
    bush: 'bg-[#3d9a56] before:bg-[#2f7a45]',
    fence: 'bg-[#b77854] before:bg-[#f0b37f]',
    flower: 'bg-[#ff9ccf] before:bg-[#ffe082]',
    rock: 'bg-[#9da1ad] before:bg-[#686b78]',
    building: 'bg-[#c36b78] before:bg-[#f2c27a]',
    waterProp: 'bg-[#7fd3ff] before:bg-[#405bba]',
    anomaly: 'bg-vita before:bg-white'
  };

  return (
    <span
      aria-label={label}
      className={clsx(
        'absolute left-1/2 top-1/2 z-10 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-sm shadow-[inset_-4px_-4px_0_rgba(0,0,0,.25),inset_3px_3px_0_rgba(255,255,255,.16)] before:absolute before:bottom-0 before:left-1/2 before:h-[30%] before:w-[36%] before:-translate-x-1/2 before:rounded-sm',
        classes[kind]
      )}
      title={label}
    />
  );
}

function TabletopPixelToken({ token }: { token: TabletopPreviewToken }) {
  const initials = token.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
  const toneClass = {
    player: 'border-aqua bg-aqua/20 text-aqua',
    npc: 'border-amber bg-amber/20 text-amber',
    enemy: 'border-coral bg-coral/20 text-coral'
  }[token.tone];

  return (
    <span className={clsx('absolute inset-[12%] z-20 grid place-items-center overflow-hidden rounded-md border-2 shadow-[0_8px_18px_rgba(0,0,0,.45)]', toneClass)} title={`${token.name} - ${token.type}`}>
      {token.image ? <img className="h-full w-full object-cover [image-rendering:pixelated]" src={token.image} alt="" /> : <span className="text-xs font-black">{initials}</span>}
    </span>
  );
}

function TabletopStat({ title, value, helper }: { title: string; value: ReactNode; helper: string }) {
  return (
    <article className="rounded-lg border border-line bg-white/5 p-3">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{title}</span>
      <strong className="mt-2 block text-2xl font-black">{value}</strong>
      <p className="mt-1 text-sm text-textMuted">{helper}</p>
    </article>
  );
}

function ImportPreviewDialog({
  preview,
  importing,
  onCancel,
  onChangeOptions,
  onConfirm
}: {
  preview: ImportPreview;
  importing: boolean;
  onCancel(): void;
  onChangeOptions(options: ImportOptions): void;
  onConfirm(): void;
}) {
  const { summary, options } = preview;
  const libraryCount = summary.masterLibraries ? countMasterLibraries(summary.masterLibraries) : 0;
  const selectedCount = Object.values(options).filter(Boolean).length;
  const items = [
    { key: 'characters' as const, label: 'Fichas', available: summary.characters.length, detail: summary.characters.map((character) => character.identity.name || character.id).join(', ') },
    { key: 'scenarios' as const, label: 'Cenarios', available: summary.scenarios?.total || 0, detail: summary.scenarios ? `${summary.scenarios.scenarios} cenas, ${summary.scenarios.npcs} NPCs, ${summary.scenarios.events} eventos, ${summary.scenarios.clues} pistas` : '' },
    { key: 'enemyLibrary' as const, label: 'Biblioteca de inimigos', available: summary.enemyLibrary?.length || 0, detail: summary.enemyLibrary?.map((enemy) => enemy.name).join(', ') || '' },
    { key: 'masterLibraries' as const, label: 'Bibliotecas do mestre', available: libraryCount, detail: summary.masterLibraries ? MASTER_LIBRARY_GROUPS.map((group) => `${group.label}: ${summary.masterLibraries?.[group.key].length || 0}`).join(' | ') : '' },
    { key: 'sessionLog' as const, label: 'Log da campanha', available: summary.sessionLog?.length || 0, detail: summary.sessionLog ? `${summary.sessionLog.length} registro(s)` : '' },
    { key: 'combatState' as const, label: 'Encontro ativo', available: summary.combatState?.combatants.length || 0, detail: summary.combatState ? `Rodada ${summary.combatState.round}, ${summary.combatState.combatants.length} combatente(s)` : '' }
  ];

  function toggle(key: keyof ImportOptions, checked: boolean) {
    onChangeOptions({ ...options, [key]: checked });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-full max-w-3xl rounded-lg border border-line bg-panel p-4 shadow-soft md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Previa da importacao</h2>
            <p className="mt-1 text-sm text-textMuted">Escolha exatamente quais partes do backup entram no banco local.</p>
          </div>
          <Badge>{selectedCount} grupo(s) selecionado(s)</Badge>
        </div>

        <div className="mt-4 grid gap-3">
          {items.map((item) => {
            const disabled = item.available <= 0;
            return (
              <label className={disabled ? 'grid gap-2 rounded-lg border border-line bg-white/5 p-3 opacity-50' : 'grid gap-2 rounded-lg border border-line bg-white/5 p-3'} key={item.key}>
                <span className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-3 font-black">
                    <input
                      checked={Boolean(options[item.key])}
                      disabled={disabled || importing}
                      type="checkbox"
                      onChange={(event) => toggle(item.key, event.target.checked)}
                    />
                    {item.label}
                  </span>
                  <Badge>{item.available}</Badge>
                </span>
                {item.detail ? <span className="text-sm text-textMuted">{item.detail}</span> : <span className="text-sm text-textMuted">Nao encontrado nesse JSON.</span>}
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" disabled={importing} onClick={onCancel}>Cancelar</Button>
          <Button type="button" tone="primary" disabled={importing || selectedCount === 0} onClick={onConfirm}>
            {importing ? 'Importando...' : 'Importar selecionados'}
          </Button>
        </div>
      </section>
    </div>
  );
}

function PlayersPanel({
  characters,
  search,
  quickFilter,
  setSearch,
  setQuickFilter,
  onResourceChange,
  onNotesBlur,
  combatants,
  onAddToCombat,
  onOpenCompanions,
  selectCharacter
}: {
  characters: CharacterSheet[];
  search: string;
  quickFilter: QuickFilter;
  setSearch(value: string): void;
  setQuickFilter(value: QuickFilter): void;
  onResourceChange(character: CharacterSheet, key: 'pvCurrent' | 'peCurrent' | 'pdCurrent' | 'instability', value: number): void;
  onNotesBlur(character: CharacterSheet, notes: string): void;
  combatants: CombatantDraft[];
  onAddToCombat(character: CharacterSheet): void;
  onOpenCompanions(characterId: string): void;
  selectCharacter(id: string): void;
}) {
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Visao rapida</h2>
            <p className="mt-1 text-sm text-textMuted">Recursos editaveis e notas rapidas do mestre.</p>
          </div>
          <Badge>{characters.length} ficha(s)</Badge>
        </div>
        <FilterRow search={search} quickFilter={quickFilter} setSearch={setSearch} setQuickFilter={setQuickFilter} />
      </Card>
      <div className="grid gap-3">
        {characters.map((character) => (
          <PlayerDetailCard
            character={character}
            key={character.id}
            combatants={combatants}
            onAddToCombat={() => onAddToCombat(character)}
            onOpenCompanions={() => onOpenCompanions(character.id)}
            onResourceChange={onResourceChange}
            onNotesBlur={onNotesBlur}
            onEdit={() => selectCharacter(character.id)}
          />
        ))}
        {!characters.length ? <Card>Nenhuma ficha encontrada para os filtros atuais.</Card> : null}
      </div>
    </>
  );
}

function findCaelOmnivitaCharacter(characters: CharacterSheet[]) {
  return characters.find((character) => {
    const lookup = [
      character.ownerUsername,
      character.identity?.name,
      character.identity?.manifestationOrigin,
      character.manifestation?.origin,
      character.manifestation?.name
    ]
      .map((entry) => String(entry || '').trim().toLowerCase())
      .join(' ');

    return lookup.includes('cael') && lookup.includes('omnivita');
  }) || null;
}

function CombatPanel({
  combat,
  characters,
  visibleCharacters,
  enemyLibrary,
  logEntries,
  saving,
  onCharacterChange,
  onEnemyLibraryChange,
  onLog,
  onSaveCombat
}: {
  combat: CombatState | undefined;
  characters: CharacterSheet[];
  visibleCharacters: CharacterSheet[];
  enemyLibrary: EnemyRecord[];
  logEntries: MasterLogEntry[];
  saving: boolean;
  onCharacterChange(character: CharacterSheet): void;
  onEnemyLibraryChange(library: EnemyRecord[]): void;
  onLog(entry: MasterLogEntry): void;
  onSaveCombat(state: CombatState): void;
}) {
  const state = hydrateMasterCombatState(combat);
  const combatants = state.combatants as CombatantDraft[];
  const livingEntries = getLivingCombatants(combatants);
  const rawCurrentTurnEntry = combatants.find((entry) => entry.instanceId === state.currentInstanceId) || null;
  const currentTurnEntry = rawCurrentTurnEntry && isLivingCombatantDraft(rawCurrentTurnEntry) ? rawCurrentTurnEntry : livingEntries[0] || null;
  const currentTurnIndex = currentTurnEntry ? livingEntries.findIndex((entry) => entry.instanceId === currentTurnEntry.instanceId) : -1;
  const nextTurnEntry = currentTurnIndex >= 0 && livingEntries.length > 1 ? livingEntries[(currentTurnIndex + 1) % livingEntries.length] : null;
  const totalPv = combatants.reduce((sum, entry) => sum + Number(entry.pvCurrent || 0), 0);
  const typeCounts = combatants.reduce((accumulator, entry) => {
    accumulator[entry.combatantType] = Number(accumulator[entry.combatantType] || 0) + 1;
    return accumulator;
  }, { character: 0, companion: 0, enemy: 0 } as Record<string, number>);
  const combatLogEntries = logEntries.filter((entry) => String(entry.category || '') === 'combate').slice(0, 10);
  const [activeEnemy, setActiveEnemy] = useState<EnemyRecord | null>(null);
  const [message, setMessage] = useState('');
  const [pvAdjustDrafts, setPvAdjustDrafts] = useState<Record<string, string>>({});
  const [plannerState, setPlannerState] = useState(() => loadEncounterPlannerState());
  const generatorType = plannerState.type;
  const generatorPressure = plannerState.pressure;
  const selectedParticipantIds = plannerState.selectedIds;
  const supportCompanionEntries = visibleCharacters.flatMap((character) => (
    character.companions
      .filter((companion) => !isCompanionHidden(companion) && !isCompanionForm(companion))
      .map((companion) => ({ character, companion }))
  ));
  const selectedParticipants = characters.filter((character) => selectedParticipantIds.includes(character.id));
  const encounterBlueprint = buildEncounterBlueprint(selectedParticipants, generatorType, generatorPressure);
  const encounterSuggestions = encounterBlueprint?.cards || [];

  useEffect(() => {
    if (!characters.length) return;
    setPlannerState((current) => {
      const validIds = new Set(characters.map((character) => character.id));
      const selectedIds = current.selectedIds.filter((id) => validIds.has(id));
      const presentIds = characters.filter((character) => !getCharacterAlertData(character).isAbsent).map((character) => character.id);
      const nextSelectedIds = selectedIds.length
        ? selectedIds
        : presentIds.length ? presentIds : characters.map((character) => character.id);
      if (arraysEqual(current.selectedIds, nextSelectedIds)) return current;
      const next = hydrateEncounterPlannerState({ ...current, selectedIds: nextSelectedIds });
      saveEncounterPlannerState(next);
      return next;
    });
  }, [characters]);

  function updateEncounterPlanner(nextPatch: Partial<EncounterPlannerState>) {
    setPlannerState((current) => {
      const next = hydrateEncounterPlannerState({ ...current, ...nextPatch });
      saveEncounterPlannerState(next);
      return next;
    });
  }

  function commitCombat(nextCombatants: CombatantDraft[], options: { currentInstanceId?: string; round?: number; message?: string; force?: boolean; logName?: string; details?: Record<string, unknown> } = {}) {
    const nextState = finalizeCombatState(nextCombatants, {
      currentInstanceId: options.currentInstanceId ?? state.currentInstanceId,
      round: options.round ?? state.round,
      forceActive: options.force
    });
    onSaveCombat(nextState);
    if (options.message) {
      setMessage(options.message);
      onLog(createMasterLogEntry({
        category: 'combate',
        name: options.logName || 'Combate',
        message: options.message,
        details: {
          round: nextState.round,
          actor: options.logName || '',
          ...options.details
        }
      }));
    }
  }

  function addCharactersBatch(nextCharacters: CharacterSheet[], statusMessage: string) {
    const drafts = nextCharacters
      .filter((character) => !hasSharedActorInEncounter(combatants, character.id))
      .map(buildCharacterCombatant);
    if (!drafts.length) {
      setMessage('Nenhum novo player foi adicionado');
      return;
    }
    commitCombat([...drafts, ...combatants], { message: statusMessage });
  }

  function addCharacter(characterId: string) {
    const character = characters.find((entry) => entry.id === characterId);
    if (!character) return;
    if (hasSharedActorInEncounter(combatants, character.id)) {
      setMessage('Esse player ja esta representado em cena por ele mesmo ou por uma forma');
      return;
    }
    commitCombat([buildCharacterCombatant(character), ...combatants], {
      message: `${character.identity.name || 'Player'} entrou em cena`,
      logName: character.identity.name || 'Player',
      details: { action: 'entrada', type: 'player' }
    });
  }

  function addCompanion(characterId: string, companionId: string) {
    const character = characters.find((entry) => entry.id === characterId);
    const companion = character?.companions.find((entry) => entry.id === companionId);
    if (!character || !companion) return;
    if (isCompanionHidden(companion)) {
      setMessage('Essa mini-ficha esta oculta. Publique antes de usar em cena.');
      return;
    }
    if (isCompanionForm(companion)) {
      setMessage('Formas sao controladas pelo jogador; quando ele transforma, a forma assume o lugar dele na iniciativa');
      return;
    }
    const draft = buildCompanionCombatant(character, companion, combatants);
    const sourceKey = getCombatantSourceKey(draft);

    if (sourceKey && combatants.some((entry) => getCombatantSourceKey(entry) === sourceKey)) {
      commitCombat(combatants, { message: 'Essa mini-ficha ja esta em cena', logName: companion.name || 'Mini-ficha', details: { action: 'entrada-bloqueada', type: 'companion' } });
      return;
    }

    commitCombat([draft, ...combatants], {
      message: `${companion.name || 'Mini-ficha'} entrou em cena`,
      logName: companion.name || 'Mini-ficha',
      details: { action: 'entrada', type: 'companion', owner: character.identity.name || '' }
    });
  }

  function addEnemy(enemy: EnemyRecord) {
    commitCombat([buildEnemyCombatant(enemy), ...combatants], {
      message: `${enemy.name || 'Inimigo'} entrou em cena`,
      logName: enemy.name || 'Inimigo',
      details: { action: 'entrada', type: 'enemy', role: enemy.role || '' }
    });
  }

  function updateCombatant(instanceId: string, updater: (entry: CombatantDraft) => CombatantDraft, options: { message?: string; logName?: string; details?: Record<string, unknown> } = {}) {
    const nextCombatants = combatants.map((entry) => {
      if (entry.instanceId !== instanceId) return entry;
      const nextEntry = hydrateCombatantDraft(updater(entry));
      syncCombatantToSourceSheet(nextEntry, characters, onCharacterChange);
      return nextEntry;
    });
    commitCombat(nextCombatants, { message: options.message, logName: options.logName, details: options.details });
  }

  function applyPvDelta(combatant: CombatantDraft, delta: number) {
    const before = Number(combatant.pvCurrent || 0);
    const after = clampNumber(before + delta, 0, Number(combatant.pvMax || 0));
    const label = delta < 0 ? `Dano ${Math.abs(delta)}` : `Cura ${delta}`;
    updateCombatant(combatant.instanceId, (entry) => ({
      ...entry,
      pvCurrent: after,
      status: normalizeStatusForPv(entry.status, after)
    }), {
      message: `${combatant.name}: ${label} (${before} -> ${after})`,
      logName: combatant.name,
      details: {
        action: delta < 0 ? 'dano' : 'cura',
        delta,
        before,
        after,
        type: combatant.combatantType
      }
    });
  }

  function applyCustomPvAdjustment(combatant: CombatantDraft, direction: -1 | 1) {
    const amount = Math.abs(clampNumber(Number(pvAdjustDrafts[combatant.instanceId] || 0), 0, 9999));
    if (!amount) {
      setMessage('Informe um valor para dano ou cura');
      return;
    }
    applyPvDelta(combatant, amount * direction);
    setPvAdjustDrafts((current) => ({ ...current, [combatant.instanceId]: '' }));
  }

  function passTurn() {
    const orderedLiving = getLivingCombatants(sortCombatantsByInitiative(combatants));
    if (!orderedLiving.length) {
      setMessage('Nao ha combatentes ativos para passar a vez');
      return;
    }
    const currentIndex = orderedLiving.findIndex((entry) => entry.instanceId === state.currentInstanceId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % orderedLiving.length;
    const wrapped = currentIndex >= 0 && nextIndex === 0;
    const nextEntry = orderedLiving[nextIndex];
    commitCombat(combatants, {
      currentInstanceId: nextEntry.instanceId,
      round: Math.max(1, Number(state.round || 1)) + (wrapped ? 1 : 0),
      message: `Vez de ${nextEntry.name}`,
      logName: nextEntry.name,
      details: { action: 'turno', previous: orderedLiving[currentIndex]?.name || '', next: nextEntry.name, wrapped }
    });
  }

  function resetRound() {
    const firstEntry = getLivingCombatants(sortCombatantsByInitiative(combatants))[0] || null;
    commitCombat(combatants, {
      currentInstanceId: firstEntry?.instanceId || '',
      round: 1,
      message: firstEntry ? `Rodada reiniciada em ${firstEntry.name}` : 'Rodada reiniciada',
      logName: firstEntry?.name || 'Combate',
      details: { action: 'reiniciar-rodada', next: firstEntry?.name || '' }
    });
  }

  function sortEncounter() {
    commitCombat(combatants, { message: 'Encontro ordenado', details: { action: 'ordenar', total: combatants.length } });
  }

  function clearEncounter() {
    commitCombat([], { currentInstanceId: '', round: 1, force: true, message: 'Encontro limpo', details: { action: 'limpar', total: combatants.length } });
  }

  function hardResetCombat() {
    characters.forEach((character) => {
      onCharacterChange(hydrateCharacter({
        ...character,
        masterSession: {
          ...(character.masterSession || {}),
          combatShared: null,
          combatControl: null
        }
      }));
    });
    commitCombat([], { currentInstanceId: '', round: 1, force: true, message: 'Combate global resetado', details: { action: 'reset-global', total: combatants.length } });
  }

  function saveEnemy(enemy: EnemyRecord) {
    const safeEnemy = hydrateEnemyRecord({ ...enemy, updatedAt: new Date().toISOString() });
    const existingIndex = enemyLibrary.findIndex((entry) => entry.id === safeEnemy.id);
    const unitRecords = buildEnemyUnitRecords(safeEnemy);
    const nextLibrary = unitRecords.length > 1
      ? [...unitRecords, ...enemyLibrary.filter((entry) => entry.id !== safeEnemy.id)]
      : existingIndex >= 0
        ? enemyLibrary.map((entry) => entry.id === safeEnemy.id ? unitRecords[0] : entry)
        : [unitRecords[0], ...enemyLibrary];
    onEnemyLibraryChange(nextLibrary);
    setActiveEnemy(null);
    setMessage(unitRecords.length > 1 ? `${unitRecords.length} fichas criadas` : existingIndex >= 0 ? 'Ficha de inimigo salva' : 'Ficha de inimigo salva');
  }

  function duplicateEnemy(enemyId: string) {
    const enemy = enemyLibrary.find((entry) => entry.id === enemyId);
    if (!enemy) return;
    const duplicate = hydrateEnemyRecord({ ...enemy, id: createEnemyId(), name: `${enemy.name} copia`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    onEnemyLibraryChange([duplicate, ...enemyLibrary]);
    setActiveEnemy(duplicate);
    setMessage('Ficha duplicada');
  }

  function deleteEnemy(enemyId: string) {
    onEnemyLibraryChange(enemyLibrary.filter((entry) => entry.id !== enemyId));
    setMessage('Inimigo removido');
  }

  function openSuggestionAsEnemy(suggestion: EncounterCard) {
    if (!encounterBlueprint) return;
    setActiveEnemy(buildEnemyDraftFromEncounterCard(suggestion, encounterBlueprint));
  }

  async function copyEncounterBlock() {
    if (!encounterBlueprint?.block) return;
    try {
      await navigator.clipboard.writeText(encounterBlueprint.block);
      setMessage('Bloco copiado');
    } catch {
      setMessage('Nao consegui copiar. O bloco ficou disponivel abaixo.');
    }
  }

  return (
    <div className="grid gap-3 md:gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Gerador de inimigos</h2>
            <p className="mt-1 text-sm text-textMuted">Sugestoes de encontro baseadas nas fichas selecionadas, no nivel real do grupo e no ritmo do sistema.</p>
          </div>
          <Button type="button" disabled={!encounterBlueprint?.block} onClick={() => void copyEncounterBlock()}>Copiar bloco</Button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(280px,1fr)_minmax(320px,1.15fr)]">
          <article className="rounded-lg border border-line bg-white/5 p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-textMuted">Formato do encontro</span>
                <select className={fieldClass} value={generatorType} onChange={(event) => updateEncounterPlanner({ type: event.target.value })}>
                  <option value="swarm">Varios fracos</option>
                  <option value="skirmish">Grupo equilibrado</option>
                  <option value="elite">Elites</option>
                  <option value="boss">Boss</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-textMuted">Pressao</span>
                <select className={fieldClass} value={generatorPressure} onChange={(event) => updateEncounterPlanner({ pressure: event.target.value })}>
                  <option value="light">Leve</option>
                  <option value="balanced">Equilibrada</option>
                  <option value="heavy">Pesada</option>
                </select>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black">Participantes</h3>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => {
                  const presentIds = characters.filter((character) => !getCharacterAlertData(character).isAbsent).map((character) => character.id);
                  if (!presentIds.length) {
                    setMessage('Nenhuma ficha marcada como presente');
                    return;
                  }
                  updateEncounterPlanner({ selectedIds: presentIds });
                }}>Presentes</Button>
                <Button type="button" onClick={() => {
                  if (!visibleCharacters.length) {
                    setMessage('Nenhuma ficha visivel nos filtros');
                    return;
                  }
                  updateEncounterPlanner({ selectedIds: visibleCharacters.map((character) => character.id) });
                }}>Visiveis</Button>
                <Button type="button" onClick={() => updateEncounterPlanner({ selectedIds: characters.map((character) => character.id) })}>Todos</Button>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {characters.map((character) => {
                const checked = selectedParticipantIds.includes(character.id);
                return (
                  <button
                    className={checked
                      ? 'grid min-h-14 rounded-lg border border-vita/50 bg-vita/20 px-3 py-2 text-left text-sm'
                      : 'grid min-h-14 rounded-lg border border-line bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10'}
                    key={character.id}
                    type="button"
                    onClick={() => {
                      const nextIds = checked
                        ? selectedParticipantIds.filter((id) => id !== character.id)
                        : [...selectedParticipantIds, character.id];
                      updateEncounterPlanner({ selectedIds: nextIds.length ? nextIds : [character.id] });
                    }}
                  >
                    <strong>{character.identity.name || 'Sem nome'}</strong>
                    <span className="text-textMuted">{character.identity.className || 'Sem classe'} - Nv {Number(character.identity.level || 1)}</span>
                  </button>
                );
              })}
              {!characters.length ? <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma ficha carregada para usar como base.</p> : null}
            </div>
            <p className="mt-3 text-sm text-textMuted">As sugestoes usam PV, PE, PD, defesa, bloqueio e ofensiva media das fichas marcadas.</p>
          </article>

          <div className="grid content-start gap-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {encounterBlueprint ? (
                <>
                  <EncounterMetricCard label="Participantes" value={encounterBlueprint.metrics.count} helper={encounterBlueprint.metrics.participants.map((entry) => entry.name).join(', ')} />
                  <EncounterMetricCard label="Nivel medio" value={encounterBlueprint.metrics.avgLevel.toFixed(1)} helper={`Ataque medio ${Math.round(encounterBlueprint.metrics.avgAttack)} e Nexo medio ${Math.round(encounterBlueprint.metrics.avgNexo)}`} />
                  <EncounterMetricCard label="PV sugerido" value={encounterBlueprint.cards[0]?.totalPv || 0} helper={`${encounterBlueprint.cards[0]?.count || 0} inimigo(s) - ${encounterBlueprint.cards[0]?.eachPv || 0} PV por unidade na proposta principal.`} />
                  <EncounterMetricCard label="Dano alvo" value={encounterBlueprint.cards[0]?.damage.label || '-'} helper={`${encounterBlueprint.cards[0]?.damage.expression || '-'} - media ${encounterBlueprint.cards[0]?.damage.average || 0}`} />
                  <EncounterMetricCard label="Leitura" value={encounterBlueprint.readinessLabel} helper={`${encounterBlueprint.pressureLabel} para ${encounterBlueprint.config.label.toLowerCase()}.`} />
                </>
              ) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Marque pelo menos uma ficha para gerar o encontro.</p>}
            </div>
            <label className="grid gap-2 rounded-lg border border-line bg-white/5 p-3">
              <span className="text-sm font-semibold text-textMuted">Bloco rapido</span>
              <textarea className={`${fieldClass} min-h-48`} readOnly value={encounterBlueprint?.block || ''} />
            </label>
          </div>

          <div className="grid content-start gap-3">
            {encounterSuggestions.length ? encounterSuggestions.map((suggestion) => (
              <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={suggestion.key}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{suggestion.title}</h3>
                    <p className="text-sm text-textMuted">{encounterBlueprint?.config.label} - {encounterBlueprint?.pressureLabel}</p>
                  </div>
                  <Badge>x{suggestion.count}</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <EncounterStat label="PV" value={suggestion.eachPv} helper={`${suggestion.totalPv} total`} />
                  <EncounterStat label="Defesa" value={`Arm ${suggestion.armor}`} helper={`Esquiva +${suggestion.dodge}`} />
                  <EncounterStat label="Bloqueio" value={suggestion.block} helper={`Iniciativa +${suggestion.initiative}`} />
                  <EncounterStat label="Ataque" value={`+${suggestion.attack}`} helper={suggestion.damage.label} />
                  <EncounterStat label="Dano" value={suggestion.damage.expression} helper={`media ${suggestion.damage.average}`} />
                  <EncounterStat label="Recursos" value={`PE ${suggestion.pe}`} helper={`PD ${suggestion.pd}`} />
                </div>
                <p className="rounded-lg border border-line bg-black/20 px-3 py-2 text-sm text-textMuted"><strong className="text-textMain">Uso de mesa:</strong> {suggestion.note}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => openSuggestionAsEnemy(suggestion)}>Criar ficha</Button>
                </div>
              </article>
            )) : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Biblioteca de inimigos</h2>
            <p className="mt-1 text-sm text-textMuted">Fichas salvas a partir do gerador ou criadas manualmente para reutilizar em outras cenas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{enemyLibrary.length} ficha{enemyLibrary.length === 1 ? '' : 's'}</Badge>
            <Button type="button" onClick={() => setActiveEnemy(createEnemyRecord())}>Novo inimigo</Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {enemyLibrary.length ? enemyLibrary.map((enemy) => (
            <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={enemy.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar image={enemy.image || ''} name={enemy.name} />
                  <div className="min-w-0">
                    <h3 className="truncate font-black">{enemy.name}</h3>
                    <p className="text-sm text-textMuted">{enemy.role} | {enemy.source || 'Manual'}</p>
                  </div>
                </div>
                <Badge>x{enemy.countCurrent}/{enemy.countMax}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>PV {enemy.pvCurrent}/{enemy.pvMax}</Badge>
                <Badge>Total {enemy.countCurrent * enemy.pvCurrent}</Badge>
                <Badge>Arm {enemy.armor}</Badge>
                <Badge>Esq +{enemy.dodge}</Badge>
                <Badge>Blk {enemy.block}</Badge>
                <Badge>Atk +{enemy.attack}</Badge>
              </div>
              <p className="text-sm text-textMuted">{enemy.damageLabel} {enemy.damageExpression} | Base {enemy.basicDamageExpression}</p>
              <p className="text-sm text-textMuted">{enemy.notes || 'Sem notas.'}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => addEnemy(enemy)}>Entrar em cena</Button>
                <Button type="button" onClick={() => setActiveEnemy(enemy)}>Editar</Button>
                <Button type="button" onClick={() => duplicateEnemy(enemy.id)}>Duplicar</Button>
                <Button tone="danger" type="button" onClick={() => deleteEnemy(enemy.id)}>Excluir</Button>
              </div>
            </article>
          )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma ficha salva ainda. Gere um inimigo no bloco acima ou use "Novo inimigo" para montar uma ficha manual.</p>}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Encontro ativo</h2>
            <p className="mt-1 text-sm text-textMuted">Ordem manual de combate com players, mini-fichas de apoio e inimigos na mesma fila.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{combatants.length} em cena</Badge>
            <Badge>{totalPv} PV restantes</Badge>
            <Button type="button" disabled={saving} onClick={() => addCharactersBatch(characters.filter((character) => !getCharacterAlertData(character).isAbsent), 'Players presentes adicionados')}>Adicionar presentes</Button>
            <Button type="button" disabled={saving} onClick={() => addCharactersBatch(visibleCharacters, 'Players visiveis adicionados')}>Adicionar visiveis</Button>
            <Button type="button" disabled={saving} onClick={passTurn}>Passar vez</Button>
            <Button type="button" disabled={saving} onClick={resetRound}>Reiniciar rodada</Button>
            <Button type="button" disabled={saving} onClick={sortEncounter}>Ordenar iniciativa</Button>
            <Button type="button" disabled={saving} onClick={clearEncounter}>Limpar encontro</Button>
            <Button tone="danger" type="button" disabled={saving} onClick={hardResetCombat}>Resetar combate global</Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
          <article className={clsx('combat-state-card', currentTurnEntry && 'is-current', currentTurnEntry && getCombatantStatusVisualClass(currentTurnEntry))}>
            <div className="flex items-center gap-3">
              {currentTurnEntry ? <Avatar image={currentTurnEntry.image || ''} name={currentTurnEntry.name || 'Combatente'} /> : null}
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Vez atual</span>
                <strong className="mt-1 block truncate text-3xl">{currentTurnEntry?.name || 'Sem turno'}</strong>
              </div>
            </div>
            <p className="mt-2 text-sm text-textMuted">{currentTurnEntry ? `Iniciativa ${Number(currentTurnEntry.initiativeTotal || 0)} | ${normalizeCombatStatus(currentTurnEntry.status, 'Vivo')}` : 'Defina a iniciativa e passe a vez quando a cena comecar.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button tone="primary" type="button" disabled={saving} onClick={passTurn}>Passar vez</Button>
              <Button type="button" disabled={saving} onClick={sortEncounter}>Ordenar</Button>
              <Button type="button" disabled={saving} onClick={resetRound}>Reiniciar</Button>
            </div>
          </article>
          <article className={clsx('combat-state-card', nextTurnEntry && 'is-next', nextTurnEntry && getCombatantStatusVisualClass(nextTurnEntry))}>
            <div className="flex items-center gap-3">
              {nextTurnEntry ? <Avatar image={nextTurnEntry.image || ''} name={nextTurnEntry.name || 'Combatente'} /> : null}
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Proximo</span>
                <strong className="mt-1 block truncate text-3xl">{nextTurnEntry?.name || '-'}</strong>
              </div>
            </div>
            <p className="mt-2 text-sm text-textMuted">Rodada {Math.max(1, Number(state.round || 1))} | {livingEntries.length} vivo(s)</p>
          </article>
          <article className="combat-state-card">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Cena</span>
            <strong className="mt-2 block text-3xl">{livingEntries.length}/{combatants.length}</strong>
            <p className="mt-2 text-sm text-textMuted">PV {totalPv} | P {typeCounts.character || 0} M {typeCounts.companion || 0} I {typeCounts.enemy || 0}</p>
          </article>
        </div>

        <div className="mt-4 rounded-lg border border-line bg-white/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">Ordem de iniciativa</span>
            {livingEntries.length ? livingEntries.map((entry) => (
              <button
                className={clsx(
                  'combat-initiative-pill',
                  getCombatantStatusVisualClass(entry),
                  entry.instanceId === currentTurnEntry?.instanceId && 'is-current',
                  entry.instanceId === nextTurnEntry?.instanceId && 'is-next'
                )}
                key={entry.instanceId}
                type="button"
                onClick={() => commitCombat(combatants, {
                  currentInstanceId: entry.instanceId,
                  message: `Turno definido para ${entry.name}`,
                  logName: entry.name,
                  details: { action: 'definir-turno', initiative: entry.initiativeTotal }
                })}
              >
                {entry.name} <span className="text-textMuted">{entry.initiativeTotal}</span>
              </button>
            )) : <span className="text-sm text-textMuted">Sem combatentes ativos na ordem.</span>}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => addCharactersBatch(visibleCharacters, 'Players visiveis adicionados')}>+ Todos visiveis</Button>
          <Button type="button" onClick={() => setActiveEnemy(createEnemyRecord())}>+ Inimigo</Button>
          {visibleCharacters.filter((character) => !hasSharedActorInEncounter(combatants, character.id)).map((character) => (
            <Button key={character.id} type="button" onClick={() => addCharacter(character.id)}>+ {character.identity.name}</Button>
          ))}
        </div>
        {supportCompanionEntries.length ? (
          <div className="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {supportCompanionEntries.map(({ character, companion }) => (
              <Button key={`${character.id}:${companion.id}`} type="button" onClick={() => addCompanion(character.id, companion.id)}>
                + {companion.name || 'Mini-ficha'} ({character.identity.name})
              </Button>
            ))}
          </div>
        ) : null}

        <CombatActivityLog entries={combatLogEntries} />

        <div className="mt-4 grid gap-3">
          {combatants.length ? combatants.map((combatant) => {
            const statusLabel = normalizeCombatStatus(combatant.status, 'Vivo');
            const statusClass = getCombatantStatusVisualClass(combatant);
            const isCurrent = combatant.instanceId === currentTurnEntry?.instanceId && isLivingCombatantDraft(combatant);
            const nextCandidate = nextTurnEntry?.instanceId === combatant.instanceId;
            return (
              <article className={clsx('combat-state-card grid gap-3', statusClass, isCurrent && 'is-current', nextCandidate && !isCurrent && 'is-next')} key={combatant.instanceId}>
                <div className="combat-card-content flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar image={combatant.image || ''} name={combatant.name} />
                    <div className="min-w-0">
                      <h3 className="truncate font-black">#{getLivingOrder(livingEntries, combatant)} {combatant.name}</h3>
                      <p className="text-sm text-textMuted">{getCombatantSubtitle(combatant)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{getCombatantTypeLabel(combatant)}</Badge>
                    {combatant.isForm ? <Badge>Transformado</Badge> : null}
                    <Badge tone={getCombatStatusBadgeTone(statusLabel)}>{statusLabel}</Badge>
                    {isCurrent ? <span className="combat-turn-badge is-current">Vez atual</span> : null}
                    {nextCandidate && !isCurrent ? <span className="combat-turn-badge is-next">Proximo</span> : null}
                    {statusClass === 'is-dead' ? <Badge tone="danger">Pulando na ordem</Badge> : null}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
                  <div className="grid gap-3">
                    <ResourceMeter label="PV" current={combatant.pvCurrent} max={combatant.pvMax || 1} />
                    <div className="flex flex-wrap gap-2">
                      {[-10, -5, -1, 1, 5, 10].map((delta) => (
                        <Button key={delta} type="button" disabled={saving} onClick={() => applyPvDelta(combatant, delta)}>{delta > 0 ? `+${delta}` : delta}</Button>
                      ))}
                    </div>
                    <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,120px),1fr))]">
                      <input
                        className={fieldClass}
                        min={0}
                        placeholder="Valor"
                        type="number"
                        value={pvAdjustDrafts[combatant.instanceId] || ''}
                        onChange={(event) => setPvAdjustDrafts((current) => ({ ...current, [combatant.instanceId]: event.target.value }))}
                      />
                      <Button type="button" disabled={saving} onClick={() => applyCustomPvAdjustment(combatant, -1)}>Aplicar dano</Button>
                      <Button type="button" disabled={saving} onClick={() => applyCustomPvAdjustment(combatant, 1)}>Aplicar cura</Button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-textMuted">PV</span>
                        <input
                          className={fieldClass}
                          min={0}
                          max={combatant.pvMax}
                          type="number"
                          value={Number(combatant.pvCurrent || 0)}
                          onChange={(event) => updateCombatant(combatant.instanceId, (entry) => {
                            const nextPv = clampNumber(Number(event.target.value || 0), 0, Number(entry.pvMax || 0));
                            return { ...entry, pvCurrent: nextPv, status: normalizeStatusForPv(entry.status, nextPv) };
                          })}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold text-textMuted">Inic</span>
                        <input
                          className={fieldClass}
                          min={-99}
                          max={999}
                          type="number"
                          value={Number(combatant.initiativeTotal || 0)}
                          onChange={(event) => updateCombatant(combatant.instanceId, (entry) => ({ ...entry, initiativeTotal: clampNumber(Number(event.target.value || 0), -99, 999) }))}
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COMBAT_STATUS_OPTIONS.map((status) => (
                        <Button key={status} type="button" disabled={saving} onClick={() => updateCombatant(combatant.instanceId, (entry) => ({
                          ...entry,
                          status,
                          pvCurrent: status === 'Morto' ? 0 : Number(entry.pvCurrent || 0)
                        }), {
                          message: `${combatant.name}: status ${status}`,
                          logName: combatant.name,
                          details: { action: 'status', status, before: combatant.status, type: combatant.combatantType }
                        })}>{status}</Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge>Arm {combatant.armor}</Badge>
                  <Badge>Esq {formatSigned(Number(combatant.dodge || 0))}</Badge>
                  <Badge>Blk {combatant.block}</Badge>
                  {Number(combatant.attack || 0) ? <Badge>Atk {formatSigned(Number(combatant.attack || 0))}</Badge> : null}
                  {combatant.damageExpression ? <Badge>{String(combatant.damageLabel || 'Dano')} {String(combatant.damageExpression)}</Badge> : null}
                  {combatant.pe !== undefined ? <Badge>PE {String(combatant.pe)}</Badge> : null}
                  {combatant.pd !== undefined ? <Badge>PD {String(combatant.pd)}</Badge> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {combatant.combatantType === 'enemy' ? (
                    <>
                      <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold hover:bg-white/10">
                        Foto do inimigo
                        <input
                          className="hidden"
                          type="file"
                          accept="image/*"
                          onChange={(event) => readMasterImageFile(event, (value) => updateCombatant(combatant.instanceId, (entry) => ({ ...entry, image: value }), {
                            message: `${combatant.name}: imagem atualizada`,
                            logName: combatant.name,
                            details: { action: 'imagem', type: combatant.combatantType }
                          }))}
                        />
                      </label>
                      {combatant.image ? (
                        <Button type="button" disabled={saving} onClick={() => updateCombatant(combatant.instanceId, (entry) => ({ ...entry, image: '' }), {
                          message: `${combatant.name}: imagem removida`,
                          logName: combatant.name,
                          details: { action: 'imagem-removida', type: combatant.combatantType }
                        })}>Remover foto</Button>
                      ) : null}
                    </>
                  ) : null}
                  <Button type="button" disabled={saving || !isLivingCombatantDraft(combatant)} onClick={() => commitCombat(combatants, {
                    currentInstanceId: combatant.instanceId,
                    message: `Turno definido para ${combatant.name}`,
                    logName: combatant.name,
                    details: { action: 'definir-turno', initiative: combatant.initiativeTotal }
                  })}>Definir vez</Button>
                  <Button type="button" disabled={saving} onClick={() => updateCombatant(combatant.instanceId, (entry) => ({ ...entry, pvCurrent: 0, status: 'Morto' }), {
                    message: `${combatant.name}: derrotado`,
                    logName: combatant.name,
                    details: { action: 'derrotado', before: combatant.pvCurrent, after: 0, type: combatant.combatantType }
                  })}>Derrotar</Button>
                  <Button tone="danger" type="button" disabled={saving} onClick={() => commitCombat(combatants.filter((entry) => entry.instanceId !== combatant.instanceId), {
                    message: `${combatant.name} saiu de cena`,
                    logName: combatant.name,
                    details: { action: 'saida', type: combatant.combatantType }
                  })}>Sair de cena</Button>
                </div>
              </article>
            );
          }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum combatente em cena ainda. Adicione players, mini-fichas de apoio ou inimigos para montar a ordem do combate.</p>}
        </div>
      </Card>

      {message ? <Card>{message}</Card> : null}
      {activeEnemy ? (
        <EnemyDialog
          enemy={activeEnemy}
          exists={enemyLibrary.some((entry) => entry.id === activeEnemy.id)}
          onClose={() => setActiveEnemy(null)}
          onDelete={(enemyId) => {
            deleteEnemy(enemyId);
            setActiveEnemy(null);
          }}
          onSave={saveEnemy}
        />
      ) : null}
    </div>
  );
}

interface EncounterPlannerState {
  type: string;
  pressure: string;
  selectedIds: string[];
}

interface EncounterDamage {
  key: string;
  label: string;
  expression: string;
  average: number;
}

interface EncounterCard {
  key: string;
  title: string;
  count: number;
  totalPv: number;
  eachPv: number;
  armor: number;
  dodge: number;
  block: number;
  initiative: number;
  attack: number;
  pe: number;
  pd: number;
  damageScale: number;
  damage: EncounterDamage;
  note: string;
}

interface EncounterConfig {
  label: string;
  archetype: string;
  count(partySize: number, pressureIndex: number): number;
  duration: [number, number, number];
  damageShare: [number, number, number];
  armorDelta: number;
  dodgeDelta: number;
  blockDelta: number;
  attackDelta: number;
  pdFactor: number;
  peFactor: number;
  cardNote: string;
}

interface EncounterParticipantMetric {
  id: string;
  name: string;
  level: number;
  className: string;
  maxPv: number;
  maxPe: number;
  maxPd: number;
  pvCurrent: number;
  peCurrent: number;
  pdCurrent: number;
  armor: number;
  dodge: number;
  block: number;
  initiative: number;
  nexo: number;
  bestAttack: { key: string; label: string; total: number };
}

interface EncounterMetrics {
  participants: EncounterParticipantMetric[];
  count: number;
  avgLevel: number;
  avgMaxPv: number;
  avgMaxPe: number;
  avgMaxPd: number;
  avgArmor: number;
  avgDodge: number;
  avgBlock: number;
  avgInitiative: number;
  avgNexo: number;
  avgAttack: number;
  pvReadiness: number;
  peReadiness: number;
  pdReadiness: number;
}

interface EncounterBlueprint {
  config: EncounterConfig;
  metrics: EncounterMetrics;
  pressureLabel: string;
  readinessLabel: string;
  cards: EncounterCard[];
  block: string;
}

function EncounterMetricCard({ label, value, helper }: { label: string; value: ReactNode; helper: string }) {
  return (
    <article className="min-h-28 rounded-lg border border-line bg-white/5 p-4">
      <span className="text-xs font-black uppercase tracking-[0.08em] text-textMuted">{label}</span>
      <strong className="mt-2 block text-2xl">{value}</strong>
      <p className="mt-2 text-sm text-textMuted">{helper}</p>
    </article>
  );
}

function EncounterStat({ label, value, helper }: { label: string; value: ReactNode; helper: string }) {
  return (
    <div className="rounded-lg border border-line bg-black/20 px-3 py-2">
      <span className="block text-xs font-semibold text-textMuted">{label}</span>
      <strong className="mt-1 block break-words text-sm">{value}</strong>
      <small className="text-textMuted">{helper}</small>
    </div>
  );
}

function EnemyDialog({
  enemy,
  exists,
  onClose,
  onDelete,
  onSave
}: {
  enemy: EnemyRecord;
  exists: boolean;
  onClose(): void;
  onDelete(enemyId: string): void;
  onSave(enemy: EnemyRecord): void;
}) {
  const [draft, setDraft] = useState<EnemyRecord>(() => hydrateEnemyRecord(enemy));

  useEffect(() => {
    setDraft(hydrateEnemyRecord(enemy));
  }, [enemy]);

  function patch(nextPatch: Partial<EnemyRecord>) {
    setDraft((current) => hydrateEnemyRecord({ ...current, ...nextPatch }));
  }

  function patchAttribute(key: string, value: number) {
    patch({ attributes: { ...draft.attributes, [key]: value } });
  }

  const attributeTags = ['forca', 'destreza', 'sentidos', 'vigor', 'inteligencia', 'nexo']
    .map((key) => ({ label: attributeLabel(key), value: Number(draft.attributes[key] || 0) }))
    .filter((entry) => entry.value > 0);

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{exists ? 'Editar inimigo' : 'Nova ficha de inimigo'}</h2>
            <p className="mt-1 text-sm text-textMuted">{draft.name || 'Novo inimigo'} | {draft.role || 'Capanga'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button tone="danger" type="button" disabled={!exists} onClick={() => onDelete(draft.id)}>Excluir</Button>
            <Button tone="primary" type="button" onClick={() => onSave(draft)}>Salvar ficha</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <article className="sticky top-3 grid content-start gap-3 self-start rounded-lg border border-line bg-white/5 p-4 text-center">
            <div className="mx-auto h-36 w-36 overflow-hidden rounded-lg border border-line bg-black/30">
              {draft.image ? (
                <img className="h-full w-full object-cover" src={draft.image} alt="" />
              ) : (
                <div className="grid h-full w-full place-items-center text-3xl font-black text-violet">{String(draft.name || '?').slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <strong className="text-lg">{draft.name}</strong>
            <span className="text-sm text-textMuted">{draft.role}</span>
            <small className="text-textMuted">{normalizeCombatStatus(draft.status, 'Vivo')} - {draft.source || 'Manual'}</small>
            <div className="grid gap-2">
              <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold hover:bg-white/10">
                Escolher foto
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => readMasterImageFile(event, (value) => patch({ image: value }))}
                />
              </label>
              {draft.image ? <Button tone="danger" type="button" onClick={() => patch({ image: '' })}>Remover foto</Button> : null}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge>x{draft.countCurrent}/{draft.countMax} unidades</Badge>
              <Badge>PV {draft.pvCurrent}/{draft.pvMax}</Badge>
              <Badge>Arm {draft.armor} - Esq {formatSigned(draft.dodge)}</Badge>
              <Badge>Blk {draft.block} - Init {formatSigned(draft.initiative)}</Badge>
              <Badge>Atk {formatSigned(draft.attack)} - {draft.damageLabel} {draft.damageExpression}</Badge>
              <Badge>Base {draft.basicDamageExpression}</Badge>
              {attributeTags.map((attribute) => <Badge key={attribute.label}>{attribute.label} {attribute.value}</Badge>)}
              <Badge>PE {draft.pe} - PD {draft.pd}</Badge>
            </div>
          </article>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <TextField label="Nome" value={draft.name} onChange={(value) => patch({ name: value })} />
              <TextField label="Papel" value={draft.role} onChange={(value) => patch({ role: value })} />
              <SelectField label="Status" value={draft.status} options={COMBAT_STATUS_OPTIONS} onChange={(value) => patch({ status: value })} />
              <NumberField label="Unidades atuais" value={draft.countCurrent} max={99} onChange={(value) => patch({ countCurrent: value })} />
              <NumberField label="Unidades base" value={draft.countMax} max={99} onChange={(value) => patch({ countMax: value })} />
              <p className="text-sm text-textMuted md:col-span-3">Salvar com mais de 1 unidade cria fichas separadas automaticamente para facilitar o controle de dano.</p>
              <NumberField label="PV atual por unidade" value={draft.pvCurrent} onChange={(value) => patch({ pvCurrent: value })} />
              <NumberField label="PV maximo por unidade" value={draft.pvMax} onChange={(value) => patch({ pvMax: value })} />
              <NumberField label="Armadura" value={draft.armor} onChange={(value) => patch({ armor: value })} />
              <NumberField label="Esquiva" value={draft.dodge} onChange={(value) => patch({ dodge: value })} />
              <NumberField label="Bloqueio" value={draft.block} onChange={(value) => patch({ block: value })} />
              <NumberField label="Iniciativa" value={draft.initiative} onChange={(value) => patch({ initiative: value })} />
              <NumberField label="Ataque" value={draft.attack} onChange={(value) => patch({ attack: value })} />
              <NumberField label="PE" value={draft.pe} onChange={(value) => patch({ pe: value })} />
              <NumberField label="PD" value={draft.pd} onChange={(value) => patch({ pd: value })} />
              <TextField label="Dano" value={draft.damageLabel} onChange={(value) => patch({ damageLabel: value })} />
              <TextField label="Expressao de dano" value={draft.damageExpression} onChange={(value) => patch({ damageExpression: value })} />
              <NumberField label="Media de dano" value={draft.damageAverage} onChange={(value) => patch({ damageAverage: value })} />
              <TextField label="Origem" value={draft.source} onChange={(value) => patch({ source: value })} />
            </div>

            <section className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-black">Atributos principais</h3>
                <p className="text-sm text-textMuted">Use so o que fizer sentido para esse inimigo.</p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {['forca', 'destreza', 'sentidos', 'vigor', 'inteligencia', 'nexo'].map((key) => (
                  <NumberField key={key} label={attributeLabel(key)} value={Number(draft.attributes[key] || 0)} onChange={(value) => patchAttribute(key, value)} />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-black">Dano basico</h3>
                <p className="text-sm text-textMuted">Ataque desarmado ou golpe base quando ele nao usa a acao principal.</p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <TextField label="Escala" value={draft.basicDamageLabel} onChange={(value) => patch({ basicDamageLabel: value })} />
                <TextField label="Expressao" value={draft.basicDamageExpression} onChange={(value) => patch({ basicDamageExpression: value })} />
                <NumberField label="Media" value={draft.basicDamageAverage} onChange={(value) => patch({ basicDamageAverage: value })} />
              </div>
            </section>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-textMuted">Notas</span>
              <textarea className={`${fieldClass} min-h-28`} value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <input className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function readMasterImageFile(event: ChangeEvent<HTMLInputElement>, onLoad: (value: string) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  void readFileAsOptimizedDataUrl(file).then(onLoad).catch(() => {
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange(value: string): void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function AttributeSelectField({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {ATTRIBUTES.map((attribute) => <option key={attribute.key} value={attribute.key}>{attribute.label}</option>)}
      </select>
    </label>
  );
}

function hydrateMasterCombatState(state: CombatState | undefined): CombatState {
  const combatants = Array.isArray(state?.combatants) ? state.combatants.map(hydrateCombatantDraft) : [];
  return finalizeCombatState(combatants, {
    currentInstanceId: state?.currentInstanceId || '',
    round: Math.max(1, Number(state?.round || 1))
  });
}

function repairCombatStateWithCharacters(state: CombatState | undefined, characters: CharacterSheet[]): CombatState {
  const hydratedState = hydrateMasterCombatState(state);
  if (!characters.length || !hydratedState.combatants.length) return hydratedState;
  const combatants = hydratedState.combatants as CombatantDraft[];

  return finalizeCombatState(combatants.map((entry) => repairCombatantWithSource(entry, characters, combatants)), {
    currentInstanceId: hydratedState.currentInstanceId,
    round: hydratedState.round,
    forceActive: hydratedState.active
  });
}

function repairCombatantWithSource(entry: CombatantDraft, characters: CharacterSheet[], currentCombatants: CombatantDraft[]): CombatantDraft {
  if (entry.combatantType === 'character') {
    const character = findCombatantCharacter(entry, characters);
    if (!character) return entry;
    const base = buildCharacterCombatant(character);
    return hydrateCombatantDraft({
      ...entry,
      ...base,
      order: entry.order,
      instanceId: entry.instanceId,
      status: entry.status,
      pvCurrent: clampNumber(entry.pvCurrent ?? base.pvCurrent, 0, Number(base.pvMax || 9999)),
      initiativeBonus: entry.initiativeBonus ?? base.initiativeBonus,
      initiativeRoll: entry.initiativeRoll,
      initiativeDice: entry.initiativeDice,
      initiativeTotal: entry.initiativeTotal,
      isCurrentTurn: entry.isCurrentTurn,
      addedAt: entry.addedAt,
      updatedAt: entry.updatedAt
    });
  }

  if (entry.combatantType === 'companion') {
    const character = findCombatantCharacter(entry, characters);
    const companion = character?.companions.find((item) => item.id === entry.sourceCompanionId);
    if (!character || !companion) return entry;
    const base = buildCompanionCombatant(character, companion, currentCombatants);
    return hydrateCombatantDraft({
      ...entry,
      ...base,
      order: entry.order,
      instanceId: entry.instanceId,
      status: entry.status,
      pvCurrent: clampNumber(entry.pvCurrent ?? base.pvCurrent, 0, Number(base.pvMax || 9999)),
      initiativeBonus: entry.initiativeBonus ?? base.initiativeBonus,
      initiativeRoll: entry.initiativeRoll,
      initiativeDice: entry.initiativeDice,
      initiativeTotal: entry.initiativeTotal,
      isCurrentTurn: entry.isCurrentTurn,
      addedAt: entry.addedAt,
      updatedAt: entry.updatedAt
    });
  }

  return entry;
}

function findCombatantCharacter(entry: CombatantDraft, characters: CharacterSheet[]) {
  const sourceId = String(entry.sourceCharacterId || '');
  if (sourceId) {
    const bySource = characters.find((character) => character.id === sourceId);
    if (bySource) return bySource;
  }

  if (String(entry.instanceId || '').startsWith('char-')) {
    const idFromInstance = String(entry.instanceId || '').slice('char-'.length);
    return characters.find((character) => character.id === idFromInstance) || null;
  }

  return null;
}

function hydrateCombatantDraft(input: Partial<Combatant> | Record<string, unknown>): CombatantDraft {
  const entry = input as Partial<CombatantDraft>;
  const combatantType = ['enemy', 'character', 'companion'].includes(String(entry.combatantType || ''))
    ? entry.combatantType as Combatant['combatantType']
    : 'enemy';
  const pvMax = Math.max(0, clampNumber(entry.pvMax ?? 0, 0, 9999));
  const pvCurrent = clampNumber(entry.pvCurrent ?? pvMax, 0, pvMax || 9999);
  return {
    ...entry,
    order: Math.max(1, Number(entry.order || 1)),
    instanceId: String(entry.instanceId || createEncounterInstanceId()),
    combatantType,
    name: String(entry.name || 'Combatente'),
    subtitle: String(entry.subtitle || ''),
    status: normalizeCombatStatus(entry.status, 'Vivo'),
    initiativeBonus: clampNumber(entry.initiativeBonus ?? entry.initiative ?? 0, -99, 999),
    initiativeRoll: clampNumber(entry.initiativeRoll ?? 0, 0, 20),
    initiativeDice: Array.isArray(entry.initiativeDice) ? entry.initiativeDice.slice(0, 2).map((value) => clampNumber(value, 1, 10)) : [],
    initiativeTotal: clampNumber(entry.initiativeTotal ?? 0, -99, 999),
    sourceCharacterId: String(entry.sourceCharacterId || ''),
    sourceCompanionId: String(entry.sourceCompanionId || ''),
    ownerName: String(entry.ownerName || ''),
    image: String(entry.image || ''),
    pvCurrent,
    pvMax,
    armor: Math.max(0, clampNumber(entry.armor ?? 0, 0, 999)),
    dodge: Math.max(0, clampNumber(entry.dodge ?? 0, 0, 999)),
    block: Math.max(0, clampNumber(entry.block ?? 0, 0, 999)),
    isForm: Boolean(entry.isForm),
    isCurrentTurn: Boolean(entry.isCurrentTurn),
    typeLabel: String(entry.typeLabel || getCombatantTypeLabel(entry as CombatantDraft)),
    addedAt: String(entry.addedAt || new Date().toISOString()),
    updatedAt: String(entry.updatedAt || new Date().toISOString())
  };
}

function finalizeCombatState(entries: CombatantDraft[], options: { currentInstanceId?: string; round?: number; forceActive?: boolean } = {}): CombatState {
  const sorted = sortCombatantsByInitiative(entries.map(hydrateCombatantDraft));
  const living = getLivingCombatants(sorted);
  const requestedCurrent = String(options.currentInstanceId || '');
  const currentInstanceId = living.some((entry) => entry.instanceId === requestedCurrent)
    ? requestedCurrent
    : (living[0]?.instanceId || sorted[0]?.instanceId || '');
  const combatants = sorted.map((entry, index) => ({
    ...entry,
    order: index + 1,
    isCurrentTurn: Boolean(currentInstanceId && entry.instanceId === currentInstanceId)
  }));
  return {
    active: Boolean(combatants.length && options.forceActive !== false),
    round: Math.max(1, Number(options.round || 1)),
    currentInstanceId,
    updatedAt: new Date().toISOString(),
    combatants: combatants as Combatant[]
  };
}

function sortCombatantsByInitiative(entries: CombatantDraft[]) {
  return entries
    .slice()
    .sort((left, right) => {
      const initiativeDelta = Number(right.initiativeTotal || 0) - Number(left.initiativeTotal || 0);
      if (initiativeDelta) return initiativeDelta;
      const bonusDelta = Number(right.initiativeBonus || 0) - Number(left.initiativeBonus || 0);
      if (bonusDelta) return bonusDelta;
      const addedAtDelta = String(left.addedAt || '').localeCompare(String(right.addedAt || ''));
      if (addedAtDelta) return addedAtDelta;
      return Number(left.order || 0) - Number(right.order || 0);
    });
}

function getLivingCombatants(entries: CombatantDraft[]) {
  return sortCombatantsByInitiative(entries).filter((entry) => {
    const status = normalizeCombatStatus(entry.status, 'Vivo');
    return status !== 'Morto';
  });
}

function isLivingCombatantDraft(entry: Pick<CombatantDraft, 'status'> | null | undefined) {
  if (!entry) return false;
  const status = normalizeCombatStatus(entry.status, 'Vivo');
  return status !== 'Morto';
}

function getCombatantStatusVisualClass(entry: Pick<CombatantDraft, 'pvCurrent' | 'status'> | null | undefined) {
  if (!entry) return 'is-alive';
  const status = normalizeCombatStatus(entry.status, 'Vivo');
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

function buildCharacterCombatant(character: CharacterSheet): CombatantDraft {
  const hydrated = hydrateCharacter(character);
  const derived = calculateDerived(hydrated);
  return hydrateCombatantDraft({
    order: 1,
    instanceId: `char-${hydrated.id}`,
    combatantType: 'character',
    typeLabel: 'Player',
    name: hydrated.identity.name || 'Personagem',
    subtitle: `${hydrated.identity.className || 'Personagem'} | Nv ${hydrated.identity.level || 1}`,
    status: normalizeCombatStatus(hydrated.resources.status, 'Vivo'),
    pvCurrent: Number(hydrated.resources.pvCurrent || 0),
    pvMax: Number(derived.maxPv || 0),
    armor: Number(derived.armor || 0),
    dodge: Number(derived.esquivaMod || 0),
    block: Number(derived.selectedBlock || 0),
    initiativeBonus: Number(derived.initiativeMod || 0),
    initiativeRoll: 0,
    initiativeTotal: 0,
    sourceCharacterId: hydrated.id,
    sourceCompanionId: '',
    ownerName: '',
    image: hydrated.identity.image || '',
    isForm: false,
    attack: Number(derived.manifestationMod || 0),
    manifestation: Number(derived.manifestationMod || 0),
    pe: Number(hydrated.resources.peCurrent || 0),
    pd: Number(hydrated.resources.pdCurrent || 0),
    className: hydrated.identity.className,
    level: hydrated.identity.level,
    notes: hydrated.masterNotes || ''
  });
}

function buildCompanionCombatant(character: CharacterSheet, companion: CharacterSheet['companions'][number], currentCombatants: CombatantDraft[]): CombatantDraft {
  const hydrated = hydrateCharacter(character);
  const derived = calculateDerived(hydrated);
  const isForm = isCompanionForm(companion);
  const attributes = companion.attributes || {};
  const forca = Number(attributes.forca || 0);
  const destreza = Number(attributes.destreza || 0);
  const vigor = Number(attributes.vigor || 0);
  const nexo = Number(attributes.nexo || 0);
  const reflexos = getCompanionNamedSkillTotal(companion, ['reflexos']);
  const iniciativa = getCompanionNamedSkillTotal(companion, ['iniciativa']);
  const fortitude = getCompanionNamedSkillTotal(companion, ['fortitude']);
  const bestSkill = getHighestCompanionSkillTotal(companion);
  const initiativeBonus = isForm
    ? Number(derived.initiativeMod || 0)
    : Math.max(iniciativa, reflexos, floorHalf(destreza));
  const initiativeTotal = isForm
    ? getSharedInitiativeForCharacter(currentCombatants, hydrated.id, initiativeBonus)
    : 0;
  const dodge = Math.max(reflexos, floorHalf(destreza));
  const block = 10 + Math.max(fortitude, floorHalf(Math.max(forca, vigor)));
  const attack = Math.max(bestSkill, floorHalf(Math.max(forca, destreza, nexo)));
  const basicDamage = getDefaultBasicDamageFromAttributes(attributes, companion.type || 'Mini-ficha');
  const usesNexo = nexo > forca && nexo > 0;
  return hydrateCombatantDraft({
    order: 1,
    instanceId: `cmp-${hydrated.id}-${companion.id}`,
    combatantType: 'companion',
    typeLabel: isForm ? 'Forma' : 'Mini-ficha',
    name: companion.name || 'Mini-ficha',
    subtitle: `${companion.type || (isForm ? 'Forma' : 'Mini-ficha')} | ${hydrated.identity.name}`,
    status: normalizeCombatStatus(companion.status, 'Vivo'),
    pvCurrent: Number(companion.pvCurrent || 0),
    pvMax: Number(companion.pvMax || 0),
    armor: Number(companion.armor || 0),
    dodge,
    block,
    initiativeTotal,
    initiativeBonus,
    sourceCharacterId: hydrated.id,
    sourceCompanionId: companion.id,
    sourceName: hydrated.identity.name,
    ownerName: hydrated.identity.name,
    image: companion.image || '',
    isForm,
    attack,
    manifestation: 0,
    pe: 0,
    pd: 0,
    damageLabel: isForm ? '' : (usesNexo ? 'Manifestacao' : basicDamage.label),
    damageExpression: isForm ? '' : (usesNexo ? '1d6 + Nexo/2' : basicDamage.expression),
    damageAverage: isForm ? 0 : (usesNexo ? roundToStep(3.5 + (nexo / 2), 1) : basicDamage.average),
    basicDamageLabel: isForm ? '' : basicDamage.label,
    basicDamageExpression: isForm ? '' : basicDamage.expression,
    basicDamageAverage: isForm ? 0 : basicDamage.average,
    attributes,
    notes: companion.notes || ''
  });
}

function buildEnemyCombatant(enemy: EnemyRecord): CombatantDraft {
  const safeEnemy = hydrateEnemyRecord(enemy);
  return hydrateCombatantDraft({
    ...safeEnemy,
    order: 1,
    instanceId: `enemy-${safeEnemy.id}-${Math.random().toString(36).slice(2, 7)}`,
    combatantType: 'enemy',
    typeLabel: 'Inimigo',
    subtitle: `${safeEnemy.role || 'Inimigo'} | Base ${safeEnemy.source || safeEnemy.name}`,
    initiativeBonus: Number(safeEnemy.initiative || 0),
    initiativeRoll: 0,
    initiativeTotal: 0,
    sourceEnemyId: safeEnemy.id,
    sourceCharacterId: '',
    sourceCompanionId: '',
    isForm: false
  });
}

function syncCombatantToSourceSheet(entry: CombatantDraft, characters: CharacterSheet[], onCharacterChange: (character: CharacterSheet) => void) {
  if (!entry.sourceCharacterId) return;
  const character = characters.find((item) => item.id === entry.sourceCharacterId);
  if (!character) return;
  const status = normalizeStatusForPv(entry.status, entry.pvCurrent);

  if (entry.combatantType === 'character') {
    onCharacterChange(hydrateCharacter({
      ...character,
      resources: {
        ...character.resources,
        pvCurrent: clampNumber(entry.pvCurrent, 0, entry.pvMax || 9999),
        status
      }
    }));
    return;
  }

  if (entry.combatantType === 'companion' && entry.sourceCompanionId) {
    const companions = character.companions.map((companion) => {
      if (companion.id !== entry.sourceCompanionId) return companion;
      return {
        ...companion,
        pvCurrent: clampNumber(entry.pvCurrent, 0, companion.pvMax || entry.pvMax || 9999),
        status
      };
    });
    onCharacterChange(hydrateCharacter({
      ...character,
      companions,
      resources: entry.isForm ? { ...character.resources, status } : character.resources
    }));
  }
}

const ENCOUNTER_PRESSURE_LABELS: Record<string, string> = {
  light: 'Leve',
  balanced: 'Equilibrada',
  heavy: 'Pesada'
};

const ENCOUNTER_TYPE_CONFIG = {
  swarm: {
    label: 'Varios fracos',
    archetype: 'Pressao numerica',
    count(partySize: number, pressureIndex: number) {
      return Math.max(3, Math.min(12, partySize + 2 + Math.max(0, pressureIndex)));
    },
    duration: [1.9, 2.2, 2.5],
    damageShare: [0.13, 0.16, 0.19],
    armorDelta: -1,
    dodgeDelta: -1,
    blockDelta: -2,
    attackDelta: -1,
    pdFactor: 0.25,
    peFactor: 0.3,
    cardNote: 'Serve para ocupar espaco, drenar acao e cair em um ou dois bons acertos.'
  },
  skirmish: {
    label: 'Grupo equilibrado',
    archetype: 'Oponente base',
    count(partySize: number, pressureIndex: number) {
      return Math.max(2, Math.min(8, partySize + (pressureIndex === 2 ? 1 : 0)));
    },
    duration: [2.2, 2.5, 2.9],
    damageShare: [0.18, 0.22, 0.26],
    armorDelta: 0,
    dodgeDelta: 0,
    blockDelta: 0,
    attackDelta: 0,
    pdFactor: 0.42,
    peFactor: 0.45,
    cardNote: 'Boa linha media para encontros de troca franca, sem burst exagerado.'
  },
  elite: {
    label: 'Elites',
    archetype: 'Elite de cena',
    count(partySize: number, pressureIndex: number) {
      return Math.max(1, Math.min(4, Math.ceil(partySize / 2) + (pressureIndex === 2 && partySize >= 4 ? 1 : 0)));
    },
    duration: [2.6, 3.0, 3.4],
    damageShare: [0.24, 0.29, 0.34],
    armorDelta: 1,
    dodgeDelta: 1,
    blockDelta: 1,
    attackDelta: 1,
    pdFactor: 0.58,
    peFactor: 0.62,
    cardNote: 'Cada inimigo deve aguentar foco por alguns turnos e cobrar reposicionamento.'
  },
  boss: {
    label: 'Boss',
    archetype: 'Boss principal',
    count() {
      return 1;
    },
    duration: [3.0, 3.4, 3.9],
    damageShare: [0.3, 0.35, 0.4],
    armorDelta: 2,
    dodgeDelta: 2,
    blockDelta: 2,
    attackDelta: 2,
    pdFactor: 0.72,
    peFactor: 0.82,
    cardNote: 'Pensado para aguentar foco do grupo inteiro e ainda devolver pressao real.'
  }
} satisfies Record<string, EncounterConfig>;

const ENCOUNTER_DAMAGE_PROFILES = [
  { key: 'impulso', label: 'Impulso', expression: '1d6 + Nexo/2', average(scale: number) { return 3.5 + (scale / 2); } },
  { key: 'menor', label: 'Menor', expression: '2d6 + Nexo', average(scale: number) { return 7 + scale; } },
  { key: 'padrao', label: 'Padrao', expression: '3d6 + Nexo/2', average(scale: number) { return 10.5 + (scale / 2); } },
  { key: 'forte', label: 'Forte', expression: '3d10 + Nexo', average(scale: number) { return 16.5 + scale; } },
  { key: 'pesada', label: 'Pesada', expression: '4d10 + Nexo', average(scale: number) { return 22 + scale; } },
  { key: 'extrema', label: 'Extrema', expression: '5d10 + Nexo', average(scale: number) { return 27.5 + scale; } }
];

function hydrateEncounterPlannerState(state: Partial<EncounterPlannerState> | null | undefined): EncounterPlannerState {
  const type = ENCOUNTER_TYPE_CONFIG[String(state?.type || '') as keyof typeof ENCOUNTER_TYPE_CONFIG] ? String(state?.type) : 'skirmish';
  const pressure = ENCOUNTER_PRESSURE_LABELS[String(state?.pressure || '')] ? String(state?.pressure) : 'balanced';
  return {
    type,
    pressure,
    selectedIds: Array.isArray(state?.selectedIds) ? state.selectedIds.map(String).filter(Boolean) : []
  };
}

function loadEncounterPlannerState(): EncounterPlannerState {
  try {
    return hydrateEncounterPlannerState(JSON.parse(window.localStorage.getItem(MASTER_ENCOUNTER_STORAGE_KEY) || '{}') as Partial<EncounterPlannerState>);
  } catch {
    return hydrateEncounterPlannerState(null);
  }
}

function saveEncounterPlannerState(state: EncounterPlannerState) {
  try {
    window.localStorage.setItem(MASTER_ENCOUNTER_STORAGE_KEY, JSON.stringify(hydrateEncounterPlannerState(state)));
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

function buildEncounterBlueprint(participants: CharacterSheet[], type: string, pressure: string): EncounterBlueprint | null {
  if (!participants.length) return null;

  const metrics = buildEncounterMetrics(participants);
  const config = ENCOUNTER_TYPE_CONFIG[type as keyof typeof ENCOUNTER_TYPE_CONFIG] || ENCOUNTER_TYPE_CONFIG.skirmish;
  const pressureKey = ENCOUNTER_PRESSURE_LABELS[pressure] ? pressure : 'balanced';
  const pressureIndex = Math.max(0, ['light', 'balanced', 'heavy'].indexOf(pressureKey));
  const pressureLabel = ENCOUNTER_PRESSURE_LABELS[pressureKey];
  const primaryCard = createEncounterCard(config, metrics, pressureIndex, `${type}-${pressureKey}-primary`);
  const cards = [primaryCard];

  if (type === 'boss' && metrics.count >= 4) {
    const supportProfile = createEncounterCard(ENCOUNTER_TYPE_CONFIG.swarm, metrics, Math.max(0, pressureIndex - 1), `${type}-${pressureKey}-support`);
    const supportCount = Math.max(1, Math.ceil(metrics.count / 2) - (pressureIndex === 0 ? 1 : 0));
    const supportEachPv = Math.max(6, roundToStep(supportProfile.eachPv * 0.55, 1));
    cards.push({
      ...supportProfile,
      title: 'Escorta opcional',
      count: supportCount,
      eachPv: supportEachPv,
      totalPv: Math.max(10, roundToStep(supportCount * supportEachPv, 2)),
      armor: Math.max(0, supportProfile.armor - 1),
      dodge: Math.max(0, supportProfile.dodge),
      block: Math.max(10, supportProfile.block - 1),
      attack: Math.max(2, supportProfile.attack),
      note: 'Use so se o boss solo estiver sendo apagado cedo demais ou se quiser segurar flancos.'
    });
  }

  const readinessLabel = getEncounterReadinessLabel(metrics);
  const names = metrics.participants.map((entry) => `${entry.name} (Nv ${entry.level})`).join(', ');
  const blockLines = [
    `${config.label} - pressao ${pressureLabel.toLowerCase()}`,
    `Participantes (${metrics.count}): ${names}`,
    `Media do grupo: nivel ${metrics.avgLevel.toFixed(1)} - PV ${Math.round(metrics.avgMaxPv)} - ataque ${Math.round(metrics.avgAttack)} - armadura ${Math.round(metrics.avgArmor)}`,
    ...cards.map((card) => `${card.title} x${card.count} | PV ${card.eachPv} cada (${card.totalPv} total) | Arm ${card.armor} | Esquiva +${card.dodge} | Bloqueio ${card.block} | Ataque +${card.attack} | Dano ${card.damage.label} (${card.damage.expression}, media ${card.damage.average}) | PE ${card.pe} | PD ${card.pd}`),
    `Leitura da mesa: ${readinessLabel}.`
  ];

  if (readinessLabel !== 'Grupo praticamente inteiro') {
    blockLines.push('Ajuste sugerido: reduza um passo de pressao ou corte 10% a 15% do PV total se o encontro vier logo depois de outra luta.');
  }

  return {
    config,
    metrics,
    pressureLabel,
    readinessLabel,
    cards,
    block: blockLines.join('\n')
  };
}

function buildEncounterMetrics(participants: CharacterSheet[]): EncounterMetrics {
  const roster = participants.map((character) => {
    const hydrated = hydrateCharacter(character);
    const derived = calculateDerived(hydrated);
    const bestAttack = getCharacterBestAttack(hydrated);
    const pvMax = Number(derived.maxPv || 0);
    const peMax = Number(derived.maxPe || 0);
    const pdMax = Number(derived.maxPd || 0);
    const pvCurrent = Number(hydrated.resources.pvCurrent || 0);
    const peCurrent = Number(hydrated.resources.peCurrent || 0);
    const pdCurrent = Number(hydrated.resources.pdCurrent || 0);

    return {
      id: hydrated.id,
      name: hydrated.identity.name || 'Sem nome',
      level: Number(hydrated.identity.level || 1),
      className: hydrated.identity.className || 'Especialista',
      maxPv: pvMax,
      maxPe: peMax,
      maxPd: pdMax,
      pvCurrent,
      peCurrent,
      pdCurrent,
      armor: Number(derived.armor || 0),
      dodge: Number(derived.esquivaMod || 0),
      block: Number(derived.selectedBlock || 0),
      initiative: Number(derived.initiativeMod || 0),
      nexo: Number(hydrated.attributes.nexo || 0),
      bestAttack
    };
  });

  return {
    participants: roster,
    count: roster.length,
    avgLevel: averageFrom(roster, (entry) => entry.level),
    avgMaxPv: averageFrom(roster, (entry) => entry.maxPv),
    avgMaxPe: averageFrom(roster, (entry) => entry.maxPe),
    avgMaxPd: averageFrom(roster, (entry) => entry.maxPd),
    avgArmor: averageFrom(roster, (entry) => entry.armor),
    avgDodge: averageFrom(roster, (entry) => entry.dodge),
    avgBlock: averageFrom(roster, (entry) => entry.block),
    avgInitiative: averageFrom(roster, (entry) => entry.initiative),
    avgNexo: averageFrom(roster, (entry) => entry.nexo),
    avgAttack: averageFrom(roster, (entry) => entry.bestAttack.total),
    pvReadiness: averageFrom(roster, (entry) => entry.maxPv ? entry.pvCurrent / entry.maxPv : 1),
    peReadiness: averageFrom(roster, (entry) => entry.maxPe ? entry.peCurrent / entry.maxPe : 1),
    pdReadiness: averageFrom(roster, (entry) => entry.maxPd ? entry.pdCurrent / entry.maxPd : 1)
  };
}

function createEncounterCard(config: EncounterConfig, metrics: EncounterMetrics, pressureIndex: number, key: string): EncounterCard {
  const count = config.count(metrics.count, pressureIndex);
  const damageScale = Math.max(1, Math.round(metrics.avgNexo || Math.max(1, metrics.avgLevel / 2)));
  const expectedHeroHit = 3 + (metrics.avgLevel * 1.1) + (metrics.avgNexo * 1.3) + (metrics.avgAttack * 0.3);
  const totalPv = Math.max(
    count * 6,
    roundToStep(expectedHeroHit * metrics.count * config.duration[pressureIndex], config.label === 'Boss' ? 5 : 2)
  );
  const eachPv = Math.max(6, roundToStep(totalPv / count, count >= 4 ? 1 : 5));
  const targetDamage = (metrics.avgMaxPv * config.damageShare[pressureIndex]) + (metrics.avgArmor * 1.5);
  const damage = getDamageProfileForAverage(targetDamage, damageScale);

  return {
    key,
    title: config.archetype,
    count,
    totalPv,
    eachPv,
    armor: Math.max(0, roundToStep(metrics.avgArmor + config.armorDelta + (pressureIndex === 2 ? 1 : 0), 1)),
    dodge: Math.max(0, roundToStep(metrics.avgDodge + config.dodgeDelta + pressureIndex, 1)),
    block: Math.max(10, roundToStep(metrics.avgBlock + config.blockDelta + pressureIndex, 1)),
    attack: Math.max(2, roundToStep(metrics.avgAttack + config.attackDelta + pressureIndex, 1)),
    initiative: Math.max(0, roundToStep(metrics.avgInitiative + config.attackDelta, 1)),
    pe: Math.max(0, roundToStep(metrics.avgMaxPe * config.peFactor, 1)),
    pd: Math.max(0, roundToStep(metrics.avgMaxPd * config.pdFactor, 1)),
    damageScale,
    damage,
    note: config.cardNote
  };
}

function getDamageProfileForAverage(targetAverage: number, scale: number): EncounterDamage {
  const safeScale = Math.max(1, Number(scale || 1));
  let selected = ENCOUNTER_DAMAGE_PROFILES[0];
  let selectedAverage = selected.average(safeScale);

  ENCOUNTER_DAMAGE_PROFILES.forEach((profile) => {
    const currentAverage = profile.average(safeScale);
    if (Math.abs(currentAverage - targetAverage) < Math.abs(selectedAverage - targetAverage)) {
      selected = profile;
      selectedAverage = currentAverage;
    }
  });

  return {
    key: selected.key,
    label: selected.label,
    expression: selected.expression,
    average: roundToStep(selectedAverage, 1)
  };
}

function getEncounterReadinessLabel(metrics: EncounterMetrics) {
  const readiness = (metrics.pvReadiness * 0.5) + (metrics.peReadiness * 0.25) + (metrics.pdReadiness * 0.25);
  if (readiness < 0.62) return 'Grupo ja chega bem gasto';
  if (readiness < 0.82) return 'Grupo em meia carga';
  return 'Grupo praticamente inteiro';
}

function getCharacterBestAttack(character: CharacterSheet) {
  const candidates = ['luta', 'pontaria', 'manifestacao'].map((skillKey) => ({
    key: skillKey,
    label: SKILL_LABELS[skillKey] || skillKey,
    total: getCharacterSkillTotal(character, skillKey)
  }));

  return candidates.sort((left, right) => right.total - left.total)[0] || {
    key: 'luta',
    label: 'Luta',
    total: 0
  };
}

function getCharacterSkillTotal(character: CharacterSheet, skillKey: string) {
  const attributeKey = character.skillAttributes?.[skillKey] || SKILL_ATTRIBUTE_DEFAULTS[skillKey] || 'destreza';
  return Number(character.skills?.[skillKey] || 0) + floorHalf(character.attributes?.[attributeKey] || 0);
}

function buildEnemyDraftFromEncounterCard(card: EncounterCard, blueprint: EncounterBlueprint) {
  const participantNames = blueprint.metrics.participants.map((entry) => entry.name).join(', ');
  const role = getEnemyRoleFromBlueprint(card, blueprint);
  const attributes = inferEnemyAttributes(card, blueprint);
  const basicDamage = getDefaultBasicDamageFromAttributes(attributes, role);

  return createEnemyRecord({
    name: card.title || `${role} da cena`,
    role,
    status: 'Vivo',
    countCurrent: Math.max(1, Number(card.count || 1)),
    countMax: Math.max(1, Number(card.count || 1)),
    pvCurrent: Math.max(0, Number(card.eachPv || 0)),
    pvMax: Math.max(0, Number(card.eachPv || 0)),
    armor: Math.max(0, Number(card.armor || 0)),
    dodge: Math.max(0, Number(card.dodge || 0)),
    block: Math.max(0, Number(card.block || 10)),
    initiative: Math.max(0, Number(card.initiative || 0)),
    attack: Math.max(0, Number(card.attack || 0)),
    pe: Math.max(0, Number(card.pe || 0)),
    pd: Math.max(0, Number(card.pd || 0)),
    damageLabel: card.damage.label || 'Impulso',
    damageExpression: card.damage.expression || '1d6 + Nexo/2',
    damageAverage: Math.max(0, Number(card.damage.average || 0)),
    basicDamageLabel: basicDamage.label,
    basicDamageExpression: basicDamage.expression,
    basicDamageAverage: basicDamage.average,
    attributes,
    source: `${blueprint.config.label} - ${blueprint.pressureLabel}`,
    notes: `${card.note || ''}\nBaseado em: ${participantNames}`.trim()
  });
}

function getEnemyRoleFromBlueprint(card: EncounterCard, blueprint: EncounterBlueprint) {
  const sourceLabel = blueprint.config.label.toLowerCase();
  if (/boss/i.test(card.title)) return 'Boss';
  if (/elite/i.test(card.title)) return 'Elite';
  if (sourceLabel.includes('elite')) return 'Elite';
  if (sourceLabel.includes('boss')) return 'Boss';
  return 'Capanga';
}

function inferEnemyAttributes(card: EncounterCard, blueprint: EncounterBlueprint) {
  const role = getEnemyRoleFromBlueprint(card, blueprint);
  const hasNexoDamage = /nexo/i.test(card.damage.expression || '');

  return {
    forca: Math.max(0, clampNumber(Math.round(Number(card.attack || 0) / 2), 0, 10)),
    destreza: Math.max(0, clampNumber(Math.round(Number(card.dodge || 0) / 2), 0, 10)),
    sentidos: Math.max(0, clampNumber(Math.round(Math.max(Number(card.initiative || 0) - 1, 0) / 2), 0, 10)),
    vigor: Math.max(0, clampNumber(Math.round(Math.max(Number(card.block || 10) - 10, 0) / 2), 0, 10)),
    inteligencia: /boss|elite/i.test(role) ? Math.max(0, clampNumber(Math.round((blueprint.metrics.avgLevel || 1) + 1), 0, 10)) : 0,
    nexo: hasNexoDamage ? Math.max(0, clampNumber(Math.round(card.damageScale), 0, 10)) : 0
  };
}

function getDefaultBasicDamageFromAttributes(attributes: Record<string, number>, role: string) {
  const forca = Number(attributes?.forca || 0);
  if (/boss|elite/i.test(String(role || '')) || forca >= 4) {
    return {
      label: 'Desarmado',
      expression: '1d12 + Forca/2',
      average: roundToStep(6.5 + (forca / 2), 1)
    };
  }
  return {
    label: 'Desarmado',
    expression: '1d6 + Forca/2',
    average: roundToStep(3.5 + (forca / 2), 1)
  };
}

function buildEnemyUnitRecords(record: EnemyRecord) {
  const safeEnemy = hydrateEnemyRecord(record);
  const unitTotal = Math.max(1, Number(safeEnemy.countMax || safeEnemy.countCurrent || 1));
  if (unitTotal <= 1) return [safeEnemy];

  const activeUnits = Math.max(0, Math.min(Number(safeEnemy.countCurrent || 0), unitTotal));
  const baseName = String(safeEnemy.name || 'Novo inimigo')
    .replace(/\s+#?\d+$/, '')
    .trim();
  const timestamp = new Date().toISOString();

  return Array.from({ length: unitTotal }, (_, index) => {
    const isActive = index < activeUnits;
    return hydrateEnemyRecord({
      ...safeEnemy,
      id: createEnemyId(),
      name: `${baseName} ${index + 1}`,
      countCurrent: 1,
      countMax: 1,
      pvCurrent: isActive ? safeEnemy.pvCurrent : 0,
      status: isActive ? normalizeCombatStatus(safeEnemy.status, 'Vivo') : 'Morto',
      notes: `${safeEnemy.notes || ''}${safeEnemy.notes ? '\n' : ''}Unidade ${index + 1}/${unitTotal} do grupo original.`.trim(),
      createdAt: timestamp,
      updatedAt: timestamp
    });
  });
}

function loadEnemyLibrary(): EnemyRecord[] {
  try {
    return JSON.parse(window.localStorage.getItem(MASTER_ENEMY_LIBRARY_KEY) || '[]')
      .map((entry: Partial<EnemyRecord>) => hydrateEnemyRecord(entry));
  } catch {
    return [];
  }
}

function saveEnemyLibrary(library: EnemyRecord[]) {
  try {
    window.localStorage.setItem(MASTER_ENEMY_LIBRARY_KEY, JSON.stringify(library.map(hydrateEnemyRecord)));
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

function hydrateEnemyRecord(entry: Partial<EnemyRecord> = {}): EnemyRecord {
  const updatedAt = entry.updatedAt || new Date().toISOString();
  const countMax = Math.max(1, clampNumber(entry.countMax ?? 1, 1, 99));
  const pvMax = Math.max(0, clampNumber(entry.pvMax ?? 0, 0, 9999));
  return {
    id: entry.id || createEnemyId(),
    name: String(entry.name || 'Novo inimigo'),
    role: String(entry.role || 'Capanga'),
    image: String((entry as Partial<EnemyRecord> & Record<string, unknown>).image || ''),
    status: normalizeCombatStatus(entry.status, 'Vivo'),
    countCurrent: clampNumber(entry.countCurrent ?? countMax, 0, countMax),
    countMax,
    pvCurrent: clampNumber(entry.pvCurrent ?? pvMax, 0, pvMax || 9999),
    pvMax,
    armor: clampNumber(entry.armor ?? 0, 0, 99),
    dodge: clampNumber(entry.dodge ?? 0, 0, 99),
    block: clampNumber(entry.block ?? 10, 0, 999),
    initiative: clampNumber(entry.initiative ?? 0, 0, 99),
    attack: clampNumber(entry.attack ?? 0, 0, 99),
    pe: clampNumber(entry.pe ?? 0, 0, 999),
    pd: clampNumber(entry.pd ?? 0, 0, 999),
    damageLabel: String(entry.damageLabel || 'Impulso'),
    damageExpression: String(entry.damageExpression || '1d6 + Nexo/2'),
    damageAverage: clampNumber(entry.damageAverage ?? 4, 0, 999),
    basicDamageLabel: String(entry.basicDamageLabel || 'Desarmado'),
    basicDamageExpression: String(entry.basicDamageExpression || '1d6 + Forca/2'),
    basicDamageAverage: clampNumber(entry.basicDamageAverage ?? 4, 0, 999),
    source: String(entry.source || 'Manual'),
    notes: String(entry.notes || ''),
    attributes: {
      forca: clampNumber(entry.attributes?.forca ?? 0, 0, 99),
      destreza: clampNumber(entry.attributes?.destreza ?? 0, 0, 99),
      sentidos: clampNumber(entry.attributes?.sentidos ?? 0, 0, 99),
      vigor: clampNumber(entry.attributes?.vigor ?? 0, 0, 99),
      inteligencia: clampNumber(entry.attributes?.inteligencia ?? 0, 0, 99),
      nexo: clampNumber(entry.attributes?.nexo ?? 0, 0, 99)
    },
    createdAt: entry.createdAt || updatedAt,
    updatedAt
  };
}

function createEnemyRecord(overrides: Partial<EnemyRecord> = {}) {
  return hydrateEnemyRecord({
    id: createEnemyId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });
}

function createEnemyId() {
  return `enemy-${Math.random().toString(36).slice(2, 10)}`;
}

function createEncounterInstanceId() {
  return `enc-${Math.random().toString(36).slice(2, 10)}`;
}

function getCombatantSourceKey(entry: CombatantDraft) {
  if (entry.combatantType === 'character') return `character:${entry.sourceCharacterId || ''}`;
  if (entry.combatantType === 'companion') return `companion:${entry.sourceCharacterId || ''}:${entry.sourceCompanionId || ''}`;
  return '';
}

function hasSharedActorInEncounter(combatants: CombatantDraft[], characterId: string) {
  return combatants.some((entry) => {
    if (entry.sourceCharacterId !== characterId) return false;
    if (entry.combatantType === 'character') return true;
    if (entry.combatantType === 'companion' && entry.isForm) return true;
    return false;
  });
}

function isCompanionForm(entry: Partial<CharacterSheet['companions'][number]> | Partial<CombatantDraft> | null | undefined) {
  const record = (entry || {}) as Record<string, unknown>;
  const lookup = String(record.type || record.typeLabel || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return lookup.includes('forma') || lookup.includes('alien') || Boolean(record.isForm);
}

function isCompanionHidden(entry: Partial<CharacterSheet['companions'][number]> | Partial<CombatantDraft> | null | undefined) {
  const record = (entry || {}) as Record<string, unknown>;
  return Boolean(record.isHidden || record.hidden || String(record.visibility || '').toLowerCase() === 'hidden');
}

function getCompanionVisibilityLabel(entry: Partial<CharacterSheet['companions'][number]> | Partial<CombatantDraft> | null | undefined) {
  return isCompanionHidden(entry) ? 'Oculta' : 'Publicada';
}

function getCompanionOmnivitaSilhouette(entry: Partial<CharacterSheet['companions'][number]> | null | undefined) {
  const record = (entry || {}) as Record<string, unknown>;
  return String(record.omnivitaSilhouette || '');
}

function normalizeLooseText(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getCompanionSkillTotal(entry: CharacterSheet['companions'][number], skill: Record<string, unknown>) {
  const attributeKey = String(skill.attribute || 'destreza');
  return Number(skill.value || 0) + floorHalf(entry.attributes?.[attributeKey] || 0);
}

function getCompanionNamedSkillTotal(entry: CharacterSheet['companions'][number], skillNames: string[]) {
  const wanted = new Set(skillNames.map((value) => normalizeLooseText(value)).filter(Boolean));
  return (Array.isArray(entry.skills) ? entry.skills : []).reduce((best, skill) => {
    if (!wanted.has(normalizeLooseText(skill?.name))) return best;
    return Math.max(best, getCompanionSkillTotal(entry, skill));
  }, 0);
}

function getHighestCompanionSkillTotal(entry: CharacterSheet['companions'][number]) {
  return (Array.isArray(entry.skills) ? entry.skills : []).reduce((best, skill) => {
    if (!skill || !String(skill.name || '').trim()) return best;
    return Math.max(best, getCompanionSkillTotal(entry, skill));
  }, 0);
}

function getSharedInitiativeForCharacter(combatants: CombatantDraft[], characterId: string, fallback = 0) {
  const shared = combatants.find((entry) => entry.sourceCharacterId === characterId && (entry.combatantType === 'character' || entry.isForm));
  return shared ? Number(shared.initiativeTotal || 0) : fallback;
}

function getCombatantTypeLabel(entry: Partial<CombatantDraft>) {
  if (entry.combatantType === 'character') return 'Player';
  if (entry.combatantType === 'companion') return entry.isForm ? 'Forma' : 'Mini-ficha';
  return 'Inimigo';
}

function getCombatantSubtitle(entry: CombatantDraft) {
  if (entry.subtitle) return entry.subtitle;
  if (entry.combatantType === 'character') return 'Personagem';
  if (entry.combatantType === 'companion') return `${entry.typeLabel || getCombatantTypeLabel(entry)} | ${entry.ownerName || 'Sem dono'}`;
  return `${String(entry.role || 'Inimigo')} | Base ${String(entry.source || entry.name)}`;
}

function getLivingOrder(livingEntries: CombatantDraft[], combatant: CombatantDraft) {
  const index = livingEntries.findIndex((entry) => entry.instanceId === combatant.instanceId);
  return index >= 0 ? index + 1 : '-';
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

function clampNumber(value: unknown, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function roundToStep(value: number, step = 1) {
  return Math.round(Number(value || 0) / step) * step;
}

function floorHalf(value: unknown) {
  return Math.floor(Number(value || 0) / 2);
}

function averageFrom<T>(rows: T[], picker: (row: T) => number) {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + Number(picker(row) || 0), 0) / rows.length;
}

function average(rows: Array<Record<string, number>>, key: string) {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length;
}

function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function formatSigned(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function attributeLabel(key: string) {
  return {
    forca: 'Forca',
    destreza: 'Destreza',
    sentidos: 'Sentidos',
    vigor: 'Vigor',
    inteligencia: 'Inteligencia',
    nexo: 'Nexo'
  }[key] || key;
}

const SCENARIO_TYPES = ['entry', 'social', 'danger', 'faction', 'rest', 'secret', 'investigation', 'combat', 'support'] as const;
const SCENARIO_STATUSES = ['unvisited', 'active', 'visited', 'changed'] as const;
const SCENARIO_NPC_STATUSES = ['present', 'absent', 'hostile', 'neutral', 'friendly', 'hidden'] as const;
const SCENARIO_EVENT_STATUSES = ['available', 'used', 'discarded', 'moved'] as const;
const SCENARIO_CLUE_STATUSES = ['hidden', 'found', 'missed'] as const;
const ARC_EVENT_STATUSES = ['latent', 'active', 'triggered', 'resolved'] as const;

interface ScenarioSessionRecord {
  [key: string]: unknown;
  name: string;
  currentScene: string;
  currentScenarioId: string;
  mood: string;
  pressure: string;
  note: string;
}

interface ScenarioRecord {
  [key: string]: unknown;
  id: string;
  name: string;
  type: string;
  status: string;
  order: number;
  mood: string;
  narrativePurpose: string;
  objective: string;
  summary: string;
  playerFacingDescription: string;
  notes: string;
  tags: string[];
  connectedScenarioIds: string[];
  npcIds: string[];
  eventIds: string[];
  clueIds: string[];
  isCurrent: boolean;
  playersHere: boolean;
}

interface ScenarioNpcRecord {
  [key: string]: unknown;
  id: string;
  name: string;
  role: string;
  attitude: string;
  currentAction: string;
  secret: string;
  status: string;
  locationScenarioId: string;
  notes: string;
}

interface ScenarioEventRecord {
  [key: string]: unknown;
  id: string;
  title: string;
  priority: number;
  trigger: string;
  description: string;
  consequence: string;
  status: string;
  scenarioId: string;
}

interface ScenarioClueRecord {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string;
  discoveryMethod: string;
  status: string;
  scenarioId: string;
}

interface ScenarioClockRecord {
  [key: string]: unknown;
  id: string;
  title: string;
  current: number;
  max: number;
  color: string;
  notes: string;
}

interface ScenarioArcEventRecord {
  [key: string]: unknown;
  id: string;
  title: string;
  description: string;
  trigger: string;
  status: string;
}

interface FullScenarioState extends ScenarioState {
  session: ScenarioSessionRecord;
  scenarios: ScenarioRecord[];
  npcs: ScenarioNpcRecord[];
  events: ScenarioEventRecord[];
  clues: ScenarioClueRecord[];
  clocks: ScenarioClockRecord[];
  arcEvents: ScenarioArcEventRecord[];
}

function ScenariosPanel({
  scenarios,
  saving,
  onSave
}: {
  scenarios: ScenarioState | null;
  saving: boolean;
  onSave(state: ScenarioState): void;
}) {
  const [state, setState] = useState<FullScenarioState>(() => getInitialScenarioState(scenarios));
  const [activeScenarioId, setActiveScenarioId] = useState('');
  const [filters, setFilters] = useState({ search: '', type: 'all', status: 'all', tags: '' });
  const [bulkText, setBulkText] = useState('');
  const [message, setMessage] = useState('');
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const nextState = getInitialScenarioState(scenarios);
    setState(nextState);
    setActiveScenarioId(nextState.session.currentScenarioId || nextState.scenarios[0]?.id || '');
  }, [scenarios]);

  useEffect(() => () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
  }, []);

  const orderedScenarios = state.scenarios.slice().sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
  const activeScenario = state.scenarios.find((scenario) => scenario.id === activeScenarioId) || orderedScenarios[0] || null;
  const filteredScenarios = applyScenarioFilters(orderedScenarios, filters);

  function commit(nextState: FullScenarioState, statusMessage = 'Cenarios salvos.') {
    const normalized = normalizeScenarioState(nextState);
    setState(normalized);
    saveScenarioStateLocal(normalized);
    setMessage(statusMessage);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => onSave(normalized), 320);
  }

  function commitImmediate(nextState: FullScenarioState, statusMessage = 'Cenarios salvos.') {
    const normalized = normalizeScenarioState(nextState);
    setState(normalized);
    saveScenarioStateLocal(normalized);
    setMessage(statusMessage);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    onSave(normalized);
  }

  function setScenarioActive(scenarioId: string, markStatus = true, sourceState = state) {
    const next = normalizeScenarioState({
      ...sourceState,
      session: { ...sourceState.session, currentScenarioId: scenarioId },
      scenarios: sourceState.scenarios.map((scenario) => ({
        ...scenario,
        isCurrent: scenario.id === scenarioId,
        status: scenario.id === scenarioId && markStatus ? 'active' : scenario.status
      }))
    });
    setActiveScenarioId(scenarioId);
    commit(next, 'Cenario atualizado');
  }

  function addScenario() {
    const scenario = createScenarioSeed('Novo cenario');
    const next = normalizeScenarioState({
      ...state,
      scenarios: [...orderedScenarios, { ...scenario, order: orderedScenarios.length + 1 }]
    });
    setActiveScenarioId(scenario.id);
    setScenarioActive(scenario.id, false, next);
  }

  function duplicateScenario(scenarioId: string) {
    const scenario = state.scenarios.find((entry) => entry.id === scenarioId);
    if (!scenario) return;
    const clone = normalizeScenarioRecord({
      ...scenario,
      id: createId('scenario'),
      name: `${scenario.name || 'Cenario'} (copia)`,
      order: state.scenarios.length + 1,
      isCurrent: false
    }, state.scenarios.length);
    commit({ ...state, scenarios: [...state.scenarios, clone] }, 'Cenario duplicado');
  }

  function deleteScenario(scenarioId: string) {
    if (!window.confirm('Excluir este cenario?')) return;
    const remaining = state.scenarios.filter((entry) => entry.id !== scenarioId);
    syncScenarioOrders(remaining);
    const nextCurrentId = state.session.currentScenarioId === scenarioId ? (remaining[0]?.id || '') : state.session.currentScenarioId;
    commitImmediate(normalizeScenarioState({
      ...state,
      session: { ...state.session, currentScenarioId: nextCurrentId },
      scenarios: remaining.map((entry) => ({
        ...entry,
        connectedScenarioIds: entry.connectedScenarioIds.filter((id) => id !== scenarioId),
        isCurrent: entry.id === nextCurrentId
      })),
      npcs: state.npcs.map((npc) => npc.locationScenarioId === scenarioId ? { ...npc, locationScenarioId: '' } : npc),
      events: state.events.map((eventEntry) => eventEntry.scenarioId === scenarioId ? { ...eventEntry, scenarioId: '' } : eventEntry),
      clues: state.clues.map((clue) => clue.scenarioId === scenarioId ? { ...clue, scenarioId: '' } : clue)
    }), 'Cenario removido');
    if (activeScenarioId === scenarioId) setActiveScenarioId(nextCurrentId);
  }

  function moveScenario(scenarioId: string, delta: number) {
    const list = orderedScenarios.slice();
    const index = list.findIndex((entry) => entry.id === scenarioId);
    const nextIndex = Math.max(0, Math.min(list.length - 1, index + delta));
    if (index < 0 || index === nextIndex) return;
    const [moved] = list.splice(index, 1);
    list.splice(nextIndex, 0, moved);
    syncScenarioOrders(list);
    commit({ ...state, scenarios: list }, 'Cenario atualizado');
  }

  function patchScenario(scenarioId: string, patch: Partial<ScenarioRecord>, statusMessage = 'Cenarios salvos.') {
    const next = normalizeScenarioState({
      ...state,
      scenarios: state.scenarios.map((scenario) => scenario.id === scenarioId ? normalizeScenarioRecord({ ...scenario, ...patch }, scenario.order - 1) : scenario)
    });
    if (patch.isCurrent) {
      setScenarioActive(scenarioId, false, next);
      return;
    }
    commit(next, statusMessage);
  }

  function updateScenarioField(scenarioId: string, field: keyof ScenarioRecord, value: string | boolean) {
    if (field === 'tags') {
      patchScenario(scenarioId, { tags: normalizeTagsInput(String(value)) });
      return;
    }
    if (field === 'status') {
      const nextStatus = SCENARIO_STATUSES.includes(value as typeof SCENARIO_STATUSES[number]) ? String(value) : 'unvisited';
      patchScenario(scenarioId, { status: nextStatus });
      return;
    }
    if (field === 'type') {
      const nextType = SCENARIO_TYPES.includes(value as typeof SCENARIO_TYPES[number]) ? String(value) : 'entry';
      patchScenario(scenarioId, { type: nextType });
      return;
    }
    if (field === 'playersHere' || field === 'isCurrent') {
      patchScenario(scenarioId, { [field]: Boolean(value) } as Partial<ScenarioRecord>);
      return;
    }
    patchScenario(scenarioId, { [field]: String(value) } as Partial<ScenarioRecord>);
  }

  function addNpc() {
    if (!activeScenario) return;
    const npc = createNpcSeed('NPC novo', activeScenario.id);
    commit({
      ...state,
      npcs: [...state.npcs, npc],
      scenarios: state.scenarios.map((scenario) => scenario.id === activeScenario.id ? { ...scenario, npcIds: uniqueList([...scenario.npcIds, npc.id]) } : scenario)
    }, 'NPC criado');
  }

  function patchNpc(npcId: string, patch: Partial<ScenarioNpcRecord>) {
    const nextNpcs = state.npcs.map((npc) => npc.id === npcId ? normalizeNpcRecord({ ...npc, ...patch }) : npc);
    commit({ ...state, npcs: nextNpcs }, 'Cenarios salvos.');
  }

  function setNpcLocation(npcId: string, scenarioId: string) {
    const next = normalizeScenarioState({
      ...state,
      npcs: state.npcs.map((npc) => npc.id === npcId ? { ...npc, locationScenarioId: scenarioId } : npc),
      scenarios: state.scenarios.map((scenario) => ({
        ...scenario,
        npcIds: scenario.id === scenarioId
          ? uniqueList([...scenario.npcIds, npcId])
          : scenario.npcIds.filter((id) => id !== npcId)
      }))
    });
    commit(next, 'NPC vinculado');
  }

  function unlinkNpc(npcId: string) {
    if (!activeScenario) return;
    commit({
      ...state,
      scenarios: state.scenarios.map((scenario) => scenario.id === activeScenario.id ? { ...scenario, npcIds: scenario.npcIds.filter((id) => id !== npcId) } : scenario)
    }, 'NPC removido');
  }

  function deleteNpc(npcId: string) {
    if (!window.confirm('Excluir este NPC de todos os cenarios?')) return;
    commit({
      ...state,
      npcs: state.npcs.filter((npc) => npc.id !== npcId),
      scenarios: state.scenarios.map((scenario) => ({ ...scenario, npcIds: scenario.npcIds.filter((id) => id !== npcId) }))
    }, 'NPC excluido');
  }

  function addEvent() {
    if (!activeScenario) return;
    const eventEntry = createEventSeed('Acontecimento', activeScenario.id);
    commit({
      ...state,
      events: [...state.events, eventEntry],
      scenarios: state.scenarios.map((scenario) => scenario.id === activeScenario.id ? { ...scenario, eventIds: uniqueList([...scenario.eventIds, eventEntry.id]) } : scenario)
    }, 'Acontecimento criado');
  }

  function patchEvent(eventId: string, patch: Partial<ScenarioEventRecord>) {
    commit({ ...state, events: state.events.map((entry) => entry.id === eventId ? normalizeEventRecord({ ...entry, ...patch }) : entry) }, 'Cenarios salvos.');
  }

  function setEventLocation(eventId: string, scenarioId: string) {
    commit({
      ...state,
      events: state.events.map((entry) => entry.id === eventId ? { ...entry, scenarioId } : entry),
      scenarios: state.scenarios.map((scenario) => ({
        ...scenario,
        eventIds: scenario.id === scenarioId ? uniqueList([...scenario.eventIds, eventId]) : scenario.eventIds.filter((id) => id !== eventId)
      }))
    }, 'Acontecimento vinculado');
  }

  function deleteEvent(eventId: string) {
    if (!window.confirm('Excluir este acontecimento?')) return;
    commit({
      ...state,
      events: state.events.filter((entry) => entry.id !== eventId),
      scenarios: state.scenarios.map((scenario) => ({ ...scenario, eventIds: scenario.eventIds.filter((id) => id !== eventId) }))
    }, 'Acontecimento excluido');
  }

  function duplicateEvent(eventId: string) {
    const entry = state.events.find((item) => item.id === eventId);
    if (!entry || !activeScenario) return;
    const clone = normalizeEventRecord({ ...entry, id: createId('event'), status: 'available', scenarioId: activeScenario.id });
    commit({
      ...state,
      events: [...state.events, clone],
      scenarios: state.scenarios.map((scenario) => scenario.id === activeScenario.id ? { ...scenario, eventIds: uniqueList([...scenario.eventIds, clone.id]) } : scenario)
    }, 'Acontecimento duplicado');
  }

  function addClue() {
    if (!activeScenario) return;
    const clue = createClueSeed('Pista', activeScenario.id);
    commit({
      ...state,
      clues: [...state.clues, clue],
      scenarios: state.scenarios.map((scenario) => scenario.id === activeScenario.id ? { ...scenario, clueIds: uniqueList([...scenario.clueIds, clue.id]) } : scenario)
    }, 'Pista criada');
  }

  function patchClue(clueId: string, patch: Partial<ScenarioClueRecord>) {
    commit({ ...state, clues: state.clues.map((entry) => entry.id === clueId ? normalizeClueRecord({ ...entry, ...patch }) : entry) }, 'Cenarios salvos.');
  }

  function setClueLocation(clueId: string, scenarioId: string) {
    commit({
      ...state,
      clues: state.clues.map((entry) => entry.id === clueId ? { ...entry, scenarioId } : entry),
      scenarios: state.scenarios.map((scenario) => ({
        ...scenario,
        clueIds: scenario.id === scenarioId ? uniqueList([...scenario.clueIds, clueId]) : scenario.clueIds.filter((id) => id !== clueId)
      }))
    }, 'Pista vinculada');
  }

  function deleteClue(clueId: string) {
    if (!window.confirm('Excluir esta pista?')) return;
    commit({
      ...state,
      clues: state.clues.filter((entry) => entry.id !== clueId),
      scenarios: state.scenarios.map((scenario) => ({ ...scenario, clueIds: scenario.clueIds.filter((id) => id !== clueId) }))
    }, 'Pista excluida');
  }

  function addConnection(targetId: string) {
    if (!activeScenario || !targetId) return;
    patchScenario(activeScenario.id, { connectedScenarioIds: uniqueList([...activeScenario.connectedScenarioIds, targetId]) }, 'Conexao adicionada');
  }

  function importBulk() {
    const result = importScenariosFromText(state, bulkText);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setActiveScenarioId(result.activeScenarioId || activeScenarioId);
    commitImmediate(result.state, result.message);
  }

  const activeNpcIds = activeScenario?.npcIds || [];
  const activeEventIds = activeScenario?.eventIds || [];
  const activeClueIds = activeScenario?.clueIds || [];
  const activeNpcs = activeNpcIds.map((id) => state.npcs.find((npc) => npc.id === id)).filter(Boolean) as ScenarioNpcRecord[];
  const availableNpcs = state.npcs.filter((npc) => !activeNpcIds.includes(npc.id));
  const activeEvents = activeEventIds
    .map((id) => state.events.find((entry) => entry.id === id))
    .filter(Boolean)
    .sort((left, right) => Number((right as ScenarioEventRecord).priority || 0) - Number((left as ScenarioEventRecord).priority || 0)) as ScenarioEventRecord[];
  const availableEvents = state.events.filter((entry) => !activeEventIds.includes(entry.id));
  const activeClues = activeClueIds.map((id) => state.clues.find((entry) => entry.id === id)).filter(Boolean) as ScenarioClueRecord[];
  const availableClues = state.clues.filter((entry) => !activeClueIds.includes(entry.id));

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <aside className="grid content-start gap-4 rounded-lg border border-line bg-panel/90 p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Cenarios da sessao</h2>
            <p className="mt-1 text-sm text-textMuted">Troque de lugar rapidamente e atualize tudo em tempo real.</p>
          </div>
          <Button type="button" onClick={addScenario}>Novo</Button>
        </div>

        <div className="grid gap-3">
          <ScenarioField label="Buscar" value={filters.search} placeholder="Nome, tag ou nota" onChange={(value) => setFilters((current) => ({ ...current, search: value }))} />
          <ScenarioSelect label="Tipo" value={filters.type} options={[['all', 'Todos'], ...SCENARIO_TYPES.map((type) => [type, getScenarioTypeLabel(type)] as [string, string])]} onChange={(value) => setFilters((current) => ({ ...current, type: value }))} />
          <ScenarioSelect label="Status" value={filters.status} options={[['all', 'Todos'], ...SCENARIO_STATUSES.map((status) => [status, getScenarioStatusLabel(status)] as [string, string])]} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} />
          <ScenarioField label="Tags" value={filters.tags} placeholder="tag1, tag2" onChange={(value) => setFilters((current) => ({ ...current, tags: value }))} />
        </div>

        <details className="rounded-lg border border-line bg-white/5 p-3">
          <summary className="cursor-pointer font-black">Importar por texto</summary>
          <p className="mt-2 text-sm text-textMuted">Cole um cenario em blocos Markdown: resumo, NPCs, acontecimentos, pistas, notas e conexoes.</p>
          <textarea
            className={`${fieldClass} mt-3 min-h-36`}
            placeholder={'# Nome do cenario\n\n## RESUMO RAPIDO\nNome: ...\nTipo: Entrada'}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={importBulk}>Importar cenario</Button>
            <Button type="button" onClick={() => {
              setBulkText('');
              setMessage('');
            }}>Limpar</Button>
          </div>
        </details>

        <div className="grid gap-2">
          {filteredScenarios.length ? filteredScenarios.map((scenario) => {
            const isActive = scenario.id === activeScenario?.id;
            return (
              <article
                className={isActive ? 'grid gap-2 rounded-lg border border-vita/50 bg-vita/15 p-3' : 'grid gap-2 rounded-lg border border-line bg-white/5 p-3'}
                key={scenario.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <strong>{scenario.name || 'Sem nome'}</strong>
                  <Badge tone={scenario.status === 'active' ? 'accent' : 'neutral'}>{getScenarioStatusLabel(scenario.status)}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{getScenarioTypeLabel(scenario.type)}</Badge>
                  {scenario.isCurrent ? <Badge>Agora</Badge> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => setActiveScenarioId(scenario.id)}>Abrir</Button>
                  <Button type="button" onClick={() => setScenarioActive(scenario.id, true)}>Ativar</Button>
                  <Button type="button" onClick={() => patchScenario(scenario.id, { status: 'visited' }, 'Cenario atualizado')}>Visitado</Button>
                  <Button type="button" onClick={() => patchScenario(scenario.id, { status: 'changed' }, 'Cenario atualizado')}>Alterado</Button>
                  <Button type="button" onClick={() => duplicateScenario(scenario.id)}>Duplicar</Button>
                  <Button type="button" onClick={() => moveScenario(scenario.id, -1)}>Subir</Button>
                  <Button type="button" onClick={() => moveScenario(scenario.id, 1)}>Descer</Button>
                  <Button tone="danger" type="button" onClick={() => deleteScenario(scenario.id)}>Excluir</Button>
                </div>
              </article>
            );
          }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum cenario encontrado.</p>}
        </div>
      </aside>

      <main className="grid content-start gap-4">
        {!activeScenario ? (
          <Card>Selecione ou crie um cenario para visualizar detalhes.</Card>
        ) : (
          <div className="grid gap-4" key={activeScenario.id}>
            <section className="rounded-lg border border-line bg-panel/90 p-4 shadow-soft">
              <details open>
                <summary className="cursor-pointer font-black">Resumo rapido</summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <ScenarioField label="Nome" value={activeScenario.name} onChange={(value) => updateScenarioField(activeScenario.id, 'name', value)} />
                  <ScenarioSelect label="Tipo" value={activeScenario.type} options={SCENARIO_TYPES.map((type) => [type, getScenarioTypeLabel(type)] as [string, string])} onChange={(value) => updateScenarioField(activeScenario.id, 'type', value)} />
                  <ScenarioField label="Clima / atmosfera" value={activeScenario.mood} onChange={(value) => updateScenarioField(activeScenario.id, 'mood', value)} />
                  <ScenarioField label="Funcao narrativa" value={activeScenario.narrativePurpose} onChange={(value) => updateScenarioField(activeScenario.id, 'narrativePurpose', value)} />
                  <ScenarioField label="Objetivo do lugar" value={activeScenario.objective} onChange={(value) => updateScenarioField(activeScenario.id, 'objective', value)} />
                  <ScenarioField label="Resumo" value={activeScenario.summary} onChange={(value) => updateScenarioField(activeScenario.id, 'summary', value)} />
                  <ScenarioSelect label="Estado atual" value={activeScenario.status} options={SCENARIO_STATUSES.map((status) => [status, getScenarioStatusLabel(status)] as [string, string])} onChange={(value) => updateScenarioField(activeScenario.id, 'status', value)} />
                  <ScenarioField label="Tags" value={activeScenario.tags.join(', ')} placeholder="tag1, tag2" onChange={(value) => updateScenarioField(activeScenario.id, 'tags', value)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input checked={activeScenario.playersHere} type="checkbox" onChange={(event) => updateScenarioField(activeScenario.id, 'playersHere', event.target.checked)} />
                    Players estao aqui agora
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input checked={activeScenario.isCurrent} type="checkbox" onChange={(event) => updateScenarioField(activeScenario.id, 'isCurrent', event.target.checked)} />
                    Cenario ativo agora
                  </label>
                </div>
              </details>
            </section>

            <ScenarioSection title="Descricao de mesa">
              <ScenarioTextarea value={activeScenario.playerFacingDescription} placeholder="Texto para narrar a chegada" onChange={(value) => updateScenarioField(activeScenario.id, 'playerFacingDescription', value)} />
            </ScenarioSection>

            <ScenarioSection title="NPCs do cenario">
              <div className="grid gap-3">
                {activeNpcs.length ? activeNpcs.map((npc) => (
                  <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={npc.id}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ScenarioField label="Nome" value={npc.name} placeholder="Nome do NPC" onChange={(value) => patchNpc(npc.id, { name: value })} />
                      <ScenarioField label="Funcao" value={npc.role} onChange={(value) => patchNpc(npc.id, { role: value })} />
                      <ScenarioField label="Atitude" value={npc.attitude} onChange={(value) => patchNpc(npc.id, { attitude: value })} />
                      <ScenarioField label="O que faz agora" value={npc.currentAction} onChange={(value) => patchNpc(npc.id, { currentAction: value })} />
                      <ScenarioField label="Segredo / detalhe" value={npc.secret} onChange={(value) => patchNpc(npc.id, { secret: value })} />
                      <ScenarioSelect label="Status" value={npc.status} options={SCENARIO_NPC_STATUSES.map((status) => [status, status] as [string, string])} onChange={(value) => patchNpc(npc.id, { status: value })} />
                      <ScenarioSelect label="Local" value={npc.locationScenarioId} options={state.scenarios.map((scenario) => [scenario.id, scenario.name] as [string, string])} onChange={(value) => setNpcLocation(npc.id, value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => patchNpc(npc.id, { status: 'present', locationScenarioId: activeScenario.id })}>Presente agora</Button>
                      <Button type="button" onClick={() => unlinkNpc(npc.id)}>Remover vinculo</Button>
                      <Button tone="danger" type="button" onClick={() => deleteNpc(npc.id)}>Excluir NPC</Button>
                    </div>
                  </article>
                )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum NPC vinculado.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={addNpc}>Novo NPC</Button>
                  <ScenarioInlineSelect label="Vincular existente" value="" options={availableNpcs.map((npc) => [npc.id, npc.name] as [string, string])} onChange={(value) => value && setNpcLocation(value, activeScenario.id)} />
                </div>
              </div>
            </ScenarioSection>

            <ScenarioSection title="Acontecimentos possiveis">
              <div className="grid gap-3">
                {activeEvents.length ? activeEvents.map((eventEntry) => (
                  <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={eventEntry.id}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ScenarioField label="Titulo" value={eventEntry.title} onChange={(value) => patchEvent(eventEntry.id, { title: value })} />
                      <ScenarioNumber label="Prioridade" value={eventEntry.priority} onChange={(value) => patchEvent(eventEntry.id, { priority: value })} />
                      <ScenarioField label="Gatilho" value={eventEntry.trigger} onChange={(value) => patchEvent(eventEntry.id, { trigger: value })} />
                      <ScenarioSelect label="Status" value={eventEntry.status} options={SCENARIO_EVENT_STATUSES.map((status) => [status, status] as [string, string])} onChange={(value) => patchEvent(eventEntry.id, { status: value })} />
                      <ScenarioSelect label="Cenario" value={eventEntry.scenarioId} options={state.scenarios.map((scenario) => [scenario.id, scenario.name] as [string, string])} onChange={(value) => setEventLocation(eventEntry.id, value)} />
                    </div>
                    <ScenarioTextarea label="Descricao" value={eventEntry.description} onChange={(value) => patchEvent(eventEntry.id, { description: value })} />
                    <ScenarioTextarea label="Consequencia" value={eventEntry.consequence} onChange={(value) => patchEvent(eventEntry.id, { consequence: value })} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => patchEvent(eventEntry.id, { priority: eventEntry.priority + 1 })}>Prioridade +</Button>
                      <Button type="button" onClick={() => patchEvent(eventEntry.id, { priority: Math.max(0, eventEntry.priority - 1) })}>Prioridade -</Button>
                      <Button type="button" onClick={() => patchEvent(eventEntry.id, { status: 'used' })}>Marcar como usado</Button>
                      <Button type="button" onClick={() => patchEvent(eventEntry.id, { status: 'discarded' })}>Descartar</Button>
                      <Button type="button" onClick={() => duplicateEvent(eventEntry.id)}>Duplicar</Button>
                      <Button tone="danger" type="button" onClick={() => deleteEvent(eventEntry.id)}>Excluir</Button>
                    </div>
                  </article>
                )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum acontecimento cadastrado.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={addEvent}>Novo acontecimento</Button>
                  <ScenarioInlineSelect label="Vincular existente" value="" options={availableEvents.map((entry) => [entry.id, entry.title] as [string, string])} onChange={(value) => value && setEventLocation(value, activeScenario.id)} />
                </div>
              </div>
            </ScenarioSection>

            <ScenarioSection title="Pistas / informacoes">
              <div className="grid gap-3">
                {activeClues.length ? activeClues.map((clue) => (
                  <article className="grid gap-3 rounded-lg border border-line bg-white/5 p-3" key={clue.id}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <ScenarioField label="Titulo" value={clue.title} onChange={(value) => patchClue(clue.id, { title: value })} />
                      <ScenarioSelect label="Status" value={clue.status} options={SCENARIO_CLUE_STATUSES.map((status) => [status, status] as [string, string])} onChange={(value) => patchClue(clue.id, { status: value })} />
                      <ScenarioSelect label="Cenario" value={clue.scenarioId} options={state.scenarios.map((scenario) => [scenario.id, scenario.name] as [string, string])} onChange={(value) => setClueLocation(clue.id, value)} />
                    </div>
                    <ScenarioTextarea label="Descricao" value={clue.description} onChange={(value) => patchClue(clue.id, { description: value })} />
                    <ScenarioTextarea label="Como pode ser descoberta" value={clue.discoveryMethod} onChange={(value) => patchClue(clue.id, { discoveryMethod: value })} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => patchClue(clue.id, { status: 'found' })}>Descoberta</Button>
                      <Button type="button" onClick={() => patchClue(clue.id, { status: 'missed' })}>Perdida</Button>
                      <Button tone="danger" type="button" onClick={() => deleteClue(clue.id)}>Excluir</Button>
                    </div>
                  </article>
                )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhuma pista cadastrada.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={addClue}>Nova pista</Button>
                  <ScenarioInlineSelect label="Vincular existente" value="" options={availableClues.map((entry) => [entry.id, entry.title] as [string, string])} onChange={(value) => value && setClueLocation(value, activeScenario.id)} />
                </div>
              </div>
            </ScenarioSection>

            <ScenarioSection title="Notas rapidas do mestre">
              <ScenarioTextarea value={activeScenario.notes} placeholder="Notas de mesa em tempo real" onChange={(value) => updateScenarioField(activeScenario.id, 'notes', value)} />
            </ScenarioSection>

            <ScenarioSection title="Conexoes do cenario">
              <div className="grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {activeScenario.connectedScenarioIds.length ? activeScenario.connectedScenarioIds.map((id) => {
                    const connected = state.scenarios.find((scenario) => scenario.id === id);
                    if (!connected) return null;
                    return <Button key={id} type="button" onClick={() => setActiveScenarioId(id)}>{connected.name}</Button>;
                  }) : <span className="text-sm text-textMuted">Sem conexoes ainda.</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScenarioInlineSelect
                    label="Adicionar conexao"
                    value=""
                    options={state.scenarios.filter((scenario) => scenario.id !== activeScenario.id && !activeScenario.connectedScenarioIds.includes(scenario.id)).map((scenario) => [scenario.id, scenario.name] as [string, string])}
                    onChange={addConnection}
                  />
                  <Button type="button" onClick={() => patchScenario(activeScenario.id, { connectedScenarioIds: [] })}>Limpar</Button>
                </div>
              </div>
            </ScenarioSection>
          </div>
        )}
      </main>

      <aside className="grid content-start gap-4 rounded-lg border border-line bg-panel/90 p-4 shadow-soft">
        <section className="grid gap-3">
          <h2 className="font-black">Estado da sessao</h2>
          <ScenarioField label="Nome da sessao" value={state.session.name} onChange={(value) => commit({ ...state, session: { ...state.session, name: value } })} />
          <ScenarioField label="Cena atual" value={state.session.currentScene} onChange={(value) => commit({ ...state, session: { ...state.session, currentScene: value } })} />
          <ScenarioField label="Cenario atual" value={activeScenario?.name || ''} readOnly onChange={() => undefined} />
          <ScenarioField label="Clima geral" value={state.session.mood} onChange={(value) => commit({ ...state, session: { ...state.session, mood: value } })} />
          <ScenarioField label="Pressao atual" value={state.session.pressure} onChange={(value) => commit({ ...state, session: { ...state.session, pressure: value } })} />
          <ScenarioTextarea label="Observacao" value={state.session.note} onChange={(value) => commit({ ...state, session: { ...state.session, note: value } })} />
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">Clocks</h2>
            <Button type="button" onClick={() => commit({ ...state, clocks: [...state.clocks, createClockSeed()] }, 'Clock criado')}>Novo</Button>
          </div>
          {state.clocks.length ? state.clocks.map((clock) => (
            <article className="grid gap-2 rounded-lg border border-line bg-white/5 p-3" key={clock.id}>
              <ScenarioField label="Relogio" value={clock.title} onChange={(value) => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, title: value } : item) })} />
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-end gap-2">
                <Button type="button" onClick={() => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, current: Math.max(0, item.current - 1) } : item) })}>-</Button>
                <ScenarioNumber label="Atual" value={clock.current} onChange={(value) => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, current: value } : item) })} />
                <span className="pb-2 text-textMuted">/</span>
                <ScenarioNumber label="Max" value={clock.max} min={1} onChange={(value) => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, max: Math.max(1, value) } : item) })} />
                <Button type="button" onClick={() => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, current: Math.min(item.max, item.current + 1) } : item) })}>+</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <input className="h-10 w-14 rounded-lg border border-line bg-white/5" type="color" value={clock.color} onChange={(event) => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, color: event.target.value } : item) })} />
                <Button type="button" onClick={() => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, current: 0 } : item) })}>Reset</Button>
                <Button tone="danger" type="button" onClick={() => commit({ ...state, clocks: state.clocks.filter((item) => item.id !== clock.id) }, 'Clock excluido')}>Excluir</Button>
              </div>
              <ScenarioField label="Notas" value={clock.notes} onChange={(value) => commit({ ...state, clocks: state.clocks.map((item) => item.id === clock.id ? { ...item, notes: value } : item) })} />
            </article>
          )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Sem clocks ainda.</p>}
        </section>

        <section className="grid gap-3">
          <h2 className="font-black">NPCs ativos da sessao</h2>
          {state.npcs.length ? state.npcs.map((npc) => {
            const location = npc.locationScenarioId ? state.scenarios.find((scenario) => scenario.id === npc.locationScenarioId) : null;
            return (
              <article className="grid gap-1 rounded-lg border border-line bg-white/5 p-3 text-sm" key={npc.id}>
                <strong>{npc.name || 'NPC'}</strong>
                <span className="text-textMuted">{npc.status}</span>
                <span className="text-textMuted">{location?.name || 'Sem local'}</span>
                <span className="text-textMuted">{npc.attitude}</span>
              </article>
            );
          }) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum NPC cadastrado.</p>}
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black">Eventos do arco</h2>
            <Button type="button" onClick={() => commit({ ...state, arcEvents: [...state.arcEvents, createArcEventSeed()] }, 'Evento criado')}>Novo</Button>
          </div>
          {state.arcEvents.length ? state.arcEvents.map((eventEntry) => (
            <article className="grid gap-2 rounded-lg border border-line bg-white/5 p-3" key={eventEntry.id}>
              <ScenarioField label="Titulo" value={eventEntry.title} onChange={(value) => commit({ ...state, arcEvents: state.arcEvents.map((item) => item.id === eventEntry.id ? { ...item, title: value } : item) })} />
              <ScenarioTextarea label="Descricao" value={eventEntry.description} onChange={(value) => commit({ ...state, arcEvents: state.arcEvents.map((item) => item.id === eventEntry.id ? { ...item, description: value } : item) })} />
              <ScenarioField label="Gatilho" value={eventEntry.trigger} onChange={(value) => commit({ ...state, arcEvents: state.arcEvents.map((item) => item.id === eventEntry.id ? { ...item, trigger: value } : item) })} />
              <ScenarioSelect label="Status" value={eventEntry.status} options={ARC_EVENT_STATUSES.map((status) => [status, status] as [string, string])} onChange={(value) => commit({ ...state, arcEvents: state.arcEvents.map((item) => item.id === eventEntry.id ? { ...item, status: value } : item) })} />
              <Button tone="danger" type="button" onClick={() => commit({ ...state, arcEvents: state.arcEvents.filter((item) => item.id !== eventEntry.id) }, 'Evento removido')}>Excluir</Button>
            </article>
          )) : <p className="rounded-lg border border-dashed border-line bg-white/5 px-3 py-4 text-sm text-textMuted">Nenhum evento global.</p>}
        </section>

        <div className="flex flex-wrap gap-2">
          {saving ? <Badge tone="warn">Salvando</Badge> : <Badge tone="good">Cenarios salvos</Badge>}
          {message ? <Badge>{message}</Badge> : null}
        </div>
      </aside>
    </div>
  );
}

function ScenarioSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-panel/90 p-4 shadow-soft">
      <details open>
        <summary className="cursor-pointer font-black">{title}</summary>
        <div className="mt-3">{children}</div>
      </details>
    </section>
  );
}

function ScenarioField({
  label,
  value,
  placeholder,
  readOnly,
  onChange
}: {
  label: string;
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange(value: string): void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <input className={fieldClass} readOnly={readOnly} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ScenarioTextarea({
  label,
  value,
  placeholder,
  onChange
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onChange(value: string): void;
}) {
  const textarea = (
    <textarea className={`${fieldClass} min-h-24`} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  );
  if (!label) return textarea;
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      {textarea}
    </label>
  );
}

function ScenarioSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange(value: string): void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function ScenarioInlineSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<[string, string]>; onChange(value: string): void }) {
  return (
    <label className="grid min-w-48 gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selecionar</option>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function ScenarioNumber({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange(value: number): void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <input className={fieldClass} min={min} type="number" value={Number(value || 0)} onChange={(event) => onChange(Number(event.target.value || 0))} />
    </label>
  );
}

function getInitialScenarioState(remoteState: ScenarioState | null | undefined): FullScenarioState {
  if (hasScenarioPayload(remoteState)) return normalizeScenarioState(remoteState);
  const local = loadScenarioStateLocal();
  return normalizeScenarioState(local || createScenarioStateSeed());
}

function normalizeScenarioState(input: unknown): FullScenarioState {
  const safe = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const session = safe.session && typeof safe.session === 'object' ? safe.session as Record<string, unknown> : {};
  const scenarios = Array.isArray(safe.scenarios)
    ? safe.scenarios.map((entry, index) => normalizeScenarioRecord(entry, index))
    : [];
  if (!scenarios.length) scenarios.push(createScenarioSeed('Cena inicial'));
  syncScenarioOrders(scenarios);

  const currentScenarioId = String(session.currentScenarioId || scenarios.find((scenario) => scenario.isCurrent)?.id || scenarios[0]?.id || '');
  return {
    session: {
      name: String(session.name || 'Sessao atual'),
      currentScene: String(session.currentScene || ''),
      currentScenarioId,
      mood: String(session.mood || ''),
      pressure: String(session.pressure || ''),
      note: String(session.note || '')
    },
    scenarios: scenarios.map((scenario) => ({
      ...scenario,
      isCurrent: scenario.id === currentScenarioId
    })),
    npcs: Array.isArray(safe.npcs) ? safe.npcs.map(normalizeNpcRecord) : [],
    events: Array.isArray(safe.events) ? safe.events.map(normalizeEventRecord) : [],
    clues: Array.isArray(safe.clues) ? safe.clues.map(normalizeClueRecord) : [],
    clocks: Array.isArray(safe.clocks) ? safe.clocks.map(normalizeClockRecord) : [],
    arcEvents: Array.isArray(safe.arcEvents) ? safe.arcEvents.map(normalizeArcEventRecord) : []
  };
}

function normalizeScenarioRecord(input: unknown, index = 0): ScenarioRecord {
  const entry = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    id: String(entry.id || createId('scenario')),
    name: String(entry.name || entry.title || 'Novo cenario'),
    type: SCENARIO_TYPES.includes(entry.type as typeof SCENARIO_TYPES[number]) ? String(entry.type) : 'entry',
    status: SCENARIO_STATUSES.includes(entry.status as typeof SCENARIO_STATUSES[number]) ? String(entry.status) : 'unvisited',
    order: Math.max(1, Number(entry.order || index + 1)),
    mood: String(entry.mood || ''),
    narrativePurpose: String(entry.narrativePurpose || ''),
    objective: String(entry.objective || ''),
    summary: String(entry.summary || entry.description || ''),
    playerFacingDescription: String(entry.playerFacingDescription || ''),
    notes: String(entry.notes || ''),
    tags: Array.isArray(entry.tags) ? uniqueList(entry.tags.map(String).filter(Boolean)) : normalizeTagsInput(String(entry.tags || '')),
    connectedScenarioIds: Array.isArray(entry.connectedScenarioIds) ? uniqueList(entry.connectedScenarioIds.map(String).filter(Boolean)) : [],
    npcIds: Array.isArray(entry.npcIds) ? uniqueList(entry.npcIds.map(String).filter(Boolean)) : [],
    eventIds: Array.isArray(entry.eventIds) ? uniqueList(entry.eventIds.map(String).filter(Boolean)) : [],
    clueIds: Array.isArray(entry.clueIds) ? uniqueList(entry.clueIds.map(String).filter(Boolean)) : [],
    isCurrent: Boolean(entry.isCurrent),
    playersHere: Boolean(entry.playersHere)
  };
}

function normalizeNpcRecord(input: unknown): ScenarioNpcRecord {
  const entry = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    id: String(entry.id || createId('npc')),
    name: String(entry.name || 'NPC'),
    role: String(entry.role || ''),
    attitude: String(entry.attitude || ''),
    currentAction: String(entry.currentAction || ''),
    secret: String(entry.secret || ''),
    status: SCENARIO_NPC_STATUSES.includes(entry.status as typeof SCENARIO_NPC_STATUSES[number]) ? String(entry.status) : 'present',
    locationScenarioId: String(entry.locationScenarioId || ''),
    notes: String(entry.notes || '')
  };
}

function normalizeEventRecord(input: unknown): ScenarioEventRecord {
  const entry = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    id: String(entry.id || createId('event')),
    title: String(entry.title || 'Acontecimento'),
    priority: Math.max(0, Number(entry.priority || 0)),
    trigger: String(entry.trigger || ''),
    description: String(entry.description || ''),
    consequence: String(entry.consequence || ''),
    status: SCENARIO_EVENT_STATUSES.includes(entry.status as typeof SCENARIO_EVENT_STATUSES[number]) ? String(entry.status) : 'available',
    scenarioId: String(entry.scenarioId || '')
  };
}

function normalizeClueRecord(input: unknown): ScenarioClueRecord {
  const entry = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    id: String(entry.id || createId('clue')),
    title: String(entry.title || 'Pista'),
    description: String(entry.description || ''),
    discoveryMethod: String(entry.discoveryMethod || ''),
    status: SCENARIO_CLUE_STATUSES.includes(entry.status as typeof SCENARIO_CLUE_STATUSES[number]) ? String(entry.status) : 'hidden',
    scenarioId: String(entry.scenarioId || '')
  };
}

function normalizeClockRecord(input: unknown): ScenarioClockRecord {
  const entry = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    id: String(entry.id || createId('clock')),
    title: String(entry.title || 'Novo clock'),
    current: Math.max(0, Number(entry.current || 0)),
    max: Math.max(1, Number(entry.max || 4)),
    color: String(entry.color || '#7f6be5'),
    notes: String(entry.notes || '')
  };
}

function normalizeArcEventRecord(input: unknown): ScenarioArcEventRecord {
  const entry = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  return {
    id: String(entry.id || createId('arc')),
    title: String(entry.title || 'Evento do arco'),
    description: String(entry.description || ''),
    trigger: String(entry.trigger || ''),
    status: ARC_EVENT_STATUSES.includes(entry.status as typeof ARC_EVENT_STATUSES[number]) ? String(entry.status) : 'latent'
  };
}

function createScenarioSeed(name = 'Novo cenario'): ScenarioRecord {
  return {
    id: createId('scenario'),
    name,
    type: 'entry',
    status: 'unvisited',
    order: 1,
    mood: '',
    narrativePurpose: '',
    objective: '',
    summary: '',
    playerFacingDescription: '',
    notes: '',
    tags: [],
    connectedScenarioIds: [],
    npcIds: [],
    eventIds: [],
    clueIds: [],
    isCurrent: false,
    playersHere: false
  };
}

function createScenarioStateSeed(): FullScenarioState {
  const scenario = createScenarioSeed('Cena inicial');
  return normalizeScenarioState({
    session: {
      name: 'Sessao atual',
      currentScene: '',
      currentScenarioId: scenario.id,
      mood: '',
      pressure: '',
      note: ''
    },
    scenarios: [{ ...scenario, order: 1 }],
    npcs: [],
    events: [],
    clues: [],
    clocks: [],
    arcEvents: []
  });
}

function createNpcSeed(name = 'NPC', scenarioId = ''): ScenarioNpcRecord {
  return {
    id: createId('npc'),
    name,
    role: '',
    attitude: '',
    currentAction: '',
    secret: '',
    status: 'present',
    locationScenarioId: scenarioId,
    notes: ''
  };
}

function createEventSeed(title = 'Acontecimento', scenarioId = ''): ScenarioEventRecord {
  return {
    id: createId('event'),
    title,
    priority: 1,
    trigger: '',
    description: '',
    consequence: '',
    status: 'available',
    scenarioId
  };
}

function createClueSeed(title = 'Pista', scenarioId = ''): ScenarioClueRecord {
  return {
    id: createId('clue'),
    title,
    description: '',
    discoveryMethod: '',
    status: 'hidden',
    scenarioId
  };
}

function createClockSeed(): ScenarioClockRecord {
  return {
    id: createId('clock'),
    title: 'Novo clock',
    current: 0,
    max: 4,
    color: '#7f6be5',
    notes: ''
  };
}

function createArcEventSeed(): ScenarioArcEventRecord {
  return {
    id: createId('arc'),
    title: 'Evento do arco',
    description: '',
    trigger: '',
    status: 'latent'
  };
}

function hasScenarioPayload(value: unknown) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && (
      Array.isArray((value as Record<string, unknown>).scenarios)
      || Array.isArray((value as Record<string, unknown>).npcs)
      || Array.isArray((value as Record<string, unknown>).events)
      || Array.isArray((value as Record<string, unknown>).clues)
      || (value as Record<string, unknown>).session
    )
  );
}

function loadScenarioStateLocal(): FullScenarioState | null {
  try {
    const raw = window.localStorage.getItem(MASTER_SCENARIO_STORAGE_KEY);
    return raw ? normalizeScenarioState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function saveScenarioStateLocal(state: FullScenarioState) {
  try {
    window.localStorage.setItem(MASTER_SCENARIO_STORAGE_KEY, JSON.stringify(normalizeScenarioState(state)));
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

function applyScenarioFilters(list: ScenarioRecord[], filters: { search: string; type: string; status: string; tags: string }) {
  const search = filters.search.trim().toLowerCase();
  const tagFilter = normalizeTagsInput(filters.tags);
  return list.filter((scenario) => {
    if (filters.type !== 'all' && scenario.type !== filters.type) return false;
    if (filters.status !== 'all' && scenario.status !== filters.status) return false;
    if (tagFilter.length && !scenario.tags.some((tag) => tagFilter.includes(tag))) return false;
    if (!search) return true;
    const haystack = [
      scenario.name,
      scenario.summary,
      scenario.playerFacingDescription,
      scenario.notes,
      scenario.tags.join(' ')
    ].join(' ').toLowerCase();
    return haystack.includes(search);
  });
}

function syncScenarioOrders(list: ScenarioRecord[]) {
  list.forEach((scenario, index) => {
    scenario.order = index + 1;
  });
}

function normalizeTagsInput(value: unknown) {
  if (!value) return [];
  return uniqueList(
    String(value)
      .split(',')
      .map((tag) => slugifyScenarioTag(tag))
      .filter(Boolean)
  ).slice(0, 10);
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.map(String).filter(Boolean)));
}

function slugifyScenarioTag(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getScenarioTypeLabel(type: string) {
  const map: Record<string, string> = {
    entry: 'Entrada',
    social: 'Social',
    danger: 'Perigo',
    faction: 'Faccao',
    rest: 'Descanso',
    secret: 'Segredo',
    investigation: 'Investigacao',
    combat: 'Combate',
    support: 'Suporte'
  };
  return map[type] || 'Entrada';
}

function getScenarioStatusLabel(status: string) {
  const map: Record<string, string> = {
    unvisited: 'Nao visitado',
    active: 'Ativo',
    visited: 'Visitado',
    changed: 'Alterado'
  };
  return map[status] || 'Nao visitado';
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeImportLookup(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cleanMarkdownLine(value: unknown) {
  return String(value || '')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim();
}

function cleanMarkdownBody(value: unknown) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => !/^\s*-{3,}\s*$/.test(line))
    .join('\n')
    .trim();
}

function parseMarkdownFields(text: string) {
  const fields = new Map<string, string>();
  const looseLines: string[] = [];

  text.replace(/\r/g, '').split('\n').forEach((line) => {
    if (/^\s*-{3,}\s*$/.test(line)) return;
    const cleaned = cleanMarkdownLine(line);
    if (!cleaned) {
      looseLines.push('');
      return;
    }
    const match = cleaned.match(/^([^:]{1,90}):\s*(.*)$/);
    if (!match) {
      looseLines.push(line);
      return;
    }
    fields.set(normalizeImportLookup(match[1]), match[2].trim());
  });

  return {
    fields,
    body: cleanMarkdownBody(looseLines.join('\n'))
  };
}

function getImportedField(fields: Map<string, string>, keys: string | string[]) {
  const safeKeys = Array.isArray(keys) ? keys : [keys];
  for (const key of safeKeys) {
    const value = fields.get(normalizeImportLookup(key));
    if (value !== undefined) return value;
  }
  return '';
}

function mapImportedScenarioType(value: unknown) {
  const text = normalizeImportLookup(value);
  if (text.includes('social')) return 'social';
  if (text.includes('perigo') || text.includes('danger')) return 'danger';
  if (text.includes('faccao') || text.includes('faction')) return 'faction';
  if (text.includes('descanso') || text.includes('rest')) return 'rest';
  if (text.includes('segredo') || text.includes('secret')) return 'secret';
  if (text.includes('investigacao') || text.includes('investigation')) return 'investigation';
  if (text.includes('combate') || text.includes('combat')) return 'combat';
  if (text.includes('suporte') || text.includes('support')) return 'support';
  return 'entry';
}

function mapImportedScenarioStatus(value: unknown) {
  const text = normalizeImportLookup(value);
  if (text.includes('active') || text.includes('ativo')) return 'active';
  if (text.includes('visited') || text.includes('visitado')) return 'visited';
  if (text.includes('changed') || text.includes('alterado')) return 'changed';
  return 'unvisited';
}

function mapImportedNpcStatus(value: unknown) {
  const text = normalizeImportLookup(value);
  if (text.includes('absent') || text.includes('ausente')) return 'absent';
  if (text.includes('hostile') || text.includes('hostil')) return 'hostile';
  if (text.includes('friendly') || text.includes('amigavel') || text.includes('aliado')) return 'friendly';
  if (text.includes('hidden') || text.includes('oculto') || text.includes('escondido')) return 'hidden';
  if (text.includes('neutral') || text.includes('neutro')) return 'neutral';
  return 'present';
}

function mapImportedEventStatus(value: unknown) {
  const text = normalizeImportLookup(value);
  if (text.includes('used') || text.includes('usado') || text.includes('aconteceu')) return 'used';
  if (text.includes('discarded') || text.includes('descart')) return 'discarded';
  if (text.includes('moved') || text.includes('movido')) return 'moved';
  return 'available';
}

function mapImportedClueStatus(value: unknown) {
  const text = normalizeImportLookup(value);
  if (text.includes('found') || text.includes('descobert')) return 'found';
  if (text.includes('missed') || text.includes('perdid')) return 'missed';
  return 'hidden';
}

function splitScenarioImportBlocks(text: string) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  const pushCurrent = () => {
    const block = current.join('\n');
    if (cleanMarkdownBody(block)) blocks.push(block);
  };

  lines.forEach((line) => {
    if (/^#(?!#)\s+/.test(line.trim())) {
      pushCurrent();
      current = [line];
      return;
    }
    current.push(line);
  });

  pushCurrent();
  return blocks.length ? blocks : [text].filter((entry) => entry.trim());
}

function parseScenarioImportSections(blockText: string) {
  const lines = blockText.replace(/\r/g, '').split('\n');
  const sections: Array<{ heading: string; lines: string[] }> = [];
  let title = '';
  let current = { heading: '', lines: [] as string[] };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const titleMatch = trimmed.match(/^#(?!#)\s+(.+)$/);
    if (titleMatch) {
      title = cleanMarkdownLine(titleMatch[1]);
      return;
    }
    const sectionMatch = trimmed.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      if (current.heading || current.lines.join('\n').trim()) sections.push(current);
      current = { heading: cleanMarkdownLine(sectionMatch[1]), lines: [] };
      return;
    }
    current.lines.push(line);
  });

  if (current.heading || current.lines.join('\n').trim()) sections.push(current);
  return { title, sections };
}

function parseScenarioImportList(text: string) {
  const lines = cleanMarkdownBody(text)
    .split('\n')
    .map((line) => cleanMarkdownLine(line))
    .filter(Boolean);
  if (lines.length === 1 && lines[0].includes(',')) {
    return lines[0].split(',').map((entry) => cleanMarkdownLine(entry)).filter(Boolean);
  }
  return lines;
}

interface ScenarioImportDraft {
  name: string;
  type: string;
  status: string;
  mood: string;
  narrativePurpose: string;
  objective: string;
  summary: string;
  playerFacingDescription: string;
  notes: string;
  tags: string[];
  connections: string[];
  npcs: Array<Partial<ScenarioNpcRecord>>;
  events: Array<Partial<ScenarioEventRecord>>;
  clues: Array<Partial<ScenarioClueRecord>>;
}

function parseScenarioImportDraft(blockText: string): ScenarioImportDraft {
  const parsed = parseScenarioImportSections(blockText);
  const draft: ScenarioImportDraft = {
    name: parsed.title || 'Cenario importado',
    type: 'entry',
    status: 'unvisited',
    mood: '',
    narrativePurpose: '',
    objective: '',
    summary: '',
    playerFacingDescription: '',
    notes: '',
    tags: [],
    connections: [],
    npcs: [],
    events: [],
    clues: []
  };

  parsed.sections.forEach((section) => {
    const heading = normalizeImportLookup(section.heading);
    const body = cleanMarkdownBody(section.lines.join('\n'));
    const parsedFields = parseMarkdownFields(body);

    if (heading.includes('resumo')) {
      const name = getImportedField(parsedFields.fields, 'nome');
      const statusRaw = getImportedField(parsedFields.fields, ['estado atual', 'status']);
      if (name) draft.name = name;
      draft.type = mapImportedScenarioType(getImportedField(parsedFields.fields, 'tipo') || draft.type);
      draft.status = mapImportedScenarioStatus(statusRaw);
      draft.mood = getImportedField(parsedFields.fields, ['clima', 'clima atmosfera', 'atmosfera']) || draft.mood;
      draft.narrativePurpose = getImportedField(parsedFields.fields, ['funcao narrativa']) || draft.narrativePurpose;
      draft.objective = getImportedField(parsedFields.fields, ['objetivo do lugar', 'objetivo']) || draft.objective;
      draft.summary = getImportedField(parsedFields.fields, ['resumo', 'sumario']) || (draft.status === 'unvisited' && statusRaw ? statusRaw : draft.summary);
      draft.tags = normalizeTagsInput(getImportedField(parsedFields.fields, 'tags'));
      return;
    }

    if (heading.includes('descricao')) {
      draft.playerFacingDescription = body;
      return;
    }

    if (heading.startsWith('npc')) {
      draft.npcs.push({
        name: getImportedField(parsedFields.fields, 'nome') || section.heading,
        role: getImportedField(parsedFields.fields, ['funcao', 'papel']),
        attitude: getImportedField(parsedFields.fields, 'atitude'),
        currentAction: getImportedField(parsedFields.fields, ['o que esta fazendo agora', 'acao atual']),
        secret: getImportedField(parsedFields.fields, ['segredo ou detalhe', 'segredo', 'detalhe oculto']),
        status: mapImportedNpcStatus(getImportedField(parsedFields.fields, 'status')),
        notes: parsedFields.body
      });
      return;
    }

    if (heading.includes('acontecimento') || heading.includes('evento')) {
      draft.events.push({
        title: getImportedField(parsedFields.fields, ['titulo']) || section.heading,
        trigger: getImportedField(parsedFields.fields, 'gatilho'),
        description: getImportedField(parsedFields.fields, ['descricao']) || parsedFields.body,
        consequence: getImportedField(parsedFields.fields, ['consequencia']),
        status: mapImportedEventStatus(getImportedField(parsedFields.fields, 'status'))
      });
      return;
    }

    if (heading.includes('pista') || heading.includes('informacao')) {
      draft.clues.push({
        title: getImportedField(parsedFields.fields, ['titulo']) || section.heading,
        description: getImportedField(parsedFields.fields, ['descricao']) || parsedFields.body,
        discoveryMethod: getImportedField(parsedFields.fields, ['como pode ser descoberta', 'como descobrir', 'descoberta']),
        status: mapImportedClueStatus(getImportedField(parsedFields.fields, 'status'))
      });
      return;
    }

    if (heading.includes('nota')) {
      draft.notes = body;
      return;
    }

    if (heading.includes('conexao') || heading.includes('conexoes') || heading.includes('leva para')) {
      draft.connections = parseScenarioImportList(body);
    }
  });

  return draft;
}

function importScenariosFromText(state: FullScenarioState, text: string): { ok: true; state: FullScenarioState; message: string; activeScenarioId: string } | { ok: false; message: string } {
  if (!text.trim()) return { ok: false, message: 'Cole um texto de cenario primeiro.' };
  const drafts = splitScenarioImportBlocks(text)
    .map(parseScenarioImportDraft)
    .filter((draft) => draft.name);
  if (!drafts.length) return { ok: false, message: 'Nao consegui identificar nenhum cenario nesse texto.' };

  let next = normalizeScenarioState(state);
  let created = 0;
  let updated = 0;
  let totalNpcs = 0;
  let totalEvents = 0;
  let totalClues = 0;
  let activeScenarioId = next.session.currentScenarioId;

  drafts.forEach((draft) => {
    const result = upsertScenarioImportDraft(next, draft);
    next = result.state;
    activeScenarioId = result.scenario.id;
    if (result.wasExisting) updated += 1;
    else created += 1;
    totalNpcs += draft.npcs.length;
    totalEvents += draft.events.length;
    totalClues += draft.clues.length;
  });

  next = normalizeScenarioState({
    ...next,
    session: { ...next.session, currentScenarioId: activeScenarioId }
  });

  return {
    ok: true,
    state: next,
    activeScenarioId,
    message: `Importado: ${drafts.length} cenario(s), ${totalNpcs} NPC(s), ${totalEvents} acontecimento(s), ${totalClues} pista(s). ${created} criado(s), ${updated} atualizado(s).`
  };
}

function upsertScenarioImportDraft(state: FullScenarioState, draft: ScenarioImportDraft) {
  const existing = state.scenarios.find((scenario) => normalizeImportLookup(scenario.name) === normalizeImportLookup(draft.name));
  const scenario = existing || createScenarioSeed(draft.name);
  const wasExisting = Boolean(existing);
  if (!wasExisting) scenario.order = state.scenarios.length + 1;

  const nextScenario = normalizeScenarioRecord({
    ...scenario,
    name: draft.name,
    type: draft.type,
    status: draft.status,
    mood: draft.mood || scenario.mood,
    narrativePurpose: draft.narrativePurpose || scenario.narrativePurpose,
    objective: draft.objective || scenario.objective,
    summary: draft.summary || scenario.summary,
    playerFacingDescription: draft.playerFacingDescription || scenario.playerFacingDescription,
    notes: draft.notes || scenario.notes,
    tags: draft.tags,
    npcIds: scenario.npcIds,
    eventIds: scenario.eventIds,
    clueIds: scenario.clueIds,
    connectedScenarioIds: scenario.connectedScenarioIds
  }, scenario.order - 1);

  let next = normalizeScenarioState({
    ...state,
    scenarios: wasExisting
      ? state.scenarios.map((entry) => entry.id === scenario.id ? nextScenario : entry)
      : [...state.scenarios, nextScenario]
  });

  draft.npcs.forEach((entry) => {
    const npc = normalizeNpcRecord({ ...entry, id: createId('npc'), locationScenarioId: nextScenario.id });
    next.npcs.push(npc);
    const target = next.scenarios.find((item) => item.id === nextScenario.id);
    if (target) target.npcIds = uniqueList([...target.npcIds, npc.id]);
  });
  draft.events.forEach((entry, index) => {
    const eventEntry = normalizeEventRecord({ ...entry, id: createId('event'), scenarioId: nextScenario.id, priority: Math.max(1, draft.events.length - index) });
    next.events.push(eventEntry);
    const target = next.scenarios.find((item) => item.id === nextScenario.id);
    if (target) target.eventIds = uniqueList([...target.eventIds, eventEntry.id]);
  });
  draft.clues.forEach((entry) => {
    const clue = normalizeClueRecord({ ...entry, id: createId('clue'), scenarioId: nextScenario.id });
    next.clues.push(clue);
    const target = next.scenarios.find((item) => item.id === nextScenario.id);
    if (target) target.clueIds = uniqueList([...target.clueIds, clue.id]);
  });
  draft.connections.forEach((name) => {
    const connected = getOrCreateConnectedScenario(next, name);
    next = connected.state;
    const target = next.scenarios.find((item) => item.id === nextScenario.id);
    if (target && connected.scenario.id !== target.id) {
      target.connectedScenarioIds = uniqueList([...target.connectedScenarioIds, connected.scenario.id]);
    }
  });

  return { state: normalizeScenarioState(next), scenario: nextScenario, wasExisting };
}

function getOrCreateConnectedScenario(state: FullScenarioState, name: string) {
  const safeName = String(name || '').trim();
  const existing = state.scenarios.find((scenario) => normalizeImportLookup(scenario.name) === normalizeImportLookup(safeName));
  if (existing) return { state, scenario: existing };
  const placeholder = normalizeScenarioRecord({
    ...createScenarioSeed(safeName),
    type: 'support',
    status: 'unvisited',
    summary: 'Criado automaticamente como conexao importada.',
    order: state.scenarios.length + 1
  }, state.scenarios.length);
  const next = normalizeScenarioState({ ...state, scenarios: [...state.scenarios, placeholder] });
  return { state: next, scenario: placeholder };
}

function EditorPanel({
  characters,
  selectedCharacter,
  selectedCharacterId,
  setSelectedCharacterId,
  onResourceChange,
  onCharacterChange,
  combatants,
  onAddCompanionToCombat,
  openCompanionDialogSignal
}: {
  characters: CharacterSheet[];
  selectedCharacter: CharacterSheet | null;
  selectedCharacterId: string;
  setSelectedCharacterId(id: string): void;
  onResourceChange(character: CharacterSheet, key: 'pvCurrent' | 'peCurrent' | 'pdCurrent' | 'instability', value: number): void;
  onCharacterChange(character: CharacterSheet): void;
  combatants: CombatantDraft[];
  onAddCompanionToCombat(characterId: string, companionId: string): void;
  openCompanionDialogSignal: number;
}) {
  const [companionDialogOpen, setCompanionDialogOpen] = useState(false);

  useEffect(() => {
    if (openCompanionDialogSignal > 0) setCompanionDialogOpen(true);
  }, [openCompanionDialogSignal]);

  if (!selectedCharacter) return <Card>Nenhuma ficha disponivel para editar.</Card>;

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Edicao rapida</h2>
            <p className="mt-1 text-sm text-textMuted">Ajustes que o mestre costuma usar durante a sessao.</p>
          </div>
          <Button type="button" onClick={() => setCompanionDialogOpen(true)}>
            Gerenciar mini-fichas ({selectedCharacter.companions.length})
          </Button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-textMuted">Personagem</span>
            <select className={fieldClass} value={selectedCharacterId} onChange={(event) => setSelectedCharacterId(event.target.value)}>
              {characters.map((character) => <option key={character.id} value={character.id}>{character.identity.name}</option>)}
            </select>
          </label>
          <NumberField label="PV atual" value={Number(selectedCharacter.resources.pvCurrent || 0)} onChange={(value) => onResourceChange(selectedCharacter, 'pvCurrent', value)} />
          <NumberField label="PE atual" value={Number(selectedCharacter.resources.peCurrent || 0)} onChange={(value) => onResourceChange(selectedCharacter, 'peCurrent', value)} />
          <NumberField label="PD atual" value={Number(selectedCharacter.resources.pdCurrent || 0)} onChange={(value) => onResourceChange(selectedCharacter, 'pdCurrent', value)} />
          <NumberField label="Instabilidade" value={Number(selectedCharacter.resources.instability || 0)} max={6} onChange={(value) => onResourceChange(selectedCharacter, 'instability', value)} />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-textMuted">Status</span>
            <select
              className={fieldClass}
              value={selectedCharacter.resources.status}
              onChange={(event) => onCharacterChange({ ...selectedCharacter, resources: { ...selectedCharacter.resources, status: event.target.value } })}
            >
              <option value="Vivo">Vivo</option>
              <option value="Morrendo">Morrendo</option>
              <option value="Morto">Morto</option>
            </select>
          </label>
          <label className="grid gap-2 md:col-span-3">
            <span className="text-sm font-semibold text-textMuted">Notas rapidas do mestre</span>
            <textarea
              className={`${fieldClass} min-h-28`}
              defaultValue={String(selectedCharacter.masterNotes || '')}
              onBlur={(event) => onCharacterChange({ ...selectedCharacter, masterNotes: event.target.value })}
            />
          </label>
        </div>

        <EditorSelectedSummary
          character={selectedCharacter}
          combatants={combatants}
          onAddCompanionToCombat={onAddCompanionToCombat}
        />
      </Card>
      {companionDialogOpen ? (
        <MasterCompanionDialog
          character={selectedCharacter}
          onCharacterChange={onCharacterChange}
          onClose={() => setCompanionDialogOpen(false)}
        />
      ) : null}
    </>
  );
}

function EditorSelectedSummary({
  character,
  combatants,
  onAddCompanionToCombat
}: {
  character: CharacterSheet;
  combatants: CombatantDraft[];
  onAddCompanionToCombat(characterId: string, companionId: string): void;
}) {
  const derived = calculateDerived(character);
  const alertData = getCharacterAlertData(character);
  const companions = character.companions || [];
  const image = character.identity.image || '/Gemini_Generated_Image_rvnvryrvnvryrvnv.png';

  const publishedCompanions = companions.filter((entry) => !isCompanionHidden(entry));
  const hiddenCompanions = companions.filter(isCompanionHidden);

  return (
    <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
      <article className="rounded-lg border border-line bg-white/5 p-4">
        <h3 className="font-black">Recursos</h3>
        <div className="mt-3 grid gap-2">
          <ResourceMeter label="PV" current={alertData.pvCurrent} max={derived.maxPv} />
          <ResourceMeter label="PE" current={alertData.peCurrent} max={derived.maxPe} tone="warn" />
          <ResourceMeter label="PD" current={alertData.pdCurrent} max={derived.maxPd} tone="danger" />
        </div>
      </article>

      <article className="rounded-lg border border-line bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <img className="h-14 w-14 rounded-full border border-line object-cover" src={image} alt="" />
          <div className="min-w-0">
            <h3 className="truncate font-black">{character.identity.name || 'Sem nome'}</h3>
            <p className="text-sm text-textMuted">{character.identity.className || 'Sem classe'} - Nivel {character.identity.level}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-textMuted">Maximos: PV {derived.maxPv} - PE {derived.maxPe} - PD {derived.maxPd}</p>
        <p className="text-sm text-textMuted">Armadura {derived.armor} - Iniciativa {formatSigned(derived.initiativeMod)}</p>
      </article>

      <article className="rounded-lg border border-line bg-white/5 p-4">
        <h3 className="font-black">Combate</h3>
        <p className="mt-3 text-sm text-textMuted">Esquiva {formatSigned(derived.esquivaMod)}</p>
        <p className="text-sm text-textMuted">Bloqueio {derived.selectedBlock}</p>
        <p className="text-sm text-textMuted">Manifestacao {formatSigned(derived.manifestationMod)}</p>
        <p className="text-sm text-textMuted">Instabilidade {Number(character.resources.instability || 0)}/6</p>
      </article>

      <article className="rounded-lg border border-line bg-white/5 p-4">
        <h3 className="font-black">Progressao</h3>
        <p className="mt-3 text-sm text-textMuted">PeV totais {derived.peVGranted}</p>
        <p className="text-sm text-textMuted">PeV gastos {derived.peVSpent.total}</p>
        <p className="text-sm text-textMuted">PeV livres {derived.peVAvailable}</p>
      </article>

      <article className="rounded-lg border border-line bg-white/5 p-4">
        <h3 className="font-black">Notas do mestre</h3>
        <p className="mt-3 whitespace-pre-line text-sm text-textMuted">{character.masterNotes || 'Sem notas do mestre.'}</p>
      </article>
      </div>

      <article className="rounded-lg border border-line bg-white/5 p-4 xl:sticky xl:top-3 xl:max-h-[calc(100vh-180px)] xl:overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-black">Formas / ajudantes</h3>
          <Badge>{publishedCompanions.length} publicadas</Badge>
        </div>
        <p className="mt-3 text-sm text-textMuted">Total: {companions.length} | Ocultas: {hiddenCompanions.length}</p>
        <div className="mt-3 grid max-h-[420px] gap-2 overflow-y-auto pr-1">
          {companions.length ? companions.map((entry) => {
            const isForm = isCompanionForm(entry);
            const isHidden = isCompanionHidden(entry);
            const sourceKey = `companion:${character.id}:${entry.id || ''}`;
            const alreadyInCombat = combatants.some((combatant) => getCombatantSourceKey(combatant) === sourceKey);
            return (
              <div className={clsx('grid gap-2 rounded-lg border p-2', isHidden ? 'border-amber-300/30 bg-amber-300/10' : 'border-line bg-black/20')} key={entry.id || entry.name}>
                <div>
                  <strong className="block">{entry.name || 'Sem nome'}</strong>
                  <span className="text-sm text-textMuted">{Number(entry.pvCurrent || 0)}/{Number(entry.pvMax || 0)} PV | {entry.status || 'Sem status'}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {isForm ? <Badge>Forma</Badge> : <Badge>Mini-ficha</Badge>}
                    {isHidden ? <Badge tone="warn">Oculta</Badge> : <Badge tone="good">Publicada</Badge>}
                  </div>
                </div>
                <Button
                  type="button"
                  disabled={isHidden || isForm || alreadyInCombat}
                  onClick={() => onAddCompanionToCombat(character.id, entry.id)}
                >
                  {isHidden ? 'Oculta' : isForm ? 'Forma do player' : alreadyInCombat ? 'Ja em combate' : 'Entrar em combate'}
                </Button>
              </div>
            );
          }) : <p className="text-sm text-textMuted">Sem entidades registradas.</p>}
        </div>
      </article>
    </div>
  );
}

function MasterCompanionDialog({
  character,
  onClose,
  onCharacterChange
}: {
  character: CharacterSheet;
  onClose(): void;
  onCharacterChange(character: CharacterSheet): void;
}) {
  const [draftCharacter, setDraftCharacter] = useState(() => hydrateCharacter(character));
  const [activeIndex, setActiveIndex] = useState(0);
  const [bulkText, setBulkText] = useState('');
  const [bulkResult, setBulkResult] = useState('Cole um bloco e aplique para atualizar sem editar alien por alien.');

  useEffect(() => {
    setDraftCharacter(hydrateCharacter(character));
    setActiveIndex(0);
    setBulkText('');
    setBulkResult('Cole um bloco e aplique para atualizar sem editar alien por alien.');
  }, [character.id]);

  const companions = draftCharacter.companions;
  const activeCompanion = companions[activeIndex] || null;
  const activeIsForm = isCompanionForm(activeCompanion);
  const activeIsHidden = isCompanionHidden(activeCompanion);
  const activeSilhouette = getCompanionOmnivitaSilhouette(activeCompanion);

  function normalizeDraft(nextCharacter: CharacterSheet) {
    return hydrateCharacter({
      ...nextCharacter,
      companions: nextCharacter.companions.map((entry, index) => normalizeCompanion(entry, index))
    });
  }

  function setCompanions(nextCompanions: CompanionSheet[], nextActiveIndex = activeIndex) {
    const next = normalizeDraft({ ...draftCharacter, companions: nextCompanions });
    setDraftCharacter(next);
    setActiveIndex(Math.max(0, Math.min(nextActiveIndex, Math.max(0, next.companions.length - 1))));
    return next;
  }

  function saveDraft(nextCharacter = draftCharacter, message = 'Mini-fichas salvas.') {
    const normalized = normalizeDraft(nextCharacter);
    setDraftCharacter(normalized);
    onCharacterChange(normalized);
    setBulkResult(message);
  }

  function patchActiveCompanion(patch: Partial<CompanionSheet>) {
    if (!activeCompanion) return null;
    const nextCompanions = companions.map((entry, index) => (
      index === activeIndex ? normalizeCompanion({ ...entry, ...patch }, index) : entry
    ));
    return setCompanions(nextCompanions, activeIndex);
  }

  function patchActiveAttribute(attributeKey: string, value: number) {
    if (!activeCompanion) return;
    patchActiveCompanion({
      attributes: {
        ...(activeCompanion.attributes || {}),
        [attributeKey]: value
      }
    });
  }

  function updateActiveSkill(index: number, key: string, value: string | number) {
    if (!activeCompanion) return;
    const skills = (activeCompanion.skills || []).map((entry, currentIndex) => (
      currentIndex === index ? createCompanionSkillEntry({ ...entry, [key]: value }) : entry
    ));
    patchActiveCompanion({ skills });
  }

  function addActiveSkill() {
    if (!activeCompanion) return;
    patchActiveCompanion({ skills: [...(activeCompanion.skills || []), createCompanionSkillEntry({ _draft: true })] });
  }

  function removeActiveSkill(index: number) {
    if (!activeCompanion) return;
    patchActiveCompanion({ skills: (activeCompanion.skills || []).filter((_, currentIndex) => currentIndex !== index) });
  }

  function updateActiveFacet(index: number, key: string, value: string | number) {
    if (!activeCompanion) return;
    const facets = (activeCompanion.facets || []).map((entry, currentIndex) => (
      currentIndex === index ? createCompanionFacetEntry({ ...entry, [key]: value }) : entry
    ));
    patchActiveCompanion({ facets });
  }

  function addActiveFacet() {
    if (!activeCompanion) return;
    patchActiveCompanion({ facets: [...(activeCompanion.facets || []), createCompanionFacetEntry({ _draft: true })] });
  }

  function removeActiveFacet(index: number) {
    if (!activeCompanion) return;
    patchActiveCompanion({ facets: (activeCompanion.facets || []).filter((_, currentIndex) => currentIndex !== index) });
  }

  function addCompanion() {
    const nextIndex = companions.length;
    const nextCompanions = [...companions, createCompanion({ name: '' })];
    const next = setCompanions(nextCompanions, nextIndex);
    onCharacterChange(next);
    setBulkResult('Mini-ficha criada.');
  }

  function addHiddenForm() {
    const nextIndex = companions.length;
    const nextCompanions = [...companions, createCompanion({ name: '', type: 'Forma', isHidden: true })];
    const next = setCompanions(nextCompanions, nextIndex);
    onCharacterChange(next);
    setBulkResult('Forma oculta criada. Ela so aparece para o player depois de publicar.');
  }

  function toggleActiveVisibility() {
    if (!activeCompanion) return;
    const message = activeIsHidden ? 'Forma publicada para o player.' : 'Forma ocultada do player.';
    const next = patchActiveCompanion({ isHidden: !activeIsHidden });
    if (next) saveDraft(next, message);
  }

  function removeActiveCompanion() {
    if (!activeCompanion) return;
    const removedName = activeCompanion.name || 'Mini-ficha';
    const nextCompanions = companions.filter((_, index) => index !== activeIndex);
    const nextActiveIndex = nextCompanions.length
      ? Math.max(0, Math.min(activeIndex, nextCompanions.length - 1))
      : 0;
    const next = setCompanions(nextCompanions, nextActiveIndex);
    onCharacterChange(next);
    setBulkResult(`${removedName} removido.`);
  }

  function applyChanges() {
    if (bulkText.trim()) {
      const result = applyMasterCompanionBulkUpdatesReact(draftCharacter, activeIndex, bulkText);
      if ('error' in result) {
        setBulkResult(result.error);
        return;
      }
      const normalized = normalizeDraft(result.character);
      setDraftCharacter(normalized);
      setActiveIndex(result.activeIndex);
      onCharacterChange(normalized);
      setBulkResult(result.messages.join(' | '));
      return;
    }

    saveDraft(draftCharacter);
  }

  function closeDialog() {
    saveDraft(draftCharacter, 'Mini-fichas salvas.');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-3 backdrop-blur-sm">
      <section className="mx-auto my-3 max-w-6xl rounded-lg border border-line bg-deep p-5 shadow-soft">
        <div className="flex justify-end">
          <Button type="button" onClick={closeDialog}>Fechar</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Mini-fichas - {draftCharacter.identity.name}</h2>
            <p className="mt-1 text-sm text-textMuted">Edicao das formas, ajudantes ou entidades vinculadas a ficha.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={addCompanion}>Nova mini-ficha</Button>
            <Button type="button" onClick={addHiddenForm}>Nova forma oculta</Button>
            {activeCompanion ? (
              <Button tone={activeIsHidden ? 'primary' : 'danger'} type="button" onClick={toggleActiveVisibility}>
                {activeIsHidden ? 'Publicar' : 'Ocultar'}
              </Button>
            ) : null}
            {activeCompanion ? (
              <Button tone="danger" type="button" onClick={removeActiveCompanion}>
                Excluir mini-ficha
              </Button>
            ) : null}
            <Button tone="primary" type="button" onClick={applyChanges}>Aplicar mudancas</Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <article className="sticky top-3 grid content-start gap-3 self-start rounded-lg border border-line bg-white/5 p-4 text-center">
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-line bg-black/30">
              {activeCompanion?.image ? (
                <img className="h-full w-full object-cover" src={activeCompanion.image} alt="" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-black text-vita">{(activeCompanion?.name || '?').slice(0, 1).toUpperCase()}</div>
              )}
            </div>
            <div className="grid gap-1">
              <strong className="text-lg">{activeCompanion?.name || 'Sem mini-ficha'}</strong>
              <span className="text-sm text-textMuted">{activeCompanion?.type || 'Sem tipo'}</span>
              <small className="text-textMuted">{activeCompanion?.status || 'Sem status'}</small>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {activeCompanion ? <Badge tone={activeIsHidden ? 'warn' : 'good'}>{getCompanionVisibilityLabel(activeCompanion)}</Badge> : null}
              {activeIsForm ? <Badge>Forma</Badge> : null}
              {activeSilhouette ? <Badge tone="accent">Silhueta OmniVita</Badge> : null}
            </div>
            <div className="grid max-h-[min(420px,calc(100vh-330px))] gap-2 overflow-y-auto pr-1 text-left">
              {companions.length ? companions.map((entry, index) => (
                <button
                  className={clsx(
                    'rounded-lg border px-3 py-2 text-left text-sm font-bold transition',
                    index === activeIndex ? 'border-vita bg-vita/25 text-textMain' : 'border-line bg-white/5 text-textMuted hover:bg-white/10',
                    isCompanionHidden(entry) && index !== activeIndex && 'border-amber-300/25 bg-amber-300/10'
                  )}
                  key={entry.id || `${entry.name}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="block truncate">{entry.name || `Mini-ficha ${index + 1}`}</span>
                  <span className="block text-xs font-semibold opacity-75">{entry.type || 'Sem tipo'} | PV {entry.pvCurrent}/{entry.pvMax}</span>
                  <span className="mt-1 inline-flex rounded-lg border border-line bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.08em]">{getCompanionVisibilityLabel(entry)}</span>
                </button>
              )) : (
                <p className="rounded-lg border border-dashed border-line p-3 text-sm text-textMuted">Esse personagem ainda nao tem mini-fichas cadastradas.</p>
              )}
            </div>
          </article>

          <div className="grid gap-4">
            <article className="rounded-lg border border-line bg-white/5 p-4">
              <h3 className="font-black">Colar mudancas</h3>
              <label className="mt-3 grid gap-2">
                <span className="text-sm font-semibold text-textMuted">Bloco de atualizacao</span>
                <textarea
                  className={`${fieldClass} min-h-44`}
                  placeholder={'Pelagornis\nforca 4 -> 5\ndestreza 3 -> 4\npericia voo 6 destreza\nfaceta rasante rank 2\nstatus Vivo'}
                  value={bulkText}
                  onChange={(event) => setBulkText(event.target.value)}
                />
              </label>
              <p className="mt-2 text-sm text-textMuted">A primeira linha pode ser o nome da mini-ficha. Tambem aceita linhas como pericia, faceta, PV, status e atributos.</p>
              <div className="mt-3 rounded-lg border border-line bg-black/20 p-3 text-sm text-textMuted">{bulkResult}</div>
            </article>

            {activeCompanion ? (
              <>
                <article className="rounded-lg border border-line bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black">Imagens da forma</h3>
                      <p className="mt-1 text-sm text-textMuted">
                        A foto aparece na mini-ficha e na transformacao. A silhueta aparece no seletor do OmniVita do Cael.
                      </p>
                    </div>
                    <Badge tone={activeIsHidden ? 'warn' : 'good'}>{getCompanionVisibilityLabel(activeCompanion)}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-line bg-black/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-24 w-24 overflow-hidden rounded-lg border border-line bg-black/30">
                          {activeCompanion.image ? (
                            <img className="h-full w-full object-cover" src={activeCompanion.image} alt="" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-2xl font-black text-vita">{(activeCompanion.name || '?').slice(0, 1).toUpperCase()}</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="block">Foto padrao</strong>
                          <p className="mt-1 text-sm text-textMuted">Usada nas mini-fichas, cards e quando a forma entra em combate.</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/5 px-3 text-sm font-bold hover:bg-white/10">
                          Escolher foto
                          <input
                            className="hidden"
                            type="file"
                            accept="image/*"
                            onChange={(event) => readMasterImageFile(event, (value) => patchActiveCompanion({ image: value }))}
                          />
                        </label>
                        <Button tone="danger" type="button" onClick={() => patchActiveCompanion({ image: '' })}>Remover</Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-vita/25 bg-vita/10 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-24 w-24 overflow-hidden rounded-lg border border-vita/30 bg-black/50">
                          {activeSilhouette ? (
                            <img className="h-full w-full object-cover" src={activeSilhouette} alt="" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-center text-xs font-black uppercase tracking-[0.08em] text-violet">Sem<br />silhueta</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="block">Silhueta OmniVita</strong>
                          <p className="mt-1 text-sm text-textMuted">Se vazio, o seletor usa a silhueta padrao conhecida ou a foto da forma.</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <label className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-vita/30 bg-vita/15 px-3 text-sm font-bold hover:bg-vita/25">
                          Escolher silhueta
                          <input
                            className="hidden"
                            type="file"
                            accept="image/*"
                            onChange={(event) => readMasterImageFile(event, (value) => patchActiveCompanion({ omnivitaSilhouette: value }))}
                          />
                        </label>
                        <Button tone="danger" type="button" onClick={() => patchActiveCompanion({ omnivitaSilhouette: '' })}>Remover</Button>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Nome" value={activeCompanion.name} onChange={(value) => patchActiveCompanion({ name: value })} />
                  <TextField label="Tipo" value={activeCompanion.type} onChange={(value) => patchActiveCompanion({ type: value })} />
                  <SelectField label="Status" value={activeCompanion.status} options={COMBAT_STATUS_OPTIONS} onChange={(value) => patchActiveCompanion({ status: value })} />
                  <NumberField label="Armadura" value={Number(activeCompanion.armor || 0)} onChange={(value) => patchActiveCompanion({ armor: value })} />
                  <NumberField label="PV atual" value={Number(activeCompanion.pvCurrent || 0)} onChange={(value) => patchActiveCompanion({ pvCurrent: value })} />
                  <NumberField label="PV maximo" value={Number(activeCompanion.pvMax || 0)} onChange={(value) => patchActiveCompanion({ pvMax: value })} />
                </div>

                <article className="rounded-lg border border-line bg-white/5 p-4">
                  <h3 className="font-black">Atributos</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {ATTRIBUTES.map((attribute) => (
                      <NumberField
                        key={attribute.key}
                        label={attribute.label}
                        value={Number(activeCompanion.attributes?.[attribute.key] || 0)}
                        onChange={(value) => patchActiveAttribute(attribute.key, value)}
                      />
                    ))}
                  </div>
                </article>

                <article className="rounded-lg border border-line bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black">Pericias</h3>
                      <p className="mt-1 text-sm text-textMuted">Edite as pericias da mini-ficha sem precisar sair do painel do mestre.</p>
                    </div>
                    <Button type="button" onClick={addActiveSkill}>Adicionar pericia</Button>
                  </div>
                  <CompanionSkillsEditor
                    companion={activeCompanion}
                    onRemove={removeActiveSkill}
                    onUpdate={updateActiveSkill}
                  />
                </article>

                <article className="rounded-lg border border-line bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-black">Facetas</h3>
                      <p className="mt-1 text-sm text-textMuted">Cadastre poderes, ranks, XP e notas da forma antes de publicar.</p>
                    </div>
                    <Button type="button" onClick={addActiveFacet}>Adicionar faceta</Button>
                  </div>
                  <CompanionFacetsEditor
                    companion={activeCompanion}
                    onRemove={removeActiveFacet}
                    onUpdate={updateActiveFacet}
                  />
                </article>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-textMuted">Notas</span>
                  <textarea
                    className={`${fieldClass} min-h-28`}
                    value={String(activeCompanion.notes || '')}
                    onChange={(event) => patchActiveCompanion({ notes: event.target.value })}
                  />
                </label>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-line p-4 text-sm text-textMuted">Crie uma mini-ficha para liberar os campos de edicao.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CompanionSkillsEditor({
  companion,
  onUpdate,
  onRemove
}: {
  companion: CompanionSheet;
  onUpdate(index: number, key: string, value: string | number): void;
  onRemove(index: number): void;
}) {
  const skills = Array.isArray(companion.skills) ? companion.skills : [];
  if (!skills.length) return <div className="mt-3 rounded-lg border border-dashed border-line p-3 text-sm text-textMuted">Nenhuma pericia cadastrada.</div>;

  return (
    <div className="mt-3 grid gap-3">
      {skills.map((skill, index) => {
        const attributeKey = String(skill.attribute || 'destreza');
        const base = Number(skill.value || 0);
        const attributeBonus = floorHalf(companion.attributes?.[attributeKey] || 0);
        return (
          <div className="grid gap-3 rounded-lg border border-line bg-black/20 p-3" key={`skill-${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>Pericia {index + 1}</strong>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{attributeLabel(attributeKey)} {formatSigned(getCompanionSkillTotal(companion, skill))}</Badge>
                <Button tone="danger" type="button" onClick={() => onRemove(index)}>Remover</Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_100px_minmax(0,160px)_110px]">
              <TextField label="Nome" value={String(skill.name || '')} onChange={(value) => onUpdate(index, 'name', value)} />
              <NumberField label="Valor" value={base} onChange={(value) => onUpdate(index, 'value', value)} />
              <AttributeSelectField label="Atributo" value={attributeKey} onChange={(value) => onUpdate(index, 'attribute', value)} />
              <div className="grid content-center rounded-lg border border-line bg-white/5 px-3 py-2">
                <span className="text-sm text-textMuted">Total</span>
                <strong className="text-lg">{formatSigned(getCompanionSkillTotal(companion, skill))}</strong>
                <span className="text-xs text-textMuted">Base {base} + atributo {attributeBonus}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompanionFacetsEditor({
  companion,
  onUpdate,
  onRemove
}: {
  companion: CompanionSheet;
  onUpdate(index: number, key: string, value: string | number): void;
  onRemove(index: number): void;
}) {
  const facets = Array.isArray(companion.facets) ? companion.facets : [];
  if (!facets.length) return <div className="mt-3 rounded-lg border border-dashed border-line p-3 text-sm text-textMuted">Nenhuma faceta cadastrada.</div>;

  return (
    <div className="mt-3 grid gap-3">
      {facets.map((facet, index) => (
        <div className="grid gap-3 rounded-lg border border-line bg-black/20 p-3" key={`facet-${index}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong>Faceta {index + 1}</strong>
            <div className="flex flex-wrap gap-2">
              <Badge>Rank {Number(facet.rank || 1)}</Badge>
              <Badge>XP {Number(facet.xp || 0)}</Badge>
              <Button tone="danger" type="button" onClick={() => onRemove(index)}>Remover</Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_90px_90px]">
            <TextField label="Nome" value={String(facet.name || '')} onChange={(value) => onUpdate(index, 'name', value)} />
            <NumberField label="Rank" value={Number(facet.rank || 1)} onChange={(value) => onUpdate(index, 'rank', value)} />
            <NumberField label="XP" value={Number(facet.xp || 0)} onChange={(value) => onUpdate(index, 'xp', value)} />
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-textMuted">Notas</span>
            <textarea
              className={`${fieldClass} min-h-20`}
              value={String(facet.notes || '')}
              onChange={(event) => onUpdate(index, 'notes', event.target.value)}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

type CompanionAttributeKey = typeof ATTRIBUTES[number]['key'];
type CompanionBulkResult = { character: CharacterSheet; activeIndex: number; messages: string[] } | { error: string };

const COMPANION_BULK_ATTRIBUTE_KEYS: CompanionAttributeKey[] = ATTRIBUTES.map((attribute) => attribute.key);

function isCompanionAttributeKey(value: string): value is CompanionAttributeKey {
  return COMPANION_BULK_ATTRIBUTE_KEYS.includes(value as CompanionAttributeKey);
}

function applyMasterCompanionBulkUpdatesReact(character: CharacterSheet, activeIndex: number, rawInput: string): CompanionBulkResult {
  const lines = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return { error: 'Cole um bloco com as mudancas antes de aplicar.' };

  let companions = character.companions.map(cloneCompanionForBulk);
  const commandStarts = ['nome', 'tipo', 'status', 'armadura', 'pv', 'forca', 'destreza', 'sentidos', 'vigor', 'inteligencia', 'nexo', 'pericia', 'skill', 'faceta', 'nota', 'notas', 'obs', 'observacao', 'adicionar'];
  let targetIndex = companions.length ? Math.max(0, Math.min(activeIndex, companions.length - 1)) : -1;
  const messages: string[] = [];

  lines.forEach((line) => {
    const normalized = normalizeLooseText(line);
    const isCommand = commandStarts.some((token) => normalized.startsWith(`${token} `) || normalized === token || normalized.startsWith(`${token}:`));
    const isTargetLine = !isCommand || /^(selecionar|abrir|mini ficha|minificha|forma|entidade|alien|inserir)\b/.test(normalized);

    if (isTargetLine) {
      const rawName = line.replace(/^(selecionar|abrir|mini ficha|minificha|forma|entidade|alien|inserir)\s+/i, '').trim() || line.trim();
      const ensured = ensureCompanionIndexReact(companions, rawName);
      companions = ensured.companions;
      targetIndex = ensured.index;
      messages.push(`Alvo ${companions[targetIndex]?.name || rawName || 'Nova mini-ficha'}`);
      return;
    }

    if (targetIndex < 0) {
      const ensured = ensureCompanionIndexReact(companions, 'Nova mini-ficha');
      companions = ensured.companions;
      targetIndex = ensured.index;
    }

    const entry = companions[targetIndex];
    let message = '';

    if (/^(adicionar\s+)?(pericia|skill)\b/.test(normalized)) {
      message = applyCompanionSkillLineReact(entry, line);
    } else if (/^(adicionar\s+)?faceta\b/.test(normalized)) {
      message = applyCompanionFacetLineReact(entry, line);
    } else if (/^(nota|notas|obs|observacao)\b/.test(normalized)) {
      message = applyCompanionNotesLineReact(entry, line);
    } else {
      message = applyCompanionScalarLineReact(entry, line, normalized);
    }

    companions[targetIndex] = cloneCompanionForBulk(normalizeCompanion(entry, targetIndex), targetIndex);
    if (message) messages.push(message);
  });

  if (!messages.length) {
    return { error: 'Nao consegui reconhecer esse bloco. Tente linhas simples como "Pelagornis" e "forca 4 -> 5".' };
  }

  return {
    character: hydrateCharacter({ ...character, companions }),
    activeIndex: Math.max(0, Math.min(targetIndex, Math.max(0, companions.length - 1))),
    messages
  };
}

function cloneCompanionForBulk(entry: CompanionSheet, index = 0): CompanionSheet {
  const normalized = normalizeCompanion(entry, index);
  return {
    ...normalized,
    attributes: { ...(normalized.attributes || {}) },
    skills: Array.isArray(normalized.skills) ? normalized.skills.map((skill) => ({ ...skill })) : [],
    facets: Array.isArray(normalized.facets) ? normalized.facets.map((facet) => ({ ...facet })) : []
  };
}

function findCompanionIndexByNameReact(companions: CompanionSheet[], rawName: string) {
  const target = normalizeLooseText(rawName);
  if (!target) return -1;

  const exactIndex = companions.findIndex((entry) => normalizeLooseText(entry.name) === target);
  if (exactIndex >= 0) return exactIndex;

  return companions.findIndex((entry) => {
    const entryName = normalizeLooseText(entry.name);
    return Boolean(entryName && (entryName.includes(target) || target.includes(entryName)));
  });
}

function ensureCompanionIndexReact(companions: CompanionSheet[], rawName: string) {
  const foundIndex = findCompanionIndexByNameReact(companions, rawName);
  if (foundIndex >= 0) return { companions, index: foundIndex };

  return {
    companions: [...companions, createCompanion({ name: String(rawName || '').trim() })],
    index: companions.length
  };
}

function parseTrailingNumberReact(text: string): number | { current: number; max: number } | null {
  const arrowMatch = String(text || '').match(/->\s*(-?\d+)/);
  if (arrowMatch) return Number(arrowMatch[1]);

  const slashMatch = String(text || '').match(/(-?\d+)\s*\/\s*(-?\d+)/);
  if (slashMatch) {
    return { current: Number(slashMatch[1]), max: Number(slashMatch[2]) };
  }

  const numberMatches = String(text || '').match(/-?\d+/g);
  if (!numberMatches?.length) return null;
  return Number(numberMatches[numberMatches.length - 1]);
}

function applyCompanionScalarLineReact(entry: CompanionSheet, originalLine: string, normalizedLine: string) {
  const fieldAliases = {
    nome: 'name',
    tipo: 'type',
    status: 'status',
    armadura: 'armor',
    forca: 'forca',
    destreza: 'destreza',
    sentidos: 'sentidos',
    vigor: 'vigor',
    inteligencia: 'inteligencia',
    nexo: 'nexo'
  } as const;

  if (/^pv\b/.test(normalizedLine)) {
    const slash = parseTrailingNumberReact(originalLine);
    if (slash && typeof slash === 'object') {
      entry.pvCurrent = Math.max(0, slash.current);
      entry.pvMax = Math.max(0, slash.max);
      return 'PV atualizado';
    }

    const targetValue = parseTrailingNumberReact(originalLine);
    if (targetValue === null || typeof targetValue === 'object') return '';

    if (/^pv max/.test(normalizedLine)) {
      entry.pvMax = Math.max(0, Number(targetValue || 0));
      entry.pvCurrent = Math.min(entry.pvCurrent, entry.pvMax);
      return 'PV maximo atualizado';
    }

    entry.pvCurrent = Math.max(0, Number(targetValue || 0));
    if (entry.pvMax) entry.pvCurrent = Math.min(entry.pvCurrent, entry.pvMax);
    return /^pv atual/.test(normalizedLine) ? 'PV atual atualizado' : 'PV atualizado';
  }

  const scalarField = Object.keys(fieldAliases).find((key) => normalizedLine.startsWith(`${key} `) || normalizedLine === key || normalizedLine.startsWith(`${key}:`) || normalizedLine.startsWith(`${key}=`));
  if (!scalarField) return '';

  const targetField = fieldAliases[scalarField as keyof typeof fieldAliases];

  if (isCompanionAttributeKey(targetField)) {
    const nextValue = parseTrailingNumberReact(originalLine);
    if (nextValue === null || typeof nextValue === 'object') return '';
    entry.attributes = { ...(entry.attributes || {}), [targetField]: Math.max(0, Number(nextValue || 0)) };
    return `${scalarField} atualizado`;
  }

  if (targetField === 'armor') {
    const nextArmor = parseTrailingNumberReact(originalLine);
    if (nextArmor === null || typeof nextArmor === 'object') return '';
    entry.armor = Math.max(0, Number(nextArmor || 0));
    return 'Armadura atualizada';
  }

  const textValue = originalLine
    .replace(/^[^:=]+[:=]\s*/i, '')
    .replace(/^(nome|tipo|status)\s+/i, '')
    .trim();

  if (targetField === 'name') entry.name = textValue;
  if (targetField === 'type') entry.type = textValue;
  if (targetField === 'status') entry.status = textValue;
  return `${scalarField} atualizado`;
}

function applyCompanionSkillLineReact(entry: CompanionSheet, originalLine: string) {
  const text = originalLine.replace(/^(adicionar\s+)?[^\s]+\s+/i, '').trim();
  if (!text) return '';

  let attribute = '';
  let workingText = text;
  const trailingAttributeMatch = workingText.match(/\b(forca|destreza|sentidos|vigor|inteligencia|nexo)$/i);
  if (trailingAttributeMatch) {
    attribute = normalizeLooseText(trailingAttributeMatch[1]);
    workingText = workingText.slice(0, trailingAttributeMatch.index).trim();
  }

  let nextValue: number | null = null;
  let skillName = workingText;
  const arrowMatch = workingText.match(/->\s*(-?\d+)/);
  if (arrowMatch) {
    nextValue = Number(arrowMatch[1]);
    skillName = workingText.slice(0, arrowMatch.index).replace(/\d+\s*$/, '').trim();
  } else if (workingText.includes(':')) {
    const parts = workingText.split(':');
    skillName = String(parts.shift() || '').trim();
    const parsed = parseTrailingNumberReact(parts.join(':'));
    nextValue = typeof parsed === 'number' ? parsed : null;
  } else {
    const trailingValue = workingText.match(/(-?\d+)\s*$/);
    if (trailingValue) {
      nextValue = Number(trailingValue[1]);
      skillName = workingText.slice(0, trailingValue.index).trim();
    }
  }

  skillName = skillName.trim();
  if (!skillName) return '';

  const skills = Array.isArray(entry.skills) ? entry.skills : [];
  let skill = skills.find((item) => normalizeLooseText(item.name) === normalizeLooseText(skillName));
  if (!skill) {
    skill = createCompanionSkillEntry({ name: skillName });
    skills.push(skill);
  }

  skill.name = skillName;
  if (typeof nextValue === 'number' && !Number.isNaN(nextValue)) {
    skill.value = Math.max(0, nextValue);
  }
  if (attribute && isCompanionAttributeKey(attribute)) {
    skill.attribute = attribute;
  }

  entry.skills = skills;
  return `Pericia ${skillName} atualizada`;
}

function applyCompanionFacetLineReact(entry: CompanionSheet, originalLine: string) {
  const text = originalLine.replace(/^(adicionar\s+)?[^\s]+\s+/i, '').trim();
  if (!text) return '';

  const normalizedText = normalizeLooseText(text);
  const rankMatch = normalizedText.match(/\brank\s+(?:\d+\s*->\s*)?(\d+)/);
  const xpMatch = normalizedText.match(/\bxp\s+(?:\d+\s*->\s*)?(\d+)/);
  const splitIndex = text.search(/\b(rank|xp)\b/i);
  const facetName = (splitIndex >= 0 ? text.slice(0, splitIndex) : text).replace(/[:=]\s*$/, '').trim();
  if (!facetName) return '';

  const facets = Array.isArray(entry.facets) ? entry.facets : [];
  let facet = facets.find((item) => normalizeLooseText(item.name) === normalizeLooseText(facetName));
  if (!facet) {
    facet = createCompanionFacetEntry({ name: facetName });
    facets.push(facet);
  }

  facet.name = facetName;
  if (rankMatch) facet.rank = Math.max(1, Number(rankMatch[1]));
  if (xpMatch) facet.xp = Math.max(0, Number(xpMatch[1]));

  entry.facets = facets;
  return `Faceta ${facetName} atualizada`;
}

function applyCompanionNotesLineReact(entry: CompanionSheet, originalLine: string) {
  const match = originalLine.match(/^(nota|notas|obs|observacao)\s*[:=]?\s*(.*)$/i);
  if (!match) return '';
  entry.notes = match[2] || '';
  return 'Notas atualizadas';
}

function FilterRow({
  search,
  quickFilter,
  setSearch,
  setQuickFilter
}: {
  search: string;
  quickFilter: QuickFilter;
  setSearch(value: string): void;
  setQuickFilter(value: QuickFilter): void;
}) {
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-textMuted">Buscar</span>
        <input className={fieldClass} placeholder="Nome, status, nota ou entidade" value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-textMuted">Filtro rapido</span>
        <select className={fieldClass} value={quickFilter} onChange={(event) => setQuickFilter(event.target.value as QuickFilter)}>
          <option value="all">Todos</option>
          <option value="alert">Com alerta</option>
          <option value="instability">Instabilidade alta</option>
          <option value="entities">Com entidades</option>
          <option value="absent">Ausentes</option>
          <option value="focus">Em foco</option>
        </select>
      </label>
    </div>
  );
}

function MasterQuickCard({
  character,
  combatants,
  onAddToCombat,
  onEdit,
  onOpenCompanions
}: {
  character: CharacterSheet;
  combatants: CombatantDraft[];
  onAddToCombat(): void;
  onEdit(): void;
  onOpenCompanions(): void;
}) {
  const derived = calculateDerived(character);
  const alertData = getCharacterAlertData(character, derived);
  const image = character.identity.image || '/Gemini_Generated_Image_rvnvryrvnvryrvnv.png';
  const sharedActorActive = hasSharedActorInEncounter(combatants, character.id);
  const summary = character.identity.summary || 'Sem resumo.';
  const companionsText = alertData.hasCompanions
    ? alertData.companions.slice(0, 3).map((entry) => entry.name || 'Sem nome').join(', ')
    : 'Sem mini-fichas.';

  return (
    <article className={`grid min-w-0 gap-3 overflow-hidden rounded-lg border bg-panel/90 p-3 shadow-soft ${alertData.isAlert ? 'border-coral/45' : 'border-line'}`}>
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <Avatar image={image} name={character.identity.name} />
          <div className="min-w-0">
            <h3 className="truncate font-black">{character.identity.name}</h3>
            <p className="text-sm text-textMuted">{character.identity.className} - Nivel {character.identity.level}</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:w-28 sm:grid-cols-1">
          <Button className="w-full" type="button" disabled={sharedActorActive} onClick={onAddToCombat}>{sharedActorActive ? 'Ja em combate' : 'Entrar em combate'}</Button>
          <Button className="w-full" type="button" onClick={onOpenCompanions}>Mini-fichas</Button>
          <Button className="w-full" type="button" onClick={onEdit}>Abrir</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>PV {alertData.pvCurrent}/{derived.maxPv}</Badge>
        <Badge>PE {alertData.peCurrent}/{derived.maxPe}</Badge>
        <Badge>PD {alertData.pdCurrent}/{derived.maxPd}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge>Inst {alertData.instability}/6</Badge>
        <Badge>PeV livres {derived.peVAvailable}</Badge>
        <Badge>Entidades {alertData.companionCount}</Badge>
      </div>
      <div className="grid gap-2">
        <ResourceMeter label="PV" current={alertData.pvCurrent} max={derived.maxPv} />
        <ResourceMeter label="PE" current={alertData.peCurrent} max={derived.maxPe} tone="warn" />
        <ResourceMeter label="PD" current={alertData.pdCurrent} max={derived.maxPd} tone="danger" />
      </div>
      <p className="min-w-0 break-words text-sm text-textMuted"><strong>Status:</strong> {character.resources.status || '-'}</p>
      <p className="text-sm text-textMuted">
        <strong>Entidades:</strong> {companionsText}
      </p>
      <p className="min-w-0 break-words text-sm text-textMuted">{summary}</p>
    </article>
  );
}

function PlayerDetailCard({
  character,
  combatants,
  onAddToCombat,
  onOpenCompanions,
  onResourceChange,
  onNotesBlur,
  onEdit
}: {
  character: CharacterSheet;
  combatants: CombatantDraft[];
  onAddToCombat(): void;
  onOpenCompanions(): void;
  onResourceChange(character: CharacterSheet, key: 'pvCurrent' | 'peCurrent' | 'pdCurrent' | 'instability', value: number): void;
  onNotesBlur(character: CharacterSheet, notes: string): void;
  onEdit(): void;
}) {
  const derived = calculateDerived(character);
  const image = character.identity.image || '/Gemini_Generated_Image_rvnvryrvnvryrvnv.png';
  const sharedActorActive = hasSharedActorInEncounter(combatants, character.id);
  const companionsText = character.companions.length
    ? character.companions.slice(0, 3).map((entry) => entry.name || 'Sem nome').join(', ')
    : 'Sem mini-fichas.';

  return (
    <article className="grid min-w-0 gap-4 overflow-hidden rounded-lg border border-line bg-panel/90 p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
        <div className="flex min-w-0 items-center gap-4 overflow-hidden">
          <img className="h-16 w-16 rounded-full border border-line object-cover" src={image} alt="" />
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black">{character.identity.name}</h3>
            <p className="text-sm text-textMuted">{character.identity.className} - Nivel {character.identity.level}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={isCharacterAlert(character, derived) ? 'danger' : 'good'}>{character.resources.status}</Badge>
              <Badge>Inst {character.resources.instability}/6</Badge>
              <Badge>PeV livres {derived.peVAvailable}</Badge>
              <Badge>Entidades {character.companions.length}</Badge>
              <Button type="button" disabled={sharedActorActive} onClick={onAddToCombat}>{sharedActorActive ? 'Ja em combate' : 'Entrar em combate'}</Button>
              <Button type="button" onClick={onOpenCompanions}>Mini-fichas</Button>
              <Button type="button" onClick={onEdit}>Editar</Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          <ResourceMeter label="PV" current={character.resources.pvCurrent} max={derived.maxPv} />
          <ResourceMeter label="PE" current={character.resources.peCurrent} max={derived.maxPe} tone="warn" />
          <ResourceMeter label="PD" current={character.resources.pdCurrent} max={derived.maxPd} tone="danger" />
        </div>
      </div>
      <p className="min-w-0 break-words text-sm text-textMuted"><strong>Entidades:</strong> {companionsText}</p>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
        {(['pvCurrent', 'peCurrent', 'pdCurrent', 'instability'] as const).map((key) => (
          <NumberField
            key={key}
            label={resourceLabel(key)}
            value={Number(character.resources[key] || 0)}
            max={key === 'instability' ? 6 : undefined}
            onChange={(value) => onResourceChange(character, key, value)}
          />
        ))}
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-textMuted">Notas rapidas do mestre</span>
        <textarea
          className={`${fieldClass} min-h-24`}
          defaultValue={String(character.masterNotes || '')}
          onBlur={(event) => onNotesBlur(character, event.target.value)}
        />
      </label>
    </article>
  );
}

function NumberField({ label, value, onChange, max }: { label: string; value: number; onChange(value: number): void; max?: number }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-textMuted">{label}</span>
      <input className={fieldClass} type="number" min={0} max={max} value={Number(value || 0)} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Avatar({ image, name }: { image: string; name: string }) {
  const initials = String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-vita/10">
      {image ? <img className="h-full w-full object-cover" src={image} alt="" /> : <span className="font-black text-violet">{initials || '?'}</span>}
    </div>
  );
}

const fieldClass = 'w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-textMain outline-none transition focus:border-vita focus:ring-2 focus:ring-vita/20';

function resourceLabel(key: 'pvCurrent' | 'peCurrent' | 'pdCurrent' | 'instability') {
  return {
    pvCurrent: 'PV atual',
    peCurrent: 'PE atual',
    pdCurrent: 'PD atual',
    instability: 'Instabilidade'
  }[key];
}

function isCharacterAlert(character: CharacterSheet, derived?: ReturnType<typeof calculateDerived>) {
  return getCharacterAlertData(character, derived).isAlert;
}

function getCharacterAlertData(character: CharacterSheet, derivedInput?: ReturnType<typeof calculateDerived>) {
  const derived = derivedInput || calculateDerived(character);
  const session = character.masterSession || {};
  const tags = getSessionTags(character);
  const companions = character.companions || [];
  const pvCurrent = Number(character.resources?.pvCurrent || 0);
  const peCurrent = Number(character.resources?.peCurrent || 0);
  const pdCurrent = Number(character.resources?.pdCurrent || 0);
  const instability = Number(character.resources?.instability || 0);

  const pvPct = percent(pvCurrent, Number(derived.maxPv || 0));
  const pePct = percent(peCurrent, Number(derived.maxPe || 0));
  const pdPct = percent(pdCurrent, Number(derived.maxPd || 0));
  const isAbsent = tags.includes('ausente') || String(session.presence || session.status || '').toLowerCase().includes('aus');
  const isFocus = tags.includes('focus') || Boolean(session.focus || session.inFocus);
  const isLowPv = pvPct > 0 && pvPct <= 50;
  const isLowPe = pePct > 0 && pePct <= 35;
  const isLowPd = pdPct > 0 && pdPct <= 35;
  const highInstability = instability >= 4 || tags.includes('instavel');
  const isInjured = tags.includes('ferido') || isLowPv;
  const underPressure = tags.includes('pressao');
  let alertScore = 0;
  if (isAbsent) alertScore += 3;
  if (highInstability) alertScore += 2;
  if (isInjured) alertScore += 1;
  if (isLowPe) alertScore += 1;
  if (isLowPd) alertScore += 1;
  if (underPressure) alertScore += 1;

  return {
    derived,
    companions,
    companionCount: companions.length,
    hasCompanions: companions.length > 0,
    pvCurrent,
    peCurrent,
    pdCurrent,
    instability,
    isAbsent,
    isFocus,
    isLowPv,
    isLowPe,
    isLowPd,
    highInstability,
    isInjured,
    underPressure,
    isAlert: isAbsent || highInstability || isInjured || isLowPe || isLowPd || underPressure,
    alertScore
  };
}

function percent(current: number, max: number) {
  if (!max || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((Number(current || 0) / Number(max || 0)) * 100)));
}

function getSessionTagLabel(tag: string) {
  return {
    presente: 'Presente',
    ausente: 'Ausente',
    ferido: 'Ferido',
    instavel: 'Instavel',
    pressao: 'Pressao',
    focus: 'Foco'
  }[tag] || String(tag || '');
}

function getSessionTags(character: CharacterSheet): string[] {
  return Array.isArray(character.masterSession?.tags)
    ? character.masterSession.tags.map((tag) => String(tag || '')).filter(Boolean)
    : [];
}

function loadMasterLog(): MasterLogEntry[] {
  try {
    if (typeof window === 'undefined') return [];
    const parsed = JSON.parse(window.localStorage.getItem(MASTER_LOG_STORAGE_KEY) || window.sessionStorage.getItem(MASTER_LOG_STORAGE_KEY) || '[]') as MasterLogEntry[];
    return normalizeMasterLogEntries(parsed);
  } catch {
    return [];
  }
}

function saveMasterLog(entries: MasterLogEntry[]): MasterLogEntry[] {
  const limited = normalizeMasterLogEntries(entries);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MASTER_LOG_STORAGE_KEY, JSON.stringify(limited));
      window.sessionStorage.removeItem(MASTER_LOG_STORAGE_KEY);
    }
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
  return limited;
}

function normalizeMasterLogEntries(entries: unknown): MasterLogEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .map(hydrateMasterLogEntry)
    .filter((entry) => entry.message)
    .sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')))
    .slice(0, 120);
}

function hydrateMasterLogEntry(entry: Partial<MasterLogEntry> | Record<string, unknown>): MasterLogEntry {
  const createdAt = String(entry.createdAt || new Date().toISOString());
  return {
    id: String(entry.id || `log-${createdAt}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(entry.name || 'Campanha'),
    message: String(entry.message || ''),
    time: String(entry.time || formatLogTime(createdAt)),
    category: String(entry.category || 'mestre'),
    createdAt,
    details: entry.details && typeof entry.details === 'object' && !Array.isArray(entry.details)
      ? entry.details as Record<string, unknown>
      : {}
  };
}

function createMasterLogEntry(entry: Partial<MasterLogEntry> & { message: string }): MasterLogEntry {
  return hydrateMasterLogEntry({
    ...entry,
    createdAt: entry.createdAt || new Date().toISOString()
  });
}

function formatLogTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getLogCategoryLabel(category: string) {
  return {
    ficha: 'Ficha',
    combate: 'Combate',
    mestre: 'Mestre',
    sistema: 'Sistema'
  }[category] || category;
}

function createEmptyMasterLibraries(): MasterLibrariesState {
  return {
    npcs: [],
    locations: [],
    items: [],
    clues: [],
    templates: []
  };
}

function normalizeMasterLibraries(input: unknown): MasterLibrariesState {
  const output = createEmptyMasterLibraries();
  if (!input || typeof input !== 'object') return output;
  const raw = input as Record<string, unknown>;

  MASTER_LIBRARY_GROUPS.forEach((group) => {
    const entries = (Array.isArray(raw[group.key]) ? raw[group.key] : []) as unknown[];
    output[group.key] = entries
      .map((entry) => hydrateMasterLibraryEntry(entry as Partial<MasterLibraryEntry>, group.key))
      .filter((entry) => entry.title.trim())
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
  });

  return output;
}

function hydrateMasterLibraryEntry(entry: Partial<MasterLibraryEntry> | Record<string, unknown> = {}, kind: MasterLibraryKind): MasterLibraryEntry {
  const raw = entry as Record<string, unknown>;
  const now = new Date().toISOString();
  const group = MASTER_LIBRARY_GROUPS.find((item) => item.key === kind);
  return {
    id: String(raw.id || createId(`lib-${kind}`)),
    title: String(raw.title || raw.name || ''),
    type: String(raw.type || group?.singular || ''),
    summary: String(raw.summary || raw.description || ''),
    tags: Array.isArray(raw.tags) ? raw.tags.map((tag) => String(tag || '')).filter(Boolean).join(', ') : String(raw.tags || ''),
    notes: String(raw.notes || ''),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now)
  };
}

function createMasterLibraryEntry(kind: MasterLibraryKind): MasterLibraryEntry {
  const group = MASTER_LIBRARY_GROUPS.find((item) => item.key === kind);
  return hydrateMasterLibraryEntry({
    id: createId(`lib-${kind}`),
    type: group?.singular || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, kind);
}

function countMasterLibraries(libraries: MasterLibrariesState) {
  return MASTER_LIBRARY_GROUPS.reduce((total, group) => total + Number(libraries[group.key]?.length || 0), 0);
}

function cloneMasterSnapshot(characters: CharacterSheet[]) {
  return new Map(characters.map((character) => {
    const snapshot = snapshotCharacterForLog(character);
    return [snapshot.id, snapshot];
  }));
}

function snapshotCharacterForLog(character: CharacterSheet): MasterSnapshotEntry {
  const companions = character.companions || [];
  return {
    id: character.id,
    name: character.identity.name || 'Sem nome',
    pv: Number(character.resources.pvCurrent || 0),
    pe: Number(character.resources.peCurrent || 0),
    pd: Number(character.resources.pdCurrent || 0),
    instability: Number(character.resources.instability || 0),
    status: String(character.resources.status || ''),
    masterNotes: String(character.masterNotes || ''),
    companions: companions.length,
    companionsSignature: companions
      .map((entry) => `${entry.id || entry.name}:${Number(entry.pvCurrent || 0)}/${Number(entry.pvMax || 0)}:${String(entry.status || '')}:${isCompanionHidden(entry) ? 'hidden' : 'public'}:${String(entry.image || '').length}:${getCompanionOmnivitaSilhouette(entry).length}`)
      .join('|'),
    sessionTagsSignature: getSessionTags(character).join('|')
  };
}

function diffMasterSnapshots(previous: Map<string, MasterSnapshotEntry>, next: Map<string, MasterSnapshotEntry>): MasterLogEntry[] {
  const entries: MasterLogEntry[] = [];

  next.forEach((current, id) => {
    const before = previous.get(id);
    if (!before) return;
    if (before.pv !== current.pv) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: `PV: ${before.pv} -> ${current.pv}` }));
    if (before.pe !== current.pe) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: `PE: ${before.pe} -> ${current.pe}` }));
    if (before.pd !== current.pd) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: `PD: ${before.pd} -> ${current.pd}` }));
    if (before.instability !== current.instability) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: `Instabilidade: ${before.instability} -> ${current.instability}` }));
    if (before.status !== current.status) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: `Status: ${before.status || '-'} -> ${current.status || '-'}` }));
    if (before.masterNotes !== current.masterNotes) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: 'Notas do mestre atualizadas' }));
    if (before.companions !== current.companions) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: `Entidades: ${before.companions} -> ${current.companions}` }));
    if (before.companionsSignature !== current.companionsSignature) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: 'Mini-fichas atualizadas' }));
    if (before.sessionTagsSignature !== current.sessionTagsSignature) entries.push(createMasterLogEntry({ category: 'ficha', name: current.name, message: 'Marcadores da sessao atualizados' }));
  });

  return entries;
}

function waitForBrowser() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

function createCharacterTransferEnvelope(character: CharacterSheet) {
  return {
    app: 'OmniVita',
    format: 'omnivita-character-transfer',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    metadata: { source: 'master-export-all' },
    character: hydrateCharacter(character)
  };
}

function buildImportPreview(payload: unknown, currentCharacters: CharacterSheet[]): ImportPreview {
  const importedCharacters = extractCharactersFromPayload(payload);
  const importedScenarios = extractScenariosFromPayload(payload);
  const importedEnemies = extractEnemyLibraryFromPayload(payload);
  const importedLibraries = extractMasterLibrariesFromPayload(payload);
  const importedLog = extractMasterLogFromPayload(payload);
  const importedCombat = extractCombatStateFromPayload(payload, importedCharacters.length ? importedCharacters : currentCharacters);

  return {
    payload,
    options: {
      characters: importedCharacters.length > 0,
      scenarios: Boolean(importedScenarios),
      enemyLibrary: Boolean(importedEnemies?.length),
      masterLibraries: Boolean(importedLibraries && countMasterLibraries(importedLibraries) > 0),
      sessionLog: Boolean(importedLog?.length),
      combatState: Boolean(importedCombat?.combatants.length)
    },
    summary: {
      characters: importedCharacters,
      scenarios: getScenarioImportSummary(importedScenarios),
      enemyLibrary: importedEnemies,
      masterLibraries: importedLibraries,
      sessionLog: importedLog,
      combatState: importedCombat
    }
  };
}

function hasImportableData(preview: ImportPreview) {
  return (
    preview.summary.characters.length > 0
    || Boolean(preview.summary.scenarios?.total)
    || Boolean(preview.summary.enemyLibrary?.length)
    || Boolean(preview.summary.masterLibraries && countMasterLibraries(preview.summary.masterLibraries) > 0)
    || Boolean(preview.summary.sessionLog?.length)
    || Boolean(preview.summary.combatState?.combatants.length)
  );
}

function getScenarioImportSummary(input: unknown) {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const scenarios = Array.isArray(raw.scenarios) ? raw.scenarios.length : 0;
  const npcs = Array.isArray(raw.npcs) ? raw.npcs.length : 0;
  const events = Array.isArray(raw.events) ? raw.events.length : 0;
  const clues = Array.isArray(raw.clues) ? raw.clues.length : 0;
  const clocks = Array.isArray(raw.clocks) ? raw.clocks.length : 0;
  const arcEvents = Array.isArray(raw.arcEvents) ? raw.arcEvents.length : 0;
  return {
    scenarios,
    npcs,
    events,
    clues,
    clocks,
    arcEvents,
    total: scenarios + npcs + events + clues + clocks + arcEvents
  };
}

function extractCharactersFromPayload(payload: unknown): CharacterSheet[] {
  if (!payload || typeof payload !== 'object') return [];
  const raw = payload as Record<string, unknown>;
  if (Array.isArray(raw.characters)) {
    return raw.characters
      .map(extractCharacterRecordFromPayload)
      .filter((entry): entry is Partial<CharacterSheet> => Boolean(entry))
      .map((entry) => hydrateCharacter(entry));
  }
  const singleCharacter = extractCharacterRecordFromPayload(raw);
  if (singleCharacter) return [hydrateCharacter(singleCharacter)];
  if (raw.state && typeof raw.state === 'object' && Array.isArray((raw.state as Record<string, unknown>).characters)) {
    return ((raw.state as Record<string, unknown>).characters as unknown[])
      .map(extractCharacterRecordFromPayload)
      .filter((entry): entry is Partial<CharacterSheet> => Boolean(entry))
      .map((entry) => hydrateCharacter(entry));
  }
  return [];
}

function extractCharacterRecordFromPayload(payload: unknown): Partial<CharacterSheet> | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (raw.character && typeof raw.character === 'object') return raw.character as Partial<CharacterSheet>;
  if (raw.identity && raw.resources) return raw as Partial<CharacterSheet>;
  if (raw.sheet && typeof raw.sheet === 'object') return raw.sheet as Partial<CharacterSheet>;
  return null;
}

function extractScenariosFromPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const masterData = raw.masterData && !Array.isArray(raw.masterData) && typeof raw.masterData === 'object'
    ? raw.masterData as Record<string, unknown>
    : null;
  const masterDataScenarioEntry = findMasterDataArrayEntry(raw.masterData, 'scenarios');
  const scenarios = raw.masterScenarios || masterData?.scenarios || raw.scenarios || masterDataScenarioEntry?.data;
  return scenarios && typeof scenarios === 'object' ? scenarios : null;
}

function findMasterDataArrayEntry(masterData: unknown, key: string): Record<string, unknown> | null {
  if (!Array.isArray(masterData)) return null;
  return masterData.find((item) => item && typeof item === 'object' && String((item as Record<string, unknown>).key || '') === key) as Record<string, unknown> | undefined || null;
}

function extractEnemyLibraryFromPayload(payload: unknown): EnemyRecord[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const masterData = raw.masterData && typeof raw.masterData === 'object'
    ? raw.masterData as Record<string, unknown>
    : null;
  const masterDataLibrary = masterData?.enemyLibrary || masterData?.['enemy-library'] || findMasterDataArrayEntry(raw.masterData, 'enemy-library')?.data;
  const library = Array.isArray(raw.enemyLibrary)
    ? raw.enemyLibrary
    : extractEnemyLibraryFromMasterData(masterDataLibrary);
  if (!Array.isArray(library)) return null;
  return library
    .map((entry) => hydrateEnemyRecord(entry as Partial<EnemyRecord>))
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

function extractMasterLogFromPayload(payload: unknown): MasterLogEntry[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const masterData = raw.masterData && typeof raw.masterData === 'object'
    ? raw.masterData as Record<string, unknown>
    : null;
  const masterDataLog = masterData?.sessionLog || masterData?.['session-log'] || findMasterDataArrayEntry(raw.masterData, 'session-log')?.data;
  return extractMasterLogFromMasterData(raw.sessionLog || masterDataLog);
}

function extractMasterLogFromMasterData(payload: unknown): MasterLogEntry[] | null {
  if (!payload || typeof payload !== 'object') return null;
  if (Array.isArray(payload)) return normalizeMasterLogEntries(payload);
  const raw = payload as Record<string, unknown>;
  const entries = Array.isArray(raw.entries)
    ? raw.entries
    : Array.isArray(raw.log) ? raw.log : null;
  if (!entries) return null;
  return normalizeMasterLogEntries(entries);
}

function extractEnemyLibraryFromMasterData(payload: unknown): EnemyRecord[] | null {
  if (!payload || typeof payload !== 'object') return null;
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => hydrateEnemyRecord(entry as Partial<EnemyRecord>))
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
  }
  const raw = payload as Record<string, unknown>;
  const library = Array.isArray(raw.enemies)
    ? raw.enemies
    : Array.isArray(raw.enemyLibrary) ? raw.enemyLibrary : null;
  if (!library) return null;
  return library
    .map((entry) => hydrateEnemyRecord(entry as Partial<EnemyRecord>))
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
}

function extractMasterLibrariesFromPayload(payload: unknown): MasterLibrariesState | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const masterData = raw.masterData && typeof raw.masterData === 'object'
    ? raw.masterData as Record<string, unknown>
    : null;
  const source = raw.masterLibraries
    || masterData?.libraries
    || masterData?.masterLibraries
    || findMasterDataArrayEntry(raw.masterData, 'libraries')?.data;
  return extractMasterLibrariesFromMasterData(source);
}

function extractMasterLibrariesFromMasterData(payload: unknown): MasterLibrariesState | null {
  if (!payload || typeof payload !== 'object') return null;
  const normalized = normalizeMasterLibraries(payload);
  return countMasterLibraries(normalized) > 0 ? normalized : null;
}

function extractCombatStateFromPayload(payload: unknown, characters: CharacterSheet[] = []): CombatState | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  const repair = (state: CombatState) => characters.length ? repairCombatStateWithCharacters(state, characters) : state;

  if (raw.combatState && typeof raw.combatState === 'object') {
    return repair(hydrateMasterCombatState(raw.combatState as CombatState));
  }

  if (!Array.isArray(raw.activeEncounter)) return null;
  const turn = raw.activeEncounterTurn && typeof raw.activeEncounterTurn === 'object'
    ? raw.activeEncounterTurn as Record<string, unknown>
    : {};
  return repair(finalizeCombatState(raw.activeEncounter.map((entry) => hydrateCombatantDraft(entry as Record<string, unknown>)), {
    currentInstanceId: String(turn.currentInstanceId || ''),
    round: Math.max(1, Number(turn.round || 1)),
    forceActive: true
  }));
}
