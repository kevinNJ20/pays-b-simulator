// ============================================================================
// MALI - API Réception Copie Transit ÉTAPE 11
// Fichier: api/transit/copie.js
// Réception de la déclaration transit depuis Kit MuleSoft (étapes 10-11)
// ============================================================================

const database = require('../../lib/database');

module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Source-Country, X-Source-System, X-Correlation-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      console.log('🚛 [MALI] ÉTAPE 11 TRANSIT : Réception copie déclaration transit depuis Kit');
      console.log('📋 [MALI] Données reçues:', JSON.stringify(req.body, null, 2));
      
      const { transit_original, marchandises, instructions_mali, metadata } = req.body;
      
      // Validation
      if (!transit_original || !transit_original.numero_declaration) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Numéro de déclaration transit requis',
          timestamp: new Date().toISOString()
        });
      }

      // ✅ ÉTAPE 11 : Enregistrer la déclaration transit au Mali
      const donneesTransit = {
        numeroDeclaration: transit_original.numero_declaration,
        paysDepart: transit_original.pays_depart || 'SEN',
        bureauDepart: transit_original.bureau_depart,
        dateCreation: transit_original.date_creation,
        transporteur: transit_original.transporteur,
        itineraire: transit_original.itineraire,
        delaiRoute: transit_original.delai_route,
        marchandises: marchandises || [],
        
        // Métadonnées du Kit
        correlationId: metadata?.correlation_id,
        etapeWorkflow: 11,
        workflowType: 'TRANSIT'
      };

      const declarationTransit = database.recevoirDeclarationTransit(donneesTransit);
      
      console.log(`✅ [MALI] ÉTAPE 11 TERMINÉE : Transit ${declarationTransit.id} enregistré`);
      console.log(`⏳ [MALI] ATTENTE : Arrivée effective des marchandises (ÉTAPE 13)`);

      // ✅ Réponse ÉTAPE 11
      const reponse = {
        status: 'SUCCESS',
        message: '✅ ÉTAPE 11 MALI TERMINÉE - Déclaration transit reçue et enregistrée',
        
        paysTraitement: {
          code: 'MLI',
          nom: 'Mali',
          ville: 'Bamako',
          role: 'PAYS_DESTINATION'
        },
        
        transit: {
          id: declarationTransit.id,
          numeroDeclaration: declarationTransit.numeroDeclarationTransit,
          paysDepart: declarationTransit.paysDepart,
          transporteur: declarationTransit.transporteur,
          itineraire: declarationTransit.itineraire,
          delaiRoute: declarationTransit.delaiRoute,
          dateReception: declarationTransit.dateReception,
          statut: declarationTransit.statut,
          etapeWorkflow: 11
        },
        
        workflow: {
          etapeTerminee: 11,
          etapeDescription: 'Réception et enregistrement déclaration transit au Mali',
          prochaine_etape: '13: Arrivée marchandises au bureau Mali',
          instructions: instructions_mali,
          modeTraitement: 'MANUEL',
          estimationArrivee: declarationTransit.attenduLe
        },
        
        instructions: [
          '✅ ÉTAPE 11 terminée - Transit enregistré au Mali',
          '🚛 Marchandises en cours de transport vers Bamako',
          '⏳ Attente arrivée effective au bureau des douanes Mali',
          '📍 ÉTAPE 13: Contrôles physiques + Visa à l\'arrivée',
          '📤 ÉTAPE 14: Envoi message arrivée vers Kit MuleSoft'
        ],
        
        timestamp: new Date().toISOString(),
        correlationId: metadata?.correlation_id || `MALI_TRANSIT_${Date.now()}`
      };

      res.status(200).json(reponse);
      
    } catch (error) {
      console.error('❌ [MALI] Erreur ÉTAPE 11 transit:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la réception de la déclaration transit au Mali',
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
      status: 'ERROR',
      message: 'Méthode non autorisée',
      methodesAutorisees: ['POST', 'OPTIONS'],
      paysTraitement: 'Mali - Bamako'
    });
  }
};