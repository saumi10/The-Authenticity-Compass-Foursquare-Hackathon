// src/services/GeminiService.js
class GeminiService {
  constructor() {
    // Store your API key in environment variables or secure config
    this.apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';


  }

  async generateContent(prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            topK: options.topK || 40,
            topP: options.topP || 0.95,
            maxOutputTokens: options.maxOutputTokens || 1024,
            ...options.generationConfig
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return {
          success: true,
          text: data.candidates[0].content.parts[0].text,
          data: data
        };
      }
      
      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        success: false,
        error: error.message,
        text: 'Sorry, I encountered an error processing your request. Please try again.'
      };
    }
  }

  generatePlaceReview(place) {
    const placeInfo = {
      name: place.name || 'Unknown Place',
      category: place.categories?.[0]?.name || 'Place',
      address: place.location?.formatted_address || 'Address not available',
      authenticityScore: place.authenticityScore || 'N/A',
      isChain: place.chains && place.chains.length > 0,
      businessType: place.chains && place.chains.length > 0 ? 'Chain' : 'Independent',
      established: place.date_created ? new Date(place.date_created).getFullYear() : null,
      distance: place.distance ? Math.round(place.distance) : null,
      website: place.website || null,
      phone: place.tel || null,
    };

    const prompt = `Please provide a comprehensive and engaging review for this place:

📍 **${placeInfo.name}**
🏷️ Category: ${placeInfo.category}
📍 Address: ${placeInfo.address}
⭐ Authenticity Score: ${placeInfo.authenticityScore}/100
🏢 Business Type: ${placeInfo.businessType}
${placeInfo.established ? `📅 Established: ${placeInfo.established}\n` : ''}${placeInfo.distance ? `📏 Distance: ${placeInfo.distance}m away\n` : ''}${placeInfo.website ? `🌐 Website: Available\n` : ''}${placeInfo.phone ? `📞 Phone: Available\n` : ''}

As an AI travel and local business expert, please provide:

1. **Overall Assessment**: What makes this place special or noteworthy?
2. **Authenticity Insights**: Based on the ${placeInfo.authenticityScore}/100 authenticity score, what does this tell us about the place's character?
3. **What to Expect**: Atmosphere, typical experience, and what visitors should know
4. **Recommendations**: Best times to visit, what to try/do, or insider tips
5. **Local Context**: How this place fits into the local community or area

Keep the tone conversational, informative, and helpful. Focus on practical insights that would help someone decide whether to visit and what to expect. If it's a chain business, acknowledge that while also highlighting what might make this particular location unique.

Make it feel like advice from a knowledgeable local friend who knows the area well.`;

    return this.generateContent(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1200
    });
  }

  generateContextualResponse(place, conversationHistory, userQuestion) {
    const placeInfo = {
      name: place.name || 'Unknown Place',
      category: place.categories?.[0]?.name || 'Place',
      address: place.location?.formatted_address || 'Address not available',
      authenticityScore: place.authenticityScore || 'N/A',
      businessType: place.chains && place.chains.length > 0 ? 'Chain' : 'Independent',
    };

    // Create conversation context
    const contextMessages = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.isUser ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n');

    const prompt = `You are an AI assistant helping users learn about ${placeInfo.name}, a ${placeInfo.category} located at ${placeInfo.address}.

**Place Details:**
- Authenticity Score: ${placeInfo.authenticityScore}/100
- Business Type: ${placeInfo.businessType}

**Recent Conversation:**
${contextMessages}

**User's New Question:** ${userQuestion}

Please provide a helpful, conversational response that:
1. Directly addresses their question about this specific place
2. Builds on our previous conversation context
3. Offers practical, actionable information
4. Maintains a friendly, knowledgeable tone
5. Stays focused on this place and related local insights

If the question is off-topic or not related to this place, gently redirect while still being helpful.

Keep responses concise but informative (aim for 2-4 sentences unless more detail is specifically requested).`;

    return this.generateContent(prompt, {
      temperature: 0.6,
      maxOutputTokens: 800
    });
  }

  // Helper method to validate API key
  isConfigured() {
    return this.apiKey && this.apiKey !== 'YOUR_GEMINI_API_KEY';
  }

  // Method to get API key setup instructions
  getSetupInstructions() {
    return `To use the AI Review feature:
1. Get a Gemini API key from Google AI Studio (https://makersuite.google.com/app/apikey)
2. Add it to your environment variables as EXPO_PUBLIC_GEMINI_API_KEY
3. Or replace 'YOUR_GEMINI_API_KEY' in the GeminiService constructor

The API key should start with 'AIza...'`;
  }
}

export default new GeminiService();