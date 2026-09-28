# Enrique Botejara · Asesor en Badajoz

Web de una página para **Enrique Botejara**, asesor fiscal, laboral y contable con despacho en la calle Regino de Miguel, 9, Badajoz. Negocio real.

> **Estado: maqueta de presentación. Todavía no se puede publicar como web del cliente.**
> Todas las páginas llevan `noindex, nofollow`. Lleva un mando de revisión interno que se borra antes de entregar y varios datos marcados como `[PENDIENTE]`. **El nombre está sin confirmar** (ver abajo).

## Concepto: «Fiel»

El fiel es la aguja de la balanza que marca cuándo está nivelada. La idea es el equilibrio y la confianza, no los números: nada de gráficos, calculadoras ni tablas de impuestos.

- **Cortina**: sobre papel crema se dibuja el cuadrante, el brazo y el fiel. El brazo **oscila y se va parando** mientras la lectura baja de 11° a 0,0°. Cuando el fiel llega a la marca, la línea del brazo se alarga hasta los bordes y la página **se abre por esa línea**: la mitad de arriba sube y la de abajo baja, las dos con el borde curvo.
- **Hero anclado**: una balanza de latón grabada a trazo fino (peana, columna estriada, lira, cuadrante, platillos con papeles y monedas). Entra **inclinada 13°**. Al bajar oscila y **queda nivelada al final del hero**, y la lectura pasa de «Inclinada» a «En equilibrio». Las cadenas y los soportes se dibujan al entrar.
- **Las tres áreas**: una pila de tres tarjetas (fiscal, laboral y contable), cada una con su pesa de latón. Al lado hay una balanza pequeña: cada tarjeta que se posa **deja caer su pesa** en un platillo (fiscal a la izquierda, laboral a la derecha, contable a la izquierda). El brazo rebota con un muelle amortiguado y con las tres pesas queda en equilibrio.
- **Opinión**: la reseña real, entera, con un sello grabado y un contador que sube hasta 5,0. No se insiste en que es la única (petición del cliente): sin contador de reseñas en hero, ficha ni sello.
- Además: cinta con la velocidad ligada al scroll, titulares que entran por letras y por palabras, botones magnéticos, cursor propio (punto más aro), Lenis y un filete que se traza al pasar.

**Paleta**: pizarra `#2E3338` como base, latón viejo `#B08D4F` como acento y crema `#EFE8DA` / papel `#F6F1E7`. El latón base se queda en trazos y rótulos grandes porque como texto pequeño solo llega a 4,1:1. Para texto hay dos tokens derivados: `--laton-claro` sobre pizarra (6,7:1) y `--laton-oscuro` sobre papel (5,8:1). Todo está calculado con `scripts/contraste.mjs`.
**Tipografías**: Libre Caslon Display y Libre Caslon Text para los titulares, con aire de despacho o notaría, y Public Sans para el texto. No las usa ninguna otra web de la carpeta.

**Diferencias con la biblioteca**: «Balance» (Dourado & Fernández) es un libro mayor, no una balanza física. La oscilación amortiguada de la cortina recuerda al péndulo de Postural (podología), pero aquí gira un brazo alrededor de un eje, no cuelga un peso. Se construyó así porque lo pedía el brief.

## Fuentes y fecha de cada dato (consultado el 28-09-2026)

| Dato | Fuente |
|---|---|
| Dirección «C. Regino de Miguel, 9, Bajo Dcha, 06005 Badajoz», teléfono 924 25 94 61, 5,0 ★ con 1 reseña, reseña de Francisco González Gómez, «Abierto ahora» sin franjas | Brief del cliente (ficha de Google) |
| Nombre «Enrique Botejara» | Directorio gestorias.es («Asesoria Enrique Botejara»), **pero con otra dirección: «Regino de Miguel, 9, 1º Dcha, 06001»** |
| Pin del mapa | Comprobado: Google sitúa «Calle Regino de Miguel 9, 06005 Badajoz» en la calle correcta |

Una búsqueda del teléfono devolvió resultados sin relación con el despacho (una estación de autobuses). No se ha usado.

## Datos pendientes de confirmar con el cliente

- [ ] **Nombre**. Viene de un directorio que da otra planta (1º Dcha en vez de Bajo Dcha) y otro código postal (06001 en vez de 06005). Confirmar el nombre, y si hubo un cambio de local, cuál es la dirección buena.
- [ ] **Logo**: no había ninguno. El monograma «EB» (letras de Libre Caslon Display pasadas a trazados, colgando de una balanza) está hecho para esta web. Está suelto en `assets/monograma.svg`, `assets/logo-botejara.svg` (sobre claro) y `assets/logo-botejara-claro.svg` (sobre oscuro).
- [ ] **Horario completo**. Google solo dice «Abierto ahora».
- [ ] **Trámites concretos** de cada área. Las listas «Lo habitual en esta área» (renta, IVA, nóminas, cuentas anuales…) son lo típico de cada área y van marcadas como pendientes. Borrar lo que no haga.
- [ ] **Correo** de contacto (no tiene web propia).
- [ ] **NIF, nombre completo y colegiación** para el aviso legal. No se afirma ninguna colegiación, premio ni antigüedad. La reseña dice «muchos años de experiencia», pero es una cita y no la repite la web.
- [ ] Permiso para citar la reseña con nombre.

## Decisiones tomadas

- El titular del hero dice **«Su situación fiscal, en equilibrio.»** y no «tu»: toda la web trata de usted, como corresponde a un despacho.
- En `schema.org` va `AccountingService` **sin `aggregateRating`**. Con una sola reseña no aporta y Google no muestra valoraciones propias de negocios locales.
- Solo hay mando de densidad, no de paleta. Si se quiere probar otro color en la reunión, se añade con el mismo mecanismo.

## Estructura

```
index.html          cortina, hero, cinta, [ficha: solo sobria], áreas, opinión, contacto
404.html            «Aquí no hay nada que pesar.» Rutas absolutas bajo /enrique-botejara-asesor-badajoz-web/
aviso-legal.html    borrador con pendientes
privacidad.html     borrador; lista lo que se guarda en localStorage
css/estilos.css
js/main.js          GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.13, desde jsDelivr (cdnjs ya no sirve Lenis)
assets/             monograma, logo en dos versiones, favicon, og-botejara.jpg (1200×630)
scripts/            servir.mjs, verificar.mjs, contraste.mjs, comprobar-borrado.mjs
```

No hay ningún canvas: todo es SVG por atributo, así que no hay desenfoques ni sombras animados.

## Revisar en local

```
node scripts/servir.mjs              # http://127.0.0.1:4192
node scripts/verificar.mjs           # 63 comprobaciones con Playwright
node scripts/verificar.mjs --capturas
node scripts/contraste.mjs
```

`verificar.mjs` sirve el sitio bajo el prefijo del repo y comprueba:

- **Cortina**: oscila, el fiel llega a la marca, se abre por la costura y acaba en `display:none`. Guarda fotogramas intermedios.
- **Hero**: entra inclinado, oscila y queda nivelado; los platillos cuelgan de sus ganchos. Texto y balanza no se pisan a 360×640, 375×667, 390×844, 768×1024 ni 1280×720.
- **Pila**: prueba en página limpia que ninguna tarjeta se suelta antes de tiempo, que nada asoma por debajo de la última, que salen en bloque y que no queda un hueco grande después.
- **Balanza pequeña**: pesas y lectura en cada paso.
- **Cursor**: el del sistema queda oculto y el aro se rellena sobre los botones.
- **Cookies, mapa y mando**: el aviso de cookies cierra de verdad, el mapa solo existe tras el clic y el mando no aparece sin `?revision`.
- **Densidades**: las dos funcionan.
- **Menú móvil**: con la cabecera fija ocupa 100dvh con desenfoque.
- **Sin GSAP y con movimiento reducido**: la cortina se retira, la lectura cambia, las pesas caen y el contador llega a su cifra.
- **404 y legales**: el 404 sale a otra profundidad y las páginas legales no tienen errores.

## Quitar el mando de maqueta antes de entregar

El mando **solo aparece si la URL lleva `?revision`**. El enlace que se manda al cliente, sin el parámetro, sale limpio, y sin `?revision` tampoco se aplica una densidad guardada.

Tiene dos densidades:

- **Fiel**: la balanza en todas partes (hero, balanza pequeña con pesas que caen, pesas grabadas en las tarjetas, sello grabado y filetes).
- **Sobria**: la balanza solo donde significa algo, que es la cortina y el hero. Las pesas se cambian por numerales romanos grandes y las tres áreas se ven a la vez en columnas. A cambio entra **la ficha del despacho** en datos (áreas, dirección, teléfono, horario y valoración), que la Fiel no tiene.

Pasos para borrarlo. Se comprobaron aplicándolos a una copia y pasando el script:

1. `index.html`:
   - En el `<script>` del `<head>`, borrar desde `/* la densidad guardada solo cuenta…` hasta el `} catch (e) {}` del final, y la línea `[MANDO DE MAQUETA]` de su comentario. **La red de seguridad de la cortina (`setTimeout` de 8 s) se queda.**
   - Borrar el `<div class="mando">` del final con su comentario.
   - Borrar la `<section class="ficha">`.
   - Quitar `densidad-fiel` de la clase del `<html>`.
   - Si el cliente elige la sobria, antes de borrar hay que pasar sus reglas a CSS normal.
2. `css/estilos.css`:
   - Borrar todo lo que hay entre `[MANDO DE MAQUETA]` y `fin del bloque [MANDO DE MAQUETA]`.
   - Borrar **también** las líneas `.densidad-sobria …` sueltas dentro de los `@media` de 1100, 900 y 560 px.
3. `js/main.js`: borrar la función `mandoMaqueta()` entre los mismos comentarios y la escucha de `densidad-cambiada` dentro de `areas()`.
4. `privacidad.html`: borrar la fila `botejara-densidad`.
5. Pasar `node scripts/comprobar-borrado.mjs`, que falla si queda algún rastro.

## Antes de publicar como web del cliente

- [ ] Resolver los pendientes de arriba, empezando por el nombre.
- [ ] Borrar el mando y pasar `comprobar-borrado.mjs`.
- [ ] Quitar el `noindex` de las cuatro páginas.
