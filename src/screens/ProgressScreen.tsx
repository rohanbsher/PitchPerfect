/**
 * Progress Screen - User Stats and History
 *
 * Shows user's progress, statistics, and practice history
 *
 * @module ProgressScreen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignSystem as DS } from '../design/DesignSystem';
import { progressTracker, StudentProgress, SessionData, Achievement } from '../services/progressTracking';

export const ProgressScreen: React.FC = () => {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgress = () => {
    const report = progressTracker.getProgressReport();
    setProgress(report);
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProgress();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!progress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = progress.sessions.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>
            {hasData
              ? `${progress.sessions.length} sessions completed`
              : 'Start practicing to track your progress'}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="🔥"
            value={progress.currentStreak.toString()}
            label="Day Streak"
            highlight={progress.currentStreak >= 7}
          />
          <StatCard
            icon="🎯"
            value={`${Math.round(progress.overallAccuracy)}%`}
            label="Avg Accuracy"
            highlight={progress.overallAccuracy >= 90}
          />
          <StatCard
            icon="⏱️"
            value={formatDuration(progress.totalPracticeTime)}
            label="Total Time"
          />
          <StatCard
            icon="🎹"
            value={hasData ? `${progress.currentRange.lowest}-${progress.currentRange.highest}` : '-'}
            label="Vocal Range"
          />
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {progress.achievements.length > 0 ? (
            <View style={styles.achievementsList}>
              {progress.achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>
                Complete exercises to unlock achievements
              </Text>
            </View>
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {progress.sessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {progress.sessions
                .slice(-5)
                .reverse()
                .map((session, index) => (
                  <SessionCard key={index} session={session} formatDate={formatDate} formatDuration={formatDuration} />
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>
                No sessions yet. Start your first exercise!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, highlight }) => (
  <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Achievement Card Component
interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => (
  <View style={styles.achievementCard}>
    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
    <View style={styles.achievementInfo}>
      <Text style={styles.achievementName}>{achievement.name}</Text>
      <Text style={styles.achievementDescription}>{achievement.description}</Text>
    </View>
  </View>
);

// Session Card Component
interface SessionCardProps {
  session: SessionData;
  formatDate: (date: Date) => string;
  formatDuration: (seconds: number) => string;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, formatDate, formatDuration }) => (
  <View style={styles.sessionCard}>
    <View style={styles.sessionHeader}>
      <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
      <Text style={styles.sessionAccuracy}>{Math.round(session.accuracy)}%</Text>
    </View>
    <View style={styles.sessionDetails}>
      <Text style={styles.sessionDetail}>
        {formatDuration(session.duration)} • {session.notesHit?.length || 0} notes
      </Text>
      {session.rangeLowest && session.rangeHighest && (
        <Text style={styles.sessionRange}>
          {session.rangeLowest} - {session.rangeHighest}
        </Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...DS.typography.callout,
    color: DS.colors.text.secondary,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    ...DS.typography.title1,
    color: DS.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...DS.typography.callout,
    color: DS.colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: DS.colors.background.elevated,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statCardHighlight: {
    backgroundColor: DS.colors.accent.primary + '20',
    borderWidth: 1,
    borderColor: DS.colors.accent.primary + '40',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    ...DS.typography.title2,
    color: DS.colors.text.primary,
    marginBottom: 4,
  },
  statValueHighlight: {
    color: DS.colors.accent.primary,
  },
  statLabel: {
    ...DS.typography.caption1,
    color: DS.colors.text.tertiary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    marginBottom: 12,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS.colors.background.elevated,
    borderRadius: 12,
    padding: 16,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    ...DS.typography.subheadline,
    color: DS.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  achievementDescription: {
    ...DS.typography.caption1,
    color: DS.colors.text.secondary,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: DS.colors.background.elevated,
    borderRadius: 12,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    ...DS.typography.subheadline,
    color: DS.colors.text.primary,
    fontWeight: '500',
  },
  sessionAccuracy: {
    ...DS.typography.subheadline,
    color: DS.colors.accent.primary,
    fontWeight: '600',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionDetail: {
    ...DS.typography.caption1,
    color: DS.colors.text.tertiary,
  },
  sessionRange: {
    ...DS.typography.caption1,
    color: DS.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: DS.colors.background.elevated,
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    ...DS.typography.callout,
    color: DS.colors.text.tertiary,
    textAlign: 'center',
  },
});
