import { body, param, ValidationChain } from 'express-validator';
import { ResourceType, SubmissionStatus } from '../types';

export const submissionValidation = {
  create: [
    body('address')
      .trim()
      .notEmpty()
      .withMessage('Address is required')
      .isLength({ max: 255 })
      .withMessage('Address must be less than 255 characters'),
    
    body('zip_code')
      .trim()
      .notEmpty()
      .withMessage('ZIP code is required')
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage('Invalid ZIP code format'),
    
    body('resource_type')
      .trim()
      .notEmpty()
      .withMessage('Resource type is required')
      .isIn(Object.values(ResourceType))
      .withMessage('Invalid resource type'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    
    body('contact_info')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Contact info must be less than 255 characters')
  ],

  updateStatus: [
    param('id')
      .isInt()
      .withMessage('Invalid submission ID'),
    
    body('status')
      .trim()
      .notEmpty()
      .withMessage('Status is required')
      .isIn(Object.values(SubmissionStatus))
      .withMessage('Invalid status')
  ]
};

export const authValidation = {
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
  ],

  register: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores and dashes'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Must be a valid email address'),
    
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ]
};