/**
 * Conversation State Manager
 *
 * Manages multi-turn conversation context for the voice assistant.
 * Tracks conversation history, offered options, and contextual references.
 */

import { AppState, ProgressSummary } from './appController';
import { Intent } from './intentParser';

// Represents a single turn in the conversation
export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: Intent;
  action?: string;
}

// Options offered by the assistant for user selection
export interface OfferedOption {
  index: number;
  label: string;
  actionType: string;
  actionParams?: any;
}

// Suggested action from AI response
export interface SuggestedAction {
  type: string;
  params?: any;
}

// Full conversation context
export interface ConversationContext {
  // Session identifiers
  sessionId: string;
  startTime: number;
  lastActivityTime: number;

  // Conversation history
  turns: ConversationTurn[];

  // Contextual tracking for references
  lastOfferedOptions: OfferedOption[];
  lastSuggestedAction: SuggestedAction | null;
  lastMentionedExercise: string | null;
  lastMentionedWorkout: string | null;

  // Response state
  expectingResponse: boolean;

  // App context snapshot
  appState: AppState;
  userProgress: ProgressSummary;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Conversation State Manager
 * Singleton service for managing multi-turn conversation state
 */
class ConversationStateManager {
  private context: ConversationContext | null = null;
  private readonly CONTEXT_TIMEOUT_MS = 30000; // 30 seconds context retention

  /**
   * Start a new conversation session
   */
  startConversation(appState: AppState, userProgress: ProgressSummary): string {
    const sessionId = generateId();

    this.context = {
      sessionId,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      turns: [],
      lastOfferedOptions: [],
      lastSuggestedAction: null,
      lastMentionedExercise: null,
      lastMentionedWorkout: null,
      expectingResponse: false,
      appState,
      userProgress,
    };

    console.log('[ConversationState] Started new conversation:', sessionId);
    return sessionId;
  }

  /**
   * Add a user turn to the conversation
   */
  addUserTurn(text: string, intent?: Intent): ConversationTurn {
    if (!this.context) {
      throw new Error('No active conversation');
    }

    const turn: ConversationTurn = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      intent,
    };

    this.context.turns.push(turn);
    this.context.lastActivityTime = Date.now();

    console.log('[ConversationState] Added user turn:', text.substring(0, 50));
    return turn;
  }

  /**
   * Add an assistant turn to the conversation
   */
  addAssistantTurn(
    text: string,
    options?: OfferedOption[],
    suggestedAction?: SuggestedAction | null,
    executedAction?: string
  ): ConversationTurn {
    if (!this.context) {
      throw new Error('No active conversation');
    }

    const turn: ConversationTurn = {
      id: generateId(),
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      action: executedAction,
    };

    this.context.turns.push(turn);
    this.context.lastActivityTime = Date.now();

    // Track offered options
    if (options && options.length > 0) {
      this.context.lastOfferedOptions = options;
      this.context.expectingResponse = true;
    }

    // Track suggested action
    if (suggestedAction) {
      this.context.lastSuggestedAction = suggestedAction;
      this.context.expectingResponse = true;
    }

    console.log('[ConversationState] Added assistant turn:', text.substring(0, 50));
    return turn;
  }

  /**
   * Get the current conversation context
   */
  getContext(): ConversationContext | null {
    return this.context;
  }

  /**
   * Get conversation turns for display
   */
  getTurns(): ConversationTurn[] {
    return this.context?.turns || [];
  }

  /**
   * Set whether we're expecting a user response
   */
  setExpectingResponse(expecting: boolean): void {
    if (this.context) {
      this.context.expectingResponse = expecting;
    }
  }

  /**
   * Update the last offered options
   */
  setLastOfferedOptions(options: OfferedOption[]): void {
    if (this.context) {
      this.context.lastOfferedOptions = options;
    }
  }

  /**
   * Update the last suggested action
   */
  setLastSuggestedAction(action: SuggestedAction | null): void {
    if (this.context) {
      this.context.lastSuggestedAction = action;
    }
  }

  /**
   * Track mentioned exercise for contextual references
   */
  setLastMentionedExercise(exerciseId: string): void {
    if (this.context) {
      this.context.lastMentionedExercise = exerciseId;
    }
  }

  /**
   * Track mentioned workout for contextual references
   */
  setLastMentionedWorkout(workoutId: string): void {
    if (this.context) {
      this.context.lastMentionedWorkout = workoutId;
    }
  }

  /**
   * Clear expecting response state after processing
   */
  clearExpectingResponse(): void {
    if (this.context) {
      this.context.expectingResponse = false;
      this.context.lastOfferedOptions = [];
      this.context.lastSuggestedAction = null;
    }
  }

  /**
   * Check if context is still valid (not expired)
   */
  isContextValid(): boolean {
    if (!this.context) return false;

    const elapsed = Date.now() - this.context.lastActivityTime;
    return elapsed < this.CONTEXT_TIMEOUT_MS;
  }

  /**
   * Update app state snapshot
   */
  updateAppState(appState: AppState): void {
    if (this.context) {
      this.context.appState = appState;
    }
  }

  /**
   * Update user progress snapshot
   */
  updateUserProgress(progress: ProgressSummary): void {
    if (this.context) {
      this.context.userProgress = progress;
    }
  }

  /**
   * End the current conversation
   */
  endConversation(): void {
    if (this.context) {
      console.log(
        '[ConversationState] Ended conversation:',
        this.context.sessionId,
        'turns:',
        this.context.turns.length
      );
    }
    this.context = null;
  }

  /**
   * Check if a conversation is active
   */
  isActive(): boolean {
    return this.context !== null && this.isContextValid();
  }

  /**
   * Get a summary of the conversation for Claude context
   */
  getContextSummaryForClaude(): string {
    if (!this.context) return '';

    const summary: string[] = [];

    // App state
    summary.push(`Current screen: ${this.context.appState.currentScreen}`);
    if (this.context.appState.isExerciseActive) {
      summary.push(`Active exercise: ${this.context.appState.currentExercise || 'unknown'}`);
    }
    if (this.context.appState.isBreathing) {
      summary.push('Currently in breathing exercise');
    }

    // User progress
    const p = this.context.userProgress;
    summary.push(`Practice streak: ${p.streak} days (longest: ${p.longestStreak})`);
    summary.push(`Total sessions: ${p.totalSessions}`);
    summary.push(`Average accuracy: ${p.averageAccuracy}%`);
    summary.push(`Vocal range: ${p.vocalRange.low} to ${p.vocalRange.high}`);

    // Recent sessions
    if (p.recentSessions.length > 0) {
      summary.push('Recent practice:');
      p.recentSessions.slice(0, 3).forEach((s) => {
        summary.push(`  - ${s.exercise}: ${s.accuracy}% accuracy`);
      });
    }

    // Conversation context
    if (this.context.turns.length > 0) {
      summary.push(`Conversation has ${this.context.turns.length} turns`);
    }
    if (this.context.expectingResponse) {
      summary.push('Waiting for user response to question/options');
    }
    if (this.context.lastOfferedOptions.length > 0) {
      summary.push(
        `Last offered options: ${this.context.lastOfferedOptions.map((o) => o.label).join(', ')}`
      );
    }

    return summary.join('\n');
  }

  /**
   * Get conversation history formatted for Claude
   */
  getConversationHistoryForClaude(): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (!this.context) return [];

    return this.context.turns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    }));
  }
}

// Export singleton instance
export const conversationState = new ConversationStateManager();

// Export class for testing
export { ConversationStateManager };
