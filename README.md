# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination** - Implémentation conforme au rapport PDF UEMOA  
Simulation complète des workflows Libre Pratique (étapes 6-16) et Transit (étapes 11, 13-14)

---

## 📋 **Vue d'ensemble**

Ce simulateur implémente le système douanier du **Mali (Pays B)** selon l'architecture d'interconnexion UEMOA définie dans le rapport PDF. En tant que **pays de destination**, le Mali gère le traitement des déclarations douanières depuis les manifestes reçus du **Sénégal** via le **Kit MuleSoft**.

### 🎯 **Rôle dans l'écosystème UEMOA**

- **Pays B** : Mali (Bamako) - Pays de destination hinterland
- **Bureau principal** : Douanes Mali - Bamako
- **Fonction** : Traitement des déclarations pour marchandises provenant du Sénégal
- **Interconnexion** : Sénégal ↔ Kit MuleSoft ↔ **Mali** ↔ Commission UEMOA

---

## 🚀 **Démarrage rapide**

### **1. Lancement local**

```bash
# Option 1: Script npm (recommandé)
npm start

# Option 2: Node.js direct
node server.js

# Option 3: Script de démarrage
node start-local.js
```

### **2. Avec Vercel (déploiement)**

```bash
# Si Vercel CLI installée
vercel dev

# Sinon, mode local
npm start
```

### **3. URLs disponibles**

- **🖥️ Interface web** : http://localhost:3002
- **🏥 Health check** : http://localhost:3002/api/health
- **📊 Statistiques** : http://localhost:3002/api/statistiques
- **📥 Réception manifestes** : http://localhost:3002/api/manifeste/reception

---

## 🔥 **Workflows implémentés**

### **📦 Workflow Libre Pratique (21 étapes) - Étapes Mali 6-16**

Le simulateur Mali implémente les **étapes 6-16** du workflow libre pratique en **mode MANUEL** :

#### **ÉTAPE 6 : Réception manifeste depuis Kit MuleSoft**
- ✅ **ÉTAPE 6** : Réception et enregistrement manifeste depuis Sénégal

#### **ÉTAPES 7-16 : Traitement manuel par agents/déclarants maliens**
- ✅ **ÉTAPE 7** : Collecte documents pré-dédouanement (GUCE Mali)
- ✅ **ÉTAPE 8** : Établissement déclaration par déclarant malien
- ✅ **ÉTAPES 9-10** : Contrôles de recevabilité + Calcul devis
- ✅ **ÉTAPE 11** : Enregistrement déclaration détaillée
- ✅ **ÉTAPES 12-13** : Contrôles douaniers + Émission bulletin liquidation
- ✅ **ÉTAPE 14** : Paiement droits et taxes (BCEAO/Trésor Mali)
- ✅ **ÉTAPES 15-16** : Transmission données vers Kit MuleSoft

### **🚛 Workflow Transit (16 étapes) - Étapes Mali 11, 13-14**

- ✅ **ÉTAPE 11** : Réception déclaration transit
- ✅ **ÉTAPE 13** : Arrivée marchandises au bureau Mali
- ✅ **ÉTAPE 14** : Message arrivée vers Kit MuleSoft

---

## 🛠️ **Architecture technique**

### **📁 Structure du projet**

```
simulateur-mali/
├── api/                          # APIs REST du simulateur
│   ├── health.js                # Health check système
│   ├── statistiques.js          # Métriques et performance
│   ├── manifeste/
│   │   ├── reception.js         # ÉTAPE 6: Réception manifeste
│   │   └── lister.js            # Liste des manifestes reçus
│   ├── declaration/
│   │   ├── lister.js            # ÉTAPE 8: Liste déclarations
│   │   └── soumettre.js         # ÉTAPES 14-16: Soumission Kit
│   ├── paiement/
│   │   ├── effectuer.js         # ÉTAPE 14: Paiement manuel
│   │   └── lister.js            # Liste des paiements
│   ├── apurement/
│   │   └── notification.js      # Support notifications apurement
│   └── kit/
│       └── test.js              # Tests Kit MuleSoft
├── lib/                          # Librairies métier
│   ├── database.js              # Base de données embarquée Mali
│   └── kit-client.js            # Client Kit MuleSoft Mali
├── public/                       # Interface web Mali
│   ├── index.html               # Dashboard Mali interactif
│   ├── script.js                # JavaScript frontend
│   └── style.css                # Styles CSS
├── server.js                     # Serveur HTTP principal
├── package.json                  # Configuration npm
└── README.md                     # Documentation
```

### **⚙️ Configuration technique**

- **Runtime** : Node.js 18.x
- **Port** : 3002 (configurable via PORT)
- **Format** : UEMOA 2025.1 compatible
- **Mode workflow** : MANUEL (conforme rapport PDF)
- **Kit MuleSoft** : http://localhost:8080/api/v1

---

## 📊 **APIs et Services**

### **🏥 Health Check** - `/api/health`

**Méthode** : `GET`  
**Fonction** : Vérification état système et connectivité Kit MuleSoft

```json
{
  "service": "Système Douanier Mali (Bamako)",
  "status": "UP",
  "pays": {
    "code": "MLI",
    "nom": "Mali",
    "role": "PAYS_DESTINATION"
  },
  "workflow": {
    "libre_pratique": {
      "etapes_mali": "6-16",
      "mode": "MANUEL"
    }
  }
}
```

### **📥 Réception Manifeste** - `/api/manifeste/reception`

**Méthode** : `POST`  
**Fonction** : ÉTAPE 6 du workflow libre pratique

**Headers requis** :
```http
Content-Type: application/json
X-Source-Country: SEN
X-Source-System: KIT_MULESOFT
X-Correlation-ID: [UUID]
X-Manifeste-Format: UEMOA
```

**Traitement automatique ÉTAPE 6** :
1. **Validation** format depuis Kit MuleSoft (Sénégal)
2. **Transformation** format UEMOA → format Mali natif
3. **Stockage** dans base locale Mali
4. **Préparation** pour traitement manuel (étapes 7-16)

### **📋 Soumission Déclaration** - `/api/declaration/soumettre`

**Méthode** : `POST`  
**Fonction** : ÉTAPES 14-16 - Soumission déclaration et paiement Mali vers Kit

**Payload UEMOA** :
```json
{
  "numeroDeclaration": "DEC-MLI-2025-001",
  "manifesteOrigine": "5016", 
  "anneeDecl": "2025",
  "bureauDecl": "10S_BAMAKO",
  "montantPaye": 250000,
  "referencePaiement": "PAY-MLI-2025-001",
  "datePaiement": "2025-01-15T14:30:00Z",
  "paysDeclarant": "MLI",
  "articles": [...]
}
```

**Traitement ÉTAPES 14-16** :
1. **ÉTAPE 14** : Paiement droits et taxes Mali
2. **ÉTAPE 15** : Confirmation paiement et préparation
3. **ÉTAPE 16** : Transmission vers Kit MuleSoft → Sénégal

### **💳 Paiement Manuel** - `/api/paiement/effectuer`

**Méthode** : `POST`  
**Fonction** : ÉTAPE 14 - Paiement droits et taxes

**Payload** :
```json
{
  "numeroDeclaration": "DEC-MLI-2025-001",
  "montantPaye": 250000,
  "modePaiement": "VIREMENT_BCEAO"
}
```

### **📊 Statistiques** - `/api/statistiques`

**Méthode** : `GET`  
**Fonction** : Métriques workflow Mali

```json
{
  "workflowLibrePratique": {
    "etapesMali": "6-16",
    "mode": "MANUEL",
    "etapesCompletes": {
      "etape_6_reception": 15,
      "etapes_7_guce": 12,
      "etape_8_declaration": 10,
      "etape_14_paiement": 8,
      "etapes_15_16_transmission": 5
    }
  }
}
```

---

## 🗄️ **Base de données embarquée Mali**

### **Modèle workflow Manuel Mali**

```javascript
// Structure workflow libre pratique Mali
const workflowMali = {
  // ÉTAPE 6
  manifestesRecus: Map(), // Manifestes depuis Kit MuleSoft
  
  // ÉTAPE 7
  documentsGUCE: Map(), // Documents collectés GUCE Mali
  
  // ÉTAPE 8
  declarationsCreees: Map(), // Déclarations par déclarants maliens
  
  // ÉTAPES 9-10
  declarationsControlees: Map(), // Contrôles + devis
  
  // ÉTAPE 11
  declarationsEnregistrees: Map(), // Déclarations détaillées
  
  // ÉTAPES 12-13
  liquidations: Map(), // Contrôles douaniers + bulletins
  
  // ÉTAPE 14
  paiements: Map(), // Paiements BCEAO/Trésor Mali
  
  // ÉTAPES 15-16
  transmissionsKit: Map() // Transmission Kit MuleSoft
};
```

### **États workflow Mali**

| Statut | Étapes | Description |
|--------|--------|-------------|
| `RECU_AU_MALI` | 6 | Manifeste reçu depuis Kit MuleSoft |
| `DOCUMENTS_GUCE_COLLECTES` | 7 | Documents GUCE Mali collectés |
| `DECLARATION_CREEE` | 8 | Déclaration créée par déclarant malien |
| `CONTROLEE_ET_DEVIS_CALCULE` | 9-10 | Contrôles terminés + devis calculé |
| `ENREGISTREE_MALI` | 11 | Déclaration détaillée enregistrée |
| `LIQUIDEE_MALI` | 12-13 | Contrôles douaniers + bulletin émis |
| `PAYEE_MALI` | 14 | Droits et taxes payés Mali |
| `TRANSMIS_VERS_KIT` | 15-16 | Transmis vers Kit MuleSoft |

---

## 🔧 **Kit MuleSoft Integration Mali**

### **Configuration connexion Mali**

```javascript
// lib/kit-client.js
const KitClientMali = {
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 30000,
  paysCode: 'MLI',
  paysRole: 'PAYS_DESTINATION',
  headers: {
    'X-Source-Country': 'MLI',
    'X-Source-System': 'MALI_DOUANES_BAMAKO',
    'X-Destination-Role': 'PAYS_DESTINATION'
  }
};
```

### **ÉTAPES 15-16 : Soumission vers Kit MuleSoft**

```javascript
// Soumission déclaration Mali vers Kit
async function soumettreDeclarationMali(declaration) {
  // 1. Validation données Mali
  // 2. Préparation format UEMOA
  // 3. Envoi POST /declaration/soumission
  // 4. Gestion réponse Kit MuleSoft
}
```

---

## 🎨 **Interface utilisateur Mali**

### **🖥️ Dashboard Mali spécialisé** - `public/index.html`

**Fonctionnalités spécifiques Mali** :
- ✅ **Workflow manuel Mali** : Étapes 6-16 clairement visualisées
- ✅ **Réception manifestes** : Depuis Kit MuleSoft (Sénégal)
- ✅ **Portail GUCE Mali** : Accès direct pour collecte documents
- ✅ **Simulation workflow** : Test complet étapes Mali
- ✅ **Interface apurement** : Notifications et suivi
- ✅ **Statistiques temps réel** : Métriques workflow Mali
- ✅ **Tests Kit MuleSoft** : Connectivité depuis Bamako

### **🎯 Workflow utilisateur Mali**

1. **Réception automatique** : Manifestes depuis Sénégal via Kit
2. **Collecte GUCE Mali** : Documents pré-dédouanement (ÉTAPE 7)
3. **Déclaration manuelle** : Par déclarant malien (ÉTAPE 8)
4. **Contrôles manuels** : Recevabilité + devis (ÉTAPES 9-10)
5. **Enregistrement** : Déclaration détaillée (ÉTAPE 11)
6. **Liquidation manuelle** : Contrôles + bulletin (ÉTAPES 12-13)
7. **Paiement BCEAO** : Droits et taxes Mali (ÉTAPE 14)
8. **Transmission automatique** : Vers Kit MuleSoft (ÉTAPES 15-16)

### **🌐 Portail GUCE Mali intégré**

L'interface Mali inclut un accès direct au portail GUCE Mali :
- **URL** : `https://guce.gov.ml/portal`
- **Fonction** : Collecte documents pré-dédouanement
- **Ouverture** : Nouvelle fenêtre dédiée
- **Support** : ÉTAPE 7 du workflow libre pratique

---

## 🚛 **Support Transit Mali**

### **Workflow Transit Mali (16 étapes)**

```javascript
// ÉTAPE 11 : Réception déclaration transit
const declarationTransit = {
  numeroDeclaration: "TRA-SEN-2025-001",
  paysDepart: "SEN",
  paysDestination: "MLI",
  transporteur: "TRANSPORT SAHEL",
  itineraire: "Dakar-Bamako via Kayes",
  delaiRoute: "72 heures",
  marchandises: [/* marchandises */]
};

// ÉTAPE 13 : Arrivée marchandises Mali
const arriveeData = {
  bureauArrivee: "BAMAKO_DOUANES",
  dateArrivee: "2025-01-18T10:30:00Z",
  controleEffectue: true,
  conformiteItineraire: true
};

// ÉTAPE 14 : Message arrivée vers Kit MuleSoft
const messageArrivee = {
  numeroDeclaration: "TRA-SEN-2025-001",
  confirmationArrivee: true,
  agentReceptionnaire: "AGENT_MALI_BAMAKO"
};
```

---

## 📈 **Monitoring et Observabilité**

### **Health Check Mali**

```bash
curl http://localhost:3002/api/health
```

**Contrôles effectués** :
- ✅ Service Mali actif (Bamako)
- ✅ Kit MuleSoft accessible depuis Mali
- ✅ Base de données Mali opérationnelle
- ✅ Workflow manuel 6-16 supporté
- ✅ Format UEMOA compatible

### **Métriques Mali disponibles**

- **Volume** : Manifestes reçus, déclarations créées
- **Performance** : Temps traitement moyen Mali
- **Workflow** : Progression étapes 6-16
- **Erreurs** : Échecs traitement, validations Mali
- **Paiements** : BCEAO/Trésor Mali, montants acquittés

### **Logs structurés Mali**

```javascript
// Exemples logs workflow Mali
console.log('🇲🇱 [MALI] ÉTAPE 6 TERMINÉE: Manifeste reçu depuis Kit MuleSoft');
console.log('🇲🇱 [MALI] ÉTAPE 7: Collecte documents GUCE Mali requise');
console.log('🇲🇱 [MALI] ÉTAPE 14: Paiement Mali effectué au Trésor');
console.log('🇲🇱 [MALI] ÉTAPES 15-16 TERMINÉES: Transmission Kit réussie');
```

---

## 🔒 **Sécurité et Authentification Mali**

### **Headers sécurité Mali**

```http
# Identification système Mali
X-Source-Country: MLI
X-Source-System: MALI_DOUANES_BAMAKO
X-Destination-Role: PAYS_DESTINATION

# Workflow tracking Mali
X-Correlation-ID: MLI_2025_001_123456789
X-Workflow-Step: 6_RECEPTION_MANIFESTE
X-Manifeste-Format: UEMOA

# Paiement Mali (étape 14)
X-Payment-Reference: PAY-MLI-2025-001
X-Payment-System: BCEAO_MALI
```

### **CORS configuré Mali**

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Source-Country, 
  X-Correlation-ID, X-Payment-Reference, X-Manifeste-Format
```

---

## 🧪 **Tests et Validation Mali**

### **Tests automatiques Mali**

```bash
# Test health check Mali
curl http://localhost:3002/api/health

# Test réception manifeste depuis Kit
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Source-System: KIT_MULESOFT" \
  -d @test-manifeste-mali.json

# Test connectivité Kit depuis Mali
curl http://localhost:3002/api/kit/test?type=health
```

### **Validation workflow Mali**

1. **ÉTAPE 6** : Réception manifeste → Vérifier enregistrement Mali
2. **ÉTAPES 7-16** : Simuler workflow manuel → Vérifier progression
3. **Intégration** : Workflow complet Sénégal→Mali→Kit→Sénégal

### **Données de test Mali**

```json
// Manifeste test reçu depuis Sénégal via Kit
{
  "manifeste": {
    "numeroOrigine": "SEN_5016_2025",
    "transporteur": "MAERSK LINE SENEGAL", 
    "navire": "MARCO POLO",
    "portOrigine": "Port de Dakar",
    "paysOrigine": "SEN"
  },
  "marchandises": [{
    "position": 1,
    "designation": "Véhicule Toyota Corolla",
    "importateur": "IMPORT SARL BAMAKO",
    "destinataire": "CLIENT MALI SARL",
    "valeurEstimee": 1500000
  }]
}
```

---

## 🚀 **Déploiement Mali**

### **Variables d'environnement**

```env
# Configuration serveur Mali
PORT=3002
NODE_ENV=production

# Kit MuleSoft depuis Mali
KIT_MULESOFT_URL=https://kit-mulesoft.herokuapp.com/api/v1
KIT_TIMEOUT=30000

# Mali spécifique
PAYS_CODE=MLI
PAYS_NOM=Mali
VILLE_NAME=Bamako
PAYS_ROLE=PAYS_DESTINATION
PAYS_TYPE=HINTERLAND
```

### **Déploiement Vercel Mali**

```json
// vercel.json
{
  "version": 2,
  "builds": [{"src": "server.js", "use": "@vercel/node"}],
  "routes": [{"src": "/(.*)", "dest": "server.js"}]
}
```

### **Scripts npm Mali**

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "local": "node server.js", 
    "test": "curl http://localhost:3002/api/health"
  }
}
```

---

## 🔧 **Maintenance et Dépannage Mali**

### **Problèmes courants Mali**

**❌ Kit MuleSoft inaccessible depuis Mali**
```bash
# Vérifier connectivité depuis Bamako
curl http://localhost:8080/api/v1/health

# Forcer mode local Mali
KIT_MULESOFT_URL="" npm start
```

**❌ Port Mali déjà utilisé**
```bash
# Changer port Mali
PORT=3003 npm start
```

**❌ Erreur workflow Mali**
```javascript
// Vérifier statuts workflow Mali
const erreurs = [
  'ÉTAPE 6: Manifeste non reçu depuis Kit',
  'ÉTAPE 7: Documents GUCE Mali manquants',
  'ÉTAPE 14: Paiement BCEAO échoué'
];
```

### **Mode dégradé Mali**

Le système Mali fonctionne même sans Kit MuleSoft :
- ✅ **Interface web** : Complètement fonctionnelle
- ✅ **Workflow manuel** : Étapes 7-14 disponibles
- ⚠️ **Réception manifestes** : Bloquée (ÉTAPE 6)
- ⚠️ **Transmission** : Bloquée (ÉTAPES 15-16)

---

## 📚 **Documentation complémentaire Mali**

### **Références UEMOA**

- 📄 **Rapport PDF** : Étude interconnexion systèmes douaniers
- 🔗 **Figure 19** : Architecture fonctionnelle libre pratique
- 🔗 **Figure 20** : Scénario technique transit
- 📋 **Étapes Mali** : 6-16 (libre pratique) + 11,13-14 (transit)

### **Standards supportés**

- ✅ **Format UEMOA 2025.1** : Compatible avec Kit MuleSoft
- ✅ **Codes pays** : MLI (Mali), SEN (Sénégal), etc.
- ✅ **Workflow Manuel** : Conforme rapport PDF Mali
- ✅ **API REST** : Intégration Kit MuleSoft

### **Écosystème complet**

1. **🇸🇳 Simulateur Sénégal** - Pays A de prime abord
2. **🇲🇱 Simulateur Mali** (ce projet) - Pays B destination
3. **🔗 Kit MuleSoft** - Interconnexion UEMOA
4. **🏛️ Commission UEMOA** - Supervision centrale

---

## 👥 **Équipe et Support**

**Développé par** : Cabinet Jasmine Conseil  
**Conformité** : Rapport PDF UEMOA - Interconnexion SI Douaniers  
**Version** : 1.0.0-UEMOA-MALI  
**Format** : UEMOA 2025.1  
**Runtime** : Node.js 18.x  

**Contact technique** : Douanes Mali - Bamako  
**Support** : Interface web avec diagnostic intégré

**Rôle Mali** : Pays de destination hinterland - Traitement manuel conforme rapport PDF

---

*Simulateur Mali - Bamako - Pays de Destination UEMOA*