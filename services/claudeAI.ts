import Anthropic from '@anthropic-ai/sdk';
import { NoteAttempt, SessionRecord, VocalRange } from '../src/types/userProgress';
import { analyzeVocalRange, RangeAnalysisResult } from '../src/services/rangeAnalysis';
import { frequencyToNote } from '../src/utils/audioUtils';

// Initialize Anthropic client
const getAnthropicClient = () => {
  // Use EXPO_PUBLIC_ prefix for environment variables accessible in Expo
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

  if (!apiKey) {
    console.warn('EXPO_PUBLIC_ANTHROPIC_API_KEY not configured');
    return null;
  }

  return new Anthropic({
    apiKey,
  });
};

// Rate limiting to prevent excessive API calls
let lastCallTime = 0;
const MIN_CALL_INTERVAL = 5000; // 5 seconds between calls

const canMakeAPICall = (): boolean => {
  const now = Date.now();
  if (now - lastCallTime < MIN_CALL_INTERVAL) {
    return false;
  }
  lastCallTime = now;
  return true;
};

// API timeout helper - prevents infinite waiting on network issues
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('API call timed out')), timeoutMs)
    ),
  ]);
};

// Professional vocal coach system prompt
const COACH_SYSTEM_PROMPT = `You are a professional vocal coach with expertise in vocal technique, pitch accuracy, and breathing exercises.

Your role is to provide:
1. Specific, actionable vocal technique advice based on performance data
2. Exercise recommendations to target weaknesses
3. Professional, direct feedback without excessive praise

Use proper vocal terminology (diaphragm support, resonance, placement, breath control).
Reference specific frequency/note data when relevant.
Be encouraging but focus on concrete improvements.`;

// Generate real-time coaching tip during exercise
export async function generateRealTimeCoachingTip(
  consecutiveLowScores: number,
  currentAccuracy: number,
  targetNote: string,
  userRange: { lowest: string; highest: string }
): Promise<string | null> {
  if (!canMakeAPICall()) {
    return null;
  }

  const client = getAnthropicClient();
  if (!client) {
    return null;
  }

  try {
    const message = await withTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 150,
        system: COACH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `During a vocal exercise, the student is struggling:
- Target note: ${targetNote}
- Current accuracy: ${currentAccuracy.toFixed(0)}%
- Consecutive low scores: ${consecutiveLowScores}
- Student's vocal range: ${userRange.lowest} to ${userRange.highest}

Provide ONE specific technique tip (1-2 sentences) to help them match the pitch better RIGHT NOW.`,
          },
        ],
      }),
      10000
    );

    const tip = message.content[0].type === 'text' ? message.content[0].text : null;
    return tip;
  } catch (error) {
    console.error('Error generating real-time coaching:', error);
    return null;
  }
}

// Analyze performance patterns from note attempts
function analyzePerformancePatterns(noteAttempts: NoteAttempt[]): {
  averageAccuracy: number;
  consistentlyLowNotes: string[];
  rangeIssues: string | null;
  pitchTrend: 'sharp' | 'flat' | 'inconsistent' | 'good';
} {
  const avgAccuracy = noteAttempts.reduce((sum, n) => sum + n.accuracy, 0) / noteAttempts.length;

  // Find notes consistently missed
  const noteAccuracyMap = new Map<string, number[]>();
  noteAttempts.forEach(attempt => {
    const note = frequencyToNote(attempt.targetFrequency);
    // Skip invalid frequencies
    if (note) {
      if (!noteAccuracyMap.has(note)) {
        noteAccuracyMap.set(note, []);
      }
      noteAccuracyMap.get(note)!.push(attempt.accuracy);
    }
  });

  const consistentlyLowNotes = Array.from(noteAccuracyMap.entries())
    .filter(([_, accuracies]) => {
      const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      return avg < 60;
    })
    .map(([note]) => note);

  // Analyze pitch trend (sharp = too high, flat = too low)
  const deviations = noteAttempts.map(a => {
    const targetFreq = a.targetFrequency;
    const actualFreq = a.actualFrequency;
    return actualFreq - targetFreq;
  });

  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const isConsistentDirection = deviations.every(d => d > 0) || deviations.every(d => d < 0);

  let pitchTrend: 'sharp' | 'flat' | 'inconsistent' | 'good';
  if (avgAccuracy > 80) {
    pitchTrend = 'good';
  } else if (isConsistentDirection && avgDeviation > 5) {
    pitchTrend = 'sharp';
  } else if (isConsistentDirection && avgDeviation < -5) {
    pitchTrend = 'flat';
  } else {
    pitchTrend = 'inconsistent';
  }

  // RANGE ANALYSIS: Detect if user struggles at high/low extremes
  let rangeIssues: string | null = null;
  if (noteAttempts.length > 0) {
    const frequencies = noteAttempts.map(a => a.targetFrequency);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    // Check accuracy at extremes
    const lowNotes = noteAttempts.filter(a => a.targetFrequency <= minFreq + (maxFreq - minFreq) * 0.25);
    const highNotes = noteAttempts.filter(a => a.targetFrequency >= minFreq + (maxFreq - minFreq) * 0.75);

    const lowAccuracy = lowNotes.length > 0
      ? lowNotes.reduce((sum, n) => sum + n.accuracy, 0) / lowNotes.length
      : 100;
    const highAccuracy = highNotes.length > 0
      ? highNotes.reduce((sum, n) => sum + n.accuracy, 0) / highNotes.length
      : 100;

    if (lowAccuracy < 60 && highAccuracy < 60) {
      rangeIssues = 'Struggling at both range extremes - may need more foundational technique work';
    } else if (lowAccuracy < 60) {
      rangeIssues = 'Lower range weakness detected - focus on chest voice support';
    } else if (highAccuracy < 60) {
      rangeIssues = 'Upper range strain detected - work on head voice transition';
    }
  }

  return {
    averageAccuracy: avgAccuracy,
    consistentlyLowNotes,
    rangeIssues,
    pitchTrend,
  };
}

// Generate post-session feedback with technique tips and recommendations
export async function generatePostSessionFeedback(
  sessionRecord: SessionRecord,
  recentSessions: SessionRecord[]
): Promise<{
  techniqueTip: string;
  recommendedExercise: string;
  strengths: string[];
  improvements: string[];
} | null> {
  const client = getAnthropicClient();
  if (!client) {
    return null;
  }

  try {
    const patterns = analyzePerformancePatterns(sessionRecord.noteAttempts);

    // Calculate improvement trend
    const recentAccuracies = recentSessions.slice(-5).map(s => s.accuracy);
    const hasImprovement = recentAccuracies.length >= 2 &&
      recentAccuracies[recentAccuracies.length - 1] > recentAccuracies[0];

    const message = await withTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        system: COACH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze this vocal practice session:

SESSION DATA:
- Exercise: ${sessionRecord.exerciseName}
- Overall accuracy: ${sessionRecord.accuracy.toFixed(1)}%
- Duration: ${sessionRecord.duration} seconds
- Vocal range: ${sessionRecord.lowestNote} to ${sessionRecord.highestNote}
- Notes attempted: ${sessionRecord.noteAttempts.length}

PERFORMANCE ANALYSIS:
- Average accuracy: ${patterns.averageAccuracy.toFixed(1)}%
- Pitch trend: ${patterns.pitchTrend}
- Consistently struggling with: ${patterns.consistentlyLowNotes.length > 0 ? patterns.consistentlyLowNotes.join(', ') : 'none'}
- Recent improvement trend: ${hasImprovement ? 'improving' : 'stable'}

Provide:
1. ONE specific technique tip (2-3 sentences) addressing the main issue
2. ONE recommended exercise name from: ["Warm-up Scale", "Descending Scale", "Octave Jump", "Major Arpeggio", "Siren", "Extended Range"]
3. 2-3 strengths observed
4. 2-3 areas for improvement

Format as JSON:
{
  "techniqueTip": "...",
  "recommendedExercise": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}`,
          },
        ],
      }),
      10000
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }

    const feedback = JSON.parse(jsonText);
    return feedback;
  } catch (error) {
    console.error('Error generating post-session feedback:', error);
    return null;
  }
}

// Get next exercise recommendation based on user's performance history
export async function getNextExerciseRecommendation(
  recentSessions: SessionRecord[],
  userVocalRange: { lowest: string; highest: string }
): Promise<{
  exerciseName: string;
  reason: string;
} | null> {
  const client = getAnthropicClient();
  if (!client) {
    return null;
  }

  try {
    // Analyze weak areas from recent sessions
    const allNoteAttempts = recentSessions.flatMap(s => s.noteAttempts);
    const patterns = analyzePerformancePatterns(allNoteAttempts);

    const exerciseHistory = recentSessions.map(s => ({
      name: s.exerciseName,
      accuracy: s.accuracy,
    }));

    const message = await withTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        system: COACH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Based on this student's recent practice history, recommend the next exercise:

RECENT SESSIONS (last ${recentSessions.length}):
${exerciseHistory.map(e => `- ${e.name}: ${e.accuracy.toFixed(0)}%`).join('\n')}

PERFORMANCE PATTERNS:
- Overall accuracy: ${patterns.averageAccuracy.toFixed(1)}%
- Pitch trend: ${patterns.pitchTrend}
- Struggling with notes: ${patterns.consistentlyLowNotes.join(', ') || 'none'}
- Current vocal range: ${userVocalRange.lowest} to ${userVocalRange.highest}

AVAILABLE EXERCISES:
- Warm-up Scale (Beginner): C4-G4 scale
- Descending Scale (Beginner): G4-C4 scale
- Octave Jump (Intermediate): Large intervals
- Major Arpeggio (Intermediate): C-E-G patterns
- Siren (Advanced): Smooth transitions
- Extended Range (Advanced): C3-G5 range

Recommend ONE exercise and explain why in 1 sentence.

Format as JSON:
{
  "exerciseName": "...",
  "reason": "..."
}`,
          },
        ],
      }),
      10000
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }

    const recommendation = JSON.parse(jsonText);
    return recommendation;
  } catch (error) {
    console.error('Error generating exercise recommendation:', error);
    return null;
  }
}

// Generate comprehensive AI-powered vocal range analysis report
export async function generateRangeAnalysisReport(
  rangeAnalysis: RangeAnalysisResult,
  recentSessions: SessionRecord[]
): Promise<{
  rangeAssessment: string;
  comfortableRangeInsight: string;
  weaknessAnalysis: string;
  expansionCoaching: string;
  recommendedExercises: string[];
  techniqueTips: string[];
} | null> {
  const client = getAnthropicClient();
  if (!client) {
    return null;
  }

  try {
    const message = await withTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        system: COACH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Analyze this singer's vocal range performance:

CURRENT RANGE:
- Full range: ${rangeAnalysis.currentRange.lowest} to ${rangeAnalysis.currentRange.highest}
- Comfortable range (70%+ accuracy): ${rangeAnalysis.comfortableRange.lowest} to ${rangeAnalysis.comfortableRange.highest}
- Comfortable span: ${rangeAnalysis.comfortableRange.spanSemitones} semitones
- Strongest note: ${rangeAnalysis.strongestNote?.note || 'Not enough data'} (${rangeAnalysis.strongestNote?.accuracy.toFixed(0)}% accuracy)

RANGE EXPANSION:
- Last 30 days: ${rangeAnalysis.expansion.last30Days.semitones} semitones (${rangeAnalysis.expansion.last30Days.direction})
- All-time: ${rangeAnalysis.expansion.allTime.semitones} semitones

WEAKNESSES BY FREQUENCY BAND:
${rangeAnalysis.weaknesses.length > 0
  ? rangeAnalysis.weaknesses.map(w => `- ${w.frequencyBand.toUpperCase()} (${w.averageAccuracy.toFixed(0)}%): ${w.notes.join(', ')}`).join('\n')
  : '- No significant weaknesses detected'}

EXTENDED RANGE (struggling notes):
- Lower extension: ${rangeAnalysis.extendedRange.lower?.note || 'None'}
- Upper extension: ${rangeAnalysis.extendedRange.upper?.note || 'None'}

Provide professional vocal coaching analysis:

1. **Range Assessment** (2-3 sentences): Overall evaluation of their vocal range - is it typical? Impressive? Needs work?

2. **Comfortable Range Insight** (2 sentences): What does their comfortable ${rangeAnalysis.comfortableRange.spanSemitones}-semitone range tell you?

3. **Weakness Analysis** (2-3 sentences): Analyze their specific weak frequency bands. What's causing the struggle?

4. **Expansion Coaching** (3-4 sentences): Based on their expansion trend, give specific advice for safely expanding range.

5. **Recommended Exercises** (list 3): Which PitchPerfect exercises should they focus on? Choose from: Warm-up Scale, Descending Scale, Octave Jump, Major Arpeggio, Siren, Extended Range

6. **Technique Tips** (list 3-4): Specific vocal technique advice for their weaknesses.

Format as JSON:
{
  "rangeAssessment": "...",
  "comfortableRangeInsight": "...",
  "weaknessAnalysis": "...",
  "expansionCoaching": "...",
  "recommendedExercises": ["...", "...", "..."],
  "techniqueTips": ["...", "...", "..."]
}`,
          },
        ],
      }),
      10000
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }

    const report = JSON.parse(jsonText);
    return report;
  } catch (error) {
    console.error('Error generating range analysis report:', error);
    return null;
  }
}

// Generate real-time range safety coaching (warn if pushing too hard)
export async function generateRangeSafetyCoaching(
  targetNote: string,
  targetFrequency: number,
  comfortableRange: { lowest: string; highest: string },
  currentAccuracy: number
): Promise<string | null> {
  if (!canMakeAPICall()) {
    return null;
  }

  const client = getAnthropicClient();
  if (!client) {
    return null;
  }

  // Determine if outside comfortable range
  const isOutsideComfort = true; // Caller should pre-filter this

  try {
    const message = await withTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 150,
        system: COACH_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `The student is attempting a note OUTSIDE their comfortable range:

TARGET NOTE: ${targetNote}
CURRENT ACCURACY: ${currentAccuracy.toFixed(0)}%
COMFORTABLE RANGE: ${comfortableRange.lowest} to ${comfortableRange.highest}

This is at the edge of their ability. Provide ONE safety-focused tip (1-2 sentences) to help them sing this note safely without straining.`,
          },
        ],
      }),
      10000
    );

    const tip = message.content[0].type === 'text' ? message.content[0].text : null;
    return tip;
  } catch (error) {
    console.warn('Error generating range safety coaching:', error);
    return null;
  }
}

// ========== VOICE ASSISTANT CONVERSATION ==========

// Message in conversation history
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Context for voice assistant conversation
export interface ConversationContext {
  query: string;
  appState: {
    currentScreen: string;
    isExerciseActive: boolean;
    currentExercise?: string;
    exerciseState?: string;
    isBreathing: boolean;
  };
  userProgress: {
    streak: number;
    longestStreak: number;
    totalSessions: number;
    totalPracticeMinutes: number;
    averageAccuracy: number;
    vocalRange: { low: string; high: string };
    recentSessions: { date: string; exercise: string; accuracy: number }[];
    exercisesCompleted: number;
  };
  conversationHistory: ConversationMessage[];
}

// Voice assistant conversation system prompt
const VOICE_ASSISTANT_PROMPT = `You are PitchPerfect's AI vocal coach assistant - a friendly, knowledgeable voice that helps users with their vocal training.

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
Don't be overly verbose - remember your response will be spoken aloud.`;

/**
 * Voice assistant conversation with Claude
 * Used for complex queries that require AI understanding
 */
export async function claudeConversation(context: ConversationContext): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error('Claude API not configured');
  }

  try {
    // Build context-aware system prompt
    const systemPrompt = `${VOICE_ASSISTANT_PROMPT}

Current app state:
- Screen: ${context.appState.currentScreen}
- Exercise active: ${context.appState.isExerciseActive}
${context.appState.currentExercise ? `- Current exercise: ${context.appState.currentExercise}` : ''}
${context.appState.isBreathing ? '- In breathing exercise' : ''}

User progress:
- Practice streak: ${context.userProgress.streak} days (longest: ${context.userProgress.longestStreak})
- Total sessions: ${context.userProgress.totalSessions}
- Practice time: ${context.userProgress.totalPracticeMinutes} minutes
- Average accuracy: ${context.userProgress.averageAccuracy}%
- Vocal range: ${context.userProgress.vocalRange.low} to ${context.userProgress.vocalRange.high}
- Exercises completed: ${context.userProgress.exercisesCompleted}`;

    // Build messages from history + current query
    const messages = [
      ...context.conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: context.query },
    ];

    const message = await withTimeout(
      client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 150, // Keep responses short for voice
        system: systemPrompt,
        messages,
      }),
      10000
    );

    const response = message.content[0].type === 'text' ? message.content[0].text : '';
    return response || "I'm not sure how to help with that.";
  } catch (error) {
    console.error('Error in voice assistant conversation:', error);
    throw error;
  }
}
