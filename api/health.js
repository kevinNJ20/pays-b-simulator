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
      // ✅ CORRECTION: Vérifier la connectivité Kit MuleSoft DIRECTE (sans bloquer)
      let kitStatus = null;
      try {
        console.log('🔍 [Pays B] Test connectivité DIRECTE vers Kit MuleSoft...');
        kitStatus = await Promise.race([
          kitClient.verifierSante(), // ✅ Va maintenant directement vers MuleSoft
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout Kit MuleSoft > 5s')), 5000)
          )
        ]);
        console.log('✅ [Pays B] Kit MuleSoft accessible:', kitStatus.accessible);
      } catch (error) {
        console.error('❌ [Pays B] Kit MuleSoft inaccessible:', error.message);
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
        service: 'Système Douanier Pays B (Hinterland)',
        status: 'UP',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        
        pays: {
          code: 'BFA',
          nom: 'Burkina Faso',
          type: 'HINTERLAND',
          role: 'PAYS_DESTINATION'
        },
        
        fonctionnalites: {
          receptionManifeste: 'ACTIF',
          workflowAutomatique: 'ACTIF',
          declarationAutomatique: 'ACTIF',
          paiementAutomatique: 'ACTIF',
          notificationKit: kitStatus?.accessible ? 'ACTIF' : 'INDISPONIBLE'
        },
        
        workflow: {
          actifs: workflowsActifs.length,
          completes: stats.workflowsCompletes,
          tauxAutomatisation: stats.tauxAutomatisation + '%',
          derniereActivite: stats.derniereMiseAJour
        },
        
        // ✅ CORRECTION: Informations Kit MuleSoft directes
        kit: {
          url: kitClient.baseURL, // URL MuleSoft directe
          status: kitStatus?.status || 'UNKNOWN',
          accessible: kitStatus?.accessible || false,
          latence: kitStatus?.latence || null,
          dernierTest: kitStatus?.timestamp || new Date().toISOString(),
          modeConnexion: 'DIRECT_MULESOFT', // ✅ Indique connexion directe
          source: kitStatus?.source || 'DIRECT_MULESOFT_TEST'
        },
        
        endpoints: {
          health: '/api/health',
          statistiques: '/api/statistiques',
          receptionManifeste: '/api/manifeste/reception',
          listerManifestes: '/api/manifeste/lister',
          listerDeclarations: '/api/declaration/lister',
          listerPaiements: '/api/paiement/lister'
        },
        
        monitoring: {
          uptime: process.uptime(),
          memoire: process.memoryUsage(),
          environnement: process.env.NODE_ENV || 'development',
          manifestesEnAttente: workflowsActifs.filter(w => w.etapeActuelle === 'RECEPTION').length,
          paiementsEnCours: workflowsActifs.filter(w => w.etapeActuelle === 'PAIEMENT').length
        }
      };

      // ✅ Status global (DEGRADED si Kit inaccessible mais workflow peut continuer)
      const globalStatus = kitStatus?.accessible ? 'UP' : 'DEGRADED';
      
      res.status(200).json({
        ...healthStatus,
        status: globalStatus
      });
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur health check:', error);
      
      res.status(500).json({
        service: 'Système Douanier Pays B (Hinterland)',
        status: 'ERROR',
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