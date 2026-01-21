/**
 * PitchIndicator Component
 *
 * A reusable pitch indicator that shows the current detected pitch position
 * on a vertical scale. Uses Reanimated for smooth 60fps animations.
 *
 * Extracted from NativePitchScreen to enable:
 * - Reuse across different practice screens
 * - Isolated testing
 * - Reduced file size of parent component
 */

import React, { memo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants
const MIN_MIDI = 36; // C2
const MAX_MIDI = 84; // C6
const TOTAL_NOTES = MAX_MIDI - MIN_MIDI + 1;
const TRACKER_HEIGHT = SCREEN_HEIGHT - 100;
const NOTE_HEIGHT = TRACKER_HEIGHT / TOTAL_NOTES;

// Spring config for smooth animations
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
};

interface PitchIndicatorProps {
  frequency: number;
  confidence: number;
  accentColor?: string;
  style?: object;
}

/**
 * Convert frequency to MIDI note number
 */
function frequencyToMidi(frequency: number): number {
  if (frequency <= 0) return 0;
  return 12 * Math.log2(frequency / 440) + 69;
}

/**
 * Calculate Y position on the tracker for a given frequency
 */
function frequencyToY(frequency: number): number {
  const midi = frequencyToMidi(frequency);
  const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
  const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
  return normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;
}

/**
 * PitchIndicator shows the user's current pitch position
 */
export const PitchIndicator: React.FC<PitchIndicatorProps> = memo(
  ({ frequency, confidence, accentColor = '#10B981', style }) => {
    const animatedY = useSharedValue(-100);
    const animatedOpacity = useSharedValue(0);

    // Update position when frequency changes
    React.useEffect(() => {
      if (confidence > 0.3 && frequency > 0) {
        const y = frequencyToY(frequency);
        animatedY.value = withSpring(y - 12, SPRING_CONFIG);
        animatedOpacity.value = withSpring(1, SPRING_CONFIG);
      } else {
        animatedOpacity.value = withSpring(0, SPRING_CONFIG);
      }
    }, [frequency, confidence, animatedY, animatedOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: animatedY.value }],
      opacity: animatedOpacity.value,
    }));

    return (
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: accentColor },
          animatedStyle,
          style,
        ]}
      />
    );
  }
);

PitchIndicator.displayName = 'PitchIndicator';

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    left: 45,
    right: 10,
    height: 24,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});

export default PitchIndicator;
