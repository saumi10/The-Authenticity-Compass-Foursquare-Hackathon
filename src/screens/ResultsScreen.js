import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import PlaceCard from '../components/PlaceCard';
import { calculateAuthenticity } from '../utils/helpers';

export default function ResultsScreen({ route, navigation }) {
  const { places, query, type } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: type === 'search' ? 'Search Results' : 'Recommended Places',
      headerRight: () => (
        <View style={styles.headerRight}>
          <Text style={styles.countBadge}>{places.length} results</Text>
        </View>
      ),
    });
  }, [navigation, places.length, type]);

  const handlePlacePress = (place) => {
    navigation.navigate('PlaceDetails', { place });
  };

  const renderPlace = ({ item: place, index }) => {
    // Add authenticity data to place
    const placeWithAuth = {
      ...place,
      ...calculateAuthenticity(place),
    };

    return (
      <PlaceCard
        place={placeWithAuth}
        onPress={() => handlePlacePress(placeWithAuth)}
        style={styles.placeCard}   // ✅ remove opacity:0 and transform
        animationDelay={index * 100}
      />

    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>
        {type === 'search' ? `Results for "${query}"` : 'Recommended Places'}
      </Text>
      <Text style={styles.subtitle}>
        {type === 'search' 
          ? `${places.length} places found` 
          : `Based on your interests • ${places.length} authentic places discovered`
        }
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>No places found</Text>
      <Text style={styles.emptyText}>
        {type === 'search' 
          ? `No results found for "${query}". Try searching for something else.`
          : 'No authentic places found for your interests. Try different interests or search for something specific.'
        }
      </Text>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (places.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderEmpty()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={places}
        renderItem={renderPlace}
        keyExtractor={(item, index) => `${item.id || item.name}-${index}`}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingBottom: 20,
  },
  headerRight: {
    marginRight: 10,
  },
  countBadge: {
    backgroundColor: colors.white,
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  placeCard: {
    marginHorizontal: 20,
  },
  separator: {
    height: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});