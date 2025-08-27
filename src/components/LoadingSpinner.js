import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'large',
  color = colors.primary,
  style 
}) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 15,
    textAlign: 'center',
  },
});