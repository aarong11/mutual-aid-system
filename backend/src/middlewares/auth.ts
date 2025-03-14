import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { UserRole } from '../types';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: UserRole;
      };
    }
  }
}

// Rate limiter for authentication attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

export const authenticateCoordinator = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError(401, 'Authentication required');
    }

    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      throw new AppError(401, 'Invalid authorization format');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number; role: UserRole };

      if (!decoded.id || !decoded.role) {
        throw new AppError(401, 'Invalid token format');
      }

      if (decoded.role !== UserRole.COORDINATOR && decoded.role !== UserRole.ADMIN) {
        throw new AppError(403, 'Insufficient permissions');
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid token');
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Internal server error during authentication' });
    }
  }
};