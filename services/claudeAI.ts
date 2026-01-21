/**
 * Claude AI Service - Secure Backend Proxy Version
 *
 * All API calls are now routed through the secure backend proxy.
 * No API keys are stored client-side.
 */

import {
  apiClient,
  type ConversationRequest,
  type ConversationMessage,
  type FeedbackResponse,
  type RecommendationResponse,
  type RangeAnalysisResponse,
} from '../src/shared/services/apiClient';
import { NoteAttempt, SessionRecord } from '../src/types/userProgress';
import { RangeAnalysisResult } from '../src/services/rangeAnalysis';

// Rate limiting to prevent excessive API calls (client-side throttle)
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

/**
 * Generate real-time coaching tip during exercise
 */
export async function generateRealTimeCoachingTip(
  consecutiveLowScores: number,
  currentAccuracy: number,
  targetNote: string,
  userRange: { lowest: string; highest: string }
): Promise<string | null> {
  if (!canMakeAPICall()) {
    return null;
  }

  return apiClient.getCoachingTip({
    consecutiveLowScores,
    currentAccuracy,
    targetNote,
    userRange,
  });
}

/**
 * Generate post-session feedback with technique tips and recommendations
 */
export async function generatePostSessionFeedback(
  sessionRecord: SessionRecord,
  recentSessions: SessionRecord[]
): Promise<FeedbackResponse | null> {
  // Transform SessionRecord to match API format
  const apiSessionRecord = {
    id: sessionRecord.id,
    date: sessionRecord.date,
    exerciseId: sessionRecord.exerciseId,
    exerciseName: sessionRecord.exerciseName,
    duration: sessionRecord.duration,
    accuracy: sessionRecord.accuracy,
    notesAttempted: sessionRecord.notesAttempted,
    notesHit: sessionRecord.notesHit,
    lowestNote: sessionRecord.lowestNote,
    highestNote: sessionRecord.highestNote,
    noteAttempts: sessionRecord.noteAttempts.map((n: NoteAttempt) => ({
      targetFrequency: n.targetFrequency,
      actualFrequency: n.actualFrequency,
      accuracy: n.accuracy,
      timestamp: n.timestamp,
    })),
  };

  const apiRecentSessions = recentSessions.map((s) => ({
    id: s.id,
    date: s.date,
    exerciseId: s.exerciseId,
    exerciseName: s.exerciseName,
    duration: s.duration,
    accuracy: s.accuracy,
    notesAttempted: s.notesAttempted,
    notesHit: s.notesHit,
    lowestNote: s.lowestNote,
    highestNote: s.highestNote,
    noteAttempts: s.noteAttempts.map((n: NoteAttempt) => ({
      targetFrequency: n.targetFrequency,
      actualFrequency: n.actualFrequency,
      accuracy: n.accuracy,
      timestamp: n.timestamp,
    })),
  }));

  return apiClient.getSessionFeedback({
    sessionRecord: apiSessionRecord,
    recentSessions: apiRecentSessions,
  });
}

/**
 * Get next exercise recommendation based on user's performance history
 */
export async function getNextExerciseRecommendation(
  recentSessions: SessionRecord[],
  userVocalRange: { lowest: string; highest: string }
): Promise<RecommendationResponse | null> {
  const apiRecentSessions = recentSessions.map((s) => ({
    id: s.id,
    date: s.date,
    exerciseId: s.exerciseId,
    exerciseName: s.exerciseName,
    duration: s.duration,
    accuracy: s.accuracy,
    notesAttempted: s.notesAttempted,
    notesHit: s.notesHit,
    lowestNote: s.lowestNote,
    highestNote: s.highestNote,
    noteAttempts: s.noteAttempts.map((n: NoteAttempt) => ({
      targetFrequency: n.targetFrequency,
      actualFrequency: n.actualFrequency,
      accuracy: n.accuracy,
      timestamp: n.timestamp,
    })),
  }));

  return apiClient.getExerciseRecommendation({
    recentSessions: apiRecentSessions,
    userVocalRange,
  });
}

/**
 * Generate comprehensive AI-powered vocal range analysis report
 */
export async function generateRangeAnalysisReport(
  rangeAnalysis: RangeAnalysisResult,
  recentSessions: SessionRecord[]
): Promise<RangeAnalysisResponse | null> {
  const apiRecentSessions = recentSessions.map((s) => ({
    id: s.id,
    date: s.date,
    exerciseId: s.exerciseId,
    exerciseName: s.exerciseName,
    duration: s.duration,
    accuracy: s.accuracy,
    notesAttempted: s.notesAttempted,
    notesHit: s.notesHit,
    lowestNote: s.lowestNote,
    highestNote: s.highestNote,
    noteAttempts: s.noteAttempts.map((n: NoteAttempt) => ({
      targetFrequency: n.targetFrequency,
      actualFrequency: n.actualFrequency,
      accuracy: n.accuracy,
      timestamp: n.timestamp,
    })),
  }));

  return apiClient.getRangeAnalysis({
    rangeAnalysis: {
      currentRange: rangeAnalysis.currentRange,
      comfortableRange: rangeAnalysis.comfortableRange,
      strongestNote: rangeAnalysis.strongestNote,
      expansion: rangeAnalysis.expansion,
      weaknesses: rangeAnalysis.weaknesses,
      extendedRange: rangeAnalysis.extendedRange,
    },
    recentSessions: apiRecentSessions,
  });
}

/**
 * Generate real-time range safety coaching (warn if pushing too hard)
 */
export async function generateRangeSafetyCoaching(
  targetNote: string,
  targetFrequency: number,
  comfortableRange: { lowest: string; highest: string },
  currentAccuracy: number
): Promise<string | null> {
  if (!canMakeAPICall()) {
    return null;
  }

  return apiClient.getRangeSafetyCoaching({
    targetNote,
    targetFrequency,
    comfortableRange,
    currentAccuracy,
  });
}

// ========== VOICE ASSISTANT CONVERSATION ==========

// Re-export types for backwards compatibility
export type { ConversationMessage };

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

/**
 * Voice assistant conversation with Claude
 * Used for complex queries that require AI understanding
 */
export async function claudeConversation(context: ConversationContext): Promise<string> {
  return apiClient.conversation(context);
}
