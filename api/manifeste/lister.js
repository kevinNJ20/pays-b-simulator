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
      const paysOrigine = req.query.paysOrigine;
      
      console.log(`📋 [Pays B] Demande liste manifestes (limite: ${limite})`);

      // Récupérer les manifestes
      let manifestes = database.obtenirManifestesRecus(limite * 2); // Plus large pour le filtrage

      // Filtrage si nécessaire
      if (statut) {
        manifestes = manifestes.filter(m => m.statut === statut);
      }
      
      if (paysOrigine) {
        manifestes = manifestes.filter(m => m.paysOrigine === paysOrigine);
      }

      // Limiter après filtrage
      manifestes = manifestes.slice(0, limite);

      // Enrichir avec les informations de workflow
      const workflowsActifs = database.obtenirWorkflowsActifs();
      
      // Transformer pour l'API
      const manifestesFormates = manifestes.map(manifeste => {
        // Trouver le workflow correspondant
        const workflow = workflowsActifs.find(w => w.manifesteId === manifeste.id);
        
        return {
          id: manifeste.id,
          numeroOrigine: manifeste.manifeste?.numeroOrigine,
          transporteur: manifeste.manifeste?.transporteur,
          navire: manifeste.manifeste?.navire,
          
          ports: {
            origine: manifeste.manifeste?.portOrigine,
            destination: manifeste.manifeste?.portDestination
          },
          
          dateArrivee: manifeste.manifeste?.dateArrivee,
          dateReception: manifeste.dateReception,
          statut: manifeste.statut,
          
          origine: {
            pays: manifeste.paysOrigine,
            systeme: manifeste.headers?.sourceSystem
          },
          
          marchandises: {
            nombre: manifeste.marchandises?.length || 0,
            poidsTotalEstime: manifeste.marchandises?.reduce((total, m) => 
              total + (m.poidsNet || m.poidsBrut || 0), 0) || 0,
            valeurTotaleEstimee: manifeste.marchandises?.reduce((total, m) => 
              total + (m.valeurEstimee || 0), 0) || 0
          },
          
          workflow: workflow ? {
            id: workflow.id,
            statut: workflow.statut,
            etapeActuelle: workflow.etapeActuelle,
            dateDebut: workflow.dateDebut,
            dateFin: workflow.dateFin,
            etapes: workflow.etapes.map(etape => ({
              nom: etape.nom,
              statut: etape.statut,
              dateCompletee: etape.dateCompletee
            }))
          } : null,
          
          sourceKit: manifeste.sourceKit || false,
          correlationId: manifeste.headers?.correlationId
        };
      });

      // Statistiques pour cette requête
      const stats = {
        total: manifestesFormates.length,
        parStatut: manifestes.reduce((acc, m) => {
          acc[m.statut] = (acc[m.statut] || 0) + 1;
          return acc;
        }, {}),
        workflows: {
          enCours: manifestesFormates.filter(m => m.workflow?.statut === 'EN_COURS').length,
          completes: manifestesFormates.filter(m => m.workflow?.statut === 'COMPLETE').length,
          erreurs: manifestesFormates.filter(m => m.workflow?.statut === 'ERREUR').length
        }
      };

      const reponse = {
        status: 'SUCCESS',
        message: `Liste de ${manifestesFormates.length} manifeste(s) reçu(s)`,
        
        manifestes: manifestesFormates,
        
        pagination: {
          limite,
          retournes: manifestesFormates.length,
          filtres: {
            ...(statut && { statut }),
            ...(paysOrigine && { paysOrigine })
          }
        },
        
        statistiques: stats,
        
        timestamp: new Date().toISOString()
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur liste manifestes:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des manifestes',
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