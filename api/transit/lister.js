// ============================================================================
// MALI - API Liste Déclarations Transit
// Fichier: api/transit/lister.js
// Liste des déclarations transit reçues au Mali
// ============================================================================

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
      
      console.log(`🚛 [MALI] Demande liste déclarations transit (limite: ${limite})`);

      // Récupérer les déclarations transit
      let transits = Array.from(database.declarationsTransit.values());
      
      // Filtrage si nécessaire
      if (statut) {
        transits = transits.filter(t => t.statut === statut);
      }

      // Tri par date (plus récent en premier)
      transits.sort((a, b) => new Date(b.dateReception) - new Date(a.dateReception));
      
      // Limiter
      transits = transits.slice(0, limite);

      // Transformer pour l'API
      const transitsFormats = transits.map(transit => ({
        id: transit.id,
        numeroDeclaration: transit.numeroDeclarationTransit,
        paysDepart: transit.paysDepart,
        paysDestination: transit.paysDestination,
        
        transport: {
          transporteur: transit.transporteur,
          modeTransport: transit.modeTransport,
          itineraire: transit.itineraire,
          delaiRoute: transit.delaiRoute
        },
        
        marchandises: {
          nombre: transit.marchandises?.length || 0,
          poidsTotal: transit.marchandises?.reduce((sum, m) => sum + (m.poids || 0), 0) || 0
        },
        
        dateReception: transit.dateReception,
        dateArriveePrevu: transit.attenduLe,
        statut: transit.statut,
        etapeWorkflow: transit.etapeWorkflow,
        
        arrivee: transit.arrivee ? {
          dateArrivee: transit.arrivee.dateArrivee,
          bureauArrivee: transit.arrivee.bureauArrivee,
          controleEffectue: transit.arrivee.controleEffectue,
          visaAppose: transit.arrivee.visaAppose,
          conformiteItineraire: transit.arrivee.conformiteItineraire,
          delaiRespecte: transit.arrivee.delaiRespecte
        } : null,
        
        messageArrivee: transit.messageArrivee ? {
          dateEnvoi: transit.messageArrivee.dateEnvoi,
          statut: transit.messageArrivee.statut
        } : null,
        
        sourceKit: transit.sourceKit || false,
        workflowTermine: transit.workflowTransitMaliTermine || false
      }));

      // Statistiques pour cette requête
      const stats = {
        total: transitsFormats.length,
        parStatut: transits.reduce((acc, t) => {
          acc[t.statut] = (acc[t.statut] || 0) + 1;
          return acc;
        }, {}),
        arrivees: {
          confirmees: transits.filter(t => t.arrivee).length,
          enAttente: transits.filter(t => !t.arrivee).length
        },
        messagesEnvoyes: transits.filter(t => t.messageArrivee).length,
        workflowsTermines: transits.filter(t => t.workflowTransitMaliTermine).length
      };

      const reponse = {
        status: 'SUCCESS',
        message: `Liste de ${transitsFormats.length} déclaration(s) transit Mali`,
        
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          role: 'PAYS_DESTINATION'
        },
        
        transits: transitsFormats,
        
        pagination: {
          limite,
          retournes: transitsFormats.length,
          filtres: {
            ...(statut && { statut })
          }
        },
        
        statistiques: stats,
        
        workflow: {
          etape_11: 'Réception déclaration transit',
          etape_13: 'Arrivée marchandises au Mali',
          etape_14: 'Message arrivée vers Kit MuleSoft'
        },
        
        timestamp: new Date().toISOString()
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [MALI] Erreur liste transits:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la récupération des déclarations transit',
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