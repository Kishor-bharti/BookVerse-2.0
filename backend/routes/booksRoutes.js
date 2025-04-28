const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Setup multer (memory storage to directly upload buffer to Supabase)
const storage = multer.memoryStorage();
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

    try {
        // Unique filename
        const fileName = `book_images/${Date.now()}-${req.file.originalname}`;

        // Upload image to Supabase Storage
        const { data, error } = await supabase.storage
            .from('book_image') // Your Supabase bucket name
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return res.status(500).json({ error: 'Failed to upload image to storage' });
        }

        // Get public URL
        const { publicURL } = supabase.storage
            .from('book_image')
            .getPublicUrl(fileName);

        if (!publicURL) {
            return res.status(500).json({ error: 'Failed to retrieve public URL' });
        }

        // Save book details into database
        const query = 'INSERT INTO books (book_name, price, book_image, seller_id, is_sold) VALUES ($1, $2, $3, $4, FALSE)';
        await db.query(query, [bookName, price, publicURL, sellerId]);

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
            'SELECT id, book_name, price, book_image, seller_id, created_at FROM books WHERE is_sold = FALSE'
        );
        console.log('Books fetched:', rows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching books:', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

module.exports = router;