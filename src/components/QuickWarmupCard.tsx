/**
 * Quick Warmup Card Component
 *
 * Beautiful card-based UI for quick warmup presets.
 * Apple Health-inspired design with large touch targets.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { QuickWarmup } from '../data/exercises';

interface QuickWarmupCardProps {
  warmup: QuickWarmup;
  onPress: () => void;
}

export function QuickWarmupCard({ warmup, onPress }: QuickWarmupCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{warmup.emoji}</Text>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
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
  emoji: {
    fontSize: 40,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  exercises: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 20,
    color: '#10B981',
  },
});
