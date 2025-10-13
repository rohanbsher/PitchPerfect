export class ReferencePitchService {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  // Note frequencies (Equal Temperament, A4 = 440Hz)
  private readonly noteFrequencies: { [key: string]: number } = {
    'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83,
    'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'A#0': 29.14, 'B0': 30.87,
    'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65,
    'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74,
    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91,
    'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53,
    'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83,
    'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'A#7': 3729.31, 'B7': 3951.07,
    'C8': 4186.01
  };

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeContext();
  }

  private initializeContext(): void {
    if (!this.audioContext) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  // Play a specific note
  async playNote(
    note: string,
    duration: number = 1000,
    waveType: OscillatorType = 'sine',
    volume: number = 0.3
  ): Promise<void> {
    this.initializeContext();
    if (!this.audioContext) return;

    // Stop any existing note
    this.stop();

    const frequency = this.noteFrequencies[note] || this.getFrequencyFromNote(note);
    if (!frequency || frequency <= 0) {
      console.warn(`Invalid note: ${note}`);
      return;
    }

    try {
      // Create oscillator
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = waveType;
      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01); // Fade in

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Start playing
      this.oscillator.start(this.audioContext.currentTime);
      this.isPlaying = true;

      // Auto-stop after duration
      if (duration > 0) {
        // Fade out
        this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration / 1000 - 0.05);

        setTimeout(() => {
          this.stop();
        }, duration);
      }

    } catch (error) {
      console.error('Error playing note:', error);
      this.stop();
    }
  }

  // Play a frequency directly
  async playFrequency(
    frequency: number,
    duration: number = 1000,
    waveType: OscillatorType = 'sine',
    volume: number = 0.3
  ): Promise<void> {
    this.initializeContext();
    if (!this.audioContext) return;

    // Stop any existing note
    this.stop();

    try {
      // Create oscillator
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = waveType;
      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);

      // Connect nodes
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Start playing
      this.oscillator.start(this.audioContext.currentTime);
      this.isPlaying = true;

      // Auto-stop after duration
      if (duration > 0) {
        this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration / 1000 - 0.05);

        setTimeout(() => {
          this.stop();
        }, duration);
      }

    } catch (error) {
      console.error('Error playing frequency:', error);
      this.stop();
    }
  }

  // Play a sequence of notes (melody)
  async playSequence(
    notes: Array<{ note: string; duration: number; rest?: number }>,
    waveType: OscillatorType = 'sine',
    volume: number = 0.3
  ): Promise<void> {
    for (const item of notes) {
      if (this.isPlaying) {
        this.stop();
      }

      await this.playNote(item.note, item.duration, waveType, volume);

      // Wait for note duration plus rest time
      await new Promise(resolve => setTimeout(resolve, item.duration + (item.rest || 0)));
    }
  }

  // Play a scale
  async playScale(
    rootNote: string,
    scaleType: 'major' | 'minor' | 'chromatic' | 'pentatonic' = 'major',
    ascending: boolean = true,
    noteDuration: number = 500
  ): Promise<void> {
    const intervals = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      pentatonic: [0, 2, 4, 7, 9, 12]
    };

    const rootFreq = this.noteFrequencies[rootNote] || this.getFrequencyFromNote(rootNote);
    if (!rootFreq) return;

    const scaleIntervals = intervals[scaleType];
    const scaleNotes = scaleIntervals.map(interval => {
      const freq = rootFreq * Math.pow(2, interval / 12);
      return { frequency: freq, duration: noteDuration };
    });

    if (!ascending) {
      scaleNotes.reverse();
    }

    for (const note of scaleNotes) {
      await this.playFrequency(note.frequency, note.duration);
      await new Promise(resolve => setTimeout(resolve, note.duration + 50)); // Small gap between notes
    }
  }

  // Play an arpeggio
  async playArpeggio(
    rootNote: string,
    chordType: 'major' | 'minor' | 'diminished' | 'augmented' = 'major',
    noteDuration: number = 300,
    pattern: number[] = [0, 1, 2, 1]
  ): Promise<void> {
    const intervals = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      diminished: [0, 3, 6],
      augmented: [0, 4, 8]
    };

    const rootFreq = this.noteFrequencies[rootNote] || this.getFrequencyFromNote(rootNote);
    if (!rootFreq) return;

    const chordIntervals = intervals[chordType];
    const chordFrequencies = chordIntervals.map(interval =>
      rootFreq * Math.pow(2, interval / 12)
    );

    for (const index of pattern) {
      if (index < chordFrequencies.length) {
        await this.playFrequency(chordFrequencies[index], noteDuration);
        await new Promise(resolve => setTimeout(resolve, noteDuration + 50));
      }
    }
  }

  // Stop playing
  stop(): void {
    if (this.oscillator) {
      try {
        if (this.gainNode) {
          // Quick fade out to avoid click
          this.gainNode.gain.cancelScheduledValues(this.audioContext!.currentTime);
          this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext!.currentTime);
          this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext!.currentTime + 0.05);
        }

        setTimeout(() => {
          if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
          }
          if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
          }
        }, 50);
      } catch (error) {
        // Oscillator may have already stopped
      }
    }
    this.isPlaying = false;
  }

  // Helper to convert note string to frequency
  private getFrequencyFromNote(note: string): number {
    // Parse note like "A4" or "C#5"
    const match = note.match(/([A-G]#?)(\d+)/);
    if (!match) return 0;

    const noteName = match[1];
    const octave = parseInt(match[2]);

    // Calculate frequency using A4 = 440Hz as reference
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = noteNames.indexOf(noteName);
    if (noteIndex === -1) return 0;

    // Calculate semitones from A4
    const a4Index = noteNames.indexOf('A') + 4 * 12; // A4 position
    const targetIndex = noteIndex + octave * 12;
    const semitoneDiff = targetIndex - a4Index;

    // Calculate frequency
    return 440 * Math.pow(2, semitoneDiff / 12);
  }

  // Check if currently playing
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Clean up resources
  dispose(): void {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const referencePitchService = new ReferencePitchService();