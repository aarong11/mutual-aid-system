import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  min-width: 200px;
`;

const SuggestionsList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const SuggestionItem = styled.li`
  padding: 8px 12px;
  cursor: pointer;
  &:hover {
    background: #f5f5f5;
  }
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

const ResourceList = styled.div`
  margin-top: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem;
`;

const ResourceCard = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

const ClickableResourceCard = styled(ResourceCard)`
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ResourceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ResourceTypeLabel = styled.span`
  font-weight: bold;
  color: #2c3e50;
`;

const ResourceAddress = styled.p`
  margin: 0.5rem 0;
  color: #34495e;
`;

const ResourceDescription = styled.p`
  margin: 0.5rem 0;
  color: #7f8c8d;
`;

const ResourceContact = styled.p`
  margin: 0.5rem 0;
  color: #16a085;
  font-style: italic;
`;

// Add MapController component for programmatic map control
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const newSuggestions = submissions
        .filter(submission => 
          submission.description.toLowerCase().includes(searchLower) ||
          submission.address.toLowerCase().includes(searchLower)
        )
        .map(submission => submission.description)
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 5);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [filters.search, submissions]);

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
    if (name === 'search') {
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setFilters(prev => ({
      ...prev,
      search: suggestion
    }));
    setShowSuggestions(false);
  };

  const handleResourceClick = (submission: Submission) => {
    if (submission.latitude && submission.longitude) {
      setSelectedSubmission(submission);
      setMapCenter([submission.latitude, submission.longitude]);
      setMapZoom(16);
    }
  };

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <>
      <FilterContainer>
        <SearchContainer ref={searchContainerRef}>
          <SearchInput
            type="text"
            name="search"
            placeholder="Search by description or address..."
            value={filters.search}
            onChange={handleFilterChange}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <SuggestionsList>
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </SuggestionItem>
              ))}
            </SuggestionsList>
          )}
        </SearchContainer>

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
          <MapController center={mapCenter} zoom={mapZoom} />
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

      <ResourceList>
        <h2>Available Resources ({filteredSubmissions.length})</h2>
        {filteredSubmissions.map((submission) => (
          <ClickableResourceCard 
            key={submission.id}
            onClick={() => handleResourceClick(submission)}
          >
            <ResourceHeader>
              <ResourceTypeLabel>
                {submission.resource_type.replace('_', ' ').toUpperCase()}
              </ResourceTypeLabel>
              {submission.verified_at && (
                <span>Verified: {new Date(submission.verified_at).toLocaleDateString()}</span>
              )}
            </ResourceHeader>
            <ResourceAddress>{submission.address} ({submission.zip_code})</ResourceAddress>
            <ResourceDescription>{submission.description}</ResourceDescription>
            {submission.contact_info && (
              <ResourceContact>Contact: {submission.contact_info}</ResourceContact>
            )}
          </ClickableResourceCard>
        ))}
        {filteredSubmissions.length === 0 && (
          <p>No resources found matching your filters.</p>
        )}
      </ResourceList>
    </>
  );
};