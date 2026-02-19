import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../lib/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const basePaddingBottom = 25;
  const paddingBottom = Math.max(insets.bottom, basePaddingBottom);
  const height = 85 + Math.max(0, paddingBottom - basePaddingBottom);

  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar {...props} paddingBottom={paddingBottom} height={height} />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height,
          paddingBottom,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...typography.label,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

type CustomTabBarProps = BottomTabBarProps & {
  paddingBottom: number;
  height: number;
};

function CustomTabBar({ state, descriptors, navigation, paddingBottom, height }: CustomTabBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current;
  const routes = useMemo(
    () => state.routes.filter(route => route.name !== 'watchlist'),
    [state.routes]
  );
  const leftRoutes = routes.slice(0, 2);
  const rightRoutes = routes.slice(2);

  const menuItems = [
    {
      key: 'scanner',
      label: 'Scanner',
      icon: 'scan-outline' as const,
      onPress: () => navigation.navigate('scanner'),
    },
    {
      key: 'stock360',
      label: 'Stock360',
      icon: 'stats-chart-outline' as const,
      onPress: () => Alert.alert('Stock360', 'Coming soon'),
    },
    {
      key: 'announcements',
      label: 'Announcements',
      icon: 'megaphone-outline' as const,
      onPress: () => router.push('/notifications'),
    },
    {
      key: 'account',
      label: 'Account',
      icon: 'person-circle-outline' as const,
      onPress: () => navigation.navigate('account'),
    },
    {
      key: 'watchlist',
      label: 'Watchlist',
      icon: 'star-outline' as const,
      onPress: () => navigation.navigate('watchlist'),
    },
  ];

  useEffect(() => {
    if (menuOpen) {
      menuAnim.setValue(0);
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      menuAnim.setValue(0);
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [glowAnim, menuAnim, menuOpen]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fabAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fabAnim]);

  const menuScale = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const ringOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });
  const ringScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.04],
  });
  const fabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const fabGlowOpacity = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <View style={[styles.tabBarContainer, { height, paddingBottom }]}>
      <View style={styles.tabGroup}>
        {leftRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.index === state.routes.indexOf(route);
          const color = focused ? colors.primary : colors.textMuted;
          const label = options.title ?? route.name;
          const icon = options.tabBarIcon?.({ color, size: 22, focused });

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
            >
              {icon}
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.centerGap} />

      <View style={styles.tabGroup}>
        {rightRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.index === state.routes.indexOf(route);
          const color = focused ? colors.primary : colors.textMuted;
          const label = options.title ?? route.name;
          const icon = options.tabBarIcon?.({ color, size: 22, focused });

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.7}
            >
              {icon}
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Animated.View style={[styles.fabButton, { bottom: paddingBottom + 6, transform: [{ scale: fabScale }] }]}>
        <Pressable onPress={() => setMenuOpen(true)}>
          <View style={styles.fabOuter}>
            <Animated.View style={[styles.fabGlow, { opacity: fabGlowOpacity }]} />
            <View style={styles.fabInner}>
              <Ionicons name="apps-outline" size={26} color={colors.background} />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Animated.View style={[styles.menuCircle, { opacity: menuAnim, transform: [{ scale: menuScale }] }]}>
            <Animated.View style={[styles.glowRingOuter, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            <Animated.View style={[styles.glowRingInner, { opacity: ringOpacity }]} />
            {menuItems.map((item, index) => {
              const total = menuItems.length;
              const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
              const radius = 96;
              const size = 58;
              const left = 130 + Math.cos(angle) * radius - size / 2;
              const top = 130 + Math.sin(angle) * radius - size / 2;

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, { left, top, width: size, height: size }]}
                  onPress={() => {
                    setMenuOpen(false);
                    item.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[styles.menuItemGlow, { opacity: ringOpacity }]} />
                  <View style={styles.menuItemCore}>
                    <Ionicons name={item.icon} size={28} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  centerGap: {
    width: 96,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  fabButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: -22,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(24, 198, 255, 0.6)',
    backgroundColor: 'rgba(24, 198, 255, 0.12)',
  },
  fabGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(24, 198, 255, 0.15)',
    shadowColor: colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  menuCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'transparent',
  },
  glowRingOuter: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(24, 198, 255, 0.35)',
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  glowRingInner: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 228,
    height: 228,
    borderRadius: 114,
    borderWidth: 1,
    borderColor: 'rgba(24, 198, 255, 0.2)',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  menuItem: {
    position: 'absolute',
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  menuItemGlow: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(24, 198, 255, 0.12)',
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  menuItemCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(24, 198, 255, 0.6)',
    backgroundColor: 'rgba(24, 198, 255, 0.08)',
  },
});
