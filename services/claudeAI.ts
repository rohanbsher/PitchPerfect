import Anthropic from '@anthropic-ai/sdk';
import { NoteAttempt, SessionRecord, VocalRange } from '../src/types/userProgress';

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
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
    });

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
    if (!noteAccuracyMap.has(note)) {
      noteAccuracyMap.set(note, []);
    }
    noteAccuracyMap.get(note)!.push(attempt.accuracy);
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

  return {
    averageAccuracy: avgAccuracy,
    consistentlyLowNotes,
    rangeIssues: null, // TODO: Implement range analysis
    pitchTrend,
  };
}

// Helper: Convert frequency to note name
function frequencyToNote(frequency: number): string {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const h = Math.round(12 * Math.log2(frequency / C0));
  const octave = Math.floor(h / 12);
  const n = h % 12;

  return noteNames[n] + octave;
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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
    });

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

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
    });

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
