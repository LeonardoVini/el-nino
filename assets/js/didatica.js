/**
 * Camada didática.
 * ---------------------------------------------------------------------------
 * Tudo aqui existe para reduzir o atrito de quem lê pela primeira vez: o
 * resumo no alto de cada capítulo, o glossário que abre dentro da frase, a
 * checagem no fim de cada trecho, o índice com o progresso, o modo essencial
 * e a ficha de estudo que sai na impressora.
 *
 * Nada é guardado entre visitas: o site continua sem cookies e sem coleta.
 */

import * as dados from './data.js';
import { $, $$, elemento, porQuadro } from './dom.js';
import { comSinal } from './charts.js';

/* =========================================================================
 * 1. Resumo no alto de cada capítulo
 * ====================================================================== */

export function montarResumos() {
  for (const r of dados.resumos) {
    const destino = $(`[data-resumo="${r.secao}"]`);
    if (!destino) continue;
    elemento('p', 'resumo__olho', destino, 'Em resumo');
    const lista = elemento('ul', null, destino);
    for (const ponto of r.pontos) elemento('li', null, lista, ponto);
  }
}

/* =========================================================================
 * 2. Glossário: a definição aparece dentro da frase
 * ---------------------------------------------------------------------------
 * A primeira ocorrência de cada termo no texto corrido vira um botão. O
 * balão é um só, reaproveitado, e some com Esc, com clique fora ou quando o
 * termo sai da tela.
 * ====================================================================== */

const SELETOR_TEXTO = [
  '.prosa p', '.cartao p', '.linha-fina', '.nota', '.etapa p', '.eco p',
  '.tempo__item p', '.instrumento p', '.mito__texto', '.painel-regiao p',
  '.projecao__intro', '.projecao__aviso', '.simulador__texto', '.onde__nota',
  '.etapas__dica', '.comparar__ajuda', '.comparacao__lado p', '.resumo li',
  '.painel-regiao .lista-impactos li',
].join(', ');

const FORA = '#glossario, #ficha, #sumario, .quiz, .checagem, .figura, .balao';

const LETRA = /\p{L}/u;

/** Só vale como ocorrência se não estiver colada em outra palavra. */
function isolada(texto, i, n) {
  const antes = texto[i - 1];
  const depois = texto[i + n];
  return (!antes || !LETRA.test(antes)) && (!depois || !LETRA.test(depois));
}

function marcarNo(elementoTexto, variacao, item) {
  const alvo = variacao.toLowerCase();
  const andador = document.createTreeWalker(elementoTexto, NodeFilter.SHOW_TEXT);
  let no;
  while ((no = andador.nextNode())) {
    if (no.parentElement.closest('a, button')) continue;
    const texto = no.nodeValue;
    const baixo = texto.toLowerCase();
    let i = baixo.indexOf(alvo);
    while (i >= 0 && !isolada(texto, i, alvo.length)) {
      i = baixo.indexOf(alvo, i + 1);
    }
    if (i < 0) continue;

    const meio = no.splitText(i);
    meio.splitText(alvo.length);

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'termo';
    botao.dataset.termo = item.id;
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', `${meio.nodeValue}: ver definição`);
    botao.textContent = meio.nodeValue;
    meio.replaceWith(botao);
    return true;
  }
  return false;
}

function criarBalao() {
  const balao = elemento('div', 'balao', document.body);
  balao.id = 'balao-glossario';
  balao.setAttribute('role', 'dialog');
  balao.setAttribute('aria-label', 'Definição do termo');
  balao.hidden = true;

  const titulo = elemento('h3', 'balao__titulo', balao);
  const texto = elemento('p', 'balao__texto', balao);
  const rodape = elemento('div', 'balao__rodape', balao);
  const link = elemento('a', null, rodape, 'Ver no glossário');
  const fechar = elemento('button', 'balao__fechar', rodape, 'Fechar');
  fechar.type = 'button';

  let ancora = null;

  function posicionar() {
    if (!ancora) return;
    const r = ancora.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return esconder();
    const largura = Math.min(340, window.innerWidth - 24);
    balao.style.width = `${largura}px`;
    const meio = r.left + r.width / 2;
    const esq = Math.max(12, Math.min(window.innerWidth - largura - 12, meio - largura / 2));
    balao.style.left = `${esq}px`;
    const acima = r.top > balao.offsetHeight + 16;
    balao.dataset.lado = acima ? 'acima' : 'abaixo';
    balao.style.top = acima
      ? `${r.top - balao.offsetHeight - 10}px`
      : `${r.bottom + 10}px`;
  }

  function esconder() {
    if (!ancora) return;
    ancora.setAttribute('aria-expanded', 'false');
    ancora = null;
    balao.hidden = true;
  }

  function mostrar(botao, item) {
    if (ancora === botao) return esconder();
    esconder();
    ancora = botao;
    botao.setAttribute('aria-expanded', 'true');
    titulo.textContent = item.termo;
    texto.textContent = item.definicao;
    link.href = `#g-${item.id}`;
    balao.hidden = false;
    posicionar();
  }

  fechar.addEventListener('click', esconder);
  link.addEventListener('click', esconder);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') esconder();
  });
  document.addEventListener('click', (e) => {
    if (!ancora) return;
    if (!balao.contains(e.target) && !e.target.closest('.termo')) esconder();
  });
  window.addEventListener('scroll', porQuadro(posicionar), { passive: true });
  window.addEventListener('resize', porQuadro(posicionar));

  return { mostrar, esconder };
}

function montarListaGlossario() {
  const destino = $('#lista-glossario');
  if (!destino) return;
  for (const item of [...dados.glossario].sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'))) {
    const bloco = elemento('div', 'glossario__item', destino);
    bloco.id = `g-${item.id}`;
    elemento('dt', null, bloco, item.termo);
    elemento('dd', null, bloco, item.definicao);
  }
}

/** Formas mais longas primeiro: "circulação de Walker" antes de "Walker". */
const VARIACOES = dados.glossario
  .flatMap((item) => item.variacoes.map((variacao) => ({ variacao, item })))
  .sort((a, b) => b.variacao.length - a.variacao.length);

/**
 * Marca, dentro de `raiz`, a primeira ocorrência de cada termo ainda não
 * marcado. `jaMarcados` atravessa as chamadas para que, no texto corrido do
 * site, cada termo apareça sublinhado uma vez só.
 */
function marcarTermos(raiz, jaMarcados = new Set()) {
  const alvos = raiz.matches?.(SELETOR_TEXTO) ? [raiz, ...$$(SELETOR_TEXTO, raiz)] : $$(SELETOR_TEXTO, raiz);
  for (const alvo of alvos) {
    if (alvo.closest(FORA)) continue;
    const conteudo = alvo.textContent.toLowerCase();
    for (const { variacao, item } of VARIACOES) {
      if (jaMarcados.has(item.id)) continue;
      if (!conteudo.includes(variacao.toLowerCase())) continue;
      if (marcarNo(alvo, variacao, item)) jaMarcados.add(item.id);
    }
  }
  return jaMarcados;
}

/**
 * Painéis que o site reescreve em tempo de uso (a região no mapa, o estado
 * escolhido) recebem a marcação de novo a cada montagem, com o contador
 * zerado: ali o termo pode ser a primeira coisa que o leitor encontra.
 */
export function marcarTermosDinamicos(raiz) {
  if (raiz) marcarTermos(raiz, new Set());
}

export function ligarGlossario() {
  montarListaGlossario();
  marcarTermos(document);

  const balao = criarBalao();
  const porId = new Map(dados.glossario.map((g) => [g.id, g]));
  document.addEventListener('click', (e) => {
    const botao = e.target.closest('.termo');
    if (!botao) return;
    e.preventDefault();
    balao.mostrar(botao, porId.get(botao.dataset.termo));
  });
}

/* =========================================================================
 * 3. Checagem rápida no fim do capítulo
 * ====================================================================== */

export function montarChecagens() {
  for (const c of dados.checagens) {
    const destino = $(`[data-checagem="${c.secao}"]`);
    if (!destino) continue;

    const bloco = elemento('div', 'checagem revela', destino);
    elemento('p', 'checagem__olho', bloco, 'Checagem rápida');
    const pergunta = elemento('h3', 'checagem__pergunta', bloco, c.pergunta);
    pergunta.id = `checagem-${c.secao}`;

    const grupo = elemento('div', 'checagem__opcoes', bloco);
    grupo.setAttribute('role', 'group');
    grupo.setAttribute('aria-labelledby', pergunta.id);

    const resposta = elemento('div', 'checagem__resposta', bloco);
    resposta.hidden = true;
    resposta.setAttribute('role', 'status');

    const botoes = c.opcoes.map((texto, j) => {
      const b = elemento('button', 'checagem__opcao', grupo, texto);
      b.type = 'button';
      b.addEventListener('click', () => {
        const certo = j === c.correta;
        botoes.forEach((outro, k) => {
          outro.disabled = true;
          outro.dataset.estado = k === c.correta ? 'certa' : k === j ? 'errada' : 'apagada';
        });
        resposta.hidden = false;
        resposta.dataset.tom = certo ? 'certo' : 'errado';
        resposta.textContent = '';
        elemento('strong', null, resposta, certo ? 'Isso mesmo. ' : 'Ainda não. ');
        elemento('span', null, resposta, c.explicacao);
      });
      return b;
    });
  }
}

/* =========================================================================
 * 4. Mitos
 * ====================================================================== */

export function montarMitos() {
  const destino = $('#lista-mitos');
  if (!destino) return;
  for (const m of dados.mitos) {
    const bloco = elemento('article', 'mito revela', destino);
    elemento('p', 'mito__frase', bloco, `“${m.mito}”`);
    elemento('p', 'mito__veredito', bloco, m.veredito);
    elemento('p', 'mito__texto', bloco, m.texto);
  }
}

/* =========================================================================
 * 5. Onde você mora
 * ====================================================================== */

export function ligarOndeVoceMora(aoEscolher) {
  const select = $('#escolher-estado');
  const destino = $('#onde-resposta');
  if (!select || !destino) return;

  for (const chave of dados.ordemRegioes) {
    const grupo = elemento('optgroup', null, select);
    grupo.label = `Região ${dados.regioesBrasil[chave].nome}`;
    for (const e of dados.estados.filter((e) => e.regiao === chave)) {
      const op = elemento('option', null, grupo, `${e.nome} (${e.uf})`);
      op.value = e.uf;
    }
  }

  function pintar(uf) {
    destino.textContent = '';
    if (!uf) {
      aoEscolher?.(null, null);
      return;
    }
    const estado = dados.estados.find((e) => e.uf === uf);
    const regiao = dados.regioesBrasil[estado.regiao];

    const cabeca = elemento('div', 'onde__cabecalho', destino);
    elemento('h4', null, cabeca, estado.nome);
    elemento('span', 'onde__regiao', cabeca, `Região ${regiao.nome}`);

    const medidas = elemento('div', 'medidas', destino);
    const bloco = (rotulo, valor, faixa) => {
      const m = elemento('div', 'medida', medidas);
      elemento('div', 'medida__rotulo', m, rotulo);
      elemento('div', 'medida__valor', m, valor);
      elemento('div', 'medida__faixa', m, faixa);
    };
    bloco('Chuva na região', `${comSinal(regiao.chuva, 0)}%`,
      `entre ${comSinal(regiao.chuvaFaixa[0], 0)}% e ${comSinal(regiao.chuvaFaixa[1], 0)}%`);
    bloco('Temperatura', `${comSinal(regiao.temperatura, 1)} °C`, 'acima da média');
    const detalhe = regiao.estacao.includes('(')
      ? regiao.estacao.split('(')[1].replace(')', '')
      : '';
    bloco('Quando o sinal aparece', regiao.estacao.split('(')[0].trim(), detalhe);
    bloco('Confiança', regiao.confianca,
      regiao.confianca === 'alta' ? 'padrão consistente entre eventos' : 'varia muito de evento para evento');

    elemento('p', 'onde__nota', destino, estado.nota);
    elemento('p', 'onde__aviso', destino,
      'Os números são o desvio típico da região inteira em um El Niño forte, não uma ' +
      'previsão para o seu município: dentro de um mesmo estado o efeito varia bastante.');

    marcarTermosDinamicos(destino);
    aoEscolher?.(estado.regiao, uf);
  }

  select.addEventListener('change', () => pintar(select.value));
}

/* =========================================================================
 * 6. Índice lateral, progresso de leitura e modo essencial
 * ====================================================================== */

function capitulos() {
  return $$('main > section[id]')
    .filter((s) => !s.hidden && s.id !== 'ficha')
    .map((s) => ({
      secao: s,
      olho: $('.olho', s)?.textContent.trim() ?? '',
      titulo: $('h2', s)?.textContent.trim() ?? s.id,
    }));
}

export function ligarSumario() {
  const painel = $('#sumario');
  const fundo = $('#sumario-fundo');
  const abrir = $('#abrir-indice');
  const fechar = $('#fechar-indice');
  const lista = $('#sumario-lista');
  if (!painel || !abrir) return;

  const itens = capitulos().map((c) => {
    const a = elemento('a', 'sumario__item', lista);
    a.href = `#${c.secao.id}`;
    const linha = elemento('span', 'sumario__linha', a);
    elemento('span', 'sumario__olho', linha, c.olho);
    elemento('span', 'sumario__titulo', linha, c.titulo);
    const trilha = elemento('span', 'sumario__trilha', a);
    const barra = elemento('span', 'sumario__barra', trilha);
    a.addEventListener('click', () => alternar(false));
    return { ...c, a, barra };
  });

  const atualizarProgresso = porQuadro(() => {
    if (painel.hidden) return;
    for (const item of itens) {
      const r = item.secao.getBoundingClientRect();
      const visto = window.innerHeight * 0.55 - r.top;
      const p = Math.max(0, Math.min(1, visto / Math.max(1, r.height)));
      item.barra.style.width = `${p * 100}%`;
      item.a.dataset.estado = p >= 0.98 ? 'lido' : p > 0.02 ? 'lendo' : 'aberto';
    }
  });

  function alternar(abrirAgora) {
    painel.hidden = !abrirAgora;
    fundo.hidden = !abrirAgora;
    abrir.setAttribute('aria-expanded', String(abrirAgora));
    document.body.dataset.indice = abrirAgora ? 'aberto' : 'fechado';
    if (abrirAgora) {
      atualizarProgresso();
      fechar.focus();
    } else {
      abrir.focus();
    }
  }

  abrir.addEventListener('click', () => alternar(painel.hidden));
  fechar.addEventListener('click', () => alternar(false));
  fundo.addEventListener('click', () => alternar(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !painel.hidden) alternar(false);
  });
  window.addEventListener('scroll', atualizarProgresso, { passive: true });

  ligarNiveis();
  ligarImpressao();
}

function ligarNiveis() {
  const botoes = $$('.niveis button');
  if (!botoes.length) return;
  document.body.dataset.nivel = 'completo';
  for (const b of botoes) {
    b.addEventListener('click', () => {
      document.body.dataset.nivel = b.dataset.nivel;
      for (const outro of botoes) {
        outro.setAttribute('aria-pressed', String(outro === b));
      }
    });
  }
}

function ligarImpressao() {
  const botao = $('#imprimir-ficha');
  if (!botao) return;
  botao.addEventListener('click', () => {
    document.body.dataset.imprimir = 'ficha';
    window.print();
  });
  window.addEventListener('afterprint', () => {
    delete document.body.dataset.imprimir;
  });
}

/* =========================================================================
 * 7. Ficha de estudo, montada para o papel
 * ====================================================================== */

export function montarFicha() {
  const colunas = $('#ficha-resumos');
  if (!colunas) return;

  for (const r of dados.resumos) {
    const bloco = elemento('section', 'ficha__bloco', colunas);
    elemento('h3', null, bloco, r.titulo);
    const lista = elemento('ul', null, bloco);
    for (const ponto of r.pontos) elemento('li', null, lista, ponto);
  }

  const glossario = $('#ficha-glossario');
  elemento('h3', null, glossario, 'Glossário');
  const dl = elemento('dl', null, glossario);
  for (const g of [...dados.glossario].sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'))) {
    const linha = elemento('div', null, dl);
    elemento('dt', null, linha, g.termo);
    elemento('dd', null, linha, g.definicao);
  }

  const quiz = $('#ficha-quiz');
  elemento('h3', null, quiz, 'Questões');
  const ol = elemento('ol', 'ficha__questoes', quiz);
  dados.perguntasQuiz.forEach((q) => {
    const li = elemento('li', null, ol);
    elemento('p', 'ficha__pergunta', li, q.pergunta);
    const opcoes = elemento('ol', 'ficha__opcoes', li);
    for (const o of q.opcoes) elemento('li', null, opcoes, o);
  });

  const gabarito = dados.perguntasQuiz
    .map((q, i) => `${i + 1}. ${String.fromCharCode(97 + q.correta)}`)
    .join('   ');
  elemento('p', 'ficha__gabarito', quiz, `Gabarito: ${gabarito}`);
}
