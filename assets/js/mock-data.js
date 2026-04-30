window.MOCK_DATA = {
  accounts: [
    { username: 'mestre', password: 'omnivita123', role: 'master', characterId: null },
    { username: 'cael', password: 'v4cael', role: 'player', characterId: 'cael' },
    { username: 'serena', password: 'nanites', role: 'player', characterId: 'serena' },
    { username: 'k', password: 'mimer', role: 'player', characterId: 'k' },
    { username: 'greg', password: 'muscular', role: 'player', characterId: 'greg' }
  ],
  characters: [
    {
      id: 'cael',
      ownerUsername: 'cael',
      name: 'Cael Silveira Gomes',
      age: 16,
      className: 'Alterado',
      level: 4,
      concept: 'Adolescente metódico, portador da V4 e eixo do Projeto OmniVita.',
      manifestationOrigin: 'OmniVita',
      links: 'Abigail, Júlia, Serena, K, escola, estufa.',
      summary: 'Portador da V4. Tenta segurar rotina e heroísmo enquanto o mundo quebra por dentro.',
      attributes: {
        forca: 3,
        destreza: 3,
        sentidos: 2,
        vigor: 4,
        inteligencia: 2,
        nexo: 5
      },
      resources: {
        pvCurrent: 34,
        peCurrent: 25,
        pdCurrent: 28,
        instability: 2,
        armorBonus: 0,
        armorEquipment: 'V4 / adaptações biológicas',
        blockMode: 'vigor',
        status: 'Ativo fora de custódia'
      },
      progression: {
        extraPeV: 0,
        manualPeVSpent: 0,
        facetaUnlocks: 0,
        facetaStabilizations: 0,
        notes: 'Sem bônus manuais no momento.'
      },
      skills: {
        acrobacia: 1,
        adestramento: 0,
        artes: 0,
        atletismo: 3,
        atualidades: 1,
        ciencias: 1,
        crime: 0,
        diplomacia: 0,
        enganacao: 0,
        fortitude: 3,
        furtividade: 1,
        iniciativa: 3,
        intimidacao: 1,
        intuicao: 2,
        investigacao: 1,
        luta: 3,
        manifestacao: 4,
        medicina: 0,
        percepcao: 2,
        pilotagem: 1,
        pontaria: 2,
        profissao: 0,
        reflexos: 3,
        sobrevivencia: 2,
        tecnologia: 1,
        vontade: 3
      },
      aptitudes: [
        { catalogId: 'disparo-limpo' },
        { catalogId: 'faceta-preferida' },
        { catalogId: 'controle-de-glitch' }
      ],
      manifestation: {
        name: 'OmniVita V4',
        origin: 'Artefato',
        state: 'Parcial',
        glitches: 'Timeouts, glitches e risco de sobrecarga em uso extremo.',
        activeEffects: 'Portador institucionalmente classificado como ativo fora de custódia.'
      },
      facets: [
        { name: 'Transformação', notes: 'Acesso a formas principais e troca de perfil tático.' },
        { name: 'Scan', notes: 'Leitura de composição, ameaça e assinatura anômala.' },
        { name: 'Modo de Emergência', notes: 'Ativação instável em situações críticas.' },
        { name: 'Adaptação', notes: 'Ajuste situacional ligado à forma ativa.' },
        { name: 'Timeout', notes: 'Custo narrativo e mecânico após uso prolongado.' }
      ],
      mastery: [
        { facet: 'Transformação', rank: 4, xp: 10 },
        { facet: 'Scan', rank: 2, xp: 3 },
        { facet: 'Modo de Emergência', rank: 2, xp: 3 }
      ],
      companions: [
        { id: 'cryonox', name: 'Cryonox / Armoguana', type: 'Forma', pvCurrent: 24, pvMax: 24, armor: 2, status: 'Pronto para uso', notes: 'Linha robusta com viés de gelo e resistência.', attributes: { forca: 5, destreza: 1, sentidos: 2, vigor: 5, inteligencia: 1, nexo: 0 }, skills: [{ name: 'Luta', value: 4 }, { name: 'Fortitude', value: 4 }, { name: 'Atletismo', value: 2 }], facets: [{ name: 'Gelo', rank: 3, xp: 6 }, { name: 'Carapaça', rank: 2, xp: 3 }] },
        { id: 'pelagoray', name: 'Pelagoray', type: 'Forma', pvCurrent: 18, pvMax: 18, armor: 1, status: 'Disponível', notes: 'Forma usada para fuga, voo e reposicionamento.', attributes: { forca: 2, destreza: 4, sentidos: 3, vigor: 3, inteligencia: 1, nexo: 0 }, skills: [{ name: 'Atletismo', value: 4 }, { name: 'Reflexos', value: 3 }, { name: 'Percepção', value: 2 }], facets: [{ name: 'Voo', rank: 3, xp: 6 }, { name: 'Investida', rank: 2, xp: 3 }] },
        { id: 'gecko', name: 'Gecko', type: 'Forma', pvCurrent: 12, pvMax: 12, armor: 0, status: 'Disponível', notes: 'Forma pequena e cerebral, ligada a glitch e scan.', attributes: { forca: 0, destreza: 3, sentidos: 4, vigor: 1, inteligencia: 5, nexo: 0 }, skills: [{ name: 'Tecnologia', value: 4 }, { name: 'Investigação', value: 3 }, { name: 'Furtividade', value: 2 }], facets: [{ name: 'Scan', rank: 3, xp: 6 }, { name: 'Análise', rank: 2, xp: 3 }] }
      ],
      equipment: {
        primaryWeapon: 'OmniVita V4',
        secondaryWeapon: 'Improviso / ambiente',
        items: 'Celular, mochila, uniforme, pequenos objetos pessoais.'
      },
      notes: 'Cael foi escolhido pelo OmniVita durante o caos no laboratório do canal.',
      masterNotes: 'Instituto trata Cael como ativo fora de custódia e alvo de recuperação.'
    },
    {
      id: 'serena',
      ownerUsername: 'serena',
      name: 'Serena',
      age: 16,
      className: 'Alterado',
      level: 4,
      concept: 'Curiosa, ousada e ligada a nanites e interfaces do Instituto.',
      manifestationOrigin: 'Nanites',
      links: 'Cael, K, escola, robô do canal, Ala Arendt.',
      summary: 'A mais conectada ao estranho. Seus nanites reagem ao ecossistema tecnológico do Instituto.',
      attributes: {
        forca: 1,
        destreza: 3,
        sentidos: 3,
        vigor: 2,
        inteligencia: 4,
        nexo: 5
      },
      resources: {
        pvCurrent: 27,
        peCurrent: 25,
        pdCurrent: 31,
        instability: 1,
        armorBonus: 0,
        armorEquipment: 'Nanites / revestimento parcial',
        blockMode: 'vigor',
        status: 'Recuperada da transferência'
      },
      progression: {
        extraPeV: 0,
        manualPeVSpent: 0,
        facetaUnlocks: 0,
        facetaStabilizations: 0,
        notes: 'Sem ajustes manuais.'
      },
      skills: {
        acrobacia: 2,
        adestramento: 0,
        artes: 1,
        atletismo: 1,
        atualidades: 2,
        ciencias: 3,
        crime: 1,
        diplomacia: 2,
        enganacao: 1,
        fortitude: 1,
        furtividade: 2,
        iniciativa: 2,
        intimidacao: 0,
        intuicao: 2,
        investigacao: 3,
        luta: 1,
        manifestacao: 4,
        medicina: 1,
        percepcao: 3,
        pilotagem: 0,
        pontaria: 1,
        profissao: 0,
        reflexos: 2,
        sobrevivencia: 1,
        tecnologia: 4,
        vontade: 2
      },
      aptitudes: [
        { catalogId: 'leitura-anomala' },
        { catalogId: 'pulso-firme' },
        { catalogId: 'faceta-reativa' }
      ],
      manifestation: {
        name: 'Nanites',
        origin: 'Implante / interface',
        state: 'Parcial',
        glitches: 'Reações involuntárias a sistemas, portas, drones e hardware vivo.',
        activeEffects: 'Compatibilidade reconhecida pelo robô do canal.'
      },
      facets: [
        { name: 'Tecnopatia', notes: 'Interage com sistemas, portas e computadores.' },
        { name: 'Revestimento', notes: 'Blindagem parcial e proteção situacional.' },
        { name: 'Reconfiguração', notes: 'Mudanças rápidas e respostas adaptativas.' },
        { name: 'Leitura de Sistema', notes: 'Acesso a arquivos internos e protocolos.' },
        { name: 'Interface Viva', notes: 'Corpo reage ao ecossistema tecnobiológico.' }
      ],
      mastery: [
        { facet: 'Tecnopatia', rank: 4, xp: 10 },
        { facet: 'Revestimento', rank: 3, xp: 6 },
        { facet: 'Reconfiguração', rank: 2, xp: 3 }
      ],
      companions: [
        { id: 'nanites', name: 'Nanites', type: 'Manifestação', pvCurrent: 0, pvMax: 0, armor: 0, status: 'Ativo', notes: 'Núcleo principal do kit de Serena.', attributes: { forca: 0, destreza: 2, sentidos: 2, vigor: 0, inteligencia: 4, nexo: 5 }, skills: [{ name: 'Tecnologia', value: 5 }, { name: 'Manifestação', value: 4 }], facets: [{ name: 'Tecnopatia', rank: 4, xp: 10 }, { name: 'Revestimento', rank: 3, xp: 6 }] },
        { id: 'ala-arendt', name: 'Ala Arendt', type: 'Evento', pvCurrent: 0, pvMax: 0, armor: 0, status: 'Concluído', notes: 'Transferência forçada deixou Serena inconsciente por cerca de um dia.' }
      ],
      equipment: {
        primaryWeapon: 'Nanites / improviso tecnológico',
        secondaryWeapon: 'Ferramentas / ambiente',
        items: 'Celular, mochila, livros, objetos pessoais.'
      },
      notes: 'Serena foi teleportada primeiro à Ala Arendt e acessou arquivos internos do Instituto.',
      masterNotes: 'Ótima ponte para cenas de tecnologia, portas, robôs e sala de computadores.'
    },
    {
      id: 'k',
      ownerUsername: 'k',
      name: 'K',
      age: 16,
      className: 'Especialista',
      level: 4,
      concept: 'Ligado ao Mimer e a uma linha quebrada do projeto.',
      manifestationOrigin: 'Simbiose / exposição',
      links: 'Mimer, Júlia, Cael, Serena, Greg.',
      summary: 'Portador indireto do estranho. Sua ponte com o Mimer e os braceletes defeituosos abre a camada mais quebrada do mistério.',
      attributes: {
        forca: 2,
        destreza: 3,
        sentidos: 3,
        vigor: 2,
        inteligencia: 4,
        nexo: 3
      },
      resources: {
        pvCurrent: 24,
        peCurrent: 17,
        pdCurrent: 24,
        instability: 3,
        armorBonus: 0,
        armorEquipment: 'Bracelete defeituoso / proteção improvisada',
        blockMode: 'forca',
        status: 'Funcional, instável'
      },
      progression: {
        extraPeV: 4,
        manualPeVSpent: 0,
        facetaUnlocks: 0,
        facetaStabilizations: 0,
        notes: 'Bônus extra lançado manualmente para representar desenvolvimento de mesa.'
      },
      skills: {
        acrobacia: 1,
        adestramento: 0,
        artes: 0,
        atletismo: 1,
        atualidades: 2,
        ciencias: 2,
        crime: 1,
        diplomacia: 1,
        enganacao: 1,
        fortitude: 2,
        furtividade: 2,
        iniciativa: 2,
        intimidacao: 1,
        intuicao: 2,
        investigacao: 4,
        luta: 2,
        manifestacao: 3,
        medicina: 1,
        percepcao: 3,
        pilotagem: 0,
        pontaria: 1,
        profissao: 0,
        reflexos: 2,
        sobrevivencia: 2,
        tecnologia: 3,
        vontade: 3
      },
      aptitudes: [
        { catalogId: 'procedimento' },
        { catalogId: 'ouvido-de-rua' },
        { catalogId: 'faceta-preferida' }
      ],
      manifestation: {
        name: 'Mimer / bracelete defeituoso',
        origin: 'Simbiose + artefato quebrado',
        state: 'Parcial',
        glitches: 'Transformações parciais, violentas e biologicamente problemáticas.',
        activeEffects: 'Linha quebrada do projeto ativa em momentos específicos.'
      },
      facets: [
        { name: 'Mimer', notes: 'Inteligência quebrada que reconhece termos e sistemas.' },
        { name: 'Transformação Parcial', notes: 'Efeito desconfortável e incompleto do bracelete defeituoso.' },
        { name: 'Arquivo Quebrado', notes: 'Lapsos de memória e leitura do estranho.' },
        { name: 'Sinal de Projeto', notes: 'Ponte com materiais e palavras do Instituto.' },
        { name: 'Risco Corporal', notes: 'O projeto produz horror corporal e instabilidade.' }
      ],
      mastery: [
        { facet: 'Mimer', rank: 3, xp: 6 },
        { facet: 'Transformação Parcial', rank: 2, xp: 3 },
        { facet: 'Arquivo Quebrado', rank: 2, xp: 3 }
      ],
      companions: [
        { name: 'Mimer', type: 'Entidade', status: 'Ativo', notes: 'Inteligência quebrada ligada ao passado de K.', attributes: { inteligencia: 4, nexo: 3 }, skills: [{ name: 'Investigação', value: 3 }, { name: 'Atualidades', value: 2 }], facets: [{ name: 'Arquivo Quebrado', rank: 2, xp: 3 }] },
        { name: 'Bracelete defeituoso', type: 'Item', status: 'Instável', notes: 'Ativa por um segundo, descarrega rápido e transforma errado.', facets: [{ name: 'Transformação Parcial', rank: 2, xp: 3 }] }
      ],
      equipment: {
        primaryWeapon: 'Bracelete defeituoso / improviso',
        secondaryWeapon: 'Ambiente',
        items: 'Celular, mochila, objetos pessoais, resíduos de investigação.'
      },
      notes: 'K teve contato com transformações parciais e com a linha quebrada do projeto.',
      masterNotes: 'Greg criou proximidade com K durante a exploração da Ala Arendt.'
    },
    {
      id: 'greg',
ownerUsername: 'greg',
name: 'Greg',
age: 16,
className: 'Combatente',
level: 2,
concept: 'Gentil, inocente e fisicamente alterado pelo Molde; tenta ajudar todo mundo mesmo sem entender totalmente o perigo ao redor.',
manifestationOrigin: 'Contato com o Molde, próximo à futura área quarentenada da ARCA 7.',
links: 'Avós, K, Instituto, Ala Arendt, Elias.',
summary: 'Greg vivia com os avós e entrou em contato com o Molde sem saber o que era. O Instituto o recolheu sob a desculpa de uma escola especial, e agora ele tenta entender o próprio corpo enquanto continua sendo um garoto doce demais para o tamanho do horror à sua volta.',
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
  armorEquipment: 'Corpo endurecido / massa muscular anômala',
  blockMode: 'vigor',
  status: 'Ainda se adaptando às mudanças do corpo'
},
progression: {
  extraPeV: 0,
  manualPeVSpent: 0,
  facetaUnlocks: 0,
  facetaStabilizations: 0,
  notes: '12 PeV livres.'
},
skills: {
  acrobacia: 0,
  adestramento: 0,
  artes: 0,
  atletismo: 0,
  atualidades: 0,
  ciencias: 0,
  crime: 0,
  diplomacia: 0,
  enganacao: 0,
  fortitude: 3,
  furtividade: 0,
  iniciativa: 2,
  intimidacao: 0,
  intuicao: 0,
  investigacao: 0,
  luta: 3,
  manifestacao: 2,
  medicina: 0,
  percepcao: 0,
  pilotagem: 0,
  pontaria: 0,
  profissao: 0,
  reflexos: 3,
  sobrevivencia: 0,
  tecnologia: 0,
  vontade: 3
},
aptitudes: [
  { catalogId: 'guarda-fechada' },
  { catalogId: 'folego-extra' },
  { catalogId: 'reserva-tecnica' }
],
manifestation: {
  name: 'Controle de Músculos',
  origin: 'Mutação corporal ligada ao Molde',
  state: 'Parcial',
  glitches: '',
  activeEffects: 'Corpo mais rígido, denso e forte do que deveria para a idade.'
},
facets: [
  {
    name: 'Armadura de Músculos',
    notes: 'Endurece o próprio corpo com fibras e massa muscular anômala, aumentando resistência e proteção.'
  },
  {
    name: 'Ataques Musculares',
    notes: 'Concentra força e tensão muscular em golpes diretos, agarrões e impacto físico.'
  }
],
mastery: [
  { facet: 'Armadura de Músculos', rank: 2, xp: 5 },
  { facet: 'Ataques Musculares', rank: 2, xp: 5 }
],
companions: [],
equipment: {
  primaryWeapon: 'Soco',
  secondaryWeapon: 'Soco²',
  items: 'Celularzinho, mochila e coisas básicas de escola.'
},
notes: 'Greg morava com os avós depois de eles ganharem sua guarda. Entrou em contato com o Molde sem entender o que era e acabou puxado para o Instituto sob falsa promessa de estudo e cuidado.',
masterNotes: 'Muito inteligente, mas infantil e inocente para a idade. Ligado ao Instituto por um programa anterior de triagem e formação de jovens adaptativos. Criou proximidade especialmente com K.'
    }

  ]
};
