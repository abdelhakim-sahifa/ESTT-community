import { db, initFirebase, updateActiveLink } from './common.js';

const heroSection = document.getElementById('hero');
const fieldsContainer = document.getElementById('fields-container');
const bannersContainer = document.getElementById('banners-container');
const statsContainer = document.getElementById('stats-container');

function init() {
    updateActiveLink('index.html');

    // Initial render
    renderFields();
    renderBanners();
    renderStats();
    setupSearch();

    // Listen for DB updates
    initFirebase(() => {
        renderFields();
        renderStats();
    }, (isLoading) => {
        const spinner = document.getElementById('spinner-overlay');
        if (!spinner) return;
        if (isLoading) spinner.classList.remove('hidden');
        else spinner.classList.add('hidden');
    });
}

function renderBanners() {
    if (!bannersContainer) return;

    // Map field ids to the provided banner images (fallbacks if you change names)
    const bannerMap = {
        'ia': 'assets/images/DUT-1.jpg',
        'insem': 'assets/images/DUT-2.jpg',
        'casi': 'assets/images/DUT-3.jpg',
        'idd': 'assets/images/program-big3.jpg'
    };

    // If we have dynamic `db.fields`, render banners to match filières
    if (db && Array.isArray(db.fields) && db.fields.length) {
        bannersContainer.innerHTML = '';
        db.fields.forEach(field => {
            const imgSrc = bannerMap[field.id] || Object.values(bannerMap)[0];
            const a = document.createElement('a');
            a.className = 'banner-card';
            a.href = `browse.html?field=${encodeURIComponent(field.id)}`;
            a.title = field.name || field.id;
            a.innerHTML = `
                <img src="${imgSrc}" alt="${escapeHtml(field.name || field.id)} program banner" loading="lazy">
                <div class="banner-label">${escapeHtml(field.name || field.id)}</div>
            `;
            bannersContainer.appendChild(a);
        });
        return;
    }

    // Fallback: leave any existing static banners in the HTML if db.fields not available yet.
}

function renderStats() {
    if (!statsContainer) return;

    // Compute modules count
    let modulesCount = 0;
    if (db && db.modules) {
        Object.keys(db.modules).forEach(k => {
            const entry = db.modules[k];
            if (Array.isArray(entry)) {
                modulesCount += entry.length;
            } else if (entry && typeof entry === 'object') {
                const vals = Object.values(entry);
                modulesCount += vals.length;
            }
        });
    }

    // Compute resources and contributions (unverified resources count)
    let resourcesCount = 0;
    let contributionsCount = 0;
    if (db && db.resources) {
        console.log('in')
        Object.keys(db.resources).forEach(k => {
            const entry = db.resources[k];
            console.log(entry);
            if (!entry) return;

            // Support both array and keyed-object snapshots from Firebase
            if (Array.isArray(entry)) {
                resourcesCount += entry.length;
                console.log('Counting contributions in', k, entry);
                entry.forEach(item => { if (item && item.unverified) contributionsCount++; });
            } else if (typeof entry === 'object') {
                const vals = Object.values(entry);
                resourcesCount += vals.length;
                console.log('Counting contributions in', k, vals);
                vals.forEach(item => { if (item && item.unverified) contributionsCount++; });
            }
        });
    }

    // Update DOM values (safely)
    const elContrib = document.getElementById('stat-contributions');
    const elRes = document.getElementById('stat-resources');
    const elMods = document.getElementById('stat-modules');

    if (elContrib) elContrib.textContent = String(contributionsCount || 0);
    if (elRes) elRes.textContent = String(resourcesCount || 0);
    if (elMods) elMods.textContent = String(modulesCount || 0);

    // Also mirror the counts to the hero area (if present) for immediate visibility
    const heroRes = document.getElementById('hero-stat-resources');
    const heroContrib = document.getElementById('hero-stat-contributions');
    const heroMods = document.getElementById('hero-stat-modules');
    if (heroRes) heroRes.textContent = String(resourcesCount || 0);
    if (heroContrib) heroContrib.textContent = String(contributionsCount || 0);
    if (heroMods) heroMods.textContent = String(modulesCount || 0);
}

function renderFields() {
    if (!fieldsContainer) return;

    fieldsContainer.innerHTML = '';

    if (!db.fields) return;

    // `db.fields` may be an array or an object (Firebase keyed snapshot)
    const fieldsArr = Array.isArray(db.fields) ? db.fields : Object.values(db.fields || {});

    fieldsArr.forEach(field => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid ${field.icon}"></i></div>
            <h3>${field.name}</h3>
            <p>${field.description}</p>
        `;
        // Navigate to browse.html with field param
        card.onclick = () => {
            window.location.href = `browse.html?field=${field.id}`;
        };
        fieldsContainer.appendChild(card);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('global-search');
    const searchIcon = document.querySelector('.search-bar i');

    if (!searchInput) return;

    const navigateIfValid = (val) => {
        const query = (typeof val === 'string' ? val : searchInput.value || '').trim();
        if (query.length >= 2) {
            window.location.href = `browse.html?search=${encodeURIComponent(query)}`;
        }
    };

    // Navigate only when user confirms (press Enter) or clicks the icon.
    // This prevents navigating away while the user is still typing.
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            navigateIfValid();
        }
    });

    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', () => navigateIfValid());
    }
}

// Mobile menu toggle
function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('main-nav');

    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !nav.contains(e.target)) {
                nav.classList.remove('active');
            }
        });
    }
}

init();
initMobileMenu();
