const express = require('express');
const db = require('../config/db');
const router = express.Router();
// const { db } = require('../controllers/authController'); // Import the db object

// Endpoint to add a new book
router.post('/upload', async (req, res) => {
    const { bookName, price, bookImage } = req.body;

    // Ensure the user is logged in
    if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: 'Unauthorized. Please log in to upload a book.' });
    }

    const sellerId = req.session.user.id;

    if (!bookName || !price || !bookImage) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const query = 'INSERT INTO books (Book_name, price, Book_image, seller_id, is_sold) VALUES (?, ?, ?, ?, FALSE)';
        await db.query(query, [bookName, price, bookImage, sellerId]);
        res.status(201).json({ message: 'Book uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload book' });
    }
});

// Fetch books where is_sold is FALSE
router.get('/books', async (req, res) => {
    try {
        const [books] = await db.query('SELECT id, Book_name, price, Book_image, seller_id, created_at FROM books WHERE is_sold = FALSE');
        res.json(books);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

module.exports = router;