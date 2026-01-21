/**
 * Quick Warmup Card Component
 *
 * Beautiful card-based UI for quick warmup presets.
 * Apple Health-inspired design with large touch targets.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { QuickWarmup } from '../data/exercises';
import { colors, borderRadius, opacity } from '../theme';

interface QuickWarmupCardProps {
  warmup: QuickWarmup;
  onPress: () => void;
}

type IoniconsName = keyof typeof Ionicons.glyphMap;

export function QuickWarmupCard({ warmup, onPress }: QuickWarmupCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name={warmup.icon as IoniconsName} size={24} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{warmup.name}</Text>
          <Text style={styles.duration}>{warmup.duration}</Text>
        </View>
      </View>
      <Text style={styles.description}>{warmup.description}</Text>

      {/* Exercise count */}
      <View style={styles.footer}>
        <Text style={styles.exercises}>
          {warmup.breathingExercise ? 'Breathing + ' : ''}
          {warmup.exercises.length} exercise{warmup.exercises.length !== 1 ? 's' : ''}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: opacity.primary10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  description: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exercises: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
