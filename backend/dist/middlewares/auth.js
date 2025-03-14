"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateCoordinator = exports.authLimiter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const types_1 = require("../types");
const errorHandler_1 = require("./errorHandler");
// Rate limiter for authentication attempts
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
});
const authenticateCoordinator = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errorHandler_1.AppError(401, 'Authentication required');
        }
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            throw new errorHandler_1.AppError(401, 'Invalid authorization format');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (!decoded.id || !decoded.role) {
                throw new errorHandler_1.AppError(401, 'Invalid token format');
            }
            if (decoded.role !== types_1.UserRole.COORDINATOR && decoded.role !== types_1.UserRole.ADMIN) {
                throw new errorHandler_1.AppError(403, 'Insufficient permissions');
            }
            req.user = decoded;
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errorHandler_1.AppError(401, 'Token has expired');
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errorHandler_1.AppError(401, 'Invalid token');
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            res.status(error.statusCode).json({ error: error.message });
        }
        else {
            console.error('Authentication error:', error);
            res.status(500).json({ error: 'Internal server error during authentication' });
        }
    }
};
exports.authenticateCoordinator = authenticateCoordinator;
