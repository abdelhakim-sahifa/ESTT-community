import { db as fallbackDb } from './data.js';
import { db as firebaseDB, ref as fbRef, get, push } from './firebase-config.js';

// Live DB (starts as fallback until Firebase provides data)
let db = fallbackDb;

// State
const state = {
    currentView: 'home', // home, semester, modules, resources, contribute, search
    selectedField: null,
    selectedSemester: null,
    selectedModule: null
};

// DOM Elements
const app = document.getElementById('app');
const heroSection = document.getElementById('hero');

// Init
function init() {
    // Handle initial load or back/forward
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            Object.assign(state, event.state);
            renderBasedOnState();
        } else {
            // Default to home
            state.currentView = 'home';
            renderFields();
        }
    });

    // Start listening to Firebase; UI will update when data arrives.
    listenFirebaseData();

    // Initial render uses fallback until Firebase data overwrites `db`.
    renderFields();
    setupNavigation();
    setupSearch();
}

function renderBasedOnState() {
    switch (state.currentView) {
        case 'home':
            renderFields();
            break;
        case 'semester':
            renderSemesters();
            break;
        case 'modules':
            renderModules();
            break;
        case 'resources':
            renderResources();
            break;
        case 'contribute':
            renderContribution();
            break;
        case 'search':
            // If we can't restore search query easily, just go home or stay put.
            // Ideally we'd store query in state too.
            renderFields();
            break;
        default:
            renderFields();
    }
}

function pushState() {
    history.pushState({ ...state }, '', `#${state.currentView}`);
}

// Listen to Firebase Realtime Database root and update local `db` when data changes
function listenFirebaseData() {
    try {
        // One-time read on page load instead of realtime subscription
        get(fbRef(firebaseDB, '/'))
            .then((snapshot) => {
                const val = snapshot.val();
                if (val) {
                    db = val;
                    // If the UI is currently shown, re-render to reflect fetched data
                    renderBasedOnState();
                } else {
                    console.warn('Firebase returned empty data; keeping fallback data.');
                }
            })
            .catch((err) => {
                console.error('Firebase get() error:', err);
            });
    } catch (e) {
        console.error('Error fetching Firebase data', e);
    }
}

// --- Search Functionality ---

function setupSearch() {
    const searchInput = document.getElementById('global-search');
    let debounceTimer;

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim().toLowerCase();

        debounceTimer = setTimeout(() => {
            if (query.length >= 2) {
                handleSearch(query);
            } else if (query.length === 0 && state.currentView === 'search') {
                // Return to home if search is cleared and we are in search view
                document.querySelector('a[data-page="home"]').click();
            }
        }, 300);
    });
}

function handleSearch(query) {
    state.currentView = 'search';
    // We don't push state for every keystroke search, maybe just when entering search mode?
    // Let's not push state for search to avoid history pollution, or push once.

    // Search Modules
    const foundModules = [];
    Object.keys(db.modules).forEach(key => {
        const [fieldId, semester] = key.split('-');
        const modules = db.modules[key];
        modules.forEach(mod => {
            const nameMatch = mod.name && mod.name.toLowerCase().includes(query);
            const profMatch = mod.professor && mod.professor.toLowerCase().includes(query);
            if (nameMatch || profMatch) {
                foundModules.push({ ...mod, fieldId, semester });
            }
        });
    });

    // Search Resources
    const foundResources = [];
    Object.keys(db.resources).forEach(modId => {
        const resources = db.resources[modId];
        resources.forEach(res => {
            if (res.title.toLowerCase().includes(query)) {
                // Find module info for context
                let moduleInfo = null;
                // Reverse lookup module (inefficient but works for small mock db)
                Object.values(db.modules).flat().forEach(m => {
                    if (m.id === modId) moduleInfo = m;
                });

                foundResources.push({ ...res, moduleName: moduleInfo ? moduleInfo.name : 'Inconnu' });
            }
        });
    });

    renderSearchResults(query, foundModules, foundResources);
}

function renderSearchResults(query, modules, resources) {
    app.innerHTML = '';
    app.appendChild(heroSection);

    const section = document.createElement('section');
    section.className = 'search-results-section';
    section.innerHTML = `
        <div class="section-header">
            <h2>Résultats pour "${query}"</h2>
        </div>
    `;

    if (modules.length === 0 && resources.length === 0) {
        section.innerHTML += '<p style="text-align:center; color:#666;">Aucun résultat trouvé.</p>';
        app.appendChild(section);
        return;
    }

    if (modules.length > 0) {
        section.innerHTML += '<h3>Modules</h3>';
        const grid = document.createElement('div');
        grid.className = 'grid-container';
        modules.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-icon"><i class="fa-solid fa-book"></i></div>
                <h3>${mod.name}</h3>
                <p>${mod.professor}</p>
                <small>${mod.semester}</small>
            `;
            card.onclick = () => {
                const field = db.fields.find(f => f.id === mod.fieldId);
                if (field) {
                    state.selectedField = field;
                    state.selectedSemester = mod.semester;
                    selectModule(mod);
                }
            };
            grid.appendChild(card);
        });
        section.appendChild(grid);
    }

    if (resources.length > 0) {
        section.innerHTML += '<h3 style="margin-top: 2rem;">Ressources</h3>';
        const list = document.createElement('div');
        list.className = 'resources-list';

        resources.forEach(item => {
            const div = document.createElement('div');
            div.className = 'resource-item';

            let icon = 'fa-file-pdf';
            if (item.type === 'video') icon = 'fa-youtube';

            div.innerHTML = `
                <div class="res-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="res-info">
                    <h4>${item.title}</h4>
                    <span class="res-date">${item.moduleName} • ${item.date}</span>
                </div>
                <a href="${item.link}" target="_blank" class="res-btn">Ouvrir</a>
            `;
            list.appendChild(div);
        });
        section.appendChild(list);
    }

    app.appendChild(section);
}

// --- Core Navigation & Rendering ---

// Render Fields (Home)
function renderFields() {
    app.innerHTML = '';
    app.appendChild(heroSection);

    const section = document.createElement('section');
    section.className = 'fields-section';
    section.innerHTML = '<h2>Nos Filières</h2>';

    const grid = document.createElement('div');
    grid.className = 'grid-container';

    db.fields.forEach(field => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid ${field.icon}"></i></div>
            <h3>${field.name}</h3>
            <p>${field.description}</p>
        `;
        card.onclick = () => selectField(field);
        grid.appendChild(card);
    });

    section.appendChild(grid);
    app.appendChild(section);
}

// Select Field -> Show Semesters
function selectField(field) {
    state.selectedField = field;
    state.currentView = 'semester';
    pushState();
    renderSemesters();
}

function renderSemesters() {
    app.innerHTML = `
        <div class="breadcrumb">
            <span onclick="window.location.reload()" style="cursor:pointer">Accueil</span> > <span>${state.selectedField.name}</span>
        </div>
        <section class="section-header">
            <h2>Choisissez un Semestre</h2>
        </section>
    `;

    const grid = document.createElement('div');
    grid.className = 'grid-container';

    db.semesters.forEach(sem => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid fa-calendar-check"></i></div>
            <h3>${sem}</h3>
        `;
        card.onclick = () => selectSemester(sem);
        grid.appendChild(card);
    });

    app.appendChild(grid);
}

// Select Semester -> Show Modules
function selectSemester(sem) {
    state.selectedSemester = sem;
    state.currentView = 'modules';
    pushState();
    renderModules();
}

function renderModules() {
    const fieldId = state.selectedField.id;
    const sem = state.selectedSemester;
    const modules = db.modules[`${fieldId}-${sem}`] || [];

    app.innerHTML = `
        <div class="breadcrumb">
            <span onclick="window.location.reload()" style="cursor:pointer">Accueil</span> > 
            <span onclick="renderSemesters()" style="cursor:pointer">${state.selectedField.name}</span> > 
            <span>${sem}</span>
        </div>
        <section class="section-header">
            <h2>Modules du ${sem}</h2>
        </section>
    `;

    if (modules.length === 0) {
        app.innerHTML += '<p style="text-align:center; padding: 2rem;">Aucun module trouvé pour ce semestre.</p>';
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid-container';

    modules.forEach(mod => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid fa-book"></i></div>
            <h3>${mod.name}</h3>
            <p>${mod.professor}</p>
        `;
        card.onclick = () => selectModule(mod);
        grid.appendChild(card);
    });

    app.appendChild(grid);
}

// Select Module -> Show Resources
function selectModule(mod) {
    state.selectedModule = mod;
    state.currentView = 'resources';
    pushState();
    renderResources();
}

function renderResources() {
    const resources = db.resources[state.selectedModule.id] || [];

    app.innerHTML = `
        <div class="breadcrumb">
            <span onclick="window.location.reload()" style="cursor:pointer">Accueil</span> > 
            <span onclick="renderSemesters()" style="cursor:pointer">${state.selectedField.name}</span> > 
            <span onclick="selectSemester('${state.selectedSemester}')" style="cursor:pointer">${state.selectedSemester}</span> >
            <span>${state.selectedModule.name}</span>
        </div>
        <section class="section-header">
            <h2>Ressources: ${state.selectedModule.name}</h2>
        </section>
        
        <div class="resources-tabs">
            <button class="tab-btn active" data-type="all">Tout</button>
            <button class="tab-btn" data-type="cours">Cours</button>
            <button class="tab-btn" data-type="td">TD</button>
            <button class="tab-btn" data-type="exam">Examens</button>
            <button class="tab-btn" data-type="video">Vidéos</button>
        </div>

        <div class="resources-list" id="resources-list">
            <!-- Resources injected here -->
        </div>
    `;

    renderResourceItems(resources);

    // Tab filtering logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const type = e.target.dataset.type;
            const filtered = type === 'all' ? resources : resources.filter(r => r.type === type);
            renderResourceItems(filtered);
        };
    });
}

function renderResourceItems(items) {
    const container = document.getElementById('resources-list');
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 2rem;">Aucune ressource disponible.</p>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'resource-item';

        // Check for YouTube video
        const isYoutube = item.type === 'video' && (item.link.includes('youtube.com') || item.link.includes('youtu.be'));
        let videoId = '';
        if (isYoutube) {
            try {
                const url = new URL(item.link);
                if (url.hostname.includes('youtube.com')) {
                    videoId = url.searchParams.get('v');
                } else if (url.hostname.includes('youtu.be')) {
                    videoId = url.pathname.slice(1);
                }
            } catch (e) { console.error('Invalid URL', e); }
        }

        let icon = 'fa-file-pdf';
        if (item.type === 'video') icon = 'fa-youtube';

        let content = `
            <div class="res-content-wrapper" style="width: 100%;">
                <div class="res-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: ${isYoutube ? '1rem' : '0'};">
                    <div class="res-icon"><i class="fa-solid ${icon}"></i></div>
                    <div class="res-info">
                        <h4>${item.title}</h4>
                        <span class="res-date">${item.date}</span>
                    </div>
                    ${!isYoutube ? `<a href="${item.link}" target="_blank" class="res-btn">Ouvrir</a>` : ''}
                </div>
                ${isYoutube && videoId ? `
                <div class="video-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px;">
                    <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        title="${item.title}" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                ` : ''}
            </div>
        `;

        div.innerHTML = content;
        container.appendChild(div);
    });
}

// --- Navigation & Contribution ---

function setupNavigation() {
    document.querySelector('a[data-page="home"]').onclick = (e) => {
        e.preventDefault();
        state.currentView = 'home';
        updateActiveLink('home');
        pushState();
        renderFields();
    };

    document.querySelector('a[data-page="contribute"]').onclick = (e) => {
        e.preventDefault();
        state.currentView = 'contribute';
        updateActiveLink('contribute');
        pushState();
        renderContribution();
    };
}

function updateActiveLink(page) {
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) link.classList.add('active');
    });
}

function renderContribution() {
    app.innerHTML = '';
    app.appendChild(heroSection);

    const section = document.createElement('section');
    section.className = 'contribution-section';

    section.innerHTML = `
        <div class="section-header">
            <h2>Contribuer une Ressource</h2>
            <p>Aidez vos camarades en partageant vos cours, TD ou examens.</p>
        </div>
        
        <form id="contribution-form" class="contribution-form">
            <div class="form-group">
                <label for="field-select">Filière</label>
                <select id="field-select" required>
                    <option value="">Choisir une filière</option>
                    ${db.fields.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="semester-select">Semestre</label>
                <select id="semester-select" required>
                    <option value="">Choisir un semestre</option>
                    ${db.semesters.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="module-select">Module</label>
                <select id="module-select" required>
                    <option value="">Choisir un module</option>
                    <!-- options injected based on selected filière & semestre -->
                </select>
            </div>

            <div class="form-group">
                <label for="prof-select">Professeur</label>
                <select id="prof-select" required>
                    <option value="">Choisir un professeur</option>
                    <!-- professor options injected from /professors -->
                </select>
            </div>
            
            <div class="form-group">
                <label for="res-type">Type de ressource</label>
                <select id="res-type" required>
                    <option value="cours">Cours</option>
                    <option value="td">TD</option>
                    <option value="exam">Examen</option>
                    <option value="video">Vidéo</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="res-title">Titre du fichier</label>
                <input type="text" id="res-title" placeholder="Ex: Chapitre 1 - Introduction" required>
            </div>
            
            <div class="form-group">
                <label for="res-link">Lien (Drive, YouTube, etc.)</label>
                <input type="url" id="res-link" placeholder="https://..." required>
            </div>
            
            <button type="submit" class="submit-btn">Envoyer</button>
        </form>
    `;

    app.appendChild(section);

    // Populate professor list and modules (modules depend on field+semester selection)
    populateProfessorSelect();
    // When field or semester changes, update module list
    document.getElementById('field-select').onchange = (e) => {
        const fieldId = e.target.value;
        const sem = document.getElementById('semester-select').value;
        populateModuleSelect(fieldId, sem);
    };
    document.getElementById('semester-select').onchange = (e) => {
        const sem = e.target.value;
        const fieldId = document.getElementById('field-select').value;
        populateModuleSelect(fieldId, sem);
    };

    // If the DB updates while this view is open, we should refresh selects
    // (renderContribution will be called by renderBasedOnState when db changes)

    document.getElementById('contribution-form').onsubmit = handleContributionSubmit;
}

// Helpers for contribution form
function getProfessorsList() {
    if (!db) return [];
    if (Array.isArray(db.professors)) return db.professors;
    if (db.professors && Array.isArray(db.professors.professors)) return db.professors.professors;
    return [];
}

function populateProfessorSelect() {
    const select = document.getElementById('prof-select');
    if (!select) return;
    const list = getProfessorsList();
    select.innerHTML = '<option value="">Choisir un professeur</option>';
    list.forEach((p, idx) => {
        const name = p.name || p;
        const dept = p.department ? ` — ${p.department}` : '';
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `${name}${dept}`;
        select.appendChild(opt);
    });
}

function populateModuleSelect(fieldId, semester) {
    const select = document.getElementById('module-select');
    if (!select) return;
    select.innerHTML = '<option value="">Choisir un module</option>';
    if (!fieldId || !semester) return;
    const key = `${fieldId}-${semester}`;
    const modules = (db.modules && db.modules[key]) || [];
    modules.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        select.appendChild(opt);
    });
}

function handleContributionSubmit(e) {
    e.preventDefault();
    const fieldId = document.getElementById('field-select').value;
    const semester = document.getElementById('semester-select').value;
    const moduleId = document.getElementById('module-select').value;
    const professor = document.getElementById('prof-select').value;
    const type = document.getElementById('res-type').value;
    const title = document.getElementById('res-title').value.trim();
    const link = document.getElementById('res-link').value.trim();

    if (!fieldId || !semester || !moduleId || !professor || !type || !title || !link) {
        alert('Veuillez remplir tous les champs requis.');
        return;
    }

    const newRes = {
        title,
        link,
        type,
        date: new Date().toISOString().split('T')[0],
        professor,
        field: fieldId,
        semester
    };

    // Push to Firebase under resources/<moduleId>
    try {
        push(fbRef(firebaseDB, `resources/${moduleId}`), newRes)
            .then(() => {
                alert('Merci pour votre contribution ! Elle sera vérifiée avant publication.');
                e.target.reset();
            })
            .catch(err => {
                console.error('Error pushing contribution:', err);
                alert('Erreur lors de l\'envoi vers Firebase. Vérifiez la console.');
            });
    } catch (err) {
        console.error('Push failed:', err);
        alert('Impossible d\'envoyer la contribution (erreur interne).');
    }
}

// Start
init();
