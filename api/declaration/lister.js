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
      
      console.log(`📝 [Pays B] Demande liste déclarations (limite: ${limite})`);

      // Récupérer les déclarations
      let declarations = database.obtenirDeclarations(limite * 2); // Plus large pour le filtrage

      // Filtrage si nécessaire
      if (statut) {
        declarations = declarations.filter(d => d.statut === statut);
      }

      // Limiter après filtrage
      declarations = declarations.slice(0, limite);

      // Transformer pour l'API
      const declarationsFormatees = declarations.map(declaration => ({
        id: declaration.id,
        numeroDeclaration: declaration.numeroDeclaration,
        manifesteOrigine: declaration.manifesteOrigine,
        numeroManifesteOrigine: declaration.numeroManifesteOrigine,
        declarant: declaration.declarant,
        typeDeclaration: declaration.typeDeclaration,
        
        marchandises: {
          nombre: declaration.marchandises?.length || 0,
          valeurTotaleEstimee: declaration.marchandises?.reduce((total, m) => 
            total + (m.valeurEstimee || 0), 0) || 0
        },
        
        liquidation: declaration.liquidation ? {
          montantTotal: declaration.liquidation.montantTotal,
          devise: declaration.liquidation.devise,
          dateLiquidation: declaration.liquidation.dateLiquidation,
          methodeCalcul: declaration.liquidation.methodeCalcul
        } : null,
        
        paiement: declaration.paiement ? {
          id: declaration.paiement.id,
          montantPaye: declaration.paiement.montantPaye,
          datePaiement: declaration.paiement.datePaiement,
          modePaiement: declaration.paiement.modePaiement
        } : null,
        
        dateCreation: declaration.dateCreation,
        statut: declaration.statut,
        modeCreation: declaration.modeCreation || 'AUTOMATIQUE'
      }));

      // Statistiques pour cette requête
      const stats = {
        total: declarationsFormatees.length,
        parStatut: declarations.reduce((acc, d) => {
          acc[d.statut] = (acc[d.statut] || 0) + 1;
          return acc;
        }, {}),
        liquidations: {
          effectuees: declarations.filter(d => d.liquidation).length,
          montantTotal: declarations.reduce((total, d) => 
            total + (d.liquidation?.montantTotal || 0), 0)
        },
        paiements: {
          effectues: declarations.filter(d => d.paiement).length,
          montantTotal: declarations.reduce((total, d) => 
            total + (d.paiement?.montantPaye || 0), 0)
        }
      };

      const reponse = {
        status: 'SUCCESS',
        message: `Liste de ${declarationsFormatees.length} déclaration(s)`,
        
        declarations: declarationsFormatees,
        
        pagination: {
          limite,
          retournes: declarationsFormatees.length,
          filtres: {
            ...(statut && { statut })
          }
        },
        
        statistiques: stats,
        
        timestamp: new Date().toISOString()
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur liste déclarations:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des déclarations',
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