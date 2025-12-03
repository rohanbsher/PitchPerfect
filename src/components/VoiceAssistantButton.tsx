/**
 * Voice Assistant Button Component
 *
 * Floating microphone button that activates the voice assistant.
 * Shows visual feedback for different states (idle, listening, processing, speaking).
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { VoiceAssistantState } from '../services/voiceAssistant';

interface VoiceAssistantButtonProps {
  state: VoiceAssistantState;
  onPress: () => void;
  disabled?: boolean;
}

export function VoiceAssistantButton({
  state,
  onPress,
  disabled = false,
}: VoiceAssistantButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation when listening
  useEffect(() => {
    if (state === 'listening') {
      // Start pulsing
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [state]);

  // Get colors based on state
  const getColors = () => {
    switch (state) {
      case 'listening':
        return {
          bg: '#10B981', // Green when listening
          glow: 'rgba(16, 185, 129, 0.4)',
        };
      case 'processing':
        return {
          bg: '#8B5CF6', // Purple when processing
          glow: 'rgba(139, 92, 246, 0.4)',
        };
      case 'speaking':
        return {
          bg: '#3B82F6', // Blue when speaking
          glow: 'rgba(59, 130, 246, 0.4)',
        };
      case 'error':
        return {
          bg: '#EF4444', // Red on error
          glow: 'rgba(239, 68, 68, 0.4)',
        };
      default:
        return {
          bg: '#1A1A1A', // Dark when idle
          glow: 'transparent',
        };
    }
  };

  const colors = getColors();
  const isActive = state !== 'idle';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.glow,
            opacity: glowAnim,
          },
        ]}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.bg },
          isActive && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {/* Microphone Icon */}
        <View style={styles.iconContainer}>
          <MicrophoneIcon
            color={isActive ? '#FFFFFF' : '#888888'}
            size={28}
          />
        </View>

        {/* State indicator dots */}
        {state === 'processing' && (
          <View style={styles.processingDots}>
            <ProcessingDots />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Simple Microphone Icon
function MicrophoneIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Mic body */}
      <View
        style={{
          width: size * 0.4,
          height: size * 0.55,
          backgroundColor: color,
          borderRadius: size * 0.2,
        }}
      />
      {/* Mic stand */}
      <View
        style={{
          width: size * 0.6,
          height: size * 0.15,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          borderBottomLeftRadius: size * 0.3,
          borderBottomRightRadius: size * 0.3,
          marginTop: -size * 0.1,
        }}
      />
      {/* Base */}
      <View
        style={{
          width: 2,
          height: size * 0.15,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: size * 0.35,
          height: 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// Processing dots animation
function ProcessingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]).start();
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, dotStyle(dot1)]} />
      <Animated.View style={[styles.dot, dotStyle(dot2)]} />
      <Animated.View style={[styles.dot, dotStyle(dot3)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: 20,
    zIndex: 100,
  },
  glow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -8,
    left: -8,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  buttonActive: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingDots: {
    position: 'absolute',
    bottom: -20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
});
