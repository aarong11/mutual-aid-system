import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import styled from '@emotion/styled';
import { Submission, ResourceType } from '../types';
import { submissionService } from '../services/submissionService';
import 'leaflet/dist/leaflet.css';

const MapWrapper = styled.div`
  height: 600px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FilterContainer = styled.div`
  background: white;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  min-width: 200px;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  padding: 1rem;
  margin: 1rem 0;
  background-color: #fdf0ed;
  border-radius: 4px;
`;

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
}

export const MapView: React.FC<MapViewProps> = ({ 
  center = [40.7128, -74.0060],
  zoom = 13 
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    resourceType: '',
    zipCode: ''
  });

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await submissionService.getVerifiedSubmissions();
        setSubmissions(data);
        setFilteredSubmissions(data);
        setError(null);
      } catch (err) {
        setError('Failed to load resource locations. Please try again later.');
        console.error('Error fetching submissions:', err);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    const filtered = submissions.filter(submission => {
      const matchesSearch = filters.search
        ? submission.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          submission.address.toLowerCase().includes(filters.search.toLowerCase())
        : true;

      const matchesType = filters.resourceType
        ? submission.resource_type === filters.resourceType
        : true;

      const matchesZip = filters.zipCode
        ? submission.zip_code.startsWith(filters.zipCode)
        : true;

      return matchesSearch && matchesType && matchesZip;
    });

    setFilteredSubmissions(filtered);
  }, [filters, submissions]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <>
      <FilterContainer>
        <SearchInput
          type="text"
          name="search"
          placeholder="Search by description or address..."
          value={filters.search}
          onChange={handleFilterChange}
        />

        <Select
          name="resourceType"
          value={filters.resourceType}
          onChange={handleFilterChange}
        >
          <option value="">All Resource Types</option>
          {Object.values(ResourceType).map(type => (
            <option key={type} value={type}>
              {type.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </Select>

        <SearchInput
          type="text"
          name="zipCode"
          placeholder="Filter by ZIP code..."
          value={filters.zipCode}
          pattern="[0-9]*"
          onChange={handleFilterChange}
          style={{ maxWidth: '150px' }}
        />
      </FilterContainer>

      <MapWrapper>
        <MapContainer 
          center={center} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredSubmissions.map((submission) => (
            submission.latitude && submission.longitude && (
              <Marker 
                key={submission.id} 
                position={[submission.latitude, submission.longitude]}
              >
                <Popup>
                  <h3>{submission.resource_type.replace('_', ' ').toUpperCase()}</h3>
                  <p>{submission.address}</p>
                  <p>{submission.description}</p>
                  {submission.contact_info && <p>Contact: {submission.contact_info}</p>}
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </MapWrapper>
    </>
  );
};