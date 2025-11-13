/**
 * Progress Screen - User Stats and History
 *
 * Shows user's progress, statistics, and practice history
 *
 * @module ProgressScreen
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DesignSystem as DS } from '../design/DesignSystem';

export const ProgressScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
      <Text style={styles.subtitle}>Coming soon: Track your vocal training progress</Text>
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
