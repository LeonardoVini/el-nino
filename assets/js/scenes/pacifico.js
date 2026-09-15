/**
 * Corte 3D do Pacífico equatorial — a cena que explica o mecanismo.
 *
 * O eixo x vai da Indonésia (oeste, à esquerda) à América do Sul (leste),
 * o eixo y é a profundidade e o eixo z dá espessura à fatia do oceano.
 * Tudo — inclinação da termoclina, cor da água, força dos alísios, posição
 * da convecção, ressurgência — deriva de um único número, a fase:
 *
 *    fase = −1  La Niña      fase = 0  neutro      fase = +1  El Niño
 */

import { THREE, criarPalco, controleArrasto, movimentoReduzido } from './runtime.js';

const OESTE = -5;
const LESTE = 5;
const LARGURA = LESTE - OESTE;
const PROF = 2.3;
const ESPESSURA = 1.7;

/** Profundidade da termoclina ao longo de x, em função da fase. */
function termoclina(x, p) {
  return -(1.18 - (0.62 - 0.52 * p) * (x / 5));
}

/** Posição do ramo ascendente (convecção profunda, onde chove). */
function xConveccao(p) {
  return -3.4 + (p + 1) * 2.2;
}

/** Vento zonal de superfície: negativo = alísio soprando de leste para oeste. */
function ventoZonal(x, p) {
  const oeste = Math.max(0, Math.min(1, (0.5 - x / 5) / 1.5));
  return -(1 - p * (0.5 + 0.75 * oeste));
}

/** Intensidade da ressurgência costeira no Peru: máxima na La Niña. */
function forcaRessurgencia(p) {
  return Math.max(0, 0.5 - 0.5 * p);
}

/* --- shaders -------------------------------------------------------------- */

const VERT_AGUA = /* glsl */ `
  uniform float uFase;
  varying vec3 vPos;
  void main() {
    vec3 p = position;
    if (p.y > -0.001) {
      // os alísios empilham água a sotavento: mar mais alto a oeste na
      // La Niña, mais alto a leste no El Niño
      p.y += 0.10 * (p.x / 5.0) * uFase;
    }
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG_AGUA = /* glsl */ `
  precision highp float;
  uniform float uFase;
  varying vec3 vPos;

  float termoclina(float x, float p) {
    return -(1.18 - (0.62 - 0.52 * p) * (x / 5.0));
  }

  void main() {
    float p = uFase;
    float d = termoclina(vPos.x, p);

    // 1 na camada de mistura quente, 0 na água fria profunda
    float camada = smoothstep(d - 0.30, d + 0.26, vPos.y);

    // Temperatura de superfície descrita pelos dois extremos da bacia:
    // na La Niña o contraste leste-oeste é máximo; no El Niño ele quase some.
    float u = vPos.x / 5.0;                          // -1 oeste .. +1 leste
    float oesteT = 0.95 - 0.10 * max(p, 0.0);        // a poça quente esfria um pouco no El Niño
    float lesteT = 0.46 + 0.30 * p;                  // a língua fria some no El Niño
    float centro = 0.30 + 0.55 * p;                  // onde fica a transição
    float w = smoothstep(centro + 0.85, centro - 0.85, u);
    float sup = mix(lesteT, oesteT, w);

    float fundo = 0.04 + 0.12 * smoothstep(-2.3, -0.6, vPos.y);
    float t = mix(fundo, sup, camada);

    // escala divergente: azul (frio) -> ardósia (meio) -> laranja (quente)
    vec3 frio   = vec3(0.035, 0.086, 0.196);
    vec3 meio   = vec3(0.145, 0.365, 0.545);
    vec3 quente = vec3(0.933, 0.502, 0.243);
    vec3 cor = t < 0.62 ? mix(frio, meio, t / 0.62) : mix(meio, quente, (t - 0.62) / 0.38);

    // isotermas discretas ajudam a ler o gradiente
    float iso = abs(fract(t * 9.0) - 0.5);
    cor *= 1.0 - 0.16 * smoothstep(0.44, 0.5, iso);

    // leve brilho junto à superfície
    cor += 0.06 * smoothstep(-0.35, 0.0, vPos.y);

    gl_FragColor = vec4(cor, 0.88);
  }
`;

const VERT_TERMOCLINA = /* glsl */ `
  uniform float uFase;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.y = -(1.18 - (0.62 - 0.52 * uFase) * (p.x / 5.0));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG_TERMOCLINA = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTempo;
  void main() {
    float borda = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
    float linhas = smoothstep(0.43, 0.5, abs(fract(vUv.x * 34.0) - 0.5));
    float onda = 0.78 + 0.22 * sin(vUv.x * 24.0 - uTempo * 1.3);
    vec3 cor = mix(vec3(0.30, 0.78, 0.88), vec3(0.78, 0.96, 1.0), linhas);
    gl_FragColor = vec4(cor, (0.30 + 0.42 * linhas) * borda * onda);
  }
`;

/* --- utilidades de partícula ---------------------------------------------- */

function spriteRedondo(cor = '255,255,255') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${cor},1)`);
  grad.addColorStop(0.35, `rgba(${cor},0.5)`);
  grad.addColorStop(1, `rgba(${cor},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Retângulo arredondado percorrido por um parâmetro s ∈ [0,1). */
function pontoDaCelula(s, xSobe, xDesce, yTopo, yBase) {
  const cx = (xSobe + xDesce) / 2;
  const rx = (xDesce - xSobe) / 2;
  const cy = (yTopo + yBase) / 2;
  const ry = (yTopo - yBase) / 2;
  const th = s * Math.PI * 2;
  const sq = (v) => Math.sign(v) * Math.abs(v) ** 0.5;
  return [cx - rx * sq(Math.cos(th)), cy + ry * sq(Math.sin(th))];
}

/* --- cena ----------------------------------------------------------------- */

export function criarPacifico(hospedeiro, opcoes = {}) {
  const palco = criarPalco(hospedeiro, { fov: 36 });
  const { cena, camera } = palco;

  const mundo = new THREE.Group();
  cena.add(mundo);

  const uFase = { value: opcoes.fase ?? 0 };
  const uTempo = { value: 0 };

  /* --- volume de água --- */
  const geoAgua = new THREE.BoxGeometry(LARGURA, PROF, ESPESSURA, 140, 20, 2);
  geoAgua.translate(0, -PROF / 2, 0);
  const agua = new THREE.Mesh(
    geoAgua,
    new THREE.ShaderMaterial({
      vertexShader: VERT_AGUA,
      fragmentShader: FRAG_AGUA,
      uniforms: { uFase },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    })
  );
  agua.renderOrder = 3;
  mundo.add(agua);

  /* --- superfície da termoclina --- */
  const geoTermo = new THREE.PlaneGeometry(LARGURA, ESPESSURA * 0.99, 160, 2);
  geoTermo.rotateX(-Math.PI / 2);
  const termo = new THREE.Mesh(
    geoTermo,
    new THREE.ShaderMaterial({
      vertexShader: VERT_TERMOCLINA,
      fragmentShader: FRAG_TERMOCLINA,
      uniforms: { uFase, uTempo },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );
  termo.renderOrder = 4;
  mundo.add(termo);

  /* --- continentes --- */
  function bloco(x, larg, alt, cor, prof = ESPESSURA) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(larg, alt, prof),
      new THREE.MeshBasicMaterial({ color: cor })
    );
    m.position.set(x, alt / 2 - 0.03, 0);
    mundo.add(m);
    return m;
  }
  bloco(OESTE - 0.4, 0.8, 0.26, 0x27455c);          // Indonésia
  bloco(OESTE - 1.15, 0.7, 0.16, 0x203a4e);         // Austrália
  bloco(LESTE + 0.62, 1.25, 0.78, 0x2c4a63);        // América do Sul / Andes

  /* --- moldura do bloco d'água --- */
  const moldura = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(LARGURA, PROF, ESPESSURA)),
    new THREE.LineBasicMaterial({ color: 0x5f86a6, transparent: true, opacity: 0.28 })
  );
  moldura.position.y = -PROF / 2;
  mundo.add(moldura);

  /* --- alísios: setas sobre a superfície --- */
  const N_VENTO = 24;
  const geoSeta = new THREE.ConeGeometry(0.085, 0.40, 7);
  geoSeta.rotateZ(-Math.PI / 2); // aponta para +x
  const setas = new THREE.InstancedMesh(
    geoSeta,
    new THREE.MeshBasicMaterial({ color: 0x9fe8de, transparent: true, opacity: 0.85 }),
    N_VENTO
  );
  setas.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mundo.add(setas);

  const ventos = [];
  for (let i = 0; i < N_VENTO; i++) {
    ventos.push({
      x: OESTE + Math.random() * LARGURA,
      y: 0.30 + Math.random() * 0.34,
      z: -ESPESSURA / 2 + 0.2 + Math.random() * (ESPESSURA - 0.4),
    });
  }

  /* --- células de circulação (Walker) --- */
  const N_PART = 120;
  const posCirc = new Float32Array(N_PART * 3);
  const alfaCirc = new Float32Array(N_PART);
  const geoCirc = new THREE.BufferGeometry();
  geoCirc.setAttribute('position', new THREE.BufferAttribute(posCirc, 3));
  geoCirc.setAttribute('aAlfa', new THREE.BufferAttribute(alfaCirc, 1));
  const matCirc = new THREE.ShaderMaterial({
    uniforms: { uMapa: { value: spriteRedondo('190,225,255') }, uTam: { value: 26 } },
    vertexShader: /* glsl */ `
      attribute float aAlfa;
      varying float vAlfa;
      uniform float uTam;
      void main() {
        vAlfa = aAlfa;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uTam * (1.0 / -mv.z) * 9.0;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uMapa;
      varying float vAlfa;
      void main() {
        vec4 t = texture2D(uMapa, gl_PointCoord);
        gl_FragColor = vec4(t.rgb, t.a * vAlfa);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const circulacao = new THREE.Points(geoCirc, matCirc);
  circulacao.renderOrder = 5;
  mundo.add(circulacao);

  // linha-guia de cada célula: sem ela as partículas não leem como um circuito
  const N_GUIA = 90;
  const guias = ['leste', 'oeste'].map(() => {
    const pos = new Float32Array(N_GUIA * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x9dc6e8, transparent: true, opacity: 0.2 });
    const linha = new THREE.LineLoop(geo, mat);
    linha.renderOrder = 5;
    mundo.add(linha);
    return { pos, geo, mat };
  });

  const particulas = [];
  for (let i = 0; i < N_PART; i++) {
    particulas.push({
      s: Math.random(),
      celula: i < N_PART / 2 ? 'leste' : 'oeste',
      z: -ESPESSURA / 2 + 0.25 + Math.random() * (ESPESSURA - 0.5),
      jitter: (Math.random() - 0.5) * 0.09,
    });
  }

  /* --- nuvem de convecção e chuva --- */
  const N_NUVEM = 90;
  const posNuvem = new Float32Array(N_NUVEM * 3);
  const geoNuvem = new THREE.BufferGeometry();
  geoNuvem.setAttribute('position', new THREE.BufferAttribute(posNuvem, 3));
  const nuvem = new THREE.Points(
    geoNuvem,
    new THREE.PointsMaterial({
      map: spriteRedondo('236,246,255'),
      size: 0.72,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  nuvem.renderOrder = 6;
  mundo.add(nuvem);

  const puffs = [];
  for (let i = 0; i < N_NUVEM; i++) {
    const alto = Math.random();
    // a base é estreita e o topo se espalha, como a bigorna de um cumulonimbus
    const largura = 0.7 + alto * 2.6;
    puffs.push({
      dx: (Math.random() - 0.5) * largura,
      dy: 1.35 + alto * 0.95,
      dz: -ESPESSURA / 2 + 0.1 + Math.random() * (ESPESSURA - 0.2),
      fase: Math.random() * Math.PI * 2,
    });
  }

  const N_CHUVA = 120;
  const posChuva = new Float32Array(N_CHUVA * 3);
  const geoChuva = new THREE.BufferGeometry();
  geoChuva.setAttribute('position', new THREE.BufferAttribute(posChuva, 3));
  const chuva = new THREE.Points(
    geoChuva,
    new THREE.PointsMaterial({
      color: 0x9fd4f5,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  chuva.renderOrder = 6;
  mundo.add(chuva);

  const gotas = [];
  for (let i = 0; i < N_CHUVA; i++) {
    gotas.push({
      dx: (Math.random() - 0.5) * 1.6,
      y: Math.random() * 1.35,
      dz: -ESPESSURA / 2 + 0.15 + Math.random() * (ESPESSURA - 0.3),
      v: 0.9 + Math.random() * 0.8,
    });
  }

  /* --- ressurgência costeira --- */
  const N_RESS = 30;
  const posRess = new Float32Array(N_RESS * 3);
  const alfaRess = new Float32Array(N_RESS);
  const geoRess = new THREE.BufferGeometry();
  geoRess.setAttribute('position', new THREE.BufferAttribute(posRess, 3));
  geoRess.setAttribute('aAlfa', new THREE.BufferAttribute(alfaRess, 1));
  const ressurgencia = new THREE.Points(geoRess, matCirc.clone());
  ressurgencia.material.uniforms.uMapa.value = spriteRedondo('150,225,255');
  ressurgencia.material.uniforms.uTam.value = 20;
  ressurgencia.renderOrder = 5;
  mundo.add(ressurgencia);

  const subidas = [];
  for (let i = 0; i < N_RESS; i++) {
    subidas.push({
      t: Math.random(),
      x: LESTE - 0.15 - Math.random() * 1.5,
      z: -ESPESSURA / 2 + 0.2 + Math.random() * (ESPESSURA - 0.4),
      v: 0.22 + Math.random() * 0.2,
    });
  }

  /* --- rótulos --- */
  const rot = (texto, x, y, z, classe) =>
    palco.criarRotulo(texto, new THREE.Vector3(x, y, z), classe, mundo);

  const rotulos = {
    oeste: rot('Indonésia', OESTE - 0.45, 0.72, 0, 'rotulo-3d--fraco'),
    leste: rot('América do Sul', LESTE + 0.6, 1.12, 0, 'rotulo-3d--fraco'),
    termoclina: rot('Termoclina', 0, -1.2, ESPESSURA / 2 + 0.1, 'rotulo-3d--destaque'),
    alisios: rot('Alísios', -1.4, 0.72, 0, 'rotulo-3d--destaque'),
    conveccao: rot('Convecção e chuva', -3.4, 2.5, 0, 'rotulo-3d--destaque'),
    ressurgencia: rot('Ressurgência', 4.1, -0.45, ESPESSURA / 2 + 0.1, 'rotulo-3d--destaque'),
  };

  /* --- câmera e interação --- */
  camera.position.set(0.4, 3.0, 12.4);
  camera.lookAt(0, -0.15, 0);

  /** Em telas estreitas a cena precisa de mais distância para caber inteira. */
  function enquadrar() {
    const largo = palco.estado.largura >= 760;
    const dist = largo ? 12.4 : 16.4;
    if (Math.abs(camera.position.z - dist) > 0.01) {
      camera.position.set(largo ? 0.4 : 0.2, largo ? 3.0 : 3.4, dist);
      camera.lookAt(0, -0.15, 0);
    }
  }
  enquadrar();

  const controle = controleArrasto(hospedeiro, {
    azimuteInicial: 0,
    elevacaoInicial: 0,
    limiteElevacao: 0.34,
    travarAzimute: [-0.55, 0.55],
    sensibilidade: 0.0035,
  });

  let faseAtual = uFase.value;
  let faseAlvo = uFase.value;

  function atualizar(dt, t) {
    enquadrar();
    const c = controle.atualizar(dt);
    mundo.rotation.y = c.azimute;
    mundo.rotation.x = c.elevacao * 0.5;

    faseAtual += (faseAlvo - faseAtual) * Math.min(1, dt * 2.2);
    uFase.value = faseAtual;
    uTempo.value = t;
    const p = faseAtual;

    /* alísios */
    const dummy = new THREE.Object3D();
    for (let i = 0; i < N_VENTO; i++) {
      const v = ventos[i];
      const u = ventoZonal(v.x, p);
      v.x += u * dt * 1.45;
      if (v.x < OESTE - 1.6) v.x = LESTE + 0.8;
      if (v.x > LESTE + 1.6) v.x = OESTE - 0.8;
      dummy.position.set(v.x, v.y + 0.04 * Math.sin(t * 1.5 + i), v.z);
      dummy.rotation.set(0, 0, u > 0 ? 0 : Math.PI);
      const forca = Math.min(1.35, Math.abs(u));
      dummy.scale.set(0.5 + forca * 0.8, 0.85 + forca * 0.25, 0.85 + forca * 0.25);
      dummy.updateMatrix();
      setas.setMatrixAt(i, dummy.matrix);
    }
    setas.instanceMatrix.needsUpdate = true;
    setas.material.opacity = 0.35 + 0.5 * Math.min(1, Math.abs(1 - p * 0.5));

    /* circulação de Walker */
    const xSobe = xConveccao(p);
    const yTopo = 2.15;
    const yBase = 0.16;
    const pesoOeste = Math.max(0.08, (p + 1) / 2);      // a célula oeste só ganha corpo no El Niño
    const pesoLeste = Math.max(0.15, 1 - Math.max(0, p) * 0.45);

    [['leste', LESTE + 0.2, pesoLeste], ['oeste', OESTE - 0.9, pesoOeste]].forEach(
      ([, xDesce, peso], gi) => {
        const g = guias[gi];
        for (let k = 0; k < N_GUIA; k++) {
          const [gx, gy] = pontoDaCelula(k / N_GUIA, xSobe, xDesce, yTopo, yBase);
          g.pos[k * 3] = gx;
          g.pos[k * 3 + 1] = gy;
          g.pos[k * 3 + 2] = 0;
        }
        g.geo.attributes.position.needsUpdate = true;
        g.mat.opacity = peso * 0.3;
      }
    );
    for (let i = 0; i < N_PART; i++) {
      const q = particulas[i];
      const leste = q.celula === 'leste';
      const xDesce = leste ? LESTE + 0.2 : OESTE - 0.9;
      q.s = (q.s + dt * (leste ? 0.075 : 0.085)) % 1;
      const [px, py] = pontoDaCelula(q.s, xSobe, xDesce, yTopo, yBase);
      posCirc[i * 3] = px;
      posCirc[i * 3 + 1] = py + q.jitter;
      posCirc[i * 3 + 2] = q.z;
      alfaCirc[i] = (leste ? pesoLeste : pesoOeste) * 0.85;
    }
    geoCirc.attributes.position.needsUpdate = true;
    geoCirc.attributes.aAlfa.needsUpdate = true;

    /* nuvem e chuva sobre a convecção */
    for (let i = 0; i < N_NUVEM; i++) {
      const q = puffs[i];
      posNuvem[i * 3] = xSobe + q.dx + 0.07 * Math.sin(t * 0.5 + q.fase);
      posNuvem[i * 3 + 1] = q.dy + 0.05 * Math.sin(t * 0.7 + q.fase);
      posNuvem[i * 3 + 2] = q.dz;
    }
    geoNuvem.attributes.position.needsUpdate = true;

    for (let i = 0; i < N_CHUVA; i++) {
      const q = gotas[i];
      q.y -= dt * q.v;
      if (q.y < 0.05) q.y = 1.35;
      posChuva[i * 3] = xSobe + q.dx;
      posChuva[i * 3 + 1] = q.y;
      posChuva[i * 3 + 2] = q.dz;
    }
    geoChuva.attributes.position.needsUpdate = true;

    /* ressurgência */
    const fr = forcaRessurgencia(p);
    for (let i = 0; i < N_RESS; i++) {
      const q = subidas[i];
      q.t += dt * q.v * (0.35 + fr);
      if (q.t > 1) q.t -= 1;
      const dTermo = termoclina(q.x, p);
      posRess[i * 3] = q.x;
      posRess[i * 3 + 1] = dTermo + (0.05 - dTermo) * q.t;
      posRess[i * 3 + 2] = q.z;
      alfaRess[i] = fr * (1 - q.t) * 1.1;
    }
    geoRess.attributes.position.needsUpdate = true;
    geoRess.attributes.aAlfa.needsUpdate = true;

    /* rótulos que acompanham o estado */
    rotulos.conveccao.posicao.set(xSobe, 2.62, 0);
    rotulos.termoclina.posicao.set(0, termoclina(0, p) - 0.14, ESPESSURA / 2 + 0.08);
    rotulos.ressurgencia.nodo.style.opacity = fr > 0.22 ? '' : '0';
    rotulos.ressurgencia.visivel = fr > 0.22;
  }

  palco.definirQuadro(atualizar);

  if (movimentoReduzido()) {
    palco.parar();
    atualizar(0.016, 0);
    palco.quadroUnico();
  }

  return {
    palco,
    definirFase(v) {
      faseAlvo = v;
      if (movimentoReduzido()) {
        faseAtual = v;
        atualizar(0.016, 0);
        palco.quadroUnico();
      }
    },
    destruir: () => palco.destruir(),
  };
}
