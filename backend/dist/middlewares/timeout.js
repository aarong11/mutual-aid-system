"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = void 0;
const errorHandler_1 = require("./errorHandler");
const requestTimeout = (timeout = 30000) => {
    return (req, res, next) => {
        // Don't apply timeout to long-polling endpoints if we add any in the future
        if (req.path.includes('/stream') || req.path.includes('/events')) {
            return next();
        }
        const timeoutId = setTimeout(() => {
            const error = new errorHandler_1.AppError(408, 'Request timeout');
            next(error);
        }, timeout);
        // Clear timeout when response is sent
        res.on('finish', () => {
            clearTimeout(timeoutId);
        });
        // Clear timeout if request is aborted
        req.on('close', () => {
            clearTimeout(timeoutId);
        });
        next();
    };
};
exports.requestTimeout = requestTimeout;
