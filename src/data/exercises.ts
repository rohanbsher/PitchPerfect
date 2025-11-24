/**
 * Exercise Library
 *
 * Contains vocal exercise patterns for the voice-guided workout feature.
 * Each exercise defines a sequence of notes to sing.
 */

// Note frequency lookup (A4 = 440Hz standard)
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
  'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.26, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50,
};

// Convert note name to MIDI number
export const noteToMidi = (note: string): number => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 60; // Default to C4
  const [, noteName, octave] = match;
  const noteIndex = noteNames.indexOf(noteName);
  return (parseInt(octave) + 1) * 12 + noteIndex;
};

// Exercise note with timing
export interface ExerciseNote {
  note: string;
  frequency: number;
  duration: number; // seconds to hold the note
  midi: number;
}

// Exercise definition
export interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes: ExerciseNote[];
}

// Daily workout definition
export interface DailyWorkout {
  id: string;
  name: string;
  description: string;
  duration: string; // e.g., "5 min", "15 min"
  details: string[]; // Bullet points of what you'll practice
  exercises: Exercise[];
  isBreathing?: boolean; // Flag for breathing-only workouts
  recommended?: boolean; // Show as recommended
}

// Breathing phase definition
export interface BreathingPhase {
  type: 'inhale' | 'hold' | 'exhale';
  duration: number; // seconds
}

// Breathing exercise definition
export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
  cycles: number; // Number of times to repeat the pattern
}

// Helper to create exercise notes
const createNote = (note: string, duration: number = 2): ExerciseNote => ({
  note,
  frequency: NOTE_FREQUENCIES[note] || 261.63,
  duration,
  midi: noteToMidi(note),
});

// === EXERCISES ===

export const EXERCISES: Record<string, Exercise> = {
  // Warm-up: Simple 5-note scale
  warmup_scale: {
    id: 'warmup_scale',
    name: 'Warm-up Scale',
    description: 'Simple 5-note ascending scale to warm up your voice',
    difficulty: 'beginner',
    notes: [
      createNote('C4', 2),
      createNote('D4', 2),
      createNote('E4', 2),
      createNote('F4', 2),
      createNote('G4', 2),
    ],
  },

  // Descending scale
  descending_scale: {
    id: 'descending_scale',
    name: 'Descending Scale',
    description: '5-note descending scale',
    difficulty: 'beginner',
    notes: [
      createNote('G4', 2),
      createNote('F4', 2),
      createNote('E4', 2),
      createNote('D4', 2),
      createNote('C4', 2),
    ],
  },

  // Octave jump
  octave_jump: {
    id: 'octave_jump',
    name: 'Octave Jump',
    description: 'Practice jumping between octaves',
    difficulty: 'intermediate',
    notes: [
      createNote('C4', 2),
      createNote('C5', 2),
      createNote('C4', 2),
      createNote('C5', 2),
    ],
  },

  // Major arpeggio
  major_arpeggio: {
    id: 'major_arpeggio',
    name: 'Major Arpeggio',
    description: 'C major arpeggio up and down',
    difficulty: 'intermediate',
    notes: [
      createNote('C4', 1.5),
      createNote('E4', 1.5),
      createNote('G4', 1.5),
      createNote('C5', 2),
      createNote('G4', 1.5),
      createNote('E4', 1.5),
      createNote('C4', 2),
    ],
  },

  // Siren exercise (sliding notes)
  siren: {
    id: 'siren',
    name: 'Siren',
    description: 'Smooth transitions between notes',
    difficulty: 'advanced',
    notes: [
      createNote('C4', 2),
      createNote('E4', 2),
      createNote('G4', 2),
      createNote('B4', 2),
      createNote('C5', 3),
    ],
  },

  // Extended range
  extended_range: {
    id: 'extended_range',
    name: 'Extended Range',
    description: 'Push your vocal range',
    difficulty: 'advanced',
    notes: [
      createNote('C3', 2),
      createNote('G3', 2),
      createNote('C4', 2),
      createNote('G4', 2),
      createNote('C5', 2),
      createNote('G5', 2),
    ],
  },

  // Comprehensive range test
  range_test: {
    id: 'range_test',
    name: 'Full Range Test',
    description: 'Systematic range assessment from C3 to C6',
    difficulty: 'intermediate',
    notes: [
      // Low range (C3-G3)
      createNote('C3', 1.5),
      createNote('D3', 1.5),
      createNote('E3', 1.5),
      createNote('F3', 1.5),
      createNote('G3', 1.5),
      // Mid-low range (A3-C4)
      createNote('A3', 1.5),
      createNote('B3', 1.5),
      createNote('C4', 1.5),
      // Mid range (D4-G4)
      createNote('D4', 1.5),
      createNote('E4', 1.5),
      createNote('F4', 1.5),
      createNote('G4', 1.5),
      // Mid-high range (A4-C5)
      createNote('A4', 1.5),
      createNote('B4', 1.5),
      createNote('C5', 1.5),
      // High range (D5-G5)
      createNote('D5', 1.5),
      createNote('E5', 1.5),
      createNote('F5', 1.5),
      createNote('G5', 1.5),
      // Upper range (A5-C6)
      createNote('A5', 1.5),
      createNote('B5', 1.5),
      createNote('C6', 1.5),
    ],
  },
};

// === DAILY WORKOUTS ===

export const DAILY_WORKOUTS: DailyWorkout[] = [
  {
    id: 'quick_session',
    name: 'Quick Session',
    description: 'Perfect for daily practice',
    duration: '5 min',
    details: [
      'Range check (C3-C6)',
      'Pitch accuracy drill',
      'Basic scale patterns',
    ],
    exercises: [
      EXERCISES.warmup_scale,
      EXERCISES.descending_scale,
      EXERCISES.major_arpeggio,
    ],
    recommended: true,
  },
  {
    id: 'full_workout',
    name: 'Full Workout',
    description: 'Comprehensive voice training',
    duration: '15 min',
    details: [
      'Complete warm-up sequence',
      'Interval training',
      'Range expansion',
    ],
    exercises: [
      EXERCISES.warmup_scale,
      EXERCISES.descending_scale,
      EXERCISES.major_arpeggio,
      EXERCISES.octave_jump,
      EXERCISES.siren,
    ],
  },
];

// Get default daily workout
export const getDefaultWorkout = (): DailyWorkout => DAILY_WORKOUTS[0];

// === BREATHING EXERCISES ===

export const BREATHING_EXERCISES: Record<string, BreathingExercise> = {
  // 4-7-8 breathing technique
  four_seven_eight: {
    id: 'four_seven_eight',
    name: 'Breath Control',
    description: 'Diaphragmatic breathing for sustained tone',
    phases: [
      { type: 'inhale', duration: 4 },
      { type: 'hold', duration: 7 },
      { type: 'exhale', duration: 8 },
    ],
    cycles: 7,
  },

  // Box breathing
  box_breathing: {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Equal parts: inhale 4s, hold 4s, exhale 4s, hold 4s',
    phases: [
      { type: 'inhale', duration: 4 },
      { type: 'hold', duration: 4 },
      { type: 'exhale', duration: 4 },
      { type: 'hold', duration: 4 },
    ],
    cycles: 4,
  },
};

// Get default breathing exercise
export const getDefaultBreathingExercise = (): BreathingExercise => BREATHING_EXERCISES.four_seven_eight;
