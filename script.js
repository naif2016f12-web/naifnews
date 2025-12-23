const defaultArticles = [
    {
        id: 1,
        title: 'قمة دولية لمناقشة التحديات البيئية',
        category: 'سياسة',
        excerpt: 'قادة العالم يجتمعون اليوم لوضع خارطة طريق جديدة للحد من الانبعاثات الكربونية.',
        author: 'أحمد محمد',
        date: 'منذ ساعتين',
        image: 'assets/news_city.jpg',
        categoryClass: 'tag-politics'
    },
    {
        id: 2,
        title: 'تلسكوب جيمس ويب يلتقط صوراً مذهلة للمجرات البعيدة',
        category: 'علوم',
        excerpt: 'صور جديدة تكشف تفاصيل لم يسبق لها مثيل عن بدايات الكون ونشأة النجوم.',
        author: 'سارة علي',
        date: 'منذ 4 ساعات',
        image: 'assets/news_space.jpg',
        categoryClass: 'tag-science'
    },
    {
        id: 3,
        title: 'ثورة السيارات الكهربائية: بطاريات تشحن في 5 دقائق',
        category: 'سيارات',
        excerpt: 'تقنية جديدة قد تقلب موازين صناعة السيارات الكهربائية وتنهي قلق المسافات.',
        author: 'خالد عمر',
        date: 'منذ 6 ساعات',
        image: 'assets/news_car.jpg',
        categoryClass: 'tag-auto'
    }
];

// Initialize Articles in LocalStorage if empty
if (!localStorage.getItem('naifnews_articles')) {
    localStorage.setItem('naifnews_articles', JSON.stringify(defaultArticles));
}

document.addEventListener('DOMContentLoaded', () => {

    // --- Apply saved design from admin (if any) ---
    try {
        const rawDesign = localStorage.getItem('naifnews_design');
        if (rawDesign) {
            const design = JSON.parse(rawDesign);
            const root = document.documentElement;
            if (design.primary) root.style.setProperty('--primary-color', design.primary);
            if (design.headerBg) root.style.setProperty('--header-bg', design.headerBg);
            if (design.cardBg) root.style.setProperty('--card-bg', design.cardBg);
            if (design.font) {
                root.style.setProperty('--font-body', design.font);
                root.style.setProperty('--font-heading', design.font);
                document.body.style.fontFamily = design.font;
            }
            if (design.cardRadius) {
                // optional: you can use this variable in CSS to control radius
                root.style.setProperty('--card-radius', design.cardRadius + 'px');
                // apply to some elements as a pragmatic approach:
                document.querySelectorAll('.news-card, .sub-card, .card').forEach(el => {
                    el.style.borderRadius = design.cardRadius + 'px';
                });
            }
            if (design.darkMode) document.body.setAttribute('data-theme', 'dark'); else document.body.removeAttribute('data-theme');
        }
    } catch (e) {
        console.warn('Failed to apply saved design', e);
    }

    // --- Render Articles (From Server API) ---
    const newsGrid = document.getElementById('latest-news-grid');
    const API_URL = '/api/articles'; // Relative path for deployed apps

    async function loadArticles() {
        if (!newsGrid) return;

        try {
            // 1. Try fetching from Server
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('API offline');
            const articles = await response.json();

            renderArticles(articles);
        } catch (e) {
            console.warn('Backend unavailable, falling back to LocalStorage demo data', e);
            // 2. Fallback to LocalStorage (for offline demos)
            const localArticles = JSON.parse(localStorage.getItem('naifnews_articles')) || [];
            renderArticles(localArticles);
        }
    }

    function renderArticles(articles) {
        if (!newsGrid) return;
        newsGrid.innerHTML = '';

        if (articles.length === 0) {
            newsGrid.innerHTML = '<p style="text-align:center; padding:20px;">لا توجد مقالات منشورة حالياً.</p>';
            return;
        }

        // Sort: Newest first (assuming ID or Date)
        articles.slice().reverse().forEach(article => {
            // Handle image paths: if it's base64, use it. If relative, ensure it works.
            const imgSrc = article.image || 'assets/hero_tech.jpg';

            const articleHTML = `
                <article class="news-card">
                    <div class="card-image">
                        <img src="${imgSrc}" alt="${article.title}" loading="lazy">
                    </div>
                    <div class="card-content">
                        <span class="category ${article.categoryClass || 'tag-general'}">${article.category}</span>
                        <h3>${article.title}</h3>
                        <p>${article.excerpt}</p>
                        <div class="card-footer">
                            <span class="author">${article.author || 'نايف نيوز'}</span>
                            <time>${article.date ? new Date(article.date).toLocaleDateString('ar-EG') : 'الآن'}</time>
                        </div>
                        <button class="comment-btn-front" onclick="addCommentPrompt(${article.id}, '${article.title}')" style="margin-top:10px; width:100%; padding:8px; border:1px solid #ddd; background:#fff; cursor:pointer; border-radius:6px; font-family:inherit;">💬 إضافة تعليق</button>
                    </div>
                </article>
            `;
            newsGrid.innerHTML += articleHTML;
        });
    }

    // Initialize
    loadArticles();

    // --- Ticker Live Update ---
    const tickerEl = document.querySelector('.ticker-content p');
    function updateTicker() {
        const savedTicker = localStorage.getItem('naifnews_ticker');
        if (savedTicker && tickerEl) {
            tickerEl.textContent = savedTicker;
        }
    }
    updateTicker(); // Run on load

    // Global function for adding comments (called by onclick in HTML)
    window.addCommentPrompt = function (articleId, articleTitle) {
        const name = prompt('أدخل اسمك:');
        if (!name) return;
        const text = prompt('اكتب تعليقك:');
        if (!text) return;

        const newComment = {
            id: Date.now(),
            articleId: articleId,
            articleTitle: articleTitle, // Storing title for easier admin view
            author: name,
            text: text,
            status: 'pending', // Needs admin approval
            date: new Date().toJSON()
        };

        const comments = JSON.parse(localStorage.getItem('naifnews_comments')) || [];
        comments.push(newComment);
        localStorage.setItem('naifnews_comments', JSON.stringify(comments));

        alert('شكراً لك! تعليقك بانتظار موافقة المشرف.');
    };

    // Mobile Menu functionality (robust checks + aria + keyboard)
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const body = document.body;

    function openMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            mobileMenuBtn.focus();
        }
        body.style.overflow = 'hidden';
        // focus first link for keyboard users
        const firstLink = mobileMenu.querySelector('a');
        if (firstLink) firstLink.focus();
    }

    function closeMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
        body.style.overflow = 'auto';
        // return focus to toggle button
        if (mobileMenuBtn) mobileMenuBtn.focus();
    }

    function toggleMenu() {
        if (!mobileMenu) return;
        if (mobileMenu.classList.contains('active')) closeMenu(); else openMenu();
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute('aria-controls', mobileMenu ? mobileMenu.id : '');
        mobileMenuBtn.setAttribute('aria-expanded', mobileMenu && mobileMenu.classList.contains('active') ? 'true' : 'false');
        mobileMenuBtn.addEventListener('click', toggleMenu);
    }
    if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);

    if (mobileMenu) {
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu.classList.contains('active')) closeMenu();
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                if (mobileMenu.classList.contains('active')) {
                    closeMenu();
                }
            }
        });
    }

    // Dark Mode Toggle (guard)
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');
    if (themeToggle) {
        if (currentTheme == 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        } else if (currentTheme == 'light') {
            document.body.setAttribute('data-theme', 'light');
            themeToggle.textContent = '🌙';
        }

        themeToggle.addEventListener('click', function () {
            let theme = 'light';
            if (document.body.getAttribute('data-theme') !== 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.textContent = '☀️';
                theme = 'dark';
            } else {
                document.body.removeAttribute('data-theme');
                themeToggle.textContent = '🌙';
            }
            localStorage.setItem('theme', theme);
        });
    }

    // Search Interaction (guard)
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchTerm = prompt('عن ماذا تبحث؟');
            if (searchTerm) {
                alert('جاري البحث عن: ' + searchTerm);
            }
        });
    }

    // --- BroadcastChannel listener to update content live ---
    const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('naifnews_channel') : null;
    if (bc) {
        bc.onmessage = (ev) => {
            const msg = ev.data;
            if (!msg || !msg.type) return;
            if (msg.type === 'design_update' && msg.design) {
                try {
                    const d = msg.design;
                    const root = document.documentElement;
                    if (d.primary) root.style.setProperty('--primary-color', d.primary);
                    if (d.headerBg) root.style.setProperty('--header-bg', d.headerBg);
                    if (d.cardBg) root.style.setProperty('--card-bg', d.cardBg);
                    if (d.font) {
                        root.style.setProperty('--font-body', d.font);
                        root.style.setProperty('--font-heading', d.font);
                        document.body.style.fontFamily = d.font;
                    }
                    if (d.cardRadius) {
                        root.style.setProperty('--card-radius', d.cardRadius + 'px');
                        document.querySelectorAll('.news-card, .sub-card, .card').forEach(el => {
                            el.style.borderRadius = d.cardRadius + 'px';
                        });
                    }
                    if (d.darkMode) document.body.setAttribute('data-theme', 'dark'); else document.body.removeAttribute('data-theme');
                } catch (err) { console.warn('apply design msg failed', err); }
            }
            if (msg.type === 'articles_update') {
                // re-render latest news grid from localStorage
                // We reload the page or re-run the render logic. 
                // Since render is not function-wrapped cleanly, reloading is safest or we duplicate logic. 
                // Let's just reload strictly the grid if possible, or reload page.
                // For a smooth demo, let's reload the page to fetch fresh localstorage? 
                // Or better, let's just re-run the logic if we wrap it. 
                // Since I cannot easily wrap the previous logic without big edit, let's just reload for now.
                location.reload();
            }
            if (msg.type === 'ticker_update' && msg.text) {
                const ticker = document.querySelector('.ticker-content p');
                if (ticker) ticker.textContent = msg.text;
            }
        };
    }

});
