// ============================================================================
// MALI - Script Frontend Transit CORRIGÉ - Version Simplifiée
// Fichier: public/script-transit.js
// Étapes 8-13 avec simplifications des étapes 10, 11, 12
// ============================================================================

const API_BASE_TRANSIT = window.location.origin + '/api';
let transitSelectionne = null;
let refreshIntervalTransit;

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚛 [MALI TRANSIT] Initialisation...');
    
    // Charger les données initiales
    await chargerTransitsDisponibles();
    await chargerStatistiquesTransit();
    
    // Rafraîchir automatiquement
    refreshIntervalTransit = setInterval(async () => {
        await chargerTransitsDisponibles();
        await chargerStatistiquesTransit();
    }, 10000);
});

// ============================================
// GESTION DES MODALES
// ============================================

function ouvrirModalTransit(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function fermerModalTransit(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Fermer modal en cliquant dehors
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// ============================================
// ÉTAPE 8 : DÉPÔT DÉCLARATION DÉTAILLÉE
// ============================================

function ouvrirModalEtape8Transit() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    transitSelectionne = transitId;
    
    // Pré-remplir les valeurs
    const form = document.getElementById('form-etape-8-transit');
    form.numeroDeclarationDetail.value = `DET_${Date.now()}`;
    form.connaissement.value = `BL_TRANS_${Date.now()}`;
    form.factureCommerciale.value = `FC_TRANS_${Date.now()}`;
    
    ouvrirModalTransit('modal-etape-8-transit');
}

async function soumettreEtape8Transit() {
    const form = document.getElementById('form-etape-8-transit');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        numeroDeclarationDetail: form.numeroDeclarationDetail.value,
        declarantMalien: form.declarantMalien.value,
        importateurDestination: form.importateurDestination.value,
        codeSH: form.codeSH.value,
        valeurDeclaree: parseInt(form.valeurDeclaree.value),
        connaissement: form.connaissement.value,
        factureCommerciale: form.factureCommerciale.value,
        certificatOrigine: form.certificatOrigine.value
    };
    
    fermerModalTransit('modal-etape-8-transit');
    afficherNotificationTransit('⚙️ Traitement ÉTAPE 8...', 'info');
    
    await executerEtapeTransit('deposer_declaration_detaillee', donnees);
}

// ============================================
// ÉTAPE 9 : VISA DOUANIER
// ============================================

function ouvrirModalEtape9Transit() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    transitSelectionne = transitId;
    
    // Pré-remplir
    const form = document.getElementById('form-etape-9-transit');
    form.numeroVisa.value = `VISA_MLI_${Date.now()}`;
    
    ouvrirModalTransit('modal-etape-9-transit');
}

async function soumettreEtape9Transit() {
    const form = document.getElementById('form-etape-9-transit');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        numeroVisa: form.numeroVisa.value,
        agentDouanier: form.agentDouanier.value,
        itineraireVerifie: form.itineraireVerifie.value === 'true',
        itineraireConforme: form.itineraireConforme.value === 'true',
        documentsComplets: form.documentsComplets.value === 'true',
        documentsAuthentiques: form.documentsAuthentiques.value === 'true',
        quantiteCorrespond: form.quantiteCorrespond.value === 'true',
        scellementsIntacts: form.scellementsIntacts.value === 'true',
        decisionVisa: form.decisionVisa.value,
        observations: form.observations.value
    };
    
    fermerModalTransit('modal-etape-9-transit');
    afficherNotificationTransit('⚙️ Apposition visa douanier...', 'info');
    
    await executerEtapeTransit('apposer_visa_douanier', donnees);
}

// ============================================
// ÉTAPES 10, 11, 12 : SIMPLIFIÉES - JUSTE VALIDATION
// ============================================

async function validerEtape10Transit() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    transitSelectionne = transitId;
    afficherNotificationTransit('⚙️ Validation ÉTAPE 10...', 'info');
    
    await executerEtapeTransit('effectuer_verifications', {});
}

async function validerEtape11Transit() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    transitSelectionne = transitId;
    afficherNotificationTransit('⚙️ Validation ÉTAPE 11...', 'info');
    
    await executerEtapeTransit('etape_11_suivant', {});
}

async function validerEtape12Transit() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    transitSelectionne = transitId;
    afficherNotificationTransit('⚙️ Validation ÉTAPE 12...', 'info');
    
    await executerEtapeTransit('etape_12_suivant', {});
}

// ============================================
// ÉTAPE 13 : CONFIRMATION ARRIVÉE + APPEL MULESOFT
// ============================================

async function confirmerArriveeEtTransmettreTransit() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    transitSelectionne = transitId;
    afficherNotificationTransit('⚙️ ÉTAPE 13 : Confirmation arrivée et transmission vers MuleSoft...', 'info');
    
    const donnees = {
        controleEffectue: true,
        visaAppose: true,
        conformiteItineraire: true,
        delaiRespecte: true,
        declarationDetailDeposee: true,
        agentReceptionnaire: 'AGENT_ARRIVEE_MALI',
        observationsArrivee: 'Arrivée confirmée et validée'
    };
    
    await executerEtapeTransit('confirmer_arrivee_et_transmettre', donnees);
}

// ============================================
// EXÉCUTION DES ÉTAPES
// ============================================

async function executerEtapeTransit(action, donnees) {
    const transitId = transitSelectionne || document.getElementById('select-transit-mali').value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Aucun transit sélectionné', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_TRANSIT}/workflow/transit-manuel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'MALI_TRANSIT_FRONTEND'
            },
            body: JSON.stringify({
                action: action,
                transitId: transitId,
                donnees: donnees || {}
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            afficherResultatTransit(data);
            
            // Message spécifique selon l'étape
            if (action === 'confirmer_arrivee_et_transmettre') {
                if (data.resultat?.transmissionReussie) {
                    afficherNotificationTransit('✅ ÉTAPE 13 terminée - Message transmis à MuleSoft', 'success');
                } else {
                    afficherNotificationTransit('⚠️ Arrivée confirmée mais transmission MuleSoft échouée', 'warning');
                }
            } else {
                afficherNotificationTransit('✅ Étape terminée avec succès', 'success');
            }
            
            // Actualiser les données
            setTimeout(() => {
                chargerTransitsDisponibles();
                chargerStatistiquesTransit();
            }, 1000);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur étape');
        }
        
    } catch (error) {
        console.error('❌ Erreur exécution étape transit:', error);
        afficherNotificationTransit(`❌ Erreur: ${error.message}`, 'error');
    }
}

// ============================================
// WORKFLOW COMPLET
// ============================================

async function executerWorkflowTransitComplet() {
    const selectTransit = document.getElementById('select-transit-mali');
    const transitId = selectTransit.value;
    
    if (!transitId) {
        afficherNotificationTransit('⚠️ Veuillez d\'abord sélectionner un transit', 'warning');
        return;
    }
    
    const btnWorkflow = document.getElementById('btn-workflow-transit-complet');
    btnWorkflow.disabled = true;
    btnWorkflow.innerHTML = '⏳ Workflow en cours...<br><small>Veuillez patienter</small>';
    
    afficherNotificationTransit('🚀 Démarrage workflow transit complet (étapes 8-13)...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_TRANSIT}/workflow/transit-manuel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'workflow_transit_complet',
                transitId: transitId
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            afficherResultatTransit(data);
            
            if (data.resultat?.status === 'WORKFLOW_COMPLET') {
                if (data.resultat?.transmissionReussie) {
                    afficherNotificationTransit('🎉 Workflow transit complet terminé avec succès!', 'success');
                } else {
                    afficherNotificationTransit('⚠️ Workflow terminé mais transmission MuleSoft échouée', 'warning');
                }
            } else {
                afficherNotificationTransit('⚠️ Workflow terminé avec erreurs', 'warning');
            }
            
            setTimeout(() => {
                chargerTransitsDisponibles();
                chargerStatistiquesTransit();
            }, 1000);
        } else {
            throw new Error('Erreur workflow');
        }
        
    } catch (error) {
        console.error('❌ Erreur workflow:', error);
        afficherNotificationTransit(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        btnWorkflow.disabled = false;
        btnWorkflow.innerHTML = '🚀 Exécuter Workflow Complet<br><small>(Étapes 8 à 13 en une fois)</small>';
    }
}

// ============================================
// AFFICHAGE RÉSULTATS
// ============================================

function afficherResultatTransit(data) {
    const container = document.getElementById('resultat-transit');
    container.style.display = 'block';
    
    let html = '<div class="result-container">';
    
    // Header
    html += `
        <div class="result-header">
            <div class="result-icon">🚛</div>
            <div class="result-title">
                <h3>${data.message || 'Résultat de l\'opération'}</h3>
                <p>${new Date().toLocaleString('fr-FR')}</p>
            </div>
        </div>
    `;
    
    // Contenu selon l'étape
    if (data.resultat) {
        html += '<div class="result-grid">';
        
        const resultat = data.resultat;
        
        // Informations générales
        html += `
            <div class="result-card">
                <h4>📋 Étape</h4>
                <div class="result-value">${resultat.etape || resultat.etapes || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>✅ Action</h4>
                <div class="result-value">${resultat.action || 'N/A'}</div>
            </div>
        `;
        
        // Prochaine étape
        if (resultat.prochaine_etape) {
            html += `
                <div class="result-card" style="grid-column: 1 / -1; background: #fff3cd; border-left-color: #fcd116;">
                    <h4>➡️ Prochaine Étape</h4>
                    <div class="result-value">${resultat.prochaine_etape}</div>
                </div>
            `;
        }
        
        // Workflow complet ou étape 13
        if (resultat.status === 'WORKFLOW_COMPLET' || resultat.action === 'ARRIVEE_CONFIRMEE_ET_TRANSMISE') {
            const transmissionOK = resultat.transmissionReussie || false;
            html += `
                <div class="result-card" style="grid-column: 1 / -1; background: ${transmissionOK ? '#d4edda' : '#fff3cd'}; border-left-color: ${transmissionOK ? '#14b53a' : '#ffc107'};">
                    <h4>${transmissionOK ? '🎉' : '⚠️'} ${resultat.workflowTermine ? 'Workflow Transit Terminé' : 'Étape 13 Terminée'}</h4>
                    <div class="result-value">
                        ${resultat.message || 'Opération effectuée'}<br>
                        Transmission MuleSoft: ${transmissionOK ? '✅ Réussie' : '❌ Échec'}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// CHARGEMENT DONNÉES
// ============================================

async function chargerTransitsDisponibles() {
    try {
        const response = await fetch(`${API_BASE_TRANSIT}/transit/lister?limite=20`);
        const data = await response.json();
        
        const select = document.getElementById('select-transit-mali');
        const container = document.getElementById('transits-list');
        
        if (data.status === 'SUCCESS' && data.transits && data.transits.length > 0) {
            // Mettre à jour le select
            select.innerHTML = '<option value="">-- Sélectionner un transit --</option>';
            data.transits.forEach(transit => {
                const option = document.createElement('option');
                option.value = transit.id;
                option.textContent = `${transit.numeroDeclaration} - ${transit.transport?.transporteur || 'N/A'} (${transit.statut})`;
                select.appendChild(option);
            });
            
            // Mettre à jour la liste
            let html = '';
            data.transits.forEach(transit => {
                const classe = transit.workflowTermine ? 'complete' : (transit.arrivee ? 'arrived' : 'waiting');
                
                html += `
                    <div class="transit-item ${classe}">
                        <div class="item-header">
                            <span>🚛 ${transit.numeroDeclaration}</span>
                            <span class="item-status ${classe}">
                                ${transit.workflowTermine ? '✅ Terminé' : (transit.arrivee ? '📦 Arrivée' : '⏳ En cours')}
                            </span>
                        </div>
                        <div class="item-details">
                            <strong>Transporteur:</strong> ${transit.transport?.transporteur || 'N/A'}<br>
                            <strong>Itinéraire:</strong> ${transit.transport?.itineraire || 'N/A'}<br>
                            <strong>Délai:</strong> ${transit.transport?.delaiRoute || 'N/A'}<br>
                            <strong>Reçu le:</strong> ${new Date(transit.dateReception).toLocaleString('fr-FR')}
                            ${transit.arrivee ? `<br><strong>Arrivé le:</strong> ${new Date(transit.arrivee.dateArrivee).toLocaleString('fr-FR')}` : ''}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        } else {
            select.innerHTML = '<option value="">-- Aucun transit disponible --</option>';
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #6c757d;">Aucun transit reçu</p>';
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement transits:', error);
    }
}

async function chargerStatistiquesTransit() {
    try {
        const response = await fetch(`${API_BASE_TRANSIT}/statistiques`);
        const data = await response.json();
        
        if (data.status === 'SUCCESS' && data.statistiques) {
            document.getElementById('stat-recus').textContent = 
                data.statistiques.declarationsTransitRecues || 0;
            document.getElementById('stat-arrivees').textContent = 
                data.statistiques.arriveesMarchandises || 0;
            document.getElementById('stat-messages').textContent = 
                data.statistiques.messagesArriveeEnvoyes || 0;
        }
    } catch (error) {
        console.error('❌ Erreur stats:', error);
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function afficherNotificationTransit(message, type) {
    const notification = document.getElementById('notification-transit');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// ============================================
// CLEANUP
// ============================================

window.addEventListener('beforeunload', () => {
    if (refreshIntervalTransit) clearInterval(refreshIntervalTransit);
});