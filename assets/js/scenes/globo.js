/**
 * Cena do globo.
 *
 * Dois modos:
 *   'mundo'       — globo girando, com a anomalia de temperatura do Pacífico
 *                   respondendo à fase escolhida (La Niña / Neutro / El Niño);
 *   'teleconexao' — globo travado na América do Sul, com os arcos que ligam
 *                   o Pacífico às regiões brasileiras.
 *
 * A textura da Terra é desenhada num <canvas> a partir dos polígonos de terra
 * do Natural Earth — nada é baixado de fora.
 */

import {
  THREE, criarPalco, controleArrasto, esferico, movimentoReduzido, RAD,
} from './runtime.js';

const RAIO = 1;

/* --- textura da Terra ----------------------------------------------------- */

let texturaPromessa = null;

async function carregarTerra() {
  if (!texturaPromessa) {
    texturaPromessa = fetch(new URL('../../vendor/world-land.json', import.meta.url))
      .then((r) => r.json())
      .then((f) => f.geometry.coordinates);
  }
  return texturaPromessa;
}

function desenharPoligonos(ctx, poligonos, largura, altura, preencher, contornar) {
  const px = (lon) => ((lon + 180) / 360) * largura;
  const py = (lat) => ((90 - lat) / 180) * altura;
  ctx.beginPath();
  for (const poligono of poligonos) {
    for (const anel of poligono) {
      anel.forEach(([lon, lat], i) => {
        const x = px(lon);
        const y = py(lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
  }
  if (preencher) {
    ctx.fillStyle = preencher;
    ctx.fill('evenodd');
  }
  if (contornar) {
    ctx.strokeStyle = contornar;
    ctx.lineWidth = Math.max(1, largura / 1400);
    ctx.stroke();
  }
}

/** Gera a textura da superfície e a máscara de terra (para não pintar o continente). */
async function criarTexturas() {
  const terra = await carregarTerra();
  const L = 2048;
  const A = 1024;

  // --- superfície visível ---
  const c = document.createElement('canvas');
  c.width = L;
  c.height = A;
  const ctx = c.getContext('2d');

  const oceano = ctx.createLinearGradient(0, 0, 0, A);
  oceano.addColorStop(0, '#08192b');
  oceano.addColorStop(0.32, '#0d2e4d');
  oceano.addColorStop(0.5, '#124066');
  oceano.addColorStop(0.68, '#0d2e4d');
  oceano.addColorStop(1, '#08192b');
  ctx.fillStyle = oceano;
  ctx.fillRect(0, 0, L, A);

  // paralelos e meridianos discretos
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * L;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, A);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * A;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(L, y);
    ctx.stroke();
  }
  // equador um pouco mais visível
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.moveTo(0, A / 2);
  ctx.lineTo(L, A / 2);
  ctx.stroke();

  desenharPoligonos(ctx, terra, L, A, '#1d3a4f', 'rgba(150,200,230,0.35)');

  const texturaTerra = new THREE.CanvasTexture(c);
  texturaTerra.colorSpace = THREE.SRGBColorSpace;
  texturaTerra.anisotropy = 4;

  // --- máscara de terra ---
  const m = document.createElement('canvas');
  m.width = L / 2;
  m.height = A / 2;
  const mctx = m.getContext('2d');
  mctx.fillStyle = '#000';
  mctx.fillRect(0, 0, m.width, m.height);
  desenharPoligonos(mctx, terra, m.width, m.height, '#fff', '#fff');
  const mascara = new THREE.CanvasTexture(m);

  return { texturaTerra, mascara };
}

/* --- shaders -------------------------------------------------------------- */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Campo de anomalia de temperatura da superfície do mar no Pacífico. */
const FRAG_ANOMALIA = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormalW;
  uniform float uFase;
  uniform float uTempo;
  uniform float uForca;
  uniform sampler2D uMascara;

  float gauss(float x, float s) { return exp(-x * x / (s * s)); }

  float campo(vec2 uv) {
    float lon = -180.0 + 360.0 * uv.x;
    float lat = -90.0 + 180.0 * uv.y;
    float xl = lon < 0.0 ? lon + 360.0 : lon;      // 0..360
    float t = (xl - 115.0) / 165.0;                // 0 = Indonésia, 1 = costa peruana
    if (t < -0.1 || t > 1.12) return 0.0;
    t = clamp(t, 0.0, 1.0);

    float faixaEq = gauss(lat / 10.5, 1.0);
    float leste = gauss((t - 0.76) / 0.30, 1.0);
    float oeste = gauss((t - 0.10) / 0.19, 1.0);

    // língua quente a leste, resfriamento compensatório a oeste
    float base = leste - 0.42 * oeste;

    // lobo costeiro junto ao Peru e ao Equador
    float costa = gauss((lon + 79.0) / 7.0, 1.0) * gauss((lat + 8.0) / 11.0, 1.0);

    float ondulacao = 1.0 + 0.06 * sin(lon * 0.09 + uTempo * 0.5);
    return (base * faixaEq + costa * 0.55) * ondulacao;
  }

  void main() {
    float a = campo(vUv) * uFase * uForca;
    float terra = texture2D(uMascara, vUv).r;
    a *= (1.0 - smoothstep(0.25, 0.75, terra));

    float m = abs(a);
    if (m < 0.02) discard;

    vec3 quente = mix(vec3(0.85, 0.45, 0.25), vec3(1.0, 0.79, 0.45), smoothstep(0.55, 1.0, m));
    vec3 frio   = mix(vec3(0.18, 0.48, 0.78), vec3(0.45, 0.83, 0.98), smoothstep(0.55, 1.0, m));
    vec3 cor = a > 0.0 ? quente : frio;

    float alfa = smoothstep(0.02, 0.35, m) * 0.88;
    gl_FragColor = vec4(cor, alfa);
  }
`;

/** Brilho atmosférico na borda do planeta. */
const FRAG_ATMOSFERA = /* glsl */ `
  precision highp float;
  varying vec3 vNormalW;
  uniform vec3 uCor;
  uniform float uIntensidade;
  void main() {
    vec3 vista = normalize(cameraPosition);
    float borda = 1.0 - abs(dot(normalize(vNormalW), normalize(vista)));
    float i = pow(borda, 2.6) * uIntensidade;
    gl_FragColor = vec4(uCor, clamp(i, 0.0, 1.0));
  }
`;

/* --- construção da cena --------------------------------------------------- */

export async function criarGlobo(hospedeiro, opcoes = {}) {
  const { modo = 'mundo', fase = 1, arcos = [], caixas = [], marcadores = [] } = opcoes;

  const palco = criarPalco(hospedeiro, { fov: modo === 'mundo' ? 34 : 30 });
  const { cena, camera } = palco;

  const grupo = new THREE.Group();
  cena.add(grupo);

  const { texturaTerra, mascara } = await criarTexturas();

  // --- planeta ---
  const planeta = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO, 96, 64),
    new THREE.MeshBasicMaterial({ map: texturaTerra })
  );
  grupo.add(planeta);

  // --- camada de anomalia ---
  const uniformes = {
    uFase: { value: fase },
    uTempo: { value: 0 },
    uForca: { value: 1 },
    uMascara: { value: mascara },
  };
  const anomalia = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO * 1.003, 96, 64),
    new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_ANOMALIA,
      uniforms: uniformes,
      transparent: true,
      depthWrite: false,
    })
  );
  grupo.add(anomalia);

  // --- atmosfera ---
  const atmosfera = new THREE.Mesh(
    new THREE.SphereGeometry(RAIO * 1.13, 64, 48),
    new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG_ATMOSFERA,
      uniforms: {
        uCor: { value: new THREE.Color('#4fb4e8') },
        uIntensidade: { value: modo === 'mundo' ? 1.25 : 0.95 },
      },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  grupo.add(atmosfera);

  // --- estrelas (só no herói) ---
  if (modo === 'mundo') {
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 26 + Math.random() * 40;
      const th = Math.acos(2 * Math.random() - 1);
      const ph = Math.random() * Math.PI * 2;
      pos.set(
        [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)],
        i * 3
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    cena.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({ color: 0x9fc4dd, size: 0.14, sizeAttenuation: true, transparent: true, opacity: 0.65 })
      )
    );
  }

  // --- caixas Niño ---
  for (const caixa of caixas) {
    const [o, l, s, n] = caixa.caixa;
    const pontos = [];
    const passo = 2;
    const oesteC = o > l ? o - 360 : o;
    for (let x = oesteC; x <= l; x += passo) pontos.push(esferico(n, x, RAIO * 1.006));
    for (let y = n; y >= s; y -= passo) pontos.push(esferico(y, l, RAIO * 1.006));
    for (let x = l; x >= oesteC; x -= passo) pontos.push(esferico(s, x, RAIO * 1.006));
    for (let y = s; y <= n; y += passo) pontos.push(esferico(y, oesteC, RAIO * 1.006));
    const linha = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pontos),
      new THREE.LineBasicMaterial({
        color: caixa.principal ? 0x4fd1c5 : 0x7e93a6,
        transparent: true,
        opacity: caixa.principal ? 0.95 : 0.5,
      })
    );
    grupo.add(linha);
    if (caixa.principal) {
      const meio = esferico((s + n) / 2, (oesteC + l) / 2, RAIO * 1.1);
      palco.criarRotulo(caixa.nome, meio, 'rotulo-3d--destaque', grupo, { ocluirEsfera: true });
    }
  }

  // --- marcadores pontuais ---
  for (const mk of marcadores) {
    const p = esferico(mk.lat, mk.lon, RAIO * 1.01);
    const ponto = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 12, 12),
      new THREE.MeshBasicMaterial({ color: mk.cor ?? 0xf2f7fb })
    );
    ponto.position.copy(p);
    grupo.add(ponto);
    if (mk.rotulo) {
      palco.criarRotulo(mk.rotulo, esferico(mk.lat, mk.lon, RAIO * 1.07), '', grupo, { ocluirEsfera: true });
    }
  }

  // --- arcos de teleconexão ---
  const arcosMesh = [];
  for (const arco of arcos) {
    const a = esferico(arco.de[0], arco.de[1], RAIO * 1.01);
    const b = esferico(arco.para[0], arco.para[1], RAIO * 1.01);
    const meio = a.clone().add(b).multiplyScalar(0.5).normalize()
      .multiplyScalar(RAIO * (1 + 0.14 + a.distanceTo(b) * 0.17));
    const curva = new THREE.QuadraticBezierCurve3(a, meio, b);
    const geo = new THREE.TubeGeometry(curva, 80, 0.019, 8, false);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uCor: { value: new THREE.Color(arco.cor) },
        uTempo: { value: 0 },
        uAtraso: { value: arco.atraso ?? 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform vec3 uCor;
        uniform float uTempo;
        uniform float uAtraso;
        void main() {
          float p = fract(vUv.x - uTempo * 0.26 + uAtraso);
          float pulso = smoothstep(0.0, 0.16, p) * (1.0 - smoothstep(0.16, 0.45, p));
          float base = 0.45;
          gl_FragColor = vec4(uCor, base + pulso * 0.85);
        }
      `,
    });
    const tubo = new THREE.Mesh(geo, mat);
    grupo.add(tubo);
    arcosMesh.push(mat);

    const chegada = new THREE.Mesh(
      new THREE.SphereGeometry(0.019, 12, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(arco.cor) })
    );
    chegada.position.copy(b);
    grupo.add(chegada);

    if (arco.rotulo) {
      palco.criarRotulo(
        arco.rotulo,
        esferico(arco.para[0], arco.para[1], RAIO * 1.1),
        arco.classe ?? '',
        grupo,
        { ocluirEsfera: true }
      );
    }
  }

  // --- enquadramento e interação ---
  camera.position.set(0, 0, 4);
  camera.lookAt(0, 0, 0);

  /**
   * Traz a região de interesse para a frente da câmera.
   * `esferico` coloca o ponto (lat, lon) em (−cosφ·senθ, cosθ, senφ·senθ),
   * com φ = (lon+180)°. Girar o grupo em α = π/2 − φ leva esse ponto ao eixo
   * +Z, que é para onde a câmera olha; a inclinação em x é a própria latitude.
   */
  const alvoLon = modo === 'mundo' ? -150 : -58;
  const alvoLat = modo === 'mundo' ? 4 : -12;
  const azBase = Math.PI / 2 - (alvoLon + 180) * RAD;
  const elBase = alvoLat * RAD;

  /** O globo do herói fica à direita do texto em telas largas. */
  function enquadrar() {
    const largo = palco.estado.largura >= 900;
    if (modo === 'mundo') {
      camera.position.z = largo ? 7.0 : 6.2;
      grupo.position.set(largo ? 1.15 : 0, largo ? -0.05 : -1.35, 0);
    } else {
      camera.position.z = largo ? 4.6 : 5.5;
      grupo.position.set(0, 0, 0);
    }
  }

  const controle = controleArrasto(hospedeiro, {
    azimuteInicial: 0,
    elevacaoInicial: 0,
    girarSozinho: modo === 'mundo' ? 0.045 : 0,
    limiteElevacao: 0.95,
  });

  const faseAlvo = { v: fase };
  let faseAtual = fase;

  palco.definirQuadro((dt, t) => {
    enquadrar();
    const c = controle.atualizar(dt);
    grupo.rotation.y = azBase + c.azimute;
    grupo.rotation.x = elBase + c.elevacao;
    uniformes.uTempo.value = t;
    faseAtual += (faseAlvo.v - faseAtual) * Math.min(1, dt * 2.4);
    uniformes.uFase.value = faseAtual;
    for (const m of arcosMesh) m.uniforms.uTempo.value = t;
  });

  enquadrar();

  if (movimentoReduzido()) {
    palco.parar();
    palco.quadroUnico();
  }

  return {
    palco,
    definirFase(v) {
      faseAlvo.v = v;
      if (movimentoReduzido()) {
        faseAtual = v;
        uniformes.uFase.value = v;
        palco.quadroUnico();
      }
    },
    destruir: () => palco.destruir(),
  };
}
