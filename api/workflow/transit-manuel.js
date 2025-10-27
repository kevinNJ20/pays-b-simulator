// ============================================================================
// MALI - API Workflow Transit Manuel SIMPLIFIÉ - ÉTAPES 8-13
// Fichier: api/workflow/transit-manuel.js
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
          // ✅ ÉTAPE 10 SIMPLIFIÉE : Juste enregistrement
          resultat = await effectuerVerificationsSimple(transitId);
          break;
          
        case 'etape_11_suivant':
          // ✅ ÉTAPE 11 SIMPLIFIÉE : Juste validation
          resultat = await validerEtape11(transitId);
          break;
          
        case 'etape_12_suivant':
          // ✅ ÉTAPE 12 SIMPLIFIÉE : Juste validation
          resultat = await validerEtape12(transitId);
          break;
          
        case 'confirmer_arrivee_et_transmettre':
          // ✅ ÉTAPE 13 : Confirmation arrivée + Appel MuleSoft
          resultat = await confirmerArriveeEtTransmettre(transitId, donnees);
          break;
          
        case 'workflow_transit_complet':
          // Workflow complet automatique
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

// ✅ ÉTAPE 8 : Dépôt déclaration détaillée (INCHANGÉE)
async function deposerDeclarationDetaillee(transitId, donnees = null) {
  console.log(`📋 [MALI] ÉTAPE 8 TRANSIT: Dépôt déclaration détaillée pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  const declarationDetaillee = database.deposerDeclarationDetailTransit(transitId, {
    numeroDeclarationDetail: donnees?.numeroDeclarationDetail || `DET_${Date.now()}`,
    declarantMalien: donnees?.declarantMalien || 'DECLARANT_TRANSIT_MALI',
    importateurDestination: donnees?.importateurDestination || 'IMPORTATEUR_MALI_TRANSIT',
    
    marchandisesDetaillees: donnees?.marchandisesDetaillees || transit.marchandises?.map((m, idx) => ({
      numero: idx + 1,
      designation: m.designation || 'Marchandise transit',
      codeSH: donnees?.codeSH || '8703210000',
      origine: 'SEN',
      quantite: m.nombreColis || m.quantite || 1,
      poids: m.poids || 1000,
      valeurDeclaree: m.valeur || donnees?.valeurDeclaree || 500000
    })),
    
    documentsJoints: {
      connaissement: donnees?.connaissement || `BL_TRANS_${Date.now()}`,
      factureCommerciale: donnees?.factureCommerciale || `FC_TRANS_${Date.now()}`,
      certificatOrigine: donnees?.certificatOrigine || `CO_SEN_TRANS`,
      declarationValeur: donnees?.declarationValeur || true
    },
    
    numeroTransitOrigine: transit.numeroDeclarationTransit,
    referenceTransit: transit.id,
    agentDepot: donnees?.agentDepot || 'AGENT_DECLARANT_MALI'
  });
  
  return {
    etape: 8,
    action: 'DECLARATION_DETAILLEE_DEPOSEE',
    declarationDetaillee,
    prochaine_etape: 'ÉTAPE 9: Apposition visa douanier'
  };
}

// ✅ ÉTAPE 9 : Apposition visa douanier (INCHANGÉE)
async function apposerVisaDouanier(transitId, donnees = null) {
  console.log(`🛃 [MALI] ÉTAPE 9 TRANSIT: Apposition visa douanier pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit || !transit.declarationDetaillee) {
    throw new Error('Déclaration détaillée requise avant visa');
  }

  const dateReception = new Date(transit.dateReception);
  const dateActuelle = new Date();
  const delaiJours = Math.floor((dateActuelle - dateReception) / (1000 * 60 * 60 * 24));
  const delaiMaxJours = parseInt(transit.delaiRoute?.match(/\d+/)?.[0] || '72') / 24;
  const delaiRespecte = delaiJours <= delaiMaxJours;

  const visaDouanier = database.apposerVisaTransit(transitId, {
    numeroVisa: donnees?.numeroVisa || `VISA_MLI_${Date.now()}`,
    agentDouanier: donnees?.agentDouanier || 'AGENT_DOUANE_TRANSIT_MALI',
    bureauDouane: 'BAMAKO_TRANSIT',
    
    controles: {
      delaiRoute: {
        attendu: transit.delaiRoute,
        effectif: `${delaiJours} jours`,
        respecte: delaiRespecte,
        commentaire: delaiRespecte ? 'Délai respecté' : 'Délai dépassé'
      },
      itineraire: {
        prevu: transit.itineraire,
        verifie: donnees?.itineraireVerifie !== false,
        conforme: donnees?.itineraireConforme !== false,
        commentaire: donnees?.commentaireItineraire || 'Itinéraire conforme'
      },
      documentsTransit: {
        complets: donnees?.documentsComplets !== false,
        authentiques: donnees?.documentsAuthentiques !== false,
        commentaire: donnees?.commentaireDocuments || 'Documents en ordre'
      },
      marchandises: {
        quantiteCorrespond: donnees?.quantiteCorrespond !== false,
        etatConservation: donnees?.etatConservation || 'BON',
        scellementsIntacts: donnees?.scellementsIntacts !== false,
        commentaire: donnees?.commentaireMarchandises || 'Marchandises conformes'
      }
    },
    
    decisionVisa: donnees?.decisionVisa || (delaiRespecte ? 'ACCORDE' : 'ACCORDE_AVEC_RESERVE'),
    observations: donnees?.observations || '',
    dateVisa: new Date().toISOString(),
    exigences: donnees?.exigences || (delaiRespecte ? [] : ['Justification délai'])
  });
  
  return {
    etape: 9,
    action: 'VISA_DOUANIER_APPOSE',
    visaDouanier,
    prochaine_etape: 'ÉTAPE 10: Vérifications finales'
  };
}

// ✅ ÉTAPE 10 SIMPLIFIÉE : Juste enregistrement automatique
async function effectuerVerificationsSimple(transitId) {
  console.log(`🔍 [MALI] ÉTAPE 10 TRANSIT SIMPLIFIÉE: Enregistrement pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit || !transit.visaDouanier) {
    throw new Error('Visa douanier requis avant vérifications');
  }

  // Enregistrement automatique simple
  const verifications = database.effectuerVerificationsFinalesTransit(transitId, {
    agentVerificateur: 'AGENT_VERIFICATION_AUTO',
    
    verificationDocumentaire: {
      declarationComplete: true,
      visaAppose: true,
      documentsJoints: true,
      coherenceInfo: true,
      resultat: 'CONFORME'
    },
    
    verificationReglementaire: {
      droitsDouaniers: 'EXEMPTE_TRANSIT',
      taxesApplicables: 'AUCUNE',
      restrictionsLevees: true,
      resultat: 'CONFORME'
    },
    
    verificationFinale: {
      aptMainlevee: true,
      conditionsRespectees: true,
      autorisationProceder: true,
      resultat: 'VALIDE'
    },
    
    dateVerification: new Date().toISOString(),
    observations: 'Vérifications automatiques - Transit validé'
  });
  
  return {
    etape: 10,
    action: 'VERIFICATIONS_AUTOMATIQUES',
    verifications,
    prochaine_etape: 'ÉTAPE 11: Validation administrative'
  };
}

// ✅ ÉTAPE 11 SIMPLIFIÉE : Simple validation
async function validerEtape11(transitId) {
  console.log(`✅ [MALI] ÉTAPE 11 TRANSIT SIMPLIFIÉE: Validation pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  // Marquer l'étape 11 comme validée
  transit.etape11Validee = true;
  transit.dateEtape11 = new Date().toISOString();
  transit.etapeWorkflow = 11;
  
  return {
    etape: 11,
    action: 'ETAPE_11_VALIDEE',
    message: 'Validation administrative enregistrée',
    prochaine_etape: 'ÉTAPE 12: Autorisation de passage'
  };
}

// ✅ ÉTAPE 12 SIMPLIFIÉE : Simple validation
async function validerEtape12(transitId) {
  console.log(`✅ [MALI] ÉTAPE 12 TRANSIT SIMPLIFIÉE: Validation pour ${transitId}`);
  
  const transit = database.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  // Marquer l'étape 12 comme validée
  transit.etape12Validee = true;
  transit.dateEtape12 = new Date().toISOString();
  transit.etapeWorkflow = 12;
  
  return {
    etape: 12,
    action: 'ETAPE_12_VALIDEE',
    message: 'Autorisation de passage accordée',
    prochaine_etape: 'ÉTAPE 13: Confirmation arrivée et transmission vers kit d\'interconnexion'
  };
}

// ✅ ÉTAPE 13 : Confirmation arrivée + Appel MuleSoft
async function confirmerArriveeEtTransmettre(transitId, donnees = null) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📦 [MALI-BACKEND] ═══ ÉTAPE 13 TRANSIT - DÉBUT ═══');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📦 [MALI-BACKEND] Transit ID: ${transitId}`);
    console.log(`📦 [MALI-BACKEND] Données reçues:`, JSON.stringify(donnees, null, 2));
    
    const transit = database.declarationsTransit.get(transitId);
    
    if (!transit) {
      console.error(`❌ [MALI-BACKEND] Transit ${transitId} NON TROUVÉ dans la base`);
      console.error(`❌ [MALI-BACKEND] Transits disponibles:`, Array.from(database.declarationsTransit.keys()));
      throw new Error(`Transit ${transitId} non trouvé`);
    }
  
    console.log(`✅ [MALI-BACKEND] Transit trouvé:`, {
      id: transit.id,
      numeroDeclaration: transit.numeroDeclarationTransit,
      statut: transit.statut,
      etapeWorkflow: transit.etapeWorkflow,
      declarationDetaillee: !!transit.declarationDetaillee,
      visaDouanier: !!transit.visaDouanier
    });
  
    // Vérifier que les étapes précédentes sont complètes
    if (!transit.declarationDetaillee) {
      console.warn(`⚠️ [MALI-BACKEND] Déclaration détaillée manquante pour ${transitId}`);
    }
    
    if (!transit.visaDouanier) {
      console.warn(`⚠️ [MALI-BACKEND] Visa douanier manquant pour ${transitId}`);
    }
  
    // 1. Enregistrer l'arrivée
    console.log(`📝 [MALI-BACKEND] Enregistrement de l'arrivée...`);
    
    const arrivee = database.enregistrerArriveeMarchandises(transitId, {
      controleEffectue: donnees?.controleEffectue !== false,
      visaAppose: donnees?.visaAppose !== false,
      conformiteItineraire: donnees?.conformiteItineraire !== false,
      delaiRespecte: donnees?.delaiRespecte !== false,
      declarationDetailDeposee: transit.declarationDetaillee ? true : false,
      agentReceptionnaire: donnees?.agentReceptionnaire || 'AGENT_ARRIVEE_MALI',
      observationsArrivee: donnees?.observationsArrivee || 'Arrivée confirmée'
    });
  
    console.log(`✅ [MALI-BACKEND] Arrivée enregistrée:`, arrivee.id);
  
    // 2. Préparer les données pour MuleSoft
    const donneesTransmission = {
      numeroDeclaration: transit.numeroDeclarationTransit,
      controleEffectue: arrivee.controleEffectue,
      visaAppose: arrivee.visaAppose,
      conformiteItineraire: arrivee.conformiteItineraire,
      delaiRespecte: arrivee.delaiRespecte,
      declarationDetailDeposee: arrivee.declarationDetailDeposee,
      agentReceptionnaire: arrivee.agentReceptionnaire,
      observationsArrivee: arrivee.observationsArrivee,
      
      // Informations additionnelles
      bureauArrivee: 'BAMAKO_DOUANES',
      dateArrivee: arrivee.dateArrivee,
      
      // Visa douanier si disponible
      visaDouanier: transit.visaDouanier ? {
        numeroVisa: transit.visaDouanier.numeroVisa,
        decisionVisa: transit.visaDouanier.decisionVisa,
        dateVisa: transit.visaDouanier.dateVisa
      } : null,
      
      // Déclaration détaillée si disponible
      declarationDetaillee: transit.declarationDetaillee ? {
        numeroDeclarationDetail: transit.declarationDetaillee.numeroDeclarationDetail,
        dateDepot: transit.declarationDetaillee.dateDepot
      } : null
    };
  
    console.log('📤 [MALI-BACKEND] Données préparées pour MuleSoft:');
    console.log(JSON.stringify(donneesTransmission, null, 2));
  
    // 3. Appel MuleSoft pour transmettre les informations
    let transmissionReussie = false;
    let reponseKit = null;
    let erreurDetails = null;
    
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 [MALI-BACKEND] APPEL KIT MULESOFT EN COURS...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      reponseKit = await kitClient.confirmerArriveeTransit(
        transit.numeroDeclarationTransit,
        donneesTransmission
      );
      
      transmissionReussie = true;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ [MALI-BACKEND] TRANSMISSION MULESOFT RÉUSSIE !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 [MALI-BACKEND] Réponse Kit:', JSON.stringify(reponseKit, null, 2));
      
      // Enregistrer le message d'arrivée
      const messageArrivee = database.envoyerMessageArrivee(transitId);
      console.log(`✅ [MALI-BACKEND] Message arrivée enregistré: ${messageArrivee.id}`);
      
      // Marquer le workflow comme terminé
      transit.workflowTransitMaliTermine = true;
      transit.etapeWorkflow = 13;
      transit.statut = 'TRANSMIS_VERS_SENEGAL';
      transit.dateTransmissionKit = new Date().toISOString();
      transit.reponseKitMuleSoft = reponseKit;
      
      console.log('✅ [MALI-BACKEND] Transit mis à jour:', {
        id: transit.id,
        statut: transit.statut,
        etapeWorkflow: transit.etapeWorkflow,
        workflowTermine: transit.workflowTransitMaliTermine
      });
      
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [MALI-BACKEND] TRANSMISSION MULESOFT ÉCHOUÉE !');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`❌ [MALI-BACKEND] Erreur:`, error.message);
      console.error(`❌ [MALI-BACKEND] Stack:`, error.stack);
      
      erreurDetails = {
        message: error.message,
        code: error.code || 'UNKNOWN',
        stack: error.stack,
        response: error.response?.data || null
      };
      
      transmissionReussie = false;
      
      // Marquer quand même l'arrivée mais avec statut d'erreur
      transit.statut = 'ARRIVEE_CONFIRMEE_ERREUR_TRANSMISSION';
      transit.erreurTransmission = erreurDetails;
      transit.dateErreurTransmission = new Date().toISOString();
      
      console.error('⚠️ [MALI-BACKEND] Transit marqué avec erreur:', {
        id: transit.id,
        statut: transit.statut,
        erreur: erreurDetails.message
      });
    }
    
    const resultat = {
      etape: 13,
      action: 'ARRIVEE_CONFIRMEE_ET_TRANSMISE',
      transitId: transitId,
      numeroDeclaration: transit.numeroDeclarationTransit,
      arrivee: {
        id: arrivee.id,
        bureauArrivee: arrivee.bureauArrivee,
        dateArrivee: arrivee.dateArrivee,
        controleEffectue: arrivee.controleEffectue,
        visaAppose: arrivee.visaAppose,
        conformiteItineraire: arrivee.conformiteItineraire,
        delaiRespecte: arrivee.delaiRespecte
      },
      transmissionReussie,
      reponseKit,
      erreurDetails,
      workflowTermine: transmissionReussie,
      message: transmissionReussie 
        ? '✅ Workflow transit Mali terminé - Informations transmises à MuleSoft vers Sénégal'
        : `⚠️ Arrivée confirmée mais transmission MuleSoft échouée: ${erreurDetails?.message || 'Erreur inconnue'}`,
      prochaineEtape: transmissionReussie 
        ? 'Sénégal : Apurement et mainlevée (ÉTAPES 17-18)'
        : 'Réessayer la transmission vers kit d\'interconnexion'
    };
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📦 [MALI-BACKEND] ═══ ÉTAPE 13 TRANSIT - FIN ═══');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 [MALI-BACKEND] Résultat final:`, JSON.stringify(resultat, null, 2));
    console.log('═══════════════════════════════════════════════════════════════');
    
    return resultat;
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
    
    // ÉTAPE 10 (simplifiée)
    const etape10 = await effectuerVerificationsSimple(transitId);
    resultats.etapes.push(etape10);
    await attendre(500);
    
    // ÉTAPE 11 (simplifiée)
    const etape11 = await validerEtape11(transitId);
    resultats.etapes.push(etape11);
    await attendre(500);
    
    // ÉTAPE 12 (simplifiée)
    const etape12 = await validerEtape12(transitId);
    resultats.etapes.push(etape12);
    await attendre(500);
    
    // ÉTAPE 13 (arrivée + MuleSoft)
    const etape13 = await confirmerArriveeEtTransmettre(transitId);
    resultats.etapes.push(etape13);
    
    resultats.status = 'WORKFLOW_COMPLET';
    resultats.message = '✅ Toutes les étapes transit Mali (8-13) ont été exécutées';
    resultats.transmissionReussie = etape13.transmissionReussie;
    
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