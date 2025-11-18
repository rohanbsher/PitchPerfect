/**
 * Exercise Preview Screen
 * Shows BEFORE user starts exercise - prepares them for success
 *
 * Journey: Home → Preview → Exercise
 *
 * Shows:
 * - What you'll do (clear explanation)
 * - Why it matters (motivation)
 * - How to succeed (tips)
 * - Clear "I'm Ready" CTA
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../data/models';
import { DesignSystem as DS } from '../design/DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExercisePreviewProps {
  exercise: Exercise;
  onStart: () => void;
  onBack: () => void;
}

export const ExercisePreview: React.FC<ExercisePreviewProps> = ({
  exercise,
  onStart,
  onBack,
}) => {
  // Get difficulty color
  const getDifficultyColor = () => {
    if (exercise.difficulty === 'beginner') return DS.colors.difficulty.beginner;
    if (exercise.difficulty === 'intermediate') return DS.colors.difficulty.intermediate;
    return DS.colors.difficulty.advanced;
  };

  // Get "What You'll Do" text
  const getWhatYouDo = (): string => {
    if (exercise.type === 'vocal' && exercise.notes) {
      const noteCount = exercise.notes.length;
      const firstNote = exercise.notes[0].note;
      const lastNote = exercise.notes[exercise.notes.length - 1].note;
      return `Sing ${noteCount} notes along with piano guidance (${firstNote} → ${lastNote}). Listen to each note, then sing it back. The app will show you how accurate you are in real-time.`;
    } else if (exercise.type === 'breathing' && exercise.breathingRounds) {
      const roundCount = exercise.breathingRounds.length;
      const firstRound = exercise.breathingRounds[0];
      return `Complete ${roundCount} rounds of ${exercise.name.toLowerCase()}. Each round: breathe in for ${firstRound.inhaleBeats} seconds, ${firstRound.holdBeats > 0 ? `hold for ${firstRound.holdBeats} seconds, ` : ''}breathe out for ${firstRound.exhaleBeats} seconds. Follow the visual guide on screen.`;
    }
    return exercise.description;
  };

  // Get "Why This Matters" text
  const getWhyItMatters = (): string => {
    // Breathing exercises
    if (exercise.id === 'diaphragmatic-breathing') {
      return "Diaphragmatic breathing is the foundation of all great singing. 80% of vocal problems come from poor breathing technique. Master this first, and everything else becomes easier.";
    }
    if (exercise.id === 'box-breathing') {
      return "Used by Navy SEALs to calm nerves before high-pressure situations. Perfect for reducing performance anxiety and centering yourself before singing.";
    }
    if (exercise.id === 'farinelli-breathing') {
      return "Named after the legendary 18th century opera singer. This progressive technique can increase your lung capacity by 15-30% with consistent practice.";
    }

    // Vocal exercises
    if (exercise.category === 'warm-up') {
      return "Warming up prevents vocal strain and extends your range. Just like athletes stretch before exercise, singers need to warm up their vocal cords.";
    }
    if (exercise.category === 'scale') {
      return "Scales train your ear and improve pitch accuracy. They're the foundation of musical training used by professional singers worldwide.";
    }
    if (exercise.category === 'interval') {
      return "Interval training builds precision and expands your vocal range. It helps you hit the right notes consistently, even in challenging songs.";
    }

    return "This exercise builds core vocal skills that transfer to every song you sing.";
  };

  // Get success tips
  const getSuccessTips = (): string[] => {
    const commonTips = [
      "Find a quiet space with minimal background noise",
      "Hold your phone 6 inches from your mouth",
      "Have water nearby to stay hydrated",
    ];

    if (exercise.type === 'vocal') {
      return [
        "🎧 Wear headphones for the best experience",
        ...commonTips,
        "Don't worry about being perfect - focus on matching the pitch",
      ];
    } else {
      return [
        "🧘 Sit or stand with straight posture",
        ...commonTips,
        "Place one hand on your chest, one on your belly",
        "Your belly should expand when you breathe in (not your chest)",
      ];
    }
  };

  const whatYouDo = getWhatYouDo();
  const whyItMatters = getWhyItMatters();
  const successTips = getSuccessTips();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={DS.colors.brand.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.exerciseIcon}>{exercise.icon || '🎵'}</Text>
            <Text style={styles.exerciseName}>{exercise.name}</Text>

            {/* Metadata */}
            <View style={styles.metadataRow}>
              <View style={[styles.badge, { backgroundColor: `${getDifficultyColor()}30` }]}>
                <Text style={[styles.badgeText, { color: getDifficultyColor() }]}>
                  {exercise.difficulty.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.duration}>⏱ ~{Math.ceil(exercise.duration / 60)} min</Text>
            </View>
          </View>

          {/* Content Cards */}
          <View style={styles.content}>
            {/* What You'll Do */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What You'll Do</Text>
              <Text style={styles.cardBody}>{whatYouDo}</Text>
            </View>

            {/* Why This Matters */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Why This Matters</Text>
              <Text style={styles.cardBody}>{whyItMatters}</Text>
            </View>

            {/* How to Succeed */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How to Succeed</Text>
              {successTips.map((tip, index) => (
                <View key={index} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA Button */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={onStart}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>I'm Ready - Start Exercise</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS.colors.background.primary,
  },

  // Header
  header: {
    paddingHorizontal: DS.spacing.lg,
    paddingVertical: DS.spacing.md,
  },
  backButton: {
    paddingVertical: DS.spacing.sm,
  },
  backButtonText: {
    ...DS.typography.body,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },

  scrollContent: {
    paddingBottom: DS.spacing.xxxl,
  },

  // Hero Section
  hero: {
    alignItems: 'center',
    paddingHorizontal: DS.spacing.xl,
    paddingTop: DS.spacing.xl,
    paddingBottom: DS.spacing.xxl,
  },
  exerciseIcon: {
    fontSize: 80,
    marginBottom: DS.spacing.lg,
  },
  exerciseName: {
    ...DS.typography.largeTitle,
    color: DS.colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DS.spacing.md,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS.spacing.md,
  },
  badge: {
    paddingHorizontal: DS.spacing.md,
    paddingVertical: DS.spacing.xxs,
    borderRadius: DS.radius.full,
  },
  badgeText: {
    ...DS.typography.caption2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  duration: {
    ...DS.typography.callout,
    color: DS.colors.text.secondary,
  },

  // Content Cards
  content: {
    paddingHorizontal: DS.spacing.lg,
  },
  card: {
    backgroundColor: DS.colors.background.elevated,
    borderRadius: DS.radius.xl,
    padding: DS.spacing.xl,
    marginBottom: DS.spacing.lg,
    ...DS.shadows.md,
  },
  cardTitle: {
    ...DS.typography.title3,
    color: DS.colors.text.primary,
    fontWeight: '600',
    marginBottom: DS.spacing.md,
  },
  cardBody: {
    ...DS.typography.body,
    color: DS.colors.text.secondary,
    lineHeight: 24,
  },

  // Tips
  tipRow: {
    flexDirection: 'row',
    marginBottom: DS.spacing.sm,
    alignItems: 'flex-start',
  },
  tipBullet: {
    ...DS.typography.body,
    color: DS.colors.accent.primary,
    marginRight: DS.spacing.sm,
    fontWeight: '700',
  },
  tipText: {
    ...DS.typography.body,
    color: DS.colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: DS.spacing.lg,
    paddingTop: DS.spacing.xl,
  },
  ctaButton: {
    backgroundColor: DS.colors.accent.primary,
    paddingVertical: DS.spacing.lg,
    paddingHorizontal: DS.spacing.xxl,
    borderRadius: DS.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...DS.shadows.lg,
  },
  ctaButtonText: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },
});
