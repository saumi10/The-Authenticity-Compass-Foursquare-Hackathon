class AuthenticityCompass {
    constructor() {
        this.currentLocation = { lat: 40.7, lng: -74.0 };
        this.selectedInterests = [];
        this.userPreferences = this.loadUserPreferences();
        this.isSearching = false;
        this.isFirstVisit = !this.userPreferences.interests || this.userPreferences.interests.length === 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        if (this.isFirstVisit) {
            this.showWelcomeModal();
        } else {
            this.selectedInterests = [...this.userPreferences.interests];
            this.updateInterestButtons();
            this.getCurrentLocation();
            setTimeout(() => this.loadRecommendations(), 1000);
        }
    }

    setupEventListeners() {
        // Welcome modal
        document.getElementById('modalInterestsGrid').addEventListener('click', (e) => {
            if (e.target.closest('.modal-interest-btn')) {
                this.toggleModalInterest(e.target.closest('.modal-interest-btn'));
            }
        });

        document.getElementById('startJourneyBtn').addEventListener('click', () => {
            this.completeOnboarding();
        });

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showWelcomeModal();
        });

        // Interest buttons in main interface
        document.getElementById('interestsGrid').addEventListener('click', (e) => {
            if (e.target.closest('.interest-btn')) {
                this.toggleInterest(e.target.closest('.interest-btn'));
            }
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Place details modal
        document.getElementById('closePlaceModal').addEventListener('click', () => {
            this.closePlaceModal();
        });

        // Close modal on overlay click
        document.getElementById('welcomeModal').addEventListener('click', (e) => {
            if (e.target.id === 'welcomeModal') {
                if (!this.isFirstVisit) this.closeWelcomeModal();
            }
        });

        document.getElementById('placeDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'placeDetailsModal') {
                this.closePlaceModal();
            }
        });
    }

    // User Preferences Management (Using in-memory storage)
    loadUserPreferences() {
        // Using in-memory storage instead of localStorage for Claude environment
        if (!window.userPreferences) {
            window.userPreferences = { interests: [], location: null };
        }
        return window.userPreferences;
    }

    saveUserPreferences() {
        const prefs = {
            interests: this.selectedInterests,
            location: this.currentLocation,
            lastUpdate: Date.now()
        };
        window.userPreferences = prefs;
        console.log('Preferences saved:', prefs);
    }

    // Welcome Modal Functions
    showWelcomeModal() {
        const modal = document.getElementById('welcomeModal');
        modal.classList.add('show');
        
        // Reset modal interests to current preferences
        const modalButtons = document.querySelectorAll('.modal-interest-btn');
        modalButtons.forEach(btn => {
            const interest = btn.dataset.interest;
            if (this.selectedInterests.includes(interest)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
        
        this.updateStartButton();
    }

    closeWelcomeModal() {
        document.getElementById('welcomeModal').classList.remove('show');
    }

    toggleModalInterest(button) {
        const interest = button.dataset.interest;
        
        if (button.classList.contains('selected')) {
            button.classList.remove('selected');
            this.selectedInterests = this.selectedInterests.filter(i => i !== interest);
        } else {
            button.classList.add('selected');
            this.selectedInterests.push(interest);
        }

        this.updateStartButton();
    }

    updateStartButton() {
        const btn = document.getElementById('startJourneyBtn');
        btn.disabled = this.selectedInterests.length === 0;
        btn.textContent = this.selectedInterests.length === 0 ? 'Select at least one interest' : 
                         this.isFirstVisit ? 'Start My Journey' : 'Update Preferences';
    }

    completeOnboarding() {
        if (this.selectedInterests.length === 0) return;
        
        this.saveUserPreferences();
        this.updateInterestButtons();
        this.closeWelcomeModal();
        this.getCurrentLocation();
        
        if (this.isFirstVisit) {
            this.isFirstVisit = false;
            setTimeout(() => this.loadRecommendations(), 1000);
        } else {
            this.loadRecommendations();
        }
    }

    updateInterestButtons() {
        const buttons = document.querySelectorAll('#interestsGrid .interest-btn');
        buttons.forEach(btn => {
            const interest = btn.dataset.interest;
            if (this.selectedInterests.includes(interest)) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    // Location Functions
    getCurrentLocation() {
        const locationText = document.getElementById('locationText');
        
        if (navigator.geolocation) {
            locationText.textContent = 'Getting your location...';
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    locationText.textContent = `📍 Location found (${this.currentLocation.lat.toFixed(3)}, ${this.currentLocation.lng.toFixed(3)})`;
                    this.saveUserPreferences();
                    this.loadRecommendations();
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    locationText.textContent = '📍 Using default location (New York)';
                    this.loadRecommendations();
                }
            );
        } else {
            locationText.textContent = '📍 Using default location (New York)';
            this.loadRecommendations();
        }
    }

    // Recommendations Functions
    async loadRecommendations() {
        if (this.selectedInterests.length === 0) return;
        
        const recommendationsSection = document.getElementById('recommendationsSection');
        const container = document.getElementById('recommendationsContainer');
        
        recommendationsSection.style.display = 'block';
        container.innerHTML = '<div class="loading-spinner show"><i class="fas fa-spinner fa-spin"></i><span>Loading recommendations...</span></div>';
        
        try {
            // Get recommendations for each interest
            const recommendations = await Promise.all(
                this.selectedInterests.slice(0, 3).map(interest => 
                    this.getRecommendationsForInterest(interest)
                )
            );
            
            const allPlaces = recommendations.flat().slice(0, 6);
            this.displayRecommendations(allPlaces);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            container.innerHTML = '<p style="text-align: center; color: #666;">Unable to load recommendations. Please try again.</p>';
        }
    }

    async getRecommendationsForInterest(interest) {
        try {
            const response = await fetch(`/api/places/search?query=${encodeURIComponent(interest)}&lat=${this.currentLocation.lat}&lng=${this.currentLocation.lng}&limit=2`);
            const data = await response.json();
            return data.success ? data.places : [];
        } catch (error) {
            console.error(`Failed to get recommendations for ${interest}:`, error);
            return [];
        }
    }

    displayRecommendations(places) {
        const container = document.getElementById('recommendationsContainer');
        
        if (places.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No recommendations available. Try adjusting your location or interests.</p>';
            return;
        }

        container.innerHTML = places.map((place, index) => 
            this.createPlaceCard(place, index, true)
        ).join('');

        // Add click listeners to recommendation cards
        container.querySelectorAll('.place-card').forEach((card, index) => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-secondary')) {
                    this.showPlaceDetails(places[index]);
                }
            });
        });
    }

    toggleInterest(button) {
        const interest = button.dataset.interest;
        
        if (button.classList.contains('selected')) {
            button.classList.remove('selected');
            this.selectedInterests = this.selectedInterests.filter(i => i !== interest);
        } else {
            button.classList.add('selected');
            this.selectedInterests.push(interest);
        }

        console.log('Selected interests:', this.selectedInterests);
        this.saveUserPreferences();
        
        // Auto-search for selected interests
        if (this.selectedInterests.length > 0) {
            setTimeout(() => this.searchSelectedInterests(), 500);
        }
    }

    async searchSelectedInterests() {
        if (this.selectedInterests.length === 0) return;
        
        // Search for the first selected interest
        const query = this.selectedInterests[0];
        await this.searchPlaces(query);
    }

    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();
        
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        await this.searchPlaces(query);
    }

    async searchPlaces(query) {
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.showLoading(true);
        
        try {
            const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}&lat=${this.currentLocation.lat}&lng=${this.currentLocation.lng}&limit=5`);
            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data.places, query);
                this.updateResultsHeader(data.places.length, query);
            } else {
                this.showError(data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to search places. Please try again.');
        } finally {
            this.isSearching = false;
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('resultsContainer');
        
        if (show) {
            spinner.classList.add('show');
            container.style.display = 'none';
        } else {
            spinner.classList.remove('show');
            container.style.display = 'block';
        }
    }

    updateResultsHeader(count, query) {
        const title = document.getElementById('resultsTitle');
        const countBadge = document.getElementById('resultsCount');
        
        title.textContent = query ? `Results for "${query}"` : 'Top Authentic Places';
        countBadge.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    }

    displayResults(places, query = '') {
        const container = document.getElementById('resultsContainer');
        
        if (places.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No places found</h3>
                    <p>Try searching for something else or select different interests.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = places.map((place, index) => 
            this.createPlaceCard(place, index, false)
        ).join('');

        // Add click listeners to cards
        container.querySelectorAll('.place-card').forEach((card, index) => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-secondary')) {
                    this.showPlaceDetails(places[index]);
                }
            });
        });

        // Add animation
        container.classList.add('fade-in');
        setTimeout(() => container.classList.remove('fade-in'), 600);
    }

    createPlaceCard(place, index, isRecommendation = false) {
        const address = place.location ? place.location.formatted_address : 'Address not available';
        const category = place.categories && place.categories[0] ? place.categories[0].name : 'Place';
        const distance = place.distance ? `${place.distance}m away` : '';
        const phone = place.tel || '';
        const website = place.website || '';
        
        return `
            <div class="place-card slide-up clickable" style="animation-delay: ${index * 0.1}s" data-place-id="${index}">
                <div class="place-image">
                    <i class="fas fa-${this.getPlaceIcon(category)}"></i>
                </div>
                
                <div class="place-header">
                    <div class="place-info">
                        <h4>${place.name}</h4>
                        <div class="place-category">${category}</div>
                        <div class="place-address">${address}</div>
                        ${distance ? `<div class="place-distance">${distance}</div>` : ''}
                    </div>
                    <div class="authenticity-badge ${place.authenticityClass}">
                        ${place.authenticityLabel}
                        <div style="font-size: 0.8em; margin-top: 2px;">${place.authenticityScore}/100</div>
                    </div>
                </div>
                
                <div class="place-details">
                    ${phone ? `
                        <div class="detail-item">
                            <i class="fas fa-phone"></i>
                            <span>${phone}</span>
                        </div>
                    ` : ''}
                    
                    ${website ? `
                        <div class="detail-item">
                            <i class="fas fa-globe"></i>
                            <span>Has Website</span>
                        </div>
                    ` : ''}
                    
                    ${place.chains && place.chains.length > 0 ? `
                        <div class="detail-item">
                            <i class="fas fa-link"></i>
                            <span>Part of ${place.chains[0].name}</span>
                        </div>
                    ` : `
                        <div class="detail-item">
                            <i class="fas fa-star"></i>
                            <span>Independent Business</span>
                        </div>
                    `}
                    
                    ${place.date_created ? `
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>Since ${new Date(place.date_created).getFullYear()}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="place-actions">
                    <button class="btn-secondary btn-directions" onclick="event.stopPropagation(); window.app.getDirections('${place.latitude}', '${place.longitude}', '${place.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                    <button class="btn-secondary" onclick="event.stopPropagation(); window.app.showPlaceDetails(${JSON.stringify(place).replace(/"/g, '&quot;')})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
    }

    getPlaceIcon(category) {
        const iconMap = {
            'Coffee Shop': 'coffee',
            'Restaurant': 'utensils',
            'American Restaurant': 'utensils',
            'Italian Restaurant': 'utensils',
            'New American Restaurant': 'utensils',
            'Café': 'coffee',
            'Bookstore': 'book',
            'Art Gallery': 'palette',
            'Music Venue': 'music',
            'Bar': 'cocktail',
            'Pub': 'beer',
            'Hotel': 'bed'
        };
        return iconMap[category] || 'map-marker-alt';
    }

    // Place Details Modal Functions
    showPlaceDetails(place) {
        const modal = document.getElementById('placeDetailsModal');
        const content = document.getElementById('placeModalContent');
        
        const category = place.categories && place.categories[0] ? place.categories[0].name : 'Place';
        const address = place.location ? place.location.formatted_address : 'Address not available';
        const summary = this.generatePlaceSummary(place);
        
        content.innerHTML = `
            <div class="place-hero">
                <i class="fas fa-${this.getPlaceIcon(category)}"></i>
                <div class="place-hero-content">
                    <h2>${place.name}</h2>
                    <div class="category">${category}</div>
                    <div class="address">${address}</div>
                </div>
            </div>
            
            <div class="place-details-content">
                <div class="place-summary">
                    <h3>About this place</h3>
                    <p>${summary}</p>
                </div>
                
                <div class="place-stats">
                    <div class="stat-item">
                        <i class="fas fa-star"></i>
                        <div class="value">${place.authenticityScore}/100</div>
                        <div class="label">Authenticity</div>
                    </div>
                    
                    <div class="stat-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div class="value">${place.distance ? Math.round(place.distance) + 'm' : 'N/A'}</div>
                        <div class="label">Distance</div>
                    </div>
                    
                    <div class="stat-item">
                        <i class="fas fa-calendar"></i>
                        <div class="value">${place.date_created ? new Date(place.date_created).getFullYear() : 'N/A'}</div>
                        <div class="label">Established</div>
                    </div>
                    
                    <div class="stat-item">
                        <i class="fas fa-${place.chains && place.chains.length > 0 ? 'link' : 'star'}"></i>
                        <div class="value">${place.chains && place.chains.length > 0 ? 'Chain' : 'Independent'}</div>
                        <div class="label">Business Type</div>
                    </div>
                </div>
                
                <div class="place-actions-modal">
                    <button class="btn-primary btn-large btn-directions" onclick="window.app.getDirections('${place.latitude}', '${place.longitude}', '${place.name.replace(/'/g, "\\'")}')">
                        <i class="fas fa-directions"></i> Get Directions
                    </button>
                    ${place.website ? `
                        <button class="btn-secondary btn-large" onclick="window.open('${place.website}', '_blank')">
                            <i class="fas fa-globe"></i> Visit Website
                        </button>
                    ` : ''}
                    ${place.tel ? `
                        <button class="btn-secondary btn-large" onclick="window.open('tel:${place.tel}')">
                            <i class="fas fa-phone"></i> Call
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    closePlaceModal() {
        document.getElementById('placeDetailsModal').classList.remove('show');
    }

    generatePlaceSummary(place) {
        const category = place.categories && place.categories[0] ? place.categories[0].name.toLowerCase() : 'place';
        const isIndependent = !place.chains || place.chains.length === 0;
        const hasWebsite = !!place.website;
        const age = place.date_created ? new Date().getFullYear() - new Date(place.date_created).getFullYear() : 0;
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
        
        summary += `it offers an authentic local experience with an authenticity score of ${place.authenticityScore}/100. `;
        
        if (hasWebsite) {
            summary += `Visit their website for more information about their offerings and hours.`;
        } else {
            summary += `This local gem maintains a traditional approach to business.`;
        }
        
        return summary;
    }

    // Directions Function
    getDirections(lat, lng, placeName) {
        const currentLat = this.currentLocation.lat;
        const currentLng = this.currentLocation.lng;
        
        // Try to use different map applications based on device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // On mobile, try to open native apps first
            const appleUrl = `http://maps.apple.com/?saddr=${currentLat},${currentLng}&daddr=${lat},${lng}&dirflg=d`;
            const googleUrl = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${lat},${lng}`;
            
            // Try Apple Maps first on iOS, Google Maps on Android
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                window.open(appleUrl, '_blank');
            } else {
                window.open(googleUrl, '_blank');
            }
        } else {
            // On desktop, use Google Maps
            const url = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${lat},${lng}`;
            window.open(url, '_blank');
        }
    }

    showError(message) {
        const container = document.getElementById('resultsContainer');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Oops! Something went wrong</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `;
    }
}

// Additional CSS for error states and interactivity (injected via JavaScript)
const additionalStyles = `
    .no-results, .error-message {
        text-align: center;
        padding: 60px 20px;
        color: #666;
    }
    
    .no-results i, .error-message i {
        font-size: 3em;
        margin-bottom: 20px;
        color: #ddd;
    }
    
    .error-message i {
        color: #ff6b6b;
    }
    
    .no-results h3, .error-message h3 {
        margin-bottom: 10px;
        color: #333;
    }
    
    .retry-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 25px;
        border-radius: 25px;
        cursor: pointer;
        margin-top: 20px;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }

    /* Make place cards clickable */
    .place-card.clickable {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .place-card.clickable:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }

    /* Modal styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }

    .modal-overlay.show {
        display: flex;
    }

    .place-details-modal {
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        background: white;
        border-radius: 20px;
        position: relative;
    }

    .place-hero {
        display: flex;
        align-items: center;
        padding: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 20px 20px 0 0;
    }

    .place-hero i {
        font-size: 3em;
        margin-right: 20px;
        opacity: 0.8;
    }

    .place-hero-content h2 {
        margin: 0 0 5px 0;
        font-size: 1.8em;
    }

    .place-hero-content .category,
    .place-hero-content .address {
        opacity: 0.9;
        margin: 2px 0;
    }

    .place-details-content {
        padding: 30px;
    }

    .place-summary {
        margin-bottom: 30px;
    }

    .place-summary h3 {
        margin-bottom: 15px;
        color: #333;
    }

    .place-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .stat-item {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 15px;
    }

    .stat-item i {
        font-size: 1.5em;
        color: #667eea;
        margin-bottom: 10px;
    }

    .stat-item .value {
        font-size: 1.2em;
        font-weight: bold;
        color: #333;
        margin-bottom: 5px;
    }

    .stat-item .label {
        font-size: 0.9em;
        color: #666;
    }

    .place-actions-modal {
        display: grid;
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .btn-large {
        padding: 15px 25px;
        font-size: 1.1em;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .close-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 1.5em;
        padding: 10px 15px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    /* Interest button selected state */
    .interest-btn.selected,
    .modal-interest-btn.selected {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧭 Authenticity Compass Starting...');
    window.app = new AuthenticityCompass();
    console.log('✅ App initialized successfully!');
});