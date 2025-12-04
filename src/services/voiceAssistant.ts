/**
 * Voice Assistant Core
 *
 * Main orchestrator for the voice-controlled AI assistant.
 * Handles speech recognition, intent parsing, action execution, and TTS response.
 * Supports multi-turn conversations with context awareness.
 */

import { speechRecognition, SpeechRecognitionState } from './speechRecognition';
import {
  parseIntent,
  parseIntentWithContext,
  Intent,
  requiresAIResponse,
  describeIntent,
  isContextualResponse,
  isQuickCommand,
} from './intentParser';
import { appController, ActionResult, ProgressSummary, AppState } from './appController';
import { VoiceCoach, VoicePreferences } from './voiceCoaching';
import { claudeConversation, ConversationMessage } from '../../services/claudeAI';
import {
  conversationState,
  ConversationContext,
  OfferedOption,
  SuggestedAction,
  ConversationTurn,
} from './conversationState';

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
  onConversationUpdate?: (turns: ConversationTurn[]) => void;
}

// Timing constants
const SILENCE_TIMEOUT_MS = 7000; // 7 seconds before "Anything else?" prompt
const FINAL_CLOSE_DELAY_MS = 3000; // 3 seconds after prompt before auto-close
const TTS_TO_LISTEN_DELAY_MS = 300; // Delay before resuming listening after TTS

class VoiceAssistantService {
  private state: VoiceAssistantState = 'idle';
  private callbacks: VoiceAssistantCallbacks = {};
  private conversationHistory: ConversationMessage[] = [];
  private voicePreferences: VoicePreferences = { enabled: true, speed: 0.95, pitch: 1.05 };
  private isInitialized = false;

  // Multi-turn conversation tracking
  private silenceTimeoutId: NodeJS.Timeout | null = null;
  private finalCloseTimeoutId: NodeJS.Timeout | null = null;
  private isConversationMode = false;
  private hasAskedAnythingElse = false;

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

    // Clear any pending silence timeout
    this.clearSilenceTimeout();

    if (text.trim()) {
      // Reset "anything else" flag on new input
      this.hasAskedAnythingElse = false;
      this.processUtterance(text);
    } else {
      // Empty result - likely silence timeout
      if (this.isConversationMode && !this.hasAskedAnythingElse) {
        // In conversation mode, ask if they need anything else
        this.handleSilenceTimeout();
      } else {
        this.endConversation();
      }
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
   * Process spoken text with context awareness
   */
  private async processUtterance(text: string): Promise<void> {
    this.setState('processing');

    try {
      const context = conversationState.getContext();

      // Parse intent with context awareness
      const intent = parseIntentWithContext(text, context);
      console.log('[VoiceAssistant] Intent:', describeIntent(intent));

      // Add user turn to conversation
      if (context) {
        conversationState.addUserTurn(text, intent);
        this.notifyConversationUpdate();
      }

      // Handle contextual responses (yes/no/option selection)
      if (isContextualResponse(intent) && context) {
        await this.handleContextualResponse(intent, context, text);
        return;
      }

      // Check if this is a quick command vs conversational query
      const shouldContinueListening = !isQuickCommand(intent);

      // Execute intent or query AI
      let response: string;
      let offeredOptions: OfferedOption[] = [];
      let suggestedAction: SuggestedAction | null = null;

      if (requiresAIResponse(intent)) {
        // Complex query - use Claude (enters conversation mode)
        this.isConversationMode = true;
        const aiResult = await this.handleAIQuery(intent, text);
        response = aiResult.response;
        offeredOptions = aiResult.offeredOptions;
        suggestedAction = aiResult.suggestedAction;
      } else {
        // Direct action
        response = await this.executeIntent(intent);
      }

      // Speak response and update conversation
      if (response) {
        await this.speakAndContinue(response, shouldContinueListening, offeredOptions, suggestedAction);
      } else {
        // Quick command executed - close
        this.endConversation();
      }
    } catch (error: any) {
      console.error('[VoiceAssistant] Error processing:', error);
      const errorMessage = "Sorry, something went wrong. Please try again.";
      this.callbacks.onError?.(errorMessage);
      this.setState('error');
      await VoiceCoach.say(errorMessage, this.voicePreferences);
      this.endConversation();
    }
  }

  /**
   * Handle contextual responses (yes/no/option selection)
   */
  private async handleContextualResponse(
    intent: Intent,
    context: ConversationContext,
    text: string
  ): Promise<void> {
    let response: string;
    let shouldClose = false;

    if (intent.type === 'negative') {
      // User said no/cancel - end conversation
      response = "Okay, no problem!";
      shouldClose = true;
    } else if (intent.type === 'affirmative') {
      // User confirmed - execute last suggested action
      if (context.lastSuggestedAction) {
        response = await this.executeSuggestedAction(context.lastSuggestedAction);
        shouldClose = true;
      } else if (context.lastOfferedOptions.length === 1) {
        // If only one option was offered, execute it
        response = await this.executeOption(context.lastOfferedOptions[0]);
        shouldClose = true;
      } else {
        response = "What would you like me to do?";
      }
    } else if (intent.type === 'select_option') {
      // User selected a numbered option
      const optionIndex = intent.index;
      if (optionIndex >= 0 && optionIndex < context.lastOfferedOptions.length) {
        const selectedOption = context.lastOfferedOptions[optionIndex];
        response = await this.executeOption(selectedOption);
        shouldClose = true;
      } else {
        response = "I don't have that option. Please choose from the ones I mentioned.";
      }
    } else {
      response = "I'm not sure what you mean.";
    }

    // Clear the expecting response state
    conversationState.clearExpectingResponse();

    // Speak and optionally continue
    if (shouldClose) {
      await this.speakAndClose(response);
    } else {
      await this.speakAndContinue(response, true);
    }
  }

  /**
   * Execute a suggested action
   */
  private async executeSuggestedAction(action: SuggestedAction): Promise<string> {
    console.log('[VoiceAssistant] Executing suggested action:', action);

    // Map action types to actual app actions
    switch (action.type) {
      case 'start_workout':
        const workoutResult = await appController.startWorkout(action.params?.workout || 'quick_warmup');
        return workoutResult.message;

      case 'start_exercise':
        const exerciseResult = await appController.startExercise(action.params?.exerciseId);
        return exerciseResult.message;

      case 'start_breathing':
        const breathingResult = await appController.startBreathing();
        return breathingResult.message;

      case 'navigate':
        const navResult = await appController.navigateTo(action.params?.screen);
        return navResult.message;

      default:
        return "Okay, let's do it!";
    }
  }

  /**
   * Execute a selected option
   */
  private async executeOption(option: OfferedOption): Promise<string> {
    console.log('[VoiceAssistant] Executing option:', option);

    // Execute based on action type
    switch (option.actionType) {
      case 'start_workout':
        const workoutResult = await appController.startWorkout(option.actionParams?.workout || 'quick_warmup');
        return workoutResult.message;

      case 'start_exercise':
        const exerciseResult = await appController.startExercise(option.actionParams?.exerciseId);
        return exerciseResult.message;

      case 'start_breathing':
        const breathingResult = await appController.startBreathing();
        return breathingResult.message;

      case 'navigate':
        const navResult = await appController.navigateTo(option.actionParams?.screen);
        return navResult.message;

      default:
        return `Okay, ${option.label}!`;
    }
  }

  /**
   * Speak response and continue listening
   */
  private async speakAndContinue(
    text: string,
    continueListening: boolean,
    offeredOptions: OfferedOption[] = [],
    suggestedAction: SuggestedAction | null = null
  ): Promise<void> {
    this.setState('speaking');
    this.callbacks.onResponse?.(text);

    // Add assistant turn to conversation
    const context = conversationState.getContext();
    if (context) {
      conversationState.addAssistantTurn(text, offeredOptions, suggestedAction);
      this.notifyConversationUpdate();
    }

    await VoiceCoach.say(text, this.voicePreferences);

    if (continueListening && this.isConversationMode) {
      // Continue listening after a short delay
      await new Promise(resolve => setTimeout(resolve, TTS_TO_LISTEN_DELAY_MS));
      await this.resumeListening();
    } else {
      this.endConversation();
    }
  }

  /**
   * Speak response and close
   */
  private async speakAndClose(text: string): Promise<void> {
    this.setState('speaking');
    this.callbacks.onResponse?.(text);

    // Add assistant turn to conversation
    const context = conversationState.getContext();
    if (context) {
      conversationState.addAssistantTurn(text, [], null, 'action_executed');
      this.notifyConversationUpdate();
    }

    await VoiceCoach.say(text, this.voicePreferences);
    this.endConversation();
  }

  /**
   * Resume listening after TTS
   */
  private async resumeListening(): Promise<void> {
    console.log('[VoiceAssistant] Resuming listening...');
    this.setState('listening');

    const success = await speechRecognition.startListening();
    if (success) {
      // Start silence timeout
      this.startSilenceTimeout();
    } else {
      console.warn('[VoiceAssistant] Failed to resume listening');
      this.endConversation();
    }
  }

  /**
   * Start silence timeout
   */
  private startSilenceTimeout(): void {
    this.clearSilenceTimeout();
    this.silenceTimeoutId = setTimeout(() => {
      this.handleSilenceTimeout();
    }, SILENCE_TIMEOUT_MS);
  }

  /**
   * Clear silence timeout
   */
  private clearSilenceTimeout(): void {
    if (this.silenceTimeoutId) {
      clearTimeout(this.silenceTimeoutId);
      this.silenceTimeoutId = null;
    }
    if (this.finalCloseTimeoutId) {
      clearTimeout(this.finalCloseTimeoutId);
      this.finalCloseTimeoutId = null;
    }
  }

  /**
   * Handle silence timeout - ask "Anything else?" then close
   */
  private async handleSilenceTimeout(): Promise<void> {
    if (this.hasAskedAnythingElse) {
      // Already asked, just close
      this.endConversation();
      return;
    }

    this.hasAskedAnythingElse = true;
    const prompt = "Anything else I can help with?";

    this.setState('speaking');
    this.callbacks.onResponse?.(prompt);

    // Add to conversation
    const context = conversationState.getContext();
    if (context) {
      conversationState.addAssistantTurn(prompt);
      this.notifyConversationUpdate();
    }

    await VoiceCoach.say(prompt, this.voicePreferences);

    // Resume listening for response
    await new Promise(resolve => setTimeout(resolve, TTS_TO_LISTEN_DELAY_MS));
    const success = await speechRecognition.startListening();

    if (success) {
      this.setState('listening');
      // Set a final timeout to close if no response
      this.finalCloseTimeoutId = setTimeout(() => {
        this.endConversation();
      }, FINAL_CLOSE_DELAY_MS);
    } else {
      this.endConversation();
    }
  }

  /**
   * End the conversation and reset state
   */
  private endConversation(): void {
    console.log('[VoiceAssistant] Ending conversation');
    this.clearSilenceTimeout();
    this.isConversationMode = false;
    this.hasAskedAnythingElse = false;
    conversationState.endConversation();
    speechRecognition.cancel();
    this.setState('idle');
  }

  /**
   * Notify UI of conversation update
   */
  private notifyConversationUpdate(): void {
    const turns = conversationState.getTurns();
    this.callbacks.onConversationUpdate?.(turns);
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
   * AI Query Result with structured options
   */
  private createAIResult(
    response: string,
    offeredOptions: OfferedOption[] = [],
    suggestedAction: SuggestedAction | null = null
  ): { response: string; offeredOptions: OfferedOption[]; suggestedAction: SuggestedAction | null } {
    return { response, offeredOptions, suggestedAction };
  }

  /**
   * Handle queries that require AI response
   */
  private async handleAIQuery(
    intent: Intent,
    originalText: string
  ): Promise<{ response: string; offeredOptions: OfferedOption[]; suggestedAction: SuggestedAction | null }> {
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
        const fallback = this.getFallbackResponse(intent, progress);
        return this.createAIResult(fallback.response, fallback.offeredOptions, fallback.suggestedAction);
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

      // Parse response for structured data (options, suggested actions)
      const parsed = this.parseAIResponse(response, intent);
      return parsed;
    } catch (error) {
      console.warn('[VoiceAssistant] Claude not available, using fallback');
      const fallback = this.getFallbackResponse(intent, progress);
      return this.createAIResult(fallback.response, fallback.offeredOptions, fallback.suggestedAction);
    }
  }

  /**
   * Parse AI response to extract structured options
   */
  private parseAIResponse(
    response: string,
    intent: Intent
  ): { response: string; offeredOptions: OfferedOption[]; suggestedAction: SuggestedAction | null } {
    const offeredOptions: OfferedOption[] = [];
    let suggestedAction: SuggestedAction | null = null;

    // Check for numbered options in response (e.g., "1) Quick warmup 2) Full workout")
    const optionRegex = /(?:^|\n)\s*(\d+)[).]\s*([^.\n]+)/g;
    let match;
    while ((match = optionRegex.exec(response)) !== null) {
      const label = match[2].trim();
      const actionType = this.inferActionType(label);
      offeredOptions.push({
        index: parseInt(match[1]) - 1,
        label,
        actionType,
        actionParams: this.inferActionParams(label, actionType),
      });
    }

    // If asking for recommendation, suggest starting workout
    if (intent.type === 'query_recommendation' && offeredOptions.length === 0) {
      suggestedAction = {
        type: 'start_workout',
        params: { workout: 'quick_warmup' },
      };
    }

    // Update conversation state if we have options
    if (offeredOptions.length > 0) {
      conversationState.setLastOfferedOptions(offeredOptions);
      conversationState.setExpectingResponse(true);
    }

    if (suggestedAction) {
      conversationState.setLastSuggestedAction(suggestedAction);
      conversationState.setExpectingResponse(true);
    }

    return { response, offeredOptions, suggestedAction };
  }

  /**
   * Infer action type from option label
   */
  private inferActionType(label: string): string {
    const lowerLabel = label.toLowerCase();

    if (lowerLabel.includes('warmup') || lowerLabel.includes('warm up') || lowerLabel.includes('workout')) {
      return 'start_workout';
    }
    if (lowerLabel.includes('breathing') || lowerLabel.includes('breath')) {
      return 'start_breathing';
    }
    if (lowerLabel.includes('scale') || lowerLabel.includes('arpeggio') || lowerLabel.includes('siren') || lowerLabel.includes('exercise')) {
      return 'start_exercise';
    }
    if (lowerLabel.includes('progress') || lowerLabel.includes('stats')) {
      return 'navigate';
    }

    return 'unknown';
  }

  /**
   * Infer action params from label and type
   */
  private inferActionParams(label: string, actionType: string): any {
    const lowerLabel = label.toLowerCase();

    if (actionType === 'start_workout') {
      if (lowerLabel.includes('quick')) return { workout: 'quick_warmup' };
      if (lowerLabel.includes('full')) return { workout: 'full' };
      if (lowerLabel.includes('morning')) return { workout: 'morning' };
      return { workout: 'quick_warmup' };
    }

    if (actionType === 'start_exercise') {
      if (lowerLabel.includes('scale')) return { exerciseId: 'warmup-scale' };
      if (lowerLabel.includes('arpeggio')) return { exerciseId: 'major-arpeggio' };
      if (lowerLabel.includes('siren')) return { exerciseId: 'siren' };
      if (lowerLabel.includes('octave')) return { exerciseId: 'octave-jump' };
      return { exerciseId: 'warmup-scale' };
    }

    if (actionType === 'navigate') {
      if (lowerLabel.includes('progress')) return { screen: 'progress' };
      if (lowerLabel.includes('settings')) return { screen: 'settings' };
      return { screen: 'home' };
    }

    return {};
  }

  /**
   * Get fallback response when AI is not available
   */
  private getFallbackResponse(
    intent: Intent,
    progress: ProgressSummary
  ): { response: string; offeredOptions: OfferedOption[]; suggestedAction: SuggestedAction | null } {
    let response: string;
    let offeredOptions: OfferedOption[] = [];
    let suggestedAction: SuggestedAction | null = null;

    switch (intent.type) {
      case 'query_progress':
        response = `You've completed ${progress.totalSessions} sessions with ${progress.averageAccuracy}% average accuracy. Your streak is ${progress.streak} days.`;
        break;

      case 'query_recommendation':
        response = "I'd recommend: 1) Quick warmup to start light, 2) Breathing exercises for support, or 3) Scales for pitch accuracy. Which sounds good?";
        offeredOptions = [
          { index: 0, label: 'Quick warmup', actionType: 'start_workout', actionParams: { workout: 'quick_warmup' } },
          { index: 1, label: 'Breathing exercises', actionType: 'start_breathing' },
          { index: 2, label: 'Scales', actionType: 'start_exercise', actionParams: { exerciseId: 'warmup-scale' } },
        ];
        conversationState.setLastOfferedOptions(offeredOptions);
        conversationState.setExpectingResponse(true);
        break;

      case 'query_range':
        response = `Your vocal range is ${progress.vocalRange.low} to ${progress.vocalRange.high}.`;
        break;

      case 'query_streak':
        response = `Your current streak is ${progress.streak} days. Your longest streak is ${progress.longestStreak} days. Keep it up!`;
        break;

      default:
        response = "I can help you start a workout, check your progress, or recommend exercises. What would you like to do?";
        offeredOptions = [
          { index: 0, label: 'Start a workout', actionType: 'start_workout', actionParams: { workout: 'quick_warmup' } },
          { index: 1, label: 'Check progress', actionType: 'navigate', actionParams: { screen: 'progress' } },
        ];
        conversationState.setLastOfferedOptions(offeredOptions);
        conversationState.setExpectingResponse(true);
    }

    return { response, offeredOptions, suggestedAction };
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
  async activate(preserveContext = false): Promise<boolean> {
    if (this.state === 'listening') {
      console.log('[VoiceAssistant] Already listening');
      return true;
    }

    console.log('[VoiceAssistant] Activating...');

    try {
      // Initialize speech recognition on-demand (deferred from startup to prevent crashes)
      this.initializeSpeechRecognition();

      // Clear timeouts
      this.clearSilenceTimeout();

      // Start new conversation context
      if (!preserveContext) {
        this.conversationHistory = [];
        this.isConversationMode = false;
        this.hasAskedAnythingElse = false;

        // Get current app state and start conversation
        const appState = await appController.getCurrentState();
        const progress = await appController.getProgressSummary();
        conversationState.startConversation(appState, progress);
      }

      const success = await speechRecognition.startListening();

      if (success) {
        this.setState('listening');
        return true;
      } else {
        this.setState('error');
        return false;
      }
    } catch (error: any) {
      console.error('[VoiceAssistant] Activation failed:', error);
      this.setState('error');
      return false;
    }
  }

  /**
   * Deactivate voice assistant (stop listening)
   */
  async deactivate(): Promise<void> {
    console.log('[VoiceAssistant] Deactivating...');
    this.clearSilenceTimeout();
    await speechRecognition.cancel();
    await VoiceCoach.stop();
    this.endConversation();
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
    this.clearSilenceTimeout();
    await speechRecognition.destroy();
    conversationState.endConversation();
    this.setState('idle');
  }

  /**
   * Get conversation turns for UI display
   */
  getConversationTurns(): ConversationTurn[] {
    return conversationState.getTurns();
  }

  /**
   * Check if in conversation mode
   */
  isInConversationMode(): boolean {
    return this.isConversationMode;
  }

  /**
   * Get current conversation context
   */
  getConversationContext(): ConversationContext | null {
    return conversationState.getContext();
  }
}

// Export singleton instance
export const voiceAssistant = new VoiceAssistantService();

// Export class for testing
export { VoiceAssistantService };

// Re-export conversation types for UI
export type { ConversationTurn, ConversationContext } from './conversationState';
