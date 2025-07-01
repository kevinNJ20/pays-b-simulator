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
      console.log('📨 [Pays B] Réception manifeste depuis Kit MuleSoft:', {
        source: req.headers['x-source-system'],
        pays: req.headers['x-source-country'],
        correlationId: req.headers['x-correlation-id'],
        format: req.headers['x-manifeste-format'],
        bodyKeys: Object.keys(req.body || {})
      });
      
      // ✅ CORRECTION: Détecter et transformer le format UEMOA
      let manifesteFormate;
      const formatDetecte = detecterFormatManifeste(req.body);
      
      console.log(`🔍 [Pays B] Format détecté: ${formatDetecte}`);
      
      if (formatDetecte === 'UEMOA') {
        // Transformer le format UEMOA vers le format Pays B
        manifesteFormate = transformerFormatUEMOA(req.body);
        console.log('🔄 [Pays B] Transformation UEMOA → Pays B effectuée');
      } else if (formatDetecte === 'PAYS_B') {
        // Format déjà correct
        manifesteFormate = req.body;
        console.log('✅ [Pays B] Format Pays B natif détecté');
      } else {
        throw new Error(`Format de manifeste non reconnu: ${formatDetecte}`);
      }
      
      // Validation du manifeste transformé
      const erreurs = validerManifesteFormate(manifesteFormate);
      if (erreurs.length > 0) {
        console.log('❌ [Pays B] Manifeste invalide après transformation:', erreurs);
        return res.status(400).json({
          status: 'ERROR',
          message: 'Données manifeste invalides après transformation',
          erreurs,
          formatDetecte,
          timestamp: new Date().toISOString()
        });
      }

      // Enregistrer le manifeste et démarrer le workflow automatique
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

      console.log(`✅ [Pays B] Manifeste ${formatDetecte} reçu et workflow démarré: ${manifesteRecu.id}`);
      console.log(`🔄 [Pays B] Traitement automatique en cours...`);

      // ✅ CORRECTION: Réponse adaptée avec info sur le format
      const reponse = {
        status: 'RECEIVED',
        message: `Manifeste ${formatDetecte} reçu du Kit MuleSoft, traitement automatique démarré`,
        
        manifeste: {
          id: manifesteRecu.id,
          numeroOrigine: manifesteRecu.manifeste?.numeroOrigine,
          transporteur: manifesteRecu.manifeste?.transporteur,
          nombreMarchandises: manifesteRecu.marchandises?.length || 0,
          dateReception: manifesteRecu.dateReception,
          formatOrigine: formatDetecte
        },
        
        traitement: {
          mode: 'AUTOMATIQUE',
          formatSupporte: formatDetecte,
          etapesPlannifiees: [
            { etape: 'DECLARATION', delai: '2 secondes', statut: 'PLANIFIEE' },
            { etape: 'LIQUIDATION', delai: '5 secondes', statut: 'PLANIFIEE' },
            { etape: 'PAIEMENT', delai: '10 secondes', statut: 'PLANIFIEE' },
            { etape: 'NOTIFICATION_KIT', delai: '11 secondes', statut: 'PLANIFIEE' }
          ],
          estimationComplete: '~15 secondes'
        },
        
        pays: {
          code: 'BFA',
          nom: 'Burkina Faso',
          typeTraitement: 'HINTERLAND_AUTOMATIQUE'
        },
        
        workflow: {
          id: manifesteRecu.id,
          statut: 'DEMARRE',
          etapeActuelle: 'DECLARATION'
        },
        
        // ✅ NOUVEAU: Informations sur la transformation de format
        transformation: {
          formatEntree: formatDetecte,
          formatInterne: 'PAYS_B',
          champsTransformes: formatDetecte === 'UEMOA' ? [
            'manifeste.numero_origine → manifeste.numeroOrigine',
            'manifeste.consignataire → manifeste.transporteur',
            'articles → marchandises',
            'articles[].description → marchandises[].description',
            'articles[].destinataire → marchandises[].importateur',
            'articles[].poids_brut → marchandises[].poidsBrut'
          ] : ['Aucune transformation requise']
        },
        
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id']
      };

      res.status(200).json(reponse);
      
      // Log pour monitoring
      console.log(`📊 [Pays B] Workflow automatique initié pour manifeste ${formatDetecte} ${manifesteRecu.manifeste?.numeroOrigine}`);
      
    } else if (req.method === 'GET') {
      // Lister les manifestes reçus (pour le dashboard)
      const limite = parseInt(req.query.limite) || 10;
      const manifestes = database.obtenirManifestesRecus(limite);
      
      res.status(200).json({
        status: 'SUCCESS',
        message: `Liste de ${manifestes.length} manifeste(s) reçu(s)`,
        manifestes: manifestes.map(manifeste => ({
          id: manifeste.id,
          numeroOrigine: manifeste.manifeste?.numeroOrigine,
          transporteur: manifeste.manifeste?.transporteur,
          portOrigine: manifeste.manifeste?.portOrigine,
          dateArrivee: manifeste.manifeste?.dateArrivee,
          paysOrigine: manifeste.paysOrigine,
          nombreMarchandises: manifeste.marchandises?.length || 0,
          dateReception: manifeste.dateReception,
          statut: manifeste.statut,
          sourceKit: manifeste.sourceKit,
          formatOrigine: manifeste.formatOrigine || 'INCONNU'
        })),
        pagination: {
          limite,
          retournes: manifestes.length
        },
        timestamp: new Date().toISOString()
      });
      
    } else {
      res.status(405).json({ 
        erreur: 'Méthode non autorisée',
        methodesAutorisees: ['GET', 'POST', 'OPTIONS']
      });
    }
    
  } catch (error) {
    console.error('❌ [Pays B] Erreur API réception manifeste:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors du traitement du manifeste Kit MuleSoft',
      erreur: error.message,
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id']
    });
  }
};

// ✅ NOUVELLE FONCTION: Détecter le format du manifeste
function detecterFormatManifeste(donnees) {
  if (!donnees || typeof donnees !== 'object') {
    return 'INVALIDE';
  }

  // Format UEMOA du Kit MuleSoft
  if (donnees.manifeste && donnees.articles && Array.isArray(donnees.articles)) {
    if (donnees.manifeste.numero_origine !== undefined || 
        donnees.manifeste.format === 'UEMOA' ||
        donnees.articles.some(art => art.numero_article !== undefined)) {
      return 'UEMOA';
    }
  }

  // Format Pays B natif
  if (donnees.manifeste && donnees.marchandises && Array.isArray(donnees.marchandises)) {
    if (donnees.manifeste.numeroOrigine !== undefined ||
        donnees.marchandises.some(marc => marc.importateur !== undefined)) {
      return 'PAYS_B';
    }
  }

  return 'INCONNU';
}

// ✅ NOUVELLE FONCTION: Transformer format UEMOA vers format Pays B
function transformerFormatUEMOA(donneesUEMOA) {
  const manifesteUEMOA = donneesUEMOA.manifeste;
  const articlesUEMOA = donneesUEMOA.articles;

  return {
    manifeste: {
      // Transformations clés manifeste
      numeroOrigine: manifesteUEMOA.numero_origine,
      transporteur: manifesteUEMOA.consignataire || manifesteUEMOA.transporteur,
      navire: manifesteUEMOA.navire,
      portOrigine: manifesteUEMOA.provenance,
      portDestination: manifesteUEMOA.port_destination || 'OUAGADOUGOU',
      dateArrivee: manifesteUEMOA.date_arrivee,
      paysOrigine: manifesteUEMOA.paysOrigine || 'CIV',
      
      // Champs spécifiques UEMOA préservés
      format: 'UEMOA',
      anneeManifeste: manifesteUEMOA.annee_manifeste,
      bureauOrigine: manifesteUEMOA.bureau_origine,
      codeCGT: manifesteUEMOA.code_cgt,
      pavillon: manifesteUEMOA.pavillon
    },
    
    // Transformation articles → marchandises
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
      
      // Parties concernées
      importateur: article.destinataire,
      destinataire: article.destinataire,
      expediteur: article.expediteur,
      
      // Informations transport
      connaissement: article.connaissement,
      marque: article.marque,
      modeConditionnement: article.mode_conditionnement || article.mode_cond,
      
      // Informations destination
      villeDestination: article.ville_destination || article.ville_dest,
      voieDestination: article.voie_destination || article.voie_dest,
      ordre: article.ordre,
      
      // Dates
      dateEmbarquement: article.date_embarquement || article.date_emb,
      lieuEmbarquement: article.lieu_embarquement || article.lieu_emb,
      
      // Conteneurs
      conteneurs: article.conteneurs?.map(conteneur => ({
        numero: conteneur.numero || conteneur.conteneur,
        type: conteneur.type,
        taille: conteneur.taille,
        plomb: conteneur.plomb
      })) || [],
      nombreConteneurs: article.nombre_conteneurs || article.nbre_conteneur || 0,
      
      // Valeur estimée (calculée si pas présente)
      valeurEstimee: article.valeur_estimee || 
                     ((article.poids_brut || article.poids || 1000) * 200),
      
      // Champs UEMOA spécifiques
      numeroArticle: article.numero_article,
      precision1: article.precision_1,
      precision2: article.precision_2
    }))
  };
}

// ✅ NOUVELLE FONCTION: Validation du manifeste formaté
function validerManifesteFormate(donnees) {
  const erreurs = [];

  // Vérification structure générale
  if (!donnees || typeof donnees !== 'object') {
    erreurs.push('Données manifeste manquantes ou invalides');
    return erreurs;
  }

  // Vérification section manifeste
  if (!donnees.manifeste || typeof donnees.manifeste !== 'object') {
    erreurs.push('Section manifeste manquante');
  } else {
    const manifeste = donnees.manifeste;
    
    if (!manifeste.numeroOrigine || manifeste.numeroOrigine.toString().trim() === '') {
      erreurs.push('Numéro de manifeste origine requis');
    }
    
    if (!manifeste.transporteur || manifeste.transporteur.trim() === '') {
      erreurs.push('Transporteur requis');
    }
    
    if (!manifeste.paysOrigine || manifeste.paysOrigine.trim() === '') {
      erreurs.push('Pays d\'origine requis');
    }
  }

  // Vérification section marchandises
  if (!donnees.marchandises || !Array.isArray(donnees.marchandises)) {
    erreurs.push('Section marchandises manquante ou invalide');
  } else if (donnees.marchandises.length === 0) {
    erreurs.push('Au moins une marchandise est requise');
  } else {
    donnees.marchandises.forEach((marchandise, index) => {
      if (!marchandise.description && !marchandise.designation) {
        erreurs.push(`Description manquante pour la marchandise ${index + 1}`);
      }
      
      if (!marchandise.importateur && !marchandise.destinataire) {
        erreurs.push(`Importateur/destinataire manquant pour la marchandise ${index + 1}`);
      }
      
      // Validation poids/quantité
      const poids = marchandise.poidsNet || marchandise.poidsBrut || 0;
      if (poids <= 0) {
        erreurs.push(`Poids invalide pour la marchandise ${index + 1}`);
      }
    });
  }

  return erreurs;
}