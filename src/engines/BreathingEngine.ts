/**
 * Breathing Exercise Engine
 * Executes breathing exercises with precise timing and phase transitions
 *
 * Phases: INHALE → HOLD → EXHALE → TRANSITION → (repeat)
 */

import { Exercise, BreathingRound } from '../data/models';

export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'transition';

export class BreathingEngine {
  private exercise: Exercise;
  private currentRound: number = 0;
  private currentPhase: BreathingPhase = 'inhale';
  private phaseTimeRemaining: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private startTime: Date | null = null;

  // Callbacks
  public onPhaseChange?: (phase: BreathingPhase, duration: number, round: number) => void;
  public onTick?: (phase: BreathingPhase, timeRemaining: number, round: number) => void;
  public onComplete?: () => void;
  public onRoundComplete?: (round: number) => void;

  constructor(exercise: Exercise) {
    if (exercise.type !== 'breathing' || !exercise.breathingRounds) {
      throw new Error('BreathingEngine requires a breathing exercise with breathingRounds');
    }
    this.exercise = exercise;
  }

  /**
   * Start the breathing exercise
   */
  public start(): void {
    console.log('🫁 BreathingEngine: Starting exercise:', this.exercise.name);
    this.startTime = new Date();
    this.currentRound = 0;
    this.startPhase('inhale');
  }

  /**
   * Stop the exercise
   */
  public stop(): void {
    console.log('🛑 BreathingEngine: Stopping exercise');
    this.cleanup();
  }

  /**
   * Start a specific phase
   */
  private startPhase(phase: BreathingPhase): void {
    this.currentPhase = phase;
    const round = this.exercise.breathingRounds![this.currentRound];

    // Determine phase duration
    switch (phase) {
      case 'inhale':
        this.phaseTimeRemaining = round.inhaleBeats;
        break;

      case 'hold':
        if (round.holdBeats === 0) {
          // Skip hold phase if duration is 0
          this.startPhase('exhale');
          return;
        }
        this.phaseTimeRemaining = round.holdBeats;
        break;

      case 'exhale':
        this.phaseTimeRemaining = round.exhaleBeats;
        break;

      case 'transition':
        this.phaseTimeRemaining = 1; // 1 second transition between rounds
        break;
    }

    console.log(
      `🫁 Phase: ${phase.toUpperCase()}, Duration: ${this.phaseTimeRemaining}s, Round: ${this.currentRound + 1}/${this.exercise.breathingRounds!.length}`
    );

    // Notify phase change
    this.onPhaseChange?.(phase, this.phaseTimeRemaining, this.currentRound);

    // Start ticking
    this.tick();
  }

  /**
   * Tick every second
   */
  private tick(): void {
    this.timer = setTimeout(() => {
      this.phaseTimeRemaining -= 1;

      // Notify tick
      this.onTick?.(this.currentPhase, this.phaseTimeRemaining, this.currentRound);

      if (this.phaseTimeRemaining <= 0) {
        // Phase complete, advance to next
        this.advancePhase();
      } else {
        // Continue ticking
        this.tick();
      }
    }, 1000);
  }

  /**
   * Advance to next phase or round
   */
  private advancePhase(): void {
    if (this.currentPhase === 'inhale') {
      this.startPhase('hold');
    } else if (this.currentPhase === 'hold') {
      this.startPhase('exhale');
    } else if (this.currentPhase === 'exhale') {
      // Round complete
      const totalRounds = this.exercise.breathingRounds!.length;
      console.log(`✅ Round ${this.currentRound + 1}/${totalRounds} complete`);

      this.onRoundComplete?.(this.currentRound);

      // Check if there are more rounds
      if (this.currentRound < totalRounds - 1) {
        // Advance to next round
        this.currentRound += 1;
        this.startPhase('transition');
      } else {
        // All rounds complete - exercise done
        this.complete();
      }
    } else if (this.currentPhase === 'transition') {
      // Transition complete, start next round
      this.startPhase('inhale');
    }
  }

  /**
   * Complete the exercise
   */
  private complete(): void {
    const endTime = new Date();
    const duration = this.startTime
      ? Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000)
      : this.exercise.duration;

    console.log(`🎉 BreathingEngine: Exercise complete! Duration: ${duration}s`);

    this.cleanup();
    this.onComplete?.();
  }

  /**
   * Clean up timers
   */
  private cleanup(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Get current state (for UI)
   */
  public getState(): {
    phase: BreathingPhase;
    timeRemaining: number;
    currentRound: number;
    totalRounds: number;
    progress: number; // 0-1
  } {
    const totalRounds = this.exercise.breathingRounds!.length;
    const roundProgress = this.currentRound / totalRounds;
    const currentRoundData = this.exercise.breathingRounds![this.currentRound];

    // Calculate phase progress
    let phaseDuration = 0;
    switch (this.currentPhase) {
      case 'inhale':
        phaseDuration = currentRoundData.inhaleBeats;
        break;
      case 'hold':
        phaseDuration = currentRoundData.holdBeats;
        break;
      case 'exhale':
        phaseDuration = currentRoundData.exhaleBeats;
        break;
      case 'transition':
        phaseDuration = 1;
        break;
    }

    const phaseProgress = phaseDuration > 0
      ? 1 - (this.phaseTimeRemaining / phaseDuration)
      : 1;

    return {
      phase: this.currentPhase,
      timeRemaining: this.phaseTimeRemaining,
      currentRound: this.currentRound,
      totalRounds,
      progress: phaseProgress,
    };
  }
}
