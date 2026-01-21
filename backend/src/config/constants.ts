// Rate limiting configuration
export const RATE_LIMITS = {
  // AI coaching endpoints (expensive API calls)
  'ai/coaching': { window: '1m', max: 10 },
  'ai/conversation': { window: '1m', max: 20 },
  'ai/feedback': { window: '1m', max: 10 },
  'ai/recommendation': { window: '1m', max: 15 },
  'ai/range-analysis': { window: '1m', max: 5 },

  // TTS endpoint (most expensive)
  'tts/speak': { window: '1m', max: 30 },

  // User data endpoints (less restrictive)
  'user/progress': { window: '1m', max: 60 },
  'sessions': { window: '1m', max: 60 },

  // Auth endpoints
  'auth/register': { window: '1h', max: 10 },
  'auth/refresh': { window: '1m', max: 10 },

  // Global fallback
  global: { window: '1m', max: 100 },
} as const;

// Claude model configuration
export const CLAUDE_CONFIG = {
  model: 'claude-3-5-haiku-20241022',
  maxTokens: {
    coaching: 150,
    conversation: 150,
    feedback: 500,
    recommendation: 200,
    rangeAnalysis: 800,
  },
  timeout: 10000, // 10 seconds
} as const;

// ElevenLabs configuration
export const ELEVENLABS_CONFIG = {
  apiUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
  model: 'eleven_turbo_v2_5',
  voices: {
    rachel: '21m00Tcm4TlvDq8ikWAM',
    josh: 'TxGEqnHWrfWFTfGW9XjX',
    bella: 'EXAVITQu4vr4xnSDxMaL',
    elli: 'MF3mGyEYCl7XYWbV9V6O',
    sam: 'yoZ06aMxZJJ28mfd3POQ',
  },
  defaultVoice: 'rachel',
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.4,
    use_speaker_boost: true,
  },
} as const;

// System prompts
export const SYSTEM_PROMPTS = {
  coach: `You are a professional vocal coach with expertise in vocal technique, pitch accuracy, and breathing exercises.

Your role is to provide:
1. Specific, actionable vocal technique advice based on performance data
2. Exercise recommendations to target weaknesses
3. Professional, direct feedback without excessive praise

Use proper vocal terminology (diaphragm support, resonance, placement, breath control).
Reference specific frequency/note data when relevant.
Be encouraging but focus on concrete improvements.`,

  voiceAssistant: `You are PitchPerfect's AI vocal coach assistant - a friendly, knowledgeable voice that helps users with their vocal training.

Your personality:
- Warm and encouraging, like a supportive coach
- Concise - keep responses to 1-2 sentences for voice output
- Knowledgeable about vocal techniques and training
- Reference specific data when helpful

You can help with:
- Answering questions about the user's progress
- Recommending exercises based on their history
- Explaining vocal techniques
- Providing encouragement and motivation
- Giving tips for improvement

When users want to start exercises or navigate, be encouraging - the app will handle the action.
Don't be overly verbose - remember your response will be spoken aloud.`,
} as const;
