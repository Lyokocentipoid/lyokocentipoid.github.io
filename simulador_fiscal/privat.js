/**
 * privat.js
 * Lògica de càlcul massiu i validació per al Web Privat (Professors)
 */

let paisPrivat = null;

function carregarPaisPrivat() {
    const llavor = parseInt(document.getElementById('privat-llavor').value);
    const dificultat = document.getElementById('privat-dificultat').value;

    if (!llavor) {
        alert("Introdueix una llavor numèrica vàlida.");
        return;
    }

    paisPrivat = generarPais(llavor, dificultat);

    // Dibuixar els inputs d'impostos segons la dificultat
    const numTrams = numTramsPerDificultat(dificultat);
    const defaults = tramsIRPFPerDefecte(dificultat);
    const contTrams = document.getElementById('privat-trams-irpf');
    contTrams.innerHTML = '';

    for (let i = 0; i < numTrams; i++) {
        const def = defaults[i] || { desde: 0, percentatge: 0 };
        const readonly = i === 0 ? 'readonly disabled class="w-full px-2 py-1 border rounded bg-slate-100 text-xs"' : 'class="w-full px-2 py-1 border rounded text-xs tax-input-privat"';
        contTrams.innerHTML += `
            <div class="flex gap-2 items-center">
                <span class="text-xs text-slate-500 w-12">Tram ${i+1}:</span>
                <input type="number" id="privat-irpf-desde-${i}" value="${def.desde}" ${readonly}>
                <input type="number" step="0.1" id="privat-irpf-pct-${i}" value="${def.percentatge}" class="w-16 px-2 py-1 border rounded text-right tax-input-privat">
                <span class="text-xs text-slate-500">%</span>
            </div>
        `;
    }

    // Valors per defecte patrimoni i iva
    const defPat = patrimoniPerDefecte();
    document.getElementById('privat-pat-minim').value = defPat.minimExempt;
    document.getElementById('privat-pat-pct').value = defPat.percentatge;

    const defIva = ivaPerDefecte();
    document.getElementById('privat-iva-basic').value = defIva.basic;
    document.getElementById('privat-iva-normal').value = defIva.normal;
    document.getElementById('privat-iva-luxe').value = defIva.luxe;

    // Mostrar seccions
    document.getElementById('seccio-impostos-privat').classList.remove('hidden');
    document.getElementById('seccio-repartiment').classList.remove('hidden');
    document.getElementById('seccio-resultats').classList.add('hidden');
}

// Funció auxiliar per llegir impostos específica del web privat
function llegirConfiguracioPrivat() {
    const dificultat = document.getElementById('privat-dificultat').value;
    const numTrams = numTramsPerDificultat(dificultat);
    const trams = [];
    for (let i = 0; i < numTrams; i++) {
        const desde = parseFloat(document.getElementById(`privat-irpf-desde-${i}`).value) || 0;
        const pct = parseFloat(document.getElementById(`privat-irpf-pct-${i}`).value) || 0;
        trams.push({ desde, percentatge: pct });
    }
    return {
        trams,
        patrimoni: {
            minimExempt: parseFloat(document.getElementById('privat-pat-minim').value) || 0,
            percentatge: parseFloat(document.getElementById('privat-pat-pct').value) || 0
        },
        iva: {
            basic: parseFloat(document.getElementById('privat-iva-basic').value) || 0,
            normal: parseFloat(document.getElementById('privat-iva-normal').value) || 0,
            luxe: parseFloat(document.getElementById('privat-iva-luxe').value) || 0
        }
    };
}

// Executar el càlcul real de tot el país
function executarValidacio() {
    if (!paisPrivat) return;

    // Validar percentatges de pressupost (han de sumar 100)
    const pSanitat = parseFloat(document.getElementById('pct-sanitat').value) || 0;
    const pEducacio = parseFloat(document.getElementById('pct-educacio').value) || 0;
    const pSeguretat = parseFloat(document.getElementById('pct-seguretat').value) || 0;
    const pFoment = parseFloat(document.getElementById('pct-foment').value) || 0;
    const sumaPct = pSanitat + pEducacio + pSeguretat + pFoment;

    const lblSuma = document.getElementById('avís-suma-pct');
    lblSuma.innerText = `Suma total: ${sumaPct}%`;
    if (sumaPct !== 100) {
        lblSuma.className = "text-sm font-bold text-red-600";
        alert("Atenció: La suma dels percentatges de pressupost ha de ser exactament del 100%.");
        return;
    } else {
        lblSuma.className = "text-sm font-semibold text-green-600";
    }

    const dificultat = document.getElementById('privat-dificultat').value;
    const configImpostos = llegirConfiguracioPrivat();

    // Càlcul Massiu: Recaptació Total del País
    let recaptacioTotalReal = 0;
    let hiHaEvasiomGeneral = false;

    paisPrivat.demografia.forEach(grup => {
        // Avaluem el perfil individual amb el motor fiscal
        const resPerfil = avaluarPerfil(paisPrivat, dificultat,rup.perfil = grup.perfil, configImpostos);
        
        // Multipliquem la quota individual per la població absoluta d'aquest grup
        const recaptacioGrup = resPerfil.totalIndividual * grup.poblacio_absoluta;
        recaptacioTotalReal += recaptacioGrup;

        if (resPerfil.regla.disparada && SENTIMENT_SOCIOLOGIES[resPerfil.regla.sociologia.clau] === 'perill') {
            hiHaEvasiomGeneral = true;
        }
    });

    recaptacioTotalReal = Math.round(recaptacioTotalReal);

    // Mostrar secció resultats
    document.getElementById('seccio-resultats').classList.remove('hidden');
    document.getElementById('resum-reaptacio-total').innerText = formatEuros(recaptacioTotalReal);

    const lblEstat = document.getElementById('resum-estat-general');
    if (hiHaEvasiomGeneral) {
        lblEstat.innerText = "⚠️ Alerta: S'han activat fugues o crisis econòmiques";
        lblEstat.className = "inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 bg-red-100 text-red-700";
    } else {
        lblEstat.innerText = "✅ Economia estable sense fugues crítiques";
        lblEstat.className = "inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 bg-green-100 text-green-700";
    }

    // Calcular pressupostos reals per departament segons els % de l'alumne
    const pressupostosReals = {
        sanitat: recaptacioTotalReal * (pSanitat / 100),
        educacio: recaptacioTotalReal * (pEducacio / 100),
        seguretat: recaptacioTotalReal * (pSeguretat / 100),
        foment: recaptacioTotalReal * (pFoment / 100)
    };

    // Avaluar contra els requisits del país (Mínim, Normal, Òptim, Excel·lència)
    const departamentsBase = paisPrivat.pressupostos_departaments;
    const graella = document.getElementById('graella-resultats-departaments');
    graella.innerHTML = '';

    const nomsDep = { sanitat: "Sanitat Pública", educacio: "Educació Pública", seguretat: "Seguretat i Justícia", foment: "Foment i Economia" };

    Object.keys(pressupostosReals).forEach(clau => {
        const dinersReals = pressupostosReals[clau];
        const reqs = departamentsBase[clau];
        
        // Determinar nivell assolit
        let nivellAssolit = "";
        let classeCSS = "";
        let icona = "";

        if (dinersReals >= reqs.excellencia) {
            nivellAssolit = "🏆 Excel·lència (Objectiu Enorme Assolit!)";
            classeCSS = "bg-emerald-50 border-emerald-300 text-emerald-900";
            icona = "fa-solid fa-trophy text-emerald-600";
        } else if (dinersReals >= reqs.optim) {
            nivellAssolit = "🟢 Manteniment Òptim (Molt Bona Gestió)";
            classeCSS = "bg-blue-50 border-blue-300 text-blue-900";
            icona = "fa-solid fa-circle-check text-blue-600";
        } else if (dinersReals >= reqs.normal) {
            nivellAssolit = "🟡 Manteniment Normal (Estable)";
            classeCSS = "bg-yellow-50 border-yellow-300 text-yellow-900";
            icona = "fa-solid fa-triangle-exclamation text-yellow-600";
        } else if (dinersReals >= reqs.minim) {
            nivellAssolit = "🟠 Mínim Vital (Risc de Col·lapse!)";
            classeCSS = "bg-orange-50 border-orange-300 text-orange-900";
            icona = "fa-solid fa-circle-exclamation text-orange-600";
        } else {
            nivellAssolit = "🔴 INSUFICIENT (Tancament i Crisi)";
            classeCSS = "bg-red-50 border-red-300 text-red-900";
            icona = "fa-solid fa-ban text-red-600";
        }

        const card = document.createElement('div');
        card.className = `p-6 rounded-xl border shadow-sm ${classeCSS}`;
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-2">
                    <i class="${icona} text-xl"></i>
                    <h3 class="font-bold text-lg">${nomsDep[clau]}</h3>
                </div>
                <span class="font-black text-xl">${formatEuros(dinersReals)}</span>
            </div>
            
            <div class="font-bold text-sm mb-3">Veredicte: ${nivellAssolit}</div>

            <div class="text-xs space-y-1 opacity-80 border-t pt-2 border-slate-200">
                <div class="flex justify-between"><span>Mínim necessari:</span> <span>${formatEuros(reqs.minim)}</span></div>
                <div class="flex justify-between"><span>Normal:</span> <span>${formatEuros(reqs.normal)}</span></div>
                <div class="flex justify-between"><span>Òptim:</span> <span>${formatEuros(reqs.optim)}</span></div>
                <div class="flex justify-between"><span>Excel·lència:</span> <span>${formatEuros(reqs.excellencia)}</span></div>
            </div>
        `;
        graella.appendChild(card);
    });
}
