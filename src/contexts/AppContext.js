import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as Location from 'expo-location';
import { getStoredPreferences, storePreferences } from '../utils/storage';

const AppContext = createContext();

const initialState = {
  selectedInterests: [],
  currentLocation: null,
  userPreferences: {},
  isFirstVisit: true,
  isLoading: false,
  error: null,
  places: [],
  recommendations: [],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_INTERESTS':
      return { ...state, selectedInterests: action.payload };
    case 'ADD_INTEREST':
      return {
        ...state,
        selectedInterests: [...state.selectedInterests, action.payload],
      };
    case 'REMOVE_INTEREST':
      return {
        ...state,
        selectedInterests: state.selectedInterests.filter(
          interest => interest !== action.payload
        ),
      };
    case 'SET_LOCATION':
      return { ...state, currentLocation: action.payload };
    case 'SET_USER_PREFERENCES':
      return { ...state, userPreferences: action.payload };
    case 'SET_FIRST_VISIT':
      return { ...state, isFirstVisit: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PLACES':
      return { ...state, places: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AppContextProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const preferences = await getStoredPreferences();
      if (preferences) {
        dispatch({ type: 'SET_USER_PREFERENCES', payload: preferences });
        dispatch({ type: 'SET_INTERESTS', payload: preferences.interests || [] });
        dispatch({ type: 'SET_FIRST_VISIT', payload: false });
        if (preferences.location) {
          dispatch({ type: 'SET_LOCATION', payload: preferences.location });
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const saveUserPreferences = async () => {
    try {
      const preferences = {
        interests: state.selectedInterests,
        location: state.currentLocation,
        lastUpdate: Date.now(),
      };
      await storePreferences(preferences);
      dispatch({ type: 'SET_USER_PREFERENCES', payload: preferences });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const toggleInterest = (interest) => {
    if (state.selectedInterests.includes(interest)) {
      dispatch({ type: 'REMOVE_INTEREST', payload: interest });
    } else {
      dispatch({ type: 'ADD_INTEREST', payload: interest });
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      dispatch({ type: 'SET_LOCATION', payload: locationData });
      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      // Use default location (New York)
      const defaultLocation = { lat: 40.7, lng: -74.0 };
      dispatch({ type: 'SET_LOCATION', payload: defaultLocation });
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      dispatch({ type: 'SET_FIRST_VISIT', payload: false });
      await saveUserPreferences();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const contextValue = {
    state,
    dispatch,
    toggleInterest,
    getCurrentLocation,
    saveUserPreferences,
    completeOnboarding,
    loadUserPreferences,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}