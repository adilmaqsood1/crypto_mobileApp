import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { AuthProvider } from './store/AuthContext';
import { AppProvider } from './store/AppContext';
import { colors } from './lib/theme';

// Polyfill fetch to prevent Supabase from trying to import @supabase/node-fetch
// This is a no-op in React Native where fetch already exists
if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <StatusBar style="light" />
        <View style={styles.container}>
          <AppBackground />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.content,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen 
              name="profile" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen 
              name="notifications" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }} 
            />
            <Stack.Screen name="course/[id]" />
          </Stack>
        </View>
      </AppProvider>
    </AuthProvider>
  );
}

function AppBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.surface} stopOpacity={1} />
          </LinearGradient>
          <Pattern id="smallGrid" width={24} height={24} patternUnits="userSpaceOnUse">
            <Path
              d="M 24 0 L 0 0 0 24"
              stroke={colors.gridLine}
              strokeWidth={1}
              strokeOpacity={0.35}
            />
          </Pattern>
          <Pattern id="largeGrid" width={120} height={120} patternUnits="userSpaceOnUse">
            <Path
              d="M 120 0 L 0 0 0 120"
              stroke={colors.gridLineStrong}
              strokeWidth={1}
              strokeOpacity={0.45}
            />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#bgGradient)" />
        <Rect width={width} height={height} fill="url(#smallGrid)" />
        <Rect width={width} height={height} fill="url(#largeGrid)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    backgroundColor: 'transparent',
  },
});
