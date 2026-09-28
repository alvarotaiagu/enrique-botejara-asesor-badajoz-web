/* Verificación de la maqueta Enrique Botejara.
   Levanta un servidor estático, abre el sitio con Playwright y comprueba las
   trampas conocidas: cortina que no se retira, balanza que no se nivela, pila
   que se deshace por la última tarjeta, pesas que no caen, consola sucia, 404,
   cookies, menú móvil, mapa bajo clic, cursor, las dos densidades y los modos
   sin GSAP y con movimiento reducido.

   node scripts/verificar.mjs            (todo)
   node scripts/verificar.mjs --capturas (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};
const PREFIJO = '/enrique-botejara-asesor-badajoz-web';

/* se sirve bajo el prefijo del repo, como en GitHub Pages: así el 404 con
   rutas absolutas se prueba de verdad */
const servidor = http.createServer((req, res) => {
  let limpia = decodeURIComponent(req.url.split('?')[0]);
  if (limpia.startsWith(PREFIJO)) limpia = limpia.slice(PREFIJO.length) || '/';
  const destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
  if (!destino.startsWith(raiz)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(raiz, '404.html')));
    return;
  }
  res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream' });
  res.end(fs.readFileSync(destino));
});

const fallos = [];
const notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }

async function rueda(page, vueltas, paso = 700, espera = 240) {
  for (let i = 0; i < vueltas; i++) {             // window.scrollTo no dispara ScrollTrigger con Lenis
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(espera);
  }
  await page.waitForTimeout(1800);
}

async function hasta(page, selector, margen = 0) {
  for (let i = 0; i < 80; i++) {
    const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top, selector);
    if (top <= 90 + margen && top > -40) break;
    const paso = top > 0 ? Math.min(700, Math.max(120, top - 60)) : Math.max(-700, top - 80);
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1800);
}

async function nuevaPagina(navegador, opciones = {}) {
  const contexto = await navegador.newContext({
    viewport: opciones.viewport || { width: 1440, height: 900 },
    reducedMotion: opciones.reducedMotion || 'no-preference',
    deviceScaleFactor: 1
  });
  const page = await contexto.newPage();
  const errores = [];
  const caidas = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', r => caidas.push(r.url() + ' → ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) caidas.push(r.status() + ' ' + r.url()); });
  return { contexto, page, errores, caidas };
}

const lectura = page => page.evaluate(() => ({
  grados: document.getElementById('lectura-grados').textContent,
  estado: document.getElementById('lectura-estado').textContent,
  giro: document.getElementById('cruz').getAttribute('transform') || ''
}));
const mini = page => page.evaluate(() => ({
  puestas: document.querySelectorAll('#balanza-mini .pesa.puesta').length,
  estado: document.getElementById('mini-estado').textContent,
  grados: document.getElementById('mini-grados').textContent
}));
const giroDe = t => { const m = /rotate\(([-\d.]+)/.exec(t || ''); return m ? parseFloat(m[1]) : 0; };

const base = 'http://127.0.0.1:4193' + PREFIJO;
await new Promise(r => servidor.listen(4193, '127.0.0.1', r));
const navegador = await chromium.launch();

try {
  /* ───── 1. escritorio, pasada normal ───── */
  {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });

    /* fotogramas intermedios: la única forma de ver que la cortina pesa y se abre */
    await page.waitForTimeout(500);
    if (conCapturas) await page.screenshot({ path: foto('00a-cortina-trazo.png') });
    const giros = new Set();
    for (let i = 0; i < 12; i++) {
      giros.add((await page.evaluate(() => document.getElementById('cortina-cruz').getAttribute('transform') || '')).slice(0, 14));
      await page.waitForTimeout(90);
      if (i === 4 && conCapturas) await page.screenshot({ path: foto('00b-cortina-oscila.png') });
    }
    comprobar(giros.size >= 4, 'la cortina oscila antes de nivelarse (' + giros.size + ' giros distintos)');
    let abriendo = false;
    for (let i = 0; i < 50 && !abriendo; i++) {
      const y = await page.evaluate(() => {
        const r = document.getElementById('cortina-arriba').getBoundingClientRect();
        return getComputedStyle(document.getElementById('cortina')).display === 'none' ? null : r.bottom;
      });
      if (y !== null && y < 900 * 0.5 - 40 && y > 60) {
        if (conCapturas) await page.screenshot({ path: foto('00c-cortina-abriendo.png') });
        abriendo = true;
      } else await page.waitForTimeout(60);
    }
    comprobar(abriendo, 'la cortina se ve abrirse por la línea del fiel (mitades separándose)');
    const nivelada = await page.evaluate(() => document.getElementById('cortina').classList.contains('cortina--nivelada') || getComputedStyle(document.getElementById('cortina')).display === 'none');
    comprobar(nivelada, 'el fiel de la cortina llega a la marca antes de abrir');

    await page.waitForTimeout(2600);
    const cortinaFinal = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    comprobar(cortinaFinal === 'none', 'la cortina acaba en display:none (pasada normal) → ' + cortinaFinal);
    comprobar(await page.evaluate(() => !document.documentElement.classList.contains('cortina-activa')), 'se devuelve el scroll al retirar la cortina');
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(desborda <= 1, 'sin desbordamiento horizontal en escritorio (' + desborda + 'px)');
    if (conCapturas) await page.screenshot({ path: foto('01-hero.png') });

    const trazado = await page.evaluate(() => {
      const c = document.querySelector('#platillo-izq .cadena');
      return { clase: document.getElementById('balanza').classList.contains('trazado'), offset: parseFloat(getComputedStyle(c).strokeDashoffset) };
    });
    comprobar(trazado.clase && trazado.offset < 0.02, 'cadenas y soportes trazados tras la cortina → ' + JSON.stringify(trazado));

    /* cursor propio */
    await page.mouse.move(700, 300);
    await page.mouse.move(720, 320, { steps: 4 });
    await page.waitForTimeout(400);
    const cursorLibre = await page.evaluate(() => ({
      sistema: getComputedStyle(document.body).cursor,
      aro: getComputedStyle(document.querySelector('.cursor')).opacity,
      punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity
    }));
    comprobar(cursorLibre.sistema === 'none' && cursorLibre.aro === '1' && cursorLibre.punto === '1',
      'cursor propio visible (aro + punto) y el del sistema oculto → ' + JSON.stringify(cursorLibre));
    const boton = await page.locator('.hero__acciones .boton').boundingBox();
    await page.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2, { steps: 6 });
    await page.waitForTimeout(600);
    const cursorBoton = await page.evaluate(() => {
      const e = getComputedStyle(document.querySelector('.cursor'));
      return { fondo: e.backgroundColor, ancho: e.width, sistema: getComputedStyle(document.querySelector('.hero__acciones .boton')).cursor };
    });
    comprobar(/rgba\(176, 141, 79, 0\.4\)/.test(cursorBoton.fondo) && cursorBoton.ancho === '64px' && cursorBoton.sistema === 'none',
      'sobre un botón el aro crece y se rellena, sin cursor del sistema → ' + JSON.stringify(cursorBoton));
    if (conCapturas) await page.screenshot({ path: foto('01b-cursor-boton.png'), clip: { x: boton.x - 60, y: boton.y - 60, width: boton.width + 120, height: boton.height + 120 } });
    await page.mouse.move(720, 450, { steps: 4 });

    const antes = await lectura(page);
    comprobar(Math.abs(giroDe(antes.giro)) > 10 && antes.estado === 'Inclinada', 'al entrar la balanza está inclinada → ' + JSON.stringify(antes));
    await rueda(page, 2, 500);
    const medio = await lectura(page);
    if (conCapturas) await page.screenshot({ path: foto('02-hero-a-medias.png') });
    await rueda(page, 3, 600);
    const despues = await lectura(page);
    comprobar(medio.estado === 'Oscilando' || Math.abs(giroDe(medio.giro)) > 0.1, 'a media bajada el brazo oscila → ' + JSON.stringify(medio));
    comprobar(Math.abs(giroDe(despues.giro)) < 0.01 && despues.grados === '0,0°' && despues.estado === 'En equilibrio', 'al final del hero la balanza queda nivelada → ' + JSON.stringify(despues));
    const plomo = await page.evaluate(() => [document.getElementById('platillo-izq').getAttribute('transform'), document.getElementById('platillo-der').getAttribute('transform')]);
    comprobar(/translate\(90\.00 179\.00\)/.test(plomo[0]) && /translate\(510\.00 179\.00\)/.test(plomo[1]), 'nivelada, los platillos cuelgan de sus ganchos → ' + plomo.join(' / '));
    if (conCapturas) await page.screenshot({ path: foto('03-hero-nivelada.png') });

    await hasta(page, '#areas');
    if (conCapturas) await page.screenshot({ path: foto('04-areas.png') });
    const m0 = await mini(page);
    await hasta(page, '#area-fiscal', 20);
    await page.waitForTimeout(800);
    const m1 = await mini(page);
    if (conCapturas) await page.screenshot({ path: foto('05-area-fiscal.png') });
    await hasta(page, '#area-laboral', 20);
    await page.waitForTimeout(900);
    const m2 = await mini(page);
    if (conCapturas) await page.screenshot({ path: foto('06-area-laboral.png') });
    const apilada = await page.evaluate(() => getComputedStyle(document.querySelector('#area-fiscal .tarjeta')).transform);
    comprobar(apilada !== 'none', 'la tarjeta de debajo se hunde al apilarse → ' + apilada);
    await hasta(page, '#area-contable', 20);
    await page.waitForTimeout(2600);
    const m3 = await mini(page);
    if (conCapturas) await page.screenshot({ path: foto('07-area-contable.png') });
    comprobar(m0.puestas === 0 && m1.puestas === 1 && m1.estado === 'Cae a la izquierda' && m2.puestas === 2 && m2.estado === 'Cae a la derecha',
      'cada tarjeta que se posa deja caer su pesa → ' + JSON.stringify([m0, m1, m2]));
    comprobar(m3.puestas === 3 && m3.estado === 'En equilibrio' && m3.grados === '0,0°', 'con los tres pesos la balanza pequeña se equilibra → ' + JSON.stringify(m3));

    const alturas = await page.evaluate(() => [...document.querySelectorAll('.pila__item .tarjeta')].map(t => ({ alto: t.offsetHeight, cabe: t.scrollHeight <= t.clientHeight + 1 })));
    comprobar(new Set(alturas.map(a => a.alto)).size === 1 && alturas.every(a => a.cabe), 'pila: las tres tarjetas miden lo mismo y su contenido cabe → ' + JSON.stringify(alturas));

    await hasta(page, '#opinion');
    await rueda(page, 1, 300);
    if (conCapturas) await page.screenshot({ path: foto('08-opinion.png') });
    const cifra = await page.textContent('.sello-nota__cifra');
    comprobar(cifra.trim() === '5,0', 'el sello marca 5,0 → ' + cifra);

    await hasta(page, '#contacto');
    if (conCapturas) await page.screenshot({ path: foto('09-contacto.png') });
    await rueda(page, 4, 700);
    if (conCapturas) await page.screenshot({ path: foto('10-pie.png') });

    const cookiesVisible = await page.evaluate(() => {
      const c = document.getElementById('cookies');
      return { oculto: c.hidden, display: getComputedStyle(c).display };
    });
    comprobar(!cookiesVisible.oculto && cookiesVisible.display === 'flex', 'el aviso de cookies se ve al entrar');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(300);
    const cookiesCerrado = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    comprobar(cookiesCerrado === 'none', 'el botón de cookies lo cierra de verdad → ' + cookiesCerrado);

    const iframesAntes = await page.$$eval('iframe', n => n.length);
    await page.click('#mapa-boton');
    await page.waitForTimeout(900);
    const iframesDespues = await page.$$eval('iframe', n => n.length);
    comprobar(iframesAntes === 0 && iframesDespues === 1, 'el iframe del mapa no existe hasta el clic (' + iframesAntes + ' → ' + iframesDespues + ')');
    if (conCapturas) { await hasta(page, '#contacto'); await page.screenshot({ path: foto('09b-contacto-mapa.png') }); }

    const mandoSinRevision = await page.evaluate(() => {
      const m = document.getElementById('mando');
      return { oculto: m.hidden, display: getComputedStyle(m).display };
    });
    comprobar(mandoSinRevision.oculto && mandoSinRevision.display === 'none', 'sin ?revision el mando de maqueta no se ve → ' + JSON.stringify(mandoSinRevision));

    comprobar(errores.length === 0, 'consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    const caidasReales = caidas.filter(c => !/favicon\.ico|google\.com\/maps|gstatic|googleapis\.com\/maps|maps\.google|google\.com\/(gen_204|log)/.test(c));
    comprobar(caidasReales.length === 0, 'sin peticiones caídas' + (caidasReales.length ? ' → ' + caidasReales.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 1b. la pila, en una página limpia y bajando desde arriba ─────
     El fallo clásico está en la ÚLTIMA tarjeta. */
  {
    const { contexto, page } = await nuevaPagina(navegador);
    await contexto.addInitScript(() => { try { localStorage.setItem('botejara-cookies', 'ok'); } catch (e) {} });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4800);
    await page.mouse.move(720, 450);
    await hasta(page, '#area-laboral', 300);
    const tope = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pila__item')).top));
    let ultimo = null, sueltaAntes = null, asomaDebajo = null, seSeparan = null, ultimaPosada = false;
    for (let i = 0; i < 45; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(170);
      const m = await page.evaluate(() => [...document.querySelectorAll('.pila__item')].map(li => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
      ultimo = m;
      const ultima = m[m.length - 1];
      const anteriores = m.slice(0, -1);
      if (!ultimaPosada && ultima[0] > tope + 2 && ultima[0] < 900 && anteriores.some(a => a[0] < tope - 2)) sueltaAntes = sueltaAntes || { paso: i, m };
      if (Math.abs(ultima[0] - tope) <= 2) {
        ultimaPosada = true;
        if (anteriores.some(a => a[1] > ultima[1] + 1)) asomaDebajo = asomaDebajo || { paso: i, m };
      }
      if (ultimaPosada && anteriores.some(a => Math.abs(a[0] - ultima[0]) > 2)) seSeparan = seSeparan || { paso: i, m };
    }
    const sinLlegar = ultimaPosada ? '' : ' (la última no llegó a posarse: ' + JSON.stringify(ultimo) + ')';
    comprobar(ultimaPosada && !sueltaAntes, 'pila: ninguna tarjeta se suelta antes de que se pose la última' + (sueltaAntes ? ' → ' + JSON.stringify(sueltaAntes) : '') + sinLlegar);
    comprobar(ultimaPosada && !asomaDebajo, 'pila: la última tapa entera a la anterior (nada asoma por debajo)' + (asomaDebajo ? ' → ' + JSON.stringify(asomaDebajo) : '') + sinLlegar);
    comprobar(ultimaPosada && !seSeparan, 'pila: al acabarse, las tres salen juntas como un bloque' + (seSeparan ? ' → ' + JSON.stringify(seSeparan) : '') + sinLlegar);
    /* el hueco que deja el margen de la última se lo come la sección siguiente */
    const hueco = await page.evaluate(() => {
      const ultima = document.querySelector('#area-contable .tarjeta').getBoundingClientRect();
      const op = document.getElementById('opinion').getBoundingClientRect();
      return Math.round(op.top - ultima.bottom);
    });
    comprobar(hueco < 160, 'pila: sin un hueco vacío grande entre la última tarjeta y la opinión (' + hueco + 'px)');
    await contexto.close();
  }

  /* ───── 2. las dos densidades ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4800);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility === 'hidden'), 'el mando se aparta mientras el aviso de cookies está en pantalla');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => !document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).visibility !== 'hidden'), 'el mando de maqueta aparece al cerrar las cookies (lo enseña el JS)');

    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(900);
    const sobria = await page.evaluate(() => ({
      clase: document.documentElement.className,
      mini: getComputedStyle(document.querySelector('.areas__balanza')).display,
      pesa: getComputedStyle(document.querySelector('.pesa-grande')).display,
      numeral: getComputedStyle(document.querySelector('.tarjeta__numeral')).display,
      ficha: getComputedStyle(document.querySelector('.ficha')).display,
      filete: getComputedStyle(document.querySelector('.filete')).display,
      pila: getComputedStyle(document.querySelector('.pila__item')).position,
      hero: getComputedStyle(document.getElementById('balanza')).display,
      desborda: document.documentElement.scrollWidth - window.innerWidth,
      pulsado: document.querySelector('[data-densidad="sobria"]').getAttribute('aria-pressed')
    }));
    comprobar(sobria.clase.includes('densidad-sobria'), 'la clase de densidad cambia en <html>');
    comprobar(sobria.mini === 'none' && sobria.pesa === 'none' && sobria.filete === 'none', 'sobria: fuera la balanza pequeña, las pesas grabadas y los filetes → ' + [sobria.mini, sobria.pesa, sobria.filete].join('/'));
    comprobar(sobria.numeral === 'block' && sobria.ficha === 'block', 'sobria: el dibujo se cambia por dato (numerales y ficha del despacho, que la Fiel no tiene)');
    comprobar(sobria.pila === 'static' && sobria.hero !== 'none', 'sobria: las tres áreas a la vez, y la balanza del hero se queda');
    comprobar(sobria.desborda <= 1, 'sobria: sin desbordamiento nuevo (' + sobria.desborda + 'px)');
    comprobar(sobria.pulsado === 'true', 'aria-pressed correcto tras pulsar');
    if (conCapturas) {
      await page.evaluate(() => { window.scrollTo(0, 0); return 0; });
      await page.evaluate(() => { document.querySelector('.ficha').scrollIntoView({ block: 'center' }); return 0; });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: foto('20-sobria-ficha.png') });
      await hasta(page, '#areas');
      await rueda(page, 1, 500);
      await page.screenshot({ path: foto('21-sobria-areas.png') });
      await hasta(page, '#opinion');
      await page.screenshot({ path: foto('22-sobria-opinion.png') });
    }

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-sobria'), 'la densidad elegida se aplica sin parpadeo al recargar');
    await page.waitForTimeout(4600);
    await page.click('[data-densidad="fiel"]');
    await page.waitForTimeout(700);
    const vuelta = await page.evaluate(() => ({ clase: document.documentElement.className, mini: getComputedStyle(document.querySelector('.areas__balanza')).display }));
    comprobar(vuelta.clase.includes('densidad-fiel') && vuelta.mini !== 'none', 'se puede volver a la densidad Fiel');
    await contexto.close();
  }

  /* ───── 3. móvil ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 } });
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4800);
    const ancho = await page.evaluate(() => ({ innerWidth: window.innerWidth, scroll: document.documentElement.scrollWidth }));
    comprobar(ancho.innerWidth === 390 && ancho.scroll - ancho.innerWidth <= 1, 'móvil: el viewport no se ensancha (' + JSON.stringify(ancho) + ')');
    if (conCapturas) await page.screenshot({ path: foto('30-movil-hero.png') });

    await page.click('#cookies-aceptar');
    await page.waitForTimeout(600);
    await page.click('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'true', 'móvil: el menú abre');
    if (conCapturas) await page.screenshot({ path: foto('31-movil-menu.png') });
    await page.click('#hamburguesa', { timeout: 4000 });
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'false', 'móvil: el mismo botón cierra el menú');

    /* con la cabecera fija (backdrop-filter) el panel del menú no puede asomar */
    await rueda(page, 8, 700);
    const panel = await page.evaluate(() => {
      const n = document.getElementById('menu').getBoundingClientRect();
      return { fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), bottom: Math.round(n.bottom), alto: Math.round(n.height), visible: getComputedStyle(document.getElementById('menu')).visibility };
    });
    comprobar(panel.fija && (panel.bottom <= 1 || panel.visible === 'hidden') && panel.alto >= 800, 'móvil: con la cabecera fija el menú cerrado no asoma → ' + JSON.stringify(panel));
    await page.click('#hamburguesa');
    await page.waitForTimeout(900);
    const panelAbierto = await page.evaluate(() => {
      const r = document.getElementById('menu').getBoundingClientRect();
      return { alto: Math.round(r.height), top: Math.round(r.top), filtro: getComputedStyle(document.getElementById('menu')).backdropFilter };
    });
    comprobar(panelAbierto.alto >= 800 && panelAbierto.top === 0 && /blur/.test(panelAbierto.filtro), 'móvil: con la cabecera fija el menú abierto ocupa toda la pantalla, con desenfoque → ' + JSON.stringify(panelAbierto));
    if (conCapturas) await page.screenshot({ path: foto('31b-movil-menu-fija.png') });
    await page.click('#hamburguesa');
    await page.waitForTimeout(800);

    if (conCapturas) {
      await page.evaluate(() => { window.scrollTo(0, 0); return 0; });
      await page.waitForTimeout(800);
      await rueda(page, 3, 400);
      await page.screenshot({ path: foto('32-movil-hero-nivelada.png') });
      await hasta(page, '#areas');
      await page.screenshot({ path: foto('33-movil-areas.png') });
      await hasta(page, '#area-laboral');
      await page.screenshot({ path: foto('34-movil-laboral.png') });
      await hasta(page, '#opinion');
      await page.screenshot({ path: foto('35-movil-opinion.png') });
      await hasta(page, '#contacto');
      await page.screenshot({ path: foto('36-movil-contacto.png') });
      await rueda(page, 3, 700);
      await page.screenshot({ path: foto('37-movil-pie.png') });
    }
    comprobar(errores.length === 0, 'móvil: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 3b. pantallas bajas: el texto del hero no pisa la balanza ni se sale ───── */
  for (const vp of [{ width: 375, height: 667 }, { width: 360, height: 640 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp });
    await contexto.addInitScript(() => { try { localStorage.setItem('botejara-cookies', 'ok'); } catch (e) {} });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5200);
    const r = await page.evaluate(() => {
      const caja = e => e.getBoundingClientRect();
      const b = caja(document.querySelector('.hero__balanza'));
      const t = caja(document.querySelector('.hero__texto'));
      const h = caja(document.getElementById('inicio'));
      return { balanza: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)], texto: [Math.round(t.left), Math.round(t.top), Math.round(t.right), Math.round(t.bottom)], heroAbajo: Math.round(h.bottom), alto: window.innerHeight };
    });
    const solapan = !(r.texto[2] <= r.balanza[0] || r.balanza[2] <= r.texto[0] || r.texto[3] <= r.balanza[1] || r.balanza[3] <= r.texto[1]);
    comprobar(!solapan && r.texto[3] <= r.alto, 'hero ' + vp.width + '×' + vp.height + ': texto y balanza no se pisan y el texto cabe en pantalla → ' + JSON.stringify(r));
    if (conCapturas) await page.screenshot({ path: foto('3b-hero-' + vp.width + 'x' + vp.height + '.png') });
    /* la balanza no puede encoger al cambiar la lectura de estado (fallo visto
       en móvil: «Buscando el equilibrio» partía de línea y robaba alto al dibujo) */
    const estados = await page.evaluate(() => {
      const e = document.getElementById('lectura-estado'), g = document.getElementById('lectura-grados');
      const svg = document.getElementById('balanza'), l = document.querySelector('.lectura');
      const antes = [e.textContent, g.textContent];
      const medidas = [['Inclinada', '13,0°'], ['Oscilando', '10,8°'], ['En equilibrio', '0,0°']].map(([t, n]) => {
        e.textContent = t; g.textContent = n;
        return [Math.round(svg.getBoundingClientRect().height), Math.round(l.getBoundingClientRect().height), Math.round(g.getBoundingClientRect().left)];
      });
      [e.textContent, g.textContent] = antes;
      return medidas;
    });
    comprobar(new Set(estados.map(m => m.join('/'))).size === 1, 'hero ' + vp.width + '×' + vp.height + ': la balanza y la lectura no cambian de tamaño ni se mueven entre estados → ' + JSON.stringify(estados));
    await contexto.close();
  }

  /* ───── 4. sin GSAP (CDN caído) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.route('**/cdn.jsdelivr.net/**', r => r.abort());
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    const estado = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      conMovimiento: document.documentElement.classList.contains('con-movimiento'),
      bloqueado: document.documentElement.classList.contains('cortina-activa')
    }));
    comprobar(estado.cortina === 'none' && !estado.bloqueado, 'sin GSAP: la cortina se retira igual y el scroll queda libre → ' + JSON.stringify(estado));
    comprobar(!estado.conMovimiento, 'sin GSAP: no se activa con-movimiento (nada queda a medio revelar)');
    const apagados = await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, p, li, .cadena')].filter(n => {
      const e = getComputedStyle(n);
      return parseFloat(e.opacity) < 0.15 && n.getBoundingClientRect().height > 0 && !n.closest('.cortina');
    }).map(n => n.className || n.tagName));
    comprobar(apagados.length === 0, 'sin GSAP: ningún texto ni cadena queda apagado' + (apagados.length ? ' → ' + apagados.join(',') : ''));
    if (conCapturas) await page.screenshot({ path: foto('40-sin-gsap.png') });
    await page.evaluate(() => { window.scrollTo(0, window.innerHeight * 0.6); return 0; });
    await page.waitForTimeout(400);
    const l = await lectura(page);
    comprobar(l.estado === 'En equilibrio', 'sin GSAP: la balanza se nivela al bajar (sin viaje) → ' + JSON.stringify(l));
    const propios = errores.filter(e => !/Failed to load resource|ERR_FAILED/.test(e));
    comprobar(propios.length === 0, 'sin GSAP: consola sin errores propios' + (propios.length ? ' → ' + propios.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 5. movimiento reducido ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { reducedMotion: 'reduce' });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display) === 'none', 'movimiento reducido: la cortina no aparece');
    const alEntrar = await lectura(page);
    await page.evaluate(() => { window.scrollTo(0, window.innerHeight * 0.6); return 0; });
    await page.waitForTimeout(400);
    const alBajar = await lectura(page);
    comprobar(alEntrar.estado === 'Inclinada' && alBajar.estado === 'En equilibrio', 'movimiento reducido: la lectura del fiel sigue cambiando → ' + JSON.stringify([alEntrar, alBajar]));
    await page.evaluate(() => { document.getElementById('opinion').scrollIntoView({ block: 'center' }); return 0; });
    await page.waitForTimeout(700);
    const m = await mini(page);
    comprobar(m.puestas === 3 && m.estado === 'En equilibrio', 'movimiento reducido: las pesas se posan igual → ' + JSON.stringify(m));
    const cifra = await page.textContent('.sello-nota__cifra');
    comprobar(cifra.trim() === '5,0', 'movimiento reducido: el contador muestra el dato → ' + cifra);
    if (conCapturas) await page.screenshot({ path: foto('41-movimiento-reducido.png') });
    comprobar(errores.length === 0, 'movimiento reducido: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 6. 404 servido bajo el prefijo del repo ───── */
  {
    const { contexto, page, caidas } = await nuevaPagina(navegador);
    const resp = await page.goto(base + '/no-existe/ni-esto.html', { waitUntil: 'networkidle' });
    const titulo = await page.textContent('h1').catch(() => '');
    comprobar(resp.status() === 404 && /pesar/i.test(titulo || ''), '404 propio con el lenguaje del sitio → "' + titulo + '"');
    const propias = caidas.filter(c => !c.includes('/no-existe/'));
    comprobar(propias.length === 0, '404: sin recursos rotos a otra profundidad' + (propias.length ? ' → ' + propias.join(' | ') : ''));
    if (conCapturas) await page.screenshot({ path: foto('50-404.png') });
    await contexto.close();
  }

  /* ───── 7. páginas legales ───── */
  for (const p of ['aviso-legal.html', 'privacidad.html']) {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 } });
    await page.goto(base + '/' + p, { waitUntil: 'networkidle' });
    comprobar(errores.length === 0 && caidas.length === 0, p + ': sin errores ni recursos rotos' + (caidas.length ? ' → ' + caidas.join(' | ') : ''));
    if (conCapturas) await page.screenshot({ path: foto('60-' + p.replace('.html', '') + '.png') });
    await contexto.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}

console.log('\n' + notas.join('\n'));
if (fallos.length) {
  console.log('\n──────── FALLOS ────────\n' + fallos.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nTodo en orden: ' + notas.length + ' comprobaciones.');
}
