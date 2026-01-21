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
import { Ionicons } from '@expo/vector-icons';
import { VoiceAssistantState } from '../services/voiceAssistant';
import { colors, opacity } from '../theme';

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
  const getStateColors = () => {
    switch (state) {
      case 'listening':
        return {
          bg: colors.voiceListening,
          glow: opacity.primary40,
        };
      case 'processing':
        return {
          bg: colors.voiceProcessing,
          glow: opacity.purple40,
        };
      case 'speaking':
        return {
          bg: colors.voiceSpeaking,
          glow: opacity.blue40,
        };
      case 'error':
        return {
          bg: colors.voiceError,
          glow: opacity.error40,
        };
      default:
        return {
          bg: colors.voiceIdle,
          glow: 'transparent',
        };
    }
  };

  const stateColors = getStateColors();
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
            backgroundColor: stateColors.glow,
            opacity: glowAnim,
          },
        ]}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: stateColors.bg },
          isActive && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {/* Microphone Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="mic"
            size={28}
            color={isActive ? colors.textPrimary : colors.gray}
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
    borderColor: colors.border,
  },
  buttonActive: {
    borderColor: opacity.white30,
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
    backgroundColor: colors.purple,
  },
});
