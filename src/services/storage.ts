/**
 * Storage Service
 *
 * Handles all AsyncStorage operations for user progress, settings, and session data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProgress,
  UserSettings,
  SessionRecord,
  StreakData,
  VocalRange,
  UserStats,
  DailyTip,
} from '../types/userProgress';
import { NOTE_FREQUENCIES } from '../data/exercises';

// Storage keys
const KEYS = {
  USER_PROGRESS: '@PitchPerfect:userProgress',
  USER_SETTINGS: '@PitchPerfect:userSettings',
  DAILY_TIP: '@PitchPerfect:dailyTip',
};

// Default values
const DEFAULT_PROGRESS: UserProgress = {
  streak: {
    current: 0,
    longest: 0,
    lastPracticeDate: '',
  },
  totalSessions: 0,
  totalPracticeTime: 0,
  sessionHistory: [],
  vocalRange: {
    lowest: 'C3',
    lowestFrequency: 130.81,
    highest: 'C5',
    highestFrequency: 523.25,
    comfortableLow: 'E3',
    comfortableHigh: 'E5',
    lastUpdated: new Date().toISOString(),
  },
  averageAccuracy: 0,
  exercisesCompleted: [],
  favoritesExercises: [],
  lastSessionDate: '',
};

const DEFAULT_SETTINGS: UserSettings = {
  pianoVolume: 85,
  voiceVolume: 90,
  showNoteLabels: true,
  showCents: true,
  theme: 'dark',
  voiceCoachEnabled: true,
  voiceCoachSpeed: 0.9,
  voiceCoachPitch: 1.0,
  dailyReminderEnabled: false,
  dailyReminderTime: '09:00',
  userName: '',
  userGoal: 'daily_practice',
  hasCompletedOnboarding: false,
};

// ========== USER PROGRESS ==========

/**
 * Get user progress from storage
 */
export async function getUserProgress(): Promise<UserProgress> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROGRESS);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all fields exist (handles partial/old data)
      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
        sessionHistory: parsed.sessionHistory || [],
        streak: { ...DEFAULT_PROGRESS.streak, ...(parsed.streak || {}) },
        vocalRange: { ...DEFAULT_PROGRESS.vocalRange, ...(parsed.vocalRange || {}) },
      };
    }
    return DEFAULT_PROGRESS;
  } catch (error) {
    console.error('Failed to load user progress:', error);
    return DEFAULT_PROGRESS;
  }
}

/**
 * Save user progress to storage
 */
export async function saveUserProgress(progress: UserProgress): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save user progress:', error);
    throw error;
  }
}

/**
 * Save a new session and update progress
 */
export async function saveSession(session: SessionRecord): Promise<void> {
  try {
    const progress = await getUserProgress();

    // Add session to history
    progress.sessionHistory.unshift(session); // Add to beginning

    // Keep only last 100 sessions
    if (progress.sessionHistory.length > 100) {
      progress.sessionHistory = progress.sessionHistory.slice(0, 100);
    }

    // Update total sessions and practice time
    progress.totalSessions++;
    progress.totalPracticeTime += session.duration;

    // Update streak
    progress.streak = calculateStreak(progress.sessionHistory);

    // Update vocal range
    if (session.lowestNote && session.highestNote) {
      progress.vocalRange = updateVocalRange(
        progress.vocalRange,
        session.lowestNote,
        session.highestNote
      );
    }

    // Update average accuracy
    progress.averageAccuracy = calculateAverageAccuracy(progress.sessionHistory);

    // Track completed exercises
    if (!progress.exercisesCompleted.includes(session.exerciseId)) {
      progress.exercisesCompleted.push(session.exerciseId);
    }

    // Update last session date
    progress.lastSessionDate = session.date;

    await saveUserProgress(progress);
  } catch (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
}

/**
 * Calculate current streak based on session history
 */
function calculateStreak(sessions: SessionRecord[]): StreakData {
  if (sessions.length === 0) {
    return { current: 0, longest: 0, lastPracticeDate: '' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get unique practice dates (sorted newest first)
  const practiceDates = Array.from(
    new Set(sessions.map(s => s.date.split('T')[0]))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let currentCount = 0;

  // Check if practiced today or yesterday
  const lastPractice = new Date(practiceDates[0]);
  lastPractice.setHours(0, 0, 0, 0);
  const daysSinceLastPractice = Math.floor(
    (today.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastPractice <= 1) {
    // Start counting current streak
    let expectedDate = new Date(lastPractice);

    for (const dateStr of practiceDates) {
      const practiceDate = new Date(dateStr);
      practiceDate.setHours(0, 0, 0, 0);

      if (practiceDate.getTime() === expectedDate.getTime()) {
        currentCount++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    currentStreak = currentCount;
  }

  // Calculate longest streak
  let tempCount = 1;
  let tempDate = new Date(practiceDates[0]);

  for (let i = 1; i < practiceDates.length; i++) {
    const currentDate = new Date(practiceDates[i]);
    currentDate.setHours(0, 0, 0, 0);

    const prevDate = new Date(tempDate);
    prevDate.setDate(prevDate.getDate() - 1);

    if (currentDate.getTime() === prevDate.getTime()) {
      tempCount++;
      longestStreak = Math.max(longestStreak, tempCount);
    } else {
      tempCount = 1;
    }

    tempDate = currentDate;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    current: currentStreak,
    longest: longestStreak,
    lastPracticeDate: practiceDates[0],
  };
}

/**
 * Update vocal range based on new session data
 */
function updateVocalRange(
  current: VocalRange,
  lowestNote: string,
  highestNote: string
): VocalRange {
  const lowestFreq = NOTE_FREQUENCIES[lowestNote];
  const highestFreq = NOTE_FREQUENCIES[highestNote];

  let updated = { ...current };

  // Update if new lowest
  if (lowestFreq && lowestFreq < current.lowestFrequency) {
    updated.lowest = lowestNote;
    updated.lowestFrequency = lowestFreq;
  }

  // Update if new highest
  if (highestFreq && highestFreq > current.highestFrequency) {
    updated.highest = highestNote;
    updated.highestFrequency = highestFreq;
  }

  updated.lastUpdated = new Date().toISOString();

  return updated;
}

/**
 * Calculate average accuracy from recent sessions
 */
function calculateAverageAccuracy(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 0;

  // Use last 10 sessions for average
  const recentSessions = sessions.slice(0, 10);
  const total = recentSessions.reduce((sum, s) => sum + s.accuracy, 0);

  return Math.round(total / recentSessions.length);
}

/**
 * Save detected vocal range from range check
 * This directly sets the vocal range (not cumulative like session-based updates)
 */
export async function saveVocalRange(
  lowestNote: string,
  lowestFrequency: number,
  highestNote: string,
  highestFrequency: number
): Promise<void> {
  try {
    const progress = await getUserProgress();

    progress.vocalRange = {
      lowest: lowestNote,
      lowestFrequency,
      highest: highestNote,
      highestFrequency,
      // For simple range check, comfortable = detected range
      comfortableLow: lowestNote,
      comfortableHigh: highestNote,
      lastUpdated: new Date().toISOString(),
    };

    await saveUserProgress(progress);
    console.log('[Storage] Vocal range saved:', lowestNote, '-', highestNote);
  } catch (error) {
    console.error('[Storage] Failed to save vocal range:', error);
    throw error;
  }
}

/**
 * Get user statistics for display
 */
export async function getUserStats(): Promise<UserStats> {
  const progress = await getUserProgress();
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Sessions this week
  const sessionsThisWeek = progress.sessionHistory.filter(
    s => new Date(s.date) >= weekAgo
  );

  // Practice time this week
  const practiceTimeThisWeek = sessionsThisWeek.reduce(
    (sum, s) => sum + s.duration,
    0
  );

  // Improvement rate (accuracy change over last 7 days)
  const last7Days = progress.sessionHistory.filter(
    s => new Date(s.date) >= weekAgo
  );
  const previous7Days = progress.sessionHistory.filter(s => {
    const date = new Date(s.date);
    return date < weekAgo && date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  });

  let improvementRate = 0;
  if (last7Days.length > 0 && previous7Days.length > 0) {
    const recentAvg = last7Days.reduce((sum, s) => sum + s.accuracy, 0) / last7Days.length;
    const previousAvg = previous7Days.reduce((sum, s) => sum + s.accuracy, 0) / previous7Days.length;
    // Guard against division by zero
    improvementRate = previousAvg > 0 ? Math.round(((recentAvg - previousAvg) / previousAvg) * 100) : 0;
  }

  return {
    currentStreak: progress.streak.current,
    longestStreak: progress.streak.longest,
    totalSessions: progress.totalSessions,
    totalPracticeTime: progress.totalPracticeTime,
    averageAccuracy: progress.averageAccuracy,
    sessionsThisWeek: sessionsThisWeek.length,
    practiceTimeThisWeek,
    improvementRate,
  };
}

// ========== USER SETTINGS ==========

/**
 * Get user settings from storage
 */
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all fields exist (handles new settings)
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load user settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save user settings to storage
 */
export async function saveUserSettings(settings: UserSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save user settings:', error);
    throw error;
  }
}

/**
 * Update specific setting
 */
export async function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K]
): Promise<void> {
  const settings = await getUserSettings();
  settings[key] = value;
  await saveUserSettings(settings);
}

// ========== DAILY TIP ==========

/**
 * Get cached daily tip
 */
export async function getDailyTip(): Promise<DailyTip | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DAILY_TIP);
    if (data) {
      const tip: DailyTip = JSON.parse(data);
      const today = new Date().toISOString().split('T')[0];

      // Return tip if it's from today
      if (tip.date === today) {
        return tip;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load daily tip:', error);
    return null;
  }
}

/**
 * Save daily tip to cache
 */
export async function saveDailyTip(tip: DailyTip): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.DAILY_TIP, JSON.stringify(tip));
  } catch (error) {
    console.error('Failed to save daily tip:', error);
  }
}

// ========== UTILITY ==========

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.USER_PROGRESS,
      KEYS.USER_SETTINGS,
      KEYS.DAILY_TIP,
    ]);
  } catch (error) {
    console.error('Failed to clear data:', error);
    throw error;
  }
}

/**
 * Export all data (for backup)
 */
export async function exportAllData(): Promise<string> {
  const progress = await getUserProgress();
  const settings = await getUserSettings();

  return JSON.stringify({
    progress,
    settings,
    exportDate: new Date().toISOString(),
  }, null, 2);
}

/**
 * Import data (from backup)
 */
export async function importData(jsonString: string): Promise<void> {
  try {
    const data = JSON.parse(jsonString);

    if (data.progress) {
      await saveUserProgress(data.progress);
    }

    if (data.settings) {
      await saveUserSettings(data.settings);
    }
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error;
  }
}
