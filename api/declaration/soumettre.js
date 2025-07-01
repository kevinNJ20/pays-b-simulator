// ============================================================================
// PAYS B - Endpoint Soumission Déclaration vers Kit MuleSoft
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
      
      const { anneeDecl, bureauDecl, numeroDecl, dateDecl, articles } = req.body;
      
      // Validation des données requises
      const erreurs = validerDeclaration(req.body);
      if (erreurs.length > 0) {
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

      // Envoyer vers Kit MuleSoft
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
          timestamp: reponseKit.timestamp
        },
        traitementLocal: {
          mode: 'TRANSFERE_VERS_KIT',
          destination: 'KIT_MULESOFT',
          format: 'DECLARATION_DOUANIERE'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [Pays B] Erreur soumission déclaration vers Kit:', error);
      
      res.status(500).json({
        status: 'ERROR',
        message: 'Erreur lors de la soumission de la déclaration vers Kit MuleSoft',
        erreur: error.message,
        details: {
          type: 'KIT_COMMUNICATION_ERROR',
          suggestion: 'Vérifier la connectivité avec le Kit MuleSoft'
        },
        timestamp: new Date().toISOString()
      });
    }
  } else {
    res.status(405).json({ 
      erreur: 'Méthode non autorisée',
      methodesAutorisees: ['POST', 'OPTIONS']
    });
  }
};

// Fonction de validation des données de déclaration
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
  }

  // Validation articles
  if (!donnees.articles || !Array.isArray(donnees.articles) || donnees.articles.length === 0) {
    erreurs.push('Au moins un article est requis');
  } else {
    donnees.articles.forEach((article, index) => {
      const position = index + 1;

      if (!article.numArt || isNaN(parseInt(article.numArt))) {
        erreurs.push(`Article ${position}: Numéro d'article requis`);
      }

      if (!article.connaissement || article.connaissement.trim() === '') {
        erreurs.push(`Article ${position}: Connaissement requis`);
      }

      if (!article.codeSh || article.codeSh.trim() === '') {
        erreurs.push(`Article ${position}: Code SH requis`);
      }

      if (!article.designationCom || article.designationCom.trim() === '') {
        erreurs.push(`Article ${position}: Désignation commerciale requise`);
      }

      if (!article.origine || article.origine.trim() === '') {
        erreurs.push(`Article ${position}: Origine requise`);
      }

      // Validation valeurs numériques
      const valeursNumeriques = ['nbreColis', 'poidsBrut', 'poidsNet', 'valeurCaf', 'liquidation'];
      valeursNumeriques.forEach(champ => {
        if (!article[champ] || isNaN(parseInt(article[champ])) || parseInt(article[champ]) <= 0) {
          erreurs.push(`Article ${position}: ${champ} requis et doit être numérique positif`);
        }
      });
    });
  }

  return erreurs;
}