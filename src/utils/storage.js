import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@authenticity_compass:user_preferences',
  SAVED_PLACES: '@authenticity_compass:saved_places',
};

export const getStoredPreferences = async () => {
  try {
    const preferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return preferences ? JSON.parse(preferences) : null;
  } catch (error) {
    console.error('Error getting stored preferences:', error);
    return null;
  }
};

export const storePreferences = async (preferences) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error storing preferences:', error);
    throw error;
  }
};

export const getSavedPlaces = async () => {
  try {
    const places = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
    return places ? JSON.parse(places) : [];
  } catch (error) {
    console.error('Error getting saved places:', error);
    return [];
  }
};

export const savePlace = async (place) => {
  try {
    const savedPlaces = await getSavedPlaces();
    const exists = savedPlaces.find(p => p.id === place.id);
    
    if (!exists) {
      savedPlaces.push(place);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_PLACES,
        JSON.stringify(savedPlaces)
      );
    }
    
    return savedPlaces;
  } catch (error) {
    console.error('Error saving place:', error);
    throw error;
  }
};

export const removeSavedPlace = async (placeId) => {
  try {
    const savedPlaces = await getSavedPlaces();
    const filteredPlaces = savedPlaces.filter(p => p.id !== placeId);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.SAVED_PLACES,
      JSON.stringify(filteredPlaces)
    );
    
    return filteredPlaces;
  } catch (error) {
    console.error('Error removing saved place:', error);
    throw error;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.SAVED_PLACES,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};