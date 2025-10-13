/**
 * Data Models for PitchPerfect
 * Defines exercises, sessions, and results
 */

export interface Note {
  note: string; // "C4", "D4", etc.
  frequency: number; // Hz
}

export type ExerciseCategory = 'breathing' | 'warm-up' | 'scale' | 'arpeggio' | 'interval';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'vocal' | 'breathing';

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType; // NEW: Determines if this is vocal or breathing
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  duration: number; // estimated seconds
  description: string;
  instructions: string[];
  icon?: string; // Optional emoji icon for UI display (e.g., "🎹", "🎵", "🫁")

  // VOCAL EXERCISE FIELDS (optional for breathing exercises)
  notes?: Note[]; // Optional now - not needed for breathing
  defaultTempo?: number; // BPM (beats per minute)
  defaultStartingNote?: string; // "C4"
  allowTempoChange?: boolean;
  allowKeyChange?: boolean;

  // BREATHING EXERCISE FIELDS (optional for vocal exercises)
  breathingRounds?: BreathingRound[]; // Only for breathing exercises
}

export interface PitchReading {
  timestamp: number;
  frequency: number;
  confidence: number;
  targetFrequency: number;
  centsOff: number;
}

export interface NoteResult {
  noteExpected: string;
  frequencyExpected: number;
  averageAccuracy: number; // 0-100
  passed: boolean; // >= 70%
  pitchReadings: PitchReading[];
}

export interface ExerciseSession {
  exerciseId: string;
  startTime: Date;
  currentNoteIndex: number;
  totalNotes: number;

  // Real-time tracking
  pitchReadings: PitchReading[];

  // Results per note
  noteResults: NoteResult[];
}

export interface ExerciseResults {
  exerciseId: string;
  completedAt: Date;
  duration: number; // seconds
  overallAccuracy: number; // 0-100
  noteResults: NoteResult[];
  strengths: string[]; // "Great pitch on high notes"
  improvements: string[]; // "Work on F4, you went flat"
}

export interface ExerciseSettings {
  tempo: number; // BPM
  startingNote: string; // "C4"
  repeatCount: number; // 1, 3, 5, 10
  tolerance: number; // cents (±20 for beginner, ±15 for intermediate, ±10 for advanced)
}

// BREATHING EXERCISES

export interface BreathingRound {
  number: number; // Round 1, 2, 3, 4
  inhaleBeats: number; // Seconds to inhale
  holdBeats: number; // Seconds to hold
  exhaleBeats: number; // Seconds to exhale
}

export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  rounds: BreathingRound[];
  totalDuration: number; // Total seconds (calculated)
  benefits: string[];
}

export interface BreathingSession {
  exerciseId: string;
  startTime: Date;
  currentRound: number;
  currentPhase: 'inhale' | 'hold' | 'exhale';
  beatsRemaining: number;
  completed: boolean;
}

// Farinelli Breathing Exercise - 18th century technique
export const farinelliBreathing: BreathingExercise = {
  id: 'farinelli-breathing',
  name: 'Farinelli Breathing',
  description: 'Build lung capacity and control with progressive breath holds',
  instructions: [
    'Sit or stand with straight posture',
    'Breathe through your nose during inhale',
    'Keep shoulders relaxed',
    'Exhale smoothly and steadily',
    'Complete all 4 rounds without rushing',
  ],
  rounds: [
    { number: 1, inhaleBeats: 5, holdBeats: 5, exhaleBeats: 5 },
    { number: 2, inhaleBeats: 6, holdBeats: 6, exhaleBeats: 6 },
    { number: 3, inhaleBeats: 7, holdBeats: 7, exhaleBeats: 7 },
    { number: 4, inhaleBeats: 8, holdBeats: 8, exhaleBeats: 8 },
  ],
  totalDuration: 156, // (5+5+5)*1 + (6+6+6)*1 + (7+7+7)*1 + (8+8+8)*1 = 156 seconds = 2.6 minutes
  benefits: [
    'Increases lung capacity by 15-30%',
    'Improves breath control for long phrases',
    'Reduces performance anxiety',
    'Strengthens diaphragm',
  ],
};
