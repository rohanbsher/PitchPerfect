/**
 * Exercise Card Compact
 * Small card for grid layout in ExploreSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Exercise } from '../../data/models';
import { DesignSystem as DS } from '../../design/DesignSystem';

interface ExerciseCardCompactProps {
  exercise: Exercise;
  onPress: () => void;
  isSelected: boolean;
}

export const ExerciseCardCompact: React.FC<ExerciseCardCompactProps> = ({
  exercise,
  onPress,
  isSelected,
}) => {
  // Get difficulty color
  const getDifficultyColor = () => {
    if (exercise.difficulty === 'beginner') return DS.colors.difficulty.beginner;
    if (exercise.difficulty === 'intermediate') return DS.colors.difficulty.intermediate;
    return DS.colors.difficulty.advanced;
  };

  // Get metadata
  const getMetadata = () => {
    const parts = [];

    if (exercise.type === 'vocal' && exercise.notes) {
      parts.push(`${exercise.notes.length} notes`);
    } else if (exercise.type === 'breathing' && exercise.breathingRounds) {
      parts.push(`${exercise.breathingRounds.length} rounds`);
    }

    parts.push(`~${Math.ceil(exercise.duration / 60)} min`);

    return parts.join(' · ');
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Exercise name */}
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>
          {exercise.name}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Metadata */}
      <Text style={styles.metadata}>{getMetadata()}</Text>

      {/* Difficulty badge */}
      <View style={[styles.badge, { backgroundColor: `${getDifficultyColor()}25` }]}>
        <Text style={[styles.badgeText, { color: getDifficultyColor() }]}>
          {exercise.difficulty.substring(0, 3).toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.md,
    marginBottom: DS.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...DS.shadows.sm,
  },
  containerSelected: {
    borderColor: DS.colors.accent.primary,
    backgroundColor: DS.colors.background.tertiary,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DS.spacing.xs,
  },

  name: {
    ...DS.typography.callout,
    color: DS.colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: DS.spacing.xs,
  },

  checkmark: {
    fontSize: 16,
    color: DS.colors.accent.primary,
  },

  metadata: {
    ...DS.typography.caption1,
    color: DS.colors.text.tertiary,
    marginBottom: DS.spacing.sm,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DS.spacing.sm,
    paddingVertical: 2,
    borderRadius: DS.radius.xs,
  },
  badgeText: {
    ...DS.typography.caption2,
    fontWeight: '600',
    fontSize: 10,
  },
});
