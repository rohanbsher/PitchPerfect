/**
 * TargetIndicator Component
 *
 * Shows the target note that the user should match.
 * Animates smoothly when the target changes.
 */

import React, { memo, useEffect } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
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

// Spring config
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};

interface TargetIndicatorProps {
  targetNote: {
    note: string;
    midi: number;
    frequency: number;
  } | null;
  targetColor?: string;
  style?: object;
}

/**
 * TargetIndicator shows where the user should sing
 */
export const TargetIndicator: React.FC<TargetIndicatorProps> = memo(
  ({ targetNote, targetColor = '#8B5CF6', style }) => {
    const animatedY = useSharedValue(-100);
    const animatedOpacity = useSharedValue(0);

    useEffect(() => {
      if (targetNote) {
        const midi = targetNote.midi;
        const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
        const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
        const y = normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;

        animatedY.value = withSpring(y - 12, SPRING_CONFIG);
        animatedOpacity.value = withSpring(0.8, SPRING_CONFIG);
      } else {
        animatedY.value = withSpring(-100, SPRING_CONFIG);
        animatedOpacity.value = withSpring(0, SPRING_CONFIG);
      }
    }, [targetNote, animatedY, animatedOpacity]);

    const containerStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: animatedY.value }],
      opacity: animatedOpacity.value,
    }));

    if (!targetNote) return null;

    return (
      <Animated.View
        style={[styles.container, { borderColor: targetColor }, containerStyle, style]}
      >
        <Text style={[styles.noteText, { color: targetColor }]}>
          {targetNote.note}
        </Text>
      </Animated.View>
    );
  }
);

TargetIndicator.displayName = 'TargetIndicator';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 45,
    right: 10,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 12,
  },
  noteText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default TargetIndicator;
