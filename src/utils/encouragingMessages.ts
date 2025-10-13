/**
 * Encouraging Message Generator
 * Turns cold numbers into warm, actionable feedback that motivates users
 * Based on UX research: encouragement > accuracy for vocal training
 */

import { ExerciseResults } from '../data/models';

export interface EncouragingMessage {
  title: string;           // "AMAZING!" "GREAT JOB!" "NICE WORK!"
  subtitle: string;        // Specific praise for what they did well
  improvement?: string;    // Gentle, actionable suggestion (not criticism)
  emoji: string;          // Visual celebration
}

/**
 * Generate encouraging message based on exercise results
 * Uses positive psychology principles:
 * - Lead with praise (even for low scores)
 * - Be specific about what worked
 * - Frame improvements as opportunities, not failures
 */
export function generateEncouragingMessage(results: ExerciseResults): EncouragingMessage {
  const accuracy = results.overallAccuracy;
  const strengths = results.strengths;
  const improvements = results.improvements;
  const noteResults = results.noteResults;

  // Find best performed notes
  const bestNotes = noteResults
    .filter(n => n.passed)
    .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
    .slice(0, 3)
    .map(n => n.noteExpected);

  // Find notes that need work
  const challengingNotes = noteResults
    .filter(n => !n.passed)
    .map(n => n.noteExpected);

  // Determine message tier based on accuracy
  if (accuracy >= 90) {
    return {
      title: "INCREDIBLE! 🌟",
      subtitle: bestNotes.length > 0
        ? `You absolutely nailed ${bestNotes.join(', ')}! Your pitch control is outstanding.`
        : "Your pitch accuracy is phenomenal! You're singing like a pro.",
      emoji: "🎉",
    };
  }

  if (accuracy >= 80) {
    return {
      title: "AMAZING! 🎵",
      subtitle: bestNotes.length > 0
        ? `You crushed ${bestNotes.join(', ')}! Your vocal control is really coming together.`
        : "You're hitting most notes right on target! Keep up this momentum.",
      improvement: challengingNotes.length > 0
        ? `Try sustaining ${challengingNotes[0]} a bit longer next time - you're almost there!`
        : undefined,
      emoji: "✨",
    };
  }

  if (accuracy >= 70) {
    return {
      title: "GREAT PROGRESS! 💪",
      subtitle: bestNotes.length > 0
        ? `You hit ${bestNotes.join(' and ')} beautifully! That's exactly the technique we want.`
        : "You're developing solid pitch awareness. Each practice is making you stronger!",
      improvement: challengingNotes.length > 0
        ? `${challengingNotes[0]} is just slightly off - take a deep breath and you'll nail it!`
        : "Try slowing down a bit on the challenging notes. Accuracy beats speed!",
      emoji: "🎯",
    };
  }

  if (accuracy >= 60) {
    return {
      title: "NICE WORK! 🎤",
      subtitle: bestNotes.length > 0
        ? `You nailed ${bestNotes[0]}! That shows you have the ability - let's build on it.`
        : "You're on the right track! Your ear is starting to lock in on the pitches.",
      improvement: challengingNotes.length > 0
        ? `Focus on listening to ${challengingNotes[0]} from the piano first, then match it. You've got this!`
        : "Remember: match the piano note first, then add your voice. That's the secret!",
      emoji: "🌱",
    };
  }

  // Even for scores below 60%, we lead with encouragement
  return {
    title: "KEEP GOING! 🚀",
    subtitle: "Every singer starts here! You showed up and practiced - that's what matters most.",
    improvement: challengingNotes.length > 0
      ? `Let's work on ${challengingNotes[0]} together. Try humming it first to find the pitch.`
      : "Pro tip: Hum the note first to find the pitch, then open up to 'ah'. This builds muscle memory!",
    emoji: "💫",
  };
}

/**
 * Get a random celebration message for completing an exercise
 * Used for instant gratification when user finishes (regardless of score)
 */
export function getCompletionCelebration(): string {
  const messages = [
    "You did it! 🎉",
    "Exercise complete! ⭐",
    "Way to finish strong! 💪",
    "You showed up! That's what counts! 🌟",
    "Another step forward! 🎵",
    "Practice makes progress! ✨",
    "You're building your voice! 🎤",
    "Consistency is key - and you're here! 🔥",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get encouraging message for when user struggles mid-exercise
 * Prevents frustration from causing early exits
 */
export function getInProgressEncouragement(attemptNumber: number): string {
  if (attemptNumber <= 3) {
    return "Take your time - you're doing great! 🎵";
  } else if (attemptNumber <= 5) {
    return "Remember to breathe and relax - you've got this! 💨";
  } else {
    return "Every singer faces challenges - keep pushing! 💪";
  }
}

/**
 * Generate personalized improvement tip based on weak areas
 * Actionable, specific, and encouraging
 */
export function generateImprovementTip(results: ExerciseResults): string {
  const weakNotes = results.noteResults
    .filter(n => !n.passed)
    .sort((a, b) => a.averageAccuracy - b.averageAccuracy);

  if (weakNotes.length === 0) {
    return "Try a more challenging exercise to keep growing! 🌟";
  }

  const weakestNote = weakNotes[0];
  const accuracy = weakestNote.averageAccuracy;

  if (accuracy < 50) {
    return `${weakestNote.noteExpected} needs attention. Try practicing it slowly with a piano app first! 🎹`;
  } else if (accuracy < 70) {
    return `You're close on ${weakestNote.noteExpected}! Record yourself to hear the difference. 🎙️`;
  } else {
    return `${weakestNote.noteExpected} is almost there - just needs a bit more practice! 🎯`;
  }
}

/**
 * Milestone messages for long-term motivation
 * Triggered by achievements/progress tracking
 */
export const MilestoneMessages = {
  firstExercise: {
    title: "Welcome to Your Vocal Journey! 🎤",
    message: "You just completed your first exercise! Every great singer started exactly where you are now.",
  },
  fiveDayStreak: {
    title: "5-Day Streak! 🔥",
    message: "You're building a habit! Consistent practice is the #1 predictor of vocal improvement.",
  },
  tenExercises: {
    title: "10 Exercises Complete! 🌟",
    message: "You've put in serious work! Your voice is already stronger than when you started.",
  },
  firstPerfectScore: {
    title: "100% Perfect! 🎉",
    message: "You just hit every note flawlessly! This is what all that practice was for!",
  },
  unlockIntermediate: {
    title: "Unlocked: Intermediate Exercises! 🚀",
    message: "You've mastered the basics! Time to challenge yourself with more complex patterns.",
  },
};
