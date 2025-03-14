import apiClient from './apiClient';
import { Submission, SubmissionFormData, SubmissionStatus } from '../types';

export const submissionService = {
  async getVerifiedSubmissions() {
    const response = await apiClient.get<Submission[]>('/submissions');
    return response.data;
  },

  async getPendingSubmissions() {
    const response = await apiClient.get<Submission[]>('/submissions/pending');
    return response.data;
  },

  async createSubmission(data: SubmissionFormData) {
    const response = await apiClient.post<{ id: number; message: string }>('/submissions', data);
    return response.data;
  },

  async updateSubmissionStatus(id: number, status: SubmissionStatus) {
    const response = await apiClient.patch<{ message: string }>(`/submissions/${id}`, { status });
    return response.data;
  }
};