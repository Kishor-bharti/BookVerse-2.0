const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();

// Parse incoming request bodies in JSON format
app.use(express.json());

// Import the authentication routes
const authRoutes = require('./backend/routes/authRoutes');
app.use('/api/auth', authRoutes);


// MySQL connection details
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '7517',
  database: 'USERS'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});


// Serve static files from the 'frontend/public' folder
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Serve static files from 'src'
app.use(express.static(path.join(__dirname, 'frontend', 'src')));

// Route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});


// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
