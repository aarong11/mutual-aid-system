import apiClient from './apiClient';
import { Submission, SubmissionFormData, SubmissionStatus, ResourceType } from '../types';

interface CreateSubmissionData {
  address: string;
  zip_code: string;
  resource_type: ResourceType;
  description: string;
  contact_info?: string;
}

interface BulkSubmissionData {
  FullStreetAddress: string;
  ZipCode: string;
  ResourceType: string;
  Description: string;
  ContactInformation: string;
}

export const submissionService = {
  async getVerifiedSubmissions(): Promise<Submission[]> {
    const response = await apiClient.get('/submissions');
    return response.data;
  },

  async getPendingSubmissions(): Promise<Submission[]> {
    const response = await apiClient.get('/submissions/pending');
    return response.data;
  },

  async createSubmission(data: CreateSubmissionData): Promise<{ id: number }> {
    const response = await apiClient.post('/submissions', data);
    return response.data;
  },

  async createBulkSubmissions(data: BulkSubmissionData[]): Promise<void> {
    // Convert from CSV format to API format
    const submissions = data.map(item => ({
      address: item.FullStreetAddress,
      zip_code: item.ZipCode,
      resource_type: item.ResourceType.toLowerCase(),
      description: item.Description,
      contact_info: item.ContactInformation
    }));
    
    await apiClient.post('/submissions/bulk', submissions);
  },

  async updateSubmissionStatus(
    id: number, 
    status: SubmissionStatus.VERIFIED | SubmissionStatus.REJECTED
  ): Promise<void> {
    await apiClient.patch(`/submissions/${id}`, { status });
  }
};