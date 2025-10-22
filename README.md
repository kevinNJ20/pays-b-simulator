# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination UEMOA** | Workflow Manuel Étapes 6-16

---

## 📋 Description

Simulateur du système douanier du **Mali (Pays B - Destination)** dans le cadre de l'interconnexion UEMOA. Le Mali traite manuellement les déclarations douanières pour les marchandises provenant du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

### Caractéristiques
- **Pays** : Mali (MLI)
- **Ville** : Bamako
- **Rôle** : Pays de destination (hinterland)
- **Mode** : Workflow MANUEL
- **Interconnexion** : Sénégal → Kit MuleSoft → Mali

---

## 🚀 Installation et Démarrage

```bash
# Installation
npm install

# Démarrage
npm start

# Le serveur démarre sur http://localhost:3002
```

### URLs principales
- **Dashboard** : http://localhost:3002
- **Health check** : http://localhost:3002/api/health
- **Statistiques** : http://localhost:3002/api/statistiques

---

## 🔥 Workflows Implémentés

### 📦 Workflow Libre Pratique - ÉTAPES MALI 6-16

Le Mali gère manuellement les étapes suivantes selon le rapport PDF UEMOA :

| Étape | Description | Type | Responsable |
|-------|-------------|------|-------------|
| **6** | Réception manifeste depuis Kit MuleSoft | ✅ Auto | Système |
| **7** | Collecte documents GUCE Mali | 👤 Manuel | Opérateur |
| **8** | Création déclaration | 👤 Manuel | Déclarant malien |
| **9-10** | Contrôles recevabilité + Calcul devis | 👤 Manuel | Agent contrôle |
| **11** | Enregistrement déclaration détaillée | 👤 Manuel | Agent enregistrement |
| **12-13** | Contrôles douaniers + Bulletin liquidation | 👤 Manuel | Agent contrôleur |
| **14** | Paiement droits et taxes (BCEAO) | 👤 Manuel | Importateur |
| **15-16** | Transmission autorisation vers Kit | ✅ Auto | Système |

### 🚛 Workflow Transit - ÉTAPES MALI 11, 13-14

| Étape | Description | Action |
|-------|-------------|--------|
| **11** | Réception déclaration transit | Enregistrement |
| **13** | Arrivée marchandises au bureau Mali | Contrôle + Visa |
| **14** | Message arrivée vers Kit | Notification Sénégal |

---

## 🛠️ Architecture Technique

```
simulateur-mali/
├── api/                    # Endpoints REST
│   ├── health.js          # Health check
│   ├── statistiques.js    # Métriques
│   ├── manifeste/         # Gestion manifestes
│   │   ├── reception.js   # ÉTAPE 6
│   │   └── lister.js
│   ├── workflow/          
│   │   └── manuel.js      # ÉTAPES 7-16
│   ├── declaration/       # Gestion déclarations
│   ├── paiement/          # ÉTAPE 14
│   └── transit/           # ÉTAPES 11, 13-14
├── lib/
│   ├── database.js        # Base de données Mali
│   └── kit-client.js      # Client Kit MuleSoft
├── public/                # Interface web
├── server.js              # Serveur HTTP
└── package.json
```

**Stack** : Node.js 18+, Port 3002, Format UEMOA 2025.1

---

## 📊 APIs Principales

### 1. Health Check
```bash
GET /api/health
```

### 2. Réception Manifeste (ÉTAPE 6)
```bash
POST /api/manifeste/reception
Headers: 
  X-Source-Country: SEN
  X-Test-Mode: true (pour tests)
```

### 3. Workflow Manuel (ÉTAPES 7-16)
```bash
POST /api/workflow/manuel
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

### 4. Transit Mali (ÉTAPES 11, 13-14)
```bash
POST /api/transit/copie        # ÉTAPE 11
POST /api/transit/arrivee      # ÉTAPES 13-14
GET /api/transit/lister
```

---

## 🎨 Interface Utilisateur

### Pages disponibles
1. **Connexion** : `/login.html`
2. **Libre Pratique** : `/libre-pratique.html`
3. **Transit** : `/transit.html`

### Comptes de démonstration
```
admin / admin123 (Tous workflows)
douane_mali / mali2025 (Tous workflows)
lp_mali / lp123 (Libre pratique)
transit_mali / transit123 (Transit)
```

### Fonctionnalités
- Workflow interactif avec modales pour chaque étape
- Portail GUCE Mali : https://guce.gov.ml/portal
- Suivi des manifestes, déclarations et paiements
- Exécution étape par étape ou workflow complet

---

## 🗄️ Base de Données Mali

### États workflow Mali

| Statut | Étape | Description |
|--------|-------|-------------|
| `RECU_AU_MALI` | 6 | Manifeste reçu depuis Kit |
| `DOCUMENTS_GUCE_COLLECTES` | 7 | Documents collectés |
| `DECLARATION_CREEE` | 8 | Déclaration créée |
| `CONTROLEE_ET_DEVIS_CALCULE` | 9-10 | Contrôles + devis |
| `ENREGISTREE_MALI` | 11 | Enregistrée |
| `LIQUIDEE_MALI` | 12-13 | Bulletin émis |
| `PAYEE_MALI` | 14 | Droits payés |
| `TRANSMIS_VERS_KIT` | 15-16 | Transmis vers Kit |

---

## 🔧 Kit MuleSoft Integration

### Configuration
```javascript
const KitClientMali = {
  baseURL: 'http://64.225.5.75:8086/api/v1',
  paysCode: 'MLI',
  paysRole: 'PAYS_DESTINATION'
};
```

### Méthodes principales
- `soumettreDeclarationMali()` - Étapes 15-16
- `confirmerArriveeTransit()` - Étape 14 transit
- `verifierSante()` - Health check

---

## 🧪 Tests

### Test réception manifeste
```bash
# Via interface web
Cliquer "Simuler Réception Manifeste (Test)"

# Via API
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Test-Mode: true" \
  -d '{"manifeste":{"numeroOrigine":"TEST_MLI_001"}}'
```

### Test workflow manuel
```bash
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{
    "action": "workflow_complet_auto",
    "manifesteId": "MALI_REC_123456"
  }'
```

---

## 🚀 Déploiement

### Variables d'environnement
```env
PORT=3002
NODE_ENV=production
KIT_MULESOFT_URL=http://64.225.5.75:8086/api/v1
PAYS_CODE=MLI
PAYS_NOM=Mali
VILLE_NAME=Bamako
PAYS_ROLE=PAYS_DESTINATION
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

### Métriques disponibles
- Volume : Manifestes, déclarations, paiements
- Performance : Temps traitement moyen
- Workflow : Progression étapes 6-16
- Financier : Montants acquittés BCEAO

---

## 🔒 Sécurité

### Headers requis
```http
X-Source-Country: MLI
X-Source-System: MALI_DOUANES_BAMAKO
X-Correlation-ID: MLI_2025_001_123456789
```

### CORS configuré
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-*
```

---

## 🔧 Dépannage

### Kit MuleSoft inaccessible
```bash
# Vérifier connectivité
curl http://64.225.5.75:8086/api/v1/health

# Mode local sans Kit
KIT_MULESOFT_URL="" npm start
```

### Mode dégradé
Le système Mali fonctionne même sans Kit MuleSoft :
- ✅ Interface web complète
- ✅ Workflow manuel (étapes 7-14)
- ⚠️ Réception manifestes bloquée (étape 6)
- ⚠️ Transmission bloquée (étapes 15-16)

---

## 📚 Documentation

### Références UEMOA
- **Rapport PDF** : Étude interconnexion systèmes douaniers
- **Figure 19** : Architecture fonctionnelle libre pratique
- **Étapes Mali** : 6-16 (libre pratique) + 11,13-14 (transit)

### Standards supportés
- ✅ Format UEMOA 2025.1
- ✅ Codes pays ISO (MLI, SEN)
- ✅ Workflow Manuel conforme rapport PDF

---

## 👥 Support

**Développé par** : Cabinet Jasmine Conseil  
**Conformité** : Rapport PDF UEMOA - Interconnexion SI Douaniers  
**Version** : 1.0.0-UEMOA-MALI  
**Runtime** : Node.js 18.x+

---

*Simulateur Mali (Bamako) - Pays de Destination UEMOA - Workflow Manuel Étapes 6-16*
