import { config } from '../config/env.js';
import { ELEVENLABS_CONFIG } from '../config/constants.js';

export type VoiceId = keyof typeof ELEVENLABS_CONFIG.voices;

export interface SpeakRequest {
  text: string;
  voice?: VoiceId;
}

export interface SpeakResponse {
  audioData: string; // Base64 encoded audio
  contentType: string;
}

/**
 * Check if ElevenLabs API is available
 */
export function isAvailable(): boolean {
  return !!config.api.elevenlabs;
}

/**
 * Generate speech audio from text using ElevenLabs API
 * Returns base64 encoded audio data
 */
export async function generateSpeech(data: SpeakRequest): Promise<SpeakResponse | null> {
  const apiKey = config.api.elevenlabs;

  if (!apiKey) {
    console.warn('[ElevenLabs] No API key configured');
    return null;
  }

  const voiceId = data.voice
    ? ELEVENLABS_CONFIG.voices[data.voice]
    : ELEVENLABS_CONFIG.voices[ELEVENLABS_CONFIG.defaultVoice as VoiceId];

  try {
    const response = await fetch(`${ELEVENLABS_CONFIG.apiUrl}/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: data.text,
        model_id: ELEVENLABS_CONFIG.model,
        voice_settings: ELEVENLABS_CONFIG.voiceSettings,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return null;
    }

    // Get audio data as array buffer and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return {
      audioData: base64,
      contentType: 'audio/mpeg',
    };
  } catch (error) {
    console.error('[ElevenLabs] Failed to generate speech:', error);
    return null;
  }
}

/**
 * Get available voices
 */
export function getVoices(): Record<string, string> {
  return ELEVENLABS_CONFIG.voices;
}
