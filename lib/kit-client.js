// ============================================================================
// MALI - Client Kit d'Interconnexion MuleSoft CORRIGÉ
// Bamako - Pays de destination (Pays B selon rapport PDF UEMOA)
// Compatible workflow libre pratique ÉTAPES 6-16 + Transit 11,13-14
// ============================================================================

const axios = require('axios');

class KitInterconnexionClientMali {
  constructor() {
    // ✅ CORRECTION: Configuration spécifique Mali (Pays B destination)
    this.baseURL = process.env.KIT_MULESOFT_URL || 'http://localhost:8080/api/v1';
    this.timeout = 30000; // 30 secondes
    this.paysCode = 'MLI'; // ✅ Mali
    this.paysNom = 'Mali';
    this.paysRole = 'PAYS_DESTINATION'; // ✅ Pays B selon rapport PDF
    this.paysType = 'HINTERLAND'; // ✅ Pays de l'hinterland
    this.villePrincipale = 'Bamako';
    this.systemeName = 'MALI_DOUANES_BAMAKO';
    
    // Configuration Axios avec retry automatique
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mali-Douanes/1.0',
        'X-Source-Country': this.paysCode,
        'X-Source-System': this.systemeName,
        'X-Destination-Role': this.paysRole
      }
    });

    this.setupInterceptors();
    console.log(`🇲🇱 Client Kit Mali initialisé - ${this.paysRole} (${this.paysType})`);
    console.log(`🇲🇱 URL Kit MuleSoft: ${this.baseURL}`);
    console.log(`🇲🇱 Workflow Mali: Étapes 6-16 (libre pratique) + 11,13-14 (transit)`);
  }

  setupInterceptors() {
    // Intercepteur pour ajouter headers et logging Mali
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        config.headers['X-Correlation-ID'] = `${this.paysCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`📤 [MALI] Envoi vers Kit MuleSoft: ${config.method?.toUpperCase()} ${config.url}`);
        console.log(`📍 [MALI] Depuis: ${this.villePrincipale} - Role: ${this.paysRole}`);
        return config;
      },
      (error) => {
        console.error(`❌ [MALI] Erreur requête Kit:`, error.message);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour logging des réponses et retry
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        console.log(`📥 [MALI] Réponse Kit MuleSoft: ${response.status} (${duration}ms)`);
        
        response.metadata = {
          duration,
          timestamp: new Date(),
          correlationId: response.config.headers['X-Correlation-ID'],
          paysSource: this.paysCode
        };
        
        return response;
      },
      async (error) => {
        const config = error.config;
        const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
        
        console.error(`❌ [MALI] Erreur Kit MuleSoft (${duration}ms):`, {
          status: error.response?.status,
          message: error.message,
          url: config?.url,
          paysSource: this.paysCode
        });

        // Retry automatique pour certaines erreurs
        if (this.shouldRetry(error) && !config._retryAttempted) {
          config._retryAttempted = true;
          console.log(`🔄 [MALI] Tentative de retry vers Kit MuleSoft...`);
          
          await this.wait(2000);
          return this.client.request(config);
        }

        return Promise.reject(error);
      }
    );
  }

  shouldRetry(error) {
    return !error.response || 
           error.response.status >= 500 || 
           error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT';
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW LIBRE PRATIQUE MALI - ÉTAPES 14-16
  // Soumission déclaration et paiement vers Kit MuleSoft
  // ═══════════════════════════════════════════════════════════════════════════

  async soumettreDeclarationMali(declaration) {
    try {
      console.log(`📋 [MALI] ÉTAPES 14-16: Soumission déclaration Mali vers Kit MuleSoft`);
      console.log(`📋 [MALI] Déclaration: ${declaration.numeroDeclaration || declaration.numeroDecl}`);
      
      // ✅ Validation données Mali spécifiques
      if (!declaration.numeroDeclaration && !declaration.numeroDecl) {
        throw new Error('Numéro déclaration Mali requis');
      }

      if (!declaration.manifesteOrigine) {
        throw new Error('Référence manifeste origine (Sénégal) requise');
      }

      if (!declaration.montantPaye && !declaration.liquidation) {
        throw new Error('Montant payé ou liquidation requis (Mali)');
      }

      // Préparer les données pour le Kit au format UEMOA
      const declarationKit = {
        // ✅ Informations Mali (Pays B de destination)
        numeroDeclaration: declaration.numeroDeclaration || declaration.numeroDecl,
        manifesteOrigine: declaration.manifesteOrigine,
        paysDeclarant: 'MLI',
        bureauDecl: declaration.bureauDecl || '10S_BAMAKO',
        
        // Informations déclaration Mali
        anneeDecl: declaration.anneeDecl || new Date().getFullYear().toString(),
        dateDecl: declaration.dateDecl || new Date().toISOString().split('T')[0],
        
        // Informations paiement (ÉTAPE 14)
        montantPaye: declaration.montantPaye || declaration.liquidation,
        referencePaiement: declaration.referencePaiement,
        datePaiement: declaration.datePaiement || new Date().toISOString(),
        modePaiement: declaration.modePaiement || 'VIREMENT_BCEAO',
        
        // Articles déclarés au Mali
        articles: (declaration.articles || []).map(article => ({
          numArt: article.numArt || article.numero || 1,
          connaissement: article.connaissement,
          modeCond: article.modeCond || 'COLIS',
          codeSh: article.codeSh || article.codeTarifaire,
          libelleTarif: article.libelleTarif,
          designationCom: article.designationCom || article.designation,
          origine: article.origine || 'SEN',
          nbreColis: article.nbreColis || article.nombreColis || 1,
          poidsBrut: article.poidsBrut || article.poids || 0,
          poidsNet: article.poidsNet || article.poids || 0,
          valeurCaf: article.valeurCaf || article.valeur || 0,
          liquidation: article.liquidation || 0
        }))
      };
      
      console.log(`📤 [MALI] Envoi déclaration Mali ${declarationKit.numeroDeclaration} vers Kit MuleSoft`);
      console.log(`💰 [MALI] Montant: ${declarationKit.montantPaye} - Référence: ${declarationKit.referencePaiement}`);

      // ✅ ÉTAPES 15-16: Envoi vers Kit MuleSoft
      const response = await this.client.post('/declaration/soumission', declarationKit);
      
      console.log(`✅ [MALI] ÉTAPES 14-16 TERMINÉES: Déclaration soumise avec succès vers Kit MuleSoft`);
      console.log(`🎯 [MALI] Status: ${response.data.status} - CorrelationId: ${response.metadata.correlationId}`);
      console.log(`📤 [MALI] Kit MuleSoft va maintenant notifier le Sénégal (ÉTAPE 17)`);

      return {
        ...response.data,
        latence: response.metadata.duration,
        timestamp: response.metadata.timestamp,
        correlationId: response.metadata.correlationId,
        source: 'MALI_DOUANES_BAMAKO',
        etapesCompletes: '14-16',
        prochaine_etape: '17: Kit MuleSoft → Sénégal (autorisation mainlevée)'
      };
      
    } catch (error) {
      console.error(`❌ [MALI] ÉTAPES 14-16 ÉCHOUÉES: Erreur soumission déclaration:`, error.message);
      
      throw new Error(`Soumission déclaration Mali échouée: ${error.response?.data?.message || error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW TRANSIT MALI - ÉTAPES 11, 13-14
  // Réception déclaration transit et message arrivée
  // ═══════════════════════════════════════════════════════════════════════════

  async recevoirDeclarationTransit(declarationTransit) {
    try {
      console.log(`🚛 [MALI] ÉTAPE 11 TRANSIT: Réception déclaration transit depuis Kit MuleSoft`);
      console.log(`📋 [MALI] Transit: ${declarationTransit.numeroDeclaration}`);

      // ✅ ÉTAPE 11: Simulation réception et enregistrement au Mali
      const receptionData = {
        numeroDeclaration: declarationTransit.numeroDeclaration,
        paysDepart: declarationTransit.paysDepart || 'SEN',
        paysDestination: 'MLI',
        transporteur: declarationTransit.transporteur,
        modeTransport: declarationTransit.modeTransport || 'ROUTIER',
        itineraire: declarationTransit.itineraire,
        delaiRoute: declarationTransit.delaiRoute,
        marchandises: declarationTransit.marchandises || [],
        
        // Informations Mali
        bureauDestination: 'BAMAKO_DOUANES',
        dateReception: new Date().toISOString(),
        statutReception: 'RECU_AU_MALI',
        etapeWorkflow: 11
      };

      console.log(`✅ [MALI] ÉTAPE 11 TERMINÉE: Déclaration transit reçue et enregistrée`);
      console.log(`⏳ [MALI] ATTENTE: Arrivée effective des marchandises au Mali (ÉTAPE 13)`);

      return {
        status: 'SUCCESS',
        message: 'Déclaration transit reçue au Mali',
        reception: receptionData,
        prochaine_etape: 'ÉTAPE 13: Arrivée marchandises au bureau Mali'
      };

    } catch (error) {
      console.error(`❌ [MALI] ÉTAPE 11 TRANSIT ÉCHOUÉE:`, error.message);
      throw new Error(`Réception déclaration transit Mali échouée: ${error.message}`);
    }
  }

  async confirmerArriveeTransit(transitId, donneesArrivee) {
    try {
      console.log(`🚛 [MALI] ÉTAPE 13-14 TRANSIT: Confirmation arrivée marchandises vers Kit MuleSoft`);
      console.log(`📋 [MALI] Transit: ${transitId}`);

      // ✅ ÉTAPE 13: Arrivée au bureau Mali
      const arriveeData = {
        numeroDeclaration: transitId,
        bureauArrivee: 'BAMAKO_DOUANES',
        dateArrivee: new Date().toISOString(),
        controleEffectue: donneesArrivee.controleEffectue !== false,
        visaAppose: donneesArrivee.visaAppose !== false,
        conformiteItineraire: donneesArrivee.conformiteItineraire !== false,
        delaiRespecte: donneesArrivee.delaiRespecte !== false,
        declarationDetailDeposee: donneesArrivee.declarationDetailDeposee || false,
        agentReceptionnaire: donneesArrivee.agentReceptionnaire || 'AGENT_MALI',
        observationsArrivee: donneesArrivee.observationsArrivee || ''
      };

      // ✅ ÉTAPE 14: Envoi message arrivée vers Kit MuleSoft
      const response = await this.client.post('/transit/arrivee', arriveeData);

      console.log(`✅ [MALI] ÉTAPES 13-14 TERMINÉES: Message arrivée envoyé vers Kit MuleSoft`);
      console.log(`🎯 [MALI] Kit va notifier le Sénégal de l'arrivée (ÉTAPES 15-16)`);

      return {
        ...response.data,
        latence: response.metadata?.duration,
        correlationId: response.metadata?.correlationId,
        source: 'MALI_TRANSIT_BAMAKO',
        etapesCompletes: '13-14',
        prochaine_etape: '15-16: Kit MuleSoft → Sénégal (confirmation retour)'
      };

    } catch (error) {
      console.error(`❌ [MALI] ÉTAPES 13-14 TRANSIT ÉCHOUÉES:`, error.message);
      throw new Error(`Confirmation arrivée transit Mali échouée: ${error.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICES UTILITAIRES MALI
  // ═══════════════════════════════════════════════════════════════════════════

  async verifierSante() {
    try {
      console.log(`🏥 [MALI] Vérification santé Kit MuleSoft depuis Bamako...`);
      
      const response = await this.client.get('/health');
      
      console.log(`✅ [MALI] Kit MuleSoft opérationnel depuis Mali:`, response.data.status);
      
      return {
        ...response.data,
        latence: response.metadata.duration,
        accessible: true,
        timestamp: response.metadata.timestamp,
        source: 'MALI_DOUANES_BAMAKO',
        testeDepuis: this.villePrincipale
      };
      
    } catch (error) {
      console.error(`❌ [MALI] Kit MuleSoft inaccessible depuis Mali:`, error.message);
      
      return {
        status: 'DOWN',
        accessible: false,
        erreur: error.message,
        timestamp: new Date(),
        source: 'MALI_DOUANES_BAMAKO',
        testeDepuis: this.villePrincipale,
        details: {
          code: error.code,
          status: error.response?.status,
          url: this.baseURL
        }
      };
    }
  }

  async testerConnectiviteDirecte() {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [MALI] Test connectivité DIRECTE Kit MuleSoft depuis Bamako...`);
      
      const sante = await this.verifierSante();
      const duration = Date.now() - startTime;
      
      return {
        success: sante.accessible,
        duree: duration,
        sante,
        kit: {
          url: this.baseURL,
          version: sante.version,
          status: sante.status
        },
        testDepuis: {
          pays: this.paysNom,
          ville: this.villePrincipale,
          role: this.paysRole,
          code: this.paysCode
        },
        modeTest: 'DIRECT_MULESOFT',
        timestamp: new Date()
      };
      
    } catch (error) {
      return {
        success: false,
        duree: Date.now() - startTime,
        erreur: error.message,
        kit: {
          url: this.baseURL,
          status: 'INACCESSIBLE'
        },
        testDepuis: {
          pays: this.paysNom,
          ville: this.villePrincipale,
          role: this.paysRole
        },
        modeTest: 'DIRECT_MULESOFT',
        timestamp: new Date()
      };
    }
  }

  async ping() {
    try {
      const startTime = Date.now();
      await this.client.get('/health');
      return Date.now() - startTime;
    } catch (error) {
      throw new Error(`Ping Kit MuleSoft failed depuis Mali: ${error.message}`);
    }
  }

  async diagnostic() {
    console.log(`🔍 [MALI] Démarrage diagnostic Kit MuleSoft depuis Bamako...`);
    
    const diagnosticResult = {
      timestamp: new Date(),
      client: this.getClientInfo(),
      modeTest: 'DIRECT_MULESOFT',
      testDepuis: this.villePrincipale,
      tests: {}
    };

    // Test 1: Connectivité de base
    try {
      const connectivite = await this.testerConnectiviteDirecte();
      diagnosticResult.tests.connectivite = {
        success: connectivite.success,
        duree: connectivite.duree,
        details: connectivite
      };
    } catch (error) {
      diagnosticResult.tests.connectivite = {
        success: false,
        erreur: error.message
      };
    }

    // Test 2: Stabilité (ping multiple)
    diagnosticResult.tests.stabilite = await this.testerStabilite();

    // Test 3: Test soumission déclaration Mali
    diagnosticResult.tests.soumissionDeclarationMali = await this.testerSoumissionDeclarationMali();

    // Test 4: Test transit Mali
    diagnosticResult.tests.transitMali = await this.testerTransitMali();

    console.log(`📊 [MALI] Diagnostic Kit MuleSoft terminé depuis Bamako:`, {
      connectivite: diagnosticResult.tests.connectivite?.success,
      stabilite: diagnosticResult.tests.stabilite?.stable,
      declarationMali: diagnosticResult.tests.soumissionDeclarationMali?.success,
      transitMali: diagnosticResult.tests.transitMali?.success
    });

    return diagnosticResult;
  }

  async testerStabilite(nombreTests = 3) {
    const latences = [];
    let erreurs = 0;

    for (let i = 0; i < nombreTests; i++) {
      try {
        const latence = await this.ping();
        latences.push(latence);
        await this.wait(500);
      } catch (error) {
        erreurs++;
      }
    }

    const latenceMoyenne = latences.length > 0 
      ? Math.round(latences.reduce((a, b) => a + b, 0) / latences.length)
      : 0;

    return {
      nombreTests,
      reussites: latences.length,
      erreurs,
      latenceMoyenne,
      latenceMin: latences.length > 0 ? Math.min(...latences) : 0,
      latenceMax: latences.length > 0 ? Math.max(...latences) : 0,
      stable: erreurs === 0 && latenceMoyenne < 5000,
      testDepuis: this.villePrincipale
    };
  }

  async testerSoumissionDeclarationMali() {
    try {
      // Simulation d'une déclaration Mali test
      const declarationTest = {
        numeroDeclaration: `TEST_MALI_${Date.now()}`,
        manifesteOrigine: `TEST_MAN_SEN_${Date.now()}`,
        paysDeclarant: 'MLI',
        bureauDecl: '10S_BAMAKO',
        montantPaye: 150000,
        referencePaiement: `TEST_PAY_MALI_${Date.now()}`,
        datePaiement: new Date().toISOString(),
        modePaiement: 'TEST_BCEAO',
        articles: [{
          numArt: 1,
          codeSh: '8703210000',
          designationCom: 'Test véhicule Mali',
          valeurCaf: 1000000,
          liquidation: 150000,
          origine: 'SEN'
        }]
      };

      await this.soumettreDeclarationMali(declarationTest);
      
      return {
        success: true,
        message: 'Test soumission déclaration Mali réussi',
        testDepuis: this.villePrincipale
      };
    } catch (error) {
      return {
        success: false,
        erreur: error.message,
        testDepuis: this.villePrincipale
      };
    }
  }

  async testerTransitMali() {
    try {
      // Test réception déclaration transit
      const transitTest = {
        numeroDeclaration: `TEST_TRANSIT_${Date.now()}`,
        paysDepart: 'SEN',
        transporteur: 'TEST TRANSPORT MALI',
        modeTransport: 'ROUTIER',
        itineraire: 'Dakar-Bamako',
        delaiRoute: '72 heures',
        marchandises: [{
          designation: 'Test marchandise transit',
          poids: 1000,
          nombreColis: 10
        }]
      };

      await this.recevoirDeclarationTransit(transitTest);

      // Test confirmation arrivée
      await this.confirmerArriveeTransit(transitTest.numeroDeclaration, {
        controleEffectue: true,
        visaAppose: true,
        conformiteItineraire: true,
        delaiRespecte: true,
        agentReceptionnaire: 'TEST_AGENT_MALI'
      });
      
      return {
        success: true,
        message: 'Test transit Mali complet réussi',
        testDepuis: this.villePrincipale
      };
    } catch (error) {
      return {
        success: false,
        erreur: error.message,
        testDepuis: this.villePrincipale
      };
    }
  }

  getClientInfo() {
    return {
      pays: {
        code: this.paysCode,
        nom: this.paysNom,
        ville: this.villePrincipale,
        type: this.paysType,
        role: this.paysRole
      },
      kit: {
        url: this.baseURL,
        timeout: this.timeout,
        modeConnexion: 'DIRECT_MULESOFT'
      },
      workflow: {
        libre_pratique: 'Étapes 6-16 (pays de destination)',
        transit: 'Étapes 11, 13-14 (réception et arrivée)',
        description: 'Traitement déclarations depuis manifestes Sénégal'
      },
      systeme: {
        nom: this.systemeName,
        version: '1.0.0-MALI'
      }
    };
  }
}

// ✅ Instance singleton Mali
const kitClient = new KitInterconnexionClientMali();

module.exports = kitClient;