// Blog page functionality
import { app, db, ref, get, set, push } from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

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

// Load all articles
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

// Display articles
function displayArticles(articles) {
    const container = $('#blog-articles');
    if (!container) return;

    if (articles.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun article pour le moment. Soyez le premier à partager !</p>';
        return;
    }

    container.innerHTML = articles.map(article => `
        <div class="blog-card" data-id="${article.id}">
            <div class="blog-card-header">
                <span class="blog-card-category">${article.category || 'Autre'}</span>
                <h3>${article.title}</h3>
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

    // Add click handlers
    $$('.blog-card').forEach(card => {
        card.addEventListener('click', () => {
            const articleId = card.dataset.id;
            const article = articles.find(a => a.id === articleId);
            if (article) showArticleDetail(article);
        });
    });
}

// Filter articles by category
function filterArticles(category) {
    currentCategory = category;

    if (category === 'all') {
        displayArticles(allArticles);
    } else {
        const filtered = allArticles.filter(article => article.category === category);
        displayArticles(filtered);
    }
}

// Search articles
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

// Show article detail modal
function showArticleDetail(article) {
    const modal = $('#article-detail-modal');
    const content = $('#article-detail-content');

    if (!modal || !content) return;

    content.innerHTML = `
        <div class="article-detail-header">
            <span class="article-detail-category">${article.category || 'Autre'}</span>
            <h2>${article.title}</h2>
            <div class="article-detail-meta">
                <div>
                    <i class="fas fa-user"></i>
                    <span>${article.authorName || 'Anonyme'}</span>
                </div>
                <div>
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(article.timestamp)}</span>
                </div>
            </div>
        </div>
        <div class="article-detail-content">${article.content}</div>
        ${article.tags ? `
            <div class="article-detail-tags">
                ${article.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
            </div>
        ` : ''}
    `;

    modal.classList.remove('hidden');
}

// Initialize category filters
function initFilters() {
    const filterBtns = $$('.tag-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter articles
            filterArticles(category);
        });
    });
}

// Initialize search
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

// Initialize new article modal
function initNewArticleModal() {
    const newArticleBtn = $('#new-article-btn');
    const modal = $('#new-article-modal');
    const closeBtn = $('#close-article-modal');
    const cancelBtn = $('#cancel-article');
    const form = $('#new-article-form');
    const detailModal = $('#article-detail-modal');
    const closeDetailBtn = $('#close-detail-modal');

    if (!newArticleBtn || !modal) return;

    newArticleBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert('Vous devez être connecté pour écrire un article.');
            window.location.href = 'login.html';
            return;
        }
        modal.classList.remove('hidden');
    });

    closeBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    cancelBtn?.addEventListener('click', () => modal.classList.add('hidden'));
    closeDetailBtn?.addEventListener('click', () => detailModal?.classList.add('hidden'));

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) {
            alert('Vous devez être connecté pour publier un article.');
            return;
        }

        const messageEl = $('#article-message');

        try {
            showSpinner();

            // Get user data for author name
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
                authorId: currentUser.uid,
                authorName: authorName,
                authorEmail: currentUser.email,
                timestamp: Date.now()
            };

            const articlesRef = ref(db, 'articles');
            await push(articlesRef, articleData);

            if (messageEl) {
                messageEl.style.color = 'green';
                messageEl.textContent = 'Article publié avec succès !';
            }

            form.reset();

            setTimeout(() => {
                modal.classList.add('hidden');
                if (messageEl) messageEl.textContent = '';
                loadArticles(); // Reload articles
            }, 1500);
        } catch (error) {
            console.error('Error publishing article:', error);
            if (messageEl) {
                messageEl.style.color = 'red';
                messageEl.textContent = 'Erreur lors de la publication.';
            }
        } finally {
            hideSpinner();
        }
    });
}

// Initialize mobile menu
function initMobileMenu() {
    const toggle = $('#mobile-menu-toggle');
    const nav = $('#main-nav');

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    loadArticles();
    initFilters();
    initSearch();
    initNewArticleModal();
    initMobileMenu();
});
