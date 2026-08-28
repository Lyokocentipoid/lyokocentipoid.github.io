/* ==========================================================================
   CalcMat — a11y.js
   Accessibilitat i robustesa d'interacció compartides per totes les càpsules.

   PER QUÈ EXISTEIX AQUEST FITXER
   ------------------------------
   Les 12 càpsules tenien zero ARIA, zero roles, zero tabindex i zero
   navegació per teclat: tota la interacció era exclusivament ratolí/tàctil.
   Un alumne que navegui amb teclat, o amb lector de pantalla, no podia fer
   absolutament res amb el llenç — que és el cor de cada càpsula.

   Aquest mòdul dona tres peces que abans no hi eren:

     1. announcer()        → regió aria-live per verbalitzar els canvis d'estat
                             que fins ara només es veien pintats al canvas.
     2. makeCanvasSlider() → converteix un <canvas> arrossegable en un control
                             role="slider" operable amb fletxes/Inici/Fi, amb
                             aria-valuenow/valuetext sincronitzats.
     3. reducedMotion()    → consulta viva de prefers-reduced-motion, perquè
                             les animacions es puguin escurçar o suprimir.

   NOTA SOBRE touchcancel
   ----------------------
   Cap càpsula el gestionava. En tauleta (el dispositiu real del públic
   objectiu) un gest interromput pel sistema — notificació, gest de vora,
   rebuig de palmell — dispara touchcancel i MAI touchend, de manera que
   l'estat «dragging» quedava encallat a true per sempre. La correcció es fa
   a cada càpsula afegint touchcancel al costat de touchend; aquí s'ofereix
   bindGestureEnd() per fer-ho d'una sola línia i sense oblits.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ── 1. Moviment reduït ────────────────────────────────────────────────
     Consulta viva (no una fotografia a la càrrega): l'usuari pot canviar la
     preferència del sistema amb la pàgina oberta. */
  var motionQuery = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function reducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  /* Durada d'animació respectuosa: retorna 0 si l'usuari demana moviment
     reduït, de manera que els estats finals s'apliquen immediatament sense
     haver de duplicar la lògica a cada càpsula. */
  function animDuration(ms) {
    return reducedMotion() ? 0 : ms;
  }

  /* ── 2. Regió aria-live compartida ─────────────────────────────────────
     Un únic node per pàgina, creat sota demanda. Els missatges repetits
     s'han de forçar (els lectors de pantalla ignoren un textContent idèntic),
     per això s'alterna un espai fi invisible. */
  var liveNode = null;
  var lastMessage = '';

  function ensureLiveNode() {
    if (liveNode) return liveNode;
    liveNode = document.createElement('div');
    liveNode.className = 'sr-only';
    liveNode.setAttribute('aria-live', 'polite');
    liveNode.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveNode);
    return liveNode;
  }

  function announce(message) {
    if (!message) return;
    var node = ensureLiveNode();
    // Alternem un caràcter invisible perquè dos avisos iguals seguits
    // es tornin a verbalitzar.
    var text = (message === lastMessage) ? message + ' ' : message;
    lastMessage = message;
    node.textContent = text;
  }

  /* ── 3. Canvas operable per teclat ─────────────────────────────────────
     Converteix un llenç arrossegable en un control amb semàntica de slider.

     opts = {
       label:     etiqueta accessible (obligatòria)
       min, max:  límits numèrics del valor principal
       step:      increment amb fletxes (per defecte 1)
       bigStep:   increment amb Re/Av Pàg (per defecte step*5)
       get:       () => valor actual
       set:       (v) => aplica el valor (ha de redibuixar)
       text:      (v) => cadena llegible per aria-valuetext (opcional)
       describedBy: id d'un node amb instruccions (opcional)
     }

     Es fa servir role="slider" perquè és exactament la semàntica d'un valor
     continu acotat, i és el que els lectors de pantalla anuncien millor. */
  function makeCanvasSlider(canvas, opts) {
    if (!canvas || !opts) return null;
    var step = opts.step != null ? opts.step : 1;
    var bigStep = opts.bigStep != null ? opts.bigStep : step * 5;

    canvas.setAttribute('role', 'slider');
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('aria-label', opts.label);
    if (opts.describedBy) canvas.setAttribute('aria-describedby', opts.describedBy);

    /* sync() consulta l'estat VIU de la càpsula (min/max/get/text solen ser
       getters). Si en un moment donat aquest estat encara no existeix — per
       exemple durant la inicialització, o entre rondes — no ha de tombar el
       registre sencer i deixar el llenç sense semàntica: es reintenta al
       proper canvi de valor. Aquest cas es va donar de debò: una crida a
       sync() abans d'inicialitzar una variable let provocava un error de zona
       morta temporal que deixava el canvas sense role. */
    function sync() {
      try {
        var v = opts.get();
        canvas.setAttribute('aria-valuenow', String(v));
        canvas.setAttribute('aria-valuemin', String(opts.min));
        canvas.setAttribute('aria-valuemax', String(opts.max));
        if (opts.text) canvas.setAttribute('aria-valuetext', opts.text(v));
      } catch (err) {
        if (global.console && console.debug) {
          console.debug('[a11y] estat encara no disponible per sincronitzar el slider:', err.message);
        }
      }
    }

    function clamp(v) { return Math.max(opts.min, Math.min(opts.max, v)); }

    /* Els passos poden ser fraccionaris (0,5 al factor de proporcionalitat).
       Sumar-los repetidament acumula error binari (0.1+0.2 = 0.30000000000000004),
       cosa que amb el temps desincronitzaria el valor dels ticks reals; per això
       s'arrodoneix a la reixeta del propi step. */
    function quantise(v) {
      var s = step;
      if (!isFinite(s) || s <= 0) return v;
      var snapped = Math.round(v / s) * s;
      return Math.round(snapped * 1e6) / 1e6;
    }

    function apply(v, speak) {
      var next = clamp(quantise(v));
      var current;
      try { current = opts.get(); } catch (e) { return; }
      if (next === current) return;
      opts.set(next);
      sync();
      if (speak && opts.text) {
        try { announce(opts.text(next)); } catch (e) { /* estat transitori */ }
      }
    }

    canvas.addEventListener('keydown', function (e) {
      var v = opts.get();
      var handled = true;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowUp':   apply(v + step, true); break;
        case 'ArrowLeft':  case 'ArrowDown': apply(v - step, true); break;
        case 'PageUp':                       apply(v + bigStep, true); break;
        case 'PageDown':                     apply(v - bigStep, true); break;
        case 'Home':                         apply(opts.min, true); break;
        case 'End':                          apply(opts.max, true); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    sync();
    return { sync: sync };
  }

  /* Marca un canvas purament il·lustratiu (no interactiu) com a imatge amb
     text alternatiu, en comptes de deixar-lo mut per als lectors de pantalla. */
  function describeCanvas(canvas, label) {
    if (!canvas) return;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', label);
  }

  /* ── 4. Final de gest robust ───────────────────────────────────────────
     Registra el mateix gestor per a totes les maneres en què un gest pot
     acabar, incloent-hi les que es perdien (touchcancel/pointercancel) i el
     cas de deixar anar el botó fora del llenç (mouseup a window). */
  function bindGestureEnd(el, handler) {
    global.addEventListener('mouseup', handler);
    el.addEventListener('touchend', handler);
    el.addEventListener('touchcancel', handler);
    el.addEventListener('pointercancel', handler);
    // Si el punter surt de la finestra amb el botó premut, el gest s'acaba.
    global.addEventListener('blur', handler);
  }

  global.A11y = {
    reducedMotion: reducedMotion,
    animDuration: animDuration,
    announce: announce,
    makeCanvasSlider: makeCanvasSlider,
    describeCanvas: describeCanvas,
    bindGestureEnd: bindGestureEnd
  };
})(window);
