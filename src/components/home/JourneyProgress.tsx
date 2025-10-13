/**
 * Journey Progress Component
 * Shows user's current week in the 8-week curriculum
 * Provides context and motivation for continued practice
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignSystem as DS } from '../../design/DesignSystem';
import { curriculum, Week } from '../../data/curriculum';

interface JourneyProgressProps {
  currentWeek: number; // 1-8
  daysThisWeek: number; // Days practiced this week
}

export const JourneyProgress: React.FC<JourneyProgressProps> = ({
  currentWeek,
  daysThisWeek,
}) => {
  // Get current week data
  const week: Week = curriculum[currentWeek - 1];
  const progressPercentage = (daysThisWeek / week.daysPerWeek) * 100;

  // Get week status emoji
  const getWeekStatusEmoji = (): string => {
    if (daysThisWeek === 0) return '🎯';
    if (daysThisWeek >= week.daysPerWeek) return '✅';
    return '🔥';
  };

  // Get motivational message
  const getMessage = (): string => {
    if (daysThisWeek === 0) {
      return `Start Week ${currentWeek}`;
    } else if (daysThisWeek >= week.daysPerWeek) {
      return `Week ${currentWeek} complete!`;
    } else {
      const remaining = week.daysPerWeek - daysThisWeek;
      return `${remaining} more ${remaining === 1 ? 'day' : 'days'} this week`;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar background */}
      <View style={styles.progressBarBg}>
        {/* Progress fill */}
        <LinearGradient
          colors={DS.colors.brand.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Left side - Week info */}
        <View style={styles.leftContent}>
          <View style={styles.weekBadge}>
            <Text style={styles.weekNumber}>Week {currentWeek}</Text>
          </View>
          <Text style={styles.weekTitle}>{week.title}</Text>
          <Text style={styles.weekFocus}>{week.focus}</Text>
        </View>

        {/* Right side - Progress indicator */}
        <View style={styles.rightContent}>
          <Text style={styles.statusEmoji}>{getWeekStatusEmoji()}</Text>
          <Text style={styles.progressText}>{getMessage()}</Text>
          <Text style={styles.daysCount}>
            {daysThisWeek}/{week.daysPerWeek}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: DS.spacing.lg,
    marginTop: DS.spacing.md,
    marginBottom: DS.spacing.lg,
    backgroundColor: DS.colors.background.elevated,
    borderRadius: DS.radius.xl,
    overflow: 'hidden',
    ...DS.shadows.md,
  },

  // Progress bar
  progressBarBg: {
    height: 4,
    backgroundColor: DS.colors.background.tertiary,
  },
  progressBarFill: {
    height: '100%',
  },

  // Content
  content: {
    flexDirection: 'row',
    padding: DS.spacing.lg,
    alignItems: 'center',
  },

  // Left side
  leftContent: {
    flex: 1,
    marginRight: DS.spacing.md,
  },
  weekBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${DS.colors.accent.primary}20`,
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: DS.spacing.xxs,
    borderRadius: DS.radius.md,
    marginBottom: DS.spacing.xs,
  },
  weekNumber: {
    ...DS.typography.caption2,
    color: DS.colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  weekTitle: {
    ...DS.typography.title3,
    color: DS.colors.text.primary,
    fontWeight: '600',
    marginBottom: DS.spacing.xxs,
  },
  weekFocus: {
    ...DS.typography.footnote,
    color: DS.colors.text.secondary,
    lineHeight: 18,
  },

  // Right side
  rightContent: {
    alignItems: 'center',
    minWidth: 70,
  },
  statusEmoji: {
    fontSize: 32,
    marginBottom: DS.spacing.xs,
  },
  progressText: {
    ...DS.typography.caption1,
    color: DS.colors.text.secondary,
    textAlign: 'center',
    marginBottom: DS.spacing.xxs,
  },
  daysCount: {
    ...DS.typography.caption2,
    color: DS.colors.text.tertiary,
    fontWeight: '600',
  },
});
