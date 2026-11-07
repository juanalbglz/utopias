import { getCollection, type CollectionEntry } from 'astro:content';
export type Entrada = CollectionEntry<'entradas'>;
export const todas = async () =>
  (await getCollection('entradas')).sort((a, b) => b.data.fecha.getTime() - a.data.fecha.getTime());
