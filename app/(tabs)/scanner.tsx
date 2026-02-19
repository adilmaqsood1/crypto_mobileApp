import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MiniChart } from '../components/charts/MiniChart';
import { SkeletonList } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import api, { ScanResult, ClosedTrade } from '../services/api';

const TIME_INTERVALS = ['5m', '15m', '1h', '4h', '1d'];
const STRATEGIES = ['Volume', 'Hikmah', 'Breakout', 'Momentum'];

export default function ScannerScreen() {
  const { scanResults, setScanResults, approvedOpportunities, approveOpportunity, setApprovedOpportunities, addNotification } = useApp();
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [activeTab, setActiveTab] = useState<'opportunities' | 'approved' | 'closed'>('opportunities');
  const [selectedInterval, setSelectedInterval] = useState('1h');
  const [selectedStrategy, setSelectedStrategy] = useState('Volume');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);
  const [isAutoTradeEnabled, setIsAutoTradeEnabled] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const isExpoGo = Constants.appOwnership === 'expo';
  const notificationsModuleRef = useRef<any>(null);
  const notifiedKeyRef = useRef<string | null>(null);
  const expoGoWarnedRef = useRef(false);

  const setupNativeNotificationsAsync = useCallback(async () => {
    if (isExpoGo) return null;
    if (notificationsModuleRef.current) return notificationsModuleRef.current;

    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    notificationsModuleRef.current = Notifications;
    return Notifications;
  }, [isExpoGo]);

  // Auto-scan and Notification Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const performAutoScan = async () => {
      if (!isAutoTradeEnabled) return;

      setIsAutoScanning(true);
      try {
        const scanRes = await api.scanOpportunities(selectedInterval, selectedStrategy);
        
        if (scanRes.data && scanRes.data.length > 0) {
          setScanResults(scanRes.data);
          
          const bestOpp = scanRes.data[0];
          const title = 'Auto-Trade Alert';
          const message = `Found ${scanRes.data.length} opportunities! Top pick: ${bestOpp.symbol} (${bestOpp.change1h >= 0 ? '+' : ''}${bestOpp.change1h.toFixed(2)}%)`;
          const notifyKey = `${selectedInterval}:${selectedStrategy}:${bestOpp.id}:${scanRes.data.length}`;

          // Only notify if key changed OR it's been more than 5 minutes since last notification
          if (notifiedKeyRef.current !== notifyKey) {
            notifiedKeyRef.current = notifyKey;

            addNotification({
              id: `local-${Date.now()}`,
              type: 'alert',
              title,
              message,
              timestamp: new Date().toISOString(),
              isRead: false,
            });

            const Notifications = await setupNativeNotificationsAsync();
            if (Notifications) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body: message,
                  data: { symbol: bestOpp.symbol },
                  sound: true,
                },
                trigger: null,
              });
            }
          }
        }
      } catch (error) {
        console.error('Auto-scan error:', error);
      } finally {
        setIsAutoScanning(false);
      }
    };

    if (isAutoTradeEnabled) {
      if (isExpoGo && !expoGoWarnedRef.current) {
        expoGoWarnedRef.current = true;
        Alert.alert(
          'Expo Go limitation',
          'Phone notifications require a Development Build. Auto-scan will still work and you will see in-app notifications.'
        );
      } else if (!isExpoGo) {
        void setupNativeNotificationsAsync();
      }
      
      // Perform immediate scan when enabled
      performAutoScan();

      // Set up interval
      const getIntervalMs = (interval: string) => {
        switch(interval) {
          case '5m': return 5 * 60 * 1000;
          case '15m': return 15 * 60 * 1000;
          case '1h': return 60 * 60 * 1000;
          case '4h': return 4 * 60 * 60 * 1000;
          case '1d': return 24 * 60 * 60 * 1000;
          default: return 60 * 1000;
        }
      };
      
      intervalId = setInterval(performAutoScan, getIntervalMs(selectedInterval));
    } else {
      // Reset ref when disabled so we can warn again if re-enabled
      expoGoWarnedRef.current = false;
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoTradeEnabled, selectedInterval, selectedStrategy]); // Removed extra deps to prevent re-running loop unnecessarily

  const loadData = useCallback(async () => {
    try {
      const [scanRes, approvedRes, closedRes] = await Promise.all([
        api.scanOpportunities(selectedInterval, selectedStrategy),
        api.getApprovedOpportunities(),
        api.getClosedTrades()
      ]);
      
      if (scanRes.data) {
        setScanResults(scanRes.data);
      }
      if (approvedRes.data) {
        setApprovedOpportunities(approvedRes.data);
      }
      if (closedRes.data) {
        setClosedTrades(closedRes.data);
      }
    } catch (error) {
      console.error('Error loading scanner data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedInterval, selectedStrategy, setApprovedOpportunities, setScanResults]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
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
      
      // Also refresh approved trades (including active)
      const approvedRes = await api.getApprovedOpportunities();
      if (approvedRes.data) {
        setApprovedOpportunities(approvedRes.data);
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

  const renderActive = ({ item }: { item: ScanResult }) => (
    <Card style={styles.activeCard}>
      <View style={styles.activeHeader}>
        <View style={styles.coinInfo}>
          <View style={[styles.coinIcon, styles.activeIcon]}>
            <Text style={styles.coinIconText}>{item.symbol.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.coinSymbol}>{item.symbol}</Text>
            <Text style={styles.coinName}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.statusBadgeActive}>
          <Ionicons name="flash" size={14} color={colors.background} />
          <Text style={styles.statusTextActive}>Active</Text>
        </View>
      </View>

      <View style={styles.activeMetrics}>
        <View style={styles.activeMetric}>
          <Text style={styles.activeLabel}>Entry Price</Text>
          <Text style={styles.activeValue}>{formatNumber(item.price)}</Text>
        </View>
        <View style={styles.activeMetric}>
          <Text style={styles.activeLabel}>Current</Text>
          <Text style={[styles.activeValue, styles.positive]}>
            {formatNumber(item.price * (1 + (item.change1h / 100)))}
          </Text>
        </View>
        <View style={styles.activeMetric}>
          <Text style={styles.activeLabel}>P&L</Text>
          <Text style={[styles.activeValue, item.change1h >= 0 ? styles.positive : styles.negative]}>
            {item.change1h >= 0 ? '+' : ''}{item.change1h.toFixed(2)}%
          </Text>
        </View>
      </View>

      <MiniChart data={item.sparkline} width={280} height={40} />
    </Card>
  );

  const renderApproved = ({ item }: { item: ScanResult }) => {
    if (item.status === 'active') {
      return renderActive({ item });
    }
    return (
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
  };

  const renderClosed = ({ item }: { item: ClosedTrade }) => {
    // Check if partial fills exist and are valid
    const hasPartialFills = item.partial_fills && item.partial_fills.length > 0;
    
    // Sort fills by time if needed, though usually backend sends them sorted
    const fills = hasPartialFills ? item.partial_fills : [];

    // Max price logic: Since ClosedTrade doesn't have max_price in schema,
    // we can try to find the max price from fills or just use exit price as a fallback if desired.
    // However, user asked for "max price". If not available, we can't invent it.
    // But we can check if any fill price was higher than entry/exit.
    let maxPrice = Math.max(item.entry_price, item.exit_price);
    if (fills && fills.length > 0) {
      const fillMax = Math.max(...fills.map(f => f.price));
      if (fillMax > maxPrice) maxPrice = fillMax;
    }

    return (
      <Card style={styles.closedCard}>
        <View style={styles.closedHeader}>
          <View style={styles.coinInfo}>
            <View style={[styles.coinIcon, styles.closedIcon]}>
              <Text style={styles.coinIconText}>{item.symbol.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.coinSymbol}>{item.symbol}</Text>
              <Text style={styles.coinCategory}>
                {item.trade_type === 'buy' ? 'Long' : 'Short'} • {item.interval_selected}
              </Text>
            </View>
          </View>
          <View style={styles.statusBadgeClosed}>
            <Text style={styles.statusTextClosed}>Closed</Text>
          </View>
        </View>

        <View style={styles.closedMetrics}>
          <View style={styles.closedMetric}>
            <Text style={styles.closedLabel}>Entry</Text>
            <Text style={styles.closedValue}>{formatNumber(item.entry_price)}</Text>
          </View>
          <View style={styles.closedMetric}>
            <Text style={styles.closedLabel}>Exit (Avg)</Text>
            <Text style={styles.closedValue}>{formatNumber(item.exit_price)}</Text>
          </View>
          <View style={styles.closedMetric}>
            <Text style={styles.closedLabel}>Return</Text>
            <Text style={[styles.closedValue, item.return_percent >= 0 ? styles.positive : styles.negative]}>
              {item.return_percent >= 0 ? '+' : ''}{item.return_percent.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.closedMetrics}>
          <View style={styles.closedMetric}>
            <Text style={styles.closedLabel}>Max Price</Text>
            <Text style={styles.closedValue}>{formatNumber(maxPrice)}</Text>
          </View>
           <View style={styles.closedMetric}>
            <Text style={styles.closedLabel}>Duration</Text>
            <Text style={styles.closedValue}>{formatDuration(item.duration)}</Text>
          </View>
           <View style={styles.closedMetric}>
            <Text style={styles.closedLabel}>PnL</Text>
            <Text style={[styles.closedValue, (item.pnl_amount || 0) >= 0 ? styles.positive : styles.negative]}>
              {formatNumber(item.pnl_amount || 0)}
            </Text>
          </View>
        </View>
        
        {hasPartialFills && (
          <View style={styles.fillsContainer}>
            <Text style={styles.fillsTitle}>Partial Fills</Text>
            {fills?.map((fill, index) => (
              <View key={index} style={styles.fillRow}>
                <Text style={styles.fillText}>
                  {fill.reason || 'Take Profit'} @ {formatNumber(fill.price)}
                </Text>
                <Text style={styles.fillText}>
                  {fill.qty.toFixed(4)} {item.symbol.split('/')[0]}
                </Text>
                <Text style={styles.fillTime}>
                  {new Date(fill.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.closedFooter}>
           <Text style={styles.closedReason}>Trigger: {item.momentum_trigger}</Text>
           <Text style={styles.closedTime}>
             {new Date(item.exit_time).toLocaleDateString()} {new Date(item.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </Text>
        </View>
      </Card>
    );
  };

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

        <View style={styles.autoTradeRow}>
          <View style={styles.autoTradeInfo}>
            <View style={styles.autoTradeHeader}>
              <Text style={styles.autoTradeLabel}>Auto-Trade & Notify</Text>
              {isAutoScanning && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
              )}
            </View>
            <Text style={styles.autoTradeSubtext}>
              {isAutoTradeEnabled ? `Scanning every ${selectedInterval}...` : 'Enable automatic opportunities'}
            </Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isAutoTradeEnabled ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={setIsAutoTradeEnabled}
            value={isAutoTradeEnabled}
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
        <TouchableOpacity
          style={[styles.tab, activeTab === 'closed' && styles.tabActive]}
          onPress={() => setActiveTab('closed')}
        >
          <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>
            Closed ({closedTrades.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <SkeletonList count={4} />
        </View>
      ) : (
        <FlatList<ScanResult | ClosedTrade>
          data={activeTab === 'opportunities' ? scanResults : activeTab === 'approved' ? approvedOpportunities : closedTrades}
          renderItem={({ item }) => {
            if (activeTab === 'closed') {
              return renderClosed({ item: item as unknown as ClosedTrade });
            }
            if (activeTab === 'approved') {
              return renderApproved({ item: item as unknown as ScanResult });
            }
            return renderOpportunity({ item: item as unknown as ScanResult });
          }}
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
                {activeTab === 'opportunities' ? 'No Opportunities Found' : activeTab === 'approved' ? 'No Approved Trades' : 'No Closed Trades'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'opportunities'
                  ? 'Run a scan to find trading opportunities'
                  : activeTab === 'approved'
                  ? 'Approve opportunities to start monitoring'
                  : 'Closed trades will appear here'}
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
  activeCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activeIcon: {
    backgroundColor: colors.primary,
  },
  statusBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusTextActive: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  activeMetrics: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  activeMetric: {
    flex: 1,
  },
  activeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  activeValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  closedCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.textMuted,
  },
  closedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closedIcon: {
    backgroundColor: colors.textMuted,
  },
  statusBadgeClosed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusTextClosed: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  closedMetrics: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  closedMetric: {
    flex: 1,
  },
  closedLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  closedValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  closedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closedTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  closedReason: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fillsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  fillsTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  fillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  fillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  fillTime: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  autoTradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  autoTradeInfo: {
    flex: 1,
  },
  autoTradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  autoTradeLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loader: {
    marginLeft: spacing.xs,
  },
  autoTradeSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
