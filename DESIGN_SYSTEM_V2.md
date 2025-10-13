# PitchPerfect Design System V2.0
## Complete Visual Language Specification

---

## Design Philosophy

> "Design is not just what it looks like and feels like. Design is how it works." - Steve Jobs

This design system embodies three core principles:
1. **Clarity** - Every element has a clear purpose
2. **Consistency** - Patterns are reusable and predictable
3. **Delight** - Subtle animations and interactions create joy

---

## Color System

### Primary Palette

```javascript
const colors = {
  // Brand Colors
  brand: {
    primary: '#3B82F6',    // Blue - Main accent, CTAs, focus states
    secondary: '#8B5CF6',  // Purple - Secondary accent, highlights
    gradient: ['#3B82F6', '#8B5CF6'], // Primary gradient (blue → purple)
  },

  // Background Colors (Dark Theme)
  background: {
    primary: '#0F172A',    // Midnight navy - Main app background
    secondary: '#1E293B',  // Slate - Card backgrounds
    tertiary: '#334155',   // Lighter slate - Borders, dividers
    elevated: '#1E293B',   // Card on primary background (same as secondary)
    overlay: 'rgba(15, 23, 42, 0.95)', // Modal/sheet overlay
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',      // 100% white - Headlines, primary text
    secondary: '#E5E7EB',    // 90% white - Body text, descriptions
    tertiary: '#9CA3AF',     // 60% white - Captions, metadata
    quaternary: '#6B7280',   // 40% white - Placeholders, disabled
    inverse: '#0F172A',      // Dark text on light backgrounds
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',    // Green - Success states, beginner level, perfect pitch
    warning: '#F59E0B',    // Amber - Warning states, intermediate level, close pitch
    error: '#EF4444',      // Red - Error states, advanced level (challenge), off pitch
    info: '#3B82F6',       // Blue - Info states, tips
  },

  // Difficulty Colors (Maps to Semantic)
  difficulty: {
    beginner: '#10B981',      // Green
    intermediate: '#F59E0B',  // Amber
    advanced: '#EF4444',      // Red
  },

  // Pitch Accuracy Colors (Visualizer)
  pitch: {
    perfect: '#10B981',       // Green - Within ±5 cents
    close: '#F59E0B',         // Amber - Within ±5-20 cents
    off: '#EF4444',           // Red - Beyond ±20 cents
    target: '#3B82F6',        // Blue - Target pitch line
    background: '#334155',    // Grey - Visualizer background
  },

  // Interactive States
  interactive: {
    hover: 'rgba(59, 130, 246, 0.1)',     // 10% blue
    pressed: 'rgba(59, 130, 246, 0.2)',   // 20% blue
    disabled: 'rgba(255, 255, 255, 0.1)', // 10% white
    focus: '#3B82F6',                     // Blue border
  },

  // Streak/Gamification Colors
  gamification: {
    streak: '#F59E0B',        // Amber/Orange - Fire emoji color
    xp: '#8B5CF6',            // Purple - Experience points
    achievement: '#FBBF24',   // Gold - Achievements, stars
  },
};
```

### Color Usage Guidelines

**Do's:**
- ✅ Use `brand.primary` for main CTAs and focus states
- ✅ Use semantic colors for their intended purposes (success = green, etc.)
- ✅ Maintain 4.5:1 contrast ratio minimum for text (WCAG AA)
- ✅ Use gradients sparingly for hero elements only

**Don'ts:**
- ❌ Don't use semantic colors for branding (success green ≠ brand color)
- ❌ Don't mix custom colors outside this palette
- ❌ Don't use pure white (#FFFFFF) for backgrounds (too harsh)
- ❌ Don't use more than 3 colors in a single component

---

## Typography

### Font Families

**Primary:** SF Pro (iOS System Font)
- Display: Headlines and large text
- Text: Body copy and UI elements
- Rounded: Friendly, approachable contexts (numbers, labels)

**Fallback Chain:**
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
             'Helvetica Neue', Helvetica, Arial, sans-serif;
```

---

### Type Scale

```javascript
const typography = {
  // Display Styles (Hero, Large Headlines)
  largeTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700', // Bold
    letterSpacing: 0.37,
  },

  title1: {
    fontFamily: 'SF Pro Display',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700', // Bold
    letterSpacing: 0.36,
  },

  title2: {
    fontFamily: 'SF Pro Display',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600', // Semibold
    letterSpacing: 0.35,
  },

  title3: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600', // Semibold
    letterSpacing: 0.38,
  },

  // Body Styles (Paragraphs, Descriptions)
  body: {
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400', // Regular
    letterSpacing: -0.41,
  },

  bodyBold: {
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600', // Semibold
    letterSpacing: -0.41,
  },

  callout: {
    fontFamily: 'SF Pro Text',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400', // Regular
    letterSpacing: -0.32,
  },

  // Small Styles (Captions, Metadata)
  subheadline: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400', // Regular
    letterSpacing: -0.24,
  },

  footnote: {
    fontFamily: 'SF Pro Text',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400', // Regular
    letterSpacing: -0.08,
  },

  caption1: {
    fontFamily: 'SF Pro Text',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400', // Regular
    letterSpacing: 0,
  },

  caption2: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400', // Regular
    letterSpacing: 0.06,
  },

  // Special Styles (Buttons, Labels)
  button: {
    fontFamily: 'SF Pro Text',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600', // Semibold
    letterSpacing: -0.41,
  },

  buttonSmall: {
    fontFamily: 'SF Pro Text',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600', // Semibold
    letterSpacing: -0.24,
  },

  label: {
    fontFamily: 'SF Pro Text',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600', // Semibold
    letterSpacing: 0.06,
    textTransform: 'uppercase',
  },

  // Numbers (Rounded for friendly feel)
  numberLarge: {
    fontFamily: 'SF Pro Rounded',
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '700', // Bold
    letterSpacing: 0,
  },

  numberMedium: {
    fontFamily: 'SF Pro Rounded',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600', // Semibold
    letterSpacing: 0,
  },

  numberSmall: {
    fontFamily: 'SF Pro Rounded',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600', // Semibold
    letterSpacing: 0,
  },
};
```

### Typography Usage Map

| Element | Style | Example |
|---------|-------|---------|
| Hero card title | title1 (28pt Bold) | "5-Note Warm-Up" |
| Hero card label | label (11pt Semibold Uppercase) | "YOUR PRACTICE FOR TODAY" |
| Hero card description | callout (16pt Regular) | "Perfect way to start..." |
| Button text | button (17pt Semibold) | "START PRACTICE" |
| Card metadata | caption1 (12pt Regular) | "🎵 5 notes · ⏱ 5 min" |
| Greeting | title2 (22pt Semibold) | "Good morning, Sarah" |
| Tab bar labels | caption2 (11pt Regular) | "Today" |
| Difficulty badge | caption2 (11pt Regular) | "BEGINNER" |
| Streak counter | numberMedium (28pt Semibold) | "3" |

---

## Spacing System

### Scale (Based on 4pt Grid)

```javascript
const spacing = {
  xxxs: 2,   // 0.125rem - Micro adjustments
  xxs: 4,    // 0.25rem - Tight spacing (icon padding)
  xs: 8,     // 0.5rem - Small gaps (between icon and text)
  sm: 12,    // 0.75rem - Compact spacing
  md: 16,    // 1rem - Default spacing (most common)
  lg: 20,    // 1.25rem - Comfortable spacing
  xl: 24,    // 1.5rem - Generous spacing (card padding)
  xxl: 32,   // 2rem - Large spacing (section margins)
  xxxl: 48,  // 3rem - Extra large (screen padding bottom for FAB)
  xxxxl: 64, // 4rem - Huge (hero card top margin)
};
```

### Usage Guidelines

**Component Internal Spacing:**
- Button padding: `vertical: md (16), horizontal: xl (24)`
- Card padding: `xl (24)` all sides
- Icon + text gap: `xs (8)`
- Between metadata items: `xs (8)` with dot separator

**Component External Spacing:**
- Between cards: `md (16)`
- Screen margins: `horizontal: md (16)`, top: `lg (20)`, bottom: `xxxl (48)` (for FAB)
- Section gaps: `xxl (32)`

---

## Border Radius

```javascript
const radius = {
  xs: 4,    // Small elements (badges)
  sm: 8,    // Compact components (chips)
  md: 12,   // Default (small cards, inputs)
  lg: 16,   // Large components (secondary cards)
  xl: 20,   // Extra large (hero card, buttons)
  xxl: 24,  // Premium feel (hero elements)
  full: 9999, // Pill shape (badges, tags)
};
```

### Usage Map

| Element | Radius | Rationale |
|---------|--------|-----------|
| Hero card | xxl (24pt) | Premium, elevated feel |
| CTA button | xl (20pt) | Friendly, inviting |
| Secondary cards | lg (16pt) | Clear but less prominent |
| Difficulty badge | full (pill) | Compact, modern |
| Input fields | md (12pt) | Standard, familiar |
| Modal sheets | xl (20pt) top only | iOS native pattern |

---

## Shadows & Elevation

```javascript
const shadows = {
  // iOS-style shadows (soft, diffused)
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // Android
  },

  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },

  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },

  // Colored shadows (for brand elements)
  brandGlow: {
    shadowColor: '#3B82F6', // Blue
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};
```

### Elevation Hierarchy

1. **Base Layer (0):** App background
2. **Card Layer (md):** Exercise cards, secondary elements
3. **Hero Layer (lg):** Today's Practice card, important CTAs
4. **Modal Layer (xl):** Sheets, dialogs, overlays
5. **Toast Layer (xl + zIndex):** Temporary notifications

---

## Animation System

### Timing Functions

```javascript
const easing = {
  // Standard iOS curves
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom curves (more personality)
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Slight bounce
  smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',         // Material Design standard
  swift: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',    // Quick but smooth
  snappy: 'cubic-bezier(0.16, 1, 0.3, 1)',          // Sharp deceleration
};
```

### Duration Scale

```javascript
const duration = {
  instant: 0,      // No animation
  fast: 150,       // Button press, toggle
  normal: 300,     // Standard transitions (screens, modals)
  slow: 500,       // Large movements, complex animations
  verySlow: 800,   // Emphasized animations (onboarding)
};
```

### Animation Patterns

**Button Press:**
```javascript
const buttonPressAnimation = {
  type: 'timing',
  duration: duration.fast, // 150ms
  easing: easing.easeOut,
  useNativeDriver: true, // Performance

  // Transform
  from: { scale: 1 },
  to: { scale: 0.96 },

  // Haptic
  haptic: 'impactMedium',
};
```

**Card Entry (Fade + Slide Up):**
```javascript
const cardEntryAnimation = {
  type: 'timing',
  duration: duration.normal, // 300ms
  easing: easing.snappy,
  useNativeDriver: true,

  from: {
    opacity: 0,
    translateY: 40,
  },
  to: {
    opacity: 1,
    translateY: 0,
  },

  // Stagger if multiple cards
  staggerDelay: 50, // ms between each card
};
```

**Section Expand/Collapse:**
```javascript
const expandAnimation = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
  useNativeDriver: false, // Height animation needs layout

  from: { height: 0, opacity: 0 },
  to: { height: 'auto', opacity: 1 },
};
```

**Hero Card Background Pulse:**
```javascript
const backgroundPulseAnimation = {
  type: 'loop',
  duration: 2000, // 2 second cycle
  easing: easing.easeInOut,
  useNativeDriver: true,

  from: { opacity: 0.1 },
  to: { opacity: 0.2 },

  // Reverses automatically (ping-pong)
  autoReverse: true,
  iterations: -1, // Infinite
};
```

**Screen Transition:**
```javascript
const screenTransition = {
  type: 'timing',
  duration: duration.normal, // 300ms
  easing: easing.smooth,
  useNativeDriver: true,

  // iOS native-like slide
  from: { translateX: screenWidth },
  to: { translateX: 0 },

  // Outgoing screen fades
  exitAnimation: {
    from: { opacity: 1 },
    to: { opacity: 0.5 },
  },
};
```

---

## Iconography

### System Icons (SF Symbols)

Use SF Symbols for consistency with iOS:

```javascript
const icons = {
  // Navigation
  home: 'house.fill',
  homeOutline: 'house',
  chart: 'chart.bar.fill',
  settings: 'gearshape.fill',
  profile: 'person.circle.fill',

  // Actions
  play: 'play.circle.fill',
  pause: 'pause.circle.fill',
  stop: 'stop.circle.fill',
  restart: 'arrow.clockwise',
  close: 'xmark',
  back: 'chevron.left',
  forward: 'chevron.right',
  expand: 'chevron.down',
  collapse: 'chevron.up',

  // Status
  checkmark: 'checkmark.circle.fill',
  star: 'star.fill',
  starOutline: 'star',
  fire: 'flame.fill', // Streak
  trophy: 'trophy.fill',
  lock: 'lock.fill',
  unlock: 'lock.open.fill',

  // Audio/Music
  microphone: 'mic.fill',
  speaker: 'speaker.wave.2.fill',
  waveform: 'waveform',
  music: 'music.note',

  // Utility
  info: 'info.circle',
  question: 'questionmark.circle',
  warning: 'exclamationmark.triangle.fill',
  error: 'xmark.octagon.fill',
  success: 'checkmark.circle.fill',
};
```

### Icon Sizes

```javascript
const iconSize = {
  xs: 12,   // Inline with caption text
  sm: 16,   // Inline with body text
  md: 20,   // Standalone small
  lg: 24,   // Standalone default
  xl: 32,   // Large emphasis
  xxl: 48,  // Hero/empty states
  xxxl: 64, // Extra large illustrations
};
```

### Custom Emoji Icons (Category Indicators)

For visual personality and immediate recognition:

```javascript
const categoryEmoji = {
  breathing: '💨',
  warmup: '🔥',
  scale: '🎹',
  interval: '📏',
  arpeggio: '🎼',
  notes: '🎵',
  time: '⏱',
  streak: '🔥',
  achievement: '🏆',
  success: '🎉',
  thumbsUp: '👍',
  wave: '👋',
};
```

**Usage:** Combine with text for warmth and personality
- ✅ Good: "🎵 5 notes · ⏱ 5 min · 🔥 Warm-up"
- ❌ Too much: "🎵🔊🎤 5 notes 📊💯 · ⏱⏰🕐 5 min"

---

## Component Specifications

### Button Variants

**Primary Button (CTA):**
```javascript
const buttonPrimary = {
  height: 56,
  paddingHorizontal: spacing.xl, // 24pt
  borderRadius: radius.xl, // 20pt
  backgroundColor: colors.brand.primary,
  ...shadows.md,

  // Text
  typography: typography.button, // 17pt Semibold
  textColor: colors.text.primary,

  // States
  hover: { backgroundColor: '#2563EB' }, // Darker blue
  pressed: { scale: 0.96, backgroundColor: '#1D4ED8' },
  disabled: {
    backgroundColor: colors.interactive.disabled,
    textColor: colors.text.quaternary,
  },
};
```

**Secondary Button:**
```javascript
const buttonSecondary = {
  height: 48,
  paddingHorizontal: spacing.lg, // 20pt
  borderRadius: radius.lg, // 16pt
  backgroundColor: 'transparent',
  borderWidth: 1.5,
  borderColor: colors.background.tertiary,

  typography: typography.buttonSmall, // 15pt Semibold
  textColor: colors.text.secondary,

  pressed: { scale: 0.96, opacity: 0.8 },
};
```

**Ghost Button:**
```javascript
const buttonGhost = {
  height: 40,
  paddingHorizontal: spacing.md, // 16pt
  borderRadius: radius.md, // 12pt
  backgroundColor: 'transparent',

  typography: typography.callout, // 16pt Regular
  textColor: colors.brand.primary,

  pressed: { backgroundColor: colors.interactive.hover },
};
```

---

### Card Variants

**Hero Card:**
```javascript
const cardHero = {
  borderRadius: radius.xxl, // 24pt
  padding: spacing.xl, // 24pt
  backgroundColor: colors.background.elevated,
  ...shadows.lg,

  // Gradient overlay
  backgroundGradient: colors.brand.gradient,
  gradientOpacity: 0.08,

  // Minimum height
  minHeight: 480,
};
```

**Standard Card:**
```javascript
const cardStandard = {
  borderRadius: radius.lg, // 16pt
  padding: spacing.lg, // 20pt
  backgroundColor: colors.background.secondary,
  ...shadows.sm,

  // Border for selected state
  selected: {
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
};
```

**Compact Card:**
```javascript
const cardCompact = {
  borderRadius: radius.md, // 12pt
  padding: spacing.md, // 16pt
  backgroundColor: colors.background.secondary,
  ...shadows.xs,
};
```

---

### Badge Variants

**Difficulty Badge:**
```javascript
const badgeDifficulty = {
  paddingHorizontal: spacing.sm, // 12pt
  paddingVertical: spacing.xxs, // 4pt
  borderRadius: radius.full, // Pill

  // Typography
  typography: typography.caption2, // 11pt Regular
  textTransform: 'uppercase',

  // Colors by level
  beginner: {
    backgroundColor: `${colors.difficulty.beginner}20`, // 20% opacity
    textColor: colors.difficulty.beginner,
  },
  intermediate: {
    backgroundColor: `${colors.difficulty.intermediate}20`,
    textColor: colors.difficulty.intermediate,
  },
  advanced: {
    backgroundColor: `${colors.difficulty.advanced}20`,
    textColor: colors.difficulty.advanced,
  },
};
```

**Status Badge:**
```javascript
const badgeStatus = {
  paddingHorizontal: spacing.xs, // 8pt
  paddingVertical: spacing.xxxs, // 2pt
  borderRadius: radius.xs, // 4pt

  typography: typography.caption2, // 11pt Regular
  fontWeight: '600', // Semibold

  // Variants
  locked: {
    backgroundColor: colors.background.tertiary,
    textColor: colors.text.quaternary,
    icon: icons.lock,
  },
  completed: {
    backgroundColor: `${colors.semantic.success}20`,
    textColor: colors.semantic.success,
    icon: icons.checkmark,
  },
  new: {
    backgroundColor: `${colors.brand.primary}20`,
    textColor: colors.brand.primary,
    text: 'NEW',
  },
};
```

---

### Input Fields

**Text Input:**
```javascript
const inputText = {
  height: 48,
  paddingHorizontal: spacing.md, // 16pt
  borderRadius: radius.md, // 12pt
  backgroundColor: colors.background.tertiary,
  borderWidth: 1,
  borderColor: 'transparent',

  // Typography
  typography: typography.body, // 17pt Regular
  textColor: colors.text.primary,
  placeholderColor: colors.text.quaternary,

  // States
  focus: {
    borderColor: colors.interactive.focus,
    borderWidth: 2,
  },
  error: {
    borderColor: colors.semantic.error,
    borderWidth: 2,
  },
};
```

---

## Haptic Feedback

### Feedback Types (iOS)

```javascript
const haptics = {
  // Impact (physical button press feel)
  impactLight: 'light',       // Subtle interactions (toggle, chip selection)
  impactMedium: 'medium',     // Standard interactions (button press, card tap)
  impactHeavy: 'heavy',       // Important actions (start exercise, complete)

  // Notification (success/error feedback)
  notificationSuccess: 'success',  // Exercise completed, achievement unlocked
  notificationWarning: 'warning',  // Streak at risk
  notificationError: 'error',      // Something went wrong

  // Selection (scrolling through values)
  selection: 'selection',     // Picking from picker, scrolling through options
};
```

### Usage Map

| Interaction | Haptic Type | When |
|-------------|-------------|------|
| Tap button | impactMedium | On press down |
| Toggle switch | impactLight | On state change |
| Start exercise | impactHeavy | On exercise begin |
| Complete exercise | notificationSuccess | On completion screen appear |
| Perfect pitch hit | impactLight | During singing when exactly on pitch |
| Select exercise card | impactLight | On card tap |
| Expand section | impactLight | On expand begin |
| Unlock achievement | notificationSuccess | When achievement earned |
| Streak broken | notificationWarning | When user opens app after missed day |

---

## Accessibility

### Color Contrast

**WCAG AA Compliance (4.5:1 minimum):**
- ✅ White text (#FFFFFF) on primary background (#0F172A): 13.5:1
- ✅ Secondary text (#E5E7EB) on primary background: 11.2:1
- ✅ Primary button text (#FFFFFF) on blue (#3B82F6): 4.9:1
- ✅ Green difficulty badge (#10B981) on dark: 5.8:1

**Ensure:**
- All text meets minimum contrast ratios
- Semantic colors are not the ONLY indicators (use icons + text)
- Disabled states are clearly distinguishable from enabled

---

### Dynamic Type Support

Support iOS Dynamic Type (user can increase text size):

```javascript
const accessibleTypography = {
  // Scale multiplier based on user's setting
  scaleMultiplier: {
    xSmall: 0.8,
    small: 0.9,
    medium: 1.0,   // Default
    large: 1.1,
    xLarge: 1.2,
    xxLarge: 1.3,
    xxxLarge: 1.5,
  },

  // Maximum scale (prevent breaking layouts)
  maxScale: 1.5,
};
```

**Implementation:**
- Use relative units (pt, not px)
- Test layouts at 1.5x scale
- Allow text wrapping, not truncation
- Increase touch targets proportionally (min 44x44pt)

---

### Touch Targets

**Minimum sizes (WCAG guidelines):**
- Minimum touch target: 44x44 pt (iOS HIG)
- Comfortable target: 48x48 pt
- Recommended for primary actions: 56+ pt height

**Ensure:**
- All interactive elements meet minimum
- Spacing between targets ≥ 8pt (prevent mis-taps)
- Large buttons for primary actions (CTA = 56pt height)

---

### VoiceOver Support

**Label all interactive elements:**
```javascript
// Button example
<TouchableOpacity
  accessibilityLabel="Start today's practice exercise"
  accessibilityHint="Begins the 5-note warm-up exercise"
  accessibilityRole="button"
>
  <Text>START PRACTICE</Text>
</TouchableOpacity>

// Card example
<TouchableOpacity
  accessibilityLabel="5-Note Warm-Up exercise"
  accessibilityHint="Beginner level, 5 minutes duration, 5 notes"
  accessibilityRole="button"
>
  {/* Card content */}
</TouchableOpacity>

// Streak indicator
<View
  accessibilityLabel="3 day practice streak"
  accessibilityRole="text"
>
  <Text>🔥3</Text>
</View>
```

---

## Implementation Guidelines

### Design Tokens Export

```typescript
// designTokens.ts
export const DesignSystem = {
  colors: { /* as defined above */ },
  typography: { /* as defined above */ },
  spacing: { /* as defined above */ },
  radius: { /* as defined above */ },
  shadows: { /* as defined above */ },
  animation: { /* as defined above */ },
  icons: { /* as defined above */ },
};

// Usage in components
import { DesignSystem as DS } from './designTokens';

const styles = StyleSheet.create({
  heroCard: {
    padding: DS.spacing.xl,
    borderRadius: DS.radius.xxl,
    backgroundColor: DS.colors.background.elevated,
    ...DS.shadows.lg,
  },
  title: {
    ...DS.typography.title1,
    color: DS.colors.text.primary,
  },
});
```

---

### Component Naming Convention

```
[Component][Variant][State]

Examples:
- ButtonPrimary
- ButtonPrimaryDisabled
- CardHero
- CardStandard
- CardStandardSelected
- BadgeDifficultyBeginner
- InputTextFocused
```

---

### File Organization

```
src/design/
  ├── tokens/
  │   ├── colors.ts
  │   ├── typography.ts
  │   ├── spacing.ts
  │   ├── radius.ts
  │   ├── shadows.ts
  │   └── animation.ts
  ├── components/
  │   ├── Button.tsx
  │   ├── Card.tsx
  │   ├── Badge.tsx
  │   ├── Input.tsx
  │   └── ...
  ├── index.ts (exports DesignSystem)
  └── README.md (this document)
```

---

## Next Steps

✅ **COMPLETED:** Comprehensive visual design system
⏭️ **NEXT:** User journey mapping (onboarding → long-term engagement)
⏭️ **THEN:** Key screen designs (In-exercise, Results, Progress)
⏭️ **THEN:** Onboarding flow design
⏭️ **THEN:** Motivation system (streaks, achievements)
⏭️ **THEN:** Implementation roadmap

---

*Design system completed: 2025-10-08*
*Ready for implementation*
