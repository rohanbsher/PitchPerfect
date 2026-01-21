/**
 * Progress Store
 *
 * Zustand store for managing user progress and statistics.
 * Caches frequently accessed data to avoid repeated AsyncStorage reads.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { UserProgress, UserStats, VocalRange, SessionRecord } from '../types/userProgress';
import { getUserProgress, getUserStats, saveUserProgress } from '../services/storage';

// Progress store state
export interface ProgressState {
  // Cached user data
  progress: UserProgress | null;
  stats: UserStats | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Last refresh timestamp
  lastRefresh: number;

  // Actions
  loadProgress: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateVocalRange: (range: VocalRange) => Promise<void>;
  addSession: (session: SessionRecord) => void;
  invalidateCache: () => void;
}

// Cache TTL (1 minute)
const CACHE_TTL = 60 * 1000;

export const useProgressStore = create<ProgressState>()(
  subscribeWithSelector((set, get) => ({
    progress: null,
    stats: null,
    isLoading: false,
    isRefreshing: false,
    lastRefresh: 0,

    loadProgress: async () => {
      const state = get();

      // Check if cache is still valid
      const now = Date.now();
      if (state.progress && now - state.lastRefresh < CACHE_TTL) {
        return;
      }

      set({ isLoading: true });

      try {
        const [progress, stats] = await Promise.all([getUserProgress(), getUserStats()]);

        set({
          progress,
          stats,
          isLoading: false,
          lastRefresh: now,
        });
      } catch (error) {
        console.error('[ProgressStore] Failed to load progress:', error);
        set({ isLoading: false });
      }
    },

    refreshStats: async () => {
      set({ isRefreshing: true });

      try {
        const [progress, stats] = await Promise.all([getUserProgress(), getUserStats()]);

        set({
          progress,
          stats,
          isRefreshing: false,
          lastRefresh: Date.now(),
        });
      } catch (error) {
        console.error('[ProgressStore] Failed to refresh stats:', error);
        set({ isRefreshing: false });
      }
    },

    updateVocalRange: async (range) => {
      const { progress } = get();
      if (!progress) return;

      const updatedProgress = {
        ...progress,
        vocalRange: range,
      };

      set({ progress: updatedProgress });

      try {
        await saveUserProgress(updatedProgress);
      } catch (error) {
        console.error('[ProgressStore] Failed to save vocal range:', error);
      }
    },

    addSession: (session) => {
      const { progress, stats } = get();
      if (!progress || !stats) return;

      // Optimistically update local state
      const updatedProgress = {
        ...progress,
        sessionHistory: [session, ...progress.sessionHistory].slice(0, 50),
        totalSessions: progress.totalSessions + 1,
        totalPracticeTime: progress.totalPracticeTime + session.duration,
      };

      const updatedStats = {
        ...stats,
        totalSessions: stats.totalSessions + 1,
        totalPracticeTime: stats.totalPracticeTime + session.duration,
      };

      set({
        progress: updatedProgress,
        stats: updatedStats,
      });
    },

    invalidateCache: () => {
      set({ lastRefresh: 0 });
    },
  }))
);

// Selector hooks
export const useProgress = () => useProgressStore((state) => state.progress);
export const useStats = () => useProgressStore((state) => state.stats);
export const useStreak = () =>
  useProgressStore((state) => ({
    current: state.progress?.streak.current ?? 0,
    longest: state.progress?.streak.longest ?? 0,
  }));
export const useVocalRange = () => useProgressStore((state) => state.progress?.vocalRange);
export const useRecentSessions = () =>
  useProgressStore((state) => state.progress?.sessionHistory.slice(0, 10) ?? []);
export const useIsLoadingProgress = () => useProgressStore((state) => state.isLoading);
