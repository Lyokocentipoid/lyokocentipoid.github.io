/* ==========================================================================
   Càpsules Avançades de Matemàtiques — utilitats d'accessibilitat compartides
   --------------------------------------------------------------------------
   Per què existeix aquest fitxer: fins ara el projecte tenia 190 gestors de
   clic i exactament 9 atributs ARIA. Els elements interactius principals de
   dues càpsules eren <div> amb onclick (inoperables amb teclat), cap <canvas>
   tenia nom accessible, i el resultat d'una acció (encert/error, puntuació)
   només existia com a color i com a text que apareix sense avisar ningú.

   Ús: <script src="../assets/a11y.js"></script> abans del <script> propi.
   ========================================================================== */

/* ── Moviment reduït ───────────────────────────────────────────────────────
   El CSS ja apaga transicions i @keyframes, però les animacions fetes amb
   requestAnimationFrame s'han de comprovar des de JS. Es consulta en viu (no
   es guarda en una constant) perquè l'usuari pot canviar la preferència del
   sistema amb la pàgina ja oberta. */
const _reducedMotionQuery = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;
function prefersReducedMotion() {
  return !!(_reducedMotionQuery && _reducedMotionQuery.matches);
}

/* ── Regió live per anunciar resultats ─────────────────────────────────────
   Una sola regió compartida per pàgina, creada mandrosament. `polite` no
   interromp el que el lector estigui dient; per a coses urgents (temps
   esgotat) es pot passar assertive.

   El truc del text buit + requestAnimationFrame és necessari: si s'assigna
   dues vegades seguides el MATEIX text, molts lectors de pantalla no el
   tornen a llegir perquè el node no ha canviat. */
let _liveRegion = null;
function _ensureLiveRegion() {
  if (_liveRegion) return _liveRegion;
  _liveRegion = document.createElement('div');
  _liveRegion.className = 'sr-only';
  _liveRegion.setAttribute('aria-live', 'polite');
  _liveRegion.setAttribute('aria-atomic', 'true');
  document.body.appendChild(_liveRegion);
  return _liveRegion;
}
function announce(message, assertive) {
  if (!message) return;
  const region = _ensureLiveRegion();
  region.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}

/* ── Canvas amb nom accessible ─────────────────────────────────────────────
   Un <canvas> és un mapa de bits opac: sense text alternatiu no existeix per
   a un lector de pantalla. role="img" + aria-label el converteix en una
   imatge amb descripció. describeCanvas() es torna a cridar cada cop que
   l'estat dibuixat canvia, de manera que la descripció mai queda obsoleta.

   Es fa servir aria-label (no un <figcaption>) perquè el contingut és
   generat i canvia constantment; i role="img" perquè el contingut intern
   del canvas no és navegable. */
function describeCanvas(canvas, label) {
  if (!canvas) return;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
}

/* Canvas purament decoratiu (l'animació del logotip): s'amaga del tot de
   l'arbre d'accessibilitat en lloc de deixar-lo com un element sense nom. */
function hideCanvasFromA11y(canvas) {
  if (!canvas) return;
  canvas.setAttribute('role', 'presentation');
  canvas.setAttribute('aria-hidden', 'true');
}

/* ── Grups de botons de selecció única (xips, pestanyes de vista) ──────────
   Marca quin element d'un grup està seleccionat. Sense això, un lector de
   pantalla llegeix «Explora, botó» i «Repte, botó» sense cap indici de quin
   és l'actiu — la classe .active és només visual.

   S'usa aria-pressed (botó de commutació) i no role="tab", perquè aquests
   controls no governen panells amb role="tabpanel" en tots els casos i un
   role="tab" mal format és pitjor que cap role. */
function setPressedGroup(buttons, isActiveFn) {
  Array.prototype.forEach.call(buttons, btn => {
    btn.setAttribute('aria-pressed', isActiveFn(btn) ? 'true' : 'false');
  });
}

/* ── Navegació per fletxes dins d'un grup ──────────────────────────────────
   Patró estàndard de «composite widget»: les fletxes mouen el focus dins del
   grup i Home/End salten als extrems. Millora l'experiència de teclat en
   graelles i files de fitxes, on tabular element per element és lent.
   Es manté cada element tabulable (tabindex 0) per no amagar-ne cap. */
function enableArrowNavigation(container, itemSelector) {
  container.addEventListener('keydown', e => {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (keys.indexOf(e.key) === -1) return;
    const items = Array.prototype.slice.call(container.querySelectorAll(itemSelector))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    if (current === -1) return;
    let next = current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next !== current) { e.preventDefault(); items[next].focus(); }
  });
}
