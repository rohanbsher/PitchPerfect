/**
 * User Progress Type Definitions
 *
 * Defines all types for tracking user progress, sessions, and settings.
 */

// Individual note attempt during an exercise
export interface NoteAttempt {
  note: string;              // e.g., "C4"
  targetFrequency: number;   // Hz
  actualFrequency: number;   // Hz (average of samples)
  accuracy: number;          // 0-100
  duration: number;          // seconds
  timestamp: number;         // Unix timestamp
}

// Single practice session record
export interface SessionRecord {
  id: string;                     // UUID
  date: string;                   // ISO date string
  exerciseId: string;             // e.g., "warmup_scale"
  exerciseName: string;           // e.g., "Warm-up Scale"
  workoutId?: string;             // Optional workout ID if part of workout
  duration: number;               // seconds
  accuracy: number;               // 0-100 (overall)
  notesAttempted: number;         // Total notes in exercise
  notesHit: number;               // Notes with >70% accuracy
  noteAttempts: NoteAttempt[];    // Detailed per-note data
  lowestNote?: string;            // Lowest note sung in session
  highestNote?: string;           // Highest note sung in session
}

// Streak tracking
export interface StreakData {
  current: number;                // Current streak (days)
  longest: number;                // Longest streak ever
  lastPracticeDate: string;       // ISO date string
}

// Vocal range tracking
export interface VocalRange {
  lowest: string;                 // e.g., "C3"
  lowestFrequency: number;        // Hz
  highest: string;                // e.g., "G5"
  highestFrequency: number;       // Hz
  comfortableLow: string;         // Comfortable lower limit
  comfortableHigh: string;        // Comfortable upper limit
  lastUpdated: string;            // ISO date string
}

// User's overall progress
export interface UserProgress {
  streak: StreakData;
  totalSessions: number;
  totalPracticeTime: number;      // seconds
  sessionHistory: SessionRecord[];
  vocalRange: VocalRange;
  averageAccuracy: number;        // 0-100
  exercisesCompleted: string[];   // Exercise IDs completed at least once
  favoritesExercises: string[];   // User-marked favorites
  lastSessionDate?: string;       // ISO date string
}

// User settings
export interface UserSettings {
  // Audio
  pianoVolume: number;            // 0-100
  voiceVolume: number;            // 0-100

  // Display
  showNoteLabels: boolean;
  showCents: boolean;
  theme: 'dark' | 'light';

  // Notifications
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;      // HH:MM format

  // Account
  userName: string;
  userGoal: 'accuracy' | 'range' | 'daily_practice';

  // Onboarding
  hasCompletedOnboarding: boolean;
  onboardingCompletedDate?: string;
}

// Stats for display
export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalPracticeTime: number;      // seconds
  averageAccuracy: number;
  sessionsThisWeek: number;
  practiceTimeThisWeek: number;   // seconds
  improvementRate: number;        // Percentage change in accuracy over last 7 days
}

// AI Coach feedback
export interface AIFeedback {
  sessionId: string;
  feedback: string;               // Main feedback message
  techniqueTip?: string;          // Specific technique suggestion
  recommendedExercise?: string;   // Exercise ID
  strengths: string[];            // What user did well
  improvements: string[];         // Areas to work on
  generatedAt: string;            // ISO date string
}

// Daily tip cache
export interface DailyTip {
  tip: string;
  date: string;                   // ISO date string
  category: 'breathing' | 'technique' | 'practice' | 'motivation';
}
