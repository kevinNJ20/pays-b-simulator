const database = require('../lib/database');
const kitClient = require('../lib/kit-client');

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
      console.log('📊 [Pays B] Demande statistiques');

      // Obtenir les statistiques de base
      const stats = database.obtenirStatistiques();
      const interactions = database.obtenirInteractionsKit(10);
      const workflowsActifs = database.obtenirWorkflowsActifs();
      
      // Test rapide de connectivité Kit (sans bloquer)
      let kitInfo = null;
      try {
        kitInfo = await Promise.race([
          kitClient.verifierSante(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (error) {
        kitInfo = { accessible: false, erreur: 'Timeout ou inaccessible' };
      }

      // Calculer des métriques avancées
      const metriques = calculerMetriquesAvancees(stats, interactions, workflowsActifs);

      const reponse = {
        status: 'SUCCESS',
        message: 'Statistiques Pays B (Hinterland)',
        timestamp: new Date().toISOString(),
        
        // Statistiques principales
        statistiques: {
          ...stats,
          performance: {
            tauxAutomatisation: stats.tauxAutomatisation,
            tempsTraitementMoyen: metriques.tempsTraitementMoyen,
            volumeTraiteToday: stats.manifestesAujourdhui
          }
        },
        
        // Workflow en temps réel
        workflow: {
          actifs: workflowsActifs.length,
          parEtape: metriques.workflowsParEtape,
          dureesMoyennes: metriques.dureesMoyennesParEtape,
          tauxSucces: metriques.tauxSuccesWorkflow
        },
        
        // Informations Kit
        kit: {
          status: kitInfo?.status || 'UNKNOWN',
          accessible: kitInfo?.accessible || false,
          url: kitClient.baseURL,
          latence: kitInfo?.latence || null,
          dernierTest: kitInfo?.timestamp || new Date().toISOString()
        },
        
        // Interactions récentes avec le Kit
        interactionsRecentes: interactions.map(interaction => ({
          id: interaction.id,
          type: interaction.type,
          timestamp: interaction.timestamp,
          donnees: interaction.donnees
        })),
        
        // Breakdown par type d'opération
        operationsParType: {
          manifestesRecus: stats.manifestesRecus,
          declarationsCreees: stats.declarationsCreees,
          paiementsEffectues: stats.paiementsEffectues,
          notificationsKit: stats.notificationsKit,
          workflowsCompletes: stats.workflowsCompletes,
          erreurs: stats.erreurs
        },
        
        // Données pour graphiques
        tendances: metriques.tendances,
        
        // Santé du système
        systemeSante: {
          servicePrincipal: 'UP',
          baseDonnees: 'UP',
          workflowEngine: workflowsActifs.some(w => w.statut === 'EN_COURS') ? 'ACTIVE' : 'IDLE',
          kitInterconnexion: kitInfo?.accessible ? 'UP' : 'DOWN',
          derniereMiseAJour: stats.derniereMiseAJour
        }
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur récupération statistiques:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des statistiques',
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

// Fonction pour calculer des métriques avancées
function calculerMetriquesAvancees(stats, interactions, workflowsActifs) {
  // Workflows par étape
  const workflowsParEtape = workflowsActifs.reduce((acc, workflow) => {
    acc[workflow.etapeActuelle] = (acc[workflow.etapeActuelle] || 0) + 1;
    return acc;
  }, {});

  // Durées moyennes par étape (basé sur les workflows complétés)
  const workflowsCompletes = workflowsActifs.filter(w => w.statut === 'COMPLETE');
  const dureesMoyennesParEtape = {};
  
  if (workflowsCompletes.length > 0) {
    workflowsCompletes.forEach(workflow => {
      workflow.etapes.forEach(etape => {
        if (etape.statut === 'COMPLETE' && etape.dateCompletee) {
          const cle = etape.nom;
          if (!dureesMoyennesParEtape[cle]) {
            dureesMoyennesParEtape[cle] = [];
          }
          // Calculer durée approximative (simplifiée)
          dureesMoyennesParEtape[cle].push(2000); // Placeholder
        }
      });
    });
  }

  // Taux de succès des workflows
  const totalWorkflows = stats.workflowsCompletes + stats.erreurs;
  const tauxSuccesWorkflow = totalWorkflows > 0 
    ? Math.round((stats.workflowsCompletes / totalWorkflows) * 100)
    : 100;

  // Temps de traitement moyen
  const tempsTraitementMoyen = workflowsCompletes.length > 0
    ? Math.round(workflowsCompletes.reduce((acc, w) => {
        return acc + (w.dateFin ? w.dateFin - w.dateDebut : 0);
      }, 0) / workflowsCompletes.length / 1000) // En secondes
    : 0;

  // Tendances (basé sur les interactions des dernières heures)
  const maintenant = new Date();
  const deuxHeuresAgo = new Date(maintenant.getTime() - (2 * 60 * 60 * 1000));
  
  const interactionsRecentes = interactions
    .filter(i => new Date(i.timestamp) >= deuxHeuresAgo);
  
  const tendances = {
    interactionsDernieres2h: interactionsRecentes.length,
    workflowsDernieres2h: interactionsRecentes.filter(i => i.type === 'WORKFLOW_COMPLETE').length,
    erreursDernieres2h: interactionsRecentes.filter(i => i.type.includes('ERREUR')).length,
    evolutionVolume: interactionsRecentes.length > 5 ? 'ELEVEE' : 
                    interactionsRecentes.length > 2 ? 'NORMALE' : 'FAIBLE'
  };

  return {
    workflowsParEtape,
    dureesMoyennesParEtape,
    tauxSuccesWorkflow,
    tempsTraitementMoyen,
    tendances
  };
}