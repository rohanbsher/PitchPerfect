/**
 * Practice Store
 *
 * Zustand store for managing practice/exercise state.
 * Replaces scattered useState hooks and context for pitch detection and exercise flow.
 *
 * Benefits:
 * - No re-render cascade (only subscribed components update)
 * - Centralized state management
 * - Easy to test and debug
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Exercise state machine
export type ExerciseState =
  | 'idle'
  | 'warmup'
  | 'countdown'
  | 'playing'
  | 'listening'
  | 'feedback'
  | 'complete'
  | 'paused';

// Pitch detection data
export interface PitchData {
  frequency: number;
  confidence: number;
  note: string;
  cents: number;
  timestamp: number;
}

// Target note for current exercise step
export interface TargetNote {
  note: string;
  frequency: number;
  duration: number;
}

// Practice store state
export interface PracticeState {
  // Exercise flow state
  exerciseState: ExerciseState;
  currentExerciseId: string | null;
  currentExerciseName: string | null;
  currentWorkoutId: string | null;

  // Current note/target
  targetNote: TargetNote | null;
  currentNoteIndex: number;
  totalNotes: number;

  // Pitch detection
  pitchData: PitchData | null;
  isListening: boolean;
  accuracy: number;

  // Session tracking
  sessionStartTime: number | null;
  notesAttempted: number;
  notesHit: number;
  sessionAccuracy: number;

  // Breathing exercise
  isBreathingExercise: boolean;
  breathingPhase: 'inhale' | 'hold' | 'exhale' | 'rest';

  // Coaching
  coachingTip: string | null;
  consecutiveLowScores: number;

  // Actions
  startExercise: (exerciseId: string, exerciseName: string, workoutId?: string) => void;
  stopExercise: () => void;
  pauseExercise: () => void;
  resumeExercise: () => void;
  setExerciseState: (state: ExerciseState) => void;
  setTargetNote: (note: TargetNote | null) => void;
  advanceToNextNote: () => void;
  setPitchData: (data: PitchData | null) => void;
  setAccuracy: (accuracy: number) => void;
  recordNoteAttempt: (hit: boolean) => void;
  setCoachingTip: (tip: string | null) => void;
  incrementLowScores: () => void;
  resetLowScores: () => void;
  setBreathingPhase: (phase: 'inhale' | 'hold' | 'exhale' | 'rest') => void;
  reset: () => void;
}

// Initial state
const initialState = {
  exerciseState: 'idle' as ExerciseState,
  currentExerciseId: null,
  currentExerciseName: null,
  currentWorkoutId: null,
  targetNote: null,
  currentNoteIndex: 0,
  totalNotes: 0,
  pitchData: null,
  isListening: false,
  accuracy: 0,
  sessionStartTime: null,
  notesAttempted: 0,
  notesHit: 0,
  sessionAccuracy: 0,
  isBreathingExercise: false,
  breathingPhase: 'rest' as const,
  coachingTip: null,
  consecutiveLowScores: 0,
};

// Create the store with selector middleware for optimized subscriptions
export const usePracticeStore = create<PracticeState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    startExercise: (exerciseId, exerciseName, workoutId) =>
      set({
        exerciseState: 'warmup',
        currentExerciseId: exerciseId,
        currentExerciseName: exerciseName,
        currentWorkoutId: workoutId || null,
        sessionStartTime: Date.now(),
        notesAttempted: 0,
        notesHit: 0,
        sessionAccuracy: 0,
        currentNoteIndex: 0,
        coachingTip: null,
        consecutiveLowScores: 0,
        isBreathingExercise: exerciseId.includes('breathing'),
      }),

    stopExercise: () =>
      set({
        ...initialState,
      }),

    pauseExercise: () => {
      const current = get().exerciseState;
      if (current !== 'idle' && current !== 'complete') {
        set({ exerciseState: 'paused' });
      }
    },

    resumeExercise: () => {
      const state = get();
      if (state.exerciseState === 'paused') {
        set({ exerciseState: 'playing' });
      }
    },

    setExerciseState: (exerciseState) =>
      set({
        exerciseState,
        isListening: exerciseState === 'listening',
      }),

    setTargetNote: (targetNote) =>
      set({
        targetNote,
        accuracy: 0,
      }),

    advanceToNextNote: () =>
      set((state) => ({
        currentNoteIndex: state.currentNoteIndex + 1,
        accuracy: 0,
      })),

    setPitchData: (pitchData) =>
      set({
        pitchData,
      }),

    setAccuracy: (accuracy) =>
      set({
        accuracy,
      }),

    recordNoteAttempt: (hit) =>
      set((state) => {
        const notesAttempted = state.notesAttempted + 1;
        const notesHit = state.notesHit + (hit ? 1 : 0);
        const sessionAccuracy = notesAttempted > 0 ? (notesHit / notesAttempted) * 100 : 0;

        return {
          notesAttempted,
          notesHit,
          sessionAccuracy,
        };
      }),

    setCoachingTip: (coachingTip) =>
      set({
        coachingTip,
      }),

    incrementLowScores: () =>
      set((state) => ({
        consecutiveLowScores: state.consecutiveLowScores + 1,
      })),

    resetLowScores: () =>
      set({
        consecutiveLowScores: 0,
      }),

    setBreathingPhase: (breathingPhase) =>
      set({
        breathingPhase,
      }),

    reset: () => set(initialState),
  }))
);

// Selector hooks for optimized subscriptions
export const useExerciseState = () => usePracticeStore((state) => state.exerciseState);
export const usePitchData = () => usePracticeStore((state) => state.pitchData);
export const useTargetNote = () => usePracticeStore((state) => state.targetNote);
export const useAccuracy = () => usePracticeStore((state) => state.accuracy);
export const useSessionStats = () =>
  usePracticeStore((state) => ({
    notesAttempted: state.notesAttempted,
    notesHit: state.notesHit,
    sessionAccuracy: state.sessionAccuracy,
  }));
export const useCoachingTip = () => usePracticeStore((state) => state.coachingTip);
export const useBreathingPhase = () => usePracticeStore((state) => state.breathingPhase);
