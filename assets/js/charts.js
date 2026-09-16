/**
 * Gráficos em SVG, construídos à mão, sem dependências.
 *
 * Convenções seguidas em todos os gráficos:
 *   · marcas finas (barras <= 24 px, linhas de 2 px, pontos >= 8 px);
 *   · grade em fio de cabelo, sólida e discreta;
 *   · rótulos diretos apenas nos extremos; o resto fica no eixo e na dica;
 *   · texto sempre com as cores de tinta, nunca com a cor da série;
 *   · toda figura tem uma tabela equivalente, aberta por <details>;
 *   · a dica de valor complementa, nunca é o único caminho para o número.
 */

const NS = 'http://www.w3.org/2000/svg';

/* --- utilidades ---------------------------------------------------------- */

const num = (casas = 1) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export const fmt1 = num(1);
export const fmt2 = num(2);
export const fmt0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** Formata com sinal explícito, essencial em escalas divergentes. */
export function comSinal(v, casas = 1, sufixo = '') {
  const f = num(casas).format(Math.abs(v));
  const s = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${s}${f}${sufixo}`;
}

function el(nome, attrs = {}, pai = null) {
  const node = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  if (pai) pai.appendChild(node);
  return node;
}

function html(nome, cls, pai = null, texto = null) {
  const node = document.createElement(nome);
  if (cls) node.className = cls;
  if (texto !== null) node.textContent = texto;
  if (pai) pai.appendChild(node);
  return node;
}

/**
 * Caminho de barra com a ponta arredondada e a base quadrada.
 * `dir` = 1 cresce para cima/direita, −1 para baixo/esquerda.
 */
function barraVertical(x, base, larg, alt, r = 4, dir = 1) {
  const raio = Math.min(r, larg / 2, Math.abs(alt));
  const topo = base - dir * Math.abs(alt);
  if (dir > 0) {
    return `M${x},${base} L${x},${topo + raio} Q${x},${topo} ${x + raio},${topo}
            L${x + larg - raio},${topo} Q${x + larg},${topo} ${x + larg},${topo + raio}
            L${x + larg},${base} Z`;
  }
  return `M${x},${base} L${x},${topo - raio} Q${x},${topo} ${x + raio},${topo}
          L${x + larg - raio},${topo} Q${x + larg},${topo} ${x + larg},${topo - raio}
          L${x + larg},${base} Z`;
}

function barraHorizontal(base, y, altura, larg, r = 4, dir = 1) {
  const raio = Math.min(r, altura / 2, Math.abs(larg));
  const ponta = base + dir * Math.abs(larg);
  if (dir > 0) {
    return `M${base},${y} L${ponta - raio},${y} Q${ponta},${y} ${ponta},${y + raio}
            L${ponta},${y + altura - raio} Q${ponta},${y + altura} ${ponta - raio},${y + altura}
            L${base},${y + altura} Z`;
  }
  return `M${base},${y} L${ponta + raio},${y} Q${ponta},${y} ${ponta},${y + raio}
          L${ponta},${y + altura - raio} Q${ponta},${y + altura} ${ponta + raio},${y + altura}
          L${base},${y + altura} Z`;
}

function escalaLinear(dominio, imagem) {
  const [d0, d1] = dominio;
  const [r0, r1] = imagem;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = (v) => r0 + (v - d0) * k;
  f.inversa = (p) => (k === 0 ? d0 : d0 + (p - r0) / k);
  f.dominio = dominio;
  f.imagem = imagem;
  return f;
}

/** Ticks "redondos" dentro de um intervalo. */
function ticks(min, max, alvo = 5) {
  const passoBruto = (max - min) / alvo;
  const mag = 10 ** Math.floor(Math.log10(Math.abs(passoBruto) || 1));
  const norm = passoBruto / mag;
  const passo = (norm >= 5 ? 5 : norm >= 2 ? 2 : norm >= 1 ? 1 : 0.5) * mag;
  const saida = [];
  for (let v = Math.ceil(min / passo) * passo; v <= max + 1e-9; v += passo) {
    saida.push(Math.abs(v) < 1e-9 ? 0 : Number(v.toFixed(6)));
  }
  return saida;
}

function lerToken(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/* --- casca comum das figuras --------------------------------------------- */

/**
 * Monta o invólucro <figure> com título, subtítulo, área de desenho,
 * rodapé com a fonte e a tabela equivalente. Devolve as partes para o
 * desenhista preencher, e redesenha sozinho quando a largura muda.
 */
export function criarFigura(destino, opcoes) {
  const {
    titulo, subtitulo, comoLer, fonte, legenda = [], tabela,
    aspecto = 0.45, alturaMin = 260, alturaMax = 460,
  } = opcoes;

  const fig = html('figure', 'figura', destino);
  const cab = html('div', 'figura__cabecalho', fig);
  const h = html('figcaption', 'figura__titulo', cab, titulo);
  const id = `fig-${Math.random().toString(36).slice(2, 9)}`;
  h.id = id;

  if (subtitulo) html('p', 'figura__sub', fig, subtitulo);

  /**
   * Um gráfico só é evidente para quem já sabe lê-lo. Esta linha diz, em uma
   * frase, o que é cada marca e em que direção o olho deve correr.
   */
  if (comoLer) {
    const guia = html('p', 'figura__como-ler', fig);
    html('strong', null, guia, 'Como ler: ');
    html('span', null, guia, comoLer);
  }

  if (legenda.length > 1) {
    const leg = html('div', 'legenda', fig);
    for (const item of legenda) {
      const li = html('span', 'legenda__item', leg);
      const chave = html('span', item.tipo === 'linha' ? 'chave chave--linha' : 'chave', li);
      chave.style.background = item.cor;
      html('span', null, li, item.rotulo);
    }
  }

  const area = html('div', 'figura__grafico', fig);
  const dica = html('div', 'dica', area);
  dica.setAttribute('role', 'status');

  const rodape = html('div', 'figura__rodape', fig);
  html('span', null, rodape, fonte ? `Fonte: ${fonte}` : '');

  if (tabela) {
    const det = html('details', 'tabela-alvo', fig);
    html('summary', null, det, 'Ver os dados em tabela');
    const rol = html('div', 'rolagem-tabela', det);
    rol.appendChild(montarTabela(tabela));
  }

  const svg = el('svg', { role: 'img', 'aria-labelledby': id }, area);

  return { fig, area, svg, dica, rodape, aspecto, alturaMin, alturaMax };
}

function montarTabela({ colunas, linhas, legenda }) {
  const t = document.createElement('table');
  t.className = 'dados';
  if (legenda) {
    const cap = document.createElement('caption');
    cap.textContent = legenda;
    t.appendChild(cap);
  }
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  for (const c of colunas) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = c;
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  t.appendChild(thead);
  const tb = document.createElement('tbody');
  for (const linha of linhas) {
    const tr = document.createElement('tr');
    linha.forEach((celula, i) => {
      const td = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) td.scope = 'row';
      td.textContent = celula;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  }
  t.appendChild(tb);
  return t;
}

/** Observa a largura e redesenha o SVG com pixels reais (texto sempre nítido). */
function ligarRedesenho(ctx, desenhar) {
  const { svg, area, aspecto, alturaMin, alturaMax } = ctx;
  let larguraAnterior = 0;
  const render = () => {
    const w = Math.round(area.clientWidth);
    if (!w) return;
    const h = Math.round(Math.min(alturaMax, Math.max(alturaMin, w * aspecto)));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.style.height = `${h}px`;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    desenhar(svg, w, h);
    larguraAnterior = w;
  };
  const ro = new ResizeObserver(() => {
    if (Math.abs(area.clientWidth - larguraAnterior) > 2) render();
  });
  ro.observe(area);
  render();
  return render;
}

/* --- dica de valor -------------------------------------------------------- */

function mostrarDica(dica, area, x, y, titulo, linhas) {
  dica.textContent = '';
  html('div', 'dica__titulo', dica, titulo);
  for (const l of linhas) {
    const linha = html('div', 'dica__linha', dica);
    if (l.cor) {
      const chave = html('span', 'chave chave--linha', linha);
      chave.style.background = l.cor;
    }
    html('span', 'dica__nome', linha, l.nome);
    html('span', 'dica__valor', linha, l.valor);
  }
  dica.dataset.visivel = 'true';
  const larguraArea = area.clientWidth;
  const meia = dica.offsetWidth / 2;
  const cx = Math.max(meia + 4, Math.min(larguraArea - meia - 4, x));
  dica.style.left = `${cx}px`;
  dica.style.top = `${Math.max(dica.offsetHeight * 0.1, y)}px`;
}

function esconderDica(dica) {
  dica.dataset.visivel = 'false';
}

/* =========================================================================
 * 1. Colunas divergentes: a série do ONI
 * ====================================================================== */

export function graficoONI(destino, dados, opcoes = {}) {
  const ctx = criarFigura(destino, {
    titulo: opcoes.titulo ?? 'Setenta e cinco anos de El Niño e La Niña',
    subtitulo:
      opcoes.subtitulo ??
      'Anomalia de temperatura da superfície do mar na região Niño 3.4, trimestre dezembro–fevereiro. Acima de +0,5 °C é El Niño; abaixo de −0,5 °C, La Niña.',
    comoLer:
      opcoes.comoLer ??
      'cada coluna é um ano. Para cima e em laranja, El Niño; para baixo e em azul, La Niña. ' +
      'As duas linhas tracejadas são os limiares de ±0,5 °C a partir dos quais o evento é declarado.',
    fonte: opcoes.fonte ?? 'NOAA / Climate Prediction Center',
    legenda: [
      { rotulo: 'El Niño (oceano mais quente)', cor: lerToken('--warm') },
      { rotulo: 'La Niña (oceano mais frio)', cor: lerToken('--cool') },
    ],
    tabela: {
      legenda: 'ONI do trimestre DJF, em °C, por ano.',
      colunas: ['Ano', 'ONI (°C)', 'Fase'],
      linhas: dados.map((d) => {
        const c = classificar(d.oni);
        return [String(d.ano), comSinal(d.oni, 1), c];
      }),
    },
    aspecto: 0.42,
    alturaMin: 280,
    alturaMax: 420,
  });

  const warm = lerToken('--warm');
  const cool = lerToken('--cool');

  function classificar(v) {
    if (v >= 2) return 'El Niño muito forte';
    if (v >= 1.5) return 'El Niño forte';
    if (v >= 1) return 'El Niño moderado';
    if (v >= 0.5) return 'El Niño fraco';
    if (v <= -1.5) return 'La Niña forte';
    if (v <= -1) return 'La Niña moderada';
    if (v <= -0.5) return 'La Niña fraca';
    return 'Neutro';
  }

  ligarRedesenho(ctx, (svg, w, h) => {
    const m = { t: 26, r: 14, b: 30, l: 34 };
    const pw = w - m.l - m.r;
    const ph = h - m.t - m.b;
    const max = 2.8;

    const x = escalaLinear([0, dados.length], [m.l, m.l + pw]);
    const y = escalaLinear([-max, max], [m.t + ph, m.t]);
    const passo = pw / dados.length;
    const larg = Math.max(2, Math.min(24, passo - 2)); // 2 px de respiro entre colunas

    // grade
    for (const t of ticks(-max, max, 6)) {
      el('line', { class: 'linha-grade', x1: m.l, x2: m.l + pw, y1: y(t), y2: y(t) }, svg);
      el('text', { class: 'eixo-texto', x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg).textContent =
        comSinal(t, 1);
    }

    // faixas de limiar ±0,5
    for (const limite of [0.5, -0.5]) {
      el(
        'line',
        {
          class: 'linha-limite',
          x1: m.l, x2: m.l + pw, y1: y(limite), y2: y(limite),
          'stroke-dasharray': '2 4',
          stroke: lerToken('--axis'),
        },
        svg
      );
    }
    el('line', { class: 'linha-base', x1: m.l, x2: m.l + pw, y1: y(0), y2: y(0) }, svg);

    // colunas
    const grupo = el('g', {}, svg);
    dados.forEach((d, i) => {
      const cx = x(i) + (passo - larg) / 2;
      const alt = Math.abs(y(d.oni) - y(0));
      const cor = d.oni >= 0 ? warm : cool;
      const op = Math.abs(d.oni) < 0.5 ? 0.45 : 1;
      el(
        'path',
        { d: barraVertical(cx, y(0), larg, alt, 4, d.oni >= 0 ? 1 : -1), fill: cor, opacity: op },
        grupo
      );
    });

    // rótulos diretos apenas nos extremos que contam a história
    const marcados = [2016, 1998, 1983, 2024];
    dados.forEach((d, i) => {
      if (!marcados.includes(d.ano)) return;
      const cx = x(i) + passo / 2;
      const ty = y(d.oni) - 9;
      el('text', { class: 'rotulo-direto', x: cx, y: ty, 'text-anchor': 'middle' }, svg).textContent =
        `${d.ano}`;
    });

    // eixo do tempo
    for (let ano = 1950; ano <= 2025; ano += 10) {
      const i = dados.findIndex((d) => d.ano === ano);
      if (i < 0) continue;
      el(
        'text',
        { class: 'eixo-texto', x: x(i) + passo / 2, y: h - 10, 'text-anchor': 'middle' },
        svg
      ).textContent = String(ano);
    }

    // camada de interação: a mira encontra o ano
    const mira = el(
      'line',
      { y1: m.t, y2: m.t + ph, stroke: lerToken('--ink-2'), 'stroke-width': 1, opacity: 0 },
      svg
    );
    const alvo = el(
      'rect',
      { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent', style: 'cursor:crosshair' },
      svg
    );

    const aoMover = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * w;
      const i = Math.max(0, Math.min(dados.length - 1, Math.floor(x.inversa(px))));
      const d = dados[i];
      const cx = x(i) + passo / 2;
      mira.setAttribute('x1', cx);
      mira.setAttribute('x2', cx);
      mira.setAttribute('opacity', 0.35);
      mostrarDica(
        ctx.dica,
        ctx.area,
        (cx / w) * ctx.area.clientWidth,
        (Math.min(y(d.oni), y(0)) / h) * ctx.area.clientHeight - 6,
        String(d.ano),
        [{ nome: classificar(d.oni), valor: `${comSinal(d.oni, 1)} °C`, cor: d.oni >= 0 ? warm : cool }]
      );
    };

    alvo.addEventListener('pointermove', aoMover);
    alvo.addEventListener('pointerdown', aoMover);
    alvo.addEventListener('pointerleave', () => {
      mira.setAttribute('opacity', 0);
      esconderDica(ctx.dica);
    });
  });

  return ctx;
}

/* =========================================================================
 * 2. Linhas múltiplas: evolução dos maiores eventos
 * ====================================================================== */

export function graficoEvolucao(destino, series, rotulosX, opcoes = {}) {
  const cores = [lerToken('--series-1'), lerToken('--series-2'), lerToken('--series-3'), lerToken('--series-4')];

  const ctx = criarFigura(destino, {
    titulo: opcoes.titulo ?? 'Todo El Niño tem o mesmo ritmo',
    subtitulo:
      opcoes.subtitulo ??
      'Os quatro eventos mais intensos já medidos, alinhados pelo ciclo: nascem no outono do Hemisfério Norte, atingem o pico entre novembro e janeiro e se desfazem no outono seguinte.',
    comoLer:
      opcoes.comoLer ??
      'cada linha é um evento, alinhado pelo estágio do ciclo e não pelo calendário. ' +
      'O eixo horizontal percorre os trimestres móveis, de abril do primeiro ano a julho do seguinte: ' +
      'é isso que permite comparar o ritmo de eventos separados por décadas.',
    fonte: opcoes.fonte ?? 'NOAA / Climate Prediction Center',
    legenda: series.map((s, i) => ({ rotulo: s.rotulo, cor: cores[i], tipo: 'linha' })),
    tabela: {
      legenda: 'ONI (°C) por trimestre móvel, do início ao fim de cada evento.',
      colunas: ['Trimestre', ...series.map((s) => s.rotulo)],
      linhas: rotulosX.map((t, i) => [t, ...series.map((s) => comSinal(s.valores[i], 1))]),
    },
    aspecto: 0.5,
    alturaMin: 300,
    alturaMax: 440,
  });

  ligarRedesenho(ctx, (svg, w, h) => {
    const m = { t: 26, r: 16, b: 34, l: 38 };
    const pw = w - m.l - m.r;
    const ph = h - m.t - m.b;
    const x = escalaLinear([0, rotulosX.length - 1], [m.l, m.l + pw]);
    const y = escalaLinear([-0.4, 2.8], [m.t + ph, m.t]);

    for (const t of ticks(0, 2.8, 4)) {
      el('line', { class: 'linha-grade', x1: m.l, x2: m.l + pw, y1: y(t), y2: y(t) }, svg);
      el('text', { class: 'eixo-texto', x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg).textContent =
        comSinal(t, 1);
    }
    el('line', { class: 'linha-base', x1: m.l, x2: m.l + pw, y1: y(0), y2: y(0) }, svg);

    // faixa de "El Niño muito forte"
    el(
      'rect',
      { x: m.l, y: y(2.8), width: pw, height: y(2) - y(2.8), fill: lerToken('--warm'), opacity: 0.07 },
      svg
    );
    el('text', { class: 'eixo-texto', x: m.l + 6, y: y(2.8) + 14 }, svg).textContent =
      pw >= 340 ? 'faixa “muito forte” (≥ +2,0 °C)' : 'muito forte';

    const salto = pw < 340 ? 4 : pw < 520 ? 3 : 2;
    rotulosX.forEach((t, i) => {
      if (i % salto) return;
      el('text', { class: 'eixo-texto', x: x(i), y: h - 12, 'text-anchor': 'middle' }, svg).textContent =
        t.replace('+', '');
    });
    if (pw >= 420) {
      el('text', { class: 'eixo-texto', x: m.l, y: h - 1, 'text-anchor': 'start' }, svg).textContent =
        'ano do evento →';
      el('text', { class: 'eixo-texto', x: m.l + pw, y: h - 1, 'text-anchor': 'end' }, svg).textContent =
        'ano seguinte';
    }

    // As quatro séries convergem no fim do ciclo: rótulos diretos na ponta
    // se empilhariam e se descolariam das linhas. Quem carrega a identidade
    // aqui é a legenda; a curva destacada ganha uma anotação única.
    let recorde = null;
    series.forEach((s, si) => {
      const pontos = s.valores.map((v, i) => [x(i), y(v)]);
      const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
      el(
        'path',
        { d, fill: 'none', stroke: cores[si], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' },
        svg
      );
      const pico = Math.max(...s.valores);
      const iPico = s.valores.indexOf(pico);
      el(
        'circle',
        {
          cx: x(iPico), cy: y(pico), r: 4.5,
          fill: cores[si], stroke: lerToken('--surface-1'), 'stroke-width': 2,
        },
        svg
      );
      if (!recorde || pico > recorde.pico) recorde = { pico, iPico, rotulo: s.rotulo };
    });

    if (recorde && pw >= 380) {
      const tx = x(recorde.iPico);
      const ty = y(recorde.pico) - 14;
      const anc = tx > m.l + pw * 0.6 ? 'end' : 'start';
      el(
        'text',
        { class: 'rotulo-direto', x: anc === 'end' ? tx - 8 : tx + 8, y: ty, 'text-anchor': anc },
        svg
      ).textContent = `${recorde.rotulo}: ${comSinal(recorde.pico, 1)} °C`;
    }

    const mira = el(
      'line',
      { y1: m.t, y2: m.t + ph, stroke: lerToken('--ink-2'), 'stroke-width': 1, opacity: 0 },
      svg
    );
    const alvo = el(
      'rect',
      { x: m.l, y: m.t, width: pw, height: ph, fill: 'transparent', style: 'cursor:crosshair' },
      svg
    );
    const aoMover = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * w;
      const i = Math.max(0, Math.min(rotulosX.length - 1, Math.round(x.inversa(px))));
      mira.setAttribute('x1', x(i));
      mira.setAttribute('x2', x(i));
      mira.setAttribute('opacity', 0.35);
      mostrarDica(
        ctx.dica,
        ctx.area,
        (x(i) / w) * ctx.area.clientWidth,
        (m.t / h) * ctx.area.clientHeight + 10,
        rotulosX[i].replace('+', ' (ano seguinte)'),
        series.map((s, si) => ({
          nome: s.rotulo,
          valor: `${comSinal(s.valores[i], 1)} °C`,
          cor: cores[si],
        }))
      );
    };
    alvo.addEventListener('pointermove', aoMover);
    alvo.addEventListener('pointerdown', aoMover);
    alvo.addEventListener('pointerleave', () => {
      mira.setAttribute('opacity', 0);
      esconderDica(ctx.dica);
    });
  });

  return ctx;
}

/* =========================================================================
 * 3. Barras divergentes: desvio de chuva por região
 * ====================================================================== */

export function graficoRegioes(destino, regioes, ordem, opcoes = {}) {
  const warm = lerToken('--warm');
  const cool = lerToken('--cool');

  const ctx = criarFigura(destino, {
    titulo: opcoes.titulo ?? 'O Brasil partido em dois',
    subtitulo:
      opcoes.subtitulo ??
      'Desvio típico da chuva na estação mais sensível de cada região durante um El Niño forte. A barra mostra o valor central; a linha, a variação observada entre eventos.',
    comoLer:
      opcoes.comoLer ??
      'cada barra é uma região. Para a esquerda, chuva abaixo da média; para a direita, acima. ' +
      'A linha fina que atravessa a barra mostra a variação observada entre eventos: quanto mais ' +
      'longa, menos confiável é o valor central.',
    fonte: opcoes.fonte ?? 'Composição a partir de INPE/CPTEC, INMET e IRI',
    legenda: [
      { rotulo: 'Chuva abaixo da média', cor: warm },
      { rotulo: 'Chuva acima da média', cor: cool },
    ],
    tabela: {
      legenda: 'Desvio de chuva (%) e de temperatura (°C) por região, em El Niño forte.',
      colunas: ['Região', 'Chuva (%)', 'Faixa observada (%)', 'Temperatura (°C)', 'Confiança do sinal'],
      linhas: ordem.map((k) => {
        const r = regioes[k];
        return [
          r.nome,
          comSinal(r.chuva, 0),
          `${comSinal(r.chuvaFaixa[0], 0)} a ${comSinal(r.chuvaFaixa[1], 0)}`,
          comSinal(r.temperatura, 1),
          r.confianca,
        ];
      }),
    },
    aspecto: 0.44,
    alturaMin: 300,
    alturaMax: 400,
  });

  ligarRedesenho(ctx, (svg, w, h) => {
    const m = { t: 16, r: 58, b: 34, l: Math.min(118, w * 0.24) };
    const pw = w - m.l - m.r;
    const ph = h - m.t - m.b;
    const lim = 75;
    const x = escalaLinear([-lim, lim], [m.l, m.l + pw]);
    const faixa = ph / ordem.length;
    const altura = Math.min(24, faixa - 14); // <= 24 px, com folga entre barras

    for (const t of ticks(-lim, lim, 6)) {
      el('line', { class: 'linha-grade', x1: x(t), x2: x(t), y1: m.t, y2: m.t + ph }, svg);
      el('text', { class: 'eixo-texto', x: x(t), y: h - 12, 'text-anchor': 'middle' }, svg).textContent =
        `${comSinal(t, 0)}%`;
    }
    el('line', { class: 'linha-base', x1: x(0), x2: x(0), y1: m.t, y2: m.t + ph }, svg);

    ordem.forEach((chave, i) => {
      const r = regioes[chave];
      const y0 = m.t + i * faixa + (faixa - altura) / 2;
      const seca = r.chuva < 0;
      const cor = seca ? warm : cool;

      // faixa observada entre eventos
      const yMeio = y0 + altura / 2;
      el(
        'line',
        {
          x1: x(r.chuvaFaixa[0]), x2: x(r.chuvaFaixa[1]), y1: yMeio, y2: yMeio,
          stroke: lerToken('--axis'), 'stroke-width': 1,
        },
        svg
      );
      for (const v of r.chuvaFaixa) {
        el(
          'line',
          { x1: x(v), x2: x(v), y1: yMeio - 5, y2: yMeio + 5, stroke: lerToken('--axis'), 'stroke-width': 1 },
          svg
        );
      }

      el(
        'path',
        {
          d: barraHorizontal(x(0), y0, altura, Math.abs(x(r.chuva) - x(0)), 4, seca ? -1 : 1),
          fill: cor,
        },
        svg
      );

      el('text', { class: 'eixo-texto', x: m.l - 14, y: yMeio + 4, 'text-anchor': 'end' }, svg).textContent =
        r.nome;

      const tx = seca ? x(r.chuvaFaixa[0]) - 10 : x(r.chuvaFaixa[1]) + 10;
      el(
        'text',
        { class: 'rotulo-direto', x: tx, y: yMeio + 4, 'text-anchor': seca ? 'end' : 'start' },
        svg
      ).textContent = `${comSinal(r.chuva, 0)}%`;

      // alvo de toque generoso
      const alvo = el(
        'rect',
        { x: m.l, y: m.t + i * faixa, width: pw, height: faixa, fill: 'transparent' },
        svg
      );
      alvo.addEventListener('pointerenter', () =>
        mostrarDica(
          ctx.dica,
          ctx.area,
          ((x(0) + (seca ? -60 : 60)) / w) * ctx.area.clientWidth,
          (yMeio / h) * ctx.area.clientHeight - 6,
          r.nome,
          [
            { nome: 'Chuva', valor: `${comSinal(r.chuva, 0)}%`, cor },
            { nome: 'Temperatura', valor: `${comSinal(r.temperatura, 1)} °C` },
            { nome: 'Estação', valor: r.estacao.split('(')[0].trim() },
          ]
        )
      );
      alvo.addEventListener('pointerleave', () => esconderDica(ctx.dica));
    });
  });

  return ctx;
}

/* =========================================================================
 * 4. Barras horizontais com destaque: ranking de intensidade
 * ====================================================================== */

export function graficoRanking(destino, itens, opcoes = {}) {
  const warm = lerToken('--warm');
  const destaques = opcoes.destaques ?? ['2023–24'];

  const ctx = criarFigura(destino, {
    titulo: opcoes.titulo ?? 'Os dez El Niños mais fortes desde 1950',
    subtitulo: opcoes.subtitulo ?? 'Pico do ONI em cada evento, em °C acima da média.',
    comoLer:
      opcoes.comoLer ??
      'os eventos em ordem de intensidade, do mais forte no topo. O comprimento da barra é o ' +
      'valor máximo que o ONI atingiu naquele evento.',
    fonte: opcoes.fonte ?? 'NOAA / Climate Prediction Center',
    tabela: {
      legenda: 'Pico do ONI por evento, em °C.',
      colunas: ['Evento', 'Pico do ONI (°C)'],
      linhas: itens.map((d) => [d.rotulo, comSinal(d.pico, 1)]),
    },
    aspecto: 0.6,
    alturaMin: 320,
    alturaMax: 440,
  });

  ligarRedesenho(ctx, (svg, w, h) => {
    const m = { t: 8, r: 52, b: 26, l: Math.min(84, w * 0.2) };
    const pw = w - m.l - m.r;
    const ph = h - m.t - m.b;
    const x = escalaLinear([0, 2.8], [m.l, m.l + pw]);
    const faixa = ph / itens.length;
    const altura = Math.min(20, faixa - 8);

    for (const t of ticks(0, 2.8, 4)) {
      el('line', { class: 'linha-grade', x1: x(t), x2: x(t), y1: m.t, y2: m.t + ph }, svg);
      el('text', { class: 'eixo-texto', x: x(t), y: h - 8, 'text-anchor': 'middle' }, svg).textContent =
        comSinal(t, 1);
    }
    el('line', { class: 'linha-base', x1: x(0), x2: x(0), y1: m.t, y2: m.t + ph }, svg);

    itens.forEach((d, i) => {
      const y0 = m.t + i * faixa + (faixa - altura) / 2;
      const emFoco = destaques.includes(d.rotulo);
      el(
        'path',
        {
          d: barraHorizontal(x(0), y0, altura, x(d.pico) - x(0), 4, 1),
          fill: emFoco ? warm : lerToken('--neutral'),
        },
        svg
      );
      el(
        'text',
        { class: 'eixo-texto', x: m.l - 12, y: y0 + altura / 2 + 4, 'text-anchor': 'end' },
        svg
      ).textContent = d.rotulo;
      el(
        'text',
        {
          class: emFoco ? 'rotulo-direto' : 'rotulo-direto rotulo-direto--fraco',
          x: x(d.pico) + 10, y: y0 + altura / 2 + 4,
        },
        svg
      ).textContent = comSinal(d.pico, 1);
    });
  });

  return ctx;
}

/* =========================================================================
 * 5. Colunas com ênfase: nível mínimo do rio Negro
 * ====================================================================== */

export function graficoRioNegro(destino, dados, opcoes = {}) {
  const warm = lerToken('--warm');

  const ctx = criarFigura(destino, {
    titulo: opcoes.titulo ?? 'A régua de Manaus, medida desde 1902',
    subtitulo:
      opcoes.subtitulo ??
      'Nível mínimo do rio Negro atingido em anos marcantes. Quanto menor a barra, mais grave a seca. Os dois menores valores da série inteira são de 2023 e 2024.',
    comoLer:
      opcoes.comoLer ??
      'cada barra é o nível mínimo que o rio atingiu naquele ano. Aqui a barra curta é a má ' +
      'notícia: quanto menor, mais grave foi a seca.',
    fonte: opcoes.fonte ?? 'Porto de Manaus / SGB-CPRM',
    tabela: {
      legenda: 'Nível mínimo anual do rio Negro no porto de Manaus, em metros.',
      colunas: ['Ano', 'Nível mínimo (m)', 'Fase do ENOS'],
      linhas: dados.map((d) => [
        String(d.ano),
        fmt2.format(d.nivel),
        d.oni === 'nino' ? 'El Niño' : d.oni === 'nina' ? 'La Niña' : 'Neutro',
      ]),
    },
    aspecto: 0.42,
    alturaMin: 280,
    alturaMax: 380,
  });

  ligarRedesenho(ctx, (svg, w, h) => {
    const m = { t: 30, r: 14, b: 44, l: 40 };
    const pw = w - m.l - m.r;
    const ph = h - m.t - m.b;
    const y = escalaLinear([12, 19], [m.t + ph, m.t]);
    const passo = pw / dados.length;
    const larg = Math.min(24, passo - 14);

    for (const t of ticks(12, 19, 5)) {
      el('line', { class: 'linha-grade', x1: m.l, x2: m.l + pw, y1: y(t), y2: y(t) }, svg);
      el('text', { class: 'eixo-texto', x: m.l - 8, y: y(t) + 4, 'text-anchor': 'end' }, svg).textContent =
        fmt0.format(t);
    }
    el('text', { class: 'eixo-texto', x: m.l - 8, y: m.t - 12, 'text-anchor': 'end' }, svg).textContent = 'm';

    dados.forEach((d, i) => {
      const cx = m.l + i * passo + (passo - larg) / 2;
      const base = m.t + ph;
      const alt = base - y(d.nivel);
      el(
        'path',
        {
          d: barraVertical(cx, base, larg, alt, 4, 1),
          fill: d.destaque ? warm : lerToken('--neutral'),
        },
        svg
      );
      el(
        'text',
        {
          class: d.destaque ? 'rotulo-direto' : 'rotulo-direto rotulo-direto--fraco',
          x: cx + larg / 2, y: y(d.nivel) - 10, 'text-anchor': 'middle',
        },
        svg
      ).textContent = fmt2.format(d.nivel);
      el(
        'text',
        { class: 'eixo-texto', x: cx + larg / 2, y: h - 24, 'text-anchor': 'middle' },
        svg
      ).textContent = String(d.ano);
      const fase = d.oni === 'nino' ? 'El Niño' : d.oni === 'nina' ? 'La Niña' : 'neutro';
      el(
        'text',
        { class: 'eixo-texto', x: cx + larg / 2, y: h - 8, 'text-anchor': 'middle', opacity: 0.75 },
        svg
      ).textContent = fase;

      const alvo = el(
        'rect',
        { x: m.l + i * passo, y: m.t, width: passo, height: ph, fill: 'transparent' },
        svg
      );
      alvo.addEventListener('pointerenter', () =>
        mostrarDica(
          ctx.dica,
          ctx.area,
          ((cx + larg / 2) / w) * ctx.area.clientWidth,
          (y(d.nivel) / h) * ctx.area.clientHeight - 8,
          String(d.ano),
          [
            { nome: 'Nível mínimo', valor: `${fmt2.format(d.nivel)} m`, cor: d.destaque ? warm : lerToken('--neutral') },
            { nome: 'Fase', valor: fase },
          ]
        )
      );
      alvo.addEventListener('pointerleave', () => esconderDica(ctx.dica));
    });
  });

  return ctx;
}

/* =========================================================================
 * 6. Matriz de impacto: região x setor
 * ====================================================================== */

export function graficoMatriz(destino, matriz, regioes, ordem, opcoes = {}) {
  const escalaCor = {
    '-3': lerToken('--warm-5'),
    '-2': lerToken('--warm-4'),
    '-1': lerToken('--warm-2'),
    0: lerToken('--surface-3'),
    1: lerToken('--cool-3'),
    2: lerToken('--cool-4'),
  };

  const ctx = criarFigura(destino, {
    titulo: opcoes.titulo ?? 'Onde o El Niño dói mais',
    subtitulo:
      opcoes.subtitulo ??
      'Síntese qualitativa do impacto por setor e região em um evento forte. O Sul é a única parte do país que colhe algum benefício, e ainda assim paga em enchentes.',
    comoLer:
      opcoes.comoLer ??
      'leia uma linha de cada vez, da esquerda para a direita: é uma região atravessando todos os ' +
      'setores. Quanto mais escura e mais laranja a célula, pior o impacto; o azul indica efeito ' +
      'favorável e o cinza, ausência de sinal claro.',
    fonte: opcoes.fonte ?? 'Síntese a partir de Conab, ONS, Embrapa, Ministério da Saúde e Cemaden',
    tabela: {
      legenda: 'Escala de −3 (impacto severo) a +2 (efeito muito favorável).',
      colunas: ['Região', ...matriz.setores],
      linhas: ordem.map((k) => [regioes[k].nome, ...matriz.valores[k].map((v) => comSinal(v, 0))]),
    },
    aspecto: 0.42,
    alturaMin: 280,
    alturaMax: 380,
  });

  ligarRedesenho(ctx, (svg, w, h) => {
    const m = { t: 54, r: 10, b: 40, l: Math.min(112, w * 0.22) };
    const pw = w - m.l - m.r;
    const ph = h - m.t - m.b;
    const colW = pw / matriz.setores.length;
    const rowH = ph / ordem.length;

    const CURTO = {
      Agricultura: 'Agric.', Transporte: 'Transp.', Ecossistemas: 'Ecoss.', Energia: 'Energia',
    };
    matriz.setores.forEach((s, j) => {
      const tx = m.l + j * colW + colW / 2;
      el(
        'text',
        { class: 'eixo-texto', x: tx, y: m.t - 14, 'text-anchor': 'middle' },
        svg
      ).textContent = colW < 86 ? (CURTO[s] ?? s) : s;
    });

    ordem.forEach((chave, i) => {
      const r = regioes[chave];
      const y0 = m.t + i * rowH;
      el(
        'text',
        { class: 'eixo-texto', x: m.l - 12, y: y0 + rowH / 2 + 4, 'text-anchor': 'end' },
        svg
      ).textContent = r.nome;

      matriz.valores[chave].forEach((v, j) => {
        const x0 = m.l + j * colW;
        el(
          'rect',
          {
            x: x0 + 1, y: y0 + 1, width: colW - 2, height: rowH - 2, // 2 px de respiro entre células
            rx: 4, fill: escalaCor[String(v)],
          },
          svg
        );
        el(
          'text',
          {
            x: x0 + colW / 2, y: y0 + rowH / 2 + 4, 'text-anchor': 'middle',
            'font-size': 12, 'font-weight': 600,
            fill: v <= -2 || v >= 1 ? '#0b1720' : lerToken('--ink-2'),
          },
          svg
        ).textContent = v === 0 ? '0' : comSinal(v, 0);

        const alvo = el(
          'rect',
          { x: x0, y: y0, width: colW, height: rowH, fill: 'transparent' },
          svg
        );
        alvo.addEventListener('pointerenter', () =>
          mostrarDica(
            ctx.dica,
            ctx.area,
            ((x0 + colW / 2) / w) * ctx.area.clientWidth,
            (y0 / h) * ctx.area.clientHeight,
            `${r.nome} · ${matriz.setores[j]}`,
            [{ nome: matriz.legenda[String(v)], valor: comSinal(v, 0), cor: escalaCor[String(v)] }]
          )
        );
        alvo.addEventListener('pointerleave', () => esconderDica(ctx.dica));
      });
    });

    // escala de cor, em linha única: rótulo · amostras · rótulo
    const largura = Math.min(22, (pw - 150) / 6);
    const yEsc = h - 14;
    const base = m.l + 54;
    el('text', { class: 'eixo-texto', x: m.l, y: yEsc + 4 }, svg).textContent = 'severo';
    ['-3', '-2', '-1', '0', '1', '2'].forEach((k, i) => {
      el(
        'rect',
        { x: base + i * (largura + 2), y: yEsc - 4, width: largura, height: 8, rx: 2, fill: escalaCor[k] },
        svg
      );
    });
    el(
      'text',
      { class: 'eixo-texto', x: base + 6 * (largura + 2) + 6, y: yEsc + 4 },
      svg
    ).textContent = 'favorável';
  });

  return ctx;
}
