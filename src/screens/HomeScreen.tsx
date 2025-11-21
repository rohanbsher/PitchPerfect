/**
 * Home Screen
 *
 * Main landing screen showing streak, stats, and quick actions.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/AppNavigator';
import { useStorage } from '../hooks/useStorage';

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
  const { stats, isLoading, refreshStats } = useStorage();

  useEffect(() => {
    // Refresh stats when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      refreshStats();
    });
    return unsubscribe;
  }, [navigation, refreshStats]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
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
            <Text style={styles.streakEmoji}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>
                {stats?.currentStreak || 0}
              </Text>
              <Text style={styles.streakLabel}>
                day{(stats?.currentStreak || 0) !== 1 ? 's' : ''} streak
              </Text>
            </View>
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

        {/* Start Practice Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartPractice}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonIcon}>▶</Text>
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
            <Text style={styles.emptyEmoji}>🎵</Text>
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
    backgroundColor: '#0A0A0A',
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
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10B981',
  },
  streakLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -4,
  },
  bestStreak: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  startButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  startButtonIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    marginRight: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weeklyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
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
    color: '#10B981',
  },
  weeklyLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  weeklyDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
