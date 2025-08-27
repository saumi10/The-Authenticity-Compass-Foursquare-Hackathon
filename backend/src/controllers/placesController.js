const foursquareAPI = require('../api/foursquare');
const authenticityScorer = require('../utils/authenticity');

class PlacesController {
    async searchPlaces(req, res) {
        try {
            const { query, lat, lng, limit } = req.query;

            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }

            const latitude = parseFloat(lat) || 40.7;
            const longitude = parseFloat(lng) || -74.0;
            const searchLimit = parseInt(limit) || 5;

            const data = await foursquareAPI.searchPlaces(query, latitude, longitude, searchLimit);

            if (data.results && data.results.length > 0) {
                const processedPlaces = authenticityScorer.processPlaces(data.results);

                res.json({
                    success: true,
                    query,
                    location: { lat: latitude, lng: longitude },
                    count: processedPlaces.length,
                    places: processedPlaces.slice(0, 5) // Top 5 results
                });
            } else {
                res.json({
                    success: true,
                    query,
                    count: 0,
                    places: [],
                    message: 'No places found for this query'
                });
            }
        } catch (error) {
            console.error('Search Places Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search places',
                message: error.message
            });
        }
    }

    async getNearbyPlaces(req, res) {
        try {
            const { lat, lng, categories, limit } = req.query;

            const latitude = parseFloat(lat) || 40.7;
            const longitude = parseFloat(lng) || -74.0;
            const searchLimit = parseInt(limit) || 10;
            const categoryList = categories ? categories.split(',') : [];

            const data = await foursquareAPI.getNearbyPlaces(latitude, longitude, categoryList, searchLimit);

            if (data.results && data.results.length > 0) {
                const processedPlaces = authenticityScorer.processPlaces(data.results);

                res.json({
                    success: true,
                    location: { lat: latitude, lng: longitude },
                    count: processedPlaces.length,
                    places: processedPlaces
                });
            } else {
                res.json({
                    success: true,
                    count: 0,
                    places: [],
                    message: 'No nearby places found'
                });
            }
        } catch (error) {
            console.error('Nearby Places Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get nearby places',
                message: error.message
            });
        }
    } // 👈🏽 This closing brace was missing before!

    async getPlaceDetails(req, res) {
        try {
            const { placeId } = req.params;

            if (!placeId) {
                return res.status(400).json({ error: 'Place ID is required' });
            }

            const [placeData, photosData] = await Promise.allSettled([
                foursquareAPI.getPlaceDetails(placeId),
                foursquareAPI.getPlacePhotos(placeId)
            ]);

            const place = placeData.status === 'fulfilled' ? placeData.value : null;
            const photos = photosData.status === 'fulfilled' ? photosData.value.photos || [] : [];

            if (!place) {
                return res.status(404).json({
                    success: false,
                    error: 'Place not found'
                });
            }

            // Process the place with authenticity scoring
            const processedPlace = authenticityScorer.processPlaces([place])[0];

            res.json({
                success: true,
                place: {
                    ...processedPlace,
                    photos: photos.slice(0, 3) // Limit to 3 photos
                }
            });
        } catch (error) {
            console.error('Get Place Details Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get place details',
                message: error.message
            });
        }
    }
}

module.exports = new PlacesController();
