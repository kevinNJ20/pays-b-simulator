// Base de données Pays B (Hinterland) - Burkina Faso
class PaysBDatabase {
  constructor() {
    this.manifestesRecus = new Map();
    this.declarations = new Map();
    this.paiements = new Map();
    this.interactionsKit = [];
    this.workflowsActifs = new Map();
    
    this.statistiques = {
      manifestesRecus: 0,
      declarationsCreees: 0,
      paiementsEffectues: 0,
      notificationsKit: 0,
      workflowsCompletes: 0,
      erreurs: 0,
      derniereMiseAJour: new Date()
    };
    
    console.log('🏔️ Base de données Pays B (Hinterland) initialisée');
  }

  // === RÉCEPTION MANIFESTES DEPUIS LE KIT ===
  recevoirManifesteDepuisKit(donneesManifeste) {
    const id = `REC${Date.now()}`;
    
    const manifesteRecu = {
      id,
      ...donneesManifeste,
      dateReception: new Date(),
      statut: 'RECU_KIT',
      sourceKit: true,
      paysOrigine: donneesManifeste.manifeste?.paysOrigine || 'CIV'
    };
    
    this.manifestesRecus.set(id, manifesteRecu);
    this.statistiques.manifestesRecus++;
    this.statistiques.derniereMiseAJour = new Date();
    
    console.log(`📨 [Pays B] Manifeste reçu depuis Kit: ${id}`);
    
    // Ajouter à l'historique des interactions
    this.ajouterInteractionKit('RECEPTION_MANIFESTE', {
      manifesteId: id,
      numeroOrigine: donneesManifeste.manifeste?.numeroOrigine,
      source: 'KIT_INTERCONNEXION'
    });
    
    // Démarrer le workflow automatique
    this.demarrerWorkflowAutomatique(manifesteRecu);
    
    return manifesteRecu;
  }

  // === WORKFLOW AUTOMATIQUE ===
  demarrerWorkflowAutomatique(manifeste) {
    const workflowId = `WF${Date.now()}`;
    
    const workflow = {
      id: workflowId,
      manifesteId: manifeste.id,
      etapes: [
        { nom: 'RECEPTION', statut: 'COMPLETE', dateCompletee: new Date() },
        { nom: 'DECLARATION', statut: 'EN_ATTENTE', dateCompletee: null },
        { nom: 'LIQUIDATION', statut: 'EN_ATTENTE', dateCompletee: null },
        { nom: 'PAIEMENT', statut: 'EN_ATTENTE', dateCompletee: null },
        { nom: 'NOTIFICATION_KIT', statut: 'EN_ATTENTE', dateCompletee: null }
      ],
      etapeActuelle: 'DECLARATION',
      dateDebut: new Date(),
      dateFin: null,
      statut: 'EN_COURS'
    };
    
    this.workflowsActifs.set(workflowId, workflow);
    
    console.log(`🔄 [Pays B] Workflow automatique démarré: ${workflowId}`);
    
    // Programmer les étapes suivantes
    this.programmerEtapesSuivantes(workflowId);
    
    return workflow;
  }

  programmerEtapesSuivantes(workflowId) {
    const workflow = this.workflowsActifs.get(workflowId);
    if (!workflow) return;

    // Étape 1: Création déclaration après 2 secondes
    setTimeout(() => {
      this.executerEtapeDeclaration(workflowId);
    }, 2000);
  }

  executerEtapeDeclaration(workflowId) {
    const workflow = this.workflowsActifs.get(workflowId);
    const manifeste = this.manifestesRecus.get(workflow.manifesteId);
    
    if (!workflow || !manifeste) return;

    // Créer une déclaration automatiquement
    const declaration = this.creerDeclarationAutomatique(manifeste);
    
    // Mettre à jour workflow
    this.completerEtapeWorkflow(workflowId, 'DECLARATION');
    workflow.etapeActuelle = 'LIQUIDATION';
    
    console.log(`📝 [Pays B] Déclaration créée automatiquement: ${declaration.id}`);
    
    // Programmer liquidation après 3 secondes
    setTimeout(() => {
      this.executerEtapeLiquidation(workflowId, declaration.id);
    }, 3000);
  }

  executerEtapeLiquidation(workflowId, declarationId) {
    const workflow = this.workflowsActifs.get(workflowId);
    const declaration = this.declarations.get(declarationId);
    
    if (!workflow || !declaration) return;

    // Calculer droits et taxes
    const liquidation = this.calculerDroitsEtTaxes(declaration);
    declaration.liquidation = liquidation;
    declaration.statut = 'LIQUIDEE';
    
    // Mettre à jour workflow
    this.completerEtapeWorkflow(workflowId, 'LIQUIDATION');
    workflow.etapeActuelle = 'PAIEMENT';
    
    console.log(`💰 [Pays B] Liquidation effectuée: ${declarationId} - ${liquidation.montantTotal} FCFA`);
    
    // Programmer paiement après 5 secondes
    setTimeout(() => {
      this.executerEtapePaiement(workflowId, declarationId);
    }, 5000);
  }

  executerEtapePaiement(workflowId, declarationId) {
    const workflow = this.workflowsActifs.get(workflowId);
    const declaration = this.declarations.get(declarationId);
    
    if (!workflow || !declaration) return;

    // Effectuer paiement automatique
    const paiement = this.effectuerPaiementAutomatique(declaration);
    
    // Mettre à jour workflow
    this.completerEtapeWorkflow(workflowId, 'PAIEMENT');
    workflow.etapeActuelle = 'NOTIFICATION_KIT';
    
    console.log(`💳 [Pays B] Paiement effectué: ${paiement.id}`);
    
    // Programmer notification Kit après 1 seconde
    setTimeout(() => {
      this.executerEtapeNotificationKit(workflowId, paiement.id);
    }, 1000);
  }

  async executerEtapeNotificationKit(workflowId, paiementId) {
    const workflow = this.workflowsActifs.get(workflowId);
    const paiement = this.paiements.get(paiementId);
    
    if (!workflow || !paiement) return;

    try {
      // Notifier le Kit d'Interconnexion
      const kitClient = require('./kit-client');
      await kitClient.notifierPaiement(paiement);
      
      // Workflow complété avec succès
      this.completerEtapeWorkflow(workflowId, 'NOTIFICATION_KIT');
      workflow.statut = 'COMPLETE';
      workflow.dateFin = new Date();
      workflow.etapeActuelle = 'TERMINE';
      
      this.statistiques.workflowsCompletes++;
      this.statistiques.notificationsKit++;
      
      console.log(`✅ [Pays B] Workflow complété: ${workflowId}`);
      
      this.ajouterInteractionKit('WORKFLOW_COMPLETE', {
        workflowId,
        paiementId,
        duree: workflow.dateFin - workflow.dateDebut
      });
      
    } catch (error) {
      console.error(`❌ [Pays B] Erreur notification Kit:`, error.message);
      
      workflow.statut = 'ERREUR';
      workflow.erreur = error.message;
      this.statistiques.erreurs++;
      
      this.ajouterInteractionKit('NOTIFICATION_KIT_ERREUR', {
        workflowId,
        erreur: error.message
      });
    }
  }

  completerEtapeWorkflow(workflowId, etapeNom) {
    const workflow = this.workflowsActifs.get(workflowId);
    if (!workflow) return;

    const etape = workflow.etapes.find(e => e.nom === etapeNom);
    if (etape) {
      etape.statut = 'COMPLETE';
      etape.dateCompletee = new Date();
    }
  }

  // === CRÉATION DÉCLARATION AUTOMATIQUE ===
  creerDeclarationAutomatique(manifeste) {
    const numeroDeclaration = `DEC${Date.now()}`;
    
    const declaration = {
      id: numeroDeclaration,
      numeroDeclaration,
      manifesteOrigine: manifeste.id,
      numeroManifesteOrigine: manifeste.manifeste?.numeroOrigine,
      declarant: 'IMPORT AUTOMATIQUE SARL',
      typeDeclaration: 'MISE_A_LA_CONSOMMATION',
      marchandises: manifeste.marchandises || [],
      dateCreation: new Date(),
      statut: 'DEPOSEE',
      modeCreation: 'AUTOMATIQUE'
    };
    
    this.declarations.set(numeroDeclaration, declaration);
    this.statistiques.declarationsCreees++;
    
    console.log(`📝 [Pays B] Déclaration créée: ${numeroDeclaration}`);
    return declaration;
  }

  // === CALCUL DROITS ET TAXES ===
  calculerDroitsEtTaxes(declaration) {
    let montantTotal = 0;
    let detailCalcul = [];

    declaration.marchandises?.forEach((marchandise, index) => {
      // Estimation basée sur le poids ou valeur
      const valeurEstimee = marchandise.valeurEstimee || (marchandise.poidsNet || marchandise.poidsBrut || 1000) * 200;
      const droitsDouane = valeurEstimee * 0.15; // 15% de droits
      const tva = valeurEstimee * 0.18; // 18% TVA
      const taxeStatistique = valeurEstimee * 0.01; // 1% taxe statistique
      
      const totalMarchandise = droitsDouane + tva + taxeStatistique;
      montantTotal += totalMarchandise;
      
      detailCalcul.push({
        position: index + 1,
        description: marchandise.description || marchandise.designation,
        valeurEstimee,
        droitsDouane,
        tva,
        taxeStatistique,
        total: totalMarchandise
      });
    });

    // Arrondir au franc CFA
    montantTotal = Math.round(montantTotal);

    return {
      montantTotal,
      devise: 'XOF', // Franc CFA
      detailCalcul,
      dateLiquidation: new Date(),
      methodeCalcul: 'AUTOMATIQUE'
    };
  }

  // === PAIEMENT AUTOMATIQUE ===
  effectuerPaiementAutomatique(declaration) {
    const paiementId = `PAY${Date.now()}`;
    
    const paiement = {
      id: paiementId,
      numeroDeclaration: declaration.numeroDeclaration,
      manifesteOrigine: declaration.numeroManifesteOrigine,
      montantPaye: declaration.liquidation.montantTotal,
      referencePaiement: paiementId,
      datePaiement: new Date(),
      paysDeclarant: 'BFA', // Burkina Faso
      modePaiement: 'VIREMENT_BANCAIRE',
      statut: 'CONFIRME',
      modeEffectuation: 'AUTOMATIQUE'
    };
    
    this.paiements.set(paiementId, paiement);
    this.statistiques.paiementsEffectues++;
    
    // Mettre à jour la déclaration
    declaration.statut = 'PAYEE';
    declaration.paiement = paiement;
    
    console.log(`💳 [Pays B] Paiement effectué: ${paiementId} - ${paiement.montantPaye} FCFA`);
    return paiement;
  }

  // === INTERACTIONS KIT ===
  ajouterInteractionKit(type, donnees) {
    const interaction = {
      id: `INT${Date.now()}`,
      type,
      timestamp: new Date(),
      donnees
    };

    this.interactionsKit.unshift(interaction);
    
    // Garder seulement les 100 dernières interactions
    if (this.interactionsKit.length > 100) {
      this.interactionsKit = this.interactionsKit.slice(0, 100);
    }

    return interaction;
  }

  obtenirInteractionsKit(limite = 20) {
    return this.interactionsKit.slice(0, limite);
  }

  // === ACCESSEURS ===
  obtenirManifestesRecus(limite = 10) {
    const manifestes = Array.from(this.manifestesRecus.values());
    return manifestes
      .sort((a, b) => new Date(b.dateReception) - new Date(a.dateReception))
      .slice(0, limite);
  }

  obtenirDeclarations(limite = 10) {
    const declarations = Array.from(this.declarations.values());
    return declarations
      .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
      .slice(0, limite);
  }

  obtenirPaiements(limite = 10) {
    const paiements = Array.from(this.paiements.values());
    return paiements
      .sort((a, b) => new Date(b.datePaiement) - new Date(a.datePaiement))
      .slice(0, limite);
  }

  obtenirWorkflowsActifs() {
    return Array.from(this.workflowsActifs.values());
  }

  // === STATISTIQUES ===
  obtenirStatistiques() {
    const maintenant = new Date();
    const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    
    // Compter les opérations d'aujourd'hui
    const manifestesAujourdhui = Array.from(this.manifestesRecus.values())
      .filter(m => new Date(m.dateReception) >= aujourdhui).length;
    
    const declarationsAujourdhui = Array.from(this.declarations.values())
      .filter(d => new Date(d.dateCreation) >= aujourdhui).length;
    
    const paiementsAujourdhui = Array.from(this.paiements.values())
      .filter(p => new Date(p.datePaiement) >= aujourdhui).length;
    
    const workflowsEnCours = Array.from(this.workflowsActifs.values())
      .filter(w => w.statut === 'EN_COURS').length;

    return {
      ...this.statistiques,
      manifestesAujourdhui,
      declarationsAujourdhui,
      paiementsAujourdhui,
      workflowsEnCours,
      tauxAutomatisation: this.statistiques.declarationsCreees > 0 
        ? Math.round((this.statistiques.workflowsCompletes / this.statistiques.declarationsCreees) * 100)
        : 100,
      derniereMiseAJour: new Date()
    };
  }

  // === SIMULATION POUR DÉMONSTRATION ===
  simulerReceptionManifeste() {
    const manifesteTest = {
      manifeste: {
        numeroOrigine: `SIM${Date.now()}`,
        transporteur: 'SIMULATION CARRIER',
        portOrigine: 'ABIDJAN',
        dateArrivee: new Date().toISOString().split('T')[0],
        paysOrigine: 'CIV'
      },
      marchandises: [{
        position: 1,
        codeTarifaire: '8703.21.10',
        description: 'Véhicule simulation',
        poidsNet: 1500.00,
        quantite: 1,
        importateur: 'SIM IMPORT SARL',
        valeurEstimee: Math.floor(Math.random() * 5000000) + 1000000
      }]
    };

    return this.recevoirManifesteDepuisKit(manifesteTest);
  }

  // === MÉTHODES UTILITAIRES ===
  reinitialiser() {
    this.manifestesRecus.clear();
    this.declarations.clear();
    this.paiements.clear();
    this.interactionsKit = [];
    this.workflowsActifs.clear();
    
    this.statistiques = {
      manifestesRecus: 0,
      declarationsCreees: 0,
      paiementsEffectues: 0,
      notificationsKit: 0,
      workflowsCompletes: 0,
      erreurs: 0,
      derniereMiseAJour: new Date()
    };
    
    console.log('🔄 Base de données Pays B réinitialisée');
  }
  // === PAIEMENT MANUEL ===
effectuerPaiementManuel(donneesPaiement) {
  const paiementId = `PAY${Date.now()}`;
  
  const paiement = {
    id: paiementId,
    numeroDeclaration: donneesPaiement.numeroDeclaration,
    manifesteOrigine: donneesPaiement.manifesteOrigine,
    montantPaye: donneesPaiement.montantPaye,
    referencePaiement: paiementId,
    datePaiement: new Date(),
    paysDeclarant: 'BFA', // Burkina Faso
    modePaiement: donneesPaiement.modePaiement,
    statut: 'CONFIRME',
    modeEffectuation: 'MANUEL'
  };
  
  this.paiements.set(paiementId, paiement);
  this.statistiques.paiementsEffectues++;
  
  // Mettre à jour la déclaration correspondante
  const declarations = Array.from(this.declarations.values());
  const declaration = declarations.find(d => d.numeroDeclaration === donneesPaiement.numeroDeclaration);
  
  if (declaration) {
    declaration.statut = 'PAYEE';
    declaration.paiement = paiement;
  }
  
  console.log(`💳 [Pays B] Paiement manuel effectué: ${paiementId} - ${paiement.montantPaye} FCFA`);
  
  // Déclencher notification Kit si connecté
  this.notifierPaiementKit(paiement);
  
  return paiement;
}

// Méthode pour notifier le Kit (appelée automatiquement)
async notifierPaiementKit(paiement) {
  try {
    const kitClient = require('./kit-client');
    await kitClient.notifierPaiement(paiement);
    
    // Marquer la notification comme réussie
    paiement.notificationKit = {
      statut: 'ENVOYEE',
      dateEnvoi: new Date()
    };
    
    this.statistiques.notificationsKit++;
    
    this.ajouterInteractionKit('NOTIFICATION_PAIEMENT_MANUEL', {
      paiementId: paiement.id,
      numeroDeclaration: paiement.numeroDeclaration,
      montant: paiement.montantPaye
    });
    
  } catch (error) {
      console.error(`❌ [Pays B] Erreur notification Kit paiement manuel:`, error.message);
      
      paiement.notificationKit = {
        statut: 'ERREUR',
        erreur: error.message,
        dateErreur: new Date()
      };
      
      this.ajouterInteractionKit('NOTIFICATION_PAIEMENT_ERREUR', {
        paiementId: paiement.id,
        erreur: error.message
      });
    }
  }
}

// Instance singleton
const database = new PaysBDatabase();

module.exports = database;