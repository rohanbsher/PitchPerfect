/**
 * App Controller Service
 *
 * Unified interface to control the entire app - used by Voice Assistant.
 * Provides actions for workout control, navigation, settings, and queries.
 */

import { NativeModules } from 'react-native';
import { ExerciseEngine, ExerciseState } from '../engines/ExerciseEngine';
import { getUserProgress, saveUserSettings, getUserSettings } from './storage';
import { UserProgress, UserSettings } from '../types/userProgress';
import { getDefaultWorkout, DailyWorkout, DAILY_WORKOUTS, EXERCISES, Exercise } from '../data/exercises';

// Action result returned by all controller methods
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

// Current app state for AI context
export interface AppState {
  currentScreen: string;
  isExerciseActive: boolean;
  exerciseState: ExerciseState;
  currentExercise?: string;
  currentNote?: string;
  isBreathing: boolean;
}

// Progress summary for AI queries
export interface ProgressSummary {
  streak: number;
  longestStreak: number;
  totalSessions: number;
  totalPracticeMinutes: number;
  averageAccuracy: number;
  vocalRange: { low: string; high: string };
  recentSessions: {
    date: string;
    exercise: string;
    accuracy: number;
  }[];
  exercisesCompleted: number;
}

// Navigation callback type
type NavigationCallback = (screen: string) => void;
type GoBackCallback = () => void;
type PitchDetectorCallback = () => void;

class AppControllerService {
  private exerciseEngine: ExerciseEngine | null = null;
  private currentScreen: string = 'home';
  private navigationCallback: NavigationCallback | null = null;
  private goBackCallback: GoBackCallback | null = null;
  private currentExerciseName: string = '';
  private currentNoteName: string = '';

  // Pitch detector coordination for voice assistant
  private pausePitchDetectorCallback: PitchDetectorCallback | null = null;
  private resumePitchDetectorCallback: PitchDetectorCallback | null = null;
  private isPitchDetectorPaused: boolean = false;

  /**
   * Set the ExerciseEngine instance (called from NativePitchScreen)
   */
  setExerciseEngine(engine: ExerciseEngine | null): void {
    this.exerciseEngine = engine;
  }

  /**
   * Set navigation callback (called from App.tsx navigation setup)
   */
  setNavigationCallback(callback: NavigationCallback): void {
    this.navigationCallback = callback;
  }

  /**
   * Set go back callback
   */
  setGoBackCallback(callback: GoBackCallback): void {
    this.goBackCallback = callback;
  }

  /**
   * Update current screen (called by navigation listeners)
   */
  setCurrentScreen(screen: string): void {
    this.currentScreen = screen;
  }

  /**
   * Update current exercise name (called by ExerciseEngine callbacks)
   */
  setCurrentExerciseName(name: string): void {
    this.currentExerciseName = name;
  }

  /**
   * Update current note name (called by ExerciseEngine callbacks)
   */
  setCurrentNoteName(note: string): void {
    this.currentNoteName = note;
  }

  // ===== PITCH DETECTOR COORDINATION =====

  /**
   * Set callbacks for pitch detector control (called from NativePitchScreen)
   * Used by voice assistant to pause/resume pitch detection to avoid audio session conflicts
   */
  setPitchDetectorCallbacks(
    pause: PitchDetectorCallback | null,
    resume: PitchDetectorCallback | null
  ): void {
    this.pausePitchDetectorCallback = pause;
    this.resumePitchDetectorCallback = resume;
  }

  /**
   * Pause pitch detector before starting voice recognition
   * Called by voice assistant to avoid audio session conflicts
   */
  pausePitchDetector(): void {
    if (this.pausePitchDetectorCallback && !this.isPitchDetectorPaused) {
      console.log('[AppController] Pausing pitch detector for voice assistant');
      this.pausePitchDetectorCallback();
      this.isPitchDetectorPaused = true;
    }
  }

  /**
   * Resume pitch detector after voice recognition ends
   * Called by voice assistant when deactivating
   */
  resumePitchDetector(): void {
    if (this.resumePitchDetectorCallback && this.isPitchDetectorPaused) {
      console.log('[AppController] Resuming pitch detector after voice assistant');
      this.resumePitchDetectorCallback();
      this.isPitchDetectorPaused = false;
    }
  }

  /**
   * Check if pitch detector is currently paused
   */
  isPitchDetectorCurrentlyPaused(): boolean {
    return this.isPitchDetectorPaused;
  }

  /**
   * Fully pause pitch detector AND release audio session.
   * This is the critical method for voice assistant to avoid audio session conflicts.
   * Returns a promise that resolves when the audio session is released.
   */
  async pausePitchDetectorFully(): Promise<boolean> {
    console.log('[AppController] pausePitchDetectorFully called');

    return new Promise((resolve) => {
      try {
        const { PitchDetectorModule } = NativeModules;
        if (!PitchDetectorModule) {
          console.warn('[AppController] PitchDetectorModule not available');
          resolve(false);
          return;
        }

        PitchDetectorModule.stopPitchDetectionAndReleaseSession((error: string | null, result: string) => {
          if (error) {
            console.error('[AppController] Failed to release audio session:', error);
            resolve(false);
          } else {
            console.log('[AppController] Audio session released:', result);
            this.isPitchDetectorPaused = true;
            resolve(true);
          }
        });
      } catch (error) {
        console.error('[AppController] Error calling native module:', error);
        resolve(false);
      }
    });
  }

  /**
   * Fully resume pitch detector with fresh audio session configuration.
   * Called after voice assistant releases the microphone.
   * Includes a 500ms delay to let iOS audio system settle.
   */
  async resumePitchDetectorFully(): Promise<boolean> {
    console.log('[AppController] resumePitchDetectorFully called');

    // Wait for iOS audio system to settle
    await new Promise(r => setTimeout(r, 500));

    return new Promise((resolve) => {
      try {
        const { PitchDetectorModule } = NativeModules;
        if (!PitchDetectorModule) {
          console.warn('[AppController] PitchDetectorModule not available');
          resolve(false);
          return;
        }

        PitchDetectorModule.reconfigureAndStartPitchDetection((error: string | null, result: string) => {
          if (error) {
            console.error('[AppController] Failed to reconfigure pitch detector:', error);
            resolve(false);
          } else {
            console.log('[AppController] Pitch detector reconfigured:', result);
            this.isPitchDetectorPaused = false;
            resolve(true);
          }
        });
      } catch (error) {
        console.error('[AppController] Error calling native module:', error);
        resolve(false);
      }
    });
  }

  // ===== WORKOUT ACTIONS =====

  /**
   * Start a quick warmup workout
   */
  async startQuickWarmup(): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "I can't start a workout from here. Go to the Practice tab first." };
    }

    try {
      await this.exerciseEngine.startIntegratedWorkout(undefined, DAILY_WORKOUTS[0]);
      return {
        success: true,
        message: "Starting your 5-minute quick warmup. Let's go!",
      };
    } catch (error) {
      console.error('[AppController] Failed to start quick warmup:', error);
      return { success: false, message: "Sorry, I couldn't start the workout. Please try again." };
    }
  }

  /**
   * Start a specific workout
   */
  async startWorkout(workoutType: string): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "I can't start a workout from here. Go to the Practice tab first." };
    }

    try {
      // Find workout by type - workouts are stored in DAILY_WORKOUTS array
      // Index 0 = Quick Session, 1 = Full Session
      let workout: DailyWorkout;
      let description: string;

      switch (workoutType) {
        case 'quick_warmup':
          workout = DAILY_WORKOUTS[0]; // Quick Session
          description = 'quick warmup';
          break;
        case 'morning':
          workout = DAILY_WORKOUTS[0]; // Use quick session for morning
          description = 'morning routine';
          break;
        case 'full':
          workout = DAILY_WORKOUTS[1] || DAILY_WORKOUTS[0]; // Full Session or fallback
          description = 'full workout';
          break;
        default:
          workout = getDefaultWorkout();
          description = 'workout';
      }

      await this.exerciseEngine.startIntegratedWorkout(undefined, workout);
      return {
        success: true,
        message: `Starting your ${description}. Let's warm up!`,
      };
    } catch (error) {
      console.error('[AppController] Failed to start workout:', error);
      return { success: false, message: "Sorry, I couldn't start the workout." };
    }
  }

  /**
   * Start a specific exercise by ID
   */
  async startExercise(exerciseId: string): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "Go to the Practice tab to start an exercise." };
    }

    try {
      // Look up exercise from EXERCISES record
      const exercise = EXERCISES[exerciseId];
      if (!exercise) {
        return { success: false, message: `I couldn't find an exercise called ${exerciseId}.` };
      }

      // Create a mini-workout with just this exercise
      const miniWorkout: DailyWorkout = {
        id: `single-${exerciseId}`,
        name: exercise.name,
        description: exercise.description,
        duration: `${exercise.notes.length * 3} sec`,
        details: [exercise.description],
        exercises: [exercise],
      };

      await this.exerciseEngine.startWorkout(miniWorkout);
      return {
        success: true,
        message: `Starting ${exercise.name}. Listen to the demonstration!`,
      };
    } catch (error) {
      console.error('[AppController] Failed to start exercise:', error);
      return { success: false, message: "Sorry, I couldn't start that exercise." };
    }
  }

  /**
   * Start breathing exercise
   */
  async startBreathing(): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "Go to the Practice tab for breathing exercises." };
    }

    try {
      await this.exerciseEngine.startBreathingExercise();
      return {
        success: true,
        message: "Starting breathing exercise. Breathe deeply and relax.",
      };
    } catch (error) {
      console.error('[AppController] Failed to start breathing:', error);
      return { success: false, message: "Sorry, I couldn't start the breathing exercise." };
    }
  }

  /**
   * Stop current workout
   */
  async stopWorkout(): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "No workout is active." };
    }

    try {
      await this.exerciseEngine.stop();
      return {
        success: true,
        message: "Workout stopped. Great practice session!",
      };
    } catch (error) {
      console.error('[AppController] Failed to stop workout:', error);
      return { success: false, message: "Couldn't stop the workout." };
    }
  }

  /**
   * Skip breathing and go to workout
   */
  async skipBreathing(): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "No breathing exercise is active." };
    }

    try {
      await this.exerciseEngine.skipToWorkout();
      return {
        success: true,
        message: "Skipping to the workout. Let's go!",
      };
    } catch (error) {
      console.error('[AppController] Failed to skip breathing:', error);
      return { success: false, message: "Couldn't skip the breathing exercise." };
    }
  }

  /**
   * Replay the current note
   */
  async replayCurrentNote(): Promise<ActionResult> {
    if (!this.exerciseEngine) {
      return { success: false, message: "No exercise is active." };
    }

    try {
      await this.exerciseEngine.replayCurrentNote();
      return {
        success: true,
        message: "", // No verbal response needed - the note plays
      };
    } catch (error) {
      console.error('[AppController] Failed to replay note:', error);
      return { success: false, message: "Couldn't replay the note." };
    }
  }

  // ===== NAVIGATION =====

  /**
   * Navigate to a screen
   */
  async navigateTo(screen: string): Promise<ActionResult> {
    if (!this.navigationCallback) {
      return { success: false, message: "Navigation not available." };
    }

    try {
      const screenMap: Record<string, string> = {
        home: 'Home',
        progress: 'Progress',
        settings: 'Settings',
        practice: 'NativePitch',
      };

      const targetScreen = screenMap[screen.toLowerCase()] || screen;
      this.navigationCallback(targetScreen);

      return {
        success: true,
        message: `Going to ${screen}.`,
      };
    } catch (error) {
      console.error('[AppController] Navigation failed:', error);
      return { success: false, message: "Couldn't navigate to that screen." };
    }
  }

  /**
   * Go back to previous screen
   */
  async goBack(): Promise<ActionResult> {
    if (!this.goBackCallback) {
      return { success: false, message: "Can't go back." };
    }

    try {
      this.goBackCallback();
      return {
        success: true,
        message: "Going back.",
      };
    } catch (error) {
      return { success: false, message: "Couldn't go back." };
    }
  }

  // ===== SETTINGS =====

  /**
   * Adjust volume
   */
  async adjustVolume(target: 'piano' | 'voice', direction: 'up' | 'down'): Promise<ActionResult> {
    try {
      const settings = await getUserSettings();
      const change = direction === 'up' ? 10 : -10;

      if (target === 'piano') {
        settings.pianoVolume = Math.max(0, Math.min(100, settings.pianoVolume + change));
        await saveUserSettings(settings);
        return {
          success: true,
          message: `Piano volume ${direction === 'up' ? 'increased' : 'decreased'} to ${settings.pianoVolume}%.`,
        };
      } else {
        settings.voiceVolume = Math.max(0, Math.min(100, settings.voiceVolume + change));
        await saveUserSettings(settings);
        return {
          success: true,
          message: `Voice volume ${direction === 'up' ? 'increased' : 'decreased'} to ${settings.voiceVolume}%.`,
        };
      }
    } catch (error) {
      console.error('[AppController] Failed to adjust volume:', error);
      return { success: false, message: "Couldn't adjust the volume." };
    }
  }

  /**
   * Toggle voice coach
   */
  async toggleVoiceCoach(enabled?: boolean): Promise<ActionResult> {
    try {
      const settings = await getUserSettings();
      settings.voiceCoachEnabled = enabled !== undefined ? enabled : !settings.voiceCoachEnabled;
      await saveUserSettings(settings);

      return {
        success: true,
        message: settings.voiceCoachEnabled
          ? "Voice coaching is now enabled."
          : "Voice coaching is now disabled.",
      };
    } catch (error) {
      console.error('[AppController] Failed to toggle voice coach:', error);
      return { success: false, message: "Couldn't change voice coach setting." };
    }
  }

  // ===== QUERIES =====

  /**
   * Get current app state
   */
  async getCurrentState(): Promise<AppState> {
    const exerciseState = this.exerciseEngine?.getState() || 'idle';

    return {
      currentScreen: this.currentScreen,
      isExerciseActive: exerciseState !== 'idle' && exerciseState !== 'complete',
      exerciseState,
      currentExercise: this.currentExerciseName || undefined,
      currentNote: this.currentNoteName || undefined,
      isBreathing: exerciseState === 'breathing',
    };
  }

  /**
   * Get progress summary for AI queries
   */
  async getProgressSummary(): Promise<ProgressSummary> {
    const progress = await getUserProgress();

    const recentSessions = progress.sessionHistory.slice(0, 10).map(s => ({
      date: s.date,
      exercise: s.exerciseName,
      accuracy: s.accuracy,
    }));

    return {
      streak: progress.streak.current,
      longestStreak: progress.streak.longest,
      totalSessions: progress.totalSessions,
      totalPracticeMinutes: Math.round(progress.totalPracticeTime / 60),
      averageAccuracy: Math.round(progress.averageAccuracy),
      vocalRange: {
        low: progress.vocalRange.lowest,
        high: progress.vocalRange.highest,
      },
      recentSessions,
      exercisesCompleted: progress.exercisesCompleted.length,
    };
  }

  /**
   * Get help text
   */
  getHelpText(): string {
    return `I can help you with:

**Start a workout:**
- "Start a quick warmup"
- "Start morning routine"
- "Start a full workout"

**Control exercises:**
- "Stop" or "Cancel"
- "Skip breathing"
- "Play that note again"

**Ask about progress:**
- "How am I doing?"
- "What's my streak?"
- "What's my vocal range?"

**Navigate:**
- "Go to progress"
- "Open settings"
- "Go home"

**Settings:**
- "Turn piano volume up"
- "Turn voice coach off"

Just speak naturally and I'll try to help!`;
  }
}

// Export singleton instance
export const appController = new AppControllerService();

// Export for typing
export { AppControllerService };
