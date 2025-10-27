// ============================================================================
// BASE DE DONNÉES MALI (BAMAKO) - Pays de destination CORRIGÉE
// Workflow MANUEL selon rapport PDF UEMOA - ÉTAPES 6-16
// ============================================================================

class MaliDatabase {
  constructor() {
    // Base de données Mali - Bamako (Pays de destination)
    this.manifestesRecus = new Map();           // ÉTAPE 6
    this.documentsGUCE = new Map();            // ÉTAPE 7  
    this.declarationsCreees = new Map();       // ÉTAPE 8
    this.declarationsControlees = new Map();   // ÉTAPES 9-10
    this.declarationsEnregistrees = new Map(); // ÉTAPE 11
    this.liquidations = new Map();             // ÉTAPES 12-13
    this.paiements = new Map();                // ÉTAPE 14
    this.transmissionsKit = new Map();         // ÉTAPES 15-16
    
    // Déclarations transit (ÉTAPE 11)
    this.declarationsTransit = new Map();
    this.messagesArrivee = new Map();          // ÉTAPE 14 transit
    
    this.interactionsKit = [];
    
    this.statistiques = {
      // Workflow libre pratique Mali (ÉTAPES 6-16)
      manifestesRecus: 0,              // ÉTAPE 6
      documentsGUCECollectes: 0,       // ÉTAPE 7
      declarationsCreees: 0,           // ÉTAPE 8
      declarationsControlees: 0,       // ÉTAPES 9-10
      liquidationsEmises: 0,           // ÉTAPES 12-13
      paiementsEffectues: 0,           // ÉTAPE 14
      transmissionsKit: 0,             // ÉTAPES 15-16
      
      // Workflow transit Mali (ÉTAPES 11, 13-14)
      declarationsTransitRecues: 0,    // ÉTAPE 11
      arriveesMarchandises: 0,         // ÉTAPE 13
      messagesArriveeEnvoyes: 0,       // ÉTAPE 14
      
      erreurs: 0,
      derniereMiseAJour: new Date()
    };
    
    console.log('🇲🇱 [MALI] Base de données Bamako initialisée - Pays de destination');
    console.log('🇲🇱 [MALI] Workflow MANUEL - Étapes 6-16 (libre pratique) + 11,13-14 (transit)');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW LIBRE PRATIQUE MALI - ÉTAPES 6-16 (MANUEL)
  // ═══════════════════════════════════════════════════════════════════════════

  // ✅ ÉTAPE 6 : Réception manifeste depuis Kit MuleSoft
  recevoirManifesteDepuisKit(donneesManifeste) {
    const id = `MALI_REC_${Date.now()}`;
    
    const manifesteRecu = {
      id,
      ...donneesManifeste,
      dateReception: new Date(),
      statut: 'RECU_AU_MALI',           // ÉTAPE 6 terminée
      etapeWorkflow: 6,
      sourceKit: true,
      paysOrigine: 'SEN',
      paysDestination: 'MLI',
      
      // Métadonnées spécifiques Mali
      bureauDestination: 'BAMAKO_DOUANES',
      portDestination: 'Bamako',
      etapeSuivante: 'COLLECTE_DOCUMENTS_GUCE' // ÉTAPE 7
    };
    
    this.manifestesRecus.set(id, manifesteRecu);
    this.statistiques.manifestesRecus++;
    this.statistiques.derniereMiseAJour = new Date();
    
    console.log(`🇲🇱 [MALI] ÉTAPE 6 TERMINÉE : Manifeste ${id} reçu depuis Kit MuleSoft`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Collecte documents GUCE Mali (ÉTAPE 7)`);
    
    this.ajouterInteractionKit('MANIFESTE_RECU', {
      manifesteId: id,
      etape: 6,
      source: 'KIT_MULESOFT',
      numeroOrigine: donneesManifeste.manifeste?.numeroOrigine
    });
    
    return manifesteRecu;
  }

  // ✅ ÉTAPE 7 : Collecte documents GUCE Mali
  collecterDocumentsGUCE(manifesteId, documentsData) {
    const manifeste = this.manifestesRecus.get(manifesteId);
    if (!manifeste) {
      throw new Error(`Manifeste ${manifesteId} non trouvé au Mali`);
    }

    const id = `GUCE_${Date.now()}`;
    const documentsGUCE = {
      id,
      manifesteId,
      numeroManifesteOrigine: manifeste.manifeste?.numeroOrigine,
      
      // Documents collectés via GUCE Mali
      connaissement: documentsData.connaissement,
      factureCommerciale: documentsData.factureCommerciale,
      declarationPrealable: documentsData.declarationPrealable,
      documentsBancaires: documentsData.documentsBancaires || [],
      certificatsOrigine: documentsData.certificatsOrigine || [],
      
      dateCollecte: new Date(),
      statut: 'DOCUMENTS_COLLECTES',
      etapeWorkflow: 7,
      operateurEconomique: documentsData.operateurEconomique,
      declarantMalien: documentsData.declarantMalien
    };

    this.documentsGUCE.set(id, documentsGUCE);
    
    // Mettre à jour le manifeste
    manifeste.documentsGUCE = documentsGUCE;
    manifeste.statut = 'DOCUMENTS_GUCE_COLLECTES';
    manifeste.etapeWorkflow = 7;
    manifeste.etapeSuivante = 'CREATION_DECLARATION'; // ÉTAPE 8
    
    this.statistiques.documentsGUCECollectes++;
    
    console.log(`🇲🇱 [MALI] ÉTAPE 7 TERMINÉE : Documents GUCE collectés pour manifeste ${manifesteId}`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Création déclaration par déclarant malien (ÉTAPE 8)`);
    
    return documentsGUCE;
  }

  // ✅ ÉTAPE 8 : Création déclaration par déclarant malien
  creerDeclarationMalien(manifesteId, donneesDeclaration) {
    const manifeste = this.manifestesRecus.get(manifesteId);
    if (!manifeste || !manifeste.documentsGUCE) {
      throw new Error(`Manifeste ou documents GUCE non disponibles pour ${manifesteId}`);
    }

    const id = `DEC_MLI_${Date.now()}`;
    const declaration = {
      id,
      numeroDeclaration: id,
      manifesteId,
      manifesteOrigine: manifeste.manifeste?.numeroOrigine,
      
      // Informations déclarant malien
      declarantMalien: donneesDeclaration.declarantMalien,
      importateurMalien: donneesDeclaration.importateurMalien,
      bureauDouanesMali: 'BAMAKO_DOUANES',
      
      // Articles déclarés
      articles: donneesDeclaration.articles || [],
      valeurTotaleDeclaree: donneesDeclaration.valeurTotaleDeclaree || 0,
      
      dateCreation: new Date(),
      statut: 'DECLARATION_CREEE',
      etapeWorkflow: 8,
      
      // Références
      documentsGUCE: manifeste.documentsGUCE,
      manifesteSource: manifeste
    };

    this.declarationsCreees.set(id, declaration);
    
    // Mettre à jour le manifeste
    manifeste.declaration = declaration;
    manifeste.statut = 'DECLARATION_CREEE_MALI';
    manifeste.etapeWorkflow = 8;
    manifeste.etapeSuivante = 'CONTROLES_RECEVABILITE'; // ÉTAPES 9-10
    
    this.statistiques.declarationsCreees++;
    
    console.log(`🇲🇱 [MALI] ÉTAPE 8 TERMINÉE : Déclaration ${id} créée par déclarant malien`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Contrôles de recevabilité + Calcul devis (ÉTAPES 9-10)`);
    
    return declaration;
  }

  // ✅ ÉTAPES 9-10 : Contrôles de recevabilité + Calcul devis
  controlerEtCalculerDevis(declarationId, donneesControle) {
    const declaration = this.declarationsCreees.get(declarationId);
    if (!declaration) {
      throw new Error(`Déclaration ${declarationId} non trouvée au Mali`);
    }

    // ÉTAPE 9 : Contrôles de recevabilité
    const controles = {
      conformiteDocuments: donneesControle.conformiteDocuments || true,
      coherenceValeurs: donneesControle.coherenceValeurs || true,
      validiteOrigine: donneesControle.validiteOrigine || true,
      statusControle: 'RECEVABLE',
      agentControleur: donneesControle.agentControleur,
      observationsControle: donneesControle.observationsControle || ''
    };

    // ÉTAPE 10 : Calcul du devis (pré-liquidation)
    let montantTotalDevis = 0;
    const detailDevis = declaration.articles.map(article => {
      const valeurCaf = parseFloat(article.valeurCaf || 0);
      const droitDouane = valeurCaf * 0.15;     // 15% droit de douane
      const tva = valeurCaf * 0.18;             // 18% TVA
      const redevanceStatistique = valeurCaf * 0.01; // 1% redevance
      const totalArticle = droitDouane + tva + redevanceStatistique;
      
      montantTotalDevis += totalArticle;
      
      return {
        article: article.designation,
        valeurCaf,
        droitDouane,
        tva,
        redevanceStatistique,
        totalArticle
      };
    });

    const devis = {
      detailCalcul: detailDevis,
      montantTotal: Math.round(montantTotalDevis),
      devise: 'FCFA',
      dateCalcul: new Date(),
      methodeCalcul: 'PRE_LIQUIDATION_MALI',
      agentLiquidateur: donneesControle.agentLiquidateur
    };

    // Enregistrer contrôles + devis
    const controleComplete = {
      id: `CTRL_${Date.now()}`,
      declarationId,
      controles,
      devis,
      dateTraitement: new Date(),
      statut: 'CONTROLES_TERMINES',
      etapeWorkflow: 10
    };

    this.declarationsControlees.set(declarationId, controleComplete);
    
    // Mettre à jour déclaration
    declaration.controles = controles;
    declaration.devis = devis;
    declaration.statut = 'CONTROLEE_ET_DEVIS_CALCULE';
    declaration.etapeWorkflow = 10;
    declaration.etapeSuivante = 'ENREGISTREMENT_DECLARATION'; // ÉTAPE 11
    
    this.statistiques.declarationsControlees++;
    
    console.log(`🇲🇱 [MALI] ÉTAPES 9-10 TERMINÉES : Contrôles + Devis ${Math.round(montantTotalDevis)} FCFA`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Enregistrement déclaration détaillée (ÉTAPE 11)`);
    
    return controleComplete;
  }

  // ✅ ÉTAPE 11 : Enregistrement déclaration détaillée
  enregistrerDeclarationDetaillee(declarationId, donneesEnregistrement) {
    const declaration = this.declarationsCreees.get(declarationId);
    const controle = this.declarationsControlees.get(declarationId);
    
    if (!declaration || !controle) {
      throw new Error(`Déclaration ou contrôle manquant pour ${declarationId}`);
    }

    const enregistrement = {
      id: `ENR_${Date.now()}`,
      declarationId,
      numeroEnregistrement: `MLI_${Date.now()}`,
      bureauEnregistrement: 'BAMAKO_DOUANES',
      agentEnregistrement: donneesEnregistrement.agentEnregistrement,
      dateEnregistrement: new Date(),
      statut: 'DECLARATION_ENREGISTREE',
      etapeWorkflow: 11,
      referenceBulletin: `BUL_MLI_${Date.now()}`
    };

    this.declarationsEnregistrees.set(declarationId, enregistrement);
    
    // Mettre à jour déclaration
    declaration.enregistrement = enregistrement;
    declaration.statut = 'ENREGISTREE_MALI';
    declaration.etapeWorkflow = 11;
    declaration.etapeSuivante = 'CONTROLES_DOUANIERS'; // ÉTAPES 12-13
    
    console.log(`🇲🇱 [MALI] ÉTAPE 11 TERMINÉE : Déclaration ${declarationId} enregistrée`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Contrôles douaniers + Liquidation (ÉTAPES 12-13)`);
    
    return enregistrement;
  }

  // ✅ ÉTAPES 12-13 : Contrôles douaniers + Émission bulletin liquidation
  effectuerControlesEtLiquidation(declarationId, donneesControleDouanier) {
    const declaration = this.declarationsCreees.get(declarationId);
    if (!declaration) {
      throw new Error(`Déclaration ${declarationId} non trouvée`);
    }

    // ÉTAPE 12 : Contrôles douaniers
    const controleDouanier = {
      typeControle: donneesControleDouanier.typeControle || 'DOCUMENTAIRE',
      resultatControle: donneesControleDouanier.resultatControle || 'CONFORME',
      agentControleur: donneesControleDouanier.agentControleur,
      observationsControle: donneesControleDouanier.observationsControle || '',
      dateControle: new Date()
    };

    // ÉTAPE 13 : Émission bulletin de liquidation
    const liquidation = {
      id: `LIQ_MLI_${Date.now()}`,
      declarationId,
      numeroBulletin: `BL_MLI_${Date.now()}`,
      
      // Reprise du devis calculé étape 10
      montantTotal: declaration.devis?.montantTotal || 0,
      detailTaxes: declaration.devis?.detailCalcul || [],
      devise: 'FCFA',
      
      // Informations liquidation
      bureauLiquidation: 'BAMAKO_DOUANES',
      agentLiquidateur: donneesControleDouanier.agentLiquidateur,
      dateLiquidation: new Date(),
      
      controleDouanier,
      statut: 'BULLETIN_EMIS',
      etapeWorkflow: 13
    };

    this.liquidations.set(declarationId, liquidation);
    
    // Mettre à jour déclaration
    declaration.controleDouanier = controleDouanier;
    declaration.liquidation = liquidation;
    declaration.statut = 'LIQUIDEE_MALI';
    declaration.etapeWorkflow = 13;
    declaration.etapeSuivante = 'PAIEMENT_DROITS_TAXES'; // ÉTAPE 14
    
    this.statistiques.liquidationsEmises++;
    
    console.log(`🇲🇱 [MALI] ÉTAPES 12-13 TERMINÉES : Liquidation ${liquidation.montantTotal} FCFA`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Paiement droits et taxes (ÉTAPE 14)`);
    
    return liquidation;
  }

  // ✅ ÉTAPE 14 : Paiement droits et taxes
  enregistrerPaiement(declarationId, donneesPaiement) {
    const declaration = this.declarationsCreees.get(declarationId);
    const liquidation = this.liquidations.get(declarationId);
    
    if (!declaration || !liquidation) {
      throw new Error(`Déclaration ou liquidation manquante pour ${declarationId}`);
    }

    const paiement = {
      id: `PAY_MLI_${Date.now()}`,
      declarationId,
      referencePaiement: donneesPaiement.referencePaiement,
      
      montantPaye: liquidation.montantTotal,
      modePaiement: donneesPaiement.modePaiement || 'VIREMENT_BCEAO',
      compteDestination: 'TRESOR_MALI_BCEAO',
      
      datePaiement: new Date(),
      statutPaiement: 'CONFIRME',
      etapeWorkflow: 14,
      
      // Informations BCEAO/Trésor
      referenceBCEAO: `BCEAO_MLI_${Date.now()}`,
      compteTresor: donneesPaiement.compteTresor || 'TRESOR_MALI_001'
    };

    this.paiements.set(declarationId, paiement);
    
    // Mettre à jour déclaration
    declaration.paiement = paiement;
    declaration.statut = 'PAYEE_MALI';
    declaration.etapeWorkflow = 14;
    declaration.etapeSuivante = 'TRANSMISSION_KIT'; // ÉTAPES 15-16
    
    this.statistiques.paiementsEffectues++;
    
    console.log(`🇲🇱 [MALI] ÉTAPE 14 TERMINÉE : Paiement ${paiement.montantPaye} FCFA confirmé`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Transmission données vers Kit (ÉTAPES 15-16)`);
    
    return paiement;
  }

  // ✅ ÉTAPES 15-16 : Confirmation paiement + Transmission Kit MuleSoft  
  transmettreVersKit(declarationId) {
    const declaration = this.declarationsCreees.get(declarationId);
    const paiement = this.paiements.get(declarationId);
    
    if (!declaration || !paiement) {
      throw new Error(`Données manquantes pour transmission Kit : ${declarationId}`);
    }

    const transmission = {
      id: `TRANS_MLI_${Date.now()}`,
      declarationId,
      
      // Données à transmettre vers Kit MuleSoft (ÉTAPE 16)
      numeroDeclaration: declaration.numeroDeclaration,
      manifesteOrigine: declaration.manifesteOrigine,
      montantPaye: paiement.montantPaye,
      referencePaiement: paiement.referencePaiement,
      datePaiement: paiement.datePaiement,
      paysDeclarant: 'MLI',
      
      // Informations autorisation mainlevée pour Sénégal
      autorisationMainlevee: {
        autorise: true,
        numeroManifeste: declaration.manifesteOrigine,
        montantAcquitte: paiement.montantPaye,
        dateAutorisation: new Date(),
        bureauAutorisation: 'BAMAKO_DOUANES',
        referenceAutorisation: `AUTH_MLI_${Date.now()}`
      },
      
      dateTransmission: new Date(),
      destinationKit: 'SENEGAL_VIA_KIT-INTERCONNEXION',
      statut: 'PRET_TRANSMISSION',
      etapeWorkflow: 16
    };

    this.transmissionsKit.set(declarationId, transmission);
    
    // Mettre à jour déclaration - WORKFLOW MALI TERMINÉ
    declaration.transmission = transmission;
    declaration.statut = 'TRANSMIS_VERS_KIT';
    declaration.etapeWorkflow = 16;
    declaration.workflowMaliTermine = true;
    
    this.statistiques.transmissionsKit++;
    
    console.log(`🇲🇱 [MALI] ÉTAPES 15-16 TERMINÉES : Transmission vers Kit MuleSoft`);
    console.log(`🇲🇱 [MALI] 🎉 WORKFLOW MALI TERMINÉ - Autorisation mainlevée → Sénégal`);
    
    this.ajouterInteractionKit('TRANSMISSION_AUTORISATION', {
      declarationId,
      etapes: '15-16',
      destination: 'SENEGAL_VIA_KIT',
      montantAcquitte: paiement.montantPaye
    });
    
    return transmission;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW TRANSIT MALI - ÉTAPES 11, 13-14
  // ═══════════════════════════════════════════════════════════════════════════

  // ✅ ÉTAPE 11 : Réception déclaration transit
  recevoirDeclarationTransit(donneesTransit) {
    const id = `TRANS_MLI_${Date.now()}`;
    
    const declarationTransit = {
      id,
      numeroDeclarationTransit: donneesTransit.numeroDeclaration,
      paysDepart: donneesTransit.paysDepart || 'SEN',
      paysDestination: 'MLI',
      
      // Informations marchandise
      transporteur: donneesTransit.transporteur,
      modeTransport: donneesTransit.modeTransport,
      itineraire: donneesTransit.itineraire,
      delaiRoute: donneesTransit.delaiRoute,
      marchandises: donneesTransit.marchandises || [],
      
      dateReception: new Date(),
      statut: 'TRANSIT_RECU_MALI',
      etapeWorkflow: 11,
      sourceKit: true,
      
      // Attente arrivée marchandises
      attenduLe: donneesTransit.dateArriveePrevu,
      bureauDestination: 'BAMAKO_DOUANES'
    };
    
    this.declarationsTransit.set(id, declarationTransit);
    this.statistiques.declarationsTransitRecues++;
    
    console.log(`🇲🇱 [MALI] ÉTAPE 11 TERMINÉE : Déclaration transit ${id} reçue`);
    console.log(`🇲🇱 [MALI] ➤ ATTENTE : Arrivée marchandises au bureau Mali (ÉTAPE 13)`);
    
    return declarationTransit;
  }

  // ✅ ÉTAPE 13 : Arrivée marchandises au bureau Mali
  enregistrerArriveeMarchandises(transitId, donneesArrivee) {
    const transit = this.declarationsTransit.get(transitId);
    if (!transit) {
      throw new Error(`Déclaration transit ${transitId} non trouvée au Mali`);
    }

    const arrivee = {
      id: `ARR_MLI_${Date.now()}`,
      transitId,
      bureauArrivee: 'BAMAKO_DOUANES',
      dateArrivee: new Date(),
      
      // Contrôles arrivée
      controleEffectue: donneesArrivee.controleEffectue || true,
      visaAppose: donneesArrivee.visaAppose || true,
      conformiteItineraire: donneesArrivee.conformiteItineraire || true,
      delaiRespecte: donneesArrivee.delaiRespecte || true,
      
      // Déclaration détail optionnelle
      declarationDetailDeposee: donneesArrivee.declarationDetailDeposee || false,
      
      agentReceptionnaire: donneesArrivee.agentReceptionnaire,
      observationsArrivee: donneesArrivee.observationsArrivee || '',
      
      statut: 'ARRIVE_AU_MALI',
      etapeWorkflow: 13
    };

    // Mettre à jour transit
    transit.arrivee = arrivee;
    transit.statut = 'MARCHANDISES_ARRIVEES';
    transit.etapeWorkflow = 13;
    transit.etapeSuivante = 'MESSAGE_ARRIVEE_VERS_KIT'; // ÉTAPE 14
    
    this.statistiques.arriveesMarchandises++;
    
    console.log(`🇲🇱 [MALI] ÉTAPE 13 TERMINÉE : Marchandises arrivées à Bamako`);
    console.log(`🇲🇱 [MALI] ➤ PROCHAINE ÉTAPE : Message arrivée vers Kit (ÉTAPE 14)`);
    
    return arrivee;
  }

  // ✅ ÉTAPE 14 : Message arrivée vers Kit MuleSoft
  envoyerMessageArrivee(transitId) {
    const transit = this.declarationsTransit.get(transitId);
    if (!transit || !transit.arrivee) {
      throw new Error(`Transit ou arrivée manquante pour ${transitId}`);
    }

    const messageArrivee = {
      id: `MSG_ARR_${Date.now()}`,
      transitId,
      numeroDeclarationTransit: transit.numeroDeclarationTransit,
      
      // Données message arrivée
      bureauArrivee: transit.arrivee.bureauArrivee,
      dateArrivee: transit.arrivee.dateArrivee,
      controleEffectue: transit.arrivee.controleEffectue,
      visaAppose: transit.arrivee.visaAppose,
      conformiteItineraire: transit.arrivee.conformiteItineraire,
      delaiRespecte: transit.arrivee.delaiRespecte,
      declarationDetailDeposee: transit.arrivee.declarationDetailDeposee,
      
      // Transmission
      dateEnvoi: new Date(),
      destinationKit: 'SENEGAL_VIA_KIT-INTERCONNEXION',
      statut: 'MESSAGE_ENVOYE',
      etapeWorkflow: 14
    };

    this.messagesArrivee.set(transitId, messageArrivee);
    
    // Mettre à jour transit - WORKFLOW TRANSIT MALI TERMINÉ
    transit.messageArrivee = messageArrivee;
    transit.statut = 'MESSAGE_ARRIVEE_ENVOYE';
    transit.etapeWorkflow = 14;
    transit.workflowTransitMaliTermine = true;
    
    this.statistiques.messagesArriveeEnvoyes++;
    
    console.log(`🇲🇱 [MALI] ÉTAPE 14 TERMINÉE : Message arrivée envoyé vers Kit`);
    console.log(`🇲🇱 [MALI] 🎉 WORKFLOW TRANSIT MALI TERMINÉ - Confirmation → Sénégal`);
    
    this.ajouterInteractionKit('MESSAGE_ARRIVEE_TRANSIT', {
      transitId,
      etape: 14,
      destination: 'SENEGAL_VIA_KIT',
      bureauArrivee: 'BAMAKO_DOUANES'
    });
    
    return messageArrivee;
  }

  // ✅ ÉTAPE 8 : Dépôt déclaration détaillée transit
deposerDeclarationDetailTransit(transitId, donneesDeclaration) {
  const transit = this.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  const declarationDetaillee = {
    id: `DET_${Date.now()}`,
    transitId,
    numeroDeclarationDetail: donneesDeclaration.numeroDeclarationDetail,
    numeroTransitOrigine: transit.numeroDeclarationTransit,
    
    // Déclarant et importateur
    declarantMalien: donneesDeclaration.declarantMalien,
    importateurDestination: donneesDeclaration.importateurDestination,
    
    // Marchandises détaillées
    marchandisesDetaillees: donneesDeclaration.marchandisesDetaillees || [],
    
    // Documents joints
    documentsJoints: donneesDeclaration.documentsJoints || {},
    
    // Agent
    agentDepot: donneesDeclaration.agentDepot,
    dateDepot: new Date().toISOString(),
    statut: 'DEPOSEE',
    etapeWorkflow: 8
  };

  // Mettre à jour le transit
  transit.declarationDetaillee = declarationDetaillee;
  transit.statut = 'DECLARATION_DETAILLEE_DEPOSEE';
  transit.etapeWorkflow = 8;
  transit.etapeSuivante = 'VISA_DOUANIER';

  console.log(`🇲🇱 [MALI] ÉTAPE 8 TRANSIT TERMINÉE: Déclaration détaillée ${declarationDetaillee.id} déposée`);

  return declarationDetaillee;
}

// ✅ ÉTAPE 9 : Apposition visa douanier
apposerVisaTransit(transitId, donneesVisa) {
  const transit = this.declarationsTransit.get(transitId);
  if (!transit || !transit.declarationDetaillee) {
    throw new Error('Déclaration détaillée requise avant visa');
  }

  const visaDouanier = {
    id: `VISA_${Date.now()}`,
    transitId,
    numeroVisa: donneesVisa.numeroVisa,
    agentDouanier: donneesVisa.agentDouanier,
    bureauDouane: donneesVisa.bureauDouane || 'BAMAKO_TRANSIT',
    
    // Contrôles effectués
    controles: donneesVisa.controles || {},
    
    // Décision
    decisionVisa: donneesVisa.decisionVisa,
    observations: donneesVisa.observations || '',
    exigences: donneesVisa.exigences || [],
    
    dateVisa: donneesVisa.dateVisa || new Date().toISOString(),
    statut: 'APPOSE',
    etapeWorkflow: 9
  };

  // Mettre à jour le transit
  transit.visaDouanier = visaDouanier;
  transit.statut = 'VISA_APPOSE';
  transit.etapeWorkflow = 9;
  transit.etapeSuivante = 'VERIFICATIONS_FINALES';

  console.log(`🇲🇱 [MALI] ÉTAPE 9 TRANSIT TERMINÉE: Visa ${visaDouanier.numeroVisa} apposé`);

  return visaDouanier;
}

// ✅ ÉTAPE 10 : Vérifications finales
effectuerVerificationsFinalesTransit(transitId, donneesVerifications) {
  const transit = this.declarationsTransit.get(transitId);
  if (!transit || !transit.visaDouanier) {
    throw new Error('Visa douanier requis avant vérifications');
  }

  const verifications = {
    id: `VERIF_${Date.now()}`,
    transitId,
    agentVerificateur: donneesVerifications.agentVerificateur,
    
    // Types de vérifications
    verificationDocumentaire: donneesVerifications.verificationDocumentaire || {},
    verificationReglementaire: donneesVerifications.verificationReglementaire || {},
    verificationFinale: donneesVerifications.verificationFinale || {},
    
    dateVerification: donneesVerifications.dateVerification || new Date().toISOString(),
    observations: donneesVerifications.observations || '',
    statut: 'VERIFICATIONS_OK',
    etapeWorkflow: 10
  };

  // Mettre à jour le transit
  transit.verifications = verifications;
  transit.statut = 'VERIFICATIONS_EFFECTUEES';
  transit.etapeWorkflow = 10;
  transit.etapeSuivante = 'CONTROLES_PHYSIQUES_OU_ARRIVEE';

  console.log(`🇲🇱 [MALI] ÉTAPE 10 TRANSIT TERMINÉE: Vérifications ${verifications.id} effectuées`);

  return verifications;
}

// ✅ ÉTAPE 12 : Contrôles physiques (optionnel)
effectuerControlesPhysiquesTransit(transitId, donneesControles) {
  const transit = this.declarationsTransit.get(transitId);
  if (!transit) {
    throw new Error(`Transit ${transitId} non trouvé`);
  }

  const controles = {
    id: `CTRL_${Date.now()}`,
    transitId,
    agentControleur: donneesControles.agentControleur,
    typeControle: donneesControles.typeControle,
    
    // Contrôles effectués
    controlesColis: donneesControles.controlesColis || {},
    controlesMarchandises: donneesControles.controlesMarchandises || {},
    
    resultatControle: donneesControles.resultatControle,
    observations: donneesControles.observations || '',
    dateControle: donneesControles.dateControle || new Date().toISOString(),
    statut: 'CONTROLE_EFFECTUE',
    etapeWorkflow: 12
  };

  // Mettre à jour le transit
  transit.controlesPhysiques = controles;
  transit.statut = 'CONTROLES_PHYSIQUES_EFFECTUES';
  transit.etapeWorkflow = 12;
  transit.etapeSuivante = 'CONFIRMATION_ARRIVEE';

  console.log(`🇲🇱 [MALI] ÉTAPE 12 TRANSIT TERMINÉE: Contrôles physiques ${controles.id} effectués`);

  return controles;
}

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTHODES UTILITAIRES MALI
  // ═══════════════════════════════════════════════════════════════════════════

  ajouterInteractionKit(type, donnees) {
    const interaction = {
      id: `INT_MLI_${Date.now()}`,
      type,
      timestamp: new Date(),
      donnees: {
        ...donnees,
        paysMali: 'MLI',
        villeMali: 'Bamako'
      }
    };

    this.interactionsKit.unshift(interaction);
    
    // Garder seulement les 100 dernières interactions
    if (this.interactionsKit.length > 100) {
      this.interactionsKit = this.interactionsKit.slice(0, 100);
    }

    return interaction;
  }

  // Accesseurs de données
  obtenirManifestesRecus(limite = 10) {
    const manifestes = Array.from(this.manifestesRecus.values());
    return manifestes
      .sort((a, b) => new Date(b.dateReception) - new Date(a.dateReception))
      .slice(0, limite);
  }

  obtenirDeclarations(limite = 10) {
    const declarations = Array.from(this.declarationsCreees.values());
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
    // Le Mali utilise un workflow MANUEL, pas d'état "workflow actif" automatique
    // On retourne les manifestes en cours de traitement
    const manifestesEnCours = Array.from(this.manifestesRecus.values())
      .filter(m => m.statut !== 'TRANSMIS_VERS_KIT' && m.statut !== 'WORKFLOW_MALI_TERMINE');
    
    return manifestesEnCours.map(manifeste => ({
      id: manifeste.id,
      manifesteId: manifeste.id,
      type: 'LIBRE_PRATIQUE',
      statut: manifeste.workflowMaliTermine ? 'COMPLETE' : 'EN_COURS',
      etapeActuelle: this.determinerEtapeActuelle(manifeste.etapeWorkflow),
      dateDebut: manifeste.dateReception,
      dateFin: manifeste.workflowMaliTermine ? manifeste.transmission?.dateTransmission : null,
      etapes: this.construireEtapesMali(manifeste)
    }));
  }
  
  determinerEtapeActuelle(etapeWorkflow) {
    const etapes = {
      6: 'RECEPTION',
      7: 'COLLECTE_GUCE',
      8: 'CREATION_DECLARATION',
      10: 'CONTROLES_DEVIS',
      11: 'ENREGISTREMENT',
      13: 'LIQUIDATION',
      14: 'PAIEMENT',
      16: 'TRANSMISSION_KIT'
    };
    return etapes[etapeWorkflow] || 'RECEPTION';
  }
  
  construireEtapesMali(manifeste) {
    const etapes = [
      { nom: 'RECEPTION', statut: manifeste.etapeWorkflow >= 6 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.etapeWorkflow >= 6 ? manifeste.dateReception : null },
      { nom: 'COLLECTE_GUCE', statut: manifeste.etapeWorkflow >= 7 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.documentsGUCE?.dateCollecte },
      { nom: 'CREATION_DECLARATION', statut: manifeste.etapeWorkflow >= 8 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.declaration?.dateCreation },
      { nom: 'CONTROLES_DEVIS', statut: manifeste.etapeWorkflow >= 10 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.declaration?.controles?.dateTraitement },
      { nom: 'ENREGISTREMENT', statut: manifeste.etapeWorkflow >= 11 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.declaration?.enregistrement?.dateEnregistrement },
      { nom: 'LIQUIDATION', statut: manifeste.etapeWorkflow >= 13 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.declaration?.liquidation?.dateLiquidation },
      { nom: 'PAIEMENT', statut: manifeste.etapeWorkflow >= 14 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.declaration?.paiement?.datePaiement },
      { nom: 'TRANSMISSION_KIT', statut: manifeste.etapeWorkflow >= 16 ? 'COMPLETE' : 'EN_ATTENTE', dateCompletee: manifeste.transmission?.dateTransmission }
    ];
    return etapes;
  }

  obtenirInteractionsKit(limite = 20) {
    return this.interactionsKit.slice(0, limite);
  }

  // Statistiques Mali
  obtenirStatistiques() {
    const maintenant = new Date();
    const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    
    // Compter les opérations d'aujourd'hui
    const manifestesAujourdhui = Array.from(this.manifestesRecus.values())
      .filter(m => new Date(m.dateReception) >= aujourdhui).length;
    
    const declarationsAujourdhui = Array.from(this.declarationsCreees.values())
      .filter(d => new Date(d.dateCreation) >= aujourdhui).length;
    
    const paiementsAujourdhui = Array.from(this.paiements.values())
      .filter(p => new Date(p.datePaiement) >= aujourdhui).length;

    return {
      ...this.statistiques,
      manifestesAujourdhui,
      declarationsAujourdhui,
      paiementsAujourdhui,
      
      // Taux de progression workflow Mali
      tauxProgressionWorkflow: this.statistiques.manifestesRecus > 0 
        ? Math.round((this.statistiques.transmissionsKit / this.statistiques.manifestesRecus) * 100)
        : 0,
        
      workflow: {
        etapes_6_reception: this.statistiques.manifestesRecus,
        etapes_7_guce: this.statistiques.documentsGUCECollectes,
        etapes_8_declaration: this.statistiques.declarationsCreees,
        etapes_9_10_controles: this.statistiques.declarationsControlees,
        etapes_11_enregistrement: Array.from(this.declarationsEnregistrees.values()).length,
        etapes_12_13_liquidation: this.statistiques.liquidationsEmises,
        etapes_14_paiement: this.statistiques.paiementsEffectues,
        etapes_15_16_transmission: this.statistiques.transmissionsKit
      },
      
      derniereMiseAJour: new Date()
    };
  }

  // Simuler des données test Mali
  simulerReceptionManifesteTest() {
    const manifesteTest = {
      manifeste: {
        numeroOrigine: `SEN_${Date.now()}`,
        transporteur: 'SIMULATION DAKAR-BAMAKO',
        navire: 'SIMULATION VESSEL',
        portOrigine: 'Port de Dakar',
        dateArrivee: new Date().toISOString().split('T')[0],
        paysOrigine: 'SEN'
      },
      marchandises: [{
        position: 1,
        codeTarifaire: '8703.21.10',
        description: 'Véhicule simulation Mali',
        poidsNet: 1500.00,
        quantite: 1,
        importateur: 'SIMULATION IMPORT BAMAKO',
        destinataire: 'IMPORTATEUR MALIEN SARL',
        valeurEstimee: Math.floor(Math.random() * 5000000) + 1000000
      }],
      formatOrigine: 'SIMULATION'
    };

    return this.recevoirManifesteDepuisKit(manifesteTest);
  }

  // Réinitialisation
  reinitialiser() {
    this.manifestesRecus.clear();
    this.documentsGUCE.clear();
    this.declarationsCreees.clear();
    this.declarationsControlees.clear();
    this.declarationsEnregistrees.clear();
    this.liquidations.clear();
    this.paiements.clear();
    this.transmissionsKit.clear();
    this.declarationsTransit.clear();
    this.messagesArrivee.clear();
    this.interactionsKit = [];
    
    this.statistiques = {
      manifestesRecus: 0,
      documentsGUCECollectes: 0,
      declarationsCreees: 0,
      declarationsControlees: 0,
      liquidationsEmises: 0,
      paiementsEffectues: 0,
      transmissionsKit: 0,
      declarationsTransitRecues: 0,
      arriveesMarchandises: 0,
      messagesArriveeEnvoyes: 0,
      erreurs: 0,
      derniereMiseAJour: new Date()
    };
    
    console.log('🔄 Base de données Mali réinitialisée - Workflow manuel conservé');
  }
}

// Instance singleton Mali
const database = new MaliDatabase();

module.exports = database;