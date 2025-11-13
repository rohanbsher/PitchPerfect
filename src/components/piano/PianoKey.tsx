/**
 * Piano Key Component
 *
 * Individual piano key with real-time highlighting
 * Supports:
 * - White and black keys
 * - Green glow for detected pitch
 * - Blue overlay for exercise target notes
 * - Touch interaction to play notes
 *
 * @module PianoKey
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignSystem } from '../../design/DesignSystem';

export interface PianoKeyProps {
  /** Note name (e.g., 'C4', 'D#4') */
  note: string;
  /** Whether this is a black key */
  isBlack: boolean;
  /** Whether this key is currently being detected from microphone */
  isDetected: boolean;
  /** Whether this key is a target note in the current exercise */
  isTarget: boolean;
  /** Callback when key is pressed */
  onPress: () => void;
  /** Whether audio is ready to play */
  disabled?: boolean;
}

/**
 * Piano Key - Individual interactive key
 *
 * Visual states:
 * - Default: White (or black) key
 * - Detected: Green glow (user is singing this note)
 * - Target: Blue overlay (exercise wants this note)
 * - Detected + Target: Green glow + blue overlay (perfect!)
 */
export const PianoKey: React.FC<PianoKeyProps> = ({
  note,
  isBlack,
  isDetected,
  isTarget,
  onPress,
  disabled = false,
}) => {
  // Extract note name without octave for display
  const noteName = note.replace(/\d+/, '');

  return (
    <TouchableOpacity
      style={[
        styles.keyContainer,
        isBlack ? styles.blackKeyContainer : styles.whiteKeyContainer,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Key body */}
      <LinearGradient
        colors={
          isBlack
            ? ['#1a1a1a', '#000000']
            : ['#ffffff', '#f0f0f0']
        }
        style={[
          styles.key,
          isBlack ? styles.blackKey : styles.whiteKey,
          isDetected && styles.keyDetected,
        ]}
      >
        {/* Target indicator (exercise target note) */}
        {isTarget && (
          <View style={styles.targetIndicator}>
            <View style={styles.targetDot} />
          </View>
        )}

        {/* Note label */}
        <View style={styles.labelContainer}>
          <Text style={[
            styles.label,
            isBlack ? styles.labelBlack : styles.labelWhite,
          ]}>
            {noteName}
          </Text>
        </View>

        {/* Detection glow effect */}
        {isDetected && (
          <View style={styles.glowEffect} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Container
  keyContainer: {
    position: 'relative',
  },
  whiteKeyContainer: {
    width: 50,
    height: 200,
    marginHorizontal: 1,
  },
  blackKeyContainer: {
    width: 34,
    height: 130,
    position: 'absolute',
    zIndex: 10,
  },

  // Key body
  key: {
    flex: 1,
    borderRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  whiteKey: {
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  blackKey: {
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Detection state
  keyDetected: {
    borderColor: DesignSystem.colors.accent.success,
    borderWidth: 3,
    shadowColor: DesignSystem.colors.accent.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },

  // Glow effect
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DesignSystem.colors.accent.success + '30',
    borderRadius: 8,
  },

  // Target indicator (blue dot)
  targetIndicator: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    zIndex: 1,
  },
  targetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DesignSystem.colors.accent.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: DesignSystem.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },

  // Label
  labelContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelWhite: {
    color: DesignSystem.colors.text.tertiary,
  },
  labelBlack: {
    color: '#ffffff',
  },
});
