/**
 * useVoiceAssistant Hook
 *
 * React hook for managing voice assistant state and interactions.
 * Provides a clean interface for components to use the voice assistant.
 */

import React, { useState, useEffect, useCallback, useRef, createContext, useContext, ReactNode } from 'react';
import { voiceAssistant, VoiceAssistantState } from '../services/voiceAssistant';
import { appController } from '../services/appController';
import { ExerciseEngine } from '../engines/ExerciseEngine';

interface UseVoiceAssistantReturn {
  // State
  state: VoiceAssistantState;
  isActive: boolean;
  isAvailable: boolean;

  // Display data
  transcript: string;
  response: string;
  error: string | null;

  // Actions
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  toggle: () => Promise<void>;

  // Integration
  setExerciseEngine: (engine: ExerciseEngine | null) => void;
  setNavigationCallback: (callback: (screen: string) => void) => void;
  setGoBackCallback: (callback: () => void) => void;
}

export function useVoiceAssistant(): UseVoiceAssistantReturn {
  const [state, setState] = useState<VoiceAssistantState>('idle');
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Initialize voice assistant
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Set up callbacks
    voiceAssistant.setCallbacks({
      onStateChange: (newState) => {
        setState(newState);
        // Clear error when state changes
        if (newState !== 'error') {
          setError(null);
        }
      },
      onTranscript: (text, isFinal) => {
        setTranscript(text);
        // Clear previous response when new transcript comes in
        if (!isFinal) {
          setResponse('');
        }
      },
      onResponse: (text) => {
        setResponse(text);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
      },
    });

    // DON'T check availability at startup - this triggers native module loading
    // Assume available on iOS, actual check happens when user tries to activate
    setIsAvailable(true);

    // Cleanup
    return () => {
      voiceAssistant.deactivate();
    };
  }, []);

  // Activate voice assistant
  const activate = useCallback(async () => {
    setTranscript('');
    setResponse('');
    setError(null);

    const success = await voiceAssistant.activate();
    if (!success) {
      setError('Could not start voice recognition. Please check your microphone permissions.');
    }
  }, []);

  // Deactivate voice assistant
  const deactivate = useCallback(async () => {
    await voiceAssistant.deactivate();
    setState('idle');
  }, []);

  // Toggle voice assistant
  const toggle = useCallback(async () => {
    if (voiceAssistant.isActive()) {
      await deactivate();
    } else {
      await activate();
    }
  }, [activate, deactivate]);

  // Set exercise engine for app controller
  const setExerciseEngine = useCallback((engine: ExerciseEngine | null) => {
    appController.setExerciseEngine(engine);
  }, []);

  // Set navigation callback for app controller
  const setNavigationCallback = useCallback((callback: (screen: string) => void) => {
    appController.setNavigationCallback(callback);
  }, []);

  // Set go back callback for app controller
  const setGoBackCallback = useCallback((callback: () => void) => {
    appController.setGoBackCallback(callback);
  }, []);

  return {
    // State
    state,
    isActive: state !== 'idle' && state !== 'error',
    isAvailable,

    // Display data
    transcript,
    response,
    error,

    // Actions
    activate,
    deactivate,
    toggle,

    // Integration
    setExerciseEngine,
    setNavigationCallback,
    setGoBackCallback,
  };
}

// Context for sharing voice assistant state across the app
interface VoiceAssistantContextValue extends UseVoiceAssistantReturn {}

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const voiceAssistantState = useVoiceAssistant();

  return (
    <VoiceAssistantContext.Provider value={voiceAssistantState}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistantContext(): VoiceAssistantContextValue {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistantContext must be used within a VoiceAssistantProvider');
  }
  return context;
}
