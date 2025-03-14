import { Request, Response } from 'express';
import { executeQuery } from '../utils/db';
import { ResourceType, Submission, SubmissionStatus } from '../types';
import { geocodeAddress } from '../services/geocodingService';
import { AppError } from '../middlewares/errorHandler';
import { 
  isString, 
  isResourceType, 
  isSubmissionStatus,
  isValidZipCode,
  isValidLatitude,
  isValidLongitude 
} from '../utils/typeGuards';

interface SubmissionRow extends Submission {
  id: number;
}

export const submissionController = {
  async getVerifiedSubmissions(req: Request, res: Response) {
    try {
      const rows = await executeQuery<SubmissionRow[]>(
        'SELECT * FROM submissions WHERE status = ?',
        [SubmissionStatus.VERIFIED]
      );
      res.json(rows);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to fetch verified submissions');
    }
  },

  async getPendingSubmissions(req: Request, res: Response) {
    try {
      const rows = await executeQuery<SubmissionRow[]>(
        'SELECT * FROM submissions WHERE status = ? ORDER BY submitted_at DESC',
        [SubmissionStatus.PENDING]
      );
      res.json(rows);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to fetch pending submissions');
    }
  },

  async createSubmission(req: Request, res: Response) {
    const { address, zip_code, resource_type, description, contact_info } = req.body;
    const userId = req.user?.id;

    // Runtime type checking
    if (!isString(address)) {
      throw new AppError(400, 'Address must be a string');
    }
    if (!isValidZipCode(zip_code)) {
      throw new AppError(400, 'Invalid ZIP code format');
    }
    if (!isResourceType(resource_type)) {
      throw new AppError(400, 'Invalid resource type');
    }
    if (!isString(description)) {
      throw new AppError(400, 'Description must be a string');
    }
    if (contact_info !== undefined && !isString(contact_info)) {
      throw new AppError(400, 'Contact info must be a string if provided');
    }

    try {
      // Geocode the address
      const location = await geocodeAddress(address, zip_code);
      
      if (!location) {
        throw new AppError(400, 'Could not geocode address. Please verify the address is correct.');
      }

      // Validate geocoded coordinates
      if (!isValidLatitude(location.lat) || !isValidLongitude(location.lon)) {
        throw new AppError(500, 'Received invalid coordinates from geocoding service');
      }

      const result = await executeQuery<{ insertId: number }>(
        `INSERT INTO submissions 
         (address, zip_code, resource_type, description, contact_info, status, latitude, longitude, submitted_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          address, 
          zip_code, 
          resource_type, 
          description, 
          contact_info || null, 
          SubmissionStatus.PENDING,
          location.lat,
          location.lon,
          userId || null
        ]
      );
      
      res.status(201).json({ 
        message: 'Submission created successfully',
        id: result.insertId 
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to create submission');
    }
  },

  async updateSubmissionStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    // Runtime type checking
    if (!isSubmissionStatus(status)) {
      throw new AppError(400, 'Invalid submission status');
    }

    try {
      // First check if submission exists
      const existing = await executeQuery<SubmissionRow[]>(
        'SELECT id FROM submissions WHERE id = ?',
        [id]
      );

      if (!existing.length) {
        throw new AppError(404, 'Submission not found');
      }

      await executeQuery(
        'UPDATE submissions SET status = ?, verified_at = ? WHERE id = ?',
        [status, status === SubmissionStatus.VERIFIED ? new Date() : null, id]
      );
      
      res.json({ 
        message: 'Submission status updated successfully',
        status: status
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to update submission status');
    }
  }
};