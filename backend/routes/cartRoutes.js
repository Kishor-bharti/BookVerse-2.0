const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get cart items
router.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const { rows } = await db.query(
            `SELECT b.* FROM books b
             JOIN cart_items c ON b.id = c.book_id
             WHERE c.user_id = $1`,
            [req.session.user.id]
        );
        res.json({ items: rows });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Failed to fetch cart items' });
    }
});

// Add item to cart
router.post('/cart/add', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    const { bookId } = req.body;
    
    try {
        // Check if book exists and is not sold
        const bookCheck = await db.query(
            'SELECT * FROM books WHERE id = $1 AND is_sold = FALSE',
            [bookId]
        );

        if (bookCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Book not available' });
        }

        // Check if book is already in cart
        const cartCheck = await db.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND book_id = $2',
            [req.session.user.id, bookId]
        );

        if (cartCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Book already in cart' });
        }

        // Add to cart
        await db.query(
            'INSERT INTO cart_items (user_id, book_id) VALUES ($1, $2)',
            [req.session.user.id, bookId]
        );

        res.json({ message: 'Book added to cart successfully' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Failed to add book to cart' });
    }
});

// Remove item from cart
router.post('/cart/remove', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    const { bookId } = req.body;
    
    try {
        await db.query(
            'DELETE FROM cart_items WHERE user_id = $1 AND book_id = $2',
            [req.session.user.id, bookId]
        );
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Failed to remove item from cart' });
    }
});

// Checkout
router.post('/cart/checkout', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        // Start transaction
        await db.query('BEGIN');

        // Get cart items with their prices
        const { rows: cartItems } = await db.query(
            `SELECT b.* FROM books b
             JOIN cart_items c ON b.id = c.book_id
             WHERE c.user_id = $1`,
            [req.session.user.id]
        );

        if (cartItems.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total price
        const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

        // Check user's wallet balance
        const { rows: userRows } = await db.query(
            'SELECT wallet_balance FROM users WHERE id = $1',
            [req.session.user.id]
        );
        
        if (userRows[0].wallet_balance < totalPrice) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }

        // Process each item in cart
        for (const item of cartItems) {
            // Create purchase record
            await db.query(
                'INSERT INTO purchases (buyer_id, book_id) VALUES ($1, $2)',
                [req.session.user.id, item.id]
            );

            // Mark book as sold
            await db.query(
                'UPDATE books SET is_sold = TRUE WHERE id = $1',
                [item.id]
            );
        }

        // Clear user's cart
        await db.query(
            'DELETE FROM cart_items WHERE user_id = $1',
            [req.session.user.id]
        );

        // Commit transaction
        await db.query('COMMIT');

        res.json({ message: 'Checkout successful' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error during checkout:', error);
        res.status(500).json({ message: 'Checkout failed' });
    }
});

module.exports = router;