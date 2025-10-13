import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YINPitchDetector } from '../utils/pitchDetection';
import { referencePitchService } from '../services/referencePitchService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExerciseResult {
  targetNote: string;
  targetFrequency: number;
  sungNote: string;
  sungFrequency: number;
  accuracy: number;
  timestamp: number;
}

type ExercisePhase = 'select' | 'listen' | 'ready' | 'sing' | 'result';

export const VocalCoachingSession: React.FC = () => {
  // Core exercise state
  const [currentPhase, setCurrentPhase] = useState<ExercisePhase>('select');
  const [targetNote, setTargetNote] = useState<string>('C4');
  const [exerciseResults, setExerciseResults] = useState<ExerciseResult[]>([]);
  const [sessionScore, setSessionScore] = useState(0);

  // Pitch detection state
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState('—');
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [pitchAccuracy, setPitchAccuracy] = useState(0);
  const [singingDuration, setSingingDuration] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const targetNoteScale = useRef(new Animated.Value(0.8)).current;
  const sungNoteScale = useRef(new Animated.Value(0.8)).current;

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Exercise timing
  const singingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available practice notes (common vocal range)
  const practiceNotes = [
    'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
    'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'
  ];

  useEffect(() => {
    // Initialize
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    pitchDetectorRef.current = new YINPitchDetector(44100, 2048, 0.1);
    initializeAudio();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Animate target note when it changes
    if (currentPhase === 'listen' || currentPhase === 'ready') {
      Animated.spring(targetNoteScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(targetNoteScale, {
        toValue: 0.8,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [currentPhase, targetNote]);

  useEffect(() => {
    // Animate sung note when detected
    if (currentPhase === 'sing' && currentNote !== '—') {
      Animated.spring(sungNoteScale, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(sungNoteScale, {
        toValue: 0.8,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [currentNote, currentPhase]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

    } catch (error) {
      console.error('Microphone error:', error);
    }
  };

  const startListening = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) return;

    setIsListening(true);
    setSingingDuration(0);

    // Start singing timer
    singingTimerRef.current = setInterval(() => {
      setSingingDuration(prev => prev + 100);
    }, 100);

    detectPitchContinuously();
  };

  const stopListening = () => {
    setIsListening(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (singingTimerRef.current) {
      clearInterval(singingTimerRef.current);
    }
  };

  const detectPitchContinuously = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) return;

    const dataArray = new Float32Array(analyserRef.current.fftSize);

    const detect = () => {
      if (!isListening || !analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS for volume
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / dataArray.length);

      if (rms > 0.015) { // Slightly higher threshold for better detection
        const pitch = pitchDetectorRef.current!.detectPitch(dataArray);

        if (pitch && pitch.confidence > 0.7) {
          setCurrentNote(pitch.note);
          setCurrentFrequency(pitch.frequency);

          // Calculate accuracy against target
          if (currentPhase === 'sing') {
            const targetFreq = getFrequencyForNote(targetNote);
            if (targetFreq > 0) {
              const freqRatio = pitch.frequency / targetFreq;
              const centsDiff = Math.abs(1200 * Math.log2(freqRatio));
              const accuracy = Math.max(0, 1 - centsDiff / 50);
              setPitchAccuracy(accuracy);

              // Auto-complete if singing accurately for 2+ seconds
              if (accuracy > 0.85 && singingDuration > 2000) {
                completeSingingPhase();
                return;
              }
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const getFrequencyForNote = (note: string): number => {
    // This should match the frequencies in referencePitchService
    const noteFrequencies: { [key: string]: number } = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
      'G5': 783.99, 'A5': 880.00, 'B5': 987.77
    };
    return noteFrequencies[note] || 0;
  };

  const selectNote = (note: string) => {
    setTargetNote(note);
    setCurrentPhase('listen');

    // Auto-play the reference note
    setTimeout(() => {
      playReferenceNote();
    }, 500);
  };

  const playReferenceNote = async () => {
    await referencePitchService.playNote(targetNote, 2000, 'sine', 0.4);

    // Move to ready phase after note finishes
    setTimeout(() => {
      setCurrentPhase('ready');

      // Auto-move to sing phase after countdown
      phaseTimerRef.current = setTimeout(() => {
        startSingingPhase();
      }, 3000);
    }, 2200);
  };

  const startSingingPhase = () => {
    setCurrentPhase('sing');
    setCurrentNote('—');
    setCurrentFrequency(0);
    setPitchAccuracy(0);
    startListening();

    // Auto-timeout after 10 seconds
    phaseTimerRef.current = setTimeout(() => {
      completeSingingPhase();
    }, 10000);
  };

  const completeSingingPhase = () => {
    stopListening();

    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
    }

    // Record result
    const result: ExerciseResult = {
      targetNote,
      targetFrequency: getFrequencyForNote(targetNote),
      sungNote: currentNote,
      sungFrequency: currentFrequency,
      accuracy: pitchAccuracy,
      timestamp: Date.now(),
    };

    setExerciseResults(prev => [...prev, result]);
    setCurrentPhase('result');

    // Update session score
    const avgAccuracy = [...exerciseResults, result].reduce((sum, r) => sum + r.accuracy, 0) / (exerciseResults.length + 1);
    setSessionScore(avgAccuracy * 100);

    // Auto-return to select after showing result
    setTimeout(() => {
      setCurrentPhase('select');
    }, 4000);
  };

  const cleanup = () => {
    stopListening();

    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
    }

    if (singingTimerRef.current) {
      clearInterval(singingTimerRef.current);
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    referencePitchService.dispose();
  };

  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'select':
        return 'Choose a note to practice';
      case 'listen':
        return `Listen to ${targetNote}`;
      case 'ready':
        return 'Get ready to sing...';
      case 'sing':
        return `Sing ${targetNote}`;
      case 'result':
        return 'Great job!';
      default:
        return '';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy > 0.9) return '#34C759';
    if (accuracy > 0.7) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <LinearGradient
      colors={['#F8F9FA', '#FFFFFF']}
      style={styles.container}
    >
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Coach</Text>
          <Text style={styles.subtitle}>Professional Pitch Training</Text>

          {exerciseResults.length > 0 && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Session Score</Text>
              <Text style={[styles.scoreValue, { color: getAccuracyColor(sessionScore / 100) }]}>
                {sessionScore.toFixed(0)}%
              </Text>
            </View>
          )}
        </View>

        {/* Current Phase Display */}
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseInstruction}>{getPhaseInstruction()}</Text>

          {currentPhase === 'ready' && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>Ready in 3...</Text>
            </View>
          )}
        </View>

        {/* Note Selection */}
        {currentPhase === 'select' && (
          <View style={styles.noteSelection}>
            <Text style={styles.sectionTitle}>Select Practice Note</Text>
            <View style={styles.noteGrid}>
              {practiceNotes.map((note) => (
                <TouchableOpacity
                  key={note}
                  style={[
                    styles.noteButton,
                    targetNote === note && styles.noteButtonActive
                  ]}
                  onPress={() => selectNote(note)}
                >
                  <Text style={[
                    styles.noteButtonText,
                    targetNote === note && styles.noteButtonTextActive
                  ]}>
                    {note}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Target Note Display */}
        {(currentPhase === 'listen' || currentPhase === 'ready' || currentPhase === 'sing') && (
          <View style={styles.noteDisplayContainer}>
            <Text style={styles.noteLabel}>Target Note</Text>
            <Animated.View style={[
              styles.noteCircle,
              {
                transform: [{ scale: targetNoteScale }],
                backgroundColor: '#007AFF'
              }
            ]}>
              <Text style={styles.noteText}>{targetNote}</Text>
            </Animated.View>
          </View>
        )}

        {/* Sung Note Display */}
        {currentPhase === 'sing' && (
          <View style={styles.noteDisplayContainer}>
            <Text style={styles.noteLabel}>You're Singing</Text>
            <Animated.View style={[
              styles.noteCircle,
              {
                transform: [{ scale: sungNoteScale }],
                backgroundColor: getAccuracyColor(pitchAccuracy)
              }
            ]}>
              <Text style={styles.noteText}>{currentNote}</Text>
            </Animated.View>

            {pitchAccuracy > 0 && (
              <View style={styles.accuracyDisplay}>
                <Text style={styles.accuracyText}>
                  {(pitchAccuracy * 100).toFixed(0)}% accurate
                </Text>
                <View style={styles.accuracyBar}>
                  <View style={[
                    styles.accuracyFill,
                    {
                      width: `${pitchAccuracy * 100}%`,
                      backgroundColor: getAccuracyColor(pitchAccuracy)
                    }
                  ]} />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Result Display */}
        {currentPhase === 'result' && exerciseResults.length > 0 && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Exercise Complete!</Text>

            {(() => {
              const lastResult = exerciseResults[exerciseResults.length - 1];
              return (
                <View style={styles.resultDetails}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Target:</Text>
                    <Text style={styles.resultValue}>{lastResult.targetNote}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>You Sang:</Text>
                    <Text style={styles.resultValue}>{lastResult.sungNote}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Accuracy:</Text>
                    <Text style={[
                      styles.resultValue,
                      { color: getAccuracyColor(lastResult.accuracy) }
                    ]}>
                      {(lastResult.accuracy * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })()}
          </View>
        )}

        {/* Controls */}
        {currentPhase === 'listen' && (
          <TouchableOpacity style={styles.actionButton} onPress={playReferenceNote}>
            <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>🔊 Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {currentPhase === 'sing' && (
          <TouchableOpacity style={styles.actionButton} onPress={completeSingingPhase}>
            <LinearGradient colors={['#34C759', '#28A745']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>✓ Done Singing</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Progress Summary */}
        {exerciseResults.length > 0 && (
          <View style={styles.progressSummary}>
            <Text style={styles.progressTitle}>Session Progress</Text>
            <Text style={styles.progressText}>
              {exerciseResults.length} exercises completed
            </Text>
            <Text style={styles.progressText}>
              Average accuracy: {sessionScore.toFixed(0)}%
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  phaseContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  phaseInstruction: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  countdownContainer: {
    marginTop: 20,
  },
  countdownText: {
    fontSize: 18,
    color: '#FF9500',
    fontWeight: '500',
  },
  noteSelection: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  noteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  noteButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  noteButtonActive: {
    backgroundColor: '#007AFF',
  },
  noteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  noteButtonTextActive: {
    color: '#FFFFFF',
  },
  noteDisplayContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  noteLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noteText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accuracyDisplay: {
    alignItems: 'center',
    marginTop: 20,
  },
  accuracyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  accuracyBar: {
    width: 200,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  resultContainer: {
    backgroundColor: '#F2F2F7',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 20,
  },
  resultDetails: {
    width: '100%',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  actionButton: {
    marginVertical: 20,
  },
  buttonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  progressSummary: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
});