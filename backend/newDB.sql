-- Important Notes:
-- Make sure your PostgreSQL database has the correct table structure:

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    wallet_balance DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Additional Note:
-- Make sure your PostgreSQL database has the correct table structure. Here's the suggested schema:

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    book_image VARCHAR(255),
    seller_id INTEGER REFERENCES users(id),
    is_sold BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- purchases
-- Stores info about which user bought which book.

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id),
    book_id INTEGER UNIQUE REFERENCES books(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- cart_items
-- Tracks which user has added which book to their cart.

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    book_id INTEGER UNIQUE REFERENCES books(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- wallet_transactions
-- To keep track of all wallet movements, including credits and debits.

CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('CREDIT', 'DEBIT')) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Write a PostgreSQL Trigger Function

CREATE OR REPLACE FUNCTION handle_wallet_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    book_price NUMERIC(10,2);
    seller_id INT;
BEGIN
    -- Get the book price and seller
    SELECT price, seller_id INTO book_price, seller_id
    FROM books
    WHERE id = NEW.book_id;

    -- Deduct from buyer
    UPDATE users
    SET wallet_balance = wallet_balance - book_price
    WHERE id = NEW.buyer_id;

    -- Add to seller
    UPDATE users
    SET wallet_balance = wallet_balance + book_price
    WHERE id = seller_id;

    -- Log buyer debit
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (NEW.buyer_id, book_price, 'DEBIT', CONCAT('Purchased book ID ', NEW.book_id));

    -- Log seller credit
    INSERT INTO wallet_transactions (user_id, amount, type, description)
    VALUES (seller_id, book_price, 'CREDIT', CONCAT('Sold book ID ', NEW.book_id));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Attach the Trigger to the purchases Table

CREATE TRIGGER trigger_wallet_on_purchase
AFTER INSERT ON purchases
FOR EACH ROW
EXECUTE FUNCTION handle_wallet_on_purchase();