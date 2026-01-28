import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { SkeletonList } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import api, { Holding } from '../services/api';

export default function PortfolioScreen() {
  const { holdings, setHoldings, portfolioSummary, setPortfolioSummary } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [holdingsRes, summaryRes] = await Promise.all([
        api.getHoldings(),
        api.getPortfolioSummary()
      ]);
      
      if (holdingsRes.data) setHoldings(holdingsRes.data);
      if (summaryRes.data) setPortfolioSummary(summaryRes.data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatQuantity = (value: number) => {
    if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (value >= 1) return value.toFixed(4);
    return value.toFixed(6);
  };

  const renderHolding = ({ item }: { item: Holding }) => {
    const isPositive = item.pnl >= 0;

    return (
      <Card style={styles.holdingCard}>
        <View style={styles.holdingHeader}>
          <View style={styles.coinInfo}>
            <View style={styles.coinIcon}>
              <Text style={styles.coinIconText}>{item.symbol.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.coinSymbol}>{item.symbol}</Text>
              <Text style={styles.coinName}>{item.name}</Text>
            </View>
          </View>
          <View style={styles.priceInfo}>
            <Text style={styles.currentPrice}>{formatCurrency(item.currentPrice)}</Text>
            <Text style={styles.quantity}>{formatQuantity(item.quantity)} {item.symbol}</Text>
          </View>
        </View>

        <View style={styles.holdingDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Invested</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.investedValue)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Current</Text>
              <Text style={styles.detailValue}>{formatCurrency(item.currentValue)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>P&L</Text>
              <View style={styles.pnlContainer}>
                <Text style={[styles.pnlValue, isPositive ? styles.positive : styles.negative]}>
                  {isPositive ? '+' : ''}{formatCurrency(item.pnl)}
                </Text>
                <View style={[styles.pnlBadge, isPositive ? styles.positiveBg : styles.negativeBg]}>
                  <Ionicons
                    name={isPositive ? 'caret-up' : 'caret-down'}
                    size={10}
                    color={isPositive ? colors.success : colors.danger}
                  />
                  <Text style={[styles.pnlPercent, isPositive ? styles.positive : styles.negative]}>
                    {Math.abs(item.pnlPercent).toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerSection}>
      {/* Portfolio Value Card */}
      <Card style={styles.valueCard} variant="gradient">
        <View style={styles.valueHeader}>
          <Text style={styles.valueLabel}>Total Portfolio Value</Text>
          <Ionicons name="wallet" size={24} color={colors.primary} />
        </View>
        <Text style={styles.totalValue}>
          {portfolioSummary ? formatCurrency(portfolioSummary.currentValue) : '$0.00'}
        </Text>
        {portfolioSummary && (
          <View style={styles.valueChange}>
            <Ionicons
              name={portfolioSummary.totalPnL >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={portfolioSummary.totalPnL >= 0 ? colors.success : colors.danger}
            />
            <Text style={[
              styles.changeText,
              portfolioSummary.totalPnL >= 0 ? styles.positive : styles.negative
            ]}>
              {portfolioSummary.totalPnL >= 0 ? '+' : ''}
              {formatCurrency(portfolioSummary.totalPnL)} ({portfolioSummary.totalPnLPercent.toFixed(2)}%)
            </Text>
          </View>
        )}
      </Card>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Invested</Text>
          <Text style={styles.statValue}>
            {portfolioSummary ? formatCurrency(portfolioSummary.totalInvested) : '$0.00'}
          </Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Daily P&L</Text>
          <Text style={[
            styles.statValue,
            portfolioSummary && portfolioSummary.dailyPnL >= 0 ? styles.positive : styles.negative
          ]}>
            {portfolioSummary ? (
              `${portfolioSummary.dailyPnL >= 0 ? '+' : ''}${formatCurrency(portfolioSummary.dailyPnL)}`
            ) : '$0.00'}
          </Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Holdings ({holdings.length})</Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Holdings Yet</Text>
      <Text style={styles.emptyText}>Start building your portfolio by adding your first crypto asset.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Portfolio" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={holdings}
          renderItem={renderHolding}
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
    marginBottom: spacing.md,
  },
  valueCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  valueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  valueLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  valueChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  changeText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  holdingCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  holdingHeader: {
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
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  quantity: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  holdingDetails: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  pnlContainer: {
    gap: 4,
  },
  pnlValue: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  pnlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pnlPercent: {
    ...typography.label,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
