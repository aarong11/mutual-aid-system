import axios, { AxiosError } from 'axios';
import { AppError } from '../middlewares/errorHandler';

interface GeocodeResult {
  lat: number;
  lon: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodeAddress = async (address: string, zipCode: string): Promise<GeocodeResult | null> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const query = `${address} ${zipCode}`;
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'MutualAidApp/1.0'
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
        };
      }

      // If we got a response but no results, don't retry
      return null;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof AxiosError) {
        // Don't retry for certain error types
        if (error.response?.status === 400) {
          throw new AppError(400, 'Invalid address format');
        }
        
        if (error.response?.status === 429) {
          // Rate limit hit - wait longer before retry
          await sleep(RETRY_DELAY * attempt * 2);
          continue;
        }
      }

      // Only retry on network errors or 5xx server errors
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt);
        continue;
      }
    }
  }

  // If we got here, all retries failed
  console.error('Geocoding error after all retries:', lastError);
  throw new AppError(503, 'Geocoding service is currently unavailable. Please try again later.');
};