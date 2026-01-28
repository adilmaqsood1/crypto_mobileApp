import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { MovingTicker } from '../components/MovingTicker';
import { PriceChart } from '../components/charts/PriceChart';
import { SkeletonChart, Skeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import { fetchCryptoPrices, CryptoPrice, checkPriceAlerts } from '../services/cryptoApi';
import api from '../services/api';

const { width } = Dimensions.get('window');
const REFRESH_INTERVAL = 30000; // 30 seconds

export default function DashboardScreen() {
  const { setMarketMetrics, setPortfolioSummary, setBitcoinPrice, portfolioSummary, marketMetrics } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bitcoinData, setBitcoinData] = useState<{ timestamp: number; price: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [livePrices, setLivePrices] = useState<CryptoPrice[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceHistoryRef = useRef<{ timestamp: number; price: number }[]>([]);
  const [chartWidth, setChartWidth] = useState(0);
  
  const loadLivePrices = useCallback(async () => {
    try {
      const prices = await fetchCryptoPrices();
      
      // Fetch metrics, portfolio, btc, and news in parallel
      const [metricsRes, portfolioRes, btcRes, newsRes] = await Promise.all([
        api.getMarketMetrics(),
        api.getPortfolioSummary(),
        api.getBitcoinPrice(),
        api.getNews()
      ]);

      if (prices.length > 0) {
        setLivePrices(prices);
        setLastUpdate(new Date());
        
        const btcPrice = prices.find(p => p.symbol === 'BTC/USD');
        if (btcPrice) {
          setCurrentPrice(btcPrice.price);
          setPriceChange(btcPrice.changePercent);
          setBitcoinPrice(btcPrice.price, btcPrice.changePercent);
        }
        
        const triggeredAlerts = checkPriceAlerts(prices);
        triggeredAlerts.forEach(alert => {
          Alert.alert(
            'Price Alert Triggered!',
            `${alert.symbol} has ${alert.condition === 'above' ? 'risen above' : 'fallen below'} $${alert.targetPrice.toLocaleString()}`,
            [{ text: 'OK' }]
          );
        });
      }

      if (metricsRes.data) {
        setMarketMetrics(metricsRes.data);
      }
      
      if (portfolioRes.data) {
        setPortfolioSummary(portfolioRes.data);
      }

      if (btcRes.data) {
        if (btcRes.data.history) {
          setBitcoinData(btcRes.data.history);
          priceHistoryRef.current = btcRes.data.history;
        }
        // Fallback to specific BTC endpoint data if live prices list didn't update it
        // or prioritize it as it comes from the realtime service
        if (btcRes.data.price) {
            setCurrentPrice(btcRes.data.price);
            setPriceChange(btcRes.data.changePercent24h);
            setBitcoinPrice(btcRes.data.price, btcRes.data.changePercent24h);
        }
      }

      if (newsRes.data) {
        setNews(newsRes.data);
      }
      
    } catch (error) {
      console.error('Error loading live prices:', error);
    }
  }, [setMarketMetrics, setPortfolioSummary, setBitcoinPrice]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await loadLivePrices();
      setIsLoading(false);
    };
    
    initializeData();
    intervalRef.current = setInterval(loadLivePrices, REFRESH_INTERVAL);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadLivePrices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLivePrices();
    setRefreshing(false);
  };

  const formatCurrency = (value: number | undefined | null, compact = false) => {
    if (value === undefined || value === null) return '$0.00';
    if (compact) {
      if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    }
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return colors.danger;
    if (value <= 45) return colors.warning;
    if (value <= 55) return colors.textSecondary;
    return colors.success;
  };

  // Safe access to data
  const safeMetrics = marketMetrics || { fearGreedIndex: 50, fearGreedLabel: 'Neutral', btcDominance: 0, totalMarketCap: 0, totalVolume24h: 0 };
  const safePortfolio = portfolioSummary || { totalInvested: 0, currentValue: 0, totalPnL: 0, totalPnLPercent: 0, dailyPnL: 0, dailyPnLPercent: 0 };
  
  const portfolioData = safePortfolio;
  const responsiveChartHeight = chartWidth ? Math.max(260, Math.round(chartWidth * 0.65)) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <MovingTicker />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.paddedSection, styles.metricsSection]}>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              {isLoading ? (
                <>
                  <Skeleton width={90} height={12} />
                  <Skeleton width={60} height={26} style={{ marginTop: 10 }} />
                  <Skeleton width="100%" height={6} style={{ marginTop: 12 }} />
                </>
              ) : (
                <>
                  <Text style={styles.metricLabel}>Fear & Greed</Text>
                  <Text style={[styles.metricSubvalue, { color: getFearGreedColor(safeMetrics.fearGreedIndex) }]}>
                    {safeMetrics.fearGreedLabel}
                  </Text>
                  <Gauge value={safeMetrics.fearGreedIndex} color={getFearGreedColor(safeMetrics.fearGreedIndex)} />
                </>
              )}
            </View>

            <View style={styles.metricCard}>
              {isLoading ? (
                <>
                  <Skeleton width={90} height={12} />
                  <Skeleton width={70} height={26} style={{ marginTop: 10 }} />
                  <Skeleton width="100%" height={6} style={{ marginTop: 12 }} />
                </>
              ) : (
                <>
                  <Text style={styles.metricLabel}>BTC Dominance</Text>
                  <Text style={styles.metricValue}>{safeMetrics.btcDominance.toFixed(1)}%</Text>
                  <View style={styles.metricProgressTrack}>
                    <View style={[styles.metricProgressFill, { width: `${Math.min(100, Math.max(0, safeMetrics.btcDominance))}%`, backgroundColor: colors.success }]} />
                  </View>
                </>
              )}
            </View>

            <View style={styles.metricCard}>
              {isLoading ? (
                <>
                  <Skeleton width={90} height={12} />
                  <Skeleton width={80} height={26} style={{ marginTop: 10 }} />
                  <Skeleton width={50} height={12} style={{ marginTop: 8 }} />
                </>
              ) : (
                <>
                  <Text style={styles.metricLabel}>Market Cap</Text>
                  <Text style={styles.metricValue}>{formatCurrency(safeMetrics.totalMarketCap, true)}</Text>
                  <MiniAreaChart color={colors.success} />
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View
            style={styles.chartCanvas}
            onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
          >
            {isLoading ? (
              <SkeletonChart />
            ) : chartWidth > 0 ? (
              <PriceChart
                data={bitcoinData.length > 1 ? bitcoinData : [{ timestamp: Date.now() - 60000, price: currentPrice * 0.99 }, { timestamp: Date.now(), price: currentPrice }]}
                width={chartWidth}
                height={responsiveChartHeight}
                currentPrice={currentPrice}
                priceChange={priceChange}
              />
            ) : null}
          </View>
        </View>        

        <View style={[styles.paddedSection, styles.portfolioSection]}>
          <Text style={styles.portfolioTitle}>Portfolio Summary</Text>
          <View style={styles.portfolioPanel}>
            {isLoading ? (
              <View style={styles.portfolioSkeleton}>
                <Skeleton width="100%" height={60} />
                <Skeleton width="100%" height={60} style={{ marginTop: 16 }} />
              </View>
            ) : (
              <>
                <View style={styles.portfolioRow}>
                  <View style={styles.portfolioItem}>
                    <Text style={styles.portfolioLabel}>Total Invested</Text>
                    <Text style={styles.portfolioValue}>{formatCurrency(portfolioData.totalInvested)}</Text>
                  </View>
                  <View style={styles.portfolioDivider} />
                  <View style={styles.portfolioItem}>
                    <Text style={styles.portfolioLabel}>Current Value</Text>
                    <Text style={styles.portfolioValue}>{formatCurrency(portfolioData.currentValue)}</Text>
                  </View>
                </View>

                <View style={styles.pnlContainer}>
                  <View style={styles.pnlItem}>
                    <Text style={styles.pnlLabel}>Total P&L</Text>
                    <View style={styles.pnlValueContainer}>
                      <Text style={[styles.pnlValue, portfolioData.totalPnL >= 0 ? styles.positive : styles.negative]}>
                        {portfolioData.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.totalPnL)}
                      </Text>
                      <View style={[styles.pnlBadge, portfolioData.totalPnLPercent >= 0 ? styles.positiveBg : styles.negativeBg]}>
                        <Ionicons name={portfolioData.totalPnLPercent >= 0 ? 'trending-up' : 'trending-down'} size={12} color={portfolioData.totalPnLPercent >= 0 ? colors.success : colors.danger} />
                        <Text style={[styles.pnlPercent, portfolioData.totalPnLPercent >= 0 ? styles.positive : styles.negative]}>
                          {portfolioData.totalPnLPercent.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.pnlItem}>
                    <Text style={styles.pnlLabel}>Daily P&L</Text>
                    <View style={styles.pnlValueContainer}>
                      <Text style={[styles.pnlValue, portfolioData.dailyPnL >= 0 ? styles.positive : styles.negative]}>
                        {portfolioData.dailyPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.dailyPnL)}
                      </Text>
                      <View style={[styles.pnlBadge, portfolioData.dailyPnLPercent >= 0 ? styles.positiveBg : styles.negativeBg]}>
                        <Ionicons name={portfolioData.dailyPnLPercent >= 0 ? 'trending-up' : 'trending-down'} size={12} color={portfolioData.dailyPnLPercent >= 0 ? colors.success : colors.danger} />
                        <Text style={[styles.pnlPercent, portfolioData.dailyPnLPercent >= 0 ? styles.positive : styles.negative]}>
                          {portfolioData.dailyPnLPercent.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {livePrices.length > 0 && (
          <View style={styles.paddedSection}>
            <View style={styles.pricesGrid}>
              {livePrices.slice(0, 6).map((crypto) => (
                <View key={crypto.symbol} style={styles.priceCard}>
                  <Text style={styles.priceSymbol}>{crypto.symbol.replace('/USD', '')}</Text>
                  <Text style={styles.priceValue}>${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                  <View style={[styles.priceChangeBadge, crypto.changePercent >= 0 ? styles.positiveBg : styles.negativeBg]}>
                    <Text style={[styles.priceChangeText, crypto.changePercent >= 0 ? styles.positive : styles.negative]}>
                      {crypto.changePercent >= 0 ? '+' : ''}{crypto.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.paddedSection}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          <View style={styles.newsList}>
            {news.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.newsItem}
                onPress={() => Linking.openURL(item.url)}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.newsImage} />
                <View style={styles.newsContent}>
                  <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.newsMeta}>
                    <Text style={styles.newsSource}>{item.source}</Text>
                    <Text style={styles.newsTime}>{item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}

function Gauge({ value, color }: { value: number; color: string }) {
  const size = 84;
  const stroke = 7;
  const height = 50;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = height - stroke / 2;
  const clamped = Math.max(0, Math.min(100, value));
  const endAngle = Math.PI - Math.PI * (clamped / 100);

  const polarToCartesian = (angle: number) => ({
    x: cx - radius * Math.cos(angle),
    y: cy - radius * Math.sin(angle),
  });

  const buildArc = (startAngle: number, finishAngle: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(finishAngle);
    const largeArcFlag = Math.abs(finishAngle - startAngle) > Math.PI ? 1 : 0;
    const sweepFlag = 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  };

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
        <Path
          d={buildArc(Math.PI, 0)}
          stroke={colors.border}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        {clamped > 0 && (
          <Path
            d={buildArc(Math.PI, endAngle)}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        )}
        <SvgText
          x={cx}
          y={height - 6}
          fill={color}
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
        >
          {Math.round(clamped)}
        </SvgText>
      </Svg>
    </View>
  );
}

function MiniAreaChart({ color }: { color: string }) {
  const values = [0.25, 0.3, 0.22, 0.42, 0.36, 0.48, 0.4, 0.55, 0.5, 0.62];
  const widthValue = 120;
  const heightValue = 44;
  const padding = 4;
  const step = (widthValue - padding * 2) / (values.length - 1);
  const points = values.map((value, index) => ({
    x: padding + index * step,
    y: heightValue - padding - value * (heightValue - padding * 2),
  }));
  const linePath = points.reduce(
    (path, point, index) => `${path}${index === 0 ? 'M' : ' L'} ${point.x} ${point.y}`,
    ''
  );
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${heightValue - padding} L ${points[0].x} ${heightValue - padding} Z`;

  return (
    <View style={styles.areaChartContainer}>
      <Svg width={widthValue} height={heightValue} viewBox={`0 0 ${widthValue} ${heightValue}`}>
        <Defs>
          <LinearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#marketArea)" />
        <Path d={linePath} stroke={color} strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.appBackground },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  paddedSection: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  metricsSection: { paddingTop: spacing.lg },
  portfolioSection: { paddingTop: spacing.lg, marginTop: spacing.md },
  chartSection: { marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  chartCanvas: { width: '100%' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  liveDotActive: { backgroundColor: colors.success },
  liveText: { ...typography.caption, color: colors.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  bitcoinHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bitcoinIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(247, 147, 26, 0.15)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  portfolioTitle: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.lg },
  sectionSubtitle: { ...typography.caption, color: colors.textSecondary },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 154,
  },
  metricLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  metricValue: { ...typography.h3, color: colors.textPrimary },
  metricSubvalue: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  gaugeContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    width: '100%',
    overflow: 'hidden',
  },
  areaChartContainer: {
    marginTop: spacing.sm,
    width: '100%',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  metricProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 999,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  portfolioPanel: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  portfolioSkeleton: { gap: spacing.md },
  portfolioRow: { flexDirection: 'row', marginBottom: spacing.lg },
  portfolioItem: { flex: 1, alignItems: 'center' },
  portfolioDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  portfolioLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  portfolioValue: { ...typography.h3, color: colors.textPrimary },
  pnlContainer: { flexDirection: 'row', gap: spacing.md },
  pnlItem: { flex: 1, backgroundColor: colors.cardBackground, borderRadius: borderRadius.md, padding: spacing.md },
  pnlLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  pnlValueContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pnlValue: { ...typography.h4 },
  pnlBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  pnlPercent: { ...typography.caption, fontWeight: '600' },
  positive: { color: colors.success },
  negative: { color: colors.danger },
  positiveBg: { backgroundColor: 'rgba(0, 255, 136, 0.15)' },
  negativeBg: { backgroundColor: 'rgba(255, 71, 87, 0.15)' },
  pricesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceCard: { width: (width - 48) / 2, padding: spacing.md, alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border },
  priceSymbol: { ...typography.body, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.xs },
  priceValue: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.xs },
  priceChangeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  priceChangeText: { ...typography.caption, fontWeight: '600' },
  newsList: { gap: spacing.md },
  newsItem: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  newsContent: { flex: 1, justifyContent: 'center' },
  newsTitle: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600', marginBottom: spacing.xs },
  newsMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  newsSource: { ...typography.caption, color: colors.primary },
  newsTime: { ...typography.caption, color: colors.textMuted },
});
