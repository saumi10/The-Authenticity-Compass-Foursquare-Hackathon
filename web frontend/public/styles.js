// Global state
let selectedInterests = [];
let currentLocation = null;
const maxInterests = 5;

// DOM elements
const interestsGrid = document.getElementById('interestsGrid');
const selectedCount = document.getElementById('selectedCount');
const discoverBtn = document.getElementById('discoverBtn');
const searchInput = document.getElementById('searchInput');
const mainContent = document.getElementById('mainContent');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const resultsGrid = document.getElementById('resultsGrid');
const placeModal = document.getElementById('placeModal');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeInterestCards();
    initializeSearchInput();
    checkGeolocationSupport();
    updateSelectedCount();
});

// Initialize interest card event listeners
function initializeInterestCards() {
    const interestCards = document.querySelectorAll('.interest-card');
    console.log('Found', interestCards.length, 'interest cards');
    
    interestCards.forEach((card, index) => {
        console.log('Setting up card', index, 'with interest:', card.dataset.interest);
        
        // Remove any existing listeners
        card.removeEventListener('click', handleInterestClick);
        
        // Add new listener
        card.addEventListener('click', handleInterestClick);
        
        // Make sure the card is clickable
        card.style.cursor = 'pointer';
    });
}

// Handle interest card click
function handleInterestClick(event) {
    const card = event.currentTarget;
    console.log('Interest card clicked:', card.dataset.interest);
    toggleInterest(card);
}

// Initialize search input
function initializeSearchInput() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchKeyPress);
        console.log('Search input initialized');
    } else {
        console.error('Search input not found');
    }
}

// Toggle interest selection
function toggleInterest(card) {
    const interest = card.dataset.interest;
    const isSelected = card.classList.contains('selected');

    console.log('Toggling interest:', interest, 'Currently selected:', isSelected);

    if (isSelected) {
        // Remove interest
        selectedInterests = selectedInterests.filter(i => i !== interest);
        card.classList.remove('selected');
        console.log('Removed interest:', interest);
    } else {
        // Add interest if under limit
        if (selectedInterests.length < maxInterests) {
            selectedInterests.push(interest);
            card.classList.add('selected');
            console.log('Added interest:', interest);
        } else {
            showNotification('You can select up to 5 interests only', 'warning');
            return;
        }
    }

    console.log('Current selected interests:', selectedInterests);
    updateSelectedCount();
}

// Update selected count and button state
function updateSelectedCount() {
    const count = selectedInterests.length;
    const selectedCountEl = document.getElementById('selectedCount');
    const discoverBtn = document.getElementById('discoverBtn');
    
    if (selectedCountEl) {
        selectedCountEl.textContent = `${count} of ${maxInterests} interests selected`;
    }
    
    if (discoverBtn) {
        if (count > 0) {
            discoverBtn.disabled = false;
            discoverBtn.textContent = `🚀 Discover Authentic Places (${count} selected)`;
            discoverBtn.style.opacity = '1';
            discoverBtn.style.cursor = 'pointer';
        } else {
            discoverBtn.disabled = true;
            discoverBtn.textContent = '🚀 Discover Authentic Places';
            discoverBtn.style.opacity = '0.5';
            discoverBtn.style.cursor = 'not-allowed';
        }
    }
    
    console.log('Updated count display. Selected:', count);
}

// Check if geolocation is supported
function checkGeolocationSupport() {
    if (!navigator.geolocation) {
        document.getElementById('locationStatus').textContent = 'Geolocation not supported - Using default location: San Francisco, CA';
    }
}

// Get user's current location
async function getLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error');
        return;
    }

    const locationBtn = document.querySelector('.location-btn');
    const originalText = locationBtn.textContent;
    locationBtn.textContent = '📍 Getting location...';
    locationBtn.disabled = true;

    try {
        const position = await getCurrentPosition();
        currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        // Get location name using reverse geocoding (simplified)
        document.getElementById('locationStatus').textContent = `Using your current location (${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)})`;
        showNotification('Location updated successfully!', 'success');

    } catch (error) {
        console.error('Error getting location:', error);
        showNotification('Could not get your location. Using default location.', 'warning');
    } finally {
        locationBtn.textContent = originalText;
        locationBtn.disabled = false;
    }
}

// Promisify getCurrentPosition
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        });
    });
}

// Discover places based on selected interests
async function discoverPlaces() {
    console.log('Discover places called with interests:', selectedInterests);
    
    if (selectedInterests.length === 0) {
        showNotification('Please select at least one interest', 'warning');
        return;
    }

    showLoading();

    try {
        console.log('Sending discover request...');
        const response = await fetch('/api/discover', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                interests: selectedInterests,
                location: currentLocation
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to discover places');
        }

        if (data.places && data.places.length > 0) {
            console.log('Found', data.places.length, 'places');
            displayResults(data.places, 'interests');
        } else {
            console.log('No places found');
            showError('No authentic places found for your interests. Try different interests or search for something specific.');
        }

    } catch (error) {
        console.error('Error discovering places:', error);
        showError(`Failed to discover places: ${error.message}`);
    }
}

// Search for specific places
async function searchPlaces() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.trim() : '';
    
    console.log('Search places called with query:', query);
    
    if (!query) {
        showNotification('Please enter a search term', 'warning');
        if (searchInput) searchInput.focus();
        return;
    }

    showLoading();

    try {
        console.log('Sending search request...');
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                location: currentLocation
            })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Search failed');
        }

        if (data.places && data.places.length > 0) {
            console.log('Found', data.places.length, 'places for search');
            displayResults(data.places, 'search', query);
        } else {
            console.log('No places found for search');
            showError(`No places found for "${query}". Try a different search term.`);
        }

    } catch (error) {
        console.error('Error searching places:', error);
        showError(`Search failed: ${error.message}`);
    }
}

// Handle search input key press
function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchPlaces();
    }
}

// Display results
function displayResults(places, type, query = null) {
    hideAllSections();
    resultsSection.style.display = 'block';

    // Update results subtitle
    const subtitle = document.getElementById('resultsSubtitle');
    if (type === 'search') {
        subtitle.textContent = `Results for "${query}" • ${places.length} places found`;
    } else {
        subtitle.textContent = `Based on your interests • ${places.length} authentic places discovered`;
    }

    // Clear previous results
    resultsGrid.innerHTML = '';

    // Create result cards
    places.forEach((place, index) => {
        const card = createResultCard(place, index);
        resultsGrid.appendChild(card);
    });

    // Animate cards
    animateResults();
}

// Create a result card element
function createResultCard(place, index) {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${index * 100}ms`;

    const authenticityColor = getAuthenticityColor(place.authenticityScore);
    const address = place.address || 'Address not available';
    const summary = generateSummary(place);

    card.innerHTML = `
        <div class="result-header">
            <div class="result-info">
                <h3>${escapeHtml(place.name)}</h3>
                <div class="result-category">${escapeHtml(place.category)}</div>
            </div>
            <div class="authenticity-score" style="background: ${authenticityColor}">
                ⭐ ${place.authenticityScore}/10
            </div>
        </div>
        
        <div class="result-address">
            📍 ${escapeHtml(address)}
        </div>
        
        <div class="result-summary">
            ${escapeHtml(summary)}
        </div>
        
        <div class="result-actions">
            <button class="btn btn-primary btn-small" onclick="openPlaceModal('${place.id}')">
                📍 View Details
            </button>
            <button class="btn btn-secondary btn-small" onclick="getDirections(${place.location?.latitude || 0}, ${place.location?.longitude || 0})">
                🗺️ Directions
            </button>
            <button class="btn btn-outline btn-small" onclick="savePlace('${place.id}')">
                ❤️ Save
            </button>
        </div>
    `;

    return card;
}

// Generate summary for place
function generateSummary(place) {
    const summaries = [
        `This ${place.category.toLowerCase()} has an authenticity score of ${place.authenticityScore}/10, indicating ${getAuthenticityDescription(place.authenticityScore)}.`,
        `A ${place.verified ? 'verified' : ''} ${place.category.toLowerCase()} that offers ${getAuthenticityDescription(place.authenticityScore)} local experience.`,
        `Discover this ${place.category.toLowerCase()} with a ${place.authenticityScore}/10 authenticity rating for ${getAuthenticityDescription(place.authenticityScore)} vibes.`
    ];
    
    return summaries[Math.floor(Math.random() * summaries.length)];
}

// Get authenticity description
function getAuthenticityDescription(score) {
    if (score >= 9) return 'exceptional authenticity';
    if (score >= 8) return 'high authenticity';
    if (score >= 7) return 'good authenticity';
    if (score >= 6) return 'moderate authenticity';
    return 'mixed authenticity';
}

// Get authenticity score color
function getAuthenticityColor(score) {
    if (score >= 9) return 'linear-gradient(135deg, #48bb78, #38a169)'; // Green
    if (score >= 8) return 'linear-gradient(135deg, #667eea, #764ba2)'; // Blue
    if (score >= 7) return 'linear-gradient(135deg, #ed8936, #dd6b20)'; // Orange
    if (score >= 6) return 'linear-gradient(135deg, #ecc94b, #d69e2e)'; // Yellow
    return 'linear-gradient(135deg, #fc8181, #f56565)'; // Red
}

// Animate results cards
function animateResults() {
    const cards = document.querySelectorAll('.result-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Open place details modal
async function openPlaceModal(placeId) {
    try {
        showModal();
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = '<div class="loading-spinner" style="margin: 40px auto;"></div>';

        const response = await fetch(`/api/place/${placeId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load place details');
        }

        displayPlaceDetails(data);

    } catch (error) {
        console.error('Error loading place details:', error);
        document.getElementById('modalBody').innerHTML = `
            <div class="error-content">
                <p>Failed to load place details: ${error.message}</p>
                <button class="btn btn-primary" onclick="closePlaceModal()">Close</button>
            </div>
        `;
    }
}

// Display place details in modal
function displayPlaceDetails(place) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = place.name;

    const photos = place.photos && place.photos.length > 0 
        ? place.photos.slice(0, 3).map(photo => `<img src="${photo.url}" alt="${place.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">`).join('')
        : '';

    const tips = place.tips && place.tips.length > 0
        ? place.tips.slice(0, 2).map(tip => `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 8px 0;">
                <p>"${tip.text}"</p>
                <small style="color: #718096;">— ${tip.user?.firstName || 'Anonymous'}</small>
            </div>
        `).join('')
        : '<p>No tips available.</p>';

    modalBody.innerHTML = `
        ${photos}
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h4 style="margin: 0; font-size: 1.2rem;">${escapeHtml(place.name)}</h4>
                <p style="margin: 4px 0; color: #718096;">${escapeHtml(place.category)}</p>
                <p style="margin: 4px 0; color: #4a5568;">📍 ${escapeHtml(place.address)}</p>
            </div>
            <div class="authenticity-score" style="background: ${getAuthenticityColor(place.authenticityScore)};">
                ⭐ ${place.authenticityScore}/10
            </div>
        </div>

        ${place.description ? `<p style="margin-bottom: 20px; line-height: 1.6;">${escapeHtml(place.description)}</p>` : ''}

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            ${place.rating ? `<div><strong>Rating:</strong> ${place.rating}/10</div>` : ''}
            ${place.price ? `<div><strong>Price Level:</strong> ${'.repeat(place.price)}</div>` : ''}
            ${place.verified ? `<div><strong>Status:</strong> ✅ Verified</div>` : ''}
            ${place.website ? `<div><strong>Website:</strong> <a href="${place.website}" target="_blank">Visit</a></div>` : ''}
            ${place.phone ? `<div><strong>Phone:</strong> <a href="tel:${place.phone}">${place.phone}</a></div>` : ''}
        </div>

        <div style="margin-bottom: 24px;">
            <h5 style="margin-bottom: 12px;">What People Say:</h5>
            ${tips}
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="getDirections(${place.location?.latitude || 0}, ${place.location?.longitude || 0})">
                🗺️ Get Directions
            </button>
            <button class="btn btn-secondary" onclick="savePlace('${place.id}')">
                ❤️ Save Place
            </button>
            ${place.website ? `<button class="btn btn-outline" onclick="window.open('${place.website}', '_blank')">🌐 Visit Website</button>` : ''}
        </div>
    `;
}

// Show modal
function showModal() {
    placeModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closePlaceModal() {
    placeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Get directions to place
function getDirections(lat, lng) {
    if (!lat || !lng) {
        showNotification('Location coordinates not available', 'warning');
        return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Save place (mock implementation)
function savePlace(placeId) {
    // In a real app, this would save to user's favorites
    showNotification('Place saved to your favorites! 🎉', 'success');
    console.log('Saved place:', placeId);
}

// Show loading state
function showLoading() {
    console.log('Showing loading state');
    hideAllSections();
    const loadingSection = document.getElementById('loadingSection');
    if (loadingSection) {
        loadingSection.style.display = 'block';
    }
}

// Show error state
function showError(message) {
    console.log('Showing error:', message);
    hideAllSections();
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorSection && errorMessage) {
        errorSection.style.display = 'block';
        errorMessage.textContent = message;
    }
}

// Show main content
function showMainContent() {
    console.log('Showing main content');
    hideAllSections();
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'block';
    }
    
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

// Hide all sections
function hideAllSections() {
    const sections = ['mainContent', 'loadingSection', 'resultsSection', 'errorSection'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });
}

// Test server connection
async function testServerConnection() {
    try {
        console.log('Testing server connection...');
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('Server health check:', data);
        
        if (data.apiKey === 'Missing') {
            showNotification('⚠️ Foursquare API key not configured. Please check your .env file.', 'warning');
        } else {
            console.log('✅ Server and API key are configured');
        }
        
        return response.ok;
    } catch (error) {
        console.error('❌ Server connection failed:', error);
        showNotification('Server connection failed. Make sure the server is running on port 3000.', 'error');
        return false;
    }
}

// Initialize the app with server check
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Authenticity Compass initializing...');
    
    // Test server connection first
    const serverOk = await testServerConnection();
    
    initializeInterestCards();
    initializeSearchInput();
    checkGeolocationSupport();
    updateSelectedCount();
    
    console.log('✅ App initialization complete');
});

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : type === 'warning' ? '#ed8936' : '#667eea'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Handle errors globally
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('Something went wrong. Please try again.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('Something went wrong. Please try again.', 'error');
});