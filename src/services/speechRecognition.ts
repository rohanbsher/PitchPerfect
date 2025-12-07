/**
 * Speech Recognition Service
 *
 * Wrapper for @react-native-voice/voice to capture user speech
 * and convert it to text for the voice assistant.
 *
 * IMPORTANT: Uses dynamic require() to avoid loading native module at import time.
 * This prevents crashes on New Architecture where native modules may not be ready.
 */

// Types only - these don't trigger native module loading
type SpeechResultsEvent = { value?: string[] };
type SpeechErrorEvent = { error?: { message?: string } };
type SpeechStartEvent = {};
type SpeechEndEvent = {};

// Lazy-loaded Voice module with thread-safe initialization
let _Voice: any = null;
let _isInitializing = false;
let _initPromise: Promise<any> | null = null;

/**
 * Get the Voice module synchronously (returns null if not yet initialized)
 */
function getVoice(): any {
  return _Voice;
}

/**
 * Initialize the Voice module with thread-safe locking.
 * Prevents race conditions on New Architecture where multiple calls
 * could trigger simultaneous native module loading.
 */
async function initializeVoiceModule(): Promise<any> {
  // Fast path - already initialized
  if (_Voice) {
    return _Voice;
  }

  // Another call is already initializing - wait for it
  if (_isInitializing && _initPromise) {
    return _initPromise;
  }

  // Start initialization with lock
  _isInitializing = true;
  _initPromise = new Promise((resolve) => {
    // Use setTimeout to avoid blocking JS thread during require()
    setTimeout(() => {
      try {
        _Voice = require('@react-native-voice/voice').default;
        console.log('[SpeechRecognition] Voice module loaded successfully');
        resolve(_Voice);
      } catch (error) {
        console.warn('[SpeechRecognition] Failed to load Voice module:', error);
        resolve(null);
      } finally {
        _isInitializing = false;
      }
    }, 0);
  });

  return _initPromise;
}

export type SpeechRecognitionState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'error';

export interface SpeechRecognitionCallbacks {
  onResult?: (text: string) => void;
  onPartialResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: SpeechRecognitionState) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

class SpeechRecognitionService {
  private state: SpeechRecognitionState = 'idle';
  private callbacks: SpeechRecognitionCallbacks = {};
  private isInitialized = false;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private readonly SILENCE_TIMEOUT_MS = 10000; // Auto-stop after 10s silence

  constructor() {
    // Don't initialize listeners in constructor - defer to first use
    // This prevents crashes from native module not being ready
    console.log('[SpeechRecognition] Service created (listeners deferred)');
  }

  private async initializeListeners(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Thread-safe initialization - wait for module to load
      const Voice = await initializeVoiceModule();
      if (!Voice) {
        console.warn('[SpeechRecognition] Voice module not available');
        return;
      }

      Voice.onSpeechStart = this.handleSpeechStart;
      Voice.onSpeechEnd = this.handleSpeechEnd;
      Voice.onSpeechResults = this.handleSpeechResults;
      Voice.onSpeechPartialResults = this.handlePartialResults;
      Voice.onSpeechError = this.handleSpeechError;

      this.isInitialized = true;
      console.log('[SpeechRecognition] Listeners initialized');
    } catch (error) {
      console.warn('[SpeechRecognition] Failed to initialize listeners:', error);
      // Don't throw - allow app to continue without speech recognition
    }
  }

  private handleSpeechStart = (_event: SpeechStartEvent): void => {
    console.log('[SpeechRecognition] Speech started');
    this.clearSilenceTimeout();
    this.callbacks.onSpeechStart?.();
  };

  private handleSpeechEnd = (_event: SpeechEndEvent): void => {
    console.log('[SpeechRecognition] Speech ended');
    this.setState('processing');
    this.callbacks.onSpeechEnd?.();
  };

  private handleSpeechResults = (event: SpeechResultsEvent): void => {
    const results = event.value;
    if (results && results.length > 0) {
      const text = results[0]; // Best result
      console.log('[SpeechRecognition] Final result:', text);
      this.callbacks.onResult?.(text);
    } else {
      // No results - treat as silence/no speech
      console.log('[SpeechRecognition] No results (silence)');
      this.callbacks.onResult?.('');
    }
    this.setState('idle');
  };

  private handlePartialResults = (event: SpeechResultsEvent): void => {
    const results = event.value;
    if (results && results.length > 0) {
      const text = results[0];
      console.log('[SpeechRecognition] Partial:', text);
      this.callbacks.onPartialResult?.(text);

      // Reset silence timeout on any speech detected
      this.resetSilenceTimeout();
    }
  };

  private handleSpeechError = (event: SpeechErrorEvent): void => {
    const errorMessage = event.error?.message || 'Unknown speech recognition error';
    console.warn('[SpeechRecognition] Error:', errorMessage);

    // Handle specific errors gracefully
    if (errorMessage.includes('No speech detected') ||
        errorMessage.includes('7/') ||
        errorMessage.includes('timeout')) {
      // Silence or timeout - not a real error
      this.callbacks.onResult?.(''); // Return empty to let assistant know
      this.setState('idle');
      return;
    }

    // Check for audio session errors - attempt recovery
    if (errorMessage.toLowerCase().includes('audio') ||
        errorMessage.toLowerCase().includes('session') ||
        errorMessage.includes('AVAudioSession') ||
        errorMessage.includes('interrupted')) {
      console.log('[SpeechRecognition] Audio session error detected, attempting recovery');
      this.handleAudioSessionError();
      return;
    }

    this.callbacks.onError?.(errorMessage);
    this.setState('error');
  };

  /**
   * Handle audio session error by destroying and reinitializing the voice module
   */
  private async handleAudioSessionError(): Promise<void> {
    console.log('[SpeechRecognition] Attempting recovery from audio session error');

    try {
      // Destroy and clear the voice module
      const Voice = getVoice();
      if (Voice) {
        try {
          await Voice.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }

      // Clear the cached module to force reinitialization
      _Voice = null;
      this.isInitialized = false;

      // Wait for audio system to settle
      await new Promise(r => setTimeout(r, 500));

      // Reinitialize the voice module
      await initializeVoiceModule();
      await this.initializeListeners();

      console.log('[SpeechRecognition] Recovery complete, module reinitialized');

      // Set state to idle - caller can retry if needed
      this.setState('idle');
    } catch (error) {
      console.error('[SpeechRecognition] Recovery failed:', error);
      this.callbacks.onError?.('Voice recognition recovery failed');
      this.setState('error');
    }
  }

  private setState(newState: SpeechRecognitionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange?.(newState);
    }
  }

  private startSilenceTimeout(): void {
    this.clearSilenceTimeout();
    this.silenceTimeout = setTimeout(async () => {
      console.log('[SpeechRecognition] Silence timeout - stopping');
      await this.stopListening();
    }, this.SILENCE_TIMEOUT_MS);
  }

  private resetSilenceTimeout(): void {
    this.startSilenceTimeout();
  }

  private clearSilenceTimeout(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  /**
   * Set callbacks for speech events
   */
  async setCallbacks(callbacks: SpeechRecognitionCallbacks): Promise<void> {
    this.callbacks = callbacks;
    // Initialize listeners when callbacks are set (lazy initialization)
    await this.initializeListeners();
  }

  /**
   * Start listening for speech
   */
  async startListening(): Promise<boolean> {
    try {
      // Thread-safe initialization - ensures module is loaded before use
      const Voice = await initializeVoiceModule();
      if (!Voice) {
        console.warn('[SpeechRecognition] Voice module not available');
        this.callbacks.onError?.('Voice recognition not available');
        return false;
      }

      // Ensure listeners are initialized with error handling
      try {
        await this.initializeListeners();
      } catch (initError) {
        console.warn('[SpeechRecognition] Failed to init listeners:', initError);
        // Continue anyway - listeners may work
      }

      // Check if already listening
      if (this.state === 'listening') {
        console.log('[SpeechRecognition] Already listening');
        return true;
      }

      // Check permissions and availability with error handling
      try {
        const available = await Voice.isAvailable();
        if (!available) {
          console.warn('[SpeechRecognition] Voice recognition not available');
          this.callbacks.onError?.('Voice recognition not available on this device');
          return false;
        }
      } catch (availError: any) {
        console.warn('[SpeechRecognition] Failed to check availability:', availError);
        // Continue anyway - might still work
      }

      console.log('[SpeechRecognition] Starting...');
      this.setState('listening');

      // Wrap Voice.start() in its own try-catch for native exceptions
      try {
        await Voice.start('en-US');
      } catch (startError: any) {
        console.error('[SpeechRecognition] Voice.start() failed:', startError);
        this.setState('error');
        this.callbacks.onError?.(startError.message || 'Failed to start voice recognition');
        return false;
      }

      // Start silence timeout
      this.startSilenceTimeout();

      return true;
    } catch (error: any) {
      console.error('[SpeechRecognition] Failed to start:', error);
      this.callbacks.onError?.(error.message || 'Failed to start speech recognition');
      this.setState('error');
      return false;
    }
  }

  /**
   * Stop listening and process results
   */
  async stopListening(): Promise<void> {
    try {
      this.clearSilenceTimeout();

      if (this.state === 'idle') {
        return;
      }

      const Voice = getVoice();
      if (!Voice) {
        this.setState('idle');
        return;
      }

      console.log('[SpeechRecognition] Stopping...');
      await Voice.stop();
      this.setState('processing');
    } catch (error: any) {
      console.warn('[SpeechRecognition] Error stopping:', error);
      this.setState('idle');
    }
  }

  /**
   * Cancel listening without processing
   */
  async cancel(): Promise<void> {
    try {
      this.clearSilenceTimeout();

      const Voice = getVoice();
      if (!Voice) {
        this.setState('idle');
        return;
      }

      console.log('[SpeechRecognition] Cancelling...');
      await Voice.cancel();
      this.setState('idle');
    } catch (error: any) {
      console.warn('[SpeechRecognition] Error cancelling:', error);
      this.setState('idle');
    }
  }

  /**
   * Destroy and clean up
   */
  async destroy(): Promise<void> {
    try {
      this.clearSilenceTimeout();

      const Voice = getVoice();
      if (Voice) {
        await Voice.destroy();
      }

      this.isInitialized = false;
      this.setState('idle');
      console.log('[SpeechRecognition] Destroyed');
    } catch (error: any) {
      console.warn('[SpeechRecognition] Error destroying:', error);
    }
  }

  /**
   * Get current state
   */
  getState(): SpeechRecognitionState {
    return this.state;
  }

  /**
   * Check if currently listening
   */
  isListening(): boolean {
    return this.state === 'listening';
  }

  /**
   * Check if voice recognition is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const Voice = getVoice();
      if (!Voice) {
        return false;
      }
      const available = await Voice.isAvailable();
      return !!available; // Convert 0/1 to boolean
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const speechRecognition = new SpeechRecognitionService();

// Export class for testing
export { SpeechRecognitionService };
