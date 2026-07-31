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
    aplicarAmbient('mood--estancament');
}

function renderInfoPais(pais, dificultat) {
    const nomEl = document.getElementById('info-nom-pais');
    nomEl.textContent = pais.metadades.nom_ubicacio;
    repetirAnimacio(nomEl, 'text-pop');

    animarNumero(document.getElementById('info-poblacio'), pais.metadades.poblacio_total, formatNumero, 800);
    document.getElementById('info-num-perfils').textContent = pais.demografia.length;

    document.getElementById('info-sociologia-clau').textContent = `clau: ${pais.metadades.sociologia_clau}`;
    const pistaEl = document.getElementById('info-pista');
    pistaEl.textContent = pais.metadades.pista_sociologica;
    repetirAnimacio(pistaEl, 'text-pop');

    const contPactes = document.getElementById('info-pactes');
    contPactes.innerHTML = '';
    Object.keys(pais.pactes).forEach((cat, i) => {
        const pacte = pais.pactes[cat];
        const fila = document.createElement('p');
        fila.className = 'entrada';
        fila.style.animationDelay = `${i * 60}ms`;
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

    // Resultat per departament, calculat un sol cop i reutilitzat tant per
    // a les targetes com per a la "Situació econòmica del proper any".
    const resultatsDepartaments = Object.keys(pais.pressupostos_departaments).map(clau => {
        const nivells = pais.pressupostos_departaments[clau];
        const pct = parseFloat(document.getElementById(`pct-${clau}`).value) || 0;
        const valorReal = recaptacioTotal * (pct / 100);
        const avaluacio = avaluarNivellPressupost(valorReal, nivells);
        return { clau, nivells, pct, valorReal, avaluacio };
    });

    renderRecaptacio(recaptacioTotal, recaptacioIRPF, recaptacioPatrimoni, recaptacioIVA);
    renderComparativaAnyAnterior(recaptacioTotal, pais.pressupost_any_anterior);
    renderAuditoria(pais, config);
    renderDepartamentsReals(pais, resultatsDepartaments);
    renderTaulaPerfils(detallPerfils);
    renderAnalisiSistema(config, detallPerfils, recaptacioTotal, recaptacioIRPF, recaptacioPatrimoni, recaptacioIVA);
    renderSituacioEconomica(pais, resultatsDepartaments, detallPerfils);

    document.getElementById('resultats').classList.remove('hidden');
    const resultatsEl = document.getElementById('resultats');
    if (typeof resultatsEl.scrollIntoView === 'function') {
        resultatsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderRecaptacio(total, irpf, patrimoni, iva) {
    animarNumero(document.getElementById('recaptacio-total'), total, formatEuros, 900);
    animarNumero(document.getElementById('recaptacio-irpf'), irpf, formatEuros, 900);
    animarNumero(document.getElementById('recaptacio-patrimoni'), patrimoni, formatEuros, 900);
    animarNumero(document.getElementById('recaptacio-iva'), iva, formatEuros, 900);
}

function renderComparativaAnyAnterior(total, anyAnterior) {
    animarNumero(document.getElementById('comparativa-valor-anterior'), anyAnterior, formatEuros, 700);
    const diferencia = ((total - anyAnterior) / anyAnterior) * 100;
    const signe = diferencia >= 0 ? '+' : '';
    const el = document.getElementById('comparativa-percentatge');
    el.textContent = `${signe}${diferencia.toFixed(1)}% respecte l'any anterior`;
    el.classList.remove('bg-exit-light', 'text-exit-dark', 'bg-perill-light', 'text-perill-dark');
    el.classList.add(diferencia >= 0 ? 'bg-exit-light' : 'bg-perill-light', diferencia >= 0 ? 'text-exit-dark' : 'text-perill-dark');
    repetirAnimacio(el, 'stat-pop');
}

// ---------------------------------------------------------------
// AUDITORIA: Pactes de País + Límits Absoluts
// ---------------------------------------------------------------
function renderAuditoria(pais, config) {
    const pactes = avaluarPactes(pais, config);
    const limits = avaluarLimitsAbsoluts(config);

    const cont = document.getElementById('auditoria-contingut');
    cont.innerHTML = '';
    let i = 0;

    cont.appendChild(titolAuditoria('Pactes de País'));
    Object.keys(pactes).forEach(cat => {
        const info = pactes[cat];
        cont.appendChild(filaAuditoria(
            NOM_IMPOST_LLARG[cat],
            info.pacte.descripcio,
            info.resultat.fora ? `🚨 Incomplert: ${info.resultat.missatge}` : '✅ Complert',
            !info.resultat.fora,
            i++
        ));
    });

    cont.appendChild(titolAuditoria('Límits Absoluts'));
    Object.keys(limits).forEach(cat => {
        const info = limits[cat];
        cont.appendChild(filaAuditoria(
            NOM_IMPOST_LLARG[cat],
            `Llindar: ${info.llindar}${cat === 'patrimoni_minim_exempt' ? ' €' : '%'} · Valor introduït: ${info.valor}${cat === 'patrimoni_minim_exempt' ? ' €' : '%'}`,
            info.superat ? `🔥 Superat: ${info.consequencia}` : '✅ Dins del límit',
            !info.superat,
            i++
        ));
    });
}

function titolAuditoria(text) {
    const p = document.createElement('p');
    p.className = 'font-display font-semibold text-xs uppercase tracking-wide text-ink/40 pt-3 first:pt-0';
    p.textContent = text;
    return p;
}

function filaAuditoria(etiqueta, descripcio, estatText, ok, index) {
    const div = document.createElement('div');
    div.className = 'auditoria-fila py-2.5 flex items-start justify-between gap-4 flex-wrap entrada';
    div.style.animationDelay = `${(index || 0) * 45}ms`;
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
function renderDepartamentsReals(pais, resultatsDepartaments) {
    const cont = document.getElementById('departaments-targetes');
    cont.innerHTML = '';

    resultatsDepartaments.forEach(({ clau, nivells, pct, valorReal, avaluacio }, i) => {
        const info = ICONES_DEPARTAMENTS[clau] || { nom: clau, icona: '📁' };
        const color = COLORS_CHART[i % COLORS_CHART.length];
        const missatge = interpolar(MISSATGES_DEPARTAMENT[clau][avaluacio.tier], pais.metadades.nom_ubicacio);

        const card = document.createElement('div');
        card.className = 'card p-6 entrada' + (avaluacio.tier === 'excellencia' ? ' excellencia-shine' : '');
        card.style.animationDelay = `${i * 60}ms`;
        card.innerHTML = `
            <div class="accent-top" style="background:${color}"></div>
            <div class="flex items-center gap-3 mb-3">
                <span class="text-2xl">${info.icona}</span>
                <p class="font-display font-bold text-lg">${info.nom}</p>
            </div>
            <div class="mb-3">
                <p class="text-xs uppercase tracking-wide text-ink/40">Recaptació real assignada (${pct}%)</p>
                <p class="valor font-mono-num font-bold text-2xl text-institut">—</p>
            </div>
            <div class="rounded-xl p-3 text-sm font-semibold mb-4 ${avaluacio.classes}">${missatge}</div>
            <div class="grid grid-cols-4 gap-1.5">
                ${miniNivell('Mínim', nivells.minim, valorReal >= nivells.minim, false)}
                ${miniNivell('Normal', nivells.normal, valorReal >= nivells.normal, false)}
                ${miniNivell('Òptim', nivells.optim, valorReal >= nivells.optim, false)}
                ${miniNivell('Excel·lència', nivells.excellencia, valorReal >= nivells.excellencia, true)}
            </div>
        `;
        cont.appendChild(card);
        animarNumero(card.querySelector('.valor'), valorReal, formatEuros, 800);
    });
}

function miniNivell(etiqueta, valor, actiu, esExcellencia) {
    const classes = actiu
        ? (esExcellencia ? 'bg-gold text-white excellencia-shine' : 'bg-institut text-white')
        : 'bg-paper text-ink/40';
    return `
        <div class="rounded-lg px-1.5 py-1.5 text-center ${classes}">
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

    detallPerfils.forEach(({ perfil, r, totalPerfil }, i) => {
        const notes = [];
        if (r.regla.disparada) notes.push('sociologia activada');
        const limitsSuperats = Object.keys(r.limitsAbsoluts).filter(cat => r.limitsAbsoluts[cat].superat);
        if (limitsSuperats.length) notes.push(`límit absolut (${limitsSuperats.map(c => NOM_IMPOST_LLARG[c]).join(', ')})`);

        const fila = document.createElement('tr');
        fila.className = 'border-b border-ink/5 entrada';
        fila.style.animationDelay = `${i * 45}ms`;
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

// ---------------------------------------------------------------
// ANÀLISI DEL SISTEMA TRIBUTARI
// ---------------------------------------------------------------
const REFERENCIA_EUROPA = { irpf: 45, iva_normal: 21, iva_basic: 8 };

function insightCard(titol, html, index) {
    const div = document.createElement('div');
    div.className = 'rounded-xl p-4 bg-paper border border-ink/10 entrada';
    div.style.animationDelay = `${(index || 0) * 80}ms`;
    div.innerHTML = `<p class="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">${titol}</p>${html}`;
    return div;
}

function renderAnalisiSistema(config, detallPerfils, recaptacioTotal, recaptacioIRPF, recaptacioPatrimoni, recaptacioIVA) {
    const cont = document.getElementById('analisi-contingut');
    cont.innerHTML = '';
    if (!detallPerfils.length || recaptacioTotal <= 0) return;

    const poblacioTotal = detallPerfils.reduce((acc, d) => acc + d.perfil.poblacio_absoluta, 0);

    // --- Concentració de la recaptació ---
    let concentracio = null;
    detallPerfils.forEach(({ perfil, totalPerfil }) => {
        const pctPoblacio = (perfil.poblacio_absoluta / poblacioTotal) * 100;
        const pctRecaptacio = (totalPerfil / recaptacioTotal) * 100;
        const ratio = pctPoblacio > 0 ? pctRecaptacio / pctPoblacio : 0;
        if (!concentracio || ratio > concentracio.ratio) {
            concentracio = { perfil, pctPoblacio, pctRecaptacio, ratio };
        }
    });
    cont.appendChild(insightCard(
        'Concentració de la recaptació',
        `<p class="text-sm text-ink/80 leading-relaxed">El <strong>${concentracio.pctPoblacio.toFixed(1)}%</strong> de la població (<strong>${concentracio.perfil.perfil}</strong>) aporta el <strong>${concentracio.pctRecaptacio.toFixed(1)}%</strong> de tota la recaptació — ${concentracio.ratio.toFixed(1)} vegades més que el seu pes demogràfic.</p>`,
        0
    ));

    // --- Progressivitat ---
    let pobre = detallPerfils[0], ric = detallPerfils[0];
    detallPerfils.forEach(d => {
        if (d.r.original.ingressos < pobre.r.original.ingressos) pobre = d;
        if (d.r.original.ingressos > ric.r.original.ingressos) ric = d;
    });
    const tipusPobre = pobre.r.original.ingressos > 0 ? (pobre.r.totalIndividual / pobre.r.original.ingressos) * 100 : 0;
    const tipusRic = ric.r.original.ingressos > 0 ? (ric.r.totalIndividual / ric.r.original.ingressos) * 100 : 0;
    const diferencia = tipusRic - tipusPobre;
    let classificacio, explicacio;
    if (diferencia > 5) {
        classificacio = 'Sistema progressiu';
        explicacio = `${ric.perfil.perfil} hi destina el ${tipusRic.toFixed(1)}% dels seus ingressos, molt per sobre del ${tipusPobre.toFixed(1)}% de ${pobre.perfil.perfil}: qui més té, proporcionalment més paga.`;
    } else if (diferencia < -5) {
        classificacio = 'Sistema regressiu';
        explicacio = `${pobre.perfil.perfil} hi destina el ${tipusPobre.toFixed(1)}% dels seus ingressos, per sobre del ${tipusRic.toFixed(1)}% de ${ric.perfil.perfil}: la càrrega recau proporcionalment més sobre les rendes baixes.`;
    } else {
        classificacio = 'Sistema proporcional';
        explicacio = `${ric.perfil.perfil} (${tipusRic.toFixed(1)}%) i ${pobre.perfil.perfil} (${tipusPobre.toFixed(1)}%) hi destinen un percentatge dels ingressos molt similar.`;
    }
    cont.appendChild(insightCard(
        `Progressivitat — ${classificacio}`,
        `<p class="text-sm text-ink/80 leading-relaxed">${explicacio}</p>`,
        1
    ));

    // --- Pes de cada impost ---
    const pesIRPF = (recaptacioIRPF / recaptacioTotal) * 100;
    const pesPatrimoni = (recaptacioPatrimoni / recaptacioTotal) * 100;
    const pesIVA = (recaptacioIVA / recaptacioTotal) * 100;
    let base;
    if (pesIVA >= pesIRPF && pesIVA >= pesPatrimoni) {
        base = 'basat majoritàriament en el <strong>consum</strong> (IVA). És el tipus de base fiscal amb més tendència a ser regressiva, ja que tothom hi paga el mateix tipus independentment del que guanyi.';
    } else if (pesPatrimoni >= pesIRPF && pesPatrimoni >= pesIVA) {
        base = 'basat majoritàriament en el <strong>patrimoni</strong> acumulat: penalitza l\'estalvi i la riquesa acumulada per sobre de la renda del treball.';
    } else {
        base = 'basat majoritàriament en la <strong>renda</strong> (IRPF): és el tipus de base fiscal amb més marge per ser progressiva, ja que es pot graduar per trams.';
    }
    const notaEstalvi = pesPatrimoni < 10
        ? 'Amb un pes de Patrimoni tan baix, el disseny pràcticament no penalitza l\'acumulació de riquesa: potencia l\'estalvi.'
        : 'Amb un pes de Patrimoni notable, el disseny penalitza mantenir grans patrimonis: incentiva gastar-lo o invertir-lo en lloc d\'acumular-lo.';
    cont.appendChild(insightCard(
        'Pes de cada impost en la recaptació',
        `<div class="flex gap-4 text-xs font-mono-num text-ink/60 mb-2">
            <span>IRPF: <strong class="text-ink">${pesIRPF.toFixed(1)}%</strong></span>
            <span>Patrimoni: <strong class="text-ink">${pesPatrimoni.toFixed(1)}%</strong></span>
            <span>IVA: <strong class="text-ink">${pesIVA.toFixed(1)}%</strong></span>
        </div>
        <p class="text-sm text-ink/80 leading-relaxed">Un sistema ${base} ${notaEstalvi}</p>`,
        2
    ));

    // --- Comparativa amb Europa Occidental ---
    const irpfTop = tramMesAlt(config.trams);
    const filaCompara = (nom, valor, ref) => {
        const diff = valor - ref;
        const signe = diff >= 0 ? '+' : '';
        return `<tr class="border-b border-ink/5 last:border-0">
            <td class="py-1.5 pr-2">${nom}</td>
            <td class="py-1.5 px-2 text-right font-mono-num font-semibold">${valor}%</td>
            <td class="py-1.5 pl-2 text-right font-mono-num text-ink/40">~${ref}% (${signe}${diff.toFixed(0)} pt)</td>
        </tr>`;
    };
    cont.appendChild(insightCard(
        'Comparant-ho amb un sistema fiscal actual europeu...',
        `<table class="w-full text-xs mt-1">
            <thead>
                <tr class="text-left text-ink/40">
                    <th class="pb-1 font-medium">Impost</th>
                    <th class="pb-1 pl-2 text-right font-medium">Aquest disseny</th>
                    <th class="pb-1 pl-2 text-right font-medium">Referència Europa Occ.</th>
                </tr>
            </thead>
            <tbody>
                ${filaCompara('IRPF (tram més alt)', irpfTop, REFERENCIA_EUROPA.irpf)}
                ${filaCompara('IVA normal', config.iva.normal, REFERENCIA_EUROPA.iva_normal)}
                ${filaCompara('IVA bàsic', config.iva.basic, REFERENCIA_EUROPA.iva_basic)}
            </tbody>
        </table>
        <p class="text-xs text-ink/50 mt-2">Patrimoni (${config.patrimoni.percentatge}%): la majoria de països d'Europa Occidental no en té; on existeix, sol rondar el 0,2%–1%.</p>`,
        3
    ));
}

// ---------------------------------------------------------------
// SITUACIÓ ECONÒMICA DEL PROPER ANY
// ---------------------------------------------------------------
const PUNTUACIO_TIER_DEPT = { catastrofe: -2, ajustat: -1, normal: 0, optim: 1, excellencia: 2 };
const NOM_TIER_DEPT = { '-2': 'Catàstrofe', '-1': 'Ajustat', '0': 'Normal', '1': 'Òptim', '2': 'Excel·lència' };

function factorCard(titol, titolPrincipal, descripcio, index) {
    return `
        <div class="rounded-xl p-4 bg-paper border border-ink/10 entrada" style="animation-delay:${(index || 0) * 80}ms">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-1">${titol}</p>
            <p class="text-sm font-semibold">${titolPrincipal}</p>
            <p class="text-xs text-ink/60 mt-1 leading-relaxed">${descripcio}</p>
        </div>`;
}

/**
 * Els 5 nivells del veredicte, cadascun amb la seva classe visual per a
 * la targeta i amb l'"ambient" (classe de <body>) que tenyeix tota la
 * pàgina — vermell/negre en la recessió profunda, verd llima vital en la
 * bonança. Les targetes es mantenen blanques; només el fons i la
 * capçalera adopten el to.
 */
function calcularVeredicte(total) {
    if (total <= -4) return { emoji: '📉', nom: 'Recessió profunda', classes: 'bg-perill text-white', mood: 'mood--profunda', glow: 'veredicte-glow-perill' };
    if (total <= -2) return { emoji: '🔻', nom: 'Recessió', classes: 'bg-perill-light text-perill-dark', mood: 'mood--recessio', glow: '' };
    if (total <= 1) return { emoji: '➖', nom: 'Estancament', classes: 'bg-gold/15 text-gold-dark', mood: 'mood--estancament', glow: '' };
    if (total <= 3) return { emoji: '📈', nom: 'Creixement moderat', classes: 'bg-exit-light text-exit-dark', mood: 'mood--creixement', glow: '' };
    return { emoji: '🚀', nom: 'Bonança', classes: 'bg-exit text-white', mood: 'mood--bonanca', glow: 'veredicte-glow-bonanca' };
}

function aplicarAmbient(mood) {
    ['mood--profunda', 'mood--recessio', 'mood--estancament', 'mood--creixement', 'mood--bonanca'].forEach(m => {
        document.body.classList.remove(m);
    });
    document.body.classList.add(mood);
}

function renderSituacioEconomica(pais, resultatsDepartaments, detallPerfils) {
    const cont = document.getElementById('situacio-contingut');
    const puntPartida = pais.context_economic.puntPartida;
    const esdeveniment = pais.context_economic.esdevenimentExtern;

    // C: qualitat mitjana dels departaments
    const mitjanaDept = resultatsDepartaments.reduce((acc, d) => acc + PUNTUACIO_TIER_DEPT[d.avaluacio.tier], 0) / resultatsDepartaments.length;
    const scoreC = Math.round(mitjanaDept);

    // D: perfils que empitjoren
    let nRisc = 0;
    const notesRisc = [];
    detallPerfils.forEach(({ perfil, r }) => {
        const necessitat = r.original.despeses.basiques + r.original.despeses.normals;
        const riscIngressos = r.ajustat.ingressos < necessitat;
        const riscPatrimoni = r.ajustat.patrimoni < r.original.patrimoni;
        if (riscIngressos || riscPatrimoni) {
            nRisc++;
            const motiu = [];
            if (riscIngressos) motiu.push("els ingressos ja no li permeten mantenir les seves despeses habituals");
            if (riscPatrimoni) motiu.push("el seu patrimoni s'erosiona respecte a l'original");
            notesRisc.push(`<strong>${perfil.perfil}</strong>: ${motiu.join(' i ')}.`);
        }
    });
    const fraccioRisc = nRisc / detallPerfils.length;
    let scoreD;
    if (fraccioRisc === 0) scoreD = 2;
    else if (fraccioRisc < 0.25) scoreD = 1;
    else if (fraccioRisc <= 0.5) scoreD = 0;
    else if (fraccioRisc <= 0.75) scoreD = -1;
    else scoreD = -2;

    const scoreA = puntPartida.valor;
    const scoreB = esdeveniment.valor;
    const total = scoreA + scoreB + scoreC + scoreD;

    const veredicte = calcularVeredicte(total);
    aplicarAmbient(veredicte.mood);

    const nProspera = detallPerfils.length - nRisc;

    cont.innerHTML = `
        <div class="grid sm:grid-cols-2 gap-3">
            ${factorCard("D'on venia el país", `${puntPartida.icona} ${puntPartida.nom}`, puntPartida.descripcio, 0)}
            ${factorCard('Esdeveniment d\'enguany', esdeveniment.nom, esdeveniment.descripcio, 1)}
            ${factorCard('Qualitat del pressupost', `Nivell mitjà: ${NOM_TIER_DEPT[scoreC]}`, `Mitjana dels ${resultatsDepartaments.length} departaments finançats.`, 2)}
            ${factorCard('Salut dels perfils', `${nProspera} de ${detallPerfils.length} perfils prosperen`, nRisc === 0 ? 'Cap perfil empitjora la seva situació respecte a l\'any anterior.' : notesRisc.join(' '), 3)}
        </div>
        <div class="rounded-2xl p-5 mt-4 entrada ${veredicte.classes} ${veredicte.glow}" style="animation-delay:340ms">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-70">Veredicte per al proper any</p>
            <p class="font-display font-bold text-xl mt-1">${veredicte.emoji} ${veredicte.nom}</p>
        </div>
    `;
}
