/**
 * Exercise Adaptation Service
 *
 * Analyzes user's vocal range and automatically transposes exercises
 * to match their capabilities with progressive challenge.
 */

import { Exercise, ExerciseNote, NOTE_FREQUENCIES, noteToMidi } from '../data/exercises';
import { UserProgress } from '../types/userProgress';

// MIDI note range
const ALL_NOTES = Object.keys(NOTE_FREQUENCIES).sort(
  (a, b) => noteToMidi(a) - noteToMidi(b)
);

/**
 * Convert MIDI number back to note name
 */
export function midiToNote(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${noteNames[noteIndex]}${octave}`;
}

/**
 * Transpose a single note by semitones
 */
export function transposeNote(note: string, semitones: number): ExerciseNote {
  const originalMidi = noteToMidi(note);
  const transposedMidi = originalMidi + semitones;
  const transposedNote = midiToNote(transposedMidi);

  return {
    note: transposedNote,
    frequency: NOTE_FREQUENCIES[transposedNote] || 440.0,
    duration: 2, // Will be updated with original duration
    midi: transposedMidi,
  };
}

/**
 * Transpose an entire exercise by semitones
 */
export function transposeExercise(exercise: Exercise, semitones: number): Exercise {
  if (semitones === 0) {
    return exercise; // No transposition needed
  }

  const transposedNotes = exercise.notes.map(note => {
    const transposed = transposeNote(note.note, semitones);
    return {
      ...transposed,
      duration: note.duration, // Preserve original duration
    };
  });

  return {
    ...exercise,
    notes: transposedNotes,
  };
}

/**
 * Analyze user's comfortable vocal range from session history
 * Returns the range where they consistently hit notes with good accuracy
 */
export interface ComfortableRange {
  lowestComfortableNote: string;
  highestComfortableNote: string;
  lowestComfortableMidi: number;
  highestComfortableMidi: number;
  centerMidi: number;
  rangeInSemitones: number;
}

export function analyzeComfortableRange(progress: UserProgress): ComfortableRange | null {
  // Get recent sessions (last 20) for accurate analysis
  const recentSessions = progress.sessionHistory.slice(0, 20);

  if (recentSessions.length === 0) {
    return null; // No data to analyze
  }

  // Build frequency map: note -> [accuracy scores]
  const noteAccuracyMap = new Map<string, number[]>();

  recentSessions.forEach(session => {
    session.noteAttempts.forEach(attempt => {
      if (!noteAccuracyMap.has(attempt.note)) {
        noteAccuracyMap.set(attempt.note, []);
      }
      noteAccuracyMap.get(attempt.note)!.push(attempt.accuracy);
    });
  });

  // Calculate average accuracy per note
  const noteAverages = new Map<string, number>();
  noteAccuracyMap.forEach((accuracies, note) => {
    const avg = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
    noteAverages.set(note, avg);
  });

  // Find notes with good accuracy (>70%)
  const comfortableNotes = Array.from(noteAverages.entries())
    .filter(([_, accuracy]) => accuracy > 70)
    .map(([note, _]) => note);

  if (comfortableNotes.length === 0) {
    // Fallback to all attempted notes if none are "comfortable"
    const allNotes = Array.from(noteAccuracyMap.keys());
    if (allNotes.length === 0) return null;

    const midiValues = allNotes.map(noteToMidi);
    const lowestMidi = Math.min(...midiValues);
    const highestMidi = Math.max(...midiValues);

    return {
      lowestComfortableNote: midiToNote(lowestMidi),
      highestComfortableNote: midiToNote(highestMidi),
      lowestComfortableMidi: lowestMidi,
      highestComfortableMidi: highestMidi,
      centerMidi: Math.round((lowestMidi + highestMidi) / 2),
      rangeInSemitones: highestMidi - lowestMidi,
    };
  }

  // Convert to MIDI and find range
  const midiValues = comfortableNotes.map(noteToMidi);
  const lowestMidi = Math.min(...midiValues);
  const highestMidi = Math.max(...midiValues);
  const centerMidi = Math.round((lowestMidi + highestMidi) / 2);

  return {
    lowestComfortableNote: midiToNote(lowestMidi),
    highestComfortableNote: midiToNote(highestMidi),
    lowestComfortableMidi: lowestMidi,
    highestComfortableMidi: highestMidi,
    centerMidi,
    rangeInSemitones: highestMidi - lowestMidi,
  };
}

/**
 * Calculate optimal key (transposition) for an exercise based on user's range
 * Uses progressive challenge algorithm:
 * - If user has narrow range: keep exercises in comfortable zone
 * - If user has good range: gradually push boundaries by 1-2 semitones
 */
export function calculateOptimalKey(
  exercise: Exercise,
  userRange: ComfortableRange,
  challengeLevel: 'comfortable' | 'moderate' | 'challenging' = 'moderate'
): number {
  // Find the original exercise's range
  const exerciseMidiValues = exercise.notes.map(note => note.midi);
  const exerciseLowest = Math.min(...exerciseMidiValues);
  const exerciseHighest = Math.max(...exerciseMidiValues);
  const exerciseCenter = Math.round((exerciseLowest + exerciseHighest) / 2);

  // Calculate base transposition to center exercise in user's range
  let transposition = userRange.centerMidi - exerciseCenter;

  // Apply progressive challenge based on user's range development
  if (challengeLevel === 'comfortable') {
    // Keep it safe - no additional challenge
    // Just center it in their comfortable range
  } else if (challengeLevel === 'moderate') {
    // Push slightly beyond comfort zone (1-2 semitones higher)
    if (userRange.rangeInSemitones >= 12) {
      // User has at least 1 octave range - push up 1-2 semitones
      transposition += Math.random() < 0.5 ? 1 : 2;
    }
  } else if (challengeLevel === 'challenging') {
    // More aggressive challenge (2-4 semitones higher)
    if (userRange.rangeInSemitones >= 12) {
      transposition += 2 + Math.floor(Math.random() * 3); // +2 to +4
    }
  }

  // Safety check: ensure transposed exercise stays within reasonable vocal range (C3-C6)
  const transposedLowest = exerciseLowest + transposition;
  const transposedHighest = exerciseHighest + transposition;

  const C3_MIDI = 48; // C3
  const C6_MIDI = 84; // C6

  // Adjust if out of bounds
  if (transposedLowest < C3_MIDI) {
    transposition = C3_MIDI - exerciseLowest;
  } else if (transposedHighest > C6_MIDI) {
    transposition = C6_MIDI - exerciseHighest;
  }

  return Math.round(transposition);
}

/**
 * Get adapted exercise for user
 * Main entry point for exercise adaptation
 */
export function getAdaptedExercise(
  exercise: Exercise,
  progress: UserProgress,
  challengeLevel: 'comfortable' | 'moderate' | 'challenging' = 'moderate'
): { exercise: Exercise; transposition: number; isAdapted: boolean } {
  const userRange = analyzeComfortableRange(progress);

  // If no range data, return original exercise
  if (!userRange) {
    return {
      exercise,
      transposition: 0,
      isAdapted: false,
    };
  }

  // Calculate optimal transposition
  const transposition = calculateOptimalKey(exercise, userRange, challengeLevel);

  // Transpose the exercise
  const adaptedExercise = transposeExercise(exercise, transposition);

  return {
    exercise: adaptedExercise,
    transposition,
    isAdapted: transposition !== 0,
  };
}

/**
 * Get adaptation info for display
 */
export interface AdaptationInfo {
  isAdapted: boolean;
  transposition: number;
  transpositionLabel: string; // e.g., "+2 semitones (up 1 whole step)"
  userRange: ComfortableRange | null;
  message: string;
}

export function getAdaptationInfo(
  originalExercise: Exercise,
  adaptedExercise: Exercise,
  transposition: number,
  userRange: ComfortableRange | null
): AdaptationInfo {
  let message = '';
  let transpositionLabel = '';

  if (transposition === 0) {
    message = 'Original key';
    transpositionLabel = 'Original key';
  } else {
    const direction = transposition > 0 ? 'up' : 'down';
    const semitones = Math.abs(transposition);

    // Convert semitones to musical interval
    const intervalNames: Record<number, string> = {
      1: 'half step',
      2: 'whole step',
      3: 'minor third',
      4: 'major third',
      5: 'perfect fourth',
      6: 'tritone',
      7: 'perfect fifth',
      8: 'minor sixth',
      9: 'major sixth',
      10: 'minor seventh',
      11: 'major seventh',
      12: 'octave',
    };

    const intervalName = intervalNames[semitones] || `${semitones} semitones`;
    transpositionLabel = `${transposition > 0 ? '+' : ''}${transposition} semitones (${direction} ${intervalName})`;

    if (userRange) {
      message = `Adapted to your range (${userRange.lowestComfortableNote}-${userRange.highestComfortableNote})`;
    } else {
      message = `Transposed ${transpositionLabel}`;
    }
  }

  return {
    isAdapted: transposition !== 0,
    transposition,
    transpositionLabel,
    userRange,
    message,
  };
}

/**
 * Determine challenge level based on user's recent performance
 */
export function recommendChallengeLevel(progress: UserProgress): 'comfortable' | 'moderate' | 'challenging' {
  const recentSessions = progress.sessionHistory.slice(0, 5);

  if (recentSessions.length < 3) {
    return 'comfortable'; // New user - keep it safe
  }

  // Calculate average accuracy of recent sessions
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;

  if (avgAccuracy >= 85) {
    return 'challenging'; // User is doing well - push harder
  } else if (avgAccuracy >= 70) {
    return 'moderate'; // Balanced challenge
  } else {
    return 'comfortable'; // User struggling - reduce challenge
  }
}
