/**
 * PitchPerfect Design System
 *
 * Centralized design tokens for colors, typography, and spacing.
 * Import this file to ensure consistent styling across the app.
 */

// ============== COLORS ==============
export const colors = {
  // Primary palette (green)
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',

  // Secondary accents
  blue: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',

  // Neutral colors
  gray: '#888888',
  darkGray: '#3A3A3A',

  // Background colors
  background: '#0A0A0A',
  card: '#1A1A1A',
  cardHighlight: '#242424',
  border: '#2A2A2A',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.5)',
  textSubtle: 'rgba(255,255,255,0.4)',
  textDisabled: 'rgba(255,255,255,0.3)',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Special colors
  gold: '#F59E0B',
  silver: '#9CA3AF',
  bronze: '#CD7F32',
  flame: '#FF6B35',

  // Tab bar colors
  tabActive: '#10B981',
  tabInactive: 'rgba(255,255,255,0.5)',

  // Voice assistant state colors
  voiceListening: '#10B981',
  voiceProcessing: '#8B5CF6',
  voiceSpeaking: '#3B82F6',
  voiceError: '#EF4444',
  voiceIdle: '#1A1A1A',

  // AI/Coaching colors
  ai: '#8B5CF6',
  aiLight: 'rgba(139, 92, 246, 0.15)',
  aiBorder: 'rgba(139, 92, 246, 0.4)',
  coachingBubble: 'rgba(147, 51, 234, 0.95)',

  // UI element colors
  sliderTrack: '#3A3A3A',
  keyboardBackground: '#000000',
  indicatorInactive: 'rgba(255,255,255,0.3)',
} as const;

// ============== OPACITY VARIANTS ==============
// Use these for semi-transparent backgrounds and overlays

export const opacity = {
  // Black overlays (for modals, sheets, etc.)
  overlay50: 'rgba(0, 0, 0, 0.5)',
  overlay70: 'rgba(0, 0, 0, 0.7)',
  overlay80: 'rgba(0, 0, 0, 0.8)',
  overlay85: 'rgba(0, 0, 0, 0.85)',
  overlayContent: 'rgba(20, 20, 20, 0.95)',

  // White/text opacity levels
  white5: 'rgba(255, 255, 255, 0.05)',
  white10: 'rgba(255, 255, 255, 0.1)',
  white15: 'rgba(255, 255, 255, 0.15)',
  white20: 'rgba(255, 255, 255, 0.2)',
  white25: 'rgba(255, 255, 255, 0.25)',
  white30: 'rgba(255, 255, 255, 0.3)',
  white35: 'rgba(255, 255, 255, 0.35)',
  white40: 'rgba(255, 255, 255, 0.4)',
  white50: 'rgba(255, 255, 255, 0.5)',
  white60: 'rgba(255, 255, 255, 0.6)',
  white70: 'rgba(255, 255, 255, 0.7)',
  white80: 'rgba(255, 255, 255, 0.8)',
  white85: 'rgba(255, 255, 255, 0.85)',
  white90: 'rgba(255, 255, 255, 0.9)',
  white95: 'rgba(255, 255, 255, 0.95)',

  // Primary (green) opacity variants
  primary5: 'rgba(16, 185, 129, 0.05)',
  primary8: 'rgba(16, 185, 129, 0.08)',
  primary10: 'rgba(16, 185, 129, 0.1)',
  primary15: 'rgba(16, 185, 129, 0.15)',
  primary20: 'rgba(16, 185, 129, 0.2)',
  primary25: 'rgba(16, 185, 129, 0.25)',
  primary30: 'rgba(16, 185, 129, 0.3)',
  primary40: 'rgba(16, 185, 129, 0.4)',
  primary60: 'rgba(16, 185, 129, 0.6)',
  primary70: 'rgba(16, 185, 129, 0.7)',

  // Purple opacity variants
  purple10: 'rgba(139, 92, 246, 0.1)',
  purple15: 'rgba(139, 92, 246, 0.15)',
  purple20: 'rgba(139, 92, 246, 0.2)',
  purple40: 'rgba(139, 92, 246, 0.4)',
  purple50: 'rgba(139, 92, 246, 0.5)',

  // Blue opacity variants
  blue40: 'rgba(59, 130, 246, 0.4)',

  // Error (red) opacity variants
  error10: 'rgba(239, 68, 68, 0.1)',
  error20: 'rgba(239, 68, 68, 0.2)',
  error40: 'rgba(239, 68, 68, 0.4)',
  error50: 'rgba(239, 68, 68, 0.5)',

  // Warning (orange) opacity variants
  warning15: 'rgba(245, 158, 11, 0.15)',
  warning20: 'rgba(245, 158, 11, 0.2)',
} as const;

// ============== SEMANTIC BACKGROUNDS ==============
// Pre-defined background colors for common use cases

export const backgrounds = {
  // Success/Primary backgrounds
  successLight: 'rgba(16, 185, 129, 0.1)',
  successLighter: 'rgba(16, 185, 129, 0.05)',

  // Warning backgrounds
  warningLight: 'rgba(245, 158, 11, 0.15)',

  // Error backgrounds
  errorLight: 'rgba(239, 68, 68, 0.1)',

  // AI/Purple backgrounds
  aiLight: 'rgba(139, 92, 246, 0.1)',
  aiLighter: 'rgba(139, 92, 246, 0.15)',

  // Subtle UI backgrounds
  subtle: 'rgba(255, 255, 255, 0.05)',
  subtleBorder: 'rgba(255, 255, 255, 0.1)',
  subtleBorderActive: 'rgba(255, 255, 255, 0.2)',
  subtleBorderStrong: 'rgba(255, 255, 255, 0.3)',
} as const;

// ============== TYPOGRAPHY ==============
export const typography = {
  // Display
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

  // Body
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

  // Labels
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },

  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionSmall: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
  },

  // Section titles
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
} as const;

// ============== SPACING ==============
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ============== BORDER RADIUS ==============
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ============== SHADOWS ==============
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ============== COMMON STYLES ==============
export const commonStyles = {
  // Card base style
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Content padding
  contentPadding: {
    padding: spacing.lg,
  },
} as const;

// ============== TYPE EXPORTS ==============
export type Colors = typeof colors;
export type Opacity = typeof opacity;
export type Backgrounds = typeof backgrounds;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
