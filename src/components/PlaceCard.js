import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { 
  getPlaceIcon, 
  getAuthenticityColor, 
  formatDistance,
  openDirections 
} from '../utils/helpers';

export default function PlaceCard({ place, onPress, style, animationDelay = 0 }) {
  const address = place.location?.formatted_address || 'Address not available';
  const category = place.categories && place.categories[0] 
    ? place.categories[0].name 
    : 'Place';
  const distance = formatDistance(place.distance);
  const authenticityColor = getAuthenticityColor(place.authenticityScore);

  const handleDirections = (e) => {
    e.stopPropagation();
    if (place.latitude && place.longitude) {
      openDirections(place.latitude, place.longitude, place.name);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {/* Header with Image Placeholder */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.imageContainer}
        >
          <MaterialIcons
            name={getPlaceIcon(category)}
            size={32}
            color="white"
          />
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.placeInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {place.name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            </View>
            
            <View style={[styles.authenticityBadge, { backgroundColor: authenticityColor }]}>
              <Text style={styles.authenticityText}>
                {place.authenticityScore}/100
              </Text>
            </View>
          </View>

          {/* Address and Distance */}
          <View style={styles.locationInfo}>
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
            {place.distance && (
              <Text style={styles.distance}>{distance}</Text>
            )}
          </View>

          {/* Details */}
          <View style={styles.details}>
            {place.tel && (
              <View style={styles.detailItem}>
                <MaterialIcons name="phone" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>Phone available</Text>
              </View>
            )}
            
            {place.website && (
              <View style={styles.detailItem}>
                <MaterialIcons name="language" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>Has website</Text>
              </View>
            )}
            
            <View style={styles.detailItem}>
              <MaterialIcons 
                name={place.chains && place.chains.length > 0 ? "link" : "star"} 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={styles.detailText}>
                {place.chains && place.chains.length > 0 
                  ? `Part of ${place.chains[0].name}`
                  : 'Independent Business'
                }
              </Text>
            </View>

            {place.date_created && (
              <View style={styles.detailItem}>
                <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>
                  Since {new Date(place.date_created).getFullYear()}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.directionsButton]}
              onPress={handleDirections}
            >
              <MaterialIcons name="directions" size={16} color="white" />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.detailsButton]}
              onPress={onPress}
            >
              <MaterialIcons name="info" size={16} color={colors.primary} />
              <Text style={[styles.actionButtonText, styles.detailsButtonText]}>
                Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  placeInfo: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  authenticityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 70,
    alignItems: 'center',
  },
  authenticityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  locationInfo: {
    marginBottom: 15,
  },
  address: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    color: colors.textLight,
  },
  details: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 6,
  },
  directionsButton: {
    backgroundColor: colors.primary,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  detailsButtonText: {
    color: colors.primary,
  },
});