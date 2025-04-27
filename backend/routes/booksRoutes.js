const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Setup multer for storing uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../frontend/public/images'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Upload a new book (with image)
router.post('/upload', upload.single('bookImage'), async (req, res) => {
    const { bookName, price } = req.body;

    // Ensure the user is logged in
    if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: 'Unauthorized. Please log in to upload a book.' });
    }

    const sellerId = req.session.user.id;

    if (!bookName || !price || !req.file) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const bookImage = req.file.filename;

    try {
        const query = 'INSERT INTO books (Book_name, price, Book_image, seller_id, is_sold) VALUES ($1, $2, $3, $4, FALSE)';
        await db.query(query, [bookName, price, bookImage, sellerId]);
        res.status(201).json({ message: 'Book uploaded successfully' });
    } catch (error) {
        console.error('Error uploading book:', error);
        res.status(500).json({ error: 'Failed to upload book' });
    }
});

// Fetch all available books (only unsold books)
router.get('/books', async (req, res) => {
    try {
        console.log('Fetching books from database...');
        const { rows } = await db.query(
            'SELECT id, Book_name, price, Book_image, seller_id, created_at FROM books WHERE is_sold = FALSE'
        );
        console.log('Books fetched:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

module.exports = router;