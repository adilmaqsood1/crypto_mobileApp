import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { colors, spacing, typography } from '../lib/theme';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
}

export function MovingTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch top coins for the ticker
      const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE', 'AVAX', 'LINK'];
      const response = await api.getTickers(symbols);
      
      if (response.data) {
        const formattedItems = response.data.map((item: any) => ({
          symbol: item.symbol.replace('/USD', '').replace('/USDT', ''),
          price: item.current_price || item.price || 0,
          change: item.price_change_percentage_24h || item.changePercent24h || 0
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    }
  };

  useEffect(() => {
    if (contentWidth > 0 && items.length > 0) {
      startAnimation();
    }
  }, [contentWidth, items]);

  const startAnimation = () => {
    // Reset position
    scrollX.setValue(0);
    
    // The width of one set of items
    const singleSetWidth = contentWidth / 2;
    
    // If content is not wide enough to scroll, don't scroll or handle differently
    // But here we duplicate items so it should be fine.
    
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -singleSetWidth,
        duration: items.length * 2000, // Adjust speed
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  if (items.length === 0) return null;

  // Duplicate items to create seamless loop
  const displayItems = [...items, ...items];

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.tickerContainer, 
          { transform: [{ translateX: scrollX }] }
        ]}
      >
        <View 
          style={styles.row}
          onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
        >
          {displayItems.map((item, index) => (
            <View key={`${item.symbol}-${index}`} style={styles.item}>
              <Text style={styles.symbol}>{item.symbol}</Text>
              <Text style={styles.price}>${item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
              <Text style={[
                styles.change, 
                { color: item.change >= 0 ? colors.success : colors.danger }
              ]}>
                {item.change >= 0 ? '▲' : '▼'}{Math.abs(item.change).toFixed(2)}%
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
    gap: spacing.xs,
  },
  symbol: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  price: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  change: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  }
});
