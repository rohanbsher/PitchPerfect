/**
 * Greeting Component
 * Time-based personalized greeting with motivational subtext
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DesignSystem as DS } from '../../design/DesignSystem';

interface GreetingProps {
  greetingText: string;
  subtextText: string;
}

export const Greeting: React.FC<GreetingProps> = ({ greetingText, subtextText }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greetingText}</Text>
      <Text style={styles.subtext}>{subtextText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DS.spacing.lg,
    paddingVertical: DS.spacing.md,
  },
  greeting: {
    ...DS.typography.title2,
    color: DS.colors.text.primary,
    fontWeight: '600',
    marginBottom: DS.spacing.xxs,
  },
  subtext: {
    ...DS.typography.callout,
    color: DS.colors.text.secondary,
  },
});
