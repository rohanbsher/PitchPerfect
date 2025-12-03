/**
 * Intent Parser Service
 *
 * Converts spoken text to app intents using fast local pattern matching.
 * Falls back to Claude AI for complex or ambiguous queries.
 */

// Workout intent types
export type WorkoutType = 'quick_warmup' | 'morning' | 'full' | string;
export type ScreenType = 'progress' | 'settings' | 'home' | 'practice';
export type VolumeTarget = 'piano' | 'voice';
export type Direction = 'up' | 'down';

// All possible intents
export type Intent =
  // Workout control
  | { type: 'start_workout'; workout: WorkoutType }
  | { type: 'start_exercise'; exerciseId: string }
  | { type: 'start_breathing' }
  | { type: 'stop' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'skip' }
  | { type: 'skip_breathing' }
  | { type: 'replay_note' }
  | { type: 'next_exercise' }
  // Navigation
  | { type: 'navigate'; screen: ScreenType }
  | { type: 'go_back' }
  | { type: 'show_results' }
  // Queries (require AI response)
  | { type: 'query_progress' }
  | { type: 'query_recommendation' }
  | { type: 'query_range' }
  | { type: 'query_streak' }
  | { type: 'general_question'; question: string }
  // Settings
  | { type: 'adjust_volume'; target: VolumeTarget; direction: Direction }
  | { type: 'toggle_voice_coach'; enabled?: boolean }
  // Help
  | { type: 'help' }
  | { type: 'what_can_you_do' }
  // Unknown (fallback to AI)
  | { type: 'unknown'; text: string };

// Pattern definitions for fast local matching
interface IntentPattern {
  pattern: RegExp;
  intentBuilder: (match: RegExpMatchArray, text: string) => Intent;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // ===== Workout Control =====

  // Start workout variations
  {
    pattern: /^(start|begin|do|let'?s\s*(do|start|begin))\s*(a\s+)?(quick\s*)?(warmup|warm\s*up)/i,
    intentBuilder: () => ({ type: 'start_workout', workout: 'quick_warmup' }),
  },
  {
    pattern: /^(start|begin|do|let'?s\s*(do|start|begin))\s*(a\s+)?(morning)\s*(warmup|warm\s*up|workout|routine)?/i,
    intentBuilder: () => ({ type: 'start_workout', workout: 'morning' }),
  },
  {
    pattern: /^(start|begin|do|let'?s\s*(do|start|begin))\s*(a\s+)?(full)\s*(warmup|warm\s*up|workout)?/i,
    intentBuilder: () => ({ type: 'start_workout', workout: 'full' }),
  },
  {
    pattern: /^(start|begin|let'?s\s*(start|begin|practice))\s*(a\s+)?(workout|practice|session|training)/i,
    intentBuilder: () => ({ type: 'start_workout', workout: 'quick_warmup' }),
  },

  // Start specific exercises
  {
    pattern: /^(start|do|practice)\s*(the\s+)?(warmup|warm\s*up)\s*scale/i,
    intentBuilder: () => ({ type: 'start_exercise', exerciseId: 'warmup-scale' }),
  },
  {
    pattern: /^(start|do|practice)\s*(the\s+)?descending\s*scale/i,
    intentBuilder: () => ({ type: 'start_exercise', exerciseId: 'descending-scale' }),
  },
  {
    pattern: /^(start|do|practice)\s*(the\s+)?(major\s+)?arpeggio/i,
    intentBuilder: () => ({ type: 'start_exercise', exerciseId: 'major-arpeggio' }),
  },
  {
    pattern: /^(start|do|practice)\s*(the\s+)?octave\s*jump/i,
    intentBuilder: () => ({ type: 'start_exercise', exerciseId: 'octave-jump' }),
  },
  {
    pattern: /^(start|do|practice)\s*(the\s+)?siren/i,
    intentBuilder: () => ({ type: 'start_exercise', exerciseId: 'siren' }),
  },
  {
    pattern: /^(start|do|practice)\s*(the\s+)?extended\s*range/i,
    intentBuilder: () => ({ type: 'start_exercise', exerciseId: 'extended-range' }),
  },

  // Breathing
  {
    pattern: /^(start|begin|do)\s*(the\s+)?breathing(\s*exercise)?/i,
    intentBuilder: () => ({ type: 'start_breathing' }),
  },

  // Stop/End/Cancel
  {
    pattern: /^(stop|end|finish|quit|cancel|exit)(\s*(the|this))?\s*(workout|exercise|session|practice)?/i,
    intentBuilder: () => ({ type: 'stop' }),
  },

  // Pause
  {
    pattern: /^pause(\s*(the|this))?\s*(workout|exercise|session)?/i,
    intentBuilder: () => ({ type: 'pause' }),
  },

  // Resume
  {
    pattern: /^(resume|continue|unpause)(\s*(the|this))?\s*(workout|exercise|session)?/i,
    intentBuilder: () => ({ type: 'resume' }),
  },

  // Skip
  {
    pattern: /^skip\s*(this)?\s*(breathing|to\s+(the\s+)?workout)/i,
    intentBuilder: () => ({ type: 'skip_breathing' }),
  },
  {
    pattern: /^skip(\s*(this|the))?\s*(note|exercise)?/i,
    intentBuilder: () => ({ type: 'skip' }),
  },

  // Replay note
  {
    pattern: /^(play|hear|repeat)\s*(that|the|it|this)?\s*(note|again|one\s*more\s*time)/i,
    intentBuilder: () => ({ type: 'replay_note' }),
  },
  {
    pattern: /^(again|one\s*more\s*time|repeat)/i,
    intentBuilder: () => ({ type: 'replay_note' }),
  },

  // Next exercise
  {
    pattern: /^(next|move\s*on)(\s*(exercise|one))?/i,
    intentBuilder: () => ({ type: 'next_exercise' }),
  },

  // ===== Navigation =====

  {
    pattern: /^(show|go\s*to|open|take\s*me\s*to)\s*(my\s+)?(progress|stats|statistics|history)/i,
    intentBuilder: () => ({ type: 'navigate', screen: 'progress' }),
  },
  {
    pattern: /^(show|go\s*to|open)\s*(the\s+)?settings/i,
    intentBuilder: () => ({ type: 'navigate', screen: 'settings' }),
  },
  {
    pattern: /^(go\s+)?home|back\s*to\s*(the\s+)?home/i,
    intentBuilder: () => ({ type: 'navigate', screen: 'home' }),
  },
  {
    pattern: /^(go\s+)?(back|previous)/i,
    intentBuilder: () => ({ type: 'go_back' }),
  },
  {
    pattern: /^(show|see|view)\s*(the\s+)?results/i,
    intentBuilder: () => ({ type: 'show_results' }),
  },

  // ===== Queries =====

  {
    pattern: /^how\s*(am\s+i|'?m\s*i)\s*(doing|progressing)(\s*this\s*week|\s*today|\s*lately)?/i,
    intentBuilder: () => ({ type: 'query_progress' }),
  },
  {
    pattern: /^(what'?s?|how'?s?)\s*(my\s+)?(progress|stats|statistics)/i,
    intentBuilder: () => ({ type: 'query_progress' }),
  },
  {
    pattern: /^(what|which)\s*(exercise|workout)\s*should\s*i\s*(do|practice|try)(\s*next)?/i,
    intentBuilder: () => ({ type: 'query_recommendation' }),
  },
  {
    pattern: /^recommend\s*(an?\s*)?(exercise|workout)/i,
    intentBuilder: () => ({ type: 'query_recommendation' }),
  },
  {
    pattern: /^(what'?s?|how'?s?)\s*my\s*(vocal\s+)?range/i,
    intentBuilder: () => ({ type: 'query_range' }),
  },
  {
    pattern: /^(what'?s?|how'?s?|show)\s*my\s*streak/i,
    intentBuilder: () => ({ type: 'query_streak' }),
  },

  // ===== Volume Control =====

  {
    pattern: /^(turn\s*)?(piano|reference\s*note)\s*(volume\s+)?(up|louder)/i,
    intentBuilder: () => ({ type: 'adjust_volume', target: 'piano', direction: 'up' }),
  },
  {
    pattern: /^(turn\s*)?(piano|reference\s*note)\s*(volume\s+)?(down|quieter|softer)/i,
    intentBuilder: () => ({ type: 'adjust_volume', target: 'piano', direction: 'down' }),
  },
  {
    pattern: /^(turn\s*)?(voice|coach)\s*(volume\s+)?(up|louder)/i,
    intentBuilder: () => ({ type: 'adjust_volume', target: 'voice', direction: 'up' }),
  },
  {
    pattern: /^(turn\s*)?(voice|coach)\s*(volume\s+)?(down|quieter|softer)/i,
    intentBuilder: () => ({ type: 'adjust_volume', target: 'voice', direction: 'down' }),
  },
  {
    pattern: /^(volume|louder|quieter)\s+(up|down)/i,
    intentBuilder: (match) => ({
      type: 'adjust_volume',
      target: 'voice',
      direction: match[2].toLowerCase() === 'up' || match[1].toLowerCase() === 'louder' ? 'up' : 'down',
    }),
  },

  // ===== Voice Coach Toggle =====

  {
    pattern: /^(turn\s*)?(voice\s*coach|coaching)\s*(on|off)/i,
    intentBuilder: (match) => ({
      type: 'toggle_voice_coach',
      enabled: match[3].toLowerCase() === 'on',
    }),
  },
  {
    pattern: /^(enable|disable)\s*(the\s+)?(voice\s*coach|coaching)/i,
    intentBuilder: (match) => ({
      type: 'toggle_voice_coach',
      enabled: match[1].toLowerCase() === 'enable',
    }),
  },

  // ===== Help =====

  {
    pattern: /^(help|what\s*can\s*you\s*do|what\s*are\s*the\s*commands)/i,
    intentBuilder: () => ({ type: 'what_can_you_do' }),
  },
  {
    pattern: /^(how\s*do\s*i|how\s*can\s*i)\s*use\s*(you|this|the\s*assistant)/i,
    intentBuilder: () => ({ type: 'help' }),
  },
];

/**
 * Parse spoken text into an intent
 */
export function parseIntent(text: string): Intent {
  // Normalize text
  const normalizedText = text.trim();

  if (!normalizedText) {
    return { type: 'unknown', text: '' };
  }

  // Try each pattern in order
  for (const { pattern, intentBuilder } of INTENT_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      console.log('[IntentParser] Matched pattern:', pattern.source);
      return intentBuilder(match, normalizedText);
    }
  }

  // No pattern matched - this is either a complex query or unknown
  // Check for question-like patterns that should go to AI
  if (isLikelyQuestion(normalizedText)) {
    return { type: 'general_question', question: normalizedText };
  }

  return { type: 'unknown', text: normalizedText };
}

/**
 * Check if text is likely a question that should go to AI
 */
function isLikelyQuestion(text: string): boolean {
  const questionPatterns = [
    /^(what|why|how|when|where|who|which|can|could|would|should|is|are|do|does|will)/i,
    /\?$/,
    /^tell\s*me/i,
    /^explain/i,
    /^describe/i,
  ];

  return questionPatterns.some((p) => p.test(text));
}

/**
 * Get human-readable description of an intent
 */
export function describeIntent(intent: Intent): string {
  switch (intent.type) {
    case 'start_workout':
      return `Starting ${intent.workout} workout`;
    case 'start_exercise':
      return `Starting exercise: ${intent.exerciseId}`;
    case 'start_breathing':
      return 'Starting breathing exercise';
    case 'stop':
      return 'Stopping';
    case 'pause':
      return 'Pausing';
    case 'resume':
      return 'Resuming';
    case 'skip':
      return 'Skipping';
    case 'skip_breathing':
      return 'Skipping breathing exercise';
    case 'replay_note':
      return 'Replaying note';
    case 'next_exercise':
      return 'Moving to next exercise';
    case 'navigate':
      return `Navigating to ${intent.screen}`;
    case 'go_back':
      return 'Going back';
    case 'show_results':
      return 'Showing results';
    case 'query_progress':
      return 'Checking progress';
    case 'query_recommendation':
      return 'Getting recommendation';
    case 'query_range':
      return 'Checking vocal range';
    case 'query_streak':
      return 'Checking streak';
    case 'general_question':
      return 'Asking AI';
    case 'adjust_volume':
      return `Adjusting ${intent.target} volume ${intent.direction}`;
    case 'toggle_voice_coach':
      return intent.enabled ? 'Enabling voice coach' : 'Disabling voice coach';
    case 'help':
    case 'what_can_you_do':
      return 'Getting help';
    case 'unknown':
      return 'Unknown command';
  }
}

/**
 * Check if intent requires AI response
 */
export function requiresAIResponse(intent: Intent): boolean {
  return (
    intent.type === 'query_progress' ||
    intent.type === 'query_recommendation' ||
    intent.type === 'query_range' ||
    intent.type === 'query_streak' ||
    intent.type === 'general_question' ||
    intent.type === 'unknown'
  );
}
