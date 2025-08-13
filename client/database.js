const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5499,
  user: 'presenting',
  password: 'presenting',
  database: 'presenting',
});

module.exports = pool;