/**
 * Results Screen
 *
 * Celebratory screen shown after completing a practice session.
 * Shows confetti animation and session statistics.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

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

  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];

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
const getMessage = (accuracy: number): { emoji: string; title: string; subtitle: string } => {
  if (accuracy >= 90) {
    return {
      emoji: '🌟',
      title: 'Outstanding!',
      subtitle: 'You nailed it! Perfect pitch performance!',
    };
  }
  if (accuracy >= 75) {
    return {
      emoji: '🎉',
      title: 'Great Job!',
      subtitle: 'Excellent work! Keep up the momentum!',
    };
  }
  if (accuracy >= 50) {
    return {
      emoji: '👏',
      title: 'Nice Work!',
      subtitle: 'Good progress! Practice makes perfect!',
    };
  }
  return {
    emoji: '💪',
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
  } = route.params || {};

  const message = getMessage(accuracy);

  const handlePracticeAgain = () => {
    navigation.replace('Main', { screen: 'Practice' });
  };

  const handleGoHome = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Confetti />

      <View style={styles.content}>
        {/* Celebratory Header */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.header}
        >
          <Text style={styles.emoji}>{message.emoji}</Text>
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

        {/* Stats Grid */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
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
      </View>

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
    backgroundColor: '#0A0A0A',
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
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  ringContainer: {
    marginTop: 16,
  },
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  ringValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ringLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  actions: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
