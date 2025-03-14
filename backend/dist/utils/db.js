"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = executeQuery;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("../middlewares/errorHandler");
dotenv_1.default.config();
const pool = promise_1.default.createPool({
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
process.on('unhandledRejection', (err) => {
    if (err.message.includes('pool')) {
        console.error('Database pool error:', err);
        process.exit(1);
    }
});
// Wrapper for database queries with error handling
async function executeQuery(query, params) {
    try {
        const [results] = await pool.query(query, params);
        return results;
    }
    catch (error) {
        console.error('Database query error:', {
            query,
            params,
            error: error.message
        });
        if (error.code === 'ER_DUP_ENTRY') {
            throw new errorHandler_1.AppError(409, 'Record already exists');
        }
        if (error.code === 'ER_NO_REFERENCED_ROW') {
            throw new errorHandler_1.AppError(400, 'Referenced record does not exist');
        }
        if (error.code === 'ER_DATA_TOO_LONG') {
            throw new errorHandler_1.AppError(400, 'Data too long for one or more fields');
        }
        throw new errorHandler_1.AppError(500, 'Database error occurred');
    }
}
exports.default = pool;
