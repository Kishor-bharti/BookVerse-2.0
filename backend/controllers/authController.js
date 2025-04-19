const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

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

const getStatus = (req, res) => {
    res.json({ isLoggedIn: !!req.session.user });
};

const signup = async (req, res) => {
    const { username, password, mobile, email } = req.body;
    try {
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
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, password, mobile, email) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, mobile, email]
        );
        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const user = rows[0];
        if (await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user.id, username: user.username, email: user.email };
            res.status(200).json({ message: 'Logged in' });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const logout = (req, res) => {
    req.session.destroy();
    res.status(200).json({ message: 'Logged out' });
};

module.exports = { getStatus, signup, login, logout };