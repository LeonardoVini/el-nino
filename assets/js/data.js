/**
 * Dados do site: El Niño e o Brasil
 * ---------------------------------------------------------------------------
 * Todos os conjuntos declaram a instituição de origem no campo `fonte`.
 * Os valores foram compilados de boletins e séries publicadas por essas
 * instituições; para uso científico, consulte sempre a fonte primária
 * (ver README.md, seção "Dados e fontes").
 */

/* ===========================================================================
 * 1. ONI, o Oceanic Niño Index (anomalia de TSM na região Niño 3.4)
 * ------------------------------------------------------------------------ */

/** Limiares oficiais de classificação de intensidade (NOAA/CPC). */
export const LIMIARES = {
  neutro: 0.5,
  fraco: 0.5,
  moderado: 1.0,
  forte: 1.5,
  muitoForte: 2.0,
};

/** Classifica um valor de ONI em fase + intensidade. */
export function classificarONI(oni) {
  const m = Math.abs(oni);
  const fase = oni >= LIMIARES.neutro ? 'nino' : oni <= -LIMIARES.neutro ? 'nina' : 'neutro';
  let intensidade = 'neutro';
  if (m >= LIMIARES.muitoForte) intensidade = 'muito forte';
  else if (m >= LIMIARES.forte) intensidade = 'forte';
  else if (m >= LIMIARES.moderado) intensidade = 'moderado';
  else if (m >= LIMIARES.fraco) intensidade = 'fraco';
  return { fase, intensidade };
}

/**
 * ONI do trimestre DJF (dezembro–janeiro–fevereiro), indexado pelo ano de
 * janeiro. DJF é, tipicamente, o trimestre de pico do El Niño, e daí
 * vem o nome dado pelos pescadores peruanos, que associavam o aquecimento ao Natal.
 * Fonte: NOAA / Climate Prediction Center.
 */
export const oniDJF = [
  [1950, -1.5], [1951, -0.8], [1952, 0.5], [1953, 0.4], [1954, 0.8], [1955, -0.7],
  [1956, -1.0], [1957, -0.4], [1958, 1.8], [1959, 0.6], [1960, -0.1], [1961, -0.3],
  [1962, -0.3], [1963, -0.4], [1964, 1.2], [1965, -0.6], [1966, 1.4], [1967, -0.4],
  [1968, -0.6], [1969, 1.0], [1970, 0.6], [1971, -1.4], [1972, -0.7], [1973, 1.8],
  [1974, -1.8], [1975, -0.6], [1976, -1.6], [1977, 0.7], [1978, 0.7], [1979, 0.0],
  [1980, 0.5], [1981, -0.3], [1982, 0.0], [1983, 2.2], [1984, -0.4], [1985, -0.9],
  [1986, -0.5], [1987, 1.2], [1988, 0.8], [1989, -1.7], [1990, 0.1], [1991, 0.4],
  [1992, 1.7], [1993, 0.2], [1994, 0.1], [1995, 1.0], [1996, -0.9], [1997, -0.5],
  [1998, 2.2], [1999, -1.5], [2000, -1.7], [2001, -0.7], [2002, -0.1], [2003, 0.9],
  [2004, 0.4], [2005, 0.6], [2006, -0.9], [2007, 0.7], [2008, -1.6], [2009, -0.8],
  [2010, 1.5], [2011, -1.4], [2012, -0.8], [2013, -0.4], [2014, -0.4], [2015, 0.5],
  [2016, 2.5], [2017, -0.3], [2018, -0.9], [2019, 0.7], [2020, 0.5], [2021, -1.0],
  [2022, -1.0], [2023, -0.7], [2024, 1.8], [2025, -0.6],
].map(([ano, oni]) => ({ ano, oni }));

export const oniDJFMeta = {
  fonte: 'NOAA / Climate Prediction Center, Oceanic Niño Index (Niño 3.4)',
  url: 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php',
  nota: 'Anomalia de temperatura da superfície do mar na região Niño 3.4 (5°N–5°S, 170°W–120°W), média móvel de 3 meses, trimestre DJF.',
};

/**
 * Evolução trimestral dos quatro El Niños mais intensos já medidos.
 * Cada série começa em AMJ do primeiro ano e termina em MJJ do ano seguinte.
 * Fonte: NOAA / CPC (ONI, médias móveis de 3 meses).
 */
export const trimestres = ['AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ', 'DJF', 'JFM', 'FMA', 'MAM', 'AMJ+', 'MJJ+'];

export const eventosEvolucao = [
  {
    id: '1982',
    rotulo: '1982–83',
    valores: [0.5, 0.7, 1.0, 1.5, 1.9, 2.1, 2.2, 2.2, 2.2, 1.9, 1.5, 1.2, 0.9, 0.6],
  },
  {
    id: '1997',
    rotulo: '1997–98',
    valores: [1.2, 1.6, 1.9, 2.1, 2.3, 2.4, 2.4, 2.4, 2.2, 1.8, 1.4, 1.0, 0.5, -0.1],
  },
  {
    id: '2015',
    rotulo: '2015–16',
    valores: [0.9, 1.0, 1.2, 1.5, 1.9, 2.2, 2.4, 2.6, 2.5, 2.2, 1.7, 1.0, 0.5, 0.0],
  },
  {
    id: '2023',
    rotulo: '2023–24',
    valores: [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 1.9, 2.0, 1.8, 1.5, 1.2, 0.8, 0.4, 0.0],
  },
];

/** Ranking dos eventos por pico do ONI (maior valor trimestral do evento). */
export const eventosRanking = [
  { rotulo: '2015–16', pico: 2.6 },
  { rotulo: '1997–98', pico: 2.4 },
  { rotulo: '1982–83', pico: 2.2 },
  { rotulo: '1972–73', pico: 2.1 },
  { rotulo: '1965–66', pico: 2.0 },
  { rotulo: '2023–24', pico: 2.0 },
  { rotulo: '1957–58', pico: 1.8 },
  { rotulo: '1987–88', pico: 1.7 },
  { rotulo: '1991–92', pico: 1.7 },
  { rotulo: '2009–10', pico: 1.6 },
];

/* ===========================================================================
 * 2. Regiões de monitoramento no Pacífico
 * ------------------------------------------------------------------------ */

/** Caixas Niño em [lonOeste, lonLeste, latSul, latNorte], graus. */
export const regioesNino = [
  { id: 'nino4', nome: 'Niño 4', caixa: [160, -150, -5, 5], desc: 'Pacífico oeste-central' },
  { id: 'nino34', nome: 'Niño 3.4', caixa: [-170, -120, -5, 5], desc: 'Região de referência do ONI', principal: true },
  { id: 'nino3', nome: 'Niño 3', caixa: [-150, -90, -5, 5], desc: 'Pacífico leste' },
  { id: 'nino12', nome: 'Niño 1+2', caixa: [-90, -80, -10, 0], desc: 'Costa do Peru e Equador' },
];

/* ===========================================================================
 * 3. Assinatura climática do El Niño no Brasil
 * ------------------------------------------------------------------------ */

/**
 * Composição dos desvios típicos observados em episódios fortes de El Niño.
 * Os intervalos refletem a variação entre eventos: nenhum El Niño se repete
 * igual, e o sinal é mais confiável no Sul e no Norte/Nordeste.
 * Fontes: INPE/CPTEC, INMET, IRI/Columbia.
 */
export const regioesBrasil = {
  norte: {
    nome: 'Norte',
    sigla: 'N',
    chuva: -30,
    chuvaFaixa: [-45, -15],
    temperatura: 1.5,
    confianca: 'alta',
    estacao: 'Jun–Nov (estação seca amazônica)',
    resumo:
      'Seca severa. O ramo descendente da célula de Walker deslocada inibe a formação de nuvens sobre a Amazônia oriental e central, justamente quando a estação seca já está no auge.',
    impactos: [
      'Rios em mínimas históricas: navegação interrompida e comunidades ribeirinhas isoladas',
      'Incêndios florestais em floresta úmida, que normalmente não queima',
      'Mortandade de peixes e de botos em lagos superaquecidos',
      'Queda da geração hidrelétrica no rio Madeira e no Tapajós',
    ],
  },
  nordeste: {
    nome: 'Nordeste',
    sigla: 'NE',
    chuva: -35,
    chuvaFaixa: [-50, -20],
    temperatura: 1.2,
    confianca: 'alta',
    estacao: 'Fev–Mai (quadra chuvosa do semiárido)',
    resumo:
      'Seca na quadra chuvosa. A Zona de Convergência Intertropical (ZCIT) fica retida mais ao norte e demora a descer sobre o semiárido. A chuva que deveria cair entre fevereiro e maio simplesmente não vem.',
    impactos: [
      'Perda da safra de sequeiro: milho, feijão e mandioca de subsistência',
      'Reservatórios abaixo do volume morto e colapso do abastecimento urbano',
      'Mortalidade de rebanhos e perda de pasto na Caatinga',
      'Pressão migratória e insegurança alimentar no semiárido',
    ],
  },
  'centro-oeste': {
    nome: 'Centro-Oeste',
    sigla: 'CO',
    chuva: -10,
    chuvaFaixa: [-25, 5],
    temperatura: 1.3,
    confianca: 'baixa',
    estacao: 'Sinal irregular ao longo do ano',
    resumo:
      'Sinal fraco e irregular na chuva, mas forte no calor. A região fica entre dois regimes opostos, o Sul encharcado e o Norte seco, e o resultado depende de cada evento.',
    impactos: [
      'Veranicos (períodos secos dentro da estação chuvosa) que atrasam o plantio da soja',
      'Atraso na safrinha de milho, semeada fora da janela ideal',
      'Ondas de calor e alta demanda de irrigação',
      'Estiagem no norte do Pantanal, favorecendo grandes incêndios',
    ],
  },
  sudeste: {
    nome: 'Sudeste',
    sigla: 'SE',
    chuva: 5,
    chuvaFaixa: [-15, 20],
    temperatura: 1.4,
    confianca: 'baixa',
    estacao: 'Sinal irregular; calor mais provável na primavera-verão',
    resumo:
      'A região de transição. A chuva pode ficar acima ou abaixo da média conforme o evento, mas as ondas de calor são consistentes: os recordes de temperatura do Brasil vêm caindo em anos de El Niño.',
    impactos: [
      'Ondas de calor intensas e prolongadas, com recordes de temperatura',
      'Chuvas concentradas em eventos extremos, com deslizamentos',
      'Estresse térmico no café e na cana-de-açúcar',
      'Aumento de casos de dengue com o calor e a chuva irregular',
    ],
  },
  sul: {
    nome: 'Sul',
    sigla: 'S',
    chuva: 45,
    chuvaFaixa: [25, 70],
    temperatura: 0.8,
    confianca: 'alta',
    estacao: 'Set–Dez (primavera) e Mai–Jul',
    resumo:
      'Chuva muito acima da média. O jato subtropical se intensifica e segura as frentes frias sobre a região, que passam a descarregar chuva por dias seguidos no mesmo lugar.',
    impactos: [
      'Enchentes urbanas e de grandes bacias, com desalojados em massa',
      'Perda de qualidade e quebra na colheita do trigo pela chuva',
      'Atraso na colheita da soja e na semeadura do milho',
      'Ganho de produtividade quando a chuva chega sem excesso',
    ],
  },
};

export const ordemRegioes = ['norte', 'nordeste', 'centro-oeste', 'sudeste', 'sul'];

/**
 * Matriz de impacto por setor e região em um El Niño forte.
 * Escala: −3 (impacto muito negativo) a +2 (impacto positivo).
 * Síntese qualitativa a partir de relatórios da Conab, ONS, Embrapa,
 * Ministério da Saúde e Cemaden.
 */
export const matrizImpacto = {
  setores: ['Agricultura', 'Energia', 'Água', 'Saúde', 'Transporte', 'Ecossistemas'],
  valores: {
    norte: [-2, -3, -3, -2, -3, -3],
    nordeste: [-3, -2, -3, -2, -1, -2],
    'centro-oeste': [-1, -1, -1, -1, -1, -2],
    sudeste: [-1, 0, -1, -2, 0, -1],
    sul: [-1, 2, 1, -1, -1, -1],
  },
  legenda: {
    '-3': 'Impacto severo',
    '-2': 'Impacto alto',
    '-1': 'Impacto moderado',
    0: 'Sem sinal claro',
    1: 'Efeito favorável',
    2: 'Efeito muito favorável',
  },
};

/* ===========================================================================
 * 4. O evento de 2023–24 em números
 * ------------------------------------------------------------------------ */

export const indicadores2324 = [
  {
    valor: '12,70',
    unidade: 'm',
    rotulo: 'Rio Negro em Manaus',
    detalhe: 'Menor nível desde o início das medições, em 1902 (26/10/2023). Em 04/10/2024 o recorde caiu de novo, para 12,66 m.',
    fonte: 'Porto de Manaus / SGB-CPRM',
    tom: 'critico',
  },
  {
    valor: '44,8',
    unidade: '°C',
    rotulo: 'Maior temperatura já medida no Brasil',
    detalhe: 'Araçuaí (MG), em 19/11/2023, durante a onda de calor que levou a sensação térmica no Rio de Janeiro a 59,7 °C.',
    fonte: 'INMET',
    tom: 'critico',
  },
  {
    valor: '6,6',
    unidade: 'milhões',
    rotulo: 'Casos prováveis de dengue em 2024',
    detalhe: 'Maior epidemia já registrada no país, favorecida pelo calor recorde e pela chuva fora de época.',
    fonte: 'Ministério da Saúde',
    tom: 'critico',
  },
  {
    valor: '1,55',
    unidade: '°C',
    rotulo: 'Aquecimento global em 2024',
    detalhe: 'Acima da média pré-industrial (1850–1900): o ano mais quente já registrado, com o El Niño somando calor ao aquecimento de fundo.',
    fonte: 'Organização Meteorológica Mundial',
    tom: 'critico',
  },
];

/**
 * Nível mínimo anual do rio Negro no porto de Manaus em anos marcantes.
 * A régua de Manaus é uma das séries hidrológicas mais longas do mundo,
 * medida continuamente desde 1902.
 * Fonte: Porto de Manaus / Serviço Geológico do Brasil (SGB-CPRM).
 */
export const rioNegro = [
  { ano: 1963, nivel: 13.64, oni: 'neutro' },
  { ano: 1998, nivel: 14.34, oni: 'nino' },
  { ano: 2005, nivel: 14.75, oni: 'neutro' },
  { ano: 2010, nivel: 13.63, oni: 'nino' },
  { ano: 2016, nivel: 14.61, oni: 'nino' },
  { ano: 2020, nivel: 17.60, oni: 'nina' },
  { ano: 2023, nivel: 12.70, oni: 'nino', destaque: true },
  { ano: 2024, nivel: 12.66, oni: 'nino', destaque: true },
];

export const rioNegroMeta = {
  fonte: 'Porto de Manaus / SGB-CPRM',
  nota: 'Nível mínimo atingido no ano, em metros na régua do porto de Manaus. A cota média de seca fica em torno de 17–18 m.',
};

/* ===========================================================================
 * 5. Linha do tempo
 * ------------------------------------------------------------------------ */

export const linhaDoTempo = [
  {
    periodo: '1877–79',
    titulo: 'A Grande Seca',
    oni: null,
    texto:
      'O El Niño de 1877–78, combinado a um Atlântico Norte anormalmente quente, produziu a pior seca da história do Nordeste. As estimativas de mortes no Ceará e nos estados vizinhos vão de centenas de milhares a meio milhão de pessoas. Foi o evento que colocou a seca no centro da política brasileira e levou à criação dos primeiros órgãos de combate à estiagem.',
    tags: ['Nordeste', 'Seca', 'Fome'],
  },
  {
    periodo: '1982–83',
    titulo: 'O El Niño que ninguém viu chegar',
    oni: 2.2,
    texto:
      'O evento cresceu sem ser detectado: os satélites da época foram enganados pela poeira da erupção do El Chichón e a rede de boias ainda não existia. No Brasil, o Nordeste entrou no quinto ano de seca enquanto Santa Catarina vivia a maior enchente do século: em julho de 1983, o rio Itajaí-Açu chegou a 15,34 m em Blumenau. Foi esse fracasso que motivou a construção da rede de monitoramento do Pacífico.',
    tags: ['Sul', 'Nordeste', 'Enchente'],
  },
  {
    periodo: '1997–98',
    titulo: 'O El Niño do século',
    oni: 2.4,
    texto:
      'O primeiro grande evento previsto com meses de antecedência pela rede de boias TAO/TRITON. Roraima ardeu: o fogo, iniciado em áreas de savana, avançou por milhares de quilômetros quadrados de floresta amazônica em fevereiro e março de 1998. O Nordeste perdeu a quadra chuvosa e o Sul registrou chuvas extremas.',
    tags: ['Norte', 'Incêndios', 'Previsão'],
  },
  {
    periodo: '2015–16',
    titulo: 'O mais intenso já medido',
    oni: 2.6,
    texto:
      'ONI de +2,6 °C, o maior da série iniciada em 1950. No Nordeste, agravou a pior seca plurianual em décadas, que se arrastou de 2012 a 2017. Globalmente, empurrou 2016 ao posto de ano mais quente até então e desencadeou o terceiro evento global de branqueamento de corais.',
    tags: ['Nordeste', 'Recorde', 'Corais'],
  },
  {
    periodo: '2023–24',
    titulo: 'A seca dos rios amazônicos',
    oni: 2.0,
    texto:
      'Um El Niño forte sobre um oceano já aquecido pela mudança climática. O rio Negro bateu o recorde de seca em 1902–2023 e o quebrou de novo em 2024; todos os 62 municípios do Amazonas decretaram emergência; cerca de 200 botos morreram no lago Tefé, onde a água passou de 39 °C. No Sul, o Rio Grande do Sul enfrentou enchentes sucessivas a partir de setembro de 2023, culminando na catástrofe de maio de 2024.',
    tags: ['Norte', 'Sul', 'Recorde'],
  },
];

/* ===========================================================================
 * 6. Ecossistemas
 * ------------------------------------------------------------------------ */

export const ecossistemas = [
  {
    id: 'amazonia',
    nome: 'Amazônia',
    icone: 'floresta',
    chamada: 'A floresta que vira fonte de carbono',
    texto:
      'Em anos de El Niño, a Amazônia troca de papel: o estresse hídrico mata árvores, reduz a fotossíntese e alimenta incêndios, e a floresta chega a emitir mais carbono do que absorve. A seca de 2023–24 secou rios inteiros, isolou comunidades que só se deslocam por água e matou peixes e botos em lagos superaquecidos.',
    dados: [
      ['Área queimada no Brasil em 2024', '30,8 milhões de ha (+79% sobre 2023)'],
      ['Municípios do Amazonas em emergência', '62 de 62, em outubro de 2023'],
      ['Temperatura da água no lago Tefé', 'acima de 39 °C, em setembro de 2023'],
    ],
    fonte: 'MapBiomas Fogo, Defesa Civil do Amazonas, Instituto Mamirauá',
  },
  {
    id: 'caatinga',
    nome: 'Caatinga',
    icone: 'seca',
    chamada: 'O bioma que já vive no limite',
    texto:
      'A Caatinga é adaptada à seca: as plantas perdem as folhas e esperam. O problema é a duração: quando o El Niño encurta a quadra chuvosa vários anos seguidos, a vegetação não consegue se recuperar entre os ciclos, o solo perde cobertura e áreas inteiras avançam para a desertificação. Cerca de 13% do semiárido brasileiro já apresenta processo de degradação severa.',
    dados: [
      ['Quadra chuvosa concentrada em', 'fevereiro a maio; sem ela, não há segunda chance'],
      ['Seca plurianual mais recente', '2012–2017, a mais longa em registros modernos'],
      ['População no semiárido', 'cerca de 28 milhões de pessoas'],
    ],
    fonte: 'Funceme, INSA, Ministério do Meio Ambiente',
  },
  {
    id: 'recifes',
    nome: 'Recifes de coral',
    icone: 'coral',
    chamada: 'Branqueamento em escala global',
    texto:
      'O coral expulsa as algas que vivem dentro dele quando a água passa do limite térmico por semanas seguidas. Perde a cor e, se o calor persistir, morre. O El Niño de 2023–24 ajudou a desencadear o quarto evento global de branqueamento, declarado em abril de 2024. No Brasil, os recifes de Abrolhos e do litoral nordestino registraram branqueamento severo.',
    dados: [
      ['Eventos globais de branqueamento', '1998, 2010, 2014–17 e 2023–24'],
      ['Recifes brasileiros afetados em 2024', 'Abrolhos, Costa dos Corais e litoral do Nordeste'],
      ['Limite térmico típico', 'cerca de 1 °C acima da máxima normal de verão'],
    ],
    fonte: 'NOAA Coral Reef Watch, ICMBio',
  },
  {
    id: 'pesca',
    nome: 'Pesca e oceano',
    icone: 'peixe',
    chamada: 'Onde o El Niño foi descoberto',
    texto:
      'Foram pescadores peruanos que deram nome ao fenômeno. O El Niño desliga a ressurgência que traz nutrientes das profundezas para a costa do Peru, o fitoplâncton some e a anchoveta, a maior pescaria do mundo em volume, colapsa. Como a anchoveta vira farinha de peixe, o efeito chega ao Brasil no preço da ração de aves, suínos e da aquicultura.',
    dados: [
      ['Colapsos históricos da anchoveta', '1972–73, 1982–83, 1997–98 e 2023'],
      ['Temporada de pesca cancelada', 'primeira safra de 2023, no Peru'],
      ['Efeito no Brasil', 'alta no custo da farinha de peixe e da ração'],
    ],
    fonte: 'IMARPE, FAO',
  },
  {
    id: 'pantanal',
    nome: 'Pantanal',
    icone: 'fogo',
    chamada: 'A planície que secou e queimou',
    texto:
      'O Pantanal depende da água que desce do planalto na cheia anual. Quando a chuva falha nas cabeceiras, a inundação não acontece, a turfa do solo seca e o fogo deixa de ser superficial: queima por baixo, por semanas, e é quase impossível de apagar. Em 2024 o bioma teve o pior junho de incêndios da série histórica.',
    dados: [
      ['Pior ano de fogo recente', '2020 e 2024'],
      ['Junho de 2024', 'recorde de focos de calor para o mês na série do INPE'],
      ['Causa imediata', 'cheia ausente + vegetação seca + ignição humana'],
    ],
    fonte: 'INPE/Programa Queimadas, Embrapa Pantanal',
  },
  {
    id: 'mata-atlantica',
    nome: 'Mata Atlântica e o Sul',
    icone: 'chuva',
    chamada: 'Chuva demais, rápido demais',
    texto:
      'No outro extremo do país, o excesso de chuva também é um problema ecológico. Encostas saturadas deslizam, rios carregam sedimento e esgoto para estuários e manguezais, e a água doce em excesso altera a salinidade das lagoas costeiras. A enchente de maio de 2024 no Rio Grande do Sul atingiu 478 municípios e cerca de 2,3 milhões de pessoas.',
    dados: [
      ['Enchente de maio de 2024 no RS', '478 municípios atingidos, 183 mortes'],
      ['Setembro de 2023, Vale do Taquari', '54 mortes em um único ciclone extratropical'],
      ['Mecanismo', 'jato subtropical reforçado que trava as frentes frias'],
    ],
    fonte: 'Defesa Civil do RS, INMET',
  },
];

/* ===========================================================================
 * 7. Como se mede
 * ------------------------------------------------------------------------ */

export const instrumentos = [
  {
    nome: 'Rede de boias TAO/TRITON',
    desde: '1985–1994',
    texto:
      'Cerca de 70 boias fundeadas no Pacífico equatorial medem temperatura da superfície até 500 m de profundidade, vento, umidade e radiação, e transmitem por satélite todos os dias. Foi a resposta direta ao fracasso de 1982–83.',
  },
  {
    nome: 'Satélites de altimetria',
    desde: '1992',
    texto:
      'De TOPEX/Poseidon ao Sentinel-6, os altímetros medem a altura do mar com precisão de centímetros. Água quente ocupa mais volume: uma língua de mar alto avançando para leste é a assinatura inconfundível de um El Niño nascendo.',
  },
  {
    nome: 'Perfiladores Argo',
    desde: '2000',
    texto:
      'Quase 4 mil flutuadores autônomos mergulham a 2.000 m e sobem a cada 10 dias medindo temperatura e salinidade. Eles mostram onde está o calor que ainda não apareceu na superfície.',
  },
  {
    nome: 'Índice de Oscilação Sul (IOS)',
    desde: '1924',
    texto:
      'A diferença de pressão atmosférica entre o Taiti e Darwin, na Austrália. IOS fortemente negativo significa alísios enfraquecidos. É a metade atmosférica do fenômeno, medida desde muito antes dos satélites.',
  },
];

export const orgaos = [
  { sigla: 'INPE/CPTEC', papel: 'Previsão climática sazonal e monitoramento de queimadas', url: 'https://www.cptec.inpe.br/' },
  { sigla: 'INMET', papel: 'Rede de estações meteorológicas e avisos de perigo', url: 'https://portal.inmet.gov.br/' },
  { sigla: 'Cemaden', papel: 'Alertas de desastres naturais e monitoramento de secas', url: 'https://www.gov.br/cemaden/' },
  { sigla: 'ANA', papel: 'Situação dos reservatórios e dos rios', url: 'https://www.gov.br/ana/' },
  { sigla: 'Funceme', papel: 'Previsão da quadra chuvosa no Ceará e no semiárido', url: 'http://www.funceme.br/' },
  { sigla: 'SGB-CPRM', papel: 'Níveis dos rios e alertas hidrológicos', url: 'https://www.sgb.gov.br/' },
  { sigla: 'NOAA/CPC', papel: 'Boletim oficial do ENOS e valores do ONI', url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/' },
  { sigla: 'OMM', papel: 'Boletins globais de El Niño/La Niña', url: 'https://wmo.int/topics/el-nino-la-nina' },
];

/* ===========================================================================
 * 8. Adaptação
 * ------------------------------------------------------------------------ */

export const adaptacao = [
  {
    prazo: 'Meses antes',
    titulo: 'Previsão vira decisão',
    itens: [
      'Ajuste do calendário e da cultivar de plantio a partir do prognóstico sazonal',
      'Recarga preventiva de reservatórios e remanejamento de geração no sistema elétrico',
      'Reforço de estoques estratégicos de alimento e de água no semiárido',
    ],
  },
  {
    prazo: 'Semanas antes',
    titulo: 'Alerta e preparação',
    itens: [
      'Avisos do INMET e do Cemaden para chuva intensa, calor e estiagem',
      'Mapeamento de áreas de risco e planos de evacuação em encostas e várzeas',
      'Campanhas contra o Aedes antes do pico de calor e chuva',
    ],
  },
  {
    prazo: 'Durante',
    titulo: 'Resposta',
    itens: [
      'Operação carro-pipa, dessalinizadores e cisternas no Nordeste',
      'Dragagem e balizamento emergencial dos rios amazônicos',
      'Brigadas de incêndio pré-posicionadas na Amazônia e no Pantanal',
    ],
  },
  {
    prazo: 'Entre eventos',
    titulo: 'Reduzir a vulnerabilidade',
    itens: [
      'Cisternas, barragens subterrâneas e agricultura adaptada ao semiárido',
      'Saída de áreas de risco e drenagem urbana dimensionada para extremos',
      'Combate ao desmatamento, que amplifica a seca amazônica',
    ],
  },
];

/* ===========================================================================
 * 9. Referências
 * ------------------------------------------------------------------------ */

export const referencias = [
  {
    autor: 'NOAA / Climate Prediction Center',
    titulo: 'Cold & Warm Episodes by Season (ONI)',
    url: 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php',
  },
  {
    autor: 'NOAA Climate.gov',
    titulo: 'ENSO Blog: explicações técnicas acessíveis sobre o fenômeno',
    url: 'https://www.climate.gov/news-features/department/enso-blog',
  },
  {
    autor: 'Organização Meteorológica Mundial',
    titulo: 'El Niño/La Niña Update e State of the Global Climate',
    url: 'https://wmo.int/topics/el-nino-la-nina',
  },
  {
    autor: 'INPE / CPTEC',
    titulo: 'Monitoramento e prognóstico climático do El Niño no Brasil',
    url: 'https://www.cptec.inpe.br/',
  },
  {
    autor: 'INMET',
    titulo: 'Boletins agroclimatológicos e séries históricas',
    url: 'https://portal.inmet.gov.br/',
  },
  {
    autor: 'Serviço Geológico do Brasil (SGB-CPRM)',
    titulo: 'Boletins de monitoramento hidrológico da Amazônia',
    url: 'https://www.sgb.gov.br/',
  },
  {
    autor: 'MapBiomas Fogo',
    titulo: 'Área queimada no Brasil por bioma e por ano',
    url: 'https://brasil.mapbiomas.org/',
  },
  {
    autor: 'Ministério da Saúde',
    titulo: 'Painel de arboviroses: casos de dengue',
    url: 'https://www.gov.br/saude/',
  },
];

/* ===========================================================================
 * 10. Simulador: como o desvio esperado escala com a intensidade
 * ------------------------------------------------------------------------ */

/**
 * Os desvios tabulados em `regioesBrasil` correspondem a um evento forte,
 * com pico de ONI perto de +1,8 °C. O simulador reescala linearmente a partir
 * desse ponto de referência. É uma aproximação didática: serve para mostrar
 * o sentido e a ordem de grandeza do sinal, não para prever um evento real.
 */
export const ONI_REFERENCIA = 1.8;

/** Abaixo deste valor absoluto o ENOS é considerado neutro e não há sinal. */
export const ONI_NEUTRO = 0.5;

/**
 * A resposta da temperatura não é simétrica. O El Niño aquece o Brasil com
 * mais força do que a La Niña o esfria, e sobre um clima de fundo cada vez
 * mais quente o resfriamento aparece menos ainda: anos de La Niña seguem
 * quentes em termos absolutos. Este fator amortece o lado frio da escala.
 * Já o sinal de chuva inverte de forma razoavelmente simétrica, e por isso
 * não é amortecido.
 */
export const AMORTECIMENTO_FRIO = 0.55;

/**
 * Desvio esperado de chuva e temperatura numa região, para um dado ONI.
 * O sinal inverte na La Niña: onde o El Niño seca, a La Niña encharca.
 */
export function projetarRegiao(regiao, oni) {
  if (Math.abs(oni) < ONI_NEUTRO) {
    return { chuva: 0, temperatura: 0, neutro: true };
  }
  const fator = oni / ONI_REFERENCIA;
  const fatorTermico = oni < 0 ? fator * AMORTECIMENTO_FRIO : fator;
  return {
    chuva: regiao.chuva * fator,
    temperatura: regiao.temperatura * fatorTermico,
    neutro: false,
  };
}

/* ===========================================================================
 * 11. Quiz
 * ---------------------------------------------------------------------------
 * `porQueNao` traz, para cada alternativa errada, o motivo pelo qual ela não
 * serve. Errar só ensina quando o leitor descobre onde o raciocínio saiu do
 * trilho. `ancora` aponta a seção que explica o ponto, para quem quiser
 * revisar antes de seguir.
 * ------------------------------------------------------------------------ */

export const perguntasQuiz = [
  {
    pergunta: 'O que acontece com os ventos alísios durante um El Niño?',
    opcoes: [
      'Ficam mais fortes e empurram ainda mais água para oeste',
      'Enfraquecem, e no Pacífico oeste chegam a inverter de sentido',
      'Mudam de direção e passam a soprar do sul para o norte',
    ],
    correta: 1,
    porQueNao: [
      'Alísios mais fortes são a marca da La Niña, a fase oposta: é ela que empilha ainda mais água quente no oeste.',
      null,
      'Os alísios são ventos zonais, ou seja, sopram no sentido leste-oeste. O que muda no El Niño é a força, não o eixo.',
    ],
    explicacao:
      'O enfraquecimento dos alísios é o gatilho de todo o resto. Sem eles segurando a água quente no oeste, ela escorrega de volta para leste, a termoclina se nivela e a ressurgência desliga.',
    ancora: 'como-ocorre',
    revisar: 'o corte do Pacífico, no Capítulo 2',
  },
  {
    pergunta: 'Qual região do Brasil costuma receber chuva acima da média em um El Niño forte?',
    opcoes: ['Nordeste', 'Norte', 'Sul'],
    correta: 2,
    porQueNao: [
      'No Nordeste acontece o contrário: a ZCIT fica retida ao norte e a quadra chuvosa de fevereiro a maio falha.',
      'O Norte é a região que mais seca: o ramo descendente da circulação de Walker se instala sobre a Amazônia.',
      null,
    ],
    explicacao:
      'O jato subtropical se intensifica e trava as frentes frias sobre o Sul. A mesma frente que passaria em um dia fica parada e chove por uma semana, com desvios de 25% a 70% acima da média na primavera.',
    ancora: 'brasil',
    revisar: 'o mapa por região, no Capítulo 4',
  },
  {
    pergunta: 'O que o ONI mede, exatamente?',
    opcoes: [
      'A diferença de pressão atmosférica entre o Taiti e Darwin',
      'A anomalia de temperatura da superfície do mar na região Niño 3.4',
      'A altura média das ondas no Pacífico equatorial',
    ],
    correta: 1,
    porQueNao: [
      'Essa é a definição do IOS, o Índice de Oscilação Sul. Ele mede a metade atmosférica do fenômeno; o ONI mede a metade oceânica.',
      null,
      'A altura do mar é medida por satélite e ajuda a detectar o evento, mas não é o que define o índice: o ONI é temperatura.',
    ],
    explicacao:
      'O ONI é a anomalia de temperatura do mar no Niño 3.4, em média móvel de três meses. A diferença de pressão entre o Taiti e Darwin é o IOS, que mede a metade atmosférica do mesmo fenômeno.',
    ancora: 'medir',
    revisar: 'como se mede um oceano inteiro, no Capítulo 3',
  },
  {
    pergunta: 'Qual foi o El Niño mais intenso já medido desde 1950?',
    opcoes: ['1997–98', '2015–16', '2023–24'],
    correta: 1,
    porQueNao: [
      'O de 1997–98 chegou a +2,4 °C e foi o primeiro previsto com antecedência, mas não é o recordista da série.',
      null,
      'O de 2023–24 parou em +2,0 °C. Bateu recordes de impacto, e não de intensidade: caiu sobre um planeta já mais quente.',
    ],
    explicacao:
      'O evento de 2015–16 chegou a +2,6 °C no pico do ONI. O de 1997–98 ficou em +2,4 °C e o de 2023–24, em +2,0 °C. Intensidade no Pacífico, porém, não se traduz direto em intensidade de impacto no Brasil.',
    ancora: 'medir',
    revisar: 'o ranking dos eventos, no Capítulo 3',
  },
  {
    pergunta: 'Em outubro de 2023 o rio Negro chegou a 12,70 m em Manaus. Por que isso foi notícia?',
    opcoes: [
      'Foi a maior cheia registrada na cidade',
      'Foi o menor nível desde o início das medições, em 1902',
      'Foi a primeira vez que o nível do rio foi medido com precisão',
    ],
    correta: 1,
    porQueNao: [
      'Foi o oposto de cheia: 12,70 m é nível de seca extrema. A cota média de estiagem fica em torno de 17 a 18 m.',
      null,
      'A régua do porto de Manaus é lida continuamente desde 1902, o que faz dela uma das séries hidrológicas mais longas do mundo.',
    ],
    explicacao:
      'Foi o recorde de seca em mais de um século de leituras da régua do porto de Manaus. E o recorde caiu de novo no ano seguinte: 12,66 m em outubro de 2024.',
    ancora: 'caso',
    revisar: 'o caso de 2023–24, no Capítulo 5',
  },
  {
    pergunta: 'Por que a Amazônia seca durante um El Niño?',
    opcoes: [
      'Porque o ar que desce sobre a região impede a formação de nuvens',
      'Porque o desmatamento sempre aumenta nesses anos',
      'Porque as nascentes dos rios congelam nos Andes',
    ],
    correta: 0,
    porQueNao: [
      null,
      'O desmatamento agrava a seca e é causa humana, não consequência do El Niño. São dois problemas que se somam, e não um que produz o outro.',
      'A Amazônia é alimentada principalmente pela chuva na própria bacia, e o degelo andino não tem esse papel. Nada congela por causa do El Niño.',
    ],
    explicacao:
      'A circulação de Walker se reorganiza e instala um ramo descendente sobre a Amazônia e o norte da América do Sul. Ar que desce aquece, seca e não forma nuvem, bem quando a estação seca já está no auge.',
    ancora: 'como-ocorre',
    revisar: 'os dois caminhos até o Brasil, no Capítulo 2',
  },
  {
    pergunta: 'O que costuma acontecer depois de um El Niño forte?',
    opcoes: [
      'Outro El Niño, sempre mais forte que o anterior',
      'Um período neutro que dura cerca de dez anos',
      'Uma La Niña, porque o sistema tende a passar do ponto',
    ],
    correta: 2,
    porQueNao: [
      'Não há escada de intensidade. Os eventos não se sucedem em ordem crescente, e o intervalo entre eles varia de dois a sete anos.',
      'Períodos neutros existem, mas nada perto de uma década fixa. O sistema oscila de forma irregular.',
      null,
    ],
    explicacao:
      'Ondas de Rossby refletidas na borda oeste do Pacífico trazem água fria de volta. O sistema raramente para no equilíbrio: costuma ultrapassar e virar La Niña no ano seguinte.',
    ancora: 'como-ocorre',
    revisar: 'a etapa final do mecanismo, no Capítulo 2',
  },
  {
    pergunta: 'De onde vem o nome “El Niño”?',
    opcoes: [
      'Do sobrenome do oceanógrafo que descreveu o fenômeno',
      'De pescadores peruanos, que associavam a água quente ao Natal',
      'De uma expressão indígena andina que significa “mar morno”',
    ],
    correta: 1,
    porQueNao: [
      'O nome não homenageia ninguém. Gilbert Walker, que descreveu a metade atmosférica, deu nome à circulação, não ao fenômeno.',
      null,
      'A expressão é espanhola e religiosa: El Niño é o Menino Jesus, pela chegada da água quente por volta do Natal.',
    ],
    explicacao:
      'El Niño é o Menino Jesus. Pescadores do norte do Peru notaram, no século XIX, que em certos anos a água quente chegava por volta do Natal e a pescaria sumia. Só muito depois se descobriu que aquilo era a ponta de um fenômeno planetário.',
    ancora: 'o-que-e',
    revisar: 'a origem do nome, no Capítulo 1',
  },
];

/* ===========================================================================
 * 12. Oferta do material para professores
 * ------------------------------------------------------------------------ */

/**
 * ÚNICO LUGAR A EDITAR PARA COLOCAR O PRODUTO NO AR.
 *
 * Troque `url` pelo link de checkout da Hotmart, que fica em
 * Produto > Links de divulgação, e ajuste preço e parcelamento.
 *
 * Enquanto o endereço continuar com o texto de exemplo, a seção de venda
 * simplesmente não aparece no site. É de propósito: melhor não ter seção do
 * que ter um botão de compra que leva a lugar nenhum.
 */
export const oferta = {
  url: 'https://pay.hotmart.com/TROQUE-PELO-SEU-CODIGO',
  preco: 'R$ 47',
  parcelamento: 'ou 3x sem juros',
  titulo: 'Este site é a aula. O kit é como dar essa aula.',
  chamada:
    'Tudo o que está aqui continua livre e sem custo. O que se paga é o tempo ' +
    'de preparação que o kit devolve: plano minutado, slides prontos, ficha ' +
    'para fotocopiar e prova com gabarito comentado.',
  itens: [
    'Dois planos de aula de 50 minutos, com passo a passo minutado e os erros que a turma costuma cometer',
    '20 slides em PDF widescreen, prontos para projetar',
    'Roteiro de atividade prática com o simulador 3D desta página',
    'Ficha do aluno e mapa mudo do Brasil, liberados para fotocopiar',
    '15 questões, sendo 12 de múltipla escolha no estilo ENEM',
    'Gabarito comentado, explicando o erro típico de cada alternativa',
    'De bônus, o guia completo de 35 páginas com os 9 infográficos',
  ],
  rodape:
    'Pagamento e nota fiscal pela Hotmart. Arquivos em PDF, para baixar na hora. ' +
    'Uso liberado em todas as suas turmas.',
};

/** A seção só entra no ar depois que o endereço de verdade for colocado. */
export const ofertaPronta = () => !oferta.url.includes('TROQUE-PELO-SEU-CODIGO');

/* ===========================================================================
 * 13. Glossário
 * ---------------------------------------------------------------------------
 * `variacoes` lista as formas como o termo aparece no texto corrido. A
 * primeira ocorrência de cada uma vira um botão que abre a definição no
 * próprio lugar, sem tirar o leitor da frase.
 * ------------------------------------------------------------------------ */

export const glossario = [
  {
    id: 'alisios',
    termo: 'Ventos alísios',
    variacoes: ['ventos alísios', 'alísios'],
    definicao:
      'Ventos constantes que sopram de leste para oeste ao longo do equador. São eles que empurram a água aquecida pelo sol para o lado da Indonésia e sustentam o estado normal do Pacífico.',
  },
  {
    id: 'termoclina',
    termo: 'Termoclina',
    variacoes: ['termoclina'],
    definicao:
      'A camada onde a temperatura da água cai rápido com a profundidade: a fronteira entre a água morna de cima e a água fria de baixo. Quanto mais rasa ela estiver, mais fácil é a água fria chegar à superfície.',
  },
  {
    id: 'ressurgencia',
    termo: 'Ressurgência',
    variacoes: ['ressurgência'],
    definicao:
      'A subida de água fria e rica em nutrientes das profundezas para a superfície. Na costa do Peru é ela que sustenta uma das maiores pescarias do mundo, e é ela que o El Niño desliga.',
  },
  {
    id: 'walker',
    termo: 'Circulação de Walker',
    variacoes: ['circulação de Walker', 'célula de Walker'],
    definicao:
      'O anel de ar que sobe sobre o Pacífico oeste quente, viaja para leste nas alturas, desce sobre o Pacífico leste frio e volta rente à água. É a engrenagem atmosférica que o El Niño desmonta.',
  },
  {
    id: 'enos',
    termo: 'ENOS',
    variacoes: ['ENOS'],
    definicao:
      'El Niño–Oscilação Sul: o nome do sistema completo, oceano mais atmosfera. El Niño e La Niña são as duas fases extremas dele.',
  },
  {
    id: 'oni',
    termo: 'ONI',
    variacoes: ['ONI'],
    definicao:
      'Oceanic Niño Index: a anomalia de temperatura da superfície do mar na região Niño 3.4, em média móvel de três meses. É o número que define oficialmente se há El Niño, La Niña ou nada.',
  },
  {
    id: 'nino34',
    termo: 'Região Niño 3.4',
    variacoes: ['Niño 3.4'],
    definicao:
      'Uma caixa no meio do Pacífico equatorial, entre 5°N e 5°S e de 170°W a 120°W. É onde se mede o ONI, porque ali o sinal do oceano se conecta melhor com a resposta da atmosfera.',
  },
  {
    id: 'anomalia',
    termo: 'Anomalia',
    variacoes: ['anomalia'],
    definicao:
      'A diferença entre o valor medido e a média histórica do mesmo lugar e da mesma época do ano. Uma anomalia de +2 °C não quer dizer água a 2 °C, e sim 2 °C acima do normal para aquele mês.',
  },
  {
    id: 'zcit',
    termo: 'Zona de Convergência Intertropical',
    variacoes: ['Zona de Convergência Intertropical', 'ZCIT'],
    definicao:
      'A faixa de nuvens e chuva que circunda o planeta perto do equador, onde os alísios dos dois hemisférios se encontram. Quando ela desce sobre o semiárido, entre fevereiro e maio, chove; quando fica retida ao norte, não.',
  },
  {
    id: 'conveccao',
    termo: 'Convecção',
    variacoes: ['convecção profunda', 'convecção'],
    definicao:
      'O movimento de ar quente e úmido que sobe, esfria e condensa, formando as nuvens altas de chuva tropical. Ela acompanha a água mais quente: é por isso que a chuva se muda de endereço junto com o El Niño.',
  },
  {
    id: 'kelvin',
    termo: 'Onda de Kelvin equatorial',
    variacoes: ['onda de Kelvin equatorial', 'onda de Kelvin'],
    definicao:
      'Um pulso oceânico que viaja para leste ao longo do equador e afunda a termoclina por onde passa. Quase invisível na superfície, leva de dois a três meses para cruzar o Pacífico.',
  },
  {
    id: 'rossby',
    termo: 'Ondas de Rossby',
    variacoes: ['ondas de Rossby'],
    definicao:
      'Ondas oceânicas que viajam no sentido contrário ao da onda de Kelvin, para oeste. Ao refletirem na borda do Pacífico, trazem água fria de volta e ajudam a encerrar o evento.',
  },
  {
    id: 'bjerknes',
    termo: 'Realimentação de Bjerknes',
    variacoes: ['realimentação de Bjerknes'],
    definicao:
      'O círculo em que a causa vira consequência: alísios fracos aquecem o leste, o aquecimento desloca a chuva, a chuva deslocada enfraquece mais os alísios. É o motor que faz o evento crescer sozinho.',
  },
  {
    id: 'jato',
    termo: 'Jato subtropical',
    variacoes: ['jato subtropical'],
    definicao:
      'Uma corrente de ar muito veloz a cerca de 10 km de altitude, na borda dos trópicos. Reforçado pelo El Niño, ele trava as frentes frias sobre o Sul do Brasil, que passam a chover dias seguidos no mesmo lugar.',
  },
  {
    id: 'teleconexao',
    termo: 'Teleconexão',
    variacoes: ['teleconexão', 'Pacífico–América do Sul'],
    definicao:
      'A ligação entre o que acontece em um ponto do planeta e o clima de outro, a milhares de quilômetros. O trem de ondas que sai do Pacífico central e chega ao Sul do Brasil é uma teleconexão.',
  },
  {
    id: 'modoki',
    termo: 'El Niño Modoki',
    variacoes: ['El Niño Modoki'],
    definicao:
      'Um tipo de evento em que o aquecimento se concentra no Pacífico central, e não no leste. O padrão de impactos muda, e é uma das razões de a previsão falar em probabilidade.',
  },
  {
    id: 'mjo',
    termo: 'Oscilação de Madden-Julian',
    variacoes: ['oscilação de Madden-Julian'],
    definicao:
      'Um pulso de nuvens e vento que dá a volta no cinturão tropical a cada 30 a 60 dias. Suas rajadas de oeste são um dos empurrões que podem iniciar um El Niño.',
  },
  {
    id: 'ios',
    termo: 'Índice de Oscilação Sul (IOS)',
    variacoes: ['Índice de Oscilação Sul', 'IOS'],
    definicao:
      'A diferença de pressão atmosférica entre o Taiti e Darwin, na Austrália, medida desde 1924. É a metade atmosférica do fenômeno: quando fica fortemente negativa, os alísios estão fracos.',
  },
  {
    id: 'quadra',
    termo: 'Quadra chuvosa',
    variacoes: ['quadra chuvosa'],
    definicao:
      'O período de fevereiro a maio em que cai a maior parte da chuva do ano no semiárido nordestino. Se ela falha, não há segunda chance dentro do mesmo ano.',
  },
  {
    id: 'veranico',
    termo: 'Veranico',
    variacoes: ['veranicos', 'veranico'],
    definicao:
      'Um período seco e quente de dias ou semanas dentro da estação chuvosa. Curto para aparecer no total de chuva do mês, longo o bastante para matar a lavoura no estágio errado.',
  },
  {
    id: 'poca',
    termo: 'Poça quente do Pacífico oeste',
    variacoes: ['poça quente do Pacífico oeste', 'poça quente'],
    definicao:
      'A maior massa de água quente do planeta, com mais de 29 °C, empilhada pelos alísios do lado da Indonésia. É de lá que a água escorrega para leste quando o vento afrouxa.',
  },
  {
    id: 'climatologia',
    termo: 'Média climatológica',
    variacoes: ['média climatológica', 'climatologia'],
    definicao:
      'A média de um elemento do clima em um período longo de referência, em geral trinta anos. É a régua contra a qual se mede qualquer desvio.',
  },
];

/* ===========================================================================
 * 14. As etapas do mecanismo, ligadas à cena 3D
 * ---------------------------------------------------------------------------
 * `oni` é o valor que o simulador assume quando a etapa é aberta, e `foco`
 * diz o que olhar na cena naquele estágio. A cena tem um eixo só, a
 * intensidade, e as etapas percorrem esse eixo na ordem em que o evento
 * acontece de verdade.
 * ------------------------------------------------------------------------ */

export const etapasMecanismo = [
  {
    titulo: 'Algo enfraquece os alísios',
    oni: 0.3,
    texto:
      'Basta um empurrão: uma sequência de rajadas de oeste no Pacífico ocidental, muitas vezes ligadas à oscilação de Madden-Julian. O sistema sai do equilíbrio.',
    foco: 'Repare nas setas dos alísios, logo acima da água: elas encurtam antes de qualquer outra coisa mudar.',
  },
  {
    titulo: 'Uma onda oceânica atravessa o Pacífico',
    oni: 0.7,
    texto:
      'O empurrão gera uma onda de Kelvin equatorial, um pulso invisível na superfície que leva de dois a três meses para cruzar o oceano, afundando a termoclina por onde passa.',
    foco: 'Acompanhe a linha clara da termoclina: ela começa a perder a inclinação, afundando do lado direito.',
  },
  {
    titulo: 'A ressurgência deixa de funcionar',
    oni: 1.2,
    texto:
      'Com a termoclina afundada no leste, a água que sobe na costa do Peru não vem mais da camada fria, e sim de água já morna. A superfície esquenta rápido.',
    foco: 'Olhe o canto direito, junto à América do Sul: o azul frio da superfície dá lugar ao laranja.',
  },
  {
    titulo: 'A chuva muda de endereço',
    oni: 1.6,
    texto:
      'A convecção profunda segue o mar quente e se instala no Pacífico central. A circulação de Walker se parte e passa a descer sobre a Indonésia e sobre o norte da América do Sul.',
    foco: 'A coluna de nuvens caminha da esquerda para o meio da cena. É esse deslocamento que chega ao Brasil.',
  },
  {
    titulo: 'O ciclo se retroalimenta',
    oni: 2.0,
    texto:
      'Convecção deslocada para o centro do oceano enfraquece ainda mais os alísios, o que aquece ainda mais o leste. É a realimentação de Bjerknes: a causa vira consequência e o evento se amplifica.',
    foco: 'Tudo ao mesmo tempo: alísios curtos, termoclina quase plana, superfície quente de ponta a ponta.',
  },
  {
    titulo: 'O pico e a descarga',
    oni: -1.2,
    texto:
      'Entre novembro e janeiro o evento atinge o máximo. Ondas de Rossby refletidas na borda oeste já vêm trazendo água fria de volta, e o sistema costuma passar do ponto, virando La Niña no ano seguinte.',
    foco: 'A cena salta para o outro extremo: é assim que o Pacífico costuma ficar no ano seguinte ao de um El Niño forte.',
  },
];

/* ===========================================================================
 * 15. Resumo de cada capítulo
 * ---------------------------------------------------------------------------
 * Três linhas por capítulo. Aparecem no alto da seção, alimentam o modo
 * essencial e são a espinha da ficha de estudo impressa.
 * ------------------------------------------------------------------------ */

export const resumos = [
  {
    secao: 'o-que-e',
    titulo: 'O que é o El Niño',
    pontos: [
      'Os ventos alísios empurram a água quente para o lado da Indonésia; do lado do Peru, água fria sobe do fundo.',
      'No El Niño os alísios enfraquecem, a água quente escorrega de volta para leste e a chuva se muda com ela.',
      'Oceano e atmosfera são um sistema só, chamado ENOS; a La Niña é a fase oposta do mesmo sistema.',
    ],
  },
  {
    secao: 'como-ocorre',
    titulo: 'Como o fenômeno se forma',
    pontos: [
      'Um empurrão inicial nos alísios dispara uma onda oceânica que afunda a termoclina no leste do Pacífico.',
      'Sem a água fria da ressurgência, a superfície esquenta e a convecção se muda para o centro do oceano.',
      'O deslocamento enfraquece ainda mais os alísios: o evento se amplifica sozinho até passar do ponto.',
    ],
  },
  {
    secao: 'medir',
    titulo: 'Como se mede',
    pontos: [
      'O ONI é a anomalia de temperatura do mar na região Niño 3.4, em média móvel de três meses.',
      'Cinco trimestres seguidos em +0,5 °C ou mais definem um El Niño; em −0,5 °C ou menos, uma La Niña.',
      'Boias fundeadas, satélites de altimetria, flutuadores Argo e o índice de pressão IOS sustentam a medição.',
    ],
  },
  {
    secao: 'brasil',
    titulo: 'O sinal no Brasil',
    pontos: [
      'Norte e Nordeste secam: o ar desce sobre a Amazônia e a ZCIT fica retida ao norte do semiárido.',
      'O Sul encharca: o jato subtropical reforçado trava as frentes frias sobre a região.',
      'Centro-Oeste e Sudeste ficam no meio, com sinal fraco na chuva e sinal forte no calor.',
    ],
  },
  {
    secao: 'caso',
    titulo: '2023–24, o caso recente',
    pontos: [
      'O rio Negro bateu em Manaus o menor nível em mais de um século, e o recorde caiu de novo em 2024.',
      'O calor recorde e a chuva fora de época ajudaram a maior epidemia de dengue já registrada no país.',
      'No mesmo período o Rio Grande do Sul viveu o extremo oposto, com a maior enchente de sua história.',
    ],
  },
  {
    secao: 'ecossistemas',
    titulo: 'Os ecossistemas',
    pontos: [
      'Na seca, a Amazônia chega a emitir mais carbono do que absorve, e a floresta úmida passa a queimar.',
      'A Caatinga aguenta a seca, mas não vários anos seguidos sem a quadra chuvosa: o solo se degrada.',
      'No oceano, o coral branqueia e a ressurgência desligada derruba a pescaria da anchoveta no Peru.',
    ],
  },
  {
    secao: 'historia',
    titulo: 'Os eventos que marcaram o país',
    pontos: [
      'A Grande Seca de 1877–79 pôs a seca no centro da política brasileira.',
      'O fracasso em prever 1982–83 motivou a rede de boias que monitora o Pacífico até hoje.',
      '1997–98, 2015–16 e 2023–24 foram previstos com meses de antecedência.',
    ],
  },
  {
    secao: 'clima',
    titulo: 'El Niño e mudança climática',
    pontos: [
      'O El Niño é uma oscilação que vai e volta; o aquecimento global é uma tendência que só sobe.',
      'Os dois se somam, e por isso anos de El Niño são sistematicamente mais quentes que os vizinhos.',
      'A linha de base subiu: um evento médio hoje produz impactos que antes exigiam um evento forte.',
    ],
  },
  {
    secao: 'mitos',
    titulo: 'O que o El Niño não é',
    pontos: [
      'Ele não é o aquecimento global, e não explica sozinho nenhum desastre isolado.',
      'Ele não seca o Brasil inteiro: parte o país em dois regimes opostos.',
      'Ele não é imprevisível: é justamente a previsão sazonal mais confiável que existe.',
    ],
  },
  {
    secao: 'adaptacao',
    titulo: 'O que dá para fazer',
    pontos: [
      'A previsão sai com meses de antecedência: o gargalo é transformá-la em decisão.',
      'Antes do evento se ajusta plantio, reservatório e estoque; durante, a resposta é emergencial.',
      'Entre eventos é que se reduz a vulnerabilidade, com cisterna, drenagem e combate ao desmatamento.',
    ],
  },
];

/* ===========================================================================
 * 16. Checagem rápida ao fim de cada capítulo
 * ------------------------------------------------------------------------ */

export const checagens = [
  {
    secao: 'o-que-e',
    pergunta: 'No estado normal do Pacífico, de que lado fica a água mais quente?',
    opcoes: ['Do lado da Indonésia, a oeste', 'Do lado do Peru, a leste'],
    correta: 0,
    explicacao:
      'Os alísios empurram a água aquecida pelo sol para oeste e a empilham perto da Indonésia. Do lado do Peru, a água que sai é reposta por água fria vinda do fundo.',
  },
  {
    secao: 'como-ocorre',
    pergunta: 'Por que o El Niño se amplifica sozinho depois de começar?',
    opcoes: [
      'Porque a chuva deslocada enfraquece ainda mais os alísios, que aquecem ainda mais o leste',
      'Porque o sol aquece mais o Pacífico nos anos de evento',
    ],
    correta: 0,
    explicacao:
      'É a realimentação de Bjerknes: cada efeito reforça a própria causa. O ciclo só se encerra quando as ondas refletidas na borda oeste trazem água fria de volta.',
  },
  {
    secao: 'medir',
    pergunta: 'Um ONI de +1,6 °C corresponde a que classificação?',
    opcoes: ['El Niño moderado', 'El Niño forte', 'El Niño muito forte'],
    correta: 1,
    explicacao:
      'A escala vai por faixas: fraco de 0,5 a 0,9 °C, moderado de 1,0 a 1,4, forte de 1,5 a 1,9 e muito forte de 2,0 em diante.',
  },
  {
    secao: 'brasil',
    pergunta: 'Duas regiões vizinhas, Nordeste e Sul, reagem de formas opostas. Por quê?',
    opcoes: [
      'Porque o sinal chega a cada uma por um caminho diferente: um tropical, outro extratropical',
      'Porque o Sul fica mais longe do Pacífico do que o Nordeste',
    ],
    correta: 0,
    explicacao:
      'Ao Norte e ao Nordeste o recado chega pela circulação de Walker e pela posição da ZCIT. Ao Sul chega por um trem de ondas atmosféricas que reforça o jato subtropical.',
  },
  {
    secao: 'caso',
    pergunta: 'Por que 2023–24 bateu recordes sem ter sido o evento mais intenso já medido?',
    opcoes: [
      'Porque caiu sobre um planeta e um oceano que já estavam mais quentes',
      'Porque durou muito mais tempo que os eventos anteriores',
    ],
    correta: 0,
    explicacao:
      'O pico de 2023–24 (+2,0 °C) ficou abaixo do de 2015–16 (+2,6 °C). A diferença é a linha de base: o mesmo desvio, somado ao aquecimento de fundo, produz extremos maiores.',
  },
  {
    secao: 'clima',
    pergunta: 'Qual é a diferença essencial entre o El Niño e o aquecimento global?',
    opcoes: [
      'O El Niño oscila e devolve o calor; o aquecimento global é uma tendência que não volta',
      'O El Niño afeta só o oceano; o aquecimento global, só a atmosfera',
    ],
    correta: 0,
    explicacao:
      'Um é ciclo, o outro é tendência. O El Niño redistribui calor entre oceano e atmosfera; o aquecimento global adiciona calor ao sistema inteiro, e os dois se somam.',
  },
];

/* ===========================================================================
 * 17. Mitos e mal-entendidos
 * ------------------------------------------------------------------------ */

export const mitos = [
  {
    mito: 'El Niño é o aquecimento global.',
    veredito: 'Não',
    texto:
      'São coisas de natureza diferente. O El Niño é uma oscilação natural que redistribui, por alguns meses, calor que o oceano já tinha guardado, e depois devolve. O aquecimento global é uma tendência de longo prazo causada pelo acúmulo de gases de efeito estufa. O que existe é soma: um El Niño sobre um planeta mais quente entrega extremos maiores do que o mesmo El Niño entregaria há trinta anos.',
  },
  {
    mito: 'O El Niño seca o Brasil inteiro.',
    veredito: 'Ao contrário',
    texto:
      'Ele parte o país em dois. Enquanto o Norte e o Nordeste perdem chuva, o Sul recebe bem mais do que a média, porque o sinal chega a cada região por um caminho atmosférico diferente. No Centro-Oeste e no Sudeste o efeito sobre a chuva é fraco e muda de evento para evento, ainda que o calor apareça de forma consistente.',
  },
  {
    mito: 'Aquela enchente foi culpa do El Niño.',
    veredito: 'Não é assim que funciona',
    texto:
      'O El Niño não produz um desastre específico: ele muda a probabilidade de que aconteça. A enchente de maio de 2024 no Rio Grande do Sul foi causada por um bloqueio atmosférico sobre um estado já encharcado, num contexto de aquecimento global. O El Niño foi um fator entre vários, e atribuir tudo a ele esconde as outras causas, inclusive as que dependem de decisão humana.',
  },
  {
    mito: 'Como o El Niño é natural, não há o que fazer.',
    veredito: 'Há muito o que fazer',
    texto:
      'Justamente por ser um ciclo do oceano, ele é previsível com meses de antecedência, mais do que qualquer previsão de tempo. Esse prazo é tempo de decisão: ajustar plantio, encher reservatório, pré-posicionar brigada de incêndio, preparar abrigo. O dano não é o evento, é o despreparo.',
  },
  {
    mito: 'Se o El Niño é forte, o impacto no Brasil também será.',
    veredito: 'Nem sempre',
    texto:
      'A intensidade medida no Pacífico não se traduz linearmente em impacto aqui. Conta onde exatamente o oceano aqueceu, o que o Atlântico está fazendo ao mesmo tempo e em que estado o solo, os rios e as cidades já estavam. Eventos com aquecimento concentrado no Pacífico central, os chamados Modoki, produzem padrões diferentes dos que aquecem o leste.',
  },
  {
    mito: 'El Niño acontece de sete em sete anos, como um relógio.',
    veredito: 'Não há relógio',
    texto:
      'O intervalo entre eventos varia de dois a sete anos, sem regularidade. Houve El Niño em 2015–16 e de novo em 2018–19; depois vieram três anos seguidos de La Niña. É uma oscilação irregular, e é por isso que ela precisa ser monitorada o tempo todo, e não prevista por calendário.',
  },
];

/* ===========================================================================
 * 18. Onde você mora
 * ---------------------------------------------------------------------------
 * O sinal regional descrito em `regioesBrasil`, aterrissado em cada unidade
 * da federação. A nota diz o que o El Niño costuma significar ali, sem
 * prometer o que vai acontecer no próximo evento.
 * ------------------------------------------------------------------------ */

export const estados = [
  { uf: 'AC', nome: 'Acre', regiao: 'norte', nota: 'O estado alterna cheia no começo do ano e estiagem no segundo semestre. Em anos de El Niño a seca se aprofunda, os rios baixam e comunidades que só se deslocam por água ficam isoladas.' },
  { uf: 'AL', nome: 'Alagoas', regiao: 'nordeste', nota: 'O agreste e o sertão dependem da quadra chuvosa de fevereiro a maio. Quando ela falha, o abastecimento das cidades do interior entra em rodízio e a lavoura de sequeiro se perde.' },
  { uf: 'AM', nome: 'Amazonas', regiao: 'norte', nota: 'É onde a seca de 2023–24 foi mais dura: o rio Negro chegou a 12,70 m em Manaus, o menor nível desde 1902, e os 62 municípios do estado decretaram emergência.' },
  { uf: 'AP', nome: 'Amapá', regiao: 'norte', nota: 'A chuva depende da ZCIT, que em anos de El Niño fica retida mais ao norte. O resultado é uma estação chuvosa mais curta e rios mais baixos, com sinal menos extremo que no centro da Amazônia.' },
  { uf: 'BA', nome: 'Bahia', regiao: 'nordeste', nota: 'Dois problemas diferentes no mesmo estado: no semiárido, a quadra chuvosa que não vem; no oeste produtor de grãos, os veranicos que atingem a soja no meio do ciclo.' },
  { uf: 'CE', nome: 'Ceará', regiao: 'nordeste', nota: 'O estado que mais organizou sua vida em torno da previsão. A Funceme acompanha a quadra chuvosa de fevereiro a maio, e o nível dos açudes no fim de maio define o ano inteiro.' },
  { uf: 'DF', nome: 'Distrito Federal', regiao: 'centro-oeste', nota: 'Sinal fraco na chuva e forte no calor: primavera mais quente, umidade relativa muito baixa e risco maior de incêndio no Cerrado antes das primeiras chuvas.' },
  { uf: 'ES', nome: 'Espírito Santo', regiao: 'sudeste', nota: 'Fica na faixa de transição, onde o desvio de chuva muda de evento para evento. O que aparece com consistência é o calor, com ondas mais longas na primavera e no verão.' },
  { uf: 'GO', nome: 'Goiás', regiao: 'centro-oeste', nota: 'O risco típico é o veranico: um período seco dentro da estação chuvosa, curto demais para aparecer no total do mês e longo o bastante para atingir a lavoura no estágio errado.' },
  { uf: 'MA', nome: 'Maranhão', regiao: 'nordeste', nota: 'No meio-norte a chuva vem com a descida da ZCIT. Em anos de El Niño ela chega atrasada, o que comprime o calendário de plantio e agrava a estiagem no leste do estado.' },
  { uf: 'MG', nome: 'Minas Gerais', regiao: 'sudeste', nota: 'Foi em Araçuaí que o INMET registrou 44,8 °C em 19 de novembro de 2023, a maior temperatura já medida no Brasil. A chuva, por outro lado, tem sinal fraco e irregular.' },
  { uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'centro-oeste', nota: 'O estado fica na costura entre dois regimes: o sul pode receber a chuva do padrão sulino, enquanto o norte, no Pantanal, seca e queima quando a cheia não chega.' },
  { uf: 'MT', nome: 'Mato Grosso', regiao: 'centro-oeste', nota: 'O que está em jogo é a data de início das chuvas. Um começo atrasado adia o plantio da soja e empurra a safrinha de milho para fora da janela ideal.' },
  { uf: 'PA', nome: 'Pará', regiao: 'norte', nota: 'Estiagem forte no leste do estado, fogo em áreas de floresta que normalmente não queimam e restrição de calado nos rios usados para escoar grãos pelo Arco Norte.' },
  { uf: 'PB', nome: 'Paraíba', regiao: 'nordeste', nota: 'O sertão paraibano vive de açude e de cisterna. Quando a quadra chuvosa falha em anos seguidos, o abastecimento de cidades inteiras passa a depender de carro-pipa.' },
  { uf: 'PE', nome: 'Pernambuco', regiao: 'nordeste', nota: 'Do litoral ao sertão, o estado atravessa três climas. O impacto maior aparece no agreste e no sertão, onde a quadra chuvosa mais curta compromete a safra e os reservatórios.' },
  { uf: 'PI', nome: 'Piauí', regiao: 'nordeste', nota: 'A chuva chega pela ZCIT e pelos sistemas que descem do norte. Com o El Niño, o início da estação atrasa e o sul do estado, produtor de grãos, sofre com veranicos.' },
  { uf: 'PR', nome: 'Paraná', regiao: 'sul', nota: 'Chuva bem acima da média, sobretudo na primavera. O trigo perde qualidade no campo, a colheita da soja atrasa e a semeadura do milho escorrega no calendário.' },
  { uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'sudeste', nota: 'Em novembro de 2023 a sensação térmica na cidade chegou a 59,7 °C. O sinal de chuva é fraco, mas a combinação de calor e chuva concentrada aumenta o risco em encostas.' },
  { uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'nordeste', nota: 'Um dos estados mais secos do país em anos de El Niño: a quadra chuvosa encurta, os açudes do interior baixam e a produção de sequeiro praticamente desaparece.' },
  { uf: 'RO', nome: 'Rondônia', regiao: 'norte', nota: 'A seca do rio Madeira interrompe a balsa que abastece Manaus e derruba a geração das hidrelétricas de Santo Antônio e Jirau, que dependem da vazão do rio.' },
  { uf: 'RR', nome: 'Roraima', regiao: 'norte', nota: 'O caso mais extremo do país: a estação seca de Roraima cai no primeiro semestre, quando o El Niño ainda está forte. Em 1998 o fogo avançou por milhares de quilômetros quadrados de floresta.' },
  { uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'sul', nota: 'O extremo oposto do Norte. Em setembro de 2023 um ciclone extratropical matou 54 pessoas no Vale do Taquari; em maio de 2024 veio a maior enchente da história do estado, com 478 municípios atingidos.' },
  { uf: 'SC', nome: 'Santa Catarina', regiao: 'sul', nota: 'Em julho de 1983, durante um El Niño forte, o rio Itajaí-Açu chegou a 15,34 m em Blumenau, na maior enchente do século no estado. O padrão de frentes travadas se repete a cada evento.' },
  { uf: 'SE', nome: 'Sergipe', regiao: 'nordeste', nota: 'O agreste e o sertão sergipanos perdem a quadra chuvosa, com impacto direto no rebanho e na produção de leite, que é a base da economia do interior.' },
  { uf: 'SP', nome: 'São Paulo', regiao: 'sudeste', nota: 'Sinal fraco na chuva e forte no calor, com ondas mais frequentes e mais longas. A chuva tende a se concentrar em episódios intensos, o que pressiona a drenagem urbana.' },
  { uf: 'TO', nome: 'Tocantins', regiao: 'norte', nota: 'Entre o Norte seco e o Centro-Oeste irregular: a estiagem se prolonga, o Cerrado seca antes do tempo e os focos de queimada aumentam no fim da estação seca.' },
];
