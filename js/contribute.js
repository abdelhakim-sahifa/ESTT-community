import { db, initFirebase, updateActiveLink } from './common.js';
import { db as firebaseDB, ref as fbRef, push } from './firebase-config.js';

function init() {
    updateActiveLink('contribute.html');

    // Initialize form (populate selects)
    populateForm();

    // Listen for DB updates (in case professors/fields change)
    initFirebase(() => {
        populateForm();
    });

    const form = document.getElementById('contribution-form');
    if (form) {
        form.onsubmit = handleContributionSubmit;
    }
}

function populateForm() {
    const fieldSelect = document.getElementById('field-select');
    const semesterSelect = document.getElementById('semester-select');
    const profSelect = document.getElementById('prof-select');
    const moduleSelect = document.getElementById('module-select');

    if (!fieldSelect || !semesterSelect || !profSelect) return;

    // Populate Fields
    if (db.fields) {
        // Save current selection if any
        const currentField = fieldSelect.value;
        fieldSelect.innerHTML = '<option value="">Choisir une filière</option>' +
            db.fields.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
        if (currentField) fieldSelect.value = currentField;
    }

    // Populate Semesters
    if (db.semesters) {
        const currentSem = semesterSelect.value;
        semesterSelect.innerHTML = '<option value="">Choisir un semestre</option>' +
            db.semesters.map(s => `<option value="${s}">${s}</option>`).join('');
        if (currentSem) semesterSelect.value = currentSem;
    }

    // Populate Professors
    populateProfessorSelect();

    // Setup listeners for Module population
    fieldSelect.onchange = () => populateModuleSelect(fieldSelect.value, semesterSelect.value);
    semesterSelect.onchange = () => populateModuleSelect(fieldSelect.value, semesterSelect.value);
}

function getProfessorsList() {
    if (!db) return [];
    if (Array.isArray(db.professors)) return db.professors;
    if (db.professors && Array.isArray(db.professors.professors)) return db.professors.professors;
    return [];
}

function populateProfessorSelect() {
    const select = document.getElementById('prof-select');
    if (!select) return;

    const currentVal = select.value;
    const list = getProfessorsList();

    select.innerHTML = '<option value="">Choisir un professeur</option>';
    list.forEach(p => {
        const name = p.name || p;
        const dept = p.department ? ` — ${p.department}` : '';
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `${name}${dept}`;
        select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
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
        semester,
        unverified: true
    };

    // Push to Firebase under resources/<moduleId>
    try {
        push(fbRef(firebaseDB, `resources/${moduleId}`), newRes)
            .then(() => {
                showContributionResult(newRes, fieldId, semester, moduleId);
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

function showContributionResult(res, fieldId, semester, moduleId) {
    const container = document.getElementById('contrib-result');
    if (!container) {
        alert('Merci pour votre contribution !');
        return;
    }

    const browseModuleUrl = `browse.html?field=${encodeURIComponent(fieldId)}&semester=${encodeURIComponent(semester)}&module=${encodeURIComponent(moduleId)}`;
    const browseFieldUrl = `browse.html?field=${encodeURIComponent(fieldId)}`;

    container.innerHTML = `
        <h3>Merci pour votre contribution !</h3>
        <p>Résumé de la ressource soumise :</p>
        <ul>
            <li><strong>Titre:</strong> ${escapeHtml(res.title)}</li>
            <li><strong>Type:</strong> ${escapeHtml(res.type)}</li>
            <li><strong>Professeur:</strong> ${escapeHtml(res.professor)}</li>
            <li><strong>Date:</strong> ${escapeHtml(res.date)}</li>
            <li><strong>Lien:</strong> <a href="${escapeAttr(res.link)}" target="_blank" rel="noopener">Ouvrir la ressource</a></li>
        </ul>
        <p>
            <a href="${browseModuleUrl}">Voir toutes les ressources du module (inclut votre contribution)</a>
            &nbsp;|&nbsp;
            <a href="${browseFieldUrl}">Voir toutes les ressources de la filière</a>
        </p>
    `;

    container.style.display = 'block';
}

// Small helpers to avoid injection of user values into the DOM
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '%22');
}

init();
