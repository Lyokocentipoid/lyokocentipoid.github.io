/**
 * generador.js
 * Generador Determinista de Poblacions - Simulador Fiscal
 *
 * IMPORTANT: Aquest fitxer requereix que 'configuracio.js' estigui carregat
 * prèviament a l'HTML perquè utilitza l'objecte global DADES_SIMULACIO.
 */

// 1. Motor PRNG (Pseudo-Random Number Generator)
// Genera sempre la mateixa seqüència de nombres per a una mateixa llavor
function crearPRNG(llavor) {
    return function() {
        let t = llavor += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// 2. Catàleg de Perfils Base segons dificultat
function obtenirPerfils(dificultat) {
    if (dificultat === "normal") {
        return [
            { nom: "Renda Baixa", pctBase: 50, ing: 15000, pat: 5000, des_b: 12000, des_n: 2000, des_l: 0, deduccions: 0 },
            { nom: "Renda Mitjana", pctBase: 35, ing: 30000, pat: 40000, des_b: 15000, des_n: 10000, des_l: 2000, deduccions: 0 },
            { nom: "Renda Alta", pctBase: 15, ing: 70000, pat: 150000, des_b: 20000, des_n: 25000, des_l: 10000, deduccions: 0 }
        ];
    } else if (dificultat === "dificil") {
        return [
            { nom: "La Família Ofegada", pctBase: 30, ing: 24000, pat: 0, des_b: 18000, des_n: 5000, des_l: 0, deduccions: 0 },
            { nom: "El Jubilat amb Pis", pctBase: 20, ing: 15000, pat: 250000, des_b: 10000, des_n: 5000, des_l: 0, deduccions: 0 },
            { nom: "L'Estalviador Clàssic", pctBase: 30, ing: 35000, pat: 120000, des_b: 15000, des_n: 12000, des_l: 1000, deduccions: 0 },
            { nom: "El Nou Ric", pctBase: 15, ing: 90000, pat: 30000, des_b: 25000, des_n: 30000, des_l: 30000, deduccions: 0 },
            { nom: "La Gran Fortuna", pctBase: 5, ing: 300000, pat: 2000000, des_b: 40000, des_n: 60000, des_l: 80000, deduccions: 0 }
        ];
    } else if (dificultat === "repte") {
        // Mode Repte: 7 perfils i aplicació de deduccions
        return [
            { nom: "L'Estudiant Precari", pctBase: 10, ing: 10000, pat: 0, des_b: 9500, des_n: 500, des_l: 0, deduccions: 0 },
            { nom: "La Família Nombrosa", pctBase: 20, ing: 32000, pat: 10000, des_b: 25000, des_n: 6000, des_l: 0, deduccions: 6000 },
            { nom: "El Jubilat Dependent", pctBase: 15, ing: 18000, pat: 180000, des_b: 15000, des_n: 3000, des_l: 0, deduccions: 4000 },
            { nom: "L'Estalviador", pctBase: 25, ing: 40000, pat: 150000, des_b: 16000, des_n: 12000, des_l: 2000, deduccions: 0 },
            { nom: "El Fals Autònom", pctBase: 15, ing: 28000, pat: 5000, des_b: 20000, des_n: 7000, des_l: 1000, deduccions: 2000 },
            { nom: "El Nou Ric", pctBase: 10, ing: 110000, pat: 40000, des_b: 30000, des_n: 40000, des_l: 40000, deduccions: 0 },
            { nom: "La Gran Fortuna", pctBase: 5, ing: 450000, pat: 3500000, des_b: 50000, des_n: 80000, des_l: 150000, deduccions: 0 }
        ];
    }
}

// 3. Funció Principal de Generació
function generarPais(llavorNum, dificultat) {
    // Inicialitzem el generador aleatori amb la llavor de l'usuari
    const random = crearPRNG(llavorNum);

    // Funcions d'ajuda per a la generació determinista
    const triarElement = (array) => array[Math.floor(random() * array.length)];
    const variarPercentatge = (base, variacio) => Math.round(base * (1 + (random() * variacio * 2 - variacio))); // +/- variacio%

    // 3.1. Escala del món i Nom
    const esCiutat = dificultat === "normal";
    const nomUbicacio = esCiutat
        ? triarElement(DADES_SIMULACIO.noms.ciutats)
        : triarElement(DADES_SIMULACIO.noms.paisos);

    // Generació de població base rodona
    let poblacioTotal = esCiutat
        ? (Math.floor(random() * 5) + 5) * 10000       // Entre 50.000 i 90.000 habitants
        : (Math.floor(random() * 4) + 2) * 10000000;   // Entre 20.000.000 i 50.000.000 habitants

    // 3.2. Escollir sociologia compatible amb la dificultat
    const sociologiesValides = DADES_SIMULACIO.sociologies.filter(soc =>
        soc.modes_compatibles.includes(dificultat)
    );
    const sociologia = triarElement(sociologiesValides);

    // 3.3. Preparar la demografia
    const llistaPerfils = obtenirPerfils(dificultat);
    let demografiaFinal = [];
    let sumaPercentatges = 0;

    // Variació determinista dels percentatges de la població
    llistaPerfils.forEach(p => {
        p.pctReal = p.pctBase + Math.floor((random() * 4) - 2); // Variació d'entre -2 i +2 punts
        if (p.pctReal < 1) p.pctReal = 1; // Evitar percentatges zero o negatius
        sumaPercentatges += p.pctReal;
    });

    let indexRiquesaTotal = 0; // PIB simulat per calcular pressupostos

    // Normalització dels percentatges i creació dels perfils finals
    llistaPerfils.forEach((p, index) => {
        // Assegurem que la suma total dels percentatges sigui exactament 100%
        let pct = (index === llistaPerfils.length - 1)
            ? Math.round(100 - demografiaFinal.reduce((acc, curr) => acc + curr.percentatge, 0))
            : Math.round((p.pctReal / sumaPercentatges) * 100);

        let poblacioAbsoluta = Math.round((pct / 100) * poblacioTotal);

        // Varia ingressos i patrimoni un +/- 10% mantenint múltiples de 1000 per ser calculable a mà
        let ing_final = Math.round(variarPercentatge(p.ing, 0.10) / 1000) * 1000;
        let pat_final = Math.round(variarPercentatge(p.pat, 0.10) / 1000) * 1000;

        indexRiquesaTotal += (ing_final * poblacioAbsoluta);

        demografiaFinal.push({
            perfil: p.nom,
            percentatge: pct,
            poblacio_absoluta: poblacioAbsoluta,
            economia_anual: {
                ingressos: ing_final,
                patrimoni: pat_final,
                deduccions_irpf: p.deduccions,
                despeses: {
                    basiques: p.des_b,
                    normals: p.des_n,
                    luxe: p.des_l
                }
            }
        });
    });

    // 3.4. Calcular els costos pressupostaris segons la riquesa total
    // Un país més ric tindrà ministeris més cars de mantenir
    const pressupostBase = indexRiquesaTotal * 0.05; // 5% de la suma de tots els ingressos

    const pressupostos = {
        sanitat: {
            minim: Math.round(pressupostBase * 0.8),
            normal: Math.round(pressupostBase * 1.5),
            optim: Math.round(pressupostBase * 2.2),
            excellencia: Math.round(pressupostBase * 3.5)
        },
        educacio: {
            minim: Math.round(pressupostBase * 0.6),
            normal: Math.round(pressupostBase * 1.2),
            optim: Math.round(pressupostBase * 1.8),
            excellencia: Math.round(pressupostBase * 2.8)
        },
        seguretat: {
            minim: Math.round(pressupostBase * 0.3),
            normal: Math.round(pressupostBase * 0.6),
            optim: Math.round(pressupostBase * 1.0),
            excellencia: Math.round(pressupostBase * 1.5)
        },
        foment: {
            minim: Math.round(pressupostBase * 0.2),
            normal: Math.round(pressupostBase * 0.7),
            optim: Math.round(pressupostBase * 1.3),
            excellencia: Math.round(pressupostBase * 2.5)
        }
    };

    // 3.5. Retornar el document JSON final
    return {
        metadades: {
            llavor_id: llavorNum,
            dificultat: dificultat,
            nom_ubicacio: nomUbicacio,
            poblacio_total: poblacioTotal,
            sociologia_clau: sociologia.clau,
            pista_sociologica: sociologia.pista
        },
        demografia: demografiaFinal,
        pressupostos_departaments: pressupostos
    };
}

// ==========================================
// EXEMPLE DE COM HO CRIDARÀS DES DEL TEU HTML:
// ==========================================
// const llavor = parseInt(document.getElementById('input-llavor').value);
// const dificultat = document.getElementById('select-dificultat').value;
// const jsonPais = generarPais(llavor, dificultat);
// console.log(jsonPais);
