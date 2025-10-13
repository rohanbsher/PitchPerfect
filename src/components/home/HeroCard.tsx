/**
 * Hero Card Component
 * Large recommendation card with animated background
 * Takes 60-70% of screen height, shows ONE exercise with clear CTA
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../../data/models';
import { DesignSystem as DS } from '../../design/DesignSystem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HeroCardProps {
  exercise: Exercise;
  onStart: () => void;
  reasonText: string;
  isReady: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  exercise,
  onStart,
  reasonText,
  isReady,
}) => {
  // Pulse animation for background
  const pulseAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    // Create pulsing animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.15,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Get difficulty color
  const getDifficultyColor = () => {
    if (exercise.difficulty === 'beginner') return DS.colors.difficulty.beginner;
    if (exercise.difficulty === 'intermediate') return DS.colors.difficulty.intermediate;
    return DS.colors.difficulty.advanced;
  };

  // Get category emoji
  const getCategoryEmoji = () => {
    if (exercise.type === 'breathing') return '💨';
    if (exercise.category === 'warm-up') return '🔥';
    if (exercise.category === 'scale') return '🎹';
    if (exercise.category === 'interval') return '📏';
    return '🎵';
  };

  // Get metadata text
  const getMetadataText = () => {
    const parts = [];

    if (exercise.type === 'vocal' && exercise.notes) {
      parts.push(`🎵 ${exercise.notes.length} notes`);
    } else if (exercise.type === 'breathing' && exercise.breathingRounds) {
      parts.push(`💨 ${exercise.breathingRounds.length} rounds`);
    }

    parts.push(`⏱ ~${Math.ceil(exercise.duration / 60)} min`);

    return parts.join('  ·  ');
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
        <LinearGradient
          colors={[
            `${DS.colors.brand.gradient[0]}15`,
            `${DS.colors.brand.gradient[1]}15`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content overlay */}
      <View style={styles.content}>
        {/* Label */}
        <Text style={styles.label}>Today's Lesson</Text>

        {/* Exercise name */}
        <Text style={styles.exerciseName}>{exercise.name}</Text>

        {/* Metadata */}
        <View style={styles.metadataRow}>
          <Text style={styles.metadataText}>{getMetadataText()}</Text>
        </View>

        {/* Difficulty badge */}
        <View style={[styles.difficultyBadge, { backgroundColor: `${getDifficultyColor()}30` }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
            {exercise.difficulty.toUpperCase()}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{reasonText}</Text>

        {/* Single CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, !isReady && styles.ctaButtonDisabled]}
          onPress={onStart}
          disabled={!isReady}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>
            {isReady ? 'Start Today\'s Lesson' : '⏳ Preparing...'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: DS.spacing.lg,
    marginVertical: DS.spacing.md,
    minHeight: SCREEN_HEIGHT * 0.5, // 50% of screen
    borderRadius: DS.radius.xxl,
    overflow: 'hidden',
    backgroundColor: DS.colors.background.elevated,
    ...DS.shadows.lg,
  },

  card: {
    ...StyleSheet.absoluteFillObject,
  },

  content: {
    padding: DS.spacing.xl,
    justifyContent: 'space-between',
    flex: 1,
  },

  // Label
  label: {
    ...DS.typography.caption1,
    color: DS.colors.text.tertiary,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: DS.spacing.sm,
  },

  // Exercise name
  exerciseName: {
    ...DS.typography.title1,
    color: DS.colors.text.primary,
    fontWeight: '700',
    marginBottom: DS.spacing.md,
  },

  // Metadata
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DS.spacing.sm,
  },
  metadataText: {
    ...DS.typography.callout,
    color: DS.colors.text.tertiary,
  },

  // Difficulty badge
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.xxs,
    borderRadius: DS.radius.full,
    marginBottom: DS.spacing.lg,
  },
  difficultyText: {
    ...DS.typography.caption2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Description
  description: {
    ...DS.typography.body,
    color: DS.colors.text.secondary,
    lineHeight: 24,
    marginBottom: DS.spacing.xl,
    flex: 1,
  },

  // CTA Button
  ctaButton: {
    backgroundColor: DS.colors.accent.primary,
    paddingVertical: DS.spacing.lg,
    paddingHorizontal: DS.spacing.xxl,
    borderRadius: DS.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadows.md,
  },
  ctaButtonDisabled: {
    backgroundColor: DS.colors.background.tertiary,
    opacity: 0.5,
  },
  ctaButtonText: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },

  // Session Button (Flow Mode)
  sessionButton: {
    backgroundColor: DS.colors.background.elevated,
    borderWidth: 2,
    borderColor: DS.colors.accent.primary,
    paddingVertical: DS.spacing.md,
    paddingHorizontal: DS.spacing.xxl,
    borderRadius: DS.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: DS.spacing.md,
  },
  sessionButtonText: {
    ...DS.typography.callout,
    color: DS.colors.accent.primary,
    fontWeight: '600',
  },
});
