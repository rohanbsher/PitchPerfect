/**
 * HOME SCREEN - REDESIGNED
 * Complete UX overhaul following Jobs/Ive design principles
 * - Smart recommendation (ONE exercise, not flat list)
 * - Personalized greeting based on time of day
 * - Streak tracking
 * - Progressive disclosure (collapsible explore section)
 * - AsyncStorage for progress persistence
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseEngineV2 } from '../engines/ExerciseEngineV2';
import { YINPitchDetector } from '../utils/pitchDetection';
import { scaleExercises } from '../data/exercises/scales';
import { breathingExercises } from '../data/exercises/breathing';
import { Exercise, ExerciseResults, Note, ExerciseSettings } from '../data/models';
import { PitchScaleVisualizer } from '../components/PitchScaleVisualizer';
import { CelebrationConfetti } from '../components/CelebrationConfetti';
import { BreathingVisualizer } from '../components/BreathingVisualizer'; // NEW
import { PitchHistoryGraph } from '../components/analytics/PitchHistoryGraph';
import { SessionStatsCards } from '../components/analytics/SessionStatsCards';
import { usePitchHistory } from '../hooks/usePitchHistory';
import { DesignSystem as DS } from '../design/DesignSystem';
import { AudioServiceFactory } from '../services/audio/AudioServiceFactory';
import { IAudioService } from '../services/audio/IAudioService';
import { generateEncouragingMessage } from '../utils/encouragingMessages';
import { BreathingEngine, BreathingPhase } from '../engines/BreathingEngine'; // NEW

// NEW: Import new components
import { Header } from '../components/home/Header';
import { Greeting } from '../components/home/Greeting';
import { HeroCard } from '../components/home/HeroCard';
import { ExploreSection } from '../components/home/ExploreSection';
import { JourneyProgress } from '../components/home/JourneyProgress';
import { ExercisePreview } from './ExercisePreview';

// NEW: Import recommendation system
import {
  loadUserProgress,
  saveCompletedExercise,
  getTodaysExercises,
  UserProgress,
  CompletedExercise,
} from '../data/userProgress';
import {
  getRecommendedExercise,
  getTimeOfDay,
  getGreeting,
  getMotivationalSubtext,
  getRecommendationReasonText,
} from '../services/recommendationEngine';
import { getCurrentWeek } from '../data/curriculum';

// NEW: Import session context for Flow Mode
import {
  buildPracticeSession,
  getNextExercise,
  markExerciseComplete,
  skipExercise,
  endSession,
  getSessionProgress,
  getSessionSummary,
  PracticeSession,
} from '../services/sessionContext';

export const ExerciseScreenComplete: React.FC = () => {
  // Audio state
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [detectedNote, setDetectedNote] = useState('—');
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [results, setResults] = useState<ExerciseResults | null>(null);

  // Pitch history tracking for analytics
  const pitchHistory = usePitchHistory();

  // NEW: User progress state
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [todaysExercises, setTodaysExercises] = useState<CompletedExercise[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // NEW: Session state (Flow Mode)
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [autoTransitionCountdown, setAutoTransitionCountdown] = useState<number | null>(null);

  // NEW: UI state
  const [isExploreExpanded, setIsExploreExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Show exercise preview before starting
  const [countdownActive, setCountdownActive] = useState(false); // Pre-exercise countdown
  const [countdownSeconds, setCountdownSeconds] = useState(3); // 3, 2, 1

  // Exercise state
  const allExercises = [...breathingExercises, ...scaleExercises];
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(allExercises[0]);
  const [recommendedExercise, setRecommendedExercise] = useState<Exercise>(allExercises[0]);

  // Refs
  const audioServiceRef = useRef<IAudioService | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const engineRef = useRef<ExerciseEngineV2 | null>(null);
  const breathingEngineRef = useRef<BreathingEngine | null>(null); // NEW

  // NEW: Breathing exercise state
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>('inhale');
  const [breathingTimeRemaining, setBreathingTimeRemaining] = useState(0);
  const [breathingTotalPhaseDuration, setBreathingTotalPhaseDuration] = useState(0);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  // NEW: Load user progress on mount
  useEffect(() => {
    loadUserProgressData();
  }, []);

  // NEW: Get recommendation when progress loads
  useEffect(() => {
    if (userProgress && !isLoadingProgress) {
      updateRecommendation();
    }
  }, [userProgress, todaysExercises, isLoadingProgress]);

  // NEW: Pre-exercise countdown timer
  useEffect(() => {
    if (!countdownActive) return;

    if (countdownSeconds === 0) {
      // Countdown finished - start actual exercise
      setCountdownActive(false);
      setCountdownSeconds(3); // Reset for next time
      actuallyStartExercise(); // Call the actual start function
      return;
    }

    const timer = setTimeout(() => {
      setCountdownSeconds(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownActive, countdownSeconds]);

  // NEW: Auto-transition countdown timer
  useEffect(() => {
    if (autoTransitionCountdown === null) return;

    if (autoTransitionCountdown === 0) {
      // Countdown finished - auto-start next exercise
      if (activeSession) {
        const nextEx = getNextExercise(activeSession);
        if (nextEx) {
          console.log('🚀 Auto-starting next exercise:', nextEx.name);
          setSelectedExercise(nextEx);
          setAutoTransitionCountdown(null);
          setResults(null); // Clear results screen
          startExercise(); // Start next exercise
        }
      }
      return;
    }

    // Tick down every second
    const timer = setTimeout(() => {
      setAutoTransitionCountdown(autoTransitionCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoTransitionCountdown, activeSession]);

  const loadUserProgressData = async () => {
    try {
      const progress = await loadUserProgress();
      const todaysEx = await getTodaysExercises();

      setUserProgress(progress);
      setTodaysExercises(todaysEx);
      setIsLoadingProgress(false);

      console.log('✅ User progress loaded:', progress);
    } catch (error) {
      console.error('❌ Error loading user progress:', error);
      setIsLoadingProgress(false);
    }
  };

  const updateRecommendation = async () => {
    if (!userProgress) return;

    const timeOfDay = getTimeOfDay();
    const recommendation = await getRecommendedExercise({
      timeOfDay,
      userProgress,
      availableExercises: allExercises,
      todaysExercises,
    });

    setRecommendedExercise(recommendation.exercise);
    setSelectedExercise(recommendation.exercise);

    console.log('💡 Recommendation:', recommendation.exercise.name, '-', recommendation.reason);
  };

  const initializeAudio = async () => {
    try {
      console.log('🎹 Initializing audio...');

      const audioService = AudioServiceFactory.create();
      audioServiceRef.current = audioService;

      await audioService.initialize();

      const granted = await audioService.requestPermissions();
      if (!granted) {
        console.error('❌ Microphone permission denied');
        return;
      }

      const sampleRate = audioService.getSampleRate();
      pitchDetectorRef.current = new YINPitchDetector(sampleRate, 2048, 0.1);

      console.log('✅ Audio initialized', {
        initialSampleRate: sampleRate,
        pitchDetectorReady: !!pitchDetectorRef.current
      });
      setIsReady(true);
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
    }
  };

  // NEW: Wrapper that shows countdown first
  const startExercise = () => {
    // Start countdown (3, 2, 1)
    setCountdownActive(true);
    setCountdownSeconds(3);
  };

  // NEW: Actually start the exercise (called after countdown)
  const actuallyStartExercise = async () => {
    setIsRunning(true);
    setResults(null);
    setCurrentNoteIndex(0);
    setCurrentNote(null);
    pitchHistory.clearHistory(); // Reset history for new exercise

    // BREATHING EXERCISE
    if (selectedExercise.type === 'breathing') {
      console.log('🫁 Starting breathing exercise:', selectedExercise.name);

      const engine = new BreathingEngine(selectedExercise);
      breathingEngineRef.current = engine;

      engine.onPhaseChange = (phase, duration, round) => {
        console.log(`🫁 Phase: ${phase}, Duration: ${duration}s, Round: ${round + 1}`);
        setBreathingPhase(phase);
        setBreathingTimeRemaining(duration);
        setBreathingTotalPhaseDuration(duration);
        setCurrentRoundIndex(round);
      };

      engine.onTick = (phase, timeRemaining, round) => {
        setBreathingTimeRemaining(timeRemaining);
      };

      engine.onComplete = async () => {
        console.log('🎉 Breathing exercise complete!');
        setIsRunning(false);

        const results: ExerciseResults = {
          exerciseId: selectedExercise.id,
          completedAt: new Date(),
          duration: selectedExercise.duration,
          overallAccuracy: 100, // Breathing exercises are always "100%" (completed)
          noteResults: [],
          strengths: ['Completed all breathing rounds'],
          improvements: [],
        };

        setResults(results);

        // Save to AsyncStorage
        await saveCompletedExercise(
          selectedExercise.id,
          selectedExercise.name,
          results
        );

        // Reload progress to update streak
        await loadUserProgressData();

        // Flow Mode auto-transition
        if (activeSession && activeSession.isActive) {
          const updatedSession = markExerciseComplete(
            activeSession,
            selectedExercise.id,
            results.overallAccuracy
          );
          setActiveSession(updatedSession);

          const nextEx = getNextExercise(updatedSession);
          if (nextEx) {
            console.log('⏱ Auto-transition in 3 seconds to:', nextEx.name);
            setAutoTransitionCountdown(3);
          } else {
            console.log('✅ Session complete!');
          }
        }
      };

      engine.start();
      return;
    }

    // VOCAL EXERCISE
    if (!audioServiceRef.current || !pitchDetectorRef.current) {
      console.error('❌ Audio not ready');
      setIsRunning(false);
      return;
    }

    try {
      const settings: ExerciseSettings = {
        tempo: selectedExercise.defaultTempo || 60,
        tolerance: 70,
        startingNote: selectedExercise.defaultStartingNote || 'C4',
        repeatCount: 1,
      };

      const engine = new ExerciseEngineV2(
        selectedExercise,
        settings,
        audioServiceRef.current,
        pitchDetectorRef.current
      );

      engineRef.current = engine;

      engine.setOnNoteChange((index, note) => {
        console.log(`📍 Note ${index + 1}: ${note.note}`);
        setCurrentNoteIndex(index);
        setCurrentNote(note);

        // CRITICAL FIX: Update pitch detector with actual sample rate after recording starts
        // This ensures iOS's 48000 Hz is used instead of requested 44100 Hz
        if (index === 0 && audioServiceRef.current && pitchDetectorRef.current) {
          const actualSampleRate = audioServiceRef.current.getSampleRate();
          pitchDetectorRef.current.updateSampleRate(actualSampleRate);
        }
      });

      engine.setOnPitchDetected((frequency, note, accuracyValue, confidenceValue) => {
        setDetectedFrequency(frequency);
        setDetectedNote(note);
        setAccuracy(accuracyValue);
        setConfidence(confidenceValue);

        // Track pitch history for analytics (only if confident)
        if (confidenceValue > 0.5 && currentNote) {
          const centsOff = 1200 * Math.log2(frequency / currentNote.frequency);
          pitchHistory.addReading({
            note,
            frequency,
            accuracy: accuracyValue,
            centsOff,
          });
        }
      });

      engine.setOnComplete(async (exerciseResults) => {
        console.log('🎉 Exercise completed!', exerciseResults);
        setIsRunning(false);
        setResults(exerciseResults);

        // NEW: Save to AsyncStorage
        await saveCompletedExercise(
          selectedExercise.id,
          selectedExercise.name,
          exerciseResults
        );

        // Reload progress to update streak
        await loadUserProgressData();

        // NEW: Flow Mode - Update session and start auto-transition countdown
        if (activeSession && activeSession.isActive) {
          const updatedSession = markExerciseComplete(
            activeSession,
            selectedExercise.id,
            exerciseResults.overallAccuracy
          );
          setActiveSession(updatedSession);

          // Check if there's a next exercise
          const nextEx = getNextExercise(updatedSession);
          if (nextEx) {
            // Start 3-second countdown before auto-transitioning
            console.log('⏱ Auto-transition in 3 seconds to:', nextEx.name);
            setAutoTransitionCountdown(3);
          } else {
            // Session complete
            console.log('✅ Session complete!');
          }
        }
      });

      engine.setOnError((error) => {
        console.error('❌ Exercise error:', error);
        setIsRunning(false);
      });

      await engine.start();
    } catch (error) {
      console.error('❌ Failed to start exercise:', error);
      setIsRunning(false);
    }
  };

  const stopExercise = async () => {
    if (engineRef.current) {
      await engineRef.current.stop();
      setIsRunning(false);
    }
    // NEW: Stop breathing engine
    if (breathingEngineRef.current) {
      breathingEngineRef.current.stop();
      setIsRunning(false);
    }
  };

  const cleanup = () => {
    if (audioServiceRef.current) {
      audioServiceRef.current.dispose();
      audioServiceRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    // NEW: Cleanup breathing engine
    if (breathingEngineRef.current) {
      breathingEngineRef.current.stop();
      breathingEngineRef.current = null;
    }
  };

  const handleProfilePress = () => {
    // TODO: Navigate to profile/settings screen
    console.log('Profile pressed');
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowPreview(true); // Show preview instead of starting immediately
  };

  const handlePreviewStart = () => {
    setShowPreview(false);
    startExercise();
  };

  const handlePreviewBack = () => {
    setShowPreview(false);
  };

  const handleQuickStart = () => {
    setShowPreview(true); // Show preview for recommended exercise
  };

  // NEW: Start a practice session (Flow Mode)
  const handleStartSession = async () => {
    if (!userProgress) return;

    console.log('🎯 Building practice session...');
    const session = await buildPracticeSession(userProgress, allExercises, 15);
    console.log('✅ Session built:', session.exercises.length, 'exercises, ~', session.totalDuration, 'min');

    setActiveSession(session);

    // Auto-select first exercise and start
    const firstExercise = getNextExercise(session);
    if (firstExercise) {
      setSelectedExercise(firstExercise);
      startExercise();
    }
  };

  // NEW: Cancel countdown and skip to next exercise
  const handleSkipCountdown = () => {
    if (autoTransitionCountdown !== null) {
      setAutoTransitionCountdown(0); // Trigger immediate transition
    }
  };

  // NEW: End session early
  const handleEndSession = () => {
    if (activeSession) {
      const endedSession = endSession(activeSession);
      setActiveSession(endedSession);
      setAutoTransitionCountdown(null);
      console.log('⏹ Session ended early');
    }
  };

  const handleTryAgain = () => {
    setResults(null);
    setAutoTransitionCountdown(null); // Cancel any countdown
  };

  // ============================================
  // RENDER: RESULTS SCREEN (Enhanced with storytelling)
  // ============================================
  if (results) {
    const encouragingMsg = generateEncouragingMessage(results);

    // Calculate progress stats for storytelling
    const passedCount = results.noteResults.filter(n => n.passed).length;
    const totalNotes = results.noteResults.length;
    const progressText = totalNotes > 0
      ? `You hit ${passedCount} out of ${totalNotes} notes accurately`
      : "You completed all breathing rounds";

    // Determine next recommended exercise
    const getNextRecommendation = (): string => {
      if (results.overallAccuracy >= 85) {
        // Doing great - suggest next level
        if (selectedExercise.difficulty === 'beginner') {
          return "Ready for: Try an intermediate exercise";
        } else {
          return "Next: Challenge yourself with a harder exercise";
        }
      } else if (results.overallAccuracy >= 70) {
        // Solid - suggest similar
        return `Practice again: ${selectedExercise.name} to build consistency`;
      } else {
        // Struggling - suggest foundation
        if (selectedExercise.type === 'vocal') {
          return "Foundation: Start with Diaphragmatic Breathing";
        } else {
          return `Keep practicing: ${selectedExercise.name}`;
        }
      }
    };

    const nextRecommendation = getNextRecommendation();

    return (
      <View style={[styles.container, { backgroundColor: DS.colors.background.primary }]}>
        <StatusBar barStyle="light-content" />

        <CelebrationConfetti trigger={true} accuracy={results.overallAccuracy} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.celebrationTitle, DS.typography.largeTitle, { color: DS.colors.text.primary }]}>
            {encouragingMsg.title}
          </Text>

          {/* Pitch History Graph - Visual timeline of performance */}
          {selectedExercise.type === 'vocal' && pitchHistory.history.length > 0 && (
            <PitchHistoryGraph
              history={pitchHistory.history}
              maxBars={30}
              height={140}
            />
          )}

          {/* Session Stats Cards - Key performance metrics */}
          {selectedExercise.type === 'vocal' && pitchHistory.stats.totalReadings > 0 && (
            <SessionStatsCards stats={pitchHistory.stats} />
          )}

          <View style={styles.resultsCard}>
            <Text style={[styles.scoreText, { color: DS.colors.accent.success }]}>
              {results.overallAccuracy}%
            </Text>

            {/* Progress Story */}
            <Text style={[styles.progressText, DS.typography.body, { color: DS.colors.text.tertiary }]}>
              {progressText}
            </Text>

            <Text style={[styles.encouragingText, DS.typography.callout, { color: DS.colors.text.secondary }]}>
              {encouragingMsg.subtitle}
            </Text>

            {encouragingMsg.improvement && (
              <Text style={[styles.improvementText, DS.typography.footnote, { color: DS.colors.accent.warning }]}>
                💡 {encouragingMsg.improvement}
              </Text>
            )}

            {/* What's Next */}
            <View style={[styles.nextCard, { backgroundColor: `${DS.colors.accent.primary}15` }]}>
              <Text style={[styles.nextTitle, DS.typography.headline, { color: DS.colors.accent.primary }]}>
                What's Next?
              </Text>
              <Text style={[styles.nextText, DS.typography.body, { color: DS.colors.text.secondary }]}>
                {nextRecommendation}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={[styles.sectionTitle, DS.typography.title3, { color: DS.colors.text.primary }]}>
              Results by Note
            </Text>
            {results.noteResults.map((result, idx) => (
              <View key={idx} style={styles.noteResultRow}>
                <Text style={[styles.noteText, DS.typography.body, { color: DS.colors.text.primary }]}>
                  {result.noteExpected}
                </Text>
                <Text style={[DS.typography.body, {
                  color: result.passed ? DS.colors.accent.success : DS.colors.accent.error
                }]}>
                  {result.averageAccuracy}% {result.passed ? '✓' : '✗'}
                </Text>
              </View>
            ))}

            {results.strengths.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.sectionTitle, DS.typography.title3, { color: DS.colors.text.primary }]}>
                  Strengths
                </Text>
                {results.strengths.map((strength, idx) => (
                  <Text key={idx} style={[styles.feedbackText, DS.typography.callout, { color: DS.colors.text.secondary }]}>
                    • {strength}
                  </Text>
                ))}
              </>
            )}

            {results.improvements.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.sectionTitle, DS.typography.title3, { color: DS.colors.text.primary }]}>
                  Areas to Improve
                </Text>
                {results.improvements.map((improvement, idx) => (
                  <Text key={idx} style={[styles.feedbackText, DS.typography.callout, { color: DS.colors.text.secondary }]}>
                    • {improvement}
                  </Text>
                ))}
              </>
            )}
          </View>

          {/* NEW: Auto-transition countdown (Flow Mode) */}
          {autoTransitionCountdown !== null && activeSession && (
            <View style={{
              backgroundColor: DS.colors.accent.primary,
              padding: DS.spacing.lg,
              margin: DS.spacing.lg,
              borderRadius: DS.radius.xl,
              alignItems: 'center',
            }}>
              <Text style={[DS.typography.title2, { color: DS.colors.text.primary, marginBottom: DS.spacing.xs }]}>
                Next Exercise in {autoTransitionCountdown}...
              </Text>
              <Text style={[DS.typography.callout, { color: DS.colors.text.secondary, marginBottom: DS.spacing.md }]}>
                {getNextExercise(activeSession)?.name || 'Loading...'}
              </Text>
              <View style={[styles.button, { backgroundColor: DS.colors.background.secondary }]} onTouchEnd={handleSkipCountdown}>
                <Text style={[styles.buttonText, { color: DS.colors.text.primary }]}>
                  Skip Wait →
                </Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1 }} />
            <View style={{ flex: 1, paddingLeft: DS.spacing.sm }}>
              <View style={[styles.button, styles.buttonPrimary]}>
                <Text
                  style={[styles.buttonText, { color: DS.colors.text.primary }]}
                  onPress={handleTryAgain}
                >
                  {activeSession && activeSession.isActive ? 'Back to Home' : 'Continue Practicing'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ============================================
  // RENDER: IN PROGRESS
  // ============================================
  if (isRunning) {
    // NEW: Get session progress
    const sessionProgress = activeSession ? getSessionProgress(activeSession) : null;

    return (
      <View style={[styles.container, { backgroundColor: DS.colors.background.primary }]}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1 }}>
          {/* NEW: Session progress bar */}
          {sessionProgress && activeSession && (
            <View style={{
              backgroundColor: DS.colors.background.secondary,
              paddingHorizontal: DS.spacing.lg,
              paddingVertical: DS.spacing.sm,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: DS.spacing.xs }}>
                <Text style={[DS.typography.caption1, { color: DS.colors.text.tertiary }]}>
                  Exercise {sessionProgress.current + 1} of {sessionProgress.total}
                </Text>
                <Text style={[DS.typography.caption1, { color: DS.colors.text.tertiary }]}>
                  {sessionProgress.timeElapsed} min
                </Text>
              </View>
              <View style={{
                height: 4,
                backgroundColor: DS.colors.background.tertiary,
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  width: `${sessionProgress.percentComplete}%`,
                  height: '100%',
                  backgroundColor: DS.colors.accent.primary,
                }} />
              </View>
            </View>
          )}

          {/* Exercise content - BREATHING or VOCAL */}
          {selectedExercise.type === 'breathing' ? (
            // BREATHING VISUALIZER
            <BreathingVisualizer
              phase={breathingPhase}
              timeRemaining={breathingTimeRemaining}
              totalPhaseDuration={breathingTotalPhaseDuration}
              currentRound={currentRoundIndex}
              totalRounds={selectedExercise.breathingRounds?.length || 1}
            />
          ) : (
            // VOCAL EXERCISE UI
            <>
              <View style={styles.header}>
                <Text style={[DS.typography.title2, { color: DS.colors.text.primary }]}>
                  {selectedExercise.name}
                </Text>
                <Text style={[DS.typography.callout, { color: DS.colors.text.secondary, marginTop: DS.spacing.xs }]}>
                  Note {currentNoteIndex + 1} of {selectedExercise.notes?.length || 0}
                </Text>
              </View>

              {/* Pitch Visualizer */}
              {currentNote && selectedExercise.notes && (
                <View style={styles.visualizerContainer}>
                  <PitchScaleVisualizer
                    notes={selectedExercise.notes}
                    targetNote={currentNote}
                    detectedFrequency={detectedFrequency}
                    confidence={confidence}
                  />
                </View>
              )}
            </>
          )}

          {/* Stop button */}
          <View style={styles.stopButtonContainer}>
            <View style={[styles.button, styles.buttonDanger]} onTouchEnd={activeSession ? handleEndSession : stopExercise}>
              <Text style={[styles.buttonText, { color: DS.colors.text.primary }]}>
                {activeSession ? '⏹ End Session' : '⏹ Stop Exercise'}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================
  // RENDER: PRE-EXERCISE COUNTDOWN
  // ============================================
  if (countdownActive) {
    const getCountdownMessage = () => {
      if (countdownSeconds === 3) return "Get ready...";
      if (countdownSeconds === 2) return `First ${selectedExercise.type === 'vocal' ? 'note' : 'round'}: ${selectedExercise.type === 'vocal' && selectedExercise.notes ? selectedExercise.notes[0].note : 'Inhale'}`;
      if (countdownSeconds === 1) return "Listen, then sing!";
      return "";
    };

    return (
      <View style={[styles.container, { backgroundColor: DS.colors.background.primary }]}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>{countdownSeconds}</Text>
            <Text style={styles.countdownMessage}>{getCountdownMessage()}</Text>
            <Text style={styles.countdownHint}>
              {selectedExercise.type === 'vocal' ? '🎧 Have your headphones on' : '🧘 Sit with straight posture'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================
  // RENDER: EXERCISE PREVIEW
  // ============================================
  if (showPreview) {
    return (
      <ExercisePreview
        exercise={selectedExercise}
        onStart={handlePreviewStart}
        onBack={handlePreviewBack}
      />
    );
  }

  // ============================================
  // RENDER: HOME SCREEN - REDESIGNED!
  // ============================================
  const timeOfDay = getTimeOfDay();
  const greetingText = userProgress ? getGreeting(timeOfDay, userProgress.userName) : 'Hello 👋';
  const subtextText = userProgress
    ? getMotivationalSubtext(timeOfDay, userProgress.currentStreak, userProgress.weeksSinceFirstUse === 0)
    : "Let's get started!";
  const reasonText = userProgress
    ? getRecommendationReasonText(recommendedExercise, timeOfDay, userProgress)
    : "Perfect way to start practicing";

  return (
    <View style={[styles.container, { backgroundColor: DS.colors.background.primary }]}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.homeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with streak */}
          <Header
            streak={userProgress?.currentStreak || 0}
            onProfilePress={handleProfilePress}
          />

          {/* Greeting */}
          <Greeting
            greetingText={greetingText}
            subtextText={subtextText}
          />

          {/* Journey Progress */}
          {userProgress && (
            <JourneyProgress
              currentWeek={getCurrentWeek(userProgress.startDate)}
              daysThisWeek={todaysExercises.length}
            />
          )}

          {/* Hero Card - Main recommendation */}
          <HeroCard
            exercise={recommendedExercise}
            onStart={handleQuickStart}
            reasonText={reasonText}
            isReady={isReady}
          />

          {/* Explore More - Collapsible section */}
          <ExploreSection
            exercises={allExercises}
            isExpanded={isExploreExpanded}
            onToggle={() => setIsExploreExpanded(!isExploreExpanded)}
            onSelectExercise={handleExerciseSelect}
            selectedExerciseId={selectedExercise.id}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  homeScrollContent: {
    flexGrow: 1,
    paddingBottom: DS.spacing.xxxl,
  },

  scrollContent: {
    padding: DS.spacing.xl,
  },

  header: {
    padding: DS.spacing.xl,
    alignItems: 'center',
  },

  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stopButtonContainer: {
    padding: DS.spacing.xl,
  },

  // Countdown screen
  countdownContainer: {
    alignItems: 'center',
    paddingHorizontal: DS.spacing.xl,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: '700',
    color: DS.colors.accent.primary,
    marginBottom: DS.spacing.xl,
  },
  countdownMessage: {
    ...DS.typography.title2,
    color: DS.colors.text.primary,
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  countdownHint: {
    ...DS.typography.body,
    color: DS.colors.text.tertiary,
    textAlign: 'center',
  },

  // Results screen (keep existing styles)
  celebrationTitle: {
    textAlign: 'center',
    marginBottom: DS.spacing.xl,
  },

  resultsCard: {
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.xl,
    ...DS.shadows.md,
  },

  scoreText: {
    fontSize: 72,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DS.spacing.md,
  },

  progressText: {
    textAlign: 'center',
    marginBottom: DS.spacing.md,
  },

  encouragingText: {
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },

  improvementText: {
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
    padding: DS.spacing.md,
    backgroundColor: `${DS.colors.accent.warning}20`,
    borderRadius: DS.radius.md,
  },

  // What's Next card
  nextCard: {
    padding: DS.spacing.lg,
    borderRadius: DS.radius.lg,
    marginBottom: DS.spacing.lg,
  },
  nextTitle: {
    fontWeight: '600',
    marginBottom: DS.spacing.sm,
  },
  nextText: {
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: DS.colors.background.tertiary,
    marginVertical: DS.spacing.lg,
  },

  sectionTitle: {
    marginBottom: DS.spacing.md,
  },

  noteResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: DS.spacing.sm,
  },

  noteText: {},

  feedbackText: {
    paddingVertical: DS.spacing.xs,
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: DS.spacing.xl,
  },

  button: {
    paddingVertical: DS.spacing.lg,
    paddingHorizontal: DS.spacing.xl,
    borderRadius: DS.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPrimary: {
    backgroundColor: DS.colors.accent.primary,
    ...DS.shadows.md,
  },

  buttonSecondary: {
    backgroundColor: DS.colors.background.tertiary,
  },

  buttonDanger: {
    backgroundColor: DS.colors.accent.error,
    ...DS.shadows.md,
  },

  buttonText: {
    ...DS.typography.headline,
    fontWeight: '600',
  },
});
