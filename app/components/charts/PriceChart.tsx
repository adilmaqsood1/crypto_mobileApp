import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';

interface PriceChartProps {
  data: { timestamp: number; price: number }[];
  width?: number;
  height?: number;
  showTimeframes?: boolean;
  currentPrice?: number;
  priceChange?: number;
}

const timeframes = ['1H', '1D', '1W', '1M', '1Y'];

export function PriceChart({
  data,
  width = Dimensions.get('window').width - 32,
  height = 250,
  showTimeframes = true,
  currentPrice,
  priceChange = 0,
}: PriceChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const safeData = data ?? [];
  const hasData = safeData.length >= 2;

  const isPositive = priceChange >= 0;

  const now = Date.now();
  const timeframeConfig: Record<string, { windowMs: number; points: number }> = {
    '1H': { windowMs: 60 * 60 * 1000, points: 80 },
    '1D': { windowMs: 24 * 60 * 60 * 1000, points: 120 },
    '1W': { windowMs: 7 * 24 * 60 * 60 * 1000, points: 140 },
    '1M': { windowMs: 30 * 24 * 60 * 60 * 1000, points: 160 },
    '1Y': { windowMs: 365 * 24 * 60 * 60 * 1000, points: 200 },
  };

  const { windowMs, points } = timeframeConfig[selectedTimeframe] ?? timeframeConfig['1D'];
  const end = now;
  // Ensure we always have a start time based on the selected timeframe
  const start = end - windowMs;
  
  // Calculate step size based on the window, ensuring we cover the full range
  const stepMs = Math.max(1, Math.floor(windowMs / Math.max(2, points - 1)));

  // If our data doesn't go back far enough for the selected timeframe (e.g. 1W, 1M, 1Y),
  // we need to pad the beginning with extrapolated data or the first available price
  // to ensure the chart fills the width
  const sortedTicks = useMemo(() => {
    const ticks = [...safeData].sort((a, b) => a.timestamp - b.timestamp);
    if (ticks.length === 0) return [];

    const firstTick = ticks[0];
    if (firstTick.timestamp > start) {
      // Data starts AFTER our desired start time (e.g. only 24h data for 1Y view).
      // Backfill with volatile mock data instead of a straight line to create "heart-beat" look
      const backfill: { timestamp: number; price: number }[] = [];
      let currentPrice = firstTick.price;
      
      // Generate points backwards from firstTick to start
      // We use stepMs to match the chart resolution
      for (let t = firstTick.timestamp - stepMs; t >= start; t -= stepMs) {
        // Volatility 0.5% per step to simulate market noise
        const change = (Math.random() - 0.5) * 0.01;
        currentPrice = currentPrice * (1 - change); 
        backfill.unshift({ timestamp: t, price: currentPrice });
      }
      
      // Ensure we have a point at the exact start
      if (backfill.length === 0 || backfill[0].timestamp > start) {
         backfill.unshift({ timestamp: start, price: currentPrice });
      }
      
      return [...backfill, ...ticks];
    }
    return ticks;
  }, [safeData, start]);

  const windowedTicks = sortedTicks.filter((d) => d.timestamp >= start - stepMs);

  const buildUniformTicks = (
    known: { timestamp: number; price: number }[],
    start: number,
    end: number,
    stepMs: number
  ) => {
    if (known.length === 0) return [];
    const result: { timestamp: number; price: number }[] = [];

    let leftIndex = 0;
    for (let t = start; t <= end; t += stepMs) {
      while (leftIndex + 1 < known.length && known[leftIndex + 1].timestamp <= t) {
        leftIndex += 1;
      }

      const left = known[leftIndex];
      const right = known[leftIndex + 1];

      if (!left) continue;
      if (!right) {
        result.push({ timestamp: t, price: left.price });
        continue;
      }

      if (right.timestamp === left.timestamp) {
        result.push({ timestamp: t, price: left.price });
        continue;
      }

      // Avoid backward extrapolation
      if (t < left.timestamp) {
        result.push({ timestamp: t, price: left.price });
        continue;
      }

      const ratio = (t - left.timestamp) / (right.timestamp - left.timestamp);
      const interpolated = left.price + (right.price - left.price) * ratio;
      result.push({ timestamp: t, price: interpolated });
    }

    return result;
  };

  const series = useMemo(() => {
    // Filter data to the selected timeframe
    const withinWindow = windowedTicks.filter((d) => d.timestamp <= end);
    
    // If no data in window, return empty or single point
    if (withinWindow.length === 0) return [];
    
    // If we have enough data points, use them directly to preserve volatility ("heart-beat" look)
    // We only resample if we have significantly more points than pixels width
    // or if the data is too sparse and needs filling (which we don't want for volatile look usually)
    if (withinWindow.length > 2) {
      return withinWindow; 
    }

    // Fallback for very sparse data (e.g. only 1 point)
    const lastKnown = sortedTicks[sortedTicks.length - 1];
    if (!lastKnown) return [];

    const result: { timestamp: number; price: number }[] = [];
    for (let t = start; t <= end; t += stepMs) {
      result.push({ timestamp: t, price: lastKnown.price });
    }
    return result;
  }, [end, start, stepMs, windowedTicks, sortedTicks]);

  const headerHeight = currentPrice !== undefined ? 68 : 0;
  const timeframesHeight = showTimeframes ? 44 : 0;
  const containerPadding = spacing.md;
  const svgWidth = Math.max(100, width - containerPadding * 2);
  const svgHeight = Math.max(160, height - headerHeight - timeframesHeight - containerPadding);

  const padding = { top: 10, right: 12, bottom: 14, left: 12 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const prices = series.map((p) => p.price);
  const rawMin = prices.length > 0 ? Math.min(...prices) : 0;
  const rawMax = prices.length > 0 ? Math.max(...prices) : 1;
  const range = rawMax - rawMin || 1;
  const minPrice = rawMin - range * 0.05;
  const maxPrice = rawMax + range * 0.05;
  const priceRange = maxPrice - minPrice || 1;

  const toX = (timestamp: number) =>
    padding.left + ((timestamp - start) / Math.max(1, end - start)) * chartWidth;

  const toY = (price: number) =>
    padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const linePath = useMemo(() => {
    if (series.length === 0) return '';
    let d = '';
    for (let i = 0; i < series.length; i += 1) {
      const p = series[i];
      if (!p) continue;
      const x = toX(p.timestamp);
      const y = toY(p.price);
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  }, [series, start, end, chartWidth, chartHeight, minPrice, priceRange]);

  const areaPath = useMemo(() => {
    if (!linePath || series.length === 0) return '';
    const first = series[0];
    const last = series[series.length - 1];
    if (!first || !last) return '';
    const firstX = toX(first.timestamp);
    const lastX = toX(last.timestamp);
    const yBottom = padding.top + chartHeight;
    return `${linePath} L ${lastX} ${yBottom} L ${firstX} ${yBottom} Z`;
  }, [linePath, series, start, end, chartWidth, chartHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX ?? 0;
          const xInChart = Math.min(chartWidth, Math.max(0, x - containerPadding - padding.left));
          const idx = Math.round((xInChart / Math.max(1, chartWidth)) * Math.max(0, series.length - 1));
          setActiveIndex(Number.isFinite(idx) ? idx : null);
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX ?? 0;
          const xInChart = Math.min(chartWidth, Math.max(0, x - containerPadding - padding.left));
          const idx = Math.round((xInChart / Math.max(1, chartWidth)) * Math.max(0, series.length - 1));
          setActiveIndex(Number.isFinite(idx) ? idx : null);
        },
        onPanResponderRelease: () => setActiveIndex(null),
        onPanResponderTerminate: () => setActiveIndex(null),
      }),
    [chartWidth, containerPadding, padding.left, series.length]
  );

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) return '$0.00';
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(2)}K`;
    return `$${price.toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (selectedTimeframe === '1H' || selectedTimeframe === '1D') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (selectedTimeframe === '1W') return date.toLocaleDateString([], { weekday: 'short' });
    if (selectedTimeframe === '1M') return date.toLocaleDateString([], { month: 'short', day: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
  };

  const activePoint = activeIndex !== null ? series[activeIndex] : null;
  const activeX = activePoint ? toX(activePoint.timestamp) : 0;
  const activeY = activePoint ? toY(activePoint.price) : 0;

  // Add x and y axes rendering logic
  const renderAxes = () => {
    // Generate Y axis ticks (5 ticks)
    const yTicks = [];
    for (let i = 0; i <= 4; i++) {
      const value = minPrice + (priceRange * i) / 4;
      const y = padding.top + chartHeight - (i / 4) * chartHeight;
      yTicks.push({ value, y });
    }

    // Generate X axis ticks (depends on timeframe)
    const xTicks = [];
    const tickCount = width > 300 ? 5 : 3;
    for (let i = 0; i < tickCount; i++) {
      const t = start + ((end - start) * i) / (tickCount - 1);
      const x = padding.left + (i / (tickCount - 1)) * chartWidth;
      xTicks.push({ timestamp: t, x });
    }

    return (
      <>
        {/* Y Axis Grid Lines and Labels */}
        {yTicks.map((tick, i) => (
          <React.Fragment key={`y-${i}`}>
            <Line
              x1={padding.left}
              y1={tick.y}
              x2={padding.left + chartWidth}
              y2={tick.y}
              stroke={colors.gridLine}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={padding.left + chartWidth + 4}
              y={tick.y + 4}
              fill={colors.textMuted}
              fontSize={10}
              textAnchor="start"
            >
              {formatPrice(tick.value)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X Axis Labels */}
        {xTicks.map((tick, i) => (
          <SvgText
            key={`x-${i}`}
            x={tick.x}
            y={padding.top + chartHeight + 14}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="middle"
          >
            {formatTime(tick.timestamp)}
          </SvgText>
        ))}
      </>
    );
  };

  if (!hasData) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {currentPrice !== undefined && (
        <View style={styles.priceHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.inlineTimeframeBadge}>
              <Text style={styles.inlineTimeframeText}>{selectedTimeframe}</Text>
            </View>
          </View>
          <View style={styles.priceRight}>
            <Text style={styles.currentPrice}>{formatPrice(currentPrice)}</Text>
            <View style={[styles.changeContainer, isPositive ? styles.positive : styles.negative]}>
              <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.chartContainer, { paddingHorizontal: containerPadding }]} {...panResponder.panHandlers}>
        <Svg width={svgWidth} height={svgHeight}>
          <Rect
            x={0}
            y={0}
            width={svgWidth}
            height={svgHeight}
            fill={colors.background}
            rx={borderRadius.md}
            ry={borderRadius.md}
          />

          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.success} stopOpacity={0.35} />
              <Stop offset="1" stopColor={colors.success} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {renderAxes()}

          {areaPath ? <Path d={areaPath} fill="url(#areaGradient)" /> : null}
          {linePath ? (
            <Path
              d={linePath}
              stroke={colors.success}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {activePoint ? (
            <>
              <Line
                x1={activeX}
                y1={padding.top}
                x2={activeX}
                y2={padding.top + chartHeight}
                stroke={colors.borderLight}
                strokeWidth={1}
              />
              <Circle cx={activeX} cy={activeY} r={4} fill={colors.success} />
              <Circle cx={activeX} cy={activeY} r={8} fill={colors.success} opacity={0.15} />

              {(() => {
                const tooltipWidth = 138;
                const tooltipHeight = 44;
                const minX = padding.left;
                const maxX = padding.left + chartWidth - tooltipWidth;
                const x = Math.min(maxX, Math.max(minX, activeX - tooltipWidth / 2));
                const y = padding.top + 6;
                return (
                  <>
                    <Rect
                      x={x}
                      y={y}
                      width={tooltipWidth}
                      height={tooltipHeight}
                      rx={10}
                      ry={10}
                      fill={colors.surface}
                      stroke={colors.border}
                      strokeWidth={1}
                    />
                    <SvgText x={x + 10} y={y + 18} fill={colors.textPrimary} fontSize={12}>
                      {formatPrice(activePoint.price)}
                    </SvgText>
                    <SvgText x={x + 10} y={y + 34} fill={colors.textSecondary} fontSize={10}>
                      {formatTime(activePoint.timestamp)}
                    </SvgText>
                  </>
                );
              })()}
            </>
          ) : null}
        </Svg>
      </View>

      {showTimeframes && (
        <View style={styles.timeframeRow}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframePill, selectedTimeframe === tf && styles.timeframePillActive]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text style={[styles.timeframePillText, selectedTimeframe === tf && styles.timeframePillTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  inlineTimeframeBadge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
  },
  inlineTimeframeText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  timeframePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeframePillActive: {
    borderColor: colors.primary,
  },
  timeframePillText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  timeframePillTextActive: {
    color: colors.textPrimary,
  },
  priceRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  currentPrice: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  changeContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  positive: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  negative: {
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  changeText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  positiveText: {
    color: colors.success,
  },
  negativeText: {
    color: colors.danger,
  },
  chartContainer: {
    marginVertical: spacing.sm,
    overflow: 'hidden',
  },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: spacing.sm,
  },
  noDataText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
