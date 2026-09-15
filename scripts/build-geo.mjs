#!/usr/bin/env node
/**
 * Gera os arquivos geográficos usados pelas cenas 3D e pelo mapa do Brasil.
 *
 *   npm install            # baixa world-atlas + topojson-client (devDependencies)
 *   npm run build:geo
 *
 * Saídas (em assets/vendor/):
 *   world-land.json     contornos de terra do mundo (Natural Earth 1:110m)
 *   brazil-shape.json   polígono do Brasil (Natural Earth 1:50m)
 *   brazil-states.json  27 unidades da federação agrupadas por região
 *
 * Fontes: Natural Earth (domínio público) via o pacote npm `world-atlas`;
 *         @svg-maps/brazil de Victor Cazanave (CC BY 4.0).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { feature } from 'topojson-client';
import brazilSvgMap from '@svg-maps/brazil';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '..', 'assets', 'vendor');
mkdirSync(out, { recursive: true });

const atlas = (f) => resolve(here, '..', 'node_modules', 'world-atlas', f);
const round = (n, p = 2) => Number(n.toFixed(p));

/** Arredonda coordenadas para reduzir o tamanho do arquivo (~1 km de precisão). */
function compact(geometry, precision) {
  const walk = (c) =>
    typeof c[0] === 'number' ? [round(c[0], precision), round(c[1], precision)] : c.map(walk);
  return { ...geometry, coordinates: walk(geometry.coordinates) };
}

/** Remove anéis degenerados depois do arredondamento. */
function dropTinyRings(geometry, minPoints = 4) {
  if (geometry.type !== 'MultiPolygon') return geometry;
  const coordinates = geometry.coordinates
    .map((poly) => poly.filter((ring) => ring.length >= minPoints))
    .filter((poly) => poly.length > 0);
  return { ...geometry, coordinates };
}

// --- Terra (mundo) -----------------------------------------------------------
const land110 = JSON.parse(readFileSync(atlas('land-110m.json'), 'utf8'));
const land = feature(land110, land110.objects.land);
// `feature` devolve uma FeatureCollection quando o objeto TopoJSON é uma GeometryCollection.
const landFeature = land.type === 'FeatureCollection' ? land.features[0] : land;
const landGeom = dropTinyRings(compact(landFeature.geometry, 2));
writeFileSync(
  resolve(out, 'world-land.json'),
  JSON.stringify({
    source: 'Natural Earth 1:110m via npm world-atlas (domínio público)',
    type: 'Feature',
    geometry: landGeom,
  })
);

// --- Brasil ------------------------------------------------------------------
const countries50 = JSON.parse(readFileSync(atlas('countries-50m.json'), 'utf8'));
const countries = feature(countries50, countries50.objects.countries);
const brazil = countries.features.find((f) => f.properties.name === 'Brazil');
if (!brazil) throw new Error('Brasil não encontrado em countries-50m.json');
writeFileSync(
  resolve(out, 'brazil-shape.json'),
  JSON.stringify({
    source: 'Natural Earth 1:50m via npm world-atlas (domínio público)',
    type: 'Feature',
    geometry: compact(brazil.geometry, 2),
  })
);

// --- Unidades da federação ---------------------------------------------------
const REGIAO = {
  ac: 'norte', ap: 'norte', am: 'norte', pa: 'norte', ro: 'norte', rr: 'norte', to: 'norte',
  al: 'nordeste', ba: 'nordeste', ce: 'nordeste', ma: 'nordeste', pb: 'nordeste',
  pe: 'nordeste', pi: 'nordeste', rn: 'nordeste', se: 'nordeste',
  df: 'centro-oeste', go: 'centro-oeste', mt: 'centro-oeste', ms: 'centro-oeste',
  es: 'sudeste', mg: 'sudeste', rj: 'sudeste', sp: 'sudeste',
  pr: 'sul', rs: 'sul', sc: 'sul',
};
const estados = brazilSvgMap.locations.map((l) => {
  const regiao = REGIAO[l.id];
  if (!regiao) throw new Error(`Unidade da federação sem região: ${l.id}`);
  return { id: l.id.toUpperCase(), nome: l.name, regiao, path: l.path };
});
writeFileSync(
  resolve(out, 'brazil-states.json'),
  JSON.stringify({
    fonte: 'svg-maps/brazil por Victor Cazanave — CC BY 4.0 (https://github.com/VictorCazanave/svg-maps)',
    licenca: 'CC-BY-4.0',
    viewBox: brazilSvgMap.viewBox,
    estados,
  })
);

const kb = (p) => (readFileSync(p).length / 1024).toFixed(1) + ' kB';
console.log('world-land.json  ', kb(resolve(out, 'world-land.json')));
console.log('brazil-shape.json', kb(resolve(out, 'brazil-shape.json')));
console.log('brazil-states.json', kb(resolve(out, 'brazil-states.json')), `(${estados.length} UFs)`);
