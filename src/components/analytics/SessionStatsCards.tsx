/**
 * Session Stats Cards Component
 *
 * Extracted from PitchPerfectPro.tsx (lines 418-439)
 *
 * Displays key performance metrics in card format:
 * - Overall accuracy percentage
 * - Total notes detected
 * - Best accuracy achieved
 *
 * @module SessionStatsCards
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PitchHistoryStats } from '../../hooks/usePitchHistory';

interface SessionStatsCardsProps {
  /** Statistics calculated from pitch history */
  stats: PitchHistoryStats;
  /** Optional custom title */
  title?: string;
}

/**
 * Session Stats Cards - Key Performance Metrics
 *
 * Displays 3 prominent stat cards showing:
 * 1. Accuracy: % of readings above 90% accuracy
 * 2. Notes Detected: Total pitch readings captured
 * 3. Best Match: Highest accuracy achieved
 *
 * Design from PitchPerfectPro with iOS visual styling.
 */
export const SessionStatsCards: React.FC<SessionStatsCardsProps> = ({
  stats,
  title = 'Session Statistics',
}) => {
  // Handle empty state
  if (stats.totalReadings === 0) {
    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No stats available yet</Text>
          <Text style={styles.emptySubtext}>Complete an exercise to see your stats</Text>
        </View>
      </View>
    );
  }

  // Calculate display values (from PitchPerfectPro lines 419-437)
  const accuracyPercentage = Math.round(stats.excellentPercentage);
  const notesDetected = stats.totalReadings;
  const bestMatch = Math.round(stats.bestAccuracy * 100);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.statsContainer}>
        {/* Accuracy Card */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{accuracyPercentage}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statSubtext}>Excellent notes</Text>
        </View>

        {/* Notes Detected Card */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{notesDetected}</Text>
          <Text style={styles.statLabel}>Notes</Text>
          <Text style={styles.statSubtext}>Detected</Text>
        </View>

        {/* Best Match Card */}
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bestMatch}%</Text>
          <Text style={styles.statLabel}>Best</Text>
          <Text style={styles.statSubtext}>Match</Text>
        </View>
      </View>

      {/* Additional Stats Row (optional extended info) */}
      {stats.duration > 0 && (
        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Duration</Text>
            <Text style={styles.additionalStatValue}>
              {Math.round(stats.duration)}s
            </Text>
          </View>

          <View style={styles.additionalStatItem}>
            <Text style={styles.additionalStatLabel}>Average</Text>
            <Text style={styles.additionalStatValue}>
              {Math.round(stats.averageAccuracy * 100)}%
            </Text>
          </View>

          {stats.mostCommonNote && (
            <View style={styles.additionalStatItem}>
              <Text style={styles.additionalStatLabel}>Most Common</Text>
              <Text style={styles.additionalStatValue}>{stats.mostCommonNote}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  additionalStatItem: {
    alignItems: 'center',
  },
  additionalStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  additionalStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
