import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { AppError } from '../middlewares/errorHandler';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false, // Prevent SQL injection
  dateStrings: true // Consistent date handling
});

// Handle connection events
pool.on('acquire', (connection) => {
  console.log('Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('Connection %d released', connection.threadId);
});

// Handle pool errors through the promise interface
process.on('unhandledRejection', (err: Error) => {
  if (err.message.includes('pool')) {
    console.error('Database pool error:', err);
    process.exit(1);
  }
});

// Wrapper for database queries with error handling
export async function executeQuery<T>(
  query: string,
  params?: any[]
): Promise<T> {
  try {
    const [results] = await pool.query(query, params);
    return results as T;
  } catch (error: any) {
    console.error('Database query error:', {
      query,
      params,
      error: error.message
    });

    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Record already exists');
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW') {
      throw new AppError(400, 'Referenced record does not exist');
    }

    if (error.code === 'ER_DATA_TOO_LONG') {
      throw new AppError(400, 'Data too long for one or more fields');
    }

    throw new AppError(500, 'Database error occurred');
  }
}

export default pool;