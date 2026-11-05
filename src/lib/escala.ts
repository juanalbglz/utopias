// Escala del eje de tiempo. Los sucesos se concentran en la Edad Moderna, así que el eje
// se reparte por tramos: cada tramo ocupa una parte fija del ancho, y en la web se marca
// dónde cambia la escala.
export const TRAMOS: [number, number, number][] = [
  // [desde, hasta, parte del ancho]
  [-2400, -500, 0.1],
  [-500, 0, 0.12],
  [0, 1000, 0.12],
  [1000, 1500, 0.1],
  [1500, 1700, 0.18],
  [1700, 1850, 0.3],
  [1850, 2030, 0.08],
];
export const MIN = TRAMOS[0][0];
export const MAX = TRAMOS[TRAMOS.length - 1][1];

// Año → posición entre 0 y 1.
export function pos(anio: number) {
  let acc = 0;
  for (const [a, b, w] of TRAMOS) {
    if (anio <= b) return acc + (Math.max(anio, a) - a) / (b - a) * w;
    acc += w;
  }
  return 1;
}
// Posición entre 0 y 1 → año.
export function anio(p: number) {
  let acc = 0;
  for (const [a, b, w] of TRAMOS) {
    if (p <= acc + w) return Math.round(a + ((p - acc) / w) * (b - a));
    acc += w;
  }
  return MAX;
}
export const etiqueta = (n: number) => (n < 0 ? `${-n} a. C.` : `${n}`);

// Marcas del eje: los límites de cada tramo y algunas intermedias.
export const MARCAS = [-2000, -500, 0, 500, 1000, 1250, 1500, 1600, 1700, 1750, 1800, 1850, 1950];
// Las que se ocultan en pantallas estrechas.
export const MENORES = [-2000, 500, 1250, 1600, 1750, 1850, 1950];

// Épocas para saltar rápido.
export const EPOCAS = [
  { nombre: 'Todo', desde: MIN, hasta: MAX },
  { nombre: 'Antigüedad', desde: MIN, hasta: 476 },
  { nombre: 'Edad Media', desde: 476, hasta: 1492 },
  { nombre: 'Edad Moderna', desde: 1492, hasta: 1789 },
  { nombre: 'Contemporánea', desde: 1789, hasta: MAX },
];
