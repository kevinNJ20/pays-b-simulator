// Configuration API - PAYS B CORRIGÉ
const API_BASE = window.location.origin + '/api';
const KIT_MULESOFT_URL = 'https://kit-interconnexion-uemoa-v4320.m3jzw3-1.deu-c1.cloudhub.io/api/v1';
window.SYSTEME_TYPE = 'PAYS_B';
window.PAYS_CODE = 'BFA';

let statusInterval;
let refreshInterval;
let kitConnected = false;
let workflowActive = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation Pays B - Workflow Automatique + Kit MuleSoft avec Test Direct');
    
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

// ✅ CORRECTION: Test de connexion Kit DIRECT vers MuleSoft
async function testerConnexionKit() {
    ajouterLogEntry('kit', 'Test connexion Kit', 'Test connectivité directe vers Kit MuleSoft...');
    
    const startTime = Date.now();
    
    try {
        // ✅ APPEL DIRECT vers le Kit MuleSoft
        const response = await fetch(`${KIT_MULESOFT_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'PAYS_B_DASHBOARD',
                'X-Source-Country': window.PAYS_CODE,
                'User-Agent': 'PaysB-Dashboard/1.0'
            },
            signal: AbortSignal.timeout(10000) // 10 secondes timeout
        });
        
        const latence = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            afficherNotification(`✅ Kit MuleSoft accessible - ${response.status} (${latence}ms)`, 'success');
            ajouterLogEntry('kit', 'Test Kit Direct', `✅ Succès - Latence: ${latence}ms, Version: ${data.version || 'N/A'}`);
            
            // Log détaillé du Kit
            console.log('📊 Réponse Kit MuleSoft:', data);
            
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        const latence = Date.now() - startTime;
        let messageErreur = 'Kit MuleSoft inaccessible';
        
        if (error.name === 'TimeoutError') {
            messageErreur = 'Timeout - Kit MuleSoft ne répond pas (>10s)';
        } else if (error.message.includes('CORS')) {
            messageErreur = 'Erreur CORS - Configuration Kit à vérifier';
        } else if (error.message.includes('Failed to fetch')) {
            messageErreur = 'Erreur réseau - Kit MuleSoft inaccessible';
        } else {
            messageErreur = `Erreur: ${error.message}`;
        }
        
        afficherNotification(`❌ ${messageErreur} (${latence}ms)`, 'error');
        ajouterLogEntry('kit', 'Test Kit Direct', `❌ Échec - ${messageErreur}`);
    }
}

// ✅ NOUVEAU: Test complet (Direct + Via API locale)
async function testerConnexionKitComplet() {
    ajouterLogEntry('kit', 'Test complet', 'Test connectivité Kit - Direct + Via API locale');
    
    // Test 1: Direct depuis le browser
    console.log('🔍 Test 1: Connectivité directe browser → Kit MuleSoft');
    const testDirect = await testerKitDirect();
    
    // Test 2: Via l'API locale 
    console.log('🔍 Test 2: Connectivité via API locale → Kit MuleSoft');
    const testViaAPI = await testerKitViaAPI();
    
    // Comparaison des résultats
    const resultats = {
        testDirect: {
            accessible: testDirect.accessible,
            latence: testDirect.latence,
            source: 'Browser → Kit MuleSoft'
        },
        testViaAPI: {
            accessible: testViaAPI.accessible,
            latence: testViaAPI.latence,
            source: 'API Locale → Kit MuleSoft'
        },
        coherent: testDirect.accessible === testViaAPI.accessible
    };
    
    console.log('📊 Comparaison tests Kit:', resultats);
    
    const message = `Direct: ${testDirect.accessible ? '✅' : '❌'} (${testDirect.latence}ms) | ` +
                   `API: ${testViaAPI.accessible ? '✅' : '❌'} (${testViaAPI.latence}ms)`;
    
    ajouterLogEntry('kit', 'Test complet', message);
    
    if (!resultats.coherent) {
        afficherNotification('⚠️ Résultats incohérents entre test direct et API locale', 'warning');
    } else {
        afficherNotification('✅ Tests cohérents - Connectivité validée', 'success');
    }
    
    return resultats;
}

// Test Kit direct (helper function)
async function testerKitDirect() {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${KIT_MULESOFT_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'PAYS_B_DASHBOARD',
                'X-Source-Country': window.PAYS_CODE
            },
            signal: AbortSignal.timeout(8000)
        });
        
        const latence = Date.now() - startTime;
        
        return {
            accessible: response.ok,
            latence,
            status: response.status
        };
        
    } catch (error) {
        return {
            accessible: false,
            latence: Date.now() - startTime,
            erreur: error.message
        };
    }
}

// Test Kit via API locale (helper function)  
async function testerKitViaAPI() {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        const latence = Date.now() - startTime;
        
        return {
            accessible: data.kit?.accessible || false,
            latence: data.kit?.latence || latence
        };
        
    } catch (error) {
        return {
            accessible: false,
            latence: Date.now() - startTime,
            erreur: error.message
        };
    }
}

// ✅ NOUVEAU: Diagnostic complet Kit MuleSoft (spécifique Pays B)
async function lancerDiagnostic() {
    ajouterLogEntry('kit', 'Diagnostic', 'Démarrage diagnostic complet Kit MuleSoft...');
    afficherNotification('🩺 Diagnostic Kit en cours...', 'info');
    
    const diagnostic = {
        timestamp: new Date().toISOString(),
        systeme: window.SYSTEME_TYPE,
        pays: window.PAYS_CODE,
        tests: {}
    };
    
    // Test 1: Health Check
    console.log('🏥 Test Health Check...');
    diagnostic.tests.health = await testerEndpointKit('/health', 'GET');
    
    // Test 2: Console Access
    console.log('🖥️ Test Console Access...');
    diagnostic.tests.console = await testerEndpointKit('/console', 'GET');
    
    // Test 3: Endpoint Notification Paiement (spécifique Pays B)
    console.log('💳 Test endpoint notification paiement...');
    diagnostic.tests.paiementNotification = await testerEndpointKit('/paiement/notification', 'POST', {
        numeroDeclaration: `TEST_DEC_${Date.now()}`,
        manifesteOrigine: `TEST_MAN_${Date.now()}`,
        montantPaye: 100000,
        referencePaiement: `TEST_PAY_${Date.now()}`,
        datePaiement: new Date().toISOString(),
        paysDeclarant: window.PAYS_CODE
    });
    
    // Test 4: Endpoint Reception Manifeste (pour vérifier réception depuis Kit)
    console.log('📨 Test endpoint réception manifeste...');
    diagnostic.tests.manifesteReception = await testerEndpointKit('/manifeste/reception', 'GET');
    
    // Résumé du diagnostic
    const testsReussis = Object.values(diagnostic.tests).filter(t => t.accessible).length;
    const totalTests = Object.keys(diagnostic.tests).length;
    
    diagnostic.resume = {
        testsReussis,
        totalTests,
        tauxReussite: Math.round((testsReussis / totalTests) * 100),
        kitOperationnel: testsReussis > 0
    };
    
    console.log('📊 Diagnostic Kit terminé:', diagnostic.resume);
    
    const message = `Terminé - ${testsReussis}/${totalTests} tests réussis (${diagnostic.resume.tauxReussite}%)`;
    ajouterLogEntry('kit', 'Diagnostic', message);
    
    if (diagnostic.resume.kitOperationnel) {
        afficherNotification(`✅ Kit opérationnel - ${message}`, 'success');
    } else {
        afficherNotification(`❌ Kit défaillant - ${message}`, 'error');
    }
    
    return diagnostic;
}

// Utilitaire pour tester un endpoint spécifique du Kit
async function testerEndpointKit(endpoint, method = 'GET', testData = null) {
    const startTime = Date.now();
    
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'PAYS_B_DASHBOARD',
                'X-Source-Country': window.PAYS_CODE,
                'X-Test-Type': 'DIAGNOSTIC'
            },
            signal: AbortSignal.timeout(5000)
        };
        
        // Pour les tests POST, ajouter des données test
        if (method === 'POST') {
            options.body = JSON.stringify(testData || {
                test: true,
                timestamp: new Date().toISOString(),
                source: 'PAYS_B_DIAGNOSTIC'
            });
        }
        
        const response = await fetch(`${KIT_MULESOFT_URL}${endpoint}`, options);
        const latence = Date.now() - startTime;
        
        return {
            accessible: response.ok,
            status: response.status,
            latence,
            endpoint,
            method
        };
        
    } catch (error) {
        return {
            accessible: false,
            status: 0,
            latence: Date.now() - startTime,
            endpoint,
            method,
            erreur: error.message
        };
    }
}

// ✅ NOUVEAU: Test notification paiement vers Kit (test réel d'intégration)
async function testerNotificationPaiementKit() {
    ajouterLogEntry('kit', 'Test notification paiement', 'Test envoi notification paiement vers Kit...');
    
    const paiementTest = {
        numeroDeclaration: `TEST_DEC_${Date.now()}`,
        manifesteOrigine: `TEST_MAN_${Date.now()}`,
        montantPaye: 150000,
        referencePaiement: `TEST_PAY_${Date.now()}`,
        datePaiement: new Date().toISOString(),
        paysDeclarant: window.PAYS_CODE
    };
    
    try {
        const startTime = Date.now();
        
        const response = await fetch(`${KIT_MULESOFT_URL}/paiement/notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'PAYS_B_DASHBOARD',
                'X-Source-Country': window.PAYS_CODE,
                'X-Test-Type': 'PAIEMENT_TEST'
            },
            body: JSON.stringify(paiementTest),
            signal: AbortSignal.timeout(10000)
        });
        
        const latence = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            afficherNotification(`✅ Notification paiement test envoyée - ${response.status} (${latence}ms)`, 'success');
            ajouterLogEntry('kit', 'Test notification paiement', `✅ Succès - ${paiementTest.referencePaiement} (${latence}ms)`);
            console.log('💳 Réponse notification paiement:', data);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        const messageErreur = error.message.includes('Timeout') ? 'Timeout Kit' : error.message;
        afficherNotification(`❌ Échec test notification paiement: ${messageErreur}`, 'error');
        ajouterLogEntry('kit', 'Test notification paiement', `❌ Échec - ${messageErreur}`);
    }
}

// Simulation workflow complet (reste inchangé avec amélioration des logs)
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
    const paiementTest = {
        numeroDeclaration: `SIM_DEC_${Date.now()}`,
        manifesteOrigine: `SIM_MAN_${Date.now()}`,
        montantPaye: montant,
        referencePaiement: `SIM_PAY_${Date.now()}`,
        datePaiement: new Date().toISOString(),
        paysDeclarant: window.PAYS_CODE
    };
    
    const response = await fetch(`${KIT_MULESOFT_URL}/paiement/notification`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Source-System': 'PAYS_B_WORKFLOW',
            'X-Source-Country': window.PAYS_CODE,
            'X-Test-Type': 'WORKFLOW_SIMULATION'
        },
        body: JSON.stringify(paiementTest),
        signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
}

// Gestion des étapes workflow (reste inchangé)
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

// Charger données (reste inchangé)
async function chargerDonnees() {
    await Promise.all([
        chargerStatistiques(),
        chargerManifestes(),
        chargerPaiements()
    ]);
}

// Charger statistiques (reste inchangé)
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

// Charger manifestes (reste inchangé)
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

// Charger paiements (reste inchangé)
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

// Ajouter entrée dans le log (reste inchangé)
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

// Utilitaires (reste inchangé)
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

// Cleanup (reste inchangé)
window.addEventListener('beforeunload', () => {
    if (statusInterval) clearInterval(statusInterval);
    if (refreshInterval) clearInterval(refreshInterval);
});