/**
 * Curriculum Data Structure
 * Defines the 8-week structured learning journey
 * Each week has a focus, goal, and recommended exercises
 */

export interface Week {
  weekNumber: number;
  title: string;
  focus: string;
  goal: string;
  exerciseIds: string[]; // IDs from exercises/scales.ts and breathing.ts
  daysPerWeek: number;
}

export const curriculum: Week[] = [
  {
    weekNumber: 1,
    title: 'Foundation',
    focus: 'Master breathing basics and simple warm-ups',
    goal: 'Build core breathing technique and vocal preparation habits',
    exerciseIds: [
      'diaphragmatic-breathing',
      'box-breathing',
      '5-note-warm-up',
    ],
    daysPerWeek: 3,
  },
  {
    weekNumber: 2,
    title: 'Consistency',
    focus: 'Daily practice with breathing + basic scales',
    goal: 'Establish daily vocal practice routine',
    exerciseIds: [
      'diaphragmatic-breathing',
      'box-breathing',
      'c-major-scale',
      '5-note-warm-up',
    ],
    daysPerWeek: 4,
  },
  {
    weekNumber: 3,
    title: 'Range Building',
    focus: 'Expand comfortable singing range',
    goal: 'Sing full octave with confidence',
    exerciseIds: [
      'farinelli-breathing',
      'c-major-scale',
      'full-scale-up-down',
    ],
    daysPerWeek: 4,
  },
  {
    weekNumber: 4,
    title: 'Precision',
    focus: 'Interval accuracy and pitch control',
    goal: 'Hit target notes consistently within 20 cents',
    exerciseIds: [
      'farinelli-breathing',
      'major-thirds',
      'octave-jumps',
    ],
    daysPerWeek: 5,
  },
  {
    weekNumber: 5,
    title: 'Stamina',
    focus: 'Longer exercises and breath control',
    goal: 'Complete full exercises without vocal fatigue',
    exerciseIds: [
      'farinelli-breathing',
      'full-scale-up-down',
      'octave-jumps',
    ],
    daysPerWeek: 5,
  },
  {
    weekNumber: 6,
    title: 'Refinement',
    focus: 'Perfect tone quality and consistency',
    goal: '85%+ accuracy on all exercises',
    exerciseIds: [
      'farinelli-breathing',
      'c-major-scale',
      'major-thirds',
      'full-scale-up-down',
    ],
    daysPerWeek: 5,
  },
  {
    weekNumber: 7,
    title: 'Challenge',
    focus: 'Master advanced intervals and techniques',
    goal: 'Complete all exercises with high accuracy',
    exerciseIds: [
      'farinelli-breathing',
      'octave-jumps',
      'major-thirds',
      'full-scale-up-down',
    ],
    daysPerWeek: 5,
  },
  {
    weekNumber: 8,
    title: 'Mastery',
    focus: 'Personalize your practice routine',
    goal: 'Design your own workout from exercise library',
    exerciseIds: [
      // User chooses based on their goals
      'farinelli-breathing',
      'c-major-scale',
      'major-thirds',
      'octave-jumps',
      'full-scale-up-down',
    ],
    daysPerWeek: 6,
  },
];

/**
 * Get current week based on user's start date
 * @param startDate - When user first started using the app
 * @returns Current week number (1-8)
 */
export const getCurrentWeek = (startDate: Date): number => {
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;

  // Cap at week 8 (after that, users are in "mastery mode")
  return Math.min(weekNumber, 8);
};

/**
 * Get recommended exercise for today based on curriculum
 * @param currentWeek - User's current week (1-8)
 * @param completedToday - Exercise IDs completed today
 * @returns Recommended exercise ID
 */
export const getTodaysRecommendation = (
  currentWeek: number,
  completedToday: string[]
): string => {
  const week = curriculum[currentWeek - 1];

  // Find first exercise not completed today
  const uncompletedExercise = week.exerciseIds.find(
    id => !completedToday.includes(id)
  );

  // If all completed, start from beginning
  return uncompletedExercise || week.exerciseIds[0];
};
