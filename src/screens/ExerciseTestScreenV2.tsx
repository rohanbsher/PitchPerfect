/**
 * EXERCISE TEST SCREEN V2
 * Cross-platform implementation using AudioServiceFactory
 * Works on: Web (Web Audio API), iOS (Expo AV), Android (Expo AV)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { ExerciseEngine } from '../engines/ExerciseEngine';
import { YINPitchDetector } from '../utils/pitchDetection';
import { cMajorScale, fiveNoteWarmup } from '../data/exercises/scales';
import { Exercise, ExerciseResults, Note } from '../data/models';
import { PitchScaleVisualizer } from '../components/PitchScaleVisualizer';
import { DesignSystem as DS } from '../design/DesignSystem';
import { AudioServiceFactory } from '../services/audio/AudioServiceFactory';
import { IAudioService } from '../services/audio/IAudioService';

export const ExerciseTestScreenV2: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [detectedNote, setDetectedNote] = useState('—');
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [results, setResults] = useState<ExerciseResults | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(cMajorScale);

  // Refs
  const audioServiceRef = useRef<IAudioService | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const engineRef = useRef<ExerciseEngine | null>(null);

  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      console.log('🎹 Initializing cross-platform audio...');

      // 1. Create platform-specific audio service
      const audioService = AudioServiceFactory.create();
      audioServiceRef.current = audioService;

      // 2. Initialize audio service
      await audioService.initialize();

      // 3. Request permissions
      const granted = await audioService.requestPermissions();
      if (!granted) {
        console.error('❌ Microphone permission denied');
        return;
      }

      // 4. Create pitch detector with actual sample rate
      const sampleRate = audioService.getSampleRate();
      pitchDetectorRef.current = new YINPitchDetector(sampleRate, 2048, 0.1);

      console.log('✅ Audio initialized successfully');
      setIsReady(true);
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
    }
  };

  const startExercise = async () => {
    if (!audioServiceRef.current || !pitchDetectorRef.current) {
      console.error('❌ Audio service or pitch detector not ready');
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      // Start microphone capture
      await audioServiceRef.current.startMicrophoneCapture((audioBuffer, sampleRate) => {
        if (!pitchDetectorRef.current) return;

        // Run pitch detection
        const result = pitchDetectorRef.current.detectPitch(audioBuffer);

        if (result.frequency > 0 && result.confidence > 0.9) {
          setDetectedFrequency(result.frequency);
          setDetectedNote(result.note);
          setConfidence(result.confidence);

          // Calculate accuracy if we have a target note
          if (currentNote) {
            const cents = 1200 * Math.log2(result.frequency / currentNote.frequency);
            const accuracyValue = Math.max(0, 100 - Math.abs(cents));
            setAccuracy(accuracyValue);
          }
        }
      });

      // Create and start exercise engine
      // Note: Engine needs to be updated to use IAudioService instead of Tone.js
      console.log('⚠️ ExerciseEngine integration pending - needs refactor');

    } catch (error) {
      console.error('❌ Failed to start exercise:', error);
      setIsRunning(false);
    }
  };

  const stopExercise = async () => {
    if (!audioServiceRef.current) return;

    try {
      await audioServiceRef.current.stopMicrophoneCapture();
      setIsRunning(false);
      console.log('✅ Exercise stopped');
    } catch (error) {
      console.error('❌ Failed to stop exercise:', error);
    }
  };

  const cleanup = () => {
    if (audioServiceRef.current) {
      audioServiceRef.current.dispose();
      audioServiceRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
  };

  // Results screen
  if (results) {
    return (
      <View style={[styles.container, { backgroundColor: DS.colors.background.primary }]}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, DS.typography.largeTitle, { color: DS.colors.text.primary }]}>
            Exercise Complete
          </Text>

          <View style={styles.resultsCard}>
            <Text style={[styles.scoreText, { color: DS.colors.accent.success }]}>
              {results.overallAccuracy}%
            </Text>
            <Text style={[styles.scoreLabel, DS.typography.callout, { color: DS.colors.text.secondary }]}>
              Overall Accuracy
            </Text>

            <View style={styles.divider} />

            <Text style={[styles.sectionTitle, DS.typography.title3, { color: DS.colors.text.primary }]}>
              Results by Note
            </Text>
            {results.noteResults.map((result, idx) => (
              <View key={idx} style={styles.noteResultRow}>
                <Text style={[styles.noteText, DS.typography.body, { color: DS.colors.text.primary }]}>
                  {result.noteExpected}
                </Text>
                <Text style={[DS.typography.body, {
                  color: result.passed ? DS.colors.accent.success : DS.colors.accent.error
                }]}>
                  {result.averageAccuracy}%
                </Text>
              </View>
            ))}

            {results.strengths.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.sectionTitle, DS.typography.title3, { color: DS.colors.text.primary }]}>
                  Strengths
                </Text>
                {results.strengths.map((strength, idx) => (
                  <Text key={idx} style={[styles.feedbackText, DS.typography.callout, { color: DS.colors.text.secondary }]}>
                    • {strength}
                  </Text>
                ))}
              </>
            )}

            {results.improvements.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.sectionTitle, DS.typography.title3, { color: DS.colors.text.primary }]}>
                  Areas to Improve
                </Text>
                {results.improvements.map((improvement, idx) => (
                  <Text key={idx} style={[styles.feedbackText, DS.typography.callout, { color: DS.colors.text.secondary }]}>
                    • {improvement}
                  </Text>
                ))}
              </>
            )}
          </View>

          <TouchableOpacity onPress={() => setResults(null)} style={styles.buttonWrapper} activeOpacity={0.7}>
            <View style={styles.button}>
              <Text style={styles.buttonText}>Try Again</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Main screen
  return (
    <View style={[styles.container, { backgroundColor: DS.colors.background.primary }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, DS.typography.largeTitle, { color: DS.colors.text.primary }]}>
          Practice
        </Text>
        <Text style={[styles.subtitle, DS.typography.callout, { color: DS.colors.text.secondary }]}>
          Cross-platform audio engine test
        </Text>

        {/* Status */}
        <View style={styles.card}>
          <Text style={[DS.typography.body, { color: DS.colors.text.primary }]}>
            Status: {isReady ? '✅ Ready' : '⏳ Initializing...'}
          </Text>
          {isRunning && (
            <>
              <Text style={[DS.typography.body, { color: DS.colors.text.secondary, marginTop: DS.spacing.sm }]}>
                Detected: {detectedNote}
              </Text>
              <Text style={[DS.typography.body, { color: DS.colors.text.secondary }]}>
                Frequency: {detectedFrequency.toFixed(2)} Hz
              </Text>
              <Text style={[DS.typography.body, { color: DS.colors.text.secondary }]}>
                Confidence: {(confidence * 100).toFixed(0)}%
              </Text>
            </>
          )}
        </View>

        {/* Visualizer */}
        {isRunning && currentNote && (
          <View style={styles.visualizerContainer}>
            <PitchScaleVisualizer
              targetFrequency={currentNote.frequency}
              detectedFrequency={detectedFrequency}
              accuracy={accuracy}
            />
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <TouchableOpacity
              onPress={startExercise}
              disabled={!isReady}
              style={styles.buttonWrapper}
              activeOpacity={0.7}
            >
              <View style={[styles.button, !isReady && styles.buttonDisabled]}>
                <Text style={styles.buttonText}>Start Test</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={stopExercise} style={styles.buttonWrapper} activeOpacity={0.7}>
              <View style={[styles.button, { backgroundColor: DS.colors.accent.error }]}>
                <Text style={styles.buttonText}>Stop</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DS.spacing.xl,
    paddingTop: 60,
    paddingBottom: DS.spacing.xxxl,
  },
  title: {
    marginBottom: DS.spacing.xs,
  },
  subtitle: {
    marginBottom: DS.spacing.xxxl,
  },
  card: {
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.xl,
    marginBottom: DS.spacing.xl,
  },
  visualizerContainer: {
    marginBottom: DS.spacing.xl,
  },
  controls: {
    marginTop: DS.spacing.lg,
  },
  buttonWrapper: {
    marginBottom: DS.spacing.md,
  },
  button: {
    backgroundColor: DS.colors.accent.primary,
    borderRadius: DS.radius.lg,
    paddingVertical: DS.spacing.lg,
    paddingHorizontal: DS.spacing.xl,
    alignItems: 'center',
    ...DS.shadows.md,
  },
  buttonDisabled: {
    backgroundColor: DS.colors.background.tertiary,
    opacity: 0.5,
  },
  buttonText: {
    ...DS.typography.headline,
    color: DS.colors.text.primary,
    fontWeight: '600',
  },
  resultsCard: {
    backgroundColor: DS.colors.background.secondary,
    borderRadius: DS.radius.lg,
    padding: DS.spacing.xl,
    marginBottom: DS.spacing.xl,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: DS.spacing.xs,
  },
  scoreLabel: {
    textAlign: 'center',
    marginBottom: DS.spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.background.tertiary,
    marginVertical: DS.spacing.xl,
  },
  sectionTitle: {
    marginBottom: DS.spacing.md,
  },
  noteResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: DS.spacing.sm,
  },
  noteText: {
    fontWeight: '600',
  },
  feedbackText: {
    marginBottom: DS.spacing.sm,
  },
});
