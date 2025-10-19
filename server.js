// ============================================================================
// SERVEUR LOCAL MALI - server.js CORRIGÉ AVEC ROUTE WORKFLOW MANUEL
// Bamako - Pays de destination (Pays B selon rapport PDF UEMOA)
// Compatible avec les APIs écrites pour Vercel - ÉTAPES 6-16 Manuel
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ✅ Configuration du serveur - MALI (PAYS B selon rapport PDF)
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0';
const PAYS_CODE = 'MLI'; // ✅ Mali
const PAYS_NOM = 'Mali';
const PAYS_TYPE = 'HINTERLAND'; // ✅ Pays de l'hinterland selon rapport PDF
const PAYS_ROLE = 'PAYS_DESTINATION'; // ✅ Rôle selon rapport PDF
const VILLE_NAME = 'Bamako'; // ✅ Capitale Mali

console.log(`🇲🇱 Démarrage serveur ${PAYS_NOM} (${PAYS_TYPE}) - ${PAYS_ROLE}...`);

// Types MIME
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// ✅ Router pour les APIs MALI - Workflow libre pratique ÉTAPES 6-16
const apiRouter = {
  // ✅ APIs principales Mali
  'GET /api/health': () => require('./api/health'),
  'GET /api/statistiques': () => require('./api/statistiques'),
  
  // ✅ ÉTAPE 6 : Réception manifeste depuis Kit MuleSoft
  'GET /api/manifeste/reception': () => require('./api/manifeste/reception'),
  'POST /api/manifeste/reception': () => require('./api/manifeste/reception'),
  'GET /api/manifeste/lister': () => require('./api/manifeste/lister'),

  // ✅ NOUVEAU: Documents GUCE
  'GET /api/documents-guce/lister': () => require('./api/documents-guce/lister'),
  
  // ✅ ÉTAPE 8 : Création déclaration (après collecte GUCE étape 7)
  'GET /api/declaration/lister': () => require('./api/declaration/lister'),
  'POST /api/declaration/soumettre': () => require('./api/declaration/soumettre'),
  
  // ✅ ÉTAPE 14 : Paiement droits et taxes
  'POST /api/paiement/effectuer': () => require('./api/paiement/effectuer'),
  'GET /api/paiement/lister': () => require('./api/paiement/lister'),
  
  // ✅ ÉTAPES 15-16 : Transmission vers Kit MuleSoft
  'POST /api/apurement/notification': () => require('./api/apurement/notification'),
  
  // ✅ NOUVEAU: Workflow manuel Mali (Étapes 7-16)
  'POST /api/workflow/manuel': () => require('./api/workflow/manuel'),

  // ✅ WORKFLOW TRANSIT Mali (Étapes 11, 13-14)
  'POST /api/transit/copie': () => require('./api/transit/copie'),           // ÉTAPE 11
  'POST /api/transit/arrivee': () => require('./api/transit/arrivee'),       // ÉTAPES 13-14
  'GET /api/transit/arrivee': () => require('./api/transit/arrivee'),        // Liste arrivées
  'GET /api/transit/lister': () => require('./api/transit/lister'),          // Liste transits

  // APIs authentification Mali
  'POST /api/auth/login': () => require('./api/auth/login'),
  'POST /api/auth/logout': () => require('./api/auth/logout'),
  'POST /api/auth/verify': () => require('./api/auth/verify'),
  'GET /api/auth/verify': () => require('./api/auth/verify'),
  
  // ✅ Tests Kit MuleSoft
  'GET /api/kit/test': () => require('./api/kit/test'),
  'POST /api/kit/test': () => require('./api/kit/test')
};

// Fonction pour créer un objet de réponse compatible Vercel
function createVercelResponse(res) {
  const vercelRes = {
    headers: {},
    statusCode: 200,
    
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    
    json: function(data) {
      this.headers['Content-Type'] = 'application/json';
      res.writeHead(this.statusCode, this.headers);
      res.end(JSON.stringify(data));
      return this;
    },
    
    send: function(data) {
      this.headers['Content-Type'] = 'text/plain';
      res.writeHead(this.statusCode, this.headers);
      res.end(data);
      return this;
    },
    
    setHeader: function(name, value) {
      this.headers[name] = value;
      return this;
    },
    
    end: function(data) {
      res.writeHead(this.statusCode, this.headers);
      res.end(data);
      return this;
    }
  };
  
  return vercelRes;
}

// Fonction pour créer un objet de requête compatible Vercel
function createVercelRequest(req, body, query) {
  return {
    ...req,
    body: body || {},
    query: query || {},
    method: req.method,
    url: req.url,
    headers: req.headers
  };
}

// ✅ Serveur HTTP Mali
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname} - [${PAYS_CODE}] ${VILLE_NAME}`);

  // ✅ CORS headers pour interconnexion UEMOA
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source-Country, X-Source-System, X-Correlation-ID, X-Manifeste-Format, X-Payment-Reference, X-Test-Mode');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // ✅ Router API avec routes spécifiques Mali
    const route = `${method} ${pathname}`;
    let handler = apiRouter[route];
    
    // Si pas de route exacte, essayer de trouver une route partielle
    if (!handler) {
      for (const [routePattern, routeHandler] of Object.entries(apiRouter)) {
        const [routeMethod, routePath] = routePattern.split(' ');
        if (routeMethod === method && pathname.startsWith(routePath)) {
          handler = routeHandler;
          break;
        }
      }
    }

    if (handler && pathname.startsWith('/api/')) {
      try {
        // Créer les objets compatibles Vercel
        const vercelRes = createVercelResponse(res);
        
        // Lire le body pour les requêtes POST
        let body = {};
        if (method === 'POST' || method === 'PUT') {
          body = await new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
              data += chunk.toString();
            });
            
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (error) {
                console.error(`❌ [${PAYS_CODE}] Erreur parsing JSON:`, error);
                resolve({});
              }
            });
            
            req.on('error', reject);
            
            // Timeout après 10 secondes
            setTimeout(() => resolve({}), 10000);
          });
        }
        
        const vercelReq = createVercelRequest(req, body, parsedUrl.query);
        
        // Exécuter le handler API
        const apiHandler = handler();
        await apiHandler(vercelReq, vercelRes);
        
      } catch (error) {
        console.error(`❌ [${PAYS_CODE}] Erreur API:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Internal Server Error', 
          message: error.message,
          pays: PAYS_CODE,
          ville: VILLE_NAME
        }));
      }
      return;
    }

    // ✅ Servir les fichiers statiques
    let filePath;
    if (pathname === '/') {
      filePath = path.join(__dirname, 'public', 'index.html');
    } else {
      filePath = path.join(__dirname, 'public', pathname);
    }

    // Vérifier si le fichier existe
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': mimeType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // ✅ 404 personnalisé Mali
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head>
            <title>404 - Page Non Trouvée - ${PAYS_NOM}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: linear-gradient(135deg, #ce1126 0%, #14b53a 50%, #fcd116 100%);
                color: white;
              }
              h1 { color: #e74c3c; }
              a { color: #3498db; text-decoration: none; }
              .container { 
                background: rgba(255,255,255,0.9); 
                padding: 40px; 
                border-radius: 15px; 
                color: #333; 
                display: inline-block; 
                max-width: 600px;
                margin: 0 auto;
              }
              .flag { font-size: 3em; margin-bottom: 20px; }
              .info { margin: 15px 0; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="flag">🇲🇱</div>
              <h1>${PAYS_NOM} - ${VILLE_NAME}</h1>
              <h2>404 - Page Non Trouvée</h2>
              <p>La page ${pathname} n'existe pas sur le système douanier du ${PAYS_NOM}.</p>
              <div class="info">
                <strong>Rôle:</strong> ${PAYS_ROLE}<br>
                <strong>Type:</strong> ${PAYS_TYPE}<br>
                <strong>Ville:</strong> ${VILLE_NAME}<br>
                <strong>Code pays:</strong> ${PAYS_CODE}<br>
                <strong>Workflow:</strong> Étapes 6-16 (Manuel)
              </div>
              <p><a href="/">← Retour au Dashboard ${PAYS_NOM}</a></p>
            </div>
          </body>
        </html>
      `);
    }

  } catch (error) {
    console.error(`❌ [${PAYS_CODE}] Erreur serveur:`, error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal Server Error', 
      message: error.message,
      pays: PAYS_CODE,
      ville: VILLE_NAME
    }));
  }
});

// ✅ Démarrer le serveur Mali
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('🇲🇱 ═══════════════════════════════════════════════════════════');
  console.log(`🇲🇱 Serveur ${PAYS_NOM} (${PAYS_ROLE}) démarré`);
  console.log(`🌍 URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Kit MuleSoft: http://localhost:8080/api/v1`);
  console.log(`⏹️  Arrêt: Ctrl+C`);
  console.log('🇲🇱 ═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`🇲🇱 Simulateur ${PAYS_NOM} - Système Douanier ${PAYS_ROLE}`);
  console.log('📋 Fonctionnalités disponibles conformes au rapport PDF UEMOA:');
  console.log('');
  console.log('   🔥 WORKFLOW LIBRE PRATIQUE (21 étapes) - ÉTAPES MALI 6-16:');
  console.log('   • ÉTAPE 6: ✅ Réception et enregistrement manifeste depuis Kit MuleSoft');
  console.log('   • ÉTAPE 7: 👤 Collecte documents pré-dédouanement (GUCE Mali)');
  console.log('   • ÉTAPE 8: 👤 Établissement déclaration par déclarant malien');
  console.log('   • ÉTAPES 9-10: 👤 Contrôles de recevabilité + Calcul du devis');
  console.log('   • ÉTAPE 11: 👤 Enregistrement déclaration détaillée');
  console.log('   • ÉTAPES 12-13: 👤 Contrôles douaniers + Émission bulletin liquidation');
  console.log('   • ÉTAPE 14: 👤 Paiement droits et taxes (BCEAO/Trésor Mali)');
  console.log('   • ÉTAPES 15-16: 👤 Transmission données vers Kit MuleSoft');
  console.log('');
  console.log('   🚛 WORKFLOW TRANSIT (16 étapes) - ÉTAPES MALI:');
  console.log('   • ÉTAPE 11: Réception déclaration transit');
  console.log('   • ÉTAPE 13: Arrivée marchandises au bureau Mali');
  console.log('   • ÉTAPE 14: Message arrivée vers Kit MuleSoft');
  console.log('');
  console.log('   🔧 CARACTÉRISTIQUES TECHNIQUES:');
  console.log('   • Interface web spécialisée pays de destination');
  console.log('   • Workflow MANUEL selon rapport PDF UEMOA');
  console.log('   • Réception automatique via Kit MuleSoft (étape 6)');
  console.log('   • Traitement manuel étapes 7-16 par agents/déclarants maliens');
  console.log('   • ✨ NOUVEAU: API /api/workflow/manuel pour exécution étapes');
  console.log('');
  console.log(`   📍 LOCALISATION: ${VILLE_NAME} | Code: ${PAYS_CODE} | Type: ${PAYS_TYPE}`);
  console.log('   🎯 SOURCE: Sénégal (Port de Dakar) via Kit MuleSoft');
  console.log('   🔄 RETOUR: Informations déclaration/recouvrement vers Sénégal (étape 17)');
  console.log('');
  console.log('   📋 WORKFLOW MANUEL MALI (selon Figure 19 rapport PDF):');
  console.log('   ✅ Réception manifeste → Collecte GUCE → Déclaration → Contrôles → Liquidation → Paiement → Transmission Kit');
  console.log('');
});

// ✅ Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log(`\n🛑 Arrêt du serveur ${PAYS_NOM} (${VILLE_NAME})...`);
  server.close(() => {
    console.log(`✅ Serveur ${PAYS_NOM} arrêté proprement`);
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Arrêt du serveur ${PAYS_NOM} (${VILLE_NAME})...`);
  server.close(() => {
    console.log(`✅ Serveur ${PAYS_NOM} arrêté proprement`);
    process.exit(0);
  });
});

// ✅ Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error(`❌ [${PAYS_CODE}] Erreur non capturée:`, error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`❌ [${PAYS_CODE}] Promesse rejetée non gérée:`, reason);
});