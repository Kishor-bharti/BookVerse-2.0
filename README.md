### Install MySQL Server and Workbench:
MySQL server and workbench: [Download](https://dev.mysql.com/downloads/mysql/)

### Install NodeJs:
NodeJs: [Download](https://nodejs.org/en)

  Setup: Install and configure Mysql server and workbench, install NodeJs on your system.

### Import database:

```sql 
--create the database as:
CREATE DATABASE users;
```

```sql
--create users table:
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Stores book info uploaded by users.
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Book_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    Book_image VARCHAR(255) NOT NULL,
    seller_id INT,
    is_sold BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
);
```

Create the .env file in the root and put the following code inside!

```.env
DB_HOST   = localhost
DB_USER  = root
DB_PASS = YOUR_PASSWORD
DB_NAME = users
SESSION_SECRET = bookverse-secret-key-2025
```

Run `npm start` command in terminal (or update or to set the powershell script using `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` command temporarly!)

Run ```node app.js``` command in terminal, after locating the project root dir.
Then go to localhost:3000 (port number!)

### Run this Query on workbench (If Database does not connect): 
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '7517';
FLUSH PRIVILEGES;
```

## User Interface of the product:
#### Home Page

![My Local Image](/frontend/public/images/home.png)

#### Books Catalog

![My Local Image](/frontend/public/images/Books_catalog.png)

#### Login Page

![My Local Image](/frontend/public/images/Login.png)

#### Signup Page

![My Local Image](/frontend/public/images/Register.png)

#### Upload Books

![My Local Image](/frontend/public/images/upload.png)