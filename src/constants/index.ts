// 轻量科技风 — 白底 + 青蓝点缀
export const COLORS = {
  primary: '#0098FF',
  primaryLight: 'rgba(0,152,255,0.08)',
  background: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  text: '#1A1D28',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  free: '#10B981',
  paid: '#F59E0B',
  accent: '#6366F1',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  mapButtonBg: 'rgba(255,255,255,0.94)',
} as const

export const GLOW = {
  cyan: {
    shadowColor: '#0098FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  subtle: {
    shadowColor: '#0098FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
} as const

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 34,
} as const

// 高德 API 配置
export const AMAP = {
  API_KEY: process.env.EXPO_PUBLIC_AMAP_API_KEY || '',
  BASE_URL: 'https://restapi.amap.com/v3',
  SEARCH_RADIUS: 3000,
  PAGE_SIZE: 20,
} as const

export const DEFAULT_FILTER: import('../types').FilterOptions = {
  maxDistance: 3000,
  minRating: 0,
  isFree: null,
  hasAccessible: false,
  hasBabyRoom: false,
}
