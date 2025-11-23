/**
 * Range Analysis Service
 *
 * Analyzes vocal range data from session history to provide:
 * - Comfortable vs extended range detection
 * - Frequency-specific accuracy heatmaps
 * - Range expansion tracking over time
 * - AI-ready structured data for coaching
 */

import { SessionRecord, NoteAttempt, VocalRange } from '../types/userProgress';

// Frequency band category based on performance
export type FrequencyCategory = 'comfortable' | 'extended' | 'struggling' | 'untested';

// Heatmap entry for a specific frequency
export interface FrequencyHeatmapEntry {
  frequency: number;
  note: string;
  averageAccuracy: number;
  totalAttempts: number;
  category: FrequencyCategory;
  lastAttempted?: string; // ISO date
}

// Complete range analysis result
export interface RangeAnalysisResult {
  // Current range boundaries
  currentRange: {
    lowest: string;
    lowestFreq: number;
    highest: string;
    highestFreq: number;
  };

  // Comfortable singing range (70%+ accuracy consistently)
  comfortableRange: {
    lowest: string;
    lowestFreq: number;
    highest: string;
    highestFreq: number;
    spanSemitones: number;
  };

  // Extended range (attempted but <70% accuracy)
  extendedRange: {
    lower: { note: string; freq: number } | null;
    upper: { note: string; freq: number } | null;
  };

  // Frequency heatmap
  heatmap: FrequencyHeatmapEntry[];

  // Weakness summary
  weaknesses: {
    frequencyBand: 'low' | 'mid' | 'high';
    notes: string[];
    averageAccuracy: number;
  }[];

  // Range expansion metrics
  expansion: {
    last30Days: {
      semitones: number;
      direction: 'upper' | 'lower' | 'both' | 'none';
    };
    allTime: {
      semitones: number;
      startDate: string;
    };
  };

  // Most confident note
  strongestNote: {
    note: string;
    frequency: number;
    accuracy: number;
    attempts: number;
  } | null;
}

/**
 * Convert frequency to note name
 */
function frequencyToNote(frequency: number): string {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const n = h % 12;

  return noteNames[n] + octave;
}

/**
 * Convert note name to frequency
 */
function noteToFrequency(note: string): number {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 0;

  const noteName = match[1];
  const octave = parseInt(match[2]);

  const noteIndex = noteNames.indexOf(noteName);
  if (noteIndex === -1) return 0;

  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const h = octave * 12 + noteIndex;

  return C0 * Math.pow(2, h / 12);
}

/**
 * Calculate semitone distance between two notes
 */
function semitoneDifference(note1: string, note2: string): number {
  const freq1 = noteToFrequency(note1);
  const freq2 = noteToFrequency(note2);
  return Math.round(12 * Math.log2(freq2 / freq1));
}

/**
 * Categorize frequency based on accuracy performance
 */
function categorizeFrequency(averageAccuracy: number, attempts: number): FrequencyCategory {
  if (attempts === 0) return 'untested';
  if (averageAccuracy >= 70) return 'comfortable';
  if (averageAccuracy >= 50) return 'extended';
  return 'struggling';
}

/**
 * Calculate frequency heatmap from session history
 */
export function calculateFrequencyHeatmap(sessions: SessionRecord[]): FrequencyHeatmapEntry[] {
  // Map of frequency → {totalAccuracy, attempts, lastDate}
  const frequencyMap = new Map<number, { totalAccuracy: number; attempts: number; lastDate: string }>();

  // Aggregate data from all sessions
  sessions.forEach((session) => {
    session.noteAttempts.forEach((attempt) => {
      const freq = Math.round(attempt.targetFrequency * 10) / 10; // Round to 0.1 Hz
      const existing = frequencyMap.get(freq) || { totalAccuracy: 0, attempts: 0, lastDate: session.date };

      frequencyMap.set(freq, {
        totalAccuracy: existing.totalAccuracy + attempt.accuracy,
        attempts: existing.attempts + 1,
        lastDate: session.date > existing.lastDate ? session.date : existing.lastDate,
      });
    });
  });

  // Convert to heatmap entries
  const heatmap: FrequencyHeatmapEntry[] = [];

  frequencyMap.forEach((data, frequency) => {
    const averageAccuracy = data.totalAccuracy / data.attempts;
    const note = frequencyToNote(frequency);
    const category = categorizeFrequency(averageAccuracy, data.attempts);

    heatmap.push({
      frequency,
      note,
      averageAccuracy,
      totalAttempts: data.attempts,
      category,
      lastAttempted: data.lastDate,
    });
  });

  // Sort by frequency
  heatmap.sort((a, b) => a.frequency - b.frequency);

  return heatmap;
}

/**
 * Detect range expansion over time
 */
export function detectRangeExpansion(sessions: SessionRecord[]): {
  last30Days: { semitones: number; direction: 'upper' | 'lower' | 'both' | 'none' };
  allTime: { semitones: number; startDate: string };
} {
  if (sessions.length === 0) {
    return {
      last30Days: { semitones: 0, direction: 'none' },
      allTime: { semitones: 0, startDate: new Date().toISOString() },
    };
  }

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Find sessions from last 30 days
  const recentSessions = sortedSessions.filter((s) => new Date(s.date) >= thirtyDaysAgo);
  const olderSessions = sortedSessions.filter((s) => new Date(s.date) < thirtyDaysAgo);

  // Calculate range for recent sessions
  let recentLow = '';
  let recentHigh = '';
  if (recentSessions.length > 0) {
    const recentFreqs = recentSessions.flatMap((s) => s.noteAttempts.map((n) => n.targetFrequency));
    recentLow = frequencyToNote(Math.min(...recentFreqs));
    recentHigh = frequencyToNote(Math.max(...recentFreqs));
  }

  // Calculate range for older sessions
  let olderLow = '';
  let olderHigh = '';
  if (olderSessions.length > 0) {
    const olderFreqs = olderSessions.flatMap((s) => s.noteAttempts.map((n) => n.targetFrequency));
    olderLow = frequencyToNote(Math.min(...olderFreqs));
    olderHigh = frequencyToNote(Math.max(...olderFreqs));
  }

  // Calculate expansion
  let last30DaysExpansion = 0;
  let direction: 'upper' | 'lower' | 'both' | 'none' = 'none';

  if (recentSessions.length > 0 && olderSessions.length > 0) {
    const lowerExpansion = semitoneDifference(recentLow, olderLow);
    const upperExpansion = semitoneDifference(olderHigh, recentHigh);

    if (lowerExpansion > 0 && upperExpansion > 0) {
      direction = 'both';
      last30DaysExpansion = lowerExpansion + upperExpansion;
    } else if (lowerExpansion > 0) {
      direction = 'lower';
      last30DaysExpansion = lowerExpansion;
    } else if (upperExpansion > 0) {
      direction = 'upper';
      last30DaysExpansion = upperExpansion;
    }
  }

  // All-time expansion
  const allFreqs = sortedSessions.flatMap((s) => s.noteAttempts.map((n) => n.targetFrequency));
  const allTimeLow = frequencyToNote(Math.min(...allFreqs));
  const allTimeHigh = frequencyToNote(Math.max(...allFreqs));
  const allTimeExpansion = semitoneDifference(allTimeLow, allTimeHigh);

  return {
    last30Days: {
      semitones: last30DaysExpansion,
      direction,
    },
    allTime: {
      semitones: allTimeExpansion,
      startDate: sortedSessions[sortedSessions.length - 1]?.date || new Date().toISOString(),
    },
  };
}

/**
 * Comprehensive vocal range analysis
 */
export function analyzeVocalRange(sessions: SessionRecord[]): RangeAnalysisResult {
  if (sessions.length === 0) {
    // Return empty analysis
    return {
      currentRange: { lowest: 'C4', lowestFreq: 261.63, highest: 'C4', highestFreq: 261.63 },
      comfortableRange: { lowest: 'C4', lowestFreq: 261.63, highest: 'C4', highestFreq: 261.63, spanSemitones: 0 },
      extendedRange: { lower: null, upper: null },
      heatmap: [],
      weaknesses: [],
      expansion: {
        last30Days: { semitones: 0, direction: 'none' },
        allTime: { semitones: 0, startDate: new Date().toISOString() },
      },
      strongestNote: null,
    };
  }

  // Calculate heatmap
  const heatmap = calculateFrequencyHeatmap(sessions);

  // Find current range boundaries
  const allFreqs = sessions.flatMap((s) => s.noteAttempts.map((n) => n.targetFrequency));
  const lowestFreq = Math.min(...allFreqs);
  const highestFreq = Math.max(...allFreqs);
  const lowest = frequencyToNote(lowestFreq);
  const highest = frequencyToNote(highestFreq);

  // Find comfortable range (70%+ accuracy)
  const comfortableEntries = heatmap.filter((entry) => entry.category === 'comfortable');
  let comfortableLowest = lowest;
  let comfortableLowestFreq = lowestFreq;
  let comfortableHighest = highest;
  let comfortableHighestFreq = highestFreq;

  if (comfortableEntries.length > 0) {
    comfortableLowestFreq = Math.min(...comfortableEntries.map((e) => e.frequency));
    comfortableHighestFreq = Math.max(...comfortableEntries.map((e) => e.frequency));
    comfortableLowest = frequencyToNote(comfortableLowestFreq);
    comfortableHighest = frequencyToNote(comfortableHighestFreq);
  }

  const spanSemitones = semitoneDifference(comfortableLowest, comfortableHighest);

  // Find extended range notes (beyond comfortable)
  const extendedLower = heatmap.find(
    (e) => e.frequency < comfortableLowestFreq && (e.category === 'extended' || e.category === 'struggling')
  );
  const extendedUpper = heatmap
    .slice()
    .reverse()
    .find(
      (e) => e.frequency > comfortableHighestFreq && (e.category === 'extended' || e.category === 'struggling')
    );

  // Identify weaknesses by frequency band
  const lowBand = heatmap.filter((e) => e.frequency < 200); // Below ~G3
  const midBand = heatmap.filter((e) => e.frequency >= 200 && e.frequency < 500); // G3-B4
  const highBand = heatmap.filter((e) => e.frequency >= 500); // Above B4

  const weaknesses: RangeAnalysisResult['weaknesses'] = [];

  const analyzeBand = (
    band: FrequencyHeatmapEntry[],
    name: 'low' | 'mid' | 'high'
  ): { frequencyBand: 'low' | 'mid' | 'high'; notes: string[]; averageAccuracy: number } | null => {
    if (band.length === 0) return null;
    const avgAccuracy = band.reduce((sum, e) => sum + e.averageAccuracy, 0) / band.length;
    if (avgAccuracy < 65) {
      return {
        frequencyBand: name,
        notes: band.filter((e) => e.averageAccuracy < 65).map((e) => e.note),
        averageAccuracy: avgAccuracy,
      };
    }
    return null;
  };

  const lowWeakness = analyzeBand(lowBand, 'low');
  const midWeakness = analyzeBand(midBand, 'mid');
  const highWeakness = analyzeBand(highBand, 'high');

  if (lowWeakness) weaknesses.push(lowWeakness);
  if (midWeakness) weaknesses.push(midWeakness);
  if (highWeakness) weaknesses.push(highWeakness);

  // Find strongest note
  const strongestEntry = heatmap
    .filter((e) => e.totalAttempts >= 3) // Must have at least 3 attempts
    .sort((a, b) => b.averageAccuracy - a.averageAccuracy)[0];

  const strongestNote = strongestEntry
    ? {
        note: strongestEntry.note,
        frequency: strongestEntry.frequency,
        accuracy: strongestEntry.averageAccuracy,
        attempts: strongestEntry.totalAttempts,
      }
    : null;

  // Calculate expansion
  const expansion = detectRangeExpansion(sessions);

  return {
    currentRange: {
      lowest,
      lowestFreq,
      highest,
      highestFreq,
    },
    comfortableRange: {
      lowest: comfortableLowest,
      lowestFreq: comfortableLowestFreq,
      highest: comfortableHighest,
      highestFreq: comfortableHighestFreq,
      spanSemitones,
    },
    extendedRange: {
      lower: extendedLower ? { note: extendedLower.note, freq: extendedLower.frequency } : null,
      upper: extendedUpper ? { note: extendedUpper.note, freq: extendedUpper.frequency } : null,
    },
    heatmap,
    weaknesses,
    expansion,
    strongestNote,
  };
}
