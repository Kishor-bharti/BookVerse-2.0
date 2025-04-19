const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./backend/routes/authRoutes');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/public')));
app.use(express.static(path.join(__dirname, 'frontend/src')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
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