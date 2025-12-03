/**
 * Voice Assistant Core
 *
 * Main orchestrator for the voice-controlled AI assistant.
 * Handles speech recognition, intent parsing, action execution, and TTS response.
 */

import { speechRecognition, SpeechRecognitionState } from './speechRecognition';
import { parseIntent, Intent, requiresAIResponse, describeIntent } from './intentParser';
import { appController, ActionResult, ProgressSummary, AppState } from './appController';
import { VoiceCoach, VoicePreferences } from './voiceCoaching';
import { claudeConversation, ConversationMessage } from '../../services/claudeAI';

// Voice Assistant state
export type VoiceAssistantState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

// Callbacks for UI updates
export interface VoiceAssistantCallbacks {
  onStateChange?: (state: VoiceAssistantState) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
}

class VoiceAssistantService {
  private state: VoiceAssistantState = 'idle';
  private callbacks: VoiceAssistantCallbacks = {};
  private conversationHistory: ConversationMessage[] = [];
  private voicePreferences: VoicePreferences = { enabled: true, speed: 0.9, pitch: 1.0 };
  private isInitialized = false;

  constructor() {
    // Don't initialize in constructor - let it be initialized lazily
    // when setCallbacks is called from React components
    console.log('[VoiceAssistant] Service created (initialization deferred)');
  }

  private initializeSpeechRecognition(): void {
    if (this.isInitialized) return;

    try {
      speechRecognition.setCallbacks({
        onResult: this.handleSpeechResult.bind(this),
        onPartialResult: this.handlePartialResult.bind(this),
        onError: this.handleSpeechError.bind(this),
        onStateChange: this.handleSpeechStateChange.bind(this),
      });

      this.isInitialized = true;
      console.log('[VoiceAssistant] Initialized');
    } catch (error) {
      console.warn('[VoiceAssistant] Failed to initialize:', error);
      // Don't throw - allow app to continue without voice assistant
    }
  }

  private handleSpeechResult(text: string): void {
    console.log('[VoiceAssistant] Speech result:', text);
    this.callbacks.onTranscript?.(text, true);

    if (text.trim()) {
      this.processUtterance(text);
    } else {
      // Empty result - likely silence timeout
      this.setState('idle');
    }
  }

  private handlePartialResult(text: string): void {
    this.callbacks.onTranscript?.(text, false);
  }

  private handleSpeechError(error: string): void {
    console.warn('[VoiceAssistant] Speech error:', error);
    this.callbacks.onError?.(error);
    this.setState('error');
  }

  private handleSpeechStateChange(speechState: SpeechRecognitionState): void {
    // Map speech recognition state to voice assistant state
    if (speechState === 'listening') {
      this.setState('listening');
    } else if (speechState === 'processing') {
      this.setState('processing');
    } else if (speechState === 'error') {
      this.setState('error');
    }
  }

  private setState(newState: VoiceAssistantState): void {
    if (this.state !== newState) {
      console.log('[VoiceAssistant] State:', this.state, '->', newState);
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
    }
  }

  /**
   * Process spoken text
   */
  private async processUtterance(text: string): Promise<void> {
    this.setState('processing');

    try {
      // Parse intent
      const intent = parseIntent(text);
      console.log('[VoiceAssistant] Intent:', describeIntent(intent));

      // Execute intent or query AI
      let response: string;

      if (requiresAIResponse(intent)) {
        // Complex query - use Claude
        response = await this.handleAIQuery(intent, text);
      } else {
        // Direct action
        response = await this.executeIntent(intent);
      }

      // Speak response
      if (response) {
        this.setState('speaking');
        this.callbacks.onResponse?.(response);
        await VoiceCoach.say(response, this.voicePreferences);
      }

      this.setState('idle');
    } catch (error: any) {
      console.error('[VoiceAssistant] Error processing:', error);
      const errorMessage = "Sorry, something went wrong. Please try again.";
      this.callbacks.onError?.(errorMessage);
      this.setState('error');
      await VoiceCoach.say(errorMessage, this.voicePreferences);
      this.setState('idle');
    }
  }

  /**
   * Execute a direct action intent
   */
  private async executeIntent(intent: Intent): Promise<string> {
    let result: ActionResult;

    switch (intent.type) {
      case 'start_workout':
        result = await appController.startWorkout(intent.workout);
        break;

      case 'start_exercise':
        result = await appController.startExercise(intent.exerciseId);
        break;

      case 'start_breathing':
        result = await appController.startBreathing();
        break;

      case 'stop':
        result = await appController.stopWorkout();
        break;

      case 'skip_breathing':
        result = await appController.skipBreathing();
        break;

      case 'replay_note':
        result = await appController.replayCurrentNote();
        break;

      case 'navigate':
        result = await appController.navigateTo(intent.screen);
        break;

      case 'go_back':
        result = await appController.goBack();
        break;

      case 'adjust_volume':
        result = await appController.adjustVolume(intent.target, intent.direction);
        break;

      case 'toggle_voice_coach':
        result = await appController.toggleVoiceCoach(intent.enabled);
        break;

      case 'help':
      case 'what_can_you_do':
        return appController.getHelpText();

      default:
        return "I'm not sure how to help with that. Say 'help' to see what I can do.";
    }

    return result.message;
  }

  /**
   * Handle queries that require AI response
   */
  private async handleAIQuery(intent: Intent, originalText: string): Promise<string> {
    const appState = await appController.getCurrentState();
    const progress = await appController.getProgressSummary();

    // Build the query based on intent type
    let query: string;

    switch (intent.type) {
      case 'query_progress':
        query = `How am I doing with my vocal practice? Here's my progress: ${JSON.stringify(progress)}`;
        break;

      case 'query_recommendation':
        query = `What exercise should I practice next? Here's my progress: ${JSON.stringify(progress)}`;
        break;

      case 'query_range':
        query = `What is my vocal range and how is it? My range is ${progress.vocalRange.low} to ${progress.vocalRange.high}`;
        break;

      case 'query_streak':
        query = `Tell me about my practice streak. Current: ${progress.streak} days, Longest: ${progress.longestStreak} days`;
        break;

      case 'general_question':
        query = intent.question;
        break;

      case 'unknown':
        query = intent.text;
        break;

      default:
        query = originalText;
    }

    try {
      // Check if claude conversation is available
      if (typeof claudeConversation !== 'function') {
        // Fallback responses when Claude is not available
        return this.getFallbackResponse(intent, progress);
      }

      const response = await claudeConversation({
        query,
        appState,
        userProgress: progress,
        conversationHistory: this.conversationHistory,
      });

      // Update conversation history
      this.conversationHistory.push({ role: 'user', content: query });
      this.conversationHistory.push({ role: 'assistant', content: response });

      // Keep history limited
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return response;
    } catch (error) {
      console.warn('[VoiceAssistant] Claude not available, using fallback');
      return this.getFallbackResponse(intent, progress);
    }
  }

  /**
   * Get fallback response when AI is not available
   */
  private getFallbackResponse(intent: Intent, progress: ProgressSummary): string {
    switch (intent.type) {
      case 'query_progress':
        return `You've completed ${progress.totalSessions} sessions with ${progress.averageAccuracy}% average accuracy. Your streak is ${progress.streak} days.`;

      case 'query_recommendation':
        return "Try the Warm-up Scale to get started, or the Siren exercise to work on smooth transitions.";

      case 'query_range':
        return `Your vocal range is ${progress.vocalRange.low} to ${progress.vocalRange.high}.`;

      case 'query_streak':
        return `Your current streak is ${progress.streak} days. Your longest streak is ${progress.longestStreak} days.`;

      default:
        return "I'm not sure how to answer that. Try asking about your progress, streak, or range.";
    }
  }

  // ===== PUBLIC API =====

  /**
   * Set callbacks for UI updates
   */
  setCallbacks(callbacks: VoiceAssistantCallbacks): void {
    this.callbacks = callbacks;
    // DON'T initialize speech recognition here - defer until user activates voice assistant
    // This prevents crash from native module initialization at app startup
    // Speech recognition will be initialized on-demand when activate() is called
  }

  /**
   * Set voice preferences
   */
  setVoicePreferences(prefs: VoicePreferences): void {
    this.voicePreferences = prefs;
  }

  /**
   * Activate voice assistant (start listening)
   */
  async activate(): Promise<boolean> {
    if (this.state === 'listening') {
      console.log('[VoiceAssistant] Already listening');
      return true;
    }

    console.log('[VoiceAssistant] Activating...');

    // Initialize speech recognition on-demand (deferred from startup to prevent crashes)
    this.initializeSpeechRecognition();

    // Clear any previous state
    this.conversationHistory = [];

    const success = await speechRecognition.startListening();

    if (success) {
      this.setState('listening');
      return true;
    } else {
      this.setState('error');
      return false;
    }
  }

  /**
   * Deactivate voice assistant (stop listening)
   */
  async deactivate(): Promise<void> {
    console.log('[VoiceAssistant] Deactivating...');
    await speechRecognition.cancel();
    await VoiceCoach.stop();
    this.setState('idle');
  }

  /**
   * Get current state
   */
  getState(): VoiceAssistantState {
    return this.state;
  }

  /**
   * Check if currently active
   */
  isActive(): boolean {
    return this.state !== 'idle' && this.state !== 'error';
  }

  /**
   * Process text directly (for testing or alternative input)
   */
  async processText(text: string): Promise<void> {
    await this.processUtterance(text);
  }

  /**
   * Check if voice recognition is available
   */
  async isAvailable(): Promise<boolean> {
    return await speechRecognition.isAvailable();
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await speechRecognition.destroy();
    this.setState('idle');
  }
}

// Export singleton instance
export const voiceAssistant = new VoiceAssistantService();

// Export class for testing
export { VoiceAssistantService };
