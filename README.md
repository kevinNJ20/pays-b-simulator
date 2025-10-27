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

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Démarrage serveur local
npm start
# Serveur HTTP sur http://localhost:3002
```

### URLs Principales

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard | http://localhost:3002 | Interface principale |
| Libre Pratique | http://localhost:3002/libre-pratique.html | Workflow étapes 6-16 |
| Transit | http://localhost:3002/transit.html | Workflow transit |
| Health Check | http://localhost:3002/api/health | Statut système |
| Statistiques | http://localhost:3002/api/statistiques | Métriques |

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

### Via Interface Web
1. Connexion avec compte valide
2. Cliquer "Simuler Réception Manifeste (Test)"
3. Utiliser les boutons d'étapes pour le workflow manuel

### Via API

```bash
# Test réception manifeste
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Test-Mode: true" \
  -d '{
    "manifeste": {
      "numeroOrigine": "TEST_SEN_001"
    },
    "marchandises": [...]
  }'

# Test workflow complet automatique
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{
    "action": "workflow_complet_auto",
    "manifesteId": "MALI_REC_..."
  }'
```

---

## 🚀 Déploiement

### Variables d'Environnement
```env
PORT=3002
NODE_ENV=production
KIT_MULESOFT_URL=http://64.225.5.75:8086/api/v1
PAYS_CODE=MLI
PAYS_ROLE=PAYS_DESTINATION
```

### Docker
```bash
docker build -t mali-douanes:latest .
docker run -p 3002:3002 mali-douanes:latest
```

### Vercel
```bash
vercel --prod
```

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

### Kit MuleSoft Inaccessible
```bash
# Vérifier connectivité
curl http://64.225.5.75:8086/api/v1/health

# Test via proxy serveur
curl http://localhost:3002/api/kit/test?type=health
```

### Mode Dégradé
Le système Mali fonctionne même sans Kit :
- ✅ Interface web complète
- ✅ Workflow manuel (étapes 7-14)
- ⚠️ Réception manifestes bloquée (étape 6)
- ⚠️ Transmission bloquée (étapes 15-16)

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