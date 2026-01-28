import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../lib/theme';

interface BadgeProps {
  count?: number;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  showZero?: boolean;
  max?: number;
}

export function Badge({
  count = 0,
  variant = 'danger',
  size = 'sm',
  style,
  showZero = false,
  max = 99,
}: BadgeProps) {
  if (!showZero && count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <View style={[styles.base, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`text_${size}`]]}>{displayCount}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  style?: ViewStyle;
}

export function StatusBadge({
  label,
  variant = 'neutral',
  style,
}: StatusBadgeProps) {
  return (
    <View style={[statusStyles.base, statusStyles[variant], style]}>
      <Text style={[statusStyles.text, statusStyles[`text_${variant}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  success: {
    backgroundColor: colors.success,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  
  // Sizes
  sm: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
  },
  md: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
  },
  
  text: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 10,
  },
  text_md: {
    fontSize: 12,
  },
});

const statusStyles = StyleSheet.create({
  base: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  
  // Variants
  success: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  danger: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  warning: {
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
  },
  info: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
  },
  neutral: {
    backgroundColor: colors.cardBackgroundLight,
  },
  
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  text_success: {
    color: colors.success,
  },
  text_danger: {
    color: colors.danger,
  },
  text_warning: {
    color: colors.warning,
  },
  text_info: {
    color: colors.primary,
  },
  text_neutral: {
    color: colors.textSecondary,
  },
});
