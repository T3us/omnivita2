import { describe, expect, it } from 'vitest';
import { calculateBodyDamageScale, calculateDerived, getSkillFixedBonus, getSkillFixedBonusSources, getSkillSituationalBonuses, hydrateCharacter } from './system';

describe('system domain', () => {
  it('hydrates resources from class, level and attributes', () => {
    const character = hydrateCharacter({
      id: 'test',
      identity: { name: 'Teste', className: 'Combatente', level: 3 },
      attributes: { vigor: 4, nexo: 2, inteligencia: 3 },
      resources: { armorBonus: 2, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { fortitude: 4, reflexos: 2, iniciativa: 1, manifestacao: 3 },
      progression: {},
      aptitudes: [],
      facets: [],
      companions: []
    });

    const derived = calculateDerived(character);
    expect(derived.maxPv).toBe(45);
    expect(derived.maxPe).toBe(10);
    expect(derived.maxPd).toBe(22);
    expect(derived.armor).toBe(3);
    expect(derived.breakdown.pv).toEqual({ base: 25, level: 8, attribute: 12, aptitudes: 0, attributeName: 'Vigor', attributeMultiplier: 3 });
    expect(derived.breakdown.pe).toEqual({ base: 2, level: 2, attribute: 6, aptitudes: 0, attributeName: 'Nexo', attributeMultiplier: 3 });
    expect(derived.breakdown.pd).toEqual({ base: 10, level: 6, attribute: 6, aptitudes: 0, attributeName: 'Inteligencia', attributeMultiplier: 2 });
    expect(character.resources.pvCurrent).toBe(45);
  });

  it('includes known aptitude bonuses', () => {
    const character = hydrateCharacter({
      id: 'test',
      identity: { name: 'Teste', className: 'Especialista', level: 1 },
      attributes: { vigor: 1, nexo: 1, inteligencia: 1, destreza: 2 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { iniciativa: 2 },
      progression: {},
      aptitudes: [{ catalogId: 'reserva-tecnica', tier: 'Basica' }, { catalogId: 'sangue-frio', tier: 'Basica' }],
      facets: [],
      companions: []
    });

    const derived = calculateDerived(character);
    expect(derived.maxPe).toBe(11);
    expect(derived.initiativeMod).toBe(5);
    expect(getSkillFixedBonus(character, 'iniciativa')).toBe(2);
    expect(derived.peVSpent.aptitudeSpent).toBe(8);
  });

  it('keeps situational skill reminders separate from fixed totals', () => {
    const character = hydrateCharacter({
      id: 'test-situational-skill-bonuses',
      identity: { name: 'Teste', className: 'Especialista', level: 1 },
      attributes: { vigor: 1, nexo: 1, inteligencia: 2, destreza: 2, sentidos: 2 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { iniciativa: 3, vontade: 1, reflexos: 2 },
      progression: {},
      aptitudes: [
        { catalogId: 'sangue-frio', tier: 'Basica' },
        { catalogId: 'instinto-firme', tier: 'Basica' },
        { catalogId: 'preparado', tier: 'Basica' }
      ],
      facets: [],
      companions: []
    });

    expect(getSkillFixedBonus(character, 'iniciativa')).toBe(4);
    expect(getSkillSituationalBonuses(character, 'vontade')).toEqual([
      { source: 'Sangue Frio', bonus: 2, note: 'Primeiro teste de Vontade da cena contra pressao.' }
    ]);
    expect(getSkillSituationalBonuses(character, 'reflexos')).toEqual([
      { source: 'Instinto Firme', bonus: 2, note: 'Contra surpresa, emboscada ou ataque de alvo que ainda nao agiu.' }
    ]);
  });

  it('shows fixed and situational bonuses together for the same skill', () => {
    const character = hydrateCharacter({
      id: 'test-fixed-and-situational-same-skill',
      identity: { name: 'Teste', className: 'Combatente', level: 4 },
      attributes: { vigor: 4, nexo: 1, inteligencia: 2, destreza: 2 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { fortitude: 3 },
      progression: {},
      aptitudes: [
        { catalogId: 'corpo-e-alma', tier: 'Treinada' },
        { catalogId: 'casca-dura', tier: 'Treinada' }
      ],
      facets: [],
      companions: []
    });

    expect(getSkillFixedBonus(character, 'fortitude')).toBe(2);
    expect(getSkillSituationalBonuses(character, 'fortitude')).toEqual([
      { source: 'Casca Dura', bonus: 2, note: 'Contra dor, exaustao e trauma.' }
    ]);
  });

  it('lists stacked fixed sources and stacked situational reminders for the same skill', () => {
    const character = hydrateCharacter({
      id: 'test-stacked-skill-bonus-sources',
      identity: { name: 'Teste', className: 'Especialista', level: 5 },
      attributes: { vigor: 3, nexo: 1, inteligencia: 3, destreza: 2 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { vontade: 2 },
      progression: {},
      aptitudes: [
        { catalogId: 'corpo-e-alma', tier: 'Treinada' },
        { catalogId: 'presenca-dificil', tier: 'Treinada', effectChoice: 'vontade' },
        { catalogId: 'sangue-frio', tier: 'Basica' },
        { catalogId: 'boca-fechada', tier: 'Treinada' }
      ],
      facets: [],
      companions: []
    });

    expect(getSkillFixedBonus(character, 'vontade')).toBe(5);
    expect(getSkillFixedBonusSources(character, 'vontade')).toEqual([
      { source: 'Corpo e Alma', bonus: 2 },
      { source: 'Presenca Dificil', bonus: 3 }
    ]);
    expect(getSkillSituationalBonuses(character, 'vontade')).toEqual([
      { source: 'Sangue Frio', bonus: 2, note: 'Primeiro teste de Vontade da cena contra pressao.' },
      { source: 'Boca Fechada', bonus: 3, note: 'Resistir a interrogatorio, coacao ou chantagem.' }
    ]);
  });

  it('keeps upgraded situational bonuses split instead of flattening them into fixed totals', () => {
    const character = hydrateCharacter({
      id: 'test-procedimento-upgrade',
      identity: { name: 'Teste', className: 'Especialista', level: 6 },
      attributes: { vigor: 1, nexo: 1, inteligencia: 6, destreza: 1 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { tecnologia: 4 },
      progression: {},
      aptitudes: [
        { catalogId: 'procedimento', tier: 'Basica' },
        { catalogId: 'procedimento-ii', tier: 'Avancada' }
      ],
      facets: [],
      companions: []
    });

    expect(getSkillFixedBonus(character, 'tecnologia')).toBe(0);
    expect(getSkillSituationalBonuses(character, 'tecnologia')).toEqual([
      { source: 'Procedimento', bonus: 2, note: 'Depois de 1 minuto de preparo.' },
      { source: 'Procedimento II', bonus: 1, note: 'Aperfeicoa Procedimento para total +3 com metade do tempo.' }
    ]);
  });

  it('applies fixed aptitude bonuses to skills', () => {
    const character = hydrateCharacter({
      id: 'test',
      identity: { name: 'Teste', className: 'Especialista', level: 1 },
      attributes: { vigor: 1, nexo: 1, inteligencia: 2, destreza: 2 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: { intuicao: 1, intimidacao: 2, vontade: 1 },
      progression: {},
      aptitudes: [
        { catalogId: 'leitura-de-gente', tier: 'Basica' },
        { catalogId: 'presenca-dificil', tier: 'Treinada', effectChoice: 'vontade' },
        { catalogId: 'presenca-inquebravel', tier: 'Excepcional' }
      ],
      facets: [],
      companions: []
    });

    expect(getSkillFixedBonus(character, 'intuicao')).toBe(2);
    expect(getSkillFixedBonus(character, 'vontade')).toBe(3);
    expect(getSkillFixedBonus(character, 'intimidacao')).toBe(4);
  });

  it('applies new fixed aptitude bonuses to skills', () => {
    const character = hydrateCharacter({
      id: 'test-new-aptitudes',
      identity: { name: 'Teste', className: 'Especialista', level: 4 },
      attributes: { vigor: 2, nexo: 2, inteligencia: 3, destreza: 3 },
      resources: { armorBonus: 0, blockMode: 'vigor', status: 'Vivo', pvCurrent: null, peCurrent: null, pdCurrent: null, instability: 0 },
      skills: {},
      progression: {},
      aptitudes: [
        { catalogId: 'atencao-partida', tier: 'Basica' },
        { catalogId: 'corpo-e-alma', tier: 'Treinada' },
        { catalogId: 'quadro-mental', tier: 'Treinada' },
        { catalogId: 'sinapse-anomala', tier: 'Treinada' },
        { catalogId: 'luta-afiada', tier: 'Treinada' }
      ],
      facets: [],
      companions: []
    });

    expect(getSkillFixedBonus(character, 'percepcao')).toBe(2);
    expect(getSkillFixedBonus(character, 'intuicao')).toBe(2);
    expect(getSkillFixedBonus(character, 'vontade')).toBe(2);
    expect(getSkillFixedBonus(character, 'fortitude')).toBe(2);
    expect(getSkillFixedBonus(character, 'investigacao')).toBe(2);
    expect(getSkillFixedBonus(character, 'tecnologia')).toBe(2);
    expect(getSkillFixedBonus(character, 'manifestacao')).toBe(2);
    expect(getSkillFixedBonus(character, 'luta')).toBe(2);
  });

  it('calculates body damage scale from strength', () => {
    expect(calculateBodyDamageScale(0)).toEqual({ level: 0, bonus: '+0', strengthRange: '0-1' });
    expect(calculateBodyDamageScale(3)).toEqual({ level: 1, bonus: '+1', strengthRange: '2-3' });
    expect(calculateBodyDamageScale(5)).toEqual({ level: 2, bonus: '+1d4', strengthRange: '4-5' });
    expect(calculateBodyDamageScale(7)).toEqual({ level: 3, bonus: '+1d6', strengthRange: '6-7' });
    expect(calculateBodyDamageScale(9)).toEqual({ level: 4, bonus: '+1d8', strengthRange: '8-9' });
    expect(calculateBodyDamageScale(10)).toEqual({ level: 5, bonus: '+1d10', strengthRange: '10+' });
  });
});
