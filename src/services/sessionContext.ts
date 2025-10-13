/**
 * Session Context Service
 * Tracks current practice session and provides smart "next exercise" logic
 *
 * Goal: Eliminate decision paralysis - user taps Start once, practices 5-6 exercises in flow
 */

import { Exercise } from '../data/models';
import { UserProgress } from '../data/userProgress';
import { getRecommendedExercise, getTimeOfDay } from './recommendationEngine';

export interface SessionExercise {
  exercise: Exercise;
  completed: boolean;
  accuracy?: number;
  skipped?: boolean;
}

export interface PracticeSession {
  id: string;
  startTime: Date;
  exercises: SessionExercise[];
  currentIndex: number;
  totalDuration: number; // estimated minutes
  isActive: boolean;
}

/**
 * Build a practice session queue
 * Uses WCA method: Warmup → Coordinate → Application
 */
export async function buildPracticeSession(
  userProgress: UserProgress,
  availableExercises: Exercise[],
  targetDuration: number = 15 // minutes
): Promise<PracticeSession> {
  const timeOfDay = getTimeOfDay();
  const sessionExercises: SessionExercise[] = [];

  // Separate exercises by type
  const breathingExercises = availableExercises.filter(e => e.type === 'breathing');
  const vocalExercises = availableExercises.filter(e => e.type === 'vocal');
  const warmups = vocalExercises.filter(e => e.category === 'warm-up');
  const scales = vocalExercises.filter(e => e.category === 'scale');
  const intervals = vocalExercises.filter(e => e.category === 'interval');

  // WCA Phase 1: WARMUP (3-4 minutes)
  // Start with breathing
  const breathingEx = breathingExercises.find(e => e.id === 'diaphragmatic-breathing');
  if (breathingEx) {
    sessionExercises.push({ exercise: breathingEx, completed: false });
  }

  // Add vocal warmup
  const warmupEx = warmups.find(e => e.id === '5-note-warmup') || warmups[0];
  if (warmupEx) {
    sessionExercises.push({ exercise: warmupEx, completed: false });
  }

  // WCA Phase 2: COORDINATE (6-8 minutes)
  // Progressive difficulty
  if (userProgress.weeksSinceFirstUse <= 2) {
    // Week 1-2: Simple scales only
    const majorThirds = scales.find(e => e.id === 'major-thirds');
    if (majorThirds) {
      sessionExercises.push({ exercise: majorThirds, completed: false });
    }
  } else if (userProgress.weeksSinceFirstUse <= 4) {
    // Week 3-4: Scales + simple intervals
    const majorThirds = scales.find(e => e.id === 'major-thirds');
    const octaveJumps = intervals.find(e => e.id === 'octave-jumps');
    if (majorThirds) sessionExercises.push({ exercise: majorThirds, completed: false });
    if (octaveJumps) sessionExercises.push({ exercise: octaveJumps, completed: false });
  } else {
    // Week 5+: More challenging work
    const cMajorScale = scales.find(e => e.id === 'c-major-scale');
    const perfectFourths = intervals.find(e => e.id === 'perfect-fourths');
    if (cMajorScale) sessionExercises.push({ exercise: cMajorScale, completed: false });
    if (perfectFourths) sessionExercises.push({ exercise: perfectFourths, completed: false });
  }

  // WCA Phase 3: APPLICATION (3-4 minutes)
  // Use recommendation engine to pick final exercise
  const recommendation = await getRecommendedExercise({
    timeOfDay,
    userProgress,
    availableExercises: vocalExercises,
    todaysExercises: [],
  });

  // Add recommendation if not already in session
  if (!sessionExercises.some(se => se.exercise.id === recommendation.exercise.id)) {
    sessionExercises.push({ exercise: recommendation.exercise, completed: false });
  }

  // Cool down: End with breathing
  const boxBreathing = breathingExercises.find(e => e.id === 'box-breathing');
  if (boxBreathing && sessionExercises.length < 6) {
    sessionExercises.push({ exercise: boxBreathing, completed: false });
  }

  // Calculate total estimated duration
  const totalDuration = sessionExercises.reduce((sum, se) => {
    return sum + Math.ceil(se.exercise.duration / 60);
  }, 0);

  return {
    id: `session-${Date.now()}`,
    startTime: new Date(),
    exercises: sessionExercises,
    currentIndex: 0,
    totalDuration,
    isActive: true,
  };
}

/**
 * Get next exercise in session
 */
export function getNextExercise(session: PracticeSession): Exercise | null {
  if (!session.isActive) return null;

  // Find first uncompleted exercise
  const nextIndex = session.exercises.findIndex(se => !se.completed && !se.skipped);

  if (nextIndex === -1) {
    // All exercises complete
    return null;
  }

  return session.exercises[nextIndex].exercise;
}

/**
 * Mark current exercise as complete
 */
export function markExerciseComplete(
  session: PracticeSession,
  exerciseId: string,
  accuracy: number
): PracticeSession {
  const updatedExercises = session.exercises.map(se => {
    if (se.exercise.id === exerciseId && !se.completed) {
      return { ...se, completed: true, accuracy };
    }
    return se;
  });

  // Update current index to next uncompleted
  const nextIndex = updatedExercises.findIndex(se => !se.completed && !se.skipped);

  return {
    ...session,
    exercises: updatedExercises,
    currentIndex: nextIndex === -1 ? updatedExercises.length : nextIndex,
    isActive: nextIndex !== -1, // Session ends when all complete
  };
}

/**
 * Skip current exercise
 */
export function skipExercise(
  session: PracticeSession,
  exerciseId: string
): PracticeSession {
  const updatedExercises = session.exercises.map(se => {
    if (se.exercise.id === exerciseId) {
      return { ...se, skipped: true };
    }
    return se;
  });

  const nextIndex = updatedExercises.findIndex(se => !se.completed && !se.skipped);

  return {
    ...session,
    exercises: updatedExercises,
    currentIndex: nextIndex === -1 ? updatedExercises.length : nextIndex,
    isActive: nextIndex !== -1,
  };
}

/**
 * End session early
 */
export function endSession(session: PracticeSession): PracticeSession {
  return {
    ...session,
    isActive: false,
  };
}

/**
 * Get session progress (for UI)
 */
export function getSessionProgress(session: PracticeSession): {
  current: number;
  total: number;
  percentComplete: number;
  timeElapsed: number;
} {
  const completedCount = session.exercises.filter(se => se.completed).length;
  const total = session.exercises.length;
  const percentComplete = total > 0 ? (completedCount / total) * 100 : 0;

  const now = new Date();
  const timeElapsed = Math.floor((now.getTime() - session.startTime.getTime()) / 1000 / 60); // minutes

  return {
    current: completedCount,
    total,
    percentComplete,
    timeElapsed,
  };
}

/**
 * Get session summary stats
 */
export function getSessionSummary(session: PracticeSession): {
  exercisesCompleted: number;
  exercisesSkipped: number;
  totalExercises: number;
  averageAccuracy: number;
  totalTime: number;
} {
  const completedExercises = session.exercises.filter(se => se.completed);
  const skippedExercises = session.exercises.filter(se => se.skipped);

  const averageAccuracy = completedExercises.length > 0
    ? completedExercises.reduce((sum, se) => sum + (se.accuracy || 0), 0) / completedExercises.length
    : 0;

  const now = new Date();
  const totalTime = Math.floor((now.getTime() - session.startTime.getTime()) / 1000 / 60);

  return {
    exercisesCompleted: completedExercises.length,
    exercisesSkipped: skippedExercises.length,
    totalExercises: session.exercises.length,
    averageAccuracy: Math.round(averageAccuracy),
    totalTime,
  };
}
