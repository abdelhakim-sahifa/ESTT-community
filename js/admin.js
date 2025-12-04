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
let currentTab = 'overview'; // 'overview', 'pending', 'all'

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const adminDashboard = document.getElementById('admin-dashboard');
const userLabel = document.getElementById('user-label');
const resourcesContainer = document.getElementById('resources-container');
const emptyState = document.getElementById('empty-state');
const badgePending = document.getElementById('badge-pending');
const refreshBtn = document.getElementById('refresh-btn');

// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

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
const statusFilterGroup = document.getElementById('status-filter-group');

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
        // Clear existing options except first
        while (filterSemester.options.length > 1) {
            filterSemester.remove(1);
        }
        Object.entries(semesters).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            filterSemester.appendChild(option);
        });
    }

    // Populate fields
    if (fields) {
        while (filterField.options.length > 1) {
            filterField.remove(1);
        }
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

// Update Statistics & Badges
function updateStatistics() {
    const pending = allResources.filter(r => r.unverified === true).length;
    const approved = allResources.filter(r => !r.unverified).length;
    const total = allResources.length;
    const today = allResources.filter(r => isToday(r.date)).length;

    statPending.textContent = pending;
    statApproved.textContent = approved;
    statTotal.textContent = total;
    statToday.textContent = today;

    // Update badge
    badgePending.textContent = pending;
    if (pending > 0) {
        badgePending.classList.remove('hidden');
    } else {
        badgePending.classList.add('hidden');
    }
}

// Tab Switching Logic
function switchTab(tabName) {
    currentTab = tabName;

    // Update buttons
    tabs.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'overview') {
        document.getElementById('tab-overview').classList.add('active');
    } else {
        document.getElementById('tab-resources').classList.add('active');

        // Configure filters based on tab
        if (tabName === 'pending') {
            statusFilterGroup.classList.add('hidden');
            filterStatus.value = 'pending'; // Force pending
        } else {
            statusFilterGroup.classList.remove('hidden');
            filterStatus.value = 'all'; // Default to all
        }
        renderResources();
    }
}

// Filter Resources
function getFilteredResources() {
    let filtered = [...allResources];

    // Tab-based filtering
    if (currentTab === 'pending') {
        filtered = filtered.filter(r => r.unverified === true);
    } else if (currentTab === 'all') {
        // Apply status filter if in 'all' tab
        const status = filterStatus.value;
        if (status === 'pending') {
            filtered = filtered.filter(r => r.unverified === true);
        } else if (status === 'approved') {
            filtered = filtered.filter(r => !r.unverified);
        }
    }

    // Common filters
    const semester = filterSemester.value;
    if (semester !== 'all') {
        filtered = filtered.filter(r => r.semester === semester);
    }

    const field = filterField.value;
    if (field !== 'all') {
        filtered = filtered.filter(r => r.field === field);
    }

    const type = filterType.value;
    if (type !== 'all') {
        filtered = filtered.filter(r => r.type === type);
    }

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
    if (currentTab === 'overview') return;

    const filtered = getFilteredResources();

    if (filtered.length === 0) {
        resourcesContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Group by semester -> module
    const groupedBySemester = {};
    filtered.forEach(resource => {
        const sem = resource.semester || 'unknown';
        if (!groupedBySemester[sem]) groupedBySemester[sem] = {};

        const mod = resource.moduleId || 'unknown';
        if (!groupedBySemester[sem][mod]) groupedBySemester[sem][mod] = [];

        groupedBySemester[sem][mod].push(resource);
    });

    let html = '';

    Object.entries(groupedBySemester).sort().forEach(([semesterId, semesterModules]) => {
        const semesterName = semesters[semesterId] || `Semestre ${semesterId}`;
        const semesterResourceCount = Object.values(semesterModules).flat().length;

        html += `
            <div class="semester-group">
                <div class="semester-header">
                    <h3>${semesterName}</h3>
                    <span class="semester-count">${semesterResourceCount}</span>
                </div>
        `;

        Object.entries(semesterModules).forEach(([moduleId, moduleResources]) => {
            const moduleName = modules[moduleId] || `Module ${moduleId}`;

            html += `
                <div class="module-group">
                    <div class="module-header">
                        <i class="fas fa-folder"></i> ${moduleName}
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

        html += `</div>`;
    });

    resourcesContainer.innerHTML = html;
    attachResourceEventListeners();
}

function renderResourceCard(resource) {
    const isPending = resource.unverified === true;
    const statusClass = isPending ? 'pending' : 'approved';
    const typeIcon = getTypeIcon(resource.type);
    const fieldName = fields[resource.field] || resource.field || 'N/A';

    return `
        <div class="resource-card ${statusClass}" data-module-id="${resource.moduleId}" data-resource-id="${resource.resourceId}">
            <div class="resource-header">
                <h4 class="resource-title">${resource.title || 'Sans titre'}</h4>
                <span class="resource-type" title="${resource.type}">${typeIcon}</span>
            </div>
            
            <div class="resource-meta">
                <div class="meta-row">
                    <i class="fas fa-user-tie"></i>
                    <span>${resource.professor || 'Prof. N/A'}</span>
                </div>
                <div class="meta-row">
                    <i class="fas fa-graduation-cap"></i>
                    <span>${fieldName}</span>
                </div>
                <div class="meta-row">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(resource.date)}</span>
                </div>
                ${resource.userEmail ? `
                <div class="meta-row">
                    <i class="fas fa-user"></i>
                    <span style="font-size:0.8em">${resource.userEmail}</span>
                </div>
                ` : ''}
            </div>

            <div class="resource-actions">
                <a href="${resource.link}" target="_blank" class="btn btn-outline" title="Voir">
                    <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="btn btn-outline btn-edit-resource" title="Modifier">
                    <i class="fas fa-pen"></i>
                </button>
                ${isPending ? `
                    <button class="btn btn-success btn-approve" title="Approuver">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="btn btn-danger btn-delete" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
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
        showToast('Ressource approuvée', 'success');
    } catch (error) {
        console.error('Error approving resource:', error);
        showToast('Erreur lors de l\'approbation', 'error');
    }
}

async function deleteResource(moduleId, resourceId) {
    try {
        await remove(ref(db, `resources/${moduleId}/${resourceId}`));
        showToast('Ressource supprimée', 'success');
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
        showToast('Ressource modifiée', 'success');
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
        if (userLabel) userLabel.textContent = user.email;
        loadingScreen.classList.add('hidden');
        adminDashboard.classList.remove('hidden');

        // Fetch metadata and resources
        await fetchMetadata();
        listenToResources();
    });

    // Event Listeners
    const signoutBtn = document.getElementById('btn-signout');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
                showToast('Erreur lors de la déconnexion', 'error');
            }
        });
    }

    // Tab listeners
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Filter listeners
    filterStatus.addEventListener('change', renderResources);
    filterSemester.addEventListener('change', renderResources);
    filterField.addEventListener('change', renderResources);
    filterType.addEventListener('change', renderResources);
    searchInput.addEventListener('input', renderResources);

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchMetadata();
            // Re-trigger listener? onValue is real-time, so maybe just toast
            showToast('Données actualisées', 'info');
        });
    }

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
