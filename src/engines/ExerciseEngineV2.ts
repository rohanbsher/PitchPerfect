/**
 * ExerciseEngineV2 - Cross-platform version using IAudioService
 * Handles automatic exercise progression, pitch tracking, and results
 *
 * KEY FEATURE: Hands-free operation
 * - User presses START once
 * - Engine auto-plays notes in sequence
 * - Tracks accuracy in background
 * - Shows results at end
 *
 * ARCHITECTURE: Uses IAudioService for platform abstraction
 * - Works on Web (Web Audio API)
 * - Works on iOS (Expo AV)
 * - Works on Android (Expo AV)
 */

import { YINPitchDetector } from '../utils/pitchDetection';
import { IAudioService, PitchDetectionCallback } from '../services/audio/IAudioService';
import {
  Exercise,
  ExerciseSession,
  ExerciseResults,
  ExerciseSettings,
  Note,
  NoteResult,
  PitchReading,
} from '../data/models';

export class ExerciseEngineV2 {
  private exercise: Exercise;
  private settings: ExerciseSettings;
  private session: ExerciseSession | null = null;
  private isRunning: boolean = false;

  // Audio services
  private audioService: IAudioService;
  private pitchDetector: YINPitchDetector;

  // Real-time pitch tracking
  private currentPitchReadings: PitchReading[] = [];
  private isListening: boolean = false;

  // Callbacks
  private onNoteChange?: (noteIndex: number, note: Note) => void;
  private onPitchDetected?: (frequency: number, note: string, accuracy: number, confidence: number) => void;
  private onComplete?: (results: ExerciseResults) => void;
  private onError?: (error: Error) => void;

  constructor(
    exercise: Exercise,
    settings: ExerciseSettings,
    audioService: IAudioService,
    pitchDetector: YINPitchDetector
  ) {
    this.exercise = exercise;
    this.settings = settings;
    this.audioService = audioService;
    this.pitchDetector = pitchDetector;
  }

  /**
   * Set callback for when current note changes
   */
  setOnNoteChange(callback: (noteIndex: number, note: Note) => void) {
    this.onNoteChange = callback;
  }

  /**
   * Set callback for real-time pitch detection
   */
  setOnPitchDetected(callback: (frequency: number, note: string, accuracy: number, confidence: number) => void) {
    this.onPitchDetected = callback;
  }

  /**
   * Set callback for exercise completion
   */
  setOnComplete(callback: (results: ExerciseResults) => void) {
    this.onComplete = callback;
  }

  /**
   * Set callback for errors
   */
  setOnError(callback: (error: Error) => void) {
    this.onError = callback;
  }

  /**
   * Start the exercise
   * This is THE KEY METHOD - everything runs automatically after this
   */
  async start(): Promise<void> {
    try {
      console.log('🎯 Starting exercise:', this.exercise.name);

      // Initialize session
      this.session = {
        exerciseId: this.exercise.id,
        startTime: new Date(),
        currentNoteIndex: 0,
        totalNotes: this.exercise.notes?.length ?? 0,
        pitchReadings: [],
        noteResults: [],
      };

      this.isRunning = true;

      // Start microphone capture for pitch detection
      await this.startPitchTracking();

      // Run the exercise
      await this.runExercise();

    } catch (error) {
      console.error('❌ Exercise error:', error);
      if (this.onError) {
        this.onError(error as Error);
      }
    }
  }

  /**
   * Pause the exercise
   */
  pause(): void {
    this.isRunning = false;
    console.log('⏸ Exercise paused');
  }

  /**
   * Resume the exercise
   */
  resume(): void {
    this.isRunning = true;
    console.log('▶ Exercise resumed');
  }

  /**
   * Stop the exercise (won't call onComplete)
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    this.isListening = false;
    await this.audioService.stopMicrophoneCapture();
    console.log('⏹ Exercise stopped');
  }

  /**
   * Start pitch tracking using microphone
   */
  private async startPitchTracking(): Promise<void> {
    this.isListening = true;

    const pitchCallback: PitchDetectionCallback = (audioBuffer: Float32Array, sampleRate: number) => {
      if (!this.isListening) return;

      // Detect pitch
      const result = this.pitchDetector.detectPitch(audioBuffer);

      if (result.frequency > 0 && result.confidence > 0.5) {
        // Store reading if we're tracking a note
        if (this.session && this.exercise.notes && this.session.currentNoteIndex < this.exercise.notes.length) {
          const currentNote = this.exercise.notes[this.session.currentNoteIndex];
          if (!currentNote) return;
          const cents = this.calculateCentsOff(result.frequency, currentNote.frequency);
          const accuracy = Math.max(0, Math.min(100, 100 - Math.abs(cents) * 2));

          const reading: PitchReading = {
            timestamp: Date.now(),
            frequency: result.frequency,
            confidence: result.confidence,
            targetFrequency: currentNote.frequency,
            centsOff: cents,
          };

          this.currentPitchReadings.push(reading);

          // Notify UI
          if (this.onPitchDetected) {
            this.onPitchDetected(result.frequency, result.note, accuracy, result.confidence);
          }
        }
      }
    };

    await this.audioService.startMicrophoneCapture(pitchCallback);
  }

  /**
   * Main exercise loop - plays notes automatically
   */
  private async runExercise(): Promise<void> {
    if (!this.session) return;
    if (!this.exercise.notes) return;

    for (let i = 0; i < this.exercise.notes.length; i++) {
      if (!this.isRunning) {
        console.log('Exercise interrupted at note', i);
        break;
      }

      const note = this.exercise.notes[i];
      if (!note) {
        console.error(`Note at index ${i} is undefined`);
        continue;
      }
      this.session.currentNoteIndex = i;

      // Clear pitch readings for this note
      this.currentPitchReadings = [];

      // Notify UI of note change
      if (this.onNoteChange) {
        this.onNoteChange(i, note);
      }

      console.log(`🎵 Note ${i + 1}/${this.exercise.notes.length}: ${note.note}`);

      // 1. Play the piano note using IAudioService
      await this.playPianoNote(note);

      // 2. Wait a moment for the sound to register
      await this.wait(300);

      // 3. Listen for user singing (pitch readings collected in background)
      const noteDuration = this.calculateNoteDuration();
      await this.wait(noteDuration);

      // 4. Calculate result for this note
      const noteResult = this.calculateNoteResult(note, this.currentPitchReadings);
      this.session.noteResults.push(noteResult);

      // 5. Small gap between notes
      await this.wait(500);

      // Loop continues automatically to next note!
    }

    // Exercise complete
    if (this.isRunning) {
      await this.complete();
    }
  }

  /**
   * Play a piano note using IAudioService
   */
  private async playPianoNote(note: Note): Promise<void> {
    try {
      // Duration: quarter note at current tempo
      const duration = (60 / this.settings.tempo);
      await this.audioService.playNote(note.note, duration);
    } catch (error) {
      console.error('❌ Failed to play note:', error);
    }
  }

  /**
   * Calculate result for a single note
   */
  private calculateNoteResult(note: Note, readings: PitchReading[]): NoteResult {
    if (readings.length === 0) {
      return {
        noteExpected: note.note,
        frequencyExpected: note.frequency,
        averageAccuracy: 0,
        passed: false,
        pitchReadings: [],
      };
    }

    // Filter out readings that are way off (> 50 cents)
    const validReadings = readings.filter(r => Math.abs(r.centsOff) < 50);

    if (validReadings.length === 0) {
      return {
        noteExpected: note.note,
        frequencyExpected: note.frequency,
        averageAccuracy: 0,
        passed: false,
        pitchReadings: readings,
      };
    }

    // Calculate average accuracy
    const totalAccuracy = validReadings.reduce((sum, r) => {
      const accuracy = 100 - Math.abs(r.centsOff) * 2;
      return sum + Math.max(0, accuracy);
    }, 0);

    const averageAccuracy = totalAccuracy / validReadings.length;
    const passed = averageAccuracy >= this.settings.tolerance;

    return {
      noteExpected: note.note,
      frequencyExpected: note.frequency,
      averageAccuracy: Math.round(averageAccuracy),
      passed,
      pitchReadings: readings,
    };
  }

  /**
   * Complete the exercise and generate results
   */
  private async complete(): Promise<void> {
    if (!this.session) return;

    // Stop microphone capture
    this.isListening = false;
    await this.audioService.stopMicrophoneCapture();

    const results = this.calculateResults();

    console.log('🎉 Exercise complete!', results);

    if (this.onComplete) {
      this.onComplete(results);
    }
  }

  /**
   * Calculate final results
   */
  private calculateResults(): ExerciseResults {
    if (!this.session) {
      throw new Error('No session active');
    }

    const duration = (Date.now() - this.session.startTime.getTime()) / 1000;

    // Overall accuracy
    const totalAccuracy = this.session.noteResults.reduce(
      (sum, r) => sum + r.averageAccuracy,
      0
    );
    const overallAccuracy = Math.round(totalAccuracy / this.session.noteResults.length);

    // Analyze strengths and improvements
    const strengths = this.analyzeStrengths();
    const improvements = this.analyzeImprovements();

    return {
      exerciseId: this.exercise.id,
      completedAt: new Date(),
      duration,
      overallAccuracy,
      noteResults: this.session.noteResults,
      strengths,
      improvements,
    };
  }

  /**
   * Analyze what user did well
   */
  private analyzeStrengths(): string[] {
    if (!this.session) return [];

    const strengths: string[] = [];
    const passedNotes = this.session.noteResults.filter(r => r.averageAccuracy >= 80);

    if (passedNotes.length >= this.session.noteResults.length * 0.7) {
      strengths.push('Great overall accuracy!');
    }

    // Find best note
    const bestNote = this.session.noteResults.reduce((best, current) =>
      current.averageAccuracy > best.averageAccuracy ? current : best
    );

    if (bestNote.averageAccuracy >= 90) {
      strengths.push(`Excellent pitch on ${bestNote.noteExpected}`);
    }

    return strengths;
  }

  /**
   * Analyze what user should work on
   */
  private analyzeImprovements(): string[] {
    if (!this.session) return [];

    const improvements: string[] = [];

    // Find worst note
    const worstNote = this.session.noteResults.reduce((worst, current) =>
      current.averageAccuracy < worst.averageAccuracy ? current : worst
    );

    if (worstNote.averageAccuracy < 70) {
      // Determine if sharp or flat
      const avgCents = worstNote.pitchReadings.reduce((sum, r) => sum + r.centsOff, 0) /
        worstNote.pitchReadings.length;

      if (avgCents > 10) {
        improvements.push(`Work on ${worstNote.noteExpected} - you're singing sharp`);
      } else if (avgCents < -10) {
        improvements.push(`Work on ${worstNote.noteExpected} - you're singing flat`);
      } else {
        improvements.push(`Practice ${worstNote.noteExpected} more`);
      }
    }

    if (this.settings.tempo > 100) {
      improvements.push('Try slowing down the tempo for better accuracy');
    }

    return improvements;
  }

  /**
   * Calculate how long to listen for each note (in ms)
   */
  private calculateNoteDuration(): number {
    // Convert BPM to ms per beat
    const msPerBeat = (60 / this.settings.tempo) * 1000;
    // Each note gets one beat
    return msPerBeat;
  }

  /**
   * Calculate cents off from target
   */
  private calculateCentsOff(detected: number, target: number): number {
    if (detected === 0 || target === 0) return 999;
    return Math.round(1200 * Math.log2(detected / target));
  }

  /**
   * Wait for a duration (in ms)
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
