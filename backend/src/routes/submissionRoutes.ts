import express from 'express';
import { submissionController } from '../controllers/submissionController';
import { authenticateCoordinator } from '../middlewares/auth';
import { submissionValidation, validateBulkSubmissions } from '../middlewares/validation';
import { handleValidation } from '../middlewares/validationHandler';

const router = express.Router();

// Public routes
router.get('/', submissionController.getVerifiedSubmissions);
router.post('/', 
  submissionValidation.create,
  handleValidation,
  submissionController.createSubmission
);

// Protected routes (coordinator only)
router.get('/pending', 
  authenticateCoordinator,
  submissionController.getPendingSubmissions
);

router.patch('/:id', 
  authenticateCoordinator,
  submissionValidation.updateStatus,
  handleValidation,
  submissionController.updateSubmissionStatus
);

// Bulk submission route (coordinator only)
router.post('/bulk', 
  authenticateCoordinator,
  validateBulkSubmissions,
  handleValidation,
  submissionController.createBulkSubmissions
);

export default router;