"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInputs = void 0;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const errorHandler_1 = require("./errorHandler");
const sanitizeOptions = {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No HTML attributes allowed
    disallowedTagsMode: 'recursiveEscape'
};
// Helper to deeply sanitize an object's string values
function deepSanitize(obj) {
    if (!obj)
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            // Skip password fields completely
            if (key === 'password') {
                sanitized[key] = value;
            }
            else {
                sanitized[key] = deepSanitize(value);
            }
        }
        return sanitized;
    }
    if (typeof obj === 'string') {
        return (0, sanitize_html_1.default)(obj, sanitizeOptions);
    }
    return obj;
}
const sanitizeInputs = (req, res, next) => {
    try {
        // Sanitize body
        if (req.body) {
            req.body = deepSanitize(req.body);
        }
        // Sanitize query parameters
        if (req.query) {
            req.query = deepSanitize(req.query);
        }
        // Sanitize URL parameters
        if (req.params) {
            req.params = deepSanitize(req.params);
        }
        next();
    }
    catch (error) {
        console.error('Input sanitization error:', error);
        next(new errorHandler_1.AppError(400, 'Invalid input data'));
    }
};
exports.sanitizeInputs = sanitizeInputs;
