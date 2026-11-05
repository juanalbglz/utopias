// Interacción del mapa, la línea de tiempo y la ficha. Sin dependencias.
import { anio, etiqueta, MIN, MAX } from '../lib/escala';

interface S { id: string; i: number; f: number; c: string; x: number; y: number; t: string }
interface Datos { sucesos: S[]; zonas: { nombre: string; vb: number[] }[]; ancho: number; alto: number }

const R_PX = 5.5; // radio de los puntos en píxeles de pantalla
const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector(sel) as T;
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => [...el.querySelectorAll(sel)] as T[];

export function iniciar() {
  const datos: Datos = JSON.parse($('#datos').textContent!);
  const { sucesos, ancho: AN, alto: AL } = datos;
  const porId = new Map(sucesos.map((s) => [s.id, s]));
  const figura = $('#mapa');
  const svg = $<SVGSVGElement>('svg', figura);
  const marcas = new Map($$<SVGGElement>('.marca', figura).map((g) => [g.dataset.id!, g]));
  const grupo = $<SVGGElement>('#marcas');
  const barras = new Map($$<SVGRectElement>('#eje .barra').map((r) => [r.dataset.id!, r]));
  const filas = new Map($$<HTMLLIElement>('#lista .suceso').map((li) => [li.dataset.id!, li]));
  const ficha = $('#ficha');
  const desp = $<SVGFEDisplacementMapElement>('#tinta-mapa feDisplacementMap');
  const turb = $<SVGFETurbulenceElement>('#tinta-mapa feTurbulence');
  const inDesde = $<HTMLInputElement>('#desde'), inHasta = $<HTMLInputElement>('#hasta');

  const estado = { cats: new Set(sucesos.map((s) => s.c)), desde: MIN, hasta: MAX, activo: '' };
  const visible = (s: S) => estado.cats.has(s.c) && s.f >= estado.desde && s.i <= estado.hasta;
  let visibles = sucesos;

  // ——— Encuadre (viewBox) ———
  // La proporción del encuadre es la del mapa en pantalla (más alta en el móvil).
  const prop = () => (svg.clientWidth && svg.clientHeight ? svg.clientWidth / svg.clientHeight : AN / AL);
  let vb = [0, 0, AN, AL];
  const ajustar = ([x, y, w, h]: number[]) => {
    const ar = prop();
    // Que quepa la zona pedida, sin salirse nunca del mapa.
    if (w / h > ar) { const nh = w / ar; y -= (nh - h) / 2; h = nh; } else { const nw = h * ar; x -= (nw - w) / 2; w = nw; }
    const cx = x + w / 2, cy = y + h / 2;
    w = Math.min(AN, AL * ar, Math.max(40, w)); h = w / ar;
    x = Math.min(AN - w, Math.max(0, cx - w / 2)); y = Math.min(AL - h, Math.max(0, cy - h / 2));
    return [x, y, w, h];
  };
  const pintarVB = () => {
    svg.setAttribute('viewBox', vb.map((v) => v.toFixed(2)).join(' '));
    const k = (R_PX * vb[2]) / (svg.clientWidth || AN);
    for (const [id, g] of marcas) { const s = porId.get(id)!; g.setAttribute('transform', `translate(${s.x} ${s.y}) scale(${k.toFixed(3)})`); }
  };
  // El borde de tinta se recalcula al final para que no crezca con el zoom.
  const pintarTinta = () => {
    const z = AN / vb[2];
    desp.setAttribute('scale', (2.4 / z).toFixed(3));
    turb.setAttribute('baseFrequency', (0.05 * z).toFixed(4));
  };
  let anim = 0;
  const irA = (dest: number[], animar = true) => {
    dest = ajustar(dest);
    cancelAnimationFrame(anim);
    if (!animar || matchMedia('(prefers-reduced-motion: reduce)').matches) { vb = dest; pintarVB(); pintarTinta(); return; }
    const ini = vb.slice(), t0 = performance.now(), dur = 450;
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      vb = ini.map((v, i) => v + (dest[i] - v) * e);
      pintarVB();
      if (p < 1) anim = requestAnimationFrame(paso); else pintarTinta();
    };
    anim = requestAnimationFrame(paso);
  };
  const zonaBotones = $$<HTMLButtonElement>('#zonas .chip');
  const marcarZona = (i: number) => zonaBotones.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
  zonaBotones.forEach((b, i) => b.addEventListener('click', () => { marcarZona(i); irA(datos.zonas[i].vb); }));
  const zoom = (f: number, cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2) => {
    const w = vb[2] / f, h = vb[3] / f;
    marcarZona(-1);
    return [cx - ((cx - vb[0]) / vb[2]) * w, cy - ((cy - vb[1]) / vb[3]) * h, w, h];
  };
  $$<HTMLButtonElement>('.zoom button', figura).forEach((b) => b.addEventListener('click', () => irA(zoom(Number(b.dataset.zoom)))));
  new ResizeObserver(() => { vb = ajustar(vb); pintarVB(); document.documentElement.style.setProperty('--alto-mapa', `${figura.offsetHeight}px`); }).observe(figura);

  // Arrastrar para mover; dos dedos para acercar.
  const punteros = new Map<number, { x: number; y: number }>();
  let movido = 0;
  const aMapa = (px: number, py: number) => {
    const r = svg.getBoundingClientRect();
    return [vb[0] + ((px - r.left) / r.width) * vb[2], vb[1] + ((py - r.top) / r.height) * vb[3]];
  };
  svg.addEventListener('pointerdown', (e) => { punteros.set(e.pointerId, { x: e.clientX, y: e.clientY }); movido = 0; });
  svg.addEventListener('pointermove', (e) => {
    const prev = punteros.get(e.pointerId);
    if (!prev) return;
    const r = svg.getBoundingClientRect();
    if (punteros.size === 1) {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      movido += Math.abs(dx) + Math.abs(dy);
      if (movido > 4) {
        if (!figura.classList.contains('arrastrando')) { figura.classList.add('arrastrando'); svg.setPointerCapture(e.pointerId); marcarZona(-1); }
        vb = ajustar([vb[0] - (dx / r.width) * vb[2], vb[1] - (dy / r.height) * vb[3], vb[2], vb[3]]);
        pintarVB();
      }
    } else if (punteros.size === 2) {
      const [a, b] = [...punteros.entries()].map(([id, p]) => (id === e.pointerId ? { x: e.clientX, y: e.clientY } : p));
      const [oa, ob] = [...punteros.values()];
      const d0 = Math.hypot(oa.x - ob.x, oa.y - ob.y), d1 = Math.hypot(a.x - b.x, a.y - b.y);
      if (d0 > 0) { const [cx, cy] = aMapa((a.x + b.x) / 2, (a.y + b.y) / 2); vb = ajustar(zoom(d1 / d0, cx, cy)); pintarVB(); }
      movido = 99;
    }
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  const soltar = (e: PointerEvent) => {
    punteros.delete(e.pointerId);
    if (!punteros.size && figura.classList.contains('arrastrando')) { figura.classList.remove('arrastrando'); pintarTinta(); }
    if (punteros.size === 0 && movido === 99) pintarTinta();
  };
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);
  // Rueda con Ctrl/⌘ (o gesto de pellizco del trackpad) para acercar sin secuestrar el scroll.
  svg.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const [cx, cy] = aMapa(e.clientX, e.clientY);
    vb = ajustar(zoom(Math.exp(-e.deltaY * 0.01), cx, cy)); pintarVB(); pintarTinta();
  }, { passive: false });

  // ——— Filtros ———
  const estadoTxt = $('#estado');
  const fueraI = $<SVGRectElement>('#fuera-i'), fueraD = $<SVGRectElement>('#fuera-d');
  const aplicar = () => {
    visibles = sucesos.filter(visible);
    const vis = new Set(visibles.map((s) => s.id));
    for (const [id, g] of marcas) g.classList.toggle('apagada', !vis.has(id));
    for (const [id, r] of barras) r.classList.toggle('apagada', !vis.has(id));
    for (const [id, li] of filas) li.hidden = !vis.has(id);
    const todo = estado.desde <= MIN && estado.hasta >= MAX;
    estadoTxt.innerHTML = `${todo ? 'Todo' : `${etiqueta(estado.desde)} – ${etiqueta(estado.hasta)}`}: <span>${visibles.length}</span> ${visibles.length === 1 ? 'suceso' : 'sucesos'}`;
    const pi = Number(inDesde.value), pd = Number(inHasta.value);
    fueraI.setAttribute('width', String(pi));
    fueraD.setAttribute('x', String(pd)); fueraD.setAttribute('width', String(1000 - pd));
    pintarNav();
  };
  $$<HTMLButtonElement>('#categorias .chip').forEach((b) => b.addEventListener('click', () => {
    const c = b.dataset.cat!;
    if (estado.cats.has(c)) estado.cats.delete(c); else estado.cats.add(c);
    b.setAttribute('aria-pressed', String(estado.cats.has(c)));
    aplicar();
  }));
  const epocaBotones = $$<HTMLButtonElement>('#epocas .chip');
  const pos = (n: number) => {
    // Busca la posición del año probando el inverso (la escala es monótona).
    let lo = 0, hi = 1000;
    for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (anio(m / 1000) < n) lo = m; else hi = m; }
    return Math.round(hi);
  };
  const periodo = (desde: number, hasta: number) => {
    estado.desde = desde; estado.hasta = hasta;
    inDesde.value = String(pos(desde)); inHasta.value = String(pos(hasta));
    epocaBotones.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.desde) === desde && Number(b.dataset.hasta) === hasta)));
    aplicar();
  };
  epocaBotones.forEach((b) => b.addEventListener('click', () => periodo(Number(b.dataset.desde), Number(b.dataset.hasta))));
  const deslizar = () => {
    let a = Number(inDesde.value), b = Number(inHasta.value);
    if (a > b) { [a, b] = [b, a]; }
    estado.desde = a <= 0 ? MIN : anio(a / 1000);
    estado.hasta = b >= 1000 ? MAX : anio(b / 1000);
    epocaBotones.forEach((x) => x.setAttribute('aria-pressed', 'false'));
    aplicar();
  };
  inDesde.addEventListener('input', () => { if (+inDesde.value > +inHasta.value) inDesde.value = inHasta.value; deslizar(); });
  inHasta.addEventListener('input', () => { if (+inHasta.value < +inDesde.value) inHasta.value = inDesde.value; deslizar(); });

  // ——— Ficha ———
  const nav = document.createElement('div');
  nav.className = 'nav';
  nav.innerHTML = '<button type="button" data-paso="-1">← Anterior</button><button type="button" data-paso="1">Siguiente →</button>';
  const contenido = document.createElement('div');
  const pintarNav = () => {
    const i = visibles.findIndex((s) => s.id === estado.activo);
    const [ant, sig] = $$<HTMLButtonElement>('button', nav);
    ant.disabled = i <= 0; sig.disabled = i < 0 || i >= visibles.length - 1;
  };
  nav.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    const i = visibles.findIndex((s) => s.id === estado.activo);
    const s = visibles[i + Number(b.dataset.paso)];
    if (s) seleccionar(s.id);
  });

  function seleccionar(id: string, { encuadrar = true, historia = true } = {}) {
    const s = porId.get(id), li = filas.get(id);
    if (!s || !li) return;
    // Si el suceso está filtrado, se vuelve a mostrar.
    if (!estado.cats.has(s.c)) { estado.cats.add(s.c); $(`#categorias [data-cat="${s.c}"]`).setAttribute('aria-pressed', 'true'); }
    if (!visible(s)) periodo(MIN, MAX); else aplicar();
    marcas.get(estado.activo)?.classList.remove('activa');
    barras.get(estado.activo)?.classList.remove('activa');
    estado.activo = id;
    const g = marcas.get(id)!;
    g.classList.add('activa'); grupo.appendChild(g);
    barras.get(id)?.classList.add('activa');

    const cat = $('.cat', li).cloneNode(true) as HTMLElement;
    const lugar = $('.meta', li).textContent!.split(' · ').slice(1).join(' · ');
    contenido.innerHTML = '';
    const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = $('.anio', li).textContent;
    const h = document.createElement('h3'); h.textContent = $('h3', li).textContent;
    const meta = document.createElement('p'); meta.className = 'meta'; meta.append(cat); if (lugar) meta.append(` · ${lugar}`);
    contenido.append(eyebrow, h, meta, ($('.cuerpo', li).cloneNode(true)));
    ficha.replaceChildren(nav, contenido);
    ficha.scrollTop = 0;
    pintarNav();
    if (historia) history.replaceState(null, '', `#${id}`);
    if (encuadrar) {
      const [x, y, w, h2] = vb, m = 0.08;
      if (s.x < x + w * m || s.x > x + w * (1 - m) || s.y < y + h2 * m || s.y > y + h2 * (1 - m)) { marcarZona(-1); irA([s.x - w / 2, s.y - h2 / 2, w, h2]); }
    }
  }

  grupo.addEventListener('click', (e) => {
    const g = (e.target as Element).closest<SVGGElement>('.marca');
    if (g && movido < 5) seleccionar(g.dataset.id!, { encuadrar: false });
  });
  $('#eje').addEventListener('click', (e) => {
    const r = (e.target as Element).closest<SVGRectElement>('.barra');
    if (r) seleccionar(r.dataset.id!);
  });
  $('#lista').addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('h3 a');
    if (!a) return;
    e.preventDefault();
    seleccionar(a.hash.slice(1));
    figura.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  $('#empezar').addEventListener('click', () => visibles[0] && seleccionar(visibles[0].id));
  // Teclado: ← → recorren los sucesos cuando hay uno abierto.
  document.addEventListener('keydown', (e) => {
    if (!estado.activo || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return;
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!paso) return;
    const i = visibles.findIndex((s) => s.id === estado.activo);
    const s = visibles[i + paso];
    if (s) { e.preventDefault(); seleccionar(s.id); }
  });

  pintarVB(); pintarTinta(); aplicar();
  const hash = decodeURIComponent(location.hash.slice(1));
  if (porId.has(hash)) { seleccionar(hash, { historia: false }); figura.scrollIntoView({ block: 'start' }); }
}
