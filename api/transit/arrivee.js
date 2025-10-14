// ============================================================================
// MALI - API Arrivée Marchandises Transit ÉTAPE 13
// Fichier: api/transit/arrivee.js
// Enregistrement arrivée marchandises au bureau Mali
// ============================================================================

const database = require('../../lib/database');
const kitClient = require('../../lib/kit-client');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-System');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      // ✅ ÉTAPE 13 : Enregistrer l'arrivée des marchandises
      console.log('📦 [MALI] ÉTAPE 13 TRANSIT : Enregistrement arrivée marchandises');
      console.log('📋 [MALI] Données arrivée:', JSON.stringify(req.body, null, 2));
      
      const { transitId, donneesArrivee } = req.body;
      
      // Validation
      if (!transitId) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'ID transit requis pour enregistrer l\'arrivée',
          timestamp: new Date().toISOString()
        });
      }

      // Enregistrer l'arrivée au Mali
      const arrivee = database.enregistrerArriveeMarchandises(transitId, {
        controleEffectue: donneesArrivee?.controleEffectue !== false,
        visaAppose: donneesArrivee?.visaAppose !== false,
        conformiteItineraire: donneesArrivee?.conformiteItineraire !== false,
        delaiRespecte: donneesArrivee?.delaiRespecte !== false,
        declarationDetailDeposee: donneesArrivee?.declarationDetailDeposee || false,
        agentReceptionnaire: donneesArrivee?.agentReceptionnaire || 'AGENT_MALI_TRANSIT',
        observationsArrivee: donneesArrivee?.observationsArrivee || ''
      });

      console.log(`✅ [MALI] ÉTAPE 13 TERMINÉE : Arrivée ${arrivee.id} enregistrée`);
      console.log(`📤 [MALI] PROCHAINE ÉTAPE : Envoi message arrivée vers Kit (ÉTAPE 14)`);

      // ✅ ÉTAPE 14 automatique : Envoi message arrivée vers Kit
      let messageArrivee = null;
      let transmissionReussie = false;
      
      try {
        messageArrivee = database.envoyerMessageArrivee(transitId);
        
        // Tenter d'envoyer vers Kit MuleSoft
        const reponseKit = await kitClient.confirmerArriveeTransit(
          messageArrivee.numeroDeclarationTransit,
          {
            controleEffectue: arrivee.controleEffectue,
            visaAppose: arrivee.visaAppose,
            conformiteItineraire: arrivee.conformiteItineraire,
            delaiRespecte: arrivee.delaiRespecte,
            declarationDetailDeposee: arrivee.declarationDetailDeposee,
            agentReceptionnaire: arrivee.agentReceptionnaire,
            observationsArrivee: arrivee.observationsArrivee
          }
        );
        
        transmissionReussie = true;
        console.log(`✅ [MALI] ÉTAPE 14 TERMINÉE : Message arrivée transmis vers Kit MuleSoft`);
        
      } catch (error) {
        console.error(`⚠️ [MALI] Erreur transmission Kit (non bloquant):`, error.message);
        transmissionReussie = false;
      }

      // ✅ Réponse ÉTAPES 13-14
      const reponse = {
        status: 'SUCCESS',
        message: transmissionReussie 
          ? '✅ ÉTAPES 13-14 MALI TERMINÉES - Arrivée confirmée et transmise vers Kit'
          : '✅ ÉTAPE 13 MALI TERMINÉE - Arrivée enregistrée (transmission Kit échouée)',
        
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          role: 'PAYS_DESTINATION'
        },
        
        arrivee: {
          id: arrivee.id,
          transitId: arrivee.transitId,
          bureauArrivee: arrivee.bureauArrivee,
          dateArrivee: arrivee.dateArrivee,
          controleEffectue: arrivee.controleEffectue,
          visaAppose: arrivee.visaAppose,
          conformiteItineraire: arrivee.conformiteItineraire,
          delaiRespecte: arrivee.delaiRespecte,
          agentReceptionnaire: arrivee.agentReceptionnaire,
          statut: arrivee.statut,
          etapeWorkflow: 13
        },
        
        messageArrivee: messageArrivee ? {
          id: messageArrivee.id,
          numeroDeclarationTransit: messageArrivee.numeroDeclarationTransit,
          dateEnvoi: messageArrivee.dateEnvoi,
          destinationKit: messageArrivee.destinationKit,
          transmissionReussie: transmissionReussie,
          statut: messageArrivee.statut,
          etapeWorkflow: 14
        } : null,
        
        workflow: {
          etapesTerminees: transmissionReussie ? '13-14' : '13',
          description: transmissionReussie 
            ? 'Arrivée confirmée au Mali et transmise vers Sénégal via Kit'
            : 'Arrivée confirmée au Mali (transmission Kit à réessayer)',
          prochaine_etape: transmissionReussie 
            ? '16: Kit transmet confirmation vers Sénégal'
            : '14: Réessayer transmission message arrivée',
          workflowTransitMaliTermine: transmissionReussie
        },
        
        instructions: transmissionReussie ? [
          '✅ ÉTAPE 13 terminée - Arrivée marchandises confirmée au Mali',
          '✅ ÉTAPE 14 terminée - Message arrivée transmis vers Kit MuleSoft',
          '📤 Kit MuleSoft va maintenant notifier le Sénégal (ÉTAPE 16)',
          '🔓 Sénégal pourra apurer le transit (ÉTAPES 17-18)'
        ] : [
          '✅ ÉTAPE 13 terminée - Arrivée marchandises confirmée au Mali',
          '⚠️ ÉTAPE 14 échouée - Transmission Kit à réessayer',
          '🔄 Vérifier connectivité Kit MuleSoft'
        ],
        
        timestamp: new Date().toISOString()
      };

      res.status(200).json(reponse);
      
    } else if (req.method === 'GET') {
      // ✅ Lister les arrivées de transit au Mali
      const limite = parseInt(req.query.limite) || 10;
      
      // Récupérer les transits avec arrivées
      const transits = Array.from(database.declarationsTransit.values())
        .filter(t => t.arrivee)
        .sort((a, b) => new Date(b.arrivee.dateArrivee) - new Date(a.arrivee.dateArrivee))
        .slice(0, limite);
      
      res.status(200).json({
        status: 'SUCCESS',
        message: `Liste des arrivées de transit au Mali`,
        
        arrivees: transits.map(transit => ({
          transitId: transit.id,
          numeroDeclaration: transit.numeroDeclarationTransit,
          arrivee: transit.arrivee,
          messageArrivee: transit.messageArrivee || null
        })),
        
        pagination: {
          limite,
          retournes: transits.length
        },
        
        timestamp: new Date().toISOString()
      });
      
    } else {
      res.status(405).json({ 
        status: 'ERROR',
        message: 'Méthode non autorisée',
        methodesAutorisees: ['POST', 'GET', 'OPTIONS']
      });
    }
    
  } catch (error) {
    console.error('❌ [MALI] Erreur arrivée transit:', error);
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors du traitement de l\'arrivée transit',
      erreur: error.message,
      paysTraitement: {
        code: 'MLI',
        nom: 'Mali',
        ville: 'Bamako'
      },
      timestamp: new Date().toISOString()
    });
  }
};