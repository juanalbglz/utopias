import { defineConfig } from 'astro/config';

// Se publica en GitHub Pages con dominio propio: utopias.juanalbglz.eu (ver public/CNAME).
export default defineConfig({
  site: 'https://utopias.juanalbglz.eu',
  trailingSlash: 'always',
});
