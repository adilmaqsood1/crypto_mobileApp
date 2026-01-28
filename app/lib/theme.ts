// Theme constants for the crypto trading app
export const colors = {
  // Base colors
  background: '#000000',
  appBackground: 'transparent',
  cardBackground: '#0F1A2B',
  cardBackgroundLight: '#14233A',
  surface: '#0A1F14',
  
  // Primary colors
  primary: '#18C6FF',
  primaryDark: '#0B99C6',
  
  // Accent colors
  success: '#17E3A6',
  successDark: '#0FB784',
  danger: '#FF5D6E',
  dangerDark: '#D64B58',
  warning: '#FFC857',
  warningDark: '#D9A845',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A0B1C8',
  textMuted: '#6B7A95',
  
  // Border colors
  border: '#1E2A44',
  borderLight: '#2D3A55',
  
  // Gradient colors
  gradientStart: '#18C6FF',
  gradientEnd: '#17E3A6',
  
  // Chart colors
  chartLine: '#18C6FF',
  chartFill: 'rgba(24, 198, 255, 0.12)',
  chartGrid: '#121A2B',
  gridLine: '#0F1626',
  gridLineStrong: '#182238',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
