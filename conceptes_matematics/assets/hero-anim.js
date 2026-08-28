/* ==========================================================================
   Càpsules Avançades de Matemàtiques — animació hero compartida (canvas 2D)
   initHeroAnim(canvas, {size}) es crida a index.html (size gran) i al nav
   de cada pàgina (size petit, ~34px) perquè la mateixa animació es vegi
   en miniatura arreu.

   Concepte: "traç d'una corba" — sobre un fons de paper clar (com un
   quadern), una figura matemàtica es dibuixa traç a traç com si algú la
   tracés a mà. Vuit figures en total, dues per bloc temàtic i en el seu
   color (espiral de primers + patró modular / permutació + triangle de
   Pascal / polígon inscrit + banda de Möbius / àrea sota una corba +
   camp de pendents). L'ordre comença en una figura aleatòria a cada
   càrrega de pàgina. En acabar-se de dibuixar cadascuna es manté un
   moment, s'esvaeix, i comença la següent del cicle.
   ========================================================================== */

function initHeroAnim(canvas, opts) {
  const size = (opts && opts.size) || 340;
  const dpr = window.devicePixelRatio || 1;

  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  // La mida visible la controla el CSS; aquí només fixem la resolució interna.

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const u  = W / 340; // factor d'escala relatiu al disseny de referència (340px @1x)
  const R  = W * 0.38; // el text ja no viu dins el cercle, així que la figura n'aprofita més espai

  const ink = (a) => `rgba(27,30,45,${a})`;

  // El nom de la figura es mostra fora del cercle (captionEl, un <p> extern),
  // mai retallat pel border-radius:50% del canvas, i es va escrivint
  // progressivament d'esquerra a dreta a mesura que es traça la figura
  // (vegeu updateCaption(), més avall, a prop de FIGURES/DRAW_FRAMES).
  const captionEl = opts && opts.captionEl;

  function isPrime(n) {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }

  /* ── FIGURA 1: espiral de nombres primers (Aritmètica i Teoria de Nombres) ── */
  function drawPrimeSpiral(t, outerAlpha) {
    const turns = 3.1, N = 46;
    const maxTheta = turns * Math.PI * 2;
    const pathPts = 220;
    ctx.beginPath();
    const upTo = Math.floor(pathPts * Math.min(1, t));
    for (let i = 0; i <= upTo; i++) {
      const theta = (i / pathPts) * maxTheta;
      const r = (theta / maxTheta) * R;
      const x = cx + Math.cos(theta) * r, y = cy + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ink(outerAlpha * 0.4);
    ctx.lineWidth = 1.4 * u;
    ctx.stroke();

    for (let n = 1; n <= N; n++) {
      const revealFrac = n / N;
      if (revealFrac > t) break;
      const theta = revealFrac * maxTheta;
      const r = revealFrac * R;
      const x = cx + Math.cos(theta) * r, y = cy + Math.sin(theta) * r;
      // el darrer punt sempre es marca (encara que N no sigui primer), perquè
      // l'espiral acabi amb un punt clarament visible i no s'apagui de sobte.
      const highlight = isPrime(n) || n === N;
      ctx.beginPath();
      ctx.arc(x, y, (highlight ? 4 : 2) * u, 0, Math.PI * 2);
      ctx.fillStyle = highlight ? this.color : ink(outerAlpha * 0.3);
      ctx.globalAlpha = outerAlpha * (highlight ? 1 : 0.85);
      ctx.fill();
    }
    ctx.globalAlpha = outerAlpha;
  }

  /* ── FIGURA 1b: patró de multiplicació mòdul N (Aritmètica i Teoria de Nombres) ── */
  function drawModPattern(t, outerAlpha) {
    const N = 36, mult = 7;
    const rad = R * 0.85;
    ctx.globalAlpha = outerAlpha * 0.55;
    ctx.fillStyle = ink(1);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
      ctx.beginPath(); ctx.arc(x, y, 1.6 * u, 0, Math.PI * 2); ctx.fill();
    }
    const upTo = Math.floor(N * Math.min(1, t));
    ctx.beginPath();
    for (let k = 0; k < upTo; k++) {
      const a1 = (k / N) * Math.PI * 2 - Math.PI / 2;
      const a2 = (((k * mult) % N) / N) * Math.PI * 2 - Math.PI / 2;
      ctx.moveTo(cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad);
      ctx.lineTo(cx + Math.cos(a2) * rad, cy + Math.sin(a2) * rad);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.1 * u;
    ctx.globalAlpha = outerAlpha * 0.8;
    ctx.stroke();
  }

  /* ── FIGURA 2: diagrama de permutació (Àlgebra i Combinatòria) ── */
  function drawPermutation(t, outerAlpha) {
    const perm = [3, 5, 1, 4, 2];
    const n = perm.length;
    const spread = R * 1.55;
    const topY = cy - R * 0.55, botY = cy + R * 0.55;
    const xs = (i) => cx - spread / 2 + (spread * i) / (n - 1);

    ctx.globalAlpha = outerAlpha * 0.55;
    ctx.fillStyle = ink(1);
    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.arc(xs(i), topY, 2.6 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(xs(i), botY, 2.6 * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = outerAlpha;

    for (let i = 0; i < n; i++) {
      const segStart = i / n, segEnd = (i + 1) / n;
      if (t <= segStart) break;
      const localT = Math.min(1, (t - segStart) / (segEnd - segStart));
      const x1 = xs(i), y1 = topY, x2 = xs(perm[i] - 1), y2 = botY;
      const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2 - R * 0.1;
      ctx.beginPath();
      const STEPS = 16;
      for (let s = 0; s <= STEPS; s++) {
        const tt = (s / STEPS) * localT;
        const xx = (1 - tt) * (1 - tt) * x1 + 2 * (1 - tt) * tt * midX + tt * tt * x2;
        const yy = (1 - tt) * (1 - tt) * y1 + 2 * (1 - tt) * tt * midY + tt * tt * y2;
        if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.1 * u;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  /* ── FIGURA 2b: triangle de Pascal (Àlgebra i Combinatòria) ── */
  function drawPascal(t, outerAlpha) {
    const rows = 7;
    const spacingY = (R * 1.5) / rows;
    const spacingX = R * 0.26;
    const topY = cy - R * 0.7;
    const totalDots = (rows * (rows + 1)) / 2;
    const upTo = Math.floor(totalDots * Math.min(1, t));
    let count = 0;
    outer:
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i <= r; i++) {
        if (count >= upTo) break outer;
        const x = cx + (i - r / 2) * spacingX;
        const y = topY + r * spacingY;
        if (r > 0) {
          const yPrev = topY + (r - 1) * spacingY;
          ctx.strokeStyle = ink(outerAlpha * 0.22);
          ctx.lineWidth = 1 * u;
          ctx.globalAlpha = outerAlpha;
          if (i - 1 >= 0) {
            const xP = cx + (i - 1 - (r - 1) / 2) * spacingX;
            ctx.beginPath(); ctx.moveTo(xP, yPrev); ctx.lineTo(x, y); ctx.stroke();
          }
          if (i <= r - 1) {
            const xP = cx + (i - (r - 1) / 2) * spacingX;
            ctx.beginPath(); ctx.moveTo(xP, yPrev); ctx.lineTo(x, y); ctx.stroke();
          }
        }
        ctx.beginPath(); ctx.arc(x, y, 2.4 * u, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = outerAlpha;
        ctx.fill();
        count++;
      }
    }
  }

  /* ── FIGURA 3: polígon inscrit en un cercle (Geometria i Topologia) ── */
  function drawInscribedPolygon(t, outerAlpha) {
    const circleT = Math.min(1, t / 0.32);
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.85, -Math.PI / 2, -Math.PI / 2 + circleT * Math.PI * 2);
    ctx.strokeStyle = ink(outerAlpha * 0.4);
    ctx.lineWidth = 1.3 * u;
    ctx.stroke();
    if (t <= 0.32) return;

    const polyT = (t - 0.32) / 0.68;
    const sides = 6;
    const verts = [];
    for (let i = 0; i <= sides; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / sides);
      verts.push({ x: cx + Math.cos(a) * R * 0.85, y: cy + Math.sin(a) * R * 0.85 });
    }
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const segStart = i / sides, segEnd = (i + 1) / sides;
      if (polyT <= segStart) break;
      const localT = Math.min(1, (polyT - segStart) / (segEnd - segStart));
      const p1 = verts[i], p2 = verts[i + 1];
      const x = p1.x + (p2.x - p1.x) * localT, y = p1.y + (p2.y - p1.y) * localT;
      if (i === 0) ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(x, y);
      // >= 0.999 en lloc de >= 1: la divisió (polyT-segStart)/(segEnd-segStart)
      // sovint arrodoneix a 0.9999999999999993 en lloc d'1 exacte, i amb ">= 1"
      // el punt de tancament del polígon no es dibuixava mai.
      if (localT >= 0.999) {
        ctx.save();
        ctx.globalAlpha = outerAlpha;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 3 * u, 0, Math.PI * 2);
        ctx.fillStyle = this.color; ctx.fill();
        ctx.restore();
      }
    }
    ctx.globalAlpha = outerAlpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.2 * u;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /* ── FIGURA 3b: banda de Möbius (Geometria i Topologia) ── */
  function drawMobius(t, outerAlpha) {
    const STEPS = 200;
    const upTo = Math.floor(STEPS * Math.min(1, t));
    ctx.beginPath();
    for (let i = 0; i <= upTo; i++) {
      const theta = (i / STEPS) * Math.PI * 2;
      const denom = 1 + Math.sin(theta) * Math.sin(theta);
      const x = cx + (R * 0.95 * Math.cos(theta)) / denom;
      const y = cy + (R * 0.6 * Math.sin(theta) * Math.cos(theta)) / denom;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.2 * u;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = outerAlpha;
    ctx.stroke();
    if (t > 0.02) {
      ctx.beginPath(); ctx.arc(cx, cy, 3 * u, 0, Math.PI * 2);
      ctx.fillStyle = ink(outerAlpha * 0.5);
      ctx.fill();
    }
  }

  /* ── FIGURA 4: àrea sota una corba (Càlcul i Anàlisi Matemàtica) ── */
  function drawIntegralArea(t, outerAlpha) {
    const axisY = cy + R * 0.55;
    const xStart = cx - R * 0.9, xEnd = cx + R * 0.9;
    ctx.beginPath();
    ctx.moveTo(xStart, axisY); ctx.lineTo(xEnd, axisY);
    ctx.strokeStyle = ink(outerAlpha * 0.4);
    ctx.lineWidth = 1.3 * u;
    ctx.stroke();

    const N = 48;
    const upTo = Math.floor(N * Math.min(1, t));
    const fn = (uu) => Math.sin(uu * Math.PI) * R * 0.5;

    ctx.globalAlpha = outerAlpha * 0.22;
    ctx.fillStyle = this.color;
    for (let i = 0; i < upTo; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const x0 = xStart + u0 * (xEnd - xStart);
      const w = (xEnd - xStart) / N;
      const h = fn((u0 + u1) / 2);
      ctx.fillRect(x0, axisY - h, w + 0.6, h);
    }

    ctx.globalAlpha = outerAlpha;
    ctx.beginPath();
    for (let i = 0; i <= upTo; i++) {
      const uu = i / N;
      const x = xStart + uu * (xEnd - xStart);
      const y = axisY - fn(uu);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.2 * u;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* ── FIGURA 4b: camp de pendents (Càlcul i Anàlisi Matemàtica) ── */
  function drawSlopeField(t, outerAlpha) {
    const cols = 5, rows = 5;
    const spacing = (R * 1.7) / (cols - 1);
    const startX = cx - R * 0.85, startY = cy - R * 0.85;
    const total = cols * rows;
    const upTo = Math.floor(total * Math.min(1, t));
    let count = 0;
    outer:
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (count >= upTo) break outer;
        const x = startX + i * spacing, y = startY + j * spacing;
        const angle = Math.atan2(y - cy, x - cx) + Math.PI / 2;
        const len = R * 0.16;
        const x1 = x - Math.cos(angle) * len / 2, y1 = y - Math.sin(angle) * len / 2;
        const x2 = x + Math.cos(angle) * len / 2, y2 = y + Math.sin(angle) * len / 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.8 * u;
        ctx.lineCap = 'round';
        ctx.globalAlpha = outerAlpha * 0.85;
        ctx.stroke();
        count++;
      }
    }
  }

  const FIGURES = [
    { color: '#0b7b86', label: 'Espiral de nombres primers',      draw: drawPrimeSpiral },
    { color: '#0b7b86', label: 'Patró de multiplicació mòdul n',  draw: drawModPattern },
    { color: '#5c3aa8', label: 'Diagrama de permutació',          draw: drawPermutation },
    { color: '#5c3aa8', label: 'Triangle de Pascal',               draw: drawPascal },
    { color: '#1a7a52', label: 'Polígon inscrit',                  draw: drawInscribedPolygon },
    { color: '#1a7a52', label: 'Banda de Möbius',                  draw: drawMobius },
    { color: '#a02545', label: 'Àrea sota la corba',               draw: drawIntegralArea },
    { color: '#a02545', label: 'Camp de pendents',                 draw: drawSlopeField },
  ];

  const DRAW_FRAMES = 120, HOLD_FRAMES = 63, ERASE_FRAMES = 25;
  const TYPE_FRAMES = Math.round(DRAW_FRAMES * 0.6); // el text acaba d'escriure's abans que la figura, per poder-lo llegir mentre es traça
  // Comença per una figura aleatòria perquè no sigui sempre la mateixa en carregar la pàgina.
  let figIdx = Math.floor(Math.random() * FIGURES.length), phase = 'draw', phaseFrame = 0;
  let raf = null;

  function updateCaption() {
    if (!captionEl) return;
    const fig = FIGURES[figIdx];
    captionEl.style.color = fig.color;
    if (phase === 'draw') {
      const chars = Math.min(fig.label.length, Math.floor((phaseFrame / TYPE_FRAMES) * fig.label.length));
      const cursor = (chars < fig.label.length && Math.floor(phaseFrame / 8) % 2 === 0) ? '▏' : '';
      captionEl.textContent = fig.label.slice(0, chars) + cursor;
      captionEl.style.opacity = 1;
    } else if (phase === 'hold') {
      captionEl.textContent = fig.label;
      captionEl.style.opacity = 1;
    } else if (phase === 'erase') {
      captionEl.textContent = fig.label;
      captionEl.style.opacity = String(1 - phaseFrame / ERASE_FRAMES);
    }
  }

  function drawGridPaper() {
    const step = 28 * u;
    ctx.strokeStyle = ink(0.045);
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function advancePhase() {
    phaseFrame++;
    if (phase === 'draw') { if (phaseFrame >= DRAW_FRAMES) { phase = 'hold'; phaseFrame = 0; } }
    else if (phase === 'hold') { if (phaseFrame >= HOLD_FRAMES) { phase = 'erase'; phaseFrame = 0; } }
    else if (phase === 'erase') {
      if (phaseFrame >= ERASE_FRAMES) {
        figIdx = (figIdx + 1) % FIGURES.length;
        phase = 'draw'; phaseFrame = 0;
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawGridPaper();

    const fig = FIGURES[figIdx];
    const progress = phase === 'draw' ? phaseFrame / DRAW_FRAMES : 1;
    const alpha = phase === 'erase' ? 1 - phaseFrame / ERASE_FRAMES : 1;

    ctx.save();
    fig.draw.call(fig, progress, alpha);
    ctx.restore();

    updateCaption();
    advancePhase();
    raf = requestAnimationFrame(frame);
  }

  frame();
  return { stop: () => raf && cancelAnimationFrame(raf) };
}
