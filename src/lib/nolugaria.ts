// Menú y secciones de nolugaria, tal como estaban en nolugaria.noblogs.org.
export const CAPTURA = 'https://web.archive.org/web/20250922020329/https://nolugaria.noblogs.org';

export const SECCIONES = [
  { id: 'utopias', nombre: 'Utopías', ruta: '/category/experiencias-utopica/', menu: true },
  { id: 'utopistas', nombre: 'Utopistas', ruta: '/category/utopistas/', menu: true },
  { id: 'terminologia', nombre: 'Terminología', ruta: '/category/termino-utopico/', menu: true },
  { id: 'biblioteca', nombre: 'Biblioteca utópica', ruta: '/category/biblioteca-utopica/', menu: true, texto: 'La biblioteca pretende compilar escritos fundacionales sobre la utopía a lo largo del tiempo.' },
  { id: 'colaboraciones', nombre: 'Colaboraciones', ruta: '/category/colaboraciones-utopicas/', menu: true },
  { id: 'acontecimientos', nombre: 'Acontecimientos', ruta: '/category/acontecimiento-utopico/', menu: false },
] as const;

export const seccion = (id: string) => SECCIONES.find((s) => s.id === id)!;

export const slug = (t: string) =>
  t.replace(/['’]/g,'').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const fecha = (d: Date) =>
  d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const enlace = (original: string) => original;
export const subRuta = (id: string, sub: string) => `${seccion(id).ruta}${slug(sub)}/`;
export const etiquetaRuta = (t: string) => `/tag/${slug(t)}/`;
