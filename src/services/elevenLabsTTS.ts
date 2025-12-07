/**
 * ElevenLabs TTS Service
 *
 * High-quality, natural AI voice synthesis for the vocal coach.
 * Uses ElevenLabs API for the most human-like voice experience.
 */

import { Audio } from 'expo-av';

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Voice IDs - Premium voices for warm, encouraging coaching
export const VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM',  // Warm, encouraging female (default)
  josh: 'TxGEqnHWrfWFTfGW9XjX',    // Friendly male
  bella: 'EXAVITQu4vr4xnSDxMaL',   // Expressive female
  elli: 'MF3mGyEYCl7XYWbV9V6O',    // Young female
  sam: 'yoZ06aMxZJJ28mfd3POQ',     // Young male
} as const;

export type VoiceId = keyof typeof VOICES;

// Voice settings for coaching style
const VOICE_SETTINGS = {
  stability: 0.5,          // Balance between stable and expressive
  similarity_boost: 0.75,  // Voice consistency
  style: 0.4,              // Some expressiveness
  use_speaker_boost: true, // Enhanced clarity
};

// Audio cache to avoid re-generating common phrases (stores base64 data URIs)
const audioCache = new Map<string, string>();

// Current audio instance for playback control
let currentSound: Audio.Sound | null = null;

/**
 * Get the ElevenLabs API key from environment
 */
function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  if (!key) {
    console.warn('[ElevenLabs] No API key found. Set EXPO_PUBLIC_ELEVENLABS_API_KEY in .env');
    return null;
  }
  return key;
}

/**
 * Convert array buffer to base64 data URI
 */
function arrayBufferToDataUri(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binary);
  return `data:audio/mpeg;base64,${base64}`;
}

/**
 * Generate speech audio from text using ElevenLabs API
 * Returns a data URI that can be played directly
 */
async function generateSpeech(
  text: string,
  voiceId: string = VOICES.rachel
): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  // Check cache first
  const cacheKey = `${voiceId}:${text}`;
  if (audioCache.has(cacheKey)) {
    console.log('[ElevenLabs] Using cached audio');
    return audioCache.get(cacheKey)!;
  }

  try {
    console.log('[ElevenLabs] Generating speech:', text.substring(0, 50) + '...');

    // Make API request
    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',  // Fast, high-quality model
        voice_settings: VOICE_SETTINGS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return null;
    }

    // Get audio data as array buffer and convert to data URI
    const arrayBuffer = await response.arrayBuffer();
    const dataUri = arrayBufferToDataUri(arrayBuffer);

    // Cache the data URI
    audioCache.set(cacheKey, dataUri);

    console.log('[ElevenLabs] Speech generated successfully');
    return dataUri;
  } catch (error) {
    console.error('[ElevenLabs] Failed to generate speech:', error);
    return null;
  }
}

/**
 * Play audio from data URI using expo-av
 */
async function playAudio(dataUri: string): Promise<void> {
  // Stop any currently playing audio
  await stopAudio();

  try {
    // Note: Audio session is managed by ExerciseEngine to avoid conflicts

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
          console.log('[ElevenLabs] Playback complete');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('[ElevenLabs] Playback error:', error);
    // Graceful degradation - don't block callers
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
 * Speak text using ElevenLabs TTS
 * Returns true if successful, false if fallback should be used
 */
export async function speak(
  text: string,
  options: {
    voice?: VoiceId;
    onFallback?: () => void;
  } = {}
): Promise<boolean> {
  const voiceId = options.voice ? VOICES[options.voice] : VOICES.rachel;

  // Generate the speech audio
  const dataUri = await generateSpeech(text, voiceId);

  if (!dataUri) {
    console.log('[ElevenLabs] Generation failed, triggering fallback');
    options.onFallback?.();
    return false;
  }

  // Play the audio
  await playAudio(dataUri);
  return true;
}

/**
 * Check if ElevenLabs is available (API key configured)
 */
export function isAvailable(): boolean {
  return !!getApiKey();
}

/**
 * Clear the audio cache
 */
export async function clearCache(): Promise<void> {
  audioCache.clear();
}

/**
 * Get cache size for debugging
 */
export function getCacheSize(): number {
  return audioCache.size;
}

// Export for convenience
export const ElevenLabsTTS = {
  speak,
  stopAudio,
  isAvailable,
  clearCache,
  getCacheSize,
  VOICES,
};
