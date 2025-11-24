/**
 * Voice Coaching Service
 *
 * Provides natural, varied voice coaching using Text-to-Speech.
 * Replaces robotic pre-recorded voice clips with dynamic, contextual feedback.
 */

import * as Speech from 'expo-speech';

// Voice preferences
export interface VoicePreferences {
  enabled: boolean;
  speed: number; // 0.5 - 2.0 (1.0 = normal)
  pitch: number; // 0.5 - 2.0 (1.0 = normal)
  voice?: string; // System voice ID (optional)
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  enabled: true,
  speed: 0.9, // Slightly slower for clarity
  pitch: 1.0,
};

/**
 * Phrase variations for natural, non-repetitive coaching
 */
const PHRASE_VARIATIONS = {
  // Exercise introductions
  exerciseIntro: [
    "Let's practice {exercise}.",
    "Time for {exercise}.",
    "Now we'll work on {exercise}.",
    "Ready for {exercise}?",
  ],

  // Breathing exercise
  breathingIntro: [
    "Let's start with breathing to warm up your voice.",
    "We'll begin with some breathing exercises.",
    "Time to warm up with controlled breathing.",
  ],
  breathingComplete: [
    "Great breathing! Your voice is warmed up.",
    "Excellent breath control. Let's move to singing.",
    "Perfect! You're ready for vocal exercises.",
  ],

  // Workout transitions
  nextExercise: [
    "Moving on to the next exercise.",
    "Let's try something new.",
    "Ready for the next one?",
  ],
  workoutComplete: [
    "Excellent work! You've completed your session.",
    "Great practice session! You're done for today.",
    "Fantastic! That's a wrap for this workout.",
  ],

  // Positive feedback (high accuracy)
  excellent: [
    "Excellent!",
    "Perfect pitch!",
    "Beautiful!",
    "You nailed it!",
    "Spot on!",
    "That was great!",
  ],

  // Good feedback (medium-high accuracy)
  good: [
    "Good job!",
    "Nice work!",
    "Well done!",
    "You're getting it!",
    "Keep it up!",
  ],

  // Encouraging feedback (medium accuracy)
  tryAgain: [
    "Almost there, try to match the pitch.",
    "Good effort, focus on the target note.",
    "You're close, listen carefully to the piano.",
  ],

  // Gentle correction (low accuracy)
  needsWork: [
    "Focus on matching the pitch you hear.",
    "Listen to the reference note and try again.",
    "Take a breath and match the tone.",
  ],
};

/**
 * Get a random phrase from variations
 */
function getRandomPhrase(key: keyof typeof PHRASE_VARIATIONS, replacements?: Record<string, string>): string {
  const phrases = PHRASE_VARIATIONS[key];
  let phrase = phrases[Math.floor(Math.random() * phrases.length)];

  // Replace placeholders
  if (replacements) {
    Object.keys(replacements).forEach(key => {
      phrase = phrase.replace(`{${key}}`, replacements[key]);
    });
  }

  return phrase;
}

/**
 * Speak text using TTS with user preferences
 */
export async function speak(text: string, preferences: VoicePreferences = DEFAULT_PREFERENCES): Promise<void> {
  if (!preferences.enabled) {
    console.log('[Voice] Disabled:', text);
    return;
  }

  try {
    // Check if speech is already in progress
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      // Stop current speech before starting new one
      await Speech.stop();
    }

    await Speech.speak(text, {
      language: 'en-US',
      pitch: preferences.pitch,
      rate: preferences.speed,
      voice: preferences.voice,
      onDone: () => {
        console.log('[Voice] Finished:', text);
      },
      onError: (error) => {
        console.warn('[Voice] TTS error:', error);
      },
    });
  } catch (error) {
    console.warn('[Voice] Failed to speak:', text, error);
  }
}

/**
 * Stop any ongoing speech
 */
export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (error) {
    console.warn('[Voice] Failed to stop:', error);
  }
}

/**
 * Get available voices on the device
 */
export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch (error) {
    console.warn('[Voice] Failed to get voices:', error);
    return [];
  }
}

/**
 * Voice Coaching API - High-level functions for exercise flow
 */

export const VoiceCoach = {
  /**
   * Announce exercise start
   */
  announceExercise: async (exerciseName: string, prefs?: VoicePreferences) => {
    const text = getRandomPhrase('exerciseIntro', { exercise: exerciseName });
    await speak(text, prefs);
  },

  /**
   * Breathing exercise intro
   */
  startBreathing: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('breathingIntro');
    await speak(text, prefs);
  },

  /**
   * Breathing exercise complete
   */
  completeBreathing: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('breathingComplete');
    await speak(text, prefs);
  },

  /**
   * Transition to next exercise
   */
  nextExercise: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('nextExercise');
    await speak(text, prefs);
  },

  /**
   * Workout complete
   */
  completeWorkout: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('workoutComplete');
    await speak(text, prefs);
  },

  /**
   * Provide feedback based on accuracy
   */
  provideFeedback: async (accuracy: number, targetNote?: string, prefs?: VoicePreferences) => {
    let phraseKey: keyof typeof PHRASE_VARIATIONS;

    if (accuracy >= 90) {
      phraseKey = 'excellent';
    } else if (accuracy >= 70) {
      phraseKey = 'good';
    } else if (accuracy >= 50) {
      phraseKey = 'tryAgain';
    } else {
      phraseKey = 'needsWork';
    }

    const text = getRandomPhrase(phraseKey);
    await speak(text, prefs);
  },

  /**
   * Speak AI-generated coaching tip
   */
  speakCoachingTip: async (tip: string, prefs?: VoicePreferences) => {
    await speak(tip, prefs);
  },

  /**
   * Custom message
   */
  say: async (message: string, prefs?: VoicePreferences) => {
    await speak(message, prefs);
  },

  /**
   * Stop all speech
   */
  stop: stopSpeaking,
};

export { DEFAULT_PREFERENCES };
