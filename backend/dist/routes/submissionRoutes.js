"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const submissionController_1 = require("../controllers/submissionController");
const auth_1 = require("../middlewares/auth");
const validation_1 = require("../middlewares/validation");
const validationHandler_1 = require("../middlewares/validationHandler");
const router = express_1.default.Router();
// Public routes
router.get('/', submissionController_1.submissionController.getVerifiedSubmissions);
router.post('/', validation_1.submissionValidation.create, validationHandler_1.handleValidation, submissionController_1.submissionController.createSubmission);
// Protected routes (coordinator only)
router.get('/pending', auth_1.authenticateCoordinator, submissionController_1.submissionController.getPendingSubmissions);
router.patch('/:id', auth_1.authenticateCoordinator, validation_1.submissionValidation.updateStatus, validationHandler_1.handleValidation, submissionController_1.submissionController.updateSubmissionStatus);
// Bulk submission route (coordinator only)
router.post('/bulk', auth_1.authenticateCoordinator, validation_1.validateBulkSubmissions, validationHandler_1.handleValidation, submissionController_1.submissionController.createBulkSubmissions);
exports.default = router;
