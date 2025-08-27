# 🧭 Foursquare Authenticity Compass

Discover authentic local experiences powered by Foursquare API and AI-driven authenticity scoring.

## ✨ Features

- **Interest-Based Discovery**: Select up to 5 interests and discover authentic places
- **Smart Search**: Search for specific types of places with AI-powered authenticity scoring
- **Real Foursquare Data**: Live data from Foursquare Places API v3
- **Authenticity Scoring**: AI algorithm that rates places on authenticity (0-10 scale)
- **Location Support**: GPS location detection or default to San Francisco
- **Responsive Design**: Works on desktop and mobile devices
- **Place Details**: Rich information including photos, tips, ratings, and directions

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Foursquare Developer Account

### 1. Clone/Setup Project

```bash
# Create project directory
mkdir foursquare-authenticity-compass
cd foursquare-authenticity-compass

# Copy all the files from the artifacts above into their respective directories
```

### 2. Get Foursquare API Key

1. Go to [Foursquare Developers](https://foursquare.com/developers/signup)
2. Sign up for a developer account
3. Create a new app
4. Copy your API key from the dashboard

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Foursquare API key
FOURSQUARE_API_KEY=your_actual_api_key_here
PORT=3000
```

### 5. Run the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 6. Open in Browser

Visit `http://localhost:3000` to see your app!

## 📁 Project Structure

```
foursquare-authenticity-compass/
├── package.json              # Dependencies and scripts
├── server.js                 # Express server
├── .env                     # Environment variables (create this)
├── .gitignore               # Git ignore file
├── README.md                # This file
├── public/                  # Frontend files
│   ├── index.html          # Main HTML page
│   ├── styles.css          # CSS styles
│   └── script.js           # Frontend JavaScript
└── src/                    # Backend modules
    ├── api/
    │   └── foursquare.js   # Foursquare API integration
    ├── utils/
    │   └── authenticity.js  # Authenticity scoring algorithm
    └── config/
        └── config.js       # Configuration management
```

## 🎯 How It Works

### Authenticity Scoring Algorithm

The AI authenticity scoring considers multiple factors:

1. **Chain Status (30%)**: Independent businesses score higher
2. **Verification (15%)**: Verified places get bonus points
3. **Rating Quality (20%)**: High ratings indicate authentic quality
4. **Popularity Balance (15%)**: Not too touristy, not unknown
5. **Review Analysis (10%)**: Keywords like "local", "authentic", "family-owned"
6. **Price Point (10%)**: Moderate pricing often indicates authenticity

### Interest Categories

- ☕ Coffee Shops
- 🍽️ Restaurants  
- 📚 Bookstores
- 🎨 Art Galleries
- 🎵 Music Venues
- 🛍️ Local Shops
- 🌃 Bars & Pubs
- 🌳 Outdoor Spots

## 🛠️ API Endpoints

### `POST /api/discover`
Discover places based on interests
```json
{
  "interests": ["coffee", "bookstore"],
  "location": { "latitude": 37.7749, "longitude": -122.4194 }
}
```

### `POST /api/search`
Search for specific places
```json
{
  "query": "Italian restaurant",
  "location": { "latitude": 37.7749, "longitude": -122.4194 }
}
```

### `GET /api/place/:id`
Get detailed information about a place

### `GET /api/health`
Health check endpoint

## 🎨 Customization

### Adding New Interests

Edit `src/config/config.js` to add new interest categories:

```javascript
categories: {
    'newinterest': ['category_id_1', 'category_id_2']
}
```

Then update the frontend `index.html` to include the new interest card.

### Modifying Authenticity Algorithm

Edit `src/utils/authenticity.js` to adjust scoring weights or add new factors.

## 🌍 Deployment

### Environment Variables for Production

```bash
FOURSQUARE_API_KEY=your_production_api_key
PORT=3000
NODE_ENV=production
```

### Deploy to Heroku

```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set FOURSQUARE_API_KEY=your_api_key

# Deploy
git add .
git commit -m "Initial commit"
git push heroku main
```

## 🔧 Troubleshooting

### Common Issues

1. **API Key Issues**: Make sure your Foursquare API key is correct and active
2. **Location Services**: Enable location services in your browser for GPS functionality
3. **CORS Errors**: Make sure you're running the backend server
4. **No Results**: Try different search terms or interests

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and API request logging.

## 📚 Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **API**: Foursquare Places API v3
- **Styling**: CSS Grid, Flexbox, CSS Variables
- **Location**: Geolocation API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Foursquare](https://foursquare.com) for their excellent Places API
- Design inspiration from modern location discovery apps
- Icons from various emoji sets

---

**Happy discovering! 🧭✨**
