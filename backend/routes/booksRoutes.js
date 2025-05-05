const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Setup multer (memory storage to directly upload buffer to Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a new book (with image)
router.post("/upload", upload.single("bookImage"), async (req, res) => {
  const { bookName, price, description } = req.body;

  // Ensure the user is logged in
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Please log in to upload a book." });
  }

  const sellerId = req.session.user.id;

  if (!bookName || !price || !req.file) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    // Unique filename, including the directory
    const fileName = `book_images/${Date.now()}-${req.file.originalname}`;

    // Upload image to Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET) // Your Supabase bucket name
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res
        .status(500)
        .json({ error: "Failed to upload image to storage" });
    }

    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from(process.env.SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(fileName);

    if (publicUrlError) {
      console.error("Error getting public URL:", publicUrlError);
      return res.status(500).json({ error: "Failed to retrieve public URL" });
    }

    const publicURL = publicUrlData.publicUrl; // <-- IMPORTANT!

    if (!publicURL) {
      console.error("Public URL is undefined!");
      return res.status(500).json({ error: "Failed to retrieve public URL" });
    }

    // Save book details into database with description
    const query =
      "INSERT INTO books (book_name, description, price, book_image, seller_id, is_sold) VALUES ($1, $2, $3, $4, $5, FALSE)";
    await db.query(query, [bookName, description || null, price, publicURL, sellerId]);

    res.status(201).json({ message: "Book uploaded successfully" });
  } catch (error) {
    console.error("Error uploading book:", error);
    res.status(500).json({ error: "Failed to upload book" });
  }
});

// Fetch all available books (only unsold books)
router.get("/books", async (req, res) => {
  try {
    console.log("Fetching books from database...");
    const { rows } = await db.query(
      "SELECT id, book_name, description, price, book_image, seller_id, created_at FROM books WHERE is_sold = FALSE"
    );
    console.log("Books fetched:", rows);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Delete a book
router.delete("/books/:id", async (req, res) => {
  // Ensure the user is logged in
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Please log in to delete a book." });
  }

  const bookId = req.params.id;
  const userId = req.session.user.id;

  try {
    // Start transaction
    await db.query('BEGIN');

    // Check if the book exists and belongs to the user
    const { rows } = await db.query(
      'SELECT * FROM books WHERE id = $1 AND seller_id = $2',
      [bookId, userId]
    );

    if (rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(403).json({ 
        error: "You don't have permission to delete this book or the book doesn't exist" 
      });
    }

    // Check if the book is already sold
    if (rows[0].is_sold) {
      await db.query('ROLLBACK');
      return res.status(400).json({ 
        error: "Cannot delete a book that has been sold" 
      });
    }

    // Remove the book from all carts first
    await db.query(
      'DELETE FROM cart_items WHERE book_id = $1',
      [bookId]
    );

    // Delete the book
    await db.query(
      'DELETE FROM books WHERE id = $1 AND seller_id = $2',
      [bookId, userId]
    );

    await db.query('COMMIT');
    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

module.exports = router;
