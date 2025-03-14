"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBulkSubmissions = exports.authValidation = exports.submissionValidation = void 0;
const express_validator_1 = require("express-validator");
const types_1 = require("../types");
exports.submissionValidation = {
    create: [
        (0, express_validator_1.body)('address')
            .trim()
            .notEmpty()
            .withMessage('Address is required')
            .isLength({ max: 255 })
            .withMessage('Address must be less than 255 characters'),
        (0, express_validator_1.body)('zip_code')
            .trim()
            .notEmpty()
            .withMessage('ZIP code is required')
            .matches(/^\d{5}(-\d{4})?$/)
            .withMessage('Invalid ZIP code format'),
        (0, express_validator_1.body)('resource_type')
            .trim()
            .notEmpty()
            .withMessage('Resource type is required')
            .isIn(Object.values(types_1.ResourceType))
            .withMessage('Invalid resource type'),
        (0, express_validator_1.body)('description')
            .trim()
            .notEmpty()
            .withMessage('Description is required')
            .isLength({ max: 1000 })
            .withMessage('Description must be less than 1000 characters'),
        (0, express_validator_1.body)('contact_info')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Contact info must be less than 255 characters')
    ],
    updateStatus: [
        (0, express_validator_1.param)('id')
            .isInt()
            .withMessage('Invalid submission ID'),
        (0, express_validator_1.body)('status')
            .trim()
            .notEmpty()
            .withMessage('Status is required')
            .isIn(Object.values(types_1.SubmissionStatus))
            .withMessage('Invalid status')
    ]
};
exports.authValidation = {
    login: [
        (0, express_validator_1.body)('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required'),
        (0, express_validator_1.body)('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
    ],
    register: [
        (0, express_validator_1.body)('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required')
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_-]+$/)
            .withMessage('Username can only contain letters, numbers, underscores and dashes'),
        (0, express_validator_1.body)('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Must be a valid email address'),
        (0, express_validator_1.body)('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    ]
};
exports.validateBulkSubmissions = [
    (0, express_validator_1.body)().isArray().withMessage('Request body must be an array of submissions'),
    (0, express_validator_1.body)('*.address').trim().notEmpty().withMessage('Address is required'),
    (0, express_validator_1.body)('*.zip_code')
        .matches(/^\d{5}(-\d{4})?$/)
        .withMessage('ZIP code must be in format: 12345 or 12345-6789'),
    (0, express_validator_1.body)('*.resource_type')
        .isIn(Object.values(types_1.ResourceType))
        .withMessage('Resource type must be a valid resource type'),
    (0, express_validator_1.body)('*.description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),
    (0, express_validator_1.body)('*.contact_info')
        .trim()
        .notEmpty()
        .withMessage('Contact information is required')
];
