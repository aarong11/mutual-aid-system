import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';
import { AppError } from './errorHandler';

interface ValidationResponse {
  status: string;
  message: string;
  errors: {
    field: string;
    value: any;
    message: string;
  }[];
}

function formatValidationErrors(errors: ValidationError[]): ValidationResponse {
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

export const handleValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
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