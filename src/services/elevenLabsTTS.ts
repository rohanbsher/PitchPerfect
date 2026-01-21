/**
 * ElevenLabs TTS Service - Secure Backend Proxy Version
 *
 * All API calls are now routed through the secure backend proxy.
 * No API keys are stored client-side.
 */

import { Audio } from 'expo-av';
import { apiClient, type VoiceId } from '../shared/services/apiClient';

// Voice IDs - now just references, actual IDs are on the server
export const VOICES = {
  rachel: 'rachel',
  josh: 'josh',
  bella: 'bella',
  elli: 'elli',
  sam: 'sam',
} as const;

export type { VoiceId };

// Current audio instance for playback control
let currentSound: Audio.Sound | null = null;

// Service availability cache
let availabilityCache: { available: boolean; checkedAt: number } | null = null;
const AVAILABILITY_CACHE_TTL = 60000; // 1 minute

/**
 * Convert base64 to data URI
 */
function base64ToDataUri(base64: string, contentType: string): string {
  return `data:${contentType};base64,${base64}`;
}

/**
 * Play audio from data URI using expo-av
 */
async function playAudio(dataUri: string): Promise<void> {
  // Stop any currently playing audio
  await stopAudio();

  try {
    // Create and play the sound from data URI
    const { sound } = await Audio.Sound.createAsync(
      { uri: dataUri },
      { shouldPlay: true, volume: 1.0 }
    );

    currentSound = sound;

    // Wait for playback to complete
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('[ElevenLabs] Playback error:', error);
  }
}

/**
 * Stop any currently playing audio
 */
export async function stopAudio(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (error) {
      // Ignore errors when stopping
    }
    currentSound = null;
  }
}

/**
 * Speak text using ElevenLabs TTS via backend proxy
 * Returns true if successful, false if fallback should be used
 */
export async function speak(
  text: string,
  options: {
    voice?: VoiceId;
    onFallback?: () => void;
  } = {}
): Promise<boolean> {
  try {
    // Generate speech via backend proxy
    const result = await apiClient.generateSpeech({
      text,
      voice: options.voice,
    });

    if (!result) {
      console.log('[ElevenLabs] Generation failed, triggering fallback');
      options.onFallback?.();
      return false;
    }

    // Convert to data URI and play
    const dataUri = base64ToDataUri(result.audio, result.contentType);
    await playAudio(dataUri);
    return true;
  } catch (error) {
    console.error('[ElevenLabs] Speak failed:', error);
    options.onFallback?.();
    return false;
  }
}

/**
 * Check if ElevenLabs is available (API configured on backend)
 */
export async function isAvailable(): Promise<boolean> {
  // Check cache first
  const now = Date.now();
  if (availabilityCache && now - availabilityCache.checkedAt < AVAILABILITY_CACHE_TTL) {
    return availabilityCache.available;
  }

  try {
    const status = await apiClient.getTTSStatus();
    availabilityCache = { available: status.available, checkedAt: now };
    return status.available;
  } catch (error) {
    availabilityCache = { available: false, checkedAt: now };
    return false;
  }
}

/**
 * Synchronous check - uses cached value
 * For backwards compatibility with code that expects sync isAvailable
 */
export function isAvailableSync(): boolean {
  return availabilityCache?.available ?? false;
}

/**
 * Clear the availability cache
 */
export function clearCache(): void {
  availabilityCache = null;
}

// Export for convenience
export const ElevenLabsTTS = {
  speak,
  stopAudio,
  isAvailable,
  isAvailableSync,
  clearCache,
  VOICES,
};
