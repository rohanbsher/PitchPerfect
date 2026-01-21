/**
 * SQLite Adapter for Session Archive
 *
 * Stores session history beyond the AsyncStorage hot cache.
 * This allows unlimited session storage while keeping recent sessions fast.
 */

import * as SQLite from 'expo-sqlite';
import { SessionRecord, NoteAttempt } from '../../types/userProgress';

// Database name
const DB_NAME = 'pitchperfect.db';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the database instance
 */
async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeSchema();
  }
  return db;
}

/**
 * Initialize database schema
 */
async function initializeSchema(): Promise<void> {
  if (!db) return;

  await db.execAsync(`
    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      workout_id TEXT,
      duration INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      notes_attempted INTEGER NOT NULL,
      notes_hit INTEGER NOT NULL,
      lowest_note TEXT,
      highest_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Note attempts table
    CREATE TABLE IF NOT EXISTS note_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      note TEXT NOT NULL,
      target_frequency REAL NOT NULL,
      actual_frequency REAL NOT NULL,
      accuracy REAL NOT NULL,
      duration REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON sessions(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_note_attempts_session ON note_attempts(session_id);

    -- Migration tracking
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('[SQLite] Schema initialized');
}

/**
 * Save a session to the database
 */
export async function saveSession(session: SessionRecord): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    // Insert session
    await database.runAsync(
      `INSERT OR REPLACE INTO sessions
        (id, date, exercise_id, exercise_name, workout_id, duration, accuracy,
         notes_attempted, notes_hit, lowest_note, highest_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      session.date,
      session.exerciseId,
      session.exerciseName,
      session.workoutId || null,
      session.duration,
      session.accuracy,
      session.notesAttempted,
      session.notesHit,
      session.lowestNote || null,
      session.highestNote || null
    );

    // Delete existing note attempts for this session (in case of update)
    await database.runAsync(
      'DELETE FROM note_attempts WHERE session_id = ?',
      session.id
    );

    // Insert note attempts
    for (const attempt of session.noteAttempts) {
      await database.runAsync(
        `INSERT INTO note_attempts
          (session_id, note, target_frequency, actual_frequency, accuracy, duration, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        attempt.note,
        attempt.targetFrequency,
        attempt.actualFrequency,
        attempt.accuracy,
        attempt.duration,
        attempt.timestamp
      );
    }
  });
}

/**
 * Save multiple sessions (bulk insert)
 */
export async function saveSessions(sessions: SessionRecord[]): Promise<void> {
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    for (const session of sessions) {
      // Insert session
      await database.runAsync(
        `INSERT OR IGNORE INTO sessions
          (id, date, exercise_id, exercise_name, workout_id, duration, accuracy,
           notes_attempted, notes_hit, lowest_note, highest_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        session.date,
        session.exerciseId,
        session.exerciseName,
        session.workoutId || null,
        session.duration,
        session.accuracy,
        session.notesAttempted,
        session.notesHit,
        session.lowestNote || null,
        session.highestNote || null
      );

      // Insert note attempts
      for (const attempt of session.noteAttempts) {
        await database.runAsync(
          `INSERT INTO note_attempts
            (session_id, note, target_frequency, actual_frequency, accuracy, duration, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          session.id,
          attempt.note,
          attempt.targetFrequency,
          attempt.actualFrequency,
          attempt.accuracy,
          attempt.duration,
          attempt.timestamp
        );
      }
    }
  });

  console.log(`[SQLite] Saved ${sessions.length} sessions`);
}

/**
 * Get sessions with pagination
 */
export async function getSessions(
  limit: number = 100,
  offset: number = 0
): Promise<SessionRecord[]> {
  const database = await getDatabase();

  const sessions = await database.getAllAsync<{
    id: string;
    date: string;
    exercise_id: string;
    exercise_name: string;
    workout_id: string | null;
    duration: number;
    accuracy: number;
    notes_attempted: number;
    notes_hit: number;
    lowest_note: string | null;
    highest_note: string | null;
  }>(
    `SELECT * FROM sessions ORDER BY date DESC LIMIT ? OFFSET ?`,
    limit,
    offset
  );

  // Load note attempts for each session
  const result: SessionRecord[] = [];
  for (const session of sessions) {
    const noteAttempts = await database.getAllAsync<{
      note: string;
      target_frequency: number;
      actual_frequency: number;
      accuracy: number;
      duration: number;
      timestamp: number;
    }>(
      'SELECT * FROM note_attempts WHERE session_id = ? ORDER BY timestamp ASC',
      session.id
    );

    result.push({
      id: session.id,
      date: session.date,
      exerciseId: session.exercise_id,
      exerciseName: session.exercise_name,
      workoutId: session.workout_id || undefined,
      duration: session.duration,
      accuracy: session.accuracy,
      notesAttempted: session.notes_attempted,
      notesHit: session.notes_hit,
      lowestNote: session.lowest_note || undefined,
      highestNote: session.highest_note || undefined,
      noteAttempts: noteAttempts.map((a) => ({
        note: a.note,
        targetFrequency: a.target_frequency,
        actualFrequency: a.actual_frequency,
        accuracy: a.accuracy,
        duration: a.duration,
        timestamp: a.timestamp,
      })),
    });
  }

  return result;
}

/**
 * Get a single session by ID
 */
export async function getSessionById(sessionId: string): Promise<SessionRecord | null> {
  const database = await getDatabase();

  const session = await database.getFirstAsync<{
    id: string;
    date: string;
    exercise_id: string;
    exercise_name: string;
    workout_id: string | null;
    duration: number;
    accuracy: number;
    notes_attempted: number;
    notes_hit: number;
    lowest_note: string | null;
    highest_note: string | null;
  }>('SELECT * FROM sessions WHERE id = ?', sessionId);

  if (!session) return null;

  const noteAttempts = await database.getAllAsync<{
    note: string;
    target_frequency: number;
    actual_frequency: number;
    accuracy: number;
    duration: number;
    timestamp: number;
  }>(
    'SELECT * FROM note_attempts WHERE session_id = ? ORDER BY timestamp ASC',
    sessionId
  );

  return {
    id: session.id,
    date: session.date,
    exerciseId: session.exercise_id,
    exerciseName: session.exercise_name,
    workoutId: session.workout_id || undefined,
    duration: session.duration,
    accuracy: session.accuracy,
    notesAttempted: session.notes_attempted,
    notesHit: session.notes_hit,
    lowestNote: session.lowest_note || undefined,
    highestNote: session.highest_note || undefined,
    noteAttempts: noteAttempts.map((a) => ({
      note: a.note,
      targetFrequency: a.target_frequency,
      actualFrequency: a.actual_frequency,
      accuracy: a.accuracy,
      duration: a.duration,
      timestamp: a.timestamp,
    })),
  };
}

/**
 * Get total session count
 */
export async function getSessionCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sessions'
  );
  return result?.count || 0;
}

/**
 * Get sessions by date range
 */
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<SessionRecord[]> {
  const database = await getDatabase();

  const sessions = await database.getAllAsync<{
    id: string;
    date: string;
    exercise_id: string;
    exercise_name: string;
    workout_id: string | null;
    duration: number;
    accuracy: number;
    notes_attempted: number;
    notes_hit: number;
    lowest_note: string | null;
    highest_note: string | null;
  }>(
    'SELECT * FROM sessions WHERE date >= ? AND date <= ? ORDER BY date DESC',
    startDate,
    endDate
  );

  const result: SessionRecord[] = [];
  for (const session of sessions) {
    const noteAttempts = await database.getAllAsync<{
      note: string;
      target_frequency: number;
      actual_frequency: number;
      accuracy: number;
      duration: number;
      timestamp: number;
    }>(
      'SELECT * FROM note_attempts WHERE session_id = ? ORDER BY timestamp ASC',
      session.id
    );

    result.push({
      id: session.id,
      date: session.date,
      exerciseId: session.exercise_id,
      exerciseName: session.exercise_name,
      workoutId: session.workout_id || undefined,
      duration: session.duration,
      accuracy: session.accuracy,
      notesAttempted: session.notes_attempted,
      notesHit: session.notes_hit,
      lowestNote: session.lowest_note || undefined,
      highestNote: session.highest_note || undefined,
      noteAttempts: noteAttempts.map((a) => ({
        note: a.note,
        targetFrequency: a.target_frequency,
        actualFrequency: a.actual_frequency,
        accuracy: a.accuracy,
        duration: a.duration,
        timestamp: a.timestamp,
      })),
    });
  }

  return result;
}

/**
 * Delete a session by ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);
}

/**
 * Delete all sessions (for reset)
 */
export async function deleteAllSessions(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sessions');
  console.log('[SQLite] All sessions deleted');
}

/**
 * Check if migration has been applied
 */
export async function isMigrationApplied(name: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM migrations WHERE name = ?',
    name
  );
  return (result?.count || 0) > 0;
}

/**
 * Mark migration as applied
 */
export async function markMigrationApplied(name: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR IGNORE INTO migrations (name) VALUES (?)',
    name
  );
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

// Export adapter
export const sqliteAdapter = {
  saveSession,
  saveSessions,
  getSessions,
  getSessionById,
  getSessionCount,
  getSessionsByDateRange,
  deleteSession,
  deleteAllSessions,
  isMigrationApplied,
  markMigrationApplied,
  closeDatabase,
};
