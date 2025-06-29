// Configuration API
const API_BASE = window.location.origin + '/api';
const KIT_URL = 'https://kit-interconnexion-uemoa-v4320.m3jzw3-1.deu-c1.cloudhub.io';

let statusInterval;
let refreshInterval;
let kitConnected = false;
let workflowActive = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation Pays B - Workflow Automatique + Kit MuleSoft');
    
    document.getElementById('init-time').textContent = new Date().toLocaleTimeString();
    
    // Vérifications périodiques
    verifierStatutKit();
    statusInterval = setInterval(verifierStatutKit, 15000);
    
    // Actualisation données
    chargerDonnees();
    refreshInterval = setInterval(chargerDonnees, 8000);
    
    ajouterLogEntry('workflow', 'Service démarré', 'Pays B opérationnel - Workflow automatique activé');
});

// Vérification du statut Kit
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

// Test de connexion Kit
async function testerConnexionKit() {
    ajouterLogEntry('kit', 'Test connexion Kit', 'Test de connectivité démarré...');
    
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.kit.accessible) {
            afficherNotification(`✅ Kit accessible - Latence: ${data.kit.latence}ms`, 'success');
            ajouterLogEntry('kit', 'Test Kit', `✅ Succès - Latence: ${data.kit.latence}ms`);
        } else {
            throw new Error('Kit inaccessible');
        }
        
    } catch (error) {
        afficherNotification('❌ Kit inaccessible: ' + error.message, 'error');
        ajouterLogEntry('kit', 'Test Kit', `❌ Échec: ${error.message}`);
    }
}

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
        
        // Étape 5: Notification Kit
        activerEtape(5, 'Notification Kit...');
        ajouterLogEntry('kit', 'Notification paiement', 'Envoi notification vers Kit MuleSoft');
        
        if (kitConnected) {
            await attendre(1000);
            completerEtape(5, 'Notifié au Kit');
            ajouterLogEntry('kit', 'Notification Kit', '✅ Paiement notifié avec succès');
            afficherNotification('✅ Workflow complet terminé avec succès!', 'success');
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

// Gestion des étapes workflow
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

// Cleanup
window.addEventListener('beforeunload', () => {
    if (statusInterval) clearInterval(statusInterval);
    if (refreshInterval) clearInterval(refreshInterval);
});