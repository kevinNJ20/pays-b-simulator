const database = require('../../lib/database');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      console.log('💳 [Pays B] Demande paiement manuel:', req.body);
      
      const { numeroDeclaration, montantPaye, modePaiement = 'MANUEL' } = req.body;
      
      // Validation
      if (!numeroDeclaration) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Numéro de déclaration requis',
          timestamp: new Date().toISOString()
        });
      }
      
      if (!montantPaye || montantPaye <= 0) {
        return res.status(400).json({
          status: 'ERROR', 
          message: 'Montant de paiement invalide',
          timestamp: new Date().toISOString()
        });
      }
      
      // Trouver la déclaration
      const declarations = database.obtenirDeclarations();
      const declaration = declarations.find(d => d.numeroDeclaration === numeroDeclaration);
      
      if (!declaration) {
        return res.status(404).json({
          status: 'NOT_FOUND',
          message: `Déclaration ${numeroDeclaration} non trouvée`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (declaration.statut === 'PAYEE') {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Déclaration déjà payée',
          timestamp: new Date().toISOString()
        });
      }
      
      // Effectuer le paiement
      const paiement = database.effectuerPaiementManuel({
        numeroDeclaration,
        montantPaye,
        modePaiement,
        manifesteOrigine: declaration.numeroManifesteOrigine
      });
      
      console.log(`✅ [Pays B] Paiement manuel effectué: ${paiement.id}`);
      
      res.status(200).json({
        status: 'SUCCESS',
        message: 'Paiement effectué avec succès',
        paiement: {
          id: paiement.id,
          numeroDeclaration: paiement.numeroDeclaration,
          montantPaye: paiement.montantPaye,
          modePaiement: paiement.modePaiement,
          datePaiement: paiement.datePaiement
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur paiement manuel:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors du paiement',
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