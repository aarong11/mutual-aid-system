import { Request, Response, NextFunction } from 'express';
import { executeQuery } from '../utils/db';
import { ResourceType, Submission, SubmissionStatus } from '../types';
import { AppError } from '../middlewares/errorHandler';
import { 
  isString, 
  isResourceType, 
  isSubmissionStatus,
  isValidZipCode
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
      const result = await executeQuery<{ insertId: number }>(
        `INSERT INTO submissions 
         (address, zip_code, resource_type, description, contact_info, status, submitted_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          address, 
          zip_code, 
          resource_type, 
          description, 
          contact_info || null, 
          SubmissionStatus.PENDING,
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

    if (!isSubmissionStatus(status)) {
      throw new AppError(400, 'Invalid submission status');
    }

    try {
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
  },

  async createBulkSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const submissions = req.body;
      
      if (!Array.isArray(submissions)) {
        return res.status(400).json({ error: 'Request body must be an array of submissions' });
      }

      const requiredFields = ['address', 'zip_code', 'resource_type', 'description'];
      const failedSubmissions: { index: number; address: string; reason: string }[] = [];
      const successfulResults: any[] = [];
      
      submissions.forEach((submission, index) => {
        try {
          const missingFields = requiredFields.filter(field => !submission[field]);
          if (missingFields.length > 0) {
            failedSubmissions.push({
              index,
              address: submission.address || 'N/A',
              reason: `Missing required fields: ${missingFields.join(', ')}`
            });
            return;
          }

          if (!isString(submission.address)) {
            failedSubmissions.push({
              index,
              address: String(submission.address) || 'N/A',
              reason: 'Address must be a string'
            });
            return;
          }

          if (!isValidZipCode(submission.zip_code)) {
            failedSubmissions.push({
              index,
              address: submission.address,
              reason: 'Invalid zip code format. Must be 5 digits or 5+4 format'
            });
            return;
          }

          if (!isResourceType(submission.resource_type)) {
            failedSubmissions.push({
              index,
              address: submission.address,
              reason: `Invalid resource type. Must be one of: ${Object.values(ResourceType).join(', ')}`
            });
            return;
          }

          if (!isString(submission.description)) {
            failedSubmissions.push({
              index,
              address: submission.address,
              reason: 'Description must be a string'
            });
            return;
          }

          if (submission.contact_info !== undefined && !isString(submission.contact_info)) {
            failedSubmissions.push({
              index,
              address: submission.address,
              reason: 'Contact info must be a string if provided'
            });
            return;
          }
          
          successfulResults.push({
            address: submission.address,
            zip_code: submission.zip_code,
            resource_type: submission.resource_type,
            description: submission.description,
            contact_info: submission.contact_info || null,
            status: SubmissionStatus.PENDING,
            submitted_by: null
          });
        } catch (error) {
          console.error('Error processing submission:', error);
          failedSubmissions.push({
            index,
            address: submission.address || 'N/A',
            reason: error instanceof Error ? error.message : 'Unexpected error processing submission'
          });
        }
      });

      if (successfulResults.length === 0) {
        return res.status(400).json({
          message: 'No submissions were successful',
          failedSubmissions
        });
      }
  
      const values = successfulResults.map(result => [
        result.address,
        result.zip_code,
        result.resource_type,
        result.description,
        result.contact_info,
        result.status,
        result.submitted_by
      ]);

      try {
        const insertQuery = `
          INSERT INTO submissions 
          (address, zip_code, resource_type, description, contact_info, status, submitted_by)
          VALUES ?
        `;
        await executeQuery(insertQuery, [values]);

        res.status(201).json({
          message: 'Bulk submissions processed',
          successful: successfulResults.length,
          failed: failedSubmissions.length,
          failedSubmissions: failedSubmissions
        });
      } catch (dbError) {
        console.error('Database insertion error:', dbError);
        throw new AppError(500, 'Failed to save successful submissions to database');
      }
    } catch (error) {
      console.error('Bulk submission error:', error);
      next(new AppError(500, 'Failed to process bulk submissions'));
    }
  }
};