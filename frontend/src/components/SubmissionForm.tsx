import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { ResourceType, SubmissionFormData } from '../types';
import { submissionService } from '../services/submissionService';

const Form = styled.form`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const Button = styled.button`
  background-color: #2ecc71;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
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

export const SubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SubmissionFormData>({
    address: '',
    zip_code: '',
    resource_type: ResourceType.FOOD_BANK,
    description: '',
    contact_info: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await submissionService.createSubmission(formData);
      alert('Thank you! Your submission will be reviewed by a coordinator.');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.errors?.[0]?.msg || 
        'Failed to submit. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h2>Submit a Resource Location</h2>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <FormGroup>
        <Label htmlFor="address">Address:</Label>
        <Input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          placeholder="Enter full street address"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="zip_code">ZIP Code:</Label>
        <Input
          type="text"
          id="zip_code"
          name="zip_code"
          value={formData.zip_code}
          onChange={handleChange}
          pattern="[0-9]{5}"
          required
          placeholder="12345"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="resource_type">Resource Type:</Label>
        <Select
          id="resource_type"
          name="resource_type"
          value={formData.resource_type}
          onChange={handleChange}
          required
        >
          {Object.values(ResourceType).map(type => (
            <option key={type} value={type}>
              {type.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </Select>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description:</Label>
        <TextArea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Please provide details about the resource, including hours of operation if applicable"
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="contact_info">Contact Information (optional):</Label>
        <Input
          type="text"
          id="contact_info"
          name="contact_info"
          value={formData.contact_info}
          onChange={handleChange}
          placeholder="Phone number or email address"
        />
      </FormGroup>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Resource'}
      </Button>
    </Form>
  );
};