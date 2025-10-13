/**
 * Pitch Smoothing Utility
 *
 * Extracted from PitchMatchPro.tsx (lines 158-160)
 *
 * Provides exponential moving average smoothing for pitch detection
 * to reduce jitter and provide smoother visual feedback.
 *
 * @module pitchSmoothing
 */

/**
 * Configuration for pitch smoothing
 */
export interface PitchSmoothingConfig {
  /**
   * Smoothing factor (0-1)
   * - Higher values = more responsive but jittery (e.g., 0.5)
   * - Lower values = smoother but slower response (e.g., 0.1)
   * - Default: 0.3 (balanced - from PitchMatchPro)
   */
  smoothingFactor?: number;
}

/**
 * Pitch Smoother using Exponential Moving Average (EMA)
 *
 * Uses the formula:
 * smoothed = previous * (1 - factor) + current * factor
 *
 * This creates a weighted average that gradually transitions
 * between pitch values, eliminating visual jitter.
 */
export class PitchSmoother {
  private smoothedValue: number = 0;
  private smoothingFactor: number;
  private initialized: boolean = false;

  /**
   * Create a new pitch smoother
   * @param config Optional configuration
   */
  constructor(config?: PitchSmoothingConfig) {
    this.smoothingFactor = config?.smoothingFactor ?? 0.3;
  }

  /**
   * Smooth a pitch value (in cents)
   *
   * @param cents Current pitch deviation in cents
   * @returns Smoothed pitch deviation in cents (rounded to integer)
   */
  smooth(cents: number): number {
    // First value - initialize without smoothing
    if (!this.initialized) {
      this.smoothedValue = cents;
      this.initialized = true;
      return Math.round(cents);
    }

    // Apply exponential moving average
    // Formula from PitchMatchPro.tsx line 158
    this.smoothedValue =
      this.smoothedValue * (1 - this.smoothingFactor) +
      cents * this.smoothingFactor;

    return Math.round(this.smoothedValue);
  }

  /**
   * Reset the smoother (e.g., when starting new exercise)
   */
  reset(): void {
    this.smoothedValue = 0;
    this.initialized = false;
  }

  /**
   * Get current smoothed value without updating
   */
  getCurrentValue(): number {
    return Math.round(this.smoothedValue);
  }

  /**
   * Update smoothing factor dynamically
   * @param factor New smoothing factor (0-1)
   */
  setSmoothingFactor(factor: number): void {
    if (factor < 0 || factor > 1) {
      console.warn('⚠️ Smoothing factor must be between 0 and 1. Clamping value.');
      factor = Math.max(0, Math.min(1, factor));
    }
    this.smoothingFactor = factor;
  }
}

/**
 * Utility function for one-off smoothing without class instance
 *
 * Note: For continuous smoothing across multiple calls, use PitchSmoother class instead.
 * This is a stateless helper for testing or simple use cases.
 *
 * @param previous Previous smoothed value
 * @param current Current raw value
 * @param factor Smoothing factor (default 0.3)
 * @returns Smoothed value
 */
export function smoothValue(
  previous: number,
  current: number,
  factor: number = 0.3
): number {
  return previous * (1 - factor) + current * factor;
}
