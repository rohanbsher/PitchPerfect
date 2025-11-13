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

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PianoKeyboard } from '../components/piano/PianoKeyboard';
import { useAudio } from '../contexts/AudioContext';
import { DesignSystem as DS } from '../design/DesignSystem';

export const PianoScreen: React.FC = () => {
  const {
    pianoReady,
    isListening,
    currentPitch,
    startPitchDetection,
  } = useAudio();

  // Auto-start pitch detection when screen loads
  useEffect(() => {
    if (!isListening) {
      startPitchDetection();
    }
  }, []);

  return (
    <LinearGradient
      colors={[DS.colors.accent.primary, DS.colors.accent.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>PITCH PERFECT</Text>
        <Text style={styles.subtitle}>Sing and watch the piano light up</Text>
      </View>

      {/* Pitch Feedback */}
      {currentPitch && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.detectedNote}>{currentPitch.note}</Text>
          <Text style={styles.frequency}>
            {currentPitch.frequency.toFixed(1)} Hz
          </Text>

          {/* Accuracy bar */}
          <View style={styles.accuracyBarContainer}>
            <View
              style={[
                styles.accuracyBar,
                {
                  width: `${currentPitch.accuracy}%`,
                  backgroundColor:
                    currentPitch.accuracy > 80
                      ? DS.colors.accent.success
                      : currentPitch.accuracy > 60
                      ? '#FFC107'
                      : DS.colors.accent.error,
                },
              ]}
            />
          </View>
          <Text style={styles.accuracyText}>{currentPitch.accuracy}% accurate</Text>

          {/* Cents off indicator */}
          <Text style={styles.centsText}>
            {currentPitch.centsOff > 0
              ? `${currentPitch.centsOff}¢ sharp`
              : currentPitch.centsOff < 0
              ? `${Math.abs(currentPitch.centsOff)}¢ flat`
              : 'Perfect pitch!'}
          </Text>
        </View>
      )}

      {!currentPitch && isListening && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.waitingText}>Sing any note...</Text>
        </View>
      )}

      {/* Piano Keyboard */}
      <View style={styles.pianoContainer}>
        {!pianoReady ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading piano...</Text>
          </View>
        ) : (
          <PianoKeyboard />
        )}
      </View>

      {/* Microphone Status */}
      {!isListening && (
        <View style={styles.microphonePrompt}>
          <TouchableOpacity
            style={styles.microphoneButton}
            onPress={startPitchDetection}
          >
            <Text style={styles.microphoneButtonText}>
              🎤 Enable Microphone
            </Text>
          </TouchableOpacity>
          <Text style={styles.microphoneHint}>
            Tap to allow microphone access for pitch detection
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    ...DS.typography.title1,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    ...DS.typography.callout,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },

  // Pitch Feedback
  feedbackContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    minHeight: 140,
  },
  detectedNote: {
    ...DS.typography.largeTitle,
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 48,
  },
  frequency: {
    ...DS.typography.callout,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  accuracyBarContainer: {
    width: 200,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  accuracyBar: {
    height: '100%',
    borderRadius: 4,
  },
  accuracyText: {
    ...DS.typography.footnote,
    color: '#ffffff',
    marginTop: 8,
    fontWeight: '600',
  },
  centsText: {
    ...DS.typography.footnote,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  waitingText: {
    ...DS.typography.title3,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },

  // Piano
  pianoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    ...DS.typography.callout,
    color: '#ffffff',
  },

  // Microphone Prompt
  microphonePrompt: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  microphoneButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  microphoneButtonText: {
    ...DS.typography.headline,
    color: DS.colors.accent.primary,
    fontWeight: '600',
  },
  microphoneHint: {
    ...DS.typography.caption1,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    textAlign: 'center',
  },
});
