const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
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



// New MySQL connection details
let db;
async function initDb() {
    db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '7517',
        database: 'users'
    });
}
initDb();

// Authentication routes
app.use('/api/auth', authRoutes);


// Serve static files from the 'frontend/public' folder
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Serve static files from 'src'
app.use(express.static(path.join(__dirname, 'frontend', 'src')));

// Route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});

// Routes (Copied from previous!!)
app.get('/api/auth/status', (req, res) => {
  res.json({ isLoggedIn: !!req.session.user });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, mobile, email } = req.body;
  try {
      // Check if user already exists
      const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      if (rows.length > 0) {
          return res.status(400).send('User already exists');
      }
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query('INSERT INTO users (username, password, mobile, email) VALUES (?, ?, ?, ?)', [username, hashedPassword, mobile, email]);
      res.status(201).send('User registered');
  } catch (error) {
      console.error('Registration error:', error);
      res.status(500).send('Server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
      const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
      if (rows.length === 0) {
          return res.status(401).send('User not found');
      }
      const user = rows[0];
      if (await bcrypt.compare(password, user.password)) {
          req.session.user = { id: user.id, email: user.email };
          res.status(200).send('Logged in');
      } else {
          res.status(401).send('Invalid password');
      }
  } catch (error) {
      res.status(500).send('Server error');
  }
});

// Serve index.html for root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/public', 'index.html'));
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.status(200).send('Logged out');
});


// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});