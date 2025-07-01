// api/apurement/notification.js
const database = require('../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-Country, X-Source-System, X-Correlation-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      console.log('🔓 [Pays B] Réception notification apurement depuis Kit:', req.body);
      
      const { numeroManifeste, referencePaiement, dateApurement, typeConfirmation } = req.body;
      
      // Validation
      if (!numeroManifeste || !referencePaiement) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Numéro de manifeste et référence paiement requis',
          timestamp: new Date().toISOString()
        });
      }

      // Mettre à jour le paiement avec l'information d'apurement
      const result = database.enregistrerApurement({
        numeroManifeste,
        referencePaiement,
        dateApurement,
        typeConfirmation,
        sourceKit: true
      });

      console.log(`✅ [Pays B] Apurement enregistré pour manifeste ${numeroManifeste}`);

      res.status(200).json({
        status: 'SUCCESS',
        message: 'Notification d\'apurement reçue avec succès',
        apurement: result,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur notification apurement:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors du traitement de la notification d\'apurement',
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