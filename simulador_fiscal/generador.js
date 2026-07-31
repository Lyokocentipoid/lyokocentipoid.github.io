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

// Selecciona un element (deterministament, amb la llavor) d'un array
function triarAmb(random, array) {
    return array[Math.floor(random() * array.length)];
}

// ---------------------------------------------------------------
// 2. Catàleg de Perfils Base segons dificultat
//
// Cada perfil té un "id" ESTABLE (el fan servir les sociologies de
// configuracio.js per saber a qui afecten) i una llista de "variants"
// de nom/personatge: a cada partida (llavor) se'n tria un a l'atzar,
// perquè els perfils no es diguin sempre exactament igual.
// ---------------------------------------------------------------
function obtenirPerfils(dificultat, random) {
    let plantilles;

    if (dificultat === "normal") {
        plantilles = [
            { id: "renda_baixa", variants: ["Renda Baixa"], pctBase: 50, ing: 15000, pat: 5000, des_b: 12000, des_n: 2000, des_l: 0, deduccions: 0 },
            { id: "renda_mitjana", variants: ["Renda Mitjana"], pctBase: 35, ing: 30000, pat: 40000, des_b: 15000, des_n: 10000, des_l: 2000, deduccions: 0 },
            { id: "renda_alta", variants: ["Renda Alta"], pctBase: 15, ing: 70000, pat: 150000, des_b: 20000, des_n: 25000, des_l: 10000, deduccions: 0 }
        ];
    } else if (dificultat === "dificil") {
        plantilles = [
            { id: "familia_ofegada", variants: ["La Família Ofegada", "La Família al Límit", "La Llar Endeutada"], pctBase: 30, ing: 24000, pat: 0, des_b: 18000, des_n: 5000, des_l: 0, deduccions: 0 },
            { id: "jubilat_pis", variants: ["El Jubilat amb Pis", "La Vídua Propietària", "El Rendista Immobiliari"], pctBase: 20, ing: 15000, pat: 250000, des_b: 10000, des_n: 5000, des_l: 0, deduccions: 0 },
            { id: "estalviador_classic", variants: ["L'Estalviador Clàssic", "El Funcionari Previngut", "La Mestressa Estalviadora"], pctBase: 30, ing: 35000, pat: 120000, des_b: 15000, des_n: 12000, des_l: 1000, deduccions: 0 },
            { id: "nou_ric", variants: ["El Nou Ric", "L'Emprenedor Digital", "L'Influencer Milionari"], pctBase: 15, ing: 90000, pat: 30000, des_b: 25000, des_n: 30000, des_l: 30000, deduccions: 0 },
            { id: "gran_fortuna", variants: ["La Gran Fortuna", "L'Hereu Industrial", "La Dinastia Bancària"], pctBase: 5, ing: 300000, pat: 2000000, des_b: 40000, des_n: 60000, des_l: 80000, deduccions: 0 }
        ];
    } else if (dificultat === "repte") {
        // Mode Repte: 7 perfils i aplicació de deduccions
        plantilles = [
            { id: "estudiant_precari", variants: ["L'Estudiant Precari", "El Becari Etern", "La Doctoranda Sense Beca"], pctBase: 10, ing: 10000, pat: 0, des_b: 9500, des_n: 500, des_l: 0, deduccions: 0 },
            { id: "familia_nombrosa", variants: ["La Família Nombrosa", "Els Pares amb Bessons", "La Família Multigeneracional"], pctBase: 20, ing: 32000, pat: 10000, des_b: 25000, des_n: 6000, des_l: 0, deduccions: 6000 },
            { id: "jubilat_dependent", variants: ["El Jubilat Dependent", "L'Àvia amb Cuidadora", "El Pensionista Malalt"], pctBase: 15, ing: 18000, pat: 180000, des_b: 15000, des_n: 3000, des_l: 0, deduccions: 4000 },
            { id: "estalviador", variants: ["L'Estalviador", "El Tècnic amb Pla de Pensions", "La Inversora Prudent"], pctBase: 25, ing: 40000, pat: 150000, des_b: 16000, des_n: 12000, des_l: 2000, deduccions: 0 },
            { id: "fals_autonom", variants: ["El Fals Autònom", "El Repartidor per Plataforma", "La Dissenyadora Freelance"], pctBase: 15, ing: 28000, pat: 5000, des_b: 20000, des_n: 7000, des_l: 1000, deduccions: 2000 },
            { id: "nou_ric", variants: ["El Nou Ric", "El Fundador de Startup", "La Trader de Criptomonedes"], pctBase: 10, ing: 110000, pat: 40000, des_b: 30000, des_n: 40000, des_l: 40000, deduccions: 0 },
            { id: "gran_fortuna", variants: ["La Gran Fortuna", "El Magnat Naviler", "La Hereva d'Imperi Familiar"], pctBase: 5, ing: 450000, pat: 3500000, des_b: 50000, des_n: 80000, des_l: 150000, deduccions: 0 }
        ];
    } else {
        plantilles = [];
    }

    return plantilles.map(p => ({
        id: p.id,
        nom: triarAmb(random, p.variants),
        pctBase: p.pctBase,
        ing: p.ing,
        pat: p.pat,
        des_b: p.des_b,
        des_n: p.des_n,
        des_l: p.des_l,
        deduccions: p.deduccions
    }));
}

// ---------------------------------------------------------------
// 2b. Catàleg de departaments (multiplicadors sobre el pressupostBase)
// i quins departaments hi ha a cada dificultat.
// El "factor" de pressupostBase es redueix a mesura que hi ha més
// departaments, per mantenir el pressupost total en un ordre de
// magnitud semblant sigui quina sigui la dificultat.
// ---------------------------------------------------------------
const CATALEG_DEPARTAMENTS = {
    sanitat:          { minim: 0.8, normal: 1.5, optim: 2.4,  excellencia: 4.3 },
    educacio:         { minim: 0.6, normal: 1.2, optim: 1.95, excellencia: 3.4 },
    seguretat:        { minim: 0.3, normal: 0.6, optim: 1.05, excellencia: 1.9 },
    foment:           { minim: 0.2, normal: 0.7, optim: 1.4,  excellencia: 3.1 },
    serveis_socials:  { minim: 0.5, normal: 0.9, optim: 1.5,  excellencia: 2.8 },
    cultura:          { minim: 0.2, normal: 0.5, optim: 0.95, excellencia: 1.9 },
    justicia:         { minim: 0.4, normal: 0.8, optim: 1.3,  excellencia: 2.4 },
    medi_ambient:     { minim: 0.3, normal: 0.6, optim: 1.05, excellencia: 2.2 },
    habitatge:        { minim: 0.5, normal: 0.9, optim: 1.6,  excellencia: 2.9 }
};

const DEPARTAMENTS_PER_DIFICULTAT = {
    normal: ["sanitat", "educacio", "seguretat", "foment"],
    dificil: ["sanitat", "educacio", "seguretat", "foment", "serveis_socials"],
    repte: ["sanitat", "educacio", "seguretat", "foment", "serveis_socials", "cultura", "justicia", "medi_ambient", "habitatge"]
};

const FACTOR_PRESSUPOST_PER_DIFICULTAT = { normal: 0.05, dificil: 0.041, repte: 0.026 };

// L'índex de "riquesa" del país (que fixa la mida del pressupost) es calculava
// abans NOMÉS a partir dels ingressos anuals declarats, ignorant per complet
// el patrimoni. Com que el patrimoni acumulat sol ser diverses vegades més
// gran que els ingressos (sobretot en perfils rics), això feia que un impost
// de Patrimoni ben aplicat pogués recaptar molt més del que la "riquesa"
// del país semblava justificar. Per això ara hi afegim una part del
// patrimoni (ponderat molt més fluix que els ingressos, ja que és un estoc
// i no es pot recaptar cada any al mateix ritme que la renda).
const FACTOR_RIQUESA_PATRIMONI = 0.06;

// 3. Funció Principal de Generació
function generarPais(llavorNum, dificultat) {
    // Inicialitzem el generador aleatori amb la llavor de l'usuari
    const random = crearPRNG(llavorNum);

    // Funcions d'ajuda per a la generació determinista
    const triarElement = (array) => triarAmb(random, array);
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

    // 3.2b. Escollir els Pactes de País: un per a cada impost, sempre.
    // Són independents de la sociologia i vigilen TOTS els impostos,
    // no només el que la sociologia ja controla.
    const categoriesImpost = ["irpf", "patrimoni", "iva_basic", "iva_normal", "iva_luxe"];
    const pactesPais = {};
    categoriesImpost.forEach(cat => {
        pactesPais[cat] = triarElement(DADES_SIMULACIO.pactes[cat]);
    });

    // 3.2c. Context econòmic (només per al solucionari del professor):
    // d'on venia el país i quin esdeveniment extern viu enguany. Tots dos
    // depenen NOMÉS de la llavor, mai dels impostos que es proposin.
    const puntPartida = triarElement(DADES_SIMULACIO.puntsPartida);
    const esdevenimentExtern = triarElement(DADES_SIMULACIO.esdevenimentsExterns);

    // 3.3. Preparar la demografia
    const llistaPerfils = obtenirPerfils(dificultat, random);
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

        indexRiquesaTotal += (ing_final * poblacioAbsoluta) + (pat_final * poblacioAbsoluta * FACTOR_RIQUESA_PATRIMONI);

        demografiaFinal.push({
            perfil: p.nom,
            id: p.id,
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

    // 3.4. Calcular els costos pressupostaris segons la riquesa total i la dificultat
    // Un país més ric tindrà ministeris més cars de mantenir
    const departamentsAplicables = DEPARTAMENTS_PER_DIFICULTAT[dificultat] || DEPARTAMENTS_PER_DIFICULTAT.normal;
    const factorPressupost = FACTOR_PRESSUPOST_PER_DIFICULTAT[dificultat] || FACTOR_PRESSUPOST_PER_DIFICULTAT.normal;
    const pressupostBase = indexRiquesaTotal * factorPressupost;

    const pressupostos = {};
    let sumaNivellsNormals = 0;
    departamentsAplicables.forEach(clauDept => {
        const cat = CATALEG_DEPARTAMENTS[clauDept];
        const nivells = {
            minim: Math.round(pressupostBase * cat.minim),
            normal: Math.round(pressupostBase * cat.normal),
            optim: Math.round(pressupostBase * cat.optim),
            excellencia: Math.round(pressupostBase * cat.excellencia)
        };
        pressupostos[clauDept] = nivells;
        sumaNivellsNormals += nivells.normal;
    });

    // "Pressupost de l'any anterior": la suma dels nivells "Normal" de
    // tots els departaments d'aquest país, incrementada un 5%.
    const pressupostAnyAnterior = Math.round(sumaNivellsNormals * 1.05);

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
        pactes: pactesPais,
        context_economic: { puntPartida, esdevenimentExtern },
        pressupostos_departaments: pressupostos,
        pressupost_any_anterior: pressupostAnyAnterior
    };
}

// ==========================================
// EXEMPLE DE COM HO CRIDARÀS DES DEL TEU HTML:
// ==========================================
// const llavor = parseInt(document.getElementById('input-llavor').value);
// const dificultat = document.getElementById('select-dificultat').value;
// const jsonPais = generarPais(llavor, dificultat);
// console.log(jsonPais);
