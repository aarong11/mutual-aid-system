import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useAuth } from '../contexts/AuthContext';
import { submissionService } from '../services/submissionService';
import { ResourceType } from '../types';
import Papa from 'papaparse';
import { Navigate } from 'react-router-dom';

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const ImportForm = styled.form`
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FileInput = styled.input`
  margin-right: 1rem;
`;

const UploadButton = styled.button`
  background-color: #2ecc71;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #27ae60;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 1rem;
  margin: 1rem 0;
  background-color: #fdf0ed;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  padding: 1rem;
  margin: 1rem 0;
  background-color: #e8f8f5;
  border-radius: 4px;
`;

const FormatInstructions = styled.div`
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: monospace;
  white-space: pre-wrap;
`;

interface CSVSubmission {
  FullStreetAddress: string;
  ZipCode: string;
  ResourceType: string;
  Description: string;
  ContactInformation: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const REQUIRED_HEADERS = ['FullStreetAddress', 'ZipCode', 'ResourceType', 'Description', 'ContactInformation'];

const validateZipCode = (zipCode: string): boolean => {
  return /^\d{5}(-\d{4})?$/.test(zipCode);
};

const validateResourceType = (type: string): boolean => {
  if (!type) return false;
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');
  return Object.values(ResourceType).includes(normalizedType as ResourceType);
};

const normalizeResourceType = (type: string): ResourceType => {
  return type.toLowerCase().replace(/\s+/g, '_') as ResourceType;
};

export const CsvUpload: React.FC = () => {
  const { isCoordinator } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  if (!isCoordinator) {
    return <Navigate to="/" replace />;
  }

  const validateHeaders = (headers: string[]): string | null => {
    const missingHeaders = REQUIRED_HEADERS.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return `Missing required headers: ${missingHeaders.join(', ')}`;
    }
    return null;
  };

  const validateRow = (row: CSVSubmission, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    const rowNum = rowIndex + 2; // Adding 2 to account for 0-based index and header row

    if (!row.FullStreetAddress?.trim()) {
      errors.push({
        row: rowNum,
        field: 'FullStreetAddress',
        message: 'Street address is required'
      });
    }

    if (!row.ZipCode?.trim()) {
      errors.push({
        row: rowNum,
        field: 'ZipCode',
        message: 'ZIP code is required'
      });
    } else if (!validateZipCode(row.ZipCode.trim())) {
      errors.push({
        row: rowNum,
        field: 'ZipCode',
        message: 'ZIP code must be in format: 12345 or 12345-6789'
      });
    }

    if (!row.ResourceType?.trim()) {
      errors.push({
        row: rowNum,
        field: 'ResourceType',
        message: 'Resource type is required'
      });
    } else if (!validateResourceType(row.ResourceType.trim())) {
      errors.push({
        row: rowNum,
        field: 'ResourceType',
        message: `Resource type must be one of: ${Object.values(ResourceType).join(', ')}`
      });
    }

    if (!row.Description?.trim()) {
      errors.push({
        row: rowNum,
        field: 'Description',
        message: 'Description is required'
      });
    }

    if (!row.ContactInformation?.trim()) {
      errors.push({
        row: rowNum,
        field: 'ContactInformation',
        message: 'Contact information is required'
      });
    }

    return errors;
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }

    // Check file size (10MB limit)
    const TEN_MB = 10 * 1024 * 1024;
    if (file.size > TEN_MB) {
      setError('File size exceeds 10MB limit. Please reduce the file size and try again.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    Papa.parse<CSVSubmission>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const headerError = validateHeaders(results.meta.fields || []);
          if (headerError) {
            throw new Error(headerError);
          }

          // Validate all rows first
          const allErrors: ValidationError[] = [];
          const validSubmissions: CSVSubmission[] = [];

          results.data.forEach((row, index) => {
            const rowErrors = validateRow(row, index);
            if (rowErrors.length > 0) {
              allErrors.push(...rowErrors);
            } else {
              validSubmissions.push({
                FullStreetAddress: row.FullStreetAddress.trim(),
                ZipCode: row.ZipCode.trim(),
                ResourceType: normalizeResourceType(row.ResourceType.trim()),
                Description: row.Description.trim(),
                ContactInformation: row.ContactInformation.trim()
              });
            }
          });

          if (allErrors.length > 0) {
            setValidationErrors(allErrors);
            throw new Error('Please fix the validation errors and try again.');
          }

          if (validSubmissions.length === 0) {
            throw new Error('No valid submissions found in CSV file');
          }

          await submissionService.createBulkSubmissions(validSubmissions);
          setSuccess(`Successfully uploaded ${validSubmissions.length} submissions`);
          fileInput.value = '';
        } catch (err: any) {
          if (err.response?.status === 413) {
            setError('File size is too large. Please reduce the number of entries and try again.');
          } else {
            setError(err.message || 'Failed to upload submissions. Please check the file format.');
          }
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  return (
    <Container>
      <h1>Upload Resource Data</h1>
      <p>Use this form to bulk upload resource locations via CSV file.</p>
      
      <FormatInstructions>
        Required CSV Format:
        FullStreetAddress,ZipCode,ResourceType,Description,ContactInformation
        
        Example:
        FullStreetAddress,ZipCode,ResourceType,Description,ContactInformation
        "123 Main St","12345","food_bank","Free food pantry","contact@example.com"

        Valid ResourceType values: {Object.values(ResourceType).join(', ')}
      </FormatInstructions>

      <ImportForm onSubmit={handleFileUpload}>
        <FileInput 
          type="file" 
          accept=".csv"
          required
        />
        <UploadButton type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload CSV'}
        </UploadButton>
      </ImportForm>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {validationErrors.length > 0 && (
        <ErrorMessage>
          <strong>Validation Errors:</strong>
          <ul>
            {validationErrors.map((err, index) => (
              <li key={index}>
                Row {err.row}: {err.message}
              </li>
            ))}
          </ul>
        </ErrorMessage>
      )}
      {success && <SuccessMessage>{success}</SuccessMessage>}
    </Container>
  );
};