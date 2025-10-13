import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Note } from '../data/models';
import { PitchSmoother } from '../utils/pitchSmoothing';

/**
 * PITCH SCALE VISUALIZER
 * Shows a vertical scale with note lines and an animated dot for current pitch
 *
 * Key Features:
 * - Target note highlighted (glowing white line)
 * - Your pitch shown as animated dot
 * - Dot glides up/down as pitch changes
 * - Color coded: green (accurate), yellow (close), red (off)
 * - Smooth animations (no jumpy updates)
 */

interface PitchScaleVisualizerProps {
  /** All notes in the exercise */
  notes: Note[];
  /** The current target note */
  targetNote: Note | null;
  /** User's detected frequency (0 if not singing) */
  detectedFrequency: number;
  /** Confidence of pitch detection (0-1) */
  confidence?: number;
  /** Height of the visualizer in pixels */
  height?: number;
}

export const PitchScaleVisualizer: React.FC<PitchScaleVisualizerProps> = ({
  notes,
  targetNote,
  detectedFrequency,
  confidence = 0,
  height = 400,
}) => {
  const pitchY = useRef(new Animated.Value(0)).current;
  const pitchOpacity = useRef(new Animated.Value(0)).current;
  const pitchScale = useRef(new Animated.Value(0.5)).current;

  // Pitch smoothing to reduce jitter (extracted from PitchMatchPro)
  const pitchSmoother = useRef(new PitchSmoother({ smoothingFactor: 0.3 })).current;

  // Calculate vertical position for a frequency
  const getYPosition = (frequency: number): number => {
    if (!targetNote || frequency === 0) {
      pitchSmoother.reset(); // Reset smoother when no pitch
      return 0;
    }

    // Calculate cents off from target
    const rawCents = 1200 * Math.log2(frequency / targetNote.frequency);

    // Apply smoothing to reduce jitter (from PitchMatchPro)
    const smoothedCents = pitchSmoother.smooth(rawCents);

    // Map cents to pixels: ±50 cents = ±80 pixels
    const pixelsPerCent = 1.6;
    return -smoothedCents * pixelsPerCent; // Negative because Y increases downward
  };

  // Get color based on cents off
  const getPitchColor = (frequency: number): string => {
    if (!targetNote || frequency === 0) return '#888888';

    // Use smoothed cents value for consistent color
    const rawCents = 1200 * Math.log2(frequency / targetNote.frequency);
    const smoothedCents = pitchSmoother.getCurrentValue();
    const centsOff = Math.abs(smoothedCents);

    if (centsOff < 20) return '#00FF88'; // Green (accurate)
    if (centsOff < 50) return '#FFD700'; // Yellow (close)
    return '#FF4444'; // Red (off)
  };

  // Update pitch dot position and appearance
  useEffect(() => {
    if (detectedFrequency > 0 && confidence > 0.5) {
      const yPos = getYPosition(detectedFrequency);

      // Animate position (smooth gliding)
      Animated.spring(pitchY, {
        toValue: yPos,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      // Fade in and pulse
      Animated.parallel([
        Animated.timing(pitchOpacity, {
          toValue: confidence,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(pitchScale, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pitchScale, {
            toValue: 1.0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Fade out when not singing
      Animated.timing(pitchOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [detectedFrequency, confidence, targetNote]);

  // Calculate spacing between notes
  const noteSpacing = height / (notes.length + 1);

  // Get current pitch color
  const currentColor = getPitchColor(detectedFrequency);

  return (
    <View style={[styles.container, { height }]}>
      {/* Background gradient for accuracy zone */}
      {targetNote && (
        <View
          style={[
            styles.accuracyZone,
            {
              top: height / 2 - 60,
              height: 120,
            },
          ]}
        />
      )}

      {/* Note lines */}
      <View style={styles.noteLines}>
        {notes.map((note, index) => {
          const isTarget = targetNote?.note === note.note;
          const yPosition = (index + 1) * noteSpacing;

          return (
            <View
              key={`${note.note}-${index}`}
              style={[styles.noteRow, { top: yPosition }]}
            >
              {/* Note label */}
              <Text style={[styles.noteLabel, isTarget && styles.targetLabel]}>
                {note.note}
              </Text>

              {/* Note line */}
              <View
                style={[
                  styles.noteLine,
                  isTarget && styles.targetLine,
                ]}
              >
                {isTarget && (
                  <View style={styles.targetGlow} />
                )}
              </View>

              {/* Frequency label (optional) */}
              <Text style={styles.frequencyLabel}>
                {Math.round(note.frequency)} Hz
              </Text>
            </View>
          );
        })}
      </View>

      {/* Center reference line */}
      <View style={styles.centerLine} />

      {/* Animated pitch dot */}
      <Animated.View
        style={[
          styles.pitchDotContainer,
          {
            transform: [
              { translateY: pitchY },
              { scale: pitchScale },
            ],
            opacity: pitchOpacity,
          },
        ]}
      >
        <View style={[styles.pitchDot, { backgroundColor: currentColor }]}>
          <View style={[styles.pitchDotInner, { backgroundColor: currentColor }]} />
        </View>

        {/* Glow effect */}
        <View style={[styles.pitchGlow, { backgroundColor: currentColor }]} />
      </Animated.View>

      {/* Pitch indicator label (shows when singing) */}
      {detectedFrequency > 0 && confidence > 0.5 && (
        <Animated.View
          style={[
            styles.pitchIndicator,
            {
              opacity: pitchOpacity,
              transform: [{ translateY: pitchY }],
            },
          ]}
        >
          <Text style={styles.pitchIndicatorText}>
            {Math.round(detectedFrequency)} Hz
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accuracyZone: {
    position: 'absolute',
    width: '100%',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  noteLines: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  noteRow: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    width: 50,
  },
  targetLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  noteLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  targetLine: {
    height: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  targetGlow: {
    position: 'absolute',
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -8,
    borderRadius: 10,
  },
  frequencyLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    width: 60,
    textAlign: 'right',
    marginLeft: 8,
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 50,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pitchDotContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
  pitchDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  pitchDotInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pitchGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    top: -10,
    left: -10,
    opacity: 0.3,
  },
  pitchIndicator: {
    position: 'absolute',
    top: '50%',
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pitchIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
