import express from 'express';
import { authController } from '../controllers/authController';
import { authValidation } from '../middlewares/validation';
import { handleValidation } from '../middlewares/validationHandler';
import { authLimiter } from '../middlewares/auth';

const router = express.Router();

router.post('/login',
  authLimiter,
  authValidation.login,
  handleValidation,
  authController.login
);

router.post('/register',
  authLimiter,
  authValidation.register,
  handleValidation,
  authController.register
);

export default router;