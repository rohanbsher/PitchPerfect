/**
 * Farinelli Breathing Screen
 * Guided breathing exercise with progressive rounds
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { farinelliBreathing, BreathingSession } from '../data/models';
import { BreathingCircle } from '../components/BreathingCircle';
import { CelebrationConfetti } from '../components/CelebrationConfetti';

// Design tokens
const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF599',
  primary: '#00D9FF',
  secondary: '#5E5CE6',
  success: '#32D74B',
};

const spacing = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 20,
};

const fontSizes = {
  medium: 17,
  large: 20,
  xlarge: 22,
  xxlarge: 28,
};

const borderRadius = 12;

export const FarinelliBreathingScreen: React.FC = () => {
  const [session, setSession] = useState<BreathingSession>({
    exerciseId: farinelliBreathing.id,
    startTime: new Date(),
    currentRound: 0,
    currentPhase: 'inhale',
    beatsRemaining: farinelliBreathing.rounds[0].inhaleBeats,
    completed: false,
  });

  const [isActive, setIsActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [triggerCelebration, setTriggerCelebration] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic - runs every second
  useEffect(() => {
    if (!isActive || session.completed) {
      return;
    }

    timerRef.current = setInterval(() => {
      setSession((prev) => {
        const newBeatsRemaining = prev.beatsRemaining - 1;

        // Beat tick - haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Phase complete
        if (newBeatsRemaining <= 0) {
          const currentRound = farinelliBreathing.rounds[prev.currentRound];

          // Move to next phase
          if (prev.currentPhase === 'inhale') {
            // Inhale → Hold
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return {
              ...prev,
              currentPhase: 'hold',
              beatsRemaining: currentRound.holdBeats,
            };
          } else if (prev.currentPhase === 'hold') {
            // Hold → Exhale
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return {
              ...prev,
              currentPhase: 'exhale',
              beatsRemaining: currentRound.exhaleBeats,
            };
          } else if (prev.currentPhase === 'exhale') {
            // Exhale → Next round or complete
            const nextRoundIndex = prev.currentRound + 1;

            if (nextRoundIndex >= farinelliBreathing.rounds.length) {
              // Exercise complete!
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTriggerCelebration((t) => t + 1);
              return {
                ...prev,
                completed: true,
              };
            } else {
              // Move to next round
              const nextRound = farinelliBreathing.rounds[nextRoundIndex];
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              return {
                ...prev,
                currentRound: nextRoundIndex,
                currentPhase: 'inhale',
                beatsRemaining: nextRound.inhaleBeats,
              };
            }
          }
        }

        // Continue current phase
        return {
          ...prev,
          beatsRemaining: newBeatsRemaining,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, session.completed]);

  const handleStart = () => {
    setShowInstructions(false);
    setIsActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePause = () => {
    setIsActive(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleResume = () => {
    setIsActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleReset = () => {
    setIsActive(false);
    setSession({
      exerciseId: farinelliBreathing.id,
      startTime: new Date(),
      currentRound: 0,
      currentPhase: 'inhale',
      beatsRemaining: farinelliBreathing.rounds[0].inhaleBeats,
      completed: false,
    });
    setShowInstructions(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const currentRound = farinelliBreathing.rounds[session.currentRound];

  if (showInstructions) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.instructionsContainer}>
          <Text style={styles.title}>{farinelliBreathing.name}</Text>
          <Text style={styles.description}>{farinelliBreathing.description}</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Duration</Text>
            <Text style={styles.infoValue}>
              {Math.floor(farinelliBreathing.totalDuration / 60)} min {farinelliBreathing.totalDuration % 60} sec
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How It Works</Text>
            {farinelliBreathing.instructions.map((instruction, index) => (
              <Text key={index} style={styles.instructionItem}>
                • {instruction}
              </Text>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Rounds</Text>
            {farinelliBreathing.rounds.map((round) => (
              <Text key={round.number} style={styles.roundItem}>
                Round {round.number}: {round.inhaleBeats}s inhale → {round.holdBeats}s hold → {round.exhaleBeats}s
                exhale
              </Text>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Benefits</Text>
            {farinelliBreathing.benefits.map((benefit, index) => (
              <Text key={index} style={styles.benefitItem}>
                ✓ {benefit}
              </Text>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>START BREATHING</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.exerciseContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.exerciseTitle}>{farinelliBreathing.name}</Text>
          <Text style={styles.roundIndicator}>
            Round {session.currentRound + 1} of {farinelliBreathing.rounds.length}
          </Text>
        </View>

        {/* Breathing Circle */}
        <View style={styles.circleContainer}>
          <BreathingCircle
            phase={session.currentPhase}
            beatsRemaining={session.beatsRemaining}
            totalBeats={
              session.currentPhase === 'inhale'
                ? currentRound.inhaleBeats
                : session.currentPhase === 'hold'
                ? currentRound.holdBeats
                : currentRound.exhaleBeats
            }
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!session.completed && (
            <>
              {isActive ? (
                <TouchableOpacity style={styles.pauseButton} onPress={handlePause} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>PAUSE</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resumeButton} onPress={handleResume} activeOpacity={0.8}>
                  <Text style={styles.buttonText}>RESUME</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{session.completed ? 'DO AGAIN' : 'RESET'}</Text>
          </TouchableOpacity>
        </View>

        {/* Completion Message */}
        {session.completed && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>EXCELLENT WORK!</Text>
            <Text style={styles.completionSubtitle}>You completed all 4 rounds</Text>
            <Text style={styles.completionMessage}>Your breath control is getting stronger! 💪</Text>
          </View>
        )}
      </View>

      {/* Celebration */}
      <CelebrationConfetti trigger={triggerCelebration} accuracy={100} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  instructionsContainer: {
    padding: spacing.large,
  },
  title: {
    fontSize: fontSizes.xxlarge,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius,
    padding: spacing.medium,
    marginBottom: spacing.medium,
  },
  infoTitle: {
    fontSize: fontSizes.large,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.small,
  },
  infoValue: {
    fontSize: fontSizes.medium,
    color: colors.primary,
    fontWeight: '600',
  },
  instructionItem: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
    marginBottom: spacing.small,
    lineHeight: 22,
  },
  roundItem: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
    marginBottom: spacing.small,
    lineHeight: 22,
  },
  benefitItem: {
    fontSize: fontSizes.medium,
    color: colors.success,
    marginBottom: spacing.small,
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius,
    marginTop: spacing.large,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: fontSizes.large,
    fontWeight: '700',
    color: colors.background,
  },
  exerciseContainer: {
    flex: 1,
    padding: spacing.large,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xlarge,
  },
  exerciseTitle: {
    fontSize: fontSizes.xlarge,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.small,
  },
  roundIndicator: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xlarge,
    gap: spacing.medium,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius,
    alignItems: 'center',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius,
    alignItems: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fontSizes.medium,
    fontWeight: '700',
    color: colors.text,
  },
  completionContainer: {
    alignItems: 'center',
    marginTop: spacing.xlarge,
  },
  completionTitle: {
    fontSize: fontSizes.xxlarge,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.small,
  },
  completionSubtitle: {
    fontSize: fontSizes.large,
    color: colors.text,
    marginBottom: spacing.small,
  },
  completionMessage: {
    fontSize: fontSizes.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
