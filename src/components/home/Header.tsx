/**
 * Header Component
 * Top bar with profile icon, app title, and streak indicator
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSystem as DS } from '../../design/DesignSystem';

interface HeaderProps {
  streak: number;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ streak, onProfilePress }) => {
  return (
    <View style={styles.container}>
      {/* Left: Profile Icon */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={onProfilePress}
        activeOpacity={0.7}
      >
        <View style={styles.profileIcon}>
          <Text style={styles.profileIconText}>👤</Text>
        </View>
      </TouchableOpacity>

      {/* Center: App Title */}
      <Text style={styles.title}>PitchPerfect</Text>

      {/* Right: Streak Indicator */}
      <View style={styles.streakContainer}>
        {streak > 0 && (
          <>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakNumber}>{streak}</Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DS.spacing.lg,
    paddingTop: DS.spacing.lg,
    paddingBottom: DS.spacing.md,
  },

  // Profile icon (left)
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: DS.radius.full,
    backgroundColor: DS.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 18,
  },

  // App title (center)
  title: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },

  // Streak (right)
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  streakNumber: {
    ...DS.typography.headline,
    color: DS.colors.gamification.streak,
    fontWeight: '700',
  },
});
