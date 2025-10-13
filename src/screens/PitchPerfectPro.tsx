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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PitchHistory {
  note: string;
  frequency: number;
  timestamp: number;
  accuracy: number;
}

export const PitchPerfectPro: React.FC = () => {
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState('—');
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [targetNote, setTargetNote] = useState<string | null>(null);
  const [pitchAccuracy, setPitchAccuracy] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mode, setMode] = useState<'free' | 'practice'>('free');
  const [pitchHistory, setPitchHistory] = useState<PitchHistory[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const accuracyAnim = useRef(new Animated.Value(0)).current;
  const noteScaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Practice notes for training mode
  const practiceNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

  useEffect(() => {
    // Elegant fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Initialize pitch detector
    pitchDetectorRef.current = new YINPitchDetector(44100, 2048, 0.1);

    // Start automatically after a brief pause
    setTimeout(() => {
      startListening();
    }, 800);

    return () => {
      stopListening();
    };
  }, []);

  useEffect(() => {
    // Pulse animation when accurate
    if (pitchAccuracy > 0.9) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow effect
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [pitchAccuracy]);

  const startListening = async () => {
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

      setIsListening(true);

      // Smooth scale animation
      Animated.spring(noteScaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }).start();

      detectPitchContinuously();
    } catch (error) {
      console.error('Microphone error:', error);
    }
  };

  const stopListening = () => {
    setIsListening(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
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

    Animated.spring(noteScaleAnim, {
      toValue: 0.9,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const detectPitchContinuously = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) return;

    const dataArray = new Float32Array(analyserRef.current.fftSize);

    const detect = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS for volume
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / dataArray.length);

      if (rms > 0.01) {
        const pitch = pitchDetectorRef.current!.detectPitch(dataArray);

        if (pitch && pitch.confidence > 0.8) {
          setCurrentNote(pitch.note);
          setCurrentFrequency(pitch.frequency);

          // Calculate accuracy
          const accuracy = Math.max(0, 1 - Math.abs(pitch.cents) / 50);
          setPitchAccuracy(accuracy);

          // Animate accuracy bar
          Animated.timing(accuracyAnim, {
            toValue: accuracy,
            duration: 100,
            useNativeDriver: false,
          }).start();

          // Track history
          const historyPoint: PitchHistory = {
            note: pitch.note,
            frequency: pitch.frequency,
            timestamp: Date.now(),
            accuracy: accuracy,
          };

          setPitchHistory(prev => [...prev.slice(-50), historyPoint]);

          // Update streak in practice mode
          if (mode === 'practice' && targetNote) {
            if (pitch.note === targetNote && accuracy > 0.9) {
              setStreak(prev => prev + 1);
              if (streak > 0 && streak % 5 === 0) {
                // Move to next note after 5 successful attempts
                selectRandomPracticeNote();
              }
            } else if (accuracy < 0.5) {
              setStreak(0);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const selectRandomPracticeNote = () => {
    const randomNote = practiceNotes[Math.floor(Math.random() * practiceNotes.length)];
    setTargetNote(randomNote);
    setStreak(0);
  };

  const toggleMode = () => {
    const newMode = mode === 'free' ? 'practice' : 'free';
    setMode(newMode);

    if (newMode === 'practice') {
      selectRandomPracticeNote();
    } else {
      setTargetNote(null);
      setStreak(0);
    }
  };

  // Color based on accuracy - Apple style colors
  const getNoteColor = () => {
    if (!isListening) return '#1C1C1E';

    if (pitchAccuracy > 0.9) return '#34C759'; // System Green
    if (pitchAccuracy > 0.7) return '#FF9500'; // System Orange
    return '#FF3B30'; // System Red
  };

  const getBackgroundGradient = () => {
    if (pitchAccuracy > 0.9) {
      return ['#F0FFF4', '#FFFFFF'];
    } else if (pitchAccuracy > 0.7) {
      return ['#FFF9F0', '#FFFFFF'];
    }
    return ['#FFFFFF', '#FAFAFA'];
  };

  return (
    <LinearGradient
      colors={getBackgroundGradient()}
      style={styles.container}
    >
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>PitchPerfect</Text>
          <Text style={styles.subtitle}>Professional Voice Training</Text>
        </View>

        {/* Mode Toggle */}
        <TouchableOpacity onPress={toggleMode} style={styles.modeToggle}>
          <LinearGradient
            colors={mode === 'practice' ? ['#007AFF', '#0051D5'] : ['#F2F2F7', '#E5E5EA']}
            style={styles.modeToggleGradient}
          >
            <Text style={[styles.modeText, { color: mode === 'practice' ? '#FFFFFF' : '#000000' }]}>
              {mode === 'free' ? 'Free Mode' : 'Practice Mode'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Target Note (Practice Mode) */}
        {mode === 'practice' && targetNote && (
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Target Note</Text>
            <View style={styles.targetNoteBox}>
              <Text style={styles.targetNote}>{targetNote}</Text>
            </View>
            <Text style={styles.streakText}>Streak: {streak}</Text>
          </View>
        )}

        {/* Main Note Display */}
        <Animated.View
          style={[
            styles.noteContainer,
            {
              transform: [
                { scale: Animated.multiply(noteScaleAnim, pulseAnim) }
              ],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95]
              })
            }
          ]}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                opacity: glowAnim,
                transform: [{ scale: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2]
                })}]
              }
            ]}
          />

          <Text style={[styles.noteDisplay, { color: getNoteColor() }]}>
            {currentNote}
          </Text>

          {currentFrequency > 0 && (
            <Text style={styles.frequencyText}>
              {currentFrequency.toFixed(1)} Hz
            </Text>
          )}
        </Animated.View>

        {/* Visual Accuracy Indicator */}
        <View style={styles.accuracyContainer}>
          <View style={styles.accuracyLabels}>
            <Text style={styles.accuracyLabel}>Flat</Text>
            <Text style={styles.accuracyLabel}>Perfect</Text>
            <Text style={styles.accuracyLabel}>Sharp</Text>
          </View>

          <View style={styles.accuracyTrack}>
            <Animated.View
              style={[
                styles.accuracyIndicator,
                {
                  left: accuracyAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '45%']
                  }),
                  backgroundColor: getNoteColor(),
                }
              ]}
            />
          </View>
        </View>

        {/* Pitch History Visualization */}
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Pitch Trajectory</Text>
          <View style={styles.historyGraph}>
            {pitchHistory.slice(-30).map((point, index) => (
              <View
                key={index}
                style={[
                  styles.historyBar,
                  {
                    height: point.accuracy * 50,
                    backgroundColor: point.accuracy > 0.9 ? '#34C759' :
                                    point.accuracy > 0.7 ? '#FF9500' : '#FF3B30',
                    opacity: (index + 1) / 30,
                  }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Status and Tips */}
        <View style={styles.statusContainer}>
          {isListening ? (
            <View style={styles.listeningIndicator}>
              <View style={styles.listeningDot} />
              <Text style={styles.listeningText}>Listening</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>Initializing...</Text>
          )}

          <Text style={styles.tipText}>
            {pitchAccuracy > 0.9 ? 'Excellent pitch! Keep it steady.' :
             pitchAccuracy > 0.7 ? 'Getting close! Fine-tune your pitch.' :
             isListening ? 'Sing or hum any note clearly' : 'Preparing audio system...'}
          </Text>
        </View>

        {/* Quick Stats */}
        {pitchHistory.length > 10 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {((pitchHistory.filter(p => p.accuracy > 0.9).length / pitchHistory.length) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {pitchHistory.length}
              </Text>
              <Text style={styles.statLabel}>Notes Detected</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.max(...pitchHistory.map(p => p.accuracy * 100)).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Best Match</Text>
            </View>
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
  appTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 5,
  },
  modeToggle: {
    marginBottom: 30,
  },
  modeToggleGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },
  modeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  targetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  targetLabel: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  targetNoteBox: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  targetNote: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  noteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#34C759',
    opacity: 0.1,
  },
  noteDisplay: {
    fontSize: 120,
    fontWeight: '200',
    letterSpacing: -5,
  },
  frequencyText: {
    fontSize: 17,
    color: '#8E8E93',
    marginTop: 10,
  },
  accuracyContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  accuracyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  accuracyLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  accuracyTrack: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    position: 'relative',
  },
  accuracyIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -8,
    marginLeft: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContainer: {
    width: '100%',
    marginBottom: 30,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 15,
  },
  historyGraph: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 10,
  },
  historyBar: {
    width: 8,
    marginHorizontal: 1,
    borderRadius: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  listeningText: {
    fontSize: 15,
    color: '#34C759',
    fontWeight: '500',
  },
  statusText: {
    fontSize: 15,
    color: '#8E8E93',
  },
  tipText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 5,
  },
});