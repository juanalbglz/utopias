// Mapa del mundo dibujado en la propia web (Natural Earth vía world-atlas, dominio público):
// sin teselas ni servidores de mapas. Todo se calcula al construir la web.
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import tierra50 from 'world-atlas/land-50m.json';
import type { Suceso } from './datos';

export const ANCHO = 1000;

const tierra = feature(tierra50 as any, (tierra50 as any).objects.land) as any;
// Fuera la Antártida: no hay ningún suceso y ocupa mucho alto.
const sinAntartida = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: (tierra.features ?? [tierra]).flatMap((f: any) => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates])).filter((pol: any) => pol[0].some(([, lat]: number[]) => lat > -60)) } }],
};

const proyeccion = geoNaturalEarth1().fitWidth(ANCHO, sinAntartida as any);
const camino = geoPath(proyeccion).digits(1);
const [[, y0], [, y1]] = camino.bounds(sinAntartida as any);
proyeccion.translate([proyeccion.translate()[0], proyeccion.translate()[1] - y0 + 4]);
export const ALTO = Math.ceil(y1 - y0 + 8);

export const tierraD = camino(sinAntartida as any) ?? '';
export const reticulaD = camino(geoGraticule().step([30, 30]).extentMajor([[-180, -60], [180, 85]])()) ?? '';

export const proyectar = (lon: number, lat: number) => {
  const [x, y] = proyeccion([lon, lat])!;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number];
};

// Encuadres rápidos [oeste, sur, este, norte] → viewBox.
const zonas: [string, number, number, number, number][] = [
  ['Mundo', -180, -60, 180, 85],
  ['Europa', -11, 34, 42, 62],
  ['Mediterráneo', -10, 24, 46, 48],
  ['América', -128, -40, -32, 50],
  ['Caribe', -98, 5, -55, 35],
  ['Asia', 60, -15, 155, 50],
];
export const ZONAS = zonas.map(([nombre, o, s, e, n]) => {
  if (nombre === 'Mundo') return { nombre, vb: [0, 0, ANCHO, ALTO] };
  const pts = [[o, s], [e, s], [o, n], [e, n], [(o + e) / 2, n], [(o + e) / 2, s]].map(([lo, la]) => proyectar(lo, la));
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { nombre, vb: [x, y, Math.max(...xs) - x, Math.max(...ys) - y].map((v) => Math.round(v)) };
});

// Posición de cada suceso. Los que caen en el mismo sitio (París, Londres, Roma…)
// se reparten en espiral alrededor del punto para que se puedan pulsar todos.
export function situar(sucesos: Suceso[]) {
  const SEP = 1.6; // unidades del mapa a escala 1
  const puestos: [number, number][] = [];
  return sucesos.map((s) => {
    const [x, y] = proyectar(s.lon, s.lat);
    let px = x, py = y;
    for (let k = 1; k < 200 && puestos.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < SEP); k++) {
      const ang = k * 2.4, r = SEP * 0.62 * Math.sqrt(k);
      px = x + r * Math.cos(ang); py = y + r * Math.sin(ang);
    }
    puestos.push([px, py]);
    return { ...s, x: Math.round(px * 100) / 100, y: Math.round(py * 100) / 100 };
  });
}
