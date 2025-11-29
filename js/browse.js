import { db, initFirebase, updateActiveLink } from './common.js';

const app = document.getElementById('app');

function init() {
    // Determine active state based on URL, but usually browse isn't a nav link itself
    updateActiveLink('browse.html');

    // Listen for DB updates and render after initial load
    initFirebase(() => {
        handleRouting();
    }, (isLoading) => {
        const spinner = document.getElementById('spinner-overlay');
        if (!spinner) return;
        if (isLoading) spinner.classList.remove('hidden');
        else spinner.classList.add('hidden');
    });

    // Handle browser back/forward
    window.addEventListener('popstate', handleRouting);
}

function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const fieldId = params.get('field');
    const semester = params.get('semester');
    const moduleId = params.get('module');

    if (search) {
        renderSearchResults(search);
    } else if (moduleId) {
        // If we have a module, we need field and semester for context/breadcrumbs
        // Ideally these are passed in URL, if not we might need to look them up
        renderResources(moduleId, fieldId, semester);
    } else if (semester && fieldId) {
        renderModules(fieldId, semester);
    } else if (fieldId) {
        renderSemesters(fieldId);
    } else {
        // Default to home if nothing specified
        window.location.href = 'index.html';
    }
}

// --- Render Functions ---

function renderSemesters(fieldId) {
    const field = db.fields.find(f => f.id === fieldId);
    if (!field) {
        app.innerHTML = '<p class="error">Filière introuvable.</p>';
        return;
    }

    app.innerHTML = `
        <div class="breadcrumb">
            <a href="index.html">Accueil</a> > <span>${field.name}</span>
        </div>
        <section class="section-header">
            <h2>${field.name} - Choisissez un Semestre</h2>
        </section>
        <div class="grid-container" id="semesters-grid"></div>
    `;

    const grid = document.getElementById('semesters-grid');
    db.semesters.forEach(sem => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid fa-calendar-check"></i></div>
            <h3>${sem}</h3>
        `;
        card.onclick = () => {
            window.location.href = `browse.html?field=${fieldId}&semester=${sem}`;
        };
        grid.appendChild(card);
    });
}

function renderModules(fieldId, semester) {
    const field = db.fields.find(f => f.id === fieldId);
    const modules = db.modules[`${fieldId}-${semester}`] || [];

    app.innerHTML = `
        <div class="breadcrumb">
            <a href="index.html">Accueil</a> > 
            <a href="browse.html?field=${fieldId}">${field ? field.name : fieldId}</a> > 
            <span>${semester}</span>
        </div>
        <section class="section-header">
            <h2>Modules du ${semester}</h2>
        </section>
        <div class="grid-container" id="modules-grid"></div>
    `;

    const grid = document.getElementById('modules-grid');
    if (modules.length === 0) {
        grid.innerHTML = '<p>Aucun module trouvé.</p>';
        return;
    }

    modules.forEach(mod => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-icon"><i class="fa-solid fa-book"></i></div>
            <h3>${mod.name}</h3>
            ${mod.professor ? `<p>${mod.professor}</p>` : ``}
        `;
        card.onclick = () => {
            window.location.href = `browse.html?field=${fieldId}&semester=${semester}&module=${mod.id}`;
        };
        grid.appendChild(card);
    });
}

function renderResources(moduleId, fieldId, semester) {
    // We need to find the module name for the header
    let moduleName = 'Module';
    if (fieldId && semester) {
        const modules = db.modules[`${fieldId}-${semester}`] || [];
        const mod = modules.find(m => m.id === moduleId);
        if (mod) moduleName = mod.name;
    }

    const resources = db.resources[moduleId] || [];

    // Normalize resources to an array so filtering works reliably
    let resourcesArr = resources;
    if (!Array.isArray(resourcesArr)) {
        if (typeof resourcesArr === 'object' && resourcesArr !== null) resourcesArr = Object.values(resourcesArr);
        else resourcesArr = [resourcesArr];
    }

    app.innerHTML = `
        <div class="breadcrumb">
            <a href="index.html">Accueil</a> > 
            ${fieldId ? `<a href="browse.html?field=${fieldId}">Filière</a> >` : ''}
            ${(fieldId && semester) ? `<a href="browse.html?field=${fieldId}&semester=${semester}">${semester}</a> >` : ''}
            <span>${moduleName}</span>
        </div>
        <section class="section-header">
            <h2>Ressources: ${moduleName}</h2>
        </section>
        
        <div class="resources-tabs">
            <button class="tab-btn active" data-type="all">Tout</button>
            <button class="tab-btn" data-type="cours">Cours</button>
            <button class="tab-btn" data-type="td">TD</button>
            <button class="tab-btn" data-type="exam">Examens</button>
            <button class="tab-btn" data-type="video">Vidéos</button>
        </div>

        <div class="resources-list" id="resources-list"></div>
    `;

    // Render initial list using normalized array
    renderResourceItems(resourcesArr);

    // Tab filtering: use the button element (btn) and the normalized array
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.dataset.type;
            const filtered = type === 'all' ? resourcesArr : resourcesArr.filter(r => r.type === type);
            renderResourceItems(filtered);
        };
    });
}

function renderResourceItems(items) {
    const container = document.getElementById('resources-list');
    container.innerHTML = '';

    // Normalize items: allow arrays, objects (e.g. map of id->item), or null/undefined
    if (!items) {
        container.innerHTML = '<p style="text-align:center; padding: 2rem;">Aucune ressource disponible.</p>';
        return;
    }

    if (!Array.isArray(items)) {
        if (typeof items === 'object') {
            items = Object.values(items);
        } else {
            // wrap primitive into array to avoid forEach error
            items = [items];
        }
    }

    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 2rem;">Aucune ressource disponible.</p>';
        return;
    }

    // Only show resources that are verified (unverified: false or missing)
    items.filter(item => !item.unverified || item.unverified === false).forEach(item => {
        const div = document.createElement('div');
        div.className = 'resource-item';

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
            } catch (e) { }
        }

        let icon = 'fa-file-pdf';
        if (item.type === 'video') icon = 'fa-youtube';

        // Resource details block
        let detailsHtml = `<div class="res-details">
            <strong>Type:</strong> ${item.type}<br>
            <strong>Professeur:</strong> ${item.professor || 'N/A'}<br>
            <strong>Lien:</strong> <a href="${item.link}" target="_blank">${item.link}</a>
        </div>`;

        div.innerHTML = `
            <div class="res-content-wrapper" style="width: 100%;">
                <div class="res-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: ${isYoutube ? '1rem' : '0'};">
                    <div class="res-icon"><i class="fa-solid ${icon}"></i></div>
                    <div class="res-info">
                        <h4>${item.title}</h4>
                        <span class="res-date">${item.date}</span>
                    </div>
                    ${!isYoutube ? `<a href="${item.link}" target="_blank" class="res-btn">Ouvrir</a>` : ''}
                    <button type="button" class="res-btn copy-link" data-link="${item.link}" title="Copier le lien"><i class="fa-solid fa-copy"></i></button>
                </div>
                ${detailsHtml}
                <!-- contributor display removed -->
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
        container.appendChild(div);

        // Attach copy-to-clipboard handler for the copy button
        const copyBtn = div.querySelector('.copy-link');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const link = copyBtn.dataset.link || item.link;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(link).then(() => {
                        alert('Lien copié dans le presse-papiers.');
                    }).catch(() => {
                        prompt('Copiez ce lien:', link);
                    });
                } else {
                    prompt('Copiez ce lien:', link);
                }
            });
        }
    });
}

function renderSearchResults(query) {
    app.innerHTML = `
        <div class="breadcrumb">
            <a href="index.html">Accueil</a> > <span>Recherche</span>
        </div>
        <section class="section-header">
            <h2>Résultats pour "${query}"</h2>
        </section>
        <div id="search-results"></div>
    `;

    const container = document.getElementById('search-results');

    // Search Modules
    const foundModules = [];
    Object.keys(db.modules || {}).forEach(key => {
        const [fieldId, semester] = key.split('-');
        let modules = db.modules[key];
        if (!modules) return;
        if (!Array.isArray(modules)) {
            if (typeof modules === 'object') modules = Object.values(modules);
            else modules = [modules];
        }
        modules.forEach(mod => {
            if ((mod.name && mod.name.toLowerCase().includes(query.toLowerCase())) ||
                (mod.professor && mod.professor.toLowerCase().includes(query.toLowerCase()))) {
                foundModules.push({ ...mod, fieldId, semester });
            }
        });
    });

    // Search Resources
    const foundResources = [];
    Object.keys(db.resources || {}).forEach(modId => {
        let resources = db.resources[modId];
        if (!resources) return;
        if (!Array.isArray(resources)) {
            if (typeof resources === 'object') resources = Object.values(resources);
            else resources = [resources];
        }
        resources.forEach(res => {
            if (res && res.title && res.title.toLowerCase().includes(query.toLowerCase())) {
                foundResources.push(res);
            }
        });
    });

    if (foundModules.length === 0 && foundResources.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Aucun résultat trouvé.</p>';
        return;
    }

    if (foundModules.length > 0) {
        const h3 = document.createElement('h3');
        h3.textContent = 'Modules';
        container.appendChild(h3);
        const grid = document.createElement('div');
        grid.className = 'grid-container';
        foundModules.forEach(mod => {
            const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-icon"><i class="fa-solid fa-book"></i></div>
                    <h3>${mod.name}</h3>
                    ${mod.professor ? `<p>${mod.professor}</p>` : ``}
                    <small>${mod.semester}</small>
                `;
            card.onclick = () => {
                window.location.href = `browse.html?field=${mod.fieldId}&semester=${mod.semester}&module=${mod.id}`;
            };
            grid.appendChild(card);
        });
        container.appendChild(grid);
    }

    if (foundResources.length > 0) {
        const h3 = document.createElement('h3');
        h3.textContent = 'Ressources';
        h3.style.marginTop = '2rem';
        container.appendChild(h3);
        const list = document.createElement('div');
        list.className = 'resources-list';
        // Reuse renderResourceItems logic but we need to append to list, not clear container
        // So let's just manually render here for simplicity or refactor.
        // I'll manually render simply.
        foundResources.forEach(item => {
            const div = document.createElement('div');
            div.className = 'resource-item';
            div.innerHTML = `
                <div class="res-icon"><i class="fa-solid fa-file"></i></div>
                <div class="res-info">
                    <h4>${item.title}</h4>
                    <span class="res-date">${item.date}</span>
                </div>
                <a href="${item.link}" target="_blank" class="res-btn">Ouvrir</a>
            `;
            list.appendChild(div);
        });
        container.appendChild(list);
    }
}

init();
