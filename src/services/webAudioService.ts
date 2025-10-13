/**
 * Web Audio Service for Real-Time Pitch Detection
 * Uses Web Audio API for actual microphone input
 */

import { YINPitchDetector, PitchDetectionResult } from '../utils/pitchDetection';

export class WebAudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private pitchDetector: YINPitchDetector;
  private isListening: boolean = false;
  private audioBuffer: Float32Array;
  private bufferSize: number = 2048;
  private sampleRate: number = 44100;
  private animationId: number | null = null;
  private onPitchDetected?: (result: PitchDetectionResult) => void;

  constructor() {
    this.pitchDetector = new YINPitchDetector(this.sampleRate, this.bufferSize);
    this.audioBuffer = new Float32Array(this.bufferSize);
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // For web, we request permissions when we actually start
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Initialize audio context
   */
  async initialize(): Promise<void> {
    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.sampleRate = this.audioContext.sampleRate;

      // Update pitch detector with actual sample rate
      this.pitchDetector.updateParameters({ sampleRate: this.sampleRate });
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  /**
   * Start real-time pitch detection from microphone
   */
  async startPitchDetection(callback: (result: PitchDetectionResult) => void): Promise<void> {
    try {
      this.onPitchDetected = callback;

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        }
      });

      if (!this.audioContext) {
        await this.initialize();
      }

      // Create audio nodes
      this.microphone = this.audioContext!.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext!.createAnalyser();
      this.analyser.fftSize = this.bufferSize * 2;
      this.analyser.smoothingTimeConstant = 0;

      // Connect nodes
      this.microphone.connect(this.analyser);

      this.isListening = true;
      this.processAudio();
    } catch (error) {
      console.error('Error starting pitch detection:', error);
      throw error;
    }
  }

  /**
   * Process audio in real-time
   */
  private processAudio = (): void => {
    if (!this.isListening || !this.analyser) {
      return;
    }

    // Get time domain data (waveform)
    const timeData = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(timeData);

    // Copy to our buffer (use only half since fftSize is double)
    for (let i = 0; i < this.bufferSize; i++) {
      this.audioBuffer[i] = timeData[i];
    }

    // Check if there's enough volume to process
    const volume = this.calculateVolume(this.audioBuffer);

    if (volume > 0.01) { // Threshold to avoid processing silence
      // Detect pitch
      const result = this.pitchDetector.detectPitch(this.audioBuffer);

      // Call callback with result
      if (this.onPitchDetected) {
        this.onPitchDetected(result);
      }
    } else {
      // Send empty result for silence
      if (this.onPitchDetected) {
        this.onPitchDetected({
          frequency: 0,
          confidence: 0,
          note: '-',
          cents: 0
        });
      }
    }

    // Continue processing
    this.animationId = requestAnimationFrame(this.processAudio);
  };

  /**
   * Calculate RMS volume
   */
  private calculateVolume(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Stop pitch detection
   */
  async stopPitchDetection(): Promise<void> {
    this.isListening = false;

    // Cancel animation frame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Disconnect audio nodes
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    // Stop media stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * Check if currently listening
   */
  getIsRecording(): boolean {
    return this.isListening;
  }

  /**
   * Update parameters
   */
  updateParameters(params: { bufferSize?: number; threshold?: number }): void {
    if (params.bufferSize) {
      this.bufferSize = params.bufferSize;
      this.audioBuffer = new Float32Array(params.bufferSize);
      this.pitchDetector.updateParameters({ bufferSize: params.bufferSize });

      if (this.analyser) {
        this.analyser.fftSize = params.bufferSize * 2;
      }
    }
  }

  // Stub methods for compatibility
  async startRecording(): Promise<void> {
    // Not implemented for web
  }

  async stopRecording(): Promise<string | null> {
    // Not implemented for web
    return null;
  }
}