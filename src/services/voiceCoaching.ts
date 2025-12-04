/**
 * Voice Coaching Service
 *
 * Provides natural, varied voice coaching using Text-to-Speech.
 * Uses Premium iOS voices for natural, conversational output.
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// Voice preferences
export interface VoicePreferences {
  enabled: boolean;
  speed: number; // 0.5 - 2.0 (1.0 = normal)
  pitch: number; // 0.5 - 2.0 (1.0 = normal)
  voice?: string; // System voice ID (optional)
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  enabled: true,
  speed: 0.95, // Natural conversational speed
  pitch: 1.05, // Slightly higher for warmth
};

// Premium iOS voices (sorted by quality/naturalness)
// These are the enhanced/premium voices available on iOS
const PREFERRED_VOICES = [
  'com.apple.voice.premium.en-US.Zoe',      // Very natural female
  'com.apple.voice.premium.en-US.Evan',     // Very natural male
  'com.apple.ttsbundle.siri_Nicky_en-US_compact', // Siri Nicky (conversational)
  'com.apple.ttsbundle.siri_Aaron_en-US_compact', // Siri Aaron (conversational)
  'com.apple.voice.enhanced.en-US.Samantha', // Samantha Enhanced
  'com.apple.voice.enhanced.en-US.Alex',     // Alex Enhanced
  'com.apple.voice.compact.en-US.Samantha',  // Samantha (fallback)
];

// Cache the selected voice
let selectedVoice: string | null = null;
let voicesInitialized = false;

/**
 * Phrase variations for natural, conversational coaching
 * Written to sound warm and encouraging like a real vocal coach
 */
const PHRASE_VARIATIONS = {
  // Personalized workout greeting - warm and encouraging
  workoutGreeting: [
    "Hey! Let's warm up your voice today.",
    "Great to see you! Ready to practice?",
    "Alright, let's get that voice warmed up!",
    "Hey there! Time to work on your voice.",
    "Welcome back! Let's make some great sounds today.",
  ],

  // Personalized scale greeting - specific to their range
  personalScaleGreeting: [
    "I've got a scale just for you, in your comfortable range.",
    "Let's start with notes that fit your voice perfectly.",
    "Here's a scale customized for your vocal range.",
    "We'll work in your sweet spot today.",
  ],

  // Range test greeting - explain what we're doing
  rangeTestGreeting: [
    "Let's find your vocal range! Sing each note as I play it. Don't worry if some are too high or low.",
    "Time to discover your range. Match each note I play. It's okay if you can't hit them all!",
    "Let's map out your voice. Sing along with each piano note. Just do your best!",
  ],

  // Range test complete - announce results
  rangeTestComplete: [
    "Great job! Your range goes from {low} to {high}.",
    "Nicely done! You can sing from {low} up to {high}.",
    "All done! Your comfortable range is {low} to {high}.",
  ],

  // Exercise introductions - warm and inviting
  exerciseIntro: [
    "Alright, let's work on {exercise}.",
    "Okay, time for {exercise}!",
    "Now let's practice {exercise}.",
    "Ready? Here comes {exercise}.",
    "Next up is {exercise}.",
  ],

  // Breathing exercise - calming tone
  breathingIntro: [
    "Let's start by centering your breath.",
    "Take a moment to breathe and relax.",
    "We'll warm up with some breathing first.",
    "Let's get your breath support ready.",
  ],
  breathingComplete: [
    "Great! Your voice is warmed up now.",
    "Nice breathing! Let's start singing.",
    "Perfect. You're ready to sing.",
    "Excellent breath control. Here we go!",
  ],

  // Workout transitions - encouraging
  nextExercise: [
    "Nice! Moving on.",
    "Great, let's keep going.",
    "Okay, next one!",
    "You're doing well. Next exercise!",
  ],
  workoutComplete: [
    "Amazing work today! You should be proud.",
    "Great session! Your voice is sounding better already.",
    "Awesome job! That's a wrap for today.",
    "Fantastic practice! Keep up the momentum.",
  ],

  // Positive feedback (high accuracy) - enthusiastic
  excellent: [
    "Yes! That was perfect!",
    "Beautiful! Right on pitch.",
    "Spot on! Great job!",
    "Nailed it!",
    "Perfect! Love that.",
    "Exactly right!",
  ],

  // Good feedback (medium-high accuracy) - supportive
  good: [
    "Good! Keep it up.",
    "Nice one!",
    "That's it!",
    "Well done!",
    "Getting there!",
    "Good work!",
  ],

  // Encouraging feedback (medium accuracy) - constructive
  tryAgain: [
    "Close! Try to match the pitch a bit more.",
    "Almost! Listen to the target note again.",
    "Good effort! Focus on the reference tone.",
    "You're getting there. Listen carefully.",
  ],

  // Gentle correction (low accuracy) - supportive
  needsWork: [
    "That's okay. Listen to the note and try again.",
    "Take your time. Match what you hear.",
    "No worries! Focus on the piano note.",
    "Let's try that one again together.",
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
 * Initialize and select the best available premium voice
 */
async function initializeVoice(): Promise<void> {
  if (voicesInitialized) return;

  try {
    const voices = await Speech.getAvailableVoicesAsync();
    console.log('[Voice] Available voices:', voices.length);

    // Find the best available voice from our preferred list
    for (const preferredId of PREFERRED_VOICES) {
      const found = voices.find(v => v.identifier === preferredId);
      if (found) {
        selectedVoice = found.identifier;
        console.log('[Voice] Selected premium voice:', found.name || found.identifier);
        break;
      }
    }

    // If no premium voice found, try to find any enhanced US English voice
    if (!selectedVoice) {
      const usVoices = voices.filter(v =>
        v.language?.startsWith('en') &&
        (v.identifier?.includes('enhanced') || v.identifier?.includes('premium') || v.quality === 'Enhanced')
      );
      if (usVoices.length > 0) {
        selectedVoice = usVoices[0].identifier;
        console.log('[Voice] Selected fallback voice:', usVoices[0].name || selectedVoice);
      }
    }

    // Log all available voices for debugging
    const enhancedVoices = voices.filter(v =>
      v.language?.startsWith('en') &&
      (v.identifier?.includes('enhanced') || v.identifier?.includes('premium') || v.identifier?.includes('siri'))
    );
    console.log('[Voice] Enhanced EN voices available:', enhancedVoices.map(v => ({
      id: v.identifier,
      name: v.name,
      quality: v.quality
    })));

    voicesInitialized = true;
  } catch (error) {
    console.warn('[Voice] Failed to initialize voices:', error);
    voicesInitialized = true; // Mark as initialized to prevent retry loops
  }
}

/**
 * Configure audio session for TTS playback
 * This ensures TTS plays at full volume and doesn't conflict with other audio
 */
async function configureAudioSession(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false, // Not recording during TTS
      playsInSilentModeIOS: true, // Play even if muted
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn('[Voice] Audio session config failed:', error);
  }
}

/**
 * Speak text using TTS with premium voice
 */
export async function speak(text: string, preferences: VoicePreferences = DEFAULT_PREFERENCES): Promise<void> {
  if (!preferences.enabled) {
    console.log('[Voice] Disabled:', text);
    return;
  }

  try {
    // Initialize voice selection if not done
    await initializeVoice();

    // Configure audio session for clear playback
    await configureAudioSession();

    // Check if speech is already in progress
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
      // Small delay to ensure previous speech is fully stopped
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Use selected premium voice or user preference
    const voiceToUse = preferences.voice || selectedVoice || undefined;

    console.log('[Voice] Speaking:', text.substring(0, 50) + '...', 'voice:', voiceToUse);

    await Speech.speak(text, {
      language: 'en-US',
      pitch: preferences.pitch,
      rate: preferences.speed,
      voice: voiceToUse,
      onDone: () => {
        console.log('[Voice] Finished speaking');
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
   * Greet user when starting a workout
   */
  greetUser: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('workoutGreeting');
    await speak(text, prefs);
  },

  /**
   * Greet user for personalized scale exercise
   */
  greetForPersonalScale: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('personalScaleGreeting');
    await speak(text, prefs);
  },

  /**
   * Greet user for range test
   */
  greetForRangeTest: async (prefs?: VoicePreferences) => {
    const text = getRandomPhrase('rangeTestGreeting');
    await speak(text, prefs);
  },

  /**
   * Announce range test results
   */
  announceRangeResults: async (lowNote: string, highNote: string, prefs?: VoicePreferences) => {
    const text = getRandomPhrase('rangeTestComplete', { low: lowNote, high: highNote });
    await speak(text, prefs);
  },

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

  /**
   * Initialize voice system (call early for faster first speech)
   */
  initialize: initializeVoice,

  /**
   * Get currently selected voice info
   */
  getSelectedVoice: () => selectedVoice,
};

export { DEFAULT_PREFERENCES, initializeVoice };
