// Blog page functionality
import { app, db, ref, get, set, push, update, onValue } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { uploadResourceFile } from './supabase.js';

const auth = getAuth(app);

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

let currentUser = null;
let allArticles = [];
let currentCategory = 'all';

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

// --- Main Blog Page (blog.html) ---

async function loadArticles() {
    try {
        showSpinner();
        const articlesRef = ref(db, 'articles');
        const snapshot = await get(articlesRef);

        if (!snapshot.exists()) {
            displayArticles([]);
            return;
        }

        const articlesData = snapshot.val();
        allArticles = Object.entries(articlesData).map(([id, article]) => ({
            id,
            ...article
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        displayArticles(allArticles);
    } catch (error) {
        console.error('Error loading articles:', error);
        displayArticles([]);
    } finally {
        hideSpinner();
    }
}

function displayArticles(articles) {
    const container = $('#blog-articles');
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun article pour le moment. Soyez le premier à partager !</p>';
        return;
    }

    container.innerHTML = articles.map(article => `
        <div class="blog-card" data-id="${article.id}" onclick="window.location.href='article.html?id=${article.id}'">
            <div class="blog-card-header" style="${article.coverUrl ? `background-image: url('${article.coverUrl}'); background-size: cover; background-position: center;` : ''}">
                <div class="blog-card-header-overlay" style="${article.coverUrl ? 'background: rgba(0,0,0,0.5); position: absolute; top: 0; left: 0; width: 100%; height: 100%;' : ''}"></div>
                <div style="position: relative; z-index: 1;">
                    <span class="blog-card-category">${article.category || 'Autre'}</span>
                    <h3>${article.title}</h3>
                </div>
            </div>
            <div class="blog-card-body">
                ${article.summary ? `<p class="blog-card-summary">${article.summary}</p>` : ''}
                <div class="blog-card-meta">
                    <div class="blog-card-author">
                        <i class="fas fa-user"></i>
                        <span>${article.authorName || 'Anonyme'}</span>
                    </div>
                    <div class="blog-card-date">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(article.timestamp)}</span>
                    </div>
                </div>
                ${article.tags ? `
                    <div class="blog-card-tags">
                        ${article.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function filterArticles(category) {
    currentCategory = category;
    if (category === 'all') {
        displayArticles(allArticles);
    } else {
        const filtered = allArticles.filter(article => article.category === category);
        displayArticles(filtered);
    }
}

function searchArticles(query) {
    if (!query.trim()) {
        filterArticles(currentCategory);
        return;
    }
    const searchTerm = query.toLowerCase();
    let articlesToSearch = currentCategory === 'all' ? allArticles :
        allArticles.filter(article => article.category === currentCategory);

    const filtered = articlesToSearch.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        (article.summary && article.summary.toLowerCase().includes(searchTerm)) ||
        (article.content && article.content.toLowerCase().includes(searchTerm)) ||
        (article.tags && article.tags.toLowerCase().includes(searchTerm))
    );
    displayArticles(filtered);
}

function initFilters() {
    const filterBtns = $$('.tag-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterArticles(category);
        });
    });
}

function initSearch() {
    const searchInput = $('#blog-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchArticles(e.target.value);
            }, 300);
        });
    }
}

// --- Write Article Page (write-article.html) ---

function initWriteArticle() {
    const form = $('#new-article-form');
    const coverInput = $('#article-cover');
    const coverPreview = $('#cover-preview');

    if (!form) return;

    // Cover image preview
    coverInput?.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                coverPreview.style.display = 'block';
                coverPreview.querySelector('img').src = e.target.result;
            }
            reader.readAsDataURL(file);
        } else {
            coverPreview.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Vous devez être connecté pour publier un article.');
            return;
        }

        const messageEl = $('#article-message');
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            showSpinner();
            if (submitBtn) submitBtn.disabled = true;

            // Upload cover image if exists
            let coverUrl = null;
            const coverFile = coverInput?.files[0];
            if (coverFile) {
                const uploadResult = await uploadResourceFile(coverFile);
                coverUrl = uploadResult.publicUrl;
            }

            // Get user data
            const userRef = ref(db, `users/${currentUser.uid}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.exists() ? userSnapshot.val() : {};
            const authorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Anonyme';

            const articleData = {
                title: $('#article-title').value.trim(),
                category: $('#article-category').value,
                summary: $('#article-summary').value.trim(),
                content: $('#article-content').value.trim(),
                tags: $('#article-tags').value.trim(),
                coverUrl: coverUrl,
                authorId: currentUser.uid,
                authorName: authorName,
                authorEmail: currentUser.email,
                timestamp: Date.now(),
                likes: 0,
                dislikes: 0
            };

            const articlesRef = ref(db, 'articles');
            const newArticleRef = await push(articlesRef, articleData);

            if (messageEl) {
                messageEl.style.color = 'green';
                messageEl.textContent = 'Article publié avec succès ! Redirection...';
            }

            setTimeout(() => {
                window.location.href = `article.html?id=${newArticleRef.key}`;
            }, 1500);

        } catch (error) {
            console.error('Error publishing article:', error);
            if (messageEl) {
                messageEl.style.color = 'red';
                messageEl.textContent = 'Erreur lors de la publication : ' + error.message;
            }
            if (submitBtn) submitBtn.disabled = false;
        } finally {
            hideSpinner();
        }
    });
}

// --- Article Detail Page (article.html) ---

async function initArticleDetail() {
    const articleContainer = $('#full-article');
    if (!articleContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        articleContainer.innerHTML = '<p class="error-state">Article non trouvé.</p>';
        return;
    }

    try {
        const articleRef = ref(db, `articles/${articleId}`);

        // Listen for updates (likes/comments)
        onValue(articleRef, (snapshot) => {
            if (!snapshot.exists()) {
                articleContainer.innerHTML = '<p class="error-state">Article introuvable.</p>';
                return;
            }
            const article = snapshot.val();
            renderFullArticle(articleId, article);
        });

    } catch (error) {
        console.error('Error loading article:', error);
        articleContainer.innerHTML = '<p class="error-state">Erreur lors du chargement de l\'article.</p>';
    }
}

function renderFullArticle(articleId, article) {
    const container = $('#full-article');
    if (!container) return;

    // Check if user already liked/disliked (local storage for simplicity, or sub-collection in real app)
    // For this simple app, we'll just use local storage to toggle button state visually
    const userVote = localStorage.getItem(`vote_${articleId}_${currentUser?.uid}`);

    container.innerHTML = `
        <div class="article-header">
            ${article.coverUrl ? `<img src="${article.coverUrl}" alt="Couverture" class="article-cover-img">` : ''}
            <div class="article-meta-header">
                <span class="article-category-badge">${article.category || 'Autre'}</span>
                <h1>${article.title}</h1>
                <div class="article-meta-info">
                    <span><i class="fas fa-user"></i> ${article.authorName || 'Anonyme'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(article.timestamp)}</span>
                </div>
            </div>
        </div>

        <div class="article-content">
            ${article.content.split('\n').map(p => `<p>${p}</p>`).join('')}
        </div>

        ${article.tags ? `
            <div class="article-tags">
                ${article.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
            </div>
        ` : ''}

        <div class="article-actions">
            <button class="action-btn ${userVote === 'like' ? 'active' : ''}" onclick="handleVote('${articleId}', 'like')">
                <i class="fas fa-thumbs-up"></i> <span>${article.likes || 0}</span>
            </button>
            <button class="action-btn ${userVote === 'dislike' ? 'active' : ''}" onclick="handleVote('${articleId}', 'dislike')">
                <i class="fas fa-thumbs-down"></i> <span>${article.dislikes || 0}</span>
            </button>
        </div>

        <div class="comments-section">
            <h3>Commentaires</h3>
            <div id="comments-list">
                <!-- Comments loaded here -->
            </div>
            
            ${currentUser ? `
                <form id="comment-form" class="comment-form">
                    <textarea id="comment-text" placeholder="Ajouter un commentaire..." required></textarea>
                    <button type="submit" class="btn btn-primary btn-sm">Envoyer</button>
                </form>
            ` : `
                <p class="auth-prompt">
                    <a href="login.html">Connectez-vous</a> pour laisser un commentaire.
                </p>
            `}
        </div>
    `;

    // Load comments
    loadComments(articleId);

    // Attach comment form listener
    const commentForm = $('#comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitComment(articleId);
        });
    }
}

// Make handleVote global so it can be called from HTML onclick
window.handleVote = async function (articleId, type) {
    if (!currentUser) {
        alert('Connectez-vous pour voter.');
        return;
    }

    const voteKey = `vote_${articleId}_${currentUser.uid}`;
    const currentVote = localStorage.getItem(voteKey);

    if (currentVote === type) {
        alert('Vous avez déjà voté.');
        return;
    }

    const articleRef = ref(db, `articles/${articleId}`);
    const snapshot = await get(articleRef);
    if (!snapshot.exists()) return;

    const article = snapshot.val();
    const updates = {};

    if (type === 'like') {
        updates.likes = (article.likes || 0) + 1;
        if (currentVote === 'dislike') updates.dislikes = Math.max(0, (article.dislikes || 0) - 1);
    } else {
        updates.dislikes = (article.dislikes || 0) + 1;
        if (currentVote === 'like') updates.likes = Math.max(0, (article.likes || 0) - 1);
    }

    await update(articleRef, updates);
    localStorage.setItem(voteKey, type);
};

async function loadComments(articleId) {
    const commentsRef = ref(db, `articles/${articleId}/comments`);
    onValue(commentsRef, (snapshot) => {
        const list = $('#comments-list');
        if (!list) return;

        if (!snapshot.exists()) {
            list.innerHTML = '<p class="no-comments">Aucun commentaire pour le moment.</p>';
            return;
        }

        const comments = snapshot.val();
        list.innerHTML = Object.values(comments).sort((a, b) => b.timestamp - a.timestamp).map(c => `
            <div class="comment">
                <div class="comment-header">
                    <strong>${c.authorName}</strong>
                    <span>${formatDate(c.timestamp)}</span>
                </div>
                <div class="comment-body">${c.text}</div>
            </div>
        `).join('');
    });
}

async function submitComment(articleId) {
    const text = $('#comment-text').value.trim();
    if (!text) return;

    const userRef = ref(db, `users/${currentUser.uid}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.exists() ? userSnapshot.val() : {};
    const authorName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Anonyme';

    const comment = {
        text,
        authorId: currentUser.uid,
        authorName,
        timestamp: Date.now()
    };

    const commentsRef = ref(db, `articles/${articleId}/comments`);
    await push(commentsRef, comment);
    $('#comment-text').value = '';
}

// --- Common ---

function initMobileMenu() {
    const toggle = $('#mobile-menu-toggle');
    const nav = $('#main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('active'));
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !nav.contains(e.target)) {
                nav.classList.remove('active');
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        // Re-render if on article page to update auth-dependent UI
        if (window.location.pathname.includes('article.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const articleId = urlParams.get('id');
            if (articleId) {
                // Trigger re-render logic if needed, or just let the onValue listener handle it
                // Ideally we should refresh the view to show comment form
                const articleRef = ref(db, `articles/${articleId}`);
                get(articleRef).then(snap => {
                    if (snap.exists()) renderFullArticle(articleId, snap.val());
                });
            }
        }
    });

    initMobileMenu();

    const path = window.location.pathname;
    if (path.includes('write-article.html')) {
        initWriteArticle();
    } else if (path.includes('article.html')) {
        initArticleDetail();
    } else if (path.includes('blog.html') || path.endsWith('/')) { // Default to blog list
        loadArticles();
        initFilters();
        initSearch();

        // Redirect "Write Article" button if it exists (it's a link now, but just in case)
        const btn = $('#new-article-btn');
        if (btn && btn.tagName === 'BUTTON') {
            btn.addEventListener('click', () => window.location.href = 'write-article.html');
        }
    }
});
