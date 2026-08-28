/* ==========================================================================
   Càpsules Avançades de Matemàtiques — helpers de canvas compartits
   Extret des del primer dia (a diferència del projecte CalcMat original,
   on cada càpsula redeclarava aquests helpers i un bug de roundRect es
   va haver de corregir còpia per còpia — vegeu prompt.md secció 2/7).
   Ús: <script src="../assets/canvas-helpers.js"></script> abans del
   <script> propi de cada càpsula.
   ========================================================================== */

function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2)); // mai més gran que la meitat del costat curt
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.4; ctx.stroke(); }
}

function txt(ctx, str, x, y, size, color, align, weight, font) {
  ctx.font = `${weight || 600} ${size}px '${font || 'Inter'}', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Format numèric en català: coma decimal, mai punt.
function fmtNum(n, decimals) {
  return n.toFixed(decimals == null ? 2 : decimals).replace('.', ',');
}

function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Ressalt en clicar una targeta de referència / element .flash-target.
function flash(el, color) {
  if (color) el.style.setProperty('--flash-color', color);
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}

// Coordenades del punter (ratolí o tàctil) en píxels de dispositiu del canvas.
function pointerXY(evt, canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const src = (evt.touches && evt.touches[0]) || (evt.changedTouches && evt.changedTouches[0]) || evt;
  return {
    x: (src.clientX - rect.left) * (canvas.width / rect.width || dpr),
    y: (src.clientY - rect.top) * (canvas.height / rect.height || dpr)
  };
}

// Factory de resize conscient del DPR: canvas.width/height sempre en píxels de
// dispositiu; drawFn() treballa en aquestes coordenades, mai en píxels CSS.
function setupCanvasResize(canvas, wrap, drawFn) {
  function resize() {
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    drawFn();
  }
  window.addEventListener('resize', resize);
  return resize;
}
