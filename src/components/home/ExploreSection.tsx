/**
 * Explore Section Component
 * Collapsible section showing all exercises in a grid
 * Progressive disclosure - advanced users can explore, beginners aren't overwhelmed
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Exercise } from '../../data/models';
import { ExerciseCardCompact } from './ExerciseCardCompact';
import { DesignSystem as DS } from '../../design/DesignSystem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExploreSectionProps {
  exercises: Exercise[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  selectedExerciseId: string;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({
  exercises,
  isExpanded,
  onToggle,
  onSelectExercise,
  selectedExerciseId,
}) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  // Group exercises by category
  const breathingExercises = exercises.filter(e => e.type === 'breathing');
  const vocalExercises = exercises.filter(e => e.type === 'vocal');

  return (
    <View style={styles.container}>
      {/* Header - always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerText}>Browse All Exercises</Text>
          <Text style={styles.headerSubtext}>View complete exercise library</Text>
        </View>
        <Text style={styles.dots}>···</Text>
      </TouchableOpacity>

      {/* Expanded content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Breathing section */}
          {breathingExercises.length > 0 && (
            <View style={styles.category}>
              <Text style={styles.categoryTitle}>💨 Breathing</Text>
              <View style={styles.grid}>
                {breathingExercises.map((exercise) => (
                  <View key={exercise.id} style={styles.gridItem}>
                    <ExerciseCardCompact
                      exercise={exercise}
                      onPress={() => onSelectExercise(exercise)}
                      isSelected={exercise.id === selectedExerciseId}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Vocal section */}
          {vocalExercises.length > 0 && (
            <View style={styles.category}>
              <Text style={styles.categoryTitle}>🎵 Vocal Training</Text>
              <View style={styles.grid}>
                {vocalExercises.map((exercise) => (
                  <View key={exercise.id} style={styles.gridItem}>
                    <ExerciseCardCompact
                      exercise={exercise}
                      onPress={() => onSelectExercise(exercise)}
                      isSelected={exercise.id === selectedExerciseId}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: DS.spacing.lg,
    paddingHorizontal: DS.spacing.lg,
    paddingBottom: DS.spacing.xxxl, // Extra space for FAB if we add it later
  },

  // Header (always visible)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DS.colors.background.tertiary,
  },
  headerText: {
    ...DS.typography.callout,
    color: DS.colors.text.tertiary,
    fontWeight: '600',
  },
  headerSubtext: {
    ...DS.typography.caption1,
    color: DS.colors.text.tertiary,
    marginTop: DS.spacing.xxs,
  },
  dots: {
    ...DS.typography.title2,
    color: DS.colors.text.tertiary,
    opacity: 0.5,
  },

  // Content (expandable)
  content: {
    paddingTop: DS.spacing.md,
  },

  category: {
    marginBottom: DS.spacing.xl,
  },
  categoryTitle: {
    ...DS.typography.title3,
    color: DS.colors.text.primary,
    fontWeight: '600',
    marginBottom: DS.spacing.md,
  },

  // Grid layout (2 columns)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -DS.spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: DS.spacing.xs,
  },
});
