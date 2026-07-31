// configuracio.js

const DADES_SIMULACIO = {
    noms: {
        ciutats: [
            "Refreburg", "Zolvenna", "Còdol Fosc", "Vent-i-Sal", "Trencaboira",
            "Llumbrina", "Fumaroja", "Marboira", "Cendrafall", "Argenmar",
            "Pontfosc", "Gebrall", "Solraig", "Nuvolet Alt", "Torrelluna",
            "Vidreflor", "Cristalona", "Bruixamar", "Ombraverd", "Ferroneu",
            "Salmarina", "Pedrafoc", "Aurinvent", "Cranquell", "Tempestor",
            "Riufum", "Estelboira", "Verdanit", "Ombravella", "Flamarosa",
            "Grisalona", "Ventiscor", "Fosquívol", "Lluminosa del Cim", "Rovellac",
            "Bromera Alta", "Càntir Fosc", "Nevorella", "Sotaboira", "Vidrall"
        ],
        paisos: [
            "Confederació de Brumàntia", "Unió de Fumàrdia", "Principat de Ventúria", "Regne de Solvenna",
            "República de Nébrica", "Estat de Cendrària", "Federació d'Ombrelàndia", "Gran Ducat de Zeltòria",
            "Aliança de Marbrenc", "Nació de Rovellònia", "Unió de Còdolàndia", "Principat de Fosquívia",
            "Estat del Gebre", "Federació de Trencaflam", "República de l'Argenta", "Regne de Vidrell",
            "Ducat de Salrovenc", "República Ambriosa", "Aliança de Flamúrbia", "Estat Sobirà de Nívolis",
            "República de Bruixània", "Unió Continental de Zolveria", "Confederació de la Boirosa", "Regne de Tempestània"
        ]
    },

    sociologies: [
        // ==========================================
        // SOCIOLOGIES GLOBALS (Funcionen a tots els modes)
        // Nota: afecta_a_modes fa servir l'"id" estable del perfil
        // (no el nom, que pot variar de partida en partida).
        // ==========================================
        {
            clau: "fuga_capitals",
            modes_compatibles: ["normal", "dificil", "repte"],
            pista: "Els ciutadans amb més recursos tenen inversions a l'estranger i facilitat per moure capitals si l'IRPF els ofega.",
            regles_impostos: {
                impost: "irpf",
                llindar_perillos: 45,
                afecta_a_modes: {
                    normal: ["renda_alta"],
                    dificil: ["nou_ric", "gran_fortuna"],
                    repte: ["nou_ric", "gran_fortuna"]
                },
                consequencia: "Fuga de capitals: Traslladen les seves rendes a l'estranger.",
                modificadors: { ingressos: 0.70 }
            }
        },
        {
            clau: "economia_mercat_negre",
            modes_compatibles: ["normal", "dificil", "repte"],
            pista: "Hi ha una gran tradició de pagaments 'en B'. Si penalitzes massa el luxe, l'economia se submergeix.",
            regles_impostos: {
                impost: "iva_luxe",
                llindar_perillos: 25,
                afecta_a_modes: { normal: ["Tots"], dificil: ["Tots"], repte: ["Tots"] },
                consequencia: "El consum de luxe passa al mercat negre. La recaptació d'aquesta partida s'ensorra.",
                modificadors: { despeses_luxe: 0.35 } // Més agressiu
            }
        },
        {
            clau: "paradis_fiscal_vei",
            modes_compatibles: ["normal", "dificil", "repte"],
            pista: "Ets al costat d'un paradís fiscal. Si l'IRPF és prou baix, atrauràs grans fortunes estrangeres.",
            regles_impostos: {
                impost: "irpf",
                llindar_perillos: 20,
                es_llindar_minim: true,
                afecta_a_modes: {
                    normal: ["renda_alta"],
                    dificil: ["gran_fortuna"],
                    repte: ["gran_fortuna"]
                },
                consequencia: "Atracció de capitals: Grans fortunes arriben al país.",
                modificadors: { ingressos: 1.50, patrimoni: 1.50 }
            }
        },
        {
            clau: "estat_benestar_fragil",
            modes_compatibles: ["normal", "dificil", "repte"],
            pista: "Els serveis públics pengen d'un fil. Si no recapteu prou IVA, la gent haurà de pagar-se l'escola i el metge.",
            regles_impostos: {
                impost: "iva_basic",
                llindar_perillos: 4,
                es_llindar_minim: true,
                afecta_a_modes: {
                    normal: ["renda_baixa", "renda_mitjana"],
                    dificil: ["familia_ofegada", "jubilat_pis"],
                    repte: ["estudiant_precari", "familia_nombrosa", "jubilat_dependent"]
                },
                consequencia: "Privatització: Cauen els serveis i la gent ha de pagar-los de la seva butxaca.",
                modificadors: { despeses_basiques: 1.60 }
            }
        },

        // ==========================================
        // SOCIOLOGIES DE MODE DIFÍCIL I REPTE
        // (Aprofiten els perfils creuats)
        // ==========================================
        {
            clau: "bombolla_immobiliaria",
            modes_compatibles: ["dificil", "repte"],
            pista: "La cultura d'aquest país fomenta la propietat. La majoria té la seva riquesa en immobles il·líquids.",
            regles_impostos: {
                impost: "patrimoni",
                llindar_perillos: 2.0,
                afecta_a_modes: {
                    dificil: ["jubilat_pis", "estalviador_classic"],
                    repte: ["jubilat_dependent", "estalviador", "familia_nombrosa"]
                },
                consequencia: "Manca de liquiditat: No poden pagar el patrimoni. Les despeses bàsiques pugen per deutes.",
                modificadors: { despeses_basiques: 1.40 }
            }
        },
        {
            clau: "obsessio_estalviadora",
            modes_compatibles: ["dificil", "repte"],
            pista: "La classe mitjana està espantada. A la mínima pujada de l'IVA normal, deixen de consumir l'oci.",
            regles_impostos: {
                impost: "iva_normal",
                llindar_perillos: 21,
                afecta_a_modes: {
                    dificil: ["estalviador_classic"],
                    repte: ["estalviador", "familia_nombrosa"]
                },
                consequencia: "Contracció del consum: Tallen radicalment les despeses normals.",
                modificadors: { despeses_normals: 0.50 }
            }
        },
        {
            clau: "exode_de_talent",
            modes_compatibles: ["dificil", "repte"],
            pista: "Els joves professionals molt qualificats no toleren pressions fiscals mitjanes altes. Marxaran.",
            regles_impostos: {
                impost: "irpf",
                llindar_perillos: 35,
                afecta_a_modes: {
                    dificil: ["nou_ric", "estalviador_classic"],
                    repte: ["nou_ric", "fals_autonom"]
                },
                consequencia: "Fuga de cervells: Els professionals emigren.",
                modificadors: { ingressos: 0.65 }
            }
        },
        {
            clau: "polaritzacio_extrema",
            modes_compatibles: ["dificil", "repte"],
            pista: "Les classes baixes viuen al límit absolut de la supervivència.",
            regles_impostos: {
                impost: "iva_basic",
                llindar_perillos: 10,
                afecta_a_modes: {
                    dificil: ["familia_ofegada"],
                    repte: ["estudiant_precari", "familia_nombrosa"]
                },
                consequencia: "Pobresa severa: El preu del menjar ofega completament el consum no essencial.",
                modificadors: { despeses_basiques: 0.80, despeses_normals: 0.00 }
            }
        },
        {
            clau: "capitalisme_salvatge",
            modes_compatibles: ["dificil", "repte"],
            pista: "Eliminar l'impost al patrimoni farà que els rics comprin tot l'habitatge disponible, ofegant els pobres.",
            regles_impostos: {
                impost: "patrimoni",
                llindar_perillos: 0,
                es_llindar_minim: true,
                afecta_a_modes: {
                    dificil: ["familia_ofegada"],
                    repte: ["estudiant_precari", "fals_autonom"]
                },
                consequencia: "Especulació: Els lloguers es disparen perquè els rics acaparen el mercat.",
                modificadors: { despeses_basiques: 1.40 }
            }
        },

        // ==========================================
        // SOCIOLOGIES EXCLUSIVES DEL MODE REPTE
        // (Centrades en deduccions i autònoms)
        // ==========================================
        {
            clau: "rebelio_dels_autonoms",
            modes_compatibles: ["repte"],
            pista: "Els treballadors per compte propi estan farts. Si l'IVA normal puja molt, passaran la seva facturació a B.",
            regles_impostos: {
                impost: "iva_normal",
                llindar_perillos: 18,
                afecta_a_modes: { repte: ["fals_autonom"] },
                consequencia: "Insurgència fiscal: Els autònoms deixen de declarar bona part de la seva activitat.",
                modificadors: { ingressos: 0.50, despeses_normals: 0.50 }
            }
        },
        {
            clau: "crisi_de_les_cures",
            modes_compatibles: ["repte"],
            pista: "El país té un greu problema d'envelliment. Gravar el patrimoni dels jubilats encareix enormement les cures mèdiques.",
            regles_impostos: {
                impost: "patrimoni",
                llindar_perillos: 1.5,
                afecta_a_modes: { repte: ["jubilat_dependent"] },
                consequencia: "Caiguda de la xarxa de suport: Els jubilats han de vendre's la casa a pèrdua per pagar cures.",
                modificadors: { patrimoni: 0.50, despeses_basiques: 1.80 }
            }
        },
        {
            clau: "trampa_de_la_natalitat",
            modes_compatibles: ["repte"],
            pista: "Sense deduccions per fills, la classe treballadora amb família cau directament a la pobresa extrema.",
            regles_impostos: {
                impost: "irpf", // Si l'IRPF efectiu final sense deduccions és massa alt...
                llindar_perillos: 25,
                afecta_a_modes: { repte: ["familia_nombrosa"] },
                consequencia: "Ruïna familiar: Les famílies amb fills perden tot el seu poder adquisitiu extra.",
                modificadors: { despeses_normals: 0.10, despeses_luxe: 0.00 }
            }
        }
    ],

    // ==========================================
    // PACTES DE PAÍS
    // Cada país generat queda obligat, per acords previs, a mantenir
    // CADA impost dins d'un rang concret. Són independents de la
    // sociologia activa i s'apliquen sempre, a qualsevol perfil:
    // per això donen resposta a "què passa si poso l'IVA al 200%?"
    // encara que cap sociologia vigili aquell impost concret.
    // ==========================================
    pactes: {
        irpf: [
            {
                clau: "sostre_irpf_constitucional",
                max: 55,
                descripcio: "La constitució fixa un sostre del 55% per al tram més alt de l'IRPF.",
                consequenciaExces: "Anticonstitucional: el Tribunal Suprem tomba la reforma fiscal i el govern entra en crisi."
            },
            {
                clau: "clausula_redistributiva",
                min: 10,
                descripcio: "Un pacte de coalició exigeix un mínim del 10% en el tram més alt per finançar la sanitat pública.",
                consequenciaDefecte: "Trencament de govern: el soci de coalició es retira i cau l'executiu."
            }
        ],
        patrimoni: [
            {
                clau: "patrimoni_pacte_estabilitat",
                max: 2.5,
                descripcio: "Pacte d'estabilitat amb la banca: l'impost sobre el patrimoni no pot superar el 2,5%.",
                consequenciaExces: "Retirada de capital bancari: els bancs redueixen dràsticament el crèdit disponible."
            },
            {
                clau: "patrimoni_minim_cohesio",
                min: 0.2,
                descripcio: "Pacte de cohesió territorial: cal recaptar almenys un 0,2% en Patrimoni per mantenir els fons de cohesió.",
                consequenciaDefecte: "Sanció de cohesió: es retiren els fons de compensació territorial."
            }
        ],
        iva_basic: [
            {
                clau: "iva_basic_sostre_social",
                max: 8,
                descripcio: "Compromís social: l'IVA bàsic (aliments, primera necessitat) no pot superar el 8%.",
                consequenciaExces: "Revolta social: manifestacions massives per l'encariment de la cistella bàsica."
            },
            {
                clau: "iva_basic_minim_financament",
                min: 2,
                descripcio: "Un pla de rescat exigeix un mínim del 2% d'IVA bàsic per garantir ingressos estables.",
                consequenciaDefecte: "El pla de rescat es cancel·la per manca d'ingressos garantits."
            }
        ],
        iva_normal: [
            {
                clau: "iva_normal_unio_duanera",
                min: 8,
                max: 16,
                descripcio: "Membre d'una unió duanera regional que fixa l'IVA normal entre el 8% i el 16%.",
                consequenciaExces: "Sanció comercial: els socis imposen aranzels de represàlia i cau l'exportació.",
                consequenciaDefecte: "Dúmping fiscal: els socis acusen el país de competència deslleial i suspenen l'acord."
            },
            {
                clau: "iva_normal_sostre_competitivitat",
                max: 22,
                descripcio: "Pacte de competitivitat amb el comerç fronterer: l'IVA normal no pot superar el 22%.",
                consequenciaExces: "Contraban fronterer: el comerç es trasllada massivament al país veí."
            }
        ],
        iva_luxe: [
            {
                clau: "iva_luxe_sostre_turisme",
                max: 35,
                descripcio: "Acord amb el sector turístic: l'IVA de luxe no pot superar el 35%.",
                consequenciaExces: "Fuga d'inversors: el sector de turisme de luxe abandona el país."
            },
            {
                clau: "iva_luxe_minim_equitat",
                min: 15,
                descripcio: "Un pacte d'equitat fiscal exigeix un mínim del 15% d'IVA en productes de luxe.",
                consequenciaDefecte: "Percepció d'injustícia: creix el rebuig social davant la baixa fiscalitat als rics."
            }
        ]
    }
};
