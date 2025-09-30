// ============================================================================
// PAYS B - Script Frontend CORRIGÉ avec Tests Hybrides
// Fichier: public/script.js
// ============================================================================

// Configuration API - PAYS B CORRIGÉ
const API_BASE = window.location.origin + '/api';
//const KIT_MULESOFT_URL = 'http://localhost:8080/api/v1';
const KIT_MULESOFT_URL = process.env.KIT_MULESOFT_URL || 'http://localhost:8080/api/v1';
window.SYSTEME_TYPE = 'PAYS_B';
window.PAYS_CODE = 'BFA';

let statusInterval;
let refreshInterval;
let kitConnected = false;
let workflowActive = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation Pays B - Workflow Automatique + Kit MuleSoft avec Tests Hybrides');
    
    document.getElementById('init-time').textContent = new Date().toLocaleTimeString();
    
    // Vérifications périodiques
    verifierStatutKit();
    statusInterval = setInterval(verifierStatutKit, 15000);
    
    // Actualisation données
    chargerDonnees();
    refreshInterval = setInterval(chargerDonnees, 8000);
    
    ajouterLogEntry('workflow', 'Service démarré', 'Pays B opérationnel - Workflow automatique activé');
});

// Vérification du statut Kit (via API locale pour le monitoring continu)
async function verifierStatutKit() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        const kitInfo = data.kit;
        const banner = document.getElementById('kit-banner');
        const indicator = document.getElementById('kit-indicator');
        const statusText = document.getElementById('kit-status-text');
        const details = document.getElementById('kit-details');
        
        if (kitInfo.accessible) {
            // Kit connecté
            banner.className = 'kit-status-banner connected';
            banner.innerHTML = `✅ Kit d'Interconnexion opérationnel - ${kitInfo.status} (${kitInfo.latence}ms)`;
            
            indicator.className = 'status-indicator connected';
            statusText.textContent = 'Kit Opérationnel';
            details.textContent = `Latence: ${kitInfo.latence}ms`;
            
            kitConnected = true;
        } else {
            // Kit déconnecté
            banner.className = 'kit-status-banner disconnected';
            banner.innerHTML = `❌ Kit d'Interconnexion inaccessible - Mode autonome`;
            
            indicator.className = 'status-indicator';
            statusText.textContent = 'Kit Inaccessible';
            details.textContent = 'Workflow continue en mode autonome';
            
            kitConnected = false;
        }
        
    } catch (error) {
        console.error('Erreur vérification Kit:', error);
        kitConnected = false;
    }
}

// ✅ CORRECTION MAJEURE: Test de connexion Kit HYBRIDE (Direct + Proxy)
async function testerConnexionKit() {
    ajouterLogEntry('kit', 'Test connexion Kit', 'Test hybride: Direct + Proxy serveur...');
    afficherNotification('🔧 Test Kit en cours (Direct + Proxy)...', 'info');
    
    const resultats = {
        testDirect: null,
        testProxy: null,
        recommendation: ''
    };
    
    // === TEST 1: DIRECT vers MuleSoft (pour diagnostiquer CORS) ===
    console.log('🔍 Test 1: Browser → Kit MuleSoft (Direct)');
    try {
        const startTime = Date.now();
        const response = await fetch(`${KIT_MULESOFT_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'PAYS_B_DASHBOARD',
                'X-Source-Country': window.PAYS_CODE,
                'User-Agent': 'PaysB-Dashboard/1.0'
            },
            signal: AbortSignal.timeout(8000)
        });
        
        const latence = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            resultats.testDirect = {
                success: true,
                latence,
                status: response.status,
                version: data.version || 'N/A',
                methode: 'DIRECT_BROWSER'
            };
            console.log('✅ Test Direct réussi:', resultats.testDirect);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        resultats.testDirect = {
            success: false,
            latence: 0,
            erreur: error.message,
            methode: 'DIRECT_BROWSER'
        };
        console.log('❌ Test Direct échoué:', resultats.testDirect);
    }
    
    // === TEST 2: VIA PROXY SERVEUR ===
    console.log('🔍 Test 2: Browser → API Locale → Kit MuleSoft (Proxy)');
    try {
        const startTime = Date.now();
        const response = await fetch(`${API_BASE}/kit/test?type=health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(15000) // Plus de temps pour le proxy
        });
        
        const latence = Date.now() - startTime;
        const data = await response.json();
        
        if (response.ok && data.status === 'SUCCESS') {
            resultats.testProxy = {
                success: true,
                latence,
                latenceKit: data.resultat?.latence || 0,
                version: data.resultat?.version || 'N/A',
                methode: 'PROXY_SERVEUR'
            };
            console.log('✅ Test Proxy réussi:', resultats.testProxy);
        } else {
            throw new Error(data.message || 'Erreur proxy');
        }
        
    } catch (error) {
        resultats.testProxy = {
            success: false,
            latence: 0,
            erreur: error.message,
            methode: 'PROXY_SERVEUR'
        };
        console.log('❌ Test Proxy échoué:', resultats.testProxy);
    }
    
    // === ANALYSE DES RÉSULTATS ===
    if (resultats.testDirect.success && resultats.testProxy.success) {
        resultats.recommendation = 'Les deux méthodes fonctionnent - CORS autorisé';
        afficherNotification(`✅ Kit accessible - Direct: ${resultats.testDirect.latence}ms | Proxy: ${resultats.testProxy.latence}ms`, 'success');
        ajouterLogEntry('kit', 'Test Kit', `✅ Succès complet - Direct: ${resultats.testDirect.latence}ms, Proxy: ${resultats.testProxy.latence}ms`);
        kitConnected = true;
    } else if (!resultats.testDirect.success && resultats.testProxy.success) {
        resultats.recommendation = 'Seul le proxy fonctionne - CORS bloqué par navigateur';
        afficherNotification(`⚠️ Kit accessible via proxy uniquement (${resultats.testProxy.latence}ms) - CORS bloqué`, 'warning');
        ajouterLogEntry('kit', 'Test Kit', `⚠️ Proxy OK (${resultats.testProxy.latence}ms) - Direct bloqué: ${resultats.testDirect.erreur}`);
        kitConnected = true; // Via proxy
    } else if (resultats.testDirect.success && !resultats.testProxy.success) {
        resultats.recommendation = 'Direct OK mais proxy KO - Problème configuration serveur';
        afficherNotification(`⚠️ Kit accessible direct uniquement (${resultats.testDirect.latence}ms) - Proxy défaillant`, 'warning');
        ajouterLogEntry('kit', 'Test Kit', `⚠️ Direct OK (${resultats.testDirect.latence}ms) - Proxy KO: ${resultats.testProxy.erreur}`);
        kitConnected = true; // Via direct
    } else {
        resultats.recommendation = 'Kit MuleSoft complètement inaccessible';
        afficherNotification('❌ Kit MuleSoft inaccessible par toutes les méthodes', 'error');
        ajouterLogEntry('kit', 'Test Kit', `❌ Échec total - Direct: ${resultats.testDirect.erreur}, Proxy: ${resultats.testProxy.erreur}`);
        kitConnected = false;
    }
    
    console.log('📊 Résultat final du test hybride:', resultats);
    return resultats;
}

// ✅ NOUVEAU: Diagnostic complet Kit MuleSoft
async function lancerDiagnostic() {
    ajouterLogEntry('diagnostic', 'Diagnostic', 'Démarrage diagnostic complet Kit MuleSoft...');
    afficherNotification('🩺 Diagnostic Kit en cours...', 'info');
    
    try {
        // Utiliser le proxy serveur pour le diagnostic (plus fiable)
        const response = await fetch(`${API_BASE}/kit/test?type=diagnostic`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(30000) // 30 secondes pour diagnostic complet
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'SUCCESS') {
            const diagnostic = data.resultat;
            const testsReussis = Object.values(diagnostic.tests || {}).filter(t => t.success).length;
            const totalTests = Object.keys(diagnostic.tests || {}).length;
            
            const message = `Terminé - ${testsReussis}/${totalTests} tests réussis`;
            ajouterLogEntry('diagnostic', 'Diagnostic', message);
            
            if (testsReussis > 0) {
                afficherNotification(`✅ Kit opérationnel - ${message}`, 'success');
            } else {
                afficherNotification(`❌ Kit défaillant - ${message}`, 'error');
            }
            
            console.log('📊 Diagnostic Kit complet:', diagnostic);
        } else {
            throw new Error(data.message || 'Diagnostic échoué');
        }
        
    } catch (error) {
        ajouterLogEntry('diagnostic', 'Diagnostic', `❌ Erreur - ${error.message}`);
        afficherNotification('❌ Diagnostic Kit échoué', 'error');
        console.error('Erreur diagnostic:', error);
    }
}

// ✅ NOUVEAU: Test notification paiement vers Kit
async function testerNotificationPaiementKit() {
    ajouterLogEntry('kit', 'Test notification paiement', 'Test envoi notification paiement vers Kit...');
    
    try {
        const response = await fetch(`${API_BASE}/kit/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'notification_test',
                payload: {}
            }),
            signal: AbortSignal.timeout(15000)
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'SUCCESS') {
            afficherNotification('✅ Test notification paiement réussi', 'success');
            ajouterLogEntry('kit', 'Test notification paiement', `✅ Succès - Latence: ${data.resultat?.latence || 'N/A'}ms`);
        } else {
            throw new Error(data.message || 'Test notification échoué');
        }
        
    } catch (error) {
        afficherNotification('❌ Test notification échoué: ' + error.message, 'error');
        ajouterLogEntry('kit', 'Test notification paiement', `❌ Échec - ${error.message}`);
    }
}

// ===============================
// WORKFLOW AUTOMATIQUE (inchangé)
// ===============================

// Simulation workflow complet
async function simulerWorkflowComplet() {
    if (workflowActive) {
        afficherNotification('⏳ Workflow déjà en cours...', 'info');
        return;
    }
    
    workflowActive = true;
    resetWorkflow();
    
    const btnSimuler = document.getElementById('btn-simuler');
    btnSimuler.disabled = true;
    btnSimuler.innerHTML = '<div class="loading"></div> Simulation en cours...';
    
    afficherNotification('🚀 Démarrage simulation workflow', 'info');
    ajouterLogEntry('workflow', 'Simulation workflow', 'Démarrage du processus complet automatique');
    
    try {
        // Étape 1: Simuler réception manifeste depuis Kit
        activerEtape(1, 'Réception manifeste...');
        ajouterLogEntry('kit', 'Réception manifeste', 'Simulation manifeste depuis Kit MuleSoft');
        
        await attendre(1000);
        completerEtape(1, 'Manifeste reçu');
        
        // Étape 2: Déclaration automatique (2s)
        activerEtape(2, 'Création déclaration...');
        ajouterLogEntry('workflow', 'Création déclaration', 'Génération automatique déclaration douanière');
        
        await attendre(2000);
        completerEtape(2, 'Déclaration créée');
        
        // Étape 3: Liquidation (3s)
        activerEtape(3, 'Calcul droits...');
        ajouterLogEntry('workflow', 'Liquidation', 'Calcul automatique droits et taxes');
        
        await attendre(3000);
        const montant = Math.floor(Math.random() * 500000) + 100000;
        completerEtape(3, `Liquidé: ${montant.toLocaleString()} FCFA`);
        
        // Étape 4: Paiement automatique (5s)
        activerEtape(4, 'Paiement en cours...');
        ajouterLogEntry('workflow', 'Paiement automatique', `Acquittement ${montant.toLocaleString()} FCFA`);
        
        await attendre(5000);
        completerEtape(4, 'Paiement effectué');
        
        // Étape 5: Notification Kit (avec test réel si Kit accessible)
        activerEtape(5, 'Notification Kit...');
        ajouterLogEntry('kit', 'Notification paiement', 'Envoi notification vers Kit MuleSoft');
        
        if (kitConnected) {
            // Test réel de notification si Kit connecté
            try {
                await testerNotificationPaiementKitSilencieux(montant);
                await attendre(1000);
                completerEtape(5, 'Notifié au Kit');
                ajouterLogEntry('kit', 'Notification Kit', '✅ Paiement notifié avec succès (test réel)');
                afficherNotification('✅ Workflow complet terminé avec test Kit réel!', 'success');
            } catch (error) {
                await attendre(1000);
                marquerEtapeErreur(5, 'Erreur notification');
                ajouterLogEntry('kit', 'Notification Kit', `❌ Erreur notification réelle: ${error.message}`);
                afficherNotification('⚠️ Workflow terminé - Erreur notification Kit', 'warning');
            }
        } else {
            await attendre(1000);
            marquerEtapeErreur(5, 'Kit inaccessible');
            ajouterLogEntry('kit', 'Notification Kit', '❌ Échec - Kit inaccessible');
            afficherNotification('⚠️ Workflow terminé - Kit inaccessible', 'error');
        }
        
    } catch (error) {
        afficherNotification('❌ Erreur workflow: ' + error.message, 'error');
        ajouterLogEntry('error', 'Workflow', `❌ Erreur: ${error.message}`);
    } finally {
        workflowActive = false;
        btnSimuler.disabled = false;
        btnSimuler.innerHTML = '🧪 Simuler Workflow Complet';
    }
}

// Version silencieuse du test notification pour le workflow
async function testerNotificationPaiementKitSilencieux(montant) {
    const response = await fetch(`${API_BASE}/kit/test`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'notification_test',
            payload: { montant }
        }),
        signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
}

// ===============================
// FONCTIONS WORKFLOW UI (inchangées)
// ===============================

function activerEtape(numero, texte) {
    const etape = document.getElementById(`step-${numero}`);
    const stepNumber = etape.querySelector('.step-number');
    const status = document.getElementById(`step-${numero}-status`);
    
    etape.className = 'workflow-step active';
    stepNumber.className = 'step-number active';
    status.className = 'step-status active';
    status.textContent = texte;
}

function completerEtape(numero, texte) {
    const etape = document.getElementById(`step-${numero}`);
    const stepNumber = etape.querySelector('.step-number');
    const status = document.getElementById(`step-${numero}-status`);
    
    etape.className = 'workflow-step completed';
    stepNumber.className = 'step-number completed';
    status.className = 'step-status completed';
    status.textContent = texte;
}

function marquerEtapeErreur(numero, texte) {
    const etape = document.getElementById(`step-${numero}`);
    const stepNumber = etape.querySelector('.step-number');
    const status = document.getElementById(`step-${numero}-status`);
    
    etape.className = 'workflow-step error';
    stepNumber.className = 'step-number error';
    status.className = 'step-status error';
    status.textContent = texte;
}

function resetWorkflow() {
    for (let i = 1; i <= 5; i++) {
        const etape = document.getElementById(`step-${i}`);
        const stepNumber = etape.querySelector('.step-number');
        const status = document.getElementById(`step-${i}-status`);
        
        etape.className = 'workflow-step waiting';
        stepNumber.className = 'step-number waiting';
        status.className = 'step-status waiting';
        status.textContent = 'En attente...';
    }
}

// ===============================
// FONCTIONS UTILITAIRES (inchangées)
// ===============================

// Charger données
async function chargerDonnees() {
    await Promise.all([
        chargerStatistiques(),
        chargerManifestes(),
        chargerPaiements()
    ]);
}

// Charger statistiques
async function chargerStatistiques() {
    try {
        const response = await fetch(`${API_BASE}/statistiques`);
        const data = await response.json();
        
        if (data.status === 'SUCCESS') {
            const stats = data.statistiques;
            
            document.getElementById('stat-manifestes').textContent = stats.manifestesRecus;
            document.getElementById('stat-workflows').textContent = data.workflow?.actifs || 0;
            document.getElementById('stat-paiements').textContent = stats.paiementsEffectues;
            document.getElementById('taux-automatisation').textContent = stats.tauxAutomatisation + '%';
            document.getElementById('temps-moyen').textContent = 
                stats.performance?.tempsTraitementMoyen > 0 ? stats.performance.tempsTraitementMoyen + ' s' : '-- s';
        }
        
    } catch (error) {
        console.error('Erreur chargement statistiques:', error);
    }
}

// Charger manifestes
async function chargerManifestes() {
    try {
        const response = await fetch(`${API_BASE}/manifeste/lister?limite=5`);
        const data = await response.json();
        
        const container = document.getElementById('manifestes-list');
        
        if (data.status === 'SUCCESS' && data.manifestes.length > 0) {
            container.innerHTML = data.manifestes.map(manifeste => {
                const statusClass = manifeste.workflow?.statut === 'COMPLETE' ? 'success' : 
                                   manifeste.workflow?.statut === 'EN_COURS' ? 'processing' : '';
                
                return `
                    <div class="data-item from-kit">
                        <div class="item-header">
                            📨 ${manifeste.numeroOrigine} - ${manifeste.transporteur}
                            <span class="item-status ${statusClass}">
                                ${manifeste.workflow?.statut || 'RECU'}
                            </span>
                        </div>
                        <div class="item-details">
                            📍 Depuis: ${manifeste.origine?.pays || 'Kit'}<br>
                            📦 ${manifeste.marchandises.nombre} marchandise(s)<br>
                            🔄 Étape: ${manifeste.workflow?.etapeActuelle || 'RECEPTION'}<br>
                            📅 ${new Date(manifeste.dateReception).toLocaleString('fr-FR')}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>En attente de manifestes du Kit...</p>';
        }
        
    } catch (error) {
        console.error('Erreur chargement manifestes:', error);
        document.getElementById('manifestes-list').innerHTML = '<p>Erreur de chargement</p>';
    }
}

// Charger paiements
async function chargerPaiements() {
    try {
        const response = await fetch(`${API_BASE}/paiement/lister?limite=3`);
        const data = await response.json();
        
        const container = document.getElementById('paiements-list');
        
        if (data.status === 'SUCCESS' && data.paiements.length > 0) {
            container.innerHTML = data.paiements.map(paiement => `
                <div class="data-item automated">
                    <div class="item-header">
                        💳 ${paiement.id}
                        <span class="item-status success">CONFIRME</span>
                    </div>
                    <div class="item-details">
                        💰 Montant: ${paiement.montantPaye.toLocaleString()} FCFA<br>
                        🏦 Mode: ${paiement.modePaiement}<br>
                        📅 ${new Date(paiement.datePaiement).toLocaleString('fr-FR')}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Aucun paiement effectué</p>';
        }
    } catch (error) {
        console.error('Erreur chargement paiements:', error);
        document.getElementById('paiements-list').innerHTML = '<p>Erreur de chargement</p>';
    }
}

// Ajouter entrée dans le log
function ajouterLogEntry(type, action, details) {
    const container = document.getElementById('kit-log');
    const timestamp = new Date().toLocaleTimeString();
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <strong>${action}</strong> - ${details}
        <span style="float: right; color: #6c757d; font-size: 0.8em;">${timestamp}</span>
    `;
    
    container.prepend(entry);
    
    // Garder seulement les 20 dernières entrées
    const entries = container.querySelectorAll('.log-entry');
    if (entries.length > 20) {
        entries[entries.length - 1].remove();
    }
}

// Utilitaires
function attendre(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function afficherNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Fonctions publiques pour les boutons HTML
window.chargerStatistiques = chargerStatistiques;
window.chargerManifestes = chargerManifestes;
window.chargerPaiements = chargerPaiements;
window.simulerWorkflowComplet = simulerWorkflowComplet;
window.testerConnexionKit = testerConnexionKit;
window.lancerDiagnostic = lancerDiagnostic;
window.testerNotificationPaiementKit = testerNotificationPaiementKit;

// Cleanup
window.addEventListener('beforeunload', () => {
    if (statusInterval) clearInterval(statusInterval);
    if (refreshInterval) clearInterval(refreshInterval);
});