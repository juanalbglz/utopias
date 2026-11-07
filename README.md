# No Lugaria · utopías artísticas

Reconstrucción de **No Lugaria** («no lugar», œu-topia), el blog que recopilaba experiencias utópicas en el arte y en la vida (nolugaria.noblogs.org, 2021), y su mapa de revueltas, revoluciones y utopías. Se publica en [utopias.juanalbglz.eu](https://utopias.juanalbglz.eu).

- `/` portada, con el menú original: Utopías, Utopistas, Terminología, Biblioteca utópica, Colaboraciones y ¡Participa!
- Las entradas conservan sus direcciones de WordPress (`/utopistas/tomas-moro/`, `/category/biblioteca-utopica/`, `/tag/utopia/`…).
- `/mapa/` el mapa y la línea de tiempo (antes en la portada; los enlaces antiguos `/#suceso` redirigen solos).

## Entradas del blog

Cada entrada es un Markdown en `src/content/entradas/`, en la misma ruta que tenía en el blog. Se generaron desde un volcado de la Wayback Machine:

```sh
python3 -I scripts/importar-volcado.py volcado-wayback.md
```

El importador quita los PDF de las novelas de Huxley (con derechos vigentes), cambia el correo del proyecto por el formulario de propuestas y deja imágenes y vídeos de terceros como enlaces, nunca incrustados. Las imágenes destacadas que no venían en el volcado están en `DESTACADAS`, dentro del script. Para escribir una entrada nueva basta con copiar otra y cambiar la cabecera.

## El mapa

Revueltas populares, pensamiento utópico, experiencias utópicas y arte y utopía, de Lagash (2380 a. C.) a Senegal (2021), en un mapa del mundo con su línea de tiempo. Se publica en [utopias.juanalbglz.eu](https://utopias.juanalbglz.eu).

Nació dentro de Nolugaria y se hizo primero con [TimeMapper](https://timemapper.okfnlabs.org/juanalbglz/timemapper-utopia-y-revolucin). Esta versión es un sitio estático hecho con [Astro](https://astro.build): sin cookies, sin analítica y sin recursos de terceros. El mapa se dibuja en la propia web con datos de [Natural Earth](https://www.naturalearthdata.com/) (dominio público), sin teselas ni servidores de mapas.

## Cambiar o añadir sucesos

Todo está en una hoja: `src/data/utopia-y-revolucion.csv`, con las mismas columnas que usaba TimeMapper. Se puede abrir con LibreOffice, Excel o Google Sheets y volver a guardar como CSV (UTF-8, separado por comas).

| Columna | Qué es |
| --- | --- |
| `Title` | Título. |
| `Start`, `End` | Años. Antes de Cristo, en negativo (`-510`). `End` vacío si es un solo año. |
| `Description` | Texto de la ficha. Las líneas en blanco separan párrafos. |
| `Web Page` | Enlace «Más información». |
| `Media`, `Media Caption`, `Media Credit` | Imagen (de Wikimedia Commons), su pie y su crédito. |
| `Tags` | `Revueltas populares`, `Pensamiento utópico`, `Experiencias utópicas` o `Arte y Utopía`. |
| `Place` | Lugar, tal como se muestra. |
| `Location` | Coordenadas `latitud,longitud` (por ejemplo `48.85,2.35`). Escríbelas a mano: en TimeMapper eran una fórmula de Google Sheets que ya no funciona. |
| `Source`, `Source URL` | Fuente. |

Para encontrar unas coordenadas: en [openstreetmap.org](https://www.openstreetmap.org), clic derecho sobre el sitio → «Mostrar dirección»; las dos cifras de arriba son latitud y longitud.

Cada suceso tiene su dirección: `utopias.juanalbglz.eu/mapa/#revolucion-francesa` (el título sin tildes ni signos).

## Imágenes

`npm run imagenes` descarga las imágenes de Wikimedia Commons de la columna `Media` a `public/imagenes/`, para que la web no las pida a terceros. Se hace solo al publicar. Las imágenes de otras webs no se descargan hasta comprobar sus derechos.

## En tu ordenador

```sh
npm install
npm run imagenes   # opcional
npm run dev        # http://localhost:4321
```

## Publicación

Cada cambio en `main` se publica solo en GitHub Pages (`.github/workflows/deploy.yml`). Hace falta, una vez: en *Settings → Pages*, «Source: GitHub Actions» y el dominio `utopias.juanalbglz.eu`; en el DNS, un CNAME de `utopias` a `juanalbglz.github.io`.

## Propuestas

El botón «Propón otra utopía» envía el formulario al buzón de `buzon.juanalbglz.eu/contacto.php` (repositorio juanalbglz.github.io, carpeta `servidor/`), que lo reenvía por correo. Nada se guarda en la web.

Si cambia el dominio, hay que añadir el nuevo origen a la lista `web` de `contacto.config.php` en el servidor.

## Licencias

Textos del blog: CC BY-SA 4.0, como el original. Datos del mapa: CC BY-NC-SA 4.0. Mapa: Natural Earth (dominio público). Tipografía: Bricolage Grotesque (OFL). Imágenes: las de cada archivo de Wikimedia Commons, indicadas en su ficha.
