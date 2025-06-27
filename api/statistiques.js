const db = require('../lib/database');

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
      const stats = db.getStatistiques();
      const manifestes = db.getManifestesRecus();
      const declarations = db.getDeclarations();
      const paiements = db.getPaiements();
      
      res.status(200).json({
        statistiques: stats,
        details: {
          manifestesRecents: manifestes.slice(-5),
          declarationsRecentes: declarations.slice(-5),
          paiementsRecents: paiements.slice(-5)
        }
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Erreur récupération statistiques',
        message: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};