/**
 * Breathing Exercises
 * Foundation for vocal training - 80% of vocal problems are breathing-related
 */

import { Exercise, BreathingRound } from '../models';

// Box Breathing (4-4-4-4) - Navy SEAL technique
export const boxBreathing: Exercise = {
  id: 'box-breathing',
  name: 'Box Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'beginner',
  duration: 64, // 4 rounds × 16 seconds = 64 seconds
  description: 'Calm your nerves and focus your mind with this military breathing technique',
  icon: '⏱️', // Timer icon (rhythmic/timed breathing)
  instructions: [
    'Sit comfortably with straight posture',
    'Breathe through your nose',
    'Keep shoulders relaxed',
    'Focus on the rhythm: equal time for each phase',
    'Perfect before performing or when feeling anxious',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 2, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 3, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 4, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
  ],
};

// Farinelli Breathing - 18th century opera singer technique
export const farinelliBreathing: Exercise = {
  id: 'farinelli-breathing',
  name: 'Farinelli Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'intermediate',
  duration: 120, // Progressive rounds totaling ~2 minutes
  description: 'Build lung capacity and breath control with progressive holds',
  icon: '🧘', // Meditation/mindfulness icon (advanced breathing)
  instructions: [
    'Named after legendary 18th century opera singer',
    'Breathe through your nose during inhale',
    'Keep shoulders relaxed throughout',
    'Exhale smoothly and steadily',
    'Increases lung capacity by 15-30% with practice',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 5, holdBeats: 5, exhaleBeats: 5 },
    { number: 2, inhaleBeats: 6, holdBeats: 6, exhaleBeats: 6 },
    { number: 3, inhaleBeats: 7, holdBeats: 7, exhaleBeats: 7 },
    { number: 4, inhaleBeats: 8, holdBeats: 8, exhaleBeats: 8 },
  ],
};

// Diaphragmatic Breathing - Core foundation
export const diaphragmaticBreathing: Exercise = {
  id: 'diaphragmatic-breathing',
  name: 'Diaphragmatic Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'beginner',
  duration: 90, // 6 rounds × 15 seconds = 90 seconds
  description: 'Master belly breathing - the foundation of vocal power',
  icon: '🫁', // Lungs icon (fundamental breathing)
  instructions: [
    'Place one hand on your chest, one on your belly',
    'Your belly should expand on inhale (not your chest)',
    'Imagine filling a balloon in your lower abdomen',
    'This is how professional singers breathe',
    'Practice daily for best results',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 5, holdBeats: 0, exhaleBeats: 5 },
    { number: 2, inhaleBeats: 5, holdBeats: 0, exhaleBeats: 5 },
    { number: 3, inhaleBeats: 5, holdBeats: 0, exhaleBeats: 5 },
    { number: 4, inhaleBeats: 5, holdBeats: 0, exhaleBeats: 5 },
    { number: 5, inhaleBeats: 5, holdBeats: 0, exhaleBeats: 5 },
    { number: 6, inhaleBeats: 5, holdBeats: 0, exhaleBeats: 5 },
  ],
};

// All breathing exercises
export const breathingExercises: Exercise[] = [
  boxBreathing,
  diaphragmaticBreathing,
  farinelliBreathing,
];
