/**
 * Exercise Engine
 *
 * Manages the flow of vocal exercises:
 * - Plays reference piano notes
 * - Tracks user pitch accuracy
 * - Provides voice feedback
 * - Controls exercise progression
 * - Collects session data for persistence
 */

import { Audio } from 'expo-av';
import {
  Exercise,
  ExerciseNote,
  DailyWorkout,
  getDefaultWorkout,
  BreathingExercise,
  getDefaultBreathingExercise,
  NOTE_FREQUENCIES,
} from '../data/exercises';
import { SessionRecord, NoteAttempt, UserProgress } from '../types/userProgress';
import { generateRealTimeCoachingTip } from '../../services/claudeAI';
import { frequencyToNote } from '../utils/audioUtils';
import { VoiceCoach, VoicePreferences } from '../services/voiceCoaching';
import {
  getAdaptedExercise,
  recommendChallengeLevel,
  ComfortableRange,
  analyzeComfortableRange,
  getAdaptationInfo,
  AdaptationInfo,
} from '../services/exerciseAdaptation';

// Exercise state (Natural Vocal Coach flow)
export type ExerciseState =
  | 'idle'
  | 'demonstrating'     // NEW - coach showing full pattern
  | 'playing_reference'
  | 'countdown'
  | 'listening'
  | 'evaluating'
  | 'full_pattern'      // NEW - user attempts full pattern
  | 'complete'
  | 'breathing';

// Breathing state for UI
export interface BreathingState {
  phase: 'inhale' | 'hold' | 'exhale';
  timeRemaining: number;
  cycle: number;
  totalCycles: number;
}

// Callback types
export interface ExerciseCallbacks {
  onStateChange?: (state: ExerciseState) => void;
  onTargetNoteChange?: (note: ExerciseNote | null) => void;
  onExerciseComplete?: (exercise: Exercise, accuracy: number) => void;
  onWorkoutComplete?: (totalAccuracy: number) => void;
  onSessionComplete?: (session: SessionRecord) => void;
  onFeedback?: (message: string) => void;
  onBreathingUpdate?: (state: BreathingState | null) => void;
  onCountdownUpdate?: (count: number | null) => void; // For 3..2..1 countdown
  onAICoaching?: (tip: string) => void;
  onRangeAnalysis?: (range: ComfortableRange | null) => void;
  onWorkoutAdapted?: (adaptationInfo: AdaptationInfo[]) => void;
  // Natural Vocal Coach callbacks
  onDemonstrationStart?: (exercise: Exercise, notes: ExerciseNote[]) => void;
  onDemoNoteChange?: (noteIndex: number) => void; // Which note in demo is playing
  onFullPatternStart?: (exercise: Exercise) => void;
  onFullPatternComplete?: (accuracy: number) => void;
}

// Piano samples mapping
const pianoSamples: Record<string, any> = {
  'C3': require('../../assets/audio/piano/C3.aiff'),
  'D3': require('../../assets/audio/piano/D3.aiff'),
  'E3': require('../../assets/audio/piano/E3.aiff'),
  'F3': require('../../assets/audio/piano/F3.aiff'),
  'G3': require('../../assets/audio/piano/G3.aiff'),
  'A3': require('../../assets/audio/piano/A3.aiff'),
  'B3': require('../../assets/audio/piano/B3.aiff'),
  'C4': require('../../assets/audio/piano/C4.aiff'),
  'D4': require('../../assets/audio/piano/D4.aiff'),
  'E4': require('../../assets/audio/piano/E4.aiff'),
  'F4': require('../../assets/audio/piano/F4.aiff'),
  'G4': require('../../assets/audio/piano/G4.aiff'),
  'A4': require('../../assets/audio/piano/A4.aiff'),
  'B4': require('../../assets/audio/piano/B4.aiff'),
  'C5': require('../../assets/audio/piano/C5.aiff'),
  'D5': require('../../assets/audio/piano/D5.aiff'),
  'E5': require('../../assets/audio/piano/E5.aiff'),
  'F5': require('../../assets/audio/piano/F5.aiff'),
  'G5': require('../../assets/audio/piano/G5.aiff'),
  'A5': require('../../assets/audio/piano/A5.aiff'),
  'B5': require('../../assets/audio/piano/B5.aiff'),
  'C6': require('../../assets/audio/piano/C6.aiff'),
};

// Get closest available piano sample
const getClosestSample = (note: string): any => {
  // Direct match
  if (pianoSamples[note]) return pianoSamples[note];

  // Strip sharp/flat and try again
  const baseNote = note.replace('#', '').replace('b', '');
  if (pianoSamples[baseNote]) return pianoSamples[baseNote];

  // Default to C4
  return pianoSamples['C4'];
};

// Voice clips mapping (AI-generated natural voices)
const voiceClips: Record<string, any> = {
  // Breathing
  'breathing_intro': require('../../assets/audio/voice/breathing_intro.mp3'),
  'inhale': require('../../assets/audio/voice/inhale.mp3'),
  'hold': require('../../assets/audio/voice/hold.mp3'),
  'exhale': require('../../assets/audio/voice/exhale.mp3'),
  'breathing_complete': require('../../assets/audio/voice/breathing_complete.mp3'),

  // Workouts
  'workout_intro': require('../../assets/audio/voice/workout_intro.mp3'),
  'warmup_scale': require('../../assets/audio/voice/warmup_scale.mp3'),
  'descending_scale': require('../../assets/audio/voice/descending_scale.mp3'),
  'major_arpeggio': require('../../assets/audio/voice/major_arpeggio.mp3'),
  'octave_jump': require('../../assets/audio/voice/octave_jump.mp3'),
  'siren': require('../../assets/audio/voice/siren.mp3'),
  'extended_range': require('../../assets/audio/voice/extended_range.mp3'),
  'next_exercise': require('../../assets/audio/voice/next_exercise.mp3'),
  'workout_complete': require('../../assets/audio/voice/workout_complete.mp3'),

  // Feedback
  'good': require('../../assets/audio/voice/good.mp3'),
  'try_match_pitch': require('../../assets/audio/voice/try_match_pitch.mp3'),
};

// Exercise ID to voice clip mapping (for vocal demonstrations)
// These map exercise IDs to their corresponding vocal demonstration clips
const exerciseVoiceClips: Record<string, string> = {
  'warmup_scale': 'warmup_scale',
  'descending_scale': 'descending_scale',
  'major_arpeggio': 'major_arpeggio',
  'octave_jump': 'octave_jump',
  'siren': 'siren',
  'extended_range': 'extended_range',
};

// Helper: Generate UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class ExerciseEngine {
  private state: ExerciseState = 'idle';
  private currentWorkout: DailyWorkout | null = null;
  private currentExerciseIndex: number = 0;
  private currentNoteIndex: number = 0;
  private callbacks: ExerciseCallbacks = {};
  private soundRef: Audio.Sound | null = null;
  private voiceSoundRef: Audio.Sound | null = null;
  private pianoVolume: number = 0.85; // 85% default
  private voiceVolume: number = 0.90; // 90% default
  private voicePreferences: VoicePreferences = { enabled: true, speed: 0.9, pitch: 1.0 };
  private pitchSamples: number[] = [];
  private isRunning: boolean = false;
  private noteTimeout: NodeJS.Timeout | null = null;

  // Breathing exercise state
  private currentBreathingExercise: BreathingExercise | null = null;
  private currentCycle: number = 0;
  private currentPhaseIndex: number = 0;
  private breathingInterval: NodeJS.Timeout | null = null;
  private autoProgressToWorkout: boolean = false;
  private pendingWorkout: DailyWorkout | null = null;

  // Session tracking
  private sessionStartTime: number = 0;
  private noteAttempts: NoteAttempt[] = [];
  private exerciseAccuracies: number[] = [];
  private allFrequenciesSung: number[] = [];

  // AI Coaching tracking
  private consecutiveLowScores: number = 0;
  private lastAICoachingTime: number = 0;
  private userVocalRange: { lowest: string; highest: string } = { lowest: 'C3', highest: 'C5' };

  // Range adaptation
  private userProgress: UserProgress | null = null;
  private originalWorkout: DailyWorkout | null = null;
  private workoutAdaptationInfo: AdaptationInfo[] = [];

  constructor(
    callbacks: ExerciseCallbacks = {},
    pianoVolume?: number,
    voiceVolume?: number,
    voicePreferences?: VoicePreferences,
    userProgress?: UserProgress
  ) {
    this.callbacks = callbacks;
    if (pianoVolume !== undefined) this.pianoVolume = pianoVolume / 100;
    if (voiceVolume !== undefined) this.voiceVolume = voiceVolume / 100;
    if (voicePreferences) this.voicePreferences = voicePreferences;
    if (userProgress) this.userProgress = userProgress;
  }

  /**
   * Start an integrated workout (breathing + vocal exercises)
   * This is the recommended entry point for a complete practice session.
   */
  async startIntegratedWorkout(
    breathingExercise?: BreathingExercise,
    workout?: DailyWorkout
  ): Promise<void> {
    this.autoProgressToWorkout = true;
    this.pendingWorkout = workout || getDefaultWorkout();
    await this.startBreathingExercise(breathingExercise);
  }

  /**
   * Start a breathing exercise
   */
  async startBreathingExercise(exercise?: BreathingExercise): Promise<void> {
    this.currentBreathingExercise = exercise || getDefaultBreathingExercise();
    this.currentCycle = 1;
    this.currentPhaseIndex = 0;
    this.isRunning = true;
    this.sessionStartTime = Date.now();

    this.setState('breathing');

    // Announce breathing exercise
    await VoiceCoach.startBreathing(this.voicePreferences);
    await this.delay(500);

    // Start first phase
    await this.runBreathingPhase();
  }

  /**
   * Run current breathing phase
   */
  private async runBreathingPhase(): Promise<void> {
    if (!this.currentBreathingExercise || !this.isRunning) return;

    const phase = this.currentBreathingExercise.phases[this.currentPhaseIndex];
    if (!phase) {
      // Cycle complete, start next cycle
      this.currentCycle++;
      if (this.currentCycle <= this.currentBreathingExercise.cycles) {
        this.currentPhaseIndex = 0;
        await this.runBreathingPhase();
      } else {
        // All cycles complete
        await this.completeBreathingExercise();
      }
      return;
    }

    // Announce phase with calming, simple cues
    const clipKey = phase.type === 'inhale' ? 'inhale' :
                    phase.type === 'hold' ? 'hold' : 'exhale';
    await this.playVoiceClip(clipKey);

    // Start countdown
    let timeRemaining = phase.duration;

    // Update UI immediately
    this.callbacks.onBreathingUpdate?.({
      phase: phase.type,
      timeRemaining,
      cycle: this.currentCycle,
      totalCycles: this.currentBreathingExercise.cycles,
    });

    // Countdown interval
    this.breathingInterval = setInterval(async () => {
      timeRemaining--;

      if (timeRemaining <= 0) {
        if (this.breathingInterval) {
          clearInterval(this.breathingInterval);
          this.breathingInterval = null;
        }

        // Move to next phase
        this.currentPhaseIndex++;
        await this.runBreathingPhase();
      } else {
        // Update UI
        this.callbacks.onBreathingUpdate?.({
          phase: phase.type,
          timeRemaining,
          cycle: this.currentCycle,
          totalCycles: this.currentBreathingExercise!.cycles,
        });
      }
    }, 1000);
  }

  /**
   * Complete breathing exercise
   */
  private async completeBreathingExercise(): Promise<void> {
    this.callbacks.onBreathingUpdate?.(null);

    await VoiceCoach.completeBreathing(this.voicePreferences);

    // Check if auto-progressing to workout
    if (this.autoProgressToWorkout && this.pendingWorkout) {
      // Reset flags
      this.autoProgressToWorkout = false;
      const workout = this.pendingWorkout;
      this.pendingWorkout = null;
      this.currentBreathingExercise = null;

      // Brief pause before transitioning
      await this.delay(1000);

      // Start vocal workout (session continues, don't reset sessionStartTime)
      await this.startWorkout(workout, true);
    } else {
      // Standalone breathing session - complete normally
      this.setState('complete');

      const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);

      // Create session record for breathing exercise
      const session: SessionRecord = {
        id: generateUUID(),
        date: new Date().toISOString(),
        exerciseId: this.currentBreathingExercise?.id || 'breathing',
        exerciseName: this.currentBreathingExercise?.name || 'Breathing Exercise',
        duration,
        accuracy: 100, // Breathing exercises are always "complete"
        notesAttempted: 0,
        notesHit: 0,
        noteAttempts: [],
      };

      this.callbacks.onSessionComplete?.(session);
      this.callbacks.onWorkoutComplete?.(100);

      this.isRunning = false;
      this.currentBreathingExercise = null;
    }
  }

  /**
   * Start a workout
   * @param workout - The workout to run (defaults to default workout)
   * @param continueSession - If true, continues current session (for auto-progression)
   */
  async startWorkout(workout?: DailyWorkout, continueSession: boolean = false): Promise<void> {
    const originalWorkout = workout || getDefaultWorkout();
    this.originalWorkout = originalWorkout;
    this.currentExerciseIndex = 0;
    this.currentNoteIndex = 0;
    this.isRunning = true;

    // Only reset session if starting fresh (not continuing from breathing)
    if (!continueSession) {
      this.sessionStartTime = Date.now();
      this.noteAttempts = [];
      this.exerciseAccuracies = [];
      this.allFrequenciesSung = [];
    }

    // Real-time range analysis and exercise adaptation
    if (this.userProgress) {
      const userRange = analyzeComfortableRange(this.userProgress);

      if (userRange) {
        // Notify UI of range analysis
        this.callbacks.onRangeAnalysis?.(userRange);

        // Determine challenge level based on recent performance
        const challengeLevel = recommendChallengeLevel(this.userProgress);

        // Adapt all exercises in the workout
        const adaptedExercises: Exercise[] = [];
        this.workoutAdaptationInfo = [];

        for (const exercise of originalWorkout.exercises) {
          const { exercise: adaptedExercise, transposition, isAdapted } = getAdaptedExercise(
            exercise,
            this.userProgress,
            challengeLevel
          );

          adaptedExercises.push(adaptedExercise);

          // Get adaptation info for display
          const info = getAdaptationInfo(exercise, adaptedExercise, transposition, userRange);
          this.workoutAdaptationInfo.push(info);
        }

        // Create adapted workout
        this.currentWorkout = {
          ...originalWorkout,
          exercises: adaptedExercises,
        };

        // Notify UI of workout adaptation
        this.callbacks.onWorkoutAdapted?.(this.workoutAdaptationInfo);

        // Announce range-adapted workout only if user has enough history and valid range
        const adaptationSummary = this.workoutAdaptationInfo.filter(info => info.isAdapted).length;
        const hasEnoughHistory = this.userProgress?.sessionHistory && this.userProgress.sessionHistory.length >= 3;
        const hasValidRange = userRange.lowestComfortableNote !== userRange.highestComfortableNote;

        if (adaptationSummary > 0 && hasEnoughHistory && hasValidRange) {
          await VoiceCoach.say(
            `I've adapted ${adaptationSummary} exercise${adaptationSummary > 1 ? 's' : ''} to your range, ${userRange.lowestComfortableNote} to ${userRange.highestComfortableNote}. Let's begin!`,
            this.voicePreferences
          );
        } else {
          await VoiceCoach.say("Let's begin your vocal workout!", this.voicePreferences);
        }
      } else {
        // No range data yet - use original workout
        this.currentWorkout = originalWorkout;
        await VoiceCoach.say("Let's begin your vocal workout!", this.voicePreferences);
      }
    } else {
      // No user progress available - use original workout
      this.currentWorkout = originalWorkout;
      await VoiceCoach.say("Let's begin your vocal workout!", this.voicePreferences);
    }

    // Start first exercise
    await this.startExercise();
  }

  /**
   * Start current exercise
   * Natural Vocal Coach flow: Demonstrate -> Practice note-by-note -> Full pattern
   */
  private async startExercise(): Promise<void> {
    if (!this.currentWorkout || !this.isRunning) return;

    const exercise = this.currentWorkout.exercises[this.currentExerciseIndex];
    if (!exercise) {
      await this.completeWorkout();
      return;
    }

    this.currentNoteIndex = 0;

    // Announce exercise with natural voice
    await VoiceCoach.announceExercise(exercise.name, this.voicePreferences);

    // Brief pause before demonstration
    await this.delay(500);

    // NEW: Demonstrate the full exercise first (like a real vocal coach)
    await this.demonstrateExercise(exercise);

    // Now start note-by-note practice
    await this.playNextNote();
  }

  /**
   * Demonstrate the full exercise pattern before user practice
   * Like a real vocal coach: "Watch and listen, I'll show you how it goes"
   */
  private async demonstrateExercise(exercise: Exercise): Promise<void> {
    console.log('[Demo] Starting demonstration for:', exercise.name);
    if (!this.isRunning) {
      console.log('[Demo] SKIPPED - isRunning is false');
      return;
    }

    this.setState('demonstrating');
    console.log('[Demo] State set to demonstrating');
    this.callbacks.onDemonstrationStart?.(exercise, exercise.notes);

    // 1. Play all notes on piano in sequence (quick succession)
    for (let i = 0; i < exercise.notes.length; i++) {
      if (!this.isRunning) return;
      const note = exercise.notes[i];
      this.callbacks.onDemoNoteChange?.(i);
      await this.playPianoNoteQuick(note.note);
      await this.delay(300); // Quick succession
    }

    // 2. Play vocal demonstration if available
    const voiceClipKey = exerciseVoiceClips[exercise.id];
    console.log('[Demo] Voice clip key for', exercise.id, ':', voiceClipKey);
    if (voiceClipKey) {
      await this.delay(500);
      console.log('[Demo] Playing voice clip:', voiceClipKey);
      await this.playVoiceClip(voiceClipKey);
    }

    // 3. "Your turn!" cue
    console.log('[Demo] About to say "Your turn!"');
    await this.delay(500);
    await VoiceCoach.say("Your turn!", this.voicePreferences);
    console.log('[Demo] Demonstration complete');
    await this.delay(800);
  }

  /**
   * Play a piano note quickly (for demonstration, shorter than normal)
   */
  private async playPianoNoteQuick(noteName: string): Promise<void> {
    try {
      // Stop previous sound
      if (this.soundRef) {
        await this.soundRef.stopAsync();
        await this.soundRef.unloadAsync();
      }

      const sample = getClosestSample(noteName);
      const { sound } = await Audio.Sound.createAsync(
        sample,
        { shouldPlay: false, volume: this.pianoVolume }
      );
      this.soundRef = sound;
      await sound.playAsync();

      // Wait just enough to hear the note (shorter for demo)
      await this.delay(400);
    } catch (error) {
      console.error('Failed to play piano note (demo):', error);
    }
  }

  /**
   * Play the next note in the exercise
   */
  private async playNextNote(): Promise<void> {
    if (!this.currentWorkout || !this.isRunning) return;

    const exercise = this.currentWorkout.exercises[this.currentExerciseIndex];
    if (!exercise) return;

    const note = exercise.notes[this.currentNoteIndex];
    if (!note) {
      // Exercise complete
      await this.completeExercise();
      return;
    }

    // Update state
    this.setState('playing_reference');
    this.callbacks.onTargetNoteChange?.(note);

    // Play piano reference
    await this.playPianoNote(note.note);

    // Visual countdown before listening (3...2...1...)
    await this.runCountdown(3);

    // Switch to listening mode
    this.setState('listening');
    this.callbacks.onCountdownUpdate?.(null); // Clear countdown
    this.pitchSamples = [];

    // Listen for the note duration
    this.noteTimeout = setTimeout(async () => {
      await this.evaluateNote(note);
    }, note.duration * 1000);
  }

  /**
   * Run visual countdown before singing phase
   */
  private async runCountdown(seconds: number): Promise<void> {
    if (!this.isRunning) return;

    this.setState('countdown');

    for (let i = seconds; i >= 1; i--) {
      if (!this.isRunning) return;
      this.callbacks.onCountdownUpdate?.(i);
      await this.delay(1000); // Full second for better UX - gives time to prepare
    }
  }

  /**
   * Play a piano note (Phase 4: Use actual audio duration)
   */
  private async playPianoNote(noteName: string): Promise<void> {
    try {
      // Stop previous sound
      if (this.soundRef) {
        await this.soundRef.stopAsync();
        await this.soundRef.unloadAsync();
      }

      const sample = getClosestSample(noteName);
      const { sound, status } = await Audio.Sound.createAsync(
        sample,
        { shouldPlay: false, volume: this.pianoVolume }
      );
      this.soundRef = sound;
      await sound.playAsync();

      // Use actual audio duration instead of fixed 800ms (Phase 4 fix)
      const actualDuration = status.isLoaded && status.durationMillis
        ? status.durationMillis
        : 800;
      // Wait for piano to play, with a 100ms buffer for smooth transition
      await this.delay(Math.min(actualDuration, 1200) + 100);
    } catch (error) {
      console.error('Failed to play piano note:', error);
    }
  }

  /**
   * Record a pitch sample from the user
   * Call this from the pitch detector callback
   * Phase 7: Increased confidence threshold from 0.3 to 0.5 to filter background noise
   */
  recordPitch(frequency: number, confidence: number): void {
    if (this.state === 'listening' && confidence > 0.5) {
      this.pitchSamples.push(frequency);
      this.allFrequenciesSung.push(frequency);
    }
  }

  /**
   * Evaluate the user's pitch for the current note
   */
  private async evaluateNote(targetNote: ExerciseNote): Promise<void> {
    if (!this.isRunning) return;

    this.setState('evaluating');

    // Calculate accuracy
    const accuracy = this.calculateAccuracy(targetNote.frequency);
    const avgFrequency = this.pitchSamples.length > 0
      ? this.pitchSamples.reduce((a, b) => a + b, 0) / this.pitchSamples.length
      : 0;

    // Record note attempt
    const attempt: NoteAttempt = {
      note: targetNote.note,
      targetFrequency: targetNote.frequency,
      actualFrequency: avgFrequency,
      accuracy,
      duration: targetNote.duration,
      timestamp: Date.now(),
    };
    this.noteAttempts.push(attempt);

    // Update vocal range
    if (avgFrequency > 0) {
      const noteName = frequencyToNote(avgFrequency);
      // Only update range if frequency conversion was valid
      if (noteName) {
        if (avgFrequency < NOTE_FREQUENCIES[this.userVocalRange.lowest] || this.userVocalRange.lowest === 'C4') {
          this.userVocalRange.lowest = noteName;
        }
        if (avgFrequency > NOTE_FREQUENCIES[this.userVocalRange.highest] || this.userVocalRange.highest === 'C4') {
          this.userVocalRange.highest = noteName;
        }
      }
    }

    // Track consecutive low scores for AI coaching
    if (accuracy < 60) {
      this.consecutiveLowScores++;
    } else {
      this.consecutiveLowScores = 0;
    }

    // Provide feedback based on accuracy (Phase 6: Improved feedback messages)
    const userNote = avgFrequency > 0 ? frequencyToNote(avgFrequency) : null;
    const isFlat = avgFrequency < targetNote.frequency;
    const centsOff = avgFrequency > 0
      ? Math.round(Math.abs(1200 * Math.log2(avgFrequency / targetNote.frequency)))
      : 0;

    if (accuracy >= 90) {
      // Great job - give positive feedback
      this.callbacks.onFeedback?.('Perfect!');
      await VoiceCoach.provideFeedback(accuracy, targetNote.note, this.voicePreferences);
    } else if (accuracy >= 70) {
      // Good - brief encouragement with direction
      const direction = isFlat ? 'slightly higher' : 'slightly lower';
      this.callbacks.onFeedback?.(`Good! Aim ${direction}`);
      if (Math.random() < 0.3) {
        await VoiceCoach.provideFeedback(accuracy, targetNote.note, this.voicePreferences);
      }
    } else if (accuracy >= 50) {
      // Needs work - provide specific guidance
      const direction = isFlat ? 'higher ↑' : 'lower ↓';
      const feedbackMsg = userNote
        ? `You sang ${userNote} - aim ${direction} for ${targetNote.note}`
        : `Aim ${direction} for ${targetNote.note}`;
      this.callbacks.onFeedback?.(feedbackMsg);
      await VoiceCoach.provideFeedback(accuracy, targetNote.note, this.voicePreferences);
    } else {
      // Poor - gentle correction with specific info
      const direction = isFlat ? '↑' : '↓';
      const feedbackMsg = userNote && centsOff > 0
        ? `${userNote} → ${targetNote.note} ${direction}`
        : `Aim for ${targetNote.note}`;
      this.callbacks.onFeedback?.(feedbackMsg);
      await VoiceCoach.provideFeedback(accuracy, targetNote.note, this.voicePreferences);
    }

    // Request AI coaching if struggling (3+ consecutive low scores)
    await this.checkForAICoaching(accuracy, targetNote.note);

    // Move to next note (UX fix: Increased to 800ms for breathing room)
    this.currentNoteIndex++;
    await this.delay(800);
    await this.playNextNote();
  }

  /**
   * Check if AI coaching should be triggered
   */
  private async checkForAICoaching(currentAccuracy: number, targetNote: string): Promise<void> {
    // Only trigger if:
    // 1. User is struggling (3+ consecutive low scores)
    // 2. Haven't requested coaching recently (20 seconds minimum)
    const now = Date.now();
    if (this.consecutiveLowScores >= 3 && now - this.lastAICoachingTime > 20000) {
      this.lastAICoachingTime = now;

      // Request AI coaching tip (non-blocking)
      generateRealTimeCoachingTip(
        this.consecutiveLowScores,
        currentAccuracy,
        targetNote,
        this.userVocalRange
      ).then(async tip => {
        if (tip && this.isRunning) {
          this.callbacks.onAICoaching?.(tip);
          // Speak the AI coaching tip
          await VoiceCoach.speakCoachingTip(tip, this.voicePreferences);
        }
      }).catch(error => {
        console.error('Failed to get AI coaching:', error);
      });
    }
  }

  /**
   * Calculate accuracy based on pitch samples
   */
  private calculateAccuracy(targetFrequency: number): number {
    if (this.pitchSamples.length === 0) return 0;

    // Calculate average frequency
    const avgFrequency = this.pitchSamples.reduce((a, b) => a + b, 0) / this.pitchSamples.length;

    // Calculate cents difference
    const centsDiff = Math.abs(1200 * Math.log2(avgFrequency / targetFrequency));

    // Convert to accuracy (0-100)
    // 0 cents = 100%, 50 cents = 50%, 100+ cents = 0%
    const accuracy = Math.max(0, 100 - centsDiff);

    return accuracy;
  }

  /**
   * Complete current exercise
   * Natural Vocal Coach flow: After note-by-note practice, attempt full pattern
   */
  private async completeExercise(): Promise<void> {
    if (!this.currentWorkout) return;

    const exercise = this.currentWorkout.exercises[this.currentExerciseIndex];

    // Calculate note-by-note practice accuracy
    const exerciseNotes = exercise.notes.length;
    const startIndex = this.noteAttempts.length - exerciseNotes;
    const exerciseAttempts = this.noteAttempts.slice(startIndex >= 0 ? startIndex : 0);

    const practiceAccuracy = exerciseAttempts.length > 0
      ? Math.round(exerciseAttempts.reduce((sum, a) => sum + a.accuracy, 0) / exerciseAttempts.length)
      : 0;

    // NEW: Now attempt the full pattern ("Put it all together!")
    const patternAccuracy = await this.attemptFullPattern(exercise);

    // Combine practice and pattern accuracy (weighted: 60% practice, 40% full pattern)
    const combinedAccuracy = Math.round(practiceAccuracy * 0.6 + patternAccuracy * 0.4);

    this.exerciseAccuracies.push(combinedAccuracy);
    this.callbacks.onExerciseComplete?.(exercise, combinedAccuracy);

    // Move to next exercise
    this.currentExerciseIndex++;

    if (this.currentExerciseIndex < this.currentWorkout.exercises.length) {
      await this.delay(1000);
      await VoiceCoach.nextExercise(this.voicePreferences);
      await this.delay(500);
      await this.startExercise();
    } else {
      await this.completeWorkout();
    }
  }

  /**
   * Full pattern attempt - user sings the entire exercise in one go
   * "Now put it all together!"
   */
  private async attemptFullPattern(exercise: Exercise): Promise<number> {
    if (!this.isRunning) return 0;

    this.setState('full_pattern');
    this.callbacks.onFullPatternStart?.(exercise);

    // Announce the full pattern attempt
    await VoiceCoach.say("Now put it all together!", this.voicePreferences);
    await this.delay(500);

    // Play reference pattern once more (quick)
    for (let i = 0; i < exercise.notes.length; i++) {
      if (!this.isRunning) return 0;
      this.callbacks.onDemoNoteChange?.(i);
      await this.playPianoNoteQuick(exercise.notes[i].note);
      await this.delay(200);
    }

    await this.delay(300);
    await VoiceCoach.say("Sing!", this.voicePreferences);
    await this.delay(500);

    // Listen for full pattern duration
    const totalDuration = exercise.notes.reduce((sum, n) => sum + n.duration, 0);
    this.pitchSamples = [];

    // Record pitch during full pattern attempt
    await new Promise<void>((resolve) => {
      this.noteTimeout = setTimeout(() => {
        resolve();
      }, totalDuration * 1000);
    });

    // Evaluate the full pattern
    // Calculate accuracy against all target frequencies in sequence
    const patternAccuracy = this.evaluateFullPattern(exercise);

    // Provide feedback
    this.callbacks.onFullPatternComplete?.(patternAccuracy);

    if (patternAccuracy >= 80) {
      this.callbacks.onFeedback?.(`Excellent! ${patternAccuracy}% on the full pattern!`);
      await VoiceCoach.provideFeedback(patternAccuracy, exercise.name, this.voicePreferences);
    } else if (patternAccuracy >= 60) {
      this.callbacks.onFeedback?.(`Good effort! ${patternAccuracy}% - keep practicing`);
      await VoiceCoach.provideFeedback(patternAccuracy, exercise.name, this.voicePreferences);
    } else {
      this.callbacks.onFeedback?.(`${patternAccuracy}% - you'll get it with more practice!`);
      await VoiceCoach.provideFeedback(patternAccuracy, exercise.name, this.voicePreferences);
    }

    await this.delay(500);
    return patternAccuracy;
  }

  /**
   * Evaluate accuracy for full pattern attempt
   * Divides samples into segments matching each note and calculates overall accuracy
   */
  private evaluateFullPattern(exercise: Exercise): number {
    if (this.pitchSamples.length === 0) return 0;

    const totalDuration = exercise.notes.reduce((sum, n) => sum + n.duration, 0);
    const samplesPerSecond = this.pitchSamples.length / totalDuration;

    let totalAccuracy = 0;
    let sampleIndex = 0;

    for (const note of exercise.notes) {
      const samplesForNote = Math.floor(note.duration * samplesPerSecond);
      const endIndex = Math.min(sampleIndex + samplesForNote, this.pitchSamples.length);
      const noteSamples = this.pitchSamples.slice(sampleIndex, endIndex);

      if (noteSamples.length > 0) {
        const avgFreq = noteSamples.reduce((a, b) => a + b, 0) / noteSamples.length;
        const centsDiff = Math.abs(1200 * Math.log2(avgFreq / note.frequency));
        const noteAccuracy = Math.max(0, 100 - centsDiff);
        totalAccuracy += noteAccuracy;
      }

      sampleIndex = endIndex;
    }

    return Math.round(totalAccuracy / exercise.notes.length);
  }

  /**
   * Complete the workout
   */
  private async completeWorkout(): Promise<void> {
    this.setState('complete');
    this.callbacks.onTargetNoteChange?.(null);

    await VoiceCoach.completeWorkout(this.voicePreferences);

    // Calculate total accuracy
    const totalAccuracy = this.exerciseAccuracies.length > 0
      ? Math.round(this.exerciseAccuracies.reduce((sum, a) => sum + a, 0) / this.exerciseAccuracies.length)
      : 0;

    // Calculate duration
    const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);

    // Find lowest and highest notes sung
    let lowestNote: string | undefined;
    let highestNote: string | undefined;

    if (this.allFrequenciesSung.length > 0) {
      const minFreq = Math.min(...this.allFrequenciesSung);
      const maxFreq = Math.max(...this.allFrequenciesSung);
      lowestNote = frequencyToNote(minFreq) ?? undefined;
      highestNote = frequencyToNote(maxFreq) ?? undefined;
    }

    // Count notes hit (accuracy > 70%)
    const notesHit = this.noteAttempts.filter(a => a.accuracy >= 70).length;

    // Create session record
    const session: SessionRecord = {
      id: generateUUID(),
      date: new Date().toISOString(),
      exerciseId: this.currentWorkout?.id || 'workout',
      exerciseName: this.currentWorkout?.name || 'Workout',
      workoutId: this.currentWorkout?.id,
      duration,
      accuracy: totalAccuracy,
      notesAttempted: this.noteAttempts.length,
      notesHit,
      noteAttempts: this.noteAttempts,
      lowestNote,
      highestNote,
    };

    this.callbacks.onSessionComplete?.(session);
    this.callbacks.onWorkoutComplete?.(totalAccuracy);

    this.isRunning = false;
  }

  /**
   * Skip breathing exercise and jump directly to workout
   * Only works if currently in breathing phase and auto-progression is enabled
   */
  async skipToWorkout(): Promise<void> {
    if (this.state === 'breathing' && this.autoProgressToWorkout && this.pendingWorkout) {
      // Stop breathing intervals
      if (this.breathingInterval) {
        clearInterval(this.breathingInterval);
        this.breathingInterval = null;
      }

      // Clear breathing state
      this.callbacks.onBreathingUpdate?.(null);
      this.currentBreathingExercise = null;

      // Reset auto-progression flags
      this.autoProgressToWorkout = false;
      const workout = this.pendingWorkout;
      this.pendingWorkout = null;

      // Start workout immediately (continuing session)
      await this.startWorkout(workout, true);
    }
  }

  /**
   * Stop the workout
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.noteTimeout) {
      clearTimeout(this.noteTimeout);
      this.noteTimeout = null;
    }

    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }

    if (this.soundRef) {
      await this.soundRef.stopAsync();
      await this.soundRef.unloadAsync();
      this.soundRef = null;
    }

    if (this.voiceSoundRef) {
      await this.voiceSoundRef.stopAsync();
      await this.voiceSoundRef.unloadAsync();
      this.voiceSoundRef = null;
    }

    this.setState('idle');
    this.callbacks.onTargetNoteChange?.(null);
    this.callbacks.onBreathingUpdate?.(null);
    this.currentBreathingExercise = null;
  }

  /**
   * Play a voice clip (AI-generated natural voice)
   */
  private async playVoiceClip(clipKey: string): Promise<void> {
    try {
      // Stop previous voice clip
      if (this.voiceSoundRef) {
        await this.voiceSoundRef.stopAsync();
        await this.voiceSoundRef.unloadAsync();
      }

      const clip = voiceClips[clipKey];
      if (!clip) {
        console.warn(`Voice clip not found: ${clipKey}`);
        return;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        clip,
        { shouldPlay: false, volume: this.voiceVolume }
      );
      this.voiceSoundRef = sound;
      await sound.playAsync();

      // Wait for clip to finish playing
      if (status.isLoaded && status.durationMillis) {
        await this.delay(status.durationMillis);
      }
    } catch (error) {
      // Audio interruptions are common and non-fatal (app backgrounding, etc.)
      console.warn(`Voice clip interrupted (${clipKey}):`, error);
    }
  }

  /**
   * Update state and notify callback
   */
  private setState(state: ExerciseState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current state
   */
  getState(): ExerciseState {
    return this.state;
  }

  /**
   * Check if running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current note attempts (for real-time display)
   */
  getNoteAttempts(): NoteAttempt[] {
    return [...this.noteAttempts];
  }

  /**
   * Get current session duration in seconds
   */
  getCurrentDuration(): number {
    if (this.sessionStartTime === 0) return 0;
    return Math.round((Date.now() - this.sessionStartTime) / 1000);
  }

  /**
   * Replay the current target note (Phase 2 - Hear Again button)
   * Allows user to hear the reference note again without affecting scoring
   */
  async replayCurrentNote(): Promise<void> {
    if (!this.currentWorkout || !this.isRunning) return;

    const exercise = this.currentWorkout.exercises[this.currentExerciseIndex];
    if (!exercise) return;

    const note = exercise.notes[this.currentNoteIndex];
    if (!note) return;

    // Play the piano note without changing state
    await this.playPianoNote(note.note);
  }

  /**
   * Get current target note (for UI display)
   */
  getCurrentTargetNote(): ExerciseNote | null {
    if (!this.currentWorkout) return null;
    const exercise = this.currentWorkout.exercises[this.currentExerciseIndex];
    if (!exercise) return null;
    return exercise.notes[this.currentNoteIndex] || null;
  }

  /**
   * Get current target frequency (for real-time pitch comparison)
   */
  getCurrentTargetFrequency(): number {
    const note = this.getCurrentTargetNote();
    return note?.frequency || 0;
  }

  /**
   * Get progress info for current exercise
   */
  getProgressInfo(): { currentNote: number; totalNotes: number; currentExercise: number; totalExercises: number } {
    const totalExercises = this.currentWorkout?.exercises.length || 0;
    const currentExercise = this.currentWorkout?.exercises[this.currentExerciseIndex];
    const totalNotes = currentExercise?.notes.length || 0;

    return {
      currentNote: this.currentNoteIndex + 1,
      totalNotes,
      currentExercise: this.currentExerciseIndex + 1,
      totalExercises,
    };
  }
}
