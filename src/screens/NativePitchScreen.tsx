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

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNativePitchDetector } from '../hooks/useNativePitchDetector';
import { Audio } from 'expo-av';
import { ExerciseEngine, ExerciseState, BreathingState } from '../engines/ExerciseEngine';
import { ExerciseNote, DAILY_WORKOUTS, getDefaultBreathingExercise } from '../data/exercises';
import { useStorage } from '../hooks/useStorage';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { CoachingBubble } from '../components/CoachingBubble';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Pitch range - C2 to C6 (extended vocal range, 4 octaves)
const MIN_MIDI = 36; // C2
const MAX_MIDI = 84; // C6
const TOTAL_NOTES = MAX_MIDI - MIN_MIDI + 1; // 49 notes

// Layout - full screen tracker (no bottom panel)
const LABEL_WIDTH = 35;
const TRACKER_HEIGHT = SCREEN_HEIGHT - 100; // Just safe area margins
const NOTE_HEIGHT = TRACKER_HEIGHT / TOTAL_NOTES;

// Piano samples mapping (C3-C6 available)
const pianoSamples: Record<string, any> = {
  'C3': require('../../assets/audio/piano/C3.aiff'),
  'C4': require('../../assets/audio/piano/C4.aiff'),
  'C5': require('../../assets/audio/piano/C5.aiff'),
  'C6': require('../../assets/audio/piano/C6.aiff'),
};

// Colors
const ACCENT_COLOR = '#10B981';
const TARGET_COLOR = '#8B5CF6'; // Purple for target pitch

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NativePitchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  // Storage hook for saving sessions
  const { saveSession } = useStorage();

  // Sound refs for piano playback
  const soundRef = useRef<Audio.Sound | null>(null);

  // Track current note for display
  const [currentNote, setCurrentNote] = useState<string>('');

  // Exercise state
  const [exerciseState, setExerciseState] = useState<ExerciseState>('idle');
  const [targetNote, setTargetNote] = useState<ExerciseNote | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const exerciseEngineRef = useRef<ExerciseEngine | null>(null);

  // Workout menu state
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);

  // Breathing state
  const [breathingState, setBreathingState] = useState<BreathingState | null>(null);

  // AI Coaching state
  const [aiCoachingTip, setAiCoachingTip] = useState<string | null>(null);
  const [showAICoaching, setShowAICoaching] = useState(false);

  // Shared values for animations
  const targetPitchY = useSharedValue(-100); // Off screen by default

  // Use native pitch detector with AUTO-START
  const {
    frequency,
    confidence,
    isAvailable,
  } = useNativePitchDetector({
    autoStart: true, // Auto-start on mount
    onPitchUpdate: (data) => {
      // Update note display when we have a confident pitch
      if (data.confidence > 0.3 && data.note) {
        setCurrentNote(data.note);
      } else {
        setCurrentNote('');
      }

      // Feed pitch data to exercise engine if running
      if (exerciseEngineRef.current?.isActive()) {
        exerciseEngineRef.current.recordPitch(data.frequency, data.confidence);
      }
    },
  });

  // Initialize exercise engine
  useEffect(() => {
    exerciseEngineRef.current = new ExerciseEngine({
      onStateChange: (state) => {
        setExerciseState(state);
      },
      onTargetNoteChange: (note) => {
        setTargetNote(note);
        if (note) {
          // Calculate Y position for target note
          const midi = note.midi;
          const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
          const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
          const y = normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;
          targetPitchY.value = withSpring(y - 12, { damping: 15 });
        } else {
          targetPitchY.value = withSpring(-100, { damping: 15 });
        }
      },
      onFeedback: (message) => {
        setFeedback(message);
        // Clear feedback after 2 seconds
        setTimeout(() => setFeedback(''), 2000);
      },
      onWorkoutComplete: () => {
        setFeedback('');
        setBreathingState(null);
      },
      onSessionComplete: async (session) => {
        // Save the completed session to persistent storage
        try {
          await saveSession(session);
          console.log('Session saved:', session.id, 'Accuracy:', session.accuracy);

          // Navigate to Results screen with session data
          navigation.navigate('Results', {
            accuracy: session.accuracy,
            notesHit: session.notesHit,
            notesAttempted: session.notesAttempted,
            duration: session.duration,
            exerciseName: session.exerciseName,
          });
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      },
      onBreathingUpdate: (state) => {
        setBreathingState(state);
      },
      onAICoaching: (tip) => {
        setAiCoachingTip(tip);
        setShowAICoaching(true);
        // Auto-hide after 8 seconds (matches CoachingBubble animation)
        setTimeout(() => {
          setShowAICoaching(false);
        }, 8000);
      },
    });

    return () => {
      exerciseEngineRef.current?.stop();
    };
  }, [saveSession, navigation]);

  // Play piano note when tapping on C labels
  const playPianoNote = useCallback(async (noteName: string) => {
    try {
      // Stop previous sound if playing
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      // Get sample (C2 uses C3 since we don't have C2)
      const sampleKey = noteName === 'C2' ? 'C3' : noteName;
      const sample = pianoSamples[sampleKey];

      if (sample) {
        const { sound } = await Audio.Sound.createAsync(sample);
        soundRef.current = sound;
        await sound.playAsync();

        // Auto-stop after 1.5 seconds
        setTimeout(async () => {
          if (soundRef.current) {
            await soundRef.current.stopAsync();
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to play piano note:', error);
    }
  }, []);

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

  // Animated style for target pitch indicator
  const animatedTargetStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: targetPitchY.value }],
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

  // Pre-render note labels - only show C notes, tappable for piano playback
  const noteLabels = React.useMemo(() => {
    const labels = [];
    for (let midi = MAX_MIDI; midi >= MIN_MIDI; midi--) {
      const noteIndex = midi % 12;
      const octave = Math.floor(midi / 12) - 1;

      // Only show C notes
      if (noteIndex === 0) {
        const clamped = Math.max(MIN_MIDI, Math.min(MAX_MIDI, midi));
        const normalized = (MAX_MIDI - clamped) / (TOTAL_NOTES - 1);
        const y = normalized * (TRACKER_HEIGHT - NOTE_HEIGHT) + NOTE_HEIGHT / 2;
        const noteName = `C${octave}`;

        labels.push(
          <TouchableOpacity
            key={midi}
            style={[styles.noteLabel, { top: y - 12 }]}
            onPress={() => playPianoNote(noteName)}
            activeOpacity={0.6}
          >
            <Text style={styles.noteLabelText}>
              {noteName}
            </Text>
          </TouchableOpacity>
        );
      }
    }
    return labels;
  }, [playPianoNote]);

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Full-screen tracker */}
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

        {/* Target pitch indicator (purple) - only shows during exercises */}
        <Animated.View style={[styles.targetIndicator, animatedTargetStyle]}>
          <View style={styles.targetBar} />
        </Animated.View>

        {/* Animated pitch indicator (Reanimated, runs on UI thread) */}
        <Animated.View style={[styles.pitchIndicator, animatedIndicatorStyle]}>
          <View style={styles.indicatorBar} />
        </Animated.View>

        {/* Current note display - centered, no background */}
        {currentNote ? (
          <View style={styles.noteDisplayContainer}>
            <Text style={styles.noteDisplayText}>{currentNote}</Text>
          </View>
        ) : null}

        {/* Target note display during exercises */}
        {targetNote ? (
          <View style={styles.targetNoteContainer}>
            <Text style={styles.targetNoteLabel}>TARGET</Text>
            <Text style={styles.targetNoteText}>{targetNote.note}</Text>
          </View>
        ) : null}

        {/* Feedback display */}
        {feedback ? (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        ) : null}

        {/* AI Coaching Bubble */}
        <CoachingBubble message={aiCoachingTip} visible={showAICoaching} />

        {/* Exercise state indicator */}
        {exerciseState !== 'idle' && exerciseState !== 'complete' ? (
          <View style={styles.exerciseStateContainer}>
            <Text style={styles.exerciseStateText}>
              {exerciseState === 'playing_reference' ? 'Listen...' :
               exerciseState === 'listening' ? 'Sing!' :
               exerciseState === 'evaluating' ? '...' : ''}
            </Text>
          </View>
        ) : null}

        {/* Breathing UI overlay */}
        {breathingState ? (
          <View style={styles.breathingOverlay}>
            <Text style={styles.breathingPhase}>
              {breathingState.phase === 'inhale' ? 'Breathe In' :
               breathingState.phase === 'hold' ? 'Hold' : 'Breathe Out'}
            </Text>
            <Text style={styles.breathingTimer}>{breathingState.timeRemaining}</Text>
            <Text style={styles.breathingCycle}>
              Cycle {breathingState.cycle} of {breathingState.totalCycles}
            </Text>
          </View>
        ) : null}

      </View>

      {/* Bottom control bar - always visible */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.workoutButton,
            exerciseState !== 'idle' && exerciseState !== 'complete' && styles.workoutButtonActive
          ]}
          onPress={() => {
            if (exerciseEngineRef.current?.isActive()) {
              exerciseEngineRef.current.stop();
            } else {
              setShowWorkoutMenu(true);
            }
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.workoutButtonText}>
            {exerciseState !== 'idle' && exerciseState !== 'complete' ? 'Stop' : 'Start Workout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workout Selector Modal */}
      <Modal
        visible={showWorkoutMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkoutMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowWorkoutMenu(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Workout</Text>

            {/* Vocal Workouts */}
            {DAILY_WORKOUTS.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[
                  styles.workoutOption,
                  workout.recommended && styles.workoutOptionRecommended,
                ]}
                onPress={() => {
                  setShowWorkoutMenu(false);
                  exerciseEngineRef.current?.startWorkout(workout);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutDuration}>{workout.duration}</Text>
                </View>
                {workout.details.map((detail, index) => (
                  <Text key={index} style={styles.workoutDetail}>• {detail}</Text>
                ))}
                {workout.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Breathing Exercise */}
            <TouchableOpacity
              style={[styles.workoutOption, styles.breathingOption]}
              onPress={() => {
                setShowWorkoutMenu(false);
                exerciseEngineRef.current?.startBreathingExercise();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>Breath Control</Text>
                <Text style={styles.workoutDuration}>8 min</Text>
              </View>
              <Text style={styles.workoutDetail}>• Diaphragmatic breathing</Text>
              <Text style={styles.workoutDetail}>• Build vocal support</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowWorkoutMenu(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    height: 24,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  noteLabelText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
    fontWeight: '600',
    paddingRight: 6,
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
  indicatorBar: {
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT_COLOR,
    shadowColor: ACCENT_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  noteDisplayContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -30 }],
    zIndex: 20,
  },
  noteDisplayText: {
    fontSize: 48,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
  },
  targetIndicator: {
    position: 'absolute',
    left: LABEL_WIDTH + 10,
    right: 20,
    height: 24,
    justifyContent: 'center',
  },
  targetBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: TARGET_COLOR,
    opacity: 0.6,
    shadowColor: TARGET_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  targetNoteContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  targetNoteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TARGET_COLOR,
    letterSpacing: 1,
  },
  targetNoteText: {
    fontSize: 32,
    fontWeight: '700',
    color: TARGET_COLOR,
  },
  feedbackContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exerciseStateContainer: {
    position: 'absolute',
    top: 20,
    left: 50,
    zIndex: 20,
  },
  exerciseStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 8,
  },
  workoutButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  workoutButtonActive: {
    backgroundColor: '#EF4444',
  },
  workoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Breathing overlay styles
  breathingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 25,
  },
  breathingPhase: {
    fontSize: 32,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 20,
  },
  breathingTimer: {
    fontSize: 96,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  breathingCycle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  workoutOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workoutOptionRecommended: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  breathingOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginTop: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  workoutDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  workoutDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 20,
  },
  recommendedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default NativePitchScreen;
