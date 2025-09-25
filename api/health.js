// ============================================================================
// MALI - API Health CORRIGÉE selon rapport PDF UEMOA
// Bamako - Pays de destination (Pays B)
// Workflow MANUEL - Étapes 6-16 (libre pratique) + 11,13-14 (transit)
// ============================================================================

const kitClient = require('../lib/kit-client');
const database = require('../lib/database');

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
      console.log('🏥 [MALI] Demande health check - Bamako (Pays de destination)');
      
      // ✅ CORRECTION: Vérifier la connectivité Kit MuleSoft DIRECTE (sans bloquer)
      let kitStatus = null;
      try {
        console.log('🔍 [MALI] Test connectivité DIRECTE vers Kit MuleSoft...');
        kitStatus = await Promise.race([
          kitClient.verifierSante(), // ✅ Va maintenant directement vers MuleSoft
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout Kit MuleSoft > 5s')), 5000)
          )
        ]);
        console.log('✅ [MALI] Kit MuleSoft accessible:', kitStatus.accessible);
      } catch (error) {
        console.error('❌ [MALI] Kit MuleSoft inaccessible:', error.message);
        kitStatus = {
          accessible: false,
          erreur: error.message,
          status: 'TIMEOUT_OU_INACCESSIBLE',
          source: 'DIRECT_MULESOFT_TEST'
        };
      }

      // Obtenir statistiques workflow
      const stats = database.obtenirStatistiques();
      const workflowsActifs = database.obtenirWorkflowsActifs();

      const healthStatus = {
        service: 'Système Douanier Mali (Bamako)',
        status: 'UP',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        
        // ✅ CORRECTION: Informations Mali conformes au rapport PDF
        pays: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          type: 'HINTERLAND',
          role: 'PAYS_DESTINATION'
        },
        
        fonctionnalites: {
          receptionManifeste: 'ACTIF', // Étape 6
          workflowManuel: 'ACTIF', // Étapes 7-16
          declarationManuelle: 'ACTIF', // Étape 8
          paiementManuel: 'ACTIF', // Étape 14
          notificationKit: kitStatus?.accessible ? 'ACTIF' : 'INDISPONIBLE' // Étapes 15-16
        },
        
        // ✅ Workflow spécifique Mali selon rapport PDF
        workflow: {
          libre_pratique: {
            etapes_mali: '6-16',
            description: 'Réception manifeste, traitement manuel déclaration, paiement, transmission Kit',
            mode: 'MANUEL',
            prochaine_attente: 'Réception manifeste depuis Sénégal (étape 6)'
          },
          transit: {
            etapes_mali: '11, 13-14', 
            description: 'Réception déclaration transit, arrivée marchandises, message retour'
          }
        },
        
        workflowsActifs: {
          actifs: workflowsActifs?.length || 0,
          completes: stats.workflowsCompletes || 0,
          tauxAutomatisation: '0%', // ✅ Manuel côté Mali
          derniere_activite: stats.derniereMiseAJour
        },
        
        // ✅ CORRECTION: Informations Kit MuleSoft directes
        kit: {
          url: kitClient.baseURL, // URL MuleSoft directe
          status: kitStatus?.status || 'UNKNOWN',
          accessible: kitStatus?.accessible || false,
          latence: kitStatus?.latence || null,
          dernierTest: kitStatus?.timestamp || new Date().toISOString(),
          modeConnexion: 'DIRECT_MULESOFT', // ✅ Indique connexion directe
          source: kitStatus?.source || 'DIRECT_MULESOFT_TEST',
          role: 'Réception manifestes depuis Sénégal et transmission autorisation'
        },
        
        endpoints: {
          health: '/api/health',
          statistiques: '/api/statistiques',
          receptionManifeste: '/api/manifeste/reception', // Étape 6
          listerManifestes: '/api/manifeste/lister',
          listerDeclarations: '/api/declaration/lister',
          soumettreDeclaration: '/api/declaration/soumettre', // Étapes 14-16
          listerPaiements: '/api/paiement/lister',
          effectuerPaiement: '/api/paiement/effectuer' // Étape 14
        },
        
        // Partenaires workflow selon rapport PDF
        partenaires: {
          kit_interconnexion: {
            url: kitClient.baseURL,
            role: 'Routage depuis Sénégal et vers Sénégal',
            disponible: kitStatus?.accessible || false
          },
          pays_origine: {
            nom: 'Sénégal (Port de Dakar)',
            role: 'Pays de prime abord - Étapes 1-5, 17-19',
            communication: 'Via Kit MuleSoft'
          },
          commission_uemoa: {
            role: 'Supervision et statistiques workflow',
            communication: 'Transmission batch périodique (étapes 20-21)'
          }
        },
        
        monitoring: {
          uptime: process.uptime(),
          memoire: process.memoryUsage(),
          environnement: process.env.NODE_ENV || 'development',
          manifestesEnAttente: workflowsActifs?.filter(w => w.etapeActuelle === 'RECEPTION').length || 0,
          paiementsEnCours: workflowsActifs?.filter(w => w.etapeActuelle === 'PAIEMENT').length || 0
        }
      };

      // ✅ Status global (DEGRADED si Kit inaccessible mais workflow peut continuer)
      const globalStatus = kitStatus?.accessible ? 'UP' : 'DEGRADED';
      
      res.status(200).json({
        ...healthStatus,
        status: globalStatus
      });
      
    } catch (error) {
      console.error('❌ [MALI] Erreur health check:', error);
      
      res.status(500).json({
        service: 'Système Douanier Mali (Bamako)',
        status: 'ERROR',
        erreur: error.message,
        pays: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako'
        },
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ 
      erreur: 'Méthode non autorisée',
      methodesAutorisees: ['GET', 'OPTIONS'],
      pays: 'Mali - Bamako'
    });
  }
};