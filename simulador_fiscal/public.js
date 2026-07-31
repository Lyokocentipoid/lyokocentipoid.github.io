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
    chart: null,
    pressupostosDepartaments: null
};

const ICONES_DEPARTAMENTS = {
    sanitat:   { nom: 'Sanitat',   icona: '🏥' },
    educacio:  { nom: 'Educació',  icona: '🎓' },
    seguretat: { nom: 'Seguretat', icona: '🛡️' },
    foment:    { nom: 'Foment',    icona: '🏗️' }
};

const COLORS_CHART = ['#2B3A67', '#C9971F', '#157F5C', '#C43D3D', '#4A5B94', '#8F2727', '#0E5C42'];

// Quin "impost" del motor de regles correspon a quina subpestanya de la interfície
const IMPOST_A_SECCIO = {
    irpf: 'irpf',
    patrimoni: 'patrimoni',
    iva_basic: 'iva',
    iva_normal: 'iva',
    iva_luxe: 'iva'
};
const NOM_SECCIO = { irpf: "de l'IRPF", patrimoni: 'del Patrimoni', iva: "de l'IVA" };

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

    // Pressupost departamental: sempre disponible, reacciona a qualsevol canvi
    ['pressupost-total', 'pct-sanitat', 'pct-educacio', 'pct-seguretat', 'pct-foment'].forEach(id => {
        document.getElementById(id).addEventListener('input', recalcularDepartaments);
    });
});

function canviarPestanya(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function canviarSubtab(subtab) {
    estat.subtabActiu = subtab;
    document.querySelectorAll('#subtabs-impostos .subtab-btn').forEach(b => b.classList.toggle('active', b.dataset.subtab === subtab));
    ['irpf', 'patrimoni', 'iva'].forEach(s => {
        document.getElementById(`subtab-${s}`).classList.toggle('hidden', s !== subtab);
    });
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
    recalcularPerfilSeleccionat();

    estat.pressupostosDepartaments = pais.pressupostos_departaments;
    crearTargetesDepartaments();
    recalcularDepartaments();

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
// PESTANYA A · DEMOGRAFIA
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
// PESTANYA B · LABORATORI D'IMPOSTOS (3 subpestanyes independents)
// ---------------------------------------------------------------
function renderFormularisImpostos(dificultat) {
    const numTrams = numTramsPerDificultat(dificultat);
    const trams = tramsIRPFPerDefecte(dificultat);
    const patrimoni = patrimoniPerDefecte();
    const iva = ivaPerDefecte();

    const cont = document.getElementById('trams-irpf');
    cont.innerHTML = '';
    for (let i = 0; i < numTrams; i++) {
        const fila = document.createElement('div');
        fila.className = 'grid grid-cols-2 gap-2 items-center';
        fila.innerHTML = `
            <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/30">des de</span>
                <input id="irpf-desde-${i}" type="number" value="${trams[i].desde}" class="field w-full pl-16 pr-3 py-2 text-sm text-right">
            </div>
            <div class="relative">
                <input id="irpf-pct-${i}" type="number" step="0.5" value="${trams[i].percentatge}" class="field w-full pl-3 pr-7 py-2 text-sm text-right">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/30">%</span>
            </div>
        `;
        cont.appendChild(fila);
    }

    document.getElementById('patrimoni-minim').value = patrimoni.minimExempt;
    document.getElementById('patrimoni-pct').value = patrimoni.percentatge;
    document.getElementById('iva-basic').value = iva.basic;
    document.getElementById('iva-normal').value = iva.normal;
    document.getElementById('iva-luxe').value = iva.luxe;

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
// PESTANYA C · NECESSITATS DEPARTAMENTALS (pressupost editable)
// ---------------------------------------------------------------
const DEPT_CLAUS = ['sanitat', 'educacio', 'seguretat', 'foment'];

function crearTargetesDepartaments() {
    const cont = document.getElementById('departaments-targetes');
    cont.innerHTML = '';
    DEPT_CLAUS.forEach(clau => {
        const info = ICONES_DEPARTAMENTS[clau];
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

function avaluarNivellPressupost(valor, nivells) {
    if (valor < nivells.minim) {
        return { tier: 'catastrofe', emoji: '🚨', classes: 'bg-perill-light text-perill-dark',
            missatge: 'Per sota del mínim. El departament col·lapsa: talls de servei i queixes ciutadanes.' };
    }
    if (valor < nivells.normal) {
        return { tier: 'ajustat', emoji: '😬', classes: 'bg-gold/15 text-gold-dark',
            missatge: 'Al llindar mínim. Funciona, però molt ajustat de recursos.' };
    }
    if (valor < nivells.optim) {
        return { tier: 'normal', emoji: '🙂', classes: 'bg-institut/10 text-institut',
            missatge: 'Nivell normal. El servei funciona amb normalitat.' };
    }
    if (valor < nivells.excellencia) {
        return { tier: 'optim', emoji: '😀', classes: 'bg-exit-light text-exit-dark',
            missatge: 'Nivell òptim. Els ciutadans n\'estan molt satisfets.' };
    }
    return { tier: 'excellencia', emoji: '✨', classes: 'bg-exit text-white ring-2 ring-gold',
        missatge: 'Excel·lència! Referent absolut en aquest àmbit.' };
}

function miniNivell(etiqueta, valor, actiu) {
    return `
        <div class="rounded-lg px-1.5 py-1.5 text-center ${actiu ? 'bg-institut text-white' : 'bg-paper text-ink/40'}">
            <p class="text-[9px] font-semibold uppercase tracking-wide">${etiqueta}</p>
            <p class="font-mono-num text-[10px] mt-0.5">${formatEuros(valor)}</p>
        </div>`;
}

function recalcularDepartaments() {
    if (!estat.pressupostosDepartaments) return;

    const total = parseFloat(document.getElementById('pressupost-total').value) || 0;
    const pcts = {};
    let suma = 0;
    DEPT_CLAUS.forEach(clau => {
        const v = parseFloat(document.getElementById(`pct-${clau}`).value) || 0;
        pcts[clau] = v;
        suma += v;
    });

    const sumaEl = document.getElementById('suma-percentatges');
    sumaEl.textContent = `Suma: ${suma}%`;
    sumaEl.classList.remove('bg-exit-light', 'text-exit-dark', 'bg-perill-light', 'text-perill-dark');
    if (suma === 100) {
        sumaEl.classList.add('bg-exit-light', 'text-exit-dark');
    } else {
        sumaEl.classList.add('bg-perill-light', 'text-perill-dark');
    }

    DEPT_CLAUS.forEach(clau => {
        const nivells = estat.pressupostosDepartaments[clau];
        const valor = total * (pcts[clau] / 100);
        const avaluacio = avaluarNivellPressupost(valor, nivells);

        const card = document.querySelector(`[data-dept="${clau}"]`);
        card.querySelector('.valor').textContent = formatEuros(valor);
        card.querySelector('.pctlabel').textContent = `${pcts[clau]}% del pressupost total`;

        const verdicte = card.querySelector('.verdicte');
        verdicte.className = 'verdicte rounded-xl p-3 text-sm font-semibold mb-4 ' + avaluacio.classes;
        verdicte.textContent = `${avaluacio.emoji} ${avaluacio.missatge}`;

        card.querySelector('.escala').innerHTML =
            miniNivell('Mínim', nivells.minim, valor >= nivells.minim) +
            miniNivell('Normal', nivells.normal, valor >= nivells.normal) +
            miniNivell('Òptim', nivells.optim, valor >= nivells.optim) +
            miniNivell('Excel·lència', nivells.excellencia, valor >= nivells.excellencia);
    });
}
