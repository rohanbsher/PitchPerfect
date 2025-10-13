/**
 * Pitch History Hook
 *
 * Extracted from PitchPerfectPro.tsx (lines 16-21, 93-96)
 *
 * Tracks pitch detection history during exercises for analytics
 * and visualization purposes.
 *
 * @module usePitchHistory
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Single pitch detection reading with accuracy
 */
export interface PitchHistoryPoint {
  /** Musical note detected (e.g., "C4", "A#3") */
  note: string;
  /** Frequency in Hz */
  frequency: number;
  /** Timestamp when detected (milliseconds since exercise start) */
  timestamp: number;
  /** Accuracy score 0-1 (1 = perfect pitch match) */
  accuracy: number;
  /** Cents deviation from target (-50 to +50 typical range) */
  centsOff?: number;
}

/**
 * Statistics calculated from pitch history
 */
export interface PitchHistoryStats {
  /** Total pitch readings recorded */
  totalReadings: number;
  /** Average accuracy across all readings (0-1) */
  averageAccuracy: number;
  /** Best accuracy achieved (0-1) */
  bestAccuracy: number;
  /** Percentage of readings above 90% accuracy */
  excellentPercentage: number;
  /** Percentage of readings above 70% accuracy */
  goodPercentage: number;
  /** Most commonly detected note */
  mostCommonNote: string | null;
  /** Duration of exercise in seconds */
  duration: number;
}

/**
 * Hook return value with pitch history state and methods
 */
export interface UsePitchHistoryReturn {
  /** Array of all pitch readings */
  history: PitchHistoryPoint[];
  /** Calculated statistics from history */
  stats: PitchHistoryStats;
  /** Add a new pitch reading to history */
  addReading: (reading: Omit<PitchHistoryPoint, 'timestamp'>) => void;
  /** Clear all history (e.g., when starting new exercise) */
  clearHistory: () => void;
  /** Get recent history (last N readings) */
  getRecentHistory: (count: number) => PitchHistoryPoint[];
}

/**
 * Calculate accuracy score from cents deviation
 *
 * Accuracy formula from PitchPerfectPro:
 * - Perfect (0 cents): 1.0
 * - Within 50 cents: Linear decay
 * - Beyond 50 cents: 0.0
 *
 * @param centsOff Cents deviation from target (absolute value)
 * @returns Accuracy score 0-1
 */
function calculateAccuracy(centsOff: number): number {
  const absCents = Math.abs(centsOff);
  if (absCents <= 50) {
    return 1 - absCents / 50;
  }
  return 0;
}

/**
 * Custom hook for tracking pitch detection history during exercises
 *
 * Usage Example:
 * ```typescript
 * const { history, stats, addReading, clearHistory } = usePitchHistory();
 *
 * // When pitch detected
 * addReading({
 *   note: "C4",
 *   frequency: 261.63,
 *   accuracy: 0.92,
 *   centsOff: -4
 * });
 *
 * // View stats
 * console.log(`Average accuracy: ${stats.averageAccuracy * 100}%`);
 * ```
 */
export function usePitchHistory(): UsePitchHistoryReturn {
  const [history, setHistory] = useState<PitchHistoryPoint[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  /**
   * Add a pitch reading to history
   */
  const addReading = useCallback((reading: Omit<PitchHistoryPoint, 'timestamp'>) => {
    const timestamp = Date.now() - startTimeRef.current;
    const newPoint: PitchHistoryPoint = {
      ...reading,
      timestamp,
    };

    setHistory((prev) => [...prev, newPoint]);
  }, []);

  /**
   * Clear history and reset start time
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    startTimeRef.current = Date.now();
  }, []);

  /**
   * Get recent history (last N readings)
   */
  const getRecentHistory = useCallback(
    (count: number): PitchHistoryPoint[] => {
      return history.slice(-count);
    },
    [history]
  );

  /**
   * Calculate statistics from current history
   */
  const stats: PitchHistoryStats = (() => {
    if (history.length === 0) {
      return {
        totalReadings: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        excellentPercentage: 0,
        goodPercentage: 0,
        mostCommonNote: null,
        duration: 0,
      };
    }

    // Calculate accuracy metrics
    const accuracies = history.map((p) => p.accuracy);
    const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    const bestAccuracy = Math.max(...accuracies);

    // Count readings by accuracy threshold
    const excellentCount = accuracies.filter((a) => a > 0.9).length;
    const goodCount = accuracies.filter((a) => a > 0.7).length;

    // Find most common note
    const noteCounts: Record<string, number> = {};
    history.forEach((p) => {
      noteCounts[p.note] = (noteCounts[p.note] || 0) + 1;
    });
    const mostCommonNote = Object.entries(noteCounts).reduce(
      (max, [note, count]) => (count > (noteCounts[max] || 0) ? note : max),
      ''
    );

    // Calculate duration
    const lastTimestamp = history[history.length - 1].timestamp;
    const duration = lastTimestamp / 1000; // Convert to seconds

    return {
      totalReadings: history.length,
      averageAccuracy,
      bestAccuracy,
      excellentPercentage: (excellentCount / history.length) * 100,
      goodPercentage: (goodCount / history.length) * 100,
      mostCommonNote,
      duration,
    };
  })();

  return {
    history,
    stats,
    addReading,
    clearHistory,
    getRecentHistory,
  };
}
