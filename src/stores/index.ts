/**
 * Zustand Stores Index
 *
 * Central export for all Zustand stores.
 * Using Zustand instead of Context to prevent app-wide re-renders.
 */

// Practice store - exercise flow and pitch detection
export {
  usePracticeStore,
  useExerciseState,
  usePitchData,
  useTargetNote,
  useAccuracy,
  useSessionStats,
  useCoachingTip,
  useBreathingPhase,
  type PracticeState,
  type ExerciseState,
  type PitchData,
  type TargetNote,
} from './practiceStore';

// Progress store - user stats and history
export {
  useProgressStore,
  useProgress,
  useStats,
  useStreak,
  useVocalRange,
  useRecentSessions,
  useIsLoadingProgress,
  type ProgressState,
} from './progressStore';

// Voice assistant store - voice command state
export {
  useVoiceAssistantStore,
  useVoiceState,
  useIsVoiceActive,
  useVoiceTranscript,
  useVoiceResponse,
  useIsConversationMode,
  useConversationHistory,
  useVoiceError,
  type VoiceAssistantState,
  type VoiceAssistantStoreState,
} from './voiceAssistantStore';
