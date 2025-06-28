const database = require('../../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-Country, X-Source-System, X-Correlation-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      console.log('📨 [Pays B] Réception manifeste depuis Kit:', {
        source: req.headers['x-source-system'],
        pays: req.headers['x-source-country'],
        correlationId: req.headers['x-correlation-id'],
        manifeste: req.body?.manifeste?.numeroOrigine
      });
      
      // Validation des données reçues
      const erreurs = validerManifesteRecu(req.body);
      if (erreurs.length > 0) {
        console.log('❌ [Pays B] Manifeste invalide:', erreurs);
        return res.status(400).json({
          status: 'ERROR',
          message: 'Données manifeste invalides',
          erreurs,
          timestamp: new Date().toISOString()
        });
      }

      // Enregistrer le manifeste et démarrer le workflow automatique
      const manifesteRecu = database.recevoirManifesteDepuisKit({
        ...req.body,
        headers: {
          sourceSystem: req.headers['x-source-system'],
          sourcePays: req.headers['x-source-country'],
          correlationId: req.headers['x-correlation-id']
        }
      });

      console.log(`✅ [Pays B] Manifeste reçu et workflow démarré: ${manifesteRecu.id}`);
      console.log(`🔄 [Pays B] Traitement automatique en cours...`);

      // Réponse immédiate de confirmation
      const reponse = {
        status: 'RECEIVED',
        message: 'Manifeste reçu, traitement automatique démarré',
        
        manifeste: {
          id: manifesteRecu.id,
          numeroOrigine: manifesteRecu.manifeste?.numeroOrigine,
          transporteur: manifesteRecu.manifeste?.transporteur,
          nombreMarchandises: manifesteRecu.marchandises?.length || 0,
          dateReception: manifesteRecu.dateReception
        },
        
        traitement: {
          mode: 'AUTOMATIQUE',
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
          id: manifesteRecu.id, // Le workflow utilise l'ID du manifeste
          statut: 'DEMARRE',
          etapeActuelle: 'DECLARATION'
        },
        
        timestamp: new Date().toISOString(),
        correlationId: req.headers['x-correlation-id']
      };

      res.status(200).json(reponse);
      
      // Log pour monitoring
      console.log(`📊 [Pays B] Workflow automatique initié pour manifeste ${manifesteRecu.manifeste?.numeroOrigine}`);
      
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
          sourceKit: manifeste.sourceKit
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
      message: 'Erreur lors du traitement du manifeste',
      erreur: error.message,
      timestamp: new Date().toISOString(),
      correlationId: req.headers['x-correlation-id']
    });
  }
};

// Validation des données de manifeste reçues du Kit
function validerManifesteRecu(donnees) {
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
    
    if (!manifeste.numeroOrigine || manifeste.numeroOrigine.trim() === '') {
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