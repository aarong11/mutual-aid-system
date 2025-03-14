"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidation = void 0;
const express_validator_1 = require("express-validator");
function formatValidationErrors(errors) {
    return {
        status: 'error',
        message: 'Validation failed',
        errors: errors.map(err => ({
            field: err.type,
            value: err.msg,
            message: err.msg
        }))
    };
}
const handleValidation = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = formatValidationErrors(errors.array());
        // Log validation errors with request context
        console.warn('Validation failed:', {
            requestId: req.id,
            path: req.path,
            method: req.method,
            errors: formattedErrors.errors,
            body: req.body
        });
        return res.status(400).json(formattedErrors);
    }
    next();
};
exports.handleValidation = handleValidation;
