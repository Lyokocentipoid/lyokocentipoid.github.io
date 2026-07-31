/**
 * motor-fiscal.js
 * Motor de càlcul pur per al Simulador Fiscal Educatiu.
 * NO toca el DOM. Es carrega DESPRÉS de configuracio.js i generador.js
 * i ABANS de public.js / privat.js.
 *
 * Conté:
 *  - Valors suggerits dels trams/tipus (NOMÉS per als placeholders dels
 *    camps — ja no s'apliquen automàticament com a valor; l'alumne
 *    comença sempre amb els camps buits i ha de proposar-los ell mateix)
 *  - Càlcul de l'IRPF progressiu per trams
 *  - Càlcul de l'Impost sobre el Patrimoni
 *  - Càlcul de l'IVA (bàsic / normal / luxe)
 *  - El "Motor de Regles": detecta si la sociologia activa del país
 *    es dispara per a un perfil concret, i n'aplica els modificadors
 *    ABANS de calcular la quota d'aquell perfil.
 *  - Els "Pactes de País": límits (min/max) que TOTS els impostos han
 *    de complir sempre, independentment de la sociologia activa.
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

    const perfil = pais.demografia.find(p => p.perfil === perfilNom);
    const regla = sociologia.regles_impostos;
    const llistaAfectats = regla.afecta_a_modes[dificultat] || [];
    const afectat = llistaAfectats.includes("Tots") || (!!perfil && llistaAfectats.includes(perfil.id));

    if (!afectat) {
        return { afectat: false, disparada: false, sociologia, regla };
    }

    // Determinem el valor a comprovar segons quin impost vigila la regla
    let valorComprovat;
    if (regla.impost === "irpf") {
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
 * de la sociologia I els dels límits absoluts, i calcula la quota real
 * d'IRPF + Patrimoni + IVA.
 * configImpostos = { trams: [...], patrimoni: {minimExempt, percentatge}, iva: {basic, normal, luxe} }
 */
function avaluarPerfil(pais, dificultat, perfilNom, configImpostos) {
    const perfilBase = pais.demografia.find(p => p.perfil === perfilNom);
    if (!perfilBase) return null;

    const eco = perfilBase.economia_anual;
    const resultatRegla = comprovarRegla(pais, dificultat, perfilNom, configImpostos);
    const limitsAbsoluts = avaluarLimitsAbsoluts(configImpostos);

    // Valors econòmics de partida
    let ingressos = eco.ingressos;
    let patrimoni = eco.patrimoni;
    let despeses = { ...eco.despeses };

    // Si la regla sociològica es dispara, apliquem els seus modificadors ABANS de calcular quotes
    if (resultatRegla.disparada) {
        const mod = resultatRegla.modificadors || {};
        if (mod.ingressos !== undefined) ingressos = Math.round(ingressos * mod.ingressos);
        if (mod.patrimoni !== undefined) patrimoni = Math.round(patrimoni * mod.patrimoni);
        if (mod.despeses_basiques !== undefined) despeses.basiques = Math.round(despeses.basiques * mod.despeses_basiques);
        if (mod.despeses_normals !== undefined) despeses.normals = Math.round(despeses.normals * mod.despeses_normals);
        if (mod.despeses_luxe !== undefined) despeses.luxe = Math.round(despeses.luxe * mod.despeses_luxe);
    }

    // Límits absoluts: s'apliquen SEMPRE que se superin, siguin quins
    // siguin el país, la sociologia o el perfil — i s'acumulen amb
    // l'efecte de la sociologia si totes dues es disparen alhora.
    if (limitsAbsoluts.irpf.superat) ingressos = Math.round(ingressos * LIMITS_ABSOLUTS.irpf.modificador.ingressos);
    if (limitsAbsoluts.patrimoni.superat) patrimoni = Math.round(patrimoni * LIMITS_ABSOLUTS.patrimoni.modificador.patrimoni);
    if (limitsAbsoluts.patrimoni_minim_exempt.superat) patrimoni = Math.round(patrimoni * LIMITS_ABSOLUTS.patrimoni_minim_exempt.modificador.patrimoni);
    if (limitsAbsoluts.iva_basic.superat) despeses.basiques = Math.round(despeses.basiques * LIMITS_ABSOLUTS.iva_basic.modificador.despeses_basiques);
    if (limitsAbsoluts.iva_normal.superat) despeses.normals = Math.round(despeses.normals * LIMITS_ABSOLUTS.iva_normal.modificador.despeses_normals);
    if (limitsAbsoluts.iva_luxe.superat) despeses.luxe = Math.round(despeses.luxe * LIMITS_ABSOLUTS.iva_luxe.modificador.despeses_luxe);

    const irpf = calcularIRPF(ingressos, eco.deduccions_irpf, configImpostos.trams);
    const patrimoniCalc = calcularPatrimoni(patrimoni, configImpostos.patrimoni.minimExempt, configImpostos.patrimoni.percentatge);
    const iva = calcularIVA(despeses, configImpostos.iva);

    const totalIndividual = irpf.quota + patrimoniCalc.quota + iva.total;

    return {
        perfil: perfilNom,
        original: eco,
        ajustat: { ingressos, patrimoni, despeses },
        regla: resultatRegla,
        limitsAbsoluts,
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

// ---------------------------------------------------------------
// 4. LÍMITS ABSOLUTS
// A diferència de la sociologia (depèn del país i del perfil) i dels
// Pactes de País (depenen del país i poden ser només mínim o només
// màxim), els Límits Absoluts són SEMPRE els mateixos i vigilen
// SEMPRE els 5 impostos, en QUALSEVOL país i per a QUALSEVOL perfil.
// Representen el punt en què un impost deixa de ser "polèmic" per
// passar a ser directament inviable. Superar-los no només mostra un
// avís: també fa caure de veritat la base imposable (evasió, fugida
// de capitals, economia submergida...), igual que fa el motor de
// regles sociològiques.
// ---------------------------------------------------------------
const LIMITS_ABSOLUTS = {
    irpf: {
        llindar: 70,
        consequencia: "Vaga fiscal general: ningú accepta treballar per quatre cèntims. La base imposable declarada s'enfonsa i l'economia informal es dispara.",
        modificador: { ingressos: 0.20 }
    },
    patrimoni: {
        llindar: 12,
        consequencia: "Expropiació de facto: qui pot, treu el patrimoni del país abans que l'Estat se l'emporti.",
        modificador: { patrimoni: 0.15 }
    },
    patrimoni_minim_exempt: {
        llindar: 30000,
        esMinim: true,
        consequencia: "Indignació popular: gravar fins i tot els petits estalvis familiars provoca una allau de queixes i frau fiscal generalitzat.",
        modificador: { patrimoni: 0.40 }
    },
    iva_basic: {
        llindar: 50,
        consequencia: "Mercat negre generalitzat en productes bàsics: gairebé ningú compra res de manera legal.",
        modificador: { despeses_basiques: 0.15 }
    },
    iva_normal: {
        llindar: 55,
        consequencia: "Economia totalment submergida: el consum legal de productes normals pràcticament desapareix.",
        modificador: { despeses_normals: 0.15 }
    },
    iva_luxe: {
        llindar: 75,
        consequencia: "El consum de luxe fuig del país: tothom compra a l'estranger o directament de matrícula.",
        modificador: { despeses_luxe: 0.10 }
    }
};

/**
 * Comprova, per a cadascun dels impostos, si s'ha superat el seu
 * límit absolut amb la configuració fiscal actual. La majoria són
 * "sostres" (es disparen per sobre del llindar), però patrimoni_minim_exempt
 * és un "terra" (es dispara per SOTA del llindar) — per això cada entrada
 * pot marcar-se amb esMinim.
 */
function avaluarLimitsAbsoluts(configImpostos) {
    const valors = {
        irpf: tramMesAlt(configImpostos.trams),
        patrimoni: configImpostos.patrimoni.percentatge,
        patrimoni_minim_exempt: configImpostos.patrimoni.minimExempt,
        iva_basic: configImpostos.iva.basic,
        iva_normal: configImpostos.iva.normal,
        iva_luxe: configImpostos.iva.luxe
    };

    const resultat = {};
    Object.keys(LIMITS_ABSOLUTS).forEach(cat => {
        const limit = LIMITS_ABSOLUTS[cat];
        const valor = valors[cat];
        const superat = limit.esMinim ? (valor < limit.llindar) : (valor > limit.llindar);
        resultat[cat] = {
            valor,
            llindar: limit.llindar,
            consequencia: limit.consequencia,
            superat
        };
    });
    return resultat;
}

// ---------------------------------------------------------------
// 5. PACTES DE PAÍS
// Cada país té, per a CADA impost, un pacte amb un rang (min i/o max).
// A diferència del motor de regles sociològiques (que només vigila
// UN impost concret i UNS perfils concrets), els pactes vigilen
// TOTS els impostos, sempre, independentment del perfil seleccionat.
// ---------------------------------------------------------------

/** El tipus marginal més alt configurat actualment (el tram de dalt de tot) */
function tramMesAlt(trams) {
    if (!trams || !trams.length) return 0;
    return Math.max(...trams.map(t => t.percentatge));
}

/** Compara un valor concret amb el rang d'un pacte. */
function comprovarPacte(pacte, valor) {
    if (!pacte) return { fora: false };
    if (pacte.max !== undefined && valor > pacte.max) {
        return { fora: true, tipus: 'exces', missatge: pacte.consequenciaExces };
    }
    if (pacte.min !== undefined && valor < pacte.min) {
        return { fora: true, tipus: 'defecte', missatge: pacte.consequenciaDefecte };
    }
    return { fora: false };
}

/**
 * Avalua els 5 pactes del país (irpf, patrimoni, iva_basic, iva_normal,
 * iva_luxe) contra la configuració fiscal actual. Retorna, per a cada
 * un, el pacte, el valor comprovat i el resultat de comprovarPacte.
 */
function avaluarPactes(pais, configImpostos) {
    const valors = {
        irpf: tramMesAlt(configImpostos.trams),
        patrimoni: configImpostos.patrimoni.percentatge,
        iva_basic: configImpostos.iva.basic,
        iva_normal: configImpostos.iva.normal,
        iva_luxe: configImpostos.iva.luxe
    };

    const resultat = {};
    Object.keys(valors).forEach(cat => {
        const pacte = pais.pactes[cat];
        resultat[cat] = {
            pacte,
            valor: valors[cat],
            resultat: comprovarPacte(pacte, valors[cat])
        };
    });
    return resultat;
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

// ---------------------------------------------------------------
// ANIMACIÓ DE NÚMEROS (compartida entre public.js i privat.js)
// Fa comptar un element de "l'últim valor mostrat" fins al nou valor,
// en lloc de canviar el text de cop. Guarda el valor cru a
// data-valor-numeric perquè la següent crida sàpiga d'on partir.
// ---------------------------------------------------------------
const requestFrame = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : function (cb) { return setTimeout(() => cb(Date.now()), 16); };

function animarNumero(el, valorObjectiu, formatter, duracioMs) {
    if (!el) return;
    duracioMs = duracioMs || 700;
    const valorInicial = parseFloat(el.dataset.valorNumeric || '0') || 0;
    if (valorInicial === valorObjectiu) {
        el.textContent = formatter(valorObjectiu);
        return;
    }
    const inici = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    function pas(ara) {
        const transcorregut = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - inici;
        const progres = Math.min(transcorregut / duracioMs, 1);
        const ease = 1 - Math.pow(1 - progres, 3); // easeOutCubic
        const valorActual = valorInicial + (valorObjectiu - valorInicial) * ease;
        el.textContent = formatter(valorActual);
        if (progres < 1) {
            requestFrame(pas);
        } else {
            el.textContent = formatter(valorObjectiu);
            el.dataset.valorNumeric = valorObjectiu;
        }
    }
    requestFrame(pas);
}

/** Reinicia una animació CSS d'un element (treu la classe, força reflow, la torna a posar) */
function repetirAnimacio(el, classe) {
    if (!el) return;
    el.classList.remove(classe);
    void el.offsetWidth; // força el reflow
    el.classList.add(classe);
}

// ---------------------------------------------------------------
// 6. DADES I AVALUACIÓ DE DEPARTAMENTS
// Compartit entre public.js (pestanya C, pressupost proposat a mà per
// l'alumne) i privat.js (pressupost calculat a partir de la recaptació
// real), perquè els noms, icones, missatges i llindars de cada nivell
// siguin exactament els mateixos als dos webs.
// ---------------------------------------------------------------
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

function interpolar(text, lloc) {
    return text.replace(/\{lloc\}/g, lloc);
}

/** Determina en quin dels 5 nivells (catàstrofe...excel·lència) cau un import concret */
function avaluarNivellPressupost(valor, nivells) {
    if (valor < nivells.minim) return { tier: 'catastrofe', classes: 'bg-perill-light text-perill-dark' };
    if (valor < nivells.normal) return { tier: 'ajustat', classes: 'bg-gold/15 text-gold-dark' };
    if (valor < nivells.optim) return { tier: 'normal', classes: 'bg-institut/10 text-institut' };
    if (valor < nivells.excellencia) return { tier: 'optim', classes: 'bg-exit-light text-exit-dark' };
    return { tier: 'excellencia', classes: 'bg-exit text-white ring-2 ring-gold' };
}

// Paleta compartida per donar una identitat de color coherent als perfils i
// departaments (gràfic, xips, targetes...) als dos webs.
const COLORS_CHART = ['#2B3A67', '#C9971F', '#157F5C', '#C43D3D', '#4A5B94', '#8F2727', '#0E5C42', '#4A3868', '#8A6816'];
