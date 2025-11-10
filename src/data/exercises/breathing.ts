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

// 4-7-8 Breathing (Dr. Andrew Weil's relaxation technique)
export const fourSevenEightBreathing: Exercise = {
  id: '4-7-8-breathing',
  name: '4-7-8 Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'beginner',
  duration: 95, // 5 rounds × 19 seconds = 95 seconds
  description: 'Natural tranquilizer for the nervous system',
  icon: '😌',
  instructions: [
    'Developed by Dr. Andrew Weil for relaxation',
    'Inhale quietly through your nose',
    'Hold your breath',
    'Exhale completely through your mouth',
    'Perfect before bed or when anxious',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 4, holdBeats: 7, exhaleBeats: 8 },
    { number: 2, inhaleBeats: 4, holdBeats: 7, exhaleBeats: 8 },
    { number: 3, inhaleBeats: 4, holdBeats: 7, exhaleBeats: 8 },
    { number: 4, inhaleBeats: 4, holdBeats: 7, exhaleBeats: 8 },
    { number: 5, inhaleBeats: 4, holdBeats: 7, exhaleBeats: 8 },
  ],
};

// Wim Hof Method (simplified version)
export const wimHofBreathing: Exercise = {
  id: 'wim-hof-breathing',
  name: 'Power Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'advanced',
  duration: 120,
  description: 'Energizing breath work to boost oxygen and energy',
  icon: '❄️',
  instructions: [
    'Inspired by the Wim Hof Method',
    'Deep, powerful breaths',
    'Increases oxygen saturation',
    'Boosts energy and alertness',
    'Practice on an empty stomach',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 2 },
    { number: 2, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 2 },
    { number: 3, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 2 },
    { number: 4, inhaleBeats: 2, holdBeats: 15, exhaleBeats: 2 }, // Retention after round
  ],
};

// Alternate Nostril Breathing (Nadi Shodhana)
export const alternateNostrilBreathing: Exercise = {
  id: 'alternate-nostril-breathing',
  name: 'Alternate Nostril',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'intermediate',
  duration: 100,
  description: 'Balance both hemispheres of the brain',
  icon: '🧘‍♀️',
  instructions: [
    'Ancient yogic breathing technique',
    'Close right nostril, inhale through left',
    'Close left nostril, exhale through right',
    'Balances nervous system',
    'Improves focus and calmness',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 2, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 3, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 4, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
    { number: 5, inhaleBeats: 4, holdBeats: 4, exhaleBeats: 4 },
  ],
};

// Pursed Lip Breathing (for singers)
export const pursedLipBreathing: Exercise = {
  id: 'pursed-lip-breathing',
  name: 'Pursed Lip Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'beginner',
  duration: 70,
  description: 'Improve breath control and lung function',
  icon: '💋',
  instructions: [
    'Used by singers and wind instrument players',
    'Breathe in through nose',
    'Purse lips as if whistling',
    'Exhale slowly through pursed lips',
    'Strengthens breathing muscles',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 4 },
    { number: 2, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 4 },
    { number: 3, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 4 },
    { number: 4, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 4 },
    { number: 5, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 4 },
    { number: 6, inhaleBeats: 2, holdBeats: 0, exhaleBeats: 4 },
  ],
};

// Breath Retention Training
export const breathRetention: Exercise = {
  id: 'breath-retention',
  name: 'Breath Retention',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'advanced',
  duration: 100,
  description: 'Build lung capacity with progressive holds',
  icon: '⏸️',
  instructions: [
    'Advanced breath control',
    'Increases CO2 tolerance',
    'Builds mental focus',
    'Stop if you feel lightheaded',
    'Advanced vocalists only',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 4, holdBeats: 8, exhaleBeats: 4 },
    { number: 2, inhaleBeats: 4, holdBeats: 10, exhaleBeats: 4 },
    { number: 3, inhaleBeats: 4, holdBeats: 12, exhaleBeats: 4 },
    { number: 4, inhaleBeats: 4, holdBeats: 15, exhaleBeats: 4 },
  ],
};

// Quick Energizing Breath
export const quickEnergizing: Exercise = {
  id: 'quick-energizing',
  name: 'Quick Energy Boost',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'beginner',
  duration: 40,
  description: 'Fast breathing to wake up before performing',
  icon: '⚡',
  instructions: [
    'Perfect before a performance',
    'Quick, sharp breaths',
    'Increases alertness',
    'Energizes the body',
    'Use before vocal exercises',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 1, holdBeats: 0, exhaleBeats: 1 },
    { number: 2, inhaleBeats: 1, holdBeats: 0, exhaleBeats: 1 },
    { number: 3, inhaleBeats: 1, holdBeats: 0, exhaleBeats: 1 },
    { number: 4, inhaleBeats: 1, holdBeats: 0, exhaleBeats: 1 },
    { number: 5, inhaleBeats: 1, holdBeats: 0, exhaleBeats: 1 },
    { number: 6, inhaleBeats: 1, holdBeats: 0, exhaleBeats: 1 },
  ],
};

// Extended Exhale Breathing
export const extendedExhale: Exercise = {
  id: 'extended-exhale',
  name: 'Extended Exhale',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'intermediate',
  duration: 80,
  description: 'Activate parasympathetic nervous system for relaxation',
  icon: '🌙',
  instructions: [
    'Longer exhale than inhale',
    'Calms the nervous system',
    'Perfect for reducing performance anxiety',
    'Focus on smooth, controlled exhale',
    'Great before bed or auditions',
  ],

  breathingRounds: [
    { number: 1, inhaleBeats: 4, holdBeats: 0, exhaleBeats: 6 },
    { number: 2, inhaleBeats: 4, holdBeats: 0, exhaleBeats: 7 },
    { number: 3, inhaleBeats: 4, holdBeats: 0, exhaleBeats: 8 },
    { number: 4, inhaleBeats: 4, holdBeats: 0, exhaleBeats: 9 },
    { number: 5, inhaleBeats: 4, holdBeats: 0, exhaleBeats: 10 },
  ],
};

// Coherent Breathing (Resonant Frequency Breathing)
export const coherentBreathing: Exercise = {
  id: 'coherent-breathing',
  name: 'Coherent Breathing',
  type: 'breathing',
  category: 'breathing',
  difficulty: 'beginner',
  duration: 60,
  description: '5-5 breathing for optimal heart rate variability',
  icon: '❤️',
  instructions: [
    'Scientifically proven to reduce stress',
    '5 seconds in, 5 seconds out',
    'Optimizes heart rate variability',
    'Improves cardiovascular health',
    'Perfect daily practice',
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
  fourSevenEightBreathing,
  wimHofBreathing,
  alternateNostrilBreathing,
  pursedLipBreathing,
  breathRetention,
  quickEnergizing,
  extendedExhale,
  coherentBreathing,
];
