/**
 * YIN Pitch Detection Algorithm Implementation
 * Based on: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara
 */

export interface PitchDetectionResult {
  frequency: number;
  confidence: number;
  note: string;
  cents: number;
}

// Export standalone detectPitch function for use in components
export function detectPitch(buffer: Float32Array, sampleRate: number): PitchDetectionResult | null {
  const detector = new YINPitchDetector(sampleRate, buffer.length);
  return detector.detectPitch(buffer);
}

export class YINPitchDetector {
  private sampleRate: number;
  private bufferSize: number;
  private threshold: number;
  private yinBuffer: Float32Array;

  constructor(sampleRate: number = 44100, bufferSize: number = 1024, threshold: number = 0.15) {
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.threshold = threshold;
    this.yinBuffer = new Float32Array(bufferSize / 2);
  }

  /**
   * Update sample rate (useful when actual device rate differs from requested)
   * CRITICAL FIX: iOS may provide 48000 Hz when we request 44100 Hz
   */
  updateSampleRate(newSampleRate: number): void {
    // Validate sample rate is reasonable
    if (newSampleRate < 8000 || newSampleRate > 96000) {
      console.error(`❌ Invalid sample rate: ${newSampleRate} Hz. Must be between 8000-96000 Hz`);
      return;
    }

    if (newSampleRate !== this.sampleRate) {
      console.log(`🔄 YINPitchDetector: Updating sample rate ${this.sampleRate} → ${newSampleRate} Hz`);
      this.sampleRate = newSampleRate;
    }
  }

  /**
   * Get current sample rate
   */
  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Detect pitch from audio buffer
   */
  detectPitch(audioBuffer: Float32Array): PitchDetectionResult {
    // Step 1: Calculate the difference function
    this.difference(audioBuffer);

    // Step 2: Calculate the cumulative mean normalized difference
    this.cumulativeMeanNormalizedDifference();

    // Step 3: Find the best local estimate
    const tau = this.absoluteThreshold();

    // Step 4: Parabolic interpolation for better precision
    const betterTau = this.parabolicInterpolation(tau);

    // Convert tau to frequency
    const frequency = this.sampleRate / betterTau;

    // Calculate confidence (inverse of aperiodicity)
    const confidence = this.calculateConfidence(tau);

    // Get musical note information
    const noteInfo = this.frequencyToNote(frequency);

    return {
      frequency: isFinite(frequency) ? frequency : 0,
      confidence: confidence,
      note: noteInfo.note,
      cents: noteInfo.cents
    };
  }

  /**
   * Step 1: Difference function
   * d(tau) = sum((x[j] - x[j + tau])^2)
   */
  private difference(buffer: Float32Array): void {
    let tau: number;
    let delta: number;

    for (tau = 0; tau < this.yinBuffer.length; tau++) {
      this.yinBuffer[tau] = 0;
      for (let i = 0; i < this.yinBuffer.length; i++) {
        delta = buffer[i] - buffer[i + tau];
        this.yinBuffer[tau] += delta * delta;
      }
    }
  }

  /**
   * Step 2: Cumulative mean normalized difference
   */
  private cumulativeMeanNormalizedDifference(): void {
    let runningSum = 0;
    this.yinBuffer[0] = 1;

    for (let tau = 1; tau < this.yinBuffer.length; tau++) {
      runningSum += this.yinBuffer[tau];
      this.yinBuffer[tau] *= tau / runningSum;
    }
  }

  /**
   * Step 3: Absolute threshold
   */
  private absoluteThreshold(): number {
    let tau: number;

    for (tau = 2; tau < this.yinBuffer.length; tau++) {
      if (this.yinBuffer[tau] < this.threshold) {
        while (tau + 1 < this.yinBuffer.length &&
               this.yinBuffer[tau + 1] < this.yinBuffer[tau]) {
          tau++;
        }
        break;
      }
    }

    return tau === this.yinBuffer.length ? -1 : tau;
  }

  /**
   * Step 4: Parabolic interpolation
   */
  private parabolicInterpolation(tauEstimate: number): number {
    if (tauEstimate === -1) return -1;
    if (tauEstimate === 0) return 0;

    const x0 = tauEstimate - 1;
    const x2 = tauEstimate + 1;

    if (x2 >= this.yinBuffer.length) return tauEstimate;

    const y0 = this.yinBuffer[x0];
    const y1 = this.yinBuffer[tauEstimate];
    const y2 = this.yinBuffer[x2];

    const a = (y2 - y0) / 2;
    const b = (2 * y1 - y2 - y0) / 2;

    if (b === 0) return tauEstimate;

    const xVertex = tauEstimate - a / (2 * b);

    return xVertex;
  }

  /**
   * Calculate confidence based on the clarity of the detected pitch
   */
  private calculateConfidence(tau: number): number {
    if (tau === -1) return 0;

    const value = this.yinBuffer[tau];

    // Convert YIN buffer value to confidence (0 to 1)
    // Lower values mean better confidence
    const confidence = 1 - Math.min(value, 1);

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Convert frequency to musical note and cents offset
   */
  private frequencyToNote(frequency: number): { note: string; cents: number } {
    if (frequency <= 0 || !isFinite(frequency)) {
      return { note: '-', cents: 0 };
    }

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const a4 = 440; // A4 = 440 Hz
    const c0 = a4 * Math.pow(2, -4.75); // C0 frequency

    const halfStepsFromC0 = 12 * Math.log2(frequency / c0);
    const noteIndex = Math.round(halfStepsFromC0) % 12;
    const octave = Math.floor(halfStepsFromC0 / 12);

    // Calculate cents (deviation from the nearest note)
    const nearestNoteFreq = c0 * Math.pow(2, Math.round(halfStepsFromC0) / 12);
    const cents = Math.round(1200 * Math.log2(frequency / nearestNoteFreq));

    return {
      note: `${noteNames[noteIndex]}${octave}`,
      cents: cents
    };
  }

  /**
   * Update parameters
   */
  updateParameters(params: { sampleRate?: number; bufferSize?: number; threshold?: number }): void {
    if (params.sampleRate) this.sampleRate = params.sampleRate;
    if (params.bufferSize) {
      this.bufferSize = params.bufferSize;
      this.yinBuffer = new Float32Array(params.bufferSize / 2);
    }
    if (params.threshold) this.threshold = params.threshold;
  }
}

/**
 * Utility function to get frequency of a specific note
 */
export function getNoteFrequency(note: string, octave: number): number {
  const noteFrequencies: { [key: string]: number } = {
    'C': 16.35,
    'C#': 17.32,
    'D': 18.35,
    'D#': 19.45,
    'E': 20.60,
    'F': 21.83,
    'F#': 23.12,
    'G': 24.50,
    'G#': 25.96,
    'A': 27.50,
    'A#': 29.14,
    'B': 30.87
  };

  const baseFreq = noteFrequencies[note.toUpperCase()];
  if (!baseFreq) return 0;

  return baseFreq * Math.pow(2, octave);
}

/**
 * Get color based on pitch accuracy
 */
export function getPitchAccuracyColor(cents: number): string {
  const absCents = Math.abs(cents);

  if (absCents <= 5) return '#4CAF50'; // Green - Perfect
  if (absCents <= 10) return '#8BC34A'; // Light Green - Very Good
  if (absCents <= 20) return '#FFC107'; // Yellow - Good
  if (absCents <= 30) return '#FF9800'; // Orange - Okay
  return '#F44336'; // Red - Off pitch
}