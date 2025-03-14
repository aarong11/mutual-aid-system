import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const requestTimeout = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Don't apply timeout to long-polling endpoints if we add any in the future
    if (req.path.includes('/stream') || req.path.includes('/events')) {
      return next();
    }

    const timeoutId = setTimeout(() => {
      const error = new AppError(408, 'Request timeout');
      next(error);
    }, timeout);

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    // Clear timeout if request is aborted
    req.on('close', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};