/**
 * Celebration Confetti Component
 * Triggers confetti burst + haptic feedback for exercise completion
 * Based on UX research: use sparingly for genuine achievements only
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

interface CelebrationConfettiProps {
  trigger: boolean;              // When true, fires confetti
  accuracy: number;              // 0-100, determines celebration intensity
  onComplete?: () => void;       // Callback when animation finishes
}

const { width, height } = Dimensions.get('window');

export const CelebrationConfetti: React.FC<CelebrationConfettiProps> = ({
  trigger,
  accuracy,
  onComplete,
}) => {
  const confettiRef = useRef<ConfettiCannon | null>(null);

  useEffect(() => {
    if (trigger && confettiRef.current) {
      // Determine celebration intensity based on accuracy
      const intensity = getCelebrationIntensity(accuracy);

      // Fire haptic feedback BEFORE confetti for better feel
      triggerHapticFeedback(intensity);

      // Fire confetti with slight delay for better timing
      setTimeout(() => {
        confettiRef.current?.start();
      }, 50);

      // Callback when done
      if (onComplete) {
        setTimeout(onComplete, 3000); // Confetti lasts ~3 seconds
      }
    }
  }, [trigger, accuracy, onComplete]);

  const intensity = getCelebrationIntensity(accuracy);

  return (
    <View style={styles.container} pointerEvents="none">
      <ConfettiCannon
        ref={confettiRef}
        count={intensity.confettiCount}
        origin={{ x: width / 2, y: -10 }}
        fadeOut={true}
        fallSpeed={intensity.fallSpeed}
        colors={intensity.colors}
        explosionSpeed={intensity.explosionSpeed}
        autoStart={false}
      />
    </View>
  );
};

/**
 * Determine celebration intensity based on accuracy score
 * Higher accuracy = more dramatic celebration
 */
function getCelebrationIntensity(accuracy: number) {
  if (accuracy >= 95) {
    // PERFECT! - Maximum celebration
    return {
      confettiCount: 200,
      fallSpeed: 3000,
      explosionSpeed: 500,
      colors: ['#FFD60A', '#FF9F0A', '#00D9FF', '#32D74B', '#BF5AF2'], // Gold, orange, cyan, green, purple
    };
  } else if (accuracy >= 85) {
    // AMAZING! - Big celebration
    return {
      confettiCount: 150,
      fallSpeed: 2500,
      explosionSpeed: 400,
      colors: ['#00D9FF', '#32D74B', '#FFD60A', '#64D2FF'], // Cyan, green, gold, light blue
    };
  } else if (accuracy >= 75) {
    // GREAT! - Moderate celebration
    return {
      confettiCount: 100,
      fallSpeed: 2000,
      explosionSpeed: 300,
      colors: ['#32D74B', '#00D9FF', '#64D2FF'], // Green, cyan, light blue
    };
  } else if (accuracy >= 65) {
    // GOOD! - Light celebration
    return {
      confettiCount: 60,
      fallSpeed: 1500,
      explosionSpeed: 250,
      colors: ['#00D9FF', '#32D74B'], // Cyan, green
    };
  } else {
    // KEEP GOING! - Gentle encouragement (minimal confetti)
    return {
      confettiCount: 30,
      fallSpeed: 1200,
      explosionSpeed: 200,
      colors: ['#00D9FF', '#64D2FF'], // Just cyan tones
    };
  }
}

/**
 * Trigger haptic feedback based on celebration intensity
 * Creates physical sensation of achievement
 */
async function triggerHapticFeedback(intensity: ReturnType<typeof getCelebrationIntensity>) {
  try {
    if (intensity.confettiCount >= 150) {
      // Perfect score - heavy impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    } else if (intensity.confettiCount >= 100) {
      // Great score - medium impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
    } else if (intensity.confettiCount >= 60) {
      // Good score - light impact
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Gentle encouragement - selection feedback
      await Haptics.selectionAsync();
    }
  } catch (error) {
    // Haptics might not be available on all devices
    console.log('Haptics not available:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // Above everything
  },
});
