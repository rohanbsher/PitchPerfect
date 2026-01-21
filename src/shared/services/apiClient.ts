/**
 * API Client for PitchPerfect Backend
 * Handles authentication, request/response formatting, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const API_VERSION = 'v1';

// Storage keys
const TOKEN_KEY = '@PitchPerfect:authToken';
const USER_ID_KEY = '@PitchPerfect:userId';
const DEVICE_ID_KEY = '@PitchPerfect:deviceId';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthData {
  userId: string;
  token: string;
  expiresAt: string;
}

// Generate a unique device ID
async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Get stored auth token
async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// Store auth data
async function storeAuthData(data: AuthData): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, data.token),
    AsyncStorage.setItem(USER_ID_KEY, data.userId),
  ]);
}

// Clear auth data
async function clearAuthData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_ID_KEY),
  ]);
}

/**
 * Register a new anonymous user (or refresh existing token)
 */
async function authenticate(): Promise<AuthData> {
  const deviceId = await getOrCreateDeviceId();
  const existingToken = await getAuthToken();

  // Try to refresh if we have an existing token
  if (existingToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${existingToken}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      if (response.ok) {
        const result: ApiResponse<AuthData> = await response.json();
        if (result.success && result.data) {
          await storeAuthData(result.data);
          return result.data;
        }
      }
    } catch (error) {
      console.warn('[API] Token refresh failed, will register new user');
    }
  }

  // Register new user
  const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with API');
  }

  const result: ApiResponse<AuthData> = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Authentication failed');
  }

  await storeAuthData(result.data);
  return result.data;
}

/**
 * Make an authenticated API request
 */
async function request<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    timeout?: number;
  } = {}
): Promise<T> {
  const { method = 'GET', body, timeout = 15000 } = options;

  // Ensure we have a valid token
  let token = await getAuthToken();
  if (!token) {
    const authData = await authenticate();
    token = authData.token;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}/api/${API_VERSION}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401 - re-authenticate and retry once
    if (response.status === 401) {
      await clearAuthData();
      const authData = await authenticate();
      token = authData.token;

      const retryResponse = await fetch(`${API_BASE_URL}/api/${API_VERSION}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const retryResult: ApiResponse<T> = await retryResponse.json();
      if (!retryResult.success) {
        throw new Error(retryResult.message || 'Request failed');
      }
      return retryResult.data as T;
    }

    // Handle rate limiting
    if (response.status === 429) {
      const result = await response.json();
      throw new Error(result.message || 'Rate limit exceeded');
    }

    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Request failed');
    }

    return result.data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// ==================== AI Endpoints ====================

export interface CoachingTipRequest {
  consecutiveLowScores: number;
  currentAccuracy: number;
  targetNote: string;
  userRange: { lowest: string; highest: string };
}

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

export interface RecommendationRequest {
  recentSessions: SessionRecord[];
  userVocalRange: { lowest: string; highest: string };
}

export interface RecommendationResponse {
  exerciseName: string;
  reason: string;
}

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

export interface RangeSafetyRequest {
  targetNote: string;
  targetFrequency: number;
  comfortableRange: { lowest: string; highest: string };
  currentAccuracy: number;
}

/**
 * Get real-time coaching tip
 */
export async function getCoachingTip(data: CoachingTipRequest): Promise<string | null> {
  try {
    const result = await request<{ tip: string }>('/ai/coaching', {
      method: 'POST',
      body: data,
    });
    return result.tip;
  } catch (error) {
    console.warn('[API] Coaching tip failed:', error);
    return null;
  }
}

/**
 * Voice assistant conversation
 */
export async function conversation(data: ConversationRequest): Promise<string> {
  const result = await request<{ response: string }>('/ai/conversation', {
    method: 'POST',
    body: data,
    timeout: 15000,
  });
  return result.response;
}

/**
 * Get post-session feedback
 */
export async function getSessionFeedback(data: FeedbackRequest): Promise<FeedbackResponse | null> {
  try {
    return await request<FeedbackResponse>('/ai/feedback', {
      method: 'POST',
      body: data,
    });
  } catch (error) {
    console.warn('[API] Session feedback failed:', error);
    return null;
  }
}

/**
 * Get exercise recommendation
 */
export async function getExerciseRecommendation(
  data: RecommendationRequest
): Promise<RecommendationResponse | null> {
  try {
    return await request<RecommendationResponse>('/ai/recommendation', {
      method: 'POST',
      body: data,
    });
  } catch (error) {
    console.warn('[API] Recommendation failed:', error);
    return null;
  }
}

/**
 * Get vocal range analysis
 */
export async function getRangeAnalysis(
  data: RangeAnalysisRequest
): Promise<RangeAnalysisResponse | null> {
  try {
    return await request<RangeAnalysisResponse>('/ai/range-analysis', {
      method: 'POST',
      body: data,
    });
  } catch (error) {
    console.warn('[API] Range analysis failed:', error);
    return null;
  }
}

/**
 * Get range safety coaching
 */
export async function getRangeSafetyCoaching(data: RangeSafetyRequest): Promise<string | null> {
  try {
    const result = await request<{ tip: string }>('/ai/range-safety', {
      method: 'POST',
      body: data,
    });
    return result.tip;
  } catch (error) {
    console.warn('[API] Range safety failed:', error);
    return null;
  }
}

// ==================== TTS Endpoints ====================

export type VoiceId = 'rachel' | 'josh' | 'bella' | 'elli' | 'sam';

export interface TTSRequest {
  text: string;
  voice?: VoiceId;
}

export interface TTSStatus {
  available: boolean;
  voices: Record<string, string>;
}

/**
 * Get TTS service status
 */
export async function getTTSStatus(): Promise<TTSStatus> {
  try {
    return await request<TTSStatus>('/tts/status', { method: 'GET' });
  } catch (error) {
    return { available: false, voices: {} };
  }
}

/**
 * Generate speech from text
 * Returns base64 encoded audio data
 */
export async function generateSpeech(
  data: TTSRequest
): Promise<{ audio: string; contentType: string } | null> {
  try {
    return await request<{ audio: string; contentType: string }>('/tts/speak', {
      method: 'POST',
      body: data,
      timeout: 30000,
    });
  } catch (error) {
    console.warn('[API] TTS failed:', error);
    return null;
  }
}

// Export API client
export const apiClient = {
  authenticate,
  getCoachingTip,
  conversation,
  getSessionFeedback,
  getExerciseRecommendation,
  getRangeAnalysis,
  getRangeSafetyCoaching,
  getTTSStatus,
  generateSpeech,
};
