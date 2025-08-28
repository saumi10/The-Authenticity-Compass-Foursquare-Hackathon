import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AppContext = createContext();

const initialState = {
  selectedInterests: [],
  currentLocation: null,
  recommendations: [],
  isLoading: false,
  error: null,
  hasCompletedOnboarding: false,
  isFirstVisit: true,
  user: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        // Reset user-specific data when user changes
        selectedInterests: action.payload ? state.selectedInterests : [],
        isFirstVisit: action.payload ? state.isFirstVisit : true,
        hasCompletedOnboarding: action.payload ? state.hasCompletedOnboarding : false,
      };
    case 'SET_SELECTED_INTERESTS':
      return {
        ...state,
        selectedInterests: action.payload,
      };
    case 'TOGGLE_INTEREST':
      const interests = state.selectedInterests.includes(action.payload)
        ? state.selectedInterests.filter(id => id !== action.payload)
        : [...state.selectedInterests, action.payload];
      return {
        ...state,
        selectedInterests: interests,
      };
    case 'SET_CURRENT_LOCATION':
      return {
        ...state,
        currentLocation: action.payload,
      };
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_FIRST_VISIT':
      return {
        ...state,
        isFirstVisit: action.payload,
      };
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        hasCompletedOnboarding: true,
        isFirstVisit: false,
      };
    case 'RESET_STATE':
      return {
        ...initialState,
        user: null,
      };
    default:
      return state;
  }
}

export function AppContextProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user) {
        // Load user-specific preferences
        await loadUserPreferences(user.uid);
      } else {
        // Clear state when user logs out
        dispatch({ type: 'RESET_STATE' });
      }
    });

    return unsubscribe;
  }, []);

  // Load user-specific preferences from AsyncStorage
  const loadUserPreferences = async (userId) => {
    try {
      const savedInterests = await AsyncStorage.getItem(`interests_${userId}`);
      const onboardingStatus = await AsyncStorage.getItem(`onboardingDone_${userId}`);
      
      if (savedInterests) {
        const interests = JSON.parse(savedInterests);
        dispatch({ type: 'SET_SELECTED_INTERESTS', payload: interests });
      }
      
      if (onboardingStatus) {
        dispatch({ type: 'COMPLETE_ONBOARDING' });
      } else {
        dispatch({ type: 'SET_FIRST_VISIT', payload: true });
      }
      
      console.log(`Loaded preferences for user ${userId}:`, {
        interests: savedInterests ? JSON.parse(savedInterests) : [],
        hasCompletedOnboarding: !!onboardingStatus
      });
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Save user preferences to AsyncStorage
  const saveUserPreferences = async () => {
    if (!state.user) return;
    
    try {
      await AsyncStorage.setItem(
        `interests_${state.user.uid}`,
        JSON.stringify(state.selectedInterests)
      );
      console.log('Preferences saved for user:', state.user.uid);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const toggleInterest = async (interestId) => {
    dispatch({ type: 'TOGGLE_INTEREST', payload: interestId });
    
    // Auto-save after toggling
    setTimeout(async () => {
      await saveUserPreferences();
    }, 100);
  };

  const getCurrentLocation = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
        maximumAge: 60000,
      });

      const currentLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      dispatch({ type: 'SET_CURRENT_LOCATION', payload: currentLocation });
      return currentLocation;
    } catch (error) {
      console.error('Location error:', error);
      // Set default location (New York)
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      dispatch({ type: 'SET_CURRENT_LOCATION', payload: defaultLocation });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const completeOnboarding = async () => {
    if (!state.user) return;
    
    try {
      await AsyncStorage.setItem(`onboardingDone_${state.user.uid}`, 'true');
      await saveUserPreferences();
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      console.log('Onboarding completed for user:', state.user.uid);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  // Clear user data on logout
  const clearUserData = async () => {
    if (!state.user) return;
    
    try {
      // Optionally clear user data from AsyncStorage on logout
      // await AsyncStorage.removeItem(`interests_${state.user.uid}`);
      // await AsyncStorage.removeItem(`onboardingDone_${state.user.uid}`);
      
      console.log('Cleared user data for:', state.user.uid);
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const value = {
    state,
    dispatch,
    toggleInterest,
    getCurrentLocation,
    saveUserPreferences,
    loadUserPreferences,
    completeOnboarding,
    clearUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}