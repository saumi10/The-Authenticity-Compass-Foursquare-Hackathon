import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function CustomButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // primary, secondary, outline
  size = 'medium', // small, medium, large
  icon,
  style,
}) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    // Size styles
    if (size === 'small') baseStyle.push(styles.smallButton);
    if (size === 'large') baseStyle.push(styles.largeButton);
    
    // Variant styles
    if (variant === 'primary') baseStyle.push(styles.primaryButton);
    if (variant === 'secondary') baseStyle.push(styles.secondaryButton);
    if (variant === 'outline') baseStyle.push(styles.outlineButton);
    
    // State styles
    if (disabled || loading) baseStyle.push(styles.disabledButton);
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    // Size styles
    if (size === 'small') baseStyle.push(styles.smallText);
    if (size === 'large') baseStyle.push(styles.largeText);
    
    // Variant styles
    if (variant === 'primary') baseStyle.push(styles.primaryText);
    if (variant === 'secondary') baseStyle.push(styles.secondaryText);
    if (variant === 'outline') baseStyle.push(styles.outlineText);
    
    return baseStyle;
  };

  const getIconColor = () => {
    if (variant === 'primary') return 'white';
    if (variant === 'secondary') return 'white';
    if (variant === 'outline') return colors.primary;
    return 'white';
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getIconColor()} size="small" />
      ) : (
        <>
          {icon && (
            <MaterialIcons
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 25,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  largeButton: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.textSecondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  outlineText: {
    color: colors.primary,
  },
  icon: {
    marginRight: 8,
  },
});