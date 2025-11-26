/**
 * Exercise Category Card Component
 *
 * Card for browsing exercises by category (Warmups, Arpeggios, Range, Breathing).
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ExerciseCategory } from '../data/exercises';
import { CATEGORY_INFO } from '../data/exercises';

interface ExerciseCategoryCardProps {
  category: ExerciseCategory;
  exerciseCount: number;
  onPress: () => void;
}

export function ExerciseCategoryCard({ category, exerciseCount, onPress }: ExerciseCategoryCardProps) {
  const info = CATEGORY_INFO[category];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{info.emoji}</Text>
      <Text style={styles.title}>{info.title}</Text>
      <Text style={styles.description}>{info.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.count}>{exerciseCount} exercises</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    minHeight: 160,
  },
  emoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
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
    borderTopColor: '#2A2A2A',
  },
  count: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 18,
    color: '#10B981',
  },
});
