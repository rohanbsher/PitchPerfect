/**
 * Home Screen
 *
 * Main landing screen showing streak, stats, and quick actions.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/AppNavigator';
import { useStorage } from '../hooks/useStorage';
import { getNextExerciseRecommendation } from '../../services/claudeAI';
import { colors, borderRadius, opacity } from '../theme';

type NavigationProp = BottomTabNavigationProp<TabParamList>;

// Format seconds to mm:ss or hh:mm
const formatTime = (seconds: number): string => {
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

// Get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { stats, isLoading, refreshStats, getSessions, getVocalRange } = useStorage();
  const hasAnimatedRef = useRef(false);

  // AI Recommendation state
  const [recommendation, setRecommendation] = useState<{
    exerciseName: string;
    reason: string;
  } | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Animation values
  const fireScale = useSharedValue(1);
  const streakScale = useSharedValue(0.8);
  const streakOpacity = useSharedValue(0);

  useEffect(() => {
    // Refresh stats when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      refreshStats();
      loadRecommendation();
    });
    return unsubscribe;
  }, [navigation, refreshStats]);

  // Load AI exercise recommendation
  const loadRecommendation = async () => {
    if (loadingRecommendation) return;

    try {
      setLoadingRecommendation(true);
      setRecommendationError(null); // Clear previous errors

      const sessions = await getSessions();
      // Only show recommendations if user has completed at least 3 sessions
      if (sessions.length < 3) {
        setLoadingRecommendation(false);
        return;
      }

      const vocalRange = await getVocalRange();
      if (!vocalRange) {
        setLoadingRecommendation(false);
        return; // Need vocal range data
      }

      const recentSessions = sessions.slice(0, 10); // Last 10 sessions

      const rec = await getNextExerciseRecommendation(recentSessions, vocalRange);
      if (rec) {
        setRecommendation(rec);
        setRecommendationError(null); // Success - clear error
      } else {
        // API returned null (rate limited or other issue)
        setRecommendationError('Unable to generate recommendation');
      }
    } catch (error) {
      console.error('Failed to load recommendation:', error);
      setRecommendationError('Failed to load AI recommendation');
      setRecommendation(null); // Clear stale recommendation on error
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Animate streak on first load when stats arrive
  useEffect(() => {
    if (stats && !hasAnimatedRef.current) {
      hasAnimatedRef.current = true;

      // Pop in the streak number
      streakScale.value = withSpring(1, { damping: 8, stiffness: 150 });
      streakOpacity.value = withTiming(1, { duration: 300 });

      // Animate fire emoji with a pulse
      if (stats.currentStreak > 0) {
        fireScale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // Infinite
          true
        );
      }
    }
  }, [stats]);

  // Animated styles
  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const streakAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: streakScale.value }],
    opacity: streakOpacity.value,
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleStartPractice = () => {
    navigation.navigate('Practice');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>PitchPerfect</Text>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Animated.View style={[styles.streakIconContainer, fireAnimatedStyle]}>
              <Ionicons name="flame" size={32} color={colors.flame} />
            </Animated.View>
            <Animated.View style={[styles.streakInfo, streakAnimatedStyle]}>
              <Text style={styles.streakNumber}>
                {stats?.currentStreak || 0}
              </Text>
              <Text style={styles.streakLabel}>
                day{(stats?.currentStreak || 0) !== 1 ? 's' : ''} streak
              </Text>
            </Animated.View>
          </View>
          {stats && stats.longestStreak > 0 && (
            <Text style={styles.bestStreak}>
              Best: {stats.longestStreak} days
            </Text>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats?.totalSessions || 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {formatTime(stats?.totalPracticeTime || 0)}
            </Text>
            <Text style={styles.statLabel}>Practice Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {stats?.averageAccuracy || 0}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        {/* AI Recommendation Loading */}
        {loadingRecommendation && !recommendation && (
          <View style={styles.recommendationLoading}>
            <ActivityIndicator size="small" color={colors.purple} />
            <Text style={styles.recommendationLoadingText}>Getting AI recommendation...</Text>
          </View>
        )}

        {/* AI Exercise Recommendation */}
        {recommendation && !recommendationError && !loadingRecommendation && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.recommendationBanner}
          >
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationIconContainer}>
                <Ionicons name="radio-button-on" size={24} color={colors.purple} />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle}>Recommended for You</Text>
                <Text style={styles.recommendationExercise}>{recommendation.exerciseName}</Text>
                <Text style={styles.recommendationReason}>{recommendation.reason}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* AI Recommendation Error */}
        {recommendationError && !loadingRecommendation && (
          <View style={styles.recommendationError}>
            <Text style={styles.recommendationErrorText}>{recommendationError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadRecommendation}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start Practice Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartPractice}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={24} color={colors.textPrimary} style={styles.startButtonIcon} />
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>

        {/* This Week Stats */}
        {stats && stats.sessionsThisWeek > 0 && (
          <View style={styles.weeklyCard}>
            <Text style={styles.weeklyTitle}>This Week</Text>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyNumber}>{stats.sessionsThisWeek}</Text>
                <Text style={styles.weeklyLabel}>sessions</Text>
              </View>
              <View style={styles.weeklyDivider} />
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyNumber}>
                  {formatTime(stats.practiceTimeThisWeek)}
                </Text>
                <Text style={styles.weeklyLabel}>practice time</Text>
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {(!stats || stats.totalSessions === 0) && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="musical-notes" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Ready to begin?</Text>
            <Text style={styles.emptySubtitle}>
              Start your first practice session and track your progress!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  streakCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: opacity.warning15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  streakLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: -4,
  },
  bestStreak: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  recommendationBanner: {
    backgroundColor: opacity.purple15,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.purple,
    padding: 16,
    marginBottom: 24,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: opacity.purple20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.purple,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  recommendationExercise: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  recommendationReason: {
    fontSize: 14,
    color: opacity.white80,
    lineHeight: 20,
  },
  recommendationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: opacity.purple10,
    borderRadius: borderRadius.md,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  recommendationLoadingText: {
    fontSize: 14,
    color: colors.purple,
    fontWeight: '500',
  },
  recommendationError: {
    backgroundColor: opacity.error10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  recommendationErrorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  startButtonIcon: {
    marginRight: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  weeklyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  weeklyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
  },
  weeklyNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  weeklyLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  weeklyDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: opacity.primary10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
