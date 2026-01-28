import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { MiniChart } from '../components/charts/MiniChart';
import { SkeletonList } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import api, { WatchlistItem } from '../services/api';

export default function WatchlistScreen() {
  const { watchlist, setWatchlist, removeFromWatchlist } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.getWatchlist();
      if (response.data) {
        setWatchlist(response.data);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRemove = (item: WatchlistItem) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove ${item.symbol} from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromWatchlist(item.coinId),
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => {
    const isPositive = item.changePercent24h >= 0;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.coinInfo}>
            <View style={styles.coinIcon}>
              <Text style={styles.coinIconText}>{item.symbol.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.coinSymbol}>{item.symbol}</Text>
              <Text style={styles.coinName}>{item.name}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemove(item)}
          >
            <Ionicons name="close-circle" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceInfo}>
            <Text style={styles.price}>{formatCurrency(item.price)}</Text>
            <View style={[styles.changeBadge, isPositive ? styles.positiveBg : styles.negativeBg]}>
              <Ionicons
                name={isPositive ? 'caret-up' : 'caret-down'}
                size={12}
                color={isPositive ? colors.success : colors.danger}
              />
              <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                {Math.abs(item.changePercent24h).toFixed(2)}%
              </Text>
            </View>
          </View>
          <MiniChart data={item.sparkline} width={100} height={40} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Market Cap</Text>
            <Text style={styles.statValue}>{formatCurrency(item.marketCap)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Volume 24h</Text>
            <Text style={styles.statValue}>{formatCurrency(item.volume24h)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>24h Change</Text>
            <Text style={[styles.statValue, isPositive ? styles.positive : styles.negative]}>
              {isPositive ? '+' : ''}{formatCurrency(item.change24h)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.pageTitle}>Watchlist</Text>
          <Text style={styles.pageSubtitle}>
            {watchlist.length} coins tracked
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="star-outline" size={64} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
      <Text style={styles.emptyText}>
        Add coins to your watchlist to track their prices and performance.
      </Text>
      <TouchableOpacity style={styles.emptyButton}>
        <Ionicons name="add" size={20} color={colors.background} />
        <Text style={styles.emptyButtonText}>Add Coins</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Watchlist" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={watchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  pageSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  itemCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIconText: {
    ...typography.h4,
    color: colors.background,
  },
  coinSymbol: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  coinName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.xs,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceInfo: {
    gap: spacing.xs,
  },
  price: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  changeText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
});
