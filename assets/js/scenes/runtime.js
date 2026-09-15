/**
 * Runtime das cenas 3D.
 *
 * Responsabilidades: detectar WebGL, criar o renderizador, redimensionar,
 * rodar o laço de animação apenas quando a cena está visível na tela,
 * respeitar `prefers-reduced-motion` e posicionar rótulos HTML sobre pontos
 * do espaço 3D.
 */

import * as THREE from '../../vendor/three.module.min.js';

export { THREE };

export const RAD = Math.PI / 180;

export const movimentoReduzido = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function temWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

/**
 * Cria um palco: renderizador + câmera + cena, com laço preguiçoso.
 * `aoQuadro(dt, t)` é chamado a cada quadro enquanto o elemento está visível.
 */
export function criarPalco(hospedeiro, opcoes = {}) {
  const { fov = 42, perto = 0.1, longe = 200, fundo = null, alpha = true } = opcoes;

  const canvas = document.createElement('canvas');
  hospedeiro.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  if (fundo) cena.background = new THREE.Color(fundo);

  const camera = new THREE.PerspectiveCamera(fov, 1, perto, longe);

  const rotulos = document.createElement('div');
  rotulos.className = 'rotulos-3d';
  hospedeiro.appendChild(rotulos);

  const estado = {
    largura: 0,
    altura: 0,
    visivel: false,
    rodando: false,
    aoQuadro: null,
    destruido: false,
  };

  function dimensionar() {
    const w = hospedeiro.clientWidth;
    const h = hospedeiro.clientHeight;
    if (!w || !h || (w === estado.largura && h === estado.altura)) return false;
    estado.largura = w;
    estado.altura = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    return true;
  }

  const relogio = {
    anterior: performance.now() / 1000,
    decorrido: 0,
    passo() {
      const agora = performance.now() / 1000;
      const dt = Math.min(agora - this.anterior, 0.05);
      this.anterior = agora;
      this.decorrido += dt;
      return dt;
    },
    reiniciar() {
      this.anterior = performance.now() / 1000;
    },
  };
  let quadro = 0;

  function laco() {
    if (estado.destruido) return;
    quadro = requestAnimationFrame(laco);
    const dt = relogio.passo();
    if (dimensionar()) posicionarRotulos();
    if (estado.aoQuadro) estado.aoQuadro(dt, relogio.decorrido);
    renderer.render(cena, camera);
    posicionarRotulos();
  }

  function iniciar() {
    if (estado.rodando || estado.destruido) return;
    estado.rodando = true;
    relogio.reiniciar();
    laco();
  }

  function parar() {
    estado.rodando = false;
    cancelAnimationFrame(quadro);
  }

  /** Desenha um único quadro, usado quando o movimento está reduzido. */
  function quadroUnico() {
    dimensionar();
    if (estado.aoQuadro) estado.aoQuadro(0, relogio.decorrido);
    renderer.render(cena, camera);
    posicionarRotulos();
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        estado.visivel = e.isIntersecting;
        if (e.isIntersecting) iniciar();
        else parar();
      }
    },
    { rootMargin: '120px' }
  );
  observador.observe(hospedeiro);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) parar();
    else if (estado.visivel) iniciar();
  });

  // --- rótulos ancorados em pontos do espaço 3D ---
  const ancoras = [];
  const vetor = new THREE.Vector3();
  const centro = new THREE.Vector3();
  const aux = new THREE.Vector3();
  const paraCamera = new THREE.Vector3();

  function criarRotulo(texto, posicao, classe = '', pai = null, opcoes = {}) {
    const nodo = document.createElement('div');
    nodo.className = `rotulo-3d ${classe}`.trim();
    nodo.textContent = texto;
    rotulos.appendChild(nodo);
    // `pai` permite que o rótulo acompanhe um grupo que gira
    const ancora = {
      nodo,
      posicao: posicao.clone(),
      pai,
      visivel: true,
      // esconde o rótulo quando o ponto vai para o lado oculto do planeta
      ocluirEsfera: opcoes.ocluirEsfera ?? false,
    };
    ancoras.push(ancora);
    return ancora;
  }

  function posicionarRotulos() {
    if (!ancoras.length) return;
    const meiaL = estado.largura / 2;
    const meiaA = estado.altura / 2;
    for (const a of ancoras) {
      if (!a.visivel) {
        a.nodo.style.opacity = '0';
        continue;
      }
      vetor.copy(a.posicao);
      if (a.pai) vetor.applyMatrix4(a.pai.matrixWorld);

      let oculto = false;
      if (a.ocluirEsfera) {
        if (a.pai) centro.setFromMatrixPosition(a.pai.matrixWorld);
        else centro.set(0, 0, 0);
        aux.copy(vetor).sub(centro).normalize();
        paraCamera.copy(camera.position).sub(vetor).normalize();
        oculto = aux.dot(paraCamera) < 0.05;
      }

      aux.copy(vetor).applyMatrix4(camera.matrixWorldInverse);
      oculto = oculto || aux.z > 0; // atrás da câmera
      vetor.project(camera);
      oculto = oculto || vetor.z > 1;
      a.nodo.style.opacity = oculto ? '0' : '1';
      a.nodo.style.transform = `translate(-50%,-50%) translate(${vetor.x * meiaL + meiaL}px, ${-vetor.y * meiaA + meiaA}px)`;
    }
  }

  function destruir() {
    estado.destruido = true;
    parar();
    observador.disconnect();
    renderer.dispose();
    cena.traverse((o) => {
      o.geometry?.dispose?.();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        for (const v of Object.values(m)) v?.isTexture && v.dispose();
        m.dispose?.();
      }
    });
  }

  dimensionar();

  return {
    THREE, renderer, cena, camera, canvas, estado,
    criarRotulo, posicionarRotulos, quadroUnico, iniciar, parar, destruir,
    definirQuadro(fn) { estado.aoQuadro = fn; },
  };
}

/**
 * Arrasto para girar: substituto leve do OrbitControls, sem dependências.
 * Devolve um objeto com os ângulos correntes, já amortecidos.
 */
export function controleArrasto(elemento, opcoes = {}) {
  const {
    azimuteInicial = 0,
    elevacaoInicial = 0,
    limiteElevacao = 1.1,
    inercia = 0.08,
    sensibilidade = 0.0055,
    girarSozinho = 0,
    travarAzimute = null,
  } = opcoes;

  const alvo = { az: azimuteInicial, el: elevacaoInicial };
  const atual = { az: azimuteInicial, el: elevacaoInicial };
  let arrastando = false;
  let ultimo = null;
  let interagiu = false;

  const aoDescer = (ev) => {
    arrastando = true;
    interagiu = true;
    ultimo = { x: ev.clientX, y: ev.clientY };
    elemento.setPointerCapture?.(ev.pointerId);
    elemento.style.cursor = 'grabbing';
  };

  const aoMover = (ev) => {
    if (!arrastando || !ultimo) return;
    const dx = ev.clientX - ultimo.x;
    const dy = ev.clientY - ultimo.y;
    ultimo = { x: ev.clientX, y: ev.clientY };
    alvo.az -= dx * sensibilidade;
    alvo.el = Math.max(-limiteElevacao, Math.min(limiteElevacao, alvo.el - dy * sensibilidade));
    if (travarAzimute) {
      alvo.az = Math.max(travarAzimute[0], Math.min(travarAzimute[1], alvo.az));
    }
  };

  const aoSubir = (ev) => {
    arrastando = false;
    ultimo = null;
    elemento.releasePointerCapture?.(ev.pointerId);
    elemento.style.cursor = 'grab';
  };

  elemento.style.cursor = 'grab';
  elemento.style.touchAction = 'pan-y';
  elemento.addEventListener('pointerdown', aoDescer);
  elemento.addEventListener('pointermove', aoMover);
  elemento.addEventListener('pointerup', aoSubir);
  elemento.addEventListener('pointercancel', aoSubir);

  return {
    get azimute() { return atual.az; },
    get elevacao() { return atual.el; },
    get interagiu() { return interagiu; },
    get arrastando() { return arrastando; },
    atualizar(dt) {
      if (girarSozinho && !arrastando && !interagiu) alvo.az += girarSozinho * dt;
      const k = Math.min(1, inercia * 60 * (dt || 0.016));
      atual.az += (alvo.az - atual.az) * k;
      atual.el += (alvo.el - atual.el) * k;
      return { azimute: atual.az, elevacao: atual.el };
    },
  };
}

/** Interpolação suave usada nas transições de fase. */
export function suavizar(de, para, k) {
  return de + (para - de) * Math.min(1, Math.max(0, k));
}

export function amaciar(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** lat/lon (graus) -> ponto na esfera, na convenção usada pelas texturas. */
export function esferico(lat, lon, raio = 1) {
  const u = (lon + 180) / 360;
  const v = (lat + 90) / 180;
  const phi = u * Math.PI * 2;
  const theta = (1 - v) * Math.PI;
  return new THREE.Vector3(
    -raio * Math.cos(phi) * Math.sin(theta),
    raio * Math.cos(theta),
    raio * Math.sin(phi) * Math.sin(theta)
  );
}

/** Mostra a mensagem de indisponibilidade dentro do palco. */
export function avisoSemWebGL(hospedeiro, texto) {
  const aviso = document.createElement('div');
  aviso.className = 'palco__aviso';
  const forte = document.createElement('strong');
  forte.textContent = 'Animação 3D indisponível';
  const p = document.createElement('span');
  p.textContent = texto;
  aviso.append(forte, p);
  hospedeiro.appendChild(aviso);
}
