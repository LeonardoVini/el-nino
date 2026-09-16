/**
 * Ponto de entrada: monta os componentes, liga as cenas 3D aos controles de
 * fase e injeta o conteúdo que vem de `data.js`.
 */

import * as dados from './data.js';
import {
  graficoONI, graficoEvolucao, graficoRegioes, graficoRanking, graficoRioNegro,
  graficoMatriz, comSinal, fmt1,
} from './charts.js';
import { criarMapaBrasil, corAnomalia, FAIXAS_LEGENDA } from './brasil-map.js';
import { $, $$, token, elemento } from './dom.js';
import {
  montarResumos, ligarGlossario, montarChecagens, montarMitos,
  ligarOndeVoceMora, ligarSumario, montarFicha, marcarTermosDinamicos,
} from './didatica.js';

/* =========================================================================
 * Navegação, progresso e revelação
 * ====================================================================== */

function ligarNavegacao() {
  const topo = $('#topo');
  const progresso = $('#progresso');
  const links = $$('.nav a');
  const secoes = links
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  let pendente = false;
  const aoRolar = () => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => {
      pendente = false;
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progresso.style.setProperty('--p', `${total > 0 ? (y / total) * 100 : 0}%`);
      topo.dataset.rolado = String(y > 20);
    });
  };
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        const i = secoes.indexOf(e.target);
        links.forEach((a, j) => a.setAttribute('aria-current', String(j === i)));
      }
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  secoes.forEach((s) => observador.observe(s));
}

function ligarRevelacao() {
  const alvos = $$('.revela');
  if (!('IntersectionObserver' in window)) {
    alvos.forEach((a) => (a.dataset.visivel = 'true'));
    return;
  }

  const pendentes = new Set(alvos);

  const revelar = (alvo) => {
    alvo.dataset.visivel = 'true';
    pendentes.delete(alvo);
    obs.unobserve(alvo);
  };

  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) if (e.isIntersecting) revelar(e.target);
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  alvos.forEach((a) => obs.observe(a));

  /**
   * Uma rolagem muito rápida pode levar um elemento de baixo da dobra para
   * cima dela entre dois cálculos do observador, que então nunca reporta
   * interseção e o bloco fica invisível. Esta varredura, que só percorre o
   * que ainda falta revelar, fecha essa brecha.
   */
  let agendado = false;
  const varrer = () => {
    agendado = false;
    if (!pendentes.size) {
      window.removeEventListener('scroll', aoRolar);
      return;
    }
    const limite = window.innerHeight * 0.92;
    for (const alvo of [...pendentes]) {
      if (alvo.getBoundingClientRect().top < limite) revelar(alvo);
    }
  };
  const aoRolar = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(varrer);
  };
  window.addEventListener('scroll', aoRolar, { passive: true });
  varrer();
}

/**
 * Monta as etapas do mecanismo e liga cada uma ao simulador: clicar leva a
 * cena ao estágio correspondente e diz o que olhar nela. A ordem das etapas
 * percorre o eixo de intensidade na sequência em que o evento acontece.
 */
function montarEtapas() {
  const destino = $('#etapas-mecanismo');
  if (!destino) return;

  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selecionada = -1;

  const etapas = dados.etapasMecanismo.map((e, i) => {
    const item = elemento('li', 'etapa', destino);
    const corpo = elemento('div', null, item);
    elemento('h3', null, corpo, e.titulo);
    elemento('p', null, corpo, e.texto);

    const acao = elemento('button', 'etapa__ver', corpo, 'Ver na cena');
    acao.type = 'button';
    acao.setAttribute('aria-pressed', 'false');

    const foco = elemento('p', 'etapa__foco', corpo, e.foco);
    foco.hidden = true;

    acao.addEventListener('click', () => escolher(i));
    return { item, acao, foco, oni: e.oni };
  });

  function escolher(i) {
    if (selecionada === i) return desmarcar();
    selecionada = i;
    etapas.forEach((et, j) => {
      const ativa = j === i;
      et.item.dataset.selecionada = String(ativa);
      et.acao.setAttribute('aria-pressed', String(ativa));
      et.acao.textContent = ativa ? 'Mostrando na cena' : 'Ver na cena';
      et.foco.hidden = !ativa;
    });
    definirONI(etapas[i].oni);

    const palco = $('#palco-pacifico');
    const r = palco?.getBoundingClientRect();
    if (r && (r.bottom < 80 || r.top > window.innerHeight - 120)) {
      palco.scrollIntoView({ block: 'center', behavior: suave ? 'smooth' : 'auto' });
    }
  }

  function desmarcar() {
    selecionada = -1;
    for (const et of etapas) {
      et.item.dataset.selecionada = 'false';
      et.acao.setAttribute('aria-pressed', 'false');
      et.acao.textContent = 'Ver na cena';
      et.foco.hidden = true;
    }
  }

  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) e.target.dataset.ativa = String(e.isIntersecting);
    },
    { rootMargin: '-40% 0px -40% 0px' }
  );
  etapas.forEach((e) => obs.observe(e.item));
}

/* =========================================================================
 * Simulador: um controle contínuo que dirige a cena e projeta o efeito
 * ====================================================================== */

/** ONI de ±2,0 °C corresponde à fase cheia da cena 3D. */
const ONI_CHEIO = 2;

/**
 * Ponte entre o simulador e a cena 3D. Começa como nada: o slider e a projeção
 * por região funcionam sozinhos, e a cena se pendura aqui quando termina de
 * carregar. Sem WebGL, o resto do simulador continua de pé.
 */
let aplicarFaseNaCena = () => {};
let oniCorrente = 0;

/** Preenchida por `ligarSimulador`: move o simulador inteiro para um ONI. */
let definirONI = () => {};

const TEXTO_FASE = {
  nina:
    'Os alísios sopram ainda mais forte, a termoclina fica quase encostada na superfície ' +
    'no leste e a ressurgência traz água fria com força total. A chuva se concentra sobre ' +
    'a Indonésia e falta no centro do oceano.',
  neutro:
    'Estado neutro: os alísios sopram firme para oeste e a termoclina fica bem inclinada, ' +
    'rasa no leste e profunda no oeste.',
  nino:
    'Os alísios afrouxam e chegam a inverter no oeste, a termoclina se nivela, a ' +
    'ressurgência desliga e a convecção se muda para o meio do Pacífico, com ar descendo ' +
    'sobre a Indonésia e sobre o norte da América do Sul.',
};

const NUANCE = {
  fraco: 'O sinal já existe, mas é sutil e outros fatores podem encobri-lo. ',
  moderado: '',
  forte: '',
  'muito forte': 'Nesta faixa o evento entra no grupo dos mais intensos já medidos. ',
};

function rotuloEvento(oni) {
  const { fase, intensidade } = dados.classificarONI(oni);
  if (fase === 'neutro') return 'Neutro';
  const nome = fase === 'nino' ? 'El Niño' : 'La Niña';
  const grau = fase === 'nina' && intensidade !== 'muito forte'
    ? intensidade.replace('fraco', 'fraca').replace('moderado', 'moderada')
    : intensidade;
  return `${nome} ${grau}`;
}

/** Monta as linhas de projeção por região e devolve a função que as atualiza. */
function montarProjecao() {
  const destino = $('#projecao-regioes');
  const linhas = dados.ordemRegioes.map((chave) => {
    const r = dados.regioesBrasil[chave];
    const linha = elemento('div', 'prev', destino);

    const nome = elemento('div', 'prev__nome', linha);
    elemento('span', null, nome, r.nome);
    if (r.confianca === 'baixa') {
      const aviso = elemento('span', 'prev__ressalva', nome, 'sinal fraco');
      aviso.title = 'Nesta região o desvio de chuva varia muito de evento para evento.';
    }

    const trilha = elemento('div', 'prev__trilha', linha);
    elemento('span', 'prev__eixo', trilha);
    const barra = elemento('span', 'prev__barra', trilha);

    const chuva = elemento('div', 'prev__chuva', linha);
    const temp = elemento('div', 'prev__temp', linha);
    return { chave, regiao: r, barra, chuva, temp, linha };
  });

  const LIMITE = 70; // a trilha vai de -70% a +70% de desvio de chuva

  return function atualizar(oni) {
    for (const l of linhas) {
      const p = dados.projetarRegiao(l.regiao, oni);
      const seco = p.chuva < 0;
      const largura = Math.min(50, (Math.abs(p.chuva) / LIMITE) * 50);

      l.barra.style.width = `${largura}%`;
      l.barra.style.left = seco ? `${50 - largura}%` : '50%';
      l.barra.style.background = p.neutro
        ? 'var(--neutral)'
        : seco ? 'var(--warm)' : 'var(--cool)';
      l.barra.style.opacity = p.neutro ? '0.35' : '1';

      l.chuva.textContent = p.neutro ? 'sem sinal' : `${comSinal(p.chuva, 0)}% de chuva`;
      l.chuva.dataset.tom = p.neutro ? 'neutro' : seco ? 'seca' : 'chuva';
      l.temp.textContent = p.neutro ? '' : `${comSinal(p.temperatura, 1)} °C`;
      l.linha.setAttribute(
        'aria-label',
        p.neutro
          ? `${l.regiao.nome}: sem sinal claro`
          : `${l.regiao.nome}: ${comSinal(p.chuva, 0)} por cento de chuva e ` +
            `${comSinal(p.temperatura, 1)} grau na temperatura`
      );
    }
  };
}

function ligarSimulador() {
  const controle = $('#controle-oni');
  const valor = $('#valor-oni');
  const classe = $('#classe-oni');
  const legenda = $('#legenda-pacifico');
  const atalhos = $$('#atalhos-oni button');
  const atualizarProjecao = montarProjecao();

  function aplicar(oni, origem) {
    valor.textContent = `${comSinal(oni, 1)} °C`;
    const { fase, intensidade } = dados.classificarONI(oni);
    classe.textContent = rotuloEvento(oni);
    classe.className = `etiqueta ${
      fase === 'nino' ? 'etiqueta--seca' : fase === 'nina' ? 'etiqueta--chuva' : 'etiqueta--misto'
    }`;
    legenda.textContent = fase === 'neutro'
      ? TEXTO_FASE.neutro
      : (NUANCE[intensidade] ?? '') + TEXTO_FASE[fase];

    oniCorrente = oni;
    aplicarFaseNaCena(Math.max(-1, Math.min(1, oni / ONI_CHEIO)));
    atualizarProjecao(oni);

    for (const b of atalhos) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.oni) === oni));
    }
    if (origem !== 'controle') controle.value = String(oni);
  }

  controle.addEventListener('input', () => aplicar(Number(controle.value), 'controle'));
  for (const b of atalhos) {
    b.addEventListener('click', () => aplicar(Number(b.dataset.oni), 'atalho'));
  }

  definirONI = (oni) => aplicar(oni, 'externo');
  aplicar(Number(controle.value), 'inicial');
}

/* =========================================================================
 * Conteúdo vindo dos dados
 * ====================================================================== */

function montarIndicadores() {
  const destino = $('#indicadores-2324');
  for (const ind of dados.indicadores2324) {
    const cartao = elemento('div', 'indicador revela', destino);
    const valor = elemento('div', 'indicador__valor', cartao, ind.valor);
    const unidade = elemento('span', 'indicador__unidade', null, ind.unidade);
    valor.appendChild(unidade);
    elemento('div', 'indicador__rotulo', cartao, ind.rotulo);
    elemento('div', 'indicador__detalhe', cartao, ind.detalhe);
    elemento('div', 'indicador__fonte', cartao, ind.fonte);
  }
}

const ICONES = {
  floresta: 'M12 3l4.5 6h-3l4 5.5h-3.5L18 20H6l4-5.5H6.5l4-5.5h-3L12 3zM12 20v2',
  seca: 'M4 17h16M6 20h12M12 4v7M9 7l3-3 3 3M5 12l2 2M19 12l-2 2',
  coral: 'M7 21c0-5 1-7 1-11M12 21c0-7 0-9 2-13M17 21c0-4-.5-6-1.5-9M4 21h16',
  peixe: 'M3 12c3-4 7-5 10-5s6 2 8 5c-2 3-5 5-8 5s-7-1-10-5zM17 11h.01M3 12l-1-3m1 3l-1 3',
  fogo: 'M12 21c3.3 0 6-2.5 6-5.5 0-4-4-5.5-4-9.5-3 1.5-4 4-4 6 0-1-1-2-2-2.5C7 11 6 13 6 15.5 6 18.5 8.7 21 12 21z',
  chuva: 'M7 15a4 4 0 010-8 5.5 5.5 0 0110.5 1.5A3.5 3.5 0 0117 15H7zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
};

function montarEcossistemas() {
  const destino = $('#cartoes-eco');
  for (const eco of dados.ecossistemas) {
    const cartao = elemento('article', 'cartao eco revela', destino);
    const icone = elemento('div', 'eco__icone', cartao);
    icone.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONES[eco.icone]}"/></svg>`;
    const cab = elemento('div', null, cartao);
    elemento('div', 'eco__chamada', cab, eco.chamada);
    const h = elemento('h3', null, cab, eco.nome);
    h.style.marginTop = '4px';
    elemento('p', null, cartao, eco.texto);
    const dl = elemento('dl', 'eco__dados', cartao);
    for (const [rotulo, valor] of eco.dados) {
      const linha = elemento('div', null, dl);
      elemento('dt', null, linha, rotulo);
      elemento('dd', null, linha, valor);
    }
    elemento('p', 'eco__fonte', cartao, `Fonte: ${eco.fonte}`);
  }
}

function montarLinhaDoTempo() {
  const destino = $('#linha-do-tempo');
  for (const item of dados.linhaDoTempo) {
    const bloco = elemento('article', 'tempo__item revela', destino);
    elemento('div', 'tempo__ponto', bloco);
    const corpo = elemento('div', null, bloco);
    const cabeca = elemento('div', null, corpo);
    elemento('span', 'tempo__periodo', cabeca, item.periodo);
    if (item.oni) {
      elemento('span', 'tempo__oni', cabeca, `pico do ONI ${comSinal(item.oni, 1)} °C`);
    }
    elemento('h3', null, corpo, item.titulo);
    elemento('p', null, corpo, item.texto);
    const tags = elemento('div', 'tags', corpo);
    for (const t of item.tags) elemento('span', 'tag', tags, t);
  }
}

function montarInstrumentos() {
  const destino = $('#instrumentos');
  for (const i of dados.instrumentos) {
    const bloco = elemento('div', 'instrumento', destino);
    elemento('div', 'instrumento__desde', bloco, i.desde);
    const corpo = elemento('div', null, bloco);
    elemento('h3', null, corpo, i.nome);
    elemento('p', null, corpo, i.texto);
  }
}

function montarAdaptacao() {
  const destino = $('#adaptacao-grade');
  for (const bloco of dados.adaptacao) {
    const cartao = elemento('div', 'cartao revela', destino);
    const cab = elemento('div', 'prazo__titulo', cartao);
    elemento('span', 'prazo__quando', cab, bloco.prazo);
    const h = elemento('h3', null, cartao, bloco.titulo);
    h.style.fontSize = '1.05rem';
    const lista = elemento('ul', 'lista-impactos', cartao);
    for (const item of bloco.itens) elemento('li', null, lista, item);
  }
}

function montarOrgaos() {
  const destino = $('#lista-orgaos');
  for (const o of dados.orgaos) {
    const li = elemento('li', null, destino);
    const a = elemento('a', null, li);
    a.href = o.url;
    a.rel = 'noopener';
    a.target = '_blank';
    elemento('strong', null, a, o.sigla);
    elemento('span', null, a, o.papel);
  }
}

function montarReferencias() {
  const destino = $('#referencias');
  for (const r of dados.referencias) {
    const li = elemento('li', null, destino);
    elemento('cite', null, li, r.autor);
    const a = elemento('a', null, li, r.titulo);
    a.href = r.url;
    a.rel = 'noopener';
    a.target = '_blank';
  }
}

/* =========================================================================
 * Oferta do kit para professores
 * ====================================================================== */

function montarOferta() {
  const secao = $('#kit');
  if (!secao) return;

  if (!dados.ofertaPronta()) {
    console.info(
      'Seção do kit oculta: o endereço de checkout ainda é o de exemplo. ' +
        'Edite `oferta.url` em assets/js/data.js para publicá-la.'
    );
    return;
  }

  const o = dados.oferta;
  $('#h-kit').textContent = o.titulo;
  $('.oferta__chamada', secao).textContent = o.chamada;

  const lista = $('.oferta__itens', secao);
  for (const item of o.itens) elemento('li', null, lista, item);

  const botao = $('.oferta__botao', secao);
  botao.href = o.url;
  botao.textContent = `Quero o kit por ${o.preco}`;

  $('.oferta__preco', secao).textContent = o.parcelamento;
  $('.oferta__rodape', secao).textContent = o.rodape;

  secao.hidden = false;

  // o item de navegação só aparece junto com a seção
  const nav = $('.nav');
  if (nav && !$('.nav a[href="#kit"]')) {
    const a = elemento('a', null, nav, 'Para professores');
    a.href = '#kit';
  }
}

/* =========================================================================
 * Quiz
 * ====================================================================== */

/**
 * Quiz formativo: cada resposta explica não só por que a certa está certa,
 * mas por que a escolhida está errada, e oferece o caminho de volta à seção
 * que trata do assunto. No fim dá para refazer só as que ficaram para trás.
 */
function montarQuiz() {
  const lista = $('#quiz-lista');
  const placar = $('#quiz-placar');
  const total = dados.perguntasQuiz.length;
  if (!lista) return;

  let indices = dados.perguntasQuiz.map((_, i) => i);
  let respondidas = 0;
  let acertos = 0;
  let erradas = [];

  function refazer(subconjunto) {
    indices = subconjunto;
    lista.textContent = '';
    placar.hidden = true;
    respondidas = 0;
    acertos = 0;
    erradas = [];
    construir();
    lista.querySelector('.quiz__opcao')?.focus();
  }

  function atualizarPlacar() {
    if (respondidas < indices.length) return;
    const rodada = indices.length;
    placar.hidden = false;
    placar.textContent = '';

    const nota = elemento('strong', 'quiz__nota', placar, `${acertos} de ${rodada}`);
    nota.dataset.tom = acertos === rodada ? 'cheio' : acertos >= rodada * 0.6 ? 'bom' : 'parcial';

    const recado =
      acertos === rodada
        ? 'Gabarito completo. Você entendeu o mecanismo, não só decorou os efeitos.'
        : acertos >= rodada * 0.6
          ? 'Boa base. Vale reler o capítulo sobre como o fenômeno se forma.'
          : 'Sem problema: role de volta ao corte do Pacífico e refaça o percurso.';
    elemento('span', 'quiz__recado', placar, recado);

    const acoes = elemento('div', 'quiz__acoes', placar);
    if (erradas.length) {
      const so = elemento('button', 'botao botao--primario', acoes,
        erradas.length === 1 ? 'Refazer a que errei' : `Refazer só as ${erradas.length} que errei`);
      so.type = 'button';
      const pendentes = [...erradas];
      so.addEventListener('click', () => refazer(pendentes));
    }
    const tudo = elemento('button', 'botao', acoes, 'Refazer o quiz inteiro');
    tudo.type = 'button';
    tudo.addEventListener('click', () => refazer(dados.perguntasQuiz.map((_, i) => i)));
  }

  function construir() {
    indices.forEach((indice, posicao) => {
      const q = dados.perguntasQuiz[indice];
      const item = elemento('article', 'quiz__item', lista);

      const numero = elemento('span', 'quiz__numero', item,
        `Pergunta ${posicao + 1} de ${indices.length}`);
      numero.id = `quiz-p${indice}`;
      elemento('h3', 'quiz__pergunta', item, q.pergunta);

      const grupo = elemento('div', 'quiz__opcoes', item);
      grupo.setAttribute('role', 'group');
      grupo.setAttribute('aria-labelledby', numero.id);

      const resposta = elemento('div', 'quiz__resposta', item);
      resposta.hidden = true;
      resposta.setAttribute('role', 'status');

      const botoes = q.opcoes.map((texto, j) => {
        const b = elemento('button', 'quiz__opcao', grupo);
        b.type = 'button';
        elemento('span', 'quiz__letra', b, String.fromCharCode(97 + j));
        elemento('span', null, b, texto);
        b.addEventListener('click', () => responder(j));
        return b;
      });

      function responder(escolha) {
        const certo = escolha === q.correta;
        respondidas += 1;
        if (certo) acertos += 1;
        else erradas.push(indice);

        botoes.forEach((b, j) => {
          b.disabled = true;
          if (j === q.correta) b.dataset.estado = 'certa';
          else if (j === escolha) b.dataset.estado = 'errada';
          else b.dataset.estado = 'apagada';
        });

        resposta.hidden = false;
        resposta.dataset.tom = certo ? 'certo' : 'errado';
        resposta.textContent = '';
        elemento('strong', null, resposta, certo ? 'Isso mesmo.' : 'Não é essa.');

        // por que a escolhida não serve: é aí que o erro vira aprendizado
        const motivo = certo ? null : q.porQueNao?.[escolha];
        if (motivo) {
          const bloco = elemento('p', 'quiz__motivo', resposta);
          elemento('strong', null, bloco, `A alternativa ${String.fromCharCode(97 + escolha)}: `);
          elemento('span', null, bloco, motivo);
        }
        elemento('p', 'quiz__explicacao', resposta, q.explicacao);

        if (q.ancora && q.revisar) {
          const rever = elemento('a', 'quiz__rever', resposta, `Rever ${q.revisar}`);
          rever.href = `#${q.ancora}`;
        }
        atualizarPlacar();
      }
    });
  }

  construir();
}

/* =========================================================================
 * Mapa do Brasil + painel de região
 * ====================================================================== */

function textoEtiqueta(r) {
  if (r.chuva <= -18) return ['Chuva bem abaixo da média', 'etiqueta--seca'];
  if (r.chuva <= -8) return ['Tendência de chuva abaixo da média', 'etiqueta--seca'];
  if (r.chuva >= 18) return ['Chuva bem acima da média', 'etiqueta--chuva'];
  if (r.chuva >= 8) return ['Tendência de chuva acima da média', 'etiqueta--chuva'];
  return ['Sinal fraco na chuva', 'etiqueta--misto'];
}

function pintarPainel(chave) {
  const painel = $('#painel-regiao');
  painel.textContent = '';

  if (!chave) {
    elemento('h3', null, painel, 'Escolha uma região');
    const p = elemento('p', null, painel,
      'Passe o ponteiro pelo mapa ou use os botões abaixo para ver o desvio de chuva ' +
      'e de temperatura típico de cada região durante um El Niño forte, e a lista de ' +
      'impactos observados.');
    p.style.color = 'var(--ink-2)';
    return;
  }

  const r = dados.regioesBrasil[chave];
  const [etiqueta, classe] = textoEtiqueta(r);

  const h = elemento('h3', null, painel);
  elemento('span', null, h, `Região ${r.nome}`);
  elemento('span', `etiqueta ${classe}`, h, etiqueta);

  const resumo = elemento('p', null, painel, r.resumo);
  resumo.style.color = 'var(--ink-2)';
  resumo.style.marginTop = '12px';

  const medidas = elemento('div', 'medidas', painel);
  const bloco = (rotulo, valor, faixa) => {
    const m = elemento('div', 'medida', medidas);
    elemento('div', 'medida__rotulo', m, rotulo);
    elemento('div', 'medida__valor', m, valor);
    elemento('div', 'medida__faixa', m, faixa);
  };
  bloco('Chuva', `${comSinal(r.chuva, 0)}%`,
    `entre ${comSinal(r.chuvaFaixa[0], 0)}% e ${comSinal(r.chuvaFaixa[1], 0)}%`);
  bloco('Temperatura', `${comSinal(r.temperatura, 1)} °C`, 'acima da média climatológica');
  bloco('Período crítico', r.estacao.split('(')[0].trim(), r.estacao.includes('(') ? r.estacao.split('(')[1].replace(')', '') : 'ao longo do ano');
  bloco('Confiança do sinal', r.confianca, r.confianca === 'alta' ? 'padrão consistente entre eventos' : 'varia muito de evento para evento');

  const lista = elemento('ul', 'lista-impactos', painel);
  for (const i of r.impactos) elemento('li', null, lista, i);

  marcarTermosDinamicos(painel);
}

function montarLegendaMapa() {
  const destino = $('#legenda-mapa');
  for (const f of FAIXAS_LEGENDA) {
    const item = elemento('span', 'legenda__item', destino);
    const chave = elemento('span', 'chave', item);
    chave.style.background = token(f.cor);
    elemento('span', null, item, f.rotulo);
  }
}

async function montarMapa() {
  const hospedeiro = $('#mapa-brasil');
  const botoes = $('#botoes-regiao');

  let mapa = null;
  const definirBotoes = (chave) => {
    for (const b of $$('button', botoes)) {
      b.setAttribute('aria-pressed', String(b.dataset.regiao === chave));
    }
  };

  for (const chaveRegiao of dados.ordemRegioes) {
    const r = dados.regioesBrasil[chaveRegiao];
    const b = elemento('button', null, botoes);
    b.type = 'button';
    b.dataset.regiao = chaveRegiao;
    b.setAttribute('aria-pressed', 'false');
    const chave = elemento('span', 'chave', b);
    chave.style.background = corAnomalia(r.chuva);
    chave.setAttribute('aria-hidden', 'true');
    elemento('span', null, b, r.nome);
    b.addEventListener('click', () => {
      const nova = mapa?.selecionada === chaveRegiao ? null : chaveRegiao;
      mapa?.selecionar(nova);
      definirBotoes(nova);
    });
  }

  pintarPainel(null);
  montarLegendaMapa();

  try {
    mapa = await criarMapaBrasil(hospedeiro, dados.regioesBrasil, dados.ordemRegioes, (chave, passagem) => {
      pintarPainel(chave);
      if (!passagem) definirBotoes(chave);
    });
  } catch (erro) {
    console.error('Não foi possível carregar o mapa do Brasil:', erro);
    const aviso = elemento('p', null, hospedeiro,
      'O mapa não pôde ser carregado. Os números por região continuam disponíveis nos botões e no gráfico abaixo.');
    aviso.style.color = 'var(--muted)';
  }

  // escolher o estado seleciona a região no mapa e destaca a unidade
  ligarOndeVoceMora((chaveRegiao, uf) => {
    mapa?.selecionar(chaveRegiao);
    definirBotoes(chaveRegiao);
    for (const caminho of $$('.uf', hospedeiro)) {
      caminho.dataset.escolhido = String(Boolean(uf) && caminho.dataset.uf === uf);
    }
  });
}

/* =========================================================================
 * Gráficos
 * ====================================================================== */

function montarGraficos() {
  graficoONI($('#grafico-oni'), dados.oniDJF, { fonte: dados.oniDJFMeta.fonte });
  graficoEvolucao($('#grafico-evolucao'), dados.eventosEvolucao, dados.trimestres);
  graficoRanking($('#grafico-ranking'), dados.eventosRanking);
  graficoRegioes($('#grafico-regioes'), dados.regioesBrasil, dados.ordemRegioes);
  graficoMatriz($('#grafico-matriz'), dados.matrizImpacto, dados.regioesBrasil, dados.ordemRegioes);
  graficoRioNegro($('#grafico-rio-negro'), dados.rioNegro, { fonte: dados.rioNegroMeta.fonte });
}

/* =========================================================================
 * Cenas 3D, carregadas sob demanda
 * ====================================================================== */

/**
 * Comparação lado a lado. Arrastar o controle mostra a transição, mas obriga
 * a lembrar do estado anterior; aqui os dois extremos ficam na tela juntos.
 * As duas cenas extras só são criadas na primeira vez que o painel abre.
 */
function ligarComparacao(criarPacifico) {
  const botao = $('#abrir-comparacao');
  const painel = $('#comparacao');
  if (!botao || !painel) return;

  let montado = false;
  botao.addEventListener('click', () => {
    const abrir = painel.hidden;
    painel.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
    botao.textContent = abrir
      ? 'Fechar a comparação'
      : 'Comparar lado a lado: neutro × El Niño forte';

    if (abrir && !montado) {
      montado = true;
      criarPacifico($('#palco-comparar-neutro'), { fase: 0 });
      criarPacifico($('#palco-comparar-nino'), { fase: 1 });
    }
  });
}

async function montarCenas() {
  const { temWebGL, avisoSemWebGL } = await import('./scenes/runtime.js');

  const alvos = [$('#palco-globo'), $('#palco-pacifico'), $('#palco-teleconexao')].filter(Boolean);

  if (!temWebGL()) {
    for (const alvo of alvos) {
      avisoSemWebGL(alvo, 'Seu navegador não tem WebGL disponível. O texto, os gráficos e o mapa continuam funcionando.');
    }
    // a comparação existe só como cena: sem WebGL, o controle não tem o que abrir
    const comparar = $('.comparar');
    if (comparar) comparar.hidden = true;
    return;
  }

  const { criarGlobo } = await import('./scenes/globo.js');
  const { criarPacifico } = await import('./scenes/pacifico.js');

  // --- herói: globo do mundo ---
  criarGlobo($('#palco-globo'), {
    modo: 'mundo',
    fase: 1,
    caixas: dados.regioesNino,
  }).catch((e) => console.error('globo do herói:', e));

  // --- corte do Pacífico ---
  const pacifico = criarPacifico($('#palco-pacifico'), { fase: 0 });
  // liga a cena ao simulador e sincroniza com o valor que já está na tela
  aplicarFaseNaCena = (v) => pacifico.definirFase(v);
  aplicarFaseNaCena(Math.max(-1, Math.min(1, oniCorrente / ONI_CHEIO)));

  const dica = $('#dica-pacifico');
  $('#palco-pacifico').addEventListener('pointerdown', () => {
    if (dica) dica.style.opacity = '0';
  }, { once: true });

  // --- comparação lado a lado, montada só quando alguém pede ---
  ligarComparacao(criarPacifico);

  // --- teleconexão até o Brasil ---
  const quente = token('--warm');
  const frio = token('--cool');
  criarGlobo($('#palco-teleconexao'), {
    modo: 'teleconexao',
    fase: 1,
    arcos: [
      { de: [0, -150], para: [-4, -62], cor: quente, atraso: 0, rotulo: 'Amazônia: seca', classe: 'rotulo-3d--seca' },
      { de: [0, -150], para: [-8, -40], cor: quente, atraso: 0.33, rotulo: 'Nordeste: seca', classe: 'rotulo-3d--seca' },
      { de: [-10, -140], para: [-29, -53], cor: frio, atraso: 0.66, rotulo: 'Sul: chuva', classe: 'rotulo-3d--chuva' },
    ],
  }).catch((e) => console.error('globo de teleconexão:', e));
}

/* =========================================================================
 * Início
 * ====================================================================== */

function iniciar() {
  ligarNavegacao();
  montarResumos();
  montarMitos();
  montarIndicadores();
  montarEcossistemas();
  montarLinhaDoTempo();
  montarInstrumentos();
  montarAdaptacao();
  montarOrgaos();
  montarReferencias();
  montarGraficos();
  montarMapa();
  ligarSimulador();
  montarQuiz();
  montarChecagens();
  montarOferta();
  montarEtapas();
  montarFicha();
  ligarSumario();
  // por último: o glossário varre o texto que os passos anteriores criaram
  ligarGlossario();
  ligarRevelacao();
  montarCenas().catch((e) => console.error('cenas 3D:', e));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
