import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import { CLAUDE_CONFIG, SYSTEM_PROMPTS } from '../config/constants.js';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: config.api.anthropic,
});

// Timeout helper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = CLAUDE_CONFIG.timeout): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('API call timed out')), timeoutMs)
    ),
  ]);
}

// Helper to extract JSON from response
function extractJSON(text: string): string {
  // Try markdown code block first
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  // Try raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  return text;
}

// ==================== COACHING ENDPOINTS ====================

export interface RealTimeCoachingRequest {
  consecutiveLowScores: number;
  currentAccuracy: number;
  targetNote: string;
  userRange: { lowest: string; highest: string };
}

/**
 * Generate real-time coaching tip during exercise
 */
export async function generateRealTimeCoachingTip(
  data: RealTimeCoachingRequest
): Promise<string | null> {
  try {
    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens.coaching,
        system: SYSTEM_PROMPTS.coach,
        messages: [
          {
            role: 'user',
            content: `During a vocal exercise, the student is struggling:
- Target note: ${data.targetNote}
- Current accuracy: ${data.currentAccuracy.toFixed(0)}%
- Consecutive low scores: ${data.consecutiveLowScores}
- Student's vocal range: ${data.userRange.lowest} to ${data.userRange.highest}

Provide ONE specific technique tip (1-2 sentences) to help them match the pitch better RIGHT NOW.`,
          },
        ],
      })
    );

    return message.content[0].type === 'text' ? message.content[0].text : null;
  } catch (error) {
    console.error('Error generating real-time coaching:', error);
    return null;
  }
}

// ==================== CONVERSATION ENDPOINT ====================

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationRequest {
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

/**
 * Voice assistant conversation
 */
export async function claudeConversation(data: ConversationRequest): Promise<string> {
  const systemPrompt = `${SYSTEM_PROMPTS.voiceAssistant}

Current app state:
- Screen: ${data.appState.currentScreen}
- Exercise active: ${data.appState.isExerciseActive}
${data.appState.currentExercise ? `- Current exercise: ${data.appState.currentExercise}` : ''}
${data.appState.isBreathing ? '- In breathing exercise' : ''}

User progress:
- Practice streak: ${data.userProgress.streak} days (longest: ${data.userProgress.longestStreak})
- Total sessions: ${data.userProgress.totalSessions}
- Practice time: ${data.userProgress.totalPracticeMinutes} minutes
- Average accuracy: ${data.userProgress.averageAccuracy}%
- Vocal range: ${data.userProgress.vocalRange.low} to ${data.userProgress.vocalRange.high}
- Exercises completed: ${data.userProgress.exercisesCompleted}`;

  const messages = [
    ...data.conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: data.query },
  ];

  try {
    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens.conversation,
        system: systemPrompt,
        messages,
      })
    );

    return message.content[0].type === 'text'
      ? message.content[0].text
      : "I'm not sure how to help with that.";
  } catch (error) {
    console.error('Error in voice assistant conversation:', error);
    throw error;
  }
}

// ==================== FEEDBACK ENDPOINT ====================

export interface NoteAttempt {
  targetFrequency: number;
  actualFrequency: number;
  accuracy: number;
  timestamp?: number;
}

export interface SessionRecord {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  duration: number;
  accuracy: number;
  notesAttempted: number;
  notesHit: number;
  lowestNote?: string;
  highestNote?: string;
  noteAttempts: NoteAttempt[];
}

export interface FeedbackRequest {
  sessionRecord: SessionRecord;
  recentSessions: SessionRecord[];
}

export interface FeedbackResponse {
  techniqueTip: string;
  recommendedExercise: string;
  strengths: string[];
  improvements: string[];
}

// Helper to convert frequency to note name
function frequencyToNote(frequency: number): string | null {
  if (frequency <= 0) return null;

  const A4 = 440;
  const semitones = 12 * Math.log2(frequency / A4);
  const noteIndex = Math.round(semitones) + 9; // A is at index 9

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = 4 + Math.floor((noteIndex + 3) / 12);
  const noteName = noteNames[((noteIndex % 12) + 12) % 12];

  return `${noteName}${octave}`;
}

// Analyze performance patterns from note attempts
function analyzePerformancePatterns(noteAttempts: NoteAttempt[]): {
  averageAccuracy: number;
  consistentlyLowNotes: string[];
  pitchTrend: 'sharp' | 'flat' | 'inconsistent' | 'good';
} {
  const avgAccuracy = noteAttempts.reduce((sum, n) => sum + n.accuracy, 0) / noteAttempts.length;

  // Find notes consistently missed
  const noteAccuracyMap = new Map<string, number[]>();
  noteAttempts.forEach((attempt) => {
    const note = frequencyToNote(attempt.targetFrequency);
    if (note) {
      if (!noteAccuracyMap.has(note)) {
        noteAccuracyMap.set(note, []);
      }
      noteAccuracyMap.get(note)!.push(attempt.accuracy);
    }
  });

  const consistentlyLowNotes = Array.from(noteAccuracyMap.entries())
    .filter(([, accuracies]) => {
      const avg = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      return avg < 60;
    })
    .map(([note]) => note);

  // Analyze pitch trend
  const deviations = noteAttempts.map((a) => a.actualFrequency - a.targetFrequency);
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const isConsistentDirection = deviations.every((d) => d > 0) || deviations.every((d) => d < 0);

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

  return {
    averageAccuracy: avgAccuracy,
    consistentlyLowNotes,
    pitchTrend,
  };
}

/**
 * Generate post-session feedback
 */
export async function generatePostSessionFeedback(
  data: FeedbackRequest
): Promise<FeedbackResponse | null> {
  try {
    const patterns = analyzePerformancePatterns(data.sessionRecord.noteAttempts);
    const recentAccuracies = data.recentSessions.slice(-5).map((s) => s.accuracy);
    const hasImprovement =
      recentAccuracies.length >= 2 &&
      recentAccuracies[recentAccuracies.length - 1] > recentAccuracies[0];

    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens.feedback,
        system: SYSTEM_PROMPTS.coach,
        messages: [
          {
            role: 'user',
            content: `Analyze this vocal practice session:

SESSION DATA:
- Exercise: ${data.sessionRecord.exerciseName}
- Overall accuracy: ${data.sessionRecord.accuracy.toFixed(1)}%
- Duration: ${data.sessionRecord.duration} seconds
- Vocal range: ${data.sessionRecord.lowestNote || 'N/A'} to ${data.sessionRecord.highestNote || 'N/A'}
- Notes attempted: ${data.sessionRecord.noteAttempts.length}

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
      })
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonText = extractJSON(responseText);
    return JSON.parse(jsonText) as FeedbackResponse;
  } catch (error) {
    console.error('Error generating post-session feedback:', error);
    return null;
  }
}

// ==================== RECOMMENDATION ENDPOINT ====================

export interface RecommendationRequest {
  recentSessions: SessionRecord[];
  userVocalRange: { lowest: string; highest: string };
}

export interface RecommendationResponse {
  exerciseName: string;
  reason: string;
}

/**
 * Get next exercise recommendation
 */
export async function getNextExerciseRecommendation(
  data: RecommendationRequest
): Promise<RecommendationResponse | null> {
  try {
    const allNoteAttempts = data.recentSessions.flatMap((s) => s.noteAttempts);
    const patterns = analyzePerformancePatterns(allNoteAttempts);

    const exerciseHistory = data.recentSessions.map((s) => ({
      name: s.exerciseName,
      accuracy: s.accuracy,
    }));

    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens.recommendation,
        system: SYSTEM_PROMPTS.coach,
        messages: [
          {
            role: 'user',
            content: `Based on this student's recent practice history, recommend the next exercise:

RECENT SESSIONS (last ${data.recentSessions.length}):
${exerciseHistory.map((e) => `- ${e.name}: ${e.accuracy.toFixed(0)}%`).join('\n')}

PERFORMANCE PATTERNS:
- Overall accuracy: ${patterns.averageAccuracy.toFixed(1)}%
- Pitch trend: ${patterns.pitchTrend}
- Struggling with notes: ${patterns.consistentlyLowNotes.join(', ') || 'none'}
- Current vocal range: ${data.userVocalRange.lowest} to ${data.userVocalRange.highest}

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
      })
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonText = extractJSON(responseText);
    return JSON.parse(jsonText) as RecommendationResponse;
  } catch (error) {
    console.error('Error generating exercise recommendation:', error);
    return null;
  }
}

// ==================== RANGE ANALYSIS ENDPOINT ====================

export interface RangeAnalysisRequest {
  rangeAnalysis: {
    currentRange: { lowest: string; highest: string };
    comfortableRange: { lowest: string; highest: string; spanSemitones: number };
    strongestNote: { note: string; accuracy: number } | null;
    expansion: {
      last30Days: { semitones: number; direction: string };
      allTime: { semitones: number };
    };
    weaknesses: Array<{
      frequencyBand: string;
      averageAccuracy: number;
      notes: string[];
    }>;
    extendedRange: {
      lower: { note: string } | null;
      upper: { note: string } | null;
    };
  };
  recentSessions: SessionRecord[];
}

export interface RangeAnalysisResponse {
  rangeAssessment: string;
  comfortableRangeInsight: string;
  weaknessAnalysis: string;
  expansionCoaching: string;
  recommendedExercises: string[];
  techniqueTips: string[];
}

/**
 * Generate comprehensive vocal range analysis report
 */
export async function generateRangeAnalysisReport(
  data: RangeAnalysisRequest
): Promise<RangeAnalysisResponse | null> {
  try {
    const { rangeAnalysis } = data;

    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens.rangeAnalysis,
        system: SYSTEM_PROMPTS.coach,
        messages: [
          {
            role: 'user',
            content: `Analyze this singer's vocal range performance:

CURRENT RANGE:
- Full range: ${rangeAnalysis.currentRange.lowest} to ${rangeAnalysis.currentRange.highest}
- Comfortable range (70%+ accuracy): ${rangeAnalysis.comfortableRange.lowest} to ${rangeAnalysis.comfortableRange.highest}
- Comfortable span: ${rangeAnalysis.comfortableRange.spanSemitones} semitones
- Strongest note: ${rangeAnalysis.strongestNote?.note || 'Not enough data'} (${rangeAnalysis.strongestNote?.accuracy.toFixed(0) || 'N/A'}% accuracy)

RANGE EXPANSION:
- Last 30 days: ${rangeAnalysis.expansion.last30Days.semitones} semitones (${rangeAnalysis.expansion.last30Days.direction})
- All-time: ${rangeAnalysis.expansion.allTime.semitones} semitones

WEAKNESSES BY FREQUENCY BAND:
${rangeAnalysis.weaknesses.length > 0
  ? rangeAnalysis.weaknesses.map((w) => `- ${w.frequencyBand.toUpperCase()} (${w.averageAccuracy.toFixed(0)}%): ${w.notes.join(', ')}`).join('\n')
  : '- No significant weaknesses detected'}

EXTENDED RANGE (struggling notes):
- Lower extension: ${rangeAnalysis.extendedRange.lower?.note || 'None'}
- Upper extension: ${rangeAnalysis.extendedRange.upper?.note || 'None'}

Provide professional vocal coaching analysis:

1. **Range Assessment** (2-3 sentences): Overall evaluation of their vocal range
2. **Comfortable Range Insight** (2 sentences): What does their comfortable range tell you?
3. **Weakness Analysis** (2-3 sentences): Analyze their specific weak frequency bands
4. **Expansion Coaching** (3-4 sentences): Advice for safely expanding range
5. **Recommended Exercises** (list 3): Which exercises should they focus on?
6. **Technique Tips** (list 3-4): Specific vocal technique advice

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
      })
    );

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonText = extractJSON(responseText);
    return JSON.parse(jsonText) as RangeAnalysisResponse;
  } catch (error) {
    console.error('Error generating range analysis report:', error);
    return null;
  }
}

// ==================== RANGE SAFETY COACHING ====================

export interface RangeSafetyRequest {
  targetNote: string;
  targetFrequency: number;
  comfortableRange: { lowest: string; highest: string };
  currentAccuracy: number;
}

/**
 * Generate range safety coaching for notes outside comfortable range
 */
export async function generateRangeSafetyCoaching(
  data: RangeSafetyRequest
): Promise<string | null> {
  try {
    const message = await withTimeout(
      anthropic.messages.create({
        model: CLAUDE_CONFIG.model,
        max_tokens: CLAUDE_CONFIG.maxTokens.coaching,
        system: SYSTEM_PROMPTS.coach,
        messages: [
          {
            role: 'user',
            content: `The student is attempting a note OUTSIDE their comfortable range:

TARGET NOTE: ${data.targetNote}
CURRENT ACCURACY: ${data.currentAccuracy.toFixed(0)}%
COMFORTABLE RANGE: ${data.comfortableRange.lowest} to ${data.comfortableRange.highest}

This is at the edge of their ability. Provide ONE safety-focused tip (1-2 sentences) to help them sing this note safely without straining.`,
          },
        ],
      })
    );

    return message.content[0].type === 'text' ? message.content[0].text : null;
  } catch (error) {
    console.error('Error generating range safety coaching:', error);
    return null;
  }
}
