/**
 * Native Pitch Screen - High Performance Pitch Tracker
 *
 * Uses:
 * - Native iOS AVAudioEngine for <15ms latency
 * - Reanimated shared values (no React re-renders)
 * - Skia canvas for GPU-accelerated rendering
 * - 60fps smooth animations
 *
 * @module NativePitchScreen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNativePitchDetector } from '../hooks/useNativePitchDetector';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pitch range - C3 to C5 (comfortable vocal range, 2 octaves)
const MIN_MIDI = 48; // C3
const MAX_MIDI = 72; // C5
const TOTAL_NOTES = MAX_MIDI - MIN_MIDI + 1; // 25 notes

// Layout - more space for bottom panel
const LABEL_WIDTH = 40;
const BOTTOM_PANEL_HEIGHT = 180;
const TRACKER_HEIGHT = SCREEN_HEIGHT - BOTTOM_PANEL_HEIGHT - 120; // Account for header and safe area
const NOTE_HEIGHT = TRACKER_HEIGHT / TOTAL_NOTES;

// Colors
const ACCENT_COLOR = '#10B981';
const PERFECT_COLOR = '#34D399';

export const NativePitchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentNote, setCurrentNote] = useState('--');
  const [currentFreq, setCurrentFreq] = useState(0);
  const [currentCents, setCurrentCents] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Use native pitch detector (iOS only)
  const {
    frequency,
    confidence,
    isAvailable,
    startDetection,
    stopDetection,
  } = useNativePitchDetector({
    autoStart: false,
    onPitchUpdate: (data) => {
      // Update React state for text displays (not animated elements)
      if (data.frequency > 0) {
        setCurrentNote(data.note);
        setCurrentFreq(data.frequency);
        setCurrentCents(data.centsOff);
      } else {
        setCurrentNote('--');
        setCurrentFreq(0);
        setCurrentCents(0);
      }
    },
  });

  // Handle start/stop with React state tracking
  const handleToggle = async () => {
    if (isActive) {
      stopDetection();
      setIsActive(false);
    } else {
      await startDetection();
      setIsActive(true);
    }
  };

  // Derive Y position from frequency (runs on UI thread)
  const pitchY = useDerivedValue(() => {
    'worklet';
    if (frequency.value <= 0) {
      return TRACKER_HEIGHT / 2; // Center when no pitch
    }
    // Inline the frequency to MIDI calculation for worklet
    const freq = frequency.value;
    const midi = 12 * Math.log2(freq / 440) + 69;
    // Inline the MIDI to Y calculation for worklet
    const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
    const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
    return normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;
  });

  // Derive opacity based on confidence
  const pitchOpacity = useDerivedValue(() => {
    'worklet';
    return confidence.value > 0.3 ? 1 : 0.3;
  });

  // Animated style for the pitch indicator (runs on UI thread, no bridge!)
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: pitchY.value - 12 }],
      opacity: pitchOpacity.value,
    };
  });

  // Pre-render grid lines (static, rendered once) - only show C and E notes
  const gridPath = React.useMemo(() => {
    const path = Skia.Path.Make();

    for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
      const noteIndex = midi % 12;

      // Only draw lines for C (0) and E (4) notes (cleaner look)
      if (noteIndex === 0 || noteIndex === 4) {
        const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
        const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
        const y = normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;

        path.moveTo(LABEL_WIDTH, y);
        path.lineTo(SCREEN_WIDTH - 20, y);
      }
    }

    return path;
  }, []);

  // Pre-render note labels - only show C notes for cleaner look
  const noteLabels = React.useMemo(() => {
    const labels = [];
    for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
      const noteIndex = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isC = noteIndex === 0;

      // Only show C notes
      if (isC) {
        const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
        const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
        const y = normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;

        labels.push(
          <View key={midi} style={[styles.noteLabel, { top: y - 10 }]}>
            <Text style={styles.noteLabelText}>
              C{octave}
            </Text>
          </View>
        );
      }
    }
    return labels;
  }, []);

  if (!isAvailable) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>
          Native pitch detection is only available on iOS devices.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pitch Tracker</Text>
        <Text style={[styles.subtitle, !isActive && styles.subtitleInactive]}>
          {isActive ? 'Listening...' : 'Tap Start to begin'}
        </Text>
      </View>

      {/* Main tracker area */}
      <View style={[styles.trackerContainer, { height: TRACKER_HEIGHT }]}>
        {/* Note labels on left */}
        <View style={styles.labelsContainer}>{noteLabels}</View>

        {/* Skia canvas for grid (GPU rendered) */}
        <Canvas style={[styles.canvas, { height: TRACKER_HEIGHT }]}>
          <Path
            path={gridPath}
            color="rgba(255, 255, 255, 0.1)"
            style="stroke"
            strokeWidth={1}
          />
        </Canvas>

        {/* Animated pitch indicator (Reanimated, runs on UI thread) */}
        <Animated.View style={[styles.pitchIndicator, animatedIndicatorStyle]}>
          <LinearGradient
            colors={[ACCENT_COLOR, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>
      </View>

      {/* Bottom info panel */}
      <View style={[styles.bottomPanel, { height: BOTTOM_PANEL_HEIGHT }]}>
        <View style={styles.pitchInfo}>
          <Text style={styles.noteDisplay}>{currentNote}</Text>
          <Text style={styles.freqDisplay}>
            {currentFreq > 0 ? `${currentFreq.toFixed(1)} Hz` : '---'}
          </Text>
          {currentFreq > 0 && (
            <Text
              style={[
                styles.centsDisplay,
                Math.abs(currentCents) <= 5 && styles.perfectPitch,
              ]}
            >
              {Math.abs(currentCents) <= 5
                ? 'In tune!'
                : currentCents > 0
                ? `+${currentCents}¢`
                : `${currentCents}¢`}
            </Text>
          )}
        </View>

        {/* Control button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isActive ? ['#EF4444', '#DC2626'] : [ACCENT_COLOR, '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {isActive ? 'Stop' : 'Start'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: ACCENT_COLOR,
    fontWeight: '500',
    marginTop: 4,
  },
  subtitleInactive: {
    color: '#6B7280',
  },
  trackerContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 10,
  },
  labelsContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: LABEL_WIDTH,
    zIndex: 10,
  },
  noteLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
  },
  noteLabelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    fontWeight: '600',
    paddingRight: 8,
  },
  canvas: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  pitchIndicator: {
    position: 'absolute',
    left: LABEL_WIDTH + 10,
    right: 20,
    height: 24,
    justifyContent: 'center',
  },
  indicatorGradient: {
    height: 24,
    borderRadius: 12,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  bottomPanel: {
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pitchInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  noteDisplay: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  freqDisplay: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    marginTop: 2,
  },
  centsDisplay: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 6,
  },
  perfectPitch: {
    color: PERFECT_COLOR,
  },
  controlButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
  },
});

export default NativePitchScreen;
