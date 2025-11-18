/**
 * Native audio implementation for iOS/Android
 * Uses Expo AV (expo-av) + expo-audio-stream
 * Works on: iOS, Android
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import { IAudioService, PitchDetectionCallback, AudioServiceConfig } from './IAudioService';
import { ExpoPlayAudioStream, AudioDataEvent } from '@mykin-ai/expo-audio-stream';
import { EventSubscription } from 'expo-modules-core';

export class NativeAudioService implements IAudioService {
  private recording: Audio.Recording | null = null;
  private sounds: Map<string, Audio.Sound> = new Map();
  private sampleRate: number = 44100;
  private bufferSize: number = 2048;
  private pitchCallback: PitchDetectionCallback | null = null;
  private isCapturing: boolean = false;
  private audioSubscription: EventSubscription | null = null;
  private recordingEncoding: 'pcm_16bit' = 'pcm_16bit';

  // Piano sample paths (University of Iowa samples, AIFF format)
  private readonly noteSamples: Record<string, any> = {
    // Octave 3
    'C3': require('../../../assets/audio/piano/C3.aiff'),
    'C#3': require('../../../assets/audio/piano/Db3.aiff'),
    'Db3': require('../../../assets/audio/piano/Db3.aiff'),
    'D3': require('../../../assets/audio/piano/D3.aiff'),
    'D#3': require('../../../assets/audio/piano/Eb3.aiff'),
    'Eb3': require('../../../assets/audio/piano/Eb3.aiff'),
    'E3': require('../../../assets/audio/piano/E3.aiff'),
    'F3': require('../../../assets/audio/piano/F3.aiff'),
    'F#3': require('../../../assets/audio/piano/Gb3.aiff'),
    'Gb3': require('../../../assets/audio/piano/Gb3.aiff'),
    'G3': require('../../../assets/audio/piano/G3.aiff'),
    'G#3': require('../../../assets/audio/piano/Ab3.aiff'),
    'Ab3': require('../../../assets/audio/piano/Ab3.aiff'),
    'A3': require('../../../assets/audio/piano/A3.aiff'),
    'A#3': require('../../../assets/audio/piano/Bb3.aiff'),
    'Bb3': require('../../../assets/audio/piano/Bb3.aiff'),
    'B3': require('../../../assets/audio/piano/B3.aiff'),

    // Octave 4
    'C4': require('../../../assets/audio/piano/C4.aiff'),
    'C#4': require('../../../assets/audio/piano/Db4.aiff'),
    'Db4': require('../../../assets/audio/piano/Db4.aiff'),
    'D4': require('../../../assets/audio/piano/D4.aiff'),
    'D#4': require('../../../assets/audio/piano/Eb4.aiff'),
    'Eb4': require('../../../assets/audio/piano/Eb4.aiff'),
    'E4': require('../../../assets/audio/piano/E4.aiff'),
    'F4': require('../../../assets/audio/piano/F4.aiff'),
    'F#4': require('../../../assets/audio/piano/Gb4.aiff'),
    'Gb4': require('../../../assets/audio/piano/Gb4.aiff'),
    'G4': require('../../../assets/audio/piano/G4.aiff'),
    'G#4': require('../../../assets/audio/piano/Ab4.aiff'),
    'Ab4': require('../../../assets/audio/piano/Ab4.aiff'),
    'A4': require('../../../assets/audio/piano/A4.aiff'),
    'A#4': require('../../../assets/audio/piano/Bb4.aiff'),
    'Bb4': require('../../../assets/audio/piano/Bb4.aiff'),
    'B4': require('../../../assets/audio/piano/B4.aiff'),

    // Octave 5
    'C5': require('../../../assets/audio/piano/C5.aiff'),
    'C#5': require('../../../assets/audio/piano/Db5.aiff'),
    'Db5': require('../../../assets/audio/piano/Db5.aiff'),
    'D5': require('../../../assets/audio/piano/D5.aiff'),
    'D#5': require('../../../assets/audio/piano/Eb5.aiff'),
    'Eb5': require('../../../assets/audio/piano/Eb5.aiff'),
    'E5': require('../../../assets/audio/piano/E5.aiff'),
    'F5': require('../../../assets/audio/piano/F5.aiff'),
    'F#5': require('../../../assets/audio/piano/Gb5.aiff'),
    'Gb5': require('../../../assets/audio/piano/Gb5.aiff'),
    'G5': require('../../../assets/audio/piano/G5.aiff'),
    'G#5': require('../../../assets/audio/piano/Ab5.aiff'),
    'Ab5': require('../../../assets/audio/piano/Ab5.aiff'),
    'A5': require('../../../assets/audio/piano/A5.aiff'),
    'A#5': require('../../../assets/audio/piano/Bb5.aiff'),
    'Bb5': require('../../../assets/audio/piano/Bb5.aiff'),
    'B5': require('../../../assets/audio/piano/B5.aiff'),

    // Octave 6
    'C6': require('../../../assets/audio/piano/C6.aiff'),
  };

  constructor(private config: AudioServiceConfig = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.bufferSize = config.bufferSize || 2048;
  }

  async initialize(): Promise<void> {
    console.log('🎹 NativeAudioService: Initializing...');

    // Use playAndRecord mode to allow both playback and recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,  // Enables microphone
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: 2, // DoNotMix
      interruptionModeAndroid: 1, // DoNotMix
    });

    console.log('✅ NativeAudioService: Audio mode configured (playAndRecord)');
  }

  /**
   * Set audio mode for playback (routes to speaker)
   */
  private async setPlaybackMode(): Promise<void> {
    // Don't change audio mode - stay in playAndRecord mode
    console.log('🔊 Audio mode: Playback (speaker)');
  }

  /**
   * Set audio mode for recording (enables microphone)
   */
  private async setRecordingMode(): Promise<void> {
    // Don't change audio mode - stay in playAndRecord mode
    console.log('🎤 Audio mode: Recording (microphone enabled)');
  }

  async requestPermissions(): Promise<boolean> {
    console.log('🎤 NativeAudioService: Requesting microphone permissions...');

    try {
      const { status } = await Audio.requestPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ NativeAudioService: Microphone permission granted');
        return true;
      } else {
        console.error('❌ NativeAudioService: Microphone permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ NativeAudioService: Permission request failed', error);
      return false;
    }
  }

  async startMicrophoneCapture(callback: PitchDetectionCallback): Promise<void> {
    console.log('🎤 NativeAudioService: Starting microphone capture...');

    // Switch to recording mode (enables microphone)
    await this.setRecordingMode();

    this.pitchCallback = callback;
    this.isCapturing = true;

    try {
      // Calculate interval for desired buffer size
      const intervalMs = Math.floor((this.bufferSize / this.sampleRate) * 1000);

      console.log(`🎤 NativeAudioService: Using real-time audio stream (${this.sampleRate}Hz, buffer: ${this.bufferSize}, interval: ${intervalMs}ms)`);

      // Start real-time audio streaming
      const { recordingResult, subscription } = await ExpoPlayAudioStream.startRecording({
        sampleRate: this.sampleRate as 16000 | 44100 | 48000,
        channels: 1,
        encoding: this.recordingEncoding,
        interval: intervalMs,
        onAudioStream: async (event: AudioDataEvent) => {
          try {
            // Convert audio data to Float32Array
            const pcmBuffer = this.convertAudioData(event.data);

            // Call pitch detection callback with ACTUAL sample rate from device
            // CRITICAL FIX: Use recordingResult.sampleRate (actual) not this.sampleRate (requested)
            if (this.pitchCallback && pcmBuffer.length > 0 && this.isCapturing) {
              const actualSampleRate = recordingResult.sampleRate || this.sampleRate;
              this.pitchCallback(pcmBuffer, actualSampleRate);
            }
          } catch (error) {
            console.error('❌ NativeAudioService: Error processing audio stream', error);
          }
        }
      });

      // Store subscription for cleanup
      this.audioSubscription = subscription || null;

      // CRITICAL FIX: Update internal sample rate with ACTUAL value from device
      // iOS uses 48000 Hz even when we request 44100 Hz
      const actualSampleRate = recordingResult.sampleRate || this.sampleRate;
      if (actualSampleRate !== this.sampleRate) {
        console.warn(`⚠️ Sample rate mismatch: Requested ${this.sampleRate} Hz, got ${actualSampleRate} Hz`);
        this.sampleRate = actualSampleRate;
      }

      console.log('✅ NativeAudioService: Real-time audio capture started', {
        fileUri: recordingResult.fileUri,
        mimeType: recordingResult.mimeType,
        channels: recordingResult.channels,
        sampleRate: recordingResult.sampleRate,
        requestedSampleRate: this.sampleRate,
        actualSampleRate: actualSampleRate
      });

    } catch (error) {
      console.error('❌ NativeAudioService: Failed to start recording', error);
      this.isCapturing = false;
      throw error;
    }
  }

  async stopMicrophoneCapture(): Promise<void> {
    // Defensive check: Only stop if actually capturing
    if (!this.isCapturing && !this.recording) {
      console.log('⏹ NativeAudioService: No active recording to stop');
      return;
    }

    console.log('🛑 NativeAudioService: Stopping microphone capture...');

    this.isCapturing = false;
    this.pitchCallback = null;

    try {
      // Stop real-time audio streaming
      await ExpoPlayAudioStream.stopRecording();

      // Clean up subscription
      if (this.audioSubscription) {
        this.audioSubscription.remove();
        this.audioSubscription = null;
      }

      console.log('✅ NativeAudioService: Recording stopped');

    } catch (error) {
      console.error('❌ NativeAudioService: Failed to stop recording', error);
    }
  }

  async playNote(noteName: string, duration: number): Promise<void> {
    console.log(`🎹 NativeAudioService: Playing ${noteName} for ${duration}s`);

    // Check if sample exists
    const samplePath = this.noteSamples[noteName];
    if (!samplePath) {
      console.warn(`⚠️ NativeAudioService: No sample for ${noteName}, using placeholder`);
      // TODO: Map to closest available sample
      return;
    }

    try {
      // Load or reuse sound
      let sound = this.sounds.get(noteName);

      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync(samplePath);
        sound = newSound;
        this.sounds.set(noteName, sound);
      }

      // Play note
      await sound.replayAsync();

      // Stop after duration
      setTimeout(async () => {
        await sound?.stopAsync();
      }, duration * 1000);

    } catch (error) {
      console.error(`❌ NativeAudioService: Failed to play ${noteName}`, error);
    }
  }

  stopNote(): void {
    // Stop all playing sounds
    this.sounds.forEach(async (sound) => {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error('❌ NativeAudioService: Failed to stop sound', error);
      }
    });
  }

  dispose(): void {
    console.log('🗑️ NativeAudioService: Disposing...');

    this.stopMicrophoneCapture();

    // Unload all sounds
    this.sounds.forEach(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('❌ NativeAudioService: Failed to unload sound', error);
      }
    });

    this.sounds.clear();

    console.log('✅ NativeAudioService: Disposed');
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Convert audio data (base64 or Float32Array) to Float32Array
   */
  private convertAudioData(data: string | Float32Array): Float32Array {
    // If already Float32Array, return as-is
    if (data instanceof Float32Array) {
      return data;
    }

    // Convert base64 to Float32Array
    return this.base64ToFloat32Array(data, this.recordingEncoding);
  }

  /**
   * Convert base64 encoded PCM to Float32Array
   * @param base64 Base64 encoded audio data
   * @param encoding PCM encoding format
   * @returns Float32Array normalized to -1.0 to 1.0 range
   */
  private base64ToFloat32Array(
    base64: string,
    encoding: 'pcm_16bit' | 'pcm_32bit' | 'pcm_8bit'
  ): Float32Array {
    try {
      // Decode base64 to binary
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert based on encoding type
      if (encoding === 'pcm_32bit') {
        // 32-bit float - direct conversion
        return new Float32Array(bytes.buffer);
      } else if (encoding === 'pcm_16bit') {
        // 16-bit signed integer - normalize to -1.0 to 1.0
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }
        return float32Array;
      } else if (encoding === 'pcm_8bit') {
        // 8-bit unsigned integer - normalize to -1.0 to 1.0
        const float32Array = new Float32Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          float32Array[i] = (bytes[i] - 128) / 128.0;
        }
        return float32Array;
      }

      return new Float32Array(0);
    } catch (error) {
      console.error('❌ NativeAudioService: Error converting base64 to Float32Array', error);
      return new Float32Array(0);
    }
  }
}
