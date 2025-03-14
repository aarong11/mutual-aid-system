"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const submissionRoutes_1 = __importDefault(require("./routes/submissionRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const requestLogger_1 = require("./middlewares/requestLogger");
const timeout_1 = require("./middlewares/timeout");
const db_1 = __importDefault(require("./utils/db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3002;
let server;
// Body parsing middleware - must be before other middleware that needs the body
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Global timeout (15 seconds)
app.use((0, timeout_1.requestTimeout)(15000));
// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger_1.requestLogger);
}
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://nominatim.openstreetmap.org"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/submissions', submissionRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Handle 404s
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});
// Error handling
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    // Close database pool
    try {
        await db_1.default.end();
        console.log('Database pool closed');
    }
    catch (err) {
        console.error('Error closing database pool:', err);
    }
    // Close server
    if (server) {
        server.close(() => {
            console.log('HTTP server closed');
            process.exit(0);
        });
        // Force close after 30 seconds
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 30000);
    }
    else {
        process.exit(0);
    }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
// Test database connection and start server
const startServer = async () => {
    try {
        await db_1.default.query('SELECT 1');
        console.log('Database connection successful');
        server = app.listen(port, () => {
            console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
        });
        // Handle server errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }
            switch (error.code) {
                case 'EACCES':
                    console.error(`Port ${port} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`Port ${port} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
    }
    catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};
startServer();
