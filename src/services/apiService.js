// API Service to maintain backend connection
const BASE_URL = "http://192.168.1.8:3000"; // Change this to your backend URL

class ApiService {
  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.makeRequest('/api/health');
  }

  // Search places
  async searchPlaces(query, location, limit = 5) {
    const params = new URLSearchParams({
      query,
      lat: location?.lat || 40.7,
      lng: location?.lng || -74.0,
      limit: limit.toString(),
    });

    return this.makeRequest(`/api/places/search?${params}`);
  }

  // Discover places based on interests
  async discoverPlaces(interests, location) {
    return this.makeRequest('/api/discover', {
      method: 'POST',
      body: JSON.stringify({
        interests,
        location: location || { lat: 40.7, lng: -74.0 },
      }),
    });
  }

  // Get place details
  async getPlaceDetails(placeId) {
    return this.makeRequest(`/api/place/${placeId}`);
  }

  // Get recommendations for interests
  async getRecommendationsForInterest(interest, location, limit = 2) {
    const params = new URLSearchParams({
      query: interest,
      lat: location?.lat || 40.7,
      lng: location?.lng || -74.0,
      limit: limit.toString(),
    });

    return this.makeRequest(`/api/places/search?${params}`);
  }

  // Get multiple recommendations
  async getRecommendations(interests, location) {
    try {
      const promises = interests.slice(0, 3).map(interest =>
        this.getRecommendationsForInterest(interest, location)
      );
      
      const results = await Promise.all(promises);
      const allPlaces = results
        .filter(result => result.success)
        .flatMap(result => result.places)
        .slice(0, 6);
      
      return { success: true, places: allPlaces };
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return { success: false, error: error.message, places: [] };
    }
  }
}

export default new ApiService();