const axios = require('axios');

class KitInterconnexionClient {
  constructor() {
    this.baseURL = process.env.KIT_BASE_URL || 'https://kit-interconnexion-uemoa.herokuapp.com/api/v1';
    this.timeout = 10000;
  }

  async notifierPaiement(paiement) {
    try {
      console.log('💳 Notification paiement vers Kit:', paiement.numeroDeclaration);
      
      const response = await axios.post(
        `${this.baseURL}/paiement/notification`,
        paiement,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Source-System': 'PAYS_B_DOUANES',
            'X-Correlation-ID': `PAYS_B_${Date.now()}`
          },
          timeout: this.timeout
        }
      );
      
      console.log('✅ Paiement notifié avec succès:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur notification paiement:', error.message);
      throw error;
    }
  }

  async verifierSante() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      return { status: 'DOWN', error: error.message };
    }
  }
}

module.exports = new KitInterconnexionClient();