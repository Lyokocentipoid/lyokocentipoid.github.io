/**
 * privat.js
 * Lògica d'interfície del web PRIVAT (privat.html) — Solucionari del Professor.
 *
 * A diferència de public.js, aquest fitxer SÍ calcula la recaptació total
 * del país: multiplica la quota individual de cada perfil per la seva
 * població absoluta i ho suma tot. És exactament la feina que a paper fa
 * l'alumne — aquí serveix per corregir-la.
 *
 * Reutilitza els mateixos ids de camps (irpf-desde-N, patrimoni-pct, etc.)
 * que index.html perquè pot fer servir directament
 * llegirConfiguracioImpostosDelDOM() de motor-fiscal.js sense cap canvi.
 */

const estatPrivat = {
    pais: null,
    dificultat: 'normal',
    numTrams: 3
};

const NOM_IMPOST_LLARG = {
    irpf: 'IRPF (tram més alt)',
    patrimoni: 'Patrimoni (%)',
    patrimoni_minim_exempt: 'Patrimoni (mínim exempt)',
    iva_basic: 'IVA bàsic',
    iva_normal: 'IVA normal',
    iva_luxe: 'IVA luxe'
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-carregar').addEventListener('click', carregarPaisHandler);
    document.getElementById('btn-calcular').addEventListener('click', calcularResultatsReals);
});

// ---------------------------------------------------------------
// PAS 1 · CARREGAR PAÍS
// ---------------------------------------------------------------
function carregarPaisHandler() {
    const llavor = parseInt(document.getElementById('input-llavor').value) || 0;
    const dificultat = document.getElementById('select-dificultat').value;

    const pais = generarPais(llavor, dificultat);
    estatPrivat.pais = pais;
    estatPrivat.dificultat = dificultat;
    estatPrivat.numTrams = numTramsPerDificultat(dificultat);

    renderInfoPais(pais, dificultat);
    renderFormularisImpostos(dificultat);
    renderInputsDepartaments(pais);

    document.getElementById('pais-info').classList.remove('hidden');
    document.getElementById('bloc-impostos').classList.remove('hidden');
    document.getElementById('bloc-despesa').classList.remove('hidden');
    document.getElementById('bloc-calcular').classList.remove('hidden');
    document.getElementById('resultats').classList.add('hidden');
}

function renderInfoPais(pais, dificultat) {
    document.getElementById('info-nom-pais').textContent = pais.metadades.nom_ubicacio;
    document.getElementById('info-poblacio').textContent = formatNumero(pais.metadades.poblacio_total);
    document.getElementById('info-num-perfils').textContent = pais.demografia.length;

    document.getElementById('info-sociologia-clau').textContent = `clau: ${pais.metadades.sociologia_clau}`;
    document.getElementById('info-pista').textContent = pais.metadades.pista_sociologica;

    const contPactes = document.getElementById('info-pactes');
    contPactes.innerHTML = '';
    Object.keys(pais.pactes).forEach(cat => {
        const pacte = pais.pactes[cat];
        const fila = document.createElement('p');
        fila.innerHTML = `<span class="font-semibold text-ink">${NOM_IMPOST_LLARG[cat]}:</span> ${pacte.descripcio}`;
        contPactes.appendChild(fila);
    });
}

// ---------------------------------------------------------------
// PAS 2 · FORMULARIS D'IMPOSTOS (igual que a index.html, tots junts)
// ---------------------------------------------------------------
function renderFormularisImpostos(dificultat) {
    const numTrams = numTramsPerDificultat(dificultat);
    const tramsSuggerits = tramsIRPFPerDefecte(dificultat);

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

    ['patrimoni-minim', 'patrimoni-pct', 'iva-basic', 'iva-normal', 'iva-luxe'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

// ---------------------------------------------------------------
// PAS 3 · PRESSUPOST DEL DEPARTAMENT (% que ha decidit l'alumne)
// ---------------------------------------------------------------
function renderInputsDepartaments(pais) {
    const claus = Object.keys(pais.pressupostos_departaments);
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
        document.getElementById(`pct-${clau}`).addEventListener('input', recalcularSumaPercentatges);
    });
    recalcularSumaPercentatges();
}

function recalcularSumaPercentatges() {
    if (!estatPrivat.pais) return;
    const claus = Object.keys(estatPrivat.pais.pressupostos_departaments);
    let suma = 0;
    claus.forEach(clau => {
        suma += parseFloat(document.getElementById(`pct-${clau}`).value) || 0;
    });
    const el = document.getElementById('suma-percentatges');
    el.textContent = `Suma: ${suma}%`;
    el.classList.remove('bg-exit-light', 'text-exit-dark', 'bg-perill-light', 'text-perill-dark');
    el.classList.add(suma === 100 ? 'bg-exit-light' : 'bg-perill-light', suma === 100 ? 'text-exit-dark' : 'text-perill-dark');
}

// ---------------------------------------------------------------
// CÀLCUL DELS RESULTATS REALS
// ---------------------------------------------------------------
function calcularResultatsReals() {
    const pais = estatPrivat.pais;
    if (!pais) return;

    const config = llegirConfiguracioImpostosDelDOM(estatPrivat.numTrams);

    let recaptacioTotal = 0, recaptacioIRPF = 0, recaptacioPatrimoni = 0, recaptacioIVA = 0;
    const detallPerfils = [];

    pais.demografia.forEach(perfil => {
        const r = avaluarPerfil(pais, estatPrivat.dificultat, perfil.perfil, config);
        const totalPerfil = r.totalIndividual * perfil.poblacio_absoluta;

        recaptacioTotal += totalPerfil;
        recaptacioIRPF += r.irpf.quota * perfil.poblacio_absoluta;
        recaptacioPatrimoni += r.patrimoni.quota * perfil.poblacio_absoluta;
        recaptacioIVA += r.iva.total * perfil.poblacio_absoluta;

        detallPerfils.push({ perfil, r, totalPerfil });
    });

    renderRecaptacio(recaptacioTotal, recaptacioIRPF, recaptacioPatrimoni, recaptacioIVA);
    renderComparativaAnyAnterior(recaptacioTotal, pais.pressupost_any_anterior);
    renderAuditoria(pais, config);
    renderDepartamentsReals(pais, recaptacioTotal);
    renderTaulaPerfils(detallPerfils);

    document.getElementById('resultats').classList.remove('hidden');
    const resultatsEl = document.getElementById('resultats');
    if (typeof resultatsEl.scrollIntoView === 'function') {
        resultatsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderRecaptacio(total, irpf, patrimoni, iva) {
    document.getElementById('recaptacio-total').textContent = formatEuros(total);
    document.getElementById('recaptacio-irpf').textContent = formatEuros(irpf);
    document.getElementById('recaptacio-patrimoni').textContent = formatEuros(patrimoni);
    document.getElementById('recaptacio-iva').textContent = formatEuros(iva);
}

function renderComparativaAnyAnterior(total, anyAnterior) {
    document.getElementById('comparativa-valor-anterior').textContent = formatEuros(anyAnterior);
    const diferencia = ((total - anyAnterior) / anyAnterior) * 100;
    const signe = diferencia >= 0 ? '+' : '';
    const el = document.getElementById('comparativa-percentatge');
    el.textContent = `${signe}${diferencia.toFixed(1)}% respecte l'any anterior`;
    el.classList.remove('bg-exit-light', 'text-exit-dark', 'bg-perill-light', 'text-perill-dark');
    el.classList.add(diferencia >= 0 ? 'bg-exit-light' : 'bg-perill-light', diferencia >= 0 ? 'text-exit-dark' : 'text-perill-dark');
}

// ---------------------------------------------------------------
// AUDITORIA: Pactes de País + Límits Absoluts
// ---------------------------------------------------------------
function renderAuditoria(pais, config) {
    const pactes = avaluarPactes(pais, config);
    const limits = avaluarLimitsAbsoluts(config);

    const cont = document.getElementById('auditoria-contingut');
    cont.innerHTML = '';

    cont.appendChild(titolAuditoria('Pactes de País'));
    Object.keys(pactes).forEach(cat => {
        const info = pactes[cat];
        cont.appendChild(filaAuditoria(
            NOM_IMPOST_LLARG[cat],
            info.pacte.descripcio,
            info.resultat.fora ? `🚨 Incomplert: ${info.resultat.missatge}` : '✅ Complert',
            !info.resultat.fora
        ));
    });

    cont.appendChild(titolAuditoria('Límits Absoluts'));
    Object.keys(limits).forEach(cat => {
        const info = limits[cat];
        cont.appendChild(filaAuditoria(
            NOM_IMPOST_LLARG[cat],
            `Llindar: ${info.llindar}${cat === 'patrimoni_minim_exempt' ? ' €' : '%'} · Valor introduït: ${info.valor}${cat === 'patrimoni_minim_exempt' ? ' €' : '%'}`,
            info.superat ? `🔥 Superat: ${info.consequencia}` : '✅ Dins del límit',
            !info.superat
        ));
    });
}

function titolAuditoria(text) {
    const p = document.createElement('p');
    p.className = 'font-display font-semibold text-xs uppercase tracking-wide text-ink/40 pt-3 first:pt-0';
    p.textContent = text;
    return p;
}

function filaAuditoria(etiqueta, descripcio, estatText, ok) {
    const div = document.createElement('div');
    div.className = 'auditoria-fila py-2.5 flex items-start justify-between gap-4 flex-wrap';
    div.innerHTML = `
        <div class="flex-1 min-w-[220px]">
            <p class="text-sm font-semibold">${etiqueta}</p>
            <p class="text-xs text-ink/50">${descripcio}</p>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${ok ? 'bg-exit-light text-exit-dark' : 'bg-perill-light text-perill-dark'}">${estatText}</span>
    `;
    return div;
}

// ---------------------------------------------------------------
// TARGETES DE DEPARTAMENTS (amb la recaptació REAL)
// ---------------------------------------------------------------
function renderDepartamentsReals(pais, recaptacioTotal) {
    const cont = document.getElementById('departaments-targetes');
    cont.innerHTML = '';

    Object.keys(pais.pressupostos_departaments).forEach(clau => {
        const info = ICONES_DEPARTAMENTS[clau] || { nom: clau, icona: '📁' };
        const nivells = pais.pressupostos_departaments[clau];
        const pct = parseFloat(document.getElementById(`pct-${clau}`).value) || 0;
        const valorReal = recaptacioTotal * (pct / 100);
        const avaluacio = avaluarNivellPressupost(valorReal, nivells);
        const missatge = interpolar(MISSATGES_DEPARTAMENT[clau][avaluacio.tier], pais.metadades.nom_ubicacio);

        const card = document.createElement('div');
        card.className = 'card p-6';
        card.innerHTML = `
            <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">${info.icona}</span>
                <p class="font-display font-bold text-lg">${info.nom}</p>
            </div>
            <div class="mb-3">
                <p class="text-xs uppercase tracking-wide text-ink/40">Recaptació real assignada (${pct}%)</p>
                <p class="font-mono-num font-bold text-2xl text-institut stat-flip">${formatEuros(valorReal)}</p>
            </div>
            <div class="rounded-xl p-3 text-sm font-semibold mb-4 ${avaluacio.classes}">${missatge}</div>
            <div class="grid grid-cols-4 gap-1.5">
                ${miniNivell('Mínim', nivells.minim, valorReal >= nivells.minim)}
                ${miniNivell('Normal', nivells.normal, valorReal >= nivells.normal)}
                ${miniNivell('Òptim', nivells.optim, valorReal >= nivells.optim)}
                ${miniNivell('Excel·lència', nivells.excellencia, valorReal >= nivells.excellencia)}
            </div>
        `;
        cont.appendChild(card);
    });
}

function miniNivell(etiqueta, valor, actiu) {
    return `
        <div class="rounded-lg px-1.5 py-1.5 text-center ${actiu ? 'bg-institut text-white' : 'bg-paper text-ink/40'}">
            <p class="text-[9px] font-semibold uppercase tracking-wide">${etiqueta}</p>
            <p class="font-mono-num text-[10px] mt-0.5">${formatEuros(valor)}</p>
        </div>`;
}

// ---------------------------------------------------------------
// TAULA PER PERFIL
// ---------------------------------------------------------------
function renderTaulaPerfils(detallPerfils) {
    const cos = document.getElementById('taula-perfils');
    cos.innerHTML = '';

    detallPerfils.forEach(({ perfil, r, totalPerfil }) => {
        const notes = [];
        if (r.regla.disparada) notes.push('sociologia activada');
        const limitsSuperats = Object.keys(r.limitsAbsoluts).filter(cat => r.limitsAbsoluts[cat].superat);
        if (limitsSuperats.length) notes.push(`límit absolut (${limitsSuperats.map(c => NOM_IMPOST_LLARG[c]).join(', ')})`);

        const fila = document.createElement('tr');
        fila.className = 'border-b border-ink/5';
        fila.innerHTML = `
            <td class="py-2 pr-3 font-medium">${perfil.perfil}</td>
            <td class="py-2 pr-3 text-right font-mono-num text-ink/60">${formatNumero(perfil.poblacio_absoluta)}</td>
            <td class="py-2 pr-3 text-right font-mono-num">${formatEuros(r.totalIndividual)}</td>
            <td class="py-2 pr-3 text-right font-mono-num font-semibold">${formatEuros(totalPerfil)}</td>
            <td class="py-2 pl-3 text-xs text-ink/50">${notes.length ? notes.join(' · ') : '—'}</td>
        `;
        cos.appendChild(fila);
    });
}
