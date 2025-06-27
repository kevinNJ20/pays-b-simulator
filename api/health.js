module.exports = async (req, res) => {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    if (req.method === 'GET') {
      const healthStatus = {
        service: 'Système Douanier Pays B (Hinterland)',
        status: 'UP',
        version: '1.0.0-POC',
        timestamp: new Date().toISOString(),
        pays: {
          code: 'BFA',
          nom: 'Burkina Faso',
          type: 'HINTERLAND'
        },
        endpoints: {
          manifesteReception: '/api/manifeste/reception',
          declarationCreation: '/api/declaration/creation',
          paiementEffectuer: '/api/paiement/effectuer',
          statistiques: '/api/statistiques'
        }
      };
  
      res.status(200).json(healthStatus);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  };