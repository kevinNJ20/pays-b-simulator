# 🇲🇱 Simulateur Système Douanier Mali - Bamako

**Pays de Destination UEMOA** | Workflow Manuel Étapes 6-16

---

## 📋 Description

Simulateur du système douanier du **Mali (Pays B - Destination)** selon l'architecture UEMOA. Le Mali traite manuellement les déclarations douanières pour les marchandises provenant du **Sénégal (Port de Dakar)** via le **Kit d'Interconnexion MuleSoft**.

### Caractéristiques
- **Pays** : Mali (MLI)
- **Ville** : Bamako
- **Rôle** : Pays de destination hinterland
- **Mode** : Workflow MANUEL (étapes 6-16)
- **Interconnexion** : Sénégal → Kit MuleSoft → Mali → Commission UEMOA

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

### 📦 Workflow Libre Pratique (Étapes Mali 6-16)

Le Mali gère manuellement les étapes suivantes :

| Étape | Description | Type | Responsable |
|-------|-------------|------|-------------|
| **6** | Réception manifeste depuis Kit | ✅ Auto | Système |
| **7** | Collecte documents GUCE Mali | 👤 Manuel | Opérateur |
| **8** | Création déclaration | 👤 Manuel | Déclarant |
| **9-10** | Contrôles + Calcul devis | 👤 Manuel | Agent contrôle |
| **11** | Enregistrement déclaration | 👤 Manuel | Agent enregistrement |
| **12-13** | Contrôles douaniers + Liquidation | 👤 Manuel | Agent contrôleur |
| **14** | Paiement droits et taxes | 👤 Manuel | Importateur |
| **15-16** | Transmission vers Kit | ✅ Auto | Système |

### 🚛 Workflow Transit (Étapes Mali 11, 13-14)

| Étape | Description | Action |
|-------|-------------|--------|
| **11** | Réception déclaration transit | Enregistrement |
| **13** | Arrivée marchandises | Contrôle + Visa |
| **14** | Message arrivée vers Kit | Notification Sénégal |

---

## 🛠️ Architecture Technique

```
simulateur-mali/
├── api/                    # Endpoints REST
│   ├── health.js          # Health check
│   ├── statistiques.js    # Métriques
│   ├── manifeste/         # Gestion manifestes
│   ├── declaration/       # Gestion déclarations
│   ├── paiement/          # Gestion paiements
│   ├── workflow/          # Workflow manuel
│   └── transit/           # Gestion transit
├── lib/
│   ├── database.js        # Base de données Mali
│   └── kit-client.js      # Client Kit MuleSoft
├── public/                # Interface web
├── server.js              # Serveur HTTP
└── package.json
```

**Stack technique** : Node.js 18+, Port 3002, Format UEMOA 2025.1

---

## 📊 APIs Principales

### 1. Health Check
```bash
GET /api/health
```
Vérifie l'état du système Mali et la connectivité Kit MuleSoft.

### 2. Réception Manifeste (ÉTAPE 6)
```bash
POST /api/manifeste/reception
Headers: X-Source-Country: SEN
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
- `workflow_complet_auto` (Exécution complète)

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

### 4. Transit Mali (ÉTAPES 11, 13-14)
```bash
POST /api/transit/copie        # ÉTAPE 11
POST /api/transit/arrivee      # ÉTAPES 13-14
GET /api/transit/lister
```

---

## 🎨 Interface Utilisateur

### Fonctionnalités principales

1. **Workflow interactif**
   - Modales pour chaque étape manuelle (7-16)
   - Formulaires de saisie contextuels
   - Exécution étape par étape ou workflow complet

2. **Portail GUCE Mali**
   - Accès direct : https://guce.gov.ml/portal
   - Collecte documents (ÉTAPE 7)

3. **Gestion des manifestes**
   - Liste des manifestes reçus depuis Sénégal
   - Sélection pour traitement manuel

4. **Suivi déclarations**
   - État des déclarations créées
   - Liquidations et paiements

### Utilisation interface

```
1. Simuler réception manifeste (test) → ÉTAPE 6
2. Sélectionner le manifeste dans la liste
3. Cliquer "ÉTAPE 7 - Collecter Documents GUCE"
4. Remplir le formulaire et valider
5. Continuer étapes 8-16 ou exécuter workflow complet
```

---

## 🗄️ Base de Données Mali

### États workflow Mali

| Statut | Étape | Description |
|--------|-------|-------------|
| `RECU_AU_MALI` | 6 | Manifeste reçu depuis Kit |
| `DOCUMENTS_GUCE_COLLECTES` | 7 | Documents GUCE collectés |
| `DECLARATION_CREEE` | 8 | Déclaration créée |
| `CONTROLEE_ET_DEVIS_CALCULE` | 9-10 | Contrôles + devis |
| `ENREGISTREE_MALI` | 11 | Déclaration enregistrée |
| `LIQUIDEE_MALI` | 12-13 | Contrôles + bulletin |
| `PAYEE_MALI` | 14 | Droits payés |
| `TRANSMIS_VERS_KIT` | 15-16 | Transmis vers Kit |

---

## 🔧 Kit MuleSoft Integration

### Configuration connexion
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
KIT_MULESOFT_URL=https://kit-mulesoft.herokuapp.com/api/v1
PAYS_CODE=MLI
PAYS_NOM=Mali
VILLE_NAME=Bamako
PAYS_ROLE=PAYS_DESTINATION
```

### Déploiement Vercel
```bash
npm i -g vercel
vercel --prod
```

---

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3002/api/health
```

**Contrôles** :
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
X-Workflow-Step: 6_RECEPTION_MANIFESTE
```

### CORS configuré
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Source-Country, 
  X-Correlation-ID, X-Payment-Reference
```

---

## 🔧 Dépannage

### Problèmes courants

**Kit MuleSoft inaccessible**
```bash
# Vérifier connectivité
curl http://64.225.5.75:8086/api/v1/health

# Mode local sans Kit
KIT_MULESOFT_URL="" npm start
```

**Port Mali utilisé**
```bash
PORT=3003 npm start
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
- ✅ API REST pour Kit MuleSoft

---

## 👥 Support

**Développé par** : Cabinet Jasmine Conseil  
**Conformité** : Rapport PDF UEMOA - Interconnexion SI Douaniers  
**Version** : 1.0.0-UEMOA-MALI  
**Runtime** : Node.js 18.x+

**Contact** : Douanes Mali - Bamako  
**Rôle** : Pays de destination hinterland - Traitement manuel

---

*Simulateur Mali (Bamako) - Pays de Destination UEMOA - Workflow Manuel Étapes 6-16*
