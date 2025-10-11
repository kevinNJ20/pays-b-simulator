// ============================================================================
// MALI - API Réception Manifeste ÉTAPE 6 CORRIGÉE ET AMÉLIORÉE
// Fichier: api/manifeste/reception.js
// Support test + format réel
// ============================================================================

const database = require('../../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-Country, X-Source-System, X-Correlation-ID, X-Manifeste-Format, X-Test-Mode');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // ✅ ÉTAPE 6 : Réception manifeste depuis Kit MuleSoft (ou test)
      console.log('📨 [MALI] ÉTAPE 6 : Réception manifeste');
      console.log('📋 [MALI] Headers:', {
        source: req.headers['x-source-system'],
        pays: req.headers['x-source-country'],
        correlationId: req.headers['x-correlation-id'],
        format: req.headers['x-manifeste-format'],
        testMode: req.headers['x-test-mode']
      });
      console.log('📋 [MALI] Body reçu:', JSON.stringify(req.body, null, 2));
      
      // ✅ CORRECTION : Détecter si c'est un test ou un manifeste réel
      const isTestMode = req.headers['x-test-mode'] === 'true' || 
                         req.body.isTest === true ||
                         (req.body.manifeste && req.body.manifeste.numeroOrigine && req.body.manifeste.numeroOrigine.includes('TEST'));
      
      if (isTestMode) {
        console.log('🧪 [MALI] Mode TEST détecté - Traitement simplifié');
      }
      
      // ✅ CORRECTION : Valider l'origine (sauf en mode test)
      if (!isTestMode && req.headers['x-source-country'] !== 'SEN') {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Mali ne peut recevoir des manifestes que du Sénégal',
          paysAttendu: 'SEN',
          paysRecu: req.headers['x-source-country'],
          timestamp: new Date().toISOString()
        });
      }

      // ✅ CORRECTION : Gérer le format simplifié du test
      let manifesteFormate;
      
      if (isTestMode) {
        // Format test simplifié
        manifesteFormate = {
          manifeste: req.body.manifeste || {
            numeroOrigine: req.body.numero_origine || `TEST_${Date.now()}`,
            transporteur: req.body.transporteur || 'SIMULATION DAKAR-BAMAKO',
            navire: req.body.navire || 'TEST VESSEL',
            portOrigine: req.body.portOrigine || 'Port de Dakar',
            portDestination: 'Bamako',
            dateArrivee: req.body.dateArrivee || new Date().toISOString().split('T')[0],
            paysOrigine: 'SEN',
            format: 'TEST'
          },
          marchandises: req.body.marchandises || [{
            position: 1,
            designation: 'Test Mali - Simulation',
            poidsNet: 1000,
            quantite: 1,
            importateur: 'SIMULATION IMPORT BAMAKO',
            destinataire: 'SIMULATION IMPORT BAMAKO',
            valeurEstimee: 500000
          }],
          formatOrigine: 'TEST'
        };
      } else {
        // Format réel - détecter et transformer
        const formatDetecte = detecterFormatManifeste(req.body);
        console.log(`🔍 [MALI] Format détecté: ${formatDetecte}`);
        
        if (formatDetecte === 'UEMOA') {
          manifesteFormate = transformerFormatUEMOA(req.body);
          console.log('🔄 [MALI] Transformation UEMOA → Format Mali effectuée');
        } else if (formatDetecte === 'PAYS_B') {
          manifesteFormate = req.body;
          console.log('✅ [MALI] Format Mali natif détecté');
        } else {
          throw new Error(`Format de manifeste non reconnu: ${formatDetecte}`);
        }
      }
      
      // ✅ Validation légère pour tests
      if (!isTestMode) {
        const erreurs = validerManifesteFormate(manifesteFormate);
        if (erreurs.length > 0) {
          console.log('❌ [MALI] Manifeste invalide:', erreurs);
          return res.status(400).json({
            status: 'ERROR',
            message: 'Données manifeste invalides pour traitement Mali',
            erreurs,
            timestamp: new Date().toISOString()
          });
        }
      }

      // ✅ ÉTAPE 6 : Enregistrer le manifeste au Mali
      const manifesteRecu = database.recevoirManifesteDepuisKit({
        ...manifesteFormate,
        formatOrigine: isTestMode ? 'TEST' : (manifesteFormate.formatOrigine || 'UEMOA'),
        isTest: isTestMode,
        headers: {
          sourceSystem: req.headers['x-source-system'] || 'KIT_INTERCONNEXION',
          sourcePays: req.headers['x-source-country'] || 'SEN',
          correlationId: req.headers['x-correlation-id'] || `TEST_${Date.now()}`,
          formatManifeste: req.headers['x-manifeste-format'] || 'TEST'
        }
      });

      console.log(`✅ [MALI] ÉTAPE 6 TERMINÉE: Manifeste ${manifesteRecu.id} reçu et enregistré`);
      console.log(`🎯 [MALI] ➤ PROCHAINE ÉTAPE: Collecte documents GUCE Mali (ÉTAPE 7)`);

      // ✅ Réponse ÉTAPE 6
      const reponse = {
        status: 'RECEIVED',
        message: isTestMode 
          ? '✅ ÉTAPE 6 MALI TERMINÉE (TEST) - Manifeste test reçu avec succès'
          : '✅ ÉTAPE 6 MALI TERMINÉE - Manifeste reçu depuis Sénégal, attente traitement manuel',
        
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          role: 'PAYS_DESTINATION'
        },
        
        manifeste: {
          id: manifesteRecu.id,
          numeroOrigine: manifesteRecu.manifeste?.numeroOrigine,
          transporteur: manifesteRecu.manifeste?.transporteur,
          nombreMarchandises: manifesteRecu.marchandises?.length || 0,
          dateReception: manifesteRecu.dateReception,
          formatOrigine: manifesteRecu.formatOrigine,
          paysOrigine: manifesteRecu.paysOrigine,
          bureauDestination: manifesteRecu.bureauDestination,
          isTest: isTestMode
        },
        
        workflow: {
          etapeTerminee: 6,
          etapeDescription: 'Réception et enregistrement manifeste depuis Sénégal',
          prochaine_etape: '7: Collecte documents pré-dédouanement GUCE Mali',
          modeTraitement: 'MANUEL',
          estimationDuree: 'Dépend du déclarant malien',
          etapesRestantes: '7-16 (10 étapes à traiter manuellement)'
        },
        
        instructions: [
          '✅ ÉTAPE 6 terminée - Manifeste reçu et enregistré au Mali',
          '👤 ÉTAPE 7: Un opérateur malien doit collecter les documents via GUCE Mali',
          '📋 ÉTAPE 8: Le déclarant malien doit créer la déclaration en détail',
          '🔍 ÉTAPES 9-10: Contrôles de recevabilité + Calcul devis par douanes Mali',
          '📝 ÉTAPE 11: Enregistrement déclaration détaillée par agent Mali',
          '🛃 ÉTAPES 12-13: Contrôles douaniers + Émission bulletin liquidation',
          '💳 ÉTAPE 14: Paiement droits et taxes (BCEAO/Trésor Mali)',
          '📤 ÉTAPES 15-16: Transmission autorisation mainlevée vers Sénégal via Kit'
        ],
        
        actionsDisponibles: [
          {
            etape: 7,
            action: 'collecter_documents_guce',
            description: 'Collecter documents via GUCE Mali',
            manuel: true
          },
          {
            etape: 8,
            action: 'creer_declaration',
            description: 'Créer déclaration douanière',
            manuel: true
          }
        ],
        
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id'] || `MALI_${Date.now()}`
      };

      res.status(200).json(reponse);
      
    } else if (req.method === 'GET') {
      // ✅ Lister les manifestes reçus au Mali
      const limite = parseInt(req.query.limite) || 10;
      const manifestes = database.obtenirManifestesRecus(limite);
      
      res.status(200).json({
        status: 'SUCCESS',
        message: `Liste des manifestes reçus au Mali (Bamako)`,
        
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          role: 'PAYS_DESTINATION'
        },
        
        manifestes: manifestes.map(manifeste => ({
          id: manifeste.id,
          numeroOrigine: manifeste.manifeste?.numeroOrigine,
          transporteur: manifeste.manifeste?.transporteur,
          paysOrigine: manifeste.paysOrigine,
          nombreMarchandises: manifeste.marchandises?.length || 0,
          dateReception: manifeste.dateReception,
          statut: manifeste.statut,
          etapeWorkflow: manifeste.etapeWorkflow,
          formatOrigine: manifeste.formatOrigine || 'INCONNU',
          etapeSuivante: manifeste.etapeSuivante,
          isTest: manifeste.isTest || false
        })),
        
        pagination: {
          limite,
          retournes: manifestes.length
        },
        
        workflow: {
          etapeActuelle: 6,
          description: 'Réception manifestes depuis Sénégal',
          prochainEtape: 'ÉTAPES 7-16: Traitement manuel par équipes Mali'
        },
        
        timestamp: new Date().toISOString()
      });
      
    } else {
      res.status(405).json({ 
        status: 'ERROR',
        message: 'Méthode non autorisée',
        methodesAutorisees: ['GET', 'POST', 'OPTIONS'],
        paysTraitement: 'Mali - Bamako'
      });
    }
    
  } catch (error) {
    console.error('❌ [MALI] Erreur API réception manifeste:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors du traitement du manifeste au Mali',
      erreur: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      paysTraitement: {
        code: 'MLI',
        nom: 'Mali',
        ville: 'Bamako'
      },
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id']
    });
  }
};

// ✅ Fonctions utilitaires Mali

function detecterFormatManifeste(donnees) {
  if (!donnees || typeof donnees !== 'object') {
    return 'INVALIDE';
  }

  // Format TEST
  if (donnees.isTest || (donnees.manifeste && donnees.manifeste.format === 'TEST')) {
    return 'TEST';
  }

  // Format UEMOA du Kit MuleSoft (depuis Sénégal)
  if (donnees.manifeste && donnees.articles && Array.isArray(donnees.articles)) {
    if (donnees.manifeste.numero_origine !== undefined || 
        donnees.manifeste.format === 'UEMOA' ||
        donnees.articles.some(art => art.numero_article !== undefined)) {
      return 'UEMOA';
    }
  }

  // Format Mali natif
  if (donnees.manifeste && donnees.marchandises && Array.isArray(donnees.marchandises)) {
    if (donnees.manifeste.numeroOrigine !== undefined ||
        donnees.marchandises.some(marc => marc.importateur !== undefined)) {
      return 'PAYS_B';
    }
  }

  return 'INCONNU';
}

function transformerFormatUEMOA(donneesUEMOA) {
  const manifesteUEMOA = donneesUEMOA.manifeste;
  const articlesUEMOA = donneesUEMOA.articles;

  return {
    manifeste: {
      numeroOrigine: manifesteUEMOA.numero_origine,
      transporteur: manifesteUEMOA.consignataire || manifesteUEMOA.transporteur,
      navire: manifesteUEMOA.navire,
      portOrigine: manifesteUEMOA.provenance,
      portDestination: 'Bamako',
      dateArrivee: manifesteUEMOA.date_arrivee,
      paysOrigine: 'SEN',
      format: 'UEMOA_TO_MALI',
      anneeManifeste: manifesteUEMOA.annee_manifeste,
      bureauOrigine: manifesteUEMOA.bureau_origine,
      bureauDestination: 'BAMAKO_DOUANES'
    },
    
    marchandises: articlesUEMOA.map((article, index) => ({
      position: article.position || index + 1,
      codeTarifaire: article.code_sh || article.codeTarifaire,
      description: article.description || article.marchandise,
      designation: article.description || article.marchandise,
      poidsBrut: article.poids_brut || article.poids,
      poidsNet: article.poids_net || article.poids_brut || article.poids,
      nombreColis: article.nombre_colis || article.nbre_colis,
      quantite: article.quantite || article.nombre_colis || 1,
      importateur: article.destinataire,
      destinataire: article.destinataire,
      expediteur: article.expediteur,
      villeDestination: 'Bamako',
      bureauDestination: 'BAMAKO_DOUANES',
      valeurEstimee: article.valeur_estimee || 
                     ((article.poids_brut || article.poids || 1000) * 200)
    }))
  };
}

function validerManifesteFormate(donnees) {
  const erreurs = [];

  if (!donnees || typeof donnees !== 'object') {
    erreurs.push('Données manifeste manquantes pour Mali');
    return erreurs;
  }

  if (!donnees.manifeste) {
    erreurs.push('Section manifeste manquante');
  } else {
    const manifeste = donnees.manifeste;
    
    if (!manifeste.numeroOrigine && !manifeste.numero_origine) {
      erreurs.push('Numéro de manifeste origine requis pour Mali');
    }
    
    if (!manifeste.transporteur) {
      erreurs.push('Transporteur requis pour traitement Mali');
    }
  }

  if (!donnees.marchandises || !Array.isArray(donnees.marchandises)) {
    erreurs.push('Section marchandises manquante pour Mali');
  } else if (donnees.marchandises.length === 0) {
    erreurs.push('Au moins une marchandise requise pour traitement Mali');
  }

  return erreurs;
}