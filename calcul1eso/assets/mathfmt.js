/* ==========================================================================
   CalcMat — mathfmt.js
   Renderitzat de notació matemàtica amb KaTeX, amb degradació elegant.

   PER QUÈ EXISTEIX AQUEST FITXER
   ------------------------------
   Fins ara tota la notació del web s'escrivia amb superíndexs Unicode
   (aᵐ, ⁿ, ²...). Això té un sostre real que va provocar errors de notació:

     · «(aᵐ)ⁿ = aᵐ·ⁿ» — el punt de multiplicació és U+00B7, que viu a la línia
       base. Enmig de dos superíndexs es llegeix «(aᵐ)·ⁿ», no «a^(m·n)».
       Unicode NO té un punt volat en superíndex: l'expressió és inescrivible.
     · Els decimals periòdics necessiten el vincle (barra superior) sobre el
       període: 0,3̄ · 0,1̄4̄2̄8̄5̄7̄. Unicode només ho pot simular amb combinants
       que trenquen l'alçada de línia i que els lectors de pantalla ignoren.

   Per això s'incorpora KaTeX: no és decoració, resol dos errors concrets.

   ÚS
   --
     <span class="math" data-tex="a^m \cdot a^n = a^{m+n}"
                        data-say="a elevat a m per a elevat a n és igual a a elevat a m més n"
     >aᵐ · aⁿ = aᵐ⁺ⁿ</span>

   · data-tex  → font LaTeX (obligatori)
   · data-say  → lectura en català pla per a lectors de pantalla (recomanat)
   · contingut → text Unicode llegible que es MANTÉ si KaTeX no carrega
                 (aula sense internet, CDN bloquejat, error de xarxa...)

   ACCESSIBILITAT
   --------------
   Quan hi ha data-say, el node visual de KaTeX es marca aria-hidden i el
   contenidor exposa role="math" + aria-label amb la lectura en català. És
   més fiable que confiar en com cada lector de pantalla verbalitza el MathML
   que genera KaTeX, sobretot en català.
   ========================================================================== */

(function (global) {
  'use strict';

  var KATEX_VERSION = '0.18.4';
  var CDN = 'https://cdn.jsdelivr.net/npm/katex@' + KATEX_VERSION + '/dist/';
  // Hash SRI calculats sobre els fitxers reals servits per jsDelivr.
  var SRI_JS  = 'sha384-ykMNcWQhhTUb0YV9SPpPUFURHZ+tWmubkakGBP+OgNK/UXdO2gtzglWx0Rj9hnO3';
  var SRI_CSS = 'sha384-u1zONI5gPXUx0UKI62c75/zww972y0v2rSK5ZYlVdS6xEuWDeZWUI66v6t1gvlXJ';

  var loadPromise = null;

  function loadKatex() {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise(function (resolve, reject) {
      if (global.katex) { resolve(global.katex); return; }

      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = CDN + 'katex.min.css';
      css.integrity = SRI_CSS;
      css.crossOrigin = 'anonymous';
      css.referrerPolicy = 'no-referrer';
      document.head.appendChild(css);

      var js = document.createElement('script');
      js.src = CDN + 'katex.min.js';
      js.integrity = SRI_JS;
      js.crossOrigin = 'anonymous';
      js.referrerPolicy = 'no-referrer';
      js.defer = true;
      js.onload = function () {
        global.katex ? resolve(global.katex) : reject(new Error('KaTeX carregat però absent'));
      };
      js.onerror = function () { reject(new Error('No s\'ha pogut carregar KaTeX')); };
      document.head.appendChild(js);
    });

    return loadPromise;
  }

  /* En mode matemàtic de LaTeX la coma és puntuació i hi afegeix un espai fi
     darrere: «0,5» sortiria com «0, 5». En català la coma és el separador
     decimal, així que qualsevol coma entre dues xifres s'ha de protegir amb
     {,} perquè es tracti com un caràcter ordinari. */
  function protectDecimalCommas(tex) {
    return tex.replace(/(\d),(?=\d)/g, '$1{,}');
  }

  function renderOne(el, katex) {
    var tex = el.getAttribute('data-tex');
    if (!tex) return false;

    // Preservem el text Unicode original: si mai cal tornar enrere (o per
    // depurar), no s'ha perdut.
    if (!el.hasAttribute('data-fallback')) {
      el.setAttribute('data-fallback', el.textContent.trim());
    }

    try {
      var html = katex.renderToString(protectDecimalCommas(tex), {
        throwOnError: true,
        displayMode: el.hasAttribute('data-display'),
        output: 'htmlAndMathml',
        strict: false,
        trust: false
      });
      el.innerHTML = html;
      el.classList.add('math--rendered');
    } catch (err) {
      // Expressió invàlida: conservem el text llegible en comptes de mostrar
      // l'error vermell de KaTeX a la cara de l'alumne.
      if (global.console && console.warn) {
        console.warn('[mathfmt] TeX invàlid, es manté el text alternatiu:', tex, err.message);
      }
      return false;
    }

    var say = el.getAttribute('data-say');
    if (say) {
      el.setAttribute('role', 'math');
      el.setAttribute('aria-label', say);
      // Evitem la doble lectura MathML + aria-label.
      var kx = el.querySelector('.katex');
      if (kx) kx.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  /* Renderitza tots els [data-tex] encara no processats dins d'un arrel.
     És idempotent: es pot cridar tantes vegades com calgui després
     d'inserir contingut nou al DOM. */
  function render(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-tex]:not(.math--rendered)');
    if (!nodes.length) return Promise.resolve(0);

    return loadKatex().then(function (katex) {
      var n = 0;
      for (var i = 0; i < nodes.length; i++) if (renderOne(nodes[i], katex)) n++;
      return n;
    }).catch(function (err) {
      // Degradació elegant: el text Unicode que ja hi ha al DOM es queda tal
      // qual i la pàgina segueix sent perfectament llegible i utilitzable.
      if (global.console && console.warn) {
        console.warn('[mathfmt] KaTeX no disponible; es manté la notació Unicode.', err.message);
      }
      document.documentElement.classList.add('no-katex');
      return 0;
    });
  }

  /* Construeix el marcatge d'una expressió per inserir-la des de JS. */
  function span(tex, fallbackText, say) {
    var el = document.createElement('span');
    el.className = 'math';
    el.setAttribute('data-tex', tex);
    if (say) el.setAttribute('data-say', say);
    el.textContent = fallbackText != null ? fallbackText : tex;
    return el;
  }

  global.MathFmt = { render: render, load: loadKatex, span: span };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { render(); });
  } else {
    render();
  }
})(window);
