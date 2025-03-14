/*
 * This file is part of the aid project.
 * Copyright (C) 2024 
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import styled from '@emotion/styled';
import { Submission, ResourceType } from '../types';
import { submissionService } from '../services/submissionService';
import { geocodingService } from '../services/geocodingService';
import { getMarkerIcon } from '../utils/markerIcons';
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingErrors, setGeocodingErrors] = useState<{[key: string]: string}>({});
  const [markerPositions, setMarkerPositions] = useState<{[key: string]: [number, number]}>({});
  // Track which submissions should have visible markers
  const [visibleMarkers, setVisibleMarkers] = useState<Set<number>>(new Set());

  const handleResourceClick = async (submission: Submission) => {
    if (!submission.id) return;
    
    setSelectedSubmission(submission);
    
    if (!submission.latitude || !submission.longitude) {
      setIsGeocoding(true);
      try {
        const coords = await geocodingService.geocodeAddress(submission.address);
        if (coords) {
          setMapCenter(coords);
          setMapZoom(16);
          setMarkerPositions(prev => ({
            ...prev,
            [submission.id!]: coords
          }));
          // Add the submission to visible markers
          setVisibleMarkers(prev => new Set([...prev, submission.id!]));
          // Clear any previous error for this address
          setGeocodingErrors(prev => {
            const next = { ...prev };
            delete next[submission.address];
            return next;
          });
        } else {
          setGeocodingErrors(prev => ({
            ...prev,
            [submission.address]: 'Could not find coordinates for this address'
          }));
        }
      } catch (error) {
        setGeocodingErrors(prev => ({
          ...prev,
          [submission.address]: error instanceof Error ? error.message : 'Failed to geocode address'
        }));
      } finally {
        setIsGeocoding(false);
      }
    } else {
      setMapCenter([submission.latitude, submission.longitude]);
      setMapZoom(16);
      setMarkerPositions(prev => ({
        ...prev,
        [submission.id!]: [submission.latitude!, submission.longitude!]
      }));
      // Add the submission to visible markers
      setVisibleMarkers(prev => new Set([...prev, submission.id!]));
    }
  };

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
        ? submission.address.toLowerCase().includes(filters.search.toLowerCase())
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
          {filteredSubmissions.map((submission) => {
            if (!submission.id || !visibleMarkers.has(submission.id)) return null;
            const position = markerPositions[String(submission.id)];
            return position && (
              <Marker 
                key={submission.id} 
                position={position}
                icon={getMarkerIcon(submission.resource_type)}
              >
                <Popup>
                  <h3>{submission.resource_type.replace('_', ' ').toUpperCase()}</h3>
                  <p>{submission.address}</p>
                  <p>{submission.description}</p>
                  {submission.contact_info && <p>Contact: {submission.contact_info}</p>}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        {isGeocoding && (
          <LoadingOverlay>
            <p>Loading location data...</p>
          </LoadingOverlay>
        )}
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
            {geocodingErrors[submission.address] && (
              <ErrorMessage>{geocodingErrors[submission.address]}</ErrorMessage>
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