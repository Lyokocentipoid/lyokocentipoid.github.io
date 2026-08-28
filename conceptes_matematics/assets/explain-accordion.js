/* ==========================================================================
   Càpsules Avançades de Matemàtiques — acordió de "bona explicació"
   Inicialitza tots els .explain-box: comencen tancats, es poden obrir
   diversos alhora (no és exclusiu), i l'animació la porta el CSS
   (grid-template-rows) — aquest script només alterna la classe .is-open
   i l'atribut aria-expanded.
   ========================================================================== */
(function () {
  function initExplainAccordions() {
    document.querySelectorAll('.explain-box').forEach(box => {
      const btn = box.querySelector('.explain-summary');
      if (!btn) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', () => {
        const willOpen = !box.classList.contains('is-open');
        box.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExplainAccordions);
  } else {
    initExplainAccordions();
  }
})();
