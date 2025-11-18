/**
 * High-Performance Pitch Tracker
 *
 * Optimized for minimal latency and smooth animation:
 * - Fast 50ms timing animation (not 200ms spring)
 * - Simple dot indicator (no expensive shadows/glows)
 * - Focused 9-note range (not 24)
 * - Idle state with faded dot
 *
 * @module PitchTimeline
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { PitchData } from '../contexts/AudioContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Full singing range - G2 to C6 (3.5 octaves)
const MIN_MIDI = 43; // G2
const MAX_MIDI = 84; // C6
const TOTAL_NOTES = MAX_MIDI - MIN_MIDI + 1; // 42 notes

// Layout
const LABEL_WIDTH = 60;
const TRACKER_HEIGHT = SCREEN_HEIGHT - 180; // More room for bottom info
const NOTE_HEIGHT = TRACKER_HEIGHT / TOTAL_NOTES;

// Colors
const ACCENT_COLOR = '#10B981'; // Green
const IDLE_COLOR = '#6B7280'; // Gray when no pitch detected

// Note names
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convert frequency to MIDI note number
const frequencyToMidi = (freq: number): number => {
  return 12 * Math.log2(freq / 440) + 69;
};

// Get note name from MIDI number
const midiToNoteName = (midi: number): string => {
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

interface PitchTimelineProps {
  currentPitch: PitchData | null;
  isListening: boolean;
}

export const PitchTimeline: React.FC<PitchTimelineProps> = ({
  currentPitch,
  isListening,
}) => {
  // Shared values for smooth animation - runs on UI thread
  const dotY = useSharedValue(TRACKER_HEIGHT / 2);
  const dotOpacity = useSharedValue(0.3); // Start faded (idle state)
  const dotScale = useSharedValue(0.8);

  // Track last frequency to avoid unnecessary updates
  const lastFreqRef = useRef<number>(0);

  // Convert MIDI to Y position (higher notes = lower Y value)
  const midiToY = (midi: number): number => {
    const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
    const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
    return normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;
  };

  // Update dot position with FAST timing (50ms) - no spring lag
  useEffect(() => {
    if (!isListening) {
      dotOpacity.value = withTiming(0, { duration: 200 });
      return;
    }

    if (currentPitch) {
      const freq = currentPitch.frequency;

      // Only update if frequency changed significantly (>0.5 Hz)
      if (Math.abs(freq - lastFreqRef.current) > 0.5) {
        lastFreqRef.current = freq;

        const midi = frequencyToMidi(freq);
        const targetY = midiToY(midi);

        // FAST timing animation - 50ms instead of 200ms spring
        dotY.value = withTiming(targetY, {
          duration: 50,
          easing: Easing.out(Easing.cubic),
        });

        // Show dot fully when pitch detected
        dotOpacity.value = withTiming(1, { duration: 100 });
        dotScale.value = withTiming(1, { duration: 100 });
      }
    } else {
      // Idle state - faded dot stays visible
      dotOpacity.value = withTiming(0.3, { duration: 200 });
      dotScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [currentPitch, isListening]);

  // Animated style for the dot - runs on UI thread (no bridge overhead)
  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dotY.value - 15 }, // -15 to center 30px dot
      { scale: dotScale.value },
    ],
    opacity: dotOpacity.value,
  }));

  // Static note labels (memoized - only render once)
  const noteLabels = useMemo(() => {
    const labels = [];
    for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
      const noteName = midiToNoteName(midi);
      const isSharp = noteName.includes('#');
      const y = midiToY(midi);

      labels.push(
        <View key={midi} style={[styles.noteRow, { top: y - NOTE_HEIGHT / 2 }]}>
          <Text style={[styles.noteLabel, isSharp && styles.sharpLabel]}>
            {noteName}
          </Text>
          <View style={[styles.gridLine, isSharp && styles.sharpGridLine]} />
        </View>
      );
    }
    return labels;
  }, []);

  return (
    <View style={styles.container}>
      {/* Main tracker area */}
      <View style={styles.trackerContainer}>
        {/* Note labels and grid lines */}
        {noteLabels}

        {/* Animated dot indicator - simple, no shadows */}
        <Animated.View style={[styles.dot, animatedDotStyle]} />
      </View>

      {/* Bottom info panel */}
      <View style={styles.bottomPanel}>
        {currentPitch ? (
          <View style={styles.pitchInfo}>
            <Text style={styles.noteText}>{currentPitch.note}</Text>
            <Text style={styles.freqText}>
              {currentPitch.frequency.toFixed(1)} Hz
            </Text>
            <Text style={[
              styles.centsText,
              currentPitch.centsOff === 0 && styles.perfectText,
            ]}>
              {currentPitch.centsOff === 0
                ? 'Perfect!'
                : currentPitch.centsOff > 0
                ? `+${currentPitch.centsOff}¢ sharp`
                : `${currentPitch.centsOff}¢ flat`}
            </Text>
          </View>
        ) : (
          <Text style={styles.idleText}>
            {isListening ? 'Listening... sing a note' : 'Microphone off'}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  trackerContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 20,
    marginTop: 20,
  },
  noteRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: NOTE_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteLabel: {
    width: LABEL_WIDTH,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    paddingRight: 12,
  },
  sharpLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sharpGridLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  // Simple dot - NO shadows, NO glow (fast rendering)
  dot: {
    position: 'absolute',
    left: LABEL_WIDTH + 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ACCENT_COLOR,
  },
  bottomPanel: {
    height: 180,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pitchInfo: {
    alignItems: 'center',
  },
  noteText: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  freqText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    marginTop: 4,
  },
  centsText: {
    fontSize: 20,
    color: ACCENT_COLOR,
    fontWeight: '600',
    marginTop: 8,
  },
  perfectText: {
    color: '#34D399', // Brighter green for perfect
  },
  idleText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '500',
  },
});
