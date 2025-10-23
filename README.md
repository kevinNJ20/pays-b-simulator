# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination UEMOA** | Workflow Manuel Interactif Étapes 6-16

---

## 📋 Description

Simulateur complet du système douanier du **Mali (Pays B - Destination)** dans le cadre de l'interconnexion UEMOA. Le Mali traite manuellement les déclarations douanières pour les marchandises provenant du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

### 🎯 Caractéristiques

- **Pays** : Mali (MLI) - Bamako
- **Rôle** : Pays de destination (hinterland)
- **Mode** : Workflow MANUEL avec interface interactive
- **Interconnexion** : Sénégal → Kit MuleSoft → Mali
- **Standards** : Conforme rapport PDF UEMOA 2025.1

---

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Démarrage
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

---

## 🔥 Workflows Implémentés

### 📦 Workflow Libre Pratique - ÉTAPES 6-16

| Étape | Description | Type |
|-------|-------------|------|
| **6** | Réception manifeste depuis Kit MuleSoft | ✅ Auto |
| **7** | Collecte documents GUCE Mali | 👤 Manuel |
| **8** | Création déclaration | 👤 Manuel |
| **9-10** | Contrôles recevabilité + Calcul devis | 👤 Manuel |
| **11** | Enregistrement déclaration détaillée | 👤 Manuel |
| **12-13** | Contrôles douaniers + Bulletin liquidation | 👤 Manuel |
| **14** | Paiement droits et taxes (BCEAO) | 👤 Manuel |
| **15-16** | Transmission autorisation vers Kit | ✅ Auto |

### 🚛 Workflow Transit - ÉTAPES 11, 13-14

| Étape | Description |
|-------|-------------|
| **11** | Réception déclaration transit |
| **13** | Arrivée marchandises au bureau Mali |
| **14** | Message arrivée vers Kit |

---

## 🛠️ Architecture Technique

```
simulateur-mali/
├── api/                          # Endpoints REST
│   ├── health.js                # Health check
│   ├── statistiques.js          # Métriques
│   ├── manifeste/               # ÉTAPE 6
│   ├── workflow/manuel.js       # ÉTAPES 7-16
│   ├── declaration/             # Déclarations
│   ├── paiement/                # ÉTAPE 14
│   ├── transit/                 # ÉTAPES 11, 13-14
│   └── auth/                    # Authentification
├── lib/
│   ├── database.js              # Base de données Mali
│   └── kit-client.js            # Client Kit MuleSoft
├── public/                       # Interface web
│   ├── libre-pratique.html      # Interface principale
│   ├── transit.html             # Interface transit
│   └── script.js                # Logique frontend
└── server.js                     # Serveur HTTP Node.js
```

**Stack** : Node.js 18+, Vanilla JS, HTTP natif, Port 3002

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
  X-Source-System: KIT_INTERCONNEXION
```

### 3. Workflow Manuel (ÉTAPES 7-16)
```bash
POST /api/workflow/manuel
Content-Type: application/json

# Actions disponibles :
# - collecter_documents_guce (Étape 7)
# - creer_declaration (Étape 8)
# - controler_et_calculer_devis (Étapes 9-10)
# - enregistrer_declaration (Étape 11)
# - effectuer_controles_liquidation (Étapes 12-13)
# - effectuer_paiement (Étape 14)
# - transmettre_vers_kit (Étapes 15-16)
# - workflow_complet_auto (Toutes les étapes)
```

### 4. Transit Mali
```bash
POST /api/transit/copie      # ÉTAPE 11
POST /api/transit/arrivee    # ÉTAPES 13-14
GET  /api/transit/lister     # Liste transits
```

---

## 🎨 Interface Utilisateur

### 👥 Comptes de Démonstration

| Identifiant | Mot de passe | Workflows | Rôle |
|------------|--------------|-----------|------|
| `admin` | `admin123` | Tous | ADMIN_MALI |
| `douane_mali` | `mali2025` | Tous | AGENT_DOUANE_MALI |
| `lp_mali` | `lp123` | Libre pratique | OPERATEUR_LP_MALI |
| `transit_mali` | `transit123` | Transit | OPERATEUR_TRANSIT_MALI |
| `declarant` | `decl2025` | Tous | DECLARANT_MALI |

### ✨ Fonctionnalités

- **Workflow Interactif** : Modales par étape avec formulaires dynamiques
- **Portail GUCE Mali** : https://guce.gov.ml/portal
- **Suivi en temps réel** : Manifestes, documents, déclarations, paiements
- **Exécution flexible** : Étape par étape ou workflow complet automatique

---

## 🗄️ Base de Données

### Collections Principales
- `manifestesRecus` - ÉTAPE 6
- `documentsGUCE` - ÉTAPE 7
- `declarationsCreees` - ÉTAPE 8
- `liquidations` - ÉTAPES 12-13
- `paiements` - ÉTAPE 14
- `transmissionsKit` - ÉTAPES 15-16
- `declarationsTransit` - Transit

### États Workflow
- `RECU_AU_MALI` (Étape 6)
- `DOCUMENTS_GUCE_COLLECTES` (Étape 7)
- `DECLARATION_CREEE` (Étape 8)
- `ENREGISTREE_MALI` (Étape 11)
- `LIQUIDEE_MALI` (Étapes 12-13)
- `PAYEE_MALI` (Étape 14)
- `TRANSMIS_VERS_KIT` (Étapes 15-16)

---

## 🔧 Kit MuleSoft Integration

```javascript
const KitClientMali = {
  baseURL: 'http://64.225.5.75:8086/api/v1',
  paysCode: 'MLI',
  paysRole: 'PAYS_DESTINATION'
};
```

### Méthodes Principales
- `soumettreDeclarationMali()` - Étapes 15-16
- `recevoirDeclarationTransit()` - Étape 11
- `confirmerArriveeTransit()` - Étape 14
- `verifierSante()` - Health check Kit

---

## 🧪 Tests et Simulation

### Via Interface Web
1. Se connecter avec un compte valide
2. Cliquer "Simuler Réception Manifeste (Test)"
3. Utiliser les boutons d'étapes pour le workflow manuel

### Via API
```bash
# Test réception manifeste
curl -X POST http://localhost:3002/api/manifeste/reception \
  -H "Content-Type: application/json" \
  -H "X-Source-Country: SEN" \
  -H "X-Test-Mode: true"

# Test workflow complet
curl -X POST http://localhost:3002/api/workflow/manuel \
  -H "Content-Type: application/json" \
  -d '{"action": "workflow_complet_auto", "manifesteId": "MALI_REC_..."}'
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

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3002/api/health
```

### Métriques
- Volume : Manifestes, déclarations, paiements
- Performance : Temps traitement moyen
- Workflow : Progression étapes 6-16
- Financier : Montants acquittés BCEAO

---

## 🔒 Sécurité

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

### Contribution
Les contributions sont bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements
4. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est développé dans le cadre de l'interconnexion des systèmes douaniers UEMOA.

---

*Simulateur Mali (Bamako) - Pays de Destination UEMOA - Workflow Manuel Étapes 6-16*

**Dernière mise à jour** : 2025-01-23
