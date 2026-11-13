import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for high-performance and resilient connection handling
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'spendwise_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: true, // Returns DECIMAL as numbers for precise math in JavaScript
});

// Self-test database connectivity
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    connection.release();
    return { success: true, message: 'MySQL database connected successfully' };
  } catch (error) {
    return {
      success: false,
      message: `Database connection error: ${error.message}`,
      code: error.code,
    };
  }
};

export default pool;

