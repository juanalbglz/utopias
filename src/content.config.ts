import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Entradas de nolugaria, una por archivo, en la misma ruta que tenían en nolugaria.noblogs.org
// (por ejemplo src/content/entradas/utopistas/tomas-moro.md → /utopistas/tomas-moro/).
// Se generaron con scripts/importar-volcado.py a partir de la copia de la Wayback Machine.
const SECCIONES = ['utopias', 'utopistas', 'terminologia', 'biblioteca', 'colaboraciones', 'acontecimientos'] as const;

const entradas = defineCollection({
  loader: glob({ base: './src/content/entradas', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    secciones: z.array(z.enum(SECCIONES)).min(1),
    subseccion: z.string().optional(),
    etiquetas: z.array(z.string()).default([]),
    original: z.string(),
  }),
});

// Páginas fijas: portada, ¡Participa!, +noblogs.
const paginas = defineCollection({
  loader: glob({ base: './src/content/paginas', pattern: '**/*.md' }),
  schema: z.object({ titulo: z.string(), original: z.string() }),
});

export const collections = { entradas, paginas };
