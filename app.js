const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./backend/routes/authRoutes');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));
app.use(express.static(path.join(__dirname, 'frontend/src')));
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

// Authentication routes
app.use('/api/auth', authRoutes);

// Serve index.html for root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});