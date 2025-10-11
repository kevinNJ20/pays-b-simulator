// ============================================================================
// MALI - API Workflow Manuel - NOUVELLES ÉTAPES 7-16
// Fichier: api/workflow/manuel.js
// Permet de simuler toutes les étapes manuelles du workflow Mali
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
      const { action, manifesteId, donnees } = req.body;
      
      console.log(`🇲🇱 [MALI] Action workflow manuel: ${action} pour manifeste ${manifesteId}`);
      
      let resultat;
      
      switch (action) {
        case 'collecter_documents_guce':
          resultat = await collecterDocumentsGUCE(manifesteId, donnees);
          break;
          
        case 'creer_declaration':
          resultat = await creerDeclaration(manifesteId, donnees);
          break;
          
        case 'controler_et_calculer_devis':
          resultat = await controlerEtCalculerDevis(manifesteId, donnees);
          break;
          
        case 'enregistrer_declaration':
          resultat = await enregistrerDeclaration(manifesteId, donnees);
          break;
          
        case 'effectuer_controles_liquidation':
          resultat = await effectuerControlesLiquidation(manifesteId, donnees);
          break;
          
        case 'effectuer_paiement':
          resultat = await effectuerPaiement(manifesteId, donnees);
          break;
          
        case 'transmettre_vers_kit':
          resultat = await transmettreVersKit(manifesteId, donnees);
          break;
          
        case 'workflow_complet_auto':
          // Simuler toutes les étapes automatiquement
          resultat = await executerWorkflowComplet(manifesteId);
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
      console.error('❌ [MALI] Erreur workflow manuel:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de l\'exécution de l\'action',
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

// ✅ ÉTAPE 7 : Collecte documents GUCE
async function collecterDocumentsGUCE(manifesteId, donnees = {}) {
  console.log(`📋 [MALI] ÉTAPE 7: Collecte documents GUCE pour ${manifesteId}`);
  
  const documentsGUCE = database.collecterDocumentsGUCE(manifesteId, {
    connaissement: donnees.connaissement || `BL_${Date.now()}`,
    factureCommerciale: donnees.factureCommerciale || `FC_${Date.now()}`,
    declarationPrealable: donnees.declarationPrealable || `DP_${Date.now()}`,
    documentsBancaires: donnees.documentsBancaires || ['DB1', 'DB2'],
    certificatsOrigine: donnees.certificatsOrigine || ['CO_SEN'],
    operateurEconomique: donnees.operateurEconomique || 'OE_MALI_001',
    declarantMalien: donnees.declarantMalien || 'DECLARANT_MALI_SARL'
  });
  
  return {
    etape: 7,
    action: 'DOCUMENTS_GUCE_COLLECTES',
    documentsGUCE,
    prochaine_etape: 'ÉTAPE 8: Création déclaration'
  };
}

// ✅ ÉTAPE 8 : Création déclaration
async function creerDeclaration(manifesteId, donnees = {}) {
  console.log(`📝 [MALI] ÉTAPE 8: Création déclaration pour ${manifesteId}`);
  
  const manifeste = database.manifestesRecus.get(manifesteId);
  if (!manifeste || !manifeste.documentsGUCE) {
    throw new Error('Manifeste ou documents GUCE non disponibles');
  }
  
  // Préparer les articles depuis les marchandises du manifeste
  const articles = manifeste.marchandises.map((m, index) => ({
    numArt: index + 1,
    codeSh: m.codeTarifaire || '8703210000',
    designationCom: m.description || m.designation,
    origine: 'SEN',
    nbreColis: m.nombreColis || 1,
    poidsBrut: m.poidsBrut || m.poidsNet || 1000,
    poidsNet: m.poidsNet || m.poidsBrut || 1000,
    valeurCaf: m.valeurEstimee || 1000000,
    liquidation: Math.round((m.valeurEstimee || 1000000) * 0.15) // 15% estimation
  }));
  
  const declaration = database.creerDeclarationMalien(manifesteId, {
    declarantMalien: donnees.declarantMalien || 'DECLARANT_MALI_SARL',
    importateurMalien: donnees.importateurMalien || 'IMPORTATEUR_MALI_001',
    articles,
    valeurTotaleDeclaree: articles.reduce((sum, a) => sum + (a.valeurCaf || 0), 0)
  });
  
  return {
    etape: 8,
    action: 'DECLARATION_CREEE',
    declaration,
    prochaine_etape: 'ÉTAPES 9-10: Contrôles + Devis'
  };
}

// ✅ ÉTAPES 9-10 : Contrôles + Devis
async function controlerEtCalculerDevis(manifesteId, donnees = {}) {
  console.log(`🔍 [MALI] ÉTAPES 9-10: Contrôles + Devis pour ${manifesteId}`);
  
  const manifeste = database.manifestesRecus.get(manifesteId);
  const declaration = manifeste?.declaration;
  
  if (!declaration) {
    throw new Error('Déclaration non trouvée');
  }
  
  const controle = database.controlerEtCalculerDevis(declaration.id, {
    conformiteDocuments: donnees.conformiteDocuments !== false,
    coherenceValeurs: donnees.coherenceValeurs !== false,
    validiteOrigine: donnees.validiteOrigine !== false,
    agentControleur: donnees.agentControleur || 'AGENT_CONTROLE_MALI',
    agentLiquidateur: donnees.agentLiquidateur || 'AGENT_LIQUIDATEUR_MALI',
    observationsControle: donnees.observationsControle || 'RAS'
  });
  
  return {
    etapes: '9-10',
    action: 'CONTROLES_DEVIS_CALCULES',
    controle,
    prochaine_etape: 'ÉTAPE 11: Enregistrement déclaration'
  };
}

// ✅ ÉTAPE 11 : Enregistrement déclaration
async function enregistrerDeclaration(manifesteId, donnees = {}) {
  console.log(`📋 [MALI] ÉTAPE 11: Enregistrement déclaration pour ${manifesteId}`);
  
  const manifeste = database.manifestesRecus.get(manifesteId);
  const declaration = manifeste?.declaration;
  
  if (!declaration) {
    throw new Error('Déclaration non trouvée');
  }
  
  const enregistrement = database.enregistrerDeclarationDetaillee(declaration.id, {
    agentEnregistrement: donnees.agentEnregistrement || 'AGENT_ENREG_MALI'
  });
  
  return {
    etape: 11,
    action: 'DECLARATION_ENREGISTREE',
    enregistrement,
    prochaine_etape: 'ÉTAPES 12-13: Contrôles douaniers + Liquidation'
  };
}

// ✅ ÉTAPES 12-13 : Contrôles + Liquidation
async function effectuerControlesLiquidation(manifesteId, donnees = {}) {
  console.log(`🛃 [MALI] ÉTAPES 12-13: Contrôles + Liquidation pour ${manifesteId}`);
  
  const manifeste = database.manifestesRecus.get(manifesteId);
  const declaration = manifeste?.declaration;
  
  if (!declaration) {
    throw new Error('Déclaration non trouvée');
  }
  
  const liquidation = database.effectuerControlesEtLiquidation(declaration.id, {
    typeControle: donnees.typeControle || 'DOCUMENTAIRE',
    resultatControle: donnees.resultatControle || 'CONFORME',
    agentControleur: donnees.agentControleur || 'AGENT_CONTROLE_DOUANES',
    agentLiquidateur: donnees.agentLiquidateur || 'AGENT_LIQUIDATEUR',
    observationsControle: donnees.observationsControle || 'RAS'
  });
  
  return {
    etapes: '12-13',
    action: 'LIQUIDATION_EFFECTUEE',
    liquidation,
    prochaine_etape: 'ÉTAPE 14: Paiement droits et taxes'
  };
}

// ✅ ÉTAPE 14 : Paiement
async function effectuerPaiement(manifesteId, donnees = {}) {
  console.log(`💳 [MALI] ÉTAPE 14: Paiement pour ${manifesteId}`);
  
  const manifeste = database.manifestesRecus.get(manifesteId);
  const declaration = manifeste?.declaration;
  const liquidation = database.liquidations.get(declaration?.id);
  
  if (!declaration || !liquidation) {
    throw new Error('Déclaration ou liquidation non trouvée');
  }
  
  const paiement = database.enregistrerPaiement(declaration.id, {
    referencePaiement: donnees.referencePaiement || `PAY_MLI_${Date.now()}`,
    modePaiement: donnees.modePaiement || 'VIREMENT_BCEAO',
    compteTresor: donnees.compteTresor || 'TRESOR_MALI_001'
  });
  
  return {
    etape: 14,
    action: 'PAIEMENT_EFFECTUE',
    paiement,
    prochaine_etape: 'ÉTAPES 15-16: Transmission vers Kit MuleSoft'
  };
}

// ✅ ÉTAPES 15-16 : Transmission Kit
async function transmettreVersKit(manifesteId, donnees = {}) {
  console.log(`📤 [MALI] ÉTAPES 15-16: Transmission vers Kit pour ${manifesteId}`);
  
  const manifeste = database.manifestesRecus.get(manifesteId);
  const declaration = manifeste?.declaration;
  const paiement = database.paiements.get(declaration?.id);
  
  if (!declaration || !paiement) {
    throw new Error('Déclaration ou paiement non trouvé');
  }
  
  // Préparer les données pour transmission
  const transmission = database.transmettreVersKit(declaration.id);
  
  // Tenter d'envoyer vers Kit MuleSoft
  try {
    const declarationKit = {
      numeroDeclaration: declaration.numeroDeclaration,
      manifesteOrigine: manifeste.manifeste?.numeroOrigine,
      paysDeclarant: 'MLI',
      bureauDecl: '10S_BAMAKO',
      anneeDecl: new Date().getFullYear().toString(),
      dateDecl: new Date().toISOString().split('T')[0],
      montantPaye: paiement.montantPaye,
      referencePaiement: paiement.referencePaiement,
      datePaiement: paiement.datePaiement,
      modePaiement: paiement.modePaiement || 'VIREMENT_BCEAO',
      articles: declaration.articles || []
    };
    
    const reponseKit = await kitClient.soumettreDeclarationMali(declarationKit);
    
    transmission.kitResponse = reponseKit;
    transmission.transmissionReussie = true;
    
    console.log(`✅ [MALI] WORKFLOW COMPLET - Transmission Kit réussie`);
    
  } catch (error) {
    console.error(`⚠️ [MALI] Erreur transmission Kit (non bloquant):`, error.message);
    transmission.kitError = error.message;
    transmission.transmissionReussie = false;
  }
  
  return {
    etapes: '15-16',
    action: 'TRANSMISSION_KIT',
    transmission,
    workflowMaliTermine: true,
    message: '🎉 WORKFLOW MALI COMPLET (ÉTAPES 6-16)'
  };
}

// ✅ Workflow complet automatique
async function executerWorkflowComplet(manifesteId) {
  console.log(`🚀 [MALI] Exécution workflow complet pour ${manifesteId}`);
  
  const resultats = {
    manifesteId,
    etapes: []
  };
  
  try {
    // ÉTAPE 7
    const etape7 = await collecterDocumentsGUCE(manifesteId);
    resultats.etapes.push(etape7);
    await attendre(500);
    
    // ÉTAPE 8
    const etape8 = await creerDeclaration(manifesteId);
    resultats.etapes.push(etape8);
    await attendre(500);
    
    // ÉTAPES 9-10
    const etapes910 = await controlerEtCalculerDevis(manifesteId);
    resultats.etapes.push(etapes910);
    await attendre(500);
    
    // ÉTAPE 11
    const etape11 = await enregistrerDeclaration(manifesteId);
    resultats.etapes.push(etape11);
    await attendre(500);
    
    // ÉTAPES 12-13
    const etapes1213 = await effectuerControlesLiquidation(manifesteId);
    resultats.etapes.push(etapes1213);
    await attendre(500);
    
    // ÉTAPE 14
    const etape14 = await effectuerPaiement(manifesteId);
    resultats.etapes.push(etape14);
    await attendre(500);
    
    // ÉTAPES 15-16
    const etapes1516 = await transmettreVersKit(manifesteId);
    resultats.etapes.push(etapes1516);
    
    resultats.status = 'WORKFLOW_COMPLET';
    resultats.message = '✅ Toutes les étapes Mali (6-16) ont été exécutées avec succès';
    
  } catch (error) {
    resultats.status = 'ERREUR';
    resultats.erreur = error.message;
    resultats.message = `❌ Erreur à l'étape ${resultats.etapes.length + 6}`;
  }
  
  return resultats;
}

function attendre(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}