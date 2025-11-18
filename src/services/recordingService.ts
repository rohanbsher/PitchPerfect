import { detectPitch } from '../utils/pitchDetection';

export interface RecordingData {
  id: string;
  timestamp: Date;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
  pitchData: PitchPoint[];
  averagePitch: number;
  noteSequence: string[];
}

export interface PitchPoint {
  time: number;
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
}

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private pitchData: PitchPoint[] = [];
  private startTime: number = 0;
  private recordingInterval: NodeJS.Timeout | null = null;
  private isRecording: boolean = false;

  async startRecording(): Promise<void> {
    try {
      // Reset data
      this.audioChunks = [];
      this.pitchData = [];
      this.startTime = Date.now();

      // Get user media
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });

      // Set up Web Audio API for pitch detection
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      if (!this.audioContext) {
        throw new Error('Failed to create AudioContext');
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.8;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // Set up MediaRecorder for audio recording
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;

      // Start pitch detection
      this.startPitchDetection();

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Default fallback
  }

  private startPitchDetection(): void {
    if (!this.analyser || !this.audioContext) return;

    const bufferSize = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferSize);

    const detectPitchFrame = () => {
      if (!this.isRecording || !this.analyser || !this.audioContext) return;

      this.analyser.getFloatTimeDomainData(dataArray);
      const pitch = detectPitch(dataArray, this.audioContext.sampleRate);

      if (pitch && pitch.frequency > 0 && pitch.confidence > 0.8) {
        const currentTime = (Date.now() - this.startTime) / 1000; // Convert to seconds

        this.pitchData.push({
          time: currentTime,
          frequency: pitch.frequency,
          note: pitch.note,
          cents: pitch.cents,
          confidence: pitch.confidence
        });
      }

      if (this.isRecording) {
        requestAnimationFrame(detectPitchFrame);
      }
    };

    detectPitchFrame();
  }

  async stopRecording(): Promise<RecordingData> {
    this.isRecording = false;

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const duration = (Date.now() - this.startTime) / 1000;

          // Create audio blob
          const audioBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm'
          });

          // Create URL for playback
          const audioUrl = URL.createObjectURL(audioBlob);

          // Calculate average pitch
          const averagePitch = this.calculateAveragePitch();

          // Extract note sequence
          const noteSequence = this.extractNoteSequence();

          // Clean up
          this.cleanup();

          const recordingData: RecordingData = {
            id: `rec_${Date.now()}`,
            timestamp: new Date(),
            duration,
            audioBlob,
            audioUrl,
            pitchData: this.pitchData,
            averagePitch,
            noteSequence
          };

          resolve(recordingData);
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private calculateAveragePitch(): number {
    if (this.pitchData.length === 0) return 0;

    const sum = this.pitchData.reduce((acc, point) => acc + point.frequency, 0);
    return sum / this.pitchData.length;
  }

  private extractNoteSequence(): string[] {
    const notes: string[] = [];
    let lastNote = '';

    for (const point of this.pitchData) {
      if (point.note !== lastNote && point.confidence > 0.85) {
        notes.push(point.note);
        lastNote = point.note;
      }
    }

    return notes;
  }

  private cleanup(): void {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Compare two recordings
  compareRecordings(recording1: RecordingData, recording2: RecordingData): {
    similarity: number;
    timingAccuracy: number;
    pitchAccuracy: number;
    matchedNotes: number;
    totalNotes: number;
  } {
    const maxTime = Math.min(recording1.duration, recording2.duration);
    let matchedFrames = 0;
    let totalFrames = 0;
    let pitchDifferences: number[] = [];

    // Sample every 100ms
    for (let t = 0; t < maxTime; t += 0.1) {
      const pitch1 = this.getPitchAtTime(recording1.pitchData, t);
      const pitch2 = this.getPitchAtTime(recording2.pitchData, t);

      if (pitch1 && pitch2) {
        totalFrames++;

        // Check if notes match
        if (pitch1.note === pitch2.note) {
          matchedFrames++;
        }

        // Calculate pitch difference in cents
        const centsDiff = Math.abs(pitch1.cents - pitch2.cents);
        pitchDifferences.push(centsDiff);
      }
    }

    // Calculate metrics
    const timingAccuracy = totalFrames > 0 ? (matchedFrames / totalFrames) * 100 : 0;
    const avgPitchDiff = pitchDifferences.length > 0
      ? pitchDifferences.reduce((a, b) => a + b, 0) / pitchDifferences.length
      : 100;
    const pitchAccuracy = Math.max(0, 100 - avgPitchDiff);

    // Compare note sequences
    const seq1 = recording1.noteSequence;
    const seq2 = recording2.noteSequence;
    let matchedNotes = 0;
    const minLength = Math.min(seq1.length, seq2.length);

    for (let i = 0; i < minLength; i++) {
      if (seq1[i] === seq2[i]) {
        matchedNotes++;
      }
    }

    const similarity = (timingAccuracy + pitchAccuracy) / 2;

    return {
      similarity,
      timingAccuracy,
      pitchAccuracy,
      matchedNotes,
      totalNotes: Math.max(seq1.length, seq2.length)
    };
  }

  private getPitchAtTime(pitchData: PitchPoint[], time: number): PitchPoint | null {
    // Find the pitch point closest to the given time
    let closest: PitchPoint | null = null;
    let minDiff = Infinity;

    for (const point of pitchData) {
      const diff = Math.abs(point.time - time);
      if (diff < minDiff && diff < 0.1) { // Within 100ms
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }

  // Save recording to localStorage (for demo purposes)
  saveRecording(recording: RecordingData): void {
    const recordings = this.getSavedRecordings();

    // Remove audio blob for storage (too large)
    const storageData = {
      ...recording,
      audioBlob: undefined,
      audioUrl: undefined
    };

    recordings.push(storageData as RecordingData);

    // Keep only last 10 recordings
    if (recordings.length > 10) {
      recordings.shift();
    }

    localStorage.setItem('pitchPerfectRecordings', JSON.stringify(recordings));
  }

  getSavedRecordings(): RecordingData[] {
    const stored = localStorage.getItem('pitchPerfectRecordings');
    return stored ? JSON.parse(stored) : [];
  }

  clearSavedRecordings(): void {
    localStorage.removeItem('pitchPerfectRecordings');
  }
}

export const recordingService = new RecordingService();