const database = require('../../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Paramètres de requête
      const limite = parseInt(req.query.limite) || 20;
      const statut = req.query.statut;
      
      console.log(`💳 [Pays B] Demande liste paiements (limite: ${limite})`);

      // Récupérer les paiements
      let paiements = database.obtenirPaiements(limite * 2); // Plus large pour le filtrage

      // Filtrage si nécessaire
      if (statut) {
        paiements = paiements.filter(p => p.statut === statut);
      }

      // Limiter après filtrage
      paiements = paiements.slice(0, limite);

      // Transformer pour l'API
      const paiementsFormats = paiements.map(paiement => ({
        id: paiement.id,
        numeroDeclaration: paiement.numeroDeclaration,
        manifesteOrigine: paiement.manifesteOrigine,
        montantPaye: paiement.montantPaye,
        referencePaiement: paiement.referencePaiement,
        datePaiement: paiement.datePaiement,
        paysDeclarant: paiement.paysDeclarant,
        modePaiement: paiement.modePaiement,
        statut: paiement.statut,
        modeEffectuation: paiement.modeEffectuation || 'AUTOMATIQUE',
        
        // Informations de notification Kit (si disponibles)
        notificationKit: paiement.notificationKit || null
      }));

      // Statistiques pour cette requête
      const stats = {
        total: paiementsFormats.length,
        parStatut: paiements.reduce((acc, p) => {
          acc[p.statut] = (acc[p.statut] || 0) + 1;
          return acc;
        }, {}),
        parMode: paiements.reduce((acc, p) => {
          acc[p.modePaiement] = (acc[p.modePaiement] || 0) + 1;
          return acc;
        }, {}),
        montants: {
          total: paiements.reduce((total, p) => total + (p.montantPaye || 0), 0),
          moyen: paiements.length > 0 
            ? Math.round(paiements.reduce((total, p) => total + (p.montantPaye || 0), 0) / paiements.length)
            : 0,
          minimum: paiements.length > 0 
            ? Math.min(...paiements.map(p => p.montantPaye || 0))
            : 0,
          maximum: paiements.length > 0 
            ? Math.max(...paiements.map(p => p.montantPaye || 0))
            : 0
        },
        notifications: {
          envoyees: paiements.filter(p => p.notificationKit?.statut === 'ENVOYEE').length,
          echecs: paiements.filter(p => p.notificationKit?.statut === 'ERREUR').length
        }
      };

      const reponse = {
        status: 'SUCCESS',
        message: `Liste de ${paiementsFormats.length} paiement(s)`,
        
        paiements: paiementsFormats,
        
        pagination: {
          limite,
          retournes: paiementsFormats.length,
          filtres: {
            ...(statut && { statut })
          }
        },
        
        statistiques: stats,
        
        timestamp: new Date().toISOString()
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur liste paiements:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des paiements',
        erreur: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ 
      erreur: 'Méthode non autorisée',
      methodesAutorisees: ['GET', 'OPTIONS']
    });
  }
};