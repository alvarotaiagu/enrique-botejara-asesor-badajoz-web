/* ═══════════════════════════════════════════════════════════════════════════
   Enrique Botejara · «Fiel»
   La cortina pesa: el brazo oscila, se amortigua, el fiel se para en la marca
   y la página se abre por esa línea. En el hero la balanza vuelve a estar
   inclinada y se nivela al bajar. En las áreas, cada tarjeta que se posa deja
   caer su pesa en un platillo; con las tres, equilibrio.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue cambiando (la lectura del fiel,
   las pesas que se posan, el contador); lo que se apaga es el viaje.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;

  if (gsapReady) {
    gsap.registerPlugin(window.ScrollTrigger);
    /* un atasco al cargar en frío no se salta la oscilación: más de 80 ms cuenta como 33 */
    gsap.ticker.lagSmoothing(80, 33);
  }
  if (movimiento) html.classList.add('con-movimiento');

  function alturaCabecera() {
    return parseFloat(getComputedStyle(html).getPropertyValue('--cab')) || 76;
  }
  function tope() { return alturaCabecera() + window.innerHeight * 0.03; }

  function cuandoVisible(nodos, umbral, alEntrar) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  function grados(g, conSigno) {
    var v = Math.abs(g) < 0.05 ? 0 : g;
    var t = Math.abs(v).toFixed(1).replace('.', ',') + '°';
    if (conSigno && v !== 0) t = (v < 0 ? '−' : '+') + t;
    return t;
  }

  /* ─────────── geometría común de las balanzas ───────────
     Eje en (300,170) del viewBox; los platillos cuelgan de (90,179) y (510,179).
     La cruz gira; los platillos NO giran: se trasladan con el gancho y siguen
     colgando a plomo. Todo por atributo: ningún transform de CSS lo pisa. */
  var EJE = [300, 170];
  var GANCHOS = [[90, 179], [510, 179]];
  function colocar(b, g) {
    b.cruz.setAttribute('transform', 'rotate(' + g.toFixed(3) + ' ' + EJE[0] + ' ' + EJE[1] + ')');
    var r = g * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
    [b.izq, b.der].forEach(function (p, i) {
      var dx = GANCHOS[i][0] - EJE[0], dy = GANCHOS[i][1] - EJE[1];
      var x = EJE[0] + dx * c - dy * s, y = EJE[1] + dx * s + dy * c;
      p.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')');
    });
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.6 }); return; }
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id);
  });

  /* ───────────────────── titulares partidos ───────────────────── */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.trim();
    var palabras = texto.split(/\s+/);
    el.setAttribute('aria-label', texto);
    el.textContent = '';
    var piezas = [];
    palabras.forEach(function (palabra, i) {
      var caja = document.createElement('span');
      caja.className = 'palabra';
      caja.setAttribute('aria-hidden', 'true');
      if (modo === 'letras') {
        palabra.split('').forEach(function (c) {
          var s = document.createElement('span');
          s.className = 'letra';
          s.textContent = c;
          caja.appendChild(s);
          piezas.push(s);
        });
      } else {
        var s = document.createElement('span');
        s.className = 'palabra-int';
        s.textContent = palabra;
        caja.appendChild(s);
        piezas.push(s);
      }
      el.appendChild(caja);
      if (i < palabras.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return piezas;
  }

  function revelar(el, piezas, retardo) {
    /* y:0 explícito: GSAP lee el translate3d del CSS como píxeles, no como yPercent */
    gsap.to(piezas, {
      y: 0, yPercent: 0,
      duration: 1.1,
      ease: 'expo.out',
      delay: retardo || 0,
      stagger: el.dataset.revelar === 'letras' ? 0.024 : 0.055
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-revelar]'), function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      document.addEventListener('cortina-abriendose', function () { revelar(el, piezas, 0.35); }, { once: true });
      return;
    }
    /* una sola vez: IntersectionObserver, nunca ScrollTrigger once:true */
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina: pesa, se nivela y se abre por el fiel ───────────────── */
  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) return;
    var hecho = false, abierta = false;

    function abriendose() {
      if (abierta) return;
      abierta = true;
      document.dispatchEvent(new CustomEvent('cortina-abriendose'));
    }
    function retirar() {
      if (hecho) return;
      hecho = true;
      abriendose();
      cort.classList.add('fuera');
      html.classList.remove('cortina-activa');
      if (lenis) lenis.start();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 200 : 120);
      return;
    }

    html.classList.add('cortina-activa');
    if (lenis) lenis.stop();

    var q = function (s) { return cort.querySelector(s); };
    var arriba = document.getElementById('cortina-arriba');
    var abajo = document.getElementById('cortina-abajo');
    var dial = document.getElementById('cortina-dial');
    var base = document.getElementById('cortina-base');
    var cruz = document.getElementById('cortina-cruz');
    var lectura = document.getElementById('cortina-grados');
    var horizonte = document.getElementById('cortina-horizonte');
    var trazas = Array.prototype.slice.call(cort.querySelectorAll('.cd-traza'));
    var nombre = Array.prototype.slice.call(cort.querySelectorAll('.cortina__nombre span'));
    var AMPLITUD = 11;

    function inclinar(t) {
      /* oscilación amortiguada que acaba EXACTAMENTE en cero */
      var g = t >= 1 ? 0 : AMPLITUD * Math.exp(-3 * t) * Math.cos(2 * Math.PI * 2.2 * t) * (1 - t);
      cruz.setAttribute('transform', 'rotate(' + g.toFixed(3) + ' 220 200)');
      lectura.textContent = grados(g);
    }
    inclinar(0);

    var osc = { t: 0 };
    var tl = gsap.timeline({ onComplete: retirar });
    tl.to(trazas, { strokeDashoffset: 0, duration: 0.95, ease: 'power2.inOut', stagger: 0.07 }, 0)
      .to(q('.cd-marcas'), { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.35)
      .to([q('.cd-fiel'), q('.cd-eje')].concat(Array.prototype.slice.call(cort.querySelectorAll('.cd-punta'))), { opacity: 1, duration: 0.35 }, 0.45)
      .to([q('.cd-indice'), q('.cortina__lectura')], { opacity: 1, duration: 0.4 }, 0.55)
      .to(nombre, { y: 0, yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08 }, 0.7)
      .to(q('.cortina__oficio'), { opacity: 1, duration: 0.6 }, 1.05)
      /* el brazo pesa: oscila y se amortigua hasta la marca */
      .to(osc, { t: 1, duration: 1.75, ease: 'none', onUpdate: function () { inclinar(osc.t); } }, 0.55)
      .add(function () { cort.classList.add('cortina--nivelada'); }, 2.3)
      /* la línea del brazo se prolonga hasta los bordes: es la costura por la que se abre */
      .to(horizonte, { scaleX: 1, duration: 0.55, ease: 'expo.out' }, 2.3)
      .add(abriendose, 2.85)
      .to(horizonte, { opacity: 0, duration: 0.3 }, 2.85)
      .to(arriba, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 2.85)
      .to(abajo, { yPercent: 100, duration: 1.15, ease: 'expo.inOut' }, 2.85)
      .to(dial, { y: -70, duration: 1.15, ease: 'expo.inOut' }, 2.85)
      .to(base, { y: 90, duration: 1.15, ease: 'expo.inOut' }, 2.85)
      /* bordes curvos: se abomban al arrancar y se aplanan al salir */
      .to('#labio-arriba', { attr: { d: 'M0 0H100V0Q50 10 0 0Z' }, duration: 0.55, ease: 'power2.in' }, 2.85)
      .to('#labio-arriba', { attr: { d: 'M0 0H100V0Q50 0 0 0Z' }, duration: 0.6, ease: 'power2.out' }, 3.4)
      .to('#labio-abajo', { attr: { d: 'M0 10H100V10Q50 0 0 10Z' }, duration: 0.55, ease: 'power2.in' }, 2.85)
      .to('#labio-abajo', { attr: { d: 'M0 10H100V10Q50 10 0 10Z' }, duration: 0.6, ease: 'power2.out' }, 3.4);

    /* red de seguridad: pase lo que pase, a los 7 s la cortina se va */
    setTimeout(retirar, 7000);
  })();

  /* ───────────────── hero: la balanza se nivela al bajar ───────────────── */
  (function hero() {
    var seccion = document.getElementById('inicio');
    var svg = document.getElementById('balanza');
    if (!seccion || !svg) return;
    var b = { cruz: document.getElementById('cruz'), izq: document.getElementById('platillo-izq'), der: document.getElementById('platillo-der') };
    var lecturaG = document.getElementById('lectura-grados');
    var lecturaE = document.getElementById('lectura-estado');
    var AMPLITUD = 13;

    function nivel(p) {
      if (p >= 1) return 0;
      return AMPLITUD * Math.exp(-3.1 * p) * Math.cos(2 * Math.PI * 2.25 * p) * (1 - p);
    }
    var ultimoEstado = '';
    function pintar(p) {
      var g = nivel(p);
      colocar(b, g);
      lecturaG.textContent = grados(g);
      var estado = p >= 0.97 ? 'En equilibrio' : (p <= 0.02 ? 'Inclinada' : 'Oscilando');   /* rótulos cortos: la lectura no puede partir de línea */
      if (estado !== ultimoEstado) {
        ultimoEstado = estado;
        lecturaE.textContent = estado;
        seccion.classList.toggle('hero--nivelada', p >= 0.97);
      }
    }

    /* los soportes y las cadenas se trazan al entrar */
    document.addEventListener('cortina-abriendose', function () {
      setTimeout(function () { svg.classList.add('trazado'); }, movimiento ? 250 : 0);
    }, { once: true });

    if (!movimiento) {
      /* sin viaje: inclinada arriba del todo, nivelada en cuanto se baja */
      var revisar = function () { pintar(window.pageYOffset > seccion.offsetHeight * 0.3 ? 1 : 0); };
      window.addEventListener('scroll', revisar, { passive: true });
      revisar();
      return;
    }

    pintar(0);
    var texto = seccion.querySelector('.hero__texto');
    var entrada = ['.antetitulo', '.hero__entrada', '.hero__acciones', '.hero__nota'].map(function (s) { return texto.querySelector(s); });
    gsap.set(entrada, { opacity: 0, y: 24 });
    gsap.set(seccion.querySelector('.lectura'), { opacity: 0 });
    document.addEventListener('cortina-abriendose', function () {
      gsap.to(entrada, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.6 });
      gsap.to(seccion.querySelector('.lectura'), { opacity: 1, duration: 0.8, delay: 1 });
    }, { once: true });

    /* el scroll anima la posición del BLOQUE de texto; la entrada anima a sus
       hijos: nunca la misma propiedad en el mismo nodo */
    var estado = { p: 0 };
    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to(estado, { p: 1, duration: 1, onUpdate: function () { pintar(estado.p); } }, 0)
      .to(seccion.querySelector('.hero__desliza'), { opacity: 0, duration: 0.1 }, 0)
      .to(texto, { y: -28, duration: 1 }, 0);

    window.ScrollTrigger.create({
      trigger: seccion,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl
    });
  })();

  /* ───────────────── cinta infinita ───────────────── */
  (function cinta() {
    var pista = document.getElementById('cinta-pista');
    if (!pista) return;
    var grupo = pista.firstElementChild;
    var copias = Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1;
    for (var i = 0; i < copias; i++) {
      var c = grupo.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      pista.appendChild(c);
    }
    if (!movimiento) return;
    var x = 0, base = 0.55, extra = 0;
    if (lenis) lenis.on('scroll', function (e) { extra = Math.min(Math.abs(e.velocity || 0) * 0.35, 8); });
    /* rAF propio: ningún tween de GSAP toca esta propiedad, el -= no pisa nada */
    (function paso() {
      var ancho = grupo.offsetWidth;
      x -= base + extra;
      extra *= 0.92;
      if (ancho && x <= -ancho) x += ancho;
      pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(paso);
    })();
  })();

  /* ───────────────── filete: se traza al pasar ───────────────── */
  (function filetes() {
    if (!movimiento) return;
    Array.prototype.forEach.call(document.querySelectorAll('.filete'), function (f) {
      var lineas = f.querySelectorAll('.filete__linea');
      Array.prototype.forEach.call(lineas, function (p) {
        var l = Math.ceil(p.getTotalLength()) + 2;
        gsap.set(p, { strokeDasharray: l, strokeDashoffset: l });
        gsap.to(p, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 55%', scrub: 0.8 } });
      });
      var rombo = f.querySelector('.filete__rombo');
      gsap.fromTo(rombo, { rotation: -90, svgOrigin: '200 10' }, {
        rotation: 0, svgOrigin: '200 10', ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 55%', scrub: 0.8 }
      });
    });
  })();

  /* ───────────────── áreas: la pila y los tres pesos ───────────────── */
  (function areas() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.pila__item'));
    var lista = document.getElementById('pila');
    if (!items.length || !lista) return;
    var disparos = [];

    /* Todas miden lo que la más alta: la condición para que la pila no se
       deshaga por la última. Se mide el contenido, no la pantalla. */
    function igualar() {
      var tarjetas = items.map(function (it) { return it.querySelector('.tarjeta'); });
      lista.style.removeProperty('--alto-tarjeta');
      if (getComputedStyle(items[0]).position !== 'sticky') return;
      tarjetas.forEach(function (t) { t.style.height = 'auto'; });
      var alto = Math.max.apply(null, tarjetas.map(function (t) { return t.offsetHeight; }));
      tarjetas.forEach(function (t) { t.style.removeProperty('height'); });
      lista.style.setProperty('--alto-tarjeta', alto + 'px');
    }

    function montar() {
      igualar();
      if (!movimiento) return;
      disparos.forEach(function (d) { d.kill(); });
      disparos = [];
      items.forEach(function (it) {
        var t = it.querySelector('.tarjeta');
        gsap.set(t, { clearProps: 'transform' });
        t.style.removeProperty('--oscuro');
      });
      if (getComputedStyle(items[0]).position !== 'sticky') return;
      var arriba = Math.round(tope());
      items.forEach(function (it, i) {
        var siguiente = items[i + 1];
        if (!siguiente) return;
        var tarjeta = it.querySelector('.tarjeta');
        var tw = gsap.fromTo(tarjeta, { scale: 1, '--oscuro': 0 }, { scale: 0.93, '--oscuro': 0.3, ease: 'none', paused: true, immediateRender: false });
        disparos.push(window.ScrollTrigger.create({
          trigger: siguiente,
          start: 'top bottom',
          end: 'top ' + arriba + 'px',        /* acaba justo cuando la siguiente se posa */
          scrub: true,
          animation: tw
        }));
      });
    }

    montar();
    var temporizador;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { montar(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); revisar(); }, 220);
    });
    document.addEventListener('densidad-cambiada', function () {
      setTimeout(function () { montar(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); revisar(); }, 60);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { montar(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });

    /* ── la balanza pequeña: cada tarjeta posada deja caer su pesa ──
       fiscal (3) a la izquierda, laboral (5) a la derecha, contable (2) a la
       izquierda: 5 contra 5, equilibrio. El brazo llega con un muelle
       amortiguado, no con un tween: así rebota como una balanza de verdad. */
    var mini = {
      cruz: document.getElementById('cruz-mini'),
      izq: document.getElementById('mini-izq'),
      der: document.getElementById('mini-der')
    };
    if (!mini.cruz) return;
    var pesas = Array.prototype.slice.call(document.querySelectorAll('#balanza-mini .pesa'));
    var pasos = Array.prototype.slice.call(document.querySelectorAll('#reparto li'));
    var lecturaG = document.getElementById('mini-grados');
    var lecturaE = document.getElementById('mini-estado');
    var OBJETIVO = [0, -9, 6, 0];
    var ESTADOS = ['Sin pesos', 'Cae a la izquierda', 'Cae a la derecha', 'En equilibrio'];
    var n = -1, angulo = 0, velocidad = 0, objetivo = 0, corriendo = false, ultimo = 0, espera;

    function dibujar() {
      colocar(mini, angulo);
      lecturaG.textContent = grados(angulo, true);
    }
    function muelle(ahora) {
      var dt = Math.min(0.033, (ahora - ultimo) / 1000 || 0.016);
      ultimo = ahora;
      velocidad += (-38 * (angulo - objetivo) - 4.2 * velocidad) * dt;
      angulo += velocidad * dt;
      dibujar();
      if (Math.abs(angulo - objetivo) < 0.01 && Math.abs(velocidad) < 0.01) {
        angulo = objetivo; dibujar(); corriendo = false; return;
      }
      requestAnimationFrame(muelle);
    }
    function ponerN(nuevo) {
      if (nuevo === n) return;
      n = nuevo;
      pesas.forEach(function (p) { p.classList.toggle('puesta', Number(p.dataset.pesa) <= n); });
      pasos.forEach(function (li) { li.classList.toggle('activo', Number(li.dataset.paso) <= n); });
      lecturaE.textContent = ESTADOS[n];
      clearTimeout(espera);
      if (reduce) { objetivo = angulo = OBJETIVO[n]; velocidad = 0; dibujar(); return; }
      /* el brazo se mueve cuando la pesa toca el platillo, no antes */
      espera = setTimeout(function () {
        objetivo = OBJETIVO[n];
        if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(muelle); }
      }, 360);
    }
    function revisar() {
      var pegada = getComputedStyle(items[0]).position === 'sticky';
      var umbral = pegada ? tope() + 2 : window.innerHeight * 0.55;
      ponerN(items.filter(function (li) { return li.getBoundingClientRect().top <= umbral; }).length);
    }
    dibujar();
    window.addEventListener('scroll', revisar, { passive: true });
    if (lenis) lenis.on('scroll', revisar);
    revisar();
  })();

  /* ───────────────── contadores ───────────────── */
  (function contadores() {
    var nodos = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
    function formatear(v, el) {
      var dec = parseInt(el.dataset.decimales || '0', 10);
      return dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toString();
    }
    if (movimiento) nodos.forEach(function (el) { el.textContent = formatear(0, el); });
    cuandoVisible(nodos, 0.5, function (el) {
      var fin = parseFloat(el.dataset.contador);
      if (!movimiento) { el.textContent = formatear(fin, el); return; }
      var estado = { v: 0 };
      gsap.to(estado, {
        v: fin, duration: 1.6, ease: 'power2.out',
        onUpdate: function () { el.textContent = formatear(estado.v, el); },
        onComplete: function () { el.textContent = formatear(fin, el); }
      });
    });
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    Array.prototype.forEach.call(document.querySelectorAll('.iman'), function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.3);
        aY((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var c = document.createElement('div');
    var p = document.createElement('div');
    c.className = 'cursor';
    p.className = 'cursor-punto';
    [c, p].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(c, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(c, 'y', { duration: 0.28, ease: 'power3.out' });

    function mostrar(si) {
      c.classList.toggle('cursor--vivo', si);
      p.classList.toggle('cursor--vivo', si);
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!c.classList.contains('cursor--vivo')) {
        gsap.set(c, { x: e.clientX, y: e.clientY });
        html.classList.add('con-cursor');        /* el del sistema se oculta cuando el propio ya se ve */
        mostrar(true);
      }
      gsap.set(p, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
    document.addEventListener('pointerover', function (e) {
      var sobre = !!e.target.closest('a, button, .map-consent');
      c.classList.toggle('cursor--activo', sobre);
      p.classList.toggle('cursor-punto--activo', sobre);
    });
  })();

  /* ───────────────── cabecera ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');

  (function cabeceraFija() {
    if (!cabecera) return;
    function actualizar() { cabecera.classList.toggle('cabecera--fija', window.pageYOffset > 8); }
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  })();

  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── mapa solo bajo clic ───────────────── */
  (function mapa() {
    var btn = document.getElementById('mapa-boton');
    var caja = document.getElementById('mapa-consentimiento');
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = 'https://www.google.com/maps?q=' +
        encodeURIComponent('Calle Regino de Miguel 9, 06005 Badajoz') + '&output=embed';
      marco.loading = 'lazy';
      marco.title = 'Mapa: despacho en la calle Regino de Miguel, 9, Badajoz';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    if (!caja || !ok) return;
    var guardado = null;
    try { guardado = localStorage.getItem('botejara-cookies'); } catch (e) {}
    if (guardado !== 'ok') {
      caja.hidden = false;
      document.body.classList.add('cookies-visibles');
    }
    ok.addEventListener('click', function () {
      caja.hidden = true;                     /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.remove('cookies-visibles');
      try { localStorage.setItem('botejara-cookies', 'ok'); } catch (e) {}
    });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* las medidas cambian cuando llega Libre Caslon: recalcular anclajes */
  if (gsapReady && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> del HTML y la parte de densidad del <head>.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;
    var botones = Array.prototype.slice.call(mando.querySelectorAll('[data-densidad]'));

    function aplicar(d) {
      html.classList.remove('densidad-fiel', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('botejara-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
    }
    var actual = html.classList.contains('densidad-sobria') ? 'sobria' : 'fiel';
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */

})();
