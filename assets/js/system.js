(function () {
  const SKILLS = [
    { key: 'acrobacia', label: 'Acrobacia' },
    { key: 'adestramento', label: 'Adestramento' },
    { key: 'artes', label: 'Artes' },
    { key: 'atletismo', label: 'Atletismo' },
    { key: 'atualidades', label: 'Atualidades' },
    { key: 'ciencias', label: 'Ciências' },
    { key: 'crime', label: 'Crime' },
    { key: 'diplomacia', label: 'Diplomacia' },
    { key: 'enganacao', label: 'Enganação' },
    { key: 'fortitude', label: 'Fortitude' },
    { key: 'furtividade', label: 'Furtividade' },
    { key: 'iniciativa', label: 'Iniciativa' },
    { key: 'intimidacao', label: 'Intimidação' },
    { key: 'intuicao', label: 'Intuição' },
    { key: 'investigacao', label: 'Investigação' },
    { key: 'luta', label: 'Luta' },
    { key: 'manifestacao', label: 'Manifestação' },
    { key: 'medicina', label: 'Medicina' },
    { key: 'percepcao', label: 'Percepção' },
    { key: 'pilotagem', label: 'Pilotagem' },
    { key: 'pontaria', label: 'Pontaria' },
    { key: 'profissao', label: 'Profissão' },
    { key: 'reflexos', label: 'Reflexos' },
    { key: 'sobrevivencia', label: 'Sobrevivência' },
    { key: 'tecnologia', label: 'Tecnologia' },
    { key: 'vontade', label: 'Vontade' }
  ];

  const ATTRIBUTES = [
    { key: 'forca', label: 'Força' },
    { key: 'destreza', label: 'Destreza' },
    { key: 'sentidos', label: 'Sentidos' },
    { key: 'vigor', label: 'Vigor' },
    { key: 'inteligencia', label: 'Inteligência' },
    { key: 'nexo', label: 'Nexo' }
  ];

  const SKILL_ATTRIBUTE_DEFAULTS = {
    acrobacia: 'destreza',
    adestramento: 'inteligencia',
    artes: 'inteligencia',
    atletismo: 'destreza',
    atualidades: 'inteligencia',
    ciencias: 'inteligencia',
    crime: 'destreza',
    diplomacia: 'inteligencia',
    enganacao: 'inteligencia',
    fortitude: 'vigor',
    furtividade: 'destreza',
    iniciativa: 'destreza',
    intimidacao: 'forca',
    intuicao: 'sentidos',
    investigacao: 'inteligencia',
    luta: 'forca',
    manifestacao: 'nexo',
    medicina: 'inteligencia',
    percepcao: 'sentidos',
    pilotagem: 'destreza',
    pontaria: 'sentidos',
    profissao: 'inteligencia',
    reflexos: 'destreza',
    sobrevivencia: 'sentidos',
    tecnologia: 'inteligencia',
    vontade: 'inteligencia'
  };

  const CLASS_CONFIG = {
    Alterado: {
      pvBase: 16,
      peBase: 6,
      pdBase: 15,
      armorBase: 0,
      pvGrowth: 2,
      peGrowth: 3,
      pdGrowth: 5,
      notes: 'Vontade +2; pode trocar 1 PD por 2 PE.'
    },
    Especialista: {
      pvBase: 19,
      peBase: 4,
      pdBase: 12,
      armorBase: 0,
      pvGrowth: 3,
      peGrowth: 2,
      pdGrowth: 4,
      notes: 'Recebe PeV extras por Inteligência em progressões futuras.'
    },
    Combatente: {
      pvBase: 25,
      peBase: 2,
      pdBase: 10,
      armorBase: 1,
      pvGrowth: 4,
      peGrowth: 1,
      pdGrowth: 3,
      notes: 'Armadura +1; 1x por cena pode anular totalmente o dano de um ataque.'
    }
  };

  const APTITUDE_COSTS = {
    'Básica': 4,
    'Treinada': 6,
    'Avançada': 8,
    'Excepcional': 10
  };

  const APTITUDE_CATALOG = [
    { id: 'sangue-frio', name: 'Sangue Frio', tier: 'Básica', group: 'Geral', prerequisites: 'Vontade 2', summary: '+2 Iniciativa e +2 no primeiro teste de Vontade da cena contra pressão.' },
    { id: 'olho-clinico', name: 'Olho Clínico', tier: 'Básica', group: 'Geral', prerequisites: 'Investigação 2 ou Medicina 2', summary: '+2 para analisar corpos, resíduos, ferimentos e cenas.' },
    { id: 'leitura-de-ambiente', name: 'Leitura de Ambiente', tier: 'Básica', group: 'Geral', prerequisites: 'Percepção 2, Sentidos 2', summary: '+2 Defesa no primeiro turno e ignora penalidade leve de terreno/cobertura.' },
    { id: 'pulso-firme', name: 'Pulso Firme', tier: 'Básica', group: 'Geral', prerequisites: 'Destreza 2', summary: '+2 em Pontaria, Tecnologia ou Medicina sob risco imediato.' },
    { id: 'improviso', name: 'Improviso', tier: 'Básica', group: 'Geral', prerequisites: 'Inteligência 2', summary: '1x/cena, +2 em perícia 1 ou menos; +3 se resolver com recurso inadequado.' },
    { id: 'tecnica-repetida', name: 'Técnica Repetida', tier: 'Básica', group: 'Geral', prerequisites: 'Qualquer perícia 2', summary: 'Escolha 1 perícia 2+: 1x/cena, +2 nela.' },
    { id: 'folego-extra', name: 'Fôlego Extra', tier: 'Básica', group: 'Geral', prerequisites: 'Vigor 3', summary: '+5 PV máximo.' },
    { id: 'reserva-mental', name: 'Reserva Mental', tier: 'Básica', group: 'Geral', prerequisites: 'Inteligência 3 ou Vontade 3', summary: '+5 PD máximo.' },
    { id: 'reserva-tecnica', name: 'Reserva Técnica', tier: 'Básica', group: 'Geral', prerequisites: 'Nexo 3', summary: '+4 PE máximo.' },
    { id: 'rastro-invisivel', name: 'Rastro Invisível', tier: 'Básica', group: 'Geral', prerequisites: 'Furtividade 2, Sentidos 2', summary: '+2 Furtividade em ambiente urbano; +4 no primeiro teste saindo de cobertura/sombra.' },
    { id: 'cara-comum', name: 'Cara Comum', tier: 'Básica', group: 'Geral', prerequisites: 'Enganação 2 ou Furtividade 2', summary: '+2 para se misturar e evitar atenção.' },
    { id: 'leitura-de-gente', name: 'Leitura de Gente', tier: 'Básica', group: 'Geral', prerequisites: 'Intuição 2', summary: '+2 Intuição; +3 se o alvo estiver mentindo sob pressão.' },
    { id: 'presenca-dificil', name: 'Presença Difícil', tier: 'Treinada', group: 'Geral', prerequisites: 'Intimidação 4 ou Vontade 4', summary: 'Escolha Intimidação ou Vontade: +3 e pode impor hesitação curta.' },
    { id: 'rede-de-contatos', name: 'Rede de Contatos', tier: 'Treinada', group: 'Geral', prerequisites: 'Diplomacia 4, Atualidades 3', summary: '1x/sessão, declara um contato plausível; +2 para favores menores.' },
    { id: 'mente-blindada', name: 'Mente Blindada', tier: 'Treinada', group: 'Geral', prerequisites: 'Vontade 5', summary: 'Reduz dano em PD em 2 e ignora a primeira condição mental leve.' },
    { id: 'casca-dura', name: 'Casca Dura', tier: 'Treinada', group: 'Geral', prerequisites: 'Vigor 5', summary: '+1 Armadura e +2 Fortitude contra dor, exaustão e trauma.' },
    { id: 'reflexo-de-sobrevivencia', name: 'Reflexo de Sobrevivência', tier: 'Treinada', group: 'Geral', prerequisites: 'Vigor 5, Fortitude 4', summary: '1x/cena, reduz pela metade o dano que levaria a 0 PV.' },
    { id: 'ouvido-de-rua', name: 'Ouvido de Rua', tier: 'Treinada', group: 'Geral', prerequisites: 'Atualidades 4 ou Investigação 4', summary: '+2 em coleta de informação urbana; crítico dá rumor verdadeiro ou direção útil.' },
    { id: 'pressao-certa', name: 'Pressão Certa', tier: 'Treinada', group: 'Geral', prerequisites: 'Intuição 4 e Diplomacia 3 ou Intimidação 3', summary: '1x/cena, falha vira sucesso parcial ou parcial vira completo.' },
    { id: 'boca-fechada', name: 'Boca Fechada', tier: 'Treinada', group: 'Geral', prerequisites: 'Vontade 4, Enganação 3 ou Diplomacia 3', summary: '+3 para resistir a interrogatório, coação ou chantagem.' },
    { id: 'documento-vivo', name: 'Documento Vivo', tier: 'Treinada', group: 'Geral', prerequisites: 'Atualidades 4 e Tecnologia 3 ou Crime 3', summary: '+2 em burocracia, sistemas, cadastro e documentos.' },
    { id: 'investigador-obstinado', name: 'Investigador Obstinado', tier: 'Avançada', group: 'Geral', prerequisites: 'Nível 5, Investigação 5, Vontade 5', summary: '1x/cena, rerrola Investigação com -2; se falhar, ganha pista parcial.' },
    { id: 'memoria-tecnica-geral', name: 'Memória Técnica', tier: 'Avançada', group: 'Geral', prerequisites: 'Nível 5, Inteligência 6, Ciências 4 ou Tecnologia 4', summary: '1x/cena, lembra detalhe técnico ou logístico útil.' },
    { id: 'arquivo-pessoal', name: 'Arquivo Pessoal', tier: 'Avançada', group: 'Geral', prerequisites: 'Nível 5, Atualidades 5, Investigação 5', summary: '1x/sessão, pede elo plausível entre pistas, nomes ou lugares.' },
    { id: 'espirito-de-ferro', name: 'Espírito de Ferro', tier: 'Avançada', group: 'Geral', prerequisites: 'Nível 6, Vontade 6, Inteligência 5', summary: 'Dano em PD reduz 3; 1x/cena ignora medo ou desorientação leve.' },
    { id: 'ossos-de-concreto', name: 'Ossos de Concreto', tier: 'Avançada', group: 'Geral', prerequisites: 'Nível 6, Vigor 7, Fortitude 5', summary: '+1 Armadura extra e reduz dano físico não crítico em 2.' },
    { id: 'instinto-terminal', name: 'Instinto Terminal', tier: 'Excepcional', group: 'Geral', prerequisites: 'Nível 8, Vigor 8, Fortitude 6, Vontade 5', summary: '1x/sessão, em vez de cair a 0 PV, fica com 1 PV.' },
    { id: 'presenca-inquebravel', name: 'Presença Inquebrável', tier: 'Excepcional', group: 'Geral', prerequisites: 'Nível 8, Vontade 8, Intimidação 5', summary: '+4 Intimidação e +2 contra coerção e efeitos mentais.' },

    { id: 'canalizacao-eficiente', name: 'Canalização Eficiente', tier: 'Básica', group: 'Alterado', prerequisites: 'Alterado/Manifestação ativa; Manifestação 2', summary: 'Escolha 1 Faceta: -1 PE, mínimo 1.' },
    { id: 'controle-de-glitch', name: 'Controle de Glitch', tier: 'Básica', group: 'Alterado', prerequisites: 'Alterado/Manifestação ativa; Vontade 2', summary: '1x/cena, anula Glitch Menor.' },
    { id: 'leitura-anomala', name: 'Leitura Anômala', tier: 'Básica', group: 'Alterado', prerequisites: 'Alterado/Manifestação ativa; Ciências 2 ou Investigação 2', summary: '+2 ao analisar artefatos, mutações, resíduo ou tecnologia viva.' },
    { id: 'assinatura-oculta', name: 'Assinatura Oculta', tier: 'Treinada', group: 'Alterado', prerequisites: 'Furtividade 4, Manifestação 4, Nexo 4', summary: '+3 para esconder sinais da Manifestação; sensores sofrem -2.' },
    { id: 'nucleo-estavel', name: 'Núcleo Estável', tier: 'Treinada', group: 'Alterado', prerequisites: 'Nexo 5, Vontade 5, Manifestação 4', summary: '-1 Instabilidade no começo da cena; a primeira falha não gera Glitch automático.' },
    { id: 'resposta-de-emergencia', name: 'Resposta de Emergência', tier: 'Treinada', group: 'Alterado', prerequisites: 'Reflexos 4, Manifestação 4, Nexo 4', summary: '1x/cena, usa Faceta defensiva/utilitária como Reação sem perder a ação padrão.' },
    { id: 'sustentacao', name: 'Sustentação', tier: 'Treinada', group: 'Alterado', prerequisites: 'Manifestação 4, Nexo 5', summary: 'Uma Faceta contínua dura +50%; a primeira rodada extra não gera Instabilidade.' },
    { id: 'conversao-forcada', name: 'Conversão Forçada', tier: 'Treinada', group: 'Alterado', prerequisites: 'Vigor 4, Nexo 5', summary: '1x/cena, converte 1 PD em 2 PE ou 2 PV em 3 PE.' },
    { id: 'adaptacao-rapida', name: 'Adaptação Rápida', tier: 'Treinada', group: 'Alterado', prerequisites: 'Fortitude 4 ou Sobrevivência 4, Nexo 4', summary: 'Ignora a primeira penalidade de zona ou interferência anômala por cena.' },
    { id: 'trava-de-colapso', name: 'Trava de Colapso', tier: 'Avançada', group: 'Alterado', prerequisites: 'Nível 5, Nexo 7, Vontade 6, Manifestação 5', summary: '1x/sessão, Instabilidade 6 para em 5; +3 no próximo teste para segurar a situação.' },
    { id: 'faceta-de-combate', name: 'Faceta de Combate', tier: 'Avançada', group: 'Alterado', prerequisites: 'Nível 5, uma Faceta Rank 5, Manifestação 5', summary: 'Uma Faceta ofensiva/defensiva recebe +2 e 1 efeito extra menor por cena.' },
    { id: 'sincronia-profunda', name: 'Sincronia Profunda', tier: 'Avançada', group: 'Alterado', prerequisites: 'Nível 6, Nexo 7, Manifestação 6', summary: '+3 contra Instabilidade, Glitches e interferência; o primeiro +1 Instabilidade da cena é ignorado.' },
    { id: 'derivacao-estavel', name: 'Derivação Estável', tier: 'Avançada', group: 'Alterado', prerequisites: 'Nível 6, duas Facetas Rank 4, Manifestação 6', summary: 'Nova Faceta começa com +2 XP e o primeiro uso não gera Instabilidade.' },
    { id: 'ruptura-controlada', name: 'Ruptura Controlada', tier: 'Excepcional', group: 'Alterado', prerequisites: 'Nível 8, Nexo 8, Manifestação 7, uma Faceta Rank 6', summary: '1x/sessão, entra em Ruptura com bônus e custo menor; depois ganha +2 Instabilidade.' },
    { id: 'nucleo-monstruoso', name: 'Núcleo Monstruoso', tier: 'Excepcional', group: 'Alterado', prerequisites: 'Nível 8, Nexo 9, Vigor 7, Manifestação 7', summary: 'Em Instabilidade 4+, ganha bônus em Manifestação, Fortitude e dano; desastres viram Glitch Grave.' },

    { id: 'procedimento', name: 'Procedimento', tier: 'Básica', group: 'Especialista', prerequisites: 'Especialista; Inteligência 2', summary: 'Após 1 min de preparo, +2 no próximo teste técnico/científico/médico/investigativo.' },
    { id: 'mao-estavel', name: 'Mão Estável', tier: 'Básica', group: 'Especialista', prerequisites: 'Especialista; Medicina 2 ou Tecnologia 2', summary: '+2 em Medicina ou Tecnologia sob combate/urgência.' },
    { id: 'preparado', name: 'Preparado', tier: 'Básica', group: 'Especialista', prerequisites: 'Especialista; Iniciativa 2', summary: '+2 Iniciativa e saca/prepara item como ação livre no primeiro turno.' },
    { id: 'acao-calculada', name: 'Ação Calculada', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Investigação 4 ou Tecnologia 4, Inteligência 4', summary: 'Ajudar aliado dá +3; +4 em ação técnica, médica ou tática.' },
    { id: 'diagnostico', name: 'Diagnóstico', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Medicina 4 ou Ciências 4', summary: 'Descobre condição, dano, fraqueza, instabilidade ou problema central.' },
    { id: 'kit-de-campo', name: 'Kit de Campo', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Profissão 4 ou Tecnologia 4', summary: '1x/cena, declara item plausível de trabalho ou kit.' },
    { id: 'memoria-tecnica-especialista', name: 'Memória Técnica', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Inteligência 5, Ciências 3 ou Tecnologia 3', summary: '1x/cena, lembra detalhe técnico ou estrutural útil.' },
    { id: 'apoio-tatico', name: 'Apoio Tático', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Diplomacia 4 ou Investigação 4', summary: 'Aliados próximos recebem +1 em estabilização, retirada, cobertura ou reposicionamento.' },
    { id: 'analise-de-fraqueza', name: 'Análise de Fraqueza', tier: 'Avançada', group: 'Especialista', prerequisites: 'Nível 5, Especialista, Investigação 5, Sentidos 6', summary: 'Gasta uma ação para observar e dar +3 no próximo ataque contra o alvo, com +3 dano.' },
    { id: 'procedimento-ii', name: 'Procedimento II', tier: 'Avançada', group: 'Especialista', prerequisites: 'Nível 5, Procedimento, Especialista, Inteligência 6', summary: 'Procedimento sobe para +3 e exige metade do tempo.' },
    { id: 'recurso-extraido', name: 'Recurso Extraído', tier: 'Avançada', group: 'Especialista', prerequisites: 'Nível 5, Especialista, Tecnologia 5 ou Profissão 5', summary: '1x/cena, evita consumo ou extrai efeito extra de item limitado.' },
    { id: 'executor-de-campo', name: 'Executor de Campo', tier: 'Avançada', group: 'Especialista', prerequisites: 'Nível 6, Especialista, Tecnologia 5, Medicina 5, Investigação 5', summary: '1x/cena, teste técnico/médico/investigativo sob pressão conta como 10 natural.' },
    { id: 'processamento-paralelo', name: 'Processamento Paralelo', tier: 'Avançada', group: 'Especialista', prerequisites: 'Nível 6, Especialista, Inteligência 7, Investigação 5', summary: '1x/cena, após sucesso técnico faz segundo teste técnico diferente como ação parcial.' },
    { id: 'cerebro-de-operacao', name: 'Cérebro de Operação', tier: 'Excepcional', group: 'Especialista', prerequisites: 'Nível 8, Especialista, Inteligência 8, uma perícia técnica 7', summary: 'Até 2 aliados recebem +2 em uma categoria escolhida na cena.' },
    { id: 'arquiteto-de-crise', name: 'Arquiteto de Crise', tier: 'Excepcional', group: 'Especialista', prerequisites: 'Nível 8, Especialista, Inteligência 9, Investigação 6, Tecnologia 6', summary: '1x/sessão, reorganiza cena técnica, logística ou de contenção a favor do grupo.' },

    { id: 'guarda-fechada', name: 'Guarda Fechada', tier: 'Básica', group: 'Combatente', prerequisites: 'Combatente; Luta 2, Vigor 2', summary: '+2 em Bloqueio.' },
    { id: 'passo-curto', name: 'Passo Curto', tier: 'Básica', group: 'Combatente', prerequisites: 'Combatente; Destreza 2', summary: '+2m de movimento 1x/turno sem gastar ação.' },
    { id: 'impacto', name: 'Impacto', tier: 'Básica', group: 'Combatente', prerequisites: 'Combatente; Força 2, Luta 2', summary: 'Acerto corpo a corpo empurra 1m sem teste extra.' },
    { id: 'protetor', name: 'Protetor', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Vigor 4, Reflexos 4', summary: '1x/rodada, vira alvo no lugar do aliado adjacente e reduz dano em 3.' },
    { id: 'tranco', name: 'Tranco', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Vigor 4, Luta 4', summary: 'Bloqueio bem-sucedido reduz dano em +3.' },
    { id: 'golpe-pesado', name: 'Golpe Pesado', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Força 5, Luta 4', summary: '-2 ataque, +6 dano se acertar.' },
    { id: 'avanco-implacavel', name: 'Avanço Implacável', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Atletismo 4 ou Destreza 4', summary: 'Ao terminar adjacente, +2 no próximo ataque e trava deslocamento do alvo.' },
    { id: 'contra-pressao', name: 'Contra-pressão', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Reflexos 4, Vigor 4', summary: '+2 na segunda defesa em diante na rodada.' },
    { id: 'presenca-de-linha-de-frente', name: 'Presença de Linha de Frente', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Luta 4, Intimidação 4', summary: 'Inimigos adjacentes sofrem -2 para fugir ou manobrar ignorando você.' },
    { id: 'casco-de-guerra', name: 'Casco de Guerra', tier: 'Avançada', group: 'Combatente', prerequisites: 'Nível 5, Combatente, Vigor 7, Fortitude 5', summary: 'Abaixo de metade dos PV: +1 Armadura, +2 Fortitude e +2 Bloqueio.' },
    { id: 'guarda-fechada-ii', name: 'Guarda Fechada II', tier: 'Avançada', group: 'Combatente', prerequisites: 'Nível 5, Guarda Fechada, Combatente, Luta 5, Vigor 6', summary: 'Bloqueio sobe de +2 para +4.' },
    { id: 'quebra-linha', name: 'Quebra-linha', tier: 'Avançada', group: 'Combatente', prerequisites: 'Nível 5, Combatente, Força 7, Atletismo 5, Luta 5', summary: 'Investida não deixa Desprevenido e pode derrubar.' },
    { id: 'nao-passa', name: 'Não Passa', tier: 'Avançada', group: 'Combatente', prerequisites: 'Nível 6, Combatente, Vigor 6, Presença de Linha de Frente', summary: '1x/rodada, ataca inimigo que tenta sair; se acertar, ele perde o movimento.' },
    { id: 'parede-viva', name: 'Parede Viva', tier: 'Avançada', group: 'Combatente', prerequisites: 'Nível 6, Combatente, Vigor 7, Reflexos 5', summary: 'Em Defesa Total, aliados adjacentes recebem +2 Defesa à distância e reduzem o primeiro dano em 2.' },
    { id: 'instinto-de-batalha', name: 'Instinto de Batalha', tier: 'Excepcional', group: 'Combatente', prerequisites: 'Nível 8, Combatente, Reflexos 6, Luta 6, Vigor 6', summary: 'No primeiro turno: +3 Defesa, +3 no primeiro ataque e +3m de movimento.' },
    { id: 'corpo-de-cerco', name: 'Corpo de Cerco', tier: 'Excepcional', group: 'Combatente', prerequisites: 'Nível 8, Combatente, Força 8, Vigor 8, Fortitude 6', summary: '+2 Armadura, resistência a empurrão/queda/imobilização e -3 dano físico não crítico.' },
    { id: 'ultimo-a-cair', name: 'Último a Cair', tier: 'Excepcional', group: 'Combatente', prerequisites: 'Nível 8, Combatente, Vigor 9, Fortitude 7, Casco de Guerra', summary: 'Abaixo da metade dos PV: +2 Defesa, +2 Luta e a primeira queda a 0 PV vira 1 PV.' },

    { id: 'faceta-preferida', name: 'Faceta Preferida', tier: 'Básica', group: 'Manifestação', prerequisites: 'Manifestação ativa; Faceta Rank 2', summary: 'Escolha uma Faceta; 1x/cena recebe +2 no teste dela.' },
    { id: 'disparo-limpo', name: 'Disparo Limpo', tier: 'Básica', group: 'Manifestação', prerequisites: 'Manifestação ativa; Manifestação 2, Nexo 3', summary: 'O primeiro uso de Faceta na cena gera -1 Instabilidade.' },
    { id: 'reversao-parcial', name: 'Reversão Parcial', tier: 'Treinada', group: 'Manifestação', prerequisites: 'Manifestação ativa; Vontade 4, Manifestação 4', summary: '1x/cena, após falhar, cancela o efeito da Faceta e evita a principal consequência.' },
    { id: 'janela-de-controle', name: 'Janela de Controle', tier: 'Treinada', group: 'Manifestação', prerequisites: 'Manifestação ativa; Nexo 5, Vontade 4', summary: 'Quando iria a Instabilidade 4 pela primeira vez na cena, mantém em 3.' },
    { id: 'faceta-reativa', name: 'Faceta Reativa', tier: 'Treinada', group: 'Manifestação', prerequisites: 'Manifestação ativa; Reflexos 4; Faceta Rank 4', summary: 'Escolha uma Faceta rápida; 1x/cena ela pode ser usada como Reação.' },
    { id: 'sincronia', name: 'Sincronia', tier: 'Treinada', group: 'Manifestação', prerequisites: 'Manifestação ativa; Nexo 5', summary: '+3 em Vontade contra Instabilidade, Glitches ou stress de ativação.' },
    { id: 'faceta-preferida-ii', name: 'Faceta Preferida II', tier: 'Avançada', group: 'Manifestação', prerequisites: 'Nível 5, Faceta Preferida, Faceta Rank 5', summary: 'Além do bônus, 1x/cena reduz custo da Faceta em 1 PE.' },
    { id: 'janela-de-controle-ii', name: 'Janela de Controle II', tier: 'Avançada', group: 'Manifestação', prerequisites: 'Nível 6, Janela de Controle, Nexo 7, Vontade 6', summary: '1x/cena, anula Glitch Menor por Instabilidade 4 ou 5.' },
    { id: 'arquitetura-da-faceta', name: 'Arquitetura da Faceta', tier: 'Avançada', group: 'Manifestação', prerequisites: 'Nível 6, Manifestação ativa, Faceta Rank 6, Manifestação 6', summary: 'Ao subir o próximo Rank dessa Faceta, recebe uma opção extra de evolução.' },
    { id: 'reator-interno', name: 'Reator Interno', tier: 'Avançada', group: 'Manifestação', prerequisites: 'Nível 6, Manifestação ativa, Nexo 7, Manifestação 6', summary: 'Recupera 2 PE no começo da cena, salvo colapso anterior.' },
    { id: 'nucleo-sincronico', name: 'Núcleo Sincrônico', tier: 'Excepcional', group: 'Manifestação', prerequisites: 'Nível 8, Manifestação ativa, Nexo 8, Manifestação 7, duas Facetas Rank 5', summary: 'Escolhe 1 Faceta por cena: +2 nos testes, -1 Instabilidade no primeiro uso e crítico com efeito extra.' },
    { id: 'sobrecarga-dirigida', name: 'Sobrecarga Dirigida', tier: 'Excepcional', group: 'Manifestação', prerequisites: 'Nível 8, Manifestação ativa, Nexo 9, Manifestação 8, uma Faceta Rank 7', summary: '1x/sessão, aumenta uma Faceta além do limite seguro por uma cena e depois sofre +2 Instabilidade.' }
  ];

  const APTITUDE_EFFECT_OPTIONS = {
    'presenca-dificil': [
      { value: 'intimidacao', label: 'Intimidação' },
      { value: 'vontade', label: 'Vontade' }
    ]
  };

  const APTITUDE_AUTO_EFFECTS = {
    'sangue-frio': { initiativeBonus: 2 },
    'folego-extra': { maxPvBonus: 5 },
    'reserva-mental': { maxPdBonus: 5 },
    'reserva-tecnica': { maxPeBonus: 4 },
    'leitura-de-gente': { skillBonuses: { intuicao: 2 } },
    'presenca-dificil': { chosenSkillBonus: 3, optionKey: 'effectChoice', defaultOption: 'intimidacao' },
    'casca-dura': { armorBonus: 1 },
    'preparado': { initiativeBonus: 2 },
    'guarda-fechada': { blockBonus: 2 },
    'guarda-fechada-ii': { blockBonusOverride: 4 },
    'ossos-de-concreto': { armorBonus: 1 },
    'corpo-de-cerco': { armorBonus: 2 },
    'presenca-inquebravel': { skillBonuses: { intimidacao: 4 } }
  };

  const ATTRIBUTE_POINTS_BASE = 4;
  const ATTRIBUTE_POINTS_PER_LEVEL = 4;
  const BASE_PEV = 20;
  const LEVEL_TWO_PEV_GAIN = 20;
  const LEVEL_THREE_PLUS_PEV_GAIN = 16;
  const REDUCED_PEV_START_LEVEL = 3;


  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function floorHalf(value) {
    return Math.floor(Number(value || 0) / 2);
  }

  function normalizeLookup(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  const COMBAT_STATUS_OPTIONS = ['Vivo', 'Morrendo', 'Morto'];

  function normalizeCombatStatus(value, fallback = 'Vivo') {
    const normalized = normalizeLookup(value).replace(/-/g, ' ');
    if (!normalized) return fallback;
    if (normalized.includes('morto') || normalized.includes('derrotado')) return 'Morto';
    if (normalized.includes('morrendo') || normalized.includes('agonizando')) return 'Morrendo';
    if (
      normalized.includes('vivo')
      || normalized.includes('estavel')
      || normalized.includes('disponivel')
      || normalized.includes('pronto')
      || normalized.includes('em cena')
      || normalized.includes('ativo')
    ) {
      return 'Vivo';
    }
    return fallback;
  }

  function normalizeOptionalCombatStatus(value) {
    return String(value || '').trim()
      ? normalizeCombatStatus(value, 'Vivo')
      : '';
  }

  function sanitizeAttributeKey(attributeKey) {
    return ATTRIBUTES.some((attribute) => attribute.key === attributeKey) ? attributeKey : 'inteligencia';
  }

  function getSkillDefaultAttribute(skillKey) {
    return sanitizeAttributeKey(SKILL_ATTRIBUTE_DEFAULTS[skillKey] || 'inteligencia');
  }

  function createDefaultSkillAttributes() {
    return SKILLS.reduce((accumulator, skill) => {
      accumulator[skill.key] = getSkillDefaultAttribute(skill.key);
      return accumulator;
    }, {});
  }

  function isCompanionForm(entry) {
    const typeLookup = normalizeLookup(entry && entry.type);
    if (!typeLookup) return false;
    return typeLookup.includes('forma') || typeLookup.includes('alien');
  }

  function resolveSkillKeyFromName(value) {
    const lookup = normalizeLookup(value);
    if (!lookup) return '';
    const byKey = SKILLS.find((skill) => skill.key === lookup);
    if (byKey) return byKey.key;
    const byLabel = SKILLS.find((skill) => normalizeLookup(skill.label) === lookup);
    return byLabel ? byLabel.key : '';
  }

  function resolveCompanionSkillAttribute(skill) {
    if (skill && skill.attribute && ATTRIBUTES.some((attribute) => attribute.key === skill.attribute)) {
      return skill.attribute;
    }
    const resolvedKey = resolveSkillKeyFromName(skill && (skill.key || skill.name));
    if (resolvedKey) return getSkillDefaultAttribute(resolvedKey);
    return 'destreza';
  }

  function calculateSkillTotal(skillValue, attributeKey, attributes) {
    const safeKey = sanitizeAttributeKey(attributeKey);
    return Number(skillValue || 0) + floorHalf(attributes && attributes[safeKey]);
  }

  function clampNumber(value, min, max) {
    const numeric = Number(value || 0);
    return Math.min(max, Math.max(min, numeric));
  }

  function createDefaultSkills() {
    return SKILLS.reduce((accumulator, skill) => {
      accumulator[skill.key] = 0;
      return accumulator;
    }, {});
  }

  function hydrateMasterSession(session) {
    const safeSession = session && typeof session === 'object' ? session : {};
    const tags = Array.isArray(safeSession.tags)
      ? [...new Set(safeSession.tags.map((tag) => slugify(tag)).filter(Boolean))].slice(0, 8)
      : [];
    const combatShared = hydrateCombatSharedState(safeSession.combatShared);
    const combatControl = hydrateCombatControlState(safeSession.combatControl);

    return { tags, combatShared, combatControl };
  }

  function hydrateCombatSharedEntry(entry) {
    const safeEntry = entry && typeof entry === 'object' ? entry : {};
    const combatantType = ['enemy', 'character', 'companion'].includes(String(safeEntry.combatantType || ''))
      ? String(safeEntry.combatantType)
      : 'enemy';

    return {
      order: Math.max(1, clampNumber(safeEntry.order, 1, 999)),
      instanceId: String(safeEntry.instanceId || ''),
      combatantType,
      typeLabel: String(safeEntry.typeLabel || ''),
      name: String(safeEntry.name || 'Combatente'),
      subtitle: String(safeEntry.subtitle || ''),
      status: normalizeCombatStatus(safeEntry.status, 'Vivo'),
      initiativeTotal: clampNumber(safeEntry.initiativeTotal, -99, 999),
      sourceCharacterId: String(safeEntry.sourceCharacterId || ''),
      sourceCompanionId: String(safeEntry.sourceCompanionId || ''),
      ownerName: String(safeEntry.ownerName || ''),
      image: String(safeEntry.image || ''),
      pvCurrent: clampNumber(safeEntry.pvCurrent, 0, 9999),
      pvMax: clampNumber(safeEntry.pvMax, 0, 9999),
      armor: clampNumber(safeEntry.armor, 0, 999),
      dodge: clampNumber(safeEntry.dodge, 0, 999),
      block: clampNumber(safeEntry.block, 0, 999),
      isForm: Boolean(safeEntry.isForm),
      isCurrentTurn: Boolean(safeEntry.isCurrentTurn)
    };
  }

  function hydrateCombatSharedState(state) {
    const safeState = state && typeof state === 'object' ? state : {};
    const combatants = Array.isArray(safeState.combatants)
      ? safeState.combatants.map(hydrateCombatSharedEntry)
      : [];

    return {
      active: Boolean(safeState.active && combatants.length),
      round: Math.max(1, clampNumber(safeState.round, 1, 999)),
      currentInstanceId: String(safeState.currentInstanceId || ''),
      updatedAt: String(safeState.updatedAt || ''),
      combatants
    };
  }

  function parseNullableCombatNumber(value, min, max) {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return clampNumber(numeric, min, max);
  }

  function hasCombatControlMemberPayload(member) {
    return Boolean(
      member
      && (
        member.inEncounter !== null
        || member.initiativeTotal !== null
        || member.pvCurrent !== null
        || String(member.status || '').trim()
      )
    );
  }

  function hydrateCombatControlSelf(state) {
    const safeState = state && typeof state === 'object' ? state : {};
    const output = {
      inEncounter: typeof safeState.inEncounter === 'boolean' ? safeState.inEncounter : null,
      initiativeTotal: parseNullableCombatNumber(safeState.initiativeTotal, -99, 999),
      pvCurrent: parseNullableCombatNumber(safeState.pvCurrent, 0, 9999),
      status: normalizeOptionalCombatStatus(String(safeState.status || '').trim().slice(0, 80))
    };

    return hasCombatControlMemberPayload(output) ? output : null;
  }

  function hydrateCombatControlCompanion(state) {
    const safeState = state && typeof state === 'object' ? state : {};
    const output = {
      companionId: String(safeState.companionId || ''),
      inEncounter: typeof safeState.inEncounter === 'boolean' ? safeState.inEncounter : null,
      initiativeTotal: parseNullableCombatNumber(safeState.initiativeTotal, -99, 999),
      pvCurrent: parseNullableCombatNumber(safeState.pvCurrent, 0, 9999),
      status: normalizeOptionalCombatStatus(String(safeState.status || '').trim().slice(0, 80))
    };

    if (!output.companionId) return null;
    return hasCombatControlMemberPayload(output) ? output : null;
  }

  function hydrateCombatControlState(state) {
    const safeState = state && typeof state === 'object' ? state : {};
    const self = hydrateCombatControlSelf(safeState.self);
    const companions = Array.isArray(safeState.companions)
      ? safeState.companions
        .map(hydrateCombatControlCompanion)
        .filter(Boolean)
      : [];

    return {
      requestId: String(safeState.requestId || ''),
      updatedAt: String(safeState.updatedAt || ''),
      self,
      companions
    };
  }

  function createEmptyCharacter(overrides = {}) {
    return {
      id: overrides.id || slugify(overrides.name || `personagem-${Date.now()}`),
      ownerUsername: overrides.ownerUsername || '',
      identity: {
        name: overrides.name || 'Novo Personagem',
        age: overrides.age || '',
        className: overrides.className || 'Especialista',
        level: overrides.level || 1,
        concept: overrides.concept || '',
        manifestationOrigin: overrides.manifestationOrigin || 'Nenhuma',
        links: overrides.links || '',
        summary: overrides.summary || '',
        appearance: overrides.appearance || '',
        image: overrides.image || ''
      },
      attributes: {
        forca: 0,
        destreza: 0,
        sentidos: 0,
        vigor: 0,
        inteligencia: 0,
        nexo: 0,
        ...(overrides.attributes || {})
      },
      resources: {
        pvCurrent: null,
        peCurrent: null,
        pdCurrent: null,
        instability: 0,
        armorBonus: 0,
        armorEquipment: '',
        blockMode: 'vigor',
        status: normalizeCombatStatus(overrides.status, 'Vivo')
      },
      progression: {
        extraPeV: 0,
        manualPeVSpent: 0,
        facetaUnlocks: 0,
        facetaStabilizations: 0,
        notes: ''
      },
      skills: createDefaultSkills(),
      skillAttributes: createDefaultSkillAttributes(),
      aptitudes: [],
      manifestation: {
        name: '',
        origin: '',
        state: 'Parcial',
        glitches: '',
        activeEffects: ''
      },
      facets: [],
      companions: [],
      equipment: {
        primaryWeapon: '',
        secondaryWeapon: '',
        items: ''
      },
      notes: overrides.notes || '',
      masterSession: hydrateMasterSession(overrides.masterSession),
      masterNotes: overrides.masterNotes || ''
    };
  }

  function deepMerge(base, incoming) {
    if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : base;
    if (typeof base !== 'object' || base === null) return incoming === undefined ? base : incoming;
    const output = { ...base };
    Object.keys(base).forEach((key) => {
      output[key] = deepMerge(base[key], incoming ? incoming[key] : undefined);
    });
    if (incoming && typeof incoming === 'object') {
      Object.keys(incoming).forEach((key) => {
        if (!(key in output)) output[key] = incoming[key];
      });
    }
    return output;
  }

  function hydrateCharacter(rawCharacter) {
    const merged = deepMerge(createEmptyCharacter(rawCharacter || {}), rawCharacter || {});
    const attributeLimit = getAttributeLimit(merged.identity.level);
    ATTRIBUTES.forEach((attribute) => {
      merged.attributes[attribute.key] = clampNumber(merged.attributes[attribute.key], 0, attributeLimit);
    });

    const skillLimit = getSkillLimit(merged.identity.level);
    SKILLS.forEach((skill) => {
      merged.skills[skill.key] = clampNumber(merged.skills[skill.key], 0, skillLimit);
    });

    merged.skillAttributes = { ...createDefaultSkillAttributes(), ...(merged.skillAttributes || {}) };
    SKILLS.forEach((skill) => {
      merged.skillAttributes[skill.key] = sanitizeAttributeKey(merged.skillAttributes[skill.key]);
    });

    merged.aptitudes = Array.isArray(merged.aptitudes) ? merged.aptitudes.map(hydrateAptitudeEntry) : [];
    merged.companions = Array.isArray(merged.companions) ? merged.companions.map(hydrateCompanionEntry) : [];
    merged.facets = hydrateFacetEntries(merged.facets, merged.mastery);
    merged.masterSession = hydrateMasterSession(merged.masterSession);
    delete merged.mastery;

    const derived = calculateDerived(merged);
    if (merged.resources.pvCurrent === null || merged.resources.pvCurrent === undefined || Number.isNaN(Number(merged.resources.pvCurrent))) merged.resources.pvCurrent = derived.maxPv;
    if (merged.resources.peCurrent === null || merged.resources.peCurrent === undefined || Number.isNaN(Number(merged.resources.peCurrent))) merged.resources.peCurrent = derived.maxPe;
    if (merged.resources.pdCurrent === null || merged.resources.pdCurrent === undefined || Number.isNaN(Number(merged.resources.pdCurrent))) merged.resources.pdCurrent = derived.maxPd;

    merged.resources.pvCurrent = clampNumber(merged.resources.pvCurrent, 0, derived.maxPv);
    merged.resources.peCurrent = clampNumber(merged.resources.peCurrent, 0, derived.maxPe);
    merged.resources.pdCurrent = clampNumber(merged.resources.pdCurrent, 0, derived.maxPd);
    merged.resources.instability = clampNumber(merged.resources.instability, 0, 6);
    merged.resources.armorBonus = clampNumber(merged.resources.armorBonus, 0, 99);
    merged.resources.status = normalizeCombatStatus(merged.resources.status, 'Vivo');
    return merged;
  }

  function getClassConfig(className) {
    return CLASS_CONFIG[className] || CLASS_CONFIG.Especialista;
  }

  function getAttributeLimit(level) {
    return Math.max(4, Number(level || 1) + 4);
  }

  function getSkillLimit(level) {
    return Math.max(2, Number(level || 1) + 1);
  }

  function createCompanionSkillEntry(overrides) {
    return {
      name: '',
      value: 0,
      attribute: 'destreza',
      _draft: false,
      ...(overrides || {})
    };
  }

  function createCompanionFacetEntry(overrides) {
    return {
      name: '',
      rank: 1,
      xp: 0,
      _draft: false,
      ...(overrides || {})
    };
  }

  function hasCompanionSkillContent(skill) {
    if (!skill) return false;
    return Boolean(
      skill._draft ||
      String(skill.name || '').trim() ||
      Number(skill.value || 0) > 0 ||
      resolveCompanionSkillAttribute(skill) !== 'destreza'
    );
  }

  function hasCompanionFacetContent(facet) {
    if (!facet) return false;
    return Boolean(
      facet._draft ||
      String(facet.name || '').trim() ||
      Number(facet.rank || 1) > 1 ||
      Number(facet.xp || 0) > 0
    );
  }

  function trimTrailingCompanionEntries(entries, hasContent) {
    const safeEntries = Array.isArray(entries) ? entries.slice() : [];
    let lastFilledIndex = -1;
    safeEntries.forEach((entry, index) => {
      if (hasContent(entry)) lastFilledIndex = index;
    });
    return lastFilledIndex >= 0 ? safeEntries.slice(0, lastFilledIndex + 1) : [];
  }

  function createCompanionSkills() {
    return [];
  }

  function createCompanionFacets() {
    return [];
  }

  function hydrateCompanionEntry(entry) {
    const legacyNotes = [entry && entry.role, entry && entry.attack, entry && entry.traits, entry && entry.notes]
      .filter(Boolean)
      .join(' • ');

    const normalized = {
      id: entry && entry.id ? entry.id : `cmp-${Math.random().toString(36).slice(2, 10)}`,
      name: '',
      type: '',
      image: '',
      pvCurrent: 0,
      pvMax: 0,
      armor: 0,
      status: '',
      notes: legacyNotes,
      attributes: {
        forca: 0,
        destreza: 0,
        sentidos: 0,
        vigor: 0,
        inteligencia: 0,
        nexo: 0
      },
      skills: createCompanionSkills(),
      facets: createCompanionFacets(),
      ...(entry || {})
    };

    normalized.attributes = {
      forca: 0,
      destreza: 0,
      sentidos: 0,
      vigor: 0,
      inteligencia: 0,
      nexo: 0,
      ...((entry && entry.attributes) || {})
    };

    normalized.skills = Array.isArray(entry && entry.skills)
      ? trimTrailingCompanionEntries((entry.skills || []).map((skill) => createCompanionSkillEntry(skill)), hasCompanionSkillContent)
      : createCompanionSkills();

    normalized.facets = Array.isArray(entry && entry.facets)
      ? trimTrailingCompanionEntries((entry.facets || []).map((facet) => createCompanionFacetEntry(facet)), hasCompanionFacetContent)
      : createCompanionFacets();

    ['forca', 'destreza', 'sentidos', 'vigor', 'inteligencia', 'nexo'].forEach((key) => {
      normalized.attributes[key] = clampNumber(normalized.attributes[key], 0, 99);
    });
    normalized.pvMax = clampNumber(normalized.pvMax, 0, 9999);
    normalized.pvCurrent = clampNumber(normalized.pvCurrent, 0, normalized.pvMax || 9999);
    normalized.armor = clampNumber(normalized.armor, 0, 99);
    normalized.skills = normalized.skills.map((skill) => ({
      name: String(skill.name || ''),
      value: clampNumber(skill.value, 0, 99),
      attribute: resolveCompanionSkillAttribute(skill),
      ...(skill._draft ? { _draft: true } : {})
    }));
    normalized.facets = normalized.facets.map((facet) => ({
      name: String(facet.name || ''),
      rank: clampNumber(facet.rank, 1, 10),
      xp: clampNumber(facet.xp, 0, 999),
      ...(facet._draft ? { _draft: true } : {})
    }));
    normalized.status = normalizeCombatStatus(normalized.status, 'Vivo');

    return normalized;
  }

  function createCompanion(overrides) {
    return hydrateCompanionEntry({
      id: overrides && overrides.id ? overrides.id : `cmp-${Math.random().toString(36).slice(2, 10)}`,
      ...(overrides || {})
    });
  }

  function normalizeCompanion(entry) {
    return hydrateCompanionEntry(entry);
  }

  function getCompanionSkillTotal(entry, skill) {
    return calculateSkillTotal(skill && skill.value, skill && skill.attribute, (entry && entry.attributes) || {});
  }


  function createEmptyFacetEntry() {
    return { name: '', rank: 1, xp: 0, notes: '', _draft: false };
  }

  function hydrateFacetEntries(facets, mastery) {
    const safeFacets = Array.isArray(facets) ? facets : [];
    const safeMastery = Array.isArray(mastery) ? mastery : [];
    const maxLength = Math.max(safeFacets.length, safeMastery.length, 0);
    const combined = [];
    for (let index = 0; index < maxLength; index += 1) {
      const facetEntry = safeFacets[index] || {};
      const masteryEntry = safeMastery[index] || {};
      const merged = {
        ...createEmptyFacetEntry(),
        ...facetEntry,
        name: facetEntry.name || masteryEntry.facet || '',
        rank: masteryEntry.rank !== undefined ? masteryEntry.rank : facetEntry.rank,
        xp: masteryEntry.xp !== undefined ? masteryEntry.xp : facetEntry.xp,
        notes: facetEntry.notes || ''
      };
      if (!merged._draft && !merged.name && !merged.notes && Number(merged.rank || 1) === 1 && Number(merged.xp || 0) === 0) continue;
      combined.push({
        name: String(merged.name || ''),
        rank: clampNumber(merged.rank, 1, 10),
        xp: clampNumber(merged.xp, 0, 999),
        notes: String(merged.notes || ''),
        _draft: Boolean(merged._draft)
      });
    }
    return combined;
  }

  function getGrantedAttributePoints(level) {
    return ATTRIBUTE_POINTS_BASE + Math.max(0, Number(level || 1) - 1) * ATTRIBUTE_POINTS_PER_LEVEL;
  }

  function getBasePeVGranted(level) {
    const safeLevel = Math.max(1, Number(level || 1));
    let total = BASE_PEV;

    for (let currentLevel = 2; currentLevel <= safeLevel; currentLevel += 1) {
      total += currentLevel >= REDUCED_PEV_START_LEVEL
        ? LEVEL_THREE_PLUS_PEV_GAIN
        : LEVEL_TWO_PEV_GAIN;
    }

    return total;
  }

  function getGrantedPeV(level, extraPeV) {
    return getBasePeVGranted(level) + Number(extraPeV || 0);
  }

  function getAptitudeEffectOptions(catalogId) {
    return APTITUDE_EFFECT_OPTIONS[catalogId] || [];
  }

  function getAptitudeAutoConfig(catalogId) {
    return APTITUDE_AUTO_EFFECTS[catalogId] || null;
  }

  function calculateAptitudeBonuses(character) {
    const bonuses = {
      maxPvBonus: 0,
      maxPeBonus: 0,
      maxPdBonus: 0,
      armorBonus: 0,
      initiativeBonus: 0,
      blockBonus: 0,
      skillBonuses: {}
    };

    let hasGuardII = false;
    let hasGuardI = false;

    (character.aptitudes || []).forEach((entry) => {
      if (!entry || !entry.catalogId) return;
      const config = getAptitudeAutoConfig(entry.catalogId);
      if (!config) return;

      bonuses.maxPvBonus += Number(config.maxPvBonus || 0);
      bonuses.maxPeBonus += Number(config.maxPeBonus || 0);
      bonuses.maxPdBonus += Number(config.maxPdBonus || 0);
      bonuses.armorBonus += Number(config.armorBonus || 0);
      bonuses.initiativeBonus += Number(config.initiativeBonus || 0);

      if (entry.catalogId === 'guarda-fechada') hasGuardI = true;
      if (entry.catalogId === 'guarda-fechada-ii') hasGuardII = true;

      Object.entries(config.skillBonuses || {}).forEach(([skillKey, bonus]) => {
        bonuses.skillBonuses[skillKey] = Number(bonuses.skillBonuses[skillKey] || 0) + Number(bonus || 0);
      });

      if (config.chosenSkillBonus) {
        const effectKey = entry[config.optionKey || 'effectChoice'] || config.defaultOption;
        if (effectKey) {
          bonuses.skillBonuses[effectKey] = Number(bonuses.skillBonuses[effectKey] || 0) + Number(config.chosenSkillBonus || 0);
        }
      }
    });

    bonuses.blockBonus = hasGuardII ? 4 : (hasGuardI ? 2 : 0);
    return bonuses;
  }

  function getSkillFixedBonus(character, skillKey) {
    const bonuses = calculateAptitudeBonuses(character);
    return Number(bonuses.skillBonuses[skillKey] || 0);
  }

  function calculateResourceMax(identity, attributes, resources, aptitudeBonuses) {
    const classConfig = getClassConfig(identity.className);
    const level = Number(identity.level || 1);
    const vigor = Number(attributes.vigor || 0);
    const nexo = Number(attributes.nexo || 0);
    const inteligencia = Number(attributes.inteligencia || 0);
    const bonuses = aptitudeBonuses || { maxPvBonus: 0, maxPeBonus: 0, maxPdBonus: 0, armorBonus: 0 };

    const growthLevels = Math.max(0, level - 1);
    const pvBase = classConfig.pvBase;
    const pvFromLevel = growthLevels * classConfig.pvGrowth;
    const pvFromVigor = vigor * 3;
    const pvFromAptitudes = Number(bonuses.maxPvBonus || 0);

    const peBase = classConfig.peBase;
    const peFromLevel = growthLevels * classConfig.peGrowth;
    const peFromNexo = nexo * 3;
    const peFromAptitudes = Number(bonuses.maxPeBonus || 0);

    const pdBase = classConfig.pdBase;
    const pdFromLevel = growthLevels * classConfig.pdGrowth;
    const pdFromIntelligence = inteligencia * 2;
    const pdFromAptitudes = Number(bonuses.maxPdBonus || 0);

    return {
      maxPv: pvBase + pvFromLevel + pvFromVigor + pvFromAptitudes,
      maxPe: peBase + peFromLevel + peFromNexo + peFromAptitudes,
      maxPd: pdBase + pdFromLevel + pdFromIntelligence + pdFromAptitudes,
      armor: classConfig.armorBase + Number(resources.armorBonus || 0) + Number(bonuses.armorBonus || 0),
      breakdown: {
        pv: { base: pvBase, level: pvFromLevel, attribute: pvFromVigor, aptitudes: pvFromAptitudes, attributeName: 'Vigor', attributeMultiplier: 3 },
        pe: { base: peBase, level: peFromLevel, attribute: peFromNexo, aptitudes: peFromAptitudes, attributeName: 'Nexo', attributeMultiplier: 3 },
        pd: { base: pdBase, level: pdFromLevel, attribute: pdFromIntelligence, aptitudes: pdFromAptitudes, attributeName: 'Inteligência', attributeMultiplier: 2 }
      }
    };
  }

  function getAptitudeCostByTier(tier) {
    return APTITUDE_COSTS[tier] || 0;
  }

  function getAptitudeById(id) {
    return APTITUDE_CATALOG.find((entry) => entry.id === id) || null;
  }

  function hydrateAptitudeEntry(entry = {}) {
    const catalog = entry.catalogId ? getAptitudeById(entry.catalogId) : null;
    const options = getAptitudeEffectOptions(entry.catalogId);
    return {
      id: entry.id || `apt-${Math.random().toString(36).slice(2, 10)}`,
      catalogId: entry.catalogId || '',
      customName: entry.customName || '',
      tier: entry.tier || (catalog ? catalog.tier : 'Básica'),
      notes: entry.notes || '',
      effectChoice: entry.effectChoice || (options[0] ? options[0].value : '')
    };
  }

  function resolveAptitudeLabel(entry) {
    const catalog = entry.catalogId ? getAptitudeById(entry.catalogId) : null;
    return catalog ? catalog.name : (entry.customName || 'Aptidão personalizada');
  }

  function calculatePeVSpent(character) {
    const skillsSpent = SKILLS.reduce((sum, skill) => sum + Number(character.skills[skill.key] || 0), 0);
    const aptitudeSpent = character.aptitudes.reduce((sum, entry) => sum + getAptitudeCostByTier(entry.tier), 0);
    const manifestationSpent = Number(character.progression.facetaUnlocks || 0) * 6 + Number(character.progression.facetaStabilizations || 0) * 4;
    const manualSpent = Number(character.progression.manualPeVSpent || 0);

    return {
      skillsSpent,
      aptitudeSpent,
      manifestationSpent,
      manualSpent,
      total: skillsSpent + aptitudeSpent + manifestationSpent + manualSpent
    };
  }

  function calculateDerived(character) {
    const identity = character.identity;
    const attributes = character.attributes;
    const skills = character.skills;
    const resources = character.resources;
    const aptitudeBonuses = calculateAptitudeBonuses(character);
    const resourceMax = calculateResourceMax(identity, attributes, resources, aptitudeBonuses);
    const peVSpent = calculatePeVSpent(character);
    const attributePointsSpent = ATTRIBUTES.reduce((sum, attribute) => sum + Number(attributes[attribute.key] || 0), 0);
    const attributePointsGranted = getGrantedAttributePoints(identity.level);
    const peVGranted = getGrantedPeV(identity.level, character.progression.extraPeV);

    const reflexosTotal = Number(skills.reflexos || 0) + Number(aptitudeBonuses.skillBonuses.reflexos || 0);
    const iniciativaTotal = Number(skills.iniciativa || 0) + Number(aptitudeBonuses.skillBonuses.iniciativa || 0);
    const manifestacaoTotal = Number(skills.manifestacao || 0) + Number(aptitudeBonuses.skillBonuses.manifestacao || 0);
    const fortitudeTotal = Number(skills.fortitude || 0) + Number(aptitudeBonuses.skillBonuses.fortitude || 0);

    const esquivaMod = reflexosTotal + floorHalf(attributes.destreza);
    const initiativeMod = iniciativaTotal + floorHalf(attributes.destreza) + Number(aptitudeBonuses.initiativeBonus || 0);
    const manifestationMod = manifestacaoTotal + floorHalf(attributes.nexo);
    const blockForce = 10 + fortitudeTotal + floorHalf(attributes.forca) + Number(aptitudeBonuses.blockBonus || 0);
    const blockVigor = 10 + fortitudeTotal + floorHalf(attributes.vigor) + Number(aptitudeBonuses.blockBonus || 0);
    const selectedBlock = resources.blockMode === 'forca' ? blockForce : blockVigor;

    return {
      ...resourceMax,
      classConfig: getClassConfig(identity.className),
      aptitudeBonuses,
      esquivaMod,
      blockForce,
      blockVigor,
      selectedBlock,
      initiativeMod,
      manifestationMod,
      attributePointsSpent,
      attributePointsGranted,
      attributePointsAvailable: attributePointsGranted - attributePointsSpent,
      attributeLimit: getAttributeLimit(identity.level),
      skillLimit: getSkillLimit(identity.level),
      peVGranted,
      peVSpent,
      peVAvailable: peVGranted - peVSpent.total,
      aptitudeCount: character.aptitudes.length
    };
  }

  window.AppSystem = {
    SKILLS,
    ATTRIBUTES,
    CLASS_CONFIG,
    APTITUDE_COSTS,
    APTITUDE_CATALOG,
      createEmptyCharacter,
      hydrateCharacter,
      hydrateMasterSession,
      hydrateCombatSharedState,
      hydrateCombatControlState,
      getCombatStatusOptions: () => COMBAT_STATUS_OPTIONS.slice(),
      normalizeCombatStatus,
      hydrateCompanionEntry,
    hydrateAptitudeEntry,
    resolveAptitudeLabel,
    getClassConfig,
    getAttributeLimit,
    getSkillLimit,
    getGrantedAttributePoints,
    getBasePeVGranted,
    getGrantedPeV,
    calculateResourceMax,
    calculatePeVSpent,
    calculateDerived,
    getAptitudeById,
    getAptitudeCostByTier,
    getAptitudeEffectOptions,
    getAptitudeAutoConfig,
    calculateAptitudeBonuses,
    getSkillFixedBonus,
    createCompanion,
    normalizeCompanion,
    createCompanionSkillEntry,
    createCompanionFacetEntry,
    hasCompanionSkillContent,
    hasCompanionFacetContent,
    isCompanionForm,
    getCompanionSkillTotal,
    getSkillDefaultAttribute,
    createDefaultSkillAttributes,
    calculateSkillTotal,
    sanitizeAttributeKey,
    floorHalf,
    slugify
  };
})();

(function () {
  let socketBound = false;
  let lastState = null;
  let requestStatePromise = null;
  let requestStateStartedAt = 0;
  const stateListeners = new Set();
  const requestListeners = new Set();

  function getEmptyState() {
    return {
      active: false,
      round: 1,
      currentInstanceId: '',
      updatedAt: '',
      combatants: []
    };
  }

  function hydrateState(state) {
    if (window.AppSystem && typeof window.AppSystem.hydrateCombatSharedState === 'function') {
      return window.AppSystem.hydrateCombatSharedState(state);
    }

    return state || getEmptyState();
  }

  function getTimestamp(state) {
    const parsed = Date.parse(String(state?.updatedAt || ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function shouldReplaceState(nextState) {
    if (!lastState) return true;
    const nextTimestamp = getTimestamp(nextState);
    const currentTimestamp = getTimestamp(lastState);

    if (nextTimestamp > currentTimestamp) return true;
    if (nextTimestamp < currentTimestamp) return false;
    return JSON.stringify(nextState) !== JSON.stringify(lastState);
  }

  function notifyState(state, meta = {}) {
    const safeState = hydrateState(state);

    if (shouldReplaceState(safeState)) {
      lastState = safeState;
    } else {
      return lastState;
    }

    stateListeners.forEach((listener) => {
      try {
        listener(lastState, meta);
      } catch (error) {
        console.error(error);
      }
    });

    return lastState;
  }

  function ensureChannel() {
    if (socketBound || !window.AppApi?.onSocket) return socketBound;

    window.AppApi.onSocket('combat:state', (payload) => {
      const incomingState = payload?.state || payload;
      notifyState(incomingState, { source: 'socket', payload });
    });

    socketBound = true;
    return socketBound;
  }

  function subscribeState(listener) {
    if (typeof listener !== 'function') return function () {};
    stateListeners.add(listener);
    ensureChannel();

    if (lastState) {
      try {
        listener(lastState, { source: 'seed' });
      } catch (error) {
        console.error(error);
      }
    }

    return function () {
      stateListeners.delete(listener);
    };
  }

  function onRequest(listener) {
    if (typeof listener !== 'function') return function () {};
    requestListeners.add(listener);
    return function () {
      requestListeners.delete(listener);
    };
  }

  function seedState(state, meta = {}) {
    const safeState = hydrateState(state);
    notifyState(safeState, { source: 'seed', ...meta });
    return safeState;
  }

  async function broadcastState(state, meta = {}) {
    const safeState = hydrateState(state);
    notifyState(safeState, { source: 'local', meta });

    if (!window.AppApi?.putCombatState) {
      return lastState || safeState;
    }

    try {
      const response = await window.AppApi.putCombatState(safeState, meta);
      const persistedState = hydrateState(response?.state || response || safeState);
      notifyState(persistedState, { source: 'api', meta, response });
      return persistedState;
    } catch (error) {
      console.error(error);
      return lastState || safeState;
    }
  }

  async function requestState(meta = {}) {
    ensureChannel();

    if (window.AppApi?.emitSocket) {
      window.AppApi.emitSocket('combat:request-sync', {
        ...meta,
        sentAt: new Date().toISOString()
      });
    }

    if (!window.AppApi?.getCombatState) {
      return lastState || getEmptyState();
    }

    if (requestStatePromise && Date.now() - requestStateStartedAt < 4500) {
      return requestStatePromise;
    }

    requestStateStartedAt = Date.now();
    requestStatePromise = (async () => {
      try {
        const response = await window.AppApi.getCombatState();
        const remoteState = hydrateState(response?.state || response || null);
        notifyState(remoteState, { source: 'request', meta, response });
        requestListeners.forEach((listener) => {
          try {
            listener(meta);
          } catch (error) {
            console.error(error);
          }
        });
        return remoteState;
      } catch (error) {
        console.error(error);
        return lastState || getEmptyState();
      } finally {
        requestStatePromise = null;
        requestStateStartedAt = 0;
      }
    })();

    return requestStatePromise;
  }

  window.AppCombatState = {
    ensureChannel,
    subscribeState,
    onRequest,
    broadcastState,
    requestState,
    seedState
  };
})();
