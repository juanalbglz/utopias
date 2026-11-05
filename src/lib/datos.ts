// Lee la hoja de TimeMapper (src/data/utopia-y-revolucion.csv) y la convierte en sucesos.
// Las columnas son las mismas que usaba TimeMapper, así que la hoja se puede seguir
// editando en una hoja de cálculo y exportando como CSV.
import { leerHoja, numero as num } from './hoja.mjs';
import imagenes from '../data/imagenes.json';

export interface Suceso {
  id: string;
  titulo: string;
  inicio: number;
  fin: number | null;
  fechas: string;
  descripcion: string[];
  web: string;
  imagen: { src: string; pie: string; credito: string } | null;
  categoria: string;
  lugar: string;
  lat: number;
  lon: number;
  fuente: string;
  fuenteUrl: string;
}

export const CATEGORIAS = [
  { id: 'revueltas', nombre: 'Revueltas populares', forma: 'circulo' },
  { id: 'pensamiento', nombre: 'Pensamiento utópico', forma: 'rombo' },
  { id: 'experiencias', nombre: 'Experiencias utópicas', forma: 'anillo' },
  { id: 'arte', nombre: 'Arte y utopía', forma: 'triangulo' },
] as const;

const porNombre = new Map(CATEGORIAS.map((c) => [c.nombre.toLowerCase(), c.id]));

const anio = (n: number) => (n < 0 ? `${-n} a. C.` : `${n}`);
export function formatoFechas(inicio: number, fin: number | null) {
  if (fin === null || fin === inicio) return anio(inicio);
  if (inicio < 0 && fin < 0) return `${-inicio}–${-fin} a. C.`;
  return `${anio(inicio)}–${anio(fin)}`;
}

export function cargarSucesos(): Suceso[] {
  const sucesos = leerHoja().map(({ id, f }) => {
    const inicio = num(f.Start);
    const [lat, lon] = (f.Location || '').split(',').map(Number);
    if (inicio === null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error(`Falta la fecha o la ubicación de «${f.Title}» (Start: «${f.Start}», Location: «${f.Location}»)`);
    }
    const fin = num(f.End);
    const img = (imagenes as Record<string, string>)[id];
    return {
      id,
      titulo: f.Title,
      inicio,
      fin: fin !== null && fin !== inicio ? fin : null,
      fechas: formatoFechas(inicio, fin),
      descripcion: f.Description.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean),
      web: f['Web Page'],
      imagen: img ? { src: img, pie: f['Media Caption'], credito: f['Media Credit'] } : null,
      categoria: porNombre.get(f.Tags.toLowerCase()) ?? 'revueltas',
      lugar: f.Place,
      lat,
      lon,
      fuente: f.Source,
      fuenteUrl: f['Source URL'],
    } satisfies Suceso;
  });
  return sucesos.sort((a, b) => a.inicio - b.inicio || (a.fin ?? a.inicio) - (b.fin ?? b.inicio));
}
