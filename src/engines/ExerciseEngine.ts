/**
 * ExerciseEngine
 * Handles automatic exercise progression, pitch tracking, and results
 *
 * KEY FEATURE: Hands-free operation
 * - User presses START once
 * - Engine auto-plays notes in sequence
 * - Tracks accuracy in background
 * - Shows results at end
 */

import * as Tone from 'tone';
import { YINPitchDetector } from '../utils/pitchDetection';
import {
  Exercise,
  ExerciseSession,
  ExerciseResults,
  ExerciseSettings,
  Note,
  NoteResult,
  PitchReading,
} from '../data/models';

export class ExerciseEngine {
  private exercise: Exercise;
  private settings: ExerciseSettings;
  private session: ExerciseSession | null = null;
  private isRunning: boolean = false;

  // Audio
  private piano: Tone.Sampler | null = null;
  private pitchDetector: YINPitchDetector | null = null;
  private analyser: AnalyserNode | null = null;

  // Callbacks
  private onNoteChange?: (noteIndex: number, note: Note) => void;
  private onPitchDetected?: (frequency: number, note: string, accuracy: number, confidence: number) => void;
  private onComplete?: (results: ExerciseResults) => void;
  private onError?: (error: Error) => void;

  constructor(
    exercise: Exercise,
    settings: ExerciseSettings,
    piano: Tone.Sampler,
    pitchDetector: YINPitchDetector,
    analyser: AnalyserNode
  ) {
    this.exercise = exercise;
    this.settings = settings;
    this.piano = piano;
    this.pitchDetector = pitchDetector;
    this.analyser = analyser;
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

      // Ensure Tone.js is started
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

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
  stop(): void {
    this.isRunning = false;
    console.log('⏹ Exercise stopped');
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

      // Notify UI of note change
      if (this.onNoteChange) {
        this.onNoteChange(i, note);
      }

      console.log(`🎵 Note ${i + 1}/${this.exercise.notes.length}: ${note.note}`);

      // 1. Play the piano note
      await this.playPianoNote(note);

      // 2. Wait a moment for the sound to register
      await this.wait(300);

      // 3. Listen for user singing (background tracking)
      const noteResult = await this.listenAndTrack(note);
      this.session.noteResults.push(noteResult);

      // 4. Wait for note duration (based on tempo)
      const noteDuration = this.calculateNoteDuration();
      await this.wait(noteDuration);

      // 5. Small gap between notes
      await this.wait(500);

      // Loop continues automatically to next note!
    }

    // Exercise complete
    if (this.isRunning) {
      this.complete();
    }
  }

  /**
   * Play a piano note
   */
  private async playPianoNote(note: Note): Promise<void> {
    if (!this.piano) return;

    return new Promise((resolve) => {
      this.piano!.triggerAttackRelease(note.note, '1n');
      // Resolve after note starts playing
      setTimeout(resolve, 100);
    });
  }

  /**
   * Listen for user singing and track pitch
   */
  private async listenAndTrack(note: Note): Promise<NoteResult> {
    const startTime = Date.now();
    const pitchReadings: PitchReading[] = [];
    const listenDuration = this.calculateNoteDuration();

    return new Promise((resolve) => {
      const dataArray = new Float32Array(this.analyser!.fftSize);

      const listen = () => {
        if (!this.isRunning || Date.now() - startTime > listenDuration) {
          // Done listening for this note
          const result = this.calculateNoteResult(note, pitchReadings);
          resolve(result);
          return;
        }

        // Get audio data
        this.analyser!.getFloatTimeDomainData(dataArray);

        // Calculate RMS (volume)
        let rms = 0;
        for (let i = 0; i < dataArray.length; i++) {
          rms += dataArray[i] * dataArray[i];
        }
        rms = Math.sqrt(rms / dataArray.length);

        // Detect pitch if sufficient volume
        if (rms > 0.005 && this.pitchDetector) {
          const pitch = this.pitchDetector.detectPitch(dataArray);

          if (pitch && pitch.confidence > 0.5) {
            const cents = this.calculateCentsOff(pitch.frequency, note.frequency);
            const accuracy = Math.max(0, Math.min(100, 100 - Math.abs(cents) * 2));

            const reading: PitchReading = {
              timestamp: Date.now(),
              frequency: pitch.frequency,
              confidence: pitch.confidence,
              targetFrequency: note.frequency,
              centsOff: cents,
            };

            pitchReadings.push(reading);

            // Notify UI of pitch detection
            if (this.onPitchDetected) {
              this.onPitchDetected(pitch.frequency, pitch.note, accuracy, pitch.confidence);
            }
          }
        }

        // Continue listening
        requestAnimationFrame(listen);
      };

      listen();
    });
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
  private complete(): void {
    if (!this.session) return;

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
