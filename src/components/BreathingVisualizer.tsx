/**
 * Breathing Visualizer Component
 * Animated circle that expands/contracts with breathing rhythm
 *
 * Visual feedback for breathing exercises:
 * - INHALE: Circle expands (blue gradient)
 * - HOLD: Circle pulses (purple gradient)
 * - EXHALE: Circle contracts (green gradient)
 * - TRANSITION: Gentle pulse (gray)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignSystem as DS } from '../design/DesignSystem';
import { BreathingPhase } from '../engines/BreathingEngine';

interface BreathingVisualizerProps {
  phase: BreathingPhase;
  timeRemaining: number;
  totalPhaseDuration: number;
  currentRound: number;
  totalRounds: number;
}

// Circle size constants
const MIN_SIZE = 80;
const MAX_SIZE = 260;

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  phase,
  timeRemaining,
  totalPhaseDuration,
  currentRound,
  totalRounds,
}) => {
  // Use transform scale to avoid native driver conflicts
  // Scale from 0.3 (small) to 1.0 (full size)
  const circleScale = useRef(new Animated.Value(MIN_SIZE / MAX_SIZE)).current;
  const circleOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Stop any existing pulse animation
    if (pulseAnim.current) {
      pulseAnim.current.stop();
      pulseAnim.current = null;
    }

    if (phase === 'inhale') {
      // INHALE: Expand circle smoothly
      circleOpacity.setValue(1);
      Animated.timing(circleScale, {
        toValue: 1.0, // Full size
        duration: totalPhaseDuration * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true, // Can use native driver for transform
      }).start();

    } else if (phase === 'exhale') {
      // EXHALE: Contract circle smoothly
      circleOpacity.setValue(1);
      Animated.timing(circleScale, {
        toValue: MIN_SIZE / MAX_SIZE, // Back to small size (0.31)
        duration: totalPhaseDuration * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true, // Can use native driver for transform
      }).start();

    } else if (phase === 'hold') {
      // HOLD: Subtle pulse (opacity only, no size change)
      circleScale.setValue(1.0); // Stay at max size
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(circleOpacity, {
            toValue: 0.7,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true, // Can use native driver for opacity
          }),
          Animated.timing(circleOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true, // Can use native driver for opacity
          }),
        ])
      );
      pulseAnim.current.start();

    } else if (phase === 'transition') {
      // TRANSITION: Quick pulse
      circleScale.setValue(MIN_SIZE / MAX_SIZE);
      pulseAnim.current = Animated.sequence([
        Animated.timing(circleOpacity, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true, // Can use native driver for opacity
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true, // Can use native driver for opacity
        }),
      ]);
      pulseAnim.current.start();
    }

    return () => {
      if (pulseAnim.current) {
        pulseAnim.current.stop();
      }
    };
  }, [phase, totalPhaseDuration]);

  // Get colors based on phase
  const getPhaseColors = (): [string, string] => {
    switch (phase) {
      case 'inhale':
        return ['#3B82F6', '#60A5FA']; // Blue gradient
      case 'hold':
        return ['#8B5CF6', '#A78BFA']; // Purple gradient
      case 'exhale':
        return ['#10B981', '#34D399']; // Green gradient
      case 'transition':
        return ['#6B7280', '#9CA3AF']; // Gray gradient
      default:
        return ['#6B7280', '#9CA3AF'];
    }
  };

  // Get phase text
  const getPhaseText = (): string => {
    switch (phase) {
      case 'inhale':
        return 'INHALE';
      case 'hold':
        return 'HOLD';
      case 'exhale':
        return 'EXHALE';
      case 'transition':
        return 'READY...';
      default:
        return '';
    }
  };

  const colors = getPhaseColors();

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.roundText}>
          Round {currentRound + 1} of {totalRounds}
        </Text>
      </View>

      {/* Breathing instruction - show on first round */}
      {currentRound === 0 && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionEmoji}>👇</Text>
          <Text style={styles.instructionText}>
            Breathe into your lower belly
          </Text>
          <Text style={styles.instructionSubtext}>
            (Place hand on diaphragm)
          </Text>
        </View>
      )}

      {/* Animated breathing circle */}
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: MAX_SIZE,
              height: MAX_SIZE,
              opacity: circleOpacity,
              transform: [{ scale: circleScale }],
            },
          ]}
        >
          <LinearGradient
            colors={colors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>

      {/* Phase text and countdown */}
      <View style={styles.textContainer}>
        <Text style={styles.phaseText}>{getPhaseText()}</Text>
        {timeRemaining > 0 && phase !== 'transition' && (
          <Text style={styles.countdownText}>{timeRemaining}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.colors.background.primary,
  },

  progressContainer: {
    position: 'absolute',
    top: DS.spacing.xl,
    alignSelf: 'center',
  },
  roundText: {
    ...DS.typography.callout,
    color: DS.colors.text.secondary,
    fontWeight: '600',
  },

  instructionContainer: {
    position: 'absolute',
    top: DS.spacing.xxxl * 2,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: DS.colors.background.secondary,
    paddingHorizontal: DS.spacing.xl,
    paddingVertical: DS.spacing.lg,
    borderRadius: DS.radius.xl,
    borderWidth: 2,
    borderColor: DS.colors.accent.primary,
  },
  instructionEmoji: {
    fontSize: 32,
    marginBottom: DS.spacing.xs,
  },
  instructionText: {
    ...DS.typography.callout,
    color: DS.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionSubtext: {
    ...DS.typography.caption1,
    color: DS.colors.text.tertiary,
    marginTop: DS.spacing.xxs,
    textAlign: 'center',
  },

  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DS.spacing.xxxl,
  },
  circle: {
    borderRadius: 999, // Perfect circle
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  textContainer: {
    alignItems: 'center',
    marginTop: DS.spacing.xl,
  },
  phaseText: {
    fontSize: 32,
    fontWeight: '700',
    color: DS.colors.text.primary,
    letterSpacing: 2,
    marginBottom: DS.spacing.sm,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: '800',
    color: DS.colors.text.primary,
    lineHeight: 80,
  },
});
