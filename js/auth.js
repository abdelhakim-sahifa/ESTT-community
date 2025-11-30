// Simple Firebase auth + profile storage using Realtime Database
import { app, db, ref, set } from './firebase-config.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const auth = getAuth(app);

function $(sel) { return document.querySelector(sel); }

function validateAcademicEmail(email) {
    return typeof email === 'string' && email.toLowerCase().endsWith('@etu.uae.ac.ma');
}

function openAuthModal(mode = 'login') {
    const modal = $('#auth-modal');
    if (!modal) return;
    modal.dataset.mode = mode;
    modal.classList.remove('hidden');
    const signupFields = modal.querySelectorAll('.signup-only');
    signupFields.forEach(f => f.style.display = mode === 'signup' ? 'block' : 'none');
    modal.querySelector('.auth-title').textContent = mode === 'signup' ? "S'inscrire" : 'Se connecter';
}

function closeAuthModal() {
    const modal = $('#auth-modal');
    if (!modal) return;
    modal.classList.add('hidden');
}

function readField(form, selectors) {
    for (const s of selectors) {
        const el = form.querySelector(s) || document.querySelector(s);
        if (el) return el.value.trim();
    }
    return '';
}

async function handleSignup(ev) {
    ev.preventDefault();
    const form = ev.target;
    const email = readField(form, ['#auth-email', '#signup-email', '[name="email"]']);
    const password = readField(form, ['#auth-password', '#signup-password', '[name="password"]']);
    const firstName = readField(form, ['#first-name', '[name="firstName"]']);
    const lastName = readField(form, ['#last-name', '[name="lastName"]']);
    const filiere = readField(form, ['#filiere', '[name="filiere"]']);
    const startYear = readField(form, ['#start-year', '[name="startYear"]']);

    const msg = document.querySelector('#auth-message') || document.querySelector('#signup-message');
    if (msg) msg.textContent = '';

    if (!validateAcademicEmail(email)) {
        if (msg) msg.textContent = 'Veuillez utiliser votre adresse académique @etu.uae.ac.ma.';
        return;
    }

    if (!password || password.length < 6) {
        if (msg) msg.textContent = 'Mot de passe requis (6 caractères minimum).';
        return;
    }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;
        await set(ref(db, `users/${uid}`), {
            email: email.toLowerCase(),
            firstName,
            lastName,
            filiere,
            startYear,
            createdAt: Date.now()
        });
        if (msg) msg.textContent = 'Inscription réussie — connecté.';
        // if on a separate page, redirect to home
        if (!document.querySelector('#auth-modal')) {
            window.location.href = 'index.html';
        } else {
            closeAuthModal();
        }
    } catch (err) {
        console.error(err);
        if (msg) msg.textContent = err.message || 'Erreur lors de l\'inscription.';
    }
}

async function handleLogin(ev) {
    ev.preventDefault();
    const form = ev.target;
    const email = readField(form, ['#auth-email', '#login-email', '#signup-email', '[name="email"]']);
    const password = readField(form, ['#auth-password', '#login-password', '#signup-password', '[name="password"]']);
    const msg = document.querySelector('#auth-message') || document.querySelector('#login-message');
    if (msg) msg.textContent = '';

    if (!validateAcademicEmail(email)) {
        if (msg) msg.textContent = 'Veuillez utiliser votre adresse académique @etu.uae.ac.ma.';
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        if (msg) msg.textContent = 'Connexion réussie.';
        if (!document.querySelector('#auth-modal')) {
            window.location.href = 'index.html';
        } else {
            closeAuthModal();
        }
    } catch (err) {
        console.error(err);
        if (msg) msg.textContent = 'Identifiants invalides.';
    }
}

function attachUI() {
    const loginBtn = $('#btn-open-login');
    const signupBtn = $('#btn-open-signup');

    // If modal exists, wire modal UI
    const modalRoot = $('#auth-modal');
    if (modalRoot) {
        loginBtn && loginBtn.addEventListener('click', () => openAuthModal('login'));
        signupBtn && signupBtn.addEventListener('click', () => openAuthModal('signup'));

        const closeBtn = modalRoot.querySelector('.auth-close');
        closeBtn && closeBtn.addEventListener('click', closeAuthModal);

        const authForm = modalRoot.querySelector('#auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                const mode = modalRoot.dataset.mode || 'login';
                if (mode === 'signup') return handleSignup(e);
                return handleLogin(e);
            });
        }

        const toggleLink = modalRoot.querySelector('#toggle-auth-mode');
        toggleLink && toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = modalRoot.dataset.mode === 'signup' ? 'login' : 'signup';
            openAuthModal(mode);
        });
    }

    // If page forms are present (login/signup pages), attach handlers
    const pageAuthForms = document.querySelectorAll('form#auth-form[data-mode]');
    pageAuthForms.forEach(f => {
        const mode = f.dataset.mode;
        if (mode === 'signup') f.addEventListener('submit', handleSignup);
        else f.addEventListener('submit', handleLogin);
    });

    // Simple sign-out button if present
    const signoutBtn = $('#btn-signout');
    signoutBtn && signoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        location.reload();
    });

    // Observe auth state for simple UI changes
    onAuthStateChanged(auth, (user) => {
        const userLabel = $('#user-label');
        if (user) {
            if (userLabel) userLabel.textContent = user.email;
            // hide login/signup links or buttons
            loginBtn && (loginBtn.style.display = 'none');
            signupBtn && (signupBtn.style.display = 'none');
            const out = $('#btn-signout'); if (out) out.style.display = 'inline-block';
        } else {
            if (userLabel) userLabel.textContent = '';
            loginBtn && (loginBtn.style.display = 'inline-block');
            signupBtn && (signupBtn.style.display = 'inline-block');
            const out = $('#btn-signout'); if (out) out.style.display = 'none';
        }
    });
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    attachUI();
});

export { openAuthModal, closeAuthModal };
