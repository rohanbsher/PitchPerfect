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
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useNativePitchDetector } from '../hooks/useNativePitchDetector';
import { Audio } from 'expo-av';
import { ExerciseEngine, ExerciseState, BreathingState } from '../engines/ExerciseEngine';
import { ExerciseNote, DAILY_WORKOUTS, QUICK_WARMUPS, EXERCISE_CATEGORIES, CATEGORY_INFO, EXERCISES, BREATHING_EXERCISES, type ExerciseCategory, getDefaultBreathingExercise, generateRangeBasedScale } from '../data/exercises';
import { useStorage } from '../hooks/useStorage';
import { getUserSettings, getUserProgress } from '../services/storage';
import type { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import { CoachingBubble } from '../components/CoachingBubble';
import type { ComfortableRange, AdaptationInfo } from '../services/exerciseAdaptation';
import { QuickWarmupCard } from '../components/QuickWarmupCard';
import { ExerciseCategoryCard } from '../components/ExerciseCategoryCard';
import { VoiceCoach } from '../services/voiceCoaching';

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
type PracticeRouteProps = RouteProp<TabParamList, 'Practice'>;

export const NativePitchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PracticeRouteProps>();

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

  // View mode state - toggle between home and workout view
  const [viewMode, setViewMode] = useState<'home' | 'workout'>('home');

  // Workout menu state
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);

  // Exercise picker modal state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);

  // Breathing state
  const [breathingState, setBreathingState] = useState<BreathingState | null>(null);

  // AI Coaching state
  const [aiCoachingTip, setAiCoachingTip] = useState<string | null>(null);
  const [showAICoaching, setShowAICoaching] = useState(false);

  // Range adaptation state
  const [userRange, setUserRange] = useState<ComfortableRange | null>(null);
  const [adaptationInfo, setAdaptationInfo] = useState<AdaptationInfo[]>([]);

  // Progress indicator state
  const [progressInfo, setProgressInfo] = useState<{
    currentNote: number;
    totalNotes: number;
    currentExercise: number;
    totalExercises: number;
  } | null>(null);

  // Settings state for volume
  const [pianoVolume, setPianoVolume] = useState(85); // Default 85%

  // Shared values for animations
  const targetPitchY = useSharedValue(-100); // Off screen by default

  // Use native pitch detector - NO auto-start to avoid race condition with voice assistant
  const {
    frequency,
    confidence,
    isAvailable,
    startDetection,
    stopDetection,
  } = useNativePitchDetector({
    autoStart: false, // Disabled to prevent crash from competing native audio modules
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
    const initEngine = async () => {
      const settings = await getUserSettings();
      const progress = await getUserProgress();
      setPianoVolume(settings.pianoVolume);

      exerciseEngineRef.current = new ExerciseEngine({
        onStateChange: (state) => {
          setExerciseState(state);
          // Switch to workout view when exercise starts, back to home when idle/complete
          if (state !== 'idle' && state !== 'complete') {
            setViewMode('workout');
          } else if (state === 'complete') {
            // Keep in workout view until user navigates back
          }
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

          // If this was a range test, announce the results
          if (session.exerciseId === 'range_check' && session.lowestNote && session.highestNote) {
            await VoiceCoach.announceRangeResults(session.lowestNote, session.highestNote);
          }

          // Navigate to Results screen with session data
          navigation.navigate('Results', {
            accuracy: session.accuracy,
            notesHit: session.notesHit,
            notesAttempted: session.notesAttempted,
            duration: session.duration,
            exerciseName: session.exerciseName,
            lowestNote: session.lowestNote,
            highestNote: session.highestNote,
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
      onRangeAnalysis: (range) => {
        setUserRange(range);
        console.log('Vocal range analyzed:', range);
      },
      onWorkoutAdapted: (info) => {
        setAdaptationInfo(info);
        console.log('Workout adapted:', info);
      },
    },
    settings.pianoVolume,
    settings.voiceVolume,
    {
      enabled: settings.voiceCoachEnabled,
      speed: settings.voiceCoachSpeed,
      pitch: settings.voiceCoachPitch,
    },
    progress);
    };

    initEngine();

    return () => {
      exerciseEngineRef.current?.stop();
    };
  }, [saveSession, navigation]);

  // Auto-start exercise from navigation params (e.g., from RangeAnalysisScreen)
  useEffect(() => {
    if (!route.params) return;

    const { autoStartExerciseId, autoStartBreathingId } = route.params;

    if (autoStartExerciseId && exerciseEngineRef.current) {
      const exercise = EXERCISES[autoStartExerciseId as keyof typeof EXERCISES];
      if (exercise) {
        const workout = {
          id: `auto_${autoStartExerciseId}`,
          name: exercise.name,
          description: exercise.description,
          duration: '5 min',
          details: [exercise.description],
          exercises: [exercise],
        };
        setViewMode('workout');
        setTimeout(() => {
          exerciseEngineRef.current?.startWorkout(workout);
        }, 500);
      }
    } else if (autoStartBreathingId && exerciseEngineRef.current) {
      const breathing = BREATHING_EXERCISES[autoStartBreathingId as keyof typeof BREATHING_EXERCISES];
      if (breathing) {
        setViewMode('workout');
        setTimeout(() => {
          exerciseEngineRef.current?.startBreathingExercise(breathing);
        }, 500);
      }
    }
  }, [route.params]);

  // Start/stop pitch detection based on exercise state
  // This prevents the race condition with voice assistant by only starting audio when needed
  useEffect(() => {
    if (exerciseState !== 'idle' && exerciseState !== 'complete') {
      // Start pitch detection when exercise begins
      startDetection();
    } else {
      // Stop when exercise ends (idle or complete)
      stopDetection();
    }
  }, [exerciseState, startDetection, stopDetection]);

  // Update progress info when exercise state changes
  useEffect(() => {
    if (exerciseState !== 'idle' && exerciseState !== 'complete' && exerciseState !== 'breathing') {
      const info = exerciseEngineRef.current?.getProgressInfo();
      if (info) {
        setProgressInfo(info);
      }
    } else if (exerciseState === 'idle' || exerciseState === 'complete') {
      setProgressInfo(null);
    }
  }, [exerciseState, targetNote]);

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
        const { sound } = await Audio.Sound.createAsync(
          sample,
          { shouldPlay: false, volume: pianoVolume / 100 }
        );
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
  }, [pianoVolume]);

  // Handle quick warmup selection
  const handleQuickWarmup = useCallback(async (warmupId: string) => {
    const warmup = QUICK_WARMUPS.find(w => w.id === warmupId);
    if (!warmup) return;

    // Special handling for personal_scale - generate dynamic exercise
    if (warmupId === 'personal_scale') {
      // Fetch user's vocal range
      const progress = await getUserProgress();
      const comfortableLow = progress.vocalRange?.comfortableLow || 'C3';
      const comfortableHigh = progress.vocalRange?.comfortableHigh || 'C5';

      // Generate personalized scale exercise
      const personalExercise = generateRangeBasedScale(comfortableLow, comfortableHigh, 2);

      // Personalized greeting before starting
      await VoiceCoach.greetForPersonalScale();

      const workout = {
        id: 'personal_scale',
        name: 'Your Personal Scale',
        description: `Scale from ${comfortableLow} to ${comfortableHigh}`,
        duration: '1 min',
        details: ['Personalized 5-note scale in your comfortable range'],
        exercises: [personalExercise],
      };
      exerciseEngineRef.current?.startWorkout(workout);
      return;
    }

    // Special handling for range_check - explain what we're doing
    if (warmupId === 'range_check') {
      // Voice greeting explaining the range test
      await VoiceCoach.greetForRangeTest();

      const workout = {
        id: warmup.id,
        name: warmup.name,
        description: warmup.description,
        duration: warmup.duration,
        details: [warmup.description],
        exercises: warmup.exercises,
      };
      exerciseEngineRef.current?.startWorkout(workout);
      return;
    }

    if (warmup.breathingExercise && warmup.exercises.length > 0) {
      // INTEGRATED: Breathing + vocal exercises (Morning Warmup)
      const workout = {
        id: warmup.id,
        name: warmup.name,
        description: warmup.description,
        duration: warmup.duration,
        details: [warmup.description],
        exercises: warmup.exercises,
      };
      exerciseEngineRef.current?.startIntegratedWorkout(warmup.breathingExercise, workout);
    } else if (warmup.breathingExercise && warmup.exercises.length === 0) {
      // BREATHING ONLY
      exerciseEngineRef.current?.startBreathingExercise(warmup.breathingExercise);
    } else {
      // VOCAL ONLY
      const workout = {
        id: warmup.id,
        name: warmup.name,
        description: warmup.description,
        duration: warmup.duration,
        details: [warmup.description],
        exercises: warmup.exercises,
      };
      exerciseEngineRef.current?.startWorkout(workout);
    }
  }, []);

  // Handle exercise category selection - show picker modal
  const handleExerciseCategory = useCallback((category: ExerciseCategory) => {
    setSelectedCategory(category);
    setShowExercisePicker(true);
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

  // Home View - Beautiful card-based UI
  if (viewMode === 'home') {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.homeScroll}
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.homeHeader}>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</Text>
            <Text style={styles.tagline}>Ready to practice?</Text>
          </View>

          {/* Quick Warmups Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Warmups</Text>
            {QUICK_WARMUPS.map((warmup) => (
              <QuickWarmupCard
                key={warmup.id}
                warmup={warmup}
                onPress={() => handleQuickWarmup(warmup.id)}
              />
            ))}
          </View>

          {/* Browse Exercises Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse Exercises</Text>
            <View style={styles.categoriesGrid}>
              {(Object.keys(EXERCISE_CATEGORIES) as ExerciseCategory[]).map((category) => (
                <ExerciseCategoryCard
                  key={category}
                  category={category}
                  exerciseCount={EXERCISE_CATEGORIES[category].length}
                  onPress={() => handleExerciseCategory(category)}
                />
              ))}
            </View>
          </View>

          {/* Full Workouts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Full Workouts</Text>
            {DAILY_WORKOUTS.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[
                  styles.fullWorkoutCard,
                  workout.recommended && styles.fullWorkoutCardRecommended,
                ]}
                onPress={() => {
                  exerciseEngineRef.current?.startIntegratedWorkout();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.fullWorkoutHeader}>
                  <Text style={styles.fullWorkoutName}>{workout.name}</Text>
                  <Text style={styles.fullWorkoutDuration}>{workout.duration}</Text>
                </View>
                <Text style={styles.fullWorkoutDescription}>{workout.description}</Text>
                {workout.details.map((detail, index) => (
                  <Text key={index} style={styles.fullWorkoutDetail}>• {detail}</Text>
                ))}
                {workout.recommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Exercise Picker Modal */}
        <Modal
          visible={showExercisePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowExercisePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowExercisePicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {selectedCategory ? CATEGORY_INFO[selectedCategory].title : 'Choose Exercise'}
              </Text>

              {selectedCategory && selectedCategory !== 'breathing' && (
                // Vocal exercises
                (EXERCISE_CATEGORIES[selectedCategory] as any[]).map((exercise: any) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.workoutOption}
                    onPress={() => {
                      setShowExercisePicker(false);
                      const workout = {
                        id: `single_${exercise.id}`,
                        name: exercise.name,
                        description: exercise.description,
                        duration: '2 min',
                        details: [exercise.description],
                        exercises: [exercise],
                      };
                      exerciseEngineRef.current?.startWorkout(workout);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutName}>{exercise.name}</Text>
                      <View style={[
                        styles.difficultyBadge,
                        exercise.difficulty === 'beginner' && styles.difficultyBeginner,
                        exercise.difficulty === 'intermediate' && styles.difficultyIntermediate,
                        exercise.difficulty === 'advanced' && styles.difficultyAdvanced,
                      ]}>
                        <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                      </View>
                    </View>
                    <Text style={styles.workoutDetail}>{exercise.description}</Text>
                    <Text style={styles.workoutDetail}>{exercise.notes.length} notes</Text>
                  </TouchableOpacity>
                ))
              )}

              {selectedCategory === 'breathing' && (
                // Breathing exercises
                EXERCISE_CATEGORIES.breathing.map((breathing) => (
                  <TouchableOpacity
                    key={breathing.id}
                    style={styles.workoutOption}
                    onPress={() => {
                      setShowExercisePicker(false);
                      exerciseEngineRef.current?.startBreathingExercise(breathing);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutName}>{breathing.name}</Text>
                      <Text style={styles.workoutDuration}>{breathing.cycles} cycles</Text>
                    </View>
                    <Text style={styles.workoutDetail}>{breathing.description}</Text>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExercisePicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Workout View - Pitch Tracker
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

        {/* Hear Again button - allows user to replay the reference note */}
        {(exerciseState === 'listening' || exerciseState === 'playing_reference') && !breathingState ? (
          <TouchableOpacity
            style={styles.hearAgainButton}
            onPress={() => exerciseEngineRef.current?.replayCurrentNote()}
            activeOpacity={0.7}
          >
            <Text style={styles.hearAgainText}>Hear Again</Text>
          </TouchableOpacity>
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

        {/* Progress indicator - shows current note and exercise progress */}
        {progressInfo && !breathingState ? (
          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>
              Note {progressInfo.currentNote} of {progressInfo.totalNotes}
            </Text>
            {progressInfo.totalExercises > 1 ? (
              <Text style={styles.progressSubtext}>
                Exercise {progressInfo.currentExercise} of {progressInfo.totalExercises}
              </Text>
            ) : null}
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
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => exerciseEngineRef.current?.skipToWorkout()}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip to Workout →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Range Adaptation Indicator */}
        {userRange && adaptationInfo.length > 0 && adaptationInfo.some(info => info.isAdapted) && exerciseState !== 'idle' && !breathingState ? (
          <View style={styles.adaptationBadge}>
            <Text style={styles.adaptationTitle}>Adapted to Your Range</Text>
            <Text style={styles.adaptationRange}>
              {userRange.lowestComfortableNote} - {userRange.highestComfortableNote}
            </Text>
            <Text style={styles.adaptationDetail}>
              {adaptationInfo.filter(info => info.isAdapted).length} exercise{adaptationInfo.filter(info => info.isAdapted).length > 1 ? 's' : ''} adjusted
            </Text>
          </View>
        ) : null}

      </View>

      {/* Bottom control bar */}
      <View style={styles.bottomBar}>
        {exerciseState !== 'idle' && exerciseState !== 'complete' ? (
          <TouchableOpacity
            style={[styles.workoutButton, styles.workoutButtonActive]}
            onPress={() => {
              exerciseEngineRef.current?.stop();
              setViewMode('home');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.workoutButtonText}>Stop Workout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setViewMode('home')}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        )}
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
  hearAgainButton: {
    position: 'absolute',
    bottom: 160,
    right: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 25,
  },
  hearAgainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressIndicator: {
    position: 'absolute',
    top: 45,
    left: 50,
    zIndex: 20,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  progressSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 2,
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
  skipButton: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
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
  // Range adaptation badge styles
  adaptationBadge: {
    position: 'absolute',
    top: 80,
    left: 50,
    right: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 12,
    padding: 12,
    zIndex: 15,
  },
  adaptationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adaptationRange: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  adaptationDetail: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Home view styles
  homeScroll: {
    flex: 1,
  },
  homeContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  homeHeader: {
    marginTop: 20,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fullWorkoutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  fullWorkoutCardRecommended: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  fullWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fullWorkoutName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullWorkoutDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  fullWorkoutDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  fullWorkoutDetail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Difficulty badge styles
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyBeginner: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  difficultyIntermediate: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  difficultyAdvanced: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'capitalize',
  },
});

export default NativePitchScreen;
