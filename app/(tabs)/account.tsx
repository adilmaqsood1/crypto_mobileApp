import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { api, TradingBotStatus, TradingBotExecutionResponse } from '../services/api';

export default function AccountScreen() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testnetMode, setTestnetMode] = useState(true);
  const [autoTrade, setAutoTrade] = useState(false);
  const [maxTotalUsd, setMaxTotalUsd] = useState('1000');
  const [perTradeUsd, setPerTradeUsd] = useState('100');
  const [activeTab, setActiveTab] = useState('openorders');
  
  const [botStatus, setBotStatus] = useState<TradingBotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [executions, setExecutions] = useState<TradingBotExecutionResponse[]>([]);
  const [closedTrades, setClosedTrades] = useState<TradingBotExecutionResponse[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.getTradingBotStatus();
      if (response.data) {
        setBotStatus(response.data);
        setAutoTrade(response.data.auto_trade_enabled);
        if (response.data.testnet !== null) {
          setTestnetMode(response.data.testnet);
        }
      }
    } catch (error) {
      console.error('Failed to fetch bot status', error);
    }
  }, []);

  const fetchExecutions = useCallback(async (status: 'open' | 'closed') => {
    try {
      const response = await api.getTradingBotExecutions(status);
      if (response.data) {
        if (status === 'open') {
          setExecutions(response.data);
        } else {
          setClosedTrades(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch executions', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStatus(),
      fetchExecutions('open'),
      fetchExecutions('closed')
    ]);
    
      // Fetch auto-trade config
      try {
        const configRes = await api.getAutoTradeConfig();
        if (configRes.data) {
          setAutoTrade(!!configRes.data.enabled);
          if (configRes.data.max_total_usd != null) {
            setMaxTotalUsd(configRes.data.max_total_usd.toString());
          }
          if (configRes.data.per_trade_usd != null) {
            setPerTradeUsd(configRes.data.per_trade_usd.toString());
          }
        }
      } catch (e) {
        console.error('Failed to load auto-trade config', e);
      }
    
    setLoading(false);
  }, [fetchStatus, fetchExecutions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSaveCredentials = async () => {
    if (!apiKey || !apiSecret) {
      Alert.alert('Error', 'Please enter both API Key and Secret');
      return;
    }

    try {
      const response = await api.saveTradingBotCredentials({
        exchange: 'binance',
        api_key: apiKey,
        api_secret: apiSecret,
        testnet: testnetMode,
        permissions: ['read', 'trade']
      });

      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Success', 'Credentials saved successfully');
        setApiKey('');
        setApiSecret('');
        fetchStatus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials');
    }
  };

  const handleSaveAutoTrade = async () => {
    try {
      const response = await api.setAutoTradeConfig({
        enabled: autoTrade,
        max_total_usd: parseFloat(maxTotalUsd) || 0,
        per_trade_usd: parseFloat(perTradeUsd) || 0,
        mode: 'buy',
        interval: '5m',
        close_strategy: 'pivot_break'
      });
      
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        Alert.alert('Success', `Auto-trade ${autoTrade ? 'enabled' : 'disabled'} successfully`);
        // Refresh status
        fetchStatus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save auto-trade settings');
    }
  };

  const handleRevoke = async () => {
    try {
      const response = await api.revokeTradingBotCredentials();
      if (response.error) {
        Alert.alert('Error', response.error);
      } else {
        setApiKey('');
        setApiSecret('');
        Alert.alert('Revoked', 'Credentials revoked');
        fetchStatus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to revoke credentials');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'openorders':
        if (executions.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="cart-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No open orders</Text>
              <Text style={styles.emptyStateSubtext}>Filled market orders show in executed trades.</Text>
            </View>
          );
        }
        return (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Symbol</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Side</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Status</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Qty</Text>
            </View>
            {executions.map((exec, index) => (
              <View key={exec.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.rowTextBold}>{exec.symbol}</Text>
                  <Text style={styles.rowTextSecondary}>{new Date(exec.created_at).toLocaleTimeString()}</Text>
                </View>
                <Text style={[
                  styles.rowText, 
                  { flex: 1, textAlign: 'right', color: exec.side.toLowerCase() === 'buy' ? colors.success : colors.danger }
                ]}>
                  {exec.side}
                </Text>
                <Text style={[styles.rowText, { flex: 2, textAlign: 'right' }]}>{exec.status}</Text>
                <Text style={[styles.rowText, { flex: 2, textAlign: 'right' }]}>{exec.quantity}</Text>
              </View>
            ))}
          </View>
        );
      case 'executedtrades':
        if (closedTrades.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No executed trades</Text>
            </View>
          );
        }
        return (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Symbol</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Side</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Amount</Text>
            </View>
            {closedTrades.map((trade, index) => (
              <View key={trade.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.rowTextBold}>{trade.symbol}</Text>
                  <Text style={styles.rowTextSecondary}>{new Date(trade.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={[
                  styles.rowText, 
                  { flex: 1, textAlign: 'right', color: trade.side.toLowerCase() === 'buy' ? colors.success : colors.danger }
                ]}>
                  {trade.side}
                </Text>
                <Text style={[styles.rowText, { flex: 2, textAlign: 'right' }]}>{trade.price || '-'}</Text>
                <Text style={[styles.rowText, { flex: 2, textAlign: 'right' }]}>{trade.quantity}</Text>
              </View>
            ))}
          </View>
        );
      case 'activeexecutions':
        // Reuse executions logic or fetch different data if needed. 
        // Based on backend, executions covers both orders and strategy executions roughly.
        return (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No active executions</Text>
            <Text style={styles.emptyStateSubtext}>Running strategies will appear here.</Text>
          </View>
        );
      case 'assets':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No assets found</Text>
            <Text style={styles.emptyStateSubtext}>Connect your wallet or exchange account.</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Trading Bot" showNotifications={true} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        
        {/* Status Cards Grid */}
        <View style={styles.gridContainer}>
          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Account Type</Text>
              <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.cardValue}>
              {botStatus?.exchange ? botStatus.exchange.toUpperCase() : '-'}
            </Text>
            <Text style={styles.cardSubtext}>
              {botStatus?.testnet ? 'Testnet' : (botStatus?.exchange ? 'Live' : 'Trading Disabled')}
            </Text>
          </Card>

          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Status</Text>
              <Ionicons name="trending-up" size={20} color={botStatus?.credentials_connected ? colors.success : colors.textSecondary} />
            </View>
            <Text style={[styles.cardValue, { color: botStatus?.credentials_connected ? colors.success : colors.textSecondary }]}>
              {botStatus?.credentials_connected ? 'Active' : 'Inactive'}
            </Text>
            <Text style={styles.cardSubtext}>Connection</Text>
          </Card>

          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Auto-Trade</Text>
              <Ionicons name="flash" size={20} color={autoTrade ? colors.success : colors.textSecondary} />
            </View>
            <Text style={[styles.cardValue, { color: autoTrade ? colors.success : colors.textSecondary }]}>
              {autoTrade ? 'ON' : 'OFF'}
            </Text>
            <Text style={styles.cardSubtext}>
               {botStatus?.credentials_connected ? 'Ready' : 'Setup Required'}
            </Text>
          </Card>

          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Open Orders</Text>
              <Ionicons name="cart-outline" size={20} color={colors.success} />
            </View>
            <Text style={[styles.cardValue, { color: colors.success }]}>{executions.length}</Text>
            <Text style={styles.cardSubtext}>Active</Text>
          </Card>
        </View>

        {/* Trading Bot Configuration */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Trading Bot</Text>
            </View>
            <StatusBadge 
              variant={botStatus?.credentials_connected ? "success" : "danger"} 
              label={botStatus?.credentials_connected ? "Connected" : "Not Connected"} 
            />
          </View>

          <View style={styles.formGroup}>
            <Input
              label="Binance API Key"
              placeholder="Enter API key"
              value={apiKey}
              onChangeText={setApiKey}
            />
            <Input
              label="Binance API Secret"
              placeholder="Enter API secret"
              value={apiSecret}
              onChangeText={setApiSecret}
              secureTextEntry
            />
            
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Testnet Mode</Text>
                <Text style={styles.switchSubLabel}>Use Binance testnet for execution</Text>
              </View>
              <Switch
                value={testnetMode}
                onValueChange={setTestnetMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textPrimary}
              />
            </View>

            <View style={styles.buttonRow}>
              <Button title="Save Credentials" onPress={handleSaveCredentials} style={{ flex: 1 }} />
              <Button title="Revoke" onPress={handleRevoke} variant="secondary" style={{ flex: 1 }} />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Auto-Trade</Text>
                <Text style={styles.switchSubLabel}>Execute approved signals automatically</Text>
              </View>
              <Switch
                value={autoTrade}
                onValueChange={setAutoTrade}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.textPrimary}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Max Total USD"
                  value={maxTotalUsd}
                  onChangeText={setMaxTotalUsd}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Input
                  label="Per Trade USD"
                  value={perTradeUsd}
                  onChangeText={setPerTradeUsd}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button title="Save Auto-Trade Settings" onPress={handleSaveAutoTrade} variant="primary" />
            <Text style={styles.helperText}>Connect Binance credentials to enable auto-trade.</Text>
          </View>
        </Card>

        {/* Account Details */}
        <Card style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="person-outline" size={24} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Account Details</Text>
            </View>
            <Button 
              title="Refresh" 
              size="sm" 
              variant="outline" 
              onPress={loadData} 
              icon={<Ionicons name="refresh" size={16} color={colors.primary} />} 
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
            {['Open Orders', 'Active Executions', 'Assets', 'Executed Trades'].map((tab) => {
              const key = tab.toLowerCase().replace(/\s+/g, '');
              const isActive = activeTab === key;
              return (
                <Button
                  key={key}
                  title={tab}
                  onPress={() => setActiveTab(key)}
                  variant={isActive ? 'primary' : 'ghost'}
                  size="sm"
                  style={{ 
                    marginRight: spacing.xs, 
                    paddingHorizontal: spacing.sm,
                    minHeight: 30,
                    paddingVertical: 4
                  }}
                  textStyle={{ fontSize: 11 }}
                />
              );
            })}
          </ScrollView>

          {loading ? (
             <ActivityIndicator color={colors.primary} style={{ padding: spacing.xl }} />
          ) : (
             renderTabContent()
          )}
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollContent: {
    padding: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusCard: {
    width: '47%', // roughly half minus gap
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  cardValue: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardSubtext: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface, 
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  formGroup: {
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchSubLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: {
    ...typography.h4,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  tableHeaderText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tableRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  rowText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  rowTextBold: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowTextSecondary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
