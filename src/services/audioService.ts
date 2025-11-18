import { Audio } from 'expo-av';
import { YINPitchDetector, PitchDetectionResult } from '../utils/pitchDetection';

export interface AudioServiceConfig {
  sampleRate?: number;
  bufferSize?: number;
  updateInterval?: number;
}

export class AudioService {
  private recording: Audio.Recording | null = null;
  private pitchDetector: YINPitchDetector;
  private isRecording: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private audioBuffer: Float32Array;
  private bufferSize: number;
  private sampleRate: number;
  private updateInterval: number;
  private onPitchDetected?: (result: PitchDetectionResult) => void;

  constructor(config: AudioServiceConfig = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.bufferSize = config.bufferSize || 2048;
    this.updateInterval = config.updateInterval || 50; // 50ms = 20 updates per second

    this.pitchDetector = new YINPitchDetector(this.sampleRate, this.bufferSize);
    this.audioBuffer = new Float32Array(this.bufferSize);
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  /**
   * Initialize audio settings
   */
  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  /**
   * Start recording and pitch detection
   */
  async startPitchDetection(callback: (result: PitchDetectionResult) => void): Promise<void> {
    try {
      // Stop any existing recording
      if (this.isRecording) {
        await this.stopPitchDetection();
      }

      this.onPitchDetected = callback;

      // Configure recording options for real-time processing
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: this.sampleRate,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: this.sampleRate,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      };

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        recordingOptions,
        this.onRecordingStatusUpdate.bind(this)
      );

      this.recording = recording;
      this.isRecording = true;

      // Start processing audio data
      this.startProcessing();
    } catch (error) {
      console.error('Error starting pitch detection:', error);
      throw error;
    }
  }

  /**
   * Stop recording and pitch detection
   */
  async stopPitchDetection(): Promise<void> {
    try {
      this.isRecording = false;

      if (this.processingInterval) {
        clearInterval(this.processingInterval);
        this.processingInterval = null;
      }

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
    } catch (error) {
      console.error('Error stopping pitch detection:', error);
    }
  }

  /**
   * Recording status update handler
   */
  private onRecordingStatusUpdate(status: Audio.RecordingStatus): void {
    if (!status.isRecording) {
      return;
    }

    // In a real implementation, we would get PCM data here
    // For now, we'll simulate with the processing interval
  }

  /**
   * Start processing audio data
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process audio at regular intervals
    this.processingInterval = setInterval(() => {
      if (!this.isRecording) {
        return;
      }

      // In a real implementation, we would get the actual audio buffer from the recording
      // For demonstration, we'll simulate audio data
      this.simulateAudioData();

      // Detect pitch
      const result = this.pitchDetector.detectPitch(this.audioBuffer);

      // Call callback with result
      if (this.onPitchDetected) {
        this.onPitchDetected(result);
      }
    }, this.updateInterval);
  }

  /**
   * Simulate audio data for testing
   * In production, this would be replaced with actual audio buffer from recording
   */
  private simulateAudioData(): void {
    // Generate a test sine wave at 440 Hz (A4)
    const frequency = 440;
    const amplitude = 0.5;

    for (let i = 0; i < this.bufferSize; i++) {
      const time = i / this.sampleRate;
      this.audioBuffer[i] = amplitude * Math.sin(2 * Math.PI * frequency * time);

      // Add some noise for realism
      this.audioBuffer[i] += (Math.random() - 0.5) * 0.05;
    }
  }

  /**
   * Record audio to file
   */
  async startRecording(): Promise<void> {
    try {
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return the URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  }

  /**
   * Update pitch detector parameters
   */
  updateParameters(params: { sampleRate?: number; bufferSize?: number; threshold?: number }): void {
    this.pitchDetector.updateParameters(params);

    if (params.sampleRate) {
      this.sampleRate = params.sampleRate;
    }

    if (params.bufferSize) {
      this.bufferSize = params.bufferSize;
      this.audioBuffer = new Float32Array(params.bufferSize);
    }
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}