// src/services/NotificationService.js
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './apiService';

const TRAVEL_MODE_TASK = 'travel-mode-background-task';
const NOTIFICATION_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background task for travel mode
TaskManager.defineTask(TRAVEL_MODE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Travel mode background task error:', error);
    return;
  }

  try {
    const travelModeEnabled = await AsyncStorage.getItem('travelModeEnabled');
    if (!travelModeEnabled) return;

    const userPreferences = await AsyncStorage.getItem('selectedInterests');
    const preferences = userPreferences ? JSON.parse(userPreferences) : [];
    
    if (preferences.length === 0) return;

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Get recommendations based on current location and preferences
    const result = await ApiService.getRecommendations(
      preferences,
      {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      }
    );

    if (result.success && result.places.length > 0) {
      const place = result.places[0]; // Get the top recommendation
      const notification = createNotificationContent(place, preferences[0]);
      
      await Notifications.scheduleNotificationAsync({
        content: notification,
        trigger: null, // Show immediately
      });
    }
  } catch (error) {
    console.error('Travel mode notification error:', error);
  }
});

// Create catchy notification content based on place type
const createNotificationContent = (place, category) => {
  const catchyLines = {
    'coffee shop': [
      "Fresh brew alert! Authentic coffee spot nearby",
      "Local coffee culture awaits you",
      "Discover your next favorite coffee hideaway"
    ],
    'restaurant': [
      "Hungry? Authentic local flavors just discovered",
      "Hidden culinary gem found near you",
      "Local food scene calling your name"
    ],
    'bookstore': [
      "Book lover's paradise spotted nearby",
      "Literary adventure awaits around the corner",
      "Independent bookstore treasure found"
    ],
    'art gallery': [
      "Creative inspiration discovered nearby",
      "Local art scene awaits your visit",
      "Gallery gem spotted in your area"
    ],
    'music venue': [
      "Live music spot discovered nearby",
      "Sound of authenticity calling you",
      "Music venue with soul found"
    ],
    'bar': [
      "Authentic local hangout discovered",
      "Craft drinks and character nearby",
      "Local watering hole with personality"
    ]
  };

  const lines = catchyLines[category] || ["Authentic local spot discovered nearby"];
  const randomLine = lines[Math.floor(Math.random() * lines.length)];

  return {
    title: "Travel Mode Discovery",
    body: `${randomLine}: ${place.name}`,
    data: {
      placeId: place.id,
      place: JSON.stringify(place),
      screen: 'PlaceDetails'
    },
    sound: 'default',
  };
};

class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  static async requestLocationPermissions() {
    try {
      // Request foreground location permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Location permissions are required for Travel Mode');
      }

      // Check if background permissions are needed
      if (Platform.OS === 'android') {
        // On Android, check if we can request background permissions
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          // Provide detailed instructions for Android users
          throw new Error('Background location access is required for Travel Mode. Please go to Settings > Apps > Authenticity Compass > Permissions > Location and select "Allow all the time".');
        }
      } else if (Platform.OS === 'ios') {
        // On iOS, background permissions are requested automatically when needed
        // But we should inform the user about what to expect
        const backgroundPermissions = await Location.getBackgroundPermissionsAsync();
        if (backgroundPermissions.status !== 'granted') {
          throw new Error('Background location access is required for Travel Mode. When prompted, please select "Allow While Using App" or "Always Allow" for location access.');
        }
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async showPermissionAlert() {
    return new Promise((resolve) => {
      Alert.alert(
        'Background Location Required',
        Platform.OS === 'android' 
          ? 'To receive travel notifications, please:\n\n1. Go to Settings > Apps > Authenticity Compass > Permissions\n2. Tap "Location"\n3. Select "Allow all the time"\n\nThis allows the app to find authentic places even when closed.'
          : 'To receive travel notifications, please allow location access "Always" when prompted. This allows the app to find authentic places even when closed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: Platform.OS === 'android' ? 'Open Settings' : 'Continue',
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.openSettings();
              }
              resolve(true);
            }
          }
        ]
      );
    });
  }

  static async enableTravelMode(preferences) {
    if (!preferences || preferences.length === 0) {
      throw new Error('At least one preference must be selected to enable Travel Mode');
    }

    // Request notification permissions first
    const hasNotificationPermission = await this.requestPermissions();
    if (!hasNotificationPermission) {
      throw new Error('Notification permissions are required for Travel Mode');
    }

    try {
      // Request location permissions with better error handling
      await this.requestLocationPermissions();
    } catch (locationError) {
      // If background permissions failed, offer alternative
      const userWantsToTry = await this.showPermissionAlert();
      if (!userWantsToTry) {
        throw new Error('Background location permissions are required for Travel Mode');
      }

      // Try again after user potentially changed settings
      try {
        await this.requestLocationPermissions();
      } catch (secondError) {
        throw new Error('Unable to obtain required permissions. Please check your device settings and try again.');
      }
    }

    // Enable travel mode
    await AsyncStorage.setItem('travelModeEnabled', 'true');
    await AsyncStorage.setItem('selectedInterests', JSON.stringify(preferences));

    try {
      // Start background location updates with error handling
      await Location.startLocationUpdatesAsync(TRAVEL_MODE_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: NOTIFICATION_INTERVAL,
        distanceInterval: 100, // meters
        deferredUpdatesInterval: NOTIFICATION_INTERVAL,
        // Android specific options
        ...(Platform.OS === 'android' && {
          foregroundService: {
            notificationTitle: 'Travel Mode Active',
            notificationBody: 'Finding authentic places nearby...',
            notificationColor: '#667eea',
          },
        }),
        // iOS specific options
        ...(Platform.OS === 'ios' && {
          activityType: Location.ActivityType.Other,
          showsBackgroundLocationIndicator: true,
        }),
      });
    } catch (taskError) {
      console.error('Failed to start background location updates:', taskError);
      // Clean up on failure
      await AsyncStorage.removeItem('travelModeEnabled');
      throw new Error('Failed to start background location tracking. Please try again.');
    }

    return true;
  }

  static async disableTravelMode() {
    await AsyncStorage.removeItem('travelModeEnabled');
    
    // Stop background location updates
    const isTaskRunning = await TaskManager.isTaskRegisteredAsync(TRAVEL_MODE_TASK);
    if (isTaskRunning) {
      try {
        await Location.stopLocationUpdatesAsync(TRAVEL_MODE_TASK);
      } catch (error) {
        console.error('Error stopping location updates:', error);
      }
    }

    // Cancel all pending notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    return true;
  }

  static async isTravelModeEnabled() {
    const enabled = await AsyncStorage.getItem('travelModeEnabled');
    return enabled === 'true';
  }

  static async checkBackgroundPermissionStatus() {
    try {
      if (Platform.OS === 'android') {
        const { status } = await Location.getBackgroundPermissionsAsync();
        return status === 'granted';
      } else if (Platform.OS === 'ios') {
        const { status } = await Location.getBackgroundPermissionsAsync();
        return status === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Error checking background permissions:', error);
      return false;
    }
  }

  static setupNotificationResponseListener(navigation) {
    return Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data.screen === 'PlaceDetails' && data.place) {
        try {
          const place = JSON.parse(data.place);
          navigation.navigate('PlaceDetails', { place });
        } catch (error) {
          console.error('Error parsing notification data:', error);
        }
      }
    });
  }
}

export default NotificationService;