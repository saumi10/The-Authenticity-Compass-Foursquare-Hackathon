module.exports = {
    foursquare: {
        apiKey: process.env.FOURSQUARE_API_KEY,
        baseUrl: 'https://places-api.foursquare.com/places',
        version: '2025-06-17'
    },
    defaultLocation: {
        lat: 40.7,
        lng: -74.0
    },
    interests: [
        'coffee shop',
        'restaurant',
        'bookstore',
        'art gallery',
        'music venue'
    ]
};