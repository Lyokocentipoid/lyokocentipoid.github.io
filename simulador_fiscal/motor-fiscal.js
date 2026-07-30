/**
 * motor-fiscal.js
 * Motor de càlcul pur per al Simulador Fiscal Educatiu.
 * NO toca el DOM. Es carrega DESPRÉS de configuracio.js i generador.js
 * i ABANS de public.js / privat.js.
 *
 * Conté:
 *  - Valors per defecte dels trams/tipus (editables per l'usuari)
 *  - Càlcul de l'IRPF progressiu per trams
 *  - Càlcul de l'Impost sobre el Patrimoni
 *  - Càlcul de l'IVA (bàsic / normal / luxe)
 *  - El "Motor de Regles": detecta si la sociologia activa del país
 *    es dispara per a un perfil concret, i n'aplica els modificadors
 *    ABANS de calcular la quota d'aquell perfil.
 */

// ---------------------------------------------------------------
// 1. VALORS PER DEFECTE (l'alumne/professor els pot canviar sempre)
// ---------------------------------------------------------------

function tramsIRPFPerDefecte(dificultat) {
    if (dificultat === "normal") {
        return [
            { desde: 0,     percentatge: 19 },
            { desde: 15000, percentatge: 30 },
            { desde: 40000, percentatge: 40 }
        ];
    }
    // dificil i repte -> 5 trams
    return [
        { desde: 0,      percentatge: 19 },
        { desde: 15000,  percentatge: 24 },
        { desde: 30000,  percentatge: 30 },
        { desde: 60000,  percentatge: 37 },
        { desde: 120000, percentatge: 45 }
    ];
}

function patrimoniPerDefecte() {
    return { minimExempt: 100000, percentatge: 1.0 };
}

function ivaPerDefecte() {
    return { basic: 4, normal: 10, luxe: 21 };
}

function numTramsPerDificultat(dificultat) {
    return dificultat === "normal" ? 3 : 5;
}

// ---------------------------------------------------------------
// 2. CÀLCULS D'IMPOSTOS INDIVIDUALS
// ---------------------------------------------------------------

/**
 * Calcula l'IRPF de manera progressiva (per trams reals, no tipus únic).
 * trams: array ordenat per 'desde' ascendent, p.ex [{desde:0,percentatge:19}, ...]
 */
function calcularIRPF(ingressos, deduccions, trams) {
    const tramsOrdenats = [...trams].sort((a, b) => a.desde - b.desde);
    const baseImposable = Math.max(0, ingressos - (deduccions || 0));

    let quota = 0;
    let tipusMarginal = tramsOrdenats.length ? tramsOrdenats[0].percentatge : 0;

    for (let i = 0; i < tramsOrdenats.length; i++) {
        const actual = tramsOrdenats[i];
        const seguent = tramsOrdenats[i + 1];
        const limitSuperior = seguent ? seguent.desde : Infinity;

        if (baseImposable > actual.desde) {
            const trosTramat = Math.min(baseImposable, limitSuperior) - actual.desde;
            quota += trosTramat * (actual.percentatge / 100);
            tipusMarginal = actual.percentatge;
        }
    }

    const tipusMitja = baseImposable > 0 ? (quota / baseImposable) * 100 : 0;

    return {
        baseImposable,
        quota: Math.round(quota),
        tipusMarginal,
        tipusMitja: Math.round(tipusMitja * 10) / 10
    };
}

/** Retorna només el tipus marginal que li tocaria a un ingrés concret (per al motor de regles) */
function trobarTramMarginal(baseImposable, trams) {
    const tramsOrdenats = [...trams].sort((a, b) => a.desde - b.desde);
    let percentatge = tramsOrdenats.length ? tramsOrdenats[0].percentatge : 0;
    for (const t of tramsOrdenats) {
        if (baseImposable >= t.desde) percentatge = t.percentatge;
    }
    return percentatge;
}

/** Impost sobre el Patrimoni: mínim exempt + tipus únic sobre l'excedent */
function calcularPatrimoni(patrimoni, minimExempt, percentatge) {
    const baseTributable = Math.max(0, patrimoni - (minimExempt || 0));
    const quota = baseTributable * (percentatge / 100);
    return { baseTributable, quota: Math.round(quota) };
}

/** IVA sobre les tres categories de despesa */
function calcularIVA(despeses, tipusIva) {
    const quotaBasica = despeses.basiques * (tipusIva.basic / 100);
    const quotaNormal = despeses.normals * (tipusIva.normal / 100);
    const quotaLuxe = despeses.luxe * (tipusIva.luxe / 100);
    return {
        quotaBasica: Math.round(quotaBasica),
        quotaNormal: Math.round(quotaNormal),
        quotaLuxe: Math.round(quotaLuxe),
        total: Math.round(quotaBasica + quotaNormal + quotaLuxe)
    };
}

// ---------------------------------------------------------------
// 3. MOTOR DE REGLES SOCIOLÒGIQUES
// ---------------------------------------------------------------

/** Troba la sociologia activa d'un país generat (n'hi ha exactament una per país) */
function trobarSociologiaActiva(pais) {
    return DADES_SIMULACIO.sociologies.find(
        s => s.clau === pais.metadades.sociologia_clau
    ) || null;
}

/**
 * Comprova si el perfil indicat es veu afectat per la sociologia activa
 * del país, donada la configuració fiscal actual.
 * Retorna { afectat: bool, disparada: bool, sociologia, consequencia, modificadors }
 */
function comprovarRegla(pais, dificultat, perfilNom, configImpostos) {
    const sociologia = trobarSociologiaActiva(pais);
    if (!sociologia) return { afectat: false, disparada: false };

    const regla = sociologia.regles_impostos;
    const llistaAfectats = regla.afecta_a_modes[dificultat] || [];
    const afectat = llistaAfectats.includes("Tots") || llistaAfectats.includes(perfilNom);

    if (!afectat) {
        return { afectat: false, disparada: false, sociologia, regla };
    }

    // Determinem el valor a comprovar segons quin impost vigila la regla
    let valorComprovat;
    if (regla.impost === "irpf") {
        const perfil = pais.demografia.find(p => p.perfil === perfilNom);
        const baseImposable = Math.max(
            0,
            perfil.economia_anual.ingressos - (perfil.economia_anual.deduccions_irpf || 0)
        );
        valorComprovat = trobarTramMarginal(baseImposable, configImpostos.trams);
    } else if (regla.impost === "patrimoni") {
        valorComprovat = configImpostos.patrimoni.percentatge;
    } else if (regla.impost === "iva_basic") {
        valorComprovat = configImpostos.iva.basic;
    } else if (regla.impost === "iva_normal") {
        valorComprovat = configImpostos.iva.normal;
    } else if (regla.impost === "iva_luxe") {
        valorComprovat = configImpostos.iva.luxe;
    }

    const disparada = regla.es_llindar_minim
        ? valorComprovat < regla.llindar_perillos
        : valorComprovat > regla.llindar_perillos;

    return {
        afectat: true,
        disparada,
        valorComprovat,
        sociologia,
        regla,
        consequencia: regla.consequencia,
        modificadors: regla.modificadors
    };
}

/**
 * Avalua completament un perfil concret: aplica (si cal) els modificadors
 * de la sociologia i calcula la quota real d'IRPF + Patrimoni + IVA.
 * configImpostos = { trams: [...], patrimoni: {minimExempt, percentatge}, iva: {basic, normal, luxe} }
 */
function avaluarPerfil(pais, dificultat, perfilNom, configImpostos) {
    const perfilBase = pais.demografia.find(p => p.perfil === perfilNom);
    if (!perfilBase) return null;

    const eco = perfilBase.economia_anual;
    const resultatRegla = comprovarRegla(pais, dificultat, perfilNom, configImpostos);

    // Valors econòmics de partida
    let ingressos = eco.ingressos;
    let patrimoni = eco.patrimoni;
    let despeses = { ...eco.despeses };

    // Si la regla es dispara, apliquem els modificadors ABANS de calcular quotes
    if (resultatRegla.disparada) {
        const mod = resultatRegla.modificadors || {};
        if (mod.ingressos !== undefined) ingressos = Math.round(ingressos * mod.ingressos);
        if (mod.patrimoni !== undefined) patrimoni = Math.round(patrimoni * mod.patrimoni);
        if (mod.despeses_basiques !== undefined) despeses.basiques = Math.round(despeses.basiques * mod.despeses_basiques);
        if (mod.despeses_normals !== undefined) despeses.normals = Math.round(despeses.normals * mod.despeses_normals);
        if (mod.despeses_luxe !== undefined) despeses.luxe = Math.round(despeses.luxe * mod.despeses_luxe);
    }

    const irpf = calcularIRPF(ingressos, eco.deduccions_irpf, configImpostos.trams);
    const patrimoniCalc = calcularPatrimoni(patrimoni, configImpostos.patrimoni.minimExempt, configImpostos.patrimoni.percentatge);
    const iva = calcularIVA(despeses, configImpostos.iva);

    const totalIndividual = irpf.quota + patrimoniCalc.quota + iva.total;

    return {
        perfil: perfilNom,
        original: eco,
        ajustat: { ingressos, patrimoni, despeses },
        regla: resultatRegla,
        irpf,
        patrimoni: patrimoniCalc,
        iva,
        totalIndividual
    };
}

/** Recull la configuració fiscal actual llegint els inputs comuns del DOM (usat per public.js i privat.js) */
function llegirConfiguracioImpostosDelDOM(numTrams) {
    const trams = [];
    for (let i = 0; i < numTrams; i++) {
        const desde = parseFloat(document.getElementById(`irpf-desde-${i}`).value) || 0;
        const pct = parseFloat(document.getElementById(`irpf-pct-${i}`).value) || 0;
        trams.push({ desde, percentatge: pct });
    }
    return {
        trams,
        patrimoni: {
            minimExempt: parseFloat(document.getElementById('patrimoni-minim').value) || 0,
            percentatge: parseFloat(document.getElementById('patrimoni-pct').value) || 0
        },
        iva: {
            basic: parseFloat(document.getElementById('iva-basic').value) || 0,
            normal: parseFloat(document.getElementById('iva-normal').value) || 0,
            luxe: parseFloat(document.getElementById('iva-luxe').value) || 0
        }
    };
}

// De totes les sociologies, "paradis_fiscal_vei" és l'única que representa un
// èxit (atrau capital); la resta representen un perill/fuga que cal evitar.
const SENTIMENT_SOCIOLOGIES = {
    fuga_capitals: 'perill',
    economia_mercat_negre: 'perill',
    paradis_fiscal_vei: 'exit',
    estat_benestar_fragil: 'perill',
    bombolla_immobiliaria: 'perill',
    obsessio_estalviadora: 'perill',
    exode_de_talent: 'perill',
    polaritzacio_extrema: 'perill',
    capitalisme_salvatge: 'perill',
    rebelio_dels_autonoms: 'perill',
    crisi_de_les_cures: 'perill',
    trampa_de_la_natalitat: 'perill'
};

function formatEuros(num) {
    return Math.round(num).toLocaleString('ca-ES') + ' €';
}
function formatNumero(num) {
    return Math.round(num).toLocaleString('ca-ES');
}
