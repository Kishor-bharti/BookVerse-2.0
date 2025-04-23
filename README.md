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
```

Run ```node app.js``` command in terminal, after locating the project root dir.
Then go to localhost:3000 (port number!)

### Run this Query on workbench (If Database does not connect): 
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '7517';
FLUSH PRIVILEGES;
```