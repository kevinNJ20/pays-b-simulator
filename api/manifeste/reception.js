// ============================================================================
// MALI - API Réception Manifeste ÉTAPE 6 CORRIGÉE
// Fichier: api/manifeste/reception.js - Pure réception depuis Kit MuleSoft
// ============================================================================

const database = require('../../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-Country, X-Source-System, X-Correlation-ID, X-Manifeste-Format');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // ✅ ÉTAPE 6 : Réception manifeste depuis Kit MuleSoft (Sénégal)
      console.log('📨 [MALI] ÉTAPE 6 : Réception manifeste depuis Kit MuleSoft');
      console.log('📋 [MALI] Headers:', {
        source: req.headers['x-source-system'],
        pays: req.headers['x-source-country'],
        correlationId: req.headers['x-correlation-id'],
        format: req.headers['x-manifeste-format']
      });
      console.log('📋 [MALI] Données:', JSON.stringify(req.body, null, 2));
      
      // Validation origine Sénégal via Kit
      if (req.headers['x-source-country'] !== 'SEN') {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Mali ne peut recevoir des manifestes que du Sénégal',
          paysAttendu: 'SEN',
          paysRecu: req.headers['x-source-country'],
          timestamp: new Date().toISOString()
        });
      }

      // Détecter format manifeste
      const formatDetecte = detecterFormatManifeste(req.body);
      console.log(`🔍 [MALI] Format détecté: ${formatDetecte}`);
      
      let manifesteFormate;
      if (formatDetecte === 'UEMOA') {
        manifesteFormate = transformerFormatUEMOA(req.body);
        console.log('🔄 [MALI] Transformation UEMOA → Format Mali effectuée');
      } else if (formatDetecte === 'PAYS_B') {
        manifesteFormate = req.body;
        console.log('✅ [MALI] Format Mali natif détecté');
      } else {
        throw new Error(`Format de manifeste non reconnu: ${formatDetecte}`);
      }
      
      // Validation du manifeste
      const erreurs = validerManifesteFormate(manifesteFormate);
      if (erreurs.length > 0) {
        console.log('❌ [MALI] Manifeste invalide:', erreurs);
        return res.status(400).json({
          status: 'ERROR',
          message: 'Données manifeste invalides pour traitement Mali',
          erreurs,
          formatDetecte,
          timestamp: new Date().toISOString()
        });
      }

      // ✅ ÉTAPE 6 : Enregistrer le manifeste au Mali
      const manifesteRecu = database.recevoirManifesteDepuisKit({
        ...manifesteFormate,
        formatOrigine: formatDetecte,
        headers: {
          sourceSystem: req.headers['x-source-system'],
          sourcePays: req.headers['x-source-country'],
          correlationId: req.headers['x-correlation-id'],
          formatManifeste: req.headers['x-manifeste-format']
        }
      });

      console.log(`✅ [MALI] ÉTAPE 6 TERMINÉE: Manifeste ${manifesteRecu.id} reçu et enregistré`);
      console.log(`🎯 [MALI] ➤ PROCHAINE ÉTAPE: Collecte documents GUCE Mali (ÉTAPE 7)`);

      // ✅ Réponse ÉTAPE 6 - Pas de workflow automatique
      const reponse = {
        status: 'RECEIVED',
        message: '✅ ÉTAPE 6 MALI TERMINÉE - Manifeste reçu depuis Sénégal, attente traitement manuel',
        
        // Informations pays Mali
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          role: 'PAYS_DESTINATION'
        },
        
        // Informations manifeste reçu
        manifeste: {
          id: manifesteRecu.id,
          numeroOrigine: manifesteRecu.manifeste?.numeroOrigine,
          transporteur: manifesteRecu.manifeste?.transporteur,
          nombreMarchandises: manifesteRecu.marchandises?.length || 0,
          dateReception: manifesteRecu.dateReception,
          formatOrigine: formatDetecte,
          paysOrigine: manifesteRecu.paysOrigine,
          bureauDestination: manifesteRecu.bureauDestination
        },
        
        // Workflow Mali - MANUEL uniquement
        workflow: {
          etapeTerminee: 6,
          etapeDescription: 'Réception et enregistrement manifeste depuis Sénégal',
          prochaine_etape: '7: Collecte documents pré-dédouanement GUCE Mali',
          modeTraitement: 'MANUEL',
          estimationDuree: 'Dépend du déclarant malien',
          etapesRestantes: '7-16 (10 étapes à traiter manuellement)'
        },
        
        // Instructions spécifiques Mali
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
        
        // Informations transformation format
        transformation: {
          formatEntree: formatDetecte,
          formatInterne: 'MALI_NATIVE',
          champsTransformes: formatDetecte === 'UEMOA' ? [
            'manifeste.numero_origine → manifeste.numeroOrigine',
            'manifeste.consignataire → manifeste.transporteur',
            'articles → marchandises',
            'Adaptation codes pays et bureaux Mali'
          ] : ['Aucune transformation requise - Format Mali natif']
        },
        
        // Références workflow selon rapport PDF
        references: {
          rapportPDF: 'Figure 19 - Architecture fonctionnelle interconnexion',
          etapesTotal: 21,
          etapesMali: '6-16',
          prochainRetourSenegal: 'ÉTAPE 17: Réception informations déclaration/recouvrement'
        },
        
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id']
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
          etapeSuivante: manifeste.etapeSuivante
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
      // Transformations pour Mali
      numeroOrigine: manifesteUEMOA.numero_origine,
      transporteur: manifesteUEMOA.consignataire || manifesteUEMOA.transporteur,
      navire: manifesteUEMOA.navire,
      portOrigine: manifesteUEMOA.provenance,
      portDestination: 'Bamako',
      dateArrivee: manifesteUEMOA.date_arrivee,
      paysOrigine: 'SEN',
      
      // Informations Mali spécifiques
      format: 'UEMOA_TO_MALI',
      anneeManifeste: manifesteUEMOA.annee_manifeste,
      bureauOrigine: manifesteUEMOA.bureau_origine,
      bureauDestination: 'BAMAKO_DOUANES'
    },
    
    // Transformation articles → marchandises Mali
    marchandises: articlesUEMOA.map((article, index) => ({
      position: article.position || index + 1,
      
      // Informations de base
      codeTarifaire: article.code_sh || article.codeTarifaire,
      description: article.description || article.marchandise,
      designation: article.description || article.marchandise,
      
      // Poids et quantités
      poidsBrut: article.poids_brut || article.poids,
      poidsNet: article.poids_net || article.poids_brut || article.poids,
      nombreColis: article.nombre_colis || article.nbre_colis,
      quantite: article.quantite || article.nombre_colis || 1,
      
      // Parties concernées - Mali
      importateur: article.destinataire,
      destinataire: article.destinataire,
      expediteur: article.expediteur,
      
      // Informations Mali
      villeDestination: 'Bamako',
      bureauDestination: 'BAMAKO_DOUANES',
      
      // Valeur estimée
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

  // Validation section manifeste
  if (!donnees.manifeste) {
    erreurs.push('Section manifeste manquante');
  } else {
    const manifeste = donnees.manifeste;
    
    if (!manifeste.numeroOrigine) {
      erreurs.push('Numéro de manifeste origine requis pour Mali');
    }
    
    if (!manifeste.transporteur) {
      erreurs.push('Transporteur requis pour traitement Mali');
    }
    
    if (!manifeste.paysOrigine || manifeste.paysOrigine !== 'SEN') {
      erreurs.push('Pays origine doit être SEN (Sénégal) pour Mali');
    }
  }

  // Validation marchandises
  if (!donnees.marchandises || !Array.isArray(donnees.marchandises)) {
    erreurs.push('Section marchandises manquante pour Mali');
  } else if (donnees.marchandises.length === 0) {
    erreurs.push('Au moins une marchandise requise pour traitement Mali');
  }

  return erreurs;
}