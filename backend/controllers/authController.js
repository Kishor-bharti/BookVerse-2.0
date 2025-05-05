const bcrypt = require('bcryptjs');
const db = require('../config/db');

const getStatus = (req, res) => {
    res.json({ 
        isLoggedIn: !!req.session.user,
        userId: req.session.user ? req.session.user.id : null
    });
};

const signup = async (req, res) => {
    const { username, password, mobile, email } = req.body;
    try {
        console.log('Signup request received:', req.body);

        // Check for duplicate username or email
        const { rows } = await db.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        // Check all returned rows for conflicts
        const usernameExists = rows.some(user => user.username === username);
        const emailExists = rows.some(user => user.email === email);

        if (usernameExists) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        if (emailExists) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        const result = await db.query(
            'INSERT INTO users (username, password, mobile, email) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, hashedPassword, mobile, email]
        );

        const newUser = { id: result.rows[0].id, username };
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
        const { rows } = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

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
        res.clearCookie('connect.sid', { path: '/' });
        console.log('Logout successful');
        res.json({ message: 'Logout successful' });
    });
};

module.exports = { getStatus, signup, login, logout };