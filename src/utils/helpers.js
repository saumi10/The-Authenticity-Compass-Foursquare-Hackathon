import { Linking } from 'react-native';

// Calculate authenticity score and class (matching web version logic)
export const calculateAuthenticity = (place) => {
  let score = 50; // Base score
  
  // Factors that increase authenticity
  if (place.chains && place.chains.length === 0) score += 20; // Independent business
  if (place.date_created) {
    const age = new Date().getFullYear() - new Date(place.date_created).getFullYear();
    if (age > 10) score += 15;
    else if (age > 5) score += 10;
    else if (age > 2) score += 5;
  }
  if (place.verified) score += 5;
  if (!place.website) score += 5; // Traditional businesses
  
  // Factors that decrease authenticity
  if (place.chains && place.chains.length > 0) score -= 15;
  if (place.category && place.category.includes('Chain')) score -= 10;
  
  score = Math.max(0, Math.min(100, score)); // Clamp between 0-100
  
  let label = '';
  let className = '';
  
  if (score >= 85) {
    label = 'Very Authentic';
    className = 'auth-very';
  } else if (score >= 75) {
    label = 'Highly Authentic';
    className = 'auth-high';
  } else if (score >= 65) {
    label = 'Good Authentic';
    className = 'auth-good';
  } else if (score >= 50) {
    label = 'Okay Authentic';
    className = 'auth-okay';
  } else {
    label = 'Low Authentic';
    className = 'auth-low';
  }
  
  return {
    authenticityScore: score,
    authenticityLabel: label,
    authenticityClass: className,
  };
};

// Get place icon based on category
export const getPlaceIcon = (category) => {
  const iconMap = {
    'Coffee Shop': 'coffee',
    'Restaurant': 'restaurant',
    'American Restaurant': 'restaurant',
    'Italian Restaurant': 'restaurant',
    'New American Restaurant': 'restaurant',
    'Café': 'coffee',
    'Bookstore': 'book',
    'Art Gallery': 'palette',
    'Music Venue': 'music',
    'Bar': 'wine-bar',
    'Pub': 'sports-bar',
    'Hotel': 'hotel',
  };
  return iconMap[category] || 'place';
};

// Get authenticity color
export const getAuthenticityColor = (score) => {
  if (score >= 85) return '#4CAF50'; // Green
  if (score >= 75) return '#2196F3'; // Blue
  if (score >= 65) return '#FF9800'; // Orange
  if (score >= 50) return '#FFC107'; // Amber
  return '#F44336'; // Red
};

// Open directions in maps app
export const openDirections = (lat, lng, placeName = '') => {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${lat},${lng}`;
  const label = placeName;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  });

  Linking.openURL(url).catch(() => {
    // Fallback to Google Maps
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
    Linking.openURL(googleMapsUrl);
  });
};

// Open phone dialer
export const makePhoneCall = (phoneNumber) => {
  const url = `tel:${phoneNumber}`;
  Linking.openURL(url);
};

// Open website
export const openWebsite = (url) => {
  let formattedUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    formattedUrl = `https://${url}`;
  }
  Linking.openURL(formattedUrl);
};

// Generate place summary (matching web version)
export const generatePlaceSummary = (place) => {
  const category = place.categories && place.categories[0] 
    ? place.categories[0].name.toLowerCase() 
    : 'place';
  const isIndependent = !place.chains || place.chains.length === 0;
  const hasWebsite = !!place.website;
  const age = place.date_created 
    ? new Date().getFullYear() - new Date(place.date_created).getFullYear() 
    : 0;
  const distance = place.distance ? Math.round(place.distance) : null;
  
  let summary = `This ${isIndependent ? 'independent' : 'chain'} ${category} `;
  
  if (age > 0) {
    summary += `has been serving the community for ${age} years. `;
  } else {
    summary += `is a local establishment. `;
  }
  
  if (distance) {
    summary += `Located just ${distance} meters away, `;
  }
  
  const authData = calculateAuthenticity(place);
  summary += `it offers an authentic local experience with an authenticity score of ${authData.authenticityScore}/100. `;
  
  if (hasWebsite) {
    summary += `Visit their website for more information about their offerings and hours.`;
  } else {
    summary += `This local gem maintains a traditional approach to business.`;
  }
  
  return summary;
};

// Format distance
export const formatDistance = (meters) => {
  if (!meters) return 'Distance unknown';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  } else {
    return `${(meters / 1000).toFixed(1)}km away`;
  }
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Validate location coordinates
export const isValidLocation = (location) => {
  return location && 
         typeof location.lat === 'number' && 
         typeof location.lng === 'number' &&
         location.lat >= -90 && location.lat <= 90 &&
         location.lng >= -180 && location.lng <= 180;
};