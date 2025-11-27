# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination UEMOA** | Workflow Manuel Interactif | Étapes 6-16

---

## 📋 Vue d'Ensemble

Simulateur du système douanier du **Mali (Bamako)** dans le cadre de l'interconnexion UEMOA. Le Mali agit comme **pays de destination** (hinterland) et traite manuellement les déclarations douanières pour les marchandises provenant du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

### Caractéristiques Clés
- **Pays** : Mali (MLI) - Bamako
- **Rôle** : Pays de destination (hinterland)
- **Mode** : Workflow MANUEL avec interface interactive
- **Interconnexion** : Sénégal → Kit MuleSoft → Mali → Kit MuleSoft → Sénégal
- **Conformité** : Rapport PDF UEMOA 2025.1

---

## ⚡ Démarrage Ultra-Rapide

**Pour les utilisateurs pressés :**

```bash
# 1. Cloner et installer
git clone <URL> pays-b-simulator && cd pays-b-simulator
npm install

# 2. Lancer en HTTP
npm start
# Accès : http://localhost:3002

# 3. Pour HTTPS (optionnel)
cd ssl-certs
openssl genrsa -out key.pem 4096
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config openssl.cnf
cd ..
npm start
# Accès HTTPS : https://localhost:3444
```

**📖 Pour plus de détails, voir les sections complètes ci-dessous.**

---

## 🚀 Guide de Prise en Main

### Prérequis

- **Node.js** : Version 18.x ou supérieure (recommandé 22.x)
- **npm** : Inclus avec Node.js
- **Git** : Pour cloner le projet
- **OpenSSL** : Pour générer les certificats SSL (généralement pré-installé sur Linux/Mac)

### Installation

#### 1. Cloner le Projet

```bash
# Depuis un serveur (ex: Digital Ocean)
git clone <URL_DU_REPO> pays-b-simulator
cd pays-b-simulator

# Ou depuis votre machine locale
cd simulateurs/pays-b-simulator
```

#### 2. Installer les Dépendances

```bash
npm install
```

#### 3. Configuration des Certificats SSL (Optionnel - pour HTTPS)

Le serveur peut fonctionner en **HTTP** ou **HTTPS**. Pour activer HTTPS, vous devez générer des certificats SSL.

##### Génération des Certificats SSL Auto-Signés

**Méthode 1 : Script automatique (Recommandé)**

```bash
# Sur Linux/Mac
chmod +x generate-ssl.sh
./generate-ssl.sh

# Sur Windows (PowerShell)
.\generate-ssl.ps1
```

**Méthode 2 : Génération manuelle**

```bash
# Se placer dans le dossier ssl-certs
cd ssl-certs

# Générer la clé privée
openssl genrsa -out key.pem 4096

# Générer le certificat auto-signé (valide 365 jours)
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config openssl.cnf

# Retourner à la racine du projet
cd ..
```

**Note** : Les certificats auto-signés génèrent un avertissement dans le navigateur. Pour un environnement de production, utilisez des certificats signés par une autorité de certification (Let's Encrypt, etc.).

##### Vérification des Certificats

```bash
# Sur Linux/Mac
ls -la ssl-certs/
# Vous devriez voir : cert.pem et key.pem

# Sur Windows
dir ssl-certs\
```

### Démarrage de l'Application

#### Mode HTTP (Par Défaut)

```bash
# Méthode 1 : Utiliser npm start
npm start

# Méthode 2 : Utiliser npm run dev
npm run dev

# Méthode 3 : Lancer directement
node server.js
```

Le serveur démarre sur **http://localhost:3002** (ou l'IP de votre serveur).

**URLs disponibles en HTTP :**
- Dashboard : `http://localhost:3002`
- Libre Pratique : `http://localhost:3002/libre-pratique.html`
- Transit : `http://localhost:3002/transit.html`
- Health Check : `http://localhost:3002/api/health`
- Statistiques : `http://localhost:3002/api/statistiques`

#### Mode HTTPS

##### Option 1 : HTTPS avec Certificats Existants

Si les certificats `ssl-certs/cert.pem` et `ssl-certs/key.pem` existent, le serveur démarre automatiquement en HTTPS :

```bash
npm start
```

Le serveur démarre sur :
- **HTTP** : `http://localhost:3002` (ou port personnalisé)
- **HTTPS** : `https://localhost:3444` (ou port personnalisé)

##### Option 2 : Forcer HTTPS via Variable d'Environnement

```bash
# Activer HTTPS même si les certificats n'existent pas (générera une erreur)
USE_HTTPS=true npm start
```

##### Option 3 : HTTPS avec Redirection HTTP → HTTPS

```bash
# Activer la redirection automatique HTTP vers HTTPS
REDIRECT_TO_HTTPS=true npm start
```

**URLs disponibles en HTTPS :**
- Dashboard : `https://localhost:3444`
- Libre Pratique : `https://localhost:3444/libre-pratique.html`
- Transit : `https://localhost:3444/transit.html`
- Health Check : `https://localhost:3444/api/health`

**⚠️ Important - Certificat Auto-Signé :**
- Le navigateur affichera un avertissement de sécurité
- **Chrome/Edge** : Cliquez "Avancé" puis "Continuer vers le site"
- **Firefox** : Cliquez "Accepter le risque et continuer"

#### Configuration Avancée via Variables d'Environnement

```bash
# Personnaliser les ports
HTTP_PORT=3002 HTTPS_PORT=3444 npm start

# Activer HTTPS avec redirection
USE_HTTPS=true REDIRECT_TO_HTTPS=true npm start

# Configuration complète
HTTP_PORT=3002 HTTPS_PORT=3444 USE_HTTPS=true REDIRECT_TO_HTTPS=false npm start
```

### URLs Principales

| Service | URL HTTP | URL HTTPS | Description |
|---------|----------|-----------|-------------|
| Dashboard | http://localhost:3002 | https://localhost:3444 | Interface principale |
| Libre Pratique | http://localhost:3002/libre-pratique.html | https://localhost:3444/libre-pratique.html | Workflow étapes 6-16 |
| Transit | http://localhost:3002/transit.html | https://localhost:3444/transit.html | Workflow transit |
| Health Check | http://localhost:3002/api/health | https://localhost:3444/api/health | Statut système |
| Statistiques | http://localhost:3002/api/statistiques | https://localhost:3444/api/statistiques | Métriques |

---

## 🔥 Workflows Implémentés

### 📦 1. Workflow Libre Pratique (Étapes 6-16)

Traitement complet d'un manifeste reçu du Sénégal jusqu'à la transmission de l'autorisation.

| Étape | Description | Type | API |
|-------|-------------|------|-----|
| **6** | Réception manifeste depuis Kit | ✅ Auto | `POST /api/manifeste/reception` |
| **7** | Collecte documents GUCE Mali | 👤 Manuel | `POST /api/workflow/manuel` |
| **8** | Création déclaration | 👤 Manuel | `POST /api/workflow/manuel` |
| **9-10** | Contrôles + Calcul devis | 👤 Manuel | `POST /api/workflow/manuel` |
| **11** | Enregistrement déclaration | 👤 Manuel | `POST /api/workflow/manuel` |
| **12-13** | Contrôles douaniers + Liquidation | 👤 Manuel | `POST /api/workflow/manuel` |
| **14** | Paiement droits et taxes | 👤 Manuel | `POST /api/paiement/effectuer` |
| **15-16** | Transmission autorisation vers Kit | ✅ Auto | `POST /api/declaration/soumettre` |

**Flux de données** :
```
Sénégal → Kit MuleSoft → [Étape 6] Mali reçoit manifeste
                         [Étapes 7-14] Traitement manuel Mali
                         [Étapes 15-16] Mali → Kit MuleSoft → Sénégal
```

### 🚛 2. Workflow Transit (Étapes 11, 13-14)

Gestion des marchandises en transit vers le Mali.

| Étape | Description | API |
|-------|-------------|-----|
| **11** | Réception déclaration transit | `POST /api/transit/copie` |
| **13** | Arrivée marchandises au bureau Mali | `POST /api/transit/arrivee` |
| **14** | Message arrivée vers Kit | `POST /api/transit/arrivee` |

---

## 🛠️ Architecture Technique

```
simulateur-mali/
├── api/                          # Endpoints REST
│   ├── health.js                # État système
│   ├── statistiques.js          # Métriques
│   ├── manifeste/
│   │   ├── reception.js         # Étape 6
│   │   └── lister.js            # Liste manifestes
│   ├── workflow/
│   │   └── manuel.js            # Étapes 7-16
│   ├── documents-guce/
│   │   └── lister.js            # Documents GUCE
│   ├── declaration/
│   │   ├── lister.js            # Liste déclarations
│   │   └── soumettre.js         # Étapes 15-16
│   ├── paiement/
│   │   ├── effectuer.js         # Étape 14
│   │   └── lister.js            # Liste paiements
│   ├── transit/
│   │   ├── copie.js             # Étape 11
│   │   ├── arrivee.js           # Étapes 13-14
│   │   └── lister.js            # Liste transits
│   └── auth/
│       ├── login.js             # Authentification
│       ├── logout.js            # Déconnexion
│       └── verify.js            # Vérification token
├── lib/
│   ├── database.js              # Base de données Mali
│   └── kit-client.js            # Client Kit MuleSoft
├── public/                       # Interface web
│   ├── libre-pratique.html      # Interface principale
│   ├── transit.html             # Interface transit
│   ├── script.js                # Logique frontend
│   └── auth.js                  # Gestion auth
└── server.js                     # Serveur HTTP Node.js
```

**Stack** : Node.js 18+, Vanilla JS, HTTP natif, Port 3002

---

## 📖 Comprendre l'Application

### Architecture Générale

Cette application simule le **système douanier du Mali** dans le cadre de l'interconnexion UEMOA. Elle fonctionne comme un **pays de destination** (hinterland) qui reçoit des manifestes du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

```
┌─────────────────┐
│  Sénégal (Dakar)│
│  Port d'Origine  │
└────────┬─────────┘
         │
         │ Manifeste
         ▼
┌─────────────────┐
│ Kit MuleSoft    │
│ Interconnexion  │
└────────┬─────────┘
         │
         │ Étape 6: Réception manifeste
         ▼
┌─────────────────┐
│  Mali (Bamako)  │ ◄─── Cette Application
│ Pays Destination│
│  Étapes 6-16    │
└────────┬─────────┘
         │
         │ Étape 15-16: Transmission autorisation
         ▼
┌─────────────────┐
│ Kit MuleSoft    │
│ Interconnexion  │
└────────┬─────────┘
         │
         │ Retour vers Sénégal
         ▼
┌─────────────────┐
│  Sénégal (Dakar)│
└─────────────────┘
```

### Flux de Données

1. **Réception** (Étape 6) : Le Mali reçoit un manifeste du Sénégal via le Kit MuleSoft
2. **Traitement Manuel** (Étapes 7-14) : Les agents douaniers maliens traitent la déclaration
3. **Transmission** (Étapes 15-16) : Le Mali renvoie l'autorisation vers le Sénégal via le Kit

### Composants Principaux

#### 1. **Serveur (`server.js`)**
- Gère les requêtes HTTP et HTTPS
- Route les requêtes vers les APIs appropriées
- Sert les fichiers statiques (HTML, CSS, JS)
- Supporte les certificats SSL pour HTTPS

#### 2. **APIs (`api/`)**
- **`manifeste/`** : Réception et gestion des manifestes
- **`workflow/`** : Exécution du workflow manuel
- **`declaration/`** : Création et soumission des déclarations
- **`paiement/`** : Gestion des paiements
- **`transit/`** : Gestion des marchandises en transit
- **`auth/`** : Authentification des utilisateurs

#### 3. **Interface Web (`public/`)**
- **`index.html`** : Dashboard principal
- **`libre-pratique.html`** : Interface pour le workflow libre pratique
- **`transit.html`** : Interface pour le workflow transit
- **`script.js`** : Logique frontend
- **`auth.js`** : Gestion de l'authentification côté client

#### 4. **Bibliothèques (`lib/`)**
- **`database.js`** : Gestion de la base de données en mémoire
- **`kit-client.js`** : Client pour communiquer avec le Kit MuleSoft
- **`workflow-engine.js`** : Moteur d'exécution du workflow

### Modes de Fonctionnement

#### Mode HTTP
- **Port** : 3002 (par défaut)
- **Usage** : Développement local, tests
- **Sécurité** : Non chiffré (ne pas utiliser en production avec données sensibles)

#### Mode HTTPS
- **Port HTTP** : 3002 (par défaut)
- **Port HTTPS** : 3444 (par défaut)
- **Usage** : Production, environnement sécurisé
- **Sécurité** : Chiffré avec certificats SSL
- **Certificats** : Auto-signés (avertissement navigateur) ou signés par CA

### Workflow Manuel vs Automatique

#### Workflow Manuel (Étape par Étape)
- L'utilisateur exécute chaque étape individuellement
- Permet de tester chaque phase du processus
- Idéal pour comprendre le flux complet

#### Workflow Automatique
- Exécute toutes les étapes d'un coup
- Utile pour les tests rapides
- Action : `workflow_complet_auto`

### Base de Données

L'application utilise une **base de données en mémoire** (fichier `lib/database.js`). Les données sont stockées dans des objets JavaScript et sont perdues au redémarrage du serveur.

**Types de données stockées :**
- Manifestes reçus
- Documents GUCE collectés
- Déclarations créées
- Paiements effectués
- Transits en cours

**Note** : Pour la production, envisager une base de données persistante (PostgreSQL, MongoDB, etc.).

### Intégration avec le Kit MuleSoft

Le Kit MuleSoft est l'interface d'interconnexion entre les systèmes douaniers. L'application communique avec le Kit via :

- **URL** : `http://64.225.5.75:8086/api/v1` (configurable)
- **Méthodes** :
  - `soumettreDeclarationMali()` : Envoi des déclarations
  - `confirmerArriveeTransit()` : Confirmation d'arrivée
  - `verifierSante()` : Vérification de la connectivité

### Sécurité et Authentification

- **Comptes de démonstration** : Voir section "Interface Utilisateur"
- **Tokens JWT** : Utilisés pour l'authentification
- **Headers requis** : `X-Source-Country`, `X-Source-System`, `X-Correlation-ID`
- **CORS** : Configuré pour permettre les requêtes cross-origin

---

## 📊 Services API Détaillés

### 1. Health & Statistiques

#### GET `/api/health`
État du système Mali et connexion Kit MuleSoft.

**Réponse** :
```json
{
  "service": "Système Douanier Mali (Bamako)",
  "status": "UP",
  "pays": {
    "code": "MLI",
    "nom": "Mali",
    "role": "PAYS_DESTINATION"
  },
  "kit": {
    "accessible": true,
    "latence": 245
  }
}
```

#### GET `/api/statistiques`
Métriques et statistiques du workflow Mali.

**Réponse** :
```json
{
  "statistiques": {
    "manifestesRecus": 10,
    "documentsGUCECollectes": 8,
    "declarationsCreees": 8,
    "paiementsEffectues": 6,
    "transmissionsKit": 5
  }
}
```

### 2. Workflow Libre Pratique

#### POST `/api/manifeste/reception`
**Étape 6** : Réception manifeste depuis Kit MuleSoft.

**Headers requis** :
```
X-Source-Country: SEN
X-Source-System: KIT_INTERCONNEXION
X-Correlation-ID: <ID unique>
```

**Body** :
```json
{
  "manifeste": {
    "numeroOrigine": "SEN_MAN_2025_001",
    "transporteur": "COMPAGNIE DAKAR-BAMAKO",
    "navire": "VESSEL_123",
    "portOrigine": "Port de Dakar",
    "dateArrivee": "2025-01-27"
  },
  "marchandises": [
    {
      "position": 1,
      "designation": "Véhicule",
      "poidsNet": 1500,
      "quantite": 1,
      "importateur": "IMPORT MALI SARL"
    }
  ]
}
```

#### POST `/api/workflow/manuel`
**Étapes 7-16** : Exécution du workflow manuel Mali.

**Actions disponibles** :
- `collecter_documents_guce` (Étape 7)
- `creer_declaration` (Étape 8)
- `controler_et_calculer_devis` (Étapes 9-10)
- `enregistrer_declaration` (Étape 11)
- `effectuer_controles_liquidation` (Étapes 12-13)
- `effectuer_paiement` (Étape 14)
- `transmettre_vers_kit` (Étapes 15-16)
- `workflow_complet_auto` (Toutes les étapes)

**Body exemple** :
```json
{
  "action": "creer_declaration",
  "manifesteId": "MALI_REC_1737987654321",
  "donnees": {
    "declarantMalien": "DECLARANT_MALI_SARL",
    "articles": [
      {
        "codeSh": "8703210000",
        "designationCom": "Véhicule Toyota",
        "valeurCaf": 5000000,
        "nbreColis": 1
      }
    ]
  }
}
```

#### POST `/api/paiement/effectuer`
**Étape 14** : Paiement des droits et taxes.

**Body** :
```json
{
  "numeroDeclaration": "DEC_MLI_2025_001",
  "montantPaye": 750000,
  "modePaiement": "VIREMENT_BCEAO"
}
```

#### POST `/api/declaration/soumettre`
**Étapes 15-16** : Transmission vers Kit MuleSoft.

**Body** :
```json
{
  "numeroDeclaration": "DEC_MLI_2025_001",
  "manifesteOrigine": "SEN_MAN_2025_001",
  "montantPaye": 750000,
  "referencePaiement": "PAY_MLI_001",
  "articles": [...]
}
```

### 3. Workflow Transit

#### POST `/api/transit/copie`
**Étape 11** : Réception déclaration transit.

**Body** :
```json
{
  "transit_original": {
    "numero_declaration": "TRANS_SEN_001",
    "transporteur": "TRANSPORT SAHEL",
    "itineraire": "Dakar-Bamako"
  },
  "marchandises": [...]
}
```

#### POST `/api/transit/arrivee`
**Étapes 13-14** : Confirmation arrivée + Message vers Kit.

**Body** :
```json
{
  "transitId": "TRANS_MLI_001",
  "donneesArrivee": {
    "controleEffectue": true,
    "visaAppose": true,
    "conformiteItineraire": true
  }
}
```

---

## 💾 Structures de Données

### Manifeste Reçu
```javascript
{
  id: "MALI_REC_1737987654321",
  manifeste: {
    numeroOrigine: "SEN_MAN_2025_001",
    transporteur: "COMPAGNIE MARITIME",
    portOrigine: "Port de Dakar",
    dateArrivee: "2025-01-27"
  },
  marchandises: [...],
  dateReception: "2025-01-27T10:00:00.000Z",
  statut: "RECU_AU_MALI",
  etapeWorkflow: 6,
  paysOrigine: "SEN"
}
```

### Documents GUCE (Étape 7)
```javascript
{
  id: "GUCE_1737987654321",
  manifesteId: "MALI_REC_...",
  connaissement: "BL_2025_001",
  factureCommerciale: "FC_2025_001",
  declarationPrealable: "DP_2025_001",
  documentsBancaires: ["DB1", "DB2"],
  operateurEconomique: "OE_MALI_001",
  declarantMalien: "DECLARANT_MALI_SARL",
  dateCollecte: "2025-01-27T10:15:00.000Z",
  statut: "DOCUMENTS_COLLECTES"
}
```

### Déclaration (Étape 8)
```javascript
{
  id: "DEC_MLI_1737987654321",
  numeroDeclaration: "DEC_MLI_2025_001",
  manifesteId: "MALI_REC_...",
  declarantMalien: "DECLARANT_MALI_SARL",
  articles: [
    {
      numArt: 1,
      codeSh: "8703210000",
      designationCom: "Véhicule Toyota",
      valeurCaf: 5000000,
      liquidation: 750000
    }
  ],
  valeurTotaleDeclaree: 5000000,
  statut: "DECLARATION_CREEE",
  etapeWorkflow: 8
}
```

### Liquidation (Étapes 12-13)
```javascript
{
  id: "LIQ_MLI_1737987654321",
  declarationId: "DEC_MLI_...",
  numeroBulletin: "BL_MLI_2025_001",
  montantTotal: 750000, // en FCFA
  detailTaxes: [
    {
      article: "Véhicule Toyota",
      droitDouane: 750000,  // 15%
      tva: 900000,          // 18%
      redevance: 50000      // 1%
    }
  ],
  controleDouanier: {
    typeControle: "DOCUMENTAIRE",
    resultatControle: "CONFORME"
  },
  statut: "BULLETIN_EMIS"
}
```

### Paiement (Étape 14)
```javascript
{
  id: "PAY_MLI_1737987654321",
  declarationId: "DEC_MLI_...",
  referencePaiement: "PAY_MLI_2025_001",
  montantPaye: 750000,
  modePaiement: "VIREMENT_BCEAO",
  compteDestination: "TRESOR_MALI_BCEAO",
  datePaiement: "2025-01-27T11:00:00.000Z",
  statutPaiement: "CONFIRME"
}
```

### Transmission Kit (Étapes 15-16)
```javascript
{
  id: "TRANS_MLI_1737987654321",
  declarationId: "DEC_MLI_...",
  numeroDeclaration: "DEC_MLI_2025_001",
  manifesteOrigine: "SEN_MAN_2025_001",
  montantPaye: 750000,
  autorisationMainlevee: {
    autorise: true,
    montantAcquitte: 750000,
    dateAutorisation: "2025-01-27T11:30:00.000Z"
  },
  destinationKit: "SENEGAL_VIA_KIT-INTERCONNEXION",
  statut: "TRANSMIS_VERS_KIT"
}
```

---

## 🔗 Intégration Kit MuleSoft

### Configuration
```javascript
{
  baseURL: 'http://64.225.5.75:8086/api/v1',
  paysCode: 'MLI',
  paysRole: 'PAYS_DESTINATION'
}
```

### Méthodes Principales

#### `soumettreDeclarationMali(declaration)`
Étapes 15-16 : Envoi déclaration et autorisation vers Kit.

```javascript
await kitClient.soumettreDeclarationMali({
  numeroDeclaration: "DEC_MLI_2025_001",
  manifesteOrigine: "SEN_MAN_2025_001",
  montantPaye: 750000,
  referencePaiement: "PAY_MLI_001",
  articles: [...]
});
```

#### `confirmerArriveeTransit(transitId, donnees)`
Étape 14 transit : Envoi message arrivée.

```javascript
await kitClient.confirmerArriveeTransit("TRANS_MLI_001", {
  controleEffectue: true,
  visaAppose: true,
  conformiteItineraire: true
});
```

#### `verifierSante()`
Test connectivité Kit MuleSoft.

```javascript
const sante = await kitClient.verifierSante();
// { accessible: true, latence: 245, status: "UP" }
```

---

## 🎨 Interface Utilisateur

### Comptes de Démonstration

| Identifiant | Mot de passe | Workflows | Rôle |
|------------|--------------|-----------|------|
| `admin` | `admin123` | Tous | ADMIN_MALI |
| `douane_mali` | `mali2025` | Tous | AGENT_DOUANE_MALI |
| `lp_mali` | `lp123` | Libre pratique | OPERATEUR_LP_MALI |
| `transit_mali` | `transit123` | Transit | OPERATEUR_TRANSIT_MALI |
| `declarant` | `decl2025` | Tous | DECLARANT_MALI |

### Fonctionnalités Interface

1. **Workflow Interactif** : Modales pour chaque étape avec formulaires
2. **Portail GUCE Mali** : https://guce.gov.ml/portal
3. **Suivi en Temps Réel** : Manifestes, documents, déclarations, paiements
4. **Exécution Flexible** : Étape par étape OU workflow complet automatique
5. **Visualisation Workflow** : Progression visuelle des étapes 6-16

---

## 🧪 Tests et Simulation

### Tests via Interface Web

1. **Démarrer le serveur** (HTTP ou HTTPS)
2. **Ouvrir le navigateur** sur `http://localhost:3002` ou `https://localhost:3444`
3. **Se connecter** avec un compte de démonstration (voir section Interface Utilisateur)
4. **Tester le workflow** :
   - Cliquer "Simuler Réception Manifeste (Test)" pour créer un manifeste de test
   - Utiliser les boutons d'étapes pour exécuter le workflow manuel étape par étape
   - Ou utiliser "Workflow Complet Automatique" pour exécuter toutes les étapes d'un coup

### Tests via API (HTTP)

```bash
# Test Health Check
curl http://localhost:3002/api/health

# Test réception manifeste
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Source-System: KIT_INTERCONNEXION" \
  -H "X-Test-Mode: true" \
  -d '{
    "manifeste": {
      "numeroOrigine": "TEST_SEN_001",
      "transporteur": "COMPAGNIE TEST",
      "portOrigine": "Port de Dakar",
      "dateArrivee": "2025-01-27"
    },
    "marchandises": [{
      "position": 1,
      "designation": "Véhicule de test",
      "poidsNet": 1500,
      "quantite": 1
    }]
  }'

# Test workflow complet automatique
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{
    "action": "workflow_complet_auto",
    "manifesteId": "MALI_REC_..."
  }'

# Test statistiques
curl http://localhost:3002/api/statistiques
```

### Tests via API (HTTPS)

```bash
# Test Health Check (avec certificat auto-signé, ignorer l'avertissement)
curl -k https://localhost:3444/api/health

# Test réception manifeste
curl -k -X POST https://localhost:3444/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Source-System: KIT_INTERCONNEXION" \
  -d '{...}'
```

**Note** : L'option `-k` (ou `--insecure`) permet d'ignorer les erreurs de certificat auto-signé.

### Vérification du Fonctionnement

```bash
# Vérifier que le serveur répond
curl http://localhost:3002/api/health

# Vérifier les statistiques
curl http://localhost:3002/api/statistiques

# Tester la connexion au Kit MuleSoft
curl http://localhost:3002/api/kit/test?type=health
```

---

## 🚀 Déploiement

### Déploiement sur Digital Ocean (ou Serveur Linux)

#### 1. Connexion au Serveur

```bash
# Se connecter via SSH
ssh root@64.225.5.75
# ou avec votre utilisateur
ssh utilisateur@64.225.5.75
```

#### 2. Installation des Prérequis

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Vérifier l'installation
node --version  # Doit afficher v22.x.x
npm --version
```

#### 3. Cloner et Installer le Projet

```bash
# Cloner le projet
git clone <URL_DU_REPO> pays-b-simulator
cd pays-b-simulator

# Installer les dépendances
npm install
```

#### 4. Configuration des Certificats SSL (pour HTTPS)

```bash
# Méthode rapide avec script
chmod +x generate-ssl.sh
./generate-ssl.sh

# Ou méthode manuelle
cd ssl-certs
openssl genrsa -out key.pem 4096
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config openssl.cnf
chmod 600 key.pem
chmod 644 cert.pem
cd ..
```

#### 5. Démarrage en HTTP

```bash
# Méthode simple
npm start

# Ou avec variables d'environnement
HTTP_PORT=3002 npm start

# En arrière-plan avec nohup
nohup npm start > server.log 2>&1 &

# Ou avec PM2 (recommandé pour la production)
npm install -g pm2
pm2 start server.js --name "mali-simulator"
pm2 save
pm2 startup  # Pour démarrer automatiquement au boot
```

**Accès** : `http://64.225.5.75:3002`

#### 6. Démarrage en HTTPS

```bash
# Si les certificats existent, HTTPS démarre automatiquement
npm start

# Ou forcer HTTPS
USE_HTTPS=true npm start

# Avec redirection HTTP → HTTPS
USE_HTTPS=true REDIRECT_TO_HTTPS=true npm start

# En arrière-plan avec PM2
pm2 start server.js --name "mali-simulator-https" -- \
  --USE_HTTPS=true --HTTPS_PORT=3444
```

**Accès** : 
- HTTP : `http://64.225.5.75:3002`
- HTTPS : `https://64.225.5.75:3444`

#### 7. Configuration du Pare-feu

```bash
# Ouvrir les ports HTTP et HTTPS
ufw allow 3002/tcp
ufw allow 3444/tcp
ufw reload
```

#### 8. Vérification du Déploiement

```bash
# Depuis votre machine locale
curl http://64.225.5.75:3002/api/health

# Pour HTTPS (avec certificat auto-signé)
curl -k https://64.225.5.75:3444/api/health
```

### Variables d'Environnement

Créer un fichier `.env` (optionnel) :

```env
# Ports
HTTP_PORT=3002
HTTPS_PORT=3444

# Configuration HTTPS
USE_HTTPS=true
REDIRECT_TO_HTTPS=false

# Configuration Kit MuleSoft
KIT_MULESOFT_URL=http://64.225.5.75:8086/api/v1

# Configuration Pays
PAYS_CODE=MLI
PAYS_ROLE=PAYS_DESTINATION

# Environnement
NODE_ENV=production
```

**Note** : Le serveur fonctionne sans fichier `.env` grâce aux valeurs par défaut.

### Gestion avec PM2 (Recommandé)

```bash
# Installation globale de PM2
npm install -g pm2

# Démarrer l'application
pm2 start server.js --name "mali-simulator"

# Voir les logs
pm2 logs mali-simulator

# Redémarrer
pm2 restart mali-simulator

# Arrêter
pm2 stop mali-simulator

# Sauvegarder la configuration
pm2 save

# Démarrer au boot système
pm2 startup
```

### Docker (Optionnel)

```bash
# Construire l'image
docker build -t mali-douanes:latest .

# Lancer en HTTP
docker run -d -p 3002:3002 --name mali-simulator mali-douanes:latest

# Lancer en HTTPS (nécessite de monter les certificats)
docker run -d -p 3002:3002 -p 3444:3444 \
  -v $(pwd)/ssl-certs:/app/ssl-certs \
  --name mali-simulator mali-douanes:latest
```

### Vercel (Déploiement Cloud)

```bash
# Installation de Vercel CLI
npm install -g vercel

# Déploiement
vercel --prod
```

**Note** : Vercel gère automatiquement HTTPS avec certificats valides.

---

## 🔒 Sécurité & Headers

### Headers Requis
```http
X-Source-Country: MLI
X-Source-System: MALI_DOUANES_BAMAKO
X-Correlation-ID: MLI_2025_001_123456789
```

### CORS
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Source-*
```

---

## 🔧 Dépannage

### Problèmes de Démarrage

#### Le serveur ne démarre pas
```bash
# Vérifier que Node.js est installé
node --version

# Vérifier que les dépendances sont installées
npm install

# Vérifier les ports disponibles
netstat -tulpn | grep 3002
netstat -tulpn | grep 3444

# Vérifier les permissions
ls -la ssl-certs/
```

#### Erreur "Port already in use"
```bash
# Trouver le processus utilisant le port
lsof -i :3002
lsof -i :3444

# Tuer le processus
kill -9 <PID>

# Ou utiliser un autre port
HTTP_PORT=3003 HTTPS_PORT=3445 npm start
```

### Problèmes HTTPS

#### Erreur "Cannot find module 'ssl-certs/cert.pem'"
```bash
# Vérifier que les certificats existent
ls -la ssl-certs/cert.pem ssl-certs/key.pem

# Si absents, générer les certificats
cd ssl-certs
openssl genrsa -out key.pem 4096
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config openssl.cnf
cd ..
```

#### Avertissement de certificat dans le navigateur
- **Normal** : Les certificats auto-signés génèrent toujours un avertissement
- **Solution temporaire** : Cliquer "Avancé" puis "Continuer vers le site"
- **Solution permanente** : Utiliser Let's Encrypt avec Certbot pour un certificat valide

#### HTTPS ne démarre pas
```bash
# Vérifier les permissions des certificats
chmod 600 ssl-certs/key.pem
chmod 644 ssl-certs/cert.pem

# Forcer HTTPS
USE_HTTPS=true npm start

# Vérifier les logs pour les erreurs
npm start 2>&1 | grep -i ssl
```

### Problèmes de Connexion

#### Impossible d'accéder depuis l'extérieur
```bash
# Vérifier le pare-feu
ufw status
ufw allow 3002/tcp
ufw allow 3444/tcp

# Vérifier que le serveur écoute sur 0.0.0.0
netstat -tulpn | grep node

# Vérifier les règles iptables
iptables -L -n
```

#### Erreur CORS
- Vérifier que les headers CORS sont correctement configurés
- Vérifier l'origine de la requête dans les logs du serveur

### Kit MuleSoft Inaccessible
```bash
# Vérifier connectivité
curl http://64.225.5.75:8086/api/v1/health

# Test via proxy serveur
curl http://localhost:3002/api/kit/test?type=health

# Vérifier la configuration
grep -r "64.225.5.75" lib/kit-client.js
```

### Mode Dégradé
Le système Mali fonctionne même sans Kit :
- ✅ Interface web complète
- ✅ Workflow manuel (étapes 7-14)
- ⚠️ Réception manifestes bloquée (étape 6)
- ⚠️ Transmission bloquée (étapes 15-16)

### Problèmes de Performance

#### Le serveur est lent
```bash
# Vérifier l'utilisation des ressources
top
htop

# Vérifier les logs pour les erreurs
tail -f server.log

# Redémarrer le serveur
pm2 restart mali-simulator
```

#### Mémoire insuffisante
- Réduire le nombre de données en mémoire
- Implémenter une base de données persistante
- Augmenter la RAM du serveur

### Logs et Debugging

```bash
# Voir les logs en temps réel
npm start

# Avec PM2
pm2 logs mali-simulator

# Logs système
journalctl -u mali-simulator -f

# Debug Node.js
NODE_OPTIONS='--inspect' npm start
```

### Commandes Utiles

```bash
# Vérifier l'état du serveur
curl http://localhost:3002/api/health

# Tester une API spécifique
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'

# Vérifier les processus Node.js
ps aux | grep node

# Nettoyer les processus zombies
pkill -f "node server.js"
```

---

## 📚 Standards & Conformité

### Références UEMOA
- **Rapport PDF** : Étude interconnexion systèmes douaniers
- **Figure 19** : Architecture fonctionnelle libre pratique
- **Étapes Mali** : 6-16 (libre pratique) + 11,13-14 (transit)

### Standards Supportés
- ✅ Format UEMOA 2025.1
- ✅ Codes pays ISO (MLI, SEN)
- ✅ Workflow Manuel conforme rapport PDF
- ✅ Intégration Kit MuleSoft

---

## 🎯 Roadmap

### Version Actuelle (1.0.0)
- ✅ Workflow libre pratique complet (étapes 6-16)
- ✅ Workflow transit (étapes 11, 13-14)
- ✅ Interface web interactive avec modales
- ✅ Authentification multi-rôles
- ✅ Intégration Kit MuleSoft

### Versions Futures
- [ ] Gestion des pièces jointes (v1.1.0)
- [ ] Export PDF des déclarations (v1.1.0)
- [ ] Notifications en temps réel (v1.2.0)
- [ ] Base de données persistante PostgreSQL (v2.0.0)

---

## 📝 Récapitulatif des Commandes Principales

### Installation et Configuration

| Action | Commande |
|--------|----------|
| Installer les dépendances | `npm install` |
| Générer certificats SSL (Linux/Mac) | `./generate-ssl.sh` |
| Générer certificats SSL (Windows) | `.\generate-ssl.ps1` |
| Générer certificats SSL (manuel) | Voir section "Configuration des Certificats SSL" |

### Démarrage du Serveur

| Mode | Commande | URL |
|------|----------|-----|
| HTTP (par défaut) | `npm start` | `http://localhost:3002` |
| HTTPS (si certificats existent) | `npm start` | `https://localhost:3444` |
| HTTPS forcé | `USE_HTTPS=true npm start` | `https://localhost:3444` |
| HTTPS avec redirection | `REDIRECT_TO_HTTPS=true npm start` | HTTP → HTTPS automatique |
| Ports personnalisés | `HTTP_PORT=3003 HTTPS_PORT=3445 npm start` | Ports personnalisés |

### Tests et Vérification

| Test | Commande |
|------|----------|
| Health Check (HTTP) | `curl http://localhost:3002/api/health` |
| Health Check (HTTPS) | `curl -k https://localhost:3444/api/health` |
| Statistiques | `curl http://localhost:3002/api/statistiques` |
| Test Kit MuleSoft | `curl http://localhost:3002/api/kit/test?type=health` |

### Déploiement Production (PM2)

| Action | Commande |
|--------|----------|
| Installer PM2 | `npm install -g pm2` |
| Démarrer | `pm2 start server.js --name "mali-simulator"` |
| Voir les logs | `pm2 logs mali-simulator` |
| Redémarrer | `pm2 restart mali-simulator` |
| Arrêter | `pm2 stop mali-simulator` |
| Sauvegarder | `pm2 save` |
| Démarrer au boot | `pm2 startup` |

### Dépannage

| Problème | Commande |
|----------|----------|
| Vérifier les ports | `netstat -tulpn \| grep 3002` |
| Trouver processus | `lsof -i :3002` ou `ps aux \| grep node` |
| Vérifier certificats | `ls -la ssl-certs/` |
| Vérifier Node.js | `node --version` |

---

## 👥 Support

**Développé par** : Cabinet Jasmine Conseil  
**Conformité** : Rapport PDF UEMOA - Interconnexion SI Douaniers  
**Version** : 1.0.0-UEMOA-MALI  
**Runtime** : Node.js 18.x+

---

## 📄 Licence

Ce projet est développé dans le cadre de l'interconnexion des systèmes douaniers UEMOA.

---

*Simulateur Mali (Bamako) - Pays de Destination UEMOA - Workflow Manuel Étapes 6-16*

**Dernière mise à jour** : 2025-01-27