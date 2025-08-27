const axios = require('axios');
const config = require('../utils/config');

class FoursquareService {
  constructor() {
    this.apiKey = config.FOURSQUARE_API_KEY;
    this.baseUrl = 'https://api.foursquare.com/v3/places';
  }

  isApiKeySet() {
    return !!this.apiKey;
  }

  async discoverPlaces(interests, location) {
    const ll = this._getLocationString(location);
    const allPlaces = [];

    for (const interest of interests) {
      try {
        const response = await axios.get(`${this.baseUrl}/search`, {
          headers: this._getHeaders(),
          params: {
            query: interest,
            ll,
            limit: 5,
            sort: 'DISTANCE',
            fields: 'fsq_id,name,categories,distance,location,geocodes'
          }
        });

        if (response.data && response.data.results) {
          allPlaces.push(...this._formatPlaces(response.data.results));
        }
      } catch (error) {
        console.error(`Error fetching ${interest}:`, error.message);
        throw error;
      }
    }

    return this._filterAndSortPlaces(allPlaces);
  }

  async searchPlaces(query, location) {
    const ll = this._getLocationString(location);
    
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: this._getHeaders(),
        params: {
          query,
          ll,
          limit: 5,
          sort: 'DISTANCE',
          fields: 'fsq_id,name,categories,distance,location,geocodes'
        }
      });

      return this._formatPlaces(response.data?.results || []);
    } catch (error) {
      console.error('Search error:', error.message);
      throw error;
    }
  }

  _getHeaders() {
    return {
      'Authorization': this.apiKey,
      'Accept': 'application/json'
    };
  }

  _getLocationString(location) {
    return location ? `${location.latitude},${location.longitude}` : '37.7749,-122.4194';
  }

  _formatPlaces(places) {
    return places.map(place => ({
      id: place.fsq_id,
      name: place.name,
      category: place.categories?.[0]?.name || 'Unknown',
      distance: place.distance || 0,
      location: {
        address: place.location?.address || '',
        locality: place.location?.locality || '',
        region: place.location?.region || '',
        formatted_address: [
          place.location?.address,
          place.location?.locality,
          place.location?.region
        ].filter(Boolean).join(', ')
      },
      authenticityScore: this._calculateAuthenticityScore(place)
    }));
  }

  _filterAndSortPlaces(places) {
    const uniquePlaces = Array.from(new Map(places.map(place => [place.id, place])).values());
    return uniquePlaces
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }

  _calculateAuthenticityScore(place) {
    // More sophisticated scoring
    let score = 5; // Base score
    
    // Category adds points
    if (place.categories?.[0]?.name) {
      score += 2;
      // Bonus for certain categories
      if (['Coffee Shop', 'Bookstore', 'Local Restaurant'].includes(place.categories[0].name)) {
        score += 1;
      }
    }
    
    // Location details add points
    if (place.location?.address) score += 1;
    if (place.location?.locality) score += 1;
    
    // Nearby places get higher score
    if (place.distance < 500) score += 2;
    else if (place.distance < 1000) score += 1;
    
    return Math.min(10, Math.max(1, score)); // Ensure score is between 1-10
  }
}

module.exports = new FoursquareService();