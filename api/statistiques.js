// ============================================================================
// MALI - API Statistiques CORRIGÉE selon rapport PDF UEMOA
// Bamako - Pays de destination (Pays B)
// Workflow MANUEL - Étapes 6-16 (libre pratique) + 11,13-14 (transit)
// ============================================================================

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
      console.log('📊 [MALI] Demande statistiques - Bamako (Pays de destination)');

      // Obtenir les statistiques de base Mali
      const stats = database.obtenirStatistiques();
      const interactions = database.obtenirInteractionsKit(10);
      const workflowsActifs = database.obtenirWorkflowsActifs();
      
      // ✅ CORRECTION: Test Kit MuleSoft direct vers MuleSoft (sans bloquer)
      let kitInfo = null;
      try {
        console.log('🔍 [MALI] Test Kit MuleSoft direct...');
        kitInfo = await Promise.race([
          kitClient.verifierSante(), // ✅ Va maintenant directement vers MuleSoft
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout Kit MuleSoft > 5s')), 5000)
          )
        ]);
        console.log('✅ [MALI] Kit MuleSoft status:', kitInfo.status);
      } catch (error) {
        console.error('❌ [MALI] Kit MuleSoft inaccessible (non bloquant):', error.message);
        kitInfo = { 
          accessible: false, 
          erreur: error.message,
          status: 'TIMEOUT_OU_INACCESSIBLE',
          source: 'DIRECT_MULESOFT_TEST'
        };
      }

      // Calculer des métriques avancées spécifiques Mali
      const metriques = calculerMetriquesMali(stats, interactions, workflowsActifs);

      const reponse = {
        status: 'SUCCESS',
        message: 'Statistiques Mali (Bamako) - Pays de destination',
        timestamp: new Date().toISOString(),
        
        // ✅ Informations Mali selon rapport PDF
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          type: 'HINTERLAND',
          role: 'PAYS_DESTINATION'
        },
        
        // Statistiques principales workflow Mali
        statistiques: {
          ...stats,
          performance: {
            tauxAutomatisation: '0%', // ✅ Manuel côté Mali
            tempsTraitementMoyen: metriques.tempsTraitementMoyen,
            volumeTraiteToday: stats.manifestesAujourdhui || 0
          }
        },
        
        // ✅ Workflow libre pratique Mali spécifique (étapes 6-16)
        workflowLibrePratique: {
          etapesMali: '6-16',
          description: 'Réception manifeste, collecte GUCE, déclaration, contrôles, liquidation, paiement, transmission',
          etapesCompletes: {
            'etape_6_reception': stats.manifestesRecus || 0,
            'etapes_7_guce': stats.documentsGUCECollectes || 0,
            'etape_8_declaration': stats.declarationsCreees || 0,
            'etapes_9_10_controles': stats.declarationsControlees || 0,
            'etapes_12_13_liquidation': stats.liquidationsEmises || 0,
            'etape_14_paiement': stats.paiementsEffectues || 0,
            'etapes_15_16_transmission': stats.transmissionsKit || 0
          },
          mode: 'MANUEL',
          prochaine_attente: 'Réception manifeste depuis Sénégal via Kit MuleSoft'
        },
        
        // ✅ Workflow transit Mali (étapes 11, 13-14)
        workflowTransit: {
          etapesMali: '11, 13-14',
          description: 'Réception déclaration transit, arrivée marchandises, message retour',
          etapesCompletes: {
            'etape_11_reception_transit': stats.declarationsTransitRecues || 0,
            'etape_13_arrivee': stats.arriveesMarchandises || 0,
            'etape_14_message_arrivee': stats.messagesArriveeEnvoyes || 0
          }
        },
        
        // Workflow en temps réel
        workflow: {
          actifs: workflowsActifs?.length || 0,
          parEtape: metriques.workflowsParEtape || {},
          dureesMoyennes: metriques.dureesMoyennesParEtape || {},
          tauxSucces: metriques.tauxSuccesWorkflow || 100
        },
        
        // ✅ CORRECTION: Informations Kit MuleSoft directes
        kit: {
          status: kitInfo?.status || 'UNKNOWN',
          accessible: kitInfo?.accessible || false,
          url: kitClient.baseURL, // URL MuleSoft directe
          latence: kitInfo?.latence || null,
          dernierTest: kitInfo?.timestamp || new Date().toISOString(),
          modeConnexion: 'DIRECT_MULESOFT', // ✅ Indique connexion directe
          source: kitInfo?.source || 'DIRECT_MULESOFT_TEST',
          role: 'Réception depuis Sénégal et transmission autorisation'
        },
        
        // Interactions récentes avec le Kit Mali
        interactionsRecentes: interactions.map(interaction => ({
          id: interaction.id,
          type: interaction.type,
          timestamp: interaction.timestamp,
          donnees: interaction.donnees
        })),
        
        // ✅ CORRECTION: Breakdown par type d'opération Mali
        operationsParType: {
          manifestesRecus: stats.manifestesRecus || 0,
          documentsGUCECollectes: stats.documentsGUCECollectes || 0,
          declarationsCreees: stats.declarationsCreees || 0,
          declarationsControlees: stats.declarationsControlees || 0,
          liquidationsEmises: stats.liquidationsEmises || 0,
          paiementsEffectues: stats.paiementsEffectues || 0,
          transmissionsKit: stats.transmissionsKit || 0,
          declarationsTransitRecues: stats.declarationsTransitRecues || 0,
          arriveesMarchandises: stats.arriveesMarchandises || 0,
          messagesArriveeEnvoyes: stats.messagesArriveeEnvoyes || 0,
          erreurs: stats.erreurs || 0
        },
        
        // Données pour graphiques
        tendances: metriques.tendances,
        
        // ✅ CORRECTION: Santé du système avec info Kit directe
        systemeSante: {
          servicePrincipal: 'UP',
          baseDonnees: 'UP',
          workflowEngine: 'MANUAL', // ✅ Manuel côté Mali
          kitInterconnexion: kitInfo?.accessible ? 'UP' : 'DOWN',
          modeIntegration: 'DIRECT_MULESOFT', // ✅ Nouveau champ
          urlKit: kitClient.baseURL, // ✅ URL directe MuleSoft
          derniereMiseAJour: stats.derniereMiseAJour
        }
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [MALI] Erreur récupération statistiques:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des statistiques',
        erreur: error.message,
        paysTraitement: {
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

// ✅ Fonction pour calculer des métriques avancées Mali
function calculerMetriquesMali(stats, interactions, workflowsActifs) {
  // Workflows par étape Mali
  const workflowsParEtape = (workflowsActifs || []).reduce((acc, workflow) => {
    acc[workflow.etapeActuelle] = (acc[workflow.etapeActuelle] || 0) + 1;
    return acc;
  }, {});

  // Durées moyennes par étape (basé sur les workflows complétés)
  const workflowsCompletes = (workflowsActifs || []).filter(w => w.statut === 'COMPLETE');
  const dureesMoyennesParEtape = {};
  
  if (workflowsCompletes.length > 0) {
    workflowsCompletes.forEach(workflow => {
      workflow.etapes?.forEach(etape => {
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

  // Taux de succès des workflows Mali
  const totalWorkflows = (stats.workflowsCompletes || 0) + (stats.erreurs || 0);
  const tauxSuccesWorkflow = totalWorkflows > 0 
    ? Math.round(((stats.workflowsCompletes || 0) / totalWorkflows) * 100)
    : 100;

  // Temps de traitement moyen Mali
  const tempsTraitementMoyen = workflowsCompletes.length > 0
    ? Math.round(workflowsCompletes.reduce((acc, w) => {
        return acc + (w.dateFin ? w.dateFin - w.dateDebut : 0);
      }, 0) / workflowsCompletes.length / 1000) // En secondes
    : 0;

  // Tendances Mali (basé sur les interactions des dernières heures)
  const maintenant = new Date();
  const deuxHeuresAgo = new Date(maintenant.getTime() - (2 * 60 * 60 * 1000));
  
  const interactionsRecentes = (interactions || [])
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