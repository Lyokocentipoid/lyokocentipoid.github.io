/* ==========================================================================
   CalcMat 1r ESO — animació hero compartida (canvas 2D)
   initHeroAnim(canvas, {size}) es crida a index.html (size gran) i al nav
   de cada capsules/*.html (size petit, ~34px) perquè la mateixa animació
   es vegi en miniatura a totes les càpsules.

   Concepte: una seqüència d'expressions aritmètiques curtes es va
   "escrivint" i resolent, com una pantalla de calculadora — inequívocament
   "càlcul", no formes geomètriques decoratives.
   ========================================================================== */

function initHeroAnim(canvas, opts) {
  const size = (opts && opts.size) || 340;
  const dpr = window.devicePixelRatio || 1;

  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  // La mida visible la controla el CSS (responsive: .hero-canvas / .nav-hero-mini);
  // aquí només fixem la resolució interna del canvas perquè es vegi nítid.

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const u  = W / 340; // factor d'escala relatiu al disseny de referència (340px @1x)

  const ACCENTS = ['#0b93a0', '#e2860a', '#e6483a', '#1fa971', '#8452d6']; // petrol, amber, terracotta, sage, plum
  const QUESTION_COLOR = '#dfe6fb';
  const CURSOR_COLOR   = 'rgba(223,230,251,0.55)';
  const DECO_COLOR     = 'rgba(223,230,251,0.22)';
  const GRID_COLOR     = 'rgba(255,255,255,0.045)';

  const EXPR = [
    ['7 × 8', '56'],
    ['15 − 9', '6'],
    ['√81', '9'],
    ['2³', '8'],
    ['144 ÷ 12', '12'],
    ['9 + 16', '25'],
    ['6²', '36'],
    ['100 ÷ 4', '25'],
    ['3 × 3 × 3', '27'],
    ['13 + 8', '21'],
    ['5² − 1', '24'],
    ['½ + ¼', '¾']
  ];

  const FRAMES_PER_CHAR = 3;
  const SOLVE_PULSE_FRAMES = 16;
  const HOLD_FRAMES = 58;
  const DISSOLVE_FRAMES = 20;

  let exprIdx = 0;
  let phase = 'type-q'; // type-q -> solve-pulse -> type-a -> hold -> dissolve
  let phaseFrame = 0;
  let qChars = 0, aChars = 0;
  let cachedFontSize = 0;

  let t = 0; // temps continu per als elements decoratius (radians)
  let raf = null;

  // ── decoratius: xifres/operadors orbitant, molt discrets ──
  const DECO_GLYPHS = ['0','1','2','3','4','5','6','7','8','9','+','−','×','÷'];
  const deco = [];
  for (let i = 0; i < 7; i++) {
    deco.push({
      glyph: DECO_GLYPHS[Math.floor(Math.random() * DECO_GLYPHS.length)],
      angle0: (i / 7) * Math.PI * 2,
      speed: 0.12 + Math.random() * 0.1,
      radius: (0.62 + Math.random() * 0.3),
      size: 0.055 + Math.random() * 0.03
    });
  }

  function drawGrid() {
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    const step = 34 * u;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  }

  function drawDecoLayer() {
    deco.forEach(d => {
      const a = d.angle0 + t * d.speed;
      const r = W * 0.5 * d.radius;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.94;
      ctx.font = `600 ${Math.max(7, W * d.size)}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = DECO_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.glyph, x, y);
    });
  }

  function currentExpr() { return EXPR[exprIdx]; }

  function fullString(withCursor) {
    const [q, a] = currentExpr();
    const qPart = q.slice(0, qChars);
    if (phase === 'type-q') return qPart + (withCursor ? '|' : '');
    const aPart = a.slice(0, aChars);
    if (phase === 'solve-pulse') return q + ' =';
    if (phase === 'type-a') return q + ' = ' + aPart + (withCursor ? '|' : '');
    return q + ' = ' + a;
  }

  function measureFont(text, baseSize) {
    ctx.font = `700 ${baseSize}px 'JetBrains Mono', monospace`;
    const w = ctx.measureText(text).width;
    const maxW = W * 0.82;
    return w > maxW ? baseSize * (maxW / w) : baseSize;
  }

  function recalcFontSize() {
    const [q, a] = currentExpr();
    const full = q + ' = ' + a;
    cachedFontSize = measureFont(full, W * 0.115);
  }

  function drawEquation() {
    const [q] = currentExpr();
    const accent = ACCENTS[exprIdx % ACCENTS.length];
    const showCursor = (phase === 'type-q' || phase === 'type-a') && (Math.floor(t * 40) % 20 < 10);

    let alpha = 1;
    let liftY = 0;
    if (phase === 'dissolve') {
      const p = phaseFrame / DISSOLVE_FRAMES;
      alpha = 1 - p;
      liftY = -p * 14 * u;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${cachedFontSize}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (phase === 'type-q') {
      const txt = q.slice(0, qChars) + (showCursor ? '|' : '');
      ctx.fillStyle = QUESTION_COLOR;
      ctx.fillText(txt, cx, cy + liftY);
    } else if (phase === 'solve-pulse') {
      const pulse = 1 + Math.sin(t * 10) * 0.04;
      ctx.fillStyle = QUESTION_COLOR;
      ctx.save();
      ctx.translate(cx, cy + liftY);
      ctx.scale(pulse, pulse);
      ctx.fillText(q + ' = ?', 0, 0);
      ctx.restore();
    } else {
      const [, a] = currentExpr();
      const qEq = q + ' = ';
      const aPart = phase === 'type-a' ? a.slice(0, aChars) + (showCursor ? '|' : '') : a;
      const totalW = ctx.measureText(qEq + aPart).width;
      const startX = cx - totalW / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = QUESTION_COLOR;
      ctx.fillText(qEq, startX, cy + liftY);
      const qEqW = ctx.measureText(qEq).width;
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 14 * u;
      ctx.fillText(aPart, startX + qEqW, cy + liftY);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function advancePhase() {
    phaseFrame++;
    const [q, a] = currentExpr();
    if (phase === 'type-q') {
      qChars = Math.min(q.length, Math.floor(phaseFrame / FRAMES_PER_CHAR));
      if (qChars >= q.length) { phase = 'solve-pulse'; phaseFrame = 0; }
    } else if (phase === 'solve-pulse') {
      if (phaseFrame >= SOLVE_PULSE_FRAMES) { phase = 'type-a'; phaseFrame = 0; aChars = 0; }
    } else if (phase === 'type-a') {
      aChars = Math.min(a.length, Math.floor(phaseFrame / FRAMES_PER_CHAR));
      if (aChars >= a.length) { phase = 'hold'; phaseFrame = 0; }
    } else if (phase === 'hold') {
      if (phaseFrame >= HOLD_FRAMES) { phase = 'dissolve'; phaseFrame = 0; }
    } else if (phase === 'dissolve') {
      if (phaseFrame >= DISSOLVE_FRAMES) {
        exprIdx = (exprIdx + 1) % EXPR.length;
        phase = 'type-q'; phaseFrame = 0; qChars = 0; aChars = 0;
        recalcFontSize();
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawDecoLayer();
    drawEquation();
    advancePhase();
    t += 0.016;
    raf = requestAnimationFrame(frame);
  }

  recalcFontSize();
  frame();
  return { stop: () => raf && cancelAnimationFrame(raf) };
}
