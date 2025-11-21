/**
 * Progress Screen
 *
 * Shows practice history, calendar view, and statistics.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStorage } from '../hooks/useStorage';
import { SessionRecord } from '../types/userProgress';

// Format seconds to readable time
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Simple calendar component
const CalendarView = ({ sessions }: { sessions: SessionRecord[] }) => {
  const today = new Date();
  const days: Date[] = [];

  // Get last 28 days (4 weeks)
  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
  }

  // Get practice dates
  const practiceDates = new Set(
    sessions.map(s => s.date.split('T')[0])
  );

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={calendarStyles.container}>
      <View style={calendarStyles.header}>
        {weekDays.map((day, i) => (
          <Text key={i} style={calendarStyles.weekDay}>{day}</Text>
        ))}
      </View>
      <View style={calendarStyles.grid}>
        {days.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const isPracticed = practiceDates.has(dateStr);
          const isToday = dateStr === today.toISOString().split('T')[0];

          return (
            <View
              key={i}
              style={[
                calendarStyles.day,
                isPracticed && calendarStyles.dayPracticed,
                isToday && calendarStyles.dayToday,
              ]}
            >
              <Text
                style={[
                  calendarStyles.dayText,
                  isPracticed && calendarStyles.dayTextPracticed,
                ]}
              >
                {date.getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayPracticed: {
    backgroundColor: '#10B981',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dayText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  dayTextPracticed: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export function ProgressScreen() {
  const navigation = useNavigation();
  const { progress, stats, isLoading, refreshProgress } = useStorage();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProgress();
    });
    return unsubscribe;
  }, [navigation, refreshProgress]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  const recentSessions = progress?.sessionHistory.slice(0, 10) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Progress</Text>

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.averageAccuracy || 0}%</Text>
            <Text style={styles.statLabel}>Avg Accuracy</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {formatTime(stats?.totalPracticeTime || 0)}
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>

        {/* Vocal Range */}
        {progress?.vocalRange && (
          <View style={styles.rangeCard}>
            <Text style={styles.sectionTitle}>Vocal Range</Text>
            <View style={styles.rangeDisplay}>
              <View style={styles.rangeNote}>
                <Text style={styles.rangeValue}>{progress.vocalRange.lowest}</Text>
                <Text style={styles.rangeLabel}>Lowest</Text>
              </View>
              <View style={styles.rangeLine} />
              <View style={styles.rangeNote}>
                <Text style={styles.rangeValue}>{progress.vocalRange.highest}</Text>
                <Text style={styles.rangeLabel}>Highest</Text>
              </View>
            </View>
          </View>
        )}

        {/* Calendar */}
        <Text style={styles.sectionTitle}>Practice History</Text>
        <CalendarView sessions={progress?.sessionHistory || []} />

        {/* Recent Sessions */}
        {recentSessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
              Recent Sessions
            </Text>
            {recentSessions.map((session, index) => (
              <View key={session.id || index} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionName}>{session.exerciseName}</Text>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                </View>
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStat}>
                    {session.accuracy}% accuracy
                  </Text>
                  <Text style={styles.sessionStat}>
                    {formatTime(session.duration)}
                  </Text>
                  {session.notesAttempted > 0 && (
                    <Text style={styles.sessionStat}>
                      {session.notesHit}/{session.notesAttempted} notes
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Empty State */}
        {(!progress || progress.sessionHistory.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete your first practice session to see your progress here!
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  rangeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  rangeNote: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  rangeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rangeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  rangeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#10B981',
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  sessionStat: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
