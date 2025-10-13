import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import * as Tone from 'tone';
import { ExerciseEngine } from '../engines/ExerciseEngine';
import { YINPitchDetector } from '../utils/pitchDetection';
import { cMajorScale, fiveNoteWarmup } from '../data/exercises/scales';
import { Exercise, ExerciseResults, Note } from '../data/models';
import { PitchScaleVisualizer } from '../components/PitchScaleVisualizer';
import { DesignSystem as DS } from '../design/DesignSystem';

/**
 * PROFESSIONAL EXERCISE SCREEN
 * Apple Design Award-inspired interface
 * Minimal, focused, accessible
 */

export const ExerciseTestScreenProfessional: React.FC = () => {
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
  const pianoRef = useRef<Tone.Sampler | null>(null);
  const engineRef = useRef<ExerciseEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      console.log('🎹 Initializing audio...');

      // 1. Initialize Piano
      const piano = new Tone.Sampler({
        urls: {
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        onload: () => {
          console.log('✅ Piano loaded');
          pianoRef.current = piano;
          checkIfReady();
        },
      }).toDestination();

      // 2. Initialize Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const actualSampleRate = audioContext.sampleRate;
      console.log('📊 Sample Rate:', actualSampleRate);

      pitchDetectorRef.current = new YINPitchDetector(actualSampleRate, 2048, 0.1);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      console.log('✅ Microphone initialized');
      checkIfReady();
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
    }
  };

  const checkIfReady = () => {
    if (pianoRef.current && analyserRef.current && pitchDetectorRef.current) {
      setIsReady(true);
    }
  };

  const startExercise = async () => {
    if (!pianoRef.current || !analyserRef.current || !pitchDetectorRef.current) return;

    setIsRunning(true);
    setResults(null);

    const engine = new ExerciseEngine(selectedExercise, pianoRef.current, {
      onNoteChange: (index, note) => {
        setCurrentNoteIndex(index);
        setCurrentNote(note);
      },
      onPitchDetected: (frequency, note, accuracyValue, confidenceValue) => {
        setDetectedFrequency(frequency);
        setDetectedNote(note);
        setAccuracy(accuracyValue);
        setConfidence(confidenceValue);
      },
      onComplete: (exerciseResults) => {
        setIsRunning(false);
        setResults(exerciseResults);
      },
    });

    engineRef.current = engine;
    engine.setPitchDetector(analyserRef.current, pitchDetectorRef.current);
    await engine.start();
  };

  const cleanup = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    if (pianoRef.current) {
      pianoRef.current.dispose();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
          Select an exercise to begin
        </Text>

        {/* Exercise Selection */}
        <View style={styles.exerciseSelector}>
          <TouchableOpacity
            onPress={() => setSelectedExercise(fiveNoteWarmup)}
            activeOpacity={0.7}
            style={styles.exerciseOption}
          >
            <View style={[
              styles.exerciseCard,
              selectedExercise.id === fiveNoteWarmup.id && styles.exerciseCardSelected
            ]}>
              <Text style={[styles.exerciseName, DS.typography.headline, { color: DS.colors.text.primary }]}>
                {fiveNoteWarmup.name}
              </Text>
              <Text style={[styles.exerciseInfo, DS.typography.subheadline, { color: DS.colors.text.secondary }]}>
                {fiveNoteWarmup.difficulty} • {fiveNoteWarmup.notes.length} notes
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedExercise(cMajorScale)}
            activeOpacity={0.7}
            style={styles.exerciseOption}
          >
            <View style={[
              styles.exerciseCard,
              selectedExercise.id === cMajorScale.id && styles.exerciseCardSelected
            ]}>
              <Text style={[styles.exerciseName, DS.typography.headline, { color: DS.colors.text.primary }]}>
                {cMajorScale.name}
              </Text>
              <Text style={[styles.exerciseInfo, DS.typography.subheadline, { color: DS.colors.text.secondary }]}>
                {cMajorScale.difficulty} • {cMajorScale.notes.length} notes
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Exercise Info */}
        {!isRunning && (
          <View style={styles.infoCard}>
            <Text style={[styles.infoTitle, DS.typography.title2, { color: DS.colors.text.primary }]}>
              {selectedExercise.name}
            </Text>
            <Text style={[styles.infoDescription, DS.typography.body, { color: DS.colors.text.secondary }]}>
              {selectedExercise.description}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.instructionTitle, DS.typography.headline, { color: DS.colors.text.primary }]}>
              Instructions
            </Text>
            {selectedExercise.instructions.map((instruction, idx) => (
              <Text key={idx} style={[styles.instruction, DS.typography.callout, { color: DS.colors.text.secondary }]}>
                • {instruction}
              </Text>
            ))}
          </View>
        )}

        {/* Active Exercise Display */}
        {isRunning && currentNote && (
          <View style={styles.activeExercise}>
            <Text style={[styles.progressText, DS.typography.subheadline, { color: DS.colors.text.tertiary }]}>
              Note {currentNoteIndex + 1} of {selectedExercise.notes.length}
            </Text>

            <PitchScaleVisualizer
              notes={selectedExercise.notes}
              targetNote={currentNote}
              detectedFrequency={detectedFrequency}
              confidence={confidence}
              height={400}
            />
          </View>
        )}

        {/* Start Button */}
        {!isRunning && (
          <TouchableOpacity
            onPress={startExercise}
            disabled={!isReady}
            style={styles.buttonWrapper}
            activeOpacity={0.7}
          >
            <View style={[styles.button, !isReady && styles.buttonDisabled]}>
              <Text style={[styles.buttonText, DS.typography.headline]}>
                {!isReady ? 'Loading...' : 'Start Practice'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Status */}
        <Text style={[styles.statusText, DS.typography.footnote, { color: DS.colors.text.tertiary }]}>
          {!isReady ? 'Initializing audio...' : isRunning ? 'Exercise in progress...' : 'Ready to practice'}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: DS.spacing.massive,
    paddingHorizontal: DS.spacing.xxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: DS.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: DS.spacing.xxxl,
  },
  exerciseSelector: {
    marginBottom: DS.spacing.xxl,
  },
  exerciseOption: {
    marginBottom: DS.spacing.md,
  },
  exerciseCard: {
    backgroundColor: DS.colors.background.secondary,
    padding: DS.spacing.lg,
    borderRadius: DS.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...DS.shadows.sm,
  },
  exerciseCardSelected: {
    borderColor: DS.colors.accent.primary,
    backgroundColor: DS.colors.background.tertiary,
  },
  exerciseName: {
    marginBottom: DS.spacing.xs,
  },
  exerciseInfo: {
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: DS.colors.background.secondary,
    padding: DS.spacing.xl,
    borderRadius: DS.radius.lg,
    marginBottom: DS.spacing.xxl,
  },
  infoTitle: {
    marginBottom: DS.spacing.sm,
  },
  infoDescription: {
    marginBottom: DS.spacing.lg,
  },
  instructionTitle: {
    marginBottom: DS.spacing.md,
  },
  instruction: {
    marginBottom: DS.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: DS.colors.separator.opaque,
    marginVertical: DS.spacing.lg,
  },
  activeExercise: {
    alignItems: 'center',
    marginVertical: DS.spacing.xxxl,
  },
  progressText: {
    marginBottom: DS.spacing.lg,
  },
  buttonWrapper: {
    marginTop: DS.spacing.xxl,
  },
  button: {
    backgroundColor: DS.colors.accent.primary,
    paddingVertical: DS.spacing.lg,
    paddingHorizontal: DS.spacing.xxxl,
    borderRadius: DS.radius.md,
    alignItems: 'center',
    ...DS.shadows.md,
  },
  buttonDisabled: {
    backgroundColor: DS.colors.background.tertiary,
    opacity: 0.5,
  },
  buttonText: {
    color: DS.colors.background.primary,
    fontWeight: '600',
  },
  statusText: {
    textAlign: 'center',
    marginTop: DS.spacing.lg,
  },
  resultsCard: {
    backgroundColor: DS.colors.background.secondary,
    padding: DS.spacing.xxl,
    borderRadius: DS.radius.lg,
    marginTop: DS.spacing.xxl,
    marginBottom: DS.spacing.xxl,
    ...DS.shadows.md,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreLabel: {
    textAlign: 'center',
    marginBottom: DS.spacing.lg,
  },
  sectionTitle: {
    marginBottom: DS.spacing.md,
  },
  noteResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DS.spacing.sm,
  },
  noteText: {
    flex: 1,
  },
  feedbackText: {
    marginBottom: DS.spacing.xs,
  },
});
