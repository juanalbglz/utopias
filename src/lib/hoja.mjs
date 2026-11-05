// Lectura de la hoja (CSV con las columnas de TimeMapper). La usan la web y scripts/imagenes.mjs.
import fs from 'node:fs';

// Ruta desde la raíz del repositorio (donde se ejecutan npm run build e imagenes).
export const HOJA = 'src/data/utopia-y-revolucion.csv';

// CSV según RFC 4180: comillas dobles, comas y saltos de línea dentro de campos.
export function leerCsv(texto) {
  const filas = [];
  let fila = [], campo = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); filas.push(fila); fila = []; campo = '';
    } else campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto
    .filter((f) => f.some((v) => v.trim()))
    .map((f) => Object.fromEntries(cab.map((k, i) => [k.trim(), (f[i] ?? '').trim()])));
}

export const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const numero = (s) => (s === '' ? null : Math.round(Number(String(s).replace(',', '.'))));

// Filas de la hoja con un identificador estable (para la dirección #id y el nombre de la imagen).
export function leerHoja() {
  const usados = new Set();
  return leerCsv(fs.readFileSync(HOJA, 'utf8')).map((f) => {
    const inicio = numero(f.Start);
    let id = slug(f.Title) || 'suceso';
    if (usados.has(id)) id = `${id}-${inicio < 0 ? `${-inicio}ac` : inicio}`;
    while (usados.has(id)) id += '-b';
    usados.add(id);
    return { id, f };
  });
}
