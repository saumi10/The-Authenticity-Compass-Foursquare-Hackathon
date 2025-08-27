import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { 
  openDirections, 
  makePhoneCall, 
  openWebsite,
  generatePlaceSummary,
  getAuthenticityColor,
  formatDistance
} from '../utils/helpers';
import { savePlace, getSavedPlaces } from '../utils/storage';
import CustomButton from '../components/CustomButton';

export default function PlaceDetailsScreen({ route, navigation }) {
  const { place } = route.params;
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: place.name,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSaveToggle}
        >
          <MaterialIcons
            name={isSaved ? "favorite" : "favorite-border"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      ),
    });

    checkIfSaved();
  }, [navigation, place.name, isSaved]);

  const checkIfSaved = async () => {
    try {
      const savedPlaces = await getSavedPlaces();
      setIsSaved(savedPlaces.some(p => p.id === place.id));
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
    try {
      setIsLoading(true);
      
      if (isSaved) {
        // Remove from saved (implement removeSavedPlace if needed)
        Alert.alert('Remove from Saved', 'Feature coming soon!');
      } else {
        await savePlace(place);
        setIsSaved(true);
        Alert.alert('Saved!', 'Place saved to your favorites');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save place');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirections = () => {
    if (place.latitude && place.longitude) {
      openDirections(place.latitude, place.longitude, place.name);
    } else {
      Alert.alert('Location Not Available', 'Coordinates not available for this place');
    }
  };

  const handleCall = () => {
    if (place.tel) {
      makePhoneCall(place.tel);
    } else {
      Alert.alert('Phone Not Available', 'Phone number not available for this place');
    }
  };

  const handleWebsite = () => {
    if (place.website) {
      openWebsite(place.website);
    } else {
      Alert.alert('Website Not Available', 'Website not available for this place');
    }
  };

  const category = place.categories && place.categories[0] 
    ? place.categories[0].name 
    : 'Place';
  const address = place.location 
    ? place.location.formatted_address 
    : 'Address not available';
  const summary = generatePlaceSummary(place);
  const authenticityColor = getAuthenticityColor(place.authenticityScore);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.hero}
        >
          <View style={styles.heroContent}>
            <MaterialIcons
              name="place"
              size={60}
              color="white"
              style={styles.heroIcon}
            />
            <View style={styles.heroText}>
              <Text style={styles.placeName}>{place.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
              <Text style={styles.placeAddress}>{address}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this place</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{place.authenticityScore}/100</Text>
              <Text style={styles.statLabel}>Authenticity</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="location-on" size={24} color={colors.primary} />
              <Text style={styles.statValue}>
                {place.distance ? `${Math.round(place.distance)}m` : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons name="calendar-today" size={24} color={colors.primary} />
              <Text style={styles.statValue}>
                {place.date_created ? new Date(place.date_created).getFullYear() : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Established</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialIcons 
                name={place.chains && place.chains.length > 0 ? "link" : "star"} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={styles.statValue}>
                {place.chains && place.chains.length > 0 ? 'Chain' : 'Independent'}
              </Text>
              <Text style={styles.statLabel}>Business Type</Text>
            </View>
          </View>

          {/* Contact Information */}
          {(place.tel || place.website) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.contactInfo}>
                {place.tel && (
                  <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                    <MaterialIcons name="phone" size={20} color={colors.primary} />
                    <Text style={styles.contactText}>{place.tel}</Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                )}
                
                {place.website && (
                  <TouchableOpacity style={styles.contactItem} onPress={handleWebsite}>
                    <MaterialIcons name="language" size={20} color={colors.primary} />
                    <Text style={styles.contactText}>Visit Website</Text>
                    <MaterialIcons name="chevron-right" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsList}>
              {place.chains && place.chains.length > 0 && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="link" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailText}>Part of {place.chains[0].name}</Text>
                </View>
              )}
              
              {(!place.chains || place.chains.length === 0) && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="star" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailText}>Independent Business</Text>
                </View>
              )}
              
              {place.date_created && (
                <View style={styles.detailItem}>
                  <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
                  <Text style={styles.detailText}>
                    Since {new Date(place.date_created).getFullYear()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            <CustomButton
              title="Get Directions"
              onPress={handleDirections}
              icon="directions"
              style={styles.primaryAction}
            />
            
            <View style={styles.secondaryActions}>
              {place.website && (
                <CustomButton
                  title="Visit Website"
                  onPress={handleWebsite}
                  icon="language"
                  variant="outline"
                  style={styles.secondaryAction}
                />
              )}
              
              {place.tel && (
                <CustomButton
                  title="Call"
                  onPress={handleCall}
                  icon="phone"
                  variant="outline"
                  style={styles.secondaryAction}
                />
              )}
            </View>
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
  },
  headerButton: {
    marginRight: 15,
  },
  hero: {
    height: 200,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    marginRight: 15,
    opacity: 0.8,
  },
  heroText: {
    flex: 1,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  placeAddress: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingTop: 30,
    paddingBottom: 30,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 25,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 20,
    backgroundColor: colors.background,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 15,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  contactInfo: {
    backgroundColor: colors.background,
    borderRadius: 15,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  detailsList: {
    backgroundColor: colors.background,
    borderRadius: 15,
    paddingVertical: 5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  primaryAction: {
    marginBottom: 15,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    marginHorizontal: 5,
  },
});