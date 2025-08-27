const express = require('express');
const cors = require('cors');
require('dotenv').config();

const placesController = require('./src/controllers/placesController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route (health check)
app.get('/', (req, res) => {
  res.send('✅ Authenticity Compass API is running');
});

// API Routes
app.get('/api/places/search', placesController.searchPlaces);
app.get('/api/places/nearby', placesController.getNearbyPlaces);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Foursquare Authenticity Compass ready!`);
});
