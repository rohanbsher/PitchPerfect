export interface Note {
  name: string;
  frequency: number;
  octave: number;
}

export interface Scale {
  name: string;
  notes: Note[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes: Note[];
  bpm?: number;
}

// Note frequencies for octave 4
export const NOTE_FREQUENCIES = {
  'C': 261.63,
  'C#': 277.18,
  'Db': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'Eb': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'Gb': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'Ab': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'Bb': 466.16,
  'B': 493.88,
};

// Generate notes for different octaves
export function generateNote(noteName: string, octave: number): Note {
  const baseFreq = NOTE_FREQUENCIES[noteName];
  if (!baseFreq) throw new Error(`Unknown note: ${noteName}`);

  const octaveDiff = octave - 4;
  const frequency = baseFreq * Math.pow(2, octaveDiff);

  return {
    name: `${noteName}${octave}`,
    frequency,
    octave
  };
}

// Common scales
export const SCALES: { [key: string]: Scale } = {
  C_MAJOR: {
    name: 'C Major',
    notes: [
      generateNote('C', 4),
      generateNote('D', 4),
      generateNote('E', 4),
      generateNote('F', 4),
      generateNote('G', 4),
      generateNote('A', 4),
      generateNote('B', 4),
      generateNote('C', 5),
    ]
  },
  A_MINOR: {
    name: 'A Minor',
    notes: [
      generateNote('A', 3),
      generateNote('B', 3),
      generateNote('C', 4),
      generateNote('D', 4),
      generateNote('E', 4),
      generateNote('F', 4),
      generateNote('G', 4),
      generateNote('A', 4),
    ]
  },
  G_MAJOR: {
    name: 'G Major',
    notes: [
      generateNote('G', 3),
      generateNote('A', 3),
      generateNote('B', 3),
      generateNote('C', 4),
      generateNote('D', 4),
      generateNote('E', 4),
      generateNote('F#', 4),
      generateNote('G', 4),
    ]
  },
  D_MAJOR: {
    name: 'D Major',
    notes: [
      generateNote('D', 4),
      generateNote('E', 4),
      generateNote('F#', 4),
      generateNote('G', 4),
      generateNote('A', 4),
      generateNote('B', 4),
      generateNote('C#', 5),
      generateNote('D', 5),
    ]
  },
  CHROMATIC: {
    name: 'Chromatic',
    notes: [
      generateNote('C', 4),
      generateNote('C#', 4),
      generateNote('D', 4),
      generateNote('D#', 4),
      generateNote('E', 4),
      generateNote('F', 4),
      generateNote('F#', 4),
      generateNote('G', 4),
      generateNote('G#', 4),
      generateNote('A', 4),
      generateNote('A#', 4),
      generateNote('B', 4),
    ]
  }
};

// Practice exercises
export const EXERCISES: Exercise[] = [
  {
    id: 'scale_c_major',
    name: 'C Major Scale',
    description: 'Practice the C Major scale ascending and descending',
    difficulty: 'beginner',
    notes: SCALES.C_MAJOR.notes,
    bpm: 60
  },
  {
    id: 'intervals_thirds',
    name: 'Intervals - Thirds',
    description: 'Practice singing thirds in C Major',
    difficulty: 'beginner',
    notes: [
      generateNote('C', 4),
      generateNote('E', 4),
      generateNote('D', 4),
      generateNote('F', 4),
      generateNote('E', 4),
      generateNote('G', 4),
    ],
    bpm: 60
  },
  {
    id: 'intervals_fifths',
    name: 'Intervals - Fifths',
    description: 'Practice singing perfect fifths',
    difficulty: 'intermediate',
    notes: [
      generateNote('C', 4),
      generateNote('G', 4),
      generateNote('D', 4),
      generateNote('A', 4),
      generateNote('E', 4),
      generateNote('B', 4),
    ],
    bpm: 60
  },
  {
    id: 'arpeggios_c_major',
    name: 'C Major Arpeggio',
    description: 'Practice the C Major triad arpeggio',
    difficulty: 'intermediate',
    notes: [
      generateNote('C', 4),
      generateNote('E', 4),
      generateNote('G', 4),
      generateNote('C', 5),
      generateNote('G', 4),
      generateNote('E', 4),
      generateNote('C', 4),
    ],
    bpm: 80
  },
  {
    id: 'chromatic_exercise',
    name: 'Chromatic Scale',
    description: 'Practice the chromatic scale for pitch accuracy',
    difficulty: 'advanced',
    notes: SCALES.CHROMATIC.notes,
    bpm: 60
  },
  {
    id: 'octave_jumps',
    name: 'Octave Jumps',
    description: 'Practice jumping between octaves',
    difficulty: 'advanced',
    notes: [
      generateNote('C', 4),
      generateNote('C', 5),
      generateNote('D', 4),
      generateNote('D', 5),
      generateNote('E', 4),
      generateNote('E', 5),
    ],
    bpm: 50
  }
];

// Circle of Fifths data
export const CIRCLE_OF_FIFTHS = {
  major: ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'],
  minor: ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D']
};

// Chord progressions
export const COMMON_PROGRESSIONS = [
  {
    name: 'I-V-vi-IV',
    description: 'Pop progression',
    chords: ['C', 'G', 'Am', 'F']
  },
  {
    name: 'I-vi-IV-V',
    description: '50s progression',
    chords: ['C', 'Am', 'F', 'G']
  },
  {
    name: 'ii-V-I',
    description: 'Jazz cadence',
    chords: ['Dm', 'G', 'C']
  },
  {
    name: 'I-IV-V',
    description: 'Blues progression',
    chords: ['C', 'F', 'G']
  }
];

// Tuning references
export const TUNING_STANDARDS = {
  A440: 440,
  A432: 432,
  A415: 415, // Baroque
  A435: 435, // French
  A442: 442, // Continental Europe
};

// Instrument ranges
export const INSTRUMENT_RANGES = {
  VOCAL_BASS: { low: generateNote('E', 2), high: generateNote('E', 4) },
  VOCAL_BARITONE: { low: generateNote('A', 2), high: generateNote('A', 4) },
  VOCAL_TENOR: { low: generateNote('C', 3), high: generateNote('C', 5) },
  VOCAL_ALTO: { low: generateNote('F', 3), high: generateNote('F', 5) },
  VOCAL_MEZZO_SOPRANO: { low: generateNote('A', 3), high: generateNote('A', 5) },
  VOCAL_SOPRANO: { low: generateNote('C', 4), high: generateNote('C', 6) },
  GUITAR: { low: generateNote('E', 2), high: generateNote('E', 6) },
  PIANO: { low: generateNote('A', 0), high: generateNote('C', 8) },
  VIOLIN: { low: generateNote('G', 3), high: generateNote('A', 7) },
  FLUTE: { low: generateNote('C', 4), high: generateNote('C', 7) },
};