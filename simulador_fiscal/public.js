/**
 * public.js
 * Lògica d'interfície del web PÚBLIC (index.html) del Simulador Fiscal Educatiu.
 * Fa servir DADES_SIMULACIO i generarPais() de configuracio.js / generador.js,
 * i totes les funcions de càlcul de motor-fiscal.js.
 *
 * REGLA D'OR: aquest fitxer MAI calcula la recaptació total del país a partir
 * dels impostos. Cada impost es mostra sempre per separat, individualment.
 * (El pressupost departamental sí és editable, però el total el proposa
 * l'alumne a mà — no surt de sumar les quotes fiscals.)
 *
 * Tots els camps numèrics comencen SEMPRE buits (només amb un placeholder
 * d'exemple) — l'alumne ha de proposar-ho tot ell mateix, no hi ha valors
 * per defecte enlloc de la interfície.
 */

// ---------------------------------------------------------------
// ESTAT GLOBAL
// ---------------------------------------------------------------
const estat = {
    pais: null,
    dificultat: 'normal',
    numTrams: 3,
    perfilSeleccionat: null,
    subtabActiu: 'irpf',
    chart: null
};

const ICONES_DEPARTAMENTS = {
    sanitat:          { nom: 'Sanitat',          icona: '🏥' },
    educacio:         { nom: 'Educació',         icona: '🎓' },
    seguretat:        { nom: 'Seguretat',        icona: '🛡️' },
    foment:           { nom: 'Foment',           icona: '🏗️' },
    serveis_socials:  { nom: 'Serveis Socials',  icona: '🤝' },
    cultura:          { nom: 'Cultura',          icona: '🎭' },
    justicia:         { nom: 'Justícia',         icona: '⚖️' },
    medi_ambient:     { nom: 'Medi Ambient',     icona: '🌳' },
    habitatge:        { nom: 'Habitatge',        icona: '🏠' }
};

// Missatges de conseqüència PER DEPARTAMENT i per nivell assolit.
// {lloc} s'substitueix pel nom del país/ciutat generat.
const MISSATGES_DEPARTAMENT = {
    sanitat: {
        catastrofe: "🚨 Col·lapse sanitari a {lloc}: les urgències desborden i la gent espera hores al carrer.",
        ajustat: "😬 Sanitat molt justa a {lloc}: les llistes d'espera no paren de créixer.",
        normal: "🙂 La sanitat de {lloc} funciona amb normalitat, sense grans queixes.",
        optim: "😀 {lloc} té una sanitat de referència: llistes curtes i bon material.",
        excellencia: "✨ Sanitat d'excel·lència a {lloc}: hospitals capdavanters que atrauen pacients d'altres llocs."
    },
    educacio: {
        catastrofe: "🚨 Crisi educativa a {lloc}: aules superpoblades i professorat que plega.",
        ajustat: "😬 Educació ajustada a {lloc}: falten recursos, però les escoles es mantenen obertes.",
        normal: "🙂 L'educació de {lloc} compleix amb normalitat el currículum.",
        optim: "😀 Escoles ben dotades a {lloc}: ràtios baixes i bons resultats acadèmics.",
        excellencia: "✨ Sistema educatiu d'excel·lència a {lloc}: referent en innovació pedagògica."
    },
    seguretat: {
        catastrofe: "🚨 Inseguretat descontrolada a {lloc}: la delinqüència es dispara i la policia no dona l'abast.",
        ajustat: "😬 Seguretat justa a {lloc}: pocs efectius per cobrir tot el territori.",
        normal: "🙂 {lloc} manté un nivell de seguretat normal i controlat.",
        optim: "😀 {lloc} és un dels llocs més segurs de la regió.",
        excellencia: "✨ Seguretat exemplar a {lloc}: la delinqüència és pràcticament inexistent."
    },
    foment: {
        catastrofe: "🚨 Infraestructures en ruïnes a {lloc}: carreteres plenes de sotracs i talls constants.",
        ajustat: "😬 Manteniment mínim a {lloc}: les infraestructures es van fent malbé lentament.",
        normal: "🙂 Les infraestructures de {lloc} es mantenen en un estat correcte.",
        optim: "😀 {lloc} inverteix bé en infraestructures modernes i ben connectades.",
        excellencia: "✨ {lloc} és un model d'infraestructures de primer nivell."
    },
    serveis_socials: {
        catastrofe: "🚨 Xarxa social trencada a {lloc}: la gent gran i les famílies vulnerables queden desateses.",
        ajustat: "😬 Serveis socials sota mínims a {lloc}: llargues llistes d'espera per a ajudes bàsiques.",
        normal: "🙂 Els serveis socials de {lloc} atenen els casos amb normalitat.",
        optim: "😀 {lloc} té una bona xarxa de suport social i acompanyament.",
        excellencia: "✨ Model de referència en serveis socials: {lloc} no deixa ningú enrere."
    },
    cultura: {
        catastrofe: "🚨 Vida cultural apagada a {lloc}: tanquen biblioteques, museus i sales.",
        ajustat: "😬 Cultura amb el mínim indispensable a {lloc}: poca oferta i pressupost ajustat.",
        normal: "🙂 {lloc} manté una oferta cultural normal i estable.",
        optim: "😀 {lloc} té una escena cultural vibrant, amb festivals i activitats regulars.",
        excellencia: "✨ {lloc} es converteix en referent cultural que atrau visitants de tot arreu."
    },
    justicia: {
        catastrofe: "🚨 Col·lapse judicial a {lloc}: els casos triguen anys a resoldre's.",
        ajustat: "😬 Jutjats saturats a {lloc}: la justícia funciona, però amb molts endarreriments.",
        normal: "🙂 El sistema judicial de {lloc} resol els casos en terminis raonables.",
        optim: "😀 Justícia àgil a {lloc}: pocs endarreriments i bon accés als tribunals.",
        excellencia: "✨ {lloc} té un sistema judicial exemplar, ràpid i de plena confiança ciutadana."
    },
    medi_ambient: {
        catastrofe: "🚨 Emergència ambiental a {lloc}: contaminació i espais naturals abandonats.",
        ajustat: "😬 Protecció ambiental mínima a {lloc}: els problemes ambientals es van acumulant.",
        normal: "🙂 {lloc} manté uns nivells ambientals correctes i estables.",
        optim: "😀 {lloc} cuida bé el seu entorn: parcs, reciclatge i aire net.",
        excellencia: "✨ {lloc} és un model de sostenibilitat ambiental, admirat arreu."
    },
    habitatge: {
        catastrofe: "🚨 Emergència habitacional a {lloc}: lloguers disparats i famílies sense casa.",
        ajustat: "😬 Habitatge just a {lloc}: pocs pisos assequibles i llistes d'espera llargues.",
        normal: "🙂 El mercat de l'habitatge de {lloc} es manté estable.",
        optim: "😀 {lloc} té una bona oferta d'habitatge assequible.",
        excellencia: "✨ {lloc} resol l'accés a l'habitatge de manera exemplar."
    }
};

const COLORS_CHART = ['#2B3A67', '#C9971F', '#157F5C', '#C43D3D', '#4A5B94', '#8F2727', '#0E5C42', '#4A3868', '#8A6816'];

// Quin "impost" del motor de regles correspon a quina subpestanya de la interfície
const IMPOST_A_SECCIO = {
    irpf: 'irpf',
    patrimoni: 'patrimoni',
    iva_basic: 'iva',
    iva_normal: 'iva',
    iva_luxe: 'iva'
};
const NOM_SECCIO = { irpf: "de l'IRPF", patrimoni: 'del Patrimoni', iva: "de l'IVA" };

function interpolar(text, lloc) {
    return text.replace(/\{lloc\}/g, lloc);
}

// ---------------------------------------------------------------
// INICIALITZACIÓ
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-generar').addEventListener('click', generarPaisHandler);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => canviarPestanya(btn.dataset.tab));
    });

    document.querySelectorAll('#subtabs-impostos .subtab-btn').forEach(btn => {
        btn.addEventListener('click', () => canviarSubtab(btn.dataset.subtab));
    });

    document.getElementById('pressupost-total').addEventListener('input', recalcularDepartaments);
});

function canviarPestanya(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

/** Buida els camps d'una secció d'impost (usat en canviar de subpestanya) */
function netejarCampsSeccio(seccio) {
    if (seccio === 'irpf') {
        for (let i = 0; i < estat.numTrams; i++) {
            const desde = document.getElementById(`irpf-desde-${i}`);
            const pct = document.getElementById(`irpf-pct-${i}`);
            if (desde) desde.value = '';
            if (pct) pct.value = '';
        }
    } else if (seccio === 'patrimoni') {
        document.getElementById('patrimoni-minim').value = '';
        document.getElementById('patrimoni-pct').value = '';
    } else if (seccio === 'iva') {
        document.getElementById('iva-basic').value = '';
        document.getElementById('iva-normal').value = '';
        document.getElementById('iva-luxe').value = '';
    }
}

function canviarSubtab(subtab) {
    // En canviar d'impost, s'esborren els valors de la RESTA d'impostos:
    // cada subpestanya s'analitza sempre de manera aïllada.
    ['irpf', 'patrimoni', 'iva'].filter(s => s !== subtab).forEach(netejarCampsSeccio);

    estat.subtabActiu = subtab;
    document.querySelectorAll('#subtabs-impostos .subtab-btn').forEach(b => b.classList.toggle('active', b.dataset.subtab === subtab));
    ['irpf', 'patrimoni', 'iva'].forEach(s => {
        document.getElementById(`subtab-${s}`).classList.toggle('hidden', s !== subtab);
    });

    if (estat.pais) recalcularPerfilSeleccionat();
}

// ---------------------------------------------------------------
// GENERACIÓ DEL PAÍS
// ---------------------------------------------------------------
function generarPaisHandler() {
    const llavor = parseInt(document.getElementById('input-llavor').value) || 0;
    const dificultat = document.getElementById('select-dificultat').value;

    const pais = generarPais(llavor, dificultat);

    estat.pais = pais;
    estat.dificultat = dificultat;
    estat.numTrams = numTramsPerDificultat(dificultat);
    estat.perfilSeleccionat = pais.demografia[0].perfil;

    renderDemografia(pais, dificultat);
    document.getElementById('pista-laboratori').textContent = pais.metadades.pista_sociologica;
    renderFormularisImpostos(dificultat);
    renderSelectorPerfils(pais);
    canviarSubtab('irpf');

    inicialitzarDepartaments(pais);

    document.getElementById('demografia-buida').classList.add('hidden');
    document.getElementById('demografia-resultat').classList.remove('hidden');
    document.getElementById('laboratori-buit').classList.add('hidden');
    document.getElementById('laboratori-contingut').classList.remove('hidden');
    document.getElementById('departaments-buit').classList.add('hidden');
    document.getElementById('departaments-contingut').classList.remove('hidden');

    const badge = document.getElementById('pais-badge');
    badge.classList.remove('hidden');
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-exit inline-block"></span> ${pais.metadades.nom_ubicacio}`;
}

// ---------------------------------------------------------------
// PESTANYA A · PAÍS: VISIÓ GENERAL
// ---------------------------------------------------------------
function renderDemografia(pais, dificultat) {
    document.getElementById('nom-pais').textContent = pais.metadades.nom_ubicacio;
    document.getElementById('dificultat-label').textContent =
        dificultat === 'normal' ? 'Normal' : (dificultat === 'dificil' ? 'Difícil' : 'Repte');
    document.getElementById('poblacio-total').textContent = formatNumero(pais.metadades.poblacio_total);
    document.getElementById('pista-sociologica').textContent = pais.metadades.pista_sociologica;

    const ctx = document.getElementById('chart-demografia');
    if (estat.chart) estat.chart.destroy();
    estat.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: pais.demografia.map(p => p.perfil),
            datasets: [{
                data: pais.demografia.map(p => p.percentatge),
                backgroundColor: COLORS_CHART,
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, boxWidth: 10, padding: 12 } },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw}%` } }
            }
        }
    });

    const cont = document.getElementById('targetes-poblacio');
    cont.innerHTML = '';
    pais.demografia.forEach((perfil, i) => {
        const eco = perfil.economia_anual;
        const color = COLORS_CHART[i % COLORS_CHART.length];
        const card = document.createElement('div');
        card.className = 'card p-5';
        card.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <p class="font-display font-semibold text-sm">${perfil.perfil}</p>
                <span class="text-xs font-mono-num font-semibold px-2 py-0.5 rounded-full" style="background:${color}22; color:${color}">${perfil.percentatge}%</span>
            </div>
            <p class="text-xs text-ink/40 mb-3 font-mono-num">${formatNumero(perfil.poblacio_absoluta)} persones</p>
            <div class="space-y-1.5 text-sm">
                <div class="flex justify-between"><span class="text-ink/50">Ingressos anuals</span><span class="font-mono-num font-semibold">${formatEuros(eco.ingressos)}</span></div>
                <div class="flex justify-between"><span class="text-ink/50">Patrimoni</span><span class="font-mono-num font-semibold">${formatEuros(eco.patrimoni)}</span></div>
                <div class="pt-2 mt-1 border-t border-ink/10 space-y-1">
                    <div class="flex justify-between text-xs"><span class="text-ink/40">Despeses bàsiques</span><span class="font-mono-num">${formatEuros(eco.despeses.basiques)}</span></div>
                    <div class="flex justify-between text-xs"><span class="text-ink/40">Despeses normals</span><span class="font-mono-num">${formatEuros(eco.despeses.normals)}</span></div>
                    <div class="flex justify-between text-xs"><span class="text-ink/40">Despeses de luxe</span><span class="font-mono-num">${formatEuros(eco.despeses.luxe)}</span></div>
                </div>
            </div>
        `;
        cont.appendChild(card);
    });
}

// ---------------------------------------------------------------
// PESTANYA B · SISTEMA TRIBUTARI (3 subpestanyes independents)
// ---------------------------------------------------------------
function renderFormularisImpostos(dificultat) {
    const numTrams = numTramsPerDificultat(dificultat);
    const tramsSuggerits = tramsIRPFPerDefecte(dificultat); // NOMÉS per suggerir el placeholder

    const cont = document.getElementById('trams-irpf');
    cont.innerHTML = '';
    for (let i = 0; i < numTrams; i++) {
        const fila = document.createElement('div');
        fila.className = 'grid grid-cols-2 gap-2 items-center';
        fila.innerHTML = `
            <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/30">des de</span>
                <input id="irpf-desde-${i}" type="number" class="field w-full pl-16 pr-3 py-2 text-sm text-right" placeholder="Ex: ${tramsSuggerits[i].desde}">
            </div>
            <div class="relative">
                <input id="irpf-pct-${i}" type="number" step="0.5" class="field w-full pl-3 pr-7 py-2 text-sm text-right" placeholder="Ex: ${tramsSuggerits[i].percentatge}">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/30">%</span>
            </div>
        `;
        cont.appendChild(fila);
    }

    // Patrimoni i IVA ja porten el placeholder fix a l'HTML; només ens assegurem
    // que comencen buits (per si venim d'una generació anterior de país).
    ['patrimoni-minim', 'patrimoni-pct', 'iva-basic', 'iva-normal', 'iva-luxe'].forEach(id => {
        document.getElementById(id).value = '';
    });

    // Qualsevol canvi a QUALSEVOL impost recalcula els 3 blocs (cadascú mostra només el seu)
    const tots = [
        ...cont.querySelectorAll('input'),
        document.getElementById('patrimoni-minim'), document.getElementById('patrimoni-pct'),
        document.getElementById('iva-basic'), document.getElementById('iva-normal'), document.getElementById('iva-luxe')
    ];
    tots.forEach(input => input.addEventListener('input', recalcularPerfilSeleccionat));
}

function renderSelectorPerfils(pais) {
    const cont = document.getElementById('selector-perfils');
    cont.innerHTML = '';
    pais.demografia.forEach(perfil => {
        const chip = document.createElement('button');
        chip.className = 'profile-chip px-4 py-2 rounded-full text-sm font-semibold border border-ink/10' +
            (perfil.perfil === estat.perfilSeleccionat ? ' selected' : '');
        chip.textContent = perfil.perfil;
        chip.addEventListener('click', () => {
            estat.perfilSeleccionat = perfil.perfil;
            cont.querySelectorAll('.profile-chip').forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            recalcularPerfilSeleccionat();
        });
        cont.appendChild(chip);
    });
}

function recalcularPerfilSeleccionat() {
    if (!estat.pais || !estat.perfilSeleccionat) return;

    const config = llegirConfiguracioImpostosDelDOM(estat.numTrams);
    const resultat = avaluarPerfil(estat.pais, estat.dificultat, estat.perfilSeleccionat, config);
    if (!resultat) return;

    renderSeccioImpost('irpf', resultat);
    renderSeccioImpost('patrimoni', resultat);
    renderSeccioImpost('iva', resultat);

    renderPactesSeccio(config);
}

/**
 * Renderitza UNA subpestanya (irpf | patrimoni | iva): la seva alerta pròpia
 * (o pista, si encara no s'ha disparat) i la seva fitxa amb NOMÉS la quota
 * d'aquest impost — mai un total combinat.
 */
function renderSeccioImpost(seccio, r) {
    const regla = r.regla;
    const causaSeccio = (regla && regla.afectat) ? IMPOST_A_SECCIO[regla.regla.impost] : null;
    const esAquestaLaCausa = causaSeccio === seccio;
    const disparada = regla && regla.disparada;

    renderAlertaSeccio(seccio, r, esAquestaLaCausa, disparada, causaSeccio);
    renderFitxaSeccio(seccio, r, causaSeccio, disparada);
}

function renderAlertaSeccio(seccio, r, esAquestaLaCausa, disparada, causaSeccio) {
    const banner = document.getElementById(`alerta-${seccio}`);
    const icona = banner.querySelector('.alerta-icona');
    const titol = banner.querySelector('.alerta-titol');
    const text = banner.querySelector('.alerta-text');
    const perque = banner.querySelector('.alerta-perque');

    banner.classList.remove(
        'bg-perill-light', 'text-perill-dark',
        'bg-exit-light', 'text-exit-dark',
        'bg-gold/15', 'text-gold-dark'
    );

    if (esAquestaLaCausa && disparada) {
        const esExit = SENTIMENT_SOCIOLOGIES[r.regla.sociologia.clau] === 'exit';
        banner.classList.add(esExit ? 'bg-exit-light' : 'bg-perill-light', esExit ? 'text-exit-dark' : 'text-perill-dark');
        icona.textContent = esExit ? '✅' : '⚠️';
        titol.textContent = esExit ? 'Efecte positiu activat' : 'Alerta econòmica activada!';
        text.textContent = r.regla.consequencia;
        perque.textContent = `Per què passa? ${estat.pais.metadades.pista_sociologica}`;
        banner.classList.add('show');
    } else if (esAquestaLaCausa && r.regla.afectat && !disparada) {
        banner.classList.add('bg-gold/15', 'text-gold-dark');
        icona.textContent = '👀';
        titol.textContent = 'Zona sensible';
        text.textContent = 'Aquest perfil és especialment sensible a com configuris aquest impost en aquest país. Segons cap a on el moguis, pot passar alguna cosa.';
        perque.textContent = `Pista del país: ${estat.pais.metadades.pista_sociologica}`;
        banner.classList.add('show');
    } else {
        banner.classList.remove('show');
    }
}

const COMPARACIONS_SECCIO = {
    irpf: [{ camp: 'ingressos', etiqueta: 'Ingressos' }],
    patrimoni: [{ camp: 'patrimoni', etiqueta: 'Patrimoni' }],
    iva: [
        { camp: 'despeses.basiques', etiqueta: 'Despeses bàsiques' },
        { camp: 'despeses.normals', etiqueta: 'Despeses normals' },
        { camp: 'despeses.luxe', etiqueta: 'Despeses de luxe' }
    ]
};

function llegirCamp(obj, path) {
    return path.split('.').reduce((acc, k) => acc[k], obj);
}

function renderFitxaSeccio(seccio, r, causaSeccio, disparada) {
    const cont = document.getElementById(`fitxa-${seccio}`);
    const esExit = disparada && r.regla.sociologia ? SENTIMENT_SOCIOLOGIES[r.regla.sociologia.clau] === 'exit' : false;
    const colorCanvi = esExit ? 'text-exit' : 'text-perill';

    const filesComparacio = COMPARACIONS_SECCIO[seccio].map(({ camp, etiqueta }) => {
        const original = llegirCamp(r.original, camp);
        const ajustat = llegirCamp(r.ajustat, camp);
        const canviat = original !== ajustat;
        const efecteIndirecte = canviat && causaSeccio && causaSeccio !== seccio;
        return `
            <div class="flex justify-between items-start text-sm py-1.5">
                <span class="text-ink/50">
                    ${etiqueta}
                    ${efecteIndirecte ? `<br><span class="text-[10px] text-gold-dark">↳ conseqüència ${NOM_SECCIO[causaSeccio]}</span>` : ''}
                </span>
                <span class="font-mono-num text-right ${canviat ? colorCanvi + ' font-semibold' : ''}">
                    ${canviat ? `<span class="line-through text-ink/30 mr-2 text-xs">${formatEuros(original)}</span>` : ''}${formatEuros(ajustat)}
                </span>
            </div>`;
    }).join('');

    const algunCanviAquestaSeccio = COMPARACIONS_SECCIO[seccio].some(
        ({ camp }) => llegirCamp(r.original, camp) !== llegirCamp(r.ajustat, camp)
    );

    let badge;
    if (causaSeccio === seccio && disparada) {
        badge = `<span class="text-xs font-semibold px-2.5 py-1 rounded-full ${esExit ? 'bg-exit-light text-exit-dark' : 'bg-perill-light text-perill-dark'}">llei activada</span>`;
    } else if (causaSeccio === seccio && r.regla.afectat) {
        badge = '<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/15 text-gold-dark">zona sensible</span>';
    } else if (algunCanviAquestaSeccio) {
        badge = '<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold/15 text-gold-dark">efecte indirecte</span>';
    } else {
        badge = '<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink/5 text-ink/40">sense efecte aquí</span>';
    }

    let blocQuota = '';
    if (seccio === 'irpf') {
        blocQuota = `
            <div class="flex justify-between text-xs text-ink/40 pt-2"><span>Tipus marginal</span><span class="font-mono-num">${r.irpf.tipusMarginal}%</span></div>
            <div class="flex justify-between text-xs text-ink/40 pb-2"><span>Tipus mitjà efectiu</span><span class="font-mono-num">${r.irpf.tipusMitja}%</span></div>
            <div class="pt-3 border-t border-ink/10 flex items-center justify-between">
                <p class="font-display font-semibold text-sm">Quota d'IRPF d'aquest individu</p>
                <p class="font-mono-num font-bold text-2xl text-institut stat-flip">${formatEuros(r.irpf.quota)}</p>
            </div>`;
    } else if (seccio === 'patrimoni') {
        blocQuota = `
            <div class="flex justify-between text-xs text-ink/40 pt-2 pb-2"><span>Base tributable</span><span class="font-mono-num">${formatEuros(r.patrimoni.baseTributable)}</span></div>
            <div class="pt-3 border-t border-ink/10 flex items-center justify-between">
                <p class="font-display font-semibold text-sm">Quota de Patrimoni d'aquest individu</p>
                <p class="font-mono-num font-bold text-2xl text-institut stat-flip">${formatEuros(r.patrimoni.quota)}</p>
            </div>`;
    } else {
        blocQuota = `
            <div class="space-y-1 pt-2 pb-2 text-xs text-ink/40">
                <div class="flex justify-between"><span>IVA sobre bàsiques</span><span class="font-mono-num">${formatEuros(r.iva.quotaBasica)}</span></div>
                <div class="flex justify-between"><span>IVA sobre normals</span><span class="font-mono-num">${formatEuros(r.iva.quotaNormal)}</span></div>
                <div class="flex justify-between"><span>IVA sobre luxe</span><span class="font-mono-num">${formatEuros(r.iva.quotaLuxe)}</span></div>
            </div>
            <div class="pt-3 border-t border-ink/10 flex items-center justify-between">
                <p class="font-display font-semibold text-sm">Quota d'IVA d'aquest individu</p>
                <p class="font-mono-num font-bold text-2xl text-institut stat-flip">${formatEuros(r.iva.total)}</p>
            </div>`;
    }

    cont.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <p class="font-display font-bold text-lg">${r.perfil}</p>
            ${badge}
        </div>
        <div class="mb-1">${filesComparacio}</div>
        ${blocQuota}
    `;
}

// ---------------------------------------------------------------
// PACTES DE PAÍS (advertències vàlides per a QUALSEVOL impost,
// independents del perfil seleccionat i de la sociologia)
// ---------------------------------------------------------------
function textEstatPacte(resultat) {
    if (resultat.fora) {
        return { text: `🚨 Pacte incomplert: ${resultat.missatge}`, classe: 'text-perill' };
    }
    return { text: '✅ Dins del pacte', classe: 'text-exit' };
}

function renderPactesSeccio(config) {
    if (!estat.pais) return;
    const pactes = avaluarPactes(estat.pais, config);

    renderPacteSimple('irpf', pactes.irpf);
    renderPacteSimple('patrimoni', pactes.patrimoni);
    renderPacteIva(pactes);
}

function renderPacteSimple(seccio, info) {
    const cont = document.getElementById(`pacte-${seccio}`);
    cont.querySelector('.pacte-descripcio').textContent = info.pacte.descripcio;
    const { text, classe } = textEstatPacte(info.resultat);
    const estatEl = cont.querySelector('.pacte-estat');
    estatEl.textContent = text;
    estatEl.className = 'pacte-estat text-sm font-semibold ' + classe;
    cont.classList.remove('ok', 'fora');
    cont.classList.add(info.resultat.fora ? 'fora' : 'ok');
}

function renderPacteIva(pactes) {
    const cont = document.getElementById('pacte-iva');
    ['iva_basic', 'iva_normal', 'iva_luxe'].forEach(cat => {
        const fila = cont.querySelector(`.pacte-fila[data-cat="${cat}"]`);
        fila.querySelector('.pacte-descripcio').textContent = pactes[cat].pacte.descripcio;
        const { text, classe } = textEstatPacte(pactes[cat].resultat);
        const estatEl = fila.querySelector('.pacte-estat');
        estatEl.textContent = text;
        estatEl.className = 'pacte-estat text-sm font-semibold ' + classe;
    });
}

// ---------------------------------------------------------------
// PESTANYA C · PRESSUPOST GENERAL (pressupost editable, multi-departament)
// ---------------------------------------------------------------
function avaluarNivellPressupost(valor, nivells) {
    if (valor < nivells.minim) return { tier: 'catastrofe', classes: 'bg-perill-light text-perill-dark' };
    if (valor < nivells.normal) return { tier: 'ajustat', classes: 'bg-gold/15 text-gold-dark' };
    if (valor < nivells.optim) return { tier: 'normal', classes: 'bg-institut/10 text-institut' };
    if (valor < nivells.excellencia) return { tier: 'optim', classes: 'bg-exit-light text-exit-dark' };
    return { tier: 'excellencia', classes: 'bg-exit text-white ring-2 ring-gold' };
}

function miniNivell(etiqueta, valor, actiu) {
    return `
        <div class="rounded-lg px-1.5 py-1.5 text-center ${actiu ? 'bg-institut text-white' : 'bg-paper text-ink/40'}">
            <p class="text-[9px] font-semibold uppercase tracking-wide">${etiqueta}</p>
            <p class="font-mono-num text-[10px] mt-0.5">${formatEuros(valor)}</p>
        </div>`;
}

function inicialitzarDepartaments(pais) {
    document.getElementById('pressupost-total').value = '';

    const claus = Object.keys(pais.pressupostos_departaments);

    document.getElementById('pressupost-any-anterior-valor').textContent = formatEuros(pais.pressupost_any_anterior);
    document.getElementById('pressupost-any-anterior-explicacio').textContent =
        `${pais.metadades.nom_ubicacio} va destinar aquesta quantitat al conjunt de departaments l'any passat.`;

    crearInputsPercentatgesDepartaments(claus);
    crearTargetesDepartaments(claus);
    recalcularDepartaments();
}

function crearInputsPercentatgesDepartaments(claus) {
    const cont = document.getElementById('pct-departaments-inputs');
    cont.innerHTML = '';
    claus.forEach(clau => {
        const info = ICONES_DEPARTAMENTS[clau] || { nom: clau, icona: '📁' };
        const div = document.createElement('div');
        div.innerHTML = `
            <label class="block text-xs text-ink/50 mb-1">${info.icona} ${info.nom} %</label>
            <input id="pct-${clau}" type="number" min="0" max="100" class="field w-full px-3 py-2 text-sm" placeholder="Ex: 25">
        `;
        cont.appendChild(div);
    });
    claus.forEach(clau => {
        document.getElementById(`pct-${clau}`).addEventListener('input', recalcularDepartaments);
    });
}

function crearTargetesDepartaments(claus) {
    const cont = document.getElementById('departaments-targetes');
    cont.innerHTML = '';
    claus.forEach(clau => {
        const info = ICONES_DEPARTAMENTS[clau] || { nom: clau, icona: '📁' };
        const card = document.createElement('div');
        card.className = 'card p-6';
        card.dataset.dept = clau;
        card.innerHTML = `
            <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">${info.icona}</span>
                <p class="font-display font-bold text-lg">${info.nom}</p>
            </div>
            <div class="mb-3">
                <p class="text-xs uppercase tracking-wide text-ink/40">Assignat aquest any</p>
                <p class="valor font-mono-num font-bold text-2xl text-institut stat-flip">—</p>
                <p class="pctlabel text-xs text-ink/40 mt-0.5"></p>
            </div>
            <div class="verdicte rounded-xl p-3 text-sm font-semibold mb-4"></div>
            <div class="escala grid grid-cols-4 gap-1.5"></div>
        `;
        cont.appendChild(card);
    });
}

function recalcularDepartaments() {
    if (!estat.pais) return;

    const claus = Object.keys(estat.pais.pressupostos_departaments);
    const total = parseFloat(document.getElementById('pressupost-total').value) || 0;
    const anyAnterior = estat.pais.pressupost_any_anterior;

    const comparativaEl = document.getElementById('comparativa-any-anterior');
    comparativaEl.classList.remove('bg-exit-light', 'text-exit-dark', 'bg-perill-light', 'text-perill-dark', 'bg-ink/5', 'text-ink/40');
    if (total === 0) {
        comparativaEl.textContent = "Introdueix un pressupost per comparar-lo amb l'any anterior";
        comparativaEl.classList.add('bg-ink/5', 'text-ink/40');
    } else {
        const diferencia = ((total - anyAnterior) / anyAnterior) * 100;
        const signe = diferencia >= 0 ? '+' : '';
        comparativaEl.textContent = `${signe}${diferencia.toFixed(1)}% respecte l'any anterior`;
        comparativaEl.classList.add(diferencia >= 0 ? 'bg-exit-light' : 'bg-perill-light', diferencia >= 0 ? 'text-exit-dark' : 'text-perill-dark');
    }

    claus.forEach(clau => {
        const pct = parseFloat(document.getElementById(`pct-${clau}`).value) || 0;
        const valor = total * (pct / 100);
        const nivells = estat.pais.pressupostos_departaments[clau];
        const avaluacio = avaluarNivellPressupost(valor, nivells);
        const missatge = interpolar(MISSATGES_DEPARTAMENT[clau][avaluacio.tier], estat.pais.metadades.nom_ubicacio);

        const card = document.querySelector(`[data-dept="${clau}"]`);
        card.querySelector('.valor').textContent = formatEuros(valor);
        card.querySelector('.pctlabel').textContent = `${pct}% del pressupost total`;

        const verdicte = card.querySelector('.verdicte');
        verdicte.className = 'verdicte rounded-xl p-3 text-sm font-semibold mb-4 ' + avaluacio.classes;
        verdicte.textContent = missatge;

        card.querySelector('.escala').innerHTML =
            miniNivell('Mínim', nivells.minim, valor >= nivells.minim) +
            miniNivell('Normal', nivells.normal, valor >= nivells.normal) +
            miniNivell('Òptim', nivells.optim, valor >= nivells.optim) +
            miniNivell('Excel·lència', nivells.excellencia, valor >= nivells.excellencia);
    });
}
