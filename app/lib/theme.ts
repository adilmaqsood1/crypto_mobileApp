// Theme constants for the crypto trading app
export const colors = {
  // Base colors
  background: '#020804', // Dark background for gradient start
  appBackground: 'transparent',
  cardBackground: 'rgba(10, 31, 20, 0.6)', // Semi-transparent card background
  cardBackgroundLight: '#3c904f',
  surface: '#0A1F14',
  
  // Primary colors
  primary: '#3c904f', 
  primaryDark: '#2b73ad', // Azure
  
  // Accent colors
  success: '#49a63b', // greeen
  successDark: '#3c904f', // gradient
  danger: '#e1430eff', // cyan
  dangerDark: '#801212ff', // Azure
  warning: '#efd80cff', // Azure
  warningDark: '#bf9708ff', // vivid blue
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#2b73ad',
  textMuted: '#ffffff',
  
  // Border colors
  border: '#2b73ad',
  borderLight: '#2b73ad',
  
  // Gradient colors
  gradientStart: '#3c904f', // gradient
  gradientEnd: '#33817b', // cyan
  
  // Chart colors
  chartLine: '#155fcf', // vivid blue
  chartFill: 'rgba(21, 95, 207, 0.12)',
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
