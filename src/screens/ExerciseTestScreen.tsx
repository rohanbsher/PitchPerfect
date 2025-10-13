import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import * as Tone from 'tone';
import { ExerciseEngine } from '../engines/ExerciseEngine';
import { YINPitchDetector } from '../utils/pitchDetection';
import { cMajorScale, fiveNoteWarmup } from '../data/exercises/scales';
import { Exercise, ExerciseSettings, ExerciseResults, Note } from '../data/models';
import { PitchScaleVisualizer } from '../components/PitchScaleVisualizer';
import { DesignSystem } from '../design/DesignSystem';

/**
 * EXERCISE TEST SCREEN
 * Simple screen to test hands-free exercise flow
 */

export const ExerciseTestScreen: React.FC = () => {
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

      // Get actual sample rate
      const actualSampleRate = audioContext.sampleRate;
      console.log('📊 Sample Rate:', actualSampleRate);

      // Initialize pitch detector with actual sample rate
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
      console.error('❌ Audio initialization error:', error);
    }
  };

  const checkIfReady = () => {
    if (pianoRef.current && pitchDetectorRef.current && analyserRef.current) {
      setIsReady(true);
      console.log('✅ All systems ready!');
    }
  };

  const startExercise = async () => {
    if (!isReady || !pianoRef.current || !pitchDetectorRef.current || !analyserRef.current) {
      console.error('❌ Not ready to start exercise');
      return;
    }

    console.log('🎯 Starting exercise:', selectedExercise.name);

    // Reset state
    setIsRunning(true);
    setResults(null);
    setCurrentNoteIndex(0);
    setCurrentNote(null);

    // Create exercise settings
    const settings: ExerciseSettings = {
      tempo: selectedExercise.defaultTempo,
      startingNote: selectedExercise.defaultStartingNote,
      repeatCount: 1,
      tolerance: 70, // 70% accuracy to pass
    };

    // Create exercise engine
    const engine = new ExerciseEngine(
      selectedExercise,
      settings,
      pianoRef.current,
      pitchDetectorRef.current,
      analyserRef.current
    );

    // Set callbacks
    engine.setOnNoteChange((index, note) => {
      console.log('🎵 Note change:', index, note.note);
      setCurrentNoteIndex(index);
      setCurrentNote(note);
    });

    engine.setOnPitchDetected((freq, note, acc, conf) => {
      setDetectedFrequency(freq);
      setDetectedNote(note);
      setAccuracy(Math.round(acc));
      setConfidence(conf);
    });

    engine.setOnComplete((exerciseResults) => {
      console.log('🎉 Exercise complete!', exerciseResults);
      setIsRunning(false);
      setResults(exerciseResults);
    });

    engine.setOnError((error) => {
      console.error('❌ Exercise error:', error);
      setIsRunning(false);
    });

    engineRef.current = engine;

    // Start the exercise!
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

  // If showing results
  if (results) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>🎉 EXERCISE COMPLETE!</Text>

          <View style={styles.resultsCard}>
            <Text style={styles.scoreText}>{results.overallAccuracy}%</Text>
            <Text style={styles.scoreLabel}>Overall Accuracy</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Results by Note:</Text>
            {results.noteResults.map((result, idx) => (
              <View key={idx} style={styles.noteResult}>
                <Text style={styles.noteText}>
                  {result.noteExpected}: {result.passed ? '✓' : '✗'} {result.averageAccuracy}%
                </Text>
              </View>
            ))}

            {results.strengths.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>💪 Strengths:</Text>
                {results.strengths.map((strength, idx) => (
                  <Text key={idx} style={styles.feedbackText}>• {strength}</Text>
                ))}
              </>
            )}

            {results.improvements.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>📈 Improve:</Text>
                {results.improvements.map((improvement, idx) => (
                  <Text key={idx} style={styles.feedbackText}>• {improvement}</Text>
                ))}
              </>
            )}
          </View>

          <TouchableOpacity onPress={() => setResults(null)} style={styles.buttonWrapper}>
            <BlurView intensity={20} style={styles.button}>
              <Text style={styles.buttonText}>TRY AGAIN</Text>
            </BlurView>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // Main screen
  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <Text style={styles.title}>EXERCISE TEST</Text>
      <Text style={styles.subtitle}>Hands-Free Practice</Text>

      {/* Exercise Selection */}
      <View style={styles.exerciseSelector}>
        <TouchableOpacity
          onPress={() => setSelectedExercise(fiveNoteWarmup)}
          style={styles.exerciseOption}
        >
          <BlurView
            intensity={20}
            style={[
              styles.exerciseCard,
              selectedExercise.id === fiveNoteWarmup.id && styles.exerciseCardSelected
            ]}
          >
            <Text style={styles.exerciseName}>{fiveNoteWarmup.name}</Text>
            <Text style={styles.exerciseInfo}>
              🔹 {fiveNoteWarmup.difficulty} • {fiveNoteWarmup.notes.length} notes
            </Text>
          </BlurView>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedExercise(cMajorScale)}
          style={styles.exerciseOption}
        >
          <BlurView
            intensity={20}
            style={[
              styles.exerciseCard,
              selectedExercise.id === cMajorScale.id && styles.exerciseCardSelected
            ]}
          >
            <Text style={styles.exerciseName}>{cMajorScale.name}</Text>
            <Text style={styles.exerciseInfo}>
              🔹 {cMajorScale.difficulty} • {cMajorScale.notes.length} notes
            </Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Current Exercise Info */}
      {!isRunning && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{selectedExercise.name}</Text>
          <Text style={styles.infoDescription}>{selectedExercise.description}</Text>
          <View style={styles.divider} />
          <Text style={styles.instructionTitle}>Instructions:</Text>
          {selectedExercise.instructions.map((instruction, idx) => (
            <Text key={idx} style={styles.instruction}>• {instruction}</Text>
          ))}
        </View>
      )}

      {/* Active Exercise Display */}
      {isRunning && currentNote && (
        <View style={styles.activeExercise}>
          <Text style={styles.progressText}>
            Note {currentNoteIndex + 1} of {selectedExercise.notes.length}
          </Text>

          {/* Visual Pitch Scale */}
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
        >
          <BlurView intensity={20} style={styles.button}>
            <Text style={styles.buttonText}>
              {!isReady ? '⏳ Loading...' : '▶ START EXERCISE'}
            </Text>
          </BlurView>
        </TouchableOpacity>
      )}

      {/* Status */}
      <Text style={styles.statusText}>
        {!isReady ? 'Initializing audio...' : isRunning ? '🎵 Exercise running...' : 'Ready!'}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  exerciseSelector: {
    marginBottom: 24,
  },
  exerciseOption: {
    marginBottom: 12,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exerciseCardSelected: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  activeExercise: {
    alignItems: 'center',
    marginVertical: 40,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  currentNoteText: {
    fontSize: 80,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  frequencyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  feedback: {
    alignItems: 'center',
  },
  detectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonWrapper: {
    marginTop: 24,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 16,
  },
  resultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noteResult: {
    marginBottom: 8,
  },
  noteText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  feedbackText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
});
