/**
 * Audio Utilities
 *
 * Centralized audio processing utilities with robust input validation.
 * Prevents corrupt data from invalid frequencies.
 */

export interface FrequencyValidation {
  isValid: boolean;
  reason?: string;
}

// Valid frequency range for human singing voice
// C2 (65.41 Hz) to C8 (4186.01 Hz) covers all vocal ranges
const MIN_VOCAL_FREQUENCY = 60; // Slightly below C2 for tolerance
const MAX_VOCAL_FREQUENCY = 4500; // Slightly above C8 for tolerance

/**
 * Validate frequency input before conversion
 */
export function validateFrequency(frequency: number): FrequencyValidation {
  // Check for non-numeric values
  if (typeof frequency !== 'number') {
    return { isValid: false, reason: 'Frequency must be a number' };
  }

  // Check for NaN
  if (Number.isNaN(frequency)) {
    return { isValid: false, reason: 'Frequency is NaN' };
  }

  // Check for Infinity
  if (!Number.isFinite(frequency)) {
    return { isValid: false, reason: 'Frequency is infinite' };
  }

  // Check for zero or negative
  if (frequency <= 0) {
    return { isValid: false, reason: 'Frequency must be positive' };
  }

  // Check vocal range bounds
  if (frequency < MIN_VOCAL_FREQUENCY || frequency > MAX_VOCAL_FREQUENCY) {
    return {
      isValid: false,
      reason: `Frequency ${frequency.toFixed(2)}Hz outside vocal range (${MIN_VOCAL_FREQUENCY}-${MAX_VOCAL_FREQUENCY}Hz)`,
    };
  }

  return { isValid: true };
}

/**
 * Convert frequency (Hz) to musical note with octave
 * Uses C0-based calculation for accurate octave numbering
 *
 * @param frequency - Frequency in Hz
 * @returns Note name with octave (e.g., "C4", "A#5") or null if invalid
 *
 * @example
 * frequencyToNote(440) // Returns "A4"
 * frequencyToNote(NaN) // Returns null
 * frequencyToNote(-10) // Returns null
 */
export function frequencyToNote(frequency: number): string | null {
  // Validate input
  const validation = validateFrequency(frequency);
  if (!validation.isValid) {
    if (__DEV__) {
      console.warn(`Invalid frequency: ${validation.reason}`);
    }
    return null;
  }

  // Use A4 = 440Hz as reference
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75); // C0 = 16.35 Hz

  // Musical note names
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Calculate semitones from C0
  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const noteIndex = h % 12;

  // Final validation: ensure note index is valid
  if (noteIndex < 0 || noteIndex >= noteNames.length) {
    if (__DEV__) {
      console.warn(`Calculated invalid note index: ${noteIndex} for frequency ${frequency}Hz`);
    }
    return null;
  }

  return `${noteNames[noteIndex]}${octave}`;
}

/**
 * Convert musical note to frequency
 *
 * @param note - Note name with octave (e.g., "C4", "A#5")
 * @returns Frequency in Hz or null if invalid note format
 *
 * @example
 * noteToFrequency("A4") // Returns 440
 * noteToFrequency("invalid") // Returns null
 */
export function noteToFrequency(note: string): number | null {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Parse note format (e.g., "C4", "A#5")
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) {
    if (__DEV__) {
      console.warn(`Invalid note format: ${note}`);
    }
    return null;
  }

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  // Find note index
  const noteIndex = noteNames.indexOf(noteName);
  if (noteIndex === -1) {
    if (__DEV__) {
      console.warn(`Unknown note name: ${noteName}`);
    }
    return null;
  }

  // Calculate frequency using A4 = 440Hz as reference
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);

  // Calculate semitones from C0
  const semitones = octave * 12 + noteIndex;
  const frequency = C0 * Math.pow(2, semitones / 12);

  // Validate calculated frequency
  const validation = validateFrequency(frequency);
  if (!validation.isValid) {
    if (__DEV__) {
      console.warn(`Note ${note} produces invalid frequency: ${validation.reason}`);
    }
    return null;
  }

  return frequency;
}

/**
 * Calculate semitone difference between two frequencies
 *
 * @param frequency1 - First frequency in Hz
 * @param frequency2 - Second frequency in Hz
 * @returns Semitone difference or null if invalid input
 */
export function frequencyDifferenceSemitones(
  frequency1: number,
  frequency2: number
): number | null {
  const validation1 = validateFrequency(frequency1);
  const validation2 = validateFrequency(frequency2);

  if (!validation1.isValid || !validation2.isValid) {
    if (__DEV__) {
      console.warn('Invalid frequencies for semitone calculation');
    }
    return null;
  }

  return 12 * Math.log2(frequency2 / frequency1);
}

/**
 * Check if two frequencies are within acceptable pitch accuracy
 *
 * @param targetFrequency - Target frequency in Hz
 * @param actualFrequency - Actual sung frequency in Hz
 * @param centTolerance - Tolerance in cents (100 cents = 1 semitone). Default: 50 cents
 * @returns true if within tolerance, false otherwise
 */
export function isFrequencyAccurate(
  targetFrequency: number,
  actualFrequency: number,
  centTolerance: number = 50
): boolean {
  const semitones = frequencyDifferenceSemitones(targetFrequency, actualFrequency);
  if (semitones === null) return false;

  const cents = Math.abs(semitones * 100);
  return cents <= centTolerance;
}
