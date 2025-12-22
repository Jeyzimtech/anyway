const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
  let connection;
  try {
    // Connect without database first to create it if needed
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'salespark';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' created or already exists`);

    // Select the database
    await connection.query(`USE \`${dbName}\``);

    // Read and execute schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log('Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          console.error('Error executing statement:', error.message);
          // Continue with next statement
        }
      }
    }

    // Ensure returns review columns exist (best-effort; ignore errors on older MySQL)
    const alters = [
      "ALTER TABLE returns ADD COLUMN IF NOT EXISTS review_reason TEXT NULL",
      "ALTER TABLE returns ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255) NULL",
      "ALTER TABLE returns ADD COLUMN IF NOT EXISTS reviewed_at DATETIME NULL"
    ];
    for (const alter of alters) {
      try {
        await connection.query(alter);
        console.log('Executed:', alter);
      } catch (err) {
        console.warn('Alter skipped:', err.message);
      }
    }

    console.log('Database initialization completed successfully');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

initDatabase();
