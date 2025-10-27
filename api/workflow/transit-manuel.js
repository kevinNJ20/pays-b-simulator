// ============================================================================
// MALI - API Workflow Transit Manuel - ÉTAPES 8-14
// Fichier: api/workflow/transit-manuel.js
// Permet de simuler toutes les étapes manuelles du workflow transit Mali
// ============================================================================

const database = require('../../lib/database');
const kitClient = require('../../lib/kit-client');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-System');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { action, transitId, donnees } = req.body;
      
      console.log(`🚛 [MALI TRANSIT] Action: ${action} pour transit ${transitId}`);
      
      let resultat;
      
      switch (action) {
        case 'deposer_declaration_detaillee':
          resultat = await deposerDeclarationDetaillee(transitId, donnees);
          break;
          
        case 'apposer_visa_douanier':
          resultat = await apposerVisaDouanier(transitId, donnees);
          break;
          
        case 'effectuer_verifications':
          resultat = await effectuerVerifications(transitId, donnees);
          break;
          
        case 'effectuer_controles_physiques':
          resultat = await effectuerControlesPhysiques(transitId, donnees);
          break;
          
        case 'confirmer_arrivee':
          resultat = await confirmerArrivee(transitId, donnees);
          break;
          
        case 'transmettre_message_arrivee':
          resultat = await transmettreMessageArrivee(transitId, donnees);
          break;
          
        case 'workflow_transit_complet':
          // Simuler toutes les étapes automatiquement
          resultat = await executerWorkflowTransitComplet(transitId);
          break;
          
        default:
          throw new Error(`Action non reconnue: ${action}`);
      }
      
      res.status(200).json({
        status: 'SUCCESS',
        message: `Action ${action} exécutée avec succès`,
        resultat,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [MALI TRANSIT] Erreur workflow:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de l\'exécution de l\'action transit',
        erreur: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ 
      erreur: 'Méthode non autorisée',
      methodesAutorisees: ['POST', 'OPTIONS']
    });
  }
};

// ✅ ÉTAPE 8 : Dépôt déclaration détaillée
async function deposerDeclarationDetaillee(transitId, donnees = {}) {
  console.log(`📋 [MALI] ÉTAPE 8 TRANSIT: Dépôt déclaration détaillée pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  const declarationDetaillee = database.deposerDeclarationDetailTransit(transitId, {
    numeroDeclarationDetail: donnees.numeroDeclarationDetail || `DET_${Date.now()}`,
    declarantMalien: donnees.declarantMalien || 'DECLARANT_TRANSIT_MALI',
    importateurDestination: donnees.importateurDestination || 'IMPORTATEUR_MALI_TRANSIT',
    
    // Détails marchandises
    marchandisesDetaillees: donnees.marchandisesDetaillees || transit.marchandises?.map((m, idx) => ({
      numero: idx + 1,
      designation: m.designation || 'Marchandise transit',
      codeSH: donnees.codeSH || '8703210000',
      origine: 'SEN',
      quantite: m.nombreColis || m.quantite || 1,
      poids: m.poids || 1000,
      valeurDeclaree: m.valeur || donnees.valeurDeclaree || 500000
    })),
    
    // Documents joints
    documentsJoints: {
      connaissement: donnees.connaissement || `BL_TRANS_${Date.now()}`,
      factureCommerciale: donnees.factureCommerciale || `FC_TRANS_${Date.now()}`,
      certificatOrigine: donnees.certificatOrigine || `CO_SEN_TRANS`,
      declarationValeur: donnees.declarationValeur || true
    },
    
    // Informations transit
    numeroTransitOrigine: transit.numeroDeclarationTransit,
    referenceTransit: transit.id,
    
    agentDepot: donnees.agentDepot || 'AGENT_DECLARANT_MALI'
  });
  
  return {
    etape: 8,
    action: 'DECLARATION_DETAILLEE_DEPOSEE',
    declarationDetaillee,
    prochaine_etape: 'ÉTAPE 9: Apposition visa douanier'
  };
}

// ✅ ÉTAPE 9 : Apposition visa douanier avec contrôles
async function apposerVisaDouanier(transitId, donnees = {}) {
  console.log(`🛃 [MALI] ÉTAPE 9 TRANSIT: Apposition visa douanier pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit || !transit.declarationDetaillee) {
    throw new Error('Déclaration détaillée requise avant visa');
  }

  // Calculer si délai respecté
  const dateReception = new Date(transit.dateReception);
  const dateActuelle = new Date();
  const delaiJours = Math.floor((dateActuelle - dateReception) / (1000 * 60 * 60 * 24));
  const delaiMaxJours = parseInt(transit.delaiRoute?.match(/\d+/)?.[0] || '72') / 24;
  const delaiRespecte = delaiJours <= delaiMaxJours;

  const visaDouanier = database.apposerVisaTransit(transitId, {
    numeroVisa: donnees.numeroVisa || `VISA_MLI_${Date.now()}`,
    agentDouanier: donnees.agentDouanier || 'AGENT_DOUANE_TRANSIT_MALI',
    bureauDouane: 'BAMAKO_TRANSIT',
    
    // Contrôles effectués
    controles: {
      delaiRoute: {
        attendu: transit.delaiRoute,
        effectif: `${delaiJours} jours`,
        respecte: delaiRespecte,
        commentaire: delaiRespecte ? 'Délai respecté' : 'Délai dépassé - Justification requise'
      },
      itineraire: {
        prevu: transit.itineraire,
        verifie: donnees.itineraireVerifie !== false,
        conforme: donnees.itineraireConforme !== false,
        commentaire: donnees.commentaireItineraire || 'Itinéraire conforme au prévu'
      },
      documentsTransit: {
        complets: donnees.documentsComplets !== false,
        authentiques: donnees.documentsAuthentiques !== false,
        commentaire: donnees.commentaireDocuments || 'Documents en ordre'
      },
      marchandises: {
        quantiteCorrespond: donnees.quantiteCorrespond !== false,
        etatConservation: donnees.etatConservation || 'BON',
        scellementsIntacts: donnees.scellementsIntacts !== false,
        commentaire: donnees.commentaireMarchandises || 'Marchandises conformes'
      }
    },
    
    // Décision visa
    decisionVisa: donnees.decisionVisa || (delaiRespecte ? 'ACCORDE' : 'ACCORDE_AVEC_RESERVE'),
    observations: donnees.observations || '',
    dateVisa: new Date().toISOString(),
    
    // Exigences supplémentaires si nécessaire
    exigences: donnees.exigences || (delaiRespecte ? [] : ['Justification délai dépassé'])
  });
  
  return {
    etape: 9,
    action: 'VISA_DOUANIER_APPOSE',
    visaDouanier,
    prochaine_etape: 'ÉTAPE 10: Vérifications finales'
  };
}

// ✅ ÉTAPE 10 : Vérifications finales
async function effectuerVerifications(transitId, donnees = {}) {
  console.log(`🔍 [MALI] ÉTAPE 10 TRANSIT: Vérifications finales pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit || !transit.visaDouanier) {
    throw new Error('Visa douanier requis avant vérifications finales');
  }

  const verifications = database.effectuerVerificationsFinalesTransit(transitId, {
    agentVerificateur: donnees.agentVerificateur || 'AGENT_VERIFICATION_MALI',
    
    verificationDocumentaire: {
      declarationComplete: true,
      visaAppose: true,
      documentsJoints: true,
      coherenceInfo: donnees.coherenceInfo !== false,
      resultat: 'CONFORME'
    },
    
    verificationReglementaire: {
      droitsDouaniers: donnees.droitsDouaniers || 'EXEMPTE_TRANSIT',
      taxesApplicables: donnees.taxesApplicables || 'AUCUNE',
      restrictionsLevees: donnees.restrictionsLevees !== false,
      resultat: 'CONFORME'
    },
    
    verificationFinale: {
      aptMainlevee: donnees.aptMainlevee !== false,
      conditionsRespectees: true,
      autorisationProceder: donnees.autorisationProceder !== false,
      resultat: 'VALIDE'
    },
    
    dateVerification: new Date().toISOString(),
    observations: donnees.observations || 'Vérifications finales satisfaisantes'
  });
  
  return {
    etape: 10,
    action: 'VERIFICATIONS_FINALES_EFFECTUEES',
    verifications,
    prochaine_etape: 'ÉTAPE 12: Contrôles physiques (optionnel) ou ÉTAPE 13: Arrivée'
  };
}

// ✅ ÉTAPE 12 : Contrôles physiques (optionnel)
async function effectuerControlesPhysiques(transitId, donnees = {}) {
  console.log(`📦 [MALI] ÉTAPE 12 TRANSIT: Contrôles physiques pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  const controles = database.effectuerControlesPhysiquesTransit(transitId, {
    agentControleur: donnees.agentControleur || 'AGENT_CONTROLE_PHYSIQUE_MALI',
    typeControle: donnees.typeControle || 'PONCTUEL',
    
    controlesColis: {
      nombreColisVerifies: donnees.nombreColisVerifies || transit.marchandises?.length || 1,
      nombreColisTotal: transit.marchandises?.reduce((sum, m) => sum + (m.nombreColis || 1), 0) || 1,
      etatColis: donnees.etatColis || 'BON',
      scellementsVerifies: donnees.scellementsVerifies !== false
    },
    
    controlesMarchandises: {
      quantiteVerifiee: donnees.quantiteVerifiee !== false,
      qualiteVerifiee: donnees.qualiteVerifiee !== false,
      conformiteDescription: donnees.conformiteDescription !== false,
      anomaliesDetectees: donnees.anomaliesDetectees || []
    },
    
    resultatControle: donnees.resultatControle || 'CONFORME',
    observations: donnees.observations || 'Contrôles physiques satisfaisants',
    dateControle: new Date().toISOString()
  });
  
  return {
    etape: 12,
    action: 'CONTROLES_PHYSIQUES_EFFECTUES',
    controles,
    prochaine_etape: 'ÉTAPE 13: Confirmation arrivée'
  };
}

// ✅ ÉTAPE 13 : Confirmation arrivée
async function confirmerArrivee(transitId, donnees = {}) {
  console.log(`📦 [MALI] ÉTAPE 13 TRANSIT: Confirmation arrivée pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  const arrivee = database.enregistrerArriveeMarchandises(transitId, {
    controleEffectue: donnees.controleEffectue !== false,
    visaAppose: donnees.visaAppose !== false,
    conformiteItineraire: donnees.conformiteItineraire !== false,
    delaiRespecte: donnees.delaiRespecte !== false,
    declarationDetailDeposee: transit.declarationDetaillee ? true : false,
    agentReceptionnaire: donnees.agentReceptionnaire || 'AGENT_ARRIVEE_MALI',
    observationsArrivee: donnees.observationsArrivee || 'Arrivée confirmée'
  });
  
  return {
    etape: 13,
    action: 'ARRIVEE_CONFIRMEE',
    arrivee,
    prochaine_etape: 'ÉTAPE 14: Transmission message vers Kit'
  };
}

// ✅ ÉTAPE 14 : Transmission message arrivée
async function transmettreMessageArrivee(transitId, donnees = {}) {
  console.log(`📤 [MALI] ÉTAPE 14 TRANSIT: Transmission message arrivée pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  const arrivee = transit?.arrivee;
  
  if (!arrivee) {
    throw new Error('Arrivée non confirmée');
  }

  const messageArrivee = database.envoyerMessageArrivee(transitId);
  
  // Tenter d'envoyer vers Kit MuleSoft
  let transmissionReussie = false;
  let reponseKit = null;
  
  try {
    reponseKit = await kitClient.confirmerArriveeTransit(
      messageArrivee.numeroDeclarationTransit,
      {
        controleEffectue: arrivee.controleEffectue,
        visaAppose: arrivee.visaAppose,
        conformiteItineraire: arrivee.conformiteItineraire,
        delaiRespecte: arrivee.delaiRespecte,
        declarationDetailDeposee: arrivee.declarationDetailDeposee,
        agentReceptionnaire: arrivee.agentReceptionnaire,
        observationsArrivee: arrivee.observationsArrivee,
        
        // Infos additionnelles si disponibles
        visaDouanier: transit.visaDouanier ? {
          numeroVisa: transit.visaDouanier.numeroVisa,
          decisionVisa: transit.visaDouanier.decisionVisa,
          dateVisa: transit.visaDouanier.dateVisa
        } : null
      }
    );
    
    transmissionReussie = true;
    console.log(`✅ [MALI] ÉTAPE 14 TERMINÉE: Message transmis vers Kit MuleSoft`);
    
  } catch (error) {
    console.error(`⚠️ [MALI] Erreur transmission Kit (non bloquant):`, error.message);
  }
  
  return {
    etape: 14,
    action: 'MESSAGE_ARRIVEE_TRANSMIS',
    messageArrivee,
    transmissionReussie,
    reponseKit,
    workflowTransitTermine: transmissionReussie,
    prochaine_etape: transmissionReussie 
      ? 'Workflow transit Mali terminé - Attente apurement Pays A'
      : 'Réessayer transmission vers Kit'
  };
}

// ✅ Workflow transit complet automatique
async function executerWorkflowTransitComplet(transitId) {
  console.log(`🚀 [MALI TRANSIT] Exécution workflow complet pour ${transitId}`);
  
  const resultats = {
    transitId,
    etapes: []
  };
  
  try {
    // ÉTAPE 8
    const etape8 = await deposerDeclarationDetaillee(transitId);
    resultats.etapes.push(etape8);
    await attendre(500);
    
    // ÉTAPE 9
    const etape9 = await apposerVisaDouanier(transitId);
    resultats.etapes.push(etape9);
    await attendre(500);
    
    // ÉTAPE 10
    const etape10 = await effectuerVerifications(transitId);
    resultats.etapes.push(etape10);
    await attendre(500);
    
    // ÉTAPE 12 (optionnel mais on le fait)
    const etape12 = await effectuerControlesPhysiques(transitId);
    resultats.etapes.push(etape12);
    await attendre(500);
    
    // ÉTAPE 13
    const etape13 = await confirmerArrivee(transitId);
    resultats.etapes.push(etape13);
    await attendre(500);
    
    // ÉTAPE 14
    const etape14 = await transmettreMessageArrivee(transitId);
    resultats.etapes.push(etape14);
    
    resultats.status = 'WORKFLOW_COMPLET';
    resultats.message = '✅ Toutes les étapes transit Mali (8-14) ont été exécutées avec succès';
    resultats.transmissionReussie = etape14.transmissionReussie;
    
  } catch (error) {
    resultats.status = 'ERREUR';
    resultats.erreur = error.message;
    resultats.message = `❌ Erreur à l'étape ${resultats.etapes.length + 8}`;
  }
  
  return resultats;
}

function attendre(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}