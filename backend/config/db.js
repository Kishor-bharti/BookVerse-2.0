// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config(); // if you want to pull creds from a .env

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // PostgreSQL requires a port, typically 5432
  max: 10, // equivalent to connectionLimit in MySQL
  idleTimeoutMillis: 30000, // optional: close idle clients after 30 seconds
});

module.exports = pool;