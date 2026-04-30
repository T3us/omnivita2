import type { CharacterSheet, CombatState, CompanionSheet } from '../api/types';

export const ATTRIBUTES = [
  { key: 'forca', label: 'Forca' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'sentidos', label: 'Sentidos' },
  { key: 'vigor', label: 'Vigor' },
  { key: 'inteligencia', label: 'Inteligencia' },
  { key: 'nexo', label: 'Nexo' }
] as const;

export const SKILLS = [
  'acrobacia',
  'adestramento',
  'artes',
  'atletismo',
  'atualidades',
  'ciencias',
  'crime',
  'diplomacia',
  'enganacao',
  'fortitude',
  'furtividade',
  'iniciativa',
  'intimidacao',
  'intuicao',
  'investigacao',
  'luta',
  'manifestacao',
  'medicina',
  'percepcao',
  'pilotagem',
  'pontaria',
  'profissao',
  'reflexos',
  'sobrevivencia',
  'tecnologia',
  'vontade'
] as const;

export const SKILL_LABELS: Record<string, string> = {
  acrobacia: 'Acrobacia',
  adestramento: 'Adestramento',
  artes: 'Artes',
  atletismo: 'Atletismo',
  atualidades: 'Atualidades',
  ciencias: 'Ciencias',
  crime: 'Crime',
  diplomacia: 'Diplomacia',
  enganacao: 'Enganacao',
  fortitude: 'Fortitude',
  furtividade: 'Furtividade',
  iniciativa: 'Iniciativa',
  intimidacao: 'Intimidacao',
  intuicao: 'Intuicao',
  investigacao: 'Investigacao',
  luta: 'Luta',
  manifestacao: 'Manifestacao',
  medicina: 'Medicina',
  percepcao: 'Percepcao',
  pilotagem: 'Pilotagem',
  pontaria: 'Pontaria',
  profissao: 'Profissao',
  reflexos: 'Reflexos',
  sobrevivencia: 'Sobrevivencia',
  tecnologia: 'Tecnologia',
  vontade: 'Vontade'
};

export const SKILL_ATTRIBUTE_DEFAULTS: Record<string, string> = {
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

export const APTITUDE_TIERS = ['Basica', 'Treinada', 'Avancada', 'Excepcional'] as const;

export const APTITUDE_CATALOG = [
  { id: 'sangue-frio', name: 'Sangue Frio', tier: 'Basica', group: 'Geral', prerequisites: 'Vontade 2', summary: '+2 Iniciativa e +2 no primeiro teste de Vontade da cena contra pressao.' },
  { id: 'instinto-firme', name: 'Instinto Firme', tier: 'Basica', group: 'Geral', prerequisites: 'Reflexos 2, Vontade 2', summary: '+2 Reflexos contra surpresa, emboscada e ataque de alvo que ainda nao agiu na cena.' },
  { id: 'atencao-partida', name: 'Atencao Partida', tier: 'Basica', group: 'Geral', prerequisites: 'Percepcao 2, Intuicao 2', summary: '+2 Percepcao e +2 Intuicao.' },
  { id: 'olho-clinico', name: 'Olho Clinico', tier: 'Basica', group: 'Geral', prerequisites: 'Investigacao 2 ou Medicina 2', summary: '+2 para analisar corpos, residuos, ferimentos e cenas.' },
  { id: 'leitura-de-ambiente', name: 'Leitura de Ambiente', tier: 'Basica', group: 'Geral', prerequisites: 'Percepcao 2, Sentidos 2', summary: '+2 Defesa no primeiro turno e ignora penalidade leve de terreno/cobertura.' },
  { id: 'pulso-firme', name: 'Pulso Firme', tier: 'Basica', group: 'Geral', prerequisites: 'Destreza 2', summary: '+2 em Pontaria, Tecnologia ou Medicina sob risco imediato.' },
  { id: 'improviso', name: 'Improviso', tier: 'Basica', group: 'Geral', prerequisites: 'Inteligencia 2', summary: '1x/cena, +2 em pericia 1 ou menos; +3 se resolver com recurso inadequado.' },
  { id: 'tecnica-repetida', name: 'Tecnica Repetida', tier: 'Basica', group: 'Geral', prerequisites: 'Qualquer pericia 2', summary: 'Escolha 1 pericia 2+: 1x/cena, +2 nela.' },
  { id: 'folego-extra', name: 'Folego Extra', tier: 'Basica', group: 'Geral', prerequisites: 'Vigor 3', summary: '+5 PV maximo.' },
  { id: 'reserva-mental', name: 'Reserva Mental', tier: 'Basica', group: 'Geral', prerequisites: 'Inteligencia 3 ou Vontade 3', summary: '+5 PD maximo.' },
  { id: 'reserva-tecnica', name: 'Reserva Tecnica', tier: 'Basica', group: 'Geral', prerequisites: 'Nexo 3', summary: '+4 PE maximo.' },
  { id: 'rastro-invisivel', name: 'Rastro Invisivel', tier: 'Basica', group: 'Geral', prerequisites: 'Furtividade 2, Sentidos 2', summary: '+2 Furtividade em ambiente urbano; +4 no primeiro teste saindo de cobertura/sombra.' },
  { id: 'cara-comum', name: 'Cara Comum', tier: 'Basica', group: 'Geral', prerequisites: 'Enganacao 2 ou Furtividade 2', summary: '+2 para se misturar e evitar atencao.' },
  { id: 'leitura-de-gente', name: 'Leitura de Gente', tier: 'Basica', group: 'Geral', prerequisites: 'Intuicao 2', summary: '+2 Intuicao; +3 se o alvo estiver mentindo sob pressao.' },
  { id: 'presenca-dificil', name: 'Presenca Dificil', tier: 'Treinada', group: 'Geral', prerequisites: 'Intimidacao 4 ou Vontade 4', summary: 'Escolha Intimidacao ou Vontade: +3 e pode impor hesitacao curta.' },
  { id: 'corpo-e-alma', name: 'Corpo e Alma', tier: 'Treinada', group: 'Geral', prerequisites: 'Vontade 4', summary: '+2 Vontade e +2 Fortitude.' },
  { id: 'corpo-ajustado', name: 'Corpo Ajustado', tier: 'Treinada', group: 'Geral', prerequisites: 'Destreza 4 ou Vigor 4', summary: '+2 Acrobacia, Atletismo e Reflexos em ambiente que ja conhece ou onde ja lutou antes.' },
  { id: 'rede-de-contatos', name: 'Rede de Contatos', tier: 'Treinada', group: 'Geral', prerequisites: 'Diplomacia 4, Atualidades 3', summary: '1x/sessao, declara um contato plausivel; +2 para favores menores.' },
  { id: 'mente-blindada', name: 'Mente Blindada', tier: 'Treinada', group: 'Geral', prerequisites: 'Vontade 5', summary: 'Reduz dano em PD em 2 e ignora a primeira condicao mental leve.' },
  { id: 'casca-dura', name: 'Casca Dura', tier: 'Treinada', group: 'Geral', prerequisites: 'Vigor 5', summary: '+1 Armadura e +2 Fortitude contra dor, exaustao e trauma.' },
  { id: 'reflexo-de-sobrevivencia', name: 'Reflexo de Sobrevivencia', tier: 'Treinada', group: 'Geral', prerequisites: 'Vigor 5, Fortitude 4', summary: '1x/cena, reduz pela metade o dano que levaria a 0 PV.' },
  { id: 'ouvido-de-rua', name: 'Ouvido de Rua', tier: 'Treinada', group: 'Geral', prerequisites: 'Atualidades 4 ou Investigacao 4', summary: '+2 em coleta de informacao urbana; critico da rumor verdadeiro ou direcao util.' },
  { id: 'pressao-certa', name: 'Pressao Certa', tier: 'Treinada', group: 'Geral', prerequisites: 'Intuicao 4 e Diplomacia 3 ou Intimidacao 3', summary: '1x/cena, antes de teste social sob pressao. Em sucesso, escolha: informacao curta, manter conversa aberta ou -2 no proximo teste social do alvo.' },
  { id: 'boca-fechada', name: 'Boca Fechada', tier: 'Treinada', group: 'Geral', prerequisites: 'Vontade 4, Enganacao 3 ou Diplomacia 3', summary: '+3 para resistir a interrogatorio, coacao ou chantagem.' },
  { id: 'documento-vivo', name: 'Documento Vivo', tier: 'Treinada', group: 'Geral', prerequisites: 'Atualidades 4 e Tecnologia 3 ou Crime 3', summary: '+2 em burocracia, sistemas, cadastro e documentos.' },
  { id: 'investigador-obstinado', name: 'Investigador Obstinado', tier: 'Avancada', group: 'Geral', prerequisites: 'Nivel 5, Investigacao 5, Vontade 5', summary: '1x/cena, rerrola Investigacao com -2; se falhar, ganha pista parcial.' },
  { id: 'memoria-tecnica-geral', name: 'Memoria Tecnica', tier: 'Avancada', group: 'Geral', prerequisites: 'Nivel 5, Inteligencia 6, Ciencias 4 ou Tecnologia 4', summary: '1x/cena, lembra detalhe tecnico ou logistico util.' },
  { id: 'arquivo-pessoal', name: 'Arquivo Pessoal', tier: 'Avancada', group: 'Geral', prerequisites: 'Nivel 5, Atualidades 5, Investigacao 5', summary: '1x/sessao, pede elo plausivel entre pistas, nomes ou lugares.' },
  { id: 'espirito-de-ferro', name: 'Espirito de Ferro', tier: 'Avancada', group: 'Geral', prerequisites: 'Nivel 6, Vontade 6, Inteligencia 5', summary: 'Dano em PD reduz 3; 1x/cena ignora medo ou desorientacao leve.' },
  { id: 'ossos-de-concreto', name: 'Ossos de Concreto', tier: 'Avancada', group: 'Geral', prerequisites: 'Nivel 6, Vigor 7, Fortitude 5', summary: '+1 Armadura extra e reduz dano fisico nao critico em 2.' },
  { id: 'instinto-terminal', name: 'Instinto Terminal', tier: 'Excepcional', group: 'Geral', prerequisites: 'Nivel 8, Vigor 8, Fortitude 6, Vontade 5', summary: '1x/sessao, em vez de cair a 0 PV, fica com 1 PV.' },
  { id: 'presenca-inquebravel', name: 'Presenca Inquebravel', tier: 'Excepcional', group: 'Geral', prerequisites: 'Nivel 8, Vontade 8, Intimidacao 5', summary: '+4 Intimidacao e +2 contra coercao e efeitos mentais.' },
  { id: 'canalizacao-eficiente', name: 'Canalizacao Eficiente', tier: 'Basica', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 2', summary: 'Escolha 1 Faceta: -1 PE, minimo 1.' },
  { id: 'controle-de-glitch', name: 'Controle de Glitch', tier: 'Basica', group: 'Alterado', prerequisites: 'Alterado; Vontade 2', summary: '1x/cena, anula Glitch Menor.' },
  { id: 'leitura-anomala', name: 'Leitura Anomala', tier: 'Basica', group: 'Alterado', prerequisites: 'Alterado; Ciencias 2 ou Investigacao 2', summary: '+2 ao analisar artefatos, mutacoes, residuo ou tecnologia viva.' },
  { id: 'carga-ofensiva', name: 'Carga Ofensiva', tier: 'Basica', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 2, Nexo 3', summary: 'Facetas que causem dano direto recebem +2 no dano.' },
  { id: 'foco-de-nucleo', name: 'Foco de Nucleo', tier: 'Basica', group: 'Alterado', prerequisites: 'Alterado; Nexo 3, Vontade 2', summary: '+2 no primeiro teste de Manifestacao da cena.' },
  { id: 'assinatura-oculta', name: 'Assinatura Oculta', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Furtividade 4, Manifestacao 4, Nexo 4', summary: '+3 para esconder sinais da Manifestacao; sensores sofrem -2.' },
  { id: 'nucleo-estavel', name: 'Nucleo Estavel', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Nexo 5, Vontade 5, Manifestacao 4', summary: '-1 Instabilidade no comeco da cena; a primeira falha nao gera Glitch automatico.' },
  { id: 'resposta-de-emergencia', name: 'Resposta de Emergencia', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Reflexos 4, Manifestacao 4, Nexo 4', summary: '1x/cena, ao ser surpreendido, ignora Desprevenido ate o proximo turno; primeira Faceta como reacao custa -1 PE e nao gera Instabilidade extra por surpresa/pressa.' },
  { id: 'sustentacao', name: 'Sustentacao', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 4, Nexo 5', summary: 'Uma Faceta continua dura +50%; a primeira rodada extra nao gera Instabilidade.' },
  { id: 'conversao-forcada', name: 'Conversao Forcada', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Vigor 4, Nexo 5', summary: '1x/cena, converte 1 PD em 2 PE ou 2 PV em 3 PE.' },
  { id: 'adaptacao-rapida', name: 'Adaptacao Rapida', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Fortitude 4 ou Sobrevivencia 4, Nexo 4', summary: 'Ignora a primeira penalidade de zona ou interferencia anomala por cena.' },
  { id: 'sinapse-anomala', name: 'Sinapse Anomala', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 4, Nexo 4', summary: '+2 em testes de Manifestacao.' },
  { id: 'descarga-estavel', name: 'Descarga Estavel', tier: 'Treinada', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 4, Vontade 4', summary: 'A primeira Faceta ofensiva usada em cada cena custa 1 PE a menos, minimo 1.' },
  { id: 'trava-de-colapso', name: 'Trava de Colapso', tier: 'Avancada', group: 'Alterado', prerequisites: 'Nivel 5, Alterado, Nexo 7, Vontade 6, Manifestacao 5', summary: '1x/sessao, Instabilidade 6 para em 5; +3 no proximo teste para segurar a situacao.' },
  { id: 'faceta-de-combate', name: 'Faceta de Combate', tier: 'Avancada', group: 'Alterado', prerequisites: 'Nivel 5, Alterado, uma Faceta Rank 5, Manifestacao 5', summary: 'Uma Faceta ofensiva/defensiva recebe +2 e 1 efeito extra menor por cena.' },
  { id: 'sincronia-profunda', name: 'Sincronia Profunda', tier: 'Avancada', group: 'Alterado', prerequisites: 'Nivel 6, Alterado, Nexo 7, Manifestacao 6', summary: '+3 contra Instabilidade, Glitches e interferencia; o primeiro +1 Instabilidade da cena e ignorado.' },
  { id: 'derivacao-estavel', name: 'Derivacao Estavel', tier: 'Avancada', group: 'Alterado', prerequisites: 'Nivel 6, Alterado, duas Facetas Rank 4, Manifestacao 6', summary: 'Nova Faceta comeca com +2 XP e o primeiro uso nao gera Instabilidade.' },
  { id: 'pressao-anomala', name: 'Pressao Anomala', tier: 'Avancada', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 5, Nexo 6', summary: 'Em desvantagem numerica, danos causados por Facetas aumentam em +2 dados.' },
  { id: 'nucleo-de-ruptura', name: 'Nucleo de Ruptura', tier: 'Avancada', group: 'Alterado', prerequisites: 'Alterado; Manifestacao 5, Nexo 6, Vontade 5', summary: 'Com Instabilidade 2 ou mais, recebe +2 em Manifestacao.' },
  { id: 'ruptura-controlada', name: 'Ruptura Controlada', tier: 'Excepcional', group: 'Alterado', prerequisites: 'Nivel 8, Alterado, Nexo 8, Manifestacao 7, uma Faceta Rank 6', summary: '1x/sessao, entra em Ruptura com bonus e custo menor; depois ganha +2 Instabilidade.' },
  { id: 'nucleo-monstruoso', name: 'Nucleo Monstruoso', tier: 'Excepcional', group: 'Alterado', prerequisites: 'Nivel 8, Alterado, Nexo 9, Vigor 7, Manifestacao 7', summary: 'Em Instabilidade 4+, ganha bonus em Manifestacao, Fortitude e dano; desastres viram Glitch Grave.' },
  { id: 'procedimento', name: 'Procedimento', tier: 'Basica', group: 'Especialista', prerequisites: 'Especialista; Inteligencia 2', summary: 'Apos 1 min de preparo, +2 no proximo teste tecnico/cientifico/medico/investigativo.' },
  { id: 'vetor-de-ataque', name: 'Vetor de Ataque', tier: 'Basica', group: 'Especialista', prerequisites: 'Especialista; Investigacao 4 ou Percepcao 4', summary: 'Gaste 1 PE e acao de movimento para analisar. +2 no primeiro ataque contra esse alvo na mesma cena.' },
  { id: 'mao-estavel', name: 'Mao Estavel', tier: 'Basica', group: 'Especialista', prerequisites: 'Especialista; Medicina 2 ou Tecnologia 2', summary: 'Recebe +2 em Medicina ou Tecnologia em combate ou urgencia.' },
  { id: 'preparado', name: 'Preparado', tier: 'Basica', group: 'Especialista', prerequisites: 'Especialista; Iniciativa 2', summary: 'Recebe +2 em Iniciativa e pode sacar ou preparar um item como acao livre no primeiro turno.' },
  { id: 'acao-calculada', name: 'Acao Calculada', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Investigacao 4 ou Tecnologia 4, Inteligencia 4', summary: 'Ao ajudar um aliado, o bonus concedido sobe para +3. Em acao tecnica, medica ou tatica, sobe para +4.' },
  { id: 'quadro-mental', name: 'Quadro Mental', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Inteligencia 4, Investigacao 4', summary: '+2 Investigacao e +2 Tecnologia.' },
  { id: 'diagnostico', name: 'Diagnostico', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Medicina 4 ou Ciencias 4', summary: 'Ao interagir por um turno com pessoa, criatura ou sistema, descobre condicao, dano, fraqueza, instabilidade ou problema central.' },
  { id: 'kit-de-campo', name: 'Kit de Campo', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Profissao 4 ou Tecnologia 4', summary: '1x/cena, declara item pequeno ou medio plausivel ligado a sua area de atuacao.' },
  { id: 'memoria-tecnica-especialista', name: 'Memoria Tecnica', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Inteligencia 5, Ciencias 3 ou Tecnologia 3', summary: '1x/cena, pede ao Mestre um detalhe tecnico, estrutural ou procedimental plausivel.' },
  { id: 'apoio-tatico', name: 'Apoio Tatico', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Diplomacia 4 ou Investigacao 4', summary: 'Aliados a curta distancia que possam ouvir ou ver voce recebem +1 em estabilizacao, retirada, cobertura ou reposicionamento.' },
  { id: 'supervisao', name: 'Supervisao', tier: 'Treinada', group: 'Especialista', prerequisites: 'Especialista; Diplomacia 4 ou Investigacao 4', summary: 'Com teste de Diplomacia, aliados proximos que possam ouvir voce recebem +1 em ataque ou Reflexos no seu proximo turno da cena.' },
  { id: 'analise-de-fraqueza', name: 'Analise de Fraqueza', tier: 'Avancada', group: 'Especialista', prerequisites: 'Nivel 5, Especialista, Investigacao 5, Sentidos 6', summary: 'Gastando uma Acao Padrao para observar um alvo, concede +3 no proximo ataque feito contra ele por voce ou aliado. Se acertar, causa +3 de dano.' },
  { id: 'leitura-de-exposicao', name: 'Leitura de Exposicao', tier: 'Avancada', group: 'Especialista', prerequisites: 'Nivel 5, Especialista, Investigacao 5, Sentidos 5, Vetor de Ataque', summary: 'Contra alvo ja analisado na cena, o primeiro ataque seu ou de aliado recebe +2; se causar dano, +2 dano.' },
  { id: 'procedimento-ii', name: 'Procedimento II', tier: 'Avancada', group: 'Especialista', prerequisites: 'Nivel 5, Procedimento, Especialista, Inteligencia 6', summary: 'Procedimento sobe para +3 e exige metade do tempo.' },
  { id: 'recurso-extraido', name: 'Recurso Extraido', tier: 'Avancada', group: 'Especialista', prerequisites: 'Nivel 5, Especialista, Tecnologia 5 ou Profissao 5', summary: '1x/cena, ao usar item limitado, evita seu consumo, reduz desgaste ou extrai um efeito adicional pequeno.' },
  { id: 'executor-de-campo', name: 'Executor de Campo', tier: 'Avancada', group: 'Especialista', prerequisites: 'Nivel 6, Especialista, Tecnologia 5, Medicina 5, Investigacao 5', summary: '1x/cena, trata um teste tecnico, medico ou investigativo sob forte pressao como 10 natural antes dos modificadores.' },
  { id: 'processamento-paralelo', name: 'Processamento Paralelo', tier: 'Avancada', group: 'Especialista', prerequisites: 'Nivel 6, Especialista, Inteligencia 7, Investigacao 5', summary: '1x/cena, apos sucesso em Tecnologia, Ciencias, Medicina ou Investigacao, faz um segundo teste tecnico diferente como acao parcial.' },
  { id: 'cerebro-de-operacao', name: 'Cerebro de Operacao', tier: 'Excepcional', group: 'Especialista', prerequisites: 'Nivel 8, Especialista, Inteligencia 8, uma pericia tecnica em 7', summary: 'No comeco de cena importante, ate dois aliados recebem +2 em ataque, defesa, tecnologia, investigacao ou estabilizacao.' },
  { id: 'arquiteto-de-crise', name: 'Arquiteto de Crise', tier: 'Excepcional', group: 'Especialista', prerequisites: 'Nivel 8, Especialista, Inteligencia 9, Investigacao 6, Tecnologia 6', summary: '1x/sessao, reorganiza uma cena tecnica, logistica ou de contencao a seu favor.' },
  { id: 'guarda-fechada', name: 'Guarda Fechada', tier: 'Basica', group: 'Combatente', prerequisites: 'Combatente; Luta 2, Vigor 2', summary: '+2 em Bloqueio.' },
  { id: 'passo-curto', name: 'Passo Curto', tier: 'Basica', group: 'Combatente', prerequisites: 'Combatente; Destreza 2', summary: 'Uma vez por turno, pode se mover 2 metros adicionais sem gastar acao de movimento.' },
  { id: 'impacto', name: 'Impacto', tier: 'Basica', group: 'Combatente', prerequisites: 'Combatente; Forca 2, Luta 2', summary: 'Quando acerta ataque corpo a corpo, pode empurrar o alvo em 1 metro sem teste extra.' },
  { id: 'mao-pesada', name: 'Mao Pesada', tier: 'Basica', group: 'Combatente', prerequisites: 'Combatente; Forca 2, Luta 2', summary: 'Ataques corpo a corpo recebem +2 no dano.' },
  { id: 'protetor', name: 'Protetor', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Vigor 4, Reflexos 4', summary: '1x/rodada, quando aliado adjacente for alvo de ataque, pode se tornar o alvo no lugar dele. Se acertar, reduza o dano recebido em 3.' },
  { id: 'tranco', name: 'Tranco', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Vigor 4, Luta 4', summary: 'Ao escolher Bloqueio e ainda ser atingido, reduz 1 dano apos Armadura. Se o ataque superou seu Bloqueio por 3 ou menos, reduz 2. Nao se aplica a efeitos impossiveis de bloquear com o corpo.' },
  { id: 'luta-afiada', name: 'Luta Afiada', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Luta 4', summary: '+2 em testes de ataques corpo a corpo.' },
  { id: 'passo-de-duelo', name: 'Passo de Duelo', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Reflexos 4, Destreza 4', summary: 'Quando inimigo erra ataque corpo a corpo contra sua Esquiva, seu proximo ataque corpo a corpo contra ele recebe +2 no teste e +Destreza no dano.' },
  { id: 'golpe-pesado', name: 'Golpe Pesado', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Forca 5, Luta 4', summary: 'Antes de atacar corpo a corpo, pode sofrer -2 no ataque para receber +6 no dano se acertar.' },
  { id: 'avanco-implacavel', name: 'Avanco Implacavel', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Atletismo 4 ou Destreza 4', summary: 'Se terminar o movimento adjacente a um inimigo, recebe +2 no proximo ataque corpo a corpo contra ele. Se acertar, o alvo nao pode fazer deslocamento livre ate o proximo turno.' },
  { id: 'contra-pressao', name: 'Contra-pressao', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Reflexos 4, Vigor 4', summary: 'Se for atacado mais de uma vez na mesma rodada, recebe +2 na segunda defesa em diante ate o inicio do proximo turno.' },
  { id: 'presenca-de-linha-de-frente', name: 'Presenca de Linha de Frente', tier: 'Treinada', group: 'Combatente', prerequisites: 'Combatente; Luta 4, Intimidacao 4', summary: 'Inimigos adjacentes sofrem -2 em fuga, deslocamento ou manobras que tentem ignorar sua presenca.' },
  { id: 'casco-de-guerra', name: 'Casco de Guerra', tier: 'Avancada', group: 'Combatente', prerequisites: 'Nivel 5, Combatente, Vigor 7, Fortitude 5', summary: 'Enquanto estiver com menos da metade dos PV, recebe +1 Armadura, +2 Fortitude e +2 Bloqueio.' },
  { id: 'guarda-fechada-ii', name: 'Guarda Fechada II', tier: 'Avancada', group: 'Combatente', prerequisites: 'Nivel 5, Guarda Fechada, Combatente, Luta 5, Vigor 6', summary: 'Bloqueio sobe de +2 para +4.' },
  { id: 'pressao-de-guarda', name: 'Pressao de Guarda', tier: 'Avancada', group: 'Combatente', prerequisites: 'Combatente; Luta 5, Reflexos 5', summary: 'Inimigos adjacentes sofrem -2 em Esquiva contra seus ataques corpo a corpo.' },
  { id: 'quebra-linha', name: 'Quebra-linha', tier: 'Avancada', group: 'Combatente', prerequisites: 'Nivel 5, Combatente, Forca 7, Atletismo 5, Luta 5', summary: 'Quando usa Investida, nao fica Desprevenido e, se acertar, o alvo precisa vencer teste de Forca ou cai.' },
  { id: 'nao-passa', name: 'Nao Passa', tier: 'Avancada', group: 'Combatente', prerequisites: 'Nivel 6, Combatente, Vigor 6, Presenca de Linha de Frente', summary: '1x/rodada, quando inimigo adjacente tenta se afastar, faz ataque corpo a corpo imediato. Se acertar, ele perde o movimento restante.' },
  { id: 'parede-viva', name: 'Parede Viva', tier: 'Avancada', group: 'Combatente', prerequisites: 'Nivel 6, Combatente, Vigor 7, Reflexos 5', summary: 'Em Defesa Total, aliados adjacentes recebem +2 Defesa contra ataques a distancia e reduzem o primeiro dano recebido em 2.' },
  { id: 'instinto-de-batalha', name: 'Instinto de Batalha', tier: 'Excepcional', group: 'Combatente', prerequisites: 'Nivel 8, Combatente, Reflexos 6, Luta 6, Vigor 6', summary: 'No primeiro turno de cada combate, recebe +3 em Defesa, +3 no primeiro ataque e movimento extra de 3 metros.' },
  { id: 'corpo-de-cerco', name: 'Corpo de Cerco', tier: 'Excepcional', group: 'Combatente', prerequisites: 'Nivel 8, Combatente, Forca 8, Vigor 8, Fortitude 6', summary: 'Recebe +2 Armadura, resistencia a empurrao, queda e imobilizacao, e reducao fixa de 3 de dano fisico em todo ataque nao critico.' },
  { id: 'ultimo-a-cair', name: 'Ultimo a Cair', tier: 'Excepcional', group: 'Combatente', prerequisites: 'Nivel 8, Combatente, Vigor 9, Fortitude 7, Casco de Guerra', summary: 'Abaixo da metade dos PV, recebe +2 Defesa e +2 Luta. A primeira queda a 0 PV na cena deixa voce com 1 PV.' },
  { id: 'faceta-preferida', name: 'Faceta Preferida', tier: 'Basica', group: 'Manifestacao', prerequisites: 'Manifestacao ativa; a Faceta escolhida em Rank 2', summary: 'Escolha uma Faceta conhecida. Uma vez por cena, recebe +2 no teste dessa Faceta.' },
  { id: 'disparo-limpo', name: 'Disparo Limpo', tier: 'Basica', group: 'Manifestacao', prerequisites: 'Manifestacao ativa; Manifestacao 2, Nexo 3', summary: 'A primeira vez que usar uma Faceta na cena, ela gera -1 Instabilidade.' },
  { id: 'reversao-parcial', name: 'Reversao Parcial', tier: 'Treinada', group: 'Manifestacao', prerequisites: 'Manifestacao ativa; Vontade 4, Manifestacao 4', summary: '1x/cena, apos falhar em teste de Manifestacao, pode cancelar o efeito da Faceta e evitar a consequencia principal da falha. O custo em PE ainda e perdido.' },
  { id: 'janela-de-controle', name: 'Janela de Controle', tier: 'Treinada', group: 'Manifestacao', prerequisites: 'Manifestacao ativa; Nexo 5, Vontade 4', summary: 'Quando atingiria Instabilidade 4 pela primeira vez na cena, pode manter em 3.' },
  { id: 'faceta-reativa', name: 'Faceta Reativa', tier: 'Treinada', group: 'Manifestacao', prerequisites: 'Manifestacao ativa; Reflexos 4; a Faceta escolhida em Rank 4', summary: '1x/cena, ao usar a Faceta escolhida como reacao de Esquiva, recebe +2 e pode conceder +2 a aliado adjacente.' },
  { id: 'sincronia', name: 'Sincronia', tier: 'Treinada', group: 'Manifestacao', prerequisites: 'Manifestacao ativa; Nexo 5', summary: '+3 em Vontade para resistir a Instabilidade, Glitches ou stress de ativacao.' },
  { id: 'faceta-preferida-ii', name: 'Faceta Preferida II', tier: 'Avancada', group: 'Manifestacao', prerequisites: 'Nivel 5, Faceta Preferida, a Faceta escolhida em Rank 5', summary: 'Alem do bonus normal, uma vez por cena pode reduzir o custo dessa Faceta em 1 PE.' },
  { id: 'janela-de-controle-ii', name: 'Janela de Controle II', tier: 'Avancada', group: 'Manifestacao', prerequisites: 'Nivel 6, Janela de Controle, Nexo 7, Vontade 6', summary: '1x/cena, quando sofreria um Glitch Menor por Instabilidade 4 ou 5, pode anula-lo completamente.' },
  { id: 'arquitetura-da-faceta', name: 'Arquitetura da Faceta', tier: 'Avancada', group: 'Manifestacao', prerequisites: 'Nivel 6, Manifestacao ativa, uma Faceta em Rank 6, Manifestacao 6', summary: 'Ao subir o proximo Rank dessa Faceta, o Mestre deve oferecer uma opcao extra de evolucao.' },
  { id: 'reator-interno', name: 'Reator Interno', tier: 'Avancada', group: 'Manifestacao', prerequisites: 'Nivel 6, Manifestacao ativa, Nexo 7, Manifestacao 6', summary: 'No comeco de cada cena, recupera 2 PE. Nao funciona se tiver entrado em colapso na cena anterior.' },
  { id: 'nucleo-sincronico', name: 'Nucleo Sincronico', tier: 'Excepcional', group: 'Manifestacao', prerequisites: 'Nivel 8, Manifestacao ativa, Nexo 8, Manifestacao 7, duas Facetas em Rank 5', summary: 'No comeco de cada cena importante, escolha uma Faceta. Ate o fim da cena, ela recebe +2 nos testes, o primeiro uso gera 1 Instabilidade a menos e critico gera efeito extra relevante.' },
  { id: 'sobrecarga-dirigida', name: 'Sobrecarga Dirigida', tier: 'Excepcional', group: 'Manifestacao', prerequisites: 'Nivel 8, Manifestacao ativa, Nexo 9, Manifestacao 8, uma Faceta em Rank 7', summary: '1x/sessao, aumenta uma Faceta alem do limite seguro: +3 nos testes, critico garantido, +2 Instabilidade e Glitch Menor ao fim.' }
] as const;

const CLASS_CONFIG = {
  Alterado: { pvBase: 16, peBase: 6, pdBase: 15, armorBase: 0, pvGrowth: 2, peGrowth: 3, pdGrowth: 5, notes: 'Vontade +2; pode trocar 1 PD por 2 PE.' },
  Especialista: { pvBase: 19, peBase: 4, pdBase: 12, armorBase: 0, pvGrowth: 3, peGrowth: 2, pdGrowth: 4, notes: 'Recebe PeV extras por Inteligencia em progressoes futuras.' },
  Combatente: { pvBase: 25, peBase: 2, pdBase: 10, armorBase: 1, pvGrowth: 4, peGrowth: 1, pdGrowth: 3, notes: 'Armadura +1; 1x por cena pode anular totalmente o dano de um ataque.' }
} as const;

export const APTITUDE_COSTS: Record<string, number> = {
  Basica: 4,
  'Básica': 4,
  'BÃ¡sica': 4,
  Treinada: 6,
  Avancada: 8,
  'Avançada': 8,
  'AvanÃ§ada': 8,
  Excepcional: 10
};

type AptitudeAutoEffect = {
  maxPvBonus?: number;
  maxPeBonus?: number;
  maxPdBonus?: number;
  armorBonus?: number;
  initiativeBonus?: number;
  blockBonus?: number;
  blockBonusOverride?: number;
  skillBonuses?: Record<string, number>;
  situationalSkillBonuses?: Record<string, Array<{ bonus: number; note: string }>>;
  chosenSkillBonus?: number;
  optionKey?: string;
  defaultOption?: string;
};

const APTITUDE_AUTO_EFFECTS: Record<string, AptitudeAutoEffect> = {
  'sangue-frio': {
    skillBonuses: { iniciativa: 2 },
    situationalSkillBonuses: {
      vontade: [{ bonus: 2, note: 'Primeiro teste de Vontade da cena contra pressao.' }]
    }
  },
  'instinto-firme': {
    situationalSkillBonuses: {
      reflexos: [{ bonus: 2, note: 'Contra surpresa, emboscada ou ataque de alvo que ainda nao agiu.' }]
    }
  },
  'atencao-partida': { skillBonuses: { percepcao: 2, intuicao: 2 } },
  'olho-clinico': {
    situationalSkillBonuses: {
      investigacao: [{ bonus: 2, note: 'Analisar corpos, residuos, ferimentos e cenas.' }],
      medicina: [{ bonus: 2, note: 'Analisar corpos, residuos, ferimentos e cenas.' }]
    }
  },
  'pulso-firme': {
    situationalSkillBonuses: {
      pontaria: [{ bonus: 2, note: 'Sob risco imediato.' }],
      tecnologia: [{ bonus: 2, note: 'Sob risco imediato.' }],
      medicina: [{ bonus: 2, note: 'Sob risco imediato.' }]
    }
  },
  'folego-extra': { maxPvBonus: 5 },
  'reserva-mental': { maxPdBonus: 5 },
  'reserva-tecnica': { maxPeBonus: 4 },
  'rastro-invisivel': {
    situationalSkillBonuses: {
      furtividade: [
        { bonus: 2, note: 'Em ambiente urbano.' },
        { bonus: 4, note: 'No primeiro teste saindo de cobertura ou sombra.' }
      ]
    }
  },
  'cara-comum': {
    situationalSkillBonuses: {
      enganacao: [{ bonus: 2, note: 'Para se misturar e evitar atencao.' }],
      furtividade: [{ bonus: 2, note: 'Para se misturar e evitar atencao.' }]
    }
  },
  'leitura-de-gente': {
    skillBonuses: { intuicao: 2 },
    situationalSkillBonuses: {
      intuicao: [{ bonus: 1, note: 'Se o alvo estiver mentindo sob pressao.' }]
    }
  },
  'presenca-dificil': { chosenSkillBonus: 3, optionKey: 'effectChoice', defaultOption: 'intimidacao' },
  'corpo-e-alma': { skillBonuses: { vontade: 2, fortitude: 2 } },
  'corpo-ajustado': {
    situationalSkillBonuses: {
      acrobacia: [{ bonus: 2, note: 'Em ambiente que ja conhece ou onde ja lutou antes.' }],
      atletismo: [{ bonus: 2, note: 'Em ambiente que ja conhece ou onde ja lutou antes.' }],
      reflexos: [{ bonus: 2, note: 'Em ambiente que ja conhece ou onde ja lutou antes.' }]
    }
  },
  'casca-dura': {
    armorBonus: 1,
    situationalSkillBonuses: {
      fortitude: [{ bonus: 2, note: 'Contra dor, exaustao e trauma.' }]
    }
  },
  'boca-fechada': {
    situationalSkillBonuses: {
      vontade: [{ bonus: 3, note: 'Resistir a interrogatorio, coacao ou chantagem.' }]
    }
  },
  'ouvido-de-rua': {
    situationalSkillBonuses: {
      atualidades: [{ bonus: 2, note: 'Coleta de informacao urbana.' }],
      investigacao: [{ bonus: 2, note: 'Coleta de informacao urbana.' }]
    }
  },
  'documento-vivo': {
    situationalSkillBonuses: {
      atualidades: [{ bonus: 2, note: 'Burocracia, sistemas, cadastro e documentos.' }],
      tecnologia: [{ bonus: 2, note: 'Burocracia, sistemas, cadastro e documentos.' }],
      crime: [{ bonus: 2, note: 'Burocracia, sistemas, cadastro e documentos.' }]
    }
  },
  'leitura-anomala': {
    situationalSkillBonuses: {
      ciencias: [{ bonus: 2, note: 'Analisar artefatos, mutacoes, residuo ou tecnologia viva.' }],
      investigacao: [{ bonus: 2, note: 'Analisar artefatos, mutacoes, residuo ou tecnologia viva.' }]
    }
  },
  'foco-de-nucleo': {
    situationalSkillBonuses: {
      manifestacao: [{ bonus: 2, note: 'Primeiro teste de Manifestacao da cena.' }]
    }
  },
  'assinatura-oculta': {
    situationalSkillBonuses: {
      furtividade: [{ bonus: 3, note: 'Esconder sinais da Manifestacao.' }],
      manifestacao: [{ bonus: 3, note: 'Esconder sinais da Manifestacao.' }]
    }
  },
  'nucleo-de-ruptura': {
    situationalSkillBonuses: {
      manifestacao: [{ bonus: 2, note: 'Enquanto estiver com Instabilidade 2 ou mais.' }]
    }
  },
  'sinapse-anomala': { skillBonuses: { manifestacao: 2 } },
  preparado: { skillBonuses: { iniciativa: 2 } },
  procedimento: {
    situationalSkillBonuses: {
      ciencias: [{ bonus: 2, note: 'Depois de 1 minuto de preparo.' }],
      medicina: [{ bonus: 2, note: 'Depois de 1 minuto de preparo.' }],
      investigacao: [{ bonus: 2, note: 'Depois de 1 minuto de preparo.' }],
      tecnologia: [{ bonus: 2, note: 'Depois de 1 minuto de preparo.' }]
    }
  },
  'procedimento-ii': {
    situationalSkillBonuses: {
      ciencias: [{ bonus: 1, note: 'Aperfeicoa Procedimento para total +3 com metade do tempo.' }],
      medicina: [{ bonus: 1, note: 'Aperfeicoa Procedimento para total +3 com metade do tempo.' }],
      investigacao: [{ bonus: 1, note: 'Aperfeicoa Procedimento para total +3 com metade do tempo.' }],
      tecnologia: [{ bonus: 1, note: 'Aperfeicoa Procedimento para total +3 com metade do tempo.' }]
    }
  },
  'mao-estavel': {
    situationalSkillBonuses: {
      medicina: [{ bonus: 2, note: 'Em combate ou urgencia.' }],
      tecnologia: [{ bonus: 2, note: 'Em combate ou urgencia.' }]
    }
  },
  'quadro-mental': { skillBonuses: { investigacao: 2, tecnologia: 2 } },
  'guarda-fechada': { blockBonus: 2 },
  'guarda-fechada-ii': { blockBonusOverride: 4 },
  'luta-afiada': { skillBonuses: { luta: 2 } },
  'avanco-implacavel': {
    situationalSkillBonuses: {
      luta: [{ bonus: 2, note: 'No proximo ataque corpo a corpo apos terminar o movimento adjacente ao alvo.' }]
    }
  },
  'contra-pressao': {
    situationalSkillBonuses: {
      reflexos: [{ bonus: 2, note: 'Na segunda defesa em diante na mesma rodada.' }],
      fortitude: [{ bonus: 2, note: 'Na segunda defesa em diante na mesma rodada.' }]
    }
  },
  'passo-de-duelo': {
    situationalSkillBonuses: {
      luta: [{ bonus: 2, note: 'Proximo ataque corpo a corpo contra inimigo que errou voce em esquiva.' }]
    }
  },
  'casco-de-guerra': {
    situationalSkillBonuses: {
      fortitude: [{ bonus: 2, note: 'Enquanto estiver com menos da metade dos PV.' }]
    }
  },
  'ultimo-a-cair': {
    situationalSkillBonuses: {
      luta: [{ bonus: 2, note: 'Enquanto estiver com menos da metade dos PV.' }]
    }
  },
  sincronia: {
    situationalSkillBonuses: {
      vontade: [{ bonus: 3, note: 'Resistir a Instabilidade, Glitches ou stress de ativacao.' }]
    }
  },
  'faceta-preferida': {
    situationalSkillBonuses: {
      manifestacao: [{ bonus: 2, note: 'No teste da Faceta escolhida, 1x/cena.' }]
    }
  },
  'faceta-reativa': {
    situationalSkillBonuses: {
      reflexos: [{ bonus: 2, note: 'Ao usar a Faceta escolhida como reacao de Esquiva.' }]
    }
  },
  'faceta-de-combate': {
    situationalSkillBonuses: {
      manifestacao: [{ bonus: 2, note: 'Na Faceta ofensiva ou defensiva escolhida, 1x/cena.' }]
    }
  },
  'nucleo-sincronico': {
    situationalSkillBonuses: {
      manifestacao: [{ bonus: 2, note: 'Na Faceta escolhida no comeco da cena importante.' }]
    }
  },
  'sobrecarga-dirigida': {
    situationalSkillBonuses: {
      manifestacao: [{ bonus: 3, note: 'Na Faceta sobrecarregada, 1x/sessao.' }]
    }
  },
  'ossos-de-concreto': { armorBonus: 1 },
  'corpo-de-cerco': { armorBonus: 2 },
  'presenca-inquebravel': {
    skillBonuses: { intimidacao: 4 },
    situationalSkillBonuses: {
      vontade: [{ bonus: 2, note: 'Contra coercao e efeitos mentais.' }]
    }
  }
};

const ATTRIBUTE_POINTS_BASE = 4;
const ATTRIBUTE_POINTS_PER_LEVEL = 4;
const BASE_PEV = 20;
const LEVEL_TWO_PEV_GAIN = 20;
const LEVEL_THREE_PLUS_PEV_GAIN = 16;
const REDUCED_PEV_START_LEVEL = 3;

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: unknown, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(toNumber(value, min))));
}

function floorHalf(value: unknown): number {
  return Math.floor(toNumber(value) / 2);
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slug(value: unknown, fallback: string): string {
  const normalized = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

export function getAptitudeCostByTier(tier: unknown): number {
  return APTITUDE_COSTS[String(tier || 'Basica')] || 0;
}

export function getAptitudeTier(entry: Record<string, unknown>): string {
  return String(entry.tier || getAptitudeById(entry.catalogId)?.tier || 'Basica');
}

export function hydrateAptitudeEntry(entry: Record<string, unknown> = {}) {
  const catalogId = String(entry.catalogId || '');
  const catalog = catalogId ? getAptitudeById(catalogId) : null;
  const effectOptions = getAptitudeEffectOptions(catalogId);

  return {
    ...entry,
    id: String(entry.id || makeId('apt')),
    catalogId,
    customName: String(entry.customName || ''),
    tier: String(entry.tier || catalog?.tier || 'Basica'),
    notes: String(entry.notes || ''),
    effectChoice: String(entry.effectChoice || effectOptions[0]?.value || '')
  };
}

export function createCompanionSkillEntry(overrides: Record<string, unknown> = {}) {
  return {
    name: String(overrides.name || ''),
    value: clamp(overrides.value, 0, 99),
    attribute: String(overrides.attribute || SKILL_ATTRIBUTE_DEFAULTS[slug(overrides.name, '')] || 'destreza'),
    ...(overrides._draft ? { _draft: true } : {})
  };
}

export function createCompanionFacetEntry(overrides: Record<string, unknown> = {}) {
  return {
    name: String(overrides.name || ''),
    rank: clamp(overrides.rank, 1, 10),
    xp: clamp(overrides.xp, 0, 999),
    notes: String(overrides.notes || ''),
    ...(overrides._draft ? { _draft: true } : {})
  };
}

export function normalizeCompanion(raw: Partial<CompanionSheet> | null | undefined, index = 0): CompanionSheet {
  const record = (raw || {}) as Partial<CompanionSheet> & Record<string, unknown>;
  const attributes = Object.fromEntries(ATTRIBUTES.map((attribute) => [attribute.key, clamp(raw?.attributes?.[attribute.key], 0, 99)]));
  const skills = Array.isArray(raw?.skills)
    ? raw.skills.map((skill) => createCompanionSkillEntry(skill)).filter((skill) => skill._draft || skill.name || skill.value > 0 || skill.attribute !== 'destreza')
    : [];
  const facets = Array.isArray(raw?.facets)
    ? raw.facets.map((facet) => createCompanionFacetEntry(facet)).filter((facet) => facet._draft || facet.name || facet.rank > 1 || facet.xp > 0)
    : [];
  const pvMax = clamp(raw?.pvMax, 0, 9999);

  return {
    ...(raw || {}),
    id: String(raw?.id || `${slug(raw?.name, 'companion')}-${index + 1}` || makeId('cmp')),
    name: String(raw?.name || ''),
    type: String(raw?.type || ''),
    image: String(raw?.image || ''),
    omnivitaSilhouette: String(record.omnivitaSilhouette || record.silhouette || ''),
    isHidden: Boolean(record.isHidden || record.hidden || String(record.visibility || '').toLowerCase() === 'hidden'),
    pvCurrent: clamp(raw?.pvCurrent, 0, pvMax || 9999),
    pvMax,
    armor: clamp(raw?.armor, 0, 99),
    status: String(raw?.status || 'Vivo'),
    notes: String(raw?.notes || ''),
    attributes,
    skills,
    facets
  };
}

export function createCompanion(overrides: Partial<CompanionSheet> = {}): CompanionSheet {
  return normalizeCompanion({ id: makeId('cmp'), status: 'Vivo', ...overrides });
}

export function getAptitudeById(id: unknown) {
  return APTITUDE_CATALOG.find((entry) => entry.id === String(id || '')) || null;
}

export function getAptitudeEffectOptions(id: unknown) {
  if (String(id || '') === 'presenca-dificil') {
    return [
      { value: 'intimidacao', label: 'Intimidacao' },
      { value: 'vontade', label: 'Vontade' }
    ];
  }
  return [];
}

export function getAptitudeAutoConfig(id: unknown) {
  return APTITUDE_AUTO_EFFECTS[String(id || '')] || null;
}

export function hasAptitudeAutoEffect(id: unknown) {
  return Boolean(getAptitudeAutoConfig(id));
}

export function getClassConfig(className: unknown) {
  const key = String(className || 'Especialista') as keyof typeof CLASS_CONFIG;
  return CLASS_CONFIG[key] || CLASS_CONFIG.Especialista;
}

export function getAttributeLimit(level: unknown): number {
  return Math.max(4, toNumber(level, 1) + 4);
}

export function getSkillLimit(level: unknown): number {
  return Math.max(2, toNumber(level, 1) + 1);
}

export function getGrantedAttributePoints(level: unknown): number {
  return ATTRIBUTE_POINTS_BASE + Math.max(0, toNumber(level, 1) - 1) * ATTRIBUTE_POINTS_PER_LEVEL;
}

export function getGrantedPeV(level: unknown, extraPeV: unknown): number {
  const safeLevel = Math.max(1, toNumber(level, 1));
  let total = BASE_PEV;
  for (let currentLevel = 2; currentLevel <= safeLevel; currentLevel += 1) {
    total += currentLevel >= REDUCED_PEV_START_LEVEL ? LEVEL_THREE_PLUS_PEV_GAIN : LEVEL_TWO_PEV_GAIN;
  }
  return total + toNumber(extraPeV);
}

export function calculateAptitudeBonuses(character: Pick<CharacterSheet, 'aptitudes'>) {
  const bonuses = {
    maxPvBonus: 0,
    maxPeBonus: 0,
    maxPdBonus: 0,
    armorBonus: 0,
    initiativeBonus: 0,
    blockBonus: 0,
    skillBonuses: {} as Record<string, number>
  };

  for (const aptitude of character.aptitudes || []) {
    const catalogId = String(aptitude.catalogId || '');
    const config = getAptitudeAutoConfig(catalogId) || {};
    bonuses.maxPvBonus += toNumber(config.maxPvBonus);
    bonuses.maxPeBonus += toNumber(config.maxPeBonus);
    bonuses.maxPdBonus += toNumber(config.maxPdBonus);
    bonuses.armorBonus += toNumber(config.armorBonus);
    bonuses.initiativeBonus += toNumber(config.initiativeBonus);
    if (config.blockBonusOverride) bonuses.blockBonus = toNumber(config.blockBonusOverride);
    else bonuses.blockBonus = Math.max(bonuses.blockBonus, toNumber(config.blockBonus));

    Object.entries(config.skillBonuses || {}).forEach(([skillKey, bonus]) => {
      bonuses.skillBonuses[skillKey] = toNumber(bonuses.skillBonuses[skillKey]) + toNumber(bonus);
    });

    if (config.chosenSkillBonus) {
      const optionKey = config.optionKey || 'effectChoice';
      const effectKey = String(aptitude[optionKey] || config.defaultOption || '');
      if (effectKey) {
        bonuses.skillBonuses[effectKey] = toNumber(bonuses.skillBonuses[effectKey]) + toNumber(config.chosenSkillBonus);
      }
    }
  }

  return bonuses;
}

export function getSkillFixedBonus(character: Pick<CharacterSheet, 'aptitudes'>, skillKey: string): number {
  const bonuses = calculateAptitudeBonuses(character);
  return toNumber(bonuses.skillBonuses[skillKey]);
}

export function getSkillFixedBonusSources(character: Pick<CharacterSheet, 'aptitudes'>, skillKey: string) {
  return (character.aptitudes || []).flatMap((aptitude) => {
    const catalogId = String(aptitude.catalogId || '');
    const config = getAptitudeAutoConfig(catalogId);
    const catalog = getAptitudeById(catalogId);
    const entries: Array<{ source: string; bonus: number }> = [];

    const directBonus = toNumber(config?.skillBonuses?.[skillKey]);
    if (directBonus) entries.push({ source: catalog?.name || catalogId, bonus: directBonus });

    if (config?.chosenSkillBonus) {
      const optionKey = config.optionKey || 'effectChoice';
      const effectKey = String(aptitude[optionKey] || config.defaultOption || '');
      if (effectKey === skillKey) {
        entries.push({ source: catalog?.name || catalogId, bonus: toNumber(config.chosenSkillBonus) });
      }
    }

    return entries;
  });
}

export function getSkillSituationalBonuses(character: Pick<CharacterSheet, 'aptitudes'>, skillKey: string) {
  return (character.aptitudes || []).flatMap((aptitude) => {
    const catalogId = String(aptitude.catalogId || '');
    const config = getAptitudeAutoConfig(catalogId);
    const catalog = getAptitudeById(catalogId);
    return (config?.situationalSkillBonuses?.[skillKey] || []).map((entry) => ({
      source: catalog?.name || catalogId,
      bonus: toNumber(entry.bonus),
      note: entry.note
    }));
  });
}

export function calculateSkillTotal(skillValue: unknown, attributeKey: unknown, attributes: Record<string, number> = {}): number {
  const safeKey = ATTRIBUTES.some((attribute) => attribute.key === attributeKey) ? String(attributeKey) : 'inteligencia';
  return toNumber(skillValue) + floorHalf(attributes[safeKey]);
}

export function calculateResourceMax(character: Pick<CharacterSheet, 'identity' | 'attributes' | 'resources' | 'aptitudes'>) {
  const classConfig = getClassConfig(character.identity.className);
  const level = Math.max(1, toNumber(character.identity.level, 1));
  const growthLevels = Math.max(0, level - 1);
  const bonuses = calculateAptitudeBonuses(character);
  const pvFromLevel = growthLevels * classConfig.pvGrowth;
  const pvFromAttribute = toNumber(character.attributes.vigor) * 3;
  const peFromLevel = growthLevels * classConfig.peGrowth;
  const peFromAttribute = toNumber(character.attributes.nexo) * 3;
  const pdFromLevel = growthLevels * classConfig.pdGrowth;
  const pdFromAttribute = toNumber(character.attributes.inteligencia) * 2;

  return {
    maxPv: classConfig.pvBase + pvFromLevel + pvFromAttribute + bonuses.maxPvBonus,
    maxPe: classConfig.peBase + peFromLevel + peFromAttribute + bonuses.maxPeBonus,
    maxPd: classConfig.pdBase + pdFromLevel + pdFromAttribute + bonuses.maxPdBonus,
    armor: classConfig.armorBase + toNumber(character.resources.armorBonus) + bonuses.armorBonus,
    breakdown: {
      pv: { base: classConfig.pvBase, level: pvFromLevel, attribute: pvFromAttribute, aptitudes: bonuses.maxPvBonus, attributeName: 'Vigor', attributeMultiplier: 3 },
      pe: { base: classConfig.peBase, level: peFromLevel, attribute: peFromAttribute, aptitudes: bonuses.maxPeBonus, attributeName: 'Nexo', attributeMultiplier: 3 },
      pd: { base: classConfig.pdBase, level: pdFromLevel, attribute: pdFromAttribute, aptitudes: bonuses.maxPdBonus, attributeName: 'Inteligencia', attributeMultiplier: 2 }
    }
  };
}

export function calculatePeVSpent(character: Pick<CharacterSheet, 'skills' | 'aptitudes' | 'progression'>) {
  const skillsSpent = SKILLS.reduce((sum, skill) => sum + toNumber(character.skills?.[skill]), 0);
  const aptitudeSpent = (character.aptitudes || []).reduce((sum, aptitude) => sum + getAptitudeCostByTier(getAptitudeTier(aptitude)), 0);
  const manifestationSpent = toNumber(character.progression.facetaUnlocks) * 6 + toNumber(character.progression.facetaStabilizations) * 4;
  const manualSpent = toNumber(character.progression.manualPeVSpent);
  return {
    skillsSpent,
    aptitudeSpent,
    manifestationSpent,
    manualSpent,
    total: skillsSpent + aptitudeSpent + manifestationSpent + manualSpent
  };
}

export function calculateBodyDamageScale(strength: unknown) {
  const value = toNumber(strength);
  if (value >= 10) return { level: 5, bonus: '+1d10', strengthRange: '10+' };
  if (value >= 8) return { level: 4, bonus: '+1d8', strengthRange: '8-9' };
  if (value >= 6) return { level: 3, bonus: '+1d6', strengthRange: '6-7' };
  if (value >= 4) return { level: 2, bonus: '+1d4', strengthRange: '4-5' };
  if (value >= 2) return { level: 1, bonus: '+1', strengthRange: '2-3' };
  return { level: 0, bonus: '+0', strengthRange: '0-1' };
}

export function calculateDerived(character: CharacterSheet) {
  const resourceMax = calculateResourceMax(character);
  const classConfig = getClassConfig(character.identity.className);
  const peVSpent = calculatePeVSpent(character);
  const aptitudeBonuses = calculateAptitudeBonuses(character);
  const attributes = character.attributes || {};
  const skills = character.skills || {};
  const level = character.identity.level;
  const blockMode = character.resources.blockMode === 'forca' ? 'forca' : 'vigor';
  const bodyDamage = calculateBodyDamageScale(attributes.forca);

  const fortitudeTotal = toNumber(skills.fortitude) + toNumber(aptitudeBonuses.skillBonuses.fortitude);
  const reflexosTotal = toNumber(skills.reflexos) + toNumber(aptitudeBonuses.skillBonuses.reflexos);
  const iniciativaTotal = toNumber(skills.iniciativa) + toNumber(aptitudeBonuses.skillBonuses.iniciativa);
  const manifestacaoTotal = toNumber(skills.manifestacao) + toNumber(aptitudeBonuses.skillBonuses.manifestacao);
  const attributePointsSpent = ATTRIBUTES.reduce((sum, attribute) => sum + toNumber(attributes[attribute.key]), 0);
  const peVGranted = getGrantedPeV(level, character.progression.extraPeV);

  return {
    ...resourceMax,
    classConfig,
    esquivaMod: reflexosTotal + floorHalf(attributes.destreza),
    blockForce: 10 + fortitudeTotal + floorHalf(attributes.forca) + aptitudeBonuses.blockBonus,
    blockVigor: 10 + fortitudeTotal + floorHalf(attributes.vigor) + aptitudeBonuses.blockBonus,
    selectedBlock: 10 + fortitudeTotal + floorHalf(attributes[blockMode]) + aptitudeBonuses.blockBonus,
    initiativeMod: iniciativaTotal + floorHalf(attributes.destreza) + aptitudeBonuses.initiativeBonus,
    manifestationMod: manifestacaoTotal + floorHalf(attributes.nexo),
    bodyDamage,
    bodyDamageLevel: bodyDamage.level,
    bodyDamageBonus: bodyDamage.bonus,
    attributePointsSpent,
    attributePointsGranted: getGrantedAttributePoints(level),
    attributePointsAvailable: getGrantedAttributePoints(level) - attributePointsSpent,
    attributeLimit: getAttributeLimit(level),
    skillLimit: getSkillLimit(level),
    peVGranted,
    peVSpent,
    peVAvailable: peVGranted - peVSpent.total,
    aptitudeCount: character.aptitudes.length
  };
}

export function hydrateCharacter(raw: Partial<CharacterSheet> | null | undefined): CharacterSheet {
  const identity = {
    name: String(raw?.identity?.name || raw?.id || 'Personagem'),
    age: raw?.identity?.age ?? '',
    className: String(raw?.identity?.className || 'Especialista'),
    level: Math.max(1, toNumber(raw?.identity?.level, 1)),
    concept: String(raw?.identity?.concept || ''),
    summary: String(raw?.identity?.summary || ''),
    manifestationOrigin: String(raw?.identity?.manifestationOrigin || ''),
    links: String(raw?.identity?.links || ''),
    appearance: String(raw?.identity?.appearance || ''),
    image: String(raw?.identity?.image || '')
  };
  const attributeLimit = getAttributeLimit(identity.level);
  const skillLimit = getSkillLimit(identity.level);
  const attributes = Object.fromEntries(ATTRIBUTES.map((attribute) => [attribute.key, clamp(raw?.attributes?.[attribute.key], 0, attributeLimit)]));
  const skills = Object.fromEntries(SKILLS.map((skill) => [skill, clamp(raw?.skills?.[skill], 0, skillLimit)]));
  const resources = {
    pvCurrent: raw?.resources?.pvCurrent ?? null,
    peCurrent: raw?.resources?.peCurrent ?? null,
    pdCurrent: raw?.resources?.pdCurrent ?? null,
    instability: clamp(raw?.resources?.instability, 0, 6),
    armorBonus: clamp(raw?.resources?.armorBonus, 0, 99),
    armorEquipment: String(raw?.resources?.armorEquipment || ''),
    blockMode: raw?.resources?.blockMode === 'forca' ? 'forca' : 'vigor',
    status: String(raw?.resources?.status || 'Vivo')
  } as CharacterSheet['resources'];

  const hydrated: CharacterSheet = {
    ...(raw || {}),
    id: String(raw?.id || identity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    ownerUserId: String(raw?.ownerUserId || ''),
    ownerUsername: String(raw?.ownerUsername || ''),
    identity,
    attributes,
    resources,
    progression: { extraPeV: 0, manualPeVSpent: 0, facetaUnlocks: 0, facetaStabilizations: 0, ...(raw?.progression || {}) },
    skills,
    skillAttributes: raw?.skillAttributes || {},
    aptitudes: Array.isArray(raw?.aptitudes) ? raw.aptitudes.map((aptitude) => hydrateAptitudeEntry(aptitude)) : [],
    manifestation: {
      name: '',
      origin: identity.manifestationOrigin,
      state: 'Parcial',
      glitches: '',
      activeEffects: '',
      ...(raw?.manifestation || {})
    },
    facets: Array.isArray(raw?.facets) ? raw.facets : [],
    companions: Array.isArray(raw?.companions) ? raw.companions.map((companion, index) => normalizeCompanion(companion, index)) : [],
    equipment: raw?.equipment || {},
    notes: String(raw?.notes || ''),
    masterNotes: String(raw?.masterNotes || ''),
    masterSession: raw?.masterSession || {}
  };

  const derived = calculateDerived(hydrated);
  hydrated.resources.pvCurrent = clamp(hydrated.resources.pvCurrent ?? derived.maxPv, 0, derived.maxPv);
  hydrated.resources.peCurrent = clamp(hydrated.resources.peCurrent ?? derived.maxPe, 0, derived.maxPe);
  hydrated.resources.pdCurrent = clamp(hydrated.resources.pdCurrent ?? derived.maxPd, 0, derived.maxPd);
  return hydrated;
}

export function normalizeCombatState(state: Partial<CombatState> | null | undefined): CombatState {
  const combatants = Array.isArray(state?.combatants) ? state.combatants : [];
  return {
    active: Boolean(state?.active && combatants.length),
    round: Math.max(1, toNumber(state?.round, 1)),
    currentInstanceId: String(state?.currentInstanceId || ''),
    updatedAt: String(state?.updatedAt || ''),
    combatants: combatants.map((entry, index) => ({
      order: Math.max(1, toNumber(entry.order, index + 1)),
      instanceId: String(entry.instanceId || `entry-${index + 1}`),
      combatantType: entry.combatantType || 'enemy',
      name: String(entry.name || 'Combatente'),
      subtitle: String(entry.subtitle || ''),
      status: String(entry.status || 'Vivo'),
      initiativeTotal: toNumber(entry.initiativeTotal),
      sourceCharacterId: String(entry.sourceCharacterId || ''),
      sourceCompanionId: String(entry.sourceCompanionId || ''),
      ownerName: String(entry.ownerName || ''),
      image: String(entry.image || ''),
      pvCurrent: clamp(entry.pvCurrent, 0, 9999),
      pvMax: clamp(entry.pvMax, 0, 9999),
      armor: clamp(entry.armor, 0, 999),
      dodge: clamp(entry.dodge, 0, 999),
      block: clamp(entry.block, 0, 999),
      isForm: Boolean(entry.isForm),
      isCurrentTurn: Boolean(entry.isCurrentTurn)
    }))
  };
}
