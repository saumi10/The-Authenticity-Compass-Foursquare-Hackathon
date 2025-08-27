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
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { colors } from '../constants/colors';
import SearchBar from '../components/SearchBar';
import InterestCard from '../components/InterestCard';
import PlaceCard from '../components/PlaceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CustomButton from '../components/CustomButton';
import ApiService from '../services/apiService';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AsyncStorage from "@react-native-async-storage/async-storage";

const interests = [
  { id: 'coffee shop', label: 'Coffee Shops', icon: 'local-cafe' },
  { id: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { id: 'bookstore', label: 'Bookstores', icon: 'book' },
  { id: 'art gallery', label: 'Art Galleries', icon: 'palette' },
  { id: 'music venue', label: 'Music Venues', icon: 'music-note' },
  { id: 'bar', label: 'Bars & Pubs', icon: 'wine-bar' },
];

export default function HomeScreen({ navigation }) {
  const { state, dispatch, toggleInterest, getCurrentLocation, saveUserPreferences } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [locationText, setLocationText] = useState('Getting location...');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [tempSelectedInterests, setTempSelectedInterests] = useState([]);

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

  const openPreferencesModal = () => {
    setTempSelectedInterests([...state.selectedInterests]);
    setShowPreferencesModal(true);
  };

  const handleTempInterestToggle = (interestId) => {
    setTempSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  const savePreferences = async () => {
    if (tempSelectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest.');
      return;
    }

    try {
      // Update the interests in context
      dispatch({ type: 'SET_SELECTED_INTERESTS', payload: tempSelectedInterests });
      
      // Save to AsyncStorage
      const userId = auth.currentUser?.uid;
      if (userId) {
        await AsyncStorage.setItem(
          `interests_${userId}`,
          JSON.stringify(tempSelectedInterests)
        );
      }

      await saveUserPreferences();
      setShowPreferencesModal(false);
      
      // Reload recommendations with new interests
      if (tempSelectedInterests.length > 0) {
        await loadRecommendations();
      }
      
      Alert.alert('Success', 'Your preferences have been updated!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  const cancelPreferences = () => {
    setTempSelectedInterests([...state.selectedInterests]);
    setShowPreferencesModal(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Settings + Logout */}
        <View style={styles.header}>
          <View style={styles.rightButtons}>
            <TouchableOpacity style={[styles.iconButton, styles.logoutBtn]} onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="white" />
            </TouchableOpacity>
          </View>
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

      {/* Preferences Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPreferencesModal}
        onRequestClose={cancelPreferences}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Your Preferences</Text>
              <TouchableOpacity onPress={cancelPreferences} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Select your interests to get personalized recommendations
              </Text>
              
              <View style={styles.modalInterestsGrid}>
                {interests.map((interest) => (
                  <InterestCard
                    key={interest.id}
                    interest={interest}
                    isSelected={tempSelectedInterests.includes(interest.id)}
                    onPress={() => handleTempInterestToggle(interest.id)}
                    style={styles.modalInterestCard}
                  />
                ))}
              </View>

              <Text style={styles.selectionCount}>
                {tempSelectedInterests.length} of {interests.length} interests selected
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelPreferences}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <CustomButton
                title="Save Preferences"
                onPress={savePreferences}
                disabled={tempSelectedInterests.length === 0}
                style={[
                  styles.saveButton,
                  tempSelectedInterests.length === 0 && styles.disabledButton
                ]}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  rightButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 10,
    borderRadius: 25,
    marginLeft: 10,
  },
  settingsBtn: {
    backgroundColor: '#007BFF', // Blue
  },
  logoutBtn: {
    backgroundColor: '#000000', // Black
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
  justifyContent: 'center', // center instead of space-between
  gap: 12, // spacing between buttons
  paddingHorizontal: 10,
  marginTop: 10,
},

interestCard: {
  width: 140, // fixed width, not % based
  marginBottom: 12,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInterestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalInterestCard: {
    width: '48%',
    marginBottom: 15,
  },
  selectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 25,
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
});