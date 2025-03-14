import { Request, Response, NextFunction } from 'express';
import sanitize from 'sanitize-html';
import { AppError } from './errorHandler';

const sanitizeOptions: sanitize.IOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No HTML attributes allowed
  disallowedTagsMode: 'recursiveEscape' as sanitize.DisallowedTagsModes
};

// Helper to deeply sanitize an object's string values
function deepSanitize(obj: any): any {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip password fields completely
      if (key === 'password') {
        sanitized[key] = value;
      } else {
        sanitized[key] = deepSanitize(value);
      }
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitize(obj, sanitizeOptions);
  }
  
  return obj;
}

export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
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
  } catch (error) {
    console.error('Input sanitization error:', error);
    next(new AppError(400, 'Invalid input data'));
  }
}