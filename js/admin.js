// Admin Dashboard JavaScript
import { app, db, ref, get, push, set } from './firebase-config.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    onValue,
    update,
    remove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const auth = getAuth(app);

// Global state
let currentUser = null;
let allResources = [];
let fields = {};
let semesters = {};
let modules = {};
let currentEditResource = null;

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const adminEmail = document.getElementById('admin-email');
const resourcesContainer = document.getElementById('resources-container');
const emptyState = document.getElementById('empty-state');

// Statistics
const statPending = document.getElementById('stat-pending');
const statApproved = document.getElementById('stat-approved');
const statTotal = document.getElementById('stat-total');
const statToday = document.getElementById('stat-today');

// Filters
const filterStatus = document.getElementById('filter-status');
const filterSemester = document.getElementById('filter-semester');
const filterField = document.getElementById('filter-field');
const filterType = document.getElementById('filter-type');
const searchInput = document.getElementById('search-input');
const btnResetFilters = document.getElementById('btn-reset-filters');

// Modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTitle = document.getElementById('edit-title');
const editLink = document.getElementById('edit-link');
const editType = document.getElementById('edit-type');
const editProfessor = document.getElementById('edit-professor');

// Utility Functions
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function getTypeIcon(type) {
    const icons = {
        exam: '📝',
        td: '📋',
        course: '📚',
        video: '🎥'
    };
    return icons[type] || '📄';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function isToday(timestamp) {
    if (!timestamp) return false;
    const today = new Date();
    const date = new Date(timestamp);
    return date.toDateString() === today.toDateString();
}

// Admin Authentication Check
async function checkAdminStatus(user) {
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const adminsSnapshot = await get(ref(db, 'Admins'));
        if (!adminsSnapshot.exists()) {
            showToast('Liste des admins introuvable', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return false;
        }

        const adminsList = adminsSnapshot.val();
        const isAdmin = Array.isArray(adminsList)
            ? adminsList.includes(user.email)
            : Object.values(adminsList).includes(user.email);

        if (!isAdmin) {
            showToast('Accès refusé : vous n\'êtes pas administrateur', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        showToast('Erreur lors de la vérification admin', 'error');
        setTimeout(() => window.location.href = 'index.html', 2000);
        return false;
    }
}

// Fetch Metadata
async function fetchMetadata() {
    try {
        const [fieldsSnap, semestersSnap, modulesSnap] = await Promise.all([
            get(ref(db, 'fields')),
            get(ref(db, 'semesters')),
            get(ref(db, 'modules'))
        ]);

        if (fieldsSnap.exists()) fields = fieldsSnap.val();
        if (semestersSnap.exists()) semesters = semestersSnap.val();
        if (modulesSnap.exists()) modules = modulesSnap.val();

        populateFilterDropdowns();
    } catch (error) {
        console.error('Error fetching metadata:', error);
        showToast('Erreur lors du chargement des métadonnées', 'error');
    }
}

function populateFilterDropdowns() {
    // Populate semesters
    if (semesters) {
        Object.entries(semesters).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            filterSemester.appendChild(option);
        });
    }

    // Populate fields
    if (fields) {
        Object.entries(fields).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            filterField.appendChild(option);
        });
    }
}

// Fetch and Listen to Resources
function listenToResources() {
    const resourcesRef = ref(db, 'resources');

    onValue(resourcesRef, (snapshot) => {
        allResources = [];

        if (snapshot.exists()) {
            const data = snapshot.val();

            // Parse resources structure: /resources/{moduleId}/{resourceId}
            Object.entries(data).forEach(([moduleId, moduleResources]) => {
                if (typeof moduleResources === 'object') {
                    Object.entries(moduleResources).forEach(([resourceId, resource]) => {
                        allResources.push({
                            moduleId,
                            resourceId,
                            ...resource
                        });
                    });
                }
            });
        }

        updateStatistics();
        renderResources();
    }, (error) => {
        console.error('Error listening to resources:', error);
        showToast('Erreur lors du chargement des ressources', 'error');
    });
}

// Update Statistics
function updateStatistics() {
    const pending = allResources.filter(r => r.unverified === true).length;
    const approved = allResources.filter(r => !r.unverified).length;
    const total = allResources.length;
    const today = allResources.filter(r => isToday(r.date)).length;

    statPending.textContent = pending;
    statApproved.textContent = approved;
    statTotal.textContent = total;
    statToday.textContent = today;
}

// Filter Resources
function getFilteredResources() {
    let filtered = [...allResources];

    // Status filter
    const status = filterStatus.value;
    if (status === 'pending') {
        filtered = filtered.filter(r => r.unverified === true);
    } else if (status === 'approved') {
        filtered = filtered.filter(r => !r.unverified);
    }

    // Semester filter
    const semester = filterSemester.value;
    if (semester !== 'all') {
        filtered = filtered.filter(r => r.semester === semester);
    }

    // Field filter
    const field = filterField.value;
    if (field !== 'all') {
        filtered = filtered.filter(r => r.field === field);
    }

    // Type filter
    const type = filterType.value;
    if (type !== 'all') {
        filtered = filtered.filter(r => r.type === type);
    }

    // Search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(r => {
            const title = (r.title || '').toLowerCase();
            const professor = (r.professor || '').toLowerCase();
            return title.includes(searchTerm) || professor.includes(searchTerm);
        });
    }

    return filtered;
}

// Render Resources
function renderResources() {
    const filtered = getFilteredResources();

    if (filtered.length === 0) {
        resourcesContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Group by semester
    const groupedBySemester = {};
    filtered.forEach(resource => {
        const sem = resource.semester || 'unknown';
        if (!groupedBySemester[sem]) {
            groupedBySemester[sem] = {};
        }

        const mod = resource.moduleId || 'unknown';
        if (!groupedBySemester[sem][mod]) {
            groupedBySemester[sem][mod] = [];
        }

        groupedBySemester[sem][mod].push(resource);
    });

    // Render
    let html = '';

    Object.entries(groupedBySemester).forEach(([semesterId, semesterModules]) => {
        const semesterName = semesters[semesterId] || `Semestre ${semesterId}`;
        const semesterResourceCount = Object.values(semesterModules).flat().length;

        html += `
            <div class="semester-group">
                <div class="semester-header">
                    <span>${semesterName}</span>
                    <span class="semester-count">${semesterResourceCount} ressource(s)</span>
                </div>
                <div class="semester-modules">
        `;

        Object.entries(semesterModules).forEach(([moduleId, moduleResources]) => {
            const moduleName = modules[moduleId] || `Module ${moduleId}`;

            html += `
                <div class="module-group">
                    <div class="module-header">
                        <span>${moduleName}</span>
                        <span class="module-count">${moduleResources.length}</span>
                    </div>
                    <div class="module-resources">
            `;

            moduleResources.forEach(resource => {
                html += renderResourceCard(resource);
            });

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    resourcesContainer.innerHTML = html;
    attachResourceEventListeners();
}

function renderResourceCard(resource) {
    const isPending = resource.unverified === true;
    const statusClass = isPending ? 'pending' : 'approved';
    const statusText = isPending ? 'En attente' : 'Approuvée';
    const typeIcon = getTypeIcon(resource.type);
    const fieldName = fields[resource.field] || resource.field || 'N/A';

    return `
        <div class="resource-card ${statusClass}" data-module-id="${resource.moduleId}" data-resource-id="${resource.resourceId}">
            <div class="resource-header">
                <div class="resource-title-section">
                    <h3 class="resource-title">
                        <span class="resource-type-icon">${typeIcon}</span>
                        ${resource.title || 'Sans titre'}
                    </h3>
                    <span class="resource-status ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="resource-details">
                <div class="resource-detail">
                    <strong>Type:</strong> ${resource.type || 'N/A'}
                </div>
                <div class="resource-detail">
                    <strong>Professeur:</strong> ${resource.professor || 'N/A'}
                </div>
                <div class="resource-detail">
                    <strong>Filière:</strong> ${fieldName}
                </div>
                <div class="resource-detail">
                    <strong>Date:</strong> ${formatDate(resource.date)}
                </div>
                ${resource.userEmail ? `
                <div class="resource-detail">
                    <strong>Contributeur:</strong> ${resource.userEmail}
                </div>
                ` : ''}
                <div class="resource-detail" style="grid-column: 1 / -1;">
                    <strong>Lien:</strong> 
                    <a href="${resource.link}" target="_blank" class="resource-link">${resource.link}</a>
                </div>
            </div>
            <div class="resource-actions">
                ${isPending ? `
                    <button class="btn btn-success btn-approve">✓ Approuver</button>
                    <button class="btn btn-danger btn-reject">✗ Rejeter</button>
                ` : ''}
                <button class="btn btn-edit btn-edit-resource">✎ Modifier</button>
                <button class="btn btn-danger btn-delete">🗑 Supprimer</button>
            </div>
        </div>
    `;
}

// Attach Event Listeners to Resource Cards
function attachResourceEventListeners() {
    // Approve buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const card = e.target.closest('.resource-card');
            const moduleId = card.dataset.moduleId;
            const resourceId = card.dataset.resourceId;
            await approveResource(moduleId, resourceId);
        });
    });

    // Reject buttons
    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Êtes-vous sûr de vouloir rejeter cette ressource ?')) return;
            const card = e.target.closest('.resource-card');
            const moduleId = card.dataset.moduleId;
            const resourceId = card.dataset.resourceId;
            await rejectResource(moduleId, resourceId);
        });
    });

    // Edit buttons
    document.querySelectorAll('.btn-edit-resource').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.resource-card');
            const moduleId = card.dataset.moduleId;
            const resourceId = card.dataset.resourceId;
            openEditModal(moduleId, resourceId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) return;
            const card = e.target.closest('.resource-card');
            const moduleId = card.dataset.moduleId;
            const resourceId = card.dataset.resourceId;
            await deleteResource(moduleId, resourceId);
        });
    });
}

// Resource Management Functions
async function approveResource(moduleId, resourceId) {
    try {
        await update(ref(db, `resources/${moduleId}/${resourceId}`), {
            unverified: false
        });
        showToast('Ressource approuvée avec succès', 'success');
    } catch (error) {
        console.error('Error approving resource:', error);
        showToast('Erreur lors de l\'approbation', 'error');
    }
}

async function rejectResource(moduleId, resourceId) {
    try {
        await remove(ref(db, `resources/${moduleId}/${resourceId}`));
        showToast('Ressource rejetée et supprimée', 'success');
    } catch (error) {
        console.error('Error rejecting resource:', error);
        showToast('Erreur lors du rejet', 'error');
    }
}

async function deleteResource(moduleId, resourceId) {
    try {
        await remove(ref(db, `resources/${moduleId}/${resourceId}`));
        showToast('Ressource supprimée avec succès', 'success');
    } catch (error) {
        console.error('Error deleting resource:', error);
        showToast('Erreur lors de la suppression', 'error');
    }
}

// Edit Modal Functions
function openEditModal(moduleId, resourceId) {
    const resource = allResources.find(r =>
        r.moduleId === moduleId && r.resourceId === resourceId
    );

    if (!resource) {
        showToast('Ressource introuvable', 'error');
        return;
    }

    currentEditResource = { moduleId, resourceId };

    editTitle.value = resource.title || '';
    editLink.value = resource.link || '';
    editType.value = resource.type || 'exam';
    editProfessor.value = resource.professor || '';

    editModal.classList.remove('hidden');
}

function closeEditModal() {
    editModal.classList.add('hidden');
    currentEditResource = null;
    editForm.reset();
}

async function handleEditSubmit(e) {
    e.preventDefault();

    if (!currentEditResource) return;

    const updates = {
        title: editTitle.value.trim(),
        link: editLink.value.trim(),
        type: editType.value,
        professor: editProfessor.value.trim()
    };

    try {
        await update(
            ref(db, `resources/${currentEditResource.moduleId}/${currentEditResource.resourceId}`),
            updates
        );
        showToast('Ressource modifiée avec succès', 'success');
        closeEditModal();
    } catch (error) {
        console.error('Error updating resource:', error);
        showToast('Erreur lors de la modification', 'error');
    }
}

// Initialize
async function initialize() {
    // Check authentication
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = user;
        const isAdmin = await checkAdminStatus(user);

        if (!isAdmin) return;

        // Show dashboard
        adminEmail.textContent = user.email;
        loadingScreen.classList.add('hidden');
        adminDashboard.classList.remove('hidden');

        // Fetch metadata and resources
        await fetchMetadata();
        listenToResources();
    });

    // Event Listeners
    document.getElementById('btn-logout').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
            showToast('Erreur lors de la déconnexion', 'error');
        }
    });

    // Filter listeners
    filterStatus.addEventListener('change', renderResources);
    filterSemester.addEventListener('change', renderResources);
    filterField.addEventListener('change', renderResources);
    filterType.addEventListener('change', renderResources);
    searchInput.addEventListener('input', renderResources);

    btnResetFilters.addEventListener('click', () => {
        filterStatus.value = 'all';
        filterSemester.value = 'all';
        filterField.value = 'all';
        filterType.value = 'all';
        searchInput.value = '';
        renderResources();
    });

    // Modal listeners
    editModal.querySelector('.modal-close').addEventListener('click', closeEditModal);
    editModal.querySelector('.modal-cancel').addEventListener('click', closeEditModal);
    editForm.addEventListener('submit', handleEditSubmit);

    // Close modal on outside click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
}

// Start the app
initialize();
