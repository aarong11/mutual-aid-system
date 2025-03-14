import * as fs from 'fs';
import * as path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeDatabase(attempt = 1): Promise<void> {
  let connection;
  try {
    // First create connection without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      connectTimeout: 10000, // 10 second timeout
    });

    console.log('Connected to MySQL server');

    try {
      // Create and use database
      await connection.query('CREATE DATABASE IF NOT EXISTS mutual_aid');
      await connection.query('USE mutual_aid');
    } catch (dbError) {
      console.error('Error creating/using database:', dbError);
      throw dbError;
    }

    try {
      // Read and execute schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Split the schema into individual statements
      const statements = schema
        .split(';')
        .filter(statement => statement.trim().length > 0);

      // Execute each statement
      for (const statement of statements) {
        try {
          await connection.query(statement + ';');
        } catch (statementError: any) {
          // Log the specific statement that failed
          console.error('Error executing statement:', {
            statement,
            error: statementError.message
          });
          throw statementError;
        }
      }

      console.log('Database schema created successfully');
    } catch (schemaError) {
      console.error('Error executing schema:', schemaError);
      throw schemaError;
    }

    try {
      // Create a test coordinator account if it doesn't exist
      const testCoordinator = {
        username: 'coordinator',
        // In production, this should be randomly generated and securely communicated
        password: '$2a$10$xk9kM9qvn8RyKxQX9VZ0W.1wz9hH9GMX.ZTzwjV0F0jW7TpX8ZjI2', // "password123"
        email: 'coordinator@example.com',
        role: 'coordinator'
      };

      await connection.query(`
        INSERT INTO users (username, password, email, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        email = VALUES(email),
        role = VALUES(role)
      `, [testCoordinator.username, testCoordinator.password, testCoordinator.email, testCoordinator.role]);

      console.log('Test coordinator account configured');
      console.log('Username: coordinator');
      console.log('Password: password123');
    } catch (userError) {
      console.error('Error configuring test coordinator:', userError);
      throw userError;
    }
  } catch (error) {
    console.error(`Database initialization attempt ${attempt} failed:`, error);
    
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await sleep(RETRY_DELAY);
      return initializeDatabase(attempt + 1);
    }
    
    console.error('Max retries reached. Database initialization failed.');
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM. Cleaning up...');
  process.exit(0);
});

// Start initialization
initializeDatabase().catch(error => {
  console.error('Unhandled error during database initialization:', error);
  process.exit(1);
});