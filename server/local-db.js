// This file is for local development and shows how to load environment variables
// from a .env file using dotenv package
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Create a PostgreSQL pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If not using connectionString, you can use individual parameters:
  // user: process.env.PGUSER,
  // password: process.env.PGPASSWORD,
  // host: process.env.PGHOST,
  // port: process.env.PGPORT,
  // database: process.env.PGDATABASE,
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};