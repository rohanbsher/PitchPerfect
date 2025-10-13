/**
 * Platform-agnostic audio service interface
 * Implementations: WebAudioService (web), NativeAudioService (iOS/Android)
 */

export interface PitchDetectionCallback {
  (audioBuffer: Float32Array, sampleRate: number): void;
}

export interface IAudioService {
  /**
   * Initialize the audio service
   * Sets up audio context/session for the platform
   */
  initialize(): Promise<void>;

  /**
   * Request microphone permissions
   * @returns true if granted, false otherwise
   */
  requestPermissions(): Promise<boolean>;

  /**
   * Start capturing microphone audio and invoke callback with PCM data
   * @param callback Function called with audio buffer and sample rate
   */
  startMicrophoneCapture(callback: PitchDetectionCallback): Promise<void>;

  /**
   * Stop microphone capture
   */
  stopMicrophoneCapture(): Promise<void>;

  /**
   * Play a piano note
   * @param noteName Note name (e.g., "C4", "D#5")
   * @param duration Duration in seconds
   */
  playNote(noteName: string, duration: number): Promise<void>;

  /**
   * Stop currently playing note
   */
  stopNote(): void;

  /**
   * Clean up resources
   */
  dispose(): void;

  /**
   * Get current sample rate
   */
  getSampleRate(): number;
}

export interface AudioServiceConfig {
  /**
   * Sample rate for audio capture (default: 44100)
   */
  sampleRate?: number;

  /**
   * Buffer size for pitch detection (default: 2048)
   */
  bufferSize?: number;

  /**
   * Audio session category (iOS only)
   */
  iosAudioCategory?: 'playAndRecord' | 'playback' | 'record';
}
