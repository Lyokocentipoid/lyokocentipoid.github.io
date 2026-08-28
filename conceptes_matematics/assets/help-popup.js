/* ==========================================================================
   Càpsules Avançades de Matemàtiques — quadres d'ajuda emergents
   Cada .help-btn obre el .help-popup que el segueix dins del mateix
   .help-wrap. Només un obert alhora; clicar fora el tanca. Es pot cridar
   diverses vegades (p.ex. després de reconstruir un control dinàmicament)
   sense duplicar listeners, gràcies al flag data-help-bound.
   ========================================================================== */
(function () {
  function initHelpPopups(root) {
    (root || document).querySelectorAll('.help-btn').forEach(btn => {
      if (btn.dataset.helpBound) return;
      btn.dataset.helpBound = '1';
      const popup = btn.parentElement ? btn.parentElement.querySelector('.help-popup') : null;
      if (!popup) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !popup.classList.contains('open');
        document.querySelectorAll('.help-popup.open').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.help-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
        popup.classList.toggle('open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
  }
  document.addEventListener('click', () => {
    document.querySelectorAll('.help-popup.open').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.help-btn[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  });
  window.initHelpPopups = initHelpPopups;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initHelpPopups());
  } else {
    initHelpPopups();
  }
})();
