import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

function logError(err: Error | AppError, req: Request) {
  const errorContext = {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    user: req.user?.id,
    headers: {
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.ip
    },
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err instanceof AppError && {
        statusCode: err.statusCode,
        isOperational: err.isOperational
      })
    }
  };

  if (err instanceof AppError && err.isOperational) {
    console.warn('Operational error:', errorContext);
  } else {
    console.error('Unexpected error:', errorContext);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with context
  logError(err, req);

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  // Handle unknown errors
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = 500;
  
  return res.status(statusCode).json({
    status: 'error',
    message: isProd ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};