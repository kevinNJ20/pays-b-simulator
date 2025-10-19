// ============================================================================
// MALI - Script Frontend AMÉLIORÉ avec Modales Interactives
// Fichier: public/script.js
// ============================================================================

const API_BASE_MALI = window.location.origin + '/api';
window.SYSTEME_TYPE = 'PAYS_B';
window.PAYS_CODE = 'MLI';

let statusIntervalMali;
let refreshIntervalMali;
let articleCounter = 0;
let manifesteSelectionne = null;

// Initialisation Mali
document.addEventListener('DOMContentLoaded', function() {
    console.log('🇲🇱 Initialisation Mali - Pays B de destination (Bamako)');
    
    document.getElementById('init-time-mali').textContent = new Date().toLocaleTimeString();
    
    // Vérifications périodiques
    chargerDonneesMali();
    refreshIntervalMali = setInterval(chargerDonneesMali, 10000);
    
    // Charger la liste des manifestes disponibles
    chargerManifestesDisponibles();
    
    ajouterLogMali('workflow', 'Service démarré', 'Mali opérationnel - Workflow manuel étapes 6-16 activé');
});

// ============================================
// GESTION DES MODALES
// ============================================

function ouvrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Empêcher le scroll
    }
}

function fermerModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Réactiver le scroll
    }
}

// Fermer modal en cliquant en dehors
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
        document.body.style.overflow = '';
    }
});

// ============================================
// ÉTAPE 7 : COLLECTE DOCUMENTS GUCE
// ============================================

function ouvrirModalEtape7() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste', 'warning');
        return;
    }
    
    manifesteSelectionne = manifesteId;
    
    // Pré-remplir les valeurs par défaut
    const form = document.getElementById('form-etape-7');
    form.connaissement.value = `BL_${Date.now()}`;
    form.factureCommerciale.value = `FC_${Date.now()}`;
    form.declarationPrealable.value = `DP_${Date.now()}`;
    
    ouvrirModal('modal-etape-7');
}

async function soumettreEtape7() {
    const form = document.getElementById('form-etape-7');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        connaissement: form.connaissement.value,
        factureCommerciale: form.factureCommerciale.value,
        declarationPrealable: form.declarationPrealable.value,
        documentsBancaires: form.documentsBancaires.value.split(',').map(d => d.trim()).filter(d => d),
        operateurEconomique: form.operateurEconomique.value,
        declarantMalien: form.declarantMalien.value
    };
    
    fermerModal('modal-etape-7');
    afficherNotificationMali('⚙️ Traitement ÉTAPE 7...', 'info');
    
    await executerEtapeAvecDonnees('collecter_documents_guce', donnees);
}

// ============================================
// ÉTAPE 8 : CRÉATION DÉCLARATION
// ============================================

function ouvrirModalEtape8() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste', 'warning');
        return;
    }
    
    manifesteSelectionne = manifesteId;
    articleCounter = 0;
    
    // Charger les marchandises du manifeste
    chargerMarchandisesPourDeclaration(manifesteId);
    
    ouvrirModal('modal-etape-8');
}

async function chargerMarchandisesPourDeclaration(manifesteId) {
    try {
        const response = await fetch(`${API_BASE_MALI}/manifeste/lister?limite=100`);
        const data = await response.json();
        
        const manifeste = data.manifestes?.find(m => m.id === manifesteId);
        
        const container = document.getElementById('articles-container');
        container.innerHTML = '';
        
        if (manifeste && manifeste.marchandises && manifeste.marchandises.nombre > 0) {
            // Ajouter un article par défaut basé sur le manifeste
            ajouterArticle({
                designation: 'Marchandise du manifeste',
                codeSh: '8703210000',
                origine: 'SEN',
                nbreColis: 1,
                poidsBrut: 1000,
                poidsNet: 900,
                valeurCaf: 1000000
            });
        } else {
            // Ajouter un article vide par défaut
            ajouterArticle();
        }
        
    } catch (error) {
        console.error('Erreur chargement marchandises:', error);
        ajouterArticle(); // Ajouter un article vide en cas d'erreur
    }
}

function ajouterArticle(donnees = null) {
    articleCounter++;
    const container = document.getElementById('articles-container');
    
    const articleDiv = document.createElement('div');
    articleDiv.className = 'article-item';
    articleDiv.id = `article-${articleCounter}`;
    
    articleDiv.innerHTML = `
        <button type="button" class="btn-remove-article" onclick="retirerArticle(${articleCounter})">❌ Retirer</button>
        <h5 style="color: #2c3e50; margin-bottom: 15px;">Article ${articleCounter}</h5>
        
        <div class="form-row">
            <div class="form-group">
                <label class="required">Code SH (Tarif)</label>
                <input type="text" name="codeSh_${articleCounter}" value="${donnees?.codeSh || ''}" placeholder="Ex: 8703210000" required>
            </div>
            <div class="form-group">
                <label class="required">Désignation Commerciale</label>
                <input type="text" name="designation_${articleCounter}" value="${donnees?.designation || ''}" placeholder="Description de la marchandise" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="required">Origine</label>
                <select name="origine_${articleCounter}" required>
                    <option value="SEN" ${donnees?.origine === 'SEN' ? 'selected' : ''}>🇸🇳 Sénégal</option>
                    <option value="FRA">🇫🇷 France</option>
                    <option value="CHN">🇨🇳 Chine</option>
                    <option value="DEU">🇩🇪 Allemagne</option>
                    <option value="USA">🇺🇸 États-Unis</option>
                </select>
            </div>
            <div class="form-group">
                <label class="required">Nombre de Colis</label>
                <input type="number" name="nbreColis_${articleCounter}" value="${donnees?.nbreColis || 1}" min="1" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="required">Poids Brut (kg)</label>
                <input type="number" name="poidsBrut_${articleCounter}" value="${donnees?.poidsBrut || ''}" min="1" required>
            </div>
            <div class="form-group">
                <label class="required">Poids Net (kg)</label>
                <input type="number" name="poidsNet_${articleCounter}" value="${donnees?.poidsNet || ''}" min="1" required>
            </div>
            <div class="form-group">
                <label class="required">Valeur CAF (FCFA)</label>
                <input type="number" name="valeurCaf_${articleCounter}" value="${donnees?.valeurCaf || ''}" min="1" required>
            </div>
        </div>
    `;
    
    container.appendChild(articleDiv);
}

function retirerArticle(id) {
    const article = document.getElementById(`article-${id}`);
    if (article) {
        if (document.querySelectorAll('.article-item').length > 1) {
            article.remove();
        } else {
            afficherNotificationMali('⚠️ Vous devez conserver au moins un article', 'warning');
        }
    }
}

async function soumettreEtape8() {
    const form = document.getElementById('form-etape-8');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collecter les articles
    const articles = [];
    const articlesElements = document.querySelectorAll('.article-item');
    
    articlesElements.forEach((articleEl, index) => {
        const id = articleEl.id.split('-')[1];
        articles.push({
            numArt: index + 1,
            codeSh: form[`codeSh_${id}`].value,
            designationCom: form[`designation_${id}`].value,
            origine: form[`origine_${id}`].value,
            nbreColis: parseInt(form[`nbreColis_${id}`].value),
            poidsBrut: parseInt(form[`poidsBrut_${id}`].value),
            poidsNet: parseInt(form[`poidsNet_${id}`].value),
            valeurCaf: parseInt(form[`valeurCaf_${id}`].value),
            liquidation: Math.round(parseInt(form[`valeurCaf_${id}`].value) * 0.15) // Estimation 15%
        });
    });
    
    const donnees = {
        declarantMalien: form.declarantMalien.value,
        importateurMalien: form.importateurMalien.value,
        articles: articles,
        valeurTotaleDeclaree: articles.reduce((sum, art) => sum + art.valeurCaf, 0)
    };
    
    fermerModal('modal-etape-8');
    afficherNotificationMali('⚙️ Création déclaration...', 'info');
    
    await executerEtapeAvecDonnees('creer_declaration', donnees);
}

// ============================================
// ÉTAPES 9-10 : CONTRÔLES ET DEVIS
// ============================================

function ouvrirModalEtape910() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste', 'warning');
        return;
    }
    
    manifesteSelectionne = manifesteId;
    ouvrirModal('modal-etape-9-10');
}

async function soumettreEtape910() {
    const form = document.getElementById('form-etape-9-10');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        conformiteDocuments: form.conformiteDocuments.value === 'true',
        coherenceValeurs: form.coherenceValeurs.value === 'true',
        validiteOrigine: form.validiteOrigine.value === 'true',
        agentControleur: form.agentControleur.value,
        agentLiquidateur: form.agentLiquidateur.value,
        observationsControle: form.observationsControle.value
    };
    
    fermerModal('modal-etape-9-10');
    afficherNotificationMali('⚙️ Traitement contrôles et calcul devis...', 'info');
    
    await executerEtapeAvecDonnees('controler_et_calculer_devis', donnees);
}

// ============================================
// ÉTAPE 11 : ENREGISTREMENT
// ============================================

function ouvrirModalEtape11() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste', 'warning');
        return;
    }
    
    manifesteSelectionne = manifesteId;
    ouvrirModal('modal-etape-11');
}

async function soumettreEtape11() {
    const form = document.getElementById('form-etape-11');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        agentEnregistrement: form.agentEnregistrement.value
    };
    
    fermerModal('modal-etape-11');
    afficherNotificationMali('⚙️ Enregistrement déclaration...', 'info');
    
    await executerEtapeAvecDonnees('enregistrer_declaration', donnees);
}

// ============================================
// ÉTAPES 12-13 : CONTRÔLES DOUANIERS ET LIQUIDATION
// ============================================

function ouvrirModalEtape1213() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste', 'warning');
        return;
    }
    
    manifesteSelectionne = manifesteId;
    ouvrirModal('modal-etape-12-13');
}

async function soumettreEtape1213() {
    const form = document.getElementById('form-etape-12-13');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        typeControle: form.typeControle.value,
        resultatControle: form.resultatControle.value,
        agentControleur: form.agentControleur.value,
        agentLiquidateur: form.agentLiquidateur.value,
        observationsControle: form.observationsControle.value
    };
    
    fermerModal('modal-etape-12-13');
    afficherNotificationMali('⚙️ Traitement contrôles et liquidation...', 'info');
    
    await executerEtapeAvecDonnees('effectuer_controles_liquidation', donnees);
}

// ============================================
// ÉTAPE 14 : PAIEMENT
// ============================================

async function ouvrirModalEtape14() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste', 'warning');
        return;
    }
    
    manifesteSelectionne = manifesteId;
    
    // Charger le montant à payer depuis la liquidation
    try {
        const response = await fetch(`${API_BASE_MALI}/declaration/lister?limite=100`);
        const data = await response.json();
        
        // Trouver la déclaration associée au manifeste
        const declaration = data.declarations?.find(d => d.manifesteOrigine === manifesteId);
        
        if (declaration && declaration.liquidation) {
            document.getElementById('montant-a-payer').textContent = 
                declaration.liquidation.montantTotal.toLocaleString();
        } else {
            document.getElementById('montant-a-payer').textContent = 'Non disponible';
        }
    } catch (error) {
        console.error('Erreur chargement montant:', error);
        document.getElementById('montant-a-payer').textContent = 'Erreur de chargement';
    }
    
    // Pré-remplir la référence de paiement
    const form = document.getElementById('form-etape-14');
    form.referencePaiement.value = `PAY_MLI_${Date.now()}`;
    
    ouvrirModal('modal-etape-14');
}

async function soumettreEtape14() {
    const form = document.getElementById('form-etape-14');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const donnees = {
        referencePaiement: form.referencePaiement.value,
        modePaiement: form.modePaiement.value,
        compteTresor: form.compteTresor.value
    };
    
    fermerModal('modal-etape-14');
    afficherNotificationMali('⚙️ Traitement paiement...', 'info');
    
    await executerEtapeAvecDonnees('effectuer_paiement', donnees);
}

// ============================================
// EXÉCUTION DES ÉTAPES AVEC DONNÉES
// ============================================

async function executerEtapeAvecDonnees(action, donnees) {
    const manifesteId = manifesteSelectionne || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Aucun manifeste sélectionné', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_MALI}/workflow/manuel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'MALI_FRONTEND_MANUEL'
            },
            body: JSON.stringify({
                action: action,
                manifesteId: manifesteId,
                donnees: donnees
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Afficher le résultat de manière conviviale
            afficherResultatAmeliore(data);
            
            afficherNotificationMali('✅ Étape terminée avec succès', 'success');
            marquerEtapeComplete(action);
            
            // Actualiser les données
            setTimeout(() => chargerDonneesMali(), 1000);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur étape');
        }
        
    } catch (error) {
        console.error('Erreur exécution étape:', error);
        afficherNotificationMali(`❌ Erreur: ${error.message}`, 'error');
    }
}

// Fonction simplifiée pour étapes 15-16 (pas de formulaire)
async function executerEtape(action) {
    await executerEtapeAvecDonnees(action, {
        dateOperation: new Date().toISOString()
    });
}

// ============================================
// AFFICHAGE AMÉLIORÉ DES RÉSULTATS
// ============================================

function afficherResultatAmeliore(data) {
    const container = document.getElementById('resultat-etape-mali');
    container.style.display = 'block';
    
    let html = '<div class="result-container">';
    
    // Header avec icône
    const iconeEtape = obtenirIconeEtape(data.resultat?.etape || data.etape);
    html += `
        <div class="result-header">
            <div class="result-icon">${iconeEtape}</div>
            <div class="result-title">
                <h3>${data.message || 'Résultat de l\'opération'}</h3>
                <p>${new Date().toLocaleString('fr-FR')}</p>
            </div>
        </div>
    `;
    
    // Contenu selon le type d'étape
    if (data.resultat) {
        html += afficherDetailsResultat(data.resultat);
    }
    
    // Message de prochaine étape
    if (data.resultat?.prochaine_etape) {
        html += `
            <div class="result-card" style="background: #fff3cd; border-left-color: #fcd116;">
                <h4>➡️ Prochaine Étape</h4>
                <div class="result-value">${data.resultat.prochaine_etape}</div>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Scroll vers les résultats
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function afficherDetailsResultat(resultat) {
    let html = '<div class="result-grid">';
    
    // ÉTAPE 7 - Documents GUCE
    if (resultat.etape === 7 || resultat.action === 'DOCUMENTS_GUCE_COLLECTES') {
        html += `
            <div class="result-card">
                <h4>📋 Documents Collectés</h4>
                <div class="result-value">${resultat.documentsGUCE ? Object.keys(resultat.documentsGUCE).length : 0}</div>
            </div>
            <div class="result-card">
                <h4>👤 Déclarant</h4>
                <div class="result-value">${resultat.documentsGUCE?.declarantMalien || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>📄 Connaissement</h4>
                <div class="result-value">${resultat.documentsGUCE?.connaissement || 'N/A'}</div>
            </div>
        `;
    }
    
    // ÉTAPE 8 - Déclaration
    if (resultat.etape === 8 || resultat.action === 'DECLARATION_CREEE') {
        html += `
            <div class="result-card">
                <h4>📝 Numéro Déclaration</h4>
                <div class="result-value">${resultat.declaration?.numeroDeclaration || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>📦 Articles</h4>
                <div class="result-value">${resultat.declaration?.articles?.length || 0}</div>
            </div>
            <div class="result-card">
                <h4>💰 Valeur Totale</h4>
                <div class="result-value">${resultat.declaration?.valeurTotaleDeclaree?.toLocaleString() || '0'} FCFA</div>
            </div>
        `;
        
        // Table des articles
        if (resultat.declaration?.articles && resultat.declaration.articles.length > 0) {
            html += '</div><div class="result-details"><h4>Articles Déclarés</h4>';
            html += '<table class="result-table"><thead><tr>';
            html += '<th>N°</th><th>Désignation</th><th>Code SH</th><th>Origine</th><th>Valeur CAF</th>';
            html += '</tr></thead><tbody>';
            
            resultat.declaration.articles.forEach(art => {
                html += `<tr>
                    <td>${art.numArt}</td>
                    <td>${art.designationCom || art.designation}</td>
                    <td>${art.codeSh}</td>
                    <td>${art.origine}</td>
                    <td>${(art.valeurCaf || 0).toLocaleString()} FCFA</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
        }
    }
    
    // ÉTAPES 9-10 - Contrôles et Devis
    if (resultat.etapes === '9-10' || resultat.action === 'CONTROLES_DEVIS_CALCULES') {
        html += `
            <div class="result-card">
                <h4>✅ Contrôles</h4>
                <div class="result-value">
                    <span class="result-badge success">Documents: ${resultat.controle?.controles?.conformiteDocuments ? 'Conforme' : 'Non conforme'}</span>
                </div>
            </div>
            <div class="result-card">
                <h4>💵 Devis Calculé</h4>
                <div class="result-value">${resultat.controle?.devis?.montantTotal?.toLocaleString() || '0'} FCFA</div>
            </div>
            <div class="result-card">
                <h4>👤 Agent Contrôleur</h4>
                <div class="result-value">${resultat.controle?.controles?.agentControleur || 'N/A'}</div>
            </div>
        `;
    }
    
    // ÉTAPE 11 - Enregistrement
    if (resultat.etape === 11 || resultat.action === 'DECLARATION_ENREGISTREE') {
        html += `
            <div class="result-card">
                <h4>📋 Numéro Enregistrement</h4>
                <div class="result-value">${resultat.enregistrement?.numeroEnregistrement || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>🏛️ Bureau</h4>
                <div class="result-value">${resultat.enregistrement?.bureauEnregistrement || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>📄 Référence Bulletin</h4>
                <div class="result-value">${resultat.enregistrement?.referenceBulletin || 'N/A'}</div>
            </div>
        `;
    }
    
    // ÉTAPES 12-13 - Liquidation
    if (resultat.etapes === '12-13' || resultat.action === 'LIQUIDATION_EFFECTUEE') {
        html += `
            <div class="result-card">
                <h4>💰 Montant Total</h4>
                <div class="result-value">${resultat.liquidation?.montantTotal?.toLocaleString() || '0'} FCFA</div>
            </div>
            <div class="result-card">
                <h4>🔍 Type Contrôle</h4>
                <div class="result-value">${resultat.liquidation?.controleDouanier?.typeControle || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>✅ Résultat</h4>
                <div class="result-value">
                    <span class="result-badge ${resultat.liquidation?.controleDouanier?.resultatControle === 'CONFORME' ? 'success' : 'warning'}">
                        ${resultat.liquidation?.controleDouanier?.resultatControle || 'N/A'}
                    </span>
                </div>
            </div>
        `;
    }
    
    // ÉTAPE 14 - Paiement
    if (resultat.etape === 14 || resultat.action === 'PAIEMENT_EFFECTUE') {
        html += `
            <div class="result-card">
                <h4>💳 Référence Paiement</h4>
                <div class="result-value">${resultat.paiement?.referencePaiement || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>💰 Montant Payé</h4>
                <div class="result-value">${resultat.paiement?.montantPaye?.toLocaleString() || '0'} FCFA</div>
            </div>
            <div class="result-card">
                <h4>🏦 Mode Paiement</h4>
                <div class="result-value">${resultat.paiement?.modePaiement || 'N/A'}</div>
            </div>
            <div class="result-card">
                <h4>🏛️ Compte Trésor</h4>
                <div class="result-value">${resultat.paiement?.compteTresor || 'N/A'}</div>
            </div>
        `;
    }
    
    // ÉTAPES 15-16 - Transmission
    if (resultat.etapes === '15-16' || resultat.action === 'TRANSMISSION_KIT') {
        const transmissionReussie = resultat.transmission?.transmissionReussie || false;
        html += `
            <div class="result-card">
                <h4>📤 Statut Transmission</h4>
                <div class="result-value">
                    <span class="result-badge ${transmissionReussie ? 'success' : 'warning'}">
                        ${transmissionReussie ? '✅ Réussie' : '⚠️ Échec'}
                    </span>
                </div>
            </div>
            <div class="result-card">
                <h4>🎯 Destination</h4>
                <div class="result-value">${resultat.transmission?.destinationKit || 'N/A'}</div>
            </div>
        `;
        
        if (transmissionReussie) {
            html += `
                <div class="result-card" style="grid-column: 1 / -1; background: #d4edda; border-left-color: #14b53a;">
                    <h4>🎉 Workflow Mali Terminé</h4>
                    <div class="result-value">Le workflow complet des étapes 6-16 est maintenant terminé. L'autorisation a été transmise vers le Sénégal via le Kit MuleSoft.</div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    return html;
}

function obtenirIconeEtape(etape) {
    const icones = {
        7: '📋',
        8: '📝',
        '9-10': '🔍',
        11: '📋',
        '12-13': '🛃',
        14: '💳',
        '15-16': '📤'
    };
    return icones[etape] || '✅';
}

// ============================================
// WORKFLOW COMPLET AUTOMATIQUE
// ============================================

async function executerWorkflowComplet() {
    const selectManifeste = document.getElementById('select-manifeste-mali');
    const manifesteId = selectManifeste.value || window.dernierManifesteId;
    
    if (!manifesteId) {
        afficherNotificationMali('⚠️ Veuillez d\'abord sélectionner un manifeste ou créer un test', 'warning');
        return;
    }
    
    const btnWorkflow = document.getElementById('btn-workflow-complet');
    btnWorkflow.disabled = true;
    btnWorkflow.innerHTML = '⏳ Workflow en cours...<br><small>Veuillez patienter</small>';
    
    ajouterLogMali('workflow', 'Workflow Complet', `Démarrage workflow Mali complet pour ${manifesteId}`);
    afficherNotificationMali('🚀 Démarrage workflow Mali complet (étapes 7-16)...', 'info');
    
    try {
        const response = await fetch(`${API_BASE_MALI}/workflow/manuel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'MALI_FRONTEND_AUTO'
            },
            body: JSON.stringify({
                action: 'workflow_complet_auto',
                manifesteId: manifesteId,
                donnees: {
                    agentMalien: 'AGENT_MALI_AUTO',
                    modeExecution: 'AUTOMATIQUE'
                }
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Afficher le résultat complet
            afficherResultatAmeliore(data);
            
            if (data.status === 'WORKFLOW_COMPLET') {
                afficherNotificationMali('🎉 Workflow Mali complet terminé avec succès!', 'success');
                ajouterLogMali('workflow', 'Workflow Complet', `✅ Toutes les étapes (7-16) terminées`);
                marquerToutesEtapesCompletes();
            } else {
                afficherNotificationMali(`⚠️ Workflow terminé avec erreurs`, 'warning');
                ajouterLogMali('workflow', 'Workflow Complet', `⚠️ Erreur: ${data.erreur}`);
            }
            
            setTimeout(() => chargerDonneesMali(), 1000);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur workflow');
        }
        
    } catch (error) {
        console.error('Erreur workflow complet:', error);
        afficherNotificationMali(`❌ Workflow échoué: ${error.message}`, 'error');
        ajouterLogMali('error', 'Workflow Complet', `❌ Erreur: ${error.message}`);
    } finally {
        btnWorkflow.disabled = false;
        btnWorkflow.innerHTML = '🚀 Exécuter Workflow Complet Automatique<br><small style="font-size: 12px;">(Étapes 7 à 16 en une fois)</small>';
    }
}

// ============================================
// FONCTIONS UTILITAIRES (Suite)
// ============================================

// Marquer une étape comme complétée
function marquerEtapeComplete(action) {
    const mapping = {
        'collecter_documents_guce': 'mali-step-7',
        'creer_declaration': 'mali-step-8',
        'controler_et_calculer_devis': 'mali-step-9-10',
        'enregistrer_declaration': 'mali-step-11',
        'effectuer_controles_liquidation': 'mali-step-12-13',
        'effectuer_paiement': 'mali-step-14',
        'transmettre_vers_kit': 'mali-step-15-16'
    };
    
    const stepId = mapping[action];
    if (stepId) {
        const step = document.getElementById(stepId);
        if (step) {
            step.className = 'workflow-step-mali completed';
            const stepNumber = step.querySelector('.step-number-mali');
            if (stepNumber) stepNumber.className = 'step-number-mali completed';
        }
    }
}

// Marquer toutes les étapes comme complètes
function marquerToutesEtapesCompletes() {
    const etapes = [
        'collecter_documents_guce',
        'creer_declaration',
        'controler_et_calculer_devis',
        'enregistrer_declaration',
        'effectuer_controles_liquidation',
        'effectuer_paiement',
        'transmettre_vers_kit'
    ];
    
    etapes.forEach(etape => marquerEtapeComplete(etape));
}

// Ouvrir portail GUCE Mali
function ouvrirPortailGUCEMali() {
    const urlGUCE = 'https://guce.gov.ml/portal';
    
    const nouvelleFenetre = window.open(
        urlGUCE, 
        'PortailGUCEMali',
        'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes'
    );
    
    if (nouvelleFenetre) {
        ajouterLogMali('guce', 'Portail GUCE Mali', 'Ouverture du portail GUCE Mali pour collecte documents');
        afficherNotificationMali('🌐 Portail GUCE Mali ouvert dans une nouvelle fenêtre', 'info');
    } else {
        afficherNotificationMali('❌ Impossible d\'ouvrir le portail GUCE Mali. Vérifiez les pop-ups.', 'error');
    }
}

// Simuler réception manifeste test
async function simulerReceptionManifesteTest() {
    ajouterLogMali('etape6', 'ÉTAPE 6', 'Test réception manifeste depuis Sénégal...');
    afficherNotificationMali('🧪 Simulation réception manifeste Mali...', 'info');
    
    try {
        const manifesteTest = {
            manifeste: {
                numero_origine: `TEST_MLI_${Date.now()}`,
                transporteur: 'SIMULATION DAKAR-BAMAKO',
                navire: 'TEST VESSEL MALI',
                portOrigine: 'Port de Dakar',
                dateArrivee: new Date().toISOString().split('T')[0],
                paysOrigine: 'SEN',
                format: 'TEST'
            },
            marchandises: [{
                position: 1,
                designation: 'Test Mali - Véhicule Simulation',
                poidsNet: 1500,
                poidsBrut: 1600,
                quantite: 1,
                importateur: 'SIMULATION IMPORT BAMAKO',
                destinataire: 'SIMULATION IMPORT BAMAKO',
                valeurEstimee: 5000000
            }],
            isTest: true
        };

        const response = await fetch(`${API_BASE_MALI}/manifeste/reception`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-Country': 'SEN',
                'X-Source-System': 'KIT_INTERCONNEXION',
                'X-Test-Mode': 'true',
                'X-Correlation-ID': `TEST_MLI_${Date.now()}`
            },
            body: JSON.stringify(manifesteTest)
        });
        
        if (response.ok) {
            const data = await response.json();
            
            afficherNotificationMali('✅ Manifeste test reçu au Mali avec succès', 'success');
            ajouterLogMali('etape6', 'ÉTAPE 6 TERMINÉE', `Manifeste ${data.manifeste?.id || 'TEST'} enregistré - Prochaine: Collecte GUCE (étape 7)`);
            
            // Stocker l'ID du manifeste pour les étapes suivantes
            window.dernierManifesteId = data.manifeste?.id;
            
            // Actualiser les données
            setTimeout(() => {
                chargerDonneesMali();
                chargerManifestesDisponibles();
            }, 1000);
        } else {
            const errorData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorData}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur simulation Mali:', error);
        ajouterLogMali('error', 'ERREUR ÉTAPE 6', error.message);
        afficherNotificationMali(`❌ Erreur simulation Mali: ${error.message}`, 'error');
    }
}

// Charger les manifestes disponibles
async function chargerManifestesDisponibles() {
    try {
        const response = await fetch(`${API_BASE_MALI}/manifeste/lister?limite=20`);
        const data = await response.json();
        
        const select = document.getElementById('select-manifeste-mali');
        
        if (data.status === 'SUCCESS' && data.manifestes && data.manifestes.length > 0) {
            select.innerHTML = '<option value="">-- Sélectionner un manifeste --</option>';
            
            data.manifestes.forEach(manifeste => {
                const option = document.createElement('option');
                option.value = manifeste.id;
                option.textContent = `${manifeste.numeroOrigine || manifeste.id} - ${manifeste.transporteur || 'N/A'} (${manifeste.statut})`;
                select.appendChild(option);
            });
            
            // Si on a un manifeste par défaut, le sélectionner
            if (window.dernierManifesteId) {
                select.value = window.dernierManifesteId;
            }
        } else {
            select.innerHTML = '<option value="">-- Aucun manifeste disponible --</option>';
        }
        
    } catch (error) {
        console.error('Erreur chargement manifestes:', error);
        const select = document.getElementById('select-manifeste-mali');
        select.innerHTML = '<option value="">-- Erreur de chargement --</option>';
    }
}

// Ouvrir guide workflow Mali
function ouvrirGuideWorkflowMali() {
    const guideContent = `
        <h2>🇲🇱 Guide Workflow Mali - Étapes 6-16</h2>
        <p><strong>Mode de traitement:</strong> MANUEL (Selon rapport PDF UEMOA)</p>
        
        <h3>📋 Étapes à réaliser manuellement :</h3>
        <ul style="list-style: none; padding-left: 0;">
            <li style="margin: 10px 0; padding: 10px; background: #d4edda; border-radius: 5px;">
                <strong>ÉTAPE 6:</strong> ✅ Réception et enregistrement manifeste (Automatique via Kit)
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong>ÉTAPE 7:</strong> 👤 Collecte documents via GUCE Mali
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong>ÉTAPE 8:</strong> 👤 Création déclaration par déclarant malien
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong>ÉTAPES 9-10:</strong> 👤 Contrôles recevabilité + Calcul devis
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong>ÉTAPE 11:</strong> 👤 Enregistrement déclaration détaillée
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong>ÉTAPES 12-13:</strong> 👤 Contrôles douaniers + Bulletin liquidation
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 5px;">
                <strong>ÉTAPE 14:</strong> 👤 Paiement droits et taxes (BCEAO/Trésor Mali)
            </li>
            <li style="margin: 10px 0; padding: 10px; background: #d4edda; border-radius: 5px;">
                <strong>ÉTAPES 15-16:</strong> 👤 Transmission autorisation vers Kit d'interconnexion
            </li>
        </ul>
        
        <p><strong>⏳ Durée estimée:</strong> Dépend du déclarant malien et des contrôles</p>
        <p><strong>📍 Lieu:</strong> Bamako - Douanes Mali</p>
        <p><strong>🔄 Après étape 16:</strong> Retour vers Sénégal (étape 17)</p>
    `;
    
    const guideWindow = window.open('', 'GuideMali', 'width=800,height=600,scrollbars=yes');
    guideWindow.document.write(`
        <html>
            <head>
                <title>Guide Workflow Mali</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        background: linear-gradient(135deg, #ce1126 0%, #14b53a 50%, #fcd116 100%);
                    }
                    .container { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: white; 
                        padding: 30px; 
                        border-radius: 10px; 
                    }
                    h2 { color: #ce1126; text-align: center; }
                    h3 { color: #14b53a; margin-top: 25px; }
                    ul { margin-top: 15px; }
                    li { line-height: 1.6; }
                    .close-btn { 
                        background: #ce1126; 
                        color: white; 
                        padding: 10px 20px; 
                        border: none; 
                        border-radius: 5px; 
                        float: right; 
                        cursor: pointer; 
                        margin-top: 20px;
                    }
                    .close-btn:hover {
                        background: #9c0e1c;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${guideContent}
                    <button class="close-btn" onclick="window.close()">Fermer</button>
                    <div style="clear: both;"></div>
                </div>
            </body>
        </html>
    `);
    
    ajouterLogMali('manuel', 'Guide ouvert', 'Guide workflow Mali étapes 6-16 consulté');
}

// Vérifier statut workflow Mali
async function verifierStatutWorkflowMali() {
    try {
        const response = await fetch(`${API_BASE_MALI}/health`);
        const data = await response.json();
        
        afficherNotificationMali('🔍 Mali opérationnel - Workflow manuel prêt', 'success');
        ajouterLogMali('workflow', 'Statut vérifié', 'Système Mali opérationnel - Étapes 6-16 disponibles');
        
    } catch (error) {
        afficherNotificationMali('❌ Erreur vérification Mali', 'error');
    }
}

// ============================================
// WORKFLOW TRANSIT MALI - ÉTAPES 11, 13-14
// ============================================

// Charger les transits disponibles
async function chargerTransitsDisponibles() {
    try {
        const response = await fetch(`${API_BASE_MALI}/transit/lister?limite=20`);
        const data = await response.json();
        
        const container = document.getElementById('transits-mali-list');
        
        if (data.status === 'SUCCESS' && data.transits && data.transits.length > 0) {
            let html = '<h3>📋 Déclarations Transit Reçues au Mali</h3><div class="data-list">';
            
            data.transits.forEach(transit => {
                const arriveeStatus = transit.arrivee ? '✅ Arrivée confirmée' : '⏳ En attente';
                const messageStatus = transit.messageArrivee ? '📤 Message envoyé' : '📭 Pas encore envoyé';
                
                html += `
                    <div class="data-item-mali ${transit.arrivee ? 'complete' : 'waiting'}">
                        <div class="item-header-mali">
                            🚛 ${transit.numeroDeclaration} - ${transit.transport?.transporteur || 'N/A'}
                            <span class="item-status-mali ${transit.arrivee ? 'complete' : 'waiting'}">
                                ${arriveeStatus}
                            </span>
                        </div>
                        <div class="item-details-mali">
                            🇸🇳 Départ: ${transit.paysDepart || 'SEN'} → 🇲🇱 Destination: Mali<br>
                            🚚 Mode: ${transit.transport?.modeTransport || 'ROUTIER'}<br>
                            📍 Itinéraire: ${transit.transport?.itineraire || 'N/A'}<br>
                            ⏱️ Délai: ${transit.transport?.delaiRoute || 'N/A'}<br>
                            📦 Marchandises: ${transit.marchandises?.nombre || 0}<br>
                            📅 Reçu le: ${new Date(transit.dateReception).toLocaleString('fr-FR')}<br>
                            ${transit.arrivee ? `✅ Arrivé le: ${new Date(transit.arrivee.dateArrivee).toLocaleString('fr-FR')}<br>` : ''}
                            ${transit.messageArrivee ? `📤 ${messageStatus} le: ${new Date(transit.messageArrivee.dateEnvoi).toLocaleString('fr-FR')}` : messageStatus}
                        </div>
                        ${!transit.arrivee ? `
                            <button class="btn btn-mali" onclick="confirmerArriveeTransit('${transit.id}')" style="margin-top: 10px; width: 100%;">
                                📦 Confirmer Arrivée (ÉTAPES 13-14)
                            </button>
                        ` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
            
            html += `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong>📊 Statistiques Transit:</strong><br>
                    Total: ${data.statistiques?.total || 0} |
                    Arrivées: ${data.statistiques?.arrivees?.confirmees || 0} |
                    En attente: ${data.statistiques?.arrivees?.enAttente || 0} |
                    Messages envoyés: ${data.statistiques?.messagesEnvoyes || 0}
                </div>
            `;
            
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <h3>📋 Déclarations Transit Reçues</h3>
                <div class="data-list">
                    <p style="text-align: center; padding: 20px; color: #6c757d;">
                        Aucune déclaration transit reçue depuis le Sénégal
                    </p>
                </div>
            `;
        }
        
        ajouterLogMali('transit', 'Liste Transit', `${data.transits?.length || 0} déclaration(s) transit chargée(s)`);
        
    } catch (error) {
        console.error('Erreur chargement transits:', error);
        const container = document.getElementById('transits-mali-list');
        container.innerHTML = `
            <h3>📋 Déclarations Transit Reçues</h3>
            <div class="data-list">
                <p style="color: #dc3545;">❌ Erreur de chargement des transits</p>
            </div>
        `;
    }
}

// Simuler arrivée transit (ÉTAPES 13-14)
async function simulerArriveeTransit() {
    ajouterLogMali('transit', 'ÉTAPES 13-14', 'Simulation arrivée marchandises transit...');
    afficherNotificationMali('🧪 Simulation arrivée transit Mali...', 'info');
    
    try {
        // Créer d'abord une déclaration transit test si nécessaire
        const transitTest = {
            transit_original: {
                numero_declaration: `TRANS_TEST_${Date.now()}`,
                pays_depart: 'SEN',
                bureau_depart: '18N_DAKAR',
                date_creation: new Date().toISOString(),
                transporteur: 'TEST TRANSPORT SAHEL',
                itineraire: 'Dakar-Bamako via Kayes',
                delai_route: '72 heures'
            },
            marchandises: [{
                designation: 'Test Transit - Marchandises Simulation',
                poids: 5000,
                nombreColis: 100
            }],
            instructions_mali: {
                attendre_arrivee: true,
                delai_maximum: '72 heures',
                controles_passage: false,
                message_arrivee_requis: true
            },
            metadata: {
                correlation_id: `TEST_TRANS_${Date.now()}`,
                etape_actuelle: 11,
                prochaine_etape: '13-14_ARRIVEE_MALI',
                workflow_type: 'TRANSIT'
            }
        };

        // ÉTAPE 11: Créer d'abord le transit
        const responseCreation = await fetch(`${API_BASE_MALI}/transit/copie`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-Country': 'SEN',
                'X-Source-System': 'KIT_TRANSIT_SENEGAL_MALI',
                'X-Correlation-ID': transitTest.metadata.correlation_id
            },
            body: JSON.stringify(transitTest)
        });

        if (!responseCreation.ok) {
            throw new Error(`ÉTAPE 11 échouée: ${responseCreation.status}`);
        }

        const dataCreation = await responseCreation.json();
        const transitId = dataCreation.transit?.id;
        
        afficherNotificationMali('✅ ÉTAPE 11 OK - Transit enregistré', 'success');
        ajouterLogMali('transit', 'ÉTAPE 11 TERMINÉE', `Transit ${transitId} créé au Mali`);

        // Attendre un peu avant de simuler l'arrivée
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ÉTAPES 13-14: Simuler l'arrivée
        const donneesArrivee = {
            transitId: transitId,
            donneesArrivee: {
                controleEffectue: true,
                visaAppose: true,
                conformiteItineraire: true,
                delaiRespecte: true,
                declarationDetailDeposee: false,
                agentReceptionnaire: 'AGENT_TEST_MALI_TRANSIT',
                observationsArrivee: 'Test automatique - Arrivée simulation'
            }
        };

        const responseArrivee = await fetch(`${API_BASE_MALI}/transit/arrivee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'MALI_TRANSIT_TEST'
            },
            body: JSON.stringify(donneesArrivee)
        });

        if (responseArrivee.ok) {
            const dataArrivee = await responseArrivee.json();
            
            afficherNotificationMali('✅ ÉTAPES 13-14 OK - Arrivée confirmée et transmise', 'success');
            ajouterLogMali('transit', 'ÉTAPES 13-14 TERMINÉES', 
                `Transit ${transitId} - Arrivée confirmée et message envoyé vers Kit`);
            
            // Actualiser la liste des transits
            setTimeout(() => chargerTransitsDisponibles(), 1000);
        } else {
            throw new Error(`ÉTAPES 13-14 échouées: ${responseArrivee.status}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur simulation transit:', error);
        ajouterLogMali('error', 'ERREUR TRANSIT', error.message);
        afficherNotificationMali(`❌ Erreur simulation transit: ${error.message}`, 'error');
    }
}

// Confirmer arrivée pour un transit existant
async function confirmerArriveeTransit(transitId) {
    ajouterLogMali('transit', 'ÉTAPES 13-14', `Confirmation arrivée pour transit ${transitId}...`);
    afficherNotificationMali('⚙️ Confirmation arrivée en cours...', 'info');
    
    try {
        const donneesArrivee = {
            transitId: transitId,
            donneesArrivee: {
                controleEffectue: true,
                visaAppose: true,
                conformiteItineraire: true,
                delaiRespecte: true,
                declarationDetailDeposee: false,
                agentReceptionnaire: 'AGENT_MALI_TRANSIT',
                observationsArrivee: 'Arrivée confirmée manuellement'
            }
        };

        const response = await fetch(`${API_BASE_MALI}/transit/arrivee`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-System': 'MALI_TRANSIT_MANUEL'
            },
            body: JSON.stringify(donneesArrivee)
        });

        if (response.ok) {
            const data = await response.json();
            
            afficherNotificationMali('✅ ÉTAPES 13-14 terminées - Message transmis vers Kit', 'success');
            ajouterLogMali('transit', 'ÉTAPES 13-14 TERMINÉES', 
                `Transit ${transitId} - Arrivée confirmée, message envoyé vers Sénégal`);
            
            // Actualiser la liste
            setTimeout(() => chargerTransitsDisponibles(), 1000);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur confirmation arrivée');
        }
        
    } catch (error) {
        console.error('❌ Erreur confirmation arrivée:', error);
        ajouterLogMali('error', 'ERREUR TRANSIT', error.message);
        afficherNotificationMali(`❌ Erreur: ${error.message}`, 'error');
    }
}

// Charger les transits au démarrage
setTimeout(() => {
    chargerTransitsDisponibles();
}, 2000);

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

async function chargerDonneesMali() {
    await Promise.all([
        chargerStatistiquesMali(),
        chargerManifestesMali(),
        chargerDocumentsGUCE(),
        chargerDeclarationsMali(),
        chargerPaiementsMali(),
        chargerTransitsDisponibles()  // ✅ NOUVEAU
    ]);
}

async function chargerStatistiquesMali() {
    try {
        const response = await fetch(`${API_BASE_MALI}/statistiques`);
        const data = await response.json();
        
        if (data.status === 'SUCCESS' && data.statistiques) {
            const stats = data.statistiques;
            
            document.getElementById('stat-manifestes-mali').textContent = stats.manifestesRecus || 0;
            document.getElementById('stat-documents').textContent = stats.documentsGUCECollectes || 0;
            document.getElementById('stat-declarations').textContent = stats.declarationsCreees || 0;
            document.getElementById('stat-paiements-mali').textContent = stats.paiementsEffectues || 0;
            
            // Calculer étapes complétées
            const etapesTotal = 11;
            const etapesCompletes = Math.min(
                (stats.manifestesRecus || 0) + 
                (stats.declarationsCreees || 0) + 
                (stats.paiementsEffectues || 0), 
                etapesTotal
            );
            document.getElementById('etapes-completees').textContent = `${etapesCompletes}/${etapesTotal}`;
            
            if (stats.performance?.tempsTraitementMoyen) {
                document.getElementById('temps-moyen-mali').textContent = 
                    Math.round(stats.performance.tempsTraitementMoyen / 60) + ' min';
            }
        }
        
    } catch (error) {
        console.error('Erreur chargement statistiques Mali:', error);
    }
}

async function chargerManifestesMali() {
    try {
        const response = await fetch(`${API_BASE_MALI}/manifeste/lister?limite=5`);
        const data = await response.json();
        
        const container = document.getElementById('manifestes-mali-list');
        
        if (data.status === 'SUCCESS' && data.manifestes && data.manifestes.length > 0) {
            container.innerHTML = data.manifestes.map(manifeste => `
                <div class="data-item-mali from-senegal">
                    <div class="item-header-mali">
                        📥 ${manifeste.numeroOrigine || manifeste.id} - ${manifeste.transporteur || 'Transport Mali'}
                        <span class="item-status-mali recu">REÇU ÉTAPE 6</span>
                    </div>
                    <div class="item-details-mali">
                        🇸🇳 Depuis: ${manifeste.origine?.pays || 'Sénégal (Port de Dakar)'}<br>
                        📦 ${manifeste.marchandises?.nombre || 0} marchandise(s)<br>
                        🎯 Destination: Bamako, Mali<br>
                        📅 ${new Date(manifeste.dateReception).toLocaleString('fr-FR')}<br>
                        ⏳ Prochaine étape: Collecte documents GUCE Mali (étape 7)
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>En attente de manifestes depuis Port de Dakar...</p>';
        }
        
    } catch (error) {
        console.error('Erreur chargement manifestes Mali:', error);
        document.getElementById('manifestes-mali-list').innerHTML = '<p>Erreur de chargement</p>';
    }
}

async function chargerDeclarationsMali() {
    try {
        const response = await fetch(`${API_BASE_MALI}/declaration/lister?limite=5`);
        const data = await response.json();
        
        const container = document.getElementById('declarations-mali-list');
        
        if (data.status === 'SUCCESS' && data.declarations && data.declarations.length > 0) {
            container.innerHTML = data.declarations.map(declaration => `
                <div class="data-item-mali processed">
                    <div class="item-header-mali">
                        📝 ${declaration.numeroDeclaration}
                        <span class="item-status-mali manuel">MANUEL</span>
                    </div>
                    <div class="item-details-mali">
                        📋 Manifeste origine: ${declaration.manifesteOrigine || 'N/A'}<br>
                        💰 Liquidation: ${declaration.liquidation?.montantTotal?.toLocaleString() || 'En cours'} FCFA<br>
                        👤 Mode: ${declaration.modeCreation || 'MANUEL'}<br>
                        📅 ${new Date(declaration.dateCreation).toLocaleString('fr-FR')}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Aucune déclaration créée par déclarants maliens</p>';
        }
        
    } catch (error) {
        console.error('Erreur chargement déclarations Mali:', error);
        document.getElementById('declarations-mali-list').innerHTML = '<p>Erreur de chargement</p>';
    }
}

async function chargerPaiementsMali() {
    try {
        const response = await fetch(`${API_BASE_MALI}/paiement/lister?limite=5`);
        const data = await response.json();
        
        const container = document.getElementById('paiements-mali-list');
        
        if (data.status === 'SUCCESS' && data.paiements && data.paiements.length > 0) {
            container.innerHTML = data.paiements.map(paiement => `
                <div class="data-item-mali complete">
                    <div class="item-header-mali">
                        💳 ${paiement.id} - ${paiement.montantPaye?.toLocaleString() || 0} FCFA
                        <span class="item-status-mali complete">ÉTAPE 14</span>
                    </div>
                    <div class="item-details-mali">
                        🏛️ Destination: ${paiement.compteDestination || 'TRESOR_MALI_BCEAO'}<br>
                        🏦 Mode: ${paiement.modePaiement || 'VIREMENT_BCEAO'}<br>
                        📋 Déclaration: ${paiement.numeroDeclaration}<br>
                        📅 ${new Date(paiement.datePaiement).toLocaleString('fr-FR')}<br>
                        ⏳ Prochaine étape: Transmission Kit (étapes 15-16)
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Aucun paiement effectué au Trésor Mali</p>';
        }
        
    } catch (error) {
        console.error('Erreur chargement paiements Mali:', error);
        document.getElementById('paiements-mali-list').innerHTML = '<p>Erreur de chargement</p>';
    }
}

async function chargerDocumentsGUCE() {
    try {
        const response = await fetch(`${API_BASE_MALI}/documents-guce/lister?limite=10`);
        const data = await response.json();
        
        const container = document.getElementById('documents-guce-list');
        
        if (data.status === 'SUCCESS' && data.documents && data.documents.length > 0) {
            container.innerHTML = data.documents.map(doc => `
                <div class="data-item-mali processed">
                    <div class="item-header-mali">
                        📋 Documents GUCE - ${doc.id}
                        <span class="item-status-mali complete">ÉTAPE 7</span>
                    </div>
                    <div class="item-details-mali">
                        📦 Manifeste: ${doc.numeroManifesteOrigine || doc.manifesteId}<br>
                        📄 Connaissement: ${doc.connaissement}<br>
                        💼 Facture: ${doc.factureCommerciale}<br>
                        📋 Déclaration préalable: ${doc.declarationPrealable}<br>
                        🏢 Opérateur: ${doc.operateurEconomique}<br>
                        👤 Déclarant: ${doc.declarantMalien}<br>
                        🏦 Documents bancaires: ${doc.documentsBancaires?.length || 0}<br>
                        📅 ${new Date(doc.dateCollecte).toLocaleString('fr-FR')}<br>
                        ⏳ Prochaine étape: Création déclaration (étape 8)
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Aucun document collecté via GUCE Mali...</p>';
        }
        
    } catch (error) {
        console.error('Erreur chargement documents GUCE:', error);
        document.getElementById('documents-guce-list').innerHTML = '<p>Erreur de chargement</p>';
    }
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function ajouterLogMali(type, action, details) {
    const container = document.getElementById('mali-log');
    const timestamp = new Date().toLocaleTimeString();
    
    const entry = document.createElement('div');
    entry.className = `log-entry-mali ${type}`;
    entry.innerHTML = `
        <strong>[MALI] ${action}</strong> - ${details}
        <span style="float: right; color: #6c757d; font-size: 0.8em;">${timestamp}</span>
    `;
    
    container.prepend(entry);
    
    // Garder seulement les 20 dernières entrées
    const entries = container.querySelectorAll('.log-entry-mali');
    if (entries.length > 20) {
        entries[entries.length - 1].remove();
    }
}

function afficherNotificationMali(message, type) {
    const notification = document.getElementById('notification-mali');
    notification.textContent = message;
    notification.className = `notification-mali ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Cleanup
window.addEventListener('beforeunload', () => {
    if (statusIntervalMali) clearInterval(statusIntervalMali);
    if (refreshIntervalMali) clearInterval(refreshIntervalMali);
});