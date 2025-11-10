/**
 * Scale Exercises
 * Major, minor, chromatic scales in all keys
 */

import { Exercise, Note } from '../models';

// Note frequencies
const NOTES: { [key: string]: number } = {
  'C3': 130.81,
  'C#3': 138.59,
  'D3': 146.83,
  'D#3': 155.56,
  'E3': 164.81,
  'F3': 174.61,
  'F#3': 185.00,
  'G3': 196.00,
  'G#3': 207.65,
  'A3': 220.00,
  'A#3': 233.08,
  'B3': 246.94,
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  'C5': 523.25,
  'C#5': 554.37,
  'D5': 587.33,
  'D#5': 622.25,
  'E5': 659.25,
  'F5': 698.46,
  'F#5': 739.99,
  'G5': 783.99,
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

// Major Arpeggio Exercise
export const majorArpeggio: Exercise = {
  id: 'major-arpeggio',
  name: 'Major Arpeggio',
  type: 'vocal',
  category: 'arpeggio',
  difficulty: 'intermediate',
  duration: 25,
  description: 'Practice major arpeggios to build chord awareness',
  icon: '🎸',
  instructions: [
    'Arpeggios are broken chords',
    'Common in classical and pop music',
    'Focus on smooth transitions',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 70,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Minor Arpeggio Exercise
export const minorArpeggio: Exercise = {
  id: 'minor-arpeggio',
  name: 'Minor Arpeggio',
  type: 'vocal',
  category: 'arpeggio',
  difficulty: 'intermediate',
  duration: 25,
  description: 'Practice minor arpeggios for emotional expression',
  icon: '🎭',
  instructions: [
    'Minor arpeggios have a darker, sadder quality',
    'Essential for emotional singing',
    'Keep tone consistent',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D#4', frequency: NOTES['D#4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'D#4', frequency: NOTES['D#4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 70,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Perfect Fifths Exercise
export const perfectFifths: Exercise = {
  id: 'perfect-fifths',
  name: 'Perfect Fifths',
  type: 'vocal',
  category: 'interval',
  difficulty: 'beginner',
  duration: 18,
  description: 'Master the perfect fifth interval - the most consonant interval',
  icon: '🎺',
  instructions: [
    'Think of "Twinkle Twinkle Little Star"',
    'Very stable, consonant interval',
    'Foundation of Western music',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'B4', frequency: NOTES['B4'] },
  ],

  defaultTempo: 65,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Perfect Fourths Exercise
export const perfectFourths: Exercise = {
  id: 'perfect-fourths',
  name: 'Perfect Fourths',
  type: 'vocal',
  category: 'interval',
  difficulty: 'beginner',
  duration: 18,
  description: 'Practice perfect fourth intervals',
  icon: '🎻',
  instructions: [
    'Think of "Here Comes the Bride"',
    'Consonant but less stable than fifths',
    'Common in melodies',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'A4', frequency: NOTES['A4'] },
  ],

  defaultTempo: 65,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Chromatic Scale Exercise
export const chromaticScale: Exercise = {
  id: 'chromatic-scale',
  name: 'Chromatic Scale',
  type: 'vocal',
  category: 'scale',
  difficulty: 'advanced',
  duration: 45,
  description: 'Practice all 12 notes in an octave',
  icon: '🌈',
  instructions: [
    'Every note including sharps/flats',
    'Challenges pitch accuracy',
    'Great for ear training',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'C#4', frequency: NOTES['C#4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'D#4', frequency: NOTES['D#4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'F#4', frequency: NOTES['F#4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'G#4', frequency: NOTES['G#4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'A#4', frequency: NOTES['A#4'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'C5', frequency: NOTES['C5'] },
  ],

  defaultTempo: 75,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: false,
};

// Siren/Glissando Exercise
export const siren: Exercise = {
  id: 'siren',
  name: 'Vocal Siren',
  type: 'vocal',
  category: 'warm-up',
  difficulty: 'beginner',
  duration: 30,
  description: 'Smooth glide from low to high and back - great for warming up',
  icon: '🚨',
  instructions: [
    'Slide smoothly like a siren',
    'No breaks between notes',
    'Relaxes vocal cords',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 90,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Major Sixths Exercise
export const majorSixths: Exercise = {
  id: 'major-sixths',
  name: 'Major Sixths',
  type: 'vocal',
  category: 'interval',
  difficulty: 'intermediate',
  duration: 20,
  description: 'Practice major sixth intervals',
  icon: '🎶',
  instructions: [
    'Think of "My Bonnie Lies Over the Ocean"',
    'Wide interval requiring good breath support',
    'Common in romantic melodies',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'C5', frequency: NOTES['C5'] },
  ],

  defaultTempo: 60,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Descending Scale Exercise
export const descendingScale: Exercise = {
  id: 'descending-scale',
  name: 'Descending Scale',
  type: 'vocal',
  category: 'scale',
  difficulty: 'beginner',
  duration: 25,
  description: 'Practice descending from high to low',
  icon: '⬇️',
  instructions: [
    'Start high, end low',
    'Maintain tone quality as you descend',
    'Great for cooling down',
  ],

  notes: [
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'F4', frequency: NOTES['F4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 75,
  defaultStartingNote: 'C5',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Staccato Exercise
export const staccato: Exercise = {
  id: 'staccato',
  name: 'Staccato Notes',
  type: 'vocal',
  category: 'warm-up',
  difficulty: 'intermediate',
  duration: 20,
  description: 'Short, detached notes for breath control',
  icon: '💨',
  instructions: [
    'Short, crisp notes',
    'Great for breath control',
    'Imagine bouncing a ball',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'C5', frequency: NOTES['C5'] },
  ],

  defaultTempo: 100,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Pentatonic Scale Exercise
export const pentatonicScale: Exercise = {
  id: 'pentatonic-scale',
  name: 'Pentatonic Scale',
  type: 'vocal',
  category: 'scale',
  difficulty: 'beginner',
  duration: 20,
  description: '5-note scale used in blues, rock, and world music',
  icon: '🎸',
  instructions: [
    'Only 5 notes (no semitones)',
    'Used in blues, rock, jazz',
    'Very melodic and easy to sing',
  ],

  notes: [
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
  ],

  defaultTempo: 80,
  defaultStartingNote: 'C4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// High Range Exercise
export const highRange: Exercise = {
  id: 'high-range',
  name: 'High Range Builder',
  type: 'vocal',
  category: 'warm-up',
  difficulty: 'advanced',
  duration: 35,
  description: 'Safely expand your upper range',
  icon: '⬆️',
  instructions: [
    'Start comfortable, gradually go higher',
    'Use proper breath support',
    'Stop if you feel strain',
  ],

  notes: [
    { note: 'G4', frequency: NOTES['G4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'D5', frequency: NOTES['D5'] },
    { note: 'E5', frequency: NOTES['E5'] },
    { note: 'D5', frequency: NOTES['D5'] },
    { note: 'C5', frequency: NOTES['C5'] },
    { note: 'B4', frequency: NOTES['B4'] },
    { note: 'A4', frequency: NOTES['A4'] },
    { note: 'G4', frequency: NOTES['G4'] },
  ],

  defaultTempo: 70,
  defaultStartingNote: 'G4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Low Range Exercise
export const lowRange: Exercise = {
  id: 'low-range',
  name: 'Low Range Builder',
  type: 'vocal',
  category: 'warm-up',
  difficulty: 'intermediate',
  duration: 30,
  description: 'Develop your lower register',
  icon: '⬇️',
  instructions: [
    'Relax your throat',
    'Maintain good posture',
    'Keep tone rich and resonant',
  ],

  notes: [
    { note: 'E4', frequency: NOTES['E4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'B3', frequency: NOTES['B3'] },
    { note: 'A3', frequency: NOTES['A3'] },
    { note: 'G3', frequency: NOTES['G3'] },
    { note: 'A3', frequency: NOTES['A3'] },
    { note: 'B3', frequency: NOTES['B3'] },
    { note: 'C4', frequency: NOTES['C4'] },
    { note: 'D4', frequency: NOTES['D4'] },
    { note: 'E4', frequency: NOTES['E4'] },
  ],

  defaultTempo: 70,
  defaultStartingNote: 'E4',
  allowTempoChange: true,
  allowKeyChange: true,
};

// Legato Exercise
export const legato: Exercise = {
  id: 'legato',
  name: 'Legato Singing',
  type: 'vocal',
  category: 'warm-up',
  difficulty: 'intermediate',
  duration: 25,
  description: 'Smooth, connected notes',
  icon: '🌊',
  instructions: [
    'Smooth, flowing transitions',
    'No breaks between notes',
    'Like singing on one breath',
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

  defaultTempo: 60,
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
  majorArpeggio,
  minorArpeggio,
  perfectFifths,
  perfectFourths,
  chromaticScale,
  siren,
  majorSixths,
  descendingScale,
  staccato,
  pentatonicScale,
  highRange,
  lowRange,
  legato,
];
