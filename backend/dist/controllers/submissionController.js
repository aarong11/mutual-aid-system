"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionController = void 0;
const db_1 = require("../utils/db");
const types_1 = require("../types");
const geocodingService_1 = require("../services/geocodingService");
const errorHandler_1 = require("../middlewares/errorHandler");
const typeGuards_1 = require("../utils/typeGuards");
exports.submissionController = {
    async getVerifiedSubmissions(req, res) {
        try {
            const rows = await (0, db_1.executeQuery)('SELECT * FROM submissions WHERE status = ?', [types_1.SubmissionStatus.VERIFIED]);
            res.json(rows);
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Failed to fetch verified submissions');
        }
    },
    async getPendingSubmissions(req, res) {
        try {
            const rows = await (0, db_1.executeQuery)('SELECT * FROM submissions WHERE status = ? ORDER BY submitted_at DESC', [types_1.SubmissionStatus.PENDING]);
            res.json(rows);
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Failed to fetch pending submissions');
        }
    },
    async createSubmission(req, res) {
        const { address, zip_code, resource_type, description, contact_info } = req.body;
        const userId = req.user?.id;
        // Runtime type checking
        if (!(0, typeGuards_1.isString)(address)) {
            throw new errorHandler_1.AppError(400, 'Address must be a string');
        }
        if (!(0, typeGuards_1.isValidZipCode)(zip_code)) {
            throw new errorHandler_1.AppError(400, 'Invalid ZIP code format');
        }
        if (!(0, typeGuards_1.isResourceType)(resource_type)) {
            throw new errorHandler_1.AppError(400, 'Invalid resource type');
        }
        if (!(0, typeGuards_1.isString)(description)) {
            throw new errorHandler_1.AppError(400, 'Description must be a string');
        }
        if (contact_info !== undefined && !(0, typeGuards_1.isString)(contact_info)) {
            throw new errorHandler_1.AppError(400, 'Contact info must be a string if provided');
        }
        try {
            // Geocode the address
            const location = await (0, geocodingService_1.geocodeAddress)(address, zip_code);
            if (!location) {
                throw new errorHandler_1.AppError(400, 'Could not geocode address. Please verify the address is correct.');
            }
            // Validate geocoded coordinates
            if (!(0, typeGuards_1.isValidLatitude)(location.lat) || !(0, typeGuards_1.isValidLongitude)(location.lon)) {
                throw new errorHandler_1.AppError(500, 'Received invalid coordinates from geocoding service');
            }
            const result = await (0, db_1.executeQuery)(`INSERT INTO submissions 
         (address, zip_code, resource_type, description, contact_info, status, latitude, longitude, submitted_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                address,
                zip_code,
                resource_type,
                description,
                contact_info || null,
                types_1.SubmissionStatus.PENDING,
                location.lat,
                location.lon,
                userId || null
            ]);
            res.status(201).json({
                message: 'Submission created successfully',
                id: result.insertId
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Failed to create submission');
        }
    },
    async updateSubmissionStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        // Runtime type checking
        if (!(0, typeGuards_1.isSubmissionStatus)(status)) {
            throw new errorHandler_1.AppError(400, 'Invalid submission status');
        }
        try {
            // First check if submission exists
            const existing = await (0, db_1.executeQuery)('SELECT id FROM submissions WHERE id = ?', [id]);
            if (!existing.length) {
                throw new errorHandler_1.AppError(404, 'Submission not found');
            }
            await (0, db_1.executeQuery)('UPDATE submissions SET status = ?, verified_at = ? WHERE id = ?', [status, status === types_1.SubmissionStatus.VERIFIED ? new Date() : null, id]);
            res.json({
                message: 'Submission status updated successfully',
                status: status
            });
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError)
                throw error;
            throw new errorHandler_1.AppError(500, 'Failed to update submission status');
        }
    }
};
