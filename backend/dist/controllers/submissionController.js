"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionController = void 0;
const db_1 = require("../utils/db");
const types_1 = require("../types");
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
            const result = await (0, db_1.executeQuery)(`INSERT INTO submissions 
         (address, zip_code, resource_type, description, contact_info, status, submitted_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                address,
                zip_code,
                resource_type,
                description,
                contact_info || null,
                types_1.SubmissionStatus.PENDING,
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
        if (!(0, typeGuards_1.isSubmissionStatus)(status)) {
            throw new errorHandler_1.AppError(400, 'Invalid submission status');
        }
        try {
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
    },
    async createBulkSubmissions(req, res, next) {
        try {
            const submissions = req.body;
            if (!Array.isArray(submissions)) {
                return res.status(400).json({ error: 'Request body must be an array of submissions' });
            }
            const requiredFields = ['address', 'zip_code', 'resource_type', 'description'];
            const failedSubmissions = [];
            const successfulResults = [];
            submissions.forEach((submission, index) => {
                try {
                    const missingFields = requiredFields.filter(field => !submission[field]);
                    if (missingFields.length > 0) {
                        failedSubmissions.push({
                            index,
                            address: submission.address || 'N/A',
                            reason: `Missing required fields: ${missingFields.join(', ')}`
                        });
                        return;
                    }
                    if (!(0, typeGuards_1.isString)(submission.address)) {
                        failedSubmissions.push({
                            index,
                            address: String(submission.address) || 'N/A',
                            reason: 'Address must be a string'
                        });
                        return;
                    }
                    if (!(0, typeGuards_1.isValidZipCode)(submission.zip_code)) {
                        failedSubmissions.push({
                            index,
                            address: submission.address,
                            reason: 'Invalid zip code format. Must be 5 digits or 5+4 format'
                        });
                        return;
                    }
                    if (!(0, typeGuards_1.isResourceType)(submission.resource_type)) {
                        failedSubmissions.push({
                            index,
                            address: submission.address,
                            reason: `Invalid resource type. Must be one of: ${Object.values(types_1.ResourceType).join(', ')}`
                        });
                        return;
                    }
                    if (!(0, typeGuards_1.isString)(submission.description)) {
                        failedSubmissions.push({
                            index,
                            address: submission.address,
                            reason: 'Description must be a string'
                        });
                        return;
                    }
                    if (submission.contact_info !== undefined && !(0, typeGuards_1.isString)(submission.contact_info)) {
                        failedSubmissions.push({
                            index,
                            address: submission.address,
                            reason: 'Contact info must be a string if provided'
                        });
                        return;
                    }
                    successfulResults.push({
                        address: submission.address,
                        zip_code: submission.zip_code,
                        resource_type: submission.resource_type,
                        description: submission.description,
                        contact_info: submission.contact_info || null,
                        status: types_1.SubmissionStatus.PENDING,
                        submitted_by: null
                    });
                }
                catch (error) {
                    console.error('Error processing submission:', error);
                    failedSubmissions.push({
                        index,
                        address: submission.address || 'N/A',
                        reason: error instanceof Error ? error.message : 'Unexpected error processing submission'
                    });
                }
            });
            if (successfulResults.length === 0) {
                return res.status(400).json({
                    message: 'No submissions were successful',
                    failedSubmissions
                });
            }
            const values = successfulResults.map(result => [
                result.address,
                result.zip_code,
                result.resource_type,
                result.description,
                result.contact_info,
                result.status,
                result.submitted_by
            ]);
            try {
                const insertQuery = `
          INSERT INTO submissions 
          (address, zip_code, resource_type, description, contact_info, status, submitted_by)
          VALUES ?
        `;
                await (0, db_1.executeQuery)(insertQuery, [values]);
                res.status(201).json({
                    message: 'Bulk submissions processed',
                    successful: successfulResults.length,
                    failed: failedSubmissions.length,
                    failedSubmissions: failedSubmissions
                });
            }
            catch (dbError) {
                console.error('Database insertion error:', dbError);
                throw new errorHandler_1.AppError(500, 'Failed to save successful submissions to database');
            }
        }
        catch (error) {
            console.error('Bulk submission error:', error);
            next(new errorHandler_1.AppError(500, 'Failed to process bulk submissions'));
        }
    }
};
