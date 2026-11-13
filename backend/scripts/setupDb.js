import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('🔄 Initializing SpendWise Database...');
  
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'spendwise_db';

  console.log(`Connecting to MySQL host: ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without database first to ensure CREATE DATABASE works
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });
    console.log('✅ Connected to MySQL server successfully.');

    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Executing schema.sql to create database and tables...');
    await connection.query(schemaSql);
    console.log('✅ Database schema and tables verified/created successfully.');

    const seedSql = fs.readFileSync(seedPath, 'utf8');
    console.log('🌱 Executing seed.sql with default categories and demo user...');
    await connection.query(seedSql);
    console.log('✅ Default categories and demo dataset seeded successfully!');

    console.log('\n🎉 Database setup complete! SpendWise is ready.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 Tip: Check your DB_PASSWORD in backend/.env file.');
    }
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();

