/**
 * PITCHPERFECT DESIGN SYSTEM
 * Professional, minimal, Apple-inspired design language
 * Based on 2025 Apple Design Awards winners and industry research
 */

export const DesignSystem = {
  // ============================================
  // COLORS
  // ============================================
  colors: {
    // Backgrounds (Dark theme - Navy blue for premium feel)
    background: {
      primary: '#0F172A',      // Midnight navy - Main app background (NEW)
      secondary: '#1E293B',    // Slate - Card backgrounds (NEW)
      tertiary: '#334155',     // Lighter slate - Borders, dividers (NEW)
      quaternary: '#3A3A3A',   // Input backgrounds (kept for compatibility)
      elevated: '#1E293B',     // Card on primary background (NEW)
      overlay: 'rgba(15, 23, 42, 0.95)', // Modal/sheet overlay (NEW)
    },

    // Text (iOS Human Interface Guidelines)
    text: {
      primary: '#FFFFFF',              // 100% opacity - Titles, primary content
      secondary: '#E5E7EB',            // 90% opacity - Body text (NEW - clearer than EBEBF599)
      tertiary: '#9CA3AF',             // 60% opacity - Captions, metadata (NEW)
      quaternary: '#6B7280',           // 40% opacity - Placeholders, disabled (NEW)
      disabled: '#EBEBF533',           // 20% opacity - Disabled state (kept for compatibility)
      inverse: '#0F172A',              // Dark text on light backgrounds (NEW)
    },

    // Accent Colors (Updated to blue theme)
    accent: {
      primary: '#3B82F6',      // Blue - Main accent, CTAs, focus states (NEW)
      secondary: '#8B5CF6',    // Purple - Secondary accent, highlights (NEW)
      success: '#10B981',      // Green - Correct pitch, positive feedback (UPDATED - brighter)
      warning: '#F59E0B',      // Amber - Close pitch, near-miss (UPDATED)
      error: '#EF4444',        // Red - Off pitch, negative feedback (UPDATED)
      info: '#3B82F6',         // Blue - Info states, tips (NEW - matches primary)
    },

    // Brand gradient (for hero card)
    brand: {
      gradient: ['#3B82F6', '#8B5CF6'], // Blue → Purple gradient (NEW)
    },

    // Difficulty colors (semantic mapping)
    difficulty: {
      beginner: '#10B981',     // Green
      intermediate: '#F59E0B', // Amber
      advanced: '#EF4444',     // Red
    },

    // Gamification colors
    gamification: {
      streak: '#F59E0B',       // Amber/Orange - Fire emoji color
      xp: '#8B5CF6',           // Purple - Experience points
      achievement: '#FBBF24',  // Gold - Achievements, stars
    },

    // System Colors
    system: {
      blue: '#0A84FF',         // iOS system blue
      green: '#32D74B',        // iOS system green
      indigo: '#5E5CE6',       // iOS system indigo
      orange: '#FF9F0A',       // iOS system orange
      pink: '#FF375F',         // iOS system pink
      purple: '#BF5AF2',       // iOS system purple
      red: '#FF453A',          // iOS system red
      teal: '#64D2FF',         // iOS system teal
      yellow: '#FFD60A',       // iOS system yellow
    },

    // Overlays (for transparent surfaces)
    overlay: {
      light: 'rgba(255, 255, 255, 0.10)',    // 10% white
      medium: 'rgba(255, 255, 255, 0.18)',   // 18% white
      heavy: 'rgba(255, 255, 255, 0.25)',    // 25% white
      dark: 'rgba(0, 0, 0, 0.50)',           // 50% black
    },

    // Separators
    separator: {
      opaque: '#38383A',                      // Opaque separator
      transparent: 'rgba(84, 84, 88, 0.65)', // Transparent separator
    },
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    // Large Title (Navigation bars, emphasis)
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700' as const,
      letterSpacing: 0.37,
    },

    // Title 1 (Page titles)
    title1: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: 0.36,
    },

    // Title 2 (Section titles)
    title2: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '600' as const,
      letterSpacing: 0.35,
    },

    // Title 3 (Subsection titles)
    title3: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600' as const,
      letterSpacing: 0.38,
    },

    // Headline (Emphasized body text)
    headline: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: -0.41,
    },

    // Body (Default body text)
    body: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400' as const,
      letterSpacing: -0.41,
    },

    // Callout (Secondary body text)
    callout: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '400' as const,
      letterSpacing: -0.32,
    },

    // Subheadline (Tertiary content)
    subheadline: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: -0.24,
    },

    // Footnote (Timestamps, captions)
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
      letterSpacing: -0.08,
    },

    // Caption 1 (Labels, metadata)
    caption1: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },

    // Caption 2 (Small labels)
    caption2: {
      fontSize: 11,
      lineHeight: 13,
      fontWeight: '400' as const,
      letterSpacing: 0.07,
    },
  },

  // ============================================
  // SPACING (8px base unit)
  // ============================================
  spacing: {
    xxs: 2,      // 2px - Minimal spacing
    xs: 4,       // 4px - Icon padding
    sm: 8,       // 8px - Base unit
    md: 12,      // 12px - Comfortable spacing
    lg: 16,      // 16px - Section spacing
    xl: 20,      // 20px - Large gaps
    xxl: 24,     // 24px - Page margins
    xxxl: 32,    // 32px - Major sections
    huge: 40,    // 40px - Very large gaps
    massive: 48, // 48px - Maximum spacing
  },

  // ============================================
  // BORDER RADIUS
  // ============================================
  radius: {
    xs: 4,       // 4px - Subtle rounding
    sm: 8,       // 8px - Buttons, small cards
    md: 12,      // 12px - Standard cards
    lg: 16,      // 16px - Large cards
    xl: 20,      // 20px - Very large cards
    xxl: 24,     // 24px - Sheet corners
    full: 9999,  // 9999px - Pills, circles
  },

  // ============================================
  // SHADOWS (Elevation system)
  // ============================================
  shadows: {
    // No shadow
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    // Small shadow (buttons, small cards)
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    // Medium shadow (cards, modals)
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },

    // Large shadow (floating elements)
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },

    // Extra large shadow (sheets, overlays)
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // ============================================
  // ANIMATION (Duration in milliseconds)
  // ============================================
  animation: {
    instant: 0,      // 0ms - No animation
    fast: 150,       // 150ms - Quick feedback
    normal: 250,     // 250ms - Standard transitions
    slow: 350,       // 350ms - Deliberate movements
    verySlow: 500,   // 500ms - Dramatic reveals
  },

  // ============================================
  // EASING CURVES
  // ============================================
  easing: {
    // Standard easing
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

    // Accelerate (entering)
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',

    // Decelerate (exiting)
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',

    // Sharp (quick in/out)
    sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',

    // Spring (bouncy)
    spring: {
      tension: 80,
      friction: 10,
    },
  },

  // ============================================
  // LAYOUT
  // ============================================
  layout: {
    // Container widths
    container: {
      sm: 640,   // Small screens
      md: 768,   // Medium screens
      lg: 1024,  // Large screens
      xl: 1280,  // Extra large screens
      full: '100%',
    },

    // Content padding
    padding: {
      screen: 20,  // Standard screen padding
      card: 16,    // Card inner padding
      modal: 24,   // Modal padding
    },

    // Header heights
    header: {
      sm: 44,   // Small header
      md: 56,   // Medium header
      lg: 64,   // Large header
    },
  },

  // ============================================
  // Z-INDEX (Stacking order)
  // ============================================
  zIndex: {
    base: 0,           // Base layer
    dropdown: 1000,    // Dropdowns
    sticky: 1020,      // Sticky elements
    fixed: 1030,       // Fixed elements
    modalBackdrop: 1040, // Modal backdrops
    modal: 1050,       // Modals
    popover: 1060,     // Popovers
    tooltip: 1070,     // Tooltips
    toast: 1080,       // Toast notifications
  },

  // ============================================
  // BACKWARD COMPATIBILITY (Flat structure for old code)
  // ============================================
  fontSizes: {
    small: 13,   // footnote
    medium: 17,  // body
    large: 20,   // title3
    xlarge: 22,  // title2
    xxlarge: 28, // title1
  },
  borderRadius: 12,
};

// ============================================
// TYPE EXPORTS
// ============================================
export type DesignSystemType = typeof DesignSystem;
export type ColorKey = keyof typeof DesignSystem.colors;
export type TypographyKey = keyof typeof DesignSystem.typography;
export type SpacingKey = keyof typeof DesignSystem.spacing;
export type RadiusKey = keyof typeof DesignSystem.radius;
export type ShadowKey = keyof typeof DesignSystem.shadows;
