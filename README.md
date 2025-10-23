# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination UEMOA** | Workflow Manuel Interactif Étapes 6-16

---

## 📋 Description

Simulateur complet du système douanier du **Mali (Pays B - Destination)** dans le cadre de l'interconnexion UEMOA. Le Mali traite manuellement les déclarations douanières pour les marchandises provenant du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

### 🎯 Caractéristiques Principales

- **Pays** : Mali (MLI)
- **Ville** : Bamako
- **Rôle** : Pays de destination (hinterland)
- **Mode** : Workflow MANUEL avec interface interactive
- **Interconnexion** : Sénégal → Kit MuleSoft → Mali
- **Standards** : Conforme rapport PDF UEMOA 2025.1

---

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18.x ou supérieur
- npm ou yarn

### Installation

```bash
# Cloner le dépôt
git clone [url-du-repo]
cd simulateur-mali-bamako

# Installer les dépendances
npm install
```

### Démarrage

```bash
# Démarrage en développement
npm start

# Le serveur démarre sur http://localhost:3002
```

### URLs Principales

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3002 | Interface principale |
| **Libre Pratique** | http://localhost:3002/libre-pratique.html | Workflow étapes 6-16 |
| **Transit** | http://localhost:3002/transit.html | Workflow transit |
| **Health Check** | http://localhost:3002/api/health | Statut système |
| **Statistiques** | http://localhost:3002/api/statistiques | Métriques temps réel |

---

## 🔥 Workflows Implémentés

### 📦 Workflow Libre Pratique - ÉTAPES MALI 6-16

Le Mali gère manuellement les étapes suivantes selon le rapport PDF UEMOA :

| Étape | Description | Type | Interface |
|-------|-------------|------|-----------|
| **6** | Réception manifeste depuis Kit MuleSoft | ✅ Auto | API Backend |
| **7** | Collecte documents GUCE Mali | 👤 Manuel | Modale interactive |
| **8** | Création déclaration | 👤 Manuel | Modale avec articles |
| **9-10** | Contrôles recevabilité + Calcul devis | 👤 Manuel | Modale validation |
| **11** | Enregistrement déclaration détaillée | 👤 Manuel | Modale enregistrement |
| **12-13** | Contrôles douaniers + Bulletin liquidation | 👤 Manuel | Modale contrôles |
| **14** | Paiement droits et taxes (BCEAO) | 👤 Manuel | Modale paiement |
| **15-16** | Transmission autorisation vers Kit | ✅ Auto | API Backend |

#### 🎮 Fonctionnalités Interactives

- **Modales par étape** : Interface intuitive pour chaque étape du workflow
- **Validation temps réel** : Vérification des données saisies
- **Gestion articles** : Ajout/suppression dynamique d'articles dans les déclarations
- **Workflow complet** : Option d'exécution automatique de toutes les étapes
- **Affichage résultats** : Présentation détaillée et structurée des résultats

### 🚛 Workflow Transit - ÉTAPES MALI 11, 13-14

| Étape | Description | Action |
|-------|-------------|--------|
| **11** | Réception déclaration transit | Enregistrement automatique |
| **13** | Arrivée marchandises au bureau Mali | Contrôle + Visa manuel |
| **14** | Message arrivée vers Kit | Notification automatique |

---

## 🛠️ Architecture Technique

```
simulateur-mali/
├── api/                          # Endpoints REST
│   ├── health.js                # Health check système
│   ├── statistiques.js          # Métriques et KPIs
│   ├── manifeste/
│   │   ├── reception.js         # ÉTAPE 6 - Réception
│   │   └── lister.js            # Liste manifestes
│   ├── workflow/
│   │   └── manuel.js            # ÉTAPES 7-16 - Workflow manuel
│   ├── declaration/
│   │   ├── lister.js            # Liste déclarations
│   │   └── soumettre.js         # ÉTAPES 15-16 - Soumission Kit
│   ├── documents-guce/
│   │   └── lister.js            # Liste documents GUCE
│   ├── paiement/
│   │   ├── effectuer.js         # ÉTAPE 14 - Paiement
│   │   └── lister.js            # Liste paiements
│   ├── transit/
│   │   ├── copie.js             # ÉTAPE 11 - Réception transit
│   │   ├── arrivee.js           # ÉTAPES 13-14 - Arrivée
│   │   └── lister.js            # Liste transits
│   └── auth/
│       ├── login.js             # Authentification
│       ├── logout.js            # Déconnexion
│       └── verify.js            # Vérification token
├── lib/
│   ├── database.js              # Base de données Mali en mémoire
│   └── kit-client.js            # Client Kit MuleSoft
├── public/                       # Interface web
│   ├── index.html               # Page d'accueil
│   ├── login.html               # Page de connexion
│   ├── libre-pratique.html      # Interface libre pratique
│   ├── transit.html             # Interface transit
│   ├── script.js                # Logique frontend
│   ├── auth.js                  # Gestion authentification
│   └── style.css                # Styles globaux
├── server.js                     # Serveur HTTP Node.js
├── package.json                  # Dépendances
└── vercel.json                   # Configuration Vercel
```

**Stack Technique** : Node.js 18+, Vanilla JS, HTTP natif, Port 3002, Format UEMOA 2025.1

---

## 📊 APIs Principales

### 1. Health Check

```bash
GET /api/health
```

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
  "fonctionnalites": {
    "receptionManifeste": "ACTIF",
    "workflowManuel": "ACTIF"
  }
}
```

### 2. Réception Manifeste (ÉTAPE 6)

```bash
POST /api/manifeste/reception
Headers: 
  X-Source-Country: SEN
  X-Source-System: KIT_INTERCONNEXION
  X-Test-Mode: true (pour tests)
```

**Body** :
```json
{
  "manifeste": {
    "numeroOrigine": "SEN_2025_001",
    "transporteur": "TRANSPORT DAKAR-BAMAKO",
    "portOrigine": "Port de Dakar"
  },
  "marchandises": [...]
}
```

### 3. Workflow Manuel (ÉTAPES 7-16)

```bash
POST /api/workflow/manuel
Content-Type: application/json
```

**Actions disponibles** :
- `collecter_documents_guce` (Étape 7)
- `creer_declaration` (Étape 8)
- `controler_et_calculer_devis` (Étapes 9-10)
- `enregistrer_declaration` (Étape 11)
- `effectuer_controles_liquidation` (Étapes 12-13)
- `effectuer_paiement` (Étape 14)
- `transmettre_vers_kit` (Étapes 15-16)
- `workflow_complet_auto` (Toutes les étapes)

**Exemple ÉTAPE 7** :
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

**Exemple ÉTAPE 8** :
```json
{
  "action": "creer_declaration",
  "manifesteId": "MALI_REC_123456",
  "donnees": {
    "declarantMalien": "DECLARANT_MALI_SARL",
    "importateurMalien": "IMPORTATEUR_MALI_001",
    "articles": [
      {
        "codeSh": "8703210000",
        "designationCom": "Véhicule",
        "origine": "SEN",
        "valeurCaf": 5000000
      }
    ]
  }
}
```

### 4. Transit Mali (ÉTAPES 11, 13-14)

```bash
# ÉTAPE 11 - Réception déclaration transit
POST /api/transit/copie

# ÉTAPES 13-14 - Arrivée marchandises
POST /api/transit/arrivee

# Lister les transits
GET /api/transit/lister
```

---

## 🎨 Interface Utilisateur

### Pages Disponibles

1. **Connexion** : `/login.html` - Authentification utilisateur
2. **Libre Pratique** : `/libre-pratique.html` - Workflow étapes 6-16
3. **Transit** : `/transit.html` - Workflow transit

### 👥 Comptes de Démonstration

| Identifiant | Mot de passe | Workflows | Rôle |
|------------|--------------|-----------|------|
| `admin` | `admin123` | Tous | ADMIN_MALI |
| `douane_mali` | `mali2025` | Tous | AGENT_DOUANE_MALI |
| `lp_mali` | `lp123` | Libre pratique | OPERATEUR_LP_MALI |
| `transit_mali` | `transit123` | Transit | OPERATEUR_TRANSIT_MALI |
| `declarant` | `decl2025` | Tous | DECLARANT_MALI |

### ✨ Fonctionnalités Interface

#### Workflow Interactif
- **Sélection manifeste** : Liste déroulante des manifestes reçus
- **Modales par étape** : Interface dédiée pour chaque étape
- **Formulaires dynamiques** : Ajout/suppression d'articles
- **Validation en temps réel** : Vérification des champs
- **Affichage résultats** : Cartes détaillées avec statistiques

#### Portail GUCE Mali
- Accès direct : https://guce.gov.ml/portal
- Collecte documents pré-dédouanement
- Intégration workflow Mali

#### Suivi et Monitoring
- **Manifestes reçus** : Depuis Port de Dakar
- **Documents GUCE** : Collectés par étape 7
- **Déclarations** : Créées et enregistrées
- **Paiements** : Acquittés BCEAO/Trésor Mali
- **Transits** : Déclarations et arrivées

#### Exécution Workflow
- **Étape par étape** : Contrôle manuel de chaque étape
- **Workflow complet** : Exécution automatique étapes 7-16
- **Tests intégrés** : Simulation de manifestes test

---

## 🗄️ Base de Données Mali

### États Workflow Mali

| Statut | Étape | Description |
|--------|-------|-------------|
| `RECU_AU_MALI` | 6 | Manifeste reçu depuis Kit |
| `DOCUMENTS_GUCE_COLLECTES` | 7 | Documents collectés GUCE |
| `DECLARATION_CREEE` | 8 | Déclaration créée |
| `CONTROLEE_ET_DEVIS_CALCULE` | 9-10 | Contrôles + devis |
| `ENREGISTREE_MALI` | 11 | Enregistrée |
| `LIQUIDEE_MALI` | 12-13 | Bulletin émis |
| `PAYEE_MALI` | 14 | Droits payés |
| `TRANSMIS_VERS_KIT` | 15-16 | Transmis vers Kit |

### Collections

- `manifestesRecus` : Manifestes reçus depuis Sénégal
- `documentsGUCE` : Documents collectés étape 7
- `declarationsCreees` : Déclarations étape 8
- `declarationsControlees` : Contrôles étapes 9-10
- `declarationsEnregistrees` : Enregistrements étape 11
- `liquidations` : Liquidations étapes 12-13
- `paiements` : Paiements étape 14
- `transmissionsKit` : Transmissions étapes 15-16
- `declarationsTransit` : Transits reçus étape 11
- `messagesArrivee` : Messages arrivée étape 14

---

## 🔧 Kit MuleSoft Integration

### Configuration

```javascript
const KitClientMali = {
  baseURL: 'http://64.225.5.75:8086/api/v1',
  paysCode: 'MLI',
  paysRole: 'PAYS_DESTINATION',
  timeout: 30000
};
```

### Méthodes Principales

#### Libre Pratique
- `soumettreDeclarationMali()` - Étapes 15-16 : Soumettre déclaration payée

#### Transit
- `recevoirDeclarationTransit()` - Étape 11 : Recevoir copie transit
- `confirmerArriveeTransit()` - Étape 14 : Confirmer arrivée

#### Utilitaires
- `verifierSante()` - Health check Kit
- `testerConnectiviteDirecte()` - Test connexion
- `diagnostic()` - Diagnostic complet

---

## 🧪 Tests et Simulation

### Test Réception Manifeste

**Via Interface Web** :
1. Se connecter avec un compte valide
2. Aller sur la page Libre Pratique
3. Cliquer "Simuler Réception Manifeste (Test)"

**Via API** :
```bash
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Test-Mode: true" \
  -d '{
    "manifeste": {
      "numeroOrigine": "TEST_MLI_001"
    },
    "marchandises": [...]
  }'
```

### Test Workflow Manuel

**Via Interface** :
1. Sélectionner un manifeste reçu
2. Cliquer sur le bouton d'une étape (ex: ÉTAPE 7)
3. Remplir le formulaire de la modale
4. Valider

**Via API** :
```bash
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{
    "action": "workflow_complet_auto",
    "manifesteId": "MALI_REC_123456"
  }'
```

### Test Transit

**Via Interface** :
1. Aller sur la page Transit
2. Cliquer "Simuler Réception Transit (Test)"
3. Cliquer "Simuler Arrivée Transit (ÉTAPES 13-14)"

---

## 🚀 Déploiement

### Variables d'Environnement

```env
# Configuration serveur
PORT=3002
NODE_ENV=production

# Kit MuleSoft
KIT_MULESOFT_URL=http://64.225.5.75:8086/api/v1

# Identification pays
PAYS_CODE=MLI
PAYS_NOM=Mali
VILLE_NAME=Bamako
PAYS_ROLE=PAYS_DESTINATION
PAYS_TYPE=HINTERLAND
```

### Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Déploiement Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3002
CMD ["node", "server.js"]
```

```bash
# Build
docker build -t mali-douanes:latest .

# Run
docker run -p 3002:3002 -e PORT=3002 mali-douanes:latest
```

---

## 📈 Monitoring

### Health Check

```bash
curl http://localhost:3002/api/health
```

**Vérifie** :
- ✅ Service Mali actif
- ✅ Kit MuleSoft accessible
- ✅ Base de données opérationnelle
- ✅ Workflow manuel supporté

### Métriques Disponibles

```bash
curl http://localhost:3002/api/statistiques
```

**Fournit** :
- **Volume** : Manifestes, déclarations, paiements
- **Performance** : Temps traitement moyen
- **Workflow** : Progression étapes 6-16
- **Financier** : Montants acquittés BCEAO
- **Transit** : Déclarations et arrivées

---

## 🔒 Sécurité

### Headers Requis

```http
X-Source-Country: MLI
X-Source-System: MALI_DOUANES_BAMAKO
X-Correlation-ID: MLI_2025_001_123456789
```

### CORS Configuré

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-*
```

### Authentification

- Système de tokens JWT
- Sessions avec expiration (8 heures)
- Vérification par rôle
- Logout propre avec nettoyage session

---

## 🔧 Dépannage

### Kit MuleSoft Inaccessible

```bash
# Vérifier connectivité
curl http://64.225.5.75:8086/api/v1/health

# Tester via proxy serveur
curl http://localhost:3002/api/kit/test?type=health
```

### Mode Dégradé

Le système Mali fonctionne même sans Kit MuleSoft :
- ✅ Interface web complète
- ✅ Workflow manuel (étapes 7-14)
- ⚠️ Réception manifestes bloquée (étape 6)
- ⚠️ Transmission bloquée (étapes 15-16)

### Problèmes Courants

#### Manifeste non reçu
```bash
# Vérifier logs serveur
# Vérifier headers X-Source-Country: SEN
# Tester en mode test avec X-Test-Mode: true
```

#### Erreur workflow manuel
```bash
# Vérifier que le manifeste existe
# Vérifier l'ordre des étapes
# Consulter les logs dans l'interface
```

#### Problème authentification
```bash
# Effacer localStorage
localStorage.clear()

# Vérifier les credentials dans api/auth/login.js
```

---

## 📚 Documentation

### Références UEMOA

- **Rapport PDF** : Étude interconnexion systèmes douaniers
- **Figure 19** : Architecture fonctionnelle libre pratique
- **Étapes Mali** : 6-16 (libre pratique) + 11,13-14 (transit)

### Standards Supportés

- ✅ Format UEMOA 2025.1
- ✅ Codes pays ISO (MLI, SEN)
- ✅ Workflow Manuel conforme rapport PDF
- ✅ Intégration Kit MuleSoft

### API Documentation

Consulter les commentaires dans chaque fichier API pour la documentation détaillée :
- Types de données acceptés
- Validations appliquées
- Codes de réponse HTTP
- Exemples d'utilisation

---

## 🎯 Roadmap

### Version Actuelle (1.0.0)
- ✅ Workflow libre pratique complet (étapes 6-16)
- ✅ Workflow transit (étapes 11, 13-14)
- ✅ Interface web interactive avec modales
- ✅ Authentification multi-rôles
- ✅ Intégration Kit MuleSoft

### Versions Futures

#### v1.1.0
- [ ] Gestion des pièces jointes
- [ ] Export PDF des déclarations
- [ ] Historique détaillé des opérations
- [ ] Dashboard analytique avancé

#### v1.2.0
- [ ] Notifications en temps réel
- [ ] Chat support intégré
- [ ] Multi-langue (Français/Anglais)
- [ ] Mode hors-ligne

#### v2.0.0
- [ ] Base de données persistante (PostgreSQL)
- [ ] API GraphQL
- [ ] Workflow automatisé configurable
- [ ] Intégration blockchain pour traçabilité

---

## 👥 Support et Contribution

### Développé par
**Cabinet Jasmine Conseil**

### Conformité
**Rapport PDF UEMOA** - Interconnexion SI Douaniers

### Version
**1.0.0-UEMOA-MALI**

### Runtime
**Node.js 18.x+**

### Contact
Pour toute question ou support :
- 📧 Email : [email à ajouter]
- 📱 Téléphone : [numéro à ajouter]
- 🌐 Site web : [site à ajouter]

### Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est développé dans le cadre de l'interconnexion des systèmes douaniers UEMOA.

---

## 🙏 Remerciements

- **UEMOA** : Pour les spécifications techniques
- **Cabinet Jasmine Conseil** : Développement et mise en œuvre
- **Douanes du Mali** : Spécifications métier
- **Kit MuleSoft** : Infrastructure d'interconnexion

---

*Simulateur Mali (Bamako) - Pays de Destination UEMOA - Workflow Manuel Étapes 6-16*

**Dernière mise à jour** : 2025-01-23
