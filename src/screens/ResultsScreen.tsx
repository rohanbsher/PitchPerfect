/**
 * Results Screen
 *
 * Celebratory screen shown after completing a practice session.
 * Shows confetti animation and session statistics.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { generatePostSessionFeedback } from '../../services/claudeAI';
import { useStorage } from '../hooks/useStorage';
import { colors, borderRadius, opacity } from '../theme';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

// Confetti piece component
const ConfettiPiece = ({ delay, startX }: { delay: number; startX: number }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(height + 100, { duration: 3000, easing: Easing.linear })
    );
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1500 }),
        withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1500 })
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1)
    );
    opacity.value = withDelay(2500 + delay, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const confettiColors = [colors.primary, colors.blue, colors.warning, colors.error, colors.purple, colors.pink];
  const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

// Generate confetti pieces
const Confetti = () => {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1000,
    startX: Math.random() * width,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} delay={piece.delay} startX={piece.startX} />
      ))}
    </View>
  );
};

// Get celebratory message based on accuracy
type IoniconsName = keyof typeof Ionicons.glyphMap;
const getMessage = (accuracy: number): { icon: IoniconsName; iconColor: string; title: string; subtitle: string } => {
  if (accuracy >= 90) {
    return {
      icon: 'star',
      iconColor: colors.gold,
      title: 'Outstanding!',
      subtitle: 'You nailed it! Perfect pitch performance!',
    };
  }
  if (accuracy >= 75) {
    return {
      icon: 'trophy',
      iconColor: colors.primary,
      title: 'Great Job!',
      subtitle: 'Excellent work! Keep up the momentum!',
    };
  }
  if (accuracy >= 50) {
    return {
      icon: 'thumbs-up',
      iconColor: colors.blue,
      title: 'Nice Work!',
      subtitle: 'Good progress! Practice makes perfect!',
    };
  }
  return {
    icon: 'fitness',
    iconColor: colors.purple,
    title: 'Keep Going!',
    subtitle: 'Every session makes you better!',
  };
};

// Format duration
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export function ResultsScreen({ route, navigation }: Props) {
  const {
    accuracy = 0,
    notesHit = 0,
    notesAttempted = 0,
    duration = 0,
    exerciseName = 'Practice Session',
    lowestNote,
    highestNote,
  } = route.params || {};

  // Check if this is a range test result
  const hasRangeData = lowestNote && highestNote;

  const message = getMessage(accuracy);
  const { getSessions } = useStorage();

  // AI Feedback state
  const [aiFeedback, setAiFeedback] = useState<{
    techniqueTip: string;
    recommendedExercise: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [aiFeedbackError, setAiFeedbackError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(true);

  // Generate AI feedback on mount
  useEffect(() => {
    const generateFeedback = async () => {
      try {
        setAiFeedbackError(null); // Clear any previous errors

        // Load recent sessions
        const sessions = await getSessions();
        if (sessions.length === 0) {
          setLoadingFeedback(false);
          return;
        }

        // Get the most recent session (just completed)
        const latestSession = sessions[0];

        // Breathing exercises: Not an error, but provide context
        if (latestSession.exerciseId === 'breathing') {
          setLoadingFeedback(false);
          setAiFeedback({
            techniqueTip: 'Breathing exercises focus on breath control rather than pitch accuracy.',
            recommendedExercise: 'Try a vocal exercise next to get AI technique feedback!',
            strengths: ['Completed breathing practice'],
            improvements: [],
          });
          return;
        }

        // Zero notes: Session too short for analysis
        if (latestSession.notesAttempted === 0) {
          setLoadingFeedback(false);
          setAiFeedbackError('Session too short for AI analysis. Complete more notes to receive feedback.');
          return;
        }

        // Generate AI feedback
        const feedback = await generatePostSessionFeedback(latestSession, sessions.slice(1, 11));

        if (feedback) {
          setAiFeedback(feedback);
          setAiFeedbackError(null); // Success - clear any errors
        } else {
          // API returned null (rate limited or other issue)
          setAiFeedbackError('AI feedback unavailable. Check your internet connection.');
        }
      } catch (error) {
        console.error('Failed to generate AI feedback:', error);

        // User-friendly error messages based on error type
        let errorMessage = 'Unable to generate AI feedback at this time.';

        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMessage = 'AI feedback timed out. Your performance data was saved.';
          } else if (error.message.includes('network')) {
            errorMessage = 'No internet connection. AI feedback will be available when online.';
          }
        }

        setAiFeedbackError(errorMessage);
        setAiFeedback(null); // Clear any stale feedback
      } finally {
        setLoadingFeedback(false);
      }
    };

    generateFeedback();
  }, []);

  const handleRetryFeedback = async () => {
    try {
      setLoadingFeedback(true);
      setAiFeedbackError(null);

      const sessions = await getSessions();
      if (sessions.length > 0) {
        const latestSession = sessions[0];

        if (latestSession.exerciseId !== 'breathing' && latestSession.notesAttempted > 0) {
          const feedback = await generatePostSessionFeedback(latestSession, sessions.slice(1, 11));
          if (feedback) {
            setAiFeedback(feedback);
          } else {
            setAiFeedbackError('AI feedback still unavailable. Please try again later.');
          }
        }
      }
    } catch (error) {
      console.error('Failed to retry AI feedback:', error);
      setAiFeedbackError('Retry failed. Please check your connection and try again.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handlePracticeAgain = () => {
    navigation.replace('Main', { screen: 'Practice' });
  };

  const handleGoHome = () => {
    navigation.replace('Main', { screen: 'Progress' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Confetti />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebratory Header */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.header}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={message.icon} size={56} color={message.iconColor} />
          </View>
          <Text style={styles.title}>{message.title}</Text>
          <Text style={styles.subtitle}>{message.subtitle}</Text>
        </Animated.View>

        {/* Exercise Name */}
        <Animated.Text
          entering={FadeIn.delay(400).duration(400)}
          style={styles.exerciseName}
        >
          {exerciseName}
        </Animated.Text>

        {/* Vocal Range Display (when available) */}
        {hasRangeData && (
          <Animated.View
            entering={FadeInUp.delay(500).duration(600)}
            style={styles.rangeContainer}
          >
            <View style={styles.rangeIconContainer}>
              <Ionicons name="mic" size={28} color={colors.primary} />
            </View>
            <Text style={styles.rangeTitle}>Your Vocal Range</Text>
            <View style={styles.rangeNotesRow}>
              <View style={styles.rangeNote}>
                <Text style={styles.rangeNoteValue}>{lowestNote}</Text>
                <Text style={styles.rangeNoteLabel}>Low</Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color={opacity.white50} style={styles.rangeArrow} />
              <View style={styles.rangeNote}>
                <Text style={styles.rangeNoteValue}>{highestNote}</Text>
                <Text style={styles.rangeNoteLabel}>High</Text>
              </View>
            </View>
            <Text style={styles.rangeHint}>This range has been saved and will personalize your exercises!</Text>
          </Animated.View>
        )}

        {/* Stats Grid */}
        <Animated.View
          entering={FadeInUp.delay(hasRangeData ? 700 : 600).duration(600)}
          style={styles.statsGrid}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {notesHit}/{notesAttempted}
            </Text>
            <Text style={styles.statLabel}>Notes Hit</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </Animated.View>

        {/* Accuracy Ring */}
        <Animated.View
          entering={FadeIn.delay(800).duration(600)}
          style={styles.ringContainer}
        >
          <View style={styles.ring}>
            <Text style={styles.ringValue}>{accuracy}%</Text>
            <Text style={styles.ringLabel}>Overall Score</Text>
          </View>
        </Animated.View>

        {/* AI Coaching Feedback */}
        {loadingFeedback ? (
          <Animated.View
            entering={FadeIn.delay(1000).duration(600)}
            style={styles.feedbackContainer}
          >
            <ActivityIndicator size="small" color={colors.purple} />
            <Text style={styles.feedbackLoadingText}>Analyzing your performance...</Text>
          </Animated.View>
        ) : aiFeedbackError ? (
          <Animated.View
            entering={FadeInUp.delay(1000).duration(600)}
            style={styles.feedbackErrorContainer}
          >
            <View style={styles.feedbackErrorIconContainer}>
              <Ionicons name="information-circle" size={36} color={colors.error} />
            </View>
            <Text style={styles.feedbackErrorTitle}>AI Feedback Unavailable</Text>
            <Text style={styles.feedbackErrorMessage}>{aiFeedbackError}</Text>
            <TouchableOpacity
              style={styles.feedbackRetryButton}
              onPress={handleRetryFeedback}
              activeOpacity={0.7}
            >
              <Text style={styles.feedbackRetryText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : aiFeedback ? (
          <Animated.View
            entering={FadeInUp.delay(1000).duration(600)}
            style={styles.feedbackContainer}
          >
            <TouchableOpacity
              style={styles.feedbackHeader}
              onPress={() => setShowFeedback(!showFeedback)}
              activeOpacity={0.7}
            >
              <View style={styles.feedbackIconContainer}>
                <Ionicons name="radio-button-on" size={28} color={colors.purple} />
              </View>
              <View style={styles.feedbackHeaderText}>
                <Text style={styles.feedbackTitle}>AI Vocal Coach</Text>
                <Text style={styles.feedbackSubtitle}>
                  {showFeedback ? 'Tap to hide' : 'Tap for personalized tips'}
                </Text>
              </View>
              <Ionicons
                name={showFeedback ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={colors.purple}
              />
            </TouchableOpacity>

            {showFeedback && (
              <View style={styles.feedbackContent}>
                {/* Technique Tip */}
                <View style={styles.feedbackSection}>
                  <View style={styles.feedbackSectionHeader}>
                    <Ionicons name="bulb" size={16} color={colors.purple} />
                    <Text style={styles.feedbackSectionTitle}>Technique Tip</Text>
                  </View>
                  <Text style={styles.feedbackText}>{aiFeedback.techniqueTip}</Text>
                </View>

                {/* Recommended Exercise */}
                <View style={styles.feedbackSection}>
                  <View style={styles.feedbackSectionHeader}>
                    <Ionicons name="musical-notes" size={16} color={colors.purple} />
                    <Text style={styles.feedbackSectionTitle}>Next Exercise</Text>
                  </View>
                  <Text style={styles.feedbackText}>{aiFeedback.recommendedExercise}</Text>
                </View>

                {/* Strengths */}
                {aiFeedback.strengths.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <View style={styles.feedbackSectionHeader}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.feedbackSectionTitle}>Strengths</Text>
                    </View>
                    {aiFeedback.strengths.map((strength, index) => (
                      <Text key={index} style={styles.feedbackListItem}>• {strength}</Text>
                    ))}
                  </View>
                )}

                {/* Improvements */}
                {aiFeedback.improvements.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <View style={styles.feedbackSectionHeader}>
                      <Ionicons name="radio-button-on" size={16} color={colors.warning} />
                      <Text style={styles.feedbackSectionTitle}>Focus Areas</Text>
                    </View>
                    {aiFeedback.improvements.map((improvement, index) => (
                      <Text key={index} style={styles.feedbackListItem}>• {improvement}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Action Buttons */}
      <Animated.View
        entering={FadeInUp.delay(1000).duration(600)}
        style={styles.actions}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handlePracticeAgain}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGoHome}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Go Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: opacity.white10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: opacity.white70,
    textAlign: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: opacity.white50,
    marginBottom: 32,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: opacity.white50,
  },
  ringContainer: {
    marginTop: 16,
  },
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: opacity.primary10,
  },
  ringValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  ringLabel: {
    fontSize: 14,
    color: opacity.white60,
    marginTop: 4,
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: opacity.white70,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  feedbackContainer: {
    width: '100%',
    marginTop: 32,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.purple,
    overflow: 'hidden',
  },
  feedbackLoadingText: {
    fontSize: 14,
    color: opacity.white60,
    marginTop: 12,
    textAlign: 'center',
  },
  feedbackErrorContainer: {
    width: '100%',
    marginTop: 32,
    backgroundColor: opacity.error10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 20,
    alignItems: 'center',
  },
  feedbackErrorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: opacity.error20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  feedbackErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  feedbackErrorMessage: {
    fontSize: 14,
    color: opacity.white80,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  feedbackRetryButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  feedbackRetryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  feedbackIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: opacity.purple20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  feedbackHeaderText: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontSize: 13,
    color: opacity.white60,
  },
  feedbackContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  feedbackSection: {
    gap: 8,
  },
  feedbackSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.purple,
  },
  feedbackText: {
    fontSize: 15,
    color: opacity.white90,
    lineHeight: 22,
  },
  feedbackListItem: {
    fontSize: 14,
    color: opacity.white80,
    lineHeight: 20,
    paddingLeft: 8,
  },
  // Vocal Range Display styles
  rangeContainer: {
    width: '100%',
    backgroundColor: opacity.primary15,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  rangeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: opacity.primary20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rangeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
  },
  rangeNotesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  rangeNote: {
    alignItems: 'center',
  },
  rangeNoteValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rangeNoteLabel: {
    fontSize: 12,
    color: opacity.white60,
    textTransform: 'uppercase',
  },
  rangeArrow: {
    marginHorizontal: 8,
  },
  rangeHint: {
    fontSize: 13,
    color: opacity.white70,
    textAlign: 'center',
    marginTop: 8,
  },
});
