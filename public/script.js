// Configuration API
const API_BASE = window.location.origin + '/api';
let statusInterval;
let refreshInterval;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation Simulateur Pays B');
    
    // Vérifier le statut périodiquement
    verifierStatut();
    statusInterval = setInterval(verifierStatut, 30000);
    
    // Actualiser les données toutes les 5 secondes
    chargerToutesLesDonnees();
    refreshInterval = setInterval(chargerToutesLesDonnees, 5000);
});

// Vérification du statut du service
async function verifierStatut() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        if (data.status === 'UP') {
            indicator.textContent = '🟢';
            text.textContent = 'Service actif';
        } else {
            indicator.textContent = '🔴';
            text.textContent = 'Service indisponible';
        }
    } catch (error) {
        document.getElementById('status-indicator').textContent = '🔴';
        document.getElementById('status-text').textContent = 'Erreur connexion';
    }
}

// Chargement de toutes les données
async function chargerToutesLesDonnees() {
    await Promise.all([
        chargerStatistiques(),
        chargerManifestes(),
        chargerDeclarations(),
        chargerPaiements()
    ]);
}

// Chargement des statistiques
async function chargerStatistiques() {
    try {
        const response = await fetch(`${API_BASE}/statistiques`);
        const data = await response.json();
        
        document.getElementById('stat-manifestes').textContent = data.statistiques.manifestesRecus;
        document.getElementById('stat-declarations').textContent = data.statistiques.declarationsCreees;
        document.getElementById('stat-paiements').textContent = data.statistiques.paiementsEffectues;
        
    } catch (error) {
        console.error('Erreur chargement statistiques:', error);
    }
}

// Chargement des manifestes
async function chargerManifestes() {
    try {
        const response = await fetch(`${API_BASE}/manifeste/reception`);
        const data = await response.json();
        
        const container = document.getElementById('manifestes-list');
        
        if (data.manifestes && data.manifestes.length > 0) {
            container.innerHTML = data.manifestes
                .slice(-5)
                .reverse()
                .map(manifeste => `
                    <div class="manifeste-item">
                        <div class="item-header">
                            📨 ${manifeste.id} - ${manifeste.manifeste?.numeroOrigine || 'N/A'}
                        </div>
                        <div class="item-details">
                            🚢 Transporteur: ${manifeste.manifeste?.transporteur || 'N/A'}<br>
                            📦 ${manifeste.marchandises?.length || 0} marchandises<br>
                            🏷️ Statut: ${manifeste.statut}<br>
                            📅 ${new Date(manifeste.dateReception).toLocaleString('fr-FR')}
                        </div>
                    </div>
                `).join('');
        } else {
            container.innerHTML = '<p>En attente de manifestes...</p>';
        }
        
    } catch (error) {
        console.error('Erreur chargement manifestes:', error);
    }
}

// Simulation de réception de manifeste
async function simulerReceptionManifeste() {
    const manifesteTest = {
        manifeste: {
            numeroOrigine: `TEST${Date.now()}`,
            transporteur: 'SIMULATION CARRIER',
            portOrigine: 'ABIDJAN',
            dateArrivee: new Date().toISOString().split('T')[0],
            paysOrigine: 'CIV'
        },
        marchandises: [{
            position: 1,
            codeTarifaire: '8703.21.10',
            description: 'Véhicule de test',
            poidsNet: 1500.00,
            quantite: 1,
            importateur: 'IMPORT TEST SARL',
            valeurEstimee: 5000000
        }]
    };
    
    try {
        const response = await fetch(`${API_BASE}/manifeste/reception`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(manifesteTest)
        });
        
        const result = await response.json();
        
        const resultDiv = document.getElementById('simulation-result');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h4>✅ Simulation réussie</h4>
            <p><strong>Manifeste:</strong> ${result.numeroManifeste}</p>
            <p><strong>Statut:</strong> ${result.status}</p>
            <p><strong>Message:</strong> ${result.message}</p>
            <p><strong>Estimation:</strong> ${result.estimationDeclaration}</p>
        `;
        
        afficherNotification('🧪 Simulation de manifeste déclenchée!', 'info');
        
    } catch (error) {
        console.error('Erreur simulation:', error);
        afficherNotification('❌ Erreur de simulation', 'error');
    }
}

// Chargement des déclarations (fonction similaire pour les autres)
async function chargerDeclarations() {
    // Logique pour charger les déclarations
    // À implémenter selon les besoins
}

async function chargerPaiements() {
    // Logique pour charger les paiements
    // À implémenter selon les besoins
}

// Affichage des notifications
function afficherNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Nettoyage à la fermeture
window.addEventListener('beforeunload', () => {
    if (statusInterval) {
        clearInterval(statusInterval);
    }
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});