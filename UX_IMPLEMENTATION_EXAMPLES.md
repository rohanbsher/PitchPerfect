# UX IMPLEMENTATION EXAMPLES
## Code Snippets for Quick Wins

This document provides ready-to-implement code examples for the highest-impact UX improvements.

---

## 1. COLOR WARMTH ADJUSTMENT

### Option A: Simple Background Change (Recommended)

**File:** `/src/design/DesignSystem.ts`

```typescript
export const DesignSystem = {
  colors: {
    background: {
      // BEFORE
      // primary: '#0A0A0A',  // True black - too cold

      // AFTER
      primary: '#121212',     // Dark grey - warmer, more comfortable
      secondary: '#1C1C1E',   // Keep
      tertiary: '#2C2C2E',    // Keep
    },

    accent: {
      primary: '#00D9FF',     // Keep
      secondary: '#5E5CE6',   // Keep
      success: '#32D74B',     // Keep

      // NEW: Softer feedback colors
      warning: '#FFD60A',     // Gold instead of orange - encouraging
      error: '#FF9F0A',       // Orange instead of red - less harsh
      encouragement: '#FFD60A', // Gold for "almost!" feedback
    },
  },
};
```

### Option B: Gradient Overlay (Alternative)

**File:** `/src/screens/ExerciseScreenComplete.tsx`

```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Replace View container with LinearGradient
const ExerciseScreenComplete: React.FC = () => {
  return (
    <LinearGradient
      colors={[
        'rgba(30, 30, 35, 0.6)',  // Slight warm grey at top
        'rgba(10, 10, 10, 1)'      // True black at bottom
      ]}
      style={styles.container}
    >
      {/* Rest of component */}
    </LinearGradient>
  );
};
```

**Installation:**
```bash
npx expo install expo-linear-gradient
```

---

## 2. CELEBRATION ANIMATIONS

### Install Dependencies

```bash
npx expo install react-native-reanimated
npx expo install expo-haptics
npx expo install lottie-react-native
```

### Success Animation Component

**File:** `/src/components/CelebrationAnimation.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DesignSystem as DS } from '../design/DesignSystem';

interface CelebrationAnimationProps {
  score: number;
  onComplete?: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  score,
  onComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Trigger animation
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withSpring(1.0, { damping: 8, stiffness: 100 })
    );

    opacity.value = withTiming(1, { duration: 200 });

    // Trigger haptic based on score
    if (score >= 90) {
      // High score: double buzz
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 150);
    } else if (score >= 75) {
      // Good score: single buzz
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (score >= 60) {
      // Decent score: light buzz
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // No haptic for <60% (avoid punishment feel)

    if (onComplete) {
      setTimeout(onComplete, 1500);
    }
  }, [score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get celebration content based on score
  const getCelebrationContent = () => {
    if (score >= 95) {
      return {
        emoji: '🌟',
        title: 'PERFECT!',
        message: 'Flawless pitch control!',
        color: DS.colors.accent.warning, // Gold
      };
    } else if (score >= 90) {
      return {
        emoji: '🎉',
        title: 'AMAZING!',
        message: 'Excellent accuracy!',
        color: DS.colors.accent.warning,
      };
    } else if (score >= 75) {
      return {
        emoji: '⭐',
        title: 'GREAT JOB!',
        message: "You're improving!",
        color: DS.colors.accent.success,
      };
    } else if (score >= 60) {
      return {
        emoji: '👍',
        title: 'GOOD WORK!',
        message: 'Keep practicing!',
        color: DS.colors.accent.primary,
      };
    } else {
      return {
        emoji: '💪',
        title: 'KEEP GOING!',
        message: "You're building muscle memory!",
        color: DS.colors.accent.error,
      };
    }
  };

  const content = getCelebrationContent();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.emoji}>{content.emoji}</Text>
      <Text style={[styles.title, { color: content.color }]}>
        {content.title}
      </Text>
      <Text style={styles.message}>{content.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: DS.spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: DS.spacing.md,
  },
  title: {
    ...DS.typography.title1,
    fontWeight: '700',
    marginBottom: DS.spacing.sm,
  },
  message: {
    ...DS.typography.body,
    color: DS.colors.text.secondary,
    textAlign: 'center',
  },
});
```

### Confetti Animation (for 90%+ scores)

**File:** `/src/components/ConfettiAnimation.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CONFETTI_COUNT = 50;

interface ConfettiPiece {
  id: number;
  color: string;
  startX: number;
  delay: number;
}

export const ConfettiAnimation: React.FC = () => {
  const confettiPieces: ConfettiPiece[] = Array.from(
    { length: CONFETTI_COUNT },
    (_, i) => ({
      id: i,
      color: ['#FFD60A', '#FF9F0A', '#32D74B', '#00D9FF', '#5E5CE6'][i % 5],
      startX: Math.random() * width,
      delay: Math.random() * 1000,
    })
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<ConfettiPiece> = ({ color, startX, delay }) => {
  const translateY = useSharedValue(-50);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(height + 50, {
        duration: 2000,
        easing: Easing.out(Easing.quad),
      })
    );

    opacity.value = withDelay(
      delay + 1500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { backgroundColor: color, left: startX },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
```

### Usage in Results Screen

**File:** `/src/screens/ExerciseScreenComplete.tsx`

```typescript
import { CelebrationAnimation } from '../components/CelebrationAnimation';
import { ConfettiAnimation } from '../components/ConfettiAnimation';

// In results screen render:
{results && (
  <View style={styles.resultsContainer}>
    {/* Show confetti for high scores */}
    {results.overallAccuracy >= 90 && <ConfettiAnimation />}

    {/* Celebration animation */}
    <CelebrationAnimation score={results.overallAccuracy} />

    {/* Score display */}
    <Text style={styles.scoreText}>
      {results.overallAccuracy}%
    </Text>

    {/* Rest of results */}
  </View>
)}
```

---

## 3. ENCOURAGING MESSAGES

### Message Generator Function

**File:** `/src/utils/messageGenerator.ts`

```typescript
import { ExerciseResults } from '../data/models';

interface EncouragingMessage {
  title: string;
  message: string;
  nextAction: string;
  emoji: string;
}

export const generateEncouragingMessage = (
  results: ExerciseResults,
  trend?: 'up' | 'down' | 'stable'
): EncouragingMessage => {
  const accuracy = results.overallAccuracy;

  // Analyze weak spots
  const weakNotes = results.noteResults
    .filter(r => !r.passed)
    .map(r => r.noteExpected);

  const strongNotes = results.noteResults
    .filter(r => r.passed && r.averageAccuracy >= 90)
    .map(r => r.noteExpected);

  // Generate message based on score
  if (accuracy >= 95) {
    return {
      emoji: '🌟',
      title: 'OUTSTANDING!',
      message: `You're singing with flawless pitch control! ${strongNotes.length} perfect notes!`,
      nextAction: 'Try a harder exercise to keep challenging yourself.',
    };
  } else if (accuracy >= 90) {
    return {
      emoji: '🎉',
      title: 'AMAZING!',
      message: trend === 'up'
        ? `You're improving rapidly - up ${Math.abs(accuracy - 85)}% from last time!`
        : `Excellent pitch accuracy across the board!`,
      nextAction: strongNotes.length > 0
        ? `You nailed ${strongNotes.join(', ')}! Work on ${weakNotes.join(', ')} to hit 95%+.`
        : 'Keep this momentum going!',
    };
  } else if (accuracy >= 75) {
    return {
      emoji: '⭐',
      title: 'GREAT JOB!',
      message: trend === 'up'
        ? "You're getting better every time you practice!"
        : "You're maintaining solid pitch control!",
      nextAction: weakNotes.length > 0
        ? `Focus on ${weakNotes.join(', ')} - they need more breath support.`
        : 'Practice daily to reach 90%+ accuracy.',
    };
  } else if (accuracy >= 60) {
    return {
      emoji: '👍',
      title: 'GOOD WORK!',
      message: "You're building muscle memory for pitch control.",
      nextAction: weakNotes.length > 0
        ? `${weakNotes.join(', ')} are tough notes - try singing them slowly first.`
        : 'Practice this exercise daily to see faster improvement.',
    };
  } else {
    return {
      emoji: '💪',
      title: 'KEEP GOING!',
      message: 'This range is challenging - every attempt is progress!',
      nextAction: 'Try an easier exercise first (like "5-Note Warm-Up"), then come back to this one.',
    };
  }
};

export const getPerNoteInsight = (
  noteResults: ExerciseResults['noteResults']
): string => {
  const perfectNotes = noteResults.filter(r => r.averageAccuracy >= 95);
  const weakNotes = noteResults.filter(r => r.averageAccuracy < 70);

  if (perfectNotes.length > 0 && weakNotes.length > 0) {
    return `You nailed ${perfectNotes.map(n => n.noteExpected).join(', ')} (${perfectNotes[0].averageAccuracy}%!) but ${weakNotes.map(n => n.noteExpected).join(', ')} need work.`;
  } else if (perfectNotes.length > 0) {
    return `Perfect control on ${perfectNotes.map(n => n.noteExpected).join(', ')}! 🎯`;
  } else if (weakNotes.length > 0) {
    return `Focus on ${weakNotes.map(n => n.noteExpected).join(', ')} - they tend to drift flat. Try more breath support!`;
  } else {
    return 'Consistent accuracy across all notes - great control!';
  }
};
```

### Updated Results Screen

**File:** `/src/screens/ExerciseScreenComplete.tsx`

```typescript
import { generateEncouragingMessage, getPerNoteInsight } from '../utils/messageGenerator';

// In results screen:
{results && (
  <View style={styles.resultsCard}>
    {/* Celebration */}
    <CelebrationAnimation score={results.overallAccuracy} />

    {/* Score */}
    <Text style={styles.scoreText}>
      {results.overallAccuracy}%
    </Text>

    {/* Encouraging message */}
    <View style={styles.messageContainer}>
      <Text style={[styles.messageTitle, DS.typography.title2]}>
        {generateEncouragingMessage(results).message}
      </Text>

      {/* Per-note insight */}
      <Text style={[styles.insightText, DS.typography.body, { color: DS.colors.text.secondary }]}>
        {getPerNoteInsight(results.noteResults)}
      </Text>

      {/* Next action */}
      <View style={styles.nextActionCard}>
        <Text style={[styles.nextActionTitle, DS.typography.headline]}>
          🎯 What's Next?
        </Text>
        <Text style={[styles.nextActionText, DS.typography.callout]}>
          {generateEncouragingMessage(results).nextAction}
        </Text>
      </View>
    </View>

    {/* Rest of results */}
  </View>
)}
```

---

## 4. ONBOARDING FLOW

### Onboarding Screen Component

**File:** `/src/screens/OnboardingScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DesignSystem as DS } from '../design/DesignSystem';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      emoji: '🎵',
      title: 'Welcome to PitchPerfect!',
      description: 'Train your voice with real-time pitch feedback.',
      bullets: [
        'Professional pitch detection (used by vocal coaches)',
        'Automatic progression (hands-free practice)',
        'Track your improvement over time',
      ],
      buttonText: 'Continue',
    },
    {
      emoji: '🎤',
      title: "We'll listen to your singing",
      description: 'PitchPerfect uses advanced audio analysis to detect your pitch in real-time.',
      bullets: [
        'Your recordings stay 100% private on your device',
        'We never upload or share your voice',
        'You can delete recordings anytime',
      ],
      buttonText: 'Allow Microphone Access',
      requiresPermission: true,
    },
    {
      emoji: '🎯',
      title: "Let's hear your voice!",
      description: 'Sing any comfortable note and hold it. We'll detect your vocal range.',
      buttonText: 'Start Practicing',
      isCalibration: true,
    },
  ];

  const handleContinue = async () => {
    if (currentStep === steps.length - 1) {
      // Mark onboarding as complete
      await AsyncStorage.setItem('onboarding_completed', 'true');
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={[styles.title, DS.typography.largeTitle]}>
          {step.title}
        </Text>
        <Text style={[styles.description, DS.typography.body]}>
          {step.description}
        </Text>

        {step.bullets && (
          <View style={styles.bulletContainer}>
            {step.bullets.map((bullet, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletPoint}>✓</Text>
                <Text style={[styles.bulletText, DS.typography.callout]}>
                  {bullet}
                </Text>
              </View>
            ))}
          </View>
        )}

        {step.isCalibration && (
          <View style={styles.calibrationPlaceholder}>
            <Text style={[styles.calibrationText, DS.typography.caption1]}>
              [Microphone visualization would go here]
            </Text>
            <Text style={[styles.calibrationText, DS.typography.caption1]}>
              Detected: A3 (220 Hz)
            </Text>
            <Text style={[styles.calibrationText, DS.typography.caption1]}>
              Your range: G3 to C5 (tenor)
            </Text>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{step.buttonText}</Text>
        </TouchableOpacity>

        {currentStep < steps.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, DS.typography.callout]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background.primary,
    paddingHorizontal: DS.spacing.xl,
    paddingTop: 60,
    paddingBottom: DS.spacing.xxxl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: DS.spacing.sm,
    marginBottom: DS.spacing.xxxl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS.colors.background.tertiary,
  },
  progressDotActive: {
    backgroundColor: DS.colors.accent.primary,
    width: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: DS.spacing.xl,
  },
  title: {
    color: DS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DS.spacing.md,
  },
  description: {
    color: DS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DS.spacing.xxxl,
  },
  bulletContainer: {
    width: '100%',
    gap: DS.spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DS.spacing.md,
  },
  bulletPoint: {
    color: DS.colors.accent.success,
    fontSize: 18,
    fontWeight: '600',
  },
  bulletText: {
    flex: 1,
    color: DS.colors.text.secondary,
  },
  calibrationPlaceholder: {
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.xl,
    alignItems: 'center',
    gap: DS.spacing.sm,
  },
  calibrationText: {
    color: DS.colors.text.secondary,
  },
  buttonContainer: {
    gap: DS.spacing.md,
  },
  button: {
    backgroundColor: DS.colors.accent.primary,
    borderRadius: DS.radius.lg,
    paddingVertical: DS.spacing.lg,
    alignItems: 'center',
    ...DS.shadows.md,
  },
  buttonText: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: DS.spacing.md,
  },
  skipText: {
    color: DS.colors.text.tertiary,
  },
});
```

### Integration in App.tsx

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const completed = await AsyncStorage.getItem('onboarding_completed');
    setOnboardingComplete(completed === 'true');
    setIsLoading(false);
  };

  if (isLoading) {
    return null; // Or loading spinner
  }

  if (!onboardingComplete) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ExerciseScreenComplete />
    </SafeAreaProvider>
  );
}
```

---

## 5. STREAK TRACKING

### Streak Manager Utility

**File:** `/src/utils/streakManager.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRACTICE_DATES_KEY = 'practice_dates';
const STREAK_FREEZE_KEY = 'streak_freeze_available';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalPractices: number;
  lastPracticeDate: string;
  practiceDates: string[];
}

export class StreakManager {
  static async recordPractice(): Promise<StreakData> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const data = await this.getStreakData();

    // Don't record if already practiced today
    if (data.lastPracticeDate === today) {
      return data;
    }

    // Add today to practice dates
    data.practiceDates.push(today);
    data.lastPracticeDate = today;
    data.totalPractices += 1;

    // Calculate streak
    data.currentStreak = this.calculateStreak(data.practiceDates);
    data.longestStreak = Math.max(data.longestStreak, data.currentStreak);

    await this.saveStreakData(data);
    return data;
  }

  static async getStreakData(): Promise<StreakData> {
    const stored = await AsyncStorage.getItem(PRACTICE_DATES_KEY);
    if (!stored) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalPractices: 0,
        lastPracticeDate: '',
        practiceDates: [],
      };
    }
    return JSON.parse(stored);
  }

  private static async saveStreakData(data: StreakData): Promise<void> {
    await AsyncStorage.setItem(PRACTICE_DATES_KEY, JSON.stringify(data));
  }

  private static calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;

    // Sort dates descending
    const sorted = [...dates].sort().reverse();
    let streak = 1;
    let currentDate = new Date(sorted[0]);

    for (let i = 1; i < sorted.length; i++) {
      const prevDate = new Date(sorted[i]);
      const daysDiff = this.daysBetween(prevDate, currentDate);

      if (daysDiff === 1) {
        streak++;
        currentDate = prevDate;
      } else if (daysDiff > 1) {
        break; // Streak broken
      }
      // If daysDiff === 0, same day (skip)
    }

    return streak;
  }

  private static daysBetween(date1: Date, date2: Date): number {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  static async hasStreakFreeze(): Promise<boolean> {
    const freeze = await AsyncStorage.getItem(STREAK_FREEZE_KEY);
    return freeze === 'true';
  }

  static async useStreakFreeze(): Promise<void> {
    await AsyncStorage.setItem(STREAK_FREEZE_KEY, 'false');
  }

  static async grantStreakFreeze(): Promise<void> {
    await AsyncStorage.setItem(STREAK_FREEZE_KEY, 'true');
  }
}
```

### Streak Display Component

**File:** `/src/components/StreakDisplay.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StreakManager } from '../utils/streakManager';
import { DesignSystem as DS } from '../design/DesignSystem';

export const StreakDisplay: React.FC = () => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const data = await StreakManager.getStreakData();
    setStreakData(data);
  };

  if (streakData.currentStreak === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.flame}>🔥</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.streakNumber, DS.typography.title1]}>
          {streakData.currentStreak}
        </Text>
        <Text style={[styles.streakLabel, DS.typography.caption1]}>
          Day Streak
        </Text>
      </View>
      {streakData.longestStreak > streakData.currentStreak && (
        <Text style={[styles.bestStreak, DS.typography.caption2]}>
          Best: {streakData.longestStreak}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
    gap: DS.spacing.md,
  },
  flame: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  streakNumber: {
    color: DS.colors.accent.warning,
    fontWeight: '700',
  },
  streakLabel: {
    color: DS.colors.text.secondary,
    textTransform: 'uppercase',
  },
  bestStreak: {
    color: DS.colors.text.tertiary,
  },
});
```

### Usage in Home Screen

```typescript
import { StreakDisplay } from '../components/StreakDisplay';
import { StreakManager } from '../utils/streakManager';

// In home screen:
<View style={styles.header}>
  <Text style={styles.title}>Vocal Training</Text>
  <StreakDisplay />
</View>

// After completing exercise:
const handleExerciseComplete = async () => {
  const streakData = await StreakManager.recordPractice();

  // Check for milestone
  if ([7, 14, 30, 60, 100].includes(streakData.currentStreak)) {
    // Show achievement unlock animation
    showAchievement(`${streakData.currentStreak}-Day Streak!`);
  }
};
```

---

## TESTING CHECKLIST

### Color Warmth
- [ ] App feels less clinical, more approachable
- [ ] Background still looks good on OLED screens
- [ ] Text contrast still meets WCAG AA (4.5:1 minimum)

### Celebrations
- [ ] User smiles when getting high score
- [ ] Haptic feedback feels rewarding, not annoying
- [ ] Confetti appears for 90%+ scores
- [ ] Different messages for different score ranges

### Encouraging Messages
- [ ] Low scores don't feel discouraging
- [ ] Messages provide actionable next steps
- [ ] Users understand what to improve

### Onboarding
- [ ] New users understand what app does
- [ ] Microphone permission feels justified
- [ ] Calibration builds trust in pitch detection
- [ ] Users can skip if they want

### Streaks
- [ ] Streak counter shows after first practice
- [ ] Consecutive days calculate correctly
- [ ] Users feel motivated to maintain streak

---

## NEXT STEPS

1. Implement color warmth (2 hours)
2. Add celebration animations (6 hours)
3. Integrate encouraging messages (4 hours)
4. Add haptic feedback (2 hours)
5. Build onboarding flow (16 hours)
6. Implement streak tracking (8 hours)

**Total: ~38 hours for complete Phase 1**

Test each feature with 5-10 users before moving to next one. Iterate based on feedback.

Remember: The goal is to make users FEEL great, not just inform them. Every change should pass the "smile test" - if users don't smile or feel proud, keep iterating.
