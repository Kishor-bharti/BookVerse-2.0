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
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(10) NOT NULL UNIQUE,
    password VARCHAR(20) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Run ```node app.js``` command in terminal, after locating the project root dir.
Then go to localhost:3000 (port number!)

### Run this Query on workbench (If Database does not connect): 
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '7517';
FLUSH PRIVILEGES;
```