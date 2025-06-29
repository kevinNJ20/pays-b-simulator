class WorkflowEngine {
    constructor(database) {
      this.database = database;
      this.workflowsActifs = new Map();
      this.etapesDisponibles = {
        RECEPTION: { duree: 1000, suivant: 'DECLARATION' },
        DECLARATION: { duree: 2000, suivant: 'LIQUIDATION' },
        LIQUIDATION: { duree: 3000, suivant: 'PAIEMENT' },
        PAIEMENT: { duree: 5000, suivant: 'NOTIFICATION_KIT' },
        NOTIFICATION_KIT: { duree: 1000, suivant: null }
      };
      
      console.log('🔄 [Pays B] Moteur de workflow initialisé');
    }
  
    // Démarrer un nouveau workflow
    demarrerWorkflow(manifesteId, type = 'MANIFESTE_STANDARD') {
      const workflowId = `WF_${Date.now()}_${manifesteId}`;
      
      const workflow = {
        id: workflowId,
        manifesteId,
        type,
        etapes: Object.keys(this.etapesDisponibles).map(nom => ({
          nom,
          statut: nom === 'RECEPTION' ? 'COMPLETE' : 'EN_ATTENTE',
          dateDebut: nom === 'RECEPTION' ? new Date() : null,
          dateFin: nom === 'RECEPTION' ? new Date() : null
        })),
        etapeActuelle: 'DECLARATION',
        dateDebut: new Date(),
        dateFin: null,
        statut: 'EN_COURS',
        resultats: {}
      };
      
      this.workflowsActifs.set(workflowId, workflow);
      
      // Programmer la prochaine étape
      this.programmerProchaineEtape(workflowId);
      
      console.log(`🚀 [Pays B] Workflow démarré: ${workflowId} pour manifeste ${manifesteId}`);
      return workflow;
    }
  
    // Programmer l'exécution de la prochaine étape
    programmerProchaineEtape(workflowId) {
      const workflow = this.workflowsActifs.get(workflowId);
      if (!workflow || workflow.statut !== 'EN_COURS') return;
      
      const etapeActuelle = workflow.etapeActuelle;
      const configEtape = this.etapesDisponibles[etapeActuelle];
      
      if (!configEtape) return;
      
      setTimeout(() => {
        this.executerEtape(workflowId, etapeActuelle);
      }, configEtape.duree);
    }
  
    // Exécuter une étape du workflow
    async executerEtape(workflowId, nomEtape) {
      const workflow = this.workflowsActifs.get(workflowId);
      if (!workflow) return;
      
      try {
        console.log(`⚙️ [Pays B] Exécution étape ${nomEtape} pour workflow ${workflowId}`);
        
        // Mettre à jour l'étape actuelle
        const etape = workflow.etapes.find(e => e.nom === nomEtape);
        if (etape) {
          etape.statut = 'EN_COURS';
          etape.dateDebut = new Date();
        }
        
        // Exécuter la logique spécifique à l'étape
        let resultat = {};
        switch (nomEtape) {
          case 'DECLARATION':
            resultat = await this.executerDeclaration(workflow);
            break;
          case 'LIQUIDATION':
            resultat = await this.executerLiquidation(workflow);
            break;
          case 'PAIEMENT':
            resultat = await this.executerPaiement(workflow);
            break;
          case 'NOTIFICATION_KIT':
            resultat = await this.executerNotificationKit(workflow);
            break;
        }
        
        // Marquer l'étape comme complétée
        if (etape) {
          etape.statut = 'COMPLETE';
          etape.dateFin = new Date();
        }
        
        workflow.resultats[nomEtape] = resultat;
        
        // Passer à l'étape suivante
        const configEtape = this.etapesDisponibles[nomEtape];
        if (configEtape.suivant) {
          workflow.etapeActuelle = configEtape.suivant;
          this.programmerProchaineEtape(workflowId);
        } else {
          // Workflow terminé
          this.terminerWorkflow(workflowId, 'COMPLETE');
        }
        
      } catch (error) {
        console.error(`❌ [Pays B] Erreur étape ${nomEtape}:`, error);
        this.terminerWorkflow(workflowId, 'ERREUR', error.message);
      }
    }
  
    // Logiques spécifiques des étapes
    async executerDeclaration(workflow) {
      const manifeste = this.database.manifestesRecus.get(workflow.manifesteId);
      if (!manifeste) throw new Error('Manifeste non trouvé');
      
      const declaration = this.database.creerDeclarationAutomatique(manifeste);
      return { declarationId: declaration.id };
    }
  
    async executerLiquidation(workflow) {
      const declarationId = workflow.resultats.DECLARATION?.declarationId;
      if (!declarationId) throw new Error('Déclaration non trouvée');
      
      const declaration = this.database.declarations.get(declarationId);
      const liquidation = this.database.calculerDroitsEtTaxes(declaration);
      
      declaration.liquidation = liquidation;
      declaration.statut = 'LIQUIDEE';
      
      return { montantTotal: liquidation.montantTotal };
    }
  
    async executerPaiement(workflow) {
      const declarationId = workflow.resultats.DECLARATION?.declarationId;
      const declaration = this.database.declarations.get(declarationId);
      
      const paiement = this.database.effectuerPaiementAutomatique(declaration);
      return { paiementId: paiement.id };
    }
  
    async executerNotificationKit(workflow) {
      const paiementId = workflow.resultats.PAIEMENT?.paiementId;
      const paiement = this.database.paiements.get(paiementId);
      
      try {
        const kitClient = require('./kit-client');
        const resultat = await kitClient.notifierPaiement(paiement);
        return { notificationReussie: true, resultat };
      } catch (error) {
        return { notificationReussie: false, erreur: error.message };
      }
    }
  
    // Terminer un workflow
    terminerWorkflow(workflowId, statut, erreur = null) {
      const workflow = this.workflowsActifs.get(workflowId);
      if (!workflow) return;
      
      workflow.statut = statut;
      workflow.dateFin = new Date();
      if (erreur) workflow.erreur = erreur;
      
      // Archiver le workflow (on peut le garder en mémoire ou dans la base)
      console.log(`🏁 [Pays B] Workflow terminé: ${workflowId} - Statut: ${statut}`);
      
      // Mettre à jour les statistiques
      if (statut === 'COMPLETE') {
        this.database.statistiques.workflowsCompletes++;
      } else {
        this.database.statistiques.erreurs++;
      }
    }
  
    // Obtenir le statut d'un workflow
    obtenirWorkflow(workflowId) {
      return this.workflowsActifs.get(workflowId);
    }
  
    // Obtenir tous les workflows actifs
    obtenirWorkflowsActifs() {
      return Array.from(this.workflowsActifs.values());
    }
  
    // Forcer l'arrêt d'un workflow
    arreterWorkflow(workflowId, raison = 'ARRET_MANUEL') {
      this.terminerWorkflow(workflowId, 'ARRETE', raison);
    }
  }
  
  module.exports = WorkflowEngine;