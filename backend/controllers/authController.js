const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

let db;
async function initDb() {
    db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '7517',
        database: 'bookstore'
    });
}
initDb();

const getStatus = (req, res) => {
    res.json({ isLoggedIn: !!req.session.user });
};

const signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).send('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).send('User registered');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).send('Server error');
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
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
        console.error('Login error:', error);
        res.status(500).send('Server error');
    }
};

const logout = (req, res) => {
    req.session.destroy();
    res.status(200).send('Logged out');
};

module.exports = { getStatus, signup, login, logout };