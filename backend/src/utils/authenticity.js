class AuthenticityScorer {
    calculateAuthenticityScore(place) {
        let score = 50; // Base score
        
        // Distance factor (closer = more authentic for local discovery)
        if (place.distance) {
            if (place.distance < 500) score += 15;
            else if (place.distance < 1000) score += 10;
            else if (place.distance < 2000) score += 5;
        }

        // Chain vs Independent (independent = more authentic)
        if (!place.chains || place.chains.length === 0) {
            score += 20;
        } else {
            score -= 10;
        }

        // Age of establishment (older = more authentic)
        if (place.date_created) {
            const createdYear = new Date(place.date_created).getFullYear();
            const currentYear = new Date().getFullYear();
            const age = currentYear - createdYear;
            
            if (age > 10) score += 15;
            else if (age > 5) score += 10;
            else if (age > 2) score += 5;
        }

        // Social media presence (moderate presence = good balance)
        let socialCount = 0;
        if (place.social_media) {
            if (place.social_media.facebook_id) socialCount++;
            if (place.social_media.instagram) socialCount++;
            if (place.social_media.twitter) socialCount++;
        }
        
        if (socialCount === 1 || socialCount === 2) score += 5;
        else if (socialCount >= 3) score += 2;

        // Has website (professional but accessible)
        if (place.website) score += 5;

        // Local characteristics
        if (place.tel && place.tel.includes('(718)')) score += 5; // Brooklyn area code
        
        // Ensure score is between 0 and 100
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    getAuthenticityLabel(score) {
        if (score >= 85) return { label: 'Highly Authentic', class: 'auth-high' };
        if (score >= 70) return { label: 'Very Authentic', class: 'auth-very' };
        if (score >= 55) return { label: 'Authentic', class: 'auth-good' };
        if (score >= 40) return { label: 'Somewhat Authentic', class: 'auth-okay' };
        return { label: 'Tourist Spot', class: 'auth-low' };
    }

    processPlaces(places) {
        return places.map(place => {
            const authenticityScore = this.calculateAuthenticityScore(place);
            const authenticityInfo = this.getAuthenticityLabel(authenticityScore);
            
            return {
                ...place,
                authenticityScore,
                authenticityLabel: authenticityInfo.label,
                authenticityClass: authenticityInfo.class
            };
        }).sort((a, b) => b.authenticityScore - a.authenticityScore);
    }
}

module.exports = new AuthenticityScorer();