const axios = require('axios');
const config = require('../config/config');

class FoursquareAPI {
    constructor() {
        this.apiKey = config.foursquare.apiKey;
        this.baseUrl = config.foursquare.baseUrl;
        this.version = config.foursquare.version;
    }

    async searchPlaces(query, lat, lng, limit = 5) {
        try {
            const params = {
                query,
                ll: `${lat},${lng}`,
                limit,
                sort: 'distance'
            };

            const response = await axios.get(`${this.baseUrl}/search`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-Places-Api-Version': this.version
                },
                params
            });

            return response.data;
        } catch (error) {
            console.error('Foursquare API Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch places from Foursquare');
        }
    }

    async getNearbyPlaces(lat, lng, categories = [], limit = 10) {
        try {
            const params = {
                ll: `${lat},${lng}`,
                limit,
                sort: 'popularity'
            };

            if (categories.length > 0) {
                params.categories = categories.join(',');
            }

            const response = await axios.get(`${this.baseUrl}/search`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-Places-Api-Version': this.version
                },
                params
            });

            return response.data;
        } catch (error) {
            console.error('Foursquare API Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch nearby places');
        }
    }

    async getPlacePhotos(placeId) {
        try {
            const response = await axios.get(`${this.baseUrl}/${placeId}/photos`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-Places-Api-Version': this.version
                },
                params: {
                    limit: 5
                }
            });

            return response.data;
        } catch (error) {
            console.error('Foursquare Photos API Error:', error.response?.data || error.message);
            return { photos: [] }; // Return empty array if photos fail
        }
    }

    async getPlaceDetails(placeId) {
        try {
            const response = await axios.get(`${this.baseUrl}/${placeId}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-Places-Api-Version': this.version
                },
                params: {
                    fields: 'fsq_id,name,location,categories,website,tel,email,social_media,verified,date_created,date_refreshed,stats,hours,price,rating,tastes,features,store_id,link'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Foursquare API Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch place details');
        }
    }

    async getTrendingPlaces(lat, lng, limit = 10) {
        try {
            const params = {
                ll: `${lat},${lng}`,
                limit,
                sort: 'rating'
            };

            const response = await axios.get(`${this.baseUrl}/search`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-Places-Api-Version': this.version
                },
                params
            });

            return response.data;
        } catch (error) {
            console.error('Foursquare Trending API Error:', error.response?.data || error.message);
            throw new Error('Failed to fetch trending places');
        }
    }
}

module.exports = new FoursquareAPI();