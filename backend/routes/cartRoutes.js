const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get cart items with availability check
router.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Please login first' });
    }

    try {
        const { rows } = await db.query(
            `SELECT b.*, 
                    CASE WHEN b.is_sold = TRUE THEN 'Sold' ELSE 'Available' END as status
             FROM books b
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
        // Start transaction
        await db.query('BEGIN');

        // Check if book exists, is not sold, and is not owned by the current user
        const bookCheck = await db.query(
            'SELECT * FROM books WHERE id = $1 AND is_sold = FALSE AND seller_id != $2',
            [bookId, req.session.user.id]
        );

        if (bookCheck.rows.length === 0) {
            await db.query('ROLLBACK');
            // Check if it's the user's own book
            const ownBookCheck = await db.query(
                'SELECT * FROM books WHERE id = $1 AND seller_id = $2',
                [bookId, req.session.user.id]
            );
            if (ownBookCheck.rows.length > 0) {
                return res.status(403).json({ message: 'You cannot add your own book to cart' });
            }
            return res.status(404).json({ message: 'Book not available' });
        }

        // Check if book is already in cart
        const cartCheck = await db.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND book_id = $2',
            [req.session.user.id, bookId]
        );

        if (cartCheck.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Book already in cart' });
        }

        // Add to cart
        await db.query(
            'INSERT INTO cart_items (user_id, book_id) VALUES ($1, $2)',
            [req.session.user.id, bookId]
        );

        await db.query('COMMIT');
        res.json({ message: 'Book added to cart successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
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

        // Get cart items with their prices and seller information, checking ownership
        const { rows: cartItems } = await db.query(
            `SELECT b.*, b.seller_id, u.wallet_balance as seller_balance 
             FROM books b 
             JOIN cart_items c ON b.id = c.book_id 
             JOIN users u ON b.seller_id = u.id
             WHERE c.user_id = $1
             AND b.is_sold = FALSE
             AND b.seller_id != $1
             FOR UPDATE OF b`,  // Lock the books to prevent concurrent purchases
            [req.session.user.id]
        );

        // Check if any books in cart are own books
        const ownBooksCheck = await db.query(
            `SELECT b.* FROM books b
             JOIN cart_items c ON b.id = c.book_id
             WHERE c.user_id = $1 AND b.seller_id = $1`,
            [req.session.user.id]
        );

        if (ownBooksCheck.rows.length > 0) {
            await db.query('ROLLBACK');
            return res.status(403).json({ 
                message: 'You cannot purchase your own books',
                ownBooks: ownBooksCheck.rows.map(book => book.book_name)
            });
        }

        // Check if any books in cart are already sold
        const unavailableBooks = cartItems.filter(item => item.is_sold);
        if (unavailableBooks.length > 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ 
                message: 'Some books in your cart are no longer available',
                unavailableBooks: unavailableBooks.map(book => book.book_name)
            });
        }

        if (cartItems.length === 0) {
            await db.query('ROLLBACK');
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total price
        const totalPrice = cartItems.reduce((sum, item) => sum + parseFloat(item.price), 0);

        // Get buyer's wallet balance
        const { rows: buyerRows } = await db.query(
            'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
            [req.session.user.id]
        );
        
        const buyerBalance = parseFloat(buyerRows[0].wallet_balance);
        
        if (buyerBalance < totalPrice) {
            await db.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Insufficient balance. Your balance: $${buyerBalance.toFixed(2)}, Required: $${totalPrice.toFixed(2)}` 
            });
        }

        // Process each item in cart
        for (const item of cartItems) {
            // Double-check book is still available
            const { rows: bookCheck } = await db.query(
                'SELECT is_sold FROM books WHERE id = $1 FOR UPDATE',
                [item.id]
            );

            if (bookCheck[0].is_sold) {
                await db.query('ROLLBACK');
                return res.status(400).json({ 
                    message: `Book "${item.book_name}" was just purchased by someone else` 
                });
            }

            // Deduct from buyer's wallet
            await db.query(
                'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
                [item.price, req.session.user.id]
            );

            // Add to seller's wallet
            await db.query(
                'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
                [item.price, item.seller_id]
            );

            // Record transactions
            await db.query(
                'INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
                [req.session.user.id, item.price, 'DEBIT', `Purchased book: ${item.book_name}`]
            );

            await db.query(
                'INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
                [item.seller_id, item.price, 'CREDIT', `Sold book: ${item.book_name}`]
            );

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

            // Remove this book from all users' carts
            await db.query(
                'DELETE FROM cart_items WHERE book_id = $1',
                [item.id]
            );
        }

        // Commit transaction
        await db.query('COMMIT');

        res.json({ 
            message: 'Checkout successful',
            totalPaid: totalPrice,
            newBalance: (buyerBalance - totalPrice).toFixed(2)
        });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error during checkout:', error);
        res.status(500).json({ message: 'Checkout failed' });
    }
});

module.exports = router;