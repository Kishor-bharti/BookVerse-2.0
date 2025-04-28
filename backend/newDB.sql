-- Important Notes:
-- Make sure your PostgreSQL database has the correct table structure:

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL
);


-- Additional Note:
-- Make sure your PostgreSQL database has the correct table structure. Here's the suggested schema:

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    book_image VARCHAR(255),
    seller_id INTEGER REFERENCES users(id),
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);