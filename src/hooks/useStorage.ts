/**
 * Storage Hook
 *
 * React hook for accessing user progress, settings, and session management.
 * Provides a clean interface to the storage service.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserProgress,
  saveUserProgress,
  saveSession,
  getUserStats,
  getUserSettings,
  saveUserSettings,
  updateSetting,
} from '../services/storage';
import {
  UserProgress,
  UserSettings,
  SessionRecord,
  UserStats,
} from '../types/userProgress';

// Hook return type
export interface UseStorageReturn {
  // Progress data
  progress: UserProgress | null;
  stats: UserStats | null;
  settings: UserSettings | null;

  // Loading states
  isLoading: boolean;
  isLoadingProgress: boolean;
  isLoadingSettings: boolean;

  // Actions
  saveSession: (session: SessionRecord) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refreshProgress: () => Promise<void>;
  refreshStats: () => Promise<void>;

  // Data getters for AI
  getSessions: () => Promise<SessionRecord[]>;
  getVocalRange: () => Promise<import('../types/userProgress').VocalRange | null>;
}

/**
 * Main storage hook
 */
export function useStorage(): UseStorageReturn {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load progress and settings in parallel
      const [loadedProgress, loadedSettings, loadedStats] = await Promise.all([
        getUserProgress(),
        getUserSettings(),
        getUserStats(),
      ]);

      setProgress(loadedProgress);
      setSettings(loadedSettings);
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to load initial storage data:', error);
    } finally {
      setIsLoadingProgress(false);
      setIsLoadingSettings(false);
    }
  };

  // Save a new session
  const handleSaveSession = useCallback(async (session: SessionRecord) => {
    try {
      await saveSession(session);

      // Refresh progress and stats after saving
      const [newProgress, newStats] = await Promise.all([
        getUserProgress(),
        getUserStats(),
      ]);

      setProgress(newProgress);
      setStats(newStats);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }, []);

  // Update settings
  const handleUpdateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      await saveUserSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }, [settings]);

  // Refresh progress manually
  const refreshProgress = useCallback(async () => {
    try {
      setIsLoadingProgress(true);
      const newProgress = await getUserProgress();
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  }, []);

  // Refresh stats manually
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await getUserStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  }, []);

  // Get sessions for AI
  const getSessions = useCallback(async () => {
    const currentProgress = await getUserProgress();
    return currentProgress.sessionHistory;
  }, []);

  // Get vocal range for AI
  const getVocalRange = useCallback(async () => {
    const currentProgress = await getUserProgress();
    return currentProgress.vocalRange;
  }, []);

  return {
    progress,
    stats,
    settings,
    isLoading: isLoadingProgress || isLoadingSettings,
    isLoadingProgress,
    isLoadingSettings,
    saveSession: handleSaveSession,
    updateSettings: handleUpdateSettings,
    refreshProgress,
    refreshStats,
    getSessions,
    getVocalRange,
  };
}

/**
 * Hook for just accessing user stats (lighter weight)
 */
export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const loadedStats = await getUserStats();
      setStats(loadedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    const newStats = await getUserStats();
    setStats(newStats);
  }, []);

  return { stats, isLoading, refresh };
}

/**
 * Hook for just accessing user settings
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await getUserSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const update = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    await saveUserSettings(updatedSettings);
    setSettings(updatedSettings);
  }, [settings]);

  return { settings, isLoading, update };
}

/**
 * Hook for checking if onboarding is complete
 */
export function useOnboardingStatus() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const settings = await getUserSettings();
      setHasCompletedOnboarding(settings.hasCompletedOnboarding);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = useCallback(async () => {
    await updateSetting('hasCompletedOnboarding', true);
    await updateSetting('onboardingCompletedDate', new Date().toISOString());
    setHasCompletedOnboarding(true);
  }, []);

  return { hasCompletedOnboarding, isLoading, completeOnboarding };
}
