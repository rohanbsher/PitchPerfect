/**
 * Web Audio API implementation for browser
 * Uses navigator.mediaDevices, AudioContext, AnalyserNode
 * Works on: Chrome, Safari, Firefox (web only)
 */

import * as Tone from 'tone';
import { IAudioService, PitchDetectionCallback, AudioServiceConfig } from './IAudioService';

export class WebAudioService implements IAudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private piano: Tone.Sampler | null = null;
  private sampleRate: number = 44100;
  private bufferSize: number = 2048;
  private animationFrameId: number | null = null;
  private pitchCallback: PitchDetectionCallback | null = null;

  constructor(private config: AudioServiceConfig = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.bufferSize = config.bufferSize || 2048;
  }

  async initialize(): Promise<void> {
    console.log('🎹 WebAudioService: Initializing...');

    // Initialize Tone.js Piano with Salamander samples
    return new Promise((resolve, reject) => {
      this.piano = new Tone.Sampler({
        urls: {
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        onload: () => {
          console.log('✅ WebAudioService: Piano loaded');
          resolve();
        },
        onerror: (error) => {
          console.error('❌ WebAudioService: Piano loading failed', error);
          reject(error);
        },
      }).toDestination();
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Check if microphone API exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ WebAudioService: getUserMedia not supported');
        return false;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Clean up test stream
      stream.getTracks().forEach(track => track.stop());

      console.log('✅ WebAudioService: Microphone permission granted');
      return true;
    } catch (error) {
      console.error('❌ WebAudioService: Microphone permission denied', error);
      return false;
    }
  }

  async startMicrophoneCapture(callback: PitchDetectionCallback): Promise<void> {
    console.log('🎤 WebAudioService: Starting microphone capture...');

    this.pitchCallback = callback;

    // 1. Get microphone stream
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    // 2. Create AudioContext
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.sampleRate = this.audioContext.sampleRate;
    console.log('📊 WebAudioService: Sample Rate:', this.sampleRate);

    // 3. Create AnalyserNode
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.bufferSize;
    this.analyser.smoothingTimeConstant = 0.3;

    // 4. Connect microphone → analyser
    this.microphone = this.audioContext.createMediaStreamSource(this.stream);
    this.microphone.connect(this.analyser);

    // 5. Start pitch detection loop
    this.startPitchDetectionLoop();

    console.log('✅ WebAudioService: Microphone capture started');
  }

  async stopMicrophoneCapture(): Promise<void> {
    console.log('🛑 WebAudioService: Stopping microphone capture...');

    // Stop pitch detection loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Disconnect microphone
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    // Stop stream tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.pitchCallback = null;

    console.log('✅ WebAudioService: Microphone capture stopped');
  }

  async playNote(noteName: string, duration: number): Promise<void> {
    if (!this.piano) {
      throw new Error('Piano not initialized');
    }

    console.log(`🎹 WebAudioService: Playing ${noteName} for ${duration}s`);

    // Tone.js triggerAttackRelease
    this.piano.triggerAttackRelease(noteName, duration);

    // Wait for duration
    return new Promise(resolve => setTimeout(resolve, duration * 1000));
  }

  stopNote(): void {
    if (this.piano) {
      this.piano.releaseAll();
    }
  }

  dispose(): void {
    console.log('🗑️ WebAudioService: Disposing...');

    this.stopMicrophoneCapture();

    if (this.piano) {
      this.piano.dispose();
      this.piano = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;

    console.log('✅ WebAudioService: Disposed');
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Internal: Pitch detection loop using requestAnimationFrame
   * Extracts PCM data from AnalyserNode and invokes callback
   */
  private startPitchDetectionLoop(): void {
    if (!this.analyser || !this.pitchCallback) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const detectPitch = () => {
      if (!this.analyser || !this.pitchCallback) return;

      // Get time-domain data (PCM)
      this.analyser.getFloatTimeDomainData(dataArray);

      // Invoke callback with audio buffer
      this.pitchCallback(dataArray, this.sampleRate);

      // Continue loop
      this.animationFrameId = requestAnimationFrame(detectPitch);
    };

    detectPitch();
  }
}
