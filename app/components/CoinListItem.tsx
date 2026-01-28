import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { MiniChart } from './charts/MiniChart';

interface CoinListItemProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  sparkline?: number[];
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export function CoinListItem({
  symbol,
  name,
  price,
  change24h,
  changePercent24h,
  sparkline,
  onPress,
  rightElement,
}: CoinListItemProps) {
  const isPositive = changePercent24h >= 0;

  const formatPrice = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '$0.00';
    if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (value >= 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(4)}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{symbol.charAt(0)}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>
      </View>

      {sparkline && sparkline.length > 0 && (
        <View style={styles.chartContainer}>
          <MiniChart data={sparkline} width={60} height={30} />
        </View>
      )}

      <View style={styles.rightSection}>
        {rightElement || (
          <>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            <View style={[styles.changeBadge, isPositive ? styles.positiveBg : styles.negativeBg]}>
              <Ionicons
                name={isPositive ? 'caret-up' : 'caret-down'}
                size={10}
                color={isPositive ? colors.success : colors.danger}
              />
              <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                {Math.abs(changePercent24h).toFixed(2)}%
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconText: {
    ...typography.h4,
    color: colors.background,
  },
  nameContainer: {
    flex: 1,
  },
  symbol: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  name: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chartContainer: {
    marginHorizontal: spacing.sm,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  price: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  changeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.danger,
  },
  positiveBg: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  negativeBg: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
});
