import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { executeQuery } from '../utils/db';
import { User } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { isString, isValidEmail } from '../utils/typeGuards';

interface UserRow extends User, RowDataPacket {}

const BCRYPT_WORK_FACTOR = 12; // Higher value = more secure but slower
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes

// Track login attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

// Clean up old login attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (now - value.firstAttempt > LOGIN_WINDOW) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

export const authController = {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const ipAddress = (req.ip || 'unknown-ip') as string;

    // Runtime type checking
    if (!isString(username) || !isString(password)) {
      throw new AppError(400, 'Invalid username or password format');
    }

    try {
      // Check login attempts
      const attempts = loginAttempts.get(ipAddress) || { count: 0, firstAttempt: Date.now() };
      
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        if (Date.now() - attempts.firstAttempt < LOGIN_WINDOW) {
          throw new AppError(429, 'Too many login attempts. Please try again later.');
        } else {
          // Reset if window has expired
          loginAttempts.delete(ipAddress);
        }
      }

      const users = await executeQuery<UserRow[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      const user = users[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        // Track failed attempt
        loginAttempts.set(ipAddress, {
          count: attempts.count + 1,
          firstAttempt: attempts.firstAttempt
        });
        
        throw new AppError(401, 'Invalid username or password');
      }

      // Clear login attempts on successful login
      loginAttempts.delete(ipAddress);

      if (!process.env.JWT_SECRET) {
        throw new AppError(500, 'JWT secret not configured');
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role,
          username: user.username // Include for logging purposes
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: '24h',
          audience: 'mutual-aid-app',
          issuer: 'mutual-aid-auth'
        }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Login error:', error);
      throw new AppError(500, 'An error occurred during login');
    }
  },

  async register(req: Request, res: Response) {
    const { username, email, password } = req.body;

    // Runtime type checking
    if (!isString(username)) {
      throw new AppError(400, 'Username must be a string');
    }
    if (!isValidEmail(email)) {
      throw new AppError(400, 'Invalid email format');
    }
    if (!isString(password) || password.length < 8) {
      throw new AppError(400, 'Password must be a string at least 8 characters long');
    }

    try {
      // Check if username or email already exists
      const existing = await executeQuery<UserRow[]>(
        'SELECT username, email FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existing.length > 0) {
        if (existing[0].username === username) {
          throw new AppError(409, 'Username already exists');
        }
        throw new AppError(409, 'Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      
      const result = await executeQuery<{ insertId: number }>(
        `INSERT INTO users (username, email, password, role) 
         VALUES (?, ?, ?, 'contributor')`,
        [username, email, hashedPassword]
      );

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.insertId
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Registration error:', error);
      throw new AppError(500, 'An error occurred during registration');
    }
  }
};