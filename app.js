const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./backend/routes/authRoutes');
const booksRoutes = require('./backend/routes/booksRoutes');
const app = express();

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Middleware to log session user for API routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        console.log(`Request Path: ${req.path}, Session User:`, req.session.user);
    }
    next();
});

// Middleware to prevent logged-in users from accessing login and registration pages
app.use((req, res, next) => {
    console.log('Session User:', req.session.user); // Debugging
    if ((req.path === '/src/pages/login.html' || req.path === '/src/pages/register.html') && req.session.user) {
        return res.redirect('/src/pages/home.html');
    }
    next();
});

// Static file middleware
app.use(express.static(path.join(__dirname, 'frontend/public')));
app.use(express.static(path.join(__dirname, 'frontend/src')));

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api', booksRoutes);

// Serve index.html for root URL
app.get('/', (req, res) => {
    res.redirect('/src/pages/home.html');
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});