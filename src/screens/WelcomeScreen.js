import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { colors } from '../constants/colors';
import InterestCard from '../components/InterestCard';
import CustomButton from '../components/CustomButton';

const interests = [
  { id: 'coffee shop', label: 'Coffee Shops', icon: 'local-cafe' },
  { id: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { id: 'bookstore', label: 'Bookstores', icon: 'book' },
  { id: 'art gallery', label: 'Art Galleries', icon: 'palette' },
  { id: 'music venue', label: 'Music Venues', icon: 'music-note' },
  { id: 'bar', label: 'Bars & Pubs', icon: 'wine-bar' },
];

export default function WelcomeScreen({ navigation }) {
  const { state, toggleInterest, getCurrentLocation, completeOnboarding } = useAppContext();
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  
  useEffect(() => {
    // If user has already completed onboarding, navigate to home
    if (!state.isFirstVisit && state.selectedInterests.length > 0) {
      navigation.replace('Home');
    }
  }, [state.isFirstVisit, state.selectedInterests.length, navigation]);

  const handleStartJourney = async () => {
    if (state.selectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to continue.');
      return;
    }

    try {
      setIsLocationLoading(true);
      
      // Get location permission and current location
      await getCurrentLocation();
      
      // Complete onboarding
      await completeOnboarding();
      
      // Navigate to home screen
      navigation.replace('Home');
    } catch (error) {
      // Even if location fails, allow user to proceed
      await completeOnboarding();
      navigation.replace('Home');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const canProceed = state.selectedInterests.length > 0;

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="explore" size={60} color="white" />
            <Text style={styles.title}>Welcome to{'\n'}Authenticity Compass!</Text>
            <Text style={styles.subtitle}>
              Let's personalize your discovery experience
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.interestsSection}>
              <Text style={styles.sectionTitle}>What interests you most?</Text>
              <Text style={styles.sectionSubtitle}>
                Select your preferences to get personalized recommendations
              </Text>
              
              <View style={styles.interestsGrid}>
                {interests.map((interest) => (
                  <InterestCard
                    key={interest.id}
                    interest={interest}
                    isSelected={state.selectedInterests.includes(interest.id)}
                    onPress={() => toggleInterest(interest.id)}
                  />
                ))}
              </View>

              <Text style={styles.selectionCount}>
                {state.selectedInterests.length} of 6 interests selected
              </Text>
            </View>

            {/* Location Permission Info */}
            <View style={styles.locationSection}>
              <MaterialIcons name="location-on" size={24} color={colors.primary} />
              <Text style={styles.locationTitle}>Location Access</Text>
              <Text style={styles.locationText}>
                We'll use your location to find authentic places nearby
              </Text>
            </View>

            {/* Start Button */}
            <CustomButton
              title={
                isLocationLoading 
                  ? 'Getting Location...' 
                  : canProceed 
                    ? 'Start My Journey' 
                    : 'Select at least one interest'
              }
              onPress={handleStartJourney}
              disabled={!canProceed || isLocationLoading}
              loading={isLocationLoading}
              style={[
                styles.startButton,
                !canProceed && styles.disabledButton
              ]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    marginTop: 20,
  },
  interestsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  selectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  locationSection: {
    backgroundColor: colors.background,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  startButton: {
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});