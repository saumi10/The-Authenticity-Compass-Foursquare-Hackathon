import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { colors } from '../constants/colors';
import SearchBar from '../components/SearchBar';
import InterestCard from '../components/InterestCard';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ApiService from '../services/apiService';

const interests = [
  { id: 'coffee shop', label: 'Coffee Shops', icon: 'local-cafe' },
  { id: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { id: 'bookstore', label: 'Bookstores', icon: 'book' },
  { id: 'art gallery', label: 'Art Galleries', icon: 'palette' },
  { id: 'music venue', label: 'Music Venues', icon: 'music-note' },
];

export default function HomeScreen({ navigation }) {
  const { state, dispatch, toggleInterest, getCurrentLocation, saveUserPreferences } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [locationText, setLocationText] = useState('Getting location...');

  useEffect(() => {
    initializeHome();
  }, []);

  useEffect(() => {
    if (state.selectedInterests.length > 0) {
      loadRecommendations();
    }
  }, [state.selectedInterests, state.currentLocation]);

  useEffect(() => {
    updateLocationText();
  }, [state.currentLocation]);

  const initializeHome = async () => {
    try {
      if (!state.currentLocation) {
        await getCurrentLocation();
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const updateLocationText = () => {
    if (state.currentLocation) {
      setLocationText(
        `📍 Location found (${state.currentLocation.lat.toFixed(3)}, ${state.currentLocation.lng.toFixed(3)})`
      );
    } else {
      setLocationText('📍 Using default location (New York)');
    }
  };

  const loadRecommendations = async () => {
    if (state.selectedInterests.length === 0) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await ApiService.getRecommendations(
        state.selectedInterests,
        state.currentLocation
      );

      if (result.success) {
        dispatch({ type: 'SET_RECOMMENDATIONS', payload: result.places });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load recommendations' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleInterestToggle = async (interestId) => {
    toggleInterest(interestId);
    await saveUserPreferences();
    
    // Auto-search for selected interests
    if (state.selectedInterests.includes(interestId) || state.selectedInterests.length === 0) {
      setTimeout(() => {
        if (state.selectedInterests.length > 0) {
          searchSelectedInterests(interestId);
        }
      }, 500);
    }
  };

  const searchSelectedInterests = async (newInterest) => {
    try {
      const query = newInterest || state.selectedInterests[0];
      if (!query) return;

      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await ApiService.searchPlaces(query, state.currentLocation, 5);

      if (result.success) {
        navigation.navigate('Results', {
          places: result.places,
          query,
          type: 'interest'
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error });
      }
    } catch (error) {
      console.error('Search error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Search failed. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      Alert.alert('Search Required', 'Please enter a search term');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await ApiService.searchPlaces(query, state.currentLocation, 5);

      if (result.success) {
        navigation.navigate('Results', {
          places: result.places,
          query,
          type: 'search'
        });
      } else {
        Alert.alert('Search Error', result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search places. Please try again.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handlePlacePress = (place) => {
    navigation.navigate('PlaceDetails', { place });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await getCurrentLocation();
      if (state.selectedInterests.length > 0) {
        await loadRecommendations();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const openSettings = () => {
    navigation.navigate('Welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Settings */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
            <MaterialIcons name="settings" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Recommendations Section */}
        {state.selectedInterests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="star" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recommended for You</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Based on your interests and location
            </Text>
            
            {state.isLoading ? (
              <LoadingSpinner message="Loading recommendations..." />
            ) : state.error ? (
              <ErrorMessage 
                message={state.error}
                onRetry={loadRecommendations}
              />
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.recommendationsScroll}
              >
                {state.recommendations.map((place, index) => (
                  <PlaceCard
                    key={`${place.id}-${index}`}
                    place={place}
                    onPress={() => handlePlacePress(place)}
                    style={styles.recommendationCard}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What interests you?</Text>
          <View style={styles.interestsGrid}>
            {interests.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                isSelected={state.selectedInterests.includes(interest.id)}
                onPress={() => handleInterestToggle(interest.id)}
                style={styles.interestCard}
              />
            ))}
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.section}>
          <SearchBar onSearch={handleSearch} />
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.section}>
          <View style={styles.mapPlaceholder}>
            <MaterialIcons name="map" size={48} color={colors.primary} />
            <Text style={styles.mapTitle}>Interactive map coming soon...</Text>
            <Text style={styles.mapSubtitle}>
              Will show your location and discovered places
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  recommendationsScroll: {
    marginHorizontal: -10,
  },
  recommendationCard: {
    width: 280,
    marginHorizontal: 10,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  interestCard: {
    width: '48%',
    marginBottom: 15,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  mapPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background,
    borderRadius: 15,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 15,
    marginBottom: 5,
  },
  mapSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});