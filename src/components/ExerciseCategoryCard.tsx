/**
 * Exercise Category Card Component
 *
 * Card for browsing exercises by category (Warmups, Arpeggios, Range, Breathing).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExerciseCategory } from '../data/exercises';
import { CATEGORY_INFO } from '../data/exercises';
import { colors, borderRadius, opacity } from '../theme';

interface ExerciseCategoryCardProps {
  category: ExerciseCategory;
  exerciseCount: number;
  onPress: () => void;
}

type IoniconsName = keyof typeof Ionicons.glyphMap;

export function ExerciseCategoryCard({ category, exerciseCount, onPress }: ExerciseCategoryCardProps) {
  const info = CATEGORY_INFO[category];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={info.icon as IoniconsName} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{info.title}</Text>
      <Text style={styles.description}>{info.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.count}>{exerciseCount} exercises</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 160,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: opacity.primary10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  count: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
