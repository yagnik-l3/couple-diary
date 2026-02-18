import { s } from '@/utils/scale';

// ─── Color Palette ────────────────────────────────────
export const Colors = {
  // Primary gradient stops
  deepNavy: '#0B0D2E',
  indigo: '#1A1B4B',
  violet: '#3D2C6E',
  softPink: '#C77DB8',
  rosePink: '#E8A0BF',

  // Accent
  goldSparkle: '#F5D08A',
  lavender: '#B8A9E8',
  roseAccent: '#E86A9E',

  // Text
  textPrimary: '#F0EBF4',
  textSecondary: '#A9A3B8',
  textMuted: '#6E6880',

  // Surfaces
  cardBg: 'rgba(30, 25, 60, 0.65)',
  cardBgSolid: '#1E193C',
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  inputBg: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.10)',

  // Misc
  streakFlame: '#FF8C42',
  success: '#6ECB8A',
  warning: '#F5D08A',
  danger: '#E86A6A',
  white08: 'rgba(255,255,255,0.08)',
  white15: 'rgba(255,255,255,0.15)',
  white12: 'rgba(255,255,255,0.12)',
  white05: 'rgba(255,255,255,0.05)',
  white30: 'rgba(255,255,255,0.30)',
};

// ─── Gradients ────────────────────────────────────────
export const Gradients = {
  background: [Colors.deepNavy, Colors.indigo, Colors.violet] as const,
  backgroundFull: [Colors.deepNavy, Colors.indigo, Colors.violet, '#2D1B4E'] as const,
  button: ['#6C3DB8', '#9B4DCA', Colors.softPink] as const,
  buttonSubtle: ['rgba(108,61,184,0.4)', 'rgba(155,77,202,0.4)'] as const,
  card: ['rgba(30, 25, 60, 0.8)', 'rgba(45, 35, 75, 0.6)'] as const,
  glass: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] as const,
  streakBanner: ['#FF8C42', '#FF6B6B', '#E86A9E'] as const,
};

// ─── Typography ───────────────────────────────────────
export const Typography = {
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    color: Colors.textPrimary,
  },
  headingItalic: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    color: Colors.textPrimary,
  },
  h3: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: s(20),
    color: Colors.textPrimary,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  bodySemiBold: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    fontSize: s(13),
  },
};

// ─── Spacing & Layout ─────────────────────────────────
export const Spacing = {
  xs: s(4),
  sm: s(8),
  md: s(16),
  lg: s(24),
  xl: s(32),
  xxl: s(48),
  xxxl: s(64),
};

export const Radius = {
  sm: s(8),
  md: s(16),
  lg: s(20),
  xl: s(24),
  xxl: s(32),
  full: 999,
};

// ─── Shadows ──────────────────────────────────────────
export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: '#9B4DCA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowPink: {
    shadowColor: Colors.softPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};
