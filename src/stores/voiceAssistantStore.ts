/**
 * Voice Assistant Store
 *
 * Zustand store for voice assistant state management.
 * Replaces the VoiceAssistantContext to prevent app-wide re-renders.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ConversationMessage } from '../../services/claudeAI';

// Voice assistant states
export type VoiceAssistantState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

// Voice assistant store state
export interface VoiceAssistantStoreState {
  // Current state
  state: VoiceAssistantState;
  isActive: boolean;

  // Transcript and response
  transcript: string;
  response: string;

  // Conversation mode
  isConversationMode: boolean;
  conversationHistory: ConversationMessage[];

  // Error state
  error: string | null;

  // Navigation callbacks (set by app)
  navigationCallback: ((screen: string) => void) | null;
  goBackCallback: (() => void) | null;

  // Actions
  setState: (state: VoiceAssistantState) => void;
  setActive: (active: boolean) => void;
  setTranscript: (transcript: string) => void;
  setResponse: (response: string) => void;
  startConversationMode: () => void;
  endConversationMode: () => void;
  addToHistory: (message: ConversationMessage) => void;
  clearHistory: () => void;
  setError: (error: string | null) => void;
  setNavigationCallback: (callback: (screen: string) => void) => void;
  setGoBackCallback: (callback: () => void) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  state: 'idle' as VoiceAssistantState,
  isActive: false,
  transcript: '',
  response: '',
  isConversationMode: false,
  conversationHistory: [] as ConversationMessage[],
  error: null,
  navigationCallback: null,
  goBackCallback: null,
};

export const useVoiceAssistantStore = create<VoiceAssistantStoreState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setState: (state) => set({ state }),

    setActive: (isActive) =>
      set({
        isActive,
        // Reset state when deactivating
        ...(isActive ? {} : { state: 'idle', transcript: '', error: null }),
      }),

    setTranscript: (transcript) => set({ transcript }),

    setResponse: (response) => set({ response }),

    startConversationMode: () =>
      set({
        isConversationMode: true,
        isActive: true,
      }),

    endConversationMode: () =>
      set({
        isConversationMode: false,
        isActive: false,
        state: 'idle',
        transcript: '',
        response: '',
        conversationHistory: [],
      }),

    addToHistory: (message) =>
      set((state) => ({
        conversationHistory: [...state.conversationHistory, message],
      })),

    clearHistory: () => set({ conversationHistory: [] }),

    setError: (error) =>
      set({
        error,
        state: error ? 'error' : get().state,
      }),

    setNavigationCallback: (callback) => set({ navigationCallback: callback }),

    setGoBackCallback: (callback) => set({ goBackCallback: callback }),

    reset: () => set(initialState),
  }))
);

// Selector hooks for optimized subscriptions
export const useVoiceState = () => useVoiceAssistantStore((state) => state.state);
export const useIsVoiceActive = () => useVoiceAssistantStore((state) => state.isActive);
export const useVoiceTranscript = () => useVoiceAssistantStore((state) => state.transcript);
export const useVoiceResponse = () => useVoiceAssistantStore((state) => state.response);
export const useIsConversationMode = () =>
  useVoiceAssistantStore((state) => state.isConversationMode);
export const useConversationHistory = () =>
  useVoiceAssistantStore((state) => state.conversationHistory);
export const useVoiceError = () => useVoiceAssistantStore((state) => state.error);
