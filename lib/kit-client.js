const axios = require('axios');

class KitInterconnexionClient {
  constructor() {
    // ✅ CORRECTION: URL directe vers MuleSoft (pas via API locale)
    this.baseURL = 'https://kit-interconnexion-uemoa-v4320.m3jzw3-1.deu-c1.cloudhub.io/api/v1';
    this.timeout = 30000; // 30 secondes
    this.paysCode = 'BFA'; // Burkina Faso
    this.systemeName = 'PAYS_B_DOUANES';
    
    // Configuration Axios avec retry automatique
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PaysB-Douanes/1.0',
        'X-Source-Country': this.paysCode,
        'X-Source-System': this.systemeName
      }
    });

    this.setupInterceptors();
    console.log(`🔗 Client Kit initialisé pour ${this.paysCode} - URL: ${this.baseURL}`);
  }

  setupInterceptors() {
    // Intercepteur pour ajouter headers et logging
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        config.headers['X-Correlation-ID'] = `${this.paysCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`📤 [${this.paysCode}] Envoi vers Kit: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error(`❌ [${this.paysCode}] Erreur requête:`, error.message);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour logging des réponses et retry
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        console.log(`📥 [${this.paysCode}] Réponse Kit: ${response.status} (${duration}ms)`);
        
        response.metadata = {
          duration,
          timestamp: new Date(),
          correlationId: response.config.headers['X-Correlation-ID']
        };
        
        return response;
      },
      async (error) => {
        const config = error.config;
        const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
        
        console.error(`❌ [${this.paysCode}] Erreur Kit (${duration}ms):`, {
          status: error.response?.status,
          message: error.message,
          url: config?.url
        });

        // Retry automatique pour certaines erreurs
        if (this.shouldRetry(error) && !config._retryAttempted) {
          config._retryAttempted = true;
          console.log(`🔄 [${this.paysCode}] Tentative de retry...`);
          
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

  // === NOTIFICATION DE PAIEMENT (DIRECT vers MuleSoft) ===
  async notifierPaiement(paiement) {
    try {
      console.log(`💳 [${this.paysCode}] Notification paiement vers Kit: ${paiement.numeroDeclaration}`);
      
      // Préparer les données pour le Kit
      const notificationPaiement = {
        numeroDeclaration: paiement.numeroDeclaration,
        manifesteOrigine: paiement.manifesteOrigine,
        montantPaye: paiement.montantPaye,
        referencePaiement: paiement.referencePaiement,
        datePaiement: paiement.datePaiement instanceof Date ? paiement.datePaiement.toISOString() : paiement.datePaiement,
        paysDeclarant: paiement.paysDeclarant,
        modePaiement: paiement.modePaiement
      };
      
      // ✅ DIRECT vers MuleSoft
      const response = await this.client.post('/paiement/notification', notificationPaiement);
      
      console.log(`✅ [${this.paysCode}] Paiement notifié avec succès:`, response.data);
      
      return {
        ...response.data,
        latence: response.metadata.duration,
        timestamp: response.metadata.timestamp,
        correlationId: response.metadata.correlationId,
        source: 'MULESOFT_DIRECT'
      };
      
    } catch (error) {
      console.error(`❌ [${this.paysCode}] Échec notification paiement:`, error.message);
      
      throw new Error(`Notification paiement échouée: ${error.response?.data?.message || error.message}`);
    }
  }

  // === VÉRIFICATION SANTÉ (DIRECT vers MuleSoft) ===
  async verifierSante() {
    try {
      console.log(`🏥 [${this.paysCode}] Vérification santé Kit MuleSoft...`);
      
      // ✅ DIRECT vers MuleSoft - pas via API locale
      const response = await this.client.get('/health');
      
      console.log(`✅ [${this.paysCode}] Kit MuleSoft opérationnel:`, response.data.status);
      
      return {
        ...response.data,
        latence: response.metadata.duration,
        accessible: true,
        timestamp: response.metadata.timestamp,
        source: 'MULESOFT_DIRECT'
      };
      
    } catch (error) {
      console.error(`❌ [${this.paysCode}] Kit MuleSoft inaccessible:`, error.message);
      
      return {
        status: 'DOWN',
        accessible: false,
        erreur: error.message,
        timestamp: new Date(),
        source: 'MULESOFT_DIRECT',
        details: {
          code: error.code,
          status: error.response?.status,
          url: this.baseURL
        }
      };
    }
  }

  // === TEST DE CONNECTIVITÉ DIRECT ===
  async testerConnectiviteDirecte() {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 [${this.paysCode}] Test connectivité DIRECTE vers Kit MuleSoft...`);
      
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
        modeTest: 'DIRECT_MULESOFT',
        timestamp: new Date()
      };
    }
  }

  // === PING SIMPLE DIRECT ===
  async ping() {
    try {
      const startTime = Date.now();
      await this.client.get('/health');
      return Date.now() - startTime;
    } catch (error) {
      throw new Error(`Ping MuleSoft failed: ${error.message}`);
    }
  }

  // === DIAGNOSTIC AVANCÉ ===
  async diagnostic() {
    console.log(`🔍 [${this.paysCode}] Démarrage diagnostic Kit MuleSoft...`);
    
    const diagnosticResult = {
      timestamp: new Date(),
      client: this.getClientInfo(),
      modeTest: 'DIRECT_MULESOFT',
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

    // Test 3: Test notification paiement
    diagnosticResult.tests.notificationPaiement = await this.testerNotificationPaiement();

    console.log(`📊 [${this.paysCode}] Diagnostic Kit MuleSoft terminé:`, {
      connectivite: diagnosticResult.tests.connectivite?.success,
      stabilite: diagnosticResult.tests.stabilite?.stable,
      notification: diagnosticResult.tests.notificationPaiement?.success
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
      stable: erreurs === 0 && latenceMoyenne < 5000
    };
  }

  async testerNotificationPaiement() {
    try {
      // Simulation d'une notification de paiement test
      const paiementTest = {
        numeroDeclaration: `TEST_DEC_${Date.now()}`,
        manifesteOrigine: `TEST_MAN_${Date.now()}`,
        montantPaye: 100000,
        referencePaiement: `TEST_PAY_${Date.now()}`,
        datePaiement: new Date().toISOString(),
        paysDeclarant: this.paysCode,
        modePaiement: 'TEST'
      };

      await this.notifierPaiement(paiementTest);
      
      return {
        success: true,
        message: 'Test notification réussi'
      };
    } catch (error) {
      return {
        success: false,
        erreur: error.message
      };
    }
  }

  getClientInfo() {
    return {
      pays: {
        code: this.paysCode,
        nom: 'Burkina Faso',
        type: 'HINTERLAND'
      },
      kit: {
        url: this.baseURL,
        timeout: this.timeout,
        modeConnexion: 'DIRECT_MULESOFT'
      },
      systeme: {
        nom: this.systemeName,
        version: '1.0.0'
      }
    };
  }
}

// Instance singleton
const kitClient = new KitInterconnexionClient();

module.exports = kitClient;