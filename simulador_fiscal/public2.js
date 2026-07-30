/**
 * public.js
 * Lògica d'interfície del web PÚBLIC (index.html) del Simulador Fiscal Educatiu.
 * Fa servir DADES_SIMULACIO i generarPais() de configuracio.js / generador.js,
 * i totes les funcions de càlcul de motor-fiscal.js.
 *
 * REGLA D'OR: aquest fitxer MAI calcula la recaptació total del país.
 */

// ---------------------------------------------------------------
// ESTAT GLOBAL
// ---------------------------------------------------------------
const estat = {
    pais: null,
    dificultat: 'normal',
    numTrams: 3,
    perfilSeleccionat: null,
    chart: null
};

const ICONES_DEPARTAMENTS = {
    sanitat:   { nom: 'Sanitat',   icona: '🏥' },
    educacio:  { nom: 'Educació',  icona: '🎓' },
    seguretat: { nom: 'Seguretat', icona: '🛡️' },
    foment:    { nom: 'Foment',    icona: '🏗️' }
};

const COLORS_CHART = ['#2B3A67', '#C9971F', '#157F5C', '#C43D3D', '#4A5B94', '#8F2727', '#0E5C42'];

// ---------------------------------------------------------------
// INICIALITZACIÓ
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-generar').addEventListener('click', generarPaisHandler);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => canviarPestanya(btn.dataset.tab));
    });
});

function canviarPestanya(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
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
    renderFormularisImpostos(dificultat);
    renderSelectorPerfils(pais);
    recalcularPerfilSeleccionat();
    renderDepartaments(pais);

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

    // Gràfic de formatget
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

    // Targetes de població
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
// PESTANYA B · LABORATORI D'IMPOSTOS
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

    // Escoltem qualsevol canvi als formularis d'impostos per recalcular en temps real
    const tots = cont.querySelectorAll('input')
        .length ? [...cont.querySelectorAll('input'),
            document.getElementById('patrimoni-minim'), document.getElementById('patrimoni-pct'),
            document.getElementById('iva-basic'), document.getElementById('iva-normal'), document.getElementById('iva-luxe')]
        : [];
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

    renderAlerta(resultat.regla);
    renderFitxaPerfil(resultat);
}

function renderAlerta(regla) {
    const banner = document.getElementById('alerta-banner');

    if (!regla || !regla.disparada) {
        banner.classList.remove('show');
        return;
    }

    const esExit = SENTIMENT_SOCIOLOGIES[regla.sociologia.clau] === 'exit';
    banner.classList.remove('bg-perill-light', 'text-perill-dark', 'bg-exit-light', 'text-exit-dark');
    banner.classList.add(esExit ? 'bg-exit-light' : 'bg-perill-light', esExit ? 'text-exit-dark' : 'text-perill-dark');

    document.getElementById('alerta-icona').textContent = esExit ? '✅' : '⚠️';
    document.getElementById('alerta-titol').textContent = esExit ? 'Efecte positiu detectat' : 'Alerta econòmica!';
    document.getElementById('alerta-text').textContent = regla.consequencia;

    banner.classList.add('show');
}

function renderFitxaPerfil(r) {
    const cont = document.getElementById('fitxa-perfil');
    const disparada = r.regla && r.regla.disparada;

    const filaValor = (etiqueta, original, ajustat, formatter) => {
        const canviat = original !== ajustat;
        return `
            <div class="flex justify-between items-center text-sm py-1">
                <span class="text-ink/50">${etiqueta}</span>
                <span class="font-mono-num ${canviat ? 'text-perill font-semibold' : ''}">
                    ${canviat ? `<span class="line-through text-ink/30 mr-2 text-xs">${formatter(original)}</span>` : ''}${formatter(ajustat)}
                </span>
            </div>`;
    };

    cont.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <p class="font-display font-bold text-lg">${r.perfil}</p>
            ${disparada ? '<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-perill-light text-perill-dark">llei activada</span>' : '<span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-exit-light text-exit-dark">situació estable</span>'}
        </div>

        <div class="grid sm:grid-cols-2 gap-x-8 mb-5">
            <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Valors econòmics</p>
                ${filaValor('Ingressos', r.original.ingressos, r.ajustat.ingressos, formatEuros)}
                ${filaValor('Patrimoni', r.original.patrimoni, r.ajustat.patrimoni, formatEuros)}
                ${filaValor('Desp. bàsiques', r.original.despeses.basiques, r.ajustat.despeses.basiques, formatEuros)}
                ${filaValor('Desp. normals', r.original.despeses.normals, r.ajustat.despeses.normals, formatEuros)}
                ${filaValor('Desp. luxe', r.original.despeses.luxe, r.ajustat.despeses.luxe, formatEuros)}
            </div>
            <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">Quota per impost</p>
                <div class="flex justify-between text-sm py-1"><span class="text-ink/50">IRPF <span class="text-ink/30 text-xs">(marginal ${r.irpf.tipusMarginal}%)</span></span><span class="font-mono-num font-semibold">${formatEuros(r.irpf.quota)}</span></div>
                <div class="flex justify-between text-sm py-1"><span class="text-ink/50">Patrimoni</span><span class="font-mono-num font-semibold">${formatEuros(r.patrimoni.quota)}</span></div>
                <div class="flex justify-between text-sm py-1"><span class="text-ink/50">IVA</span><span class="font-mono-num font-semibold">${formatEuros(r.iva.total)}</span></div>
            </div>
        </div>

        <div class="pt-4 border-t border-ink/10 flex items-center justify-between">
            <p class="font-display font-semibold text-sm">Total que paga aquest individu</p>
            <p class="font-mono-num font-bold text-2xl text-institut stat-flip">${formatEuros(r.totalIndividual)}</p>
        </div>
    `;
}

// ---------------------------------------------------------------
// PESTANYA C · NECESSITATS DEPARTAMENTALS
// ---------------------------------------------------------------
function renderDepartaments(pais) {
    const cont = document.getElementById('departaments-contingut');
    cont.innerHTML = '';

    Object.keys(pais.pressupostos_departaments).forEach(clau => {
        const info = ICONES_DEPARTAMENTS[clau] || { nom: clau, icona: '📁' };
        const nivells = pais.pressupostos_departaments[clau];

        const card = document.createElement('div');
        card.className = 'card p-6';
        card.innerHTML = `
            <div class="flex items-center gap-3 mb-4">
                <span class="text-2xl">${info.icona}</span>
                <p class="font-display font-bold text-lg">${info.nom}</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
                ${filaNivell('Mínim', nivells.minim, 'bg-perill-light text-perill-dark')}
                ${filaNivell('Normal', nivells.normal, 'bg-paper text-ink/70')}
                ${filaNivell('Òptim', nivells.optim, 'bg-institut/10 text-institut')}
                ${filaNivell('Excel·lència', nivells.excellencia, 'bg-exit-light text-exit-dark')}
            </div>
        `;
        cont.appendChild(card);
    });
}

function filaNivell(etiqueta, valor, classes) {
    return `
        <div class="rounded-xl p-3 ${classes}">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-70">${etiqueta}</p>
            <p class="font-mono-num font-bold text-base mt-0.5">${formatEuros(valor)}</p>
        </div>
    `;
}
