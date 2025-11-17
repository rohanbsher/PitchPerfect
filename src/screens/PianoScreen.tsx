/**
 * Piano Screen - Main Piano-First Experience
 *
 * The default screen showing:
 * - Real-time piano keyboard with pitch detection
 * - Pitch feedback display
 * - Microphone permission handling
 * - Loading states
 *
 * @module PianoScreen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PianoKeyboard } from '../components/piano/PianoKeyboard';
import { useAudio } from '../contexts/AudioContext';
import { DesignSystem as DS } from '../design/DesignSystem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PianoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    pianoReady,
    isListening,
    currentPitch,
    startPitchDetection,
  } = useAudio();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-start pitch detection when screen loads
  useEffect(() => {
    if (!isListening) {
      startPitchDetection();
    }
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulse animation when pitch is accurate
  useEffect(() => {
    if (currentPitch && currentPitch.accuracy > 85) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentPitch]);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return '#10B981'; // Green
    if (accuracy >= 70) return '#F59E0B'; // Amber
    if (accuracy >= 50) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getAccuracyLabel = (accuracy: number) => {
    if (accuracy >= 95) return 'Excellent!';
    if (accuracy >= 85) return 'Great!';
    if (accuracy >= 70) return 'Good';
    if (accuracy >= 50) return 'Keep trying';
    return 'Off pitch';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1E1E2E', '#2D2D44', '#1E1E2E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Compact Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>PitchPerfect</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, isListening && styles.statusDotActive]} />
              <Text style={styles.statusText}>
                {isListening ? 'Listening' : 'Mic Off'}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Layout: Piano Left (20%) | Feedback Right (80%) */}
        <View style={styles.mainLayout}>
          {/* Vertical Piano on Left */}
          <View style={styles.pianoSideSection}>
            {!pianoReady ? (
              <View style={styles.loadingContainerSide}>
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : (
              <PianoKeyboard orientation="vertical" />
            )}
          </View>

          {/* Pitch Feedback on Right */}
          <View style={styles.feedbackSection}>
            <View style={styles.pitchCard}>
              <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={styles.pitchCardGradient}
              >
                {currentPitch ? (
                  <Animated.View style={[styles.pitchContent, { transform: [{ scale: pulseAnim }] }]}>
                    {/* Note Display */}
                    <View style={styles.noteSection}>
                      <Text style={styles.noteLabel}>DETECTED NOTE</Text>
                      <Text style={styles.noteName}>{currentPitch.note}</Text>
                      <Text style={styles.frequency}>
                        {currentPitch.frequency.toFixed(1)} Hz
                      </Text>
                    </View>

                    {/* Accuracy Section */}
                    <View style={styles.accuracySection}>
                      <View style={styles.accuracyHeader}>
                        <Text style={styles.accuracyLabel}>ACCURACY</Text>
                        <Text style={[
                          styles.accuracyValue,
                          { color: getAccuracyColor(currentPitch.accuracy) }
                        ]}>
                          {currentPitch.accuracy}%
                        </Text>
                      </View>

                      {/* Accuracy Bar */}
                      <View style={styles.accuracyBarBg}>
                        <Animated.View
                          style={[
                            styles.accuracyBarFill,
                            {
                              width: `${currentPitch.accuracy}%`,
                              backgroundColor: getAccuracyColor(currentPitch.accuracy),
                            },
                          ]}
                        />
                      </View>

                      <Text style={styles.accuracyFeedback}>
                        {getAccuracyLabel(currentPitch.accuracy)}
                      </Text>
                    </View>

                    {/* Pitch Deviation */}
                    <View style={styles.deviationSection}>
                      <Text style={styles.deviationLabel}>PITCH</Text>
                      <Text style={[
                        styles.deviationValue,
                        currentPitch.centsOff === 0 && styles.perfectPitch
                      ]}>
                        {currentPitch.centsOff === 0
                          ? 'Perfect!'
                          : currentPitch.centsOff > 0
                          ? `${currentPitch.centsOff}¢ sharp`
                          : `${Math.abs(currentPitch.centsOff)}¢ flat`}
                      </Text>
                    </View>
                  </Animated.View>
                ) : (
                  <View style={styles.waitingContent}>
                    <View style={styles.micIconContainer}>
                      <Text style={styles.micIcon}>🎤</Text>
                    </View>
                    <Text style={styles.waitingTitle}>
                      {isListening ? 'Listening...' : 'Microphone Off'}
                    </Text>
                    <Text style={styles.waitingSubtitle}>
                      {isListening
                        ? 'Sing or hum a note to see it detected'
                        : 'Enable microphone to start'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {!isListening && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.enableButton}
              onPress={startPitchDetection}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enableButtonGradient}
              >
                <Text style={styles.enableButtonText}>Enable Microphone</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  // Main Layout: Piano Left | Feedback Right
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  pianoSideSection: {
    width: '22%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  loadingContainerSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackSection: {
    flex: 1,
  },

  // Pitch Card
  pitchCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pitchCardGradient: {
    flex: 1,
    padding: 16,
  },
  pitchContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // Note Section
  noteSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  noteName: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 64,
  },
  frequency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },

  // Accuracy Section
  accuracySection: {
    marginBottom: 12,
  },
  accuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  accuracyLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  accuracyBarBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  accuracyBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  accuracyFeedback: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    textAlign: 'center',
  },

  // Deviation Section
  deviationSection: {
    alignItems: 'center',
  },
  deviationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  deviationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  perfectPitch: {
    color: '#10B981',
  },

  // Waiting State
  waitingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  micIcon: {
    fontSize: 28,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  waitingSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // Action Button
  actionContainer: {
    position: 'absolute',
    bottom: 16,
    left: 12,
    right: 12,
  },
  enableButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  enableButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  enableButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
