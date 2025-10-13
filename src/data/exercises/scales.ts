/**
 * Scale Exercises
 * Major, minor, chromatic scales in all keys
 */

import { Exercise, Note } from '../models';

// Note frequencies
const NOTES: { [key: string]: number } = {
  'C4': 261.63,
  'D4': 293.66,
  'E4': 329.63,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00,
  'B4': 493.88,
  'C5': 523.25,
};

// C Major Scale (up and down)
export const cMajorScale: Exercise = {
  id: 'c-major-scale',
  name: 'C Major Scale',
  type: 'vocal', // VOCAL EXERCISE
  category: 'scale',
  difficulty: 'beginner',
  duration: 30, // seconds
  description: 'Practice the C Major scale ascending and descending',
  icon: '🎹', // Piano keyboard icon
  instructions: [
    'Put on headphones for best experience',
    'Listen to each note played by the piano',
    'Sing it back immediately after hearing it',
    'Follow along continuously - no need to touch anything!',
    'The exercise will advance automatically',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 80, // BPM
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: false, // C Major is always C
};

// 5-Note Warm-Up (simpler)
export const fiveNoteWarmup: Exercise = {
  id: '5-note-warmup',
  name: '5-Note Warm-Up',
  type: 'vocal', // VOCAL EXERCISE
  category: 'warm-up',
  difficulty: 'beginner',
  duration: 15, // seconds
  description: 'Gentle warm-up with 5 notes',
  icon: '🎵', // Musical note icon
  instructions: [
    'Perfect for starting your practice session',
    'Listen and sing along',
    'Focus on smooth transitions between notes',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 60, // Slower for warm-up
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Octave Jump Exercise (interval training)
export const octaveJump: Exercise = {
  id: 'octave-jump',
  name: 'Octave Jumps',
  type: 'vocal', // VOCAL EXERCISE
  category: 'interval',
  difficulty: 'intermediate',
  duration: 20,
  description: 'Practice jumping between octaves to expand vocal range',
  icon: '🦘', // Kangaroo jumping icon
  instructions: [
    'Great for expanding your range',
    'Jump from low to high note',
    'Keep breath support strong',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 70,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Major Thirds Exercise (interval training)
export const majorThirds: Exercise = {
  id: 'major-thirds',
  name: 'Major Thirds',
  type: 'vocal', // VOCAL EXERCISE
  category: 'interval',
  difficulty: 'beginner',
  duration: 15,
  description: 'Practice singing major third intervals',
  icon: '🎯', // Target/bullseye icon
  instructions: [
    'Builds ear training',
    'Common interval in melodies',
    'Listen carefully to the gap between notes',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'G4', frequency: NOTES['G4'] },
  ],

  defaultTempo: 65,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Full Scale Up and Down (more challenging)
export const fullScaleUpDown: Exercise = {
  id: 'full-scale-up-down',
  name: 'Full Scale Up & Down',
  type: 'vocal', // VOCAL EXERCISE
  category: 'scale',
  difficulty: 'intermediate',
  duration: 40,
  description: 'Complete major scale ascending and descending',
  icon: '🎼', // Musical score icon
  instructions: [
    'Full scale exercise',
    'Focus on consistency',
    'Keep breath support throughout',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 80,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// All exercises
export const scaleExercises: Exercise[] = [
  fiveNoteWarmup,
  majorThirds,
  cMajorScale,
  octaveJump,
  fullScaleUpDown,
];
