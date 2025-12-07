/**
 * Range Check Engine
 *
 * Simple, natural vocal range detection - like a real vocal coach would do it.
 * Just two prompts:
 * 1. "Sing your lowest comfortable note"
 * 2. "Sing your highest comfortable note"
 *
 * Much faster and more natural than the old 22-note range test.
 */

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { frequencyToNote } from '../utils/audioUtils';
import { VoiceCoach, VoicePreferences } from '../services/voiceCoaching';

/**
 * State machine for range check flow
 */
export type RangeCheckState =
  | 'idle'
  | 'intro'           // Voice: "Let's find your range"
  | 'prompt_low'      // Voice: "Sing your lowest note"
  | 'countdown_low'   // 3..2..1 countdown before listening
  | 'listening_low'   // Record for 4 seconds
  | 'prompt_high'     // Voice: "Now sing your highest note"
  | 'countdown_high'  // 3..2..1 countdown before listening
  | 'listening_high'  // Record for 4 seconds
  | 'complete';       // Voice: "Your range is X to Y"

/**
 * Detected note with frequency
 */
export interface DetectedNote {
  note: string;
  frequency: number;
}

/**
 * Range check result
 */
export interface RangeCheckResult {
  lowest: DetectedNote;
  highest: DetectedNote;
  octaves: number;
}

/**
 * Callbacks for UI integration
 */
export interface RangeCheckCallbacks {
  onStateChange?: (state: RangeCheckState) => void;
  onCurrentPitch?: (note: string | null, frequency: number) => void;
  onCountdownUpdate?: (count: number | null) => void;
  onListeningCountdown?: (secondsRemaining: number) => void;
  onLowNoteDetected?: (note: DetectedNote) => void;
  onHighNoteDetected?: (note: DetectedNote) => void;
  onComplete?: (result: RangeCheckResult) => void;
  onError?: (error: string) => void;
}

// Memory bounds
const MAX_PITCH_SAMPLES = 300; // ~5 seconds at 60Hz

/**
 * Configure audio session for recording
 */
async function configureAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    console.log('[RangeCheck] Audio session configured');
  } catch (error) {
    console.warn('[RangeCheck] Failed to configure audio session:', error);
  }
}

/**
 * Calculate octave span between two frequencies
 */
function calculateOctaves(lowFreq: number, highFreq: number): number {
  if (lowFreq <= 0 || highFreq <= 0) return 0;
  return Math.log2(highFreq / lowFreq);
}

export class RangeCheckEngine {
  private state: RangeCheckState = 'idle';
  private callbacks: RangeCheckCallbacks = {};
  private voicePreferences: VoicePreferences = { enabled: true, speed: 0.95, pitch: 1.0 };
  private isRunning: boolean = false;

  // Pitch collection
  private pitchSamples: number[] = [];
  private listeningDuration: number = 4; // seconds

  // Results
  private lowestNote: DetectedNote | null = null;
  private highestNote: DetectedNote | null = null;

  // Timers
  private listeningTimeout: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;

  constructor(
    callbacks: RangeCheckCallbacks = {},
    voicePreferences?: VoicePreferences
  ) {
    this.callbacks = callbacks;
    if (voicePreferences) this.voicePreferences = voicePreferences;
  }

  /**
   * Start the range check flow
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[RangeCheck] Already running');
      return;
    }

    // Configure audio session
    await configureAudioSession();
    await this.delay(250);

    this.isRunning = true;
    this.lowestNote = null;
    this.highestNote = null;

    // Start with intro
    await this.runIntro();
  }

  /**
   * Stop the range check
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.listeningTimeout) {
      clearTimeout(this.listeningTimeout);
      this.listeningTimeout = null;
    }

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    await VoiceCoach.stop();
    this.setState('idle');
  }

  /**
   * Record a pitch sample from the pitch detector
   * Call this continuously while listening
   */
  recordPitch(frequency: number, confidence: number): void {
    // Only collect during listening phases
    if (this.state !== 'listening_low' && this.state !== 'listening_high') {
      return;
    }

    // Require minimum confidence
    if (confidence < 0.5) {
      return;
    }

    // Validate frequency is in vocal range
    if (frequency < 60 || frequency > 2000) {
      return;
    }

    // Add to samples with rolling window
    if (this.pitchSamples.length >= MAX_PITCH_SAMPLES) {
      this.pitchSamples.shift();
    }
    this.pitchSamples.push(frequency);

    // Report current pitch to UI
    const note = frequencyToNote(frequency);
    this.callbacks.onCurrentPitch?.(note, frequency);
  }

  /**
   * Get current state
   */
  getState(): RangeCheckState {
    return this.state;
  }

  /**
   * Check if running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  // ========================================
  // Private flow methods
  // ========================================

  /**
   * Run intro phase
   */
  private async runIntro(): Promise<void> {
    if (!this.isRunning) return;

    this.setState('intro');
    await VoiceCoach.say("Let's find your vocal range!", this.voicePreferences);
    await this.delay(500);

    // Move to prompt for low note
    await this.runPromptLow();
  }

  /**
   * Prompt user to sing lowest note
   */
  private async runPromptLow(): Promise<void> {
    if (!this.isRunning) return;

    this.setState('prompt_low');
    await VoiceCoach.say(
      "Sing the lowest note you can comfortably hold.",
      this.voicePreferences
    );
    await this.delay(500);

    // Countdown before listening
    await this.runCountdown('countdown_low');

    // Start listening
    await this.listenForLowNote();
  }

  /**
   * Prompt user to sing highest note
   */
  private async runPromptHigh(): Promise<void> {
    if (!this.isRunning) return;

    this.setState('prompt_high');
    await VoiceCoach.say(
      "Now sing the highest note you can comfortably hold.",
      this.voicePreferences
    );
    await this.delay(500);

    // Countdown before listening
    await this.runCountdown('countdown_high');

    // Start listening
    await this.listenForHighNote();
  }

  /**
   * Run 3-2-1 countdown
   */
  private async runCountdown(state: 'countdown_low' | 'countdown_high'): Promise<void> {
    if (!this.isRunning) return;

    this.setState(state);

    for (let i = 3; i >= 1; i--) {
      if (!this.isRunning) return;
      this.callbacks.onCountdownUpdate?.(i);
      await this.delay(1000);
    }

    this.callbacks.onCountdownUpdate?.(null);
  }

  /**
   * Listen for lowest note
   */
  private async listenForLowNote(): Promise<void> {
    if (!this.isRunning) return;

    this.setState('listening_low');
    this.pitchSamples = [];

    // Start countdown during listening
    let remaining = this.listeningDuration;
    this.callbacks.onListeningCountdown?.(remaining);

    this.countdownInterval = setInterval(() => {
      remaining--;
      this.callbacks.onListeningCountdown?.(remaining);
      if (remaining <= 0 && this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 1000);

    // Wait for listening duration
    await new Promise<void>((resolve) => {
      this.listeningTimeout = setTimeout(() => {
        resolve();
      }, this.listeningDuration * 1000);
    });

    // Clear countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.callbacks.onListeningCountdown?.(0);

    // Process collected samples
    this.lowestNote = this.extractLowestStablePitch();

    if (this.lowestNote) {
      this.callbacks.onLowNoteDetected?.(this.lowestNote);
      console.log('[RangeCheck] Lowest note detected:', this.lowestNote.note);

      // Quick acknowledgment
      await VoiceCoach.say(`Got it! ${this.lowestNote.note}`, this.voicePreferences);
      await this.delay(500);

      // Move to high note
      await this.runPromptHigh();
    } else {
      // No pitch detected - retry
      this.callbacks.onError?.("Couldn't detect your voice. Let's try again.");
      await VoiceCoach.say("I couldn't hear you. Let's try again.", this.voicePreferences);
      await this.delay(500);
      await this.runPromptLow();
    }
  }

  /**
   * Listen for highest note
   */
  private async listenForHighNote(): Promise<void> {
    if (!this.isRunning) return;

    this.setState('listening_high');
    this.pitchSamples = [];

    // Start countdown during listening
    let remaining = this.listeningDuration;
    this.callbacks.onListeningCountdown?.(remaining);

    this.countdownInterval = setInterval(() => {
      remaining--;
      this.callbacks.onListeningCountdown?.(remaining);
      if (remaining <= 0 && this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 1000);

    // Wait for listening duration
    await new Promise<void>((resolve) => {
      this.listeningTimeout = setTimeout(() => {
        resolve();
      }, this.listeningDuration * 1000);
    });

    // Clear countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.callbacks.onListeningCountdown?.(0);

    // Process collected samples
    this.highestNote = this.extractHighestStablePitch();

    if (this.highestNote) {
      this.callbacks.onHighNoteDetected?.(this.highestNote);
      console.log('[RangeCheck] Highest note detected:', this.highestNote.note);

      // Complete the range check
      await this.completeRangeCheck();
    } else {
      // No pitch detected - retry
      this.callbacks.onError?.("Couldn't detect your voice. Let's try again.");
      await VoiceCoach.say("I couldn't hear you. Let's try again.", this.voicePreferences);
      await this.delay(500);
      await this.runPromptHigh();
    }
  }

  /**
   * Complete the range check and announce results
   */
  private async completeRangeCheck(): Promise<void> {
    if (!this.isRunning || !this.lowestNote || !this.highestNote) return;

    this.setState('complete');

    const octaves = calculateOctaves(this.lowestNote.frequency, this.highestNote.frequency);
    const octavesRounded = Math.round(octaves * 10) / 10; // Round to 1 decimal

    const result: RangeCheckResult = {
      lowest: this.lowestNote,
      highest: this.highestNote,
      octaves: octavesRounded,
    };

    // Announce results
    const octaveText = octavesRounded === 1 ? '1 octave' : `${octavesRounded} octaves`;
    await VoiceCoach.say(
      `Your range is ${this.lowestNote.note} to ${this.highestNote.note}. That's about ${octaveText}!`,
      this.voicePreferences
    );

    // Notify completion
    this.callbacks.onComplete?.(result);
    this.isRunning = false;

    console.log('[RangeCheck] Complete:', result);
  }

  /**
   * Extract the lowest stable pitch from samples
   * Uses the lowest 10% median to avoid voice cracks/noise
   */
  private extractLowestStablePitch(): DetectedNote | null {
    if (this.pitchSamples.length < 10) {
      console.log('[RangeCheck] Not enough samples:', this.pitchSamples.length);
      return null;
    }

    // Sort samples ascending
    const sorted = [...this.pitchSamples].sort((a, b) => a - b);

    // Take lowest 10% of samples
    const lowCount = Math.max(5, Math.floor(sorted.length * 0.1));
    const lowSamples = sorted.slice(0, lowCount);

    // Get median of low samples (most stable low pitch)
    const medianIndex = Math.floor(lowSamples.length / 2);
    const medianFreq = lowSamples[medianIndex];

    const note = frequencyToNote(medianFreq);
    if (!note) return null;

    return { note, frequency: medianFreq };
  }

  /**
   * Extract the highest stable pitch from samples
   * Uses the highest 10% median to avoid squeaks/noise
   */
  private extractHighestStablePitch(): DetectedNote | null {
    if (this.pitchSamples.length < 10) {
      console.log('[RangeCheck] Not enough samples:', this.pitchSamples.length);
      return null;
    }

    // Sort samples descending
    const sorted = [...this.pitchSamples].sort((a, b) => b - a);

    // Take highest 10% of samples
    const highCount = Math.max(5, Math.floor(sorted.length * 0.1));
    const highSamples = sorted.slice(0, highCount);

    // Get median of high samples (most stable high pitch)
    const medianIndex = Math.floor(highSamples.length / 2);
    const medianFreq = highSamples[medianIndex];

    const note = frequencyToNote(medianFreq);
    if (!note) return null;

    return { note, frequency: medianFreq };
  }

  /**
   * Set state and notify callback
   */
  private setState(state: RangeCheckState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
