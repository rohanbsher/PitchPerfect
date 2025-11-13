/**
 * Exercises Screen - Browse Vocal Exercises
 *
 * Shows list of vocal exercises that can be launched as overlays on the piano
 *
 * @module ExercisesScreen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DesignSystem as DS } from '../design/DesignSystem';

export const ExercisesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercises</Text>
      <Text style={styles.subtitle}>Coming soon: Browse and practice vocal exercises</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    ...DS.typography.title1,
    color: DS.colors.text.primary,
    marginBottom: 12,
  },
  subtitle: {
    ...DS.typography.callout,
    color: DS.colors.text.secondary,
    textAlign: 'center',
  },
});
