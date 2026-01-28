import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MiniChart } from '../components/charts/MiniChart';
import { SkeletonList } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import api, { ScanResult } from '../services/api';

const TIME_INTERVALS = ['5m', '15m', '1h', '4h', '1d'];
const STRATEGIES = ['Volume', 'Hikmah', 'Breakout', 'Momentum'];

export default function ScannerScreen() {
  const { scanResults, setScanResults, approvedOpportunities, approveOpportunity } = useApp();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'approved'>('opportunities');
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [selectedStrategy, setSelectedStrategy] = useState('Volume');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.scanOpportunities(selectedInterval, selectedStrategy);
      if (response.data) {
        setScanResults(response.data);
      }
    } catch (error) {
      console.error('Error loading scanner data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await api.scanOpportunities(selectedInterval, selectedStrategy);
      if (response.data) {
        setScanResults(response.data);
      }
    } catch (error) {
      console.error('Error scanning:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApprove = (id: string) => {
    approveOpportunity(id);
  };

  const formatNumber = (value: number, decimals = 2) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(decimals)}`;
  };

  const renderOpportunity = ({ item }: { item: ScanResult }) => (
    <Card style={styles.opportunityCard}>
      <View style={styles.cardHeader}>
        <View style={styles.coinInfo}>
          <View style={styles.coinIcon}>
            <Text style={styles.coinIconText}>{item.symbol.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.coinSymbol}>{item.symbol}</Text>
            <Text style={styles.coinCategory}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.price}>{formatNumber(item.price)}</Text>
          <MiniChart data={item.sparkline} width={60} height={24} />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>1h</Text>
          <Text style={[styles.metricValue, item.change1h >= 0 ? styles.positive : styles.negative]}>
            {item.change1h >= 0 ? '+' : ''}{item.change1h.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>24h</Text>
          <Text style={[styles.metricValue, item.change24h >= 0 ? styles.positive : styles.negative]}>
            {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>7d</Text>
          <Text style={[styles.metricValue, item.change7d >= 0 ? styles.positive : styles.negative]}>
            {item.change7d >= 0 ? '+' : ''}{item.change7d.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>RSI</Text>
          <Text style={styles.metricValue}>{item.rsi}</Text>
        </View>
      </View>

      <View style={styles.scoreSection}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Momentum</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreFill, { width: `${item.momentum}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{item.momentum}</Text>
        </View>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>EK Score</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreFill, styles.ekFill, { width: `${item.ekScore}%` }]} />
          </View>
          <Text style={styles.scoreValue}>{item.ekScore}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.volumeInfo}>
          <Text style={styles.volumeLabel}>Vol 24h</Text>
          <Text style={styles.volumeValue}>{formatNumber(item.volume24h)}</Text>
        </View>
        {!item.isApproved && (
          <Button
            title="Approve"
            onPress={() => handleApprove(item.id)}
            size="sm"
            style={styles.approveButton}
          />
        )}
      </View>
    </Card>
  );

  const renderApproved = ({ item }: { item: ScanResult }) => (
    <Card style={styles.approvedCard}>
      <View style={styles.approvedHeader}>
        <View style={styles.coinInfo}>
          <View style={[styles.coinIcon, styles.approvedIcon]}>
            <Text style={styles.coinIconText}>{item.symbol.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.coinSymbol}>{item.symbol}</Text>
            <Text style={styles.coinName}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.statusText}>Monitoring</Text>
        </View>
      </View>

      <View style={styles.approvedMetrics}>
        <View style={styles.approvedMetric}>
          <Text style={styles.approvedLabel}>Entry Price</Text>
          <Text style={styles.approvedValue}>{formatNumber(item.price)}</Text>
        </View>
        <View style={styles.approvedMetric}>
          <Text style={styles.approvedLabel}>Current</Text>
          <Text style={[styles.approvedValue, styles.positive]}>
            {formatNumber(item.price * 1.02)}
          </Text>
        </View>
        <View style={styles.approvedMetric}>
          <Text style={styles.approvedLabel}>P&L</Text>
          <Text style={[styles.approvedValue, styles.positive]}>+2.0%</Text>
        </View>
      </View>

      <MiniChart data={item.sparkline} width={280} height={40} />
    </Card>
  );

  const PickerModal = ({
    visible,
    onClose,
    options,
    selected,
    onSelect,
    title,
  }: {
    visible: boolean;
    onClose: () => void;
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
    title: string;
  }) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.modalOption, selected === option && styles.modalOptionSelected]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text style={[
                styles.modalOptionText,
                selected === option && styles.modalOptionTextSelected
              ]}>
                {option}
              </Text>
              {selected === option && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Smart Scanner" />

      {/* Filters Section */}
      <View style={styles.filtersSection}>
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowIntervalPicker(true)}
          >
            <Text style={styles.filterLabel}>Interval</Text>
            <View style={styles.filterValue}>
              <Text style={styles.filterValueText}>{selectedInterval}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStrategyPicker(true)}
          >
            <Text style={styles.filterLabel}>Strategy</Text>
            <View style={styles.filterValue}>
              <Text style={styles.filterValueText}>{selectedStrategy}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <Button
            title="Scan"
            onPress={handleScan}
            loading={isScanning}
            size="md"
            style={styles.scanButton}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'opportunities' && styles.tabActive]}
          onPress={() => setActiveTab('opportunities')}
        >
          <Text style={[styles.tabText, activeTab === 'opportunities' && styles.tabTextActive]}>
            Opportunities ({scanResults.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.tabActive]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.tabTextActive]}>
            Approved ({approvedOpportunities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'opportunities' ? scanResults : approvedOpportunities}
          renderItem={activeTab === 'opportunities' ? renderOpportunity : renderApproved}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="scan-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {activeTab === 'opportunities' ? 'No Opportunities Found' : 'No Approved Trades'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'opportunities'
                  ? 'Run a scan to find trading opportunities'
                  : 'Approve opportunities to start monitoring'}
              </Text>
            </View>
          }
        />
      )}

      {/* Picker Modals */}
      <PickerModal
        visible={showIntervalPicker}
        onClose={() => setShowIntervalPicker(false)}
        options={TIME_INTERVALS}
        selected={selectedInterval}
        onSelect={setSelectedInterval}
        title="Select Interval"
      />
      <PickerModal
        visible={showStrategyPicker}
        onClose={() => setShowStrategyPicker(false)}
        options={STRATEGIES}
        selected={selectedStrategy}
        onSelect={setSelectedStrategy}
        title="Select Strategy"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  filtersSection: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  filterLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  filterValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterValueText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scanButton: {
    minWidth: 80,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  opportunityCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIconText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '700',
  },
  coinSymbol: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  coinCategory: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  coinName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  priceSection: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  price: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  scoreSection: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 70,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  ekFill: {
    backgroundColor: colors.success,
  },
  scoreValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  volumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  volumeLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  volumeValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  approveButton: {
    minWidth: 90,
  },
  approvedCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  approvedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  approvedIcon: {
    backgroundColor: colors.success,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  approvedMetrics: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  approvedMetric: {
    flex: 1,
  },
  approvedLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  approvedValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.danger,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  modalOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
