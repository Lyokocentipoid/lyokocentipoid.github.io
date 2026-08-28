# Prompt de disseny — CalcMat (sèrie de webs de matemàtiques per ESO)

> Document de referència reutilitzable, extret de la construcció completa de **CalcMat 1r ESO**. Objectiu: si en el futur es construeix un web germà ("Càlcul 2n ESO", "Àlgebra 4t ESO", etc.), aquest fitxer ha de servir de prompt inicial i evitar repetir els errors i rondes de feedback que ja hem resolt aquí.

---

## 1. Què és el projecte

Un web estàtic (sense backend, sense build step) d'aprenentatge de matemàtiques per a un curs concret d'ESO, organitzat en **blocs temàtics** i, dins de cada bloc, **càpsules interactives** (una pàgina HTML per tema) més **fitxes d'exercicis** en PDF-com-a-web. Tot en català, per a alumnes d'entre 12 i 14 anys.

Aquest patró (blocs → càpsules → fitxes) es pot reutilitzar íntegrament per a qualsevol curs/matèria; només canvia el contingut matemàtic i, si cal, la paleta.

## 2. Arquitectura tècnica

- **100% estàtic**: HTML + CSS + JavaScript vanilla. Sense frameworks, sense npm, sense build. Cada pàgina és autocontinguda tret dels 2 fitxers compartits. **Única excepció**: les fitxes envien els resultats a un backend extern (Google Apps Script) — vegeu la subsecció dedicada més avall.
- **Fitxers compartits** (`assets/`):
  - `styles.css` — tokens de color/tipografia + tots els components reutilitzats (nav, targetes, botons, mode-toggle, canvas-wrap, answer-panel, etc.)
  - `hero-anim.js` — l'animació de la mini-calculadora (seqüència d'equacions resolent-se) que es crida des de totes les pàgines amb `initHeroAnim(canvasEl, {size})`
  - `mathfmt.js` — notació matemàtica amb KaTeX (vegeu «Notació matemàtica» més avall)
  - `a11y.js` — accessibilitat i robustesa d'interacció (vegeu «Accessibilitat» més avall)

  L'ordre de càrrega a cada càpsula és sempre: `a11y.js`, `mathfmt.js`, `hero-anim.js`, i després l'script propi.

### Notació matemàtica: quan Unicode no arriba (`mathfmt.js`)

Escriure les fórmules amb superíndexs Unicode (aᵐ, ⁿ, ²) té un **sostre real** que va produir errors de notació de veritat en aquest projecte:

- `(aᵐ)ⁿ = aᵐ·ⁿ` — el punt de multiplicació és U+00B7 i viu a la línia base. Enmig de dos superíndexs es llegeix `(aᵐ)·ⁿ`, no `a^(m·n)`. **Unicode no té cap punt volat en superíndex: l'expressió és literalment inescrivible.**
- Els decimals periòdics necessiten el vincle sobre el període (`0,3̄`). Amb caràcters combinants es trenca l'alçada de línia i els lectors de pantalla l'ignoren.

Per això s'incorpora KaTeX (CDN jsDelivr, versió fixada amb hash SRI). Regles d'ús:

```html
<span class="math" data-tex="a^m \cdot a^n = a^{m+n}"
                   data-say="a elevat a m per a elevat a n és igual a a elevat a m més n"
>aᵐ · aⁿ = aᵐ⁺ⁿ</span>
```
- El **text Unicode llegible va al marcatge**, no injectat per JS: si el CDN falla (aula sense internet) o l'alumne té JS desactivat, la fórmula segueix sent llegible. `<html class="no-katex">` li aplica tipografia monoespaiada.
- `data-say` és **obligatori a la pràctica**: KaTeX genera MathML, però com el verbalitza cada lector de pantalla en català és impredictible. Amb `data-say`, el node visual es marca `aria-hidden` i s'exposa `role="math"` + `aria-label` en català pla.
- La coma decimal catalana s'ha de protegir: en mode matemàtic LaTeX la coma és puntuació i hi afegeix un espai (`0, 5`). El mòdul ho fa automàticament convertint `\d,\d` en `{,}`.

### Accessibilitat del llenç (`a11y.js`)

Les 12 càpsules es van construir amb **zero ARIA, zero tabindex i zero teclat**: tota la interacció era ratolí/tàctil, de manera que el component central de cada càpsula era inoperable per a un alumne que navegui amb teclat o lector de pantalla.

- `A11y.makeCanvasSlider(canvas, {label, min, max, step, get, set, text})` — converteix un llenç arrossegable en `role="slider"` operable amb fletxes/Re-Av Pàg/Inici/Fi, amb `aria-valuenow`/`valuetext` sincronitzats. Fes servir **getters** per a `min`/`max` quan depenguin d'estat viu (denominador, submode) i crida `.sync()` a cada canvi de context, o els atributs mentiran.
- `A11y.describeCanvas(canvas, text)` — per a llenços que no es redueixen a un sol valor continu (graelles, clau de divisió): `role="img"` + `aria-label`.
- `A11y.announce(msg)` — regió `aria-live` compartida per verbalitzar el que abans només es veia pintat.
- `A11y.bindGestureEnd(el, handler)` — registra el final de gest a **totes** les vies (vegeu el bug de `touchcancel` a la secció 7).
- `A11y.animDuration(ms)` — retorna 0 amb `prefers-reduced-motion`, perquè les animacions de canvas també respectin la preferència del sistema (el CSS ja les neutralitza pel seu costat).
- **Estructura de directoris.** Aquest web **no viu sol**: és un subdirectori d'un lloc pare (`lyokocentipoid.github.io/`) que conté pàgines compartides entre projectes germans.
  ```
  lyokocentipoid.github.io/     ← ARREL DEL LLOC PARE
    recursos.html               → «Material»: pàgina COMPARTIDA entre projectes
    calcul1eso/                 ← arrel d'AQUEST projecte
      index.html                → portada
      teoria.html               → graella de càpsules, organitzada per blocs
      fitxes.html               → índex de fitxes d'exercicis
      assets/
        styles.css  ·  hero-anim.js  ·  mathfmt.js  ·  a11y.js
      capsules/
        <tema>.html             → una pàgina interactiva per tema (Explora + Repte)
      fitxes/
        bloc<N>-nivell<M>.html
  ```
- **Els `../` cap al lloc pare són deliberats, no errors de còpia.** L'enllaç «Material» del nav apunta a `../recursos.html` a propòsit: la pàgina de recursos és compartida i viu un nivell amunt. Si veus un `../` que sembla fora de lloc perquè els seus germans del mateix `<nav>` no en tenen, **comprova primer si el destí existeix al directori pare** abans de «corregir-lo».
- Cada bloc temàtic del currículum té normalment 3-4 càpsules i 2 nivells de fitxes (nivell 1 = pràctica bàsica estil "neó", nivell 2 = pràctica amb desenvolupament estil "llibreta").
- **Verificació local: serveix des de l'arrel del LLOC PARE**, no des de `calcul1eso/`:
  ```bash
  cd lyokocentipoid.github.io && python3 -m http.server 8000
  # després obre http://localhost:8000/calcul1eso/index.html
  ```
  Si serveixes des de dins de `calcul1eso/`, tots els enllaços a `../recursos.html` donaran 404 **encara que siguin correctes**, perquè queden fora de l'arrel del servidor. És un fals positiu fàcil de confondre amb un enllaç trencat. (Mai obris amb `file://`, per problemes de CORS amb eines de navegador.)

### Convencions de codi compartides entre càpsules

Cada càpsula d'aquest projecte redeclara localment els mateixos helpers de canvas (`roundRect`, `txt`, `clamp`, `fmt`/`fmtNum`, `hexToRgba`/`hexToRgb`, `flash`, `pointerXY`, `resize`) en lloc de compartir-los. Això va fer la construcció inicial més ràpida (còpia-i-enganxa d'una càpsula de referència), però té un cost real: un bug en un helper (com el de `roundRect` amb radi desproporcionat, vegeu secció 7) només es corregeix allà on s'ha detectat, no a totes les còpies. **Per a un projecte nou, val la pena extreure aquests helpers a un `assets/canvas-helpers.js` compartit des del primer dia** — la mateixa lògica que ja s'aplica a `styles.css` i `hero-anim.js`.

Patrons que sí que cal mantenir consistents a totes les càpsules (compartits o no):
- **Resize conscient del DPR**: `canvas.width = rect.width * devicePixelRatio` (i mateix per `height`), perquè el dibuix es mantingui nítid en pantalles retina/mòbil. El `draw()` sempre treballa en coordenades de dispositiu (`W`, `H` = `canvas.width/height`), no en píxels CSS.
- **Doble gestor ratolí + tàctil, sempre junts**, mai només un dels dos (el públic objectiu usa tauletes tant a l'aula com a casa):
  ```js
  canvas.addEventListener('mousedown', onCanvasDown);
  canvas.addEventListener('mousemove', onCanvasMove);
  window.addEventListener('mouseup', onCanvasUp);
  canvas.addEventListener('touchstart', onCanvasDown, { passive: false });
  canvas.addEventListener('touchmove', onCanvasMove, { passive: false });
  canvas.addEventListener('touchend', onCanvasUp);
  ```
  El `{ passive: false }` és imprescindible perquè `e.preventDefault()` funcioni dins `touchstart`/`touchmove` (si no, el navegador fa scroll de la pàgina mentre l'alumne intenta arrossegar).
- **Format numèric en català**: separador decimal amb **coma, mai punt**, a qualsevol número mostrat en pantalla (`fmtNum`/`toCaDecimal`: `n.toFixed(2).replace('.', ',')`). És fàcil oblidar-ho si es reutilitza codi/exemples en anglès.
- **Generació a partir de "pools" curats, no de rangs aleatoris purs**: quan calgui un valor "net" (un divisor exacte, un percentatge redó, un múltiple de 5...), defineix un array de valors vàlids (`kPool`, `NICE_PERCENTS`, etc.) i tria'n un a l'atzar, en lloc de generar un número aleatori pur i esperar que surti net. Això és el mecanisme concret que garanteix el principi 3 de la secció 5 (objectius sempre assolibles).

### Excepció al "sense backend": enviament de resultats de les fitxes a Google Sheets

Totes les fitxes (`fitxes/*.html`, i `proporcionalitat1eso/fitxa2.html`) tenen aquest mecanisme, que **no és opcional ni cosmètic — és la manera com el professor recull els resultats de la classe**:

1. Pantalla inicial amb `<input id="playerNameInput">` que demana el nom de l'alumne (`"✏️ Escriu el teu nom:"`) abans de començar les preguntes; es guarda a la variable `playerName`.
2. En arribar a la pantalla de resultats final (`finalScreen`), es crida `_enviarRegistre(playerName, score, TOTAL)`, que construeix un payload i el fa `POST` amb `fetch(APPS_SCRIPT_URL, { mode: 'no-cors', ... })` a un endpoint de **Google Apps Script** (el mateix per a totes les fitxes d'un projecte, desplegat com a web app des d'un full de Google Sheets del professor).
3. El payload inclou: `fitxa` (= `FITXA_NOM`, determina la pestanya/full on s'escriu), `timestamp` (`Europe/Madrid`), `nom`, `puntuacio`, `total`, `minuts` (temps transcorregut des de l'inici), i `primeres_respostes` — un array amb el resultat (✓/✗ + valor) de la PRIMERA resposta a cada pregunta. **Reutilitza exactament les mateixes dades que ja alimenten els punts verds/vermells de "Progrés total"** (secció 4) — no és una font de dades separada.
4. `FITXA_NOM` segueix la convenció `Calc_F<N>` seqüencial per a les fitxes pròpies del bloc (`Calc_F1`...`Calc_F6` en aquest projecte = bloc1-nivell1/2, bloc2-nivell1/2, bloc3-nivell1/2); el nom determina la pestanya del full de càlcul, així que ha de ser únic per fitxa i estable un cop el professor ja hi té dades desades.
5. Com que és `mode: 'no-cors'`, la resposta del servidor **no es pot llegir** des del client, i l'error de xarxa es captura en silenci (`.catch(() => {})`) — si l'enviament falla, ni l'alumne ni el codi se n'assabenten. És un compromís acceptat per a aquest ús, però cal saber-ho si mai es vol afegir confirmació visual d'enviament correcte.

**Per a un projecte nou, aquesta peça requereix una configuració manual fora del repositori** que aquest document per si sol no pot automatitzar:
- Desplegar un Apps Script propi (nou full de Google Sheets + nou desplegament "Web app" amb accés "Qualsevol persona") i obtenir una URL `.../exec` nova — **no reutilitzis l'URL d'aquest projecte**, escriuria a un full que no és el teu.
- Actualitzar `APPS_SCRIPT_URL` i triar un `FITXA_NOM` únic a cada fitxa nova.
- **El codi del costat servidor (el `.gs` que rep el POST i escriu la fila al full) no viu enlloc d'aquest repositori** — només existeix al compte de Google Apps Script del professor. És un punt únic de fallada: si es perd l'accés a aquell script, cal reconstruir-lo des de zero a partir de la forma del payload descrita al punt 3. Val la pena, en un projecte nou, guardar una còpia del `.gs` dins del repositori (p. ex. `tools/apps-script/Codi.gs`) només com a referència/backup, encara que Apps Script no es desplegui des d'aquí.
- **Inconsistència detectada en aquest projecte**: `proporcionalitat1eso/fitxa1.html` no té aquesta integració (només `fitxa2.html` la té) — si es manté aquell contingut extern vinculat des del banner de fitxes, val la pena unificar-ho.

## 3. Identitat visual (CalcMat 1r ESO — adaptar per a cada nou projecte)

```css
--bg:       #e3ecff;   /* pastel blau clarament perceptible, no crema neutre */
--surface:  #ffffff;
--card:     #ffffff;
--border:   #c9d6f2;
--ink:      #1a1f36;
--muted:    #5b6584;

--petrol:     #0b93a0;  /* turquesa viu */
--amber:      #e2860a;  /* taronja/ambre viu */
--terracotta: #e6483a;  /* coral-vermell viu */
--sage:       #177e54;  /* verd viu */
--plum:       #8452d6;  /* lila viu */
```
- Colors **vius i saturats**, mai apagats/mate: el públic és adolescent, no un editorial per a adults.
- Cada bloc/càpsula s'associa a un dels 5 accents (`--m-color` per CSS variable local) de manera consistent a nav, botons, canvas-wrap i targetes de referència.
- **Animació hero**: ha de comunicar "càlcul" al primer cop d'ull (seqüència d'expressions que es resolen, tipografia monospace gran) — mai formes geomètriques abstractes sense relació amb el contingut. Ha de ser visible també a mòbil (no amagar-la sota un breakpoint).

## 4. Patró estàndard d'una càpsula

Totes les càpsules comparteixen exactament aquesta estructura DOM/CSS (còpia-i-adapta, no reinventis):

```
<nav> logo+mini-hero · etiqueta de bloc · enllaç «Totes les càpsules»

<div class="canvas-side">
  <div class="canvas-header"> h1 + <p> d'explicació breu de la interacció
  <a class="fitxes-banner">  (si el bloc té fitxes associades)
  <div class="mode-toggle">  🔍 Explora | 🏆 Repte
  [sub-tabs si la càpsula té més d'un submode, p. ex. Directa/Inversa]

  <div class="repte-only" id="repteSetup">   slider de durada (20-300s) + botó "Comença"
  <div class="repte-bar repte-only">          Temps | Puntuació | Ratxa | Nova ronda

  <div class="canvas-wrap"><canvas></canvas></div>
  <div class="canvas-hint">   text d'ajuda que es reescriu dinàmicament — SEMPRE fora/sota el canvas-wrap, mai a sobre

  <div class="readout-badge">  número gran + nom + definició — mostra la "resposta descoberta" o la constant
  <div class="answer-panel explora-only">  exercici Explora: títol, input, Comprova, Nou exercici
  <div class="answer-panel repte-only">    mateix panell per a la ronda de Repte

<div class="info-side">
  <div class="info-title">
  N × <div class="type-card">  targetes clicables de referència (concepte + fórmula + exemple animat)
  <div class="note-box">        resum final "Recorda:"

<footer>
```

### Mode Explora vs. Mode Repte
- **Explora**: sense pressió de temps, un exercici a la vegada, botó "Nou exercici" per regenerar.
- **Repte**: rellotge (slider 20-300s triat per l'usuari abans de començar), puntuació, ratxa, penalització en fallar (`score = Math.max(0, score-1)`, `streak=0`), bonificació de temps en encertar.
- **Bug recurrent #1 — CAP DE TEMPS HARDCODED**: la bonificació de temps en encertar s'ha d'acotar a la durada MÀXIMA TRIADA, no a una constant fixa:
  ```js
  // ❌ MALAMENT — ignora el slider si l'usuari ha triat >90s
  timeLeft = Math.min(90, timeLeft + 5);
  // ✔ BÉ
  let repteMaxTime = 45; // valor per defecte, sobreescrit a startRepte()
  function startRepte(seconds) { repteMaxTime = seconds; timeLeft = seconds; ... }
  timeLeft = Math.min(repteMaxTime, timeLeft + 5);
  ```
  Aquest bug es va colar EN TOTES les 12 càpsules originals i va caldre una passada sencera per corregir-lo. Escriu-ho bé des del primer dia.
- **Bug recurrent #2 — FUITA D'ESTILS INLINE entre modes**: en entrar/sortir de Repte sovint es fa `el.style.display = 'none'/'flex'` per JS. Si en tornar a Explora no es reseteja a `''`, els estils inline queden per sobre de les regles CSS i trenquen el layout la propera vegada que s'hi entra. Sempre, en el handler de `btnExplora`:
  ```js
  repteSetupEl.style.display = '';
  repteBarEl.style.display = '';
  repteAnswerPanelEl.style.display = 'none';
  ```

### Fitxes d'exercicis (`fitxes/*.html`)
- Graella de preguntes amb "Progrés total": punts que es pinten en marcar cada pregunta.
- **Marca sempre dos colors**: verd si la primera resposta va ser correcta, **vermell si la primera resposta va ser incorrecta** (encara que després s'hagi corregit) — no deixis els punts en blanc per als errors, l'alumne ha de poder repassar on ha fallat.
- Compte amb la indexació: si les preguntes es mostren en ordre "shuffled" però els punts de progrés estan indexats per posició de joc seqüencial, cal remapear (`Array.from({length:PER},(_,k)=>dotStart+k)`), no reutilitzar directament els índexs barrejats del banc de preguntes.
- En acabar totes les preguntes, els mateixos resultats de "primera resposta" (correcta/incorrecta) s'envien a un full de Google Sheets perquè el professor pugui fer seguiment — vegeu "Excepció al «sense backend»" a la secció 2. No és un afegit opcional: és la manera real com el professor recull dades de la classe.

## 5. Principis de disseny d'interacció (la part més important d'aquest document)

Aquests principis van sorgir directament de rondes successives de feedback de l'usuari provant el producte final. **Aplica'ls des del primer disseny, no esperis que et calgui refer-ho tres vegades.**

1. **Cap interacció ha de requerir molts clics/passos repetitius per fer una sola acció significativa.** Si cal arrossegar 40 punts un a un o clicar un stepper ±1 deu vegades per arribar a un valor, la interacció és dolenta encara que sigui "tècnicament interactiva". Prefereix arrossegament continu, "clic = omple fins aquí", o controls de factor/escala.

2. **Sempre que el tema tingui un mètode escrit tradicional (el que s'ensenya i s'examina a classe), la càpsula l'ha de mostrar i practicar explícitament** — no només oferir una metàfora visual desconnectada. Exemples d'aquest projecte:
   - Divisió → format tradicional "per la clau" amb quocient construint-se xifra a xifra, no repartiment de boles bola a bola.
   - MCM/MCD → l'escala de divisions successives simultànies (el mètode de llibreta), no un aparellament abstracte de fitxes.
   - Jerarquia d'operacions → col·lapsar la subexpressió de prioritat més alta in situ, exactament com s'escriuria a mà.

3. **Els valors objectiu han de ser sempre assolibles exactament amb la granularitat de la interacció.** Si un dial només permet percentatges enters, no generis un objectiu (preu final, per exemple) que només s'aconsegueix amb un percentatge decimal. Verifica la reachability matemàticament abans d'escriure el codi de generació, no després. Aquest va ser un bug real (percentatges.html, dial de Rebaixes amb un preu objectiu impossible).

4. **Feedback en viu DURANT l'arrossegament, no només en soltar el ratolí.** L'usuari ha de veure com canvia el color/valor mentre mou, no rebre l'avaluació només al `mouseup`.

5. **L'arrossegament ha d'alimentar directament la resposta, mai ser decoratiu.** Patró establert i validat: quan el valor arrossegat "encaixa" (snap) amb la resposta correcta dins una tolerància neta, omple automàticament el camp de resposta i mostra un indicador clar (🔒/🧲 + color verd). L'alumne confirma amb «Comprova», però el valor prové del gest, no d'un càlcul mental separat i després escrit a cegues. Si el component interactiu "no aporta res" i la resposta real ve només de teclejar un número, el disseny ha fallat.

6. **Quan una interacció és "un sol gest = resposta automàticament correcta" sense cap possibilitat d'error real, introdueix un pas de decisió genuí.** (Exemple detectat: suma/resta amb acarreament calculat sencer per JS, on l'única acció possible és clicar l'única casella clicable — no avalua res.)

7. **El rang practicat/puntuat ha d'igualar el rang explorable.** Si Explora permet exponents 0-10 però Repte només en genera 2-5, iguala'ls.

8. **Quan una regla és una convenció pedagògica i no una restricció matemàtica estricta** (p. ex. "d'esquerra a dreta" en sumes/restes és una recomanació, no obligatori, perquè la suma és commutativa — a diferència de multiplicació/divisió, que sí que ho és per la no-commutativitat de la divisió), **no ho implementis mai com una prohibició rígida.** Permet qualsevol ordre matemàticament vàlid i, si convé, mostra només un avís informatiu no bloquejant.

9. **Evita l'"efecte trampa" fàcil**: si es pot llegir la resposta directament d'un text pla sense passar pel raonament que la interacció hauria d'ensenyar (p. ex. mostrar el número sencer com a text mentre s'espera que l'alumne el llegeixi geomètricament d'una recta), amaga o retarda aquesta informació.

10. **Quan facis un redisseny complet a petició de l'usuari, considera-hi genuïnament conceptes diferents**, no una variació cosmètica del mateix mecanisme. Si cal, usa `AskUserQuestion` per presentar 3-4 conceptes clarament diferenciats (amb la mecànica descrita, no només el nom) i deixa que l'usuari triï abans d'implementar — estalvia rondes senceres de feedback negatiu.

## 6. Procés obligatori de disseny previ a la implementació (per a CADA càpsula, sense excepcions)

**Els principis de la secció 5 no serveixen de res si no s'apliquen abans d'escriure codi.** Bona part dels problemes d'aquest projecte no van venir de principis mal entesos, sinó del fet que moltes càpsules es van especificar amb una descripció de poques línies ("fes un element interactiu per practicar potències") i es va passar directament a implementar-la — sovint delegant-la a un agent en un lot junt amb 3-5 càpsules més, totes tractades amb el mateix nivell superficial d'atenció perquè cap d'elles tenia un disseny detallat previ. El resultat: mecàniques tècnicament funcionals però pedagògicament buides, que després van necessitar 2-4 rondes senceres de feedback per arribar a un nivell acceptable. Aquesta secció existeix per convertir en un pas **obligatori i innegociable** el que en les últimes rondes d'aquest projecte vam acabar fent bé de manera ad hoc.

**Regla**: cap càpsula ni element interactiu — ni tan sols el que sembli "senzill" o secundari dins un lot — passa a implementació sense haver respost per escrit, ABANS d'escriure una sola línia de codi, aquestes cinc preguntes:

1. **Mètode escrit**: quin és, pas a pas, el mètode que un professor escriuria a la pissarra per a aquest contingut? Si no n'hi ha cap de formal, digues-ho explícitament — és una excepció legítima, no un oblit.
2. **Mecànica exacta**: quin gest físic fa l'alumne (arrossegar què, cap on, amb quina granularitat/snap), què es calcula i es mostra a cada instant del gest (no només al final), i com se sap inequívocament que l'objectiu s'ha assolit.
3. **Connexió gest→resposta**: com passa el valor arrossegat/manipulat a esdevenir la resposta enviada. Si la resposta final es tecleja de manera independent del gest, explica concretament per què el gest aporta alguna cosa igualment. Si no en trobes cap raó real, el disseny és decoratiu i s'ha de repensar abans de continuar.
4. **Alternatives considerades**: com a mínim 2 mecàniques diferents que s'han descartat i per què. Si només se t'acut una idea, encara no has pensat prou l'element.
5. **Explora vs. Repte**: en què difereix concretament el comportament entre els dos modes. No acceptis "és igual" com a resposta per defecte sense justificar-ho.

Si hi ha ambigüitat real de disseny (més d'una mecànica raonable), presenta-les amb `AskUserQuestion`, cadascuna descrita amb la mecànica concreta (no un eslògan de 2-3 paraules), i deixa que l'usuari triï abans d'implementar. Si no hi ha ambigüitat, escriu igualment les 5 respostes en la teva resposta a l'usuari abans de tocar cap fitxer — ha de quedar una oportunitat real de correcció abans d'invertir temps a implementar-ho, no només després de veure el resultat acabat.

**Prioritat igual per a tot el lot**: cap càpsula d'un mateix bloc rep menys atenció que les altres per defecte, encara que sembli menys "interessant". Si cal repartir feina entre agents delegats, cada agent rep NOMÉS 1 (com a molt 2 d'estretament relacionades) càpsula, amb el seu mini-spec de 5 punts ja redactat i inclòs al prompt de l'agent — mai un lot de 4-6 càpsules amb una frase cadascuna esperant que l'agent ompli els buits pel seu compte. Un lot gran de descripcions curtes és exactament el patró que va produir les càpsules poc enriquides la primera vegada.

## 7. Bugs tècnics recurrents a vigilar (checklist ràpida)

- [ ] Cap de bonificació de temps del Repte relatiu a `repteMaxTime`, no a una constant (`Math.min(90,...)`).
- [ ] Reset complet dels estils inline (`style.display=''`) en tornar d'Repte a Explora.
- [ ] `ctx.arcTo`/`roundRect` amb un radi de cantonada MÉS GRAN que la meitat de l'amplada o alçada del rectangle produeix formes punxegudes/en estrella — sempre `r = Math.min(w,h)/2` per a una píndola completament arrodonida, mai un valor fix arbitrari com `100`.
- [ ] Text d'un objectiu de quiz que es genera un cop i no es torna a sincronitzar quan canvien altres paràmetres (producte, N, mode) — refresca'l (o la funció que el regenera) en CADA canvi d'estat rellevant, i centralitza la visibilitat del panell de resposta en una única funció que es crida sempre.
- [ ] Element de feedback compartit entre dues rondes de Repte diferents que en realitat viu dins d'un panell ocult per a una de les dues rondes — comprova que el missatge apareix al panell que realment és visible.
- [ ] Indexació "posició barrejada" vs. "posició seqüencial de joc" als punts de progrés de les fitxes.
- [ ] Ronda automàtica avançada per `setTimeout` després d'un encert (p. ex. "espera 1s i genera'n una de nova"): guarda una referència ("snapshot") a la ronda actual abans del `setTimeout` i comprova que encara és la mateixa quan es dispara — si no, pot avançar una ronda fantasma quan l'usuari ja ha sortit del Repte o n'ha començat una altra manualment mentrestant:
  ```js
  const roundSnapshot = rpState;
  setTimeout(() => { if (timer && rpState === roundSnapshot) newRepteRound(); }, 1100);
  ```
- [ ] Càpsules amb **més d'un submode independent dins el mateix Repte** (p. ex. sistemes-numeracio.html amb base 10 / romans / binari) necessiten una variable `repteMaxTime` (i `timer`/`timeLeft`) **per submode**, no una de global compartida — si no, el cap de temps de la secció 4 es corregeix per a un submode i es queda trencat als altres.
- [ ] **`touchcancel` no gestionat.** Cap de les 12 càpsules el tenia. En tauleta —el dispositiu real del públic objectiu— un gest interromput pel sistema (notificació, gest de vora, rebuig de palmell) dispara `touchcancel` i **mai** `touchend`: l'estat `dragging` quedava encallat a `true` per sempre i l'element seguia el dit sense prémer. Registra sempre el final de gest a totes les vies (`A11y.bindGestureEnd`), i si l'afegeixes dins d'un closure de drag, **assegura't que el `removeEventListener` corresponent també hi és** o deixaràs una fuita.
- [ ] **`pointerXY` sense `changedTouches`.** A `touchend`/`touchcancel` la llista `e.touches` ja és BUIDA: les coordenades només viuen a `e.changedTouches`. Amb `e.touches[0]` s'obté `undefined` i llegir-ne `clientX` peta. Cobreix sempre les dues branques.
- [ ] **Bucles `requestAnimationFrame` sense guarda de reentrada.** Un `trigger…()` que faci `requestAnimationFrame(tick)` sense comprovar si ja n'hi ha un d'actiu engega un bucle NOU a cada crida: 25 clics ràpids = 25 bucles concurrents cridant `draw()`. Guarda sempre amb un flag (`if (running) return;`) i ofereix un `stop…()` amb `cancelAnimationFrame`.
- [ ] **Zona morta temporal (TDZ) en registrar controls a l'inici.** Un `A11y.makeCanvasSlider(...)` col·locat a mitja pàgina crida `get()` immediatament per sincronitzar l'ARIA; si aquesta funció llegeix una variable declarada amb `let` **més avall** al mateix script, salta `ReferenceError: Cannot access 'X' before initialization` i el registre sencer es perd en silenci (el canvas es queda sense `role`). Registra aquests controls **al final de l'script**, i si has de guardar-ne la referència per cridar-la abans, declara-la aviat (`let slider = null;`) en comptes de `const` a baix.
- [ ] `let`/`const` de nivell superior en un `<script>` no surten a `Object.keys(window)` però sí que són referenciables per nom des de codi injectat després — útil per depurar via consola/eina de navegador sense haver de canviar el codi font a `var`.

## 8. Flux de verificació obligatori (no negociable)

**"Zero errors de consola" NO és suficient per marcar una tasca com a feta.** Per a cada interacció nova o modificada:

1. Munta un servidor local (`python3 -m http.server`) i obre-la de debò en un navegador (eina de Browser), mai només llegint el codi.
2. Genera desenes/centenes de rondes aleatòries via consola/injecció JS i verifica matemàticament que l'objectiu és sempre correcte i assolible (`for (let i=0;i<500;i++) { const st = gen...(); assert(...) }`).
3. Simula el cicle complet arrossegar → encaixar (snap) → auto-emplenar → Comprova, tant a Explora com a Repte.
4. Prova casos extrems (valors mínim/màxim del control, factor 0, arrossegar fora de rang) i comprova que queden acotats sense trencar-se.
5. Comprova el "leak check": entra a Repte, surt a Explora, i verifica que no queden estils inline residuals ni classes `mode-repte` penjades.
6. Sempre que sigui possible, complementa les crides directes a funcions internes amb un event real dispatxat (`left_click_drag`, `MouseEvent` a coordenades calculades) — no confiïs només en trucar `applyXxxDrag()` a mà, ja que això s'salta el hit-testing real dels handlers `onCanvasDown/Move`.
7. No donis mai per bo l'autoinforme d'un subagent delegat: torna a llegir el fitxer resultant i repeteix tu mateix els passos 1-6.

## 9. Recursos complementaris: cerca a GeoGebra abans de tancar el projecte

**Quan:** com a últim pas, un cop tot el web està construït i verificat (secció 8) — no capsula a capsula durant la construcció. És un polit final, no una tasca de disseny.

**Per què:** GeoGebra té una biblioteca enorme de recursos interactius de matemàtiques curats per professors. Per a cada concepte que treballa una càpsula, sol existir-hi algun material —d'un enfocament similar o que amplia el que fem nosaltres— que val la pena enllaçar com a pràctica addicional. En aquest projecte, aquesta cerca també va servir per validar disseny propi (el mode "Factores juntos" d'un recurs de MCM/MCD confirmava que la nostra escala de divisions simultànies és el camí correcte) i per detectar contingut que ens faltava (l'aproximació geomètrica a arrels no exactes, que la nostra càpsula encara no cobreix).

**Com fer la cerca:** per cada càpsula, cerca a `site:geogebra.org` amb el nom del concepte en castellà/català (el gruix de contingut educatiu de GeoGebra en espanyol és molt més ampli que en català) i **obre cada resultat abans d'incloure'l** — alguns enllaços de cerca poden estar trencats (404) o no ser el que el títol prometia; no confiïs mai només en el títol/snippet de cerca.

**Com incloure'l a la càpsula** (patró exacte usat en aquest projecte):
- Classe CSS compartida `.geogebra-link` ja definida a `assets/styles.css` — discreta (vora discontínua, color atenuat per defecte), mai un banner cridaner, perquè quedi clar que és un recurs addicional opcional, no part de la lliçó.
- Es col·loca just després del `.note-box`, dins `.info-side`, abans del seu `</div>` de tancament — és a dir, al final de tot de la columna de referència, sense ocupar espai a la zona interactiva:
  ```html
  <a class="geogebra-link" href="<URL del recurs>" target="_blank" rel="noopener">
    <span class="gg-icon">🧮</span> Practica a GeoGebra: <strong>Nom del recurs en català</strong>
    <span class="gg-arrow">↗</span>
  </a>
  ```
- **El nom del recurs es mostra sempre traduït al català**, encara que el títol original a GeoGebra sigui en castellà.
- Només se n'afegeix un si hi ha un recurs genuïnament rellevant — no forcis un enllaç fluix només perquè totes les altres càpsules en tenen un.
- Mostra a l'usuari una llista dels enllaços que has trobat **abans** d'implementar-los.

## 10. Procés de col·laboració amb l'usuari (aquest projecte)

- L'usuari revisa el producte final interactuant-hi de debò (no només llegint descripcions) i dona feedback molt concret amb captures de pantalla — pren-t'ho seriosament i verifica exactament l'escenari mostrat, no una versió aproximada.
- Quan diu "millor però encara no prou / segueix sense ser útil", **no facis un pedaç petit**: torna a preguntar-te si la mecànica de fons és la correcta, no només si cal ajustar paràmetres.
- Per triar entre diverses direccions de disseny genuïnament diferents, usa `AskUserQuestion` amb opcions ben descrites (mecànica concreta, no eslògan) i una recomanada — estalvia cicles.
- Per redissenys grans de blocs sencers de contingut, delegar a un agent en background és vàlid, però **la verificació final és sempre responsabilitat pròpia**, incloent-hi proves matemàtiques exhaustives i interacció real al navegador.
- Preferència de resposta: directa, sense floritures, amb els fitxers/línies concrets tocats. Els resums finals han de ser breus (què ha canviat + què queda pendent), no una narració pas a pas del procés.
- Quan es tanca una fase de treball ("hem arribat al final, per ara"), és un bon moment per consolidar aprenentatges en un document com aquest — no cal esperar que ho demani una segona vegada la propera vegada.

## 11. Adaptar aquest document a un nou curs/matèria

Per crear "Càlcul 2n ESO", "Àlgebra 4t ESO", etc.:

1. Copia l'estructura de directoris i els 2 fitxers compartits (`styles.css`, `hero-anim.js`) tal qual, o amb una paleta nova si es vol diferenciar visualment el curs. Aprofita per afegir-hi un tercer fitxer compartit, `assets/canvas-helpers.js` (`roundRect`, `txt`, `clamp`, `fmt`, `hexToRgba`, `flash`, `pointerXY`, factory de `resize`), en lloc de redeclarar-los a cada càpsula com en aquest projecte.
2. Defineix els blocs temàtics del currículum oficial d'aquell curs/matèria. Centra't en els elements claus on un element visual, una explicació ràpida o un lloc de pràctica siguin especialment útils. No volem cobrir-ho tot, sinó reforçar punts concrets amb cada càpsula.
3. Per cada tema, abans d'escriure cap línia de codi, respon per escrit les 5 preguntes de la secció 6 (mètode escrit, mecànica exacta, connexió gest→resposta, alternatives considerades, Explora vs. Repte) — mai una descripció de dues línies.
4. Aplica directament els principis de la secció 5 i la checklist de la secció 7 des del primer esborrany.
5. Segueix el flux de verificació de la secció 8 abans de donar per acabada cada càpsula, sense excepcions per mida o prioritat percebuda.
6. Si vols recollir resultats de les fitxes (recomanat), fes la configuració manual descrita a "Excepció al «sense backend»" (secció 2) ABANS de copiar el codi de `_enviarRegistre`/`APPS_SCRIPT_URL` a cada fitxa nova: full de Sheets propi, desplegament d'Apps Script propi, URL nova. Pregunta l'usuari si vol fer servir el mateix full o un d'existent.
7. Com a últim pas, un cop tot el web estigui construït i verificat, fes la cerca de recursos complementaris a GeoGebra descrita a la secció 9 i afegeix els enllaços "Practica a GeoGebra" que trobis genuïnament rellevants.
