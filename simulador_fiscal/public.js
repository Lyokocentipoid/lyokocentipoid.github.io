/**
 * public.js
 * Lògica de la interfície d'usuari per al Web Públic (Alumnes)
 */

// Variables d'estat globals de l'aplicació
let paisActual = null;
let dificultatActual = null;
let chartDemografia = null;

// ==========================================
// 1. NAVEGACIÓ ENTRE PESTANYES
// ==========================================
function canviarPestanya(idPestanya, botonClickat) {
    // Amagar totes les seccions
    document.getElementById('tab-demografia').classList.add('hidden-tab');
    document.getElementById('tab-laboratori').classList.add('hidden-tab');
    document.getElementById('tab-necessitats').classList.add('hidden-tab');
    
    // Mostrar la seleccionada
    document.getElementById(idPestanya).classList.remove('hidden-tab');

    // Estils dels botons
    const botons = document.getElementById('main-nav').children;
    for (let btn of botons) {
        btn.classList.remove('active-tab');
        btn.classList.add('text-slate-500');
    }
    botonClickat.classList.add('active-tab');
    botonClickat.classList.remove('text-slate-500');
}

// ==========================================
// 2. GENERACIÓ DEL PAÍS (PESTANYA A)
// ==========================================
function generarIActualitzar() {
    const llavorInput = document.getElementById('input-llavor').value;
    const dificultatSelect = document.getElementById('select-dificultat').value;

    if (!llavorInput) {
        alert("Si us plau, introdueix una llavor numèrica primer.");
        return;
    }

    // Cridem al backend (generador.js)
    const llavor = parseInt(llavorInput);
    dificultatActual = dificultatSelect;
    paisActual = generarPais(llavor, dificultatActual);

    // Dibuixar interfície Demografia
    renderitzarPestanyaDemografia();
    
    // Preparar Laboratori
    prepararPestanyaLaboratori();

    // Preparar Necessitats
    renderitzarPestanyaNecessitats();

    // Mostrar el contingut ocult de les altres pestanyes
    document.getElementById('alerta-generar-primer').classList.add('hidden');
    document.getElementById('contingut-laboratori').classList.remove('hidden');
    document.getElementById('alerta-generar-primer-2').classList.add('hidden');
    document.getElementById('contingut-necessitats').classList.remove('hidden');
}

function renderitzarPestanyaDemografia() {
    document.getElementById('resultats-demografia').classList.remove('hidden');
    document.getElementById('nom-pais').innerText = paisActual.metadades.nom_ubicacio;
    document.getElementById('poblacio-total').innerText = formatNumero(paisActual.metadades.poblacio_total);
    document.getElementById('pista-sociologica').innerText = paisActual.metadades.pista_sociologica;

    // Targetes de perfils
    const contenidor = document.getElementById('contenidor-targetes');
    contenidor.innerHTML = '';
    
    let chartLabels = [];
    let chartData = [];
    let chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

    paisActual.demografia.forEach((p, index) => {
        chartLabels.push(p.perfil);
        chartData.push(p.percentatge);

        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow";
        
        // Comprovem si té deduccions (Mode Repte) per mostrar-ho
        let deduccionsHTML = '';
        if (p.economia_anual.deduccions_irpf > 0) {
            deduccionsHTML = `<div class="text-xs font-semibold text-green-600 mt-1"><i class="fa-solid fa-leaf"></i> Deduccions previstes: ${formatEuros(p.economia_anual.deduccions_irpf)}</div>`;
        }

        card.innerHTML = `
            <div class="flex justify-between items-start border-b pb-2 mb-3">
                <h4 class="font-bold text-slate-800 text-lg">${p.perfil}</h4>
                <span class="bg-slate-100 text-slate-700 py-1 px-2 rounded font-bold text-sm">${p.percentatge}%</span>
            </div>
            <p class="text-xs text-slate-500 mb-3"><i class="fa-solid fa-users"></i> ${formatNumero(p.poblacio_absoluta)} persones</p>
            
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="bg-blue-50 p-2 rounded">
                    <span class="block text-xs text-blue-600 font-bold uppercase">Ingressos</span>
                    <span class="font-bold text-slate-800">${formatEuros(p.economia_anual.ingressos)}</span>
                    ${deduccionsHTML}
                </div>
                <div class="bg-purple-50 p-2 rounded">
                    <span class="block text-xs text-purple-600 font-bold uppercase">Patrimoni</span>
                    <span class="font-bold text-slate-800">${formatEuros(p.economia_anual.patrimoni)}</span>
                </div>
            </div>
            <div class="mt-2 bg-slate-50 p-2 rounded text-xs space-y-1 border border-slate-100">
                <span class="block text-xs text-slate-500 font-bold uppercase mb-1">Despeses</span>
                <div class="flex justify-between"><span>Bàsiques:</span> <span class="font-medium">${formatEuros(p.economia_anual.despeses.basiques)}</span></div>
                <div class="flex justify-between"><span>Normals:</span> <span class="font-medium">${formatEuros(p.economia_anual.despeses.normals)}</span></div>
                <div class="flex justify-between"><span>Luxe:</span> <span class="font-medium">${formatEuros(p.economia_anual.despeses.luxe)}</span></div>
            </div>
        `;
        contenidor.appendChild(card);
    });

    // Dibuixar Gràfica Chart.js
    if (chartDemografia) chartDemografia.destroy();
    const ctx = document.getElementById('grafic-demografia').getContext('2d');
    chartDemografia = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors.slice(0, chartData.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }
            },
            cutout: '65%'
        }
    });
}

// ==========================================
// 3. LABORATORI D'IMPOSTOS (PESTANYA B)
// ==========================================
function prepararPestanyaLaboratori() {
    const numTrams = numTramsPerDificultat(dificultatActual);
    const defaultsIRPF = tramsIRPFPerDefecte(dificultatActual);
    
    // 3.1. Generar inputs d'IRPF
    const contIRPF = document.getElementById('contenidor-trams-irpf');
    contIRPF.innerHTML = '';
    
    for (let i = 0; i < numTrams; i++) {
        const def = defaultsIRPF[i] || { desde: 0, percentatge: 0 };
        const readonlyHTML = i === 0 ? 'readonly disabled class="w-full px-3 py-2 border border-slate-300 rounded bg-slate-100 text-slate-500"' : 'class="w-full px-3 py-2 border border-slate-300 rounded tax-input"';
        
        contIRPF.innerHTML += `
            <div class="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                <span class="text-sm font-medium text-slate-500 w-16">Tram ${i+1}:</span>
                <div class="flex-1">
                    <div class="flex items-center">
                        <span class="text-xs mr-2 text-slate-500">Des de</span>
                        <input type="number" id="irpf-desde-${i}" value="${def.desde}" ${readonlyHTML}>
                        <span class="text-xs ml-2 text-slate-500">€</span>
                    </div>
                </div>
                <div class="w-24">
                    <div class="flex items-center">
                        <input type="number" id="irpf-pct-${i}" value="${def.percentatge}" step="0.1" class="w-full px-3 py-2 border border-slate-300 rounded text-right tax-input">
                        <span class="text-xs ml-1 text-slate-500">%</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 3.2. Valors per defecte Patrimoni i IVA
    const defPat = patrimoniPerDefecte();
    document.getElementById('patrimoni-minim').value = defPat.minimExempt;
    document.getElementById('patrimoni-pct').value = defPat.percentatge;

    const defIva = ivaPerDefecte();
    document.getElementById('iva-basic').value = defIva.basic;
    document.getElementById('iva-normal').value = defIva.normal;
    document.getElementById('iva-luxe').value = defIva.luxe;

    // 3.3. Omplir el selector de perfils
    const selectPerfil = document.getElementById('select-perfil');
    selectPerfil.innerHTML = '';
    paisActual.demografia.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.perfil;
        opt.innerText = p.perfil;
        selectPerfil.appendChild(opt);
    });

    // 3.4. Afegir listeners als inputs perquè recalculin a l'instant
    const totsElsInputs = document.querySelectorAll('.tax-input');
    totsElsInputs.forEach(input => {
        input.addEventListener('input', recalcularSimulacioIndividual);
    });
    
    selectPerfil.addEventListener('change', recalcularSimulacioIndividual);

    // Executar càlcul inicial
    recalcularSimulacioIndividual();
}

// CRIDA AL MOTOR FISCAL I PINTAT DE LA FITXA
function recalcularSimulacioIndividual() {
    if (!paisActual) return;

    const perfilNom = document.getElementById('select-perfil').value;
    const numTrams = numTramsPerDificultat(dificultatActual);
    
    // 1. Llegim els inputs (utilitzem la funció del motor)
    const configImpostos = llegirConfiguracioImpostosDelDOM(numTrams);
    
    // 2. El motor avalua (aplica regles d'evasió si cal i calcula impostos)
    const resultat = avaluarPerfil(paisActual, dificultatActual, perfilNom, configImpostos);
    if (!resultat) return;

    // 3. Actualitzar UI - Dades Bàsiques
    document.getElementById('fitxa-nom').innerText = resultat.perfil;
    const dadesBase = paisActual.demografia.find(p => p.perfil === perfilNom);
    document.getElementById('fitxa-poblacio').innerText = `Representa ${formatNumero(dadesBase.poblacio_absoluta)} habitants`;

    // 4. Mostrar/Amagar Deduccions
    const divDed = document.getElementById('div-deduccions');
    if (resultat.original.deduccions_irpf > 0) {
        divDed.classList.remove('hidden');
        document.getElementById('fitxa-deduccions').innerText = formatEuros(resultat.original.deduccions_irpf);
    } else {
        divDed.classList.add('hidden');
    }

    // 5. Gestionar l'Alerta de Regla
    const alertaDiv = document.getElementById('alerta-regla');
    if (resultat.regla.disparada) {
        alertaDiv.classList.remove('hidden');
        document.getElementById('alerta-titol').innerText = "Regla Sociològica Activada";
        document.getElementById('alerta-text').innerText = resultat.regla.consequencia;
        
        // Estil segons sentiment
        const sentiment = SENTIMENT_SOCIOLOGIES[resultat.regla.sociologia.clau] || 'perill';
        alertaDiv.className = `mb-4 p-5 rounded-lg border shadow-sm fade-in transition-all ${
            sentiment === 'exit' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800 pulse-danger'
        }`;
        
        const icona = document.getElementById('alerta-icona');
        icona.className = sentiment === 'exit' 
            ? 'fa-solid fa-circle-check text-2xl mt-1 text-green-600'
            : 'fa-solid fa-triangle-exclamation text-2xl mt-1 text-red-600';

    } else {
        alertaDiv.classList.add('hidden');
    }

    // 6. Funcio auxiliar per mostrar originals tatxats si han canviat
    const renderCanvi = (idReal, idOriginal, valorReal, valorOriginal) => {
        document.getElementById(idReal).innerText = formatEuros(valorReal);
        const spanOriginal = document.getElementById(idOriginal);
        if (valorReal !== valorOriginal) {
            spanOriginal.innerText = formatEuros(valorOriginal);
            spanOriginal.classList.remove('hidden');
        } else {
            spanOriginal.classList.add('hidden');
        }
    };

    // Pinta valors econòmics
    renderCanvi('fitxa-ing-real', 'fitxa-ing-original', resultat.ajustat.ingressos, resultat.original.ingressos);
    renderCanvi('fitxa-pat-real', 'fitxa-pat-original', resultat.ajustat.patrimoni, resultat.original.patrimoni);
    renderCanvi('fitxa-des-b-real', 'fitxa-des-b-original', resultat.ajustat.despeses.basiques, resultat.original.despeses.basiques);
    renderCanvi('fitxa-des-n-real', 'fitxa-des-n-original', resultat.ajustat.despeses.normals, resultat.original.despeses.normals);
    renderCanvi('fitxa-des-l-real', 'fitxa-des-l-original', resultat.ajustat.despeses.luxe, resultat.original.despeses.luxe);

    // 7. Pintar Impostos (El que interessa a l'alumne per fer els seus càlculs)
    document.getElementById('fitxa-quota-irpf').innerText = formatEuros(resultat.irpf.quota);
    document.getElementById('fitxa-irpf-detall').innerText = `Marginal: ${resultat.irpf.tipusMarginal}% | Mitjana: ${resultat.irpf.tipusMitja}%`;

    document.getElementById('fitxa-quota-pat').innerText = formatEuros(resultat.patrimoni.quota);
    document.getElementById('fitxa-pat-detall').innerText = `Base Tributable: ${formatEuros(resultat.patrimoni.baseTributable)}`;

    document.getElementById('fitxa-quota-iva').innerText = formatEuros(resultat.iva.total);

    document.getElementById('fitxa-quota-total').innerText = formatEuros(resultat.totalIndividual);
}

// ==========================================
// 4. PESTANYA DE NECESSITATS (MINISTERIS)
// ==========================================
function renderitzarPestanyaNecessitats() {
    const contenidor = document.getElementById('graella-ministeris');
    contenidor.innerHTML = '';

    const deps = paisActual.pressupostos_departaments;
    
    const icones = {
        sanitat: '<i class="fa-solid fa-heart-pulse text-red-500"></i>',
        educacio: '<i class="fa-solid fa-graduation-cap text-blue-500"></i>',
        seguretat: '<i class="fa-solid fa-shield-halved text-slate-700"></i>',
        foment: '<i class="fa-solid fa-road text-orange-500"></i>'
    };
    
    const noms = { sanitat: "Sanitat Pública", educacio: "Educació Pública", seguretat: "Seguretat i Justícia", foment: "Foment i Economia" };

    Object.keys(deps).forEach(clau => {
        const d = deps[clau];
        const card = document.createElement('div');
        card.className = "bg-white p-6 rounded-xl shadow-sm border border-slate-200";
        
        card.innerHTML = `
            <div class="flex items-center gap-3 mb-6 border-b pb-4">
                <div class="text-3xl">${icones[clau]}</div>
                <h3 class="text-xl font-bold text-slate-800">${noms[clau]}</h3>
            </div>
            
            <div class="space-y-4">
                <div class="flex justify-between items-center p-3 bg-red-50 rounded border-l-4 border-red-500">
                    <div>
                        <span class="block font-bold text-red-800">Mínim Vital</span>
                        <span class="text-xs text-red-600">Risc de col·lapse si no s'arriba</span>
                    </div>
                    <span class="font-black text-red-700">${formatEuros(d.minim)}</span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                    <div>
                        <span class="block font-bold text-yellow-800">Manteniment Normal</span>
                        <span class="text-xs text-yellow-600">Serveis estables</span>
                    </div>
                    <span class="font-black text-yellow-700">${formatEuros(d.normal)}</span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                    <div>
                        <span class="block font-bold text-blue-800">Manteniment Òptim</span>
                        <span class="text-xs text-blue-600">Bona qualitat i eficiència</span>
                    </div>
                    <span class="font-black text-blue-700">${formatEuros(d.optim)}</span>
                </div>
                
                <div class="flex justify-between items-center p-3 bg-green-50 rounded border-l-4 border-green-500">
                    <div>
                        <span class="block font-bold text-green-800">Excel·lència</span>
                        <span class="text-xs text-green-600">Grans projectes de futur</span>
                    </div>
                    <span class="font-black text-green-700">${formatEuros(d.excellencia)}</span>
                </div>
            </div>
        `;
        contenidor.appendChild(card);
    });
}
