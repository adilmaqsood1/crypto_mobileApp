import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';

export default function AccountScreen() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testnetMode, setTestnetMode] = useState(true);
  const [autoTrade, setAutoTrade] = useState(false);
  const [maxTotalUsd, setMaxTotalUsd] = useState('1000');
  const [perTradeUsd, setPerTradeUsd] = useState('100');
  const [activeTab, setActiveTab] = useState('openOrders');

  const handleSaveCredentials = () => {
    Alert.alert('Success', 'Credentials saved successfully');
  };

  const handleSaveAutoTrade = () => {
    Alert.alert('Success', 'Auto-trade settings saved');
  };

  const handleRevoke = () => {
    setApiKey('');
    setApiSecret('');
    Alert.alert('Revoked', 'Credentials revoked');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'openorders':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No open orders</Text>
            <Text style={styles.emptyStateSubtext}>Filled market orders show in executed trades.</Text>
          </View>
        );
      case 'executedtrades':
        return (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Symbol</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Side</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Price</Text>
              <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Amount</Text>
            </View>
            {/* Mock Data for Executed Trades */}
            {[
              { id: '1', symbol: 'BTC/USDT', side: 'Buy', price: '42,500.00', amount: '0.005', time: '10:30 AM' },
              { id: '2', symbol: 'ETH/USDT', side: 'Sell', price: '2,250.50', amount: '1.5', time: '09:15 AM' },
              { id: '3', symbol: 'SOL/USDT', side: 'Buy', price: '98.75', amount: '15.0', time: 'Yesterday' },
            ].map((trade, index) => (
              <View key={trade.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.rowTextBold}>{trade.symbol}</Text>
                  <Text style={styles.rowTextSecondary}>{trade.time}</Text>
                </View>
                <Text style={[
                  styles.rowText, 
                  { flex: 1, textAlign: 'right', color: trade.side === 'Buy' ? colors.success : colors.danger }
                ]}>
                  {trade.side}
                </Text>
                <Text style={[styles.rowText, { flex: 2, textAlign: 'right' }]}>{trade.price}</Text>
                <Text style={[styles.rowText, { flex: 2, textAlign: 'right' }]}>{trade.amount}</Text>
              </View>
            ))}
          </View>
        );
      case 'activeexecutions':
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Cards Grid */}
        <View style={styles.gridContainer}>
          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Account Type</Text>
              <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            </View>
            <Text style={styles.cardValue}>-</Text>
            <Text style={styles.cardSubtext}>Trading Disabled</Text>
          </Card>

          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>PnL</Text>
              <Ionicons name="trending-up" size={20} color={colors.success} />
            </View>
            <Text style={[styles.cardValue, { color: colors.success }]}>$0.00</Text>
            <Text style={styles.cardSubtext}>Auto-Trade</Text>
          </Card>

          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Portfolio Value</Text>
              <Ionicons name="logo-usd" size={20} color={colors.success} />
            </View>
            <Text style={[styles.cardValue, { color: colors.success }]}>$0.00</Text>
            <Text style={styles.cardSubtext}>USDT</Text>
          </Card>

          <Card style={[styles.statusCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Open Orders</Text>
              <Ionicons name="cart-outline" size={20} color={colors.success} />
            </View>
            <Text style={[styles.cardValue, { color: colors.success }]}>0</Text>
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
            <StatusBadge variant="danger" label="Not Connected" />
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
              onPress={() => {}} 
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

          {renderTabContent()}
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
