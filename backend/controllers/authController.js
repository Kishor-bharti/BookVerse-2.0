const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const db = require('../config/db');

// let db;
// async function initDb() {
//     try {
//         db = await mysql.createConnection({
//             host: 'localhost',
//             user: 'root',
//             password: '7517',
//             database: 'users'
//         });
//         console.log('Database connected successfully');
//     } catch (error) {
//         console.error('Error connecting to the database:', error);
//         process.exit(1); // Exit the process if the database connection fails
//     }
// }
// initDb();

const getStatus = (req, res) => {
    res.json({ isLoggedIn: !!req.session.user });
};

const signup = async (req, res) => {
    const { username, password, mobile, email } = req.body;
    try {
        console.log('Signup request received:', req.body);

        // Check for duplicate username or email
        const [rows] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (rows.length > 0) {
            const existingUser = rows[0];
            if (existingUser.username === username) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.status(409).json({ message: 'Email already exists' });
            }
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const [result] = await db.query(
            'INSERT INTO users (username, password, mobile, email) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, mobile, email]
        );

        const newUser = { id: result.insertId, username };

        req.session.user = { id: newUser.id, username: newUser.username };

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Set session
        req.session.user = { id: user.id, username: user.username };
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ message: 'Failed to log out' });
        }
        res.clearCookie('connect.sid', { path: '/' }); // Ensure the cookie is cleared
        console.log('Logout successful');
        res.json({ message: 'Logout successful' });
    });
};

module.exports = { getStatus, signup, login, logout };