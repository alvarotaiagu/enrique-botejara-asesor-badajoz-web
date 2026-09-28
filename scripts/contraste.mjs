/* Contraste de cada pareja texto/fondo del sitio, calculado (no a ojo).
   node scripts/contraste.mjs */
const hex = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255);
const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const pizarra = '#2E3338', honda = '#23272B', papel = '#F6F1E7', crema = '#EFE8DA';
const parejas = [
  ['crema sobre pizarra', crema, pizarra, 4.5],
  ['crema-apagada sobre pizarra', '#BDB6A8', pizarra, 4.5],
  ['crema-apagada sobre pizarra honda', '#BDB6A8', honda, 4.5],
  ['latón claro (texto) sobre pizarra', '#D6B87D', pizarra, 4.5],
  ['latón claro (texto) sobre pizarra honda', '#D6B87D', honda, 4.5],
  ['latón base sobre pizarra (solo trazo/grande)', '#B08D4F', pizarra, 3],
  ['tinta sobre papel', pizarra, papel, 4.5],
  ['tinta suave sobre papel', '#585A57', papel, 4.5],
  ['tinta suave sobre tarjeta 3', '#585A57', '#EEE6D5', 4.5],
  ['latón oscuro (texto) sobre papel', '#74592B', papel, 4.5],
  ['latón oscuro (texto) sobre tarjeta 3', '#74592B', '#EEE6D5', 4.5],
  ['pizarra honda sobre latón claro (botón)', honda, '#D6B87D', 4.5],
  ['pizarra honda sobre latón (cinta, rótulo grande)', honda, '#B08D4F', 3],
  ['pendiente sobre pizarra', '#F2D79F', pizarra, 4.5],
  ['pendiente en tarjeta', '#7A3F12', '#EEE6D5', 4.5],
  ['cortina: gris del pie sobre papel', '#5E5A50', papel, 4.5],
  ['crema sobre botón de cookies', crema, pizarra, 4.5]
];
let malas = 0;
for (const [n, t, f, min] of parejas) {
  const r = ratio(t, f);
  const ok = r >= min;
  if (!ok) malas++;
  console.log((ok ? 'OK   ' : 'FALLA') + '  ' + r.toFixed(2).padStart(5) + ' ≥ ' + min + '  ' + n);
}
if (malas) process.exitCode = 1;
