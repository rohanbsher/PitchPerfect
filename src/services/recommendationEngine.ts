/**
 * Recommendation Engine
 * Smart algorithm to recommend the best exercise for user right now
 * Based on: time of day, user progression, exercise history
 *
 * Design Philosophy (Steve Jobs): "Focus means saying NO to good ideas"
 * - Show ONE clear recommendation, not multiple options
 * - Remove decision paralysis
 * - Guide user through structured progression
 */

import { Exercise } from '../data/models';
import { UserProgress, CompletedExercise, hasCompletedExercise, getTodaysExercises } from '../data/userProgress';

// ============================================
// RECOMMENDATION CONTEXT
// ============================================

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface RecommendationContext {
  timeOfDay: TimeOfDay;
  userProgress: UserProgress;
  availableExercises: Exercise[];
  todaysExercises: CompletedExercise[];
}

export interface RecommendationResult {
  exercise: Exercise;
  reason: string; // Why we're recommending this
  motivationalText: string; // Personalized encouragement
}

// ============================================
// TIME-BASED LOGIC
// ============================================

/**
 * Get current time of day
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(timeOfDay: TimeOfDay, userName: string): string {
  const greetings = {
    morning: `Good morning, ${userName} 👋`,
    afternoon: `Good afternoon, ${userName} 👋`,
    evening: `Good evening, ${userName} 👋`,
    night: `Hello, ${userName} 👋`,
  };

  return greetings[timeOfDay];
}

/**
 * Get motivational subtext based on context
 */
export function getMotivationalSubtext(
  timeOfDay: TimeOfDay,
  streak: number,
  isFirstTime: boolean
): string {
  if (isFirstTime) {
    return "Let's get started with your first exercise!";
  }

  if (streak === 0) {
    return "Ready to start a new practice streak?";
  }

  if (streak >= 7) {
    return `Amazing ${streak}-day streak! Keep it going! 🔥`;
  }

  if (timeOfDay === 'morning') {
    return "Ready for your daily warmup?";
  }

  if (timeOfDay === 'evening') {
    return "Time for today's practice session!";
  }

  return "Let's practice together!";
}

// ============================================
// RECOMMENDATION ALGORITHM
// ============================================

/**
 * Main recommendation function
 * Returns the best exercise for user right now
 */
export async function getRecommendedExercise(
  context: RecommendationContext
): Promise<RecommendationResult> {
  const { timeOfDay, userProgress, availableExercises, todaysExercises } = context;

  // Filter exercises by type
  const breathingExercises = availableExercises.filter(e => e.type === 'breathing');
  const vocalExercises = availableExercises.filter(e => e.type === 'vocal');

  // RULE 1: First-time user → Always start with breathing
  if (userProgress.weeksSinceFirstUse === 0 && todaysExercises.length === 0) {
    const diaphragmatic = breathingExercises.find(e => e.id === 'diaphragmatic-breathing');
    if (diaphragmatic) {
      return {
        exercise: diaphragmatic,
        reason: "Let's start with the foundation",
        motivationalText: "80% of vocal problems are breathing-related. Master this first!",
      };
    }
  }

  // RULE 2: Morning (6am-12pm) → Gentle warmup
  if (timeOfDay === 'morning') {
    // Prefer 5-Note Warm-Up in morning
    const fiveNoteWarmup = vocalExercises.find(e => e.id === '5-note-warmup');
    if (fiveNoteWarmup) {
      return {
        exercise: fiveNoteWarmup,
        reason: "Perfect way to start your morning",
        motivationalText: "Gentle warmup to wake up your voice",
      };
    }

    // Fallback to any beginner warmup
    const beginnerWarmup = vocalExercises.find(
      e => e.difficulty === 'beginner' && e.category === 'warm-up'
    );
    if (beginnerWarmup) {
      return {
        exercise: beginnerWarmup,
        reason: "Morning warmup",
        motivationalText: "Start your day with vocal practice",
      };
    }
  }

  // RULE 3: Evening (6pm-11pm) → More challenging practice
  if (timeOfDay === 'evening') {
    // If they've done warmups today, suggest intermediate exercise
    const hasWarmedUp = todaysExercises.some(
      e => e.exerciseId === '5-note-warmup' || e.exerciseId === 'major-thirds'
    );

    if (hasWarmedUp) {
      const intermediateExercise = vocalExercises.find(
        e => e.difficulty === 'intermediate' && !todaysExercises.some(t => t.exerciseId === e.id)
      );

      if (intermediateExercise) {
        return {
          exercise: intermediateExercise,
          reason: "You've warmed up - ready for a challenge",
          motivationalText: "Let's push your skills further tonight",
        };
      }
    }
  }

  // RULE 4: Week-based progression
  const week = userProgress.weeksSinceFirstUse;

  // Week 1-2: Foundation (breathing + simple scales)
  if (week <= 2) {
    // Alternate between breathing and simple vocal
    const lastExerciseWasBreathing = todaysExercises[todaysExercises.length - 1]?.exerciseId.includes('breathing');

    if (!lastExerciseWasBreathing && breathingExercises.length > 0) {
      // Suggest breathing exercise
      const boxBreathing = breathingExercises.find(e => e.id === 'box-breathing');
      if (boxBreathing) {
        return {
          exercise: boxBreathing,
          reason: "Foundation week - breath control",
          motivationalText: "Breathing exercises calm nerves and improve control",
        };
      }
    }

    // Suggest simple vocal exercise
    const simpleExercise = vocalExercises.find(
      e => (e.id === '5-note-warmup' || e.id === 'major-thirds') &&
           !todaysExercises.some(t => t.exerciseId === e.id)
    );

    if (simpleExercise) {
      return {
        exercise: simpleExercise,
        reason: "Foundation week - building basics",
        motivationalText: "You're building a strong foundation!",
      };
    }
  }

  // Week 3-4: Basic Coordination
  if (week > 2 && week <= 4) {
    const basicExercises = vocalExercises.filter(
      e => (e.id === 'major-thirds' || e.id === 'c-major-scale') &&
           !todaysExercises.some(t => t.exerciseId === e.id)
    );

    if (basicExercises.length > 0) {
      return {
        exercise: basicExercises[0],
        reason: "Building coordination skills",
        motivationalText: "You're making great progress!",
      };
    }
  }

  // Week 5-8: Intermediate Control
  if (week > 4 && week <= 8) {
    const intermediateExercises = vocalExercises.filter(
      e => (e.id === 'octave-jump' || e.id === 'full-scale-up-down') &&
           !todaysExercises.some(t => t.exerciseId === e.id)
    );

    if (intermediateExercises.length > 0) {
      return {
        exercise: intermediateExercises[0],
        reason: "Expanding your range and control",
        motivationalText: "Your voice is getting stronger!",
      };
    }
  }

  // RULE 5: Avoid repeating exercises from today
  const notDoneToday = availableExercises.filter(
    e => !todaysExercises.some(t => t.exerciseId === e.id)
  );

  if (notDoneToday.length > 0) {
    return {
      exercise: notDoneToday[0],
      reason: "Something new for today",
      motivationalText: "Variety keeps practice interesting!",
    };
  }

  // FALLBACK: Return first available exercise
  return {
    exercise: availableExercises[0],
    reason: "Recommended for you",
    motivationalText: "Let's practice together!",
  };
}

/**
 * Get recommendation reason text for UI display
 */
export function getRecommendationReasonText(
  exercise: Exercise,
  timeOfDay: TimeOfDay,
  userProgress: UserProgress
): string {
  const { weeksSinceFirstUse } = userProgress;

  // First time user
  if (weeksSinceFirstUse === 0) {
    if (exercise.type === 'breathing') {
      return "Start with the foundation - breathing is 80% of vocal training";
    }
    return "Your first vocal exercise - let's build good habits!";
  }

  // Time-based
  if (timeOfDay === 'morning' && exercise.difficulty === 'beginner') {
    return "Perfect way to start your morning practice";
  }

  if (timeOfDay === 'evening' && exercise.difficulty === 'intermediate') {
    return "Evening is great for focused, challenging practice";
  }

  // Week-based
  if (weeksSinceFirstUse <= 2) {
    return "Foundation week - building the basics";
  }

  if (weeksSinceFirstUse > 2 && weeksSinceFirstUse <= 4) {
    return "You're progressing - time to build coordination";
  }

  if (weeksSinceFirstUse > 4 && weeksSinceFirstUse <= 8) {
    return "Intermediate level - expanding range and control";
  }

  // Default
  return "Recommended based on your progress";
}

/**
 * Get next suggested exercise after completing current one
 */
export async function getNextExerciseRecommendation(
  completedExerciseId: string,
  availableExercises: Exercise[],
  todaysExercises: CompletedExercise[]
): Promise<Exercise | null> {
  // If just completed breathing, suggest vocal exercise
  if (completedExerciseId.includes('breathing')) {
    const vocal = availableExercises.find(
      e => e.type === 'vocal' && e.difficulty === 'beginner' &&
           !todaysExercises.some(t => t.exerciseId === e.id)
    );
    return vocal || null;
  }

  // If just completed warmup, suggest scale
  if (completedExerciseId === '5-note-warmup') {
    const scale = availableExercises.find(
      e => e.category === 'scale' && !todaysExercises.some(t => t.exerciseId === e.id)
    );
    return scale || null;
  }

  // If just completed scale, suggest interval training
  if (completedExerciseId === 'c-major-scale') {
    const interval = availableExercises.find(
      e => e.category === 'interval' && !todaysExercises.some(t => t.exerciseId === e.id)
    );
    return interval || null;
  }

  // Default: return first not done today
  const notDoneToday = availableExercises.filter(
    e => !todaysExercises.some(t => t.exerciseId === e.id)
  );

  return notDoneToday[0] || null;
}
