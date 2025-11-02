/**
 * AI Coach Card Component
 *
 * Displays personalized AI-powered coaching feedback after exercises
 * Uses Claude API to analyze performance and provide vocal pedagogy advice
 *
 * @module AICoachCard
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { DesignSystem } from '../../design/DesignSystem';
import { VocalCoachFeedback } from '../../services/ai/vocalCoachService';

interface AICoachCardProps {
  /** AI-generated coaching feedback */
  feedback: VocalCoachFeedback | null;
  /** Loading state */
  loading?: boolean;
  /** Error message if feedback generation failed */
  error?: string;
  /** Callback to regenerate feedback */
  onRegenerate?: () => void;
}

/**
 * AI Coach Card - Personalized Vocal Coaching
 *
 * Displays AI-generated feedback including:
 * - Performance summary
 * - Strengths identified
 * - Areas to improve
 * - Specific vocal technique tips
 * - Encouragement
 * - Next steps recommendation
 *
 * Features animated reveal and loading states.
 */
export const AICoachCard: React.FC<AICoachCardProps> = ({
  feedback,
  loading = false,
  error,
  onRegenerate,
}) => {
  const [revealed, setRevealed] = useState(false);

  // Animate reveal when feedback loads
  useEffect(() => {
    if (feedback && !loading) {
      const timer = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(timer);
    }
  }, [feedback, loading]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🤖</Text>
          <Text style={styles.headerTitle}>AI Vocal Coach</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DesignSystem.colors.accent.primary} />
          <Text style={styles.loadingText}>Analyzing your performance...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !feedback) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🤖</Text>
          <Text style={styles.headerTitle}>AI Vocal Coach</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Unable to generate feedback'}
          </Text>
          {onRegenerate && (
            <TouchableOpacity style={styles.retryButton} onPress={onRegenerate}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Success state with feedback
  return (
    <View style={[styles.container, revealed && styles.containerRevealed]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🤖</Text>
        <Text style={styles.headerTitle}>AI Vocal Coach</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>POWERED BY CLAUDE</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.summaryText}>{feedback.summary}</Text>
      </View>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✅</Text>
            <Text style={styles.sectionTitle}>What You Did Well</Text>
          </View>
          {feedback.strengths.map((strength, index) => (
            <View key={index} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{strength}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Areas to Improve */}
      {feedback.areasToImprove.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎯</Text>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
          </View>
          {feedback.areasToImprove.map((area, index) => (
            <View key={index} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{area}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Specific Tips */}
      {feedback.specificTips.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💡</Text>
            <Text style={styles.sectionTitle}>Vocal Technique Tips</Text>
          </View>
          {feedback.specificTips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <Text style={styles.tipNumber}>{index + 1}</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Next Steps */}
      {feedback.nextSteps && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🎵</Text>
            <Text style={styles.sectionTitle}>What's Next</Text>
          </View>
          <Text style={styles.nextStepsText}>{feedback.nextSteps}</Text>
        </View>
      )}

      {/* Encouragement */}
      {feedback.encouragement && (
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementText}>"{feedback.encouragement}"</Text>
        </View>
      )}

      {/* Regenerate Button */}
      {onRegenerate && (
        <TouchableOpacity style={styles.regenerateButton} onPress={onRegenerate}>
          <Text style={styles.regenerateButtonText}>🔄 Get Different Insights</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: DesignSystem.colors.background.elevated,
    borderRadius: DesignSystem.radius.lg,
    padding: DesignSystem.spacing.xl,
    borderWidth: 1,
    borderColor: DesignSystem.colors.accent.primary + '30', // 30% opacity
    marginVertical: DesignSystem.spacing.lg,
    opacity: 0.8,
  },
  containerRevealed: {
    opacity: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
    gap: DesignSystem.spacing.sm,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    ...DesignSystem.typography.title3,
    color: DesignSystem.colors.text.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: DesignSystem.colors.accent.primary + '20',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xxs,
    borderRadius: DesignSystem.radius.xs,
  },
  badgeText: {
    ...DesignSystem.typography.caption2,
    color: DesignSystem.colors.accent.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xxxl,
    gap: DesignSystem.spacing.md,
  },
  loadingText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.text.tertiary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl,
    gap: DesignSystem.spacing.md,
  },
  errorText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.accent.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: DesignSystem.colors.accent.primary,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.radius.sm,
    marginTop: DesignSystem.spacing.sm,
  },
  retryButtonText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: DesignSystem.spacing.lg,
  },
  summaryText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    ...DesignSystem.typography.headline,
    color: DesignSystem.colors.text.primary,
  },
  bulletItem: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.sm,
    paddingLeft: DesignSystem.spacing.md,
  },
  bulletDot: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.accent.primary,
    fontWeight: '700',
  },
  bulletText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.accent.primary + '10',
    borderRadius: DesignSystem.radius.sm,
    padding: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: DesignSystem.colors.accent.primary,
  },
  tipNumber: {
    ...DesignSystem.typography.headline,
    color: DesignSystem.colors.accent.primary,
    fontWeight: '700',
    minWidth: 20,
  },
  tipText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  nextStepsText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.text.secondary,
    lineHeight: 22,
    paddingLeft: DesignSystem.spacing.md,
  },
  encouragementContainer: {
    backgroundColor: DesignSystem.colors.accent.secondary + '10',
    borderRadius: DesignSystem.radius.sm,
    padding: DesignSystem.spacing.lg,
    marginTop: DesignSystem.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: DesignSystem.colors.accent.secondary,
  },
  encouragementText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  regenerateButton: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
  },
  regenerateButtonText: {
    ...DesignSystem.typography.callout,
    color: DesignSystem.colors.accent.primary,
    fontWeight: '600',
  },
});
