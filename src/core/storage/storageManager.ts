/**
 * Storage Manager
 *
 * Coordinates between AsyncStorage (hot data) and SQLite (archive).
 * AsyncStorage holds the most recent sessions for fast access.
 * SQLite stores the full history for unlimited capacity.
 *
 * Architecture:
 * - Hot cache: Last 50 sessions in AsyncStorage (fast access)
 * - Archive: Full history in SQLite (unlimited storage)
 * - New sessions go to both hot cache and SQLite
 * - Queries for recent data use hot cache
 * - Queries for older data or full history use SQLite
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sqliteAdapter } from './sqliteAdapter';
import { SessionRecord, UserProgress } from '../../types/userProgress';

// Configuration
const HOT_CACHE_SIZE = 50; // Keep 50 sessions in AsyncStorage
const MIGRATION_KEY = '@PitchPerfect:sqliteMigrated';

// Storage keys
const KEYS = {
  USER_PROGRESS: '@PitchPerfect:userProgress',
};

/**
 * Check if SQLite migration has been completed
 */
async function isMigrationComplete(): Promise<boolean> {
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
  return migrated === 'true';
}

/**
 * Mark migration as complete
 */
async function markMigrationComplete(): Promise<void> {
  await AsyncStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Migrate legacy AsyncStorage sessions to SQLite
 * This is a one-time migration that preserves existing data
 */
export async function migrateLegacyData(): Promise<void> {
  // Check if already migrated
  if (await isMigrationComplete()) {
    console.log('[StorageManager] Migration already complete');
    return;
  }

  console.log('[StorageManager] Starting legacy data migration...');

  try {
    // Get existing progress from AsyncStorage
    const progressData = await AsyncStorage.getItem(KEYS.USER_PROGRESS);
    if (!progressData) {
      console.log('[StorageManager] No legacy data to migrate');
      await markMigrationComplete();
      return;
    }

    const progress: UserProgress = JSON.parse(progressData);
    const sessions = progress.sessionHistory || [];

    if (sessions.length === 0) {
      console.log('[StorageManager] No sessions to migrate');
      await markMigrationComplete();
      return;
    }

    console.log(`[StorageManager] Migrating ${sessions.length} sessions to SQLite...`);

    // Save all sessions to SQLite
    await sqliteAdapter.saveSessions(sessions);

    // Keep only recent sessions in AsyncStorage
    progress.sessionHistory = sessions.slice(0, HOT_CACHE_SIZE);
    await AsyncStorage.setItem(KEYS.USER_PROGRESS, JSON.stringify(progress));

    await markMigrationComplete();
    console.log('[StorageManager] Migration complete!');
  } catch (error) {
    console.error('[StorageManager] Migration failed:', error);
    throw error;
  }
}

/**
 * Save a new session to both hot cache and SQLite
 */
export async function saveSession(
  session: SessionRecord,
  progress: UserProgress
): Promise<UserProgress> {
  // Save to SQLite (full archive)
  await sqliteAdapter.saveSession(session);

  // Update hot cache in progress object
  progress.sessionHistory.unshift(session);

  // Trim hot cache to size limit
  if (progress.sessionHistory.length > HOT_CACHE_SIZE) {
    progress.sessionHistory = progress.sessionHistory.slice(0, HOT_CACHE_SIZE);
  }

  return progress;
}

/**
 * Get recent sessions from hot cache
 * For fast access to recent data
 */
export function getRecentSessions(progress: UserProgress, limit: number = 10): SessionRecord[] {
  return progress.sessionHistory.slice(0, limit);
}

/**
 * Get all sessions with pagination
 * Uses SQLite for full history access
 */
export async function getAllSessions(
  limit: number = 100,
  offset: number = 0
): Promise<SessionRecord[]> {
  return sqliteAdapter.getSessions(limit, offset);
}

/**
 * Get total session count from SQLite
 */
export async function getTotalSessionCount(): Promise<number> {
  return sqliteAdapter.getSessionCount();
}

/**
 * Get sessions by date range
 * Uses SQLite for date-based queries
 */
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<SessionRecord[]> {
  return sqliteAdapter.getSessionsByDateRange(startDate, endDate);
}

/**
 * Get a specific session by ID
 * Checks hot cache first, then SQLite
 */
export async function getSessionById(
  sessionId: string,
  progress: UserProgress
): Promise<SessionRecord | null> {
  // Check hot cache first
  const cached = progress.sessionHistory.find((s) => s.id === sessionId);
  if (cached) {
    return cached;
  }

  // Fall back to SQLite
  return sqliteAdapter.getSessionById(sessionId);
}

/**
 * Get sessions for a specific exercise
 */
export async function getSessionsForExercise(
  exerciseId: string,
  limit: number = 20
): Promise<SessionRecord[]> {
  const sessions = await sqliteAdapter.getSessions(1000, 0);
  return sessions
    .filter((s) => s.exerciseId === exerciseId)
    .slice(0, limit);
}

/**
 * Calculate stats from full session history
 */
export async function calculateFullStats(): Promise<{
  totalSessions: number;
  totalPracticeTime: number;
  averageAccuracy: number;
  sessionsByExercise: Record<string, number>;
}> {
  const allSessions = await sqliteAdapter.getSessions(10000, 0);

  const totalSessions = allSessions.length;
  const totalPracticeTime = allSessions.reduce((sum, s) => sum + s.duration, 0);
  const averageAccuracy =
    allSessions.length > 0
      ? allSessions.reduce((sum, s) => sum + s.accuracy, 0) / allSessions.length
      : 0;

  const sessionsByExercise: Record<string, number> = {};
  for (const session of allSessions) {
    sessionsByExercise[session.exerciseId] =
      (sessionsByExercise[session.exerciseId] || 0) + 1;
  }

  return {
    totalSessions,
    totalPracticeTime,
    averageAccuracy,
    sessionsByExercise,
  };
}

/**
 * Clear all session data (for reset)
 */
export async function clearAllSessions(): Promise<void> {
  await sqliteAdapter.deleteAllSessions();
}

/**
 * Initialize storage manager
 * Should be called on app startup
 */
export async function initializeStorage(): Promise<void> {
  console.log('[StorageManager] Initializing...');
  await migrateLegacyData();
  console.log('[StorageManager] Ready');
}

// Export storage manager
export const storageManager = {
  initializeStorage,
  migrateLegacyData,
  saveSession,
  getRecentSessions,
  getAllSessions,
  getTotalSessionCount,
  getSessionsByDateRange,
  getSessionById,
  getSessionsForExercise,
  calculateFullStats,
  clearAllSessions,
};
