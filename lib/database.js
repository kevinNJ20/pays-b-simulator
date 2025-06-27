// Simulation base de données en mémoire - Pays B (Destination)
class Database {
    constructor() {
      this.manifestesRecus = new Map();
      this.declarations = new Map();
      this.paiements = new Map();
      this.statistiques = {
        manifestesRecus: 0,
        declarationsCreees: 0,
        paiementsEffectues: 0,
        derniereMiseAJour: new Date()
      };
    }
  
    // Gestion des manifestes reçus
    recevoirManifeste(manifeste) {
      const id = manifeste.manifeste?.numeroOrigine || `REC${Date.now()}`;
      const manifesteRecu = {
        ...manifeste,
        id,
        dateReception: new Date(),
        statut: 'RECU'
      };
      
      this.manifestesRecus.set(id, manifesteRecu);
      this.statistiques.manifestesRecus++;
      
      console.log('📋 Manifeste reçu:', id);
      
      // Simulation automatique: créer une déclaration après 2 secondes
      setTimeout(() => {
        this.creerDeclarationAutomatique(manifesteRecu);
      }, 2000);
      
      return manifesteRecu;
    }
  
    // Création automatique d'une déclaration
    creerDeclarationAutomatique(manifesteRecu) {
      const numeroDeclaration = `DEC${Date.now()}`;
      const declaration = {
        id: numeroDeclaration,
        numeroDeclaration,
        manifesteOrigine: manifesteRecu.id,
        declarant: 'IMPORT AUTOMATIQUE SARL',
        typeDeclaration: 'MISE_A_LA_CONSOMMATION',
        marchandises: manifesteRecu.marchandises || [],
        dateCreation: new Date(),
        statut: 'DEPOSEE'
      };
      
      this.declarations.set(numeroDeclaration, declaration);
      this.statistiques.declarationsCreees++;
      
      console.log('📝 Déclaration créée automatiquement:', numeroDeclaration);
      
      // Simulation liquidation après 3 secondes
      setTimeout(() => {
        this.liquiderDeclaration(numeroDeclaration);
      }, 3000);
    }
  
    // Liquidation d'une déclaration
    liquiderDeclaration(numeroDeclaration) {
      const declaration = this.declarations.get(numeroDeclaration);
      if (!declaration) return;
      
      // Calcul simplifié des droits et taxes
      const montantTotal = this.calculerDroitsEtTaxes(declaration.marchandises);
      
      declaration.liquidation = {
        montantDroits: montantTotal * 0.6,
        montantTaxes: montantTotal * 0.4,
        montantTotal,
        dateLiquidation: new Date()
      };
      declaration.statut = 'LIQUIDEE';
      
      console.log('💰 Déclaration liquidée:', numeroDeclaration, montantTotal);
      
      // Simulation paiement après 5 secondes
      setTimeout(() => {
        this.effectuerPaiementAutomatique(numeroDeclaration);
      }, 5000);
    }
  
    // Calcul simplifié des droits et taxes
    calculerDroitsEtTaxes(marchandises) {
      let total = 0;
      marchandises?.forEach(marchandise => {
        // Calcul basé sur le poids (simulation)
        const valeurEstimee = (marchandise.poidsBrut || 1000) * 150; // 150 FCFA/kg
        const droits = valeurEstimee * 0.20; // 20% de droits
        const taxes = valeurEstimee * 0.18; // 18% de TVA
        total += droits + taxes;
      });
      return total || 250000; // Montant par défaut
    }
  
    // Paiement automatique
    async effectuerPaiementAutomatique(numeroDeclaration) {
      const declaration = this.declarations.get(numeroDeclaration);
      if (!declaration || !declaration.liquidation) return;
      
      const paiement = {
        id: `PAY${Date.now()}`,
        numeroDeclaration,
        manifesteOrigine: declaration.manifesteOrigine,
        montantPaye: declaration.liquidation.montantTotal,
        referencePaiement: `PAY${Date.now()}`,
        modePaiement: 'VIREMENT_BANCAIRE',
        datePaiement: new Date(),
        statut: 'CONFIRME'
      };
      
      this.paiements.set(paiement.id, paiement);
      this.statistiques.paiementsEffectues++;
      declaration.statut = 'PAYEE';
      
      console.log('💳 Paiement effectué:', paiement.referencePaiement);
      
      // Notification automatique vers le Kit
      this.notifierPaiementVersKit(paiement);
    }
  
    // Notification vers le Kit d'Interconnexion
    async notifierPaiementVersKit(paiement) {
      try {
        const kitClient = require('./kit-client');
        
        const notification = {
          numeroDeclaration: paiement.numeroDeclaration,
          manifesteOrigine: paiement.manifesteOrigine,
          montantPaye: paiement.montantPaye,
          referencePaiement: paiement.referencePaiement,
          datePaiement: paiement.datePaiement.toISOString(),
          paysDeclarant: 'BFA' // Burkina Faso par défaut
        };
        
        await kitClient.notifierPaiement(notification);
        paiement.notificationKit = { statut: 'ENVOYEE', date: new Date() };
        
      } catch (error) {
        console.error('❌ Erreur notification Kit:', error.message);
        paiement.notificationKit = { statut: 'ERREUR', erreur: error.message };
      }
    }
  
    // Accesseurs
    getManifestesRecus() {
      return Array.from(this.manifestesRecus.values());
    }
  
    getDeclarations() {
      return Array.from(this.declarations.values());
    }
  
    getPaiements() {
      return Array.from(this.paiements.values());
    }
  
    getStatistiques() {
      return {
        ...this.statistiques,
        derniereMiseAJour: new Date()
      };
    }
  }
  
  // Instance singleton
  const db = new Database();
  module.exports = db;