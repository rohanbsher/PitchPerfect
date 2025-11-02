import Anthropic from '@anthropic-ai/sdk';
import { ExerciseResult, NoteResult } from '../../data/models';

// Initialize Anthropic client
// NOTE: You'll need to set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file
const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
});

export interface VocalCoachFeedback {
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  specificTips: string[];
  encouragement: string;
  nextSteps: string;
}

/**
 * Analyzes exercise results and generates personalized AI coaching feedback
 */
export async function generateVocalCoachFeedback(
  exerciseName: string,
  noteResults: NoteResult[],
  overallAccuracy: number,
  exerciseDuration: number
): Promise<VocalCoachFeedback> {
  try {
    // Prepare analysis data
    const totalNotes = noteResults.length;
    const successfulNotes = noteResults.filter((nr) => nr.success).length;
    const failedNotes = noteResults.filter((nr) => !nr.success);

    // Calculate pitch tendency (sharp vs flat)
    let sharpCount = 0;
    let flatCount = 0;
    let unstableCount = 0;

    noteResults.forEach((nr) => {
      if (nr.averagePitchError) {
        if (Math.abs(nr.averagePitchError) > 30) {
          unstableCount++;
        }
        if (nr.averagePitchError > 10) {
          sharpCount++;
        } else if (nr.averagePitchError < -10) {
          flatCount++;
        }
      }
    });

    // Identify problem notes
    const problemNotes = failedNotes
      .map((nr) => ({
        note: nr.targetNote,
        avgError: nr.averagePitchError || 0,
      }))
      .slice(0, 3); // Top 3 problem notes

    // Build context for the AI
    const contextPrompt = `You are an expert vocal coach analyzing a singing practice session. The student just completed the "${exerciseName}" exercise.

**Performance Summary:**
- Total notes attempted: ${totalNotes}
- Successfully sung: ${successfulNotes} (${overallAccuracy.toFixed(1)}% accuracy)
- Missed notes: ${totalNotes - successfulNotes}
- Exercise duration: ${Math.round(exerciseDuration / 1000)} seconds

**Pitch Tendency Analysis:**
- Notes sung sharp (too high): ${sharpCount}
- Notes sung flat (too low): ${flatCount}
- Unstable pitch (wobbly): ${unstableCount}

${problemNotes.length > 0 ? `**Problem Notes:**
${problemNotes.map((pn) => `- ${pn.note}: ${pn.avgError > 0 ? 'sharp by' : 'flat by'} ${Math.abs(pn.avgError).toFixed(0)} cents`).join('\n')}` : ''}

**Task:**
Provide personalized, encouraging coaching feedback in the following JSON format:

{
  "summary": "1-2 sentence overall assessment of the performance",
  "strengths": ["2-3 specific things they did well"],
  "areasToImprove": ["2-3 specific areas that need work"],
  "specificTips": ["2-3 actionable vocal technique tips based on their pitch patterns"],
  "encouragement": "1 motivating sentence to keep them practicing",
  "nextSteps": "Recommend what exercise or focus area to work on next"
}

**Guidelines:**
- Be specific about vocal technique (breath support, throat relaxation, resonance, etc.)
- Reference actual pitch patterns you see (sharp tendency, flat tendency, stability issues)
- Keep language simple and encouraging
- Provide actionable advice, not generic platitudes
- Tailor advice to the specific exercise type
- Use proper vocal pedagogy terminology when helpful but explain it simply`;

    // Call Claude API
    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast and cost-effective
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
    });

    // Parse response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const feedback: VocalCoachFeedback = JSON.parse(jsonText);

    return feedback;
  } catch (error) {
    console.error('Error generating vocal coach feedback:', error);

    // Fallback feedback if API fails
    return generateFallbackFeedback(exerciseName, overallAccuracy, noteResults);
  }
}

/**
 * Generates basic fallback feedback when AI is unavailable
 */
function generateFallbackFeedback(
  exerciseName: string,
  overallAccuracy: number,
  noteResults: NoteResult[]
): VocalCoachFeedback {
  const successRate = overallAccuracy;

  let summary = '';
  let encouragement = '';

  if (successRate >= 90) {
    summary = 'Excellent performance! Your pitch accuracy is outstanding.';
    encouragement = 'You\'re ready to take on more challenging exercises!';
  } else if (successRate >= 75) {
    summary = 'Good work! Your pitch control is developing nicely.';
    encouragement = 'Keep practicing consistently and you\'ll master this!';
  } else if (successRate >= 60) {
    summary = 'Solid effort. You\'re making progress, with some areas to refine.';
    encouragement = 'Stay focused on the fundamentals and you\'ll see improvement!';
  } else {
    summary = 'This is challenging, but you\'re building the foundation.';
    encouragement = 'Every practice session makes you stronger - keep going!';
  }

  return {
    summary,
    strengths: [
      'You completed the full exercise',
      'You\'re building vocal awareness',
    ],
    areasToImprove: [
      'Focus on consistent pitch accuracy',
      'Work on breath control and support',
    ],
    specificTips: [
      'Try placing your hand on your diaphragm to feel proper breathing',
      'Listen carefully to the target pitch before singing',
      'Maintain relaxed throat and jaw while singing',
    ],
    encouragement,
    nextSteps: 'Practice this exercise daily for a week, then try increasing difficulty.',
  };
}

/**
 * Check if API key is configured
 */
export function isVocalCoachAvailable(): boolean {
  return !!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
}
