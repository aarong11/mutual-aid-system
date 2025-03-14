"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function logError(err, req) {
    const errorContext = {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        query: req.query,
        body: req.body,
        user: req.user?.id,
        headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip
        },
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack,
            ...(err instanceof AppError && {
                statusCode: err.statusCode,
                isOperational: err.isOperational
            })
        }
    };
    if (err instanceof AppError && err.isOperational) {
        console.warn('Operational error:', errorContext);
    }
    else {
        console.error('Unexpected error:', errorContext);
    }
}
const errorHandler = (err, req, res, next) => {
    // Log error with context
    logError(err, req);
    // Handle AppError instances
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        });
    }
    // Handle unknown errors
    const isProd = process.env.NODE_ENV === 'production';
    const statusCode = 500;
    return res.status(statusCode).json({
        status: 'error',
        message: isProd ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
exports.errorHandler = errorHandler;
