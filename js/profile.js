// Profile page functionality
import { app, db, ref, get, set, update } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const auth = getAuth(app);

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

let currentUser = null;
let userData = null;

// Show/hide spinner
function showSpinner() {
    const spinner = $('#spinner-overlay');
    if (spinner) spinner.classList.remove('hidden');
}

function hideSpinner() {
    const spinner = $('#spinner-overlay');
    if (spinner) spinner.classList.add('hidden');
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Get filiere name
function getFiliereName(code) {
    const filieres = {
        'ia': 'Intelligence Artificielle',
        'insem': 'Industrie Navale',
        'casi': 'Cybersécurité',
        'idd': 'Informatique & Dév Digital'
    };
    return filieres[code] || code;
}

// Load user profile
async function loadUserProfile(uid) {
    try {
        const userRef = ref(db, `users/${uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            userData = snapshot.val();
            displayUserInfo();
            await loadUserStats(uid);
            await loadUserContributions(uid);
            await loadUserArticles(uid);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Display user info
function displayUserInfo() {
    const nameEl = $('#profile-name');
    const emailEl = $('#profile-email');
    const filiereEl = $('#profile-filiere');
    const yearEl = $('#profile-year');

    if (nameEl) {
        const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        nameEl.textContent = fullName || 'Utilisateur';
    }

    if (emailEl) emailEl.textContent = userData.email || '';
    if (filiereEl) filiereEl.textContent = getFiliereName(userData.filiere) || '';
    if (yearEl) yearEl.textContent = userData.startYear ? `Promo ${userData.startYear}` : '';
}

// Load user stats
async function loadUserStats(uid) {
    try {
        // Count contributions
        const resourcesRef = ref(db, 'resources');
        const resourcesSnapshot = await get(resourcesRef);
        let contributionsCount = 0;

        if (resourcesSnapshot.exists()) {
            const resources = resourcesSnapshot.val();
            Object.values(resources).forEach(resource => {
                if (resource.contributorEmail === userData.email) {
                    contributionsCount++;
                }
            });
        }

        // Count articles
        const articlesRef = ref(db, 'articles');
        const articlesSnapshot = await get(articlesRef);
        let articlesCount = 0;

        if (articlesSnapshot.exists()) {
            const articles = articlesSnapshot.val();
            Object.values(articles).forEach(article => {
                if (article.authorId === uid) {
                    articlesCount++;
                }
            });
        }

        // Update stats
        const statContributions = $('#stat-contributions');
        const statArticles = $('#stat-articles');
        const statMemberSince = $('#stat-member-since');

        if (statContributions) statContributions.textContent = contributionsCount;
        if (statArticles) statArticles.textContent = articlesCount;
        if (statMemberSince) {
            const memberDate = new Date(userData.createdAt);
            statMemberSince.textContent = memberDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load user contributions
async function loadUserContributions(uid) {
    const container = $('#user-contributions');
    if (!container) return;

    try {
        const resourcesRef = ref(db, 'resources');
        const snapshot = await get(resourcesRef);

        if (!snapshot.exists()) {
            container.innerHTML = '<p class="empty-state">Aucune contribution pour le moment.</p>';
            return;
        }

        const resources = snapshot.val();
        const userResources = Object.entries(resources).filter(([id, resource]) => 
            resource.contributorEmail === userData.email
        );

        if (userResources.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucune contribution pour le moment.</p>';
            return;
        }

        container.innerHTML = userResources.map(([id, resource]) => `
            <div class="resource-item">
                <div class="res-icon">
                    <i class="fas ${getResourceIcon(resource.type)}"></i>
                </div>
                <div class="res-info">
                    <h4>${resource.title || 'Sans titre'}</h4>
                    <div class="res-date">${formatDate(resource.timestamp)}</div>
                </div>
                <span class="meta-badge">${resource.verified ? 'Vérifié' : 'En attente'}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading contributions:', error);
        container.innerHTML = '<p class="empty-state">Erreur lors du chargement.</p>';
    }
}

// Get resource icon
function getResourceIcon(type) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'image': 'fa-image',
        'video': 'fa-video',
        'link': 'fa-link'
    };
    return icons[type] || 'fa-file';
}

// Load user articles
async function loadUserArticles(uid) {
    const container = $('#user-articles');
    if (!container) return;

    try {
        const articlesRef = ref(db, 'articles');
        const snapshot = await get(articlesRef);

        if (!snapshot.exists()) {
            container.innerHTML = '<p class="empty-state">Aucun article pour le moment.</p>';
            return;
        }

        const articles = snapshot.val();
        const userArticles = Object.entries(articles).filter(([id, article]) => 
            article.authorId === uid
        );

        if (userArticles.length === 0) {
            container.innerHTML = '<p class="empty-state">Aucun article pour le moment.</p>';
            return;
        }

        container.innerHTML = userArticles.map(([id, article]) => `
            <div class="article-card">
                <h3>${article.title}</h3>
                <div class="article-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(article.timestamp)}</span>
                    <span><i class="fas fa-tag"></i> ${article.category}</span>
                </div>
                ${article.summary ? `<p class="article-summary">${article.summary}</p>` : ''}
                ${article.tags ? `
                    <div class="article-tags">
                        ${article.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading articles:', error);
        container.innerHTML = '<p class="empty-state">Erreur lors du chargement.</p>';
    }
}

// Tab switching
function initTabs() {
    const tabBtns = $$('.tab-btn');
    const tabContents = $$('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update active states
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

// Edit profile modal
function initEditProfile() {
    const editBtn = $('#edit-profile-btn');
    const modal = $('#edit-profile-modal');
    const closeBtn = $('#close-edit-modal');
    const cancelBtn = $('#cancel-edit');
    const form = $('#edit-profile-form');

    if (!editBtn || !modal) return;

    editBtn.addEventListener('click', () => {
        // Populate form with current data
        $('#edit-firstName').value = userData.firstName || '';
        $('#edit-lastName').value = userData.lastName || '';
        $('#edit-filiere').value = userData.filiere || '';
        $('#edit-startYear').value = userData.startYear || '';

        modal.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn?.addEventListener('click', () => modal.classList.add('hidden'));

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageEl = $('#edit-message');

        try {
            showSpinner();
            const updates = {
                firstName: $('#edit-firstName').value.trim(),
                lastName: $('#edit-lastName').value.trim(),
                filiere: $('#edit-filiere').value,
                startYear: parseInt($('#edit-startYear').value)
            };

            await update(ref(db, `users/${currentUser.uid}`), updates);
            
            userData = { ...userData, ...updates };
            displayUserInfo();
            
            if (messageEl) {
                messageEl.style.color = 'green';
                messageEl.textContent = 'Profil mis à jour avec succès !';
            }

            setTimeout(() => {
                modal.classList.add('hidden');
                if (messageEl) messageEl.textContent = '';
            }, 1500);
        } catch (error) {
            console.error('Error updating profile:', error);
            if (messageEl) {
                messageEl.style.color = 'red';
                messageEl.textContent = 'Erreur lors de la mise à jour.';
            }
        } finally {
            hideSpinner();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const authRequired = $('#auth-required');
    const profileContent = $('#profile-content');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            if (authRequired) authRequired.style.display = 'none';
            if (profileContent) profileContent.style.display = 'block';
            
            showSpinner();
            await loadUserProfile(user.uid);
            hideSpinner();
            
            initTabs();
            initEditProfile();
        } else {
            if (authRequired) authRequired.style.display = 'block';
            if (profileContent) profileContent.style.display = 'none';
        }
    });
});
