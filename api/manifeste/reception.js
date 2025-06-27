const db = require('../../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      console.log('📨 Manifeste reçu depuis Kit:', req.body);
      
      // Enregistrer le manifeste reçu
      const manifesteRecu = db.recevoirManifeste(req.body);
      
      console.log('✅ Manifeste traité, déclaration en cours de création...');
      
      res.status(200).json({
        status: 'RECEIVED',
        message: 'Manifeste reçu, déclaration en cours de création',
        numeroManifeste: manifesteRecu.id,
        estimationDeclaration: 'Dans 2-3 secondes',
        timestamp: new Date()
      });
      
    } else if (req.method === 'GET') {
      // Récupérer tous les manifestes reçus
      const manifestes = db.getManifestesRecus();
      res.status(200).json({
        manifestes: manifestes,
        total: manifestes.length
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Erreur API manifeste:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors du traitement du manifeste',
      error: error.message
    });
  }
};