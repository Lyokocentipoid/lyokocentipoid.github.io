// configuracio.js

const DADES_SIMULACIO = {
    noms: {
        ciutats: [
            "Vila-real de Dalt", "Sant Feliu del Racó", "Nou Horitzó", "Vallclara", "La Pineda Alta",
            "Castellfosc", "Riuverd", "Montserè", "Les Planes del Sud", "Aigüesblanques",
            "Torre del Vent", "Rocafort de l'Oest", "Prats de Llum", "Vilanova del Pont",
            "Sant Elm de les Roques", "Boscam", "Altamura", "Pobla de la Vall", "Cervera del Pla",
            "Fontclara", "Puigverd", "Les Fonts de l'Abadia", "Riba-roja d'Amunt", "Campdorat",
            "Vilabella", "Sant Hilari del Bosc", "Albaflor", "Torrelles de la Costa", "Vallfreda",
            "Mont-roig del Camp", "Perafita Nova", "Roca-salada", "Aiguafreda de Baix",
            "Sant Joan de les Abadesses Nou", "Bellmunt", "Prada de la Serra", "Vallderoure",
            "Castellterçol Nou", "Vilafranca del Nord", "Les Gorges", "Vilanova del Mar",
            "Sot del Pi", "Coma-ruga Alta", "Sant Pere dels Horts", "Riudellots Vells"
        ],
        paisos: [
            "República de Novàlia", "Regne d'Oceana", "Unió de Terraferma", "Estat de Meridiana",
            "Federació d'Aura", "Principat de Llevant", "República Ígnia", "Confederació dels Cims",
            "Gran Ducat de Valls", "Aliança de les Illes Lliures", "República de Tramuntana",
            "Nació de Garbí", "Unió dels Quatre Rius", "Principat de Valira", "Estat del Delta",
            "Federació de l'Ebre", "República de l'Alba", "Regne de Tàrraco", "Ducat d'Ibèria",
            "República Celta", "Aliança del Nord", "Estat Sobirà de les Valls", "República de Dàcia",
            "Unió Continental", "Confederació de la Costa"
        ]
    },

    sociologies: [
        // ==========================================
        // SOCIOLOGIES GLOBALS (Funcionen a tots els modes)
        // ==========================================
        {
            clau: "fuga_capitals",
            modes_compatibles: ["normal", "dificil", "repte"],
            pista: "Els ciutadans amb més recursos tenen inversions a l'estranger i facilitat per moure capitals si l'IRPF els ofega.",
            regles_impostos: {
                impost: "irpf",
                llindar_perillos: 45,
                afecta_a_modes: {
                    normal: ["Renda Alta"],
                    dificil: ["El Nou Ric", "La Gran Fortuna"],
                    repte: ["El Nou Ric", "La Gran Fortuna"]
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
                    normal: ["Renda Alta"],
                    dificil: ["La Gran Fortuna"],
                    repte: ["La Gran Fortuna"]
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
                    normal: ["Renda Baixa", "Renda Mitjana"],
                    dificil: ["La Família Ofegada", "El Jubilat amb Pis"],
                    repte: ["L'Estudiant Precari", "La Família Nombrosa", "El Jubilat Dependent"]
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
                    dificil: ["El Jubilat amb Pis", "L'Estalviador Clàssic"],
                    repte: ["El Jubilat Dependent", "L'Estalviador", "La Família Nombrosa"]
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
                    dificil: ["L'Estalviador Clàssic"],
                    repte: ["L'Estalviador", "La Família Nombrosa"]
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
                    dificil: ["El Nou Ric", "L'Estalviador Clàssic"],
                    repte: ["El Nou Ric", "El Fals Autònom"]
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
                    dificil: ["La Família Ofegada"],
                    repte: ["L'Estudiant Precari", "La Família Nombrosa"]
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
                    dificil: ["La Família Ofegada"],
                    repte: ["L'Estudiant Precari", "El Fals Autònom"]
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
                afecta_a_modes: { repte: ["El Fals Autònom"] },
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
                afecta_a_modes: { repte: ["El Jubilat Dependent"] },
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
                afecta_a_modes: { repte: ["La Família Nombrosa"] },
                consequencia: "Ruïna familiar: Les famílies amb fills perden tot el seu poder adquisitiu extra.",
                modificadors: { despeses_normals: 0.10, despeses_luxe: 0.00 }
            }
        }
    ]
};
