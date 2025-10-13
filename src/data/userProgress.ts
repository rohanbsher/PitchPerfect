/**
 * User Progress Data Model
 * Tracks user's practice history, streak, and progression through exercises
 * Uses AsyncStorage for persistence across app sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExerciseResults } from './models';

// Storage keys
const STORAGE_KEYS = {
  USER_PROGRESS: '@PitchPerfect:userProgress',
  COMPLETED_EXERCISES: '@PitchPerfect:completedExercises',
};

// ============================================
// DATA MODELS
// ============================================

export interface UserProgress {
  userId: string;
  userName: string;
  createdAt: string; // ISO date string
  lastPracticeDate: string | null; // ISO date string

  // Streak tracking
  currentStreak: number;
  longestStreak: number;

  // Progression
  weeksSinceFirstUse: number;
  currentLevel: 'foundation' | 'basic' | 'intermediate' | 'advanced';

  // Vocal range (from onboarding, future feature)
  vocalRange?: {
    lowest: string; // e.g., "C3"
    highest: string; // e.g., "C5"
  };
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  completedAt: string; // ISO date string
  accuracy: number; // 0-100
  stars: 1 | 2 | 3;
  duration: number; // seconds
  noteResults?: any[]; // Full note results (optional, for detailed history)
}

// ============================================
// ASYNC STORAGE FUNCTIONS
// ============================================

/**
 * Initialize user progress for first-time user
 */
export async function initializeUserProgress(userName: string = 'User'): Promise<UserProgress> {
  const now = new Date().toISOString();

  const initialProgress: UserProgress = {
    userId: `user_${Date.now()}`, // Simple unique ID
    userName,
    createdAt: now,
    lastPracticeDate: null,
    currentStreak: 0,
    longestStreak: 0,
    weeksSinceFirstUse: 0,
    currentLevel: 'foundation',
  };

  await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(initialProgress));
  await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_EXERCISES, JSON.stringify([]));

  console.log('✅ User progress initialized:', initialProgress);
  return initialProgress;
}

/**
 * Load user progress from AsyncStorage
 * Creates initial progress if doesn't exist
 */
export async function loadUserProgress(): Promise<UserProgress> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);

    if (!stored) {
      console.log('📝 No user progress found, initializing...');
      return await initializeUserProgress();
    }

    const progress: UserProgress = JSON.parse(stored);

    // Calculate weeks since first use
    const createdDate = new Date(progress.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    progress.weeksSinceFirstUse = Math.floor(daysDiff / 7);

    console.log('✅ User progress loaded:', progress);
    return progress;
  } catch (error) {
    console.error('❌ Error loading user progress:', error);
    return await initializeUserProgress();
  }
}

/**
 * Save user progress to AsyncStorage
 */
export async function saveUserProgress(progress: UserProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
    console.log('✅ User progress saved');
  } catch (error) {
    console.error('❌ Error saving user progress:', error);
  }
}

/**
 * Load completed exercises from AsyncStorage
 */
export async function loadCompletedExercises(): Promise<CompletedExercise[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_EXERCISES);
    if (!stored) return [];

    const exercises: CompletedExercise[] = JSON.parse(stored);
    console.log(`✅ Loaded ${exercises.length} completed exercises`);
    return exercises;
  } catch (error) {
    console.error('❌ Error loading completed exercises:', error);
    return [];
  }
}

/**
 * Save completed exercise to history
 * Also updates streak if practiced today
 */
export async function saveCompletedExercise(
  exerciseId: string,
  exerciseName: string,
  results: ExerciseResults
): Promise<void> {
  try {
    // Load current progress and exercises
    const progress = await loadUserProgress();
    const exercises = await loadCompletedExercises();

    // Calculate stars (1-3) based on accuracy
    let stars: 1 | 2 | 3 = 1;
    if (results.overallAccuracy >= 90) stars = 3;
    else if (results.overallAccuracy >= 70) stars = 2;

    // Create completed exercise record
    const completedExercise: CompletedExercise = {
      exerciseId,
      exerciseName,
      completedAt: new Date().toISOString(),
      accuracy: results.overallAccuracy,
      stars,
      duration: results.duration,
      noteResults: results.noteResults,
    };

    // Add to history
    exercises.push(completedExercise);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_EXERCISES, JSON.stringify(exercises));

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    let streakUpdated = false;

    if (!progress.lastPracticeDate) {
      // First practice ever
      progress.currentStreak = 1;
      progress.longestStreak = 1;
      streakUpdated = true;
    } else {
      const lastPractice = new Date(progress.lastPracticeDate);
      lastPractice.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 0) {
        // Already practiced today, don't increment streak
        console.log('📅 Already practiced today, streak unchanged');
      } else if (daysDiff === 1) {
        // Practiced yesterday, increment streak
        progress.currentStreak += 1;
        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }
        streakUpdated = true;
        console.log(`🔥 Streak increased to ${progress.currentStreak}!`);
      } else {
        // Missed days, reset streak
        progress.currentStreak = 1;
        streakUpdated = true;
        console.log('💔 Streak reset to 1');
      }
    }

    progress.lastPracticeDate = todayISO;

    // Update level based on weeks
    if (progress.weeksSinceFirstUse <= 2) {
      progress.currentLevel = 'foundation';
    } else if (progress.weeksSinceFirstUse <= 4) {
      progress.currentLevel = 'basic';
    } else if (progress.weeksSinceFirstUse <= 8) {
      progress.currentLevel = 'intermediate';
    } else {
      progress.currentLevel = 'advanced';
    }

    await saveUserProgress(progress);

    console.log('✅ Exercise saved:', completedExercise);
    if (streakUpdated) {
      console.log(`✅ Streak updated: ${progress.currentStreak} days`);
    }
  } catch (error) {
    console.error('❌ Error saving completed exercise:', error);
  }
}

/**
 * Get completed exercises for a specific exercise ID
 */
export async function getExerciseHistory(exerciseId: string): Promise<CompletedExercise[]> {
  const exercises = await loadCompletedExercises();
  return exercises.filter(e => e.exerciseId === exerciseId);
}

/**
 * Get today's completed exercises
 */
export async function getTodaysExercises(): Promise<CompletedExercise[]> {
  const exercises = await loadCompletedExercises();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return exercises.filter(e => {
    const completedDate = new Date(e.completedAt);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  });
}

/**
 * Check if user has completed an exercise before
 */
export async function hasCompletedExercise(exerciseId: string): Promise<boolean> {
  const exercises = await loadCompletedExercises();
  return exercises.some(e => e.exerciseId === exerciseId);
}

/**
 * Get total practice time in seconds
 */
export async function getTotalPracticeTime(): Promise<number> {
  const exercises = await loadCompletedExercises();
  return exercises.reduce((total, e) => total + e.duration, 0);
}

/**
 * Reset all user data (for testing or user request)
 */
export async function resetUserData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROGRESS);
    await AsyncStorage.removeItem(STORAGE_KEYS.COMPLETED_EXERCISES);
    console.log('✅ User data reset');
  } catch (error) {
    console.error('❌ Error resetting user data:', error);
  }
}

/**
 * Export all user data as JSON (for backup/export feature)
 */
export async function exportUserData(): Promise<string> {
  const progress = await loadUserProgress();
  const exercises = await loadCompletedExercises();

  const exportData = {
    progress,
    exercises,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  return JSON.stringify(exportData, null, 2);
}
