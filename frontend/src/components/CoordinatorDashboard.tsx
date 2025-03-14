import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Submission, SubmissionStatus } from '../types';
import { submissionService } from '../services/submissionService';
import { useAuth } from '../contexts/AuthContext';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const SubmissionsList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const SubmissionCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const SubmissionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ResourceType = styled.h3`
  color: #2c3e50;
  margin: 0;
`;

const Address = styled.p`
  color: #7f8c8d;
  margin: 0.5rem 0;
`;

const Description = styled.p`
  margin: 1rem 0;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'approve' | 'reject' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  ${({ variant }) => variant === 'approve' && `
    background-color: #2ecc71;
    color: white;
    &:hover {
      background-color: #27ae60;
    }
  `}

  ${({ variant }) => variant === 'reject' && `
    background-color: #e74c3c;
    color: white;
    &:hover {
      background-color: #c0392b;
    }
  `}

  ${({ variant }) => !variant && `
    background-color: #ecf0f1;
    color: #2c3e50;
    &:hover {
      background-color: #bdc3c7;
    }
  `}
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 1rem;
  margin: 1rem 0;
  background-color: #fdf0ed;
  border-radius: 4px;
`;

export const CoordinatorDashboard: React.FC = () => {
  const { isCoordinator } = useAuth();
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCoordinator) {
      return;
    }
    fetchPendingSubmissions();
  }, [isCoordinator]);

  const fetchPendingSubmissions = async () => {
    try {
      const data = await submissionService.getPendingSubmissions();
      setPendingSubmissions(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pending submissions');
      console.error('Error fetching pending submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    submissionId: number, 
    status: SubmissionStatus.VERIFIED | SubmissionStatus.REJECTED
  ) => {
    try {
      await submissionService.updateSubmissionStatus(submissionId, status);
      await fetchPendingSubmissions();
      setSelectedSubmission(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update submission status');
    }
  };

  if (!isCoordinator) {
    return <ErrorMessage>Access denied. Coordinator privileges required.</ErrorMessage>;
  }

  if (isLoading) {
    return <LoadingMessage>Loading pending submissions...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <DashboardContainer>
      <h2>Pending Submissions</h2>
      
      <SubmissionsList>
        {pendingSubmissions.length === 0 ? (
          <p>No pending submissions to review.</p>
        ) : (
          pendingSubmissions.map(submission => (
            <SubmissionCard key={submission.id}>
              <SubmissionHeader>
                <ResourceType>
                  {submission.resource_type.replace('_', ' ').toUpperCase()}
                </ResourceType>
                <span>{new Date(submission.submitted_at!).toLocaleDateString()}</span>
              </SubmissionHeader>

              <Address>{submission.address}</Address>
              <Description>{submission.description}</Description>
              
              {submission.contact_info && (
                <p><strong>Contact:</strong> {submission.contact_info}</p>
              )}

              <ButtonGroup>
                <Button
                  variant="approve"
                  onClick={() => handleStatusUpdate(submission.id!, SubmissionStatus.VERIFIED)}
                >
                  Approve
                </Button>
                <Button
                  variant="reject"
                  onClick={() => handleStatusUpdate(submission.id!, SubmissionStatus.REJECTED)}
                >
                  Reject
                </Button>
              </ButtonGroup>
            </SubmissionCard>
          ))
        )}
      </SubmissionsList>
    </DashboardContainer>
  );
};