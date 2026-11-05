// Descarga las imágenes de la hoja (columna «Media») y las guarda en la web,
// para que la página no pida nada a terceros al visitarla.
//
// Solo se descargan las de Wikimedia Commons (licencias libres). Las de otras webs
// se quedan fuera hasta comprobar sus derechos; para incluir una, súbela a Commons
// o ponla en public/imagenes/ y añádela a mano en src/data/imagenes.json.
// Escribe public/imagenes/<id>.<ext> y src/data/imagenes.json. Si no hay red, avisa y sigue.
import fs from 'node:fs/promises';
import { leerHoja } from '../src/lib/hoja.mjs';

const UA = 'utopias.juanalbglz.eu build (https://github.com/juanalbglz/utopias)';
const ANCHO = 640;
const dir = 'public/imagenes';
const salida = 'src/data/imagenes.json';
await fs.mkdir(dir, { recursive: true });

// upload.wikimedia.org/wikipedia/commons/a/ab/Archivo.jpg (o su miniatura) → miniatura de ANCHO px.
function miniatura(url) {
  const m = url.match(/^https?:\/\/upload\.wikimedia\.org\/wikipedia\/([^/]+)\/(?:thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)/);
  if (!m) return null;
  const [, proyecto, a, ab, archivo] = m;
  const original = `https://upload.wikimedia.org/wikipedia/${proyecto}/${a}/${ab}/${archivo}`;
  const svg = /\.svg$/i.test(archivo);
  const nombre = svg ? `${archivo}.png` : archivo;
  return { original, mini: `https://upload.wikimedia.org/wikipedia/${proyecto}/thumb/${a}/${ab}/${archivo}/${ANCHO}px-${nombre}`, ext: (svg ? 'png' : archivo.split('.').pop()).toLowerCase() };
}

async function bajar(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

const resultado = {};
let fuera = 0, fallos = 0;
for (const { id, f } of leerHoja()) {
  const media = f.Media;
  if (!media) continue;
  const w = miniatura(media);
  if (!w) { fuera++; continue; }
  const destino = `${dir}/${id}.${w.ext}`;
  try {
    await fs.access(destino);
  } catch {
    try {
      let datos;
      // La miniatura no existe si el original es más estrecho que ANCHO: entonces, el original.
      try { datos = await bajar(w.mini); } catch { datos = await bajar(w.original); }
      await fs.writeFile(destino, datos);
      await new Promise((r) => setTimeout(r, 300));
    } catch (e) {
      fallos++;
      console.warn(`Sin imagen para ${id}: ${e.message}`);
      continue;
    }
  }
  resultado[id] = `/imagenes/${id}.${w.ext}`;
}
await fs.writeFile(salida, JSON.stringify(resultado, null, 2) + '\n');
console.log(`${Object.keys(resultado).length} imágenes; ${fuera} de otras webs sin descargar; ${fallos} fallos.`);
