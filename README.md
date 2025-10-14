# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination UEMOA** - Implémentation conforme au rapport PDF d'interconnexion des systèmes douaniers

---

## 📋 Vue d'ensemble

Simulateur complet du système douanier du **Mali (Pays B - Pays de destination)** selon l'architecture UEMOA. Le Mali, en tant que pays hinterland, traite les déclarations douanières pour les marchandises provenant du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

### 🎯 Rôle dans l'écosystème UEMOA

- **Pays** : Mali (Code : MLI)
- **Ville** : Bamako
- **Rôle** : Pays de destination hinterland (Pays B)
- **Bureau principal** : Douanes Mali - Bamako
- **Fonction** : Traitement manuel des déclarations (étapes 6-16)
- **Interconnexion** : Sénégal → Kit MuleSoft → **Mali** → Commission UEMOA

---

## 🚀 Démarrage rapide

### Installation et lancement

```bash
# Installation des dépendances
npm install

# Démarrage du serveur
npm start

# Le serveur démarre sur http://localhost:3002
```

### URLs disponibles

| Service | URL | Description |
|---------|-----|-------------|
| 🖥️ **Interface web** | http://localhost:3002 | Dashboard interactif Mali |
| 🏥 **Health check** | http://localhost:3002/api/health | État du système |
| 📊 **Statistiques** | http://localhost:3002/api/statistiques | Métriques workflow |
| 📥 **Réception manifestes** | http://localhost:3002/api/manifeste/reception | Réception depuis Sénégal |

---

## 🔥 Workflows implémentés

### 📦 Workflow Libre Pratique (21 étapes totales)

Le Mali implémente les **étapes 6 à 16** en **mode MANUEL** :

#### ÉTAPE 6 : Réception automatique
- ✅ Réception manifeste depuis Kit MuleSoft (Sénégal)
- ✅ Enregistrement dans base locale Mali
- ✅ Validation format UEMOA

#### ÉTAPES 7-16 : Traitement manuel par agents maliens

| Étape | Description | Responsable | Type |
|-------|-------------|-------------|------|
| **7** | Collecte documents pré-dédouanement (GUCE Mali) | Opérateur économique | 👤 Manuel |
| **8** | Établissement déclaration douanière | Déclarant malien | 👤 Manuel |
| **9-10** | Contrôles recevabilité + Calcul devis | Agent douanes Mali | 👤 Manuel |
| **11** | Enregistrement déclaration détaillée | Agent enregistrement | 👤 Manuel |
| **12-13** | Contrôles douaniers + Bulletin liquidation | Agent contrôleur | 👤 Manuel |
| **14** | Paiement droits et taxes (BCEAO/Trésor) | Importateur | 👤 Manuel |
| **15-16** | Transmission données vers Kit MuleSoft | Système Mali | ✅ Auto |

### 🚛 Workflow Transit (16 étapes totales)

Le Mali gère les **étapes 11, 13-14** pour le transit :

| Étape | Description | Action |
|-------|-------------|--------|
| **11** | Réception déclaration transit | Enregistrement bureau Mali |
| **13** | Arrivée marchandises au bureau Mali | Contrôle physique et visa |
| **14** | Message arrivée vers Kit MuleSoft | Notification Sénégal |

---

## 🛠️ Architecture technique

### Structure du projet

```
simulateur-mali/
├── api/                          # Endpoints REST
│   ├── health.js                # ✅ Health check système
│   ├── statistiques.js          # 📊 Métriques et performance
│   ├── manifeste/
│   │   ├── reception.js         # 📥 ÉTAPE 6 : Réception
│   │   └── lister.js            # 📋 Liste manifestes
│   ├── declaration/
│   │   ├── lister.js            # 📋 ÉTAPE 8 : Liste déclarations
│   │   └── soumettre.js         # 📤 ÉTAPES 15-16 : Soumission Kit
│   ├── paiement/
│   │   ├── effectuer.js         # 💳 ÉTAPE 14 : Paiement
│   │   └── lister.js            # 📋 Liste paiements
│   ├── workflow/
│   │   └── manuel.js            # 🎮 Workflow interactif (étapes 7-16)
│   └── kit/
│       └── test.js              # 🔧 Tests Kit MuleSoft
├── lib/                          # Librairies métier
│   ├── database.js              # 🗄️ Base de données Mali
│   └── kit-client.js            # 🔗 Client Kit MuleSoft
├── public/                       # Interface web
│   ├── index.html               # 🖥️ Dashboard Mali
│   ├── script.js                # ⚙️ JavaScript frontend
│   └── style.css                # 🎨 Styles CSS
├── server.js                     # 🚀 Serveur HTTP principal
├── package.json                  # 📦 Configuration npm
└── README.md                     # 📚 Documentation
```

### Configuration technique

- **Runtime** : Node.js 18.x+
- **Port** : 3002 (configurable via PORT)
- **Format** : UEMOA 2025.1 compatible
- **Mode workflow** : MANUEL (conforme rapport PDF)
- **Kit MuleSoft** : http://localhost:8080/api/v1

---

## 📊 APIs et Services

### 1. Health Check - `/api/health`

**Méthode** : `GET`  
**Description** : Vérification état système et connectivité Kit MuleSoft

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

### 2. Réception Manifeste - `/api/manifeste/reception`

**Méthode** : `POST`  
**Description** : ÉTAPE 6 - Réception manifeste depuis Kit MuleSoft

**Headers requis** :
```http
Content-Type: application/json
X-Source-Country: SEN
X-Source-System: KIT_MULESOFT
X-Correlation-ID: [UUID]
```

**Exemple de payload** :
```json
{
  "manifeste": {
    "numeroOrigine": "SEN_5016_2025",
    "transporteur": "MAERSK LINE",
    "navire": "MARCO POLO",
    "portOrigine": "Port de Dakar",
    "dateArrivee": "2025-01-15"
  },
  "marchandises": [{
    "position": 1,
    "designation": "Véhicule Toyota",
    "importateur": "IMPORT SARL BAMAKO",
    "valeurEstimee": 1500000
  }]
}
```

### 3. Workflow Manuel - `/api/workflow/manuel` ⭐ NOUVEAU

**Méthode** : `POST`  
**Description** : Exécution des étapes manuelles du workflow Mali (7-16)

**Actions disponibles** :

| Action | Étape | Description |
|--------|-------|-------------|
| `collecter_documents_guce` | 7 | Collecte documents GUCE Mali |
| `creer_declaration` | 8 | Création déclaration par déclarant |
| `controler_et_calculer_devis` | 9-10 | Contrôles + calcul devis |
| `enregistrer_declaration` | 11 | Enregistrement déclaration |
| `effectuer_controles_liquidation` | 12-13 | Contrôles + liquidation |
| `effectuer_paiement` | 14 | Paiement droits et taxes |
| `transmettre_vers_kit` | 15-16 | Transmission Kit MuleSoft |
| `workflow_complet_auto` | 7-16 | Exécution automatique complète |

**Exemple - ÉTAPE 7** :
```json
{
  "action": "collecter_documents_guce",
  "manifesteId": "MALI_REC_123456",
  "donnees": {
    "connaissement": "BL_2025_001",
    "factureCommerciale": "FC_2025_001",
    "declarantMalien": "DECLARANT_MALI_SARL"
  }
}
```

**Exemple - ÉTAPE 14** :
```json
{
  "action": "effectuer_paiement",
  "manifesteId": "MALI_REC_123456",
  "donnees": {
    "referencePaiement": "PAY_MLI_2025_001",
    "modePaiement": "VIREMENT_BCEAO"
  }
}
```

**Exemple - Workflow complet** :
```json
{
  "action": "workflow_complet_auto",
  "manifesteId": "MALI_REC_123456",
  "donnees": {
    "agentMalien": "AGENT_MALI_AUTO",
    "modeExecution": "AUTOMATIQUE"
  }
}
```

### 4. Soumission Déclaration - `/api/declaration/soumettre`

**Méthode** : `POST`  
**Description** : ÉTAPES 14-16 - Soumission déclaration et paiement vers Kit

**Exemple** :
```json
{
  "numeroDeclaration": "DEC-MLI-2025-001",
  "manifesteOrigine": "5016",
  "montantPaye": 250000,
  "referencePaiement": "PAY-MLI-2025-001",
  "paysDeclarant": "MLI",
  "bureauDecl": "10S_BAMAKO",
  "articles": [...]
}
```

### 5. Statistiques - `/api/statistiques`

**Méthode** : `GET`  
**Description** : Métriques détaillées du workflow Mali

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
  },
  "performance": {
    "tauxAutomatisation": "0%",
    "tempsTraitementMoyen": 180
  }
}
```

---

## 🗄️ Base de données embarquée Mali

### Modèle de données workflow Manuel

```javascript
const workflowMali = {
  // ÉTAPE 6
  manifestesRecus: Map(),           // Manifestes depuis Kit
  
  // ÉTAPE 7
  documentsGUCE: Map(),             // Documents GUCE Mali
  
  // ÉTAPE 8
  declarationsCreees: Map(),        // Déclarations maliens
  
  // ÉTAPES 9-10
  declarationsControlees: Map(),    // Contrôles + devis
  
  // ÉTAPE 11
  declarationsEnregistrees: Map(),  // Déclarations détaillées
  
  // ÉTAPES 12-13
  liquidations: Map(),              // Contrôles + bulletins
  
  // ÉTAPE 14
  paiements: Map(),                 // Paiements BCEAO/Trésor
  
  // ÉTAPES 15-16
  transmissionsKit: Map()           // Transmission Kit
};
```

### États workflow Mali

| Statut | Étape | Description |
|--------|-------|-------------|
| `RECU_AU_MALI` | 6 | Manifeste reçu depuis Kit |
| `DOCUMENTS_GUCE_COLLECTES` | 7 | Documents GUCE collectés |
| `DECLARATION_CREEE` | 8 | Déclaration créée |
| `CONTROLEE_ET_DEVIS_CALCULE` | 9-10 | Contrôles + devis |
| `ENREGISTREE_MALI` | 11 | Déclaration enregistrée |
| `LIQUIDEE_MALI` | 12-13 | Contrôles + bulletin |
| `PAYEE_MALI` | 14 | Droits et taxes payés |
| `TRANSMIS_VERS_KIT` | 15-16 | Transmis vers Kit |

---

## 🔧 Kit MuleSoft Integration

### Configuration connexion Mali

```javascript
const KitClientMali = {
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 30000,
  paysCode: 'MLI',
  paysRole: 'PAYS_DESTINATION',
  headers: {
    'X-Source-Country': 'MLI',
    'X-Source-System': 'MALI_DOUANES_BAMAKO'
  }
};
```

### Méthodes principales

#### 1. Soumission déclaration Mali
```javascript
await kitClient.soumettreDeclarationMali({
  numeroDeclaration: 'DEC-MLI-2025-001',
  manifesteOrigine: 'SEN_5016_2025',
  montantPaye: 250000,
  articles: [...]
});
```

#### 2. Transit - Confirmation arrivée
```javascript
await kitClient.confirmerArriveeTransit('TRANS-001', {
  controleEffectue: true,
  conformiteItineraire: true
});
```

#### 3. Vérification santé
```javascript
const status = await kitClient.verifierSante();
// { accessible: true, status: 'UP', latence: 150 }
```

---

## 🎨 Interface utilisateur Mali

### Fonctionnalités principales

1. **Dashboard Mali spécialisé**
   - Visualisation workflow manuel (étapes 6-16)
   - Statistiques temps réel
   - Statut connexion Kit MuleSoft

2. **Workflow interactif ⭐ NOUVEAU**
   - Modales pour chaque étape manuelle
   - Formulaires de saisie contextuels
   - Exécution étape par étape ou workflow complet
   - Affichage détaillé des résultats

3. **Portail GUCE Mali intégré**
   - Accès direct : `https://guce.gov.ml/portal`
   - Collecte documents (ÉTAPE 7)

4. **Gestion des manifestes**
   - Liste des manifestes reçus
   - Sélection pour traitement
   - Suivi progression workflow

5. **Suivi déclarations et paiements**
   - Liste déclarations créées
   - État liquidations
   - Historique paiements BCEAO

### Exemple d'utilisation interface

```
1. Simuler réception manifeste (test) → ÉTAPE 6
2. Sélectionner le manifeste dans la liste
3. Cliquer "ÉTAPE 7 - Collecter Documents GUCE"
4. Remplir le formulaire de documents
5. Continuer étapes 8-16 ou exécuter workflow complet
6. Visualiser les résultats détaillés
```

---

## 🚛 Support Transit Mali

### ÉTAPE 11 : Réception déclaration transit

```javascript
const declarationTransit = {
  numeroDeclaration: "TRA-SEN-2025-001",
  paysDepart: "SEN",
  paysDestination: "MLI",
  transporteur: "TRANSPORT SAHEL",
  itineraire: "Dakar-Bamako via Kayes",
  delaiRoute: "72 heures"
};
```

### ÉTAPE 13 : Arrivée marchandises

```javascript
const arriveeData = {
  bureauArrivee: "BAMAKO_DOUANES",
  dateArrivee: "2025-01-18T10:30:00Z",
  controleEffectue: true,
  conformiteItineraire: true
};
```

### ÉTAPE 14 : Message arrivée vers Kit

```javascript
const messageArrivee = {
  numeroDeclaration: "TRA-SEN-2025-001",
  confirmationArrivee: true,
  agentReceptionnaire: "AGENT_MALI_BAMAKO"
};
```

---

## 📈 Monitoring et Observabilité

### Health Check

```bash
curl http://localhost:3002/api/health
```

**Contrôles effectués** :
- ✅ Service Mali actif
- ✅ Kit MuleSoft accessible
- ✅ Base de données opérationnelle
- ✅ Workflow manuel supporté

### Métriques disponibles

- **Volume** : Manifestes, déclarations, paiements
- **Performance** : Temps traitement moyen
- **Workflow** : Progression étapes 6-16
- **Erreurs** : Échecs traitement
- **Financier** : Montants acquittés BCEAO

### Logs structurés

```javascript
console.log('🇲🇱 [MALI] ÉTAPE 6 TERMINÉE: Manifeste reçu');
console.log('🇲🇱 [MALI] ÉTAPE 7: Collecte GUCE requise');
console.log('🇲🇱 [MALI] ÉTAPE 14: Paiement effectué');
console.log('🇲🇱 [MALI] ÉTAPES 15-16 TERMINÉES: Transmission réussie');
```

---

## 🔒 Sécurité et Authentification

### Headers sécurité Mali

```http
# Identification système
X-Source-Country: MLI
X-Source-System: MALI_DOUANES_BAMAKO
X-Destination-Role: PAYS_DESTINATION

# Tracking workflow
X-Correlation-ID: MLI_2025_001_123456789
X-Workflow-Step: 6_RECEPTION_MANIFESTE

# Paiement (étape 14)
X-Payment-Reference: PAY-MLI-2025-001
X-Payment-System: BCEAO_MALI
```

### CORS configuré

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Source-Country, 
  X-Correlation-ID, X-Payment-Reference
```

---

## 🧪 Tests et Validation

### Tests automatiques

```bash
# Test health check
curl http://localhost:3002/api/health

# Test réception manifeste
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -d @test-manifeste.json

# Test workflow manuel étape 7
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{
    "action": "collecter_documents_guce",
    "manifesteId": "MALI_REC_123456",
    "donnees": {
      "connaissement": "BL_TEST",
      "declarantMalien": "DECLARANT_TEST"
    }
  }'

# Test Kit MuleSoft
curl http://localhost:3002/api/kit/test?type=health
```

### Validation workflow Mali

1. **ÉTAPE 6** : Réception manifeste → Vérifier enregistrement
2. **ÉTAPES 7-16** : Simuler workflow manuel → Vérifier progression
3. **Intégration** : Workflow Sénégal→Mali→Kit→Sénégal complet

---

## 🚀 Déploiement

### Variables d'environnement

```env
# Configuration serveur Mali
PORT=3002
NODE_ENV=production

# Kit MuleSoft
KIT_MULESOFT_URL=https://kit-mulesoft.herokuapp.com/api/v1
KIT_TIMEOUT=30000

# Mali spécifique
PAYS_CODE=MLI
PAYS_NOM=Mali
VILLE_NAME=Bamako
PAYS_ROLE=PAYS_DESTINATION
PAYS_TYPE=HINTERLAND
```

### Déploiement Vercel

```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel --prod
```

### Scripts npm

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

## 🔧 Maintenance et Dépannage

### Problèmes courants

**❌ Kit MuleSoft inaccessible**
```bash
# Vérifier connectivité
curl http://localhost:8080/api/v1/health

# Mode local sans Kit
KIT_MULESOFT_URL="" npm start
```

**❌ Port Mali utilisé**
```bash
# Changer port
PORT=3003 npm start
```

**❌ Erreur workflow**
- Vérifier manifeste sélectionné
- Valider données formulaires
- Consulter logs serveur

### Mode dégradé

Le système Mali fonctionne même sans Kit MuleSoft :
- ✅ Interface web complète
- ✅ Workflow manuel (étapes 7-14)
- ⚠️ Réception manifestes bloquée (étape 6)
- ⚠️ Transmission bloquée (étapes 15-16)

---

## 📚 Documentation complémentaire

### Références UEMOA

- 📄 **Rapport PDF** : Étude interconnexion systèmes douaniers
- 🔗 **Figure 19** : Architecture fonctionnelle libre pratique
- 🔗 **Figure 20** : Scénario technique transit
- 📋 **Étapes Mali** : 6-16 (libre pratique) + 11,13-14 (transit)

### Standards supportés

- ✅ Format UEMOA 2025.1
- ✅ Codes pays ISO (MLI, SEN, etc.)
- ✅ Workflow Manuel conforme rapport PDF
- ✅ API REST pour Kit MuleSoft

### Écosystème complet

1. **🇸🇳 Simulateur Sénégal** - Pays A de prime abord (étapes 1-5, 17-21)
2. **🇲🇱 Simulateur Mali** (ce projet) - Pays B destination (étapes 6-16)
3. **🔗 Kit MuleSoft** - Interconnexion UEMOA
4. **🏛️ Commission UEMOA** - Supervision centrale

---

## 👥 Support et Contact

**Développé par** : Cabinet Jasmine Conseil  
**Conformité** : Rapport PDF UEMOA - Interconnexion SI Douaniers  
**Version** : 1.0.0-UEMOA-MALI  
**Format** : UEMOA 2025.1  
**Runtime** : Node.js 18.x+

**Contact technique** : Douanes Mali - Bamako  
**Support** : Interface web avec diagnostic intégré

**Rôle Mali** : Pays de destination hinterland - Traitement manuel conforme rapport PDF UEMOA

---

*Simulateur Mali - Bamako - Pays de Destination UEMOA - Workflow Manuel Étapes 6-16*
