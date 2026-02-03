const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./backend/routes/authRoutes');
const booksRoutes = require('./backend/routes/booksRoutes');
const cartRoutes = require('./backend/routes/cartRoutes');
const walletRoutes = require('./backend/routes/walletRoutes');
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());

// Production check
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction, // Only use secure cookies in production
        sameSite: isProduction ? 'none' : 'lax', // Required for cross-site cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    },
    proxy: isProduction // Trust the reverse proxy in production
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
app.use(express.static(path.join(__dirname, 'frontend', 'public')));
app.use(express.static(path.join(__dirname, 'frontend/src')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', booksRoutes);
app.use('/api', cartRoutes);
app.use('/api', walletRoutes);

// to redirect root to home page
app.get("/", (req, res) => {
  res.redirect("/pages/home.html");
});


// Serve index.html for root URL
// app.get('/', (req, res) => {
//     res.redirect('/src/pages/home.html');
// });

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});