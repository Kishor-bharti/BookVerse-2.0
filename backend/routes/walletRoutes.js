const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get wallet balance
router.get('/wallet/balance', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const { rows } = await db.query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [req.session.user.id]
        );
        
        res.json({ balance: rows[0].wallet_balance });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.status(500).json({ message: 'Failed to fetch wallet balance' });
    }
});

// Get transaction history
router.get('/wallet/transactions', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const { rows } = await db.query(
            'SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC',
            [req.session.user.id]
        );
        
        res.json({ transactions: rows });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to fetch transactions' });
    }
});

module.exports = router;