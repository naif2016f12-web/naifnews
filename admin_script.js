document.addEventListener('DOMContentLoaded', () => {

    // --- Authentication Check ---
    const currentUser = JSON.parse(localStorage.getItem('naifnews_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Update Sidebar Profile
    const profileName = document.querySelector('.admin-info h4');
    const profileRole = document.querySelector('.admin-info small');
    const profileImg = document.querySelector('.admin-profile img');

    if (profileName) profileName.textContent = currentUser.name;
    if (profileRole) profileRole.textContent = currentUser.role;
    // We could also dynamically change the avatar if users had one, for now default.

    // Handle Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('naifnews_current_user');
            window.location.href = 'login.html';
        });
    }

    // --- Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.dashboard-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            sections.forEach(section => {
                section.style.display = 'none';
                if (section.id === `section-${targetId}`) {
                    section.style.display = 'block';
                    section.style.opacity = 0;
                    setTimeout(() => section.style.opacity = 1, 50);
                }
            });
            if (window.innerWidth <= 768) {
                const sidebarEl = document.querySelector('.sidebar');
                if (sidebarEl) sidebarEl.classList.remove('active');
            }
        });
    });

    // --- Sidebar Toggle ---
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
    }
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (sidebar && toggleSidebarBtn && !sidebar.contains(e.target) && !toggleSidebarBtn.contains(e.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // --- Dark Mode --- (guard)
    const themeToggle = document.getElementById('admin-theme-toggle');
    const savedTheme = localStorage.getItem('admin_theme');
    function applyTheme(isDark) {
        if (isDark) {
            document.body.setAttribute('data-theme', 'dark');
            if (themeToggle) themeToggle.textContent = '☀️';
        } else {
            document.body.removeAttribute('data-theme');
            if (themeToggle) themeToggle.textContent = '🌙';
        }
    }
    if (savedTheme === 'dark') applyTheme(true);
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.hasAttribute('data-theme');
            if (isDark) {
                applyTheme(false);
                localStorage.setItem('admin_theme', 'light');
            } else {
                applyTheme(true);
                localStorage.setItem('admin_theme', 'dark');
            }
            if (typeof drawChart === 'function') drawChart();
        });
    }

    // --- Chart --- (safe drawChart binding)
    const canvas = document.getElementById('visitorsChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        window.drawChart = function () {
            const rect = canvas.parentNode.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 300;
            const isDark = document.body.hasAttribute('data-theme');
            const dataPoints = [30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, 90];
            const dataPoints2 = [20, 30, 25, 40, 30, 50, 40, 60, 50, 70, 60, 80];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const padding = 40;
            const w = canvas.width - padding * 2;
            const h = canvas.height - padding * 2;
            const maxVal = 100;
            const stepX = w / (dataPoints.length - 1);
            ctx.beginPath();
            ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 5; i++) {
                const y = padding + h - (i * (h / 5));
                ctx.moveTo(padding, y);
                ctx.lineTo(padding + w, y);
                ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
                ctx.fillText(i * 20, 10, y + 5);
            }
            ctx.stroke();
            function drawLine(data, color) {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                data.forEach((val, i) => {
                    const x = padding + (i * stepX);
                    const y = padding + h - ((val / maxVal) * h);
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                });
                ctx.stroke();
                ctx.fillStyle = document.body.style.backgroundColor || (isDark ? '#1e293b' : '#fff');
                data.forEach((val, i) => {
                    const x = padding + (i * stepX);
                    const y = padding + h - ((val / maxVal) * h);
                    ctx.beginPath();
                    ctx.arc(x, y, 6, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = isDark ? '#1f2937' : '#fff';
                    ctx.fill();
                });
            }
            drawLine(dataPoints, '#3b82f6');
            drawLine(dataPoints2, '#10b981');
        }
        // ensure we call the window-bound function
        setTimeout(() => { if (typeof window.drawChart === 'function') window.drawChart(); }, 100);
        window.addEventListener('resize', () => { if (typeof window.drawChart === 'function') window.drawChart(); });
    }

    // --- Helper: file -> dataURL (required by saveArticleFromForm) ---
    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    // --- REAL Article Management Logic (NEW) ---

    // --- REAL Article Management Logic (API Connected) ---

    const API_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('naifnews_token');

    // Helper: Headers with Auth
    function getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // 1. Load Articles from Server
    async function renderArticlesTable(filter = '') {
        const tableBody = document.getElementById('articles-table-body');
        if (!tableBody) return;

        try {
            const response = await fetch(`${API_URL}/articles`);
            if (!response.ok) throw new Error('Failed to fetch');
            const articles = await response.json();

            tableBody.innerHTML = ''; // Clear current
            const normalizedFilter = (filter || '').trim().toLowerCase();

            // Render articles (reverse to show newest first)
            articles.slice().reverse().forEach(article => {
                // apply search filter
                const combined = `${article.title} ${article.author || ''} ${article.category || ''}`.toLowerCase();
                if (normalizedFilter && !combined.includes(normalizedFilter)) return;

                const statusClass = (article.status === 'draft') ? 'draft' : 'published';
                const statusText = (article.status === 'draft') ? 'مسودة' : 'منشور';

                // Truncate Date
                const dateDisplay = article.date ? new Date(article.date).toLocaleDateString() : 'N/A';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${article.title}</td>
                    <td>${article.author || 'المدير'}</td>
                    <td>${dateDisplay}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="action-btn delete-btn" data-id="${article.id}" title="حذف">🗑️</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Attach events
            tableBody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    if (confirm('هل أنت متأكد من حذف هذا المقال؟')) {
                        deleteArticle(id);
                    }
                });
            });

        } catch (e) {
            console.error(e);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">فشل في تحميل البيانات من الخادم</td></tr>';
        }
    }

    // --- Save Article to Server ---
    async function saveArticleFromForm(form) {
        const title = form.querySelector('input[name="title"]').value;
        const category = form.querySelector('select[name="category"]').value;
        const excerpt = form.querySelector('textarea[name="excerpt"]').value;
        const fileInput = form.querySelector('input[name="image"]');
        let imageData = null;
        if (fileInput && fileInput.files && fileInput.files[0]) {
            try { imageData = await fileToDataURL(fileInput.files[0]); } catch (e) { console.warn(e); }
        }

        const newArticle = {
            title, category, excerpt,
            image: imageData,
            author: 'المدير', // Should come from current user
        };

        try {
            const response = await fetch(`${API_URL}/articles`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newArticle)
            });

            if (response.ok) {
                alert('تم نشر المقال بنجاح!');
                renderArticlesTable();
            } else {
                alert('حدث خطأ أثناء النشر');
            }
        } catch (e) {
            console.error(e);
            alert('خطأ في الاتصال بالخادم');
        }
    }

    // --- Delete Article from Server ---
    async function deleteArticle(id) {
        try {
            const response = await fetch(`${API_URL}/articles/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (response.ok) {
                renderArticlesTable();
            }
        } catch (e) {
            console.error(e);
            alert('خطأ في الحذف');
        }
    }

    // Need to handle missing modal logic references for opening/closing since we replaced the block
    // The previous implementation had modal open logic here. We need to ensure we don't break listeners.
    // Re-adding the binding logic for form submit:
    const postForm = document.getElementById('new-post-form');
    // ... logic below this block remains ...

    // --- Bind form submit (new/edit) ---
    const postForm = document.getElementById('new-post-form');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveArticleFromForm(postForm);
            // reset modal
            postForm.reset();
            const preview = document.getElementById('article-image-preview');
            if (preview) { preview.src = ''; preview.style.display = 'none'; }
            const idEl = document.getElementById('article-id');
            if (idEl) idEl.value = '';
            const titleEl = document.getElementById('new-post-title');
            if (titleEl) titleEl.textContent = 'إضافة مقال جديد';
            const modalEl = document.getElementById('new-post-modal');
            if (modalEl) modalEl.classList.remove('active');
        });

        // preview image when chosen
        const fileInput = postForm.querySelector('input[name="image"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const preview = document.getElementById('article-image-preview');
                if (file && preview) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        preview.src = reader.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else if (preview) {
                    preview.src = '';
                    preview.style.display = 'none';
                }
            });
        }
    }

    // --- Real-time channel for sync (admin <-> public) ---
    const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('naifnews_channel') : null;
    function broadcast(msg) {
        try { if (bc) bc.postMessage(msg); } catch (e) { console.warn('Broadcast failed', e); }
    }

    // --- Design saving also broadcasts immediately ---
    // Hook into existing design save/apply buttons if present (these IDs were added earlier)
    const btnSaveDesign = document.getElementById('design-save');
    const btnApplyDesign = document.getElementById('design-apply');

    if (btnSaveDesign) {
        btnSaveDesign.addEventListener('click', () => {
            // use existing buildDesignFromControls() if present
            if (typeof buildDesignFromControls === 'function') {
                const design = buildDesignFromControls();
                saveDesign(design);
                broadcast({ type: 'design_update', design });
                alert('تم حفظ إعدادات التصميم ومزامنتها مع الموقع.');
            }
        });
    }

    if (btnApplyDesign) {
        btnApplyDesign.addEventListener('click', () => {
            if (typeof buildDesignFromControls === 'function') {
                const design = buildDesignFromControls();
                applyDesignToDocument(design, document);
                broadcast({ type: 'design_update', design });
                alert('تم تطبيق التعديلات مؤقتاً ومزامنتها.');
            }
        });
    }

    // --- Broadcast incoming messages (optional: admin listens too) ---
    if (bc) {
        bc.onmessage = (ev) => {
            const msg = ev.data;
            if (!msg || !msg.type) return;
            if (msg.type === 'articles_update') {
                renderArticlesTable(document.getElementById('dashboard-search') ? document.getElementById('dashboard-search').value : '');
                updateStats();
            }
            if (msg.type === 'design_update') {
                // apply design to admin preview
                if (msg.design) applyDesignToDocument(msg.design, document);
            }
        };
    }

    // --- User Management Logic (NEW) ---

    // 1. Seed Default Users
    if (!localStorage.getItem('naifnews_users')) {
        const defaultUsers = [
            { id: 1, name: 'نايف المنصوري', email: 'naif@news.com', role: 'مدير', date: '2025-01-01' },
            { id: 2, name: 'سارة أحمد', email: 'sara@news.com', role: 'محرر', date: '2025-02-15' }
        ];
        localStorage.setItem('naifnews_users', JSON.stringify(defaultUsers));
    }

    // 2. Render Users Table
    function renderUsersTable() {
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;

        const users = JSON.parse(localStorage.getItem('naifnews_users')) || [];
        tbody.innerHTML = '';

        users.forEach(user => {
            let roleClass = 'draft';
            if (user.role === 'مدير') roleClass = 'published';
            if (user.role === 'مشرف') roleClass = 'pending';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td><span class="status ${roleClass}">${user.role}</span></td>
                <td>${user.date}</td>
                <td>
                    <button class="action-btn delete-user-btn" data-id="${user.id}" title="حذف">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Attach Delete Events
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
                    deleteUser(id);
                }
            });
        });
    }

    // 3. Add User
    function addUser(name, email, role) {
        let users = JSON.parse(localStorage.getItem('naifnews_users')) || [];
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            role: role,
            date: new Date().toLocaleDateString('en-GB') // DD/MM/YYYY format approx
        };
        users.push(newUser);
        localStorage.setItem('naifnews_users', JSON.stringify(users));
        renderUsersTable();
        alert('تم إضافة العضو بنجاح!');
    }

    // 4. Delete User
    function deleteUser(id) {
        let users = JSON.parse(localStorage.getItem('naifnews_users')) || [];
        users = users.filter(u => u.id != id);
        localStorage.setItem('naifnews_users', JSON.stringify(users));
        renderUsersTable();
    }

    // --- User Modal Logic ---
    const userModal = document.getElementById('new-user-modal');
    const openUserBtn = document.getElementById('open-new-user-btn');
    // Re-select close buttons to include new ones if needed, or query specifically inside userModal
    // For simplicity, we'll assign events specifically here to avoid conflicts or missed elements

    if (userModal) {
        if (openUserBtn) {
            openUserBtn.addEventListener('click', () => userModal.classList.add('active'));
        }

        // Close buttons inside this modal
        const userCloseBtns = userModal.querySelectorAll('.close-modal, .close-modal-btn');
        userCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => userModal.classList.remove('active'));
        });

        userModal.addEventListener('click', (e) => {
            if (e.target === userModal) userModal.classList.remove('active');
        });

        const userForm = document.getElementById('new-user-form');
        if (userForm) {
            userForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = userForm.querySelector('input[type="text"]').value;
                const email = userForm.querySelector('input[type="email"]').value;
                const role = userForm.querySelector('select').value;

                addUser(name, email, role);

                userModal.classList.remove('active');
                userForm.reset();
            });
        }
    }

    // Initial Render of Users
    renderUsersTable();


    // --- Design Settings (save / apply / reset) ---
    const DESIGN_KEY = 'naifnews_design';

    function getDefaultDesign() {
        return {
            primary: '#2563eb',
            headerBg: '#ffffff',
            cardBg: '#ffffff',
            font: 'Tajawal, sans-serif',
            cardRadius: '12',
            darkMode: false
        };
    }

    function loadDesign() {
        const raw = localStorage.getItem(DESIGN_KEY);
        if (!raw) return getDefaultDesign();
        try { return Object.assign(getDefaultDesign(), JSON.parse(raw)); } catch (e) { return getDefaultDesign(); }
    }

    function applyDesignToDocument(design, targetDoc = document) {
        if (!design) design = getDefaultDesign();
        const root = targetDoc.documentElement;
        root.style.setProperty('--primary-color', design.primary);
        root.style.setProperty('--header-bg', design.headerBg);
        root.style.setProperty('--card-bg', design.cardBg);
        root.style.setProperty('--font-body', design.font);
        root.style.setProperty('--font-heading', design.font);
        root.style.setProperty('--card-radius', design.cardRadius + 'px'); // optional usage in CSS
        if (design.darkMode) targetDoc.setAttribute('data-theme', 'dark'); else targetDoc.removeAttribute('data-theme');
    }

    function saveDesign(design) {
        localStorage.setItem(DESIGN_KEY, JSON.stringify(design));
    }

    // Initialize controls
    const ctrlPrimary = document.getElementById('design-primary');
    const ctrlHeaderBg = document.getElementById('design-headerbg');
    const ctrlCardBg = document.getElementById('design-cardbg');
    const ctrlFont = document.getElementById('design-font');
    const ctrlRadius = document.getElementById('design-cardradius');
    const ctrlRadiusVal = document.getElementById('design-cardradius-value');
    const ctrlDark = document.getElementById('design-darkmode');
    const btnApply = document.getElementById('design-apply');
    const btnSave = document.getElementById('design-save');
    const btnReset = document.getElementById('design-reset');

    const currentDesign = loadDesign();

    // populate UI
    if (ctrlPrimary) ctrlPrimary.value = currentDesign.primary;
    if (ctrlHeaderBg) ctrlHeaderBg.value = currentDesign.headerBg;
    if (ctrlCardBg) ctrlCardBg.value = currentDesign.cardBg;
    if (ctrlFont) ctrlFont.value = currentDesign.font;
    if (ctrlRadius) { ctrlRadius.value = currentDesign.cardRadius; if (ctrlRadiusVal) ctrlRadiusVal.textContent = currentDesign.cardRadius; }
    if (ctrlDark) ctrlDark.checked = !!currentDesign.darkMode;

    // apply to admin page immediately
    applyDesignToDocument(currentDesign, document);

    // live update helpers
    function buildDesignFromControls() {
        return {
            primary: ctrlPrimary ? ctrlPrimary.value : currentDesign.primary,
            headerBg: ctrlHeaderBg ? ctrlHeaderBg.value : currentDesign.headerBg,
            cardBg: ctrlCardBg ? ctrlCardBg.value : currentDesign.cardBg,
            font: ctrlFont ? ctrlFont.value : currentDesign.font,
            cardRadius: ctrlRadius ? String(ctrlRadius.value) : currentDesign.cardRadius,
            darkMode: ctrlDark ? !!ctrlDark.checked : !!currentDesign.darkMode
        };
    }

    // update radius display
    if (ctrlRadius) {
        ctrlRadius.addEventListener('input', () => {
            if (ctrlRadiusVal) ctrlRadiusVal.textContent = ctrlRadius.value;
        });
    }

    // control change => apply temporary
    [ctrlPrimary, ctrlHeaderBg, ctrlCardBg, ctrlFont, ctrlRadius, ctrlDark].forEach(ctrl => {
        if (!ctrl) return;
        ctrl.addEventListener('input', () => {
            const tmp = buildDesignFromControls();
            applyDesignToDocument(tmp, document);
        });
        ctrl.addEventListener('change', () => {
            const tmp = buildDesignFromControls();
            applyDesignToDocument(tmp, document);
        });
    });

    // Apply (temporary) - already handled by input listeners but keep explicit
    if (btnApply) btnApply.addEventListener('click', () => {
        const tmp = buildDesignFromControls();
        applyDesignToDocument(tmp, document);
        alert('تم تطبيق التعديلات مؤقتاً على لوحة التحكم.');
    });

    // Save => persist to localStorage (index.html will read on load)
    if (btnSave) btnSave.addEventListener('click', () => {
        const newDesign = buildDesignFromControls();
        saveDesign(newDesign);
        alert('تم حفظ إعدادات التصميم. ستُطبّق على الموقع عند تحميل الصفحة الرئيسية.');
    });

    // Reset to defaults
    if (btnReset) btnReset.addEventListener('click', () => {
        const def = getDefaultDesign();
        if (ctrlPrimary) ctrlPrimary.value = def.primary;
        if (ctrlHeaderBg) ctrlHeaderBg.value = def.headerBg;
        if (ctrlCardBg) ctrlCardBg.value = def.cardBg;
        if (ctrlFont) ctrlFont.value = def.font;
        if (ctrlRadius) { ctrlRadius.value = def.cardRadius; if (ctrlRadiusVal) ctrlRadiusVal.textContent = def.cardRadius; }
        if (ctrlDark) ctrlDark.checked = def.darkMode;
        applyDesignToDocument(def, document);
        saveDesign(def);
        alert('تم إعادة تعيين التصميم وحفظ القيم الافتراضية.');
    });

    // --- Comments Management Logic (NEW) ---
    function renderCommentsTable() {
        const tbody = document.getElementById('comments-table-body');
        const countBadge = document.getElementById('pending-comments-count');
        if (!tbody) return;

        const comments = JSON.parse(localStorage.getItem('naifnews_comments')) || [];
        tbody.innerHTML = '';

        // Filter/Sort: Pending first
        comments.sort((a, b) => (a.status === 'pending' ? -1 : 1));

        let pendingCount = 0;

        comments.forEach(comment => {
            if (comment.status === 'pending') pendingCount++;

            const tr = document.createElement('tr');
            const statusStyle = comment.status === 'approved' ? 'background:#d1fae5; color:#065f46;' : 'background:#fee2e2; color:#991b1b;';
            const statusText = comment.status === 'approved' ? 'مقبول' : 'بانتظار الموافقة';

            tr.innerHTML = `
                <td><strong>${comment.author}</strong></td>
                <td>${comment.text}</td>
                <td><small>${comment.articleTitle || 'مقال عام'}</small></td>
                <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; ${statusStyle}">${statusText}</span></td>
                <td>
                    ${comment.status === 'pending' ? `<button class="action-btn approve-btn" data-id="${comment.id}" title="موافقة">✅</button>` : ''}
                    <button class="action-btn delete-comment-btn" data-id="${comment.id}" title="حذف">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (countBadge) countBadge.textContent = `${pendingCount} جديد`;

        // Attach events
        tbody.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                approveComment(id);
            });
        });
        tbody.querySelectorAll('.delete-comment-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                deleteComment(id);
            });
        });
    }

    function approveComment(id) {
        let comments = JSON.parse(localStorage.getItem('naifnews_comments')) || [];
        const comment = comments.find(c => c.id == id);
        if (comment) {
            comment.status = 'approved';
            localStorage.setItem('naifnews_comments', JSON.stringify(comments));
            renderCommentsTable();
            broadcast({ type: 'comments_update' }); // Notify frontend if needed
            alert('تمت الموافقة على التعليق!');
        }
    }

    function deleteComment(id) {
        if (!confirm('حذف التعليق نهائياً؟')) return;
        let comments = JSON.parse(localStorage.getItem('naifnews_comments')) || [];
        comments = comments.filter(c => c.id != id);
        localStorage.setItem('naifnews_comments', JSON.stringify(comments));
        renderCommentsTable();
    }

    // Initial Render of Comments
    renderCommentsTable();


    // --- Settings: Breaking News Logic ---
    const tickerInput = document.getElementById('settings-ticker-text');
    if (tickerInput) {
        // Load saved ticker
        const savedTicker = localStorage.getItem('naifnews_ticker');
        if (savedTicker) tickerInput.value = savedTicker;

        // Save on change (using existing Design buttons or auto-save?)
        // Let's hook into the existing "Design Save" button for simplicity or add auto-save logic
        // We'll treat it as part of the "Save Changes" at the bottom of settings
    }

    // Hook into the main save buttons to also save ticker
    // Finding the buttons again to ensure we attach logic
    const generalSaveBtn = document.querySelectorAll('#section-settings .btn-primary'); // Generic selector
    generalSaveBtn.forEach(btn => {
        btn.addEventListener('click', () => {
            // Save Ticker
            if (tickerInput) {
                localStorage.setItem('naifnews_ticker', tickerInput.value);
                broadcast({ type: 'ticker_update', text: tickerInput.value });
            }
        });
    });

    // --- Deep Audit Tools ---
    const runAuditBtn = document.getElementById('run-audit-btn');
    const auditPanel = document.getElementById('audit-panel');
    const auditResultsEl = document.getElementById('audit-results');
    const auditExportBtn = document.getElementById('audit-export-btn');
    const auditClearBtn = document.getElementById('audit-clear-btn');

    function shortList(items, max = 10) {
        if (!items || items.length === 0) return '(لا توجد)';
        return items.slice(0, max).map(i => `<li>${i}</li>`).join('') + (items.length > max ? `<li>...و ${items.length - max} أكثر</li>` : '');
    }

    async function fetchText(path) {
        try {
            const res = await fetch(path, { cache: "no-store" });
            if (!res.ok) return { ok: false, status: res.status };
            const text = await res.text();
            return { ok: true, text, size: text.length, status: res.status };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    function assessLocalStorage() {
        const keys = Object.keys(localStorage);
        let total = 0;
        const details = keys.map(k => {
            const v = localStorage.getItem(k) || '';
            const len = v.length;
            total += len;
            return { key: k, length: len };
        });
        return { count: keys.length, totalBytes: total, details };
    }

    function analyzeDocumentHTML(htmlText, baseUrl = '/') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText || '', 'text/html');
        const issues = { errors: [], warnings: [], ok: [] };

        // basic meta checks
        const htmlEl = doc.documentElement;
        if (!htmlEl || !htmlEl.lang) issues.warnings.push('عنصر <html> لا يحتوي على attribute lang');
        else issues.ok.push(`لغة الصفحة: ${htmlEl.lang}`);

        if (!doc.querySelector('meta[charset]')) issues.warnings.push('لا يوجد meta charset');
        else issues.ok.push('meta charset موجود');

        if (!doc.querySelector('meta[name="viewport"]')) issues.warnings.push('لا يوجد meta viewport (responsive)');
        if (!doc.querySelector('meta[name="description"]')) issues.warnings.push('لا يوجد meta description');

        if (!doc.title || !doc.title.trim()) issues.warnings.push('لا يوجد عنوان <title> واضح');

        // images alt
        const imgs = Array.from(doc.querySelectorAll('img'));
        const missingAlt = imgs.filter(i => !i.hasAttribute('alt') || i.getAttribute('alt').trim() === '');
        if (imgs.length === 0) issues.warnings.push('لا توجد صور في الصفحة (قد يكون هذا طبيعياً)');
        if (missingAlt.length > 0) issues.warnings.push(`وجد ${missingAlt.length} صورة بدون alt (تحسين الوصول)`);

        // links suspicious
        const anchors = Array.from(doc.querySelectorAll('a'));
        const badLinks = anchors.filter(a => {
            const href = a.getAttribute('href');
            return !href || href.trim() === '' || href.trim() === '#' || href.trim().toLowerCase().startsWith('javascript:');
        });
        if (badLinks.length > 0) issues.warnings.push(`وجد ${badLinks.length} رابطاً بدون هدف واضح (href="#" أو javascript:)`);

        // inline scripts/styles
        const inlineScripts = doc.querySelectorAll('script:not([src])');
        if (inlineScripts.length > 5) issues.warnings.push(`عدد السكربتات المضمنة inline هو ${inlineScripts.length} — قد يؤثر على الأمن/الأداء`);

        // external resources using http
        const externalRes = Array.from(doc.querySelectorAll('link[href], script[src], img[src]'))
            .map(el => el.href || el.src)
            .filter(u => u && u.startsWith('http://'));
        if (externalRes.length > 0) issues.errors.push(`الموارد التالية تستخدم http (غير آمن): ${externalRes.slice(0, 5).join(', ')}${externalRes.length > 5 ? '...' : ''}`);

        return { issues, counts: { images: imgs.length, links: anchors.length, inlineScripts: inlineScripts.length } };
    }

    async function runDeepAudit() {
        if (!auditPanel || !auditResultsEl) return;
        auditPanel.style.display = 'block';
        auditResultsEl.innerHTML = '<div class="issue">جاري الفحص... يرجى الانتظار</div>';

        const results = { timestamp: new Date().toISOString(), resources: {}, analysis: {}, localStorage: {} };

        // fetch important files
        const paths = [
            { key: 'index', path: 'index.html' },
            { key: 'style', path: 'style.css' },
            { key: 'script', path: 'script.js' },
            { key: 'admin_style', path: 'admin_style.css' },
            { key: 'admin_script', path: 'admin_script.js' }
        ];

        for (const p of paths) {
            const r = await fetchText(p.path);
            results.resources[p.key] = r;
        }

        // analyze html
        if (results.resources.index && results.resources.index.ok) {
            const analysis = analyzeDocumentHTML(results.resources.index.text);
            results.analysis.index = analysis;
        } else {
            results.analysis.index = { error: results.resources.index.error || `Status: ${results.resources.index.status}` };
        }

        // sizes summary
        const totalSize = Object.values(results.resources).reduce((acc, r) => acc + (r && r.size ? r.size : 0), 0);
        results.summary = { totalSizeBytes: totalSize };

        // localStorage
        results.localStorage = assessLocalStorage();

        // simple suggestions
        const suggestions = [];
        if (results.analysis.index && results.analysis.index.issues) {
            const { issues } = results.analysis.index;
            if (issues.errors.length > 0) suggestions.push(...issues.errors.map(e => `خطأ: ${e}`));
            if (issues.warnings.length > 0) suggestions.push(...issues.warnings.map(w => `تحذير: ${w}`));
        }
        if (results.localStorage.totalBytes > 500000) suggestions.push('حجم البيانات في localStorage كبير (> ~500KB) فكّر بتخزين البيانات على الخادم');

        results.suggestions = suggestions;

        // render results
        displayAuditResults(results);
    }

    function displayAuditResults(r) {
        if (!auditResultsEl) return;
        let html = '';

        html += `<div class="issue"><strong>الملخص:</strong> حجم الصفحات/الملفات المقروءة ~ ${r.summary.totalSizeBytes} بايت.</div>`;

        if (r.analysis && r.analysis.index) {
            if (r.analysis.index.issues) {
                const { issues, counts } = r.analysis.index;
                html += `<div style="margin-top:8px;"><strong>فحص HTML:</strong></div>`;
                if (issues.errors.length > 0) {
                    html += `<div class="issue error">`;
                    html += `<strong>أخطاء:</strong>`;
                    html += `<ul>${shortList(issues.errors)}</ul>`;
                    html += `</div>`;
                }
                if (issues.warnings.length > 0) {
                    html += `<div class="issue warning">`;
                    html += `<strong>تحذيرات:</strong>`;
                    html += `<ul>${shortList(issues.warnings)}</ul>`;
                    html += `</div>`;
                }
                html += `<div class="issue ok">`;
                html += `<strong>نتائج أخرى:</strong>`;
                html += `<ul>${shortList(issues.ok)}</ul>`;
                html += `</div>`;
            } else {
                html += `<div class="issue ok">لا توجد مشاكل ظاهرة في فحص HTML.</div>`;
            }
        }

        // resources
        html += `<div style="margin-top:12px;"><strong>تحليل الموارد:</strong></div>`;
        const { resources } = r;
        for (const key of Object.keys(resources)) {
            const res = resources[key];
            if (res.ok === false) {
                html += `<div class="issue error">فشل في جلب ${key}: ${res.error || 'غير معروف'}</div>`;
                continue;
            }
            html += `<div class="issue"><strong>${key}:</strong>`;
            if (res.size) {
                html += ` حجم: ${res.size} بايت`;
            }
            if (res.status) {
                html += `, حالة: ${res.status}`;
            }
            html += `</div>`;
        }

        // localStorage
        html += `<div style="margin-top:12px;"><strong>تحليل التخزين المحلي:</strong></div>`;
        const { details, totalBytes, count } = r.localStorage;
        html += `<div class="issue">إجمالي العناصر: ${count}, الحجم الكلي: ${totalBytes} بايت</div>`;
        if (details.length > 0) {
            html += `<ul>`;
            details.forEach(d => {
                html += `<li>${d.key}: ${d.length} بايت</li>`;
            });
            html += `</ul>`;
        }

        // Suggestions
        if (r.suggestions && r.suggestions.length > 0) {
            html += `<div style="margin-top:12px;"><strong>اقتراحات:</strong></div>`;
            html += `<ul>`;
            r.suggestions.forEach(s => {
                html += `<li>${s}</li>`;
            });
            html += `</ul>`;
        }

        auditResultsEl.innerHTML = html;
    }

    // --- User Roles & Permissions ---
    // ...existing code...

    // Guard wrappers for sensitive actions
    function wrapFunctionIfExists(fnName, guardFn) {
        try {
            const orig = eval(fnName);
            if (typeof orig !== 'function') return;
            // redefine in current scope by assigning to the identifier name
            // use eval to assign to the existing function name
            eval(`${fnName} = (${orig.toString()}); `); // restore original reference locally first
            // create wrapper that calls guard then original
            const wrapper = async function (...args) {
                if (!guardFn()) { return; }
                // call original (stored as orig)
                return await orig.apply(this, args);
            };
            // replace the function binding
            eval(`${fnName} = ${wrapper.toString()}; `);
        } catch (e) {
            // in case eval/rebind fails, fallback to no-op
            console.warn('wrapFunctionIfExists failed for', fnName, e);
        }
    }

    // simpler explicit wrappers (safer & clearer)

    if (typeof saveArticleFromForm === 'function') {
        const _origSaveArticle = saveArticleFromForm;
        saveArticleFromForm = async function (form) {
            const idVal = form.querySelector('input[name="articleId"]').value;
            if (idVal) {
                if (!assertPermission('edit')) { alert('ليس لديك صلاحية تعديل المقالات.'); return; }
            } else {
                if (!assertPermission('create')) { alert('ليس لديك صلاحية إنشاء مقالات.'); return; }
            }
            return await _origSaveArticle.apply(this, [form]);
        };
    }

    if (typeof deleteArticle === 'function') {
        const _origDeleteArticle = deleteArticle;
        deleteArticle = function (id) {
            if (!assertPermission('delete')) { alert('ليس لديك صلاحية حذف المقالات.'); return; }
            return _origDeleteArticle.apply(this, [id]);
        };
    }

    if (typeof toggleArticleStatus === 'function') {
        const _origToggleStatus = toggleArticleStatus;
        toggleArticleStatus = function (id) {
            if (!assertPermission('edit')) { alert('ليس لديك صلاحية تغيير حالة النشر.'); return; }
            return _origToggleStatus.apply(this, [id]);
        };
    }

    if (typeof addUser === 'function') {
        const _origAddUser = addUser;
        addUser = function (name, email, role) {
            if (!assertPermission('manageUsers')) { alert('ليس لديك صلاحية إضافة أعضاء.'); return; }
            return _origAddUser.apply(this, [name, email, role]);
        };
    }

    if (typeof deleteUser === 'function') {
        const _origDeleteUser = deleteUser;
        deleteUser = function (id) {
            if (!assertPermission('manageUsers')) { alert('ليس لديك صلاحية حذف الأعضاء.'); return; }
            const current = getCurrentUser();
            if (current && String(current.id) === String(id)) { alert('لا يمكنك حذف المستخدم الحالي.'); return; }
            return _origDeleteUser.apply(this, [id]);
        };
    }

    // Re-define renderArticlesTable to respect permissions (safe replacement)
    if (typeof renderArticlesTable === 'function') {
        const _origRender = renderArticlesTable;
        renderArticlesTable = function (filter = '') {
            const user = getCurrentUser();
            const perms = user ? getPermissionsByRole(user.role) : getPermissionsByRole('قارئ');

            const tableBody = document.getElementById('articles-table-body');
            if (!tableBody) return;

            const articles = JSON.parse(localStorage.getItem('naifnews_articles')) || [];
            tableBody.innerHTML = '';
            const normalizedFilter = (filter || '').trim().toLowerCase();

            articles.slice().reverse().forEach(article => {
                const combined = `${article.title} ${article.author || ''} ${article.category || ''} `.toLowerCase();
                if (normalizedFilter && !combined.includes(normalizedFilter)) return;

                const statusClass = (article.status === 'draft') ? 'draft' : 'published';
                const statusText = (article.status === 'draft') ? 'مسودة' : 'منشور';

                const canEdit = perms.canEdit;
                const canDelete = perms.canDelete;

                const tr = document.createElement('tr');
                tr.innerHTML = `
    < td > ${article.title}</td >
                    <td>${article.author || 'المدير'}</td>
                    <td>${article.date || 'اليوم'}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        ${canEdit ? `<button class="action-btn toggle-status-btn" data-id="${article.id}" title="نشر/إلغاء النشر">${article.status === 'draft' ? 'نشر' : 'إلغاء النشر'}</button>` : ''}
                        ${canEdit ? `<button class="action-btn edit-btn" data-id="${article.id}" title="تعديل">✏️</button>` : ''}
                        ${canDelete ? `<button class="action-btn delete-btn" data-id="${article.id}" title="حذف">🗑️</button>` : ''}
                    </td>
`;
                tableBody.appendChild(tr);
            });

            // Attach events (wrapped functions already enforce perms)
            tableBody.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    if (confirm('هل أنت متأكد من حذف هذا المقال؟')) {
                        deleteArticle(id);
                        updateStats();
                        if (typeof broadcast === 'function') broadcast({ type: 'articles_update' });
                    }
                });
            });

            tableBody.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    toggleArticleStatus(id);
                    renderArticlesTable(document.getElementById('dashboard-search') ? document.getElementById('dashboard-search').value : '');
                    updateStats();
                    if (typeof broadcast === 'function') broadcast({ type: 'articles_update' });
                });
            });

            tableBody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    openEditModal(id);
                });
            });
        };
    }

    // Re-define renderUsersTable safely (respect manageUsers perm)
    if (typeof renderUsersTable === 'function') {
        const _origUsersRender = renderUsersTable;
        renderUsersTable = function () {
            const tbody = document.querySelector('#users-table tbody');
            if (!tbody) return;
            const users = getUsers();
            tbody.innerHTML = '';

            const canManage = assertPermission('manageUsers');

            users.forEach(user => {
                let roleClass = 'draft';
                if (user.role === 'مدير') roleClass = 'published';
                if (user.role === 'مشرف') roleClass = 'pending';

                const tr = document.createElement('tr');
                tr.innerHTML = `
    < td > <strong>${user.name}</strong></td >
                    <td>${user.email}</td>
                    <td>
                        ${canManage ? `<select class="user-role-select" data-id="${user.id}">
                            <option ${user.role === 'محرر' ? 'selected' : ''}>محرر</option>
                            <option ${user.role === 'مشرف' ? 'selected' : ''}>مشرف</option>
                            <option ${user.role === 'مدير' ? 'selected' : ''}>مدير</option>
                            <option ${user.role === 'قارئ' ? 'selected' : ''}>قارئ</option>
                        </select>` : `<span class="status ${roleClass}">${user.role}</span>`}
                    </td>
                    <td>${user.date}</td>
                    <td>
                        <button class="action-btn impersonate-btn" data-id="${user.id}" title="تبديل للمستخدم">🔁</button>
                        ${canManage ? `<button class="action-btn delete-user-btn" data-id="${user.id}" title="حذف">🗑️</button>` : ''}
                    </td>
`;
                tbody.appendChild(tr);
            });

            // handlers
            tbody.querySelectorAll('.user-role-select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    if (!assertPermission('manageUsers')) { alert('ليس لديك صلاحية تعديل الصلاحيات.'); return; }
                    const id = sel.getAttribute('data-id');
                    let usersAll = getUsers();
                    usersAll = usersAll.map(u => { if (String(u.id) === String(id)) u.role = sel.value; return u; });
                    localStorage.setItem(USER_KEY, JSON.stringify(usersAll));
                    populateCurrentUserSelect();
                    updateStats();
                });
            });

            tbody.querySelectorAll('.impersonate-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    setCurrentUserId(id);
                    if (currentUserSelect) currentUserSelect.value = id;
                    alert('تم تبديل المستخدم إلى الحساب المحدد.');
                });
            });

            tbody.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.getAttribute('data-id');
                    if (confirm('هل أنت متأكد من حذف هذا العضو؟')) {
                        deleteUser(id);
                    }
                });
            });
        };
    }

    // Ensure current user exists and apply permissions on load
    const initialCurrent = getCurrentUser();
    if (initialCurrent) {
        localStorage.setItem(CURRENT_USER_KEY, String(initialCurrent.id));
    }
    populateCurrentUserSelect();
    applyPermissionsToUI();
});
