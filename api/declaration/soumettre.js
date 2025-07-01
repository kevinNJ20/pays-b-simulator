// ============================================================================
// PAYS B - Endpoint Soumission Déclaration vers Kit MuleSoft - VERSION CORRIGÉE
// Fichier: api/declaration/soumettre.js
// ============================================================================

const kitClient = require('../../lib/kit-client');

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
      console.log('📋 [Pays B] Soumission déclaration douanière vers Kit MuleSoft:', req.body);
      
      // ✅ VALIDATION: Vérifier que req.body existe et n'est pas vide
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'Aucune donnée reçue dans la requête',
          timestamp: new Date().toISOString()
        });
      }

      const { anneeDecl, bureauDecl, numeroDecl, dateDecl, articles } = req.body;
      
      // Validation des données requises
      const erreurs = validerDeclaration(req.body);
      if (erreurs.length > 0) {
        console.log('❌ [Pays B] Validation échouée:', erreurs);
        return res.status(400).json({
          status: 'ERROR',
          message: 'Données de déclaration invalides',
          erreurs,
          timestamp: new Date().toISOString()
        });
      }

      // Préparer la déclaration pour l'envoi vers MuleSoft
      const declarationKit = {
        anneeDecl,
        bureauDecl,
        numeroDecl: parseInt(numeroDecl),
        dateDecl,
        articles: articles.map(article => ({
          numArt: parseInt(article.numArt),
          connaissement: article.connaissement,
          modeCond: article.modeCond,
          codeSh: article.codeSh,
          libelleTarif: article.libelleTarif,
          designationCom: article.designationCom,
          origine: article.origine,
          nbreColis: parseInt(article.nbreColis),
          poidsBrut: parseInt(article.poidsBrut),
          poidsNet: parseInt(article.poidsNet),
          valeurCaf: parseInt(article.valeurCaf),
          liquidation: parseInt(article.liquidation)
        }))
      };

      console.log(`📤 [Pays B] Envoi déclaration ${numeroDecl} vers Kit MuleSoft`);

      // ✅ CORRECTION: Utiliser la nouvelle méthode soumettreDeclaration
      const reponseKit = await kitClient.soumettreDeclaration(declarationKit);
      
      console.log(`✅ [Pays B] Déclaration ${numeroDecl} envoyée avec succès vers Kit MuleSoft`);

      // Calculer quelques statistiques pour la réponse
      const valeurTotale = articles.reduce((total, art) => total + parseInt(art.valeurCaf), 0);
      const liquidationTotale = articles.reduce((total, art) => total + parseInt(art.liquidation), 0);
      const poidsTotal = articles.reduce((total, art) => total + parseInt(art.poidsBrut), 0);

      // Réponse succès
      res.status(200).json({
        status: 'SUCCESS',
        message: 'Déclaration douanière soumise avec succès au Kit MuleSoft',
        declaration: {
          numeroDecl,
          bureauDecl,
          anneeDecl,
          dateDecl,
          nombreArticles: articles.length,
          valeurTotaleCaf: valeurTotale,
          liquidationTotale: liquidationTotale,
          poidsTotalBrut: poidsTotal
        },
        kit: {
          status: reponseKit.status,
          correlationId: reponseKit.correlationId,
          timestamp: reponseKit.timestamp,
          latence: reponseKit.latence,
          source: reponseKit.source
        },
        traitementLocal: {
          mode: 'TRANSFERE_VERS_KIT',
          destination: 'KIT_MULESOFT',
          format: 'DECLARATION_DOUANIERE',
          endpoint: '/declaration/soumission'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur soumission déclaration vers Kit:', error);
      
      // ✅ AMÉLIORATION: Gestion spécifique des différents types d'erreurs
      let statusCode = 500;
      let errorDetails = {
        type: 'INTERNAL_ERROR',
        suggestion: 'Vérifier les logs serveur'
      };

      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        statusCode = 504;
        errorDetails = {
          type: 'TIMEOUT_ERROR',
          suggestion: 'Kit MuleSoft ne répond pas - Réessayer plus tard'
        };
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        statusCode = 503;
        errorDetails = {
          type: 'CONNECTION_ERROR',
          suggestion: 'Kit MuleSoft inaccessible - Vérifier la connectivité'
        };
      } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
        statusCode = 400;
        errorDetails = {
          type: 'VALIDATION_ERROR',
          suggestion: 'Données de déclaration non conformes au format MuleSoft'
        };
      }
      
      res.status(statusCode).json({
        status: 'ERROR',
        message: 'Erreur lors de la soumission de la déclaration vers Kit MuleSoft',
        erreur: error.message,
        details: errorDetails,
        debug: {
          kitUrl: kitClient.baseURL,
          endpoint: '/declaration/soumission',
          method: 'POST',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ 
      status: 'ERROR',
      message: 'Méthode non autorisée',
      methodesAutorisees: ['POST', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });
  }
};

// ✅ AMÉLIORATION: Validation plus robuste
function validerDeclaration(donnees) {
  const erreurs = [];

  // Validation champs principaux
  if (!donnees.anneeDecl || donnees.anneeDecl.trim() === '') {
    erreurs.push('Année de déclaration requise');
  }

  if (!donnees.bureauDecl || donnees.bureauDecl.trim() === '') {
    erreurs.push('Bureau de déclaration requis');
  }

  if (!donnees.numeroDecl || isNaN(parseInt(donnees.numeroDecl))) {
    erreurs.push('Numéro de déclaration requis et doit être numérique');
  }

  if (!donnees.dateDecl || donnees.dateDecl.trim() === '') {
    erreurs.push('Date de déclaration requise');
  } else {
    // Vérifier format date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(donnees.dateDecl)) {
      erreurs.push('Format de date invalide (attendu: YYYY-MM-DD)');
    }
  }

  // Validation articles
  if (!donnees.articles || !Array.isArray(donnees.articles) || donnees.articles.length === 0) {
    erreurs.push('Au moins un article est requis');
  } else {
    donnees.articles.forEach((article, index) => {
      const position = index + 1;

      if (!article.numArt || isNaN(parseInt(article.numArt))) {
        erreurs.push(`Article ${position}: Numéro d'article requis et numérique`);
      }

      if (!article.connaissement || article.connaissement.trim() === '') {
        erreurs.push(`Article ${position}: Connaissement requis`);
      }

      if (!article.codeSh || article.codeSh.trim() === '') {
        erreurs.push(`Article ${position}: Code SH requis`);
      } else if (article.codeSh.length < 6) {
        erreurs.push(`Article ${position}: Code SH doit contenir au moins 6 caractères`);
      }

      if (!article.designationCom || article.designationCom.trim() === '') {
        erreurs.push(`Article ${position}: Désignation commerciale requise`);
      }

      if (!article.origine || article.origine.trim() === '') {
        erreurs.push(`Article ${position}: Origine requise`);
      }

      // Validation valeurs numériques avec vérification de cohérence
      const valeursNumeriques = [
        { champ: 'nbreColis', min: 1 },
        { champ: 'poidsBrut', min: 1 },
        { champ: 'poidsNet', min: 1 },
        { champ: 'valeurCaf', min: 1 },
        { champ: 'liquidation', min: 0 }
      ];
      
      valeursNumeriques.forEach(({ champ, min }) => {
        const valeur = parseInt(article[champ]);
        if (!article[champ] || isNaN(valeur) || valeur < min) {
          erreurs.push(`Article ${position}: ${champ} requis et doit être >= ${min}`);
        }
      });

      // Vérification cohérence poids
      const poidsBrut = parseInt(article.poidsBrut);
      const poidsNet = parseInt(article.poidsNet);
      if (!isNaN(poidsBrut) && !isNaN(poidsNet) && poidsNet > poidsBrut) {
        erreurs.push(`Article ${position}: Poids net ne peut pas être supérieur au poids brut`);
      }
    });
  }

  return erreurs;
}