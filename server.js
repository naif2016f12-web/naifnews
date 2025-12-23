require('dotenv').config();
const express = require('express');
const path = require('path');
const os = require('os');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'naifnews_secret_key_change_this_in_prod';

// --- Middleware ---

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for simplicity with inline scripts/images in this demo
}));

// Compression
app.use(compression());

// CORS (Allow requests from your domain)
app.use(cors());

// Rate Limiting (Protect against DDoS/Brute Force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Serve Static Files (Frontend)
app.use(express.static(path.join(__dirname, '/')));


// --- Mock Database (In-Memory for Demo, Replace with MongoDB/Postgres) ---
// In a real app, you would connect to mongoose or pg here.
// Use system temp dir for Vercel/ReadOnly environments
const DB_FILE = path.join(os.tmpdir(), 'naifnews_db.json');

// Helper to read DB
function getDB() {
    if (!fs.existsSync(DB_FILE)) {
        // Seed initial data
        const seed = {
            users: [
                { id: 1, email: 'naif@news.com', password: 'hashed_secret_123', name: 'نايف المنصوري', role: 'admin' }
            ],
            articles: [],
            comments: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// Helper to write DB
function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}


// --- API Routes ---

// 1. Auth Login (JWT)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    // In production: Find user in DB, Compare password hash using bcrypt
    const db = getDB();
    const user = db.users.find(u => u.email === email);

    // Mock password check (Accepts any password if user exists for demo, or match hardcoded)
    if (user && (password === '123456' || user.password === 'hashed_secret_123')) {
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// 2. Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// 3. Articles API
app.get('/api/articles', (req, res) => {
    const db = getDB();
    res.json(db.articles);
});

app.post('/api/articles', authenticateToken, (req, res) => {
    const db = getDB();
    const newArticle = { id: Date.now(), ...req.body, date: new Date() };
    db.articles.push(newArticle);
    saveDB(db);
    res.json(newArticle);
});

app.delete('/api/articles/:id', authenticateToken, (req, res) => {
    const db = getDB();
    db.articles = db.articles.filter(a => String(a.id) !== req.params.id);
    saveDB(db);
    res.json({ success: true });
});

// 4. Fallback for SPA (Single Page App)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
