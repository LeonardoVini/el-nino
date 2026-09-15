/**
 * Mapa interativo do Brasil por região.
 *
 * As 27 unidades da federação são desenhadas a partir de `brazil-states.json`
 * e coloridas pela anomalia de chuva típica de um El Niño forte. Os botões
 * acima do mapa são o controle acessível; os estados no SVG são um atalho
 * para quem usa ponteiro.
 */

const CAMINHO = new URL('../vendor/brazil-states.json', import.meta.url);
const NS = 'http://www.w3.org/2000/svg';

function token(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/** Escala divergente discreta para o desvio de chuva, em %. */
export function corAnomalia(pct) {
  const m = Math.abs(pct);
  const seco = pct < 0;
  if (m < 8) return token('--surface-3');
  const passo = m < 18 ? 2 : m < 28 ? 3 : m < 40 ? 4 : 5;
  return token(seco ? `--warm-${passo}` : `--cool-${passo}`);
}

export const FAIXAS_LEGENDA = [
  { rotulo: '−40% ou menos', cor: '--warm-5' },
  { rotulo: '−40 a −28%', cor: '--warm-4' },
  { rotulo: '−28 a −18%', cor: '--warm-3' },
  { rotulo: '−18 a −8%', cor: '--warm-2' },
  { rotulo: 'sem sinal claro', cor: '--surface-3' },
  { rotulo: '+8 a +18%', cor: '--cool-2' },
  { rotulo: '+18 a +28%', cor: '--cool-3' },
  { rotulo: '+28 a +40%', cor: '--cool-4' },
  { rotulo: '+40% ou mais', cor: '--cool-5' },
];

export async function criarMapaBrasil(hospedeiro, regioes, ordem, aoSelecionar) {
  const dados = await fetch(CAMINHO).then((r) => r.json());

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', dados.viewBox);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    'Mapa do Brasil com as cinco regiões coloridas pelo desvio de chuva típico durante um El Niño forte: ' +
    ordem.map((k) => `${regioes[k].nome}, ${regioes[k].chuva > 0 ? 'mais' : 'menos'} chuva`).join('; ') + '.'
  );
  hospedeiro.appendChild(svg);

  const porRegiao = new Map();

  for (const uf of dados.estados) {
    const caminho = document.createElementNS(NS, 'path');
    caminho.setAttribute('d', uf.path);
    caminho.setAttribute('class', 'uf');
    caminho.setAttribute('fill', corAnomalia(regioes[uf.regiao].chuva));
    caminho.dataset.regiao = uf.regiao;
    caminho.dataset.uf = uf.id;
    svg.appendChild(caminho);
    if (!porRegiao.has(uf.regiao)) porRegiao.set(uf.regiao, []);
    porRegiao.get(uf.regiao).push(caminho);
  }

  // rótulos no centro de cada região, calculados depois do layout
  const rotulos = [];
  requestAnimationFrame(() => {
    for (const [chave, caminhos] of porRegiao) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of caminhos) {
        const b = c.getBBox();
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      }
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('class', 'mapa-rotulo');
      t.setAttribute('x', (x0 + x1) / 2);
      t.setAttribute('y', (y0 + y1) / 2);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = regioes[chave].sigla;
      svg.appendChild(t);
      rotulos.push(t);
    }
  });

  let selecionada = null;

  function selecionar(chave) {
    selecionada = chave;
    if (chave) hospedeiro.dataset.selecionada = chave;
    else delete hospedeiro.dataset.selecionada;
    for (const [k, caminhos] of porRegiao) {
      for (const c of caminhos) c.dataset.ativa = String(k === chave);
    }
    aoSelecionar?.(chave);
  }

  for (const [chave, caminhos] of porRegiao) {
    for (const c of caminhos) {
      c.addEventListener('click', () => selecionar(chave === selecionada ? null : chave));
      c.addEventListener('pointerenter', () => {
        if (!selecionada) aoSelecionar?.(chave, true);
      });
    }
  }
  svg.addEventListener('pointerleave', () => {
    if (!selecionada) aoSelecionar?.(null, true);
  });

  return { svg, selecionar, get selecionada() { return selecionada; } };
}
