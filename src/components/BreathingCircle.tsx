/**
 * BreathingCircle Component
 * Animated circle that expands/contracts with breathing phases
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

interface BreathingCircleProps {
  phase: 'inhale' | 'hold' | 'exhale';
  beatsRemaining: number;
  totalBeats: number;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  phase,
  beatsRemaining,
  totalBeats,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current; // 1 = small, 2.5 = large
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'inhale') {
      // Expand from small to large
      Animated.timing(scaleAnim, {
        toValue: 2.5,
        duration: totalBeats * 1000,
        useNativeDriver: true,
      }).start();
    } else if (phase === 'hold') {
      // Stay at large size, pulse slightly
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (phase === 'exhale') {
      // Contract from large to small
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: totalBeats * 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [phase, totalBeats]);

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return '#00D9FF'; // Cyan
      case 'hold':
        return '#BF5AF2'; // Purple
      case 'exhale':
        return '#FFD60A'; // Gold
      default:
        return '#00D9FF';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'BREATHE IN';
      case 'hold':
        return 'HOLD';
      case 'exhale':
        return 'BREATHE OUT';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: getPhaseColor(),
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.phaseText}>{getPhaseText()}</Text>
        <Text style={styles.countdownText}>{beatsRemaining}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phaseText: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownText: {
    color: '#121212',
    fontSize: 28,
    fontWeight: '700',
  },
});
