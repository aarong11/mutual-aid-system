interface CachedGeocode {
  lat: number;
  lon: number;
  timestamp: number;
}

class GeocodingService {
  private cache: Map<string, CachedGeocode> = new Map();
  private lastRequestTime: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days
  private readonly MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  public async geocodeAddress(address: string): Promise<[number, number] | null> {
    // Check cache first
    const cachedResult = this.cache.get(address);
    if (cachedResult && Date.now() - cachedResult.timestamp < this.CACHE_DURATION) {
      return [cachedResult.lat, cachedResult.lon];
    }

    // Wait for rate limit
    await this.waitForRateLimit();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        {
          headers: {
            'User-Agent': 'CommunityAidResourceMap/1.0',
            'Accept-Language': 'en'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data[0]) {
        const result = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          timestamp: Date.now()
        };
        
        // Update cache
        this.cache.set(address, result);
        return [result.lat, result.lon];
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const geocodingService = new GeocodingService();