/**
 * Feature Flags Configuration
 *
 * Controls gradual rollout of experimental features like Voice Assistant.
 * Persisted via AsyncStorage for persistence across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key
const FEATURE_FLAGS_KEY = '@PitchPerfect:featureFlags';

// Feature flags interface
export interface FeatureFlags {
  voiceAssistantEnabled: boolean;
  developerModeEnabled: boolean;
  voiceAssistantDebugLogging: boolean;
}

// Default values - Voice Assistant disabled by default for safety
const DEFAULT_FLAGS: FeatureFlags = {
  voiceAssistantEnabled: false,
  developerModeEnabled: false,
  voiceAssistantDebugLogging: false,
};

// In-memory cache for synchronous access
let cachedFlags: FeatureFlags = { ...DEFAULT_FLAGS };
let isLoaded = false;

/**
 * Load feature flags from AsyncStorage
 * Call this early in app initialization
 */
export async function loadFeatureFlags(): Promise<FeatureFlags> {
  try {
    const stored = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedFlags = { ...DEFAULT_FLAGS, ...parsed };
    } else {
      cachedFlags = { ...DEFAULT_FLAGS };
    }
    isLoaded = true;
    console.log('[FeatureFlags] Loaded:', cachedFlags);
    return cachedFlags;
  } catch (error) {
    console.error('[FeatureFlags] Failed to load:', error);
    cachedFlags = { ...DEFAULT_FLAGS };
    isLoaded = true;
    return cachedFlags;
  }
}

/**
 * Save feature flags to AsyncStorage
 */
async function saveFeatureFlags(): Promise<void> {
  try {
    await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(cachedFlags));
    console.log('[FeatureFlags] Saved:', cachedFlags);
  } catch (error) {
    console.error('[FeatureFlags] Failed to save:', error);
  }
}

/**
 * Get all feature flags (synchronous, uses cache)
 */
export function getFeatureFlags(): FeatureFlags {
  if (!isLoaded) {
    console.warn('[FeatureFlags] Accessed before loading, using defaults');
  }
  return { ...cachedFlags };
}

/**
 * Check if Voice Assistant is enabled
 */
export function isVoiceAssistantEnabled(): boolean {
  return cachedFlags.voiceAssistantEnabled;
}

/**
 * Check if Developer Mode is enabled
 */
export function isDeveloperModeEnabled(): boolean {
  return cachedFlags.developerModeEnabled;
}

/**
 * Check if Voice Assistant debug logging is enabled
 */
export function isVoiceAssistantDebugLoggingEnabled(): boolean {
  return cachedFlags.voiceAssistantDebugLogging;
}

/**
 * Enable Voice Assistant
 * Only works if Developer Mode is also enabled
 */
export async function enableVoiceAssistant(): Promise<boolean> {
  if (!cachedFlags.developerModeEnabled) {
    console.warn('[FeatureFlags] Cannot enable Voice Assistant without Developer Mode');
    return false;
  }
  cachedFlags.voiceAssistantEnabled = true;
  await saveFeatureFlags();
  return true;
}

/**
 * Disable Voice Assistant
 */
export async function disableVoiceAssistant(): Promise<void> {
  cachedFlags.voiceAssistantEnabled = false;
  await saveFeatureFlags();
}

/**
 * Toggle Voice Assistant
 */
export async function toggleVoiceAssistant(): Promise<boolean> {
  if (cachedFlags.voiceAssistantEnabled) {
    await disableVoiceAssistant();
    return false;
  } else {
    return enableVoiceAssistant();
  }
}

/**
 * Enable Developer Mode
 * This unlocks access to experimental features
 */
export async function enableDeveloperMode(): Promise<void> {
  cachedFlags.developerModeEnabled = true;
  await saveFeatureFlags();
  console.log('[FeatureFlags] Developer Mode enabled');
}

/**
 * Disable Developer Mode
 * Also disables Voice Assistant as a safety measure
 */
export async function disableDeveloperMode(): Promise<void> {
  cachedFlags.developerModeEnabled = false;
  cachedFlags.voiceAssistantEnabled = false; // Safety: disable VA too
  await saveFeatureFlags();
  console.log('[FeatureFlags] Developer Mode disabled');
}

/**
 * Toggle Voice Assistant debug logging
 */
export async function toggleVoiceAssistantDebugLogging(): Promise<boolean> {
  cachedFlags.voiceAssistantDebugLogging = !cachedFlags.voiceAssistantDebugLogging;
  await saveFeatureFlags();
  return cachedFlags.voiceAssistantDebugLogging;
}

// ========== Developer Mode Unlock ==========

// Track secret tap sequence
let secretTapCount = 0;
let lastTapTime = 0;
const SECRET_TAP_COUNT = 7;
const SECRET_TAP_TIMEOUT = 2000; // 2 seconds max between taps

/**
 * Handle tap on settings header (or other unlock trigger)
 * 7 taps within 2 seconds each unlocks Developer Mode
 * Returns true if Developer Mode was just unlocked
 */
export async function handleSecretTap(): Promise<boolean> {
  const now = Date.now();

  // Reset if too much time passed
  if (now - lastTapTime > SECRET_TAP_TIMEOUT) {
    secretTapCount = 0;
  }

  lastTapTime = now;
  secretTapCount++;

  console.log(`[FeatureFlags] Secret tap ${secretTapCount}/${SECRET_TAP_COUNT}`);

  if (secretTapCount >= SECRET_TAP_COUNT) {
    secretTapCount = 0;
    if (!cachedFlags.developerModeEnabled) {
      await enableDeveloperMode();
      return true;
    }
  }

  return false;
}

/**
 * Reset all feature flags to defaults
 */
export async function resetFeatureFlags(): Promise<void> {
  cachedFlags = { ...DEFAULT_FLAGS };
  await saveFeatureFlags();
  console.log('[FeatureFlags] Reset to defaults');
}

// Export for convenience
export const FeatureFlagsService = {
  load: loadFeatureFlags,
  get: getFeatureFlags,
  isVoiceAssistantEnabled,
  isDeveloperModeEnabled,
  isVoiceAssistantDebugLoggingEnabled,
  enableVoiceAssistant,
  disableVoiceAssistant,
  toggleVoiceAssistant,
  enableDeveloperMode,
  disableDeveloperMode,
  toggleVoiceAssistantDebugLogging,
  handleSecretTap,
  reset: resetFeatureFlags,
};
