"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../utils/db");
const errorHandler_1 = require("../middlewares/errorHandler");
const typeGuards_1 = require("../utils/typeGuards");
const BCRYPT_WORK_FACTOR = 12; // Higher value = more secure but slower
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes
// Track login attempts
const loginAttempts = new Map();
// Clean up old login attempts periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of loginAttempts.entries()) {
        if (now - value.firstAttempt > LOGIN_WINDOW) {
            loginAttempts.delete(key);
        }
    }
}, 5 * 60 * 1000); // Clean every 5 minutes
exports.authController = {
    async login(req, res) {
        const { username, password } = req.body;
        const ipAddress = (req.ip || 'unknown-ip');
        // Runtime type checking
        if (!(0, typeGuards_1.isString)(username) || !(0, typeGuards_1.isString)(password)) {
            throw new errorHandler_1.AppError(400, 'Invalid username or password format');
        }
        try {
            // Check login attempts
            const attempts = loginAttempts.get(ipAddress) || { count: 0, firstAttempt: Date.now() };
            if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
                if (Date.now() - attempts.firstAttempt < LOGIN_WINDOW) {
                    throw new errorHandler_1.AppError(429, 'Too many login attempts. Please try again later.');
                }
                else {
                    // Reset if window has expired
                    loginAttempts.delete(ipAddress);
                }
            }
            const users = await (0, db_1.executeQuery)('SELECT * FROM users WHERE username = ?', [username]);
            const user = users[0];
            if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
                // Track failed attempt
                loginAttempts.set(ipAddress, {
                    count: attempts.count + 1,
                    firstAttempt: attempts.firstAttempt
                });
                throw new errorHandler_1.AppError(401, 'Invalid username or password');
            }
            // Clear login attempts on successful login
            loginAttempts.delete(ipAddress);
            if (!process.env.JWT_SECRET) {
                throw new errorHandler_1.AppError(500, 'JWT secret not configured');
            }
            const token = jsonwebtoken_1.default.sign({
                id: user.id,
                role: user.role,
                username: user.username // Include for logging purposes
            }, process.env.JWT_SECRET, {
                expiresIn: '24h',
                audience: 'mutual-aid-app',
                issuer: 'mutual-aid-auth'
            });
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            console.error('Login error:', error);
            throw new errorHandler_1.AppError(500, 'An error occurred during login');
        }
    },
    async register(req, res) {
        const { username, email, password } = req.body;
        // Runtime type checking
        if (!(0, typeGuards_1.isString)(username)) {
            throw new errorHandler_1.AppError(400, 'Username must be a string');
        }
        if (!(0, typeGuards_1.isValidEmail)(email)) {
            throw new errorHandler_1.AppError(400, 'Invalid email format');
        }
        if (!(0, typeGuards_1.isString)(password) || password.length < 8) {
            throw new errorHandler_1.AppError(400, 'Password must be a string at least 8 characters long');
        }
        try {
            // Check if username or email already exists
            const existing = await (0, db_1.executeQuery)('SELECT username, email FROM users WHERE username = ? OR email = ?', [username, email]);
            if (existing.length > 0) {
                if (existing[0].username === username) {
                    throw new errorHandler_1.AppError(409, 'Username already exists');
                }
                throw new errorHandler_1.AppError(409, 'Email already exists');
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, BCRYPT_WORK_FACTOR);
            const result = await (0, db_1.executeQuery)(`INSERT INTO users (username, email, password, role) 
         VALUES (?, ?, ?, 'contributor')`, [username, email, hashedPassword]);
            res.status(201).json({
                message: 'User registered successfully',
                userId: result.insertId
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            console.error('Registration error:', error);
            throw new errorHandler_1.AppError(500, 'An error occurred during registration');
        }
    }
};
