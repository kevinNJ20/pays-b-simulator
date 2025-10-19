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
      const limite = parseInt(req.query.limite) || 20;
      
      console.log(`📋 [MALI] Demande liste documents GUCE (limite: ${limite})`);

      // Récupérer les documents GUCE
      const documents = Array.from(database.documentsGUCE.values())
        .sort((a, b) => new Date(b.dateCollecte) - new Date(a.dateCollecte))
        .slice(0, limite);

      // Transformer pour l'API
      const documentsFormats = documents.map(doc => ({
        id: doc.id,
        manifesteId: doc.manifesteId,
        numeroManifesteOrigine: doc.numeroManifesteOrigine,
        connaissement: doc.connaissement,
        factureCommerciale: doc.factureCommerciale,
        declarationPrealable: doc.declarationPrealable,
        documentsBancaires: doc.documentsBancaires || [],
        certificatsOrigine: doc.certificatsOrigine || [],
        operateurEconomique: doc.operateurEconomique,
        declarantMalien: doc.declarantMalien,
        dateCollecte: doc.dateCollecte,
        statut: doc.statut,
        etapeWorkflow: doc.etapeWorkflow
      }));

      // Statistiques
      const stats = {
        total: documentsFormats.length,
        parStatut: documents.reduce((acc, d) => {
          acc[d.statut] = (acc[d.statut] || 0) + 1;
          return acc;
        }, {})
      };

      const reponse = {
        status: 'SUCCESS',
        message: `Liste de ${documentsFormats.length} document(s) GUCE`,
        documents: documentsFormats,
        pagination: {
          limite,
          retournes: documentsFormats.length
        },
        statistiques: stats,
        timestamp: new Date().toISOString()
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [MALI] Erreur liste documents GUCE:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des documents GUCE',
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