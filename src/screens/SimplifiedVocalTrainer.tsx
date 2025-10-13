import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YINPitchDetector } from '../utils/pitchDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExerciseSession {
  targetNote: string;
  targetFrequency: number;
  sungNote: string;
  sungFrequency: number;
  accuracy: number;
  completed: boolean;
}

type AppMode = 'detection' | 'practice';

export const SimplifiedVocalTrainer: React.FC = () => {
  // Core state
  const [mode, setMode] = useState<AppMode>('detection');
  const [currentNote, setCurrentNote] = useState('—');
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Practice mode state
  const [targetNote, setTargetNote] = useState('A4');
  const [practicePhase, setPracticePhase] = useState<'select' | 'playing' | 'listening' | 'result'>('select');
  const [currentSession, setCurrentSession] = useState<ExerciseSession | null>(null);
  const [sessionScore, setSessionScore] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const noteScaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Audio refs - SINGLE AUDIO CONTEXT FOR EVERYTHING
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Reference note playback
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Practice notes with exact frequencies
  const practiceNotes = [
    { note: 'C4', frequency: 261.63 },
    { note: 'D4', frequency: 293.66 },
    { note: 'E4', frequency: 329.63 },
    { note: 'F4', frequency: 349.23 },
    { note: 'G4', frequency: 392.00 },
    { note: 'A4', frequency: 440.00 },
    { note: 'B4', frequency: 493.88 },
    { note: 'C5', frequency: 523.25 },
  ];

  const getNoteFrequency = (note: string): number => {
    const noteData = practiceNotes.find(n => n.note === note);
    return noteData ? noteData.frequency : 440;
  };

  useEffect(() => {
    // Initialize everything
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    initializeAudio();
    pitchDetectorRef.current = new YINPitchDetector(44100, 2048, 0.1);

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Auto-start pitch detection when audio is ready
    if (audioContextRef.current && analyserRef.current && pitchDetectorRef.current && !isListening) {
      console.log('Auto-starting pitch detection from useEffect');
      startPitchDetection();
    }
  }, [isListening]);

  useEffect(() => {
    // Animate note display based on accuracy
    if (mode === 'practice' && practicePhase === 'listening') {
      const accuracy = calculateAccuracy();
      if (accuracy > 0.8) {
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [currentNote, mode, practicePhase]);

  const initializeAudio = async () => {
    try {
      console.log('Initializing audio...');

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      console.log('Microphone access granted');
      streamRef.current = stream;

      // Create single audio context for everything
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      // Resume audio context if suspended (required for autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('Audio context resumed');
      }

      // Setup analyser for pitch detection
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const microphone = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      console.log('Audio context initialized successfully, state:', audioContextRef.current.state);

      // Force start pitch detection after audio is ready
      setTimeout(() => {
        if (!isListening) {
          console.log('Force starting pitch detection after initialization');
          startPitchDetection();
        }
      }, 100);

    } catch (error) {
      console.error('Microphone error:', error);
    }
  };

  const startPitchDetection = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) {
      console.log('Cannot start pitch detection - missing dependencies');
      return;
    }

    // Cancel any existing animation frame
    if (animationFrameRef.current) {
      console.log('Cancelling existing detection loop');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    console.log('Starting pitch detection...');
    setIsListening(true);

    const dataArray = new Float32Array(analyserRef.current.fftSize);

    const detect = () => {
      // CRITICAL FIX: Don't check isListening state here - causes stale closure bug
      // The detect loop should run continuously once started
      if (!analyserRef.current || !pitchDetectorRef.current) {
        console.log('Stopping detection - missing dependencies');
        return;
      }

      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS for volume level
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / dataArray.length);
      setAudioLevel(rms);

      // Detect pitch if there's sufficient volume
      if (rms > 0.005) {  // Lower threshold for better sensitivity
        const pitch = pitchDetectorRef.current.detectPitch(dataArray);

        if (pitch && pitch.confidence > 0.5) {  // Lower confidence threshold
          setCurrentNote(pitch.note);
          setCurrentFrequency(pitch.frequency);

          // Update current session if in practice mode
          if (mode === 'practice' && practicePhase === 'listening' && currentSession) {
            setCurrentSession(prev => prev ? {
              ...prev,
              sungNote: pitch.note,
              sungFrequency: pitch.frequency,
              accuracy: calculateAccuracy(pitch.frequency)
            } : null);
          }
        }
      }

      // Continue the loop - THIS IS CRITICAL!
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    // START THE LOOP - This was missing in the original code!
    detect();
  };

  const stopPitchDetection = () => {
    console.log('Stopping pitch detection...');
    setIsListening(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const playReferenceNote = async (note: string, duration: number = 2000) => {
    if (!audioContextRef.current) return;

    // Stop any existing oscillator
    stopReferenceNote();

    const frequency = getNoteFrequency(note);
    console.log(`Playing reference note ${note} at ${frequency}Hz`);

    try {
      // Create oscillator using the SAME audio context
      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);

      // Create gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);

      // Connect nodes
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Start oscillator
      oscillatorRef.current.start(audioContextRef.current.currentTime);

      // Auto-stop after duration
      setTimeout(() => {
        stopReferenceNote();
      }, duration);

    } catch (error) {
      console.error('Error playing reference note:', error);
    }
  };

  const stopReferenceNote = () => {
    if (oscillatorRef.current) {
      try {
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current!.currentTime + 0.05);
        }
        setTimeout(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
            oscillatorRef.current = null;
          }
          if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
          }
        }, 50);
      } catch (error) {
        console.error('Error stopping reference note:', error);
      }
    }
  };

  const calculateAccuracy = (frequency?: number): number => {
    if (!currentSession || !frequency) return 0;

    const targetFreq = currentSession.targetFrequency;
    const sungFreq = frequency || currentSession.sungFrequency;

    if (targetFreq === 0 || sungFreq === 0) return 0;

    const freqRatio = sungFreq / targetFreq;
    const centsDiff = Math.abs(1200 * Math.log2(freqRatio));
    return Math.max(0, 1 - centsDiff / 50);
  };

  const startPracticeMode = () => {
    setMode('practice');
    setPracticePhase('select');

    Animated.spring(noteScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const selectPracticeNote = async (note: string) => {
    setTargetNote(note);
    setPracticePhase('playing');

    // Ensure audio context is running
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
      console.log('Audio context resumed for practice');
    }

    // Ensure pitch detection is running
    if (!isListening) {
      console.log('Starting pitch detection for practice mode');
      startPitchDetection();
    }

    // Create new session
    const session: ExerciseSession = {
      targetNote: note,
      targetFrequency: getNoteFrequency(note),
      sungNote: '—',
      sungFrequency: 0,
      accuracy: 0,
      completed: false,
    };
    setCurrentSession(session);

    // Play reference note
    playReferenceNote(note, 3000);

    // Move to listening phase after note finishes
    setTimeout(() => {
      setPracticePhase('listening');

      // Auto-complete after 8 seconds
      setTimeout(() => {
        completeExercise();
      }, 8000);
    }, 3200);
  };

  const completeExercise = () => {
    if (!currentSession) return;

    const finalAccuracy = calculateAccuracy();
    const completedSession = {
      ...currentSession,
      accuracy: finalAccuracy,
      completed: true,
    };

    setCurrentSession(completedSession);
    setPracticePhase('result');
    setCompletedExercises(prev => prev + 1);

    // Update session score (average of all exercises)
    setSessionScore(finalAccuracy * 100);

    // Auto-return to selection after 3 seconds
    setTimeout(() => {
      setPracticePhase('select');
      setCurrentSession(null);
    }, 3000);
  };

  const returnToDetection = () => {
    setMode('detection');
    setPracticePhase('select');
    setCurrentSession(null);

    Animated.spring(noteScaleAnim, {
      toValue: 0.9,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const cleanup = () => {
    stopPitchDetection();
    stopReferenceNote();

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy > 0.85) return '#34C759';
    if (accuracy > 0.7) return '#FF9500';
    return '#FF3B30';
  };

  const getCurrentAccuracy = () => {
    if (mode === 'practice' && currentSession) {
      return calculateAccuracy();
    }
    return 0;
  };

  return (
    <LinearGradient
      colors={['#F8F9FA', '#FFFFFF']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Trainer</Text>
          <Text style={styles.subtitle}>
            {mode === 'detection' ? 'Real-time Pitch Detection' : 'Practice Mode'}
          </Text>
        </View>

        {/* Current Note Display - Always Visible */}
        <View style={styles.noteDisplayContainer}>
          <Text style={styles.noteLabel}>
            {mode === 'detection' ? 'You\'re Singing' :
             practicePhase === 'listening' ? 'You\'re Singing' : 'Current Note'}
          </Text>

          <Animated.View style={[
            styles.noteCircle,
            {
              transform: [
                { scale: Animated.multiply(noteScaleAnim, pulseAnim) }
              ],
              backgroundColor: mode === 'practice' && practicePhase === 'listening' ?
                getAccuracyColor(getCurrentAccuracy()) : '#007AFF'
            }
          ]}>
            <Text style={styles.noteText}>{currentNote}</Text>
          </Animated.View>

          {currentFrequency > 0 && (
            <Text style={styles.frequencyText}>
              {currentFrequency.toFixed(1)} Hz
            </Text>
          )}

          {/* Audio level indicator */}
          <Text style={styles.audioLevel}>
            Audio: {(audioLevel * 100).toFixed(1)}%
          </Text>
        </View>

        {/* Detection Mode Controls */}
        {mode === 'detection' && (
          <View style={styles.detectionControls}>
            <TouchableOpacity style={styles.practiceButton} onPress={startPracticeMode}>
              <LinearGradient colors={['#007AFF', '#0051D5']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>🎯 Start Practice</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.statusContainer}>
              {isListening ? (
                <Text style={styles.statusText}>
                  ● Listening - Sing any note to see real-time detection
                </Text>
              ) : (
                <Text style={styles.statusText}>
                  Initializing microphone...
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Practice Mode - Note Selection */}
        {mode === 'practice' && practicePhase === 'select' && (
          <View style={styles.practiceControls}>
            <Text style={styles.sectionTitle}>Choose a note to practice</Text>

            <View style={styles.noteGrid}>
              {practiceNotes.map((noteData) => (
                <TouchableOpacity
                  key={noteData.note}
                  style={styles.noteButton}
                  onPress={() => selectPracticeNote(noteData.note)}
                >
                  <Text style={styles.noteButtonText}>{noteData.note}</Text>
                  <Text style={styles.noteFreqText}>{noteData.frequency}Hz</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.backButton} onPress={returnToDetection}>
              <Text style={styles.backButtonText}>← Back to Detection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Practice Mode - Playing Reference */}
        {mode === 'practice' && practicePhase === 'playing' && (
          <View style={styles.practicePhase}>
            <Text style={styles.phaseTitle}>Listen to {targetNote}</Text>
            <Text style={styles.phaseSubtitle}>
              Playing reference note at {getNoteFrequency(targetNote)}Hz
            </Text>
            <Text style={styles.phaseInstruction}>
              Listen carefully, then sing this note back...
            </Text>
          </View>
        )}

        {/* Practice Mode - Listening */}
        {mode === 'practice' && practicePhase === 'listening' && currentSession && (
          <View style={styles.practicePhase}>
            <Text style={styles.phaseTitle}>Sing {targetNote}</Text>
            <Text style={styles.targetFreq}>Target: {currentSession.targetFrequency}Hz</Text>

            <View style={styles.accuracyDisplay}>
              <Text style={[styles.accuracyText, { color: getAccuracyColor(getCurrentAccuracy()) }]}>
                {(getCurrentAccuracy() * 100).toFixed(0)}% accurate
              </Text>
              <View style={styles.accuracyBar}>
                <View style={[
                  styles.accuracyFill,
                  {
                    width: `${getCurrentAccuracy() * 100}%`,
                    backgroundColor: getAccuracyColor(getCurrentAccuracy())
                  }
                ]} />
              </View>
            </View>

            <TouchableOpacity style={styles.completeButton} onPress={completeExercise}>
              <Text style={styles.completeButtonText}>✓ Complete Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Practice Mode - Result */}
        {mode === 'practice' && practicePhase === 'result' && currentSession && (
          <View style={styles.resultDisplay}>
            <Text style={styles.resultTitle}>Exercise Complete!</Text>

            <View style={styles.resultDetails}>
              <Text style={styles.resultItem}>Target: {currentSession.targetNote}</Text>
              <Text style={styles.resultItem}>You Sang: {currentSession.sungNote}</Text>
              <Text style={[styles.resultItem, { color: getAccuracyColor(currentSession.accuracy) }]}>
                Accuracy: {(currentSession.accuracy * 100).toFixed(0)}%
              </Text>
            </View>

            <Text style={styles.resultMessage}>
              {currentSession.accuracy > 0.9 ? '🎉 Excellent!' :
               currentSession.accuracy > 0.7 ? '👍 Good job!' : '💪 Keep practicing!'}
            </Text>
          </View>
        )}

        {/* Session Stats */}
        {completedExercises > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Session Progress</Text>
            <Text style={styles.statsText}>
              Exercises: {completedExercises} | Score: {sessionScore.toFixed(0)}%
            </Text>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  },
  noteDisplayContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  noteLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  noteText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  frequencyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  audioLevel: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 8,
  },
  detectionControls: {
    alignItems: 'center',
    width: '100%',
  },
  practiceButton: {
    marginBottom: 30,
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
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#34C759',
    textAlign: 'center',
  },
  practiceControls: {
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 30,
  },
  noteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  noteButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  noteButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  noteFreqText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  backButton: {
    padding: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  practicePhase: {
    alignItems: 'center',
    width: '100%',
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  phaseSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 10,
  },
  phaseInstruction: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  targetFreq: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 20,
  },
  accuracyDisplay: {
    alignItems: 'center',
    marginVertical: 30,
  },
  accuracyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  accuracyBar: {
    width: 250,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 4,
  },
  completeButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultDisplay: {
    backgroundColor: '#F2F2F7',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 20,
  },
  resultDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 18,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 5,
  },
  statsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});