"""Convierte el volcado de nolugaria.noblogs.org (bloques «=== ruta ===») en entradas Markdown.

Uso: python3 scripts/importar-volcado.py volcado.md
Escribe src/content/entradas/<ruta>.md y src/content/paginas/<ruta>.md.
Solo hace falta volver a ejecutarlo si se recupera un volcado nuevo.
"""
import json, re, sys, pathlib

WB = 'https://web.archive.org/web/20250922020329'
SECC = {
    'experiencias-utopica': 'utopias', 'utopistas': 'utopistas', 'termino-utopico': 'terminologia',
    'biblioteca-utopica': 'biblioteca', 'colaboraciones-utopicas': 'colaboraciones',
    'acontecimiento-utopico': 'acontecimientos',
}
SUB = {'experiencias-utopica/juan-alberto-gonzalez': 'Juan Alberto González', 'biblioteca-utopica/agricultura': 'Agricultura'}
# Direcciones antiguas (el blog se llamó antes utopias.noblogs.org) que ahora tienen otra ruta.
ALIAS = {'tomas-moro': 'utopistas/tomas-moro'}
# Enlaces rotos del original («http://agroecologia-en-la-palma/») que apuntaban a otra entrada.
RELATIVOS = {'http://agroecologia-en-la-palma/': '/experiencias-utopica/juan-alberto-gonzalez/agroecologia-en-la-palma/'}
# Imágenes destacadas: el volcado no las trae; salen de las capturas HTML que pegó el autor.
DESTACADAS = {
    'experiencias-utopica/juan-alberto-gonzalez/agroecologia-en-la-palma': (
        'files/2021/05/future-431270_1920-1568x1176.jpg', 'Imagen de trealon en Pixabay',
        'Imagen de [trealon](https://pixabay.com/es/users/trealon-106306/) en [Pixabay](https://pixabay.com/es/)'),
    'utopistas/arcadi-oliveres-i-boadella': (
        'files/2021/05/Arcadi_Oliveres_20051-1568x1043.jpg', 'Arcadi Olivares 2005, por GuillemMedina, CC BY-SA 4.0, via Wikimedia Commons',
        'Arcadi Olivares 2005, por GuillemMedina, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), vía [Wikimedia Commons](https://es.wikipedia.org/wiki/Arcadi_Oliveres#/media/Archivo:Arcadi_Oliveres_%282005%29.jpg)'),
    'colaboraciones-utopicas/gracias-pere': (
        'files/2021/05/hands-2715976_640.png', 'Imagen de mohamed Hassan en Pixabay',
        'Imagen de [mohamed Hassan](https://pixabay.com/es/users/mohamed_hassan-5229782/) en [Pixabay](https://pixabay.com/es/)'),
    'experiencias-utopica/fanzine-prosumancia': ('files/2021/05/Captura-de-pantalla-2021-05-31-162050.png', 'MANUAL DE PROSUMANCIA', None),
    'termino-utopico/buscando-la-utopia': (
        'files/2021/05/33324855562_5655541a80_b.jpg', 'Lanzarote - Antiguo faro de Playa Blanca por Antonio Marín Segovia',
        'Lanzarote - Antiguo faro de Playa Blanca por [Antonio Marín Segovia](https://www.flickr.com/photos/antoniomarinsegovia/33324855562)'),
    'utopistas/tomas-moro': (
        'files/2021/04/Hans_Holbein_the_Younger_-_Sir_Thomas_More_-_Google_Art_Project-1568x1951.jpg', 'Retrato de Tomás Moro por Hans Holbein el Joven',
        'De Hans Holbein el Joven, dominio público, [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?curid=13466190)'),
    'biblioteca-utopica/la-republica': (
        'files/2021/04/Captura-de-pantalla-2021-05-13-084239.png', 'Introducing Plato de Dave Robinson, portada', None),
    'experiencias-utopica/gaetan-le-meil': ('files/2021/05/2005072710405619_low1.jpg', '', None),
}
# Copias en PDF de novelas con derechos de autor vigentes: no se vuelven a enlazar.
PDF_LA_ISLA = re.compile(r'\s*\[[^\]]*\]\([^)]*ALDOUS-HUXLEY-[^)]*\.pdf\)')
# El correo de riseup del blog original se sustituye por el formulario de propuestas.
CORREO = re.compile(r'Para ello puedes enviar un correo a nolugaria \(arroba\) riseup \(punto\) net[^\n]*')
ICONO = re.compile(r'\[!\[[^\]]*\]\([^)]*Icon_External_Link\.png\)\]\(([^)]+)\)')

def interno(url):
    m = re.match(r'https?://(?:nolugaria|utopias)\.noblogs\.org/(.*)$', url)
    if not m: return url
    ruta = m.group(1)
    if ruta.startswith('files/'): return f'{WB}/{url}'
    ruta = ruta.split('#')[0]
    ruta = ALIAS.get(ruta.strip('/'), ruta)
    return '/' + ruta.strip('/') + '/' if ruta.strip('/') else '/'

def iframe(url):
    if m := re.search(r'youtube\.com/embed/([\w-]+)', url): return 'Vídeo', f'https://www.youtube.com/watch?v={m.group(1)}'
    if m := re.search(r'player\.vimeo\.com/video/(\d+)', url): return 'Vídeo', f'https://vimeo.com/{m.group(1)}'
    if m := re.search(r'archive\.org/embed/([\w.-]+)', url): return 'Documento', f'https://archive.org/details/{m.group(1)}'
    return 'Contenido incrustado', url

def imagen(m):
    return figura(m.group(1), m.group(2))

# Imágenes que se sirven desde la propia web (public/nolugaria/). Las descarga el flujo
# .github/workflows/descargar-imagenes.yml a partir de scripts/imagenes.tsv.
DESCARGAS = {}
FICHAS = {
    'Arcadi Oliveres': '/utopistas/arcadi-oliveres-i-boadella/',
    'Nuria Güell': '/utopistas/nuria-guell/',
    'Federica Montseny': '/utopistas/federica-montseny/',
    'Antoni Gaudi': '/utopistas/antoni-gaudi/',
    'Iztiar González': '/utopistas/itziar-gonzalez/',
    'Marina Garcés': '/utopistas/marina-garces/',
}
PUBLICO = pathlib.Path('public')

def local(url):
    m = re.search(r'(?:nolugaria|utopias)\.noblogs\.org/files/(.+)$', url)
    if m:
        ruta = m.group(1)
        fuentes = [f'{WB}id_/https://{h}.noblogs.org/files/{ruta}' for h in ('nolugaria', 'utopias')]
    else:
        nombre = re.sub(r'[^\w.-]', '_', url.split('?')[0].rstrip('/').rsplit('/', 1)[-1])
        ruta = f'externas/{nombre}'
        fuentes = [url, f'{WB}id_/{url}']
    return f'nolugaria/{ruta}', fuentes

def figura(alt, url):
    alt, url = re.sub(r'\s+', ' ', alt.strip()), url.strip()
    texto = alt if alt else 'imagen'
    if 'wikipedia.org/w/skins/' in url or 'Icon_External_Link' in url: return '↗'  # icono de enlace externo
    if 'mail.riseup.net' in url: return ''  # captura de un correo privado: no se publica
    destino, fuentes = local(url)
    DESCARGAS[destino] = fuentes
    if (PUBLICO / destino).exists():
        return f'![{alt}](/{destino})'
    enlace = fuentes[0] if 'noblogs.org/files/' in url else url
    return f'[Imagen: {texto}]({enlace.replace("id_/", "im_/")})'

def limpiar(t):
    t = t.replace('¿Te ha parecido interesante?', '').replace('‌', '')
    t = ICONO.sub(lambda m: f'[↗]({m.group(1).strip()})', t)
    t = PDF_LA_ISLA.sub('', t)
    t = CORREO.sub('Para ello puedes usar el [formulario de propuestas](/participa/#propuesta).', t)
    t = re.sub(r'\[IFRAME\]\(([^)]+)\)', lambda m: '{}: <{}>'.format(*iframe(m.group(1))), t)
    t = re.sub(r'!\[((?:[^\]\[]|\n)*?)\]\(([^)\s]+)\)', imagen, t)
    t = re.sub(r'\]\((https?://(?:nolugaria|utopias)\.noblogs\.org/[^)\s]*)\)', lambda m: '](' + interno(m.group(1)) + ')', t)
    for viejo, nuevo in RELATIVOS.items(): t = t.replace(f']({viejo})', f']({nuevo})')
    t = t.replace('\\u0026', '&')
    # El correo del proyecto, escrito «arroba … punto net», también pasa al formulario.
    t = re.sub(r'Contacta con \*\*nolugaria arroba riseup punto net\*\* o deja un comentario',
               'Cuéntalo en el [formulario de propuestas](/participa/#propuesta).', t)
    # Captura de un correo privado de un colaborador: no se enlaza.
    t = re.sub(r'\[Imagen: [^\]]*\]\([^)]*mail\.riseup\.net[^)]*\)\n*', '', t)
    # Los <br> del original llegan como saltos simples: se conservan como saltos de línea.
    t = re.sub(r'(?<=[^\n])\n(?=[^\n])', '  \n', t)
    t = re.sub(r'^[ \t]*(https://(?:www\.youtube\.com/watch\?v=|youtu\.be/)\S+) ', r'Vídeo: <\1>\n\n', t, flags=re.M)
    t = re.sub(r'([?&])ref_src=twsrc%5Etfw', '', t)
    t = re.sub(r'\n[ \t]+\n', '\n\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    # Lista de pensadoras de «Gracias Pere»: cada nombre enlaza a su ficha.
    for nombre, ruta in FICHAS.items():
        t = re.sub(rf'^{re.escape(nombre)}(  )?$', rf'[{nombre}]({ruta})\1', t, flags=re.M)
    return t.strip() + '\n'

def main(src):
    txt = open(src, encoding='utf-8').read()
    bloques = re.split(r'^=== ?(.*?) ?===\s*$', txt, flags=re.M)
    raiz = pathlib.Path('src/content')
    for i in range(1, len(bloques), 2):
        ruta, cuerpo = bloques[i].strip().strip('/'), bloques[i + 1]
        cab = dict(re.findall(r'^(TÍTULO|FECHA|CATEGORÍAS|ETIQUETAS): ?(.*)$', cuerpo, flags=re.M))
        texto = limpiar(re.sub(r'^(TÍTULO|FECHA|CATEGORÍAS|ETIQUETAS):.*$', '', cuerpo, flags=re.M))
        cats = [c.strip().removeprefix('category/').strip('/') for c in cab.get('CATEGORÍAS', '').split(',') if c.strip()]
        etiquetas = [e.strip() for e in cab.get('ETIQUETAS', '').split(',') if e.strip()]
        if cats:
            secs, sub = [], None
            for c in cats:
                s = SECC[c.split('/')[0]]
                if s not in secs: secs.append(s)
                sub = SUB.get(c, sub)
            fm = {'titulo': cab['TÍTULO'], 'fecha': cab['FECHA'][:10], 'secciones': secs}
            if sub: fm['subseccion'] = sub
            if etiquetas: fm['etiquetas'] = etiquetas
            fm['original'] = '/' + ruta + '/'
            destino = raiz / 'entradas' / (ruta + '.md')
        else:
            fm = {'titulo': cab.get('TÍTULO') or 'No Lugaria', 'original': '/' + ruta + ('/' if ruta else '')}
            destino = raiz / 'paginas' / ((ruta or 'portada') + '.md')
        if ruta in DESTACADAS:
            archivo, alt, credito = DESTACADAS[ruta]
            cabeza = figura(alt, f'https://nolugaria.noblogs.org/{archivo}')
            texto = cabeza + '\n\n' + (credito + '\n\n' if credito else '') + texto
        destino.parent.mkdir(parents=True, exist_ok=True)
        lineas = ['---'] + [f'{k}: {json.dumps(v, ensure_ascii=False)}' for k, v in fm.items()] + ['---', '']
        destino.write_text('\n'.join(lineas) + texto, encoding='utf-8')
        print(destino)

    with open('scripts/imagenes.tsv', 'w', encoding='utf-8') as f:
        for destino, fuentes in sorted(DESCARGAS.items()):
            f.write('\t'.join([destino, *fuentes]) + '\n')

if __name__ == '__main__':
    main(sys.argv[1])
