// ============================================================================
// SÉNÉGAL - API Réception Message Arrivée Transit (ÉTAPE 16)
// Fichier: api/transit/arrivee.js
// Reçoit le message d'arrivée depuis le Kit MuleSoft (en provenance du Mali)
// ============================================================================

const database = require('../../lib/database');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-Country, X-Source-System, X-Correlation-ID, X-Workflow-Step');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const messageArrivee = req.body;
      
      console.log(`📥 [SÉNÉGAL] ÉTAPE 16 : Réception message arrivée transit`);
      console.log(`📥 [SÉNÉGAL] Message:`, JSON.stringify(messageArrivee, null, 2));
      
      // Validation des données
      if (!messageArrivee.numeroDeclaration && !messageArrivee.messageArrivee?.numeroDeclaration) {
        throw new Error('Numéro de déclaration transit manquant');
      }
      
      // Extraction des données (supporte deux formats)
      const donnees = messageArrivee.messageArrivee || messageArrivee;
      const numeroDeclaration = donnees.numeroDeclaration;
      
      // Rechercher le transit correspondant
      const transit = Array.from(database.declarationsTransit.values())
        .find(t => t.numeroDeclaration === numeroDeclaration);
      
      if (!transit) {
        console.warn(`⚠️ [SÉNÉGAL] Transit ${numeroDeclaration} non trouvé dans la base`);
        // On crée quand même un enregistrement pour traçabilité
        database.enregistrerMessageArriveeTransit(numeroDeclaration, donnees);
        
        res.status(200).json({
          status: 'WARNING',
          message: `Transit ${numeroDeclaration} non trouvé mais message enregistré`,
          numeroDeclaration,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      console.log(`✅ [SÉNÉGAL] Transit trouvé: ${transit.id}`);
      
      // Enregistrer le message d'arrivée
      const messageEnregistre = database.enregistrerMessageArriveeTransit(numeroDeclaration, {
        bureauArrivee: donnees.bureauArrivee || 'BAMAKO_DOUANES',
        dateArrivee: donnees.dateArrivee || new Date().toISOString(),
        controleEffectue: donnees.controleEffectue !== false,
        visaAppose: donnees.visaAppose !== false,
        conformiteItineraire: donnees.conformiteItineraire !== false,
        delaiRespecte: donnees.delaiRespecte !== false,
        declarationDetailDeposee: donnees.declarationDetailDeposee || false,
        observationsArrivee: donnees.observationsArrivee || '',
        
        // Métadonnées Kit
        correlationId: messageArrivee.metadata?.correlationId,
        sourcePays: messageArrivee.metadata?.sourcePays || 'Mali',
        dateReceptionKit: new Date().toISOString()
      });
      
      // Mettre à jour le statut du transit
      transit.statut = 'ARRIVEE_CONFIRMEE_MALI';
      transit.messageArrivee = messageEnregistre;
      transit.etapeWorkflow = 16;
      transit.pretPourApurement = true; // ✅ IMPORTANT : Marque comme prêt pour apurement
      transit.dateReceptionMessageArrivee = new Date().toISOString();
      
      console.log(`✅ [SÉNÉGAL] ÉTAPE 16 TERMINÉE : Message arrivée enregistré`);
      console.log(`✅ [SÉNÉGAL] Transit ${transit.id} prêt pour apurement (ÉTAPES 17-18)`);
      
      res.status(200).json({
        status: 'SUCCESS',
        message: 'Message arrivée transit reçu et enregistré avec succès',
        numeroDeclaration,
        transitId: transit.id,
        bureauArrivee: donnees.bureauArrivee,
        dateArrivee: donnees.dateArrivee,
        pretPourApurement: true,
        etapeWorkflow: 16,
        prochaine_etape: 'ÉTAPES 17-18: Apurement transit Sénégal',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [SÉNÉGAL] Erreur réception message arrivée:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors du traitement du message d\'arrivée',
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