import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YINPitchDetector } from '../utils/pitchDetection';

/**
 * PITCHMATCH PRO
 * Real-time pitch matching with continuous feedback
 * Based on research: Yousician, Vanido, Singer Studio best practices
 */

interface Note {
  note: string;
  frequency: number;
}

const PRACTICE_NOTES: Note[] = [
  { note: 'C4', frequency: 261.63 },
  { note: 'D4', frequency: 293.66 },
  { note: 'E4', frequency: 329.63 },
  { note: 'F4', frequency: 349.23 },
  { note: 'G4', frequency: 392.00 },
  { note: 'A4', frequency: 440.00 },
  { note: 'B4', frequency: 493.88 },
  { note: 'C5', frequency: 523.25 },
];

// Simplified: Only 3 states
type FeedbackState = 'listening' | 'close' | 'good';

export const PitchMatchPro: React.FC = () => {
  // Exercise state
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exerciseStarted, setExerciseStarted] = useState(false);

  // Pitch detection state
  const [detectedNote, setDetectedNote] = useState('—');
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');

  // Progress state
  const [holdProgress, setHoldProgress] = useState(0);
  const [exercisesCompleted, setExercisesCompleted] = useState(0);
  const [sessionAccuracy, setSessionAccuracy] = useState<number[]>([]);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Hold tracking
  const holdStartTimeRef = useRef<number | null>(null);
  const requiredHoldDuration = 1500; // 1.5 seconds - feels quicker

  // Smoothing for pitch indicator
  const smoothedCentsRef = useRef<number>(0);
  const smoothingFactor = 0.3; // Lower = more smoothing

  const currentNote = PRACTICE_NOTES[currentNoteIndex];

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
    pitchDetectorRef.current = new YINPitchDetector(44100, 2048, 0.1);

    return () => {
      cleanup();
    };
  }, []);

  // Auto-start first exercise
  useEffect(() => {
    if (audioContextRef.current && !exerciseStarted) {
      startExercise();
    }
  }, [audioContextRef.current]);

  const initializeAudio = async () => {
    try {
      console.log('🎤 Initializing audio...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      streamRef.current = stream;

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      console.log('✅ Audio initialized');

      // Start pitch detection immediately
      startPitchDetection();
    } catch (error) {
      console.error('❌ Microphone error:', error);
    }
  };

  const startPitchDetection = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) return;

    const dataArray = new Float32Array(analyserRef.current.fftSize);

    const detect = () => {
      if (!analyserRef.current || !pitchDetectorRef.current) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / dataArray.length);

      // Detect pitch if sufficient volume
      if (rms > 0.005) {
        const pitch = pitchDetectorRef.current.detectPitch(dataArray);

        if (pitch && pitch.confidence > 0.5) {
          setDetectedNote(pitch.note);
          setDetectedFrequency(pitch.frequency);

          // Calculate cents off
          const cents = calculateCentsOff(pitch.frequency, currentNote.frequency);

          // SMOOTHING: Apply exponential moving average
          smoothedCentsRef.current = smoothedCentsRef.current * (1 - smoothingFactor) + cents * smoothingFactor;
          const smoothedCents = Math.round(smoothedCentsRef.current);

          setCentsOff(smoothedCents);

          // Update feedback state with smoothed value
          updateFeedbackState(smoothedCents);

          // Track hold progress with smoothed value
          trackHoldProgress(smoothedCents);
        }
      } else {
        // Reset hold if not singing
        resetHold();
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const calculateCentsOff = (detected: number, target: number): number => {
    if (detected === 0 || target === 0) return 999;
    return Math.round(1200 * Math.log2(detected / target));
  };

  const updateFeedbackState = (cents: number) => {
    const absCents = Math.abs(cents);

    // RELAXED TOLERANCE: More achievable for beginners
    if (absCents <= 20) {
      setFeedbackState('good');  // Green - good enough!
    } else if (absCents <= 50) {
      setFeedbackState('close'); // Yellow - getting closer
    } else {
      setFeedbackState('listening'); // Blue - way off
    }
  };

  const trackHoldProgress = (cents: number) => {
    const absCents = Math.abs(cents);
    const now = Date.now();

    if (absCents <= 20) {  // RELAXED: Match the green zone tolerance
      // Within tolerance - start or continue hold
      if (!holdStartTimeRef.current) {
        holdStartTimeRef.current = now;
      }

      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(elapsed / requiredHoldDuration, 1);
      setHoldProgress(progress);

      // Check for completion
      if (progress >= 1) {
        completeExercise();
      }
    } else {
      // Out of tolerance - reset
      resetHold();
    }
  };

  const resetHold = () => {
    holdStartTimeRef.current = null;
    setHoldProgress(0);
  };

  const playReferenceNote = async () => {
    if (!audioContextRef.current || isPlaying) return;

    setIsPlaying(true);

    try {
      const frequency = currentNote.frequency;

      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);

      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNodeRef.current.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);

      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      oscillatorRef.current.start(audioContextRef.current.currentTime);

      setTimeout(() => {
        stopReferenceNote();
      }, 2000);
    } catch (error) {
      console.error('Error playing reference:', error);
      setIsPlaying(false);
    }
  };

  const stopReferenceNote = () => {
    if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.05);
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
        setIsPlaying(false);
      }, 50);
    }
  };

  const startExercise = () => {
    setExerciseStarted(true);
    setFeedbackState('listening');
    resetHold();
    playReferenceNote();
  };

  const completeExercise = () => {
    // Simple success animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Track progress
    setExercisesCompleted(exercisesCompleted + 1);

    // Quick advance to next note (1 second, not 2)
    setTimeout(() => {
      nextNote();
    }, 1000);
  };

  const nextNote = () => {
    // Reset animations
    successAnim.setValue(0);

    // Move to next note
    const nextIndex = (currentNoteIndex + 1) % PRACTICE_NOTES.length;
    setCurrentNoteIndex(nextIndex);

    // Reset state
    resetHold();
    setFeedbackState('listening');
    setDetectedNote('—');
    setDetectedFrequency(0);
    setCentsOff(0);

    // Play new reference note
    setTimeout(() => {
      playReferenceNote();
    }, 500);
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
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

  const getFeedbackColor = (): string => {
    // Simplified: Only 3 colors
    switch (feedbackState) {
      case 'good': return '#4CAF50';      // Green
      case 'close': return '#FFC107';     // Yellow
      case 'listening': return '#2196F3'; // Blue
      default: return '#2196F3';
    }
  };

  const getDirectionArrow = (): string => {
    if (Math.abs(centsOff) <= 20) return '';  // No arrow in green zone
    return centsOff > 0 ? '↓' : '↑';
  };

  const getDirectionText = (): string => {
    if (Math.abs(centsOff) <= 20) return '';  // No text in green zone
    return centsOff > 0 ? 'Lower' : 'Higher';
  };

  return (
    <LinearGradient colors={['#F8F9FA', '#FFFFFF']} style={styles.container}>

      {/* SIMPLIFIED: Just the note - tap anywhere to replay */}
      <TouchableOpacity onPress={playReferenceNote} disabled={isPlaying} style={styles.noteContainer}>
        <Text style={styles.noteText}>{currentNote.note}</Text>
        {isPlaying && <Text style={styles.playingText}>♪</Text>}
      </TouchableOpacity>

      {/* SIMPLIFIED: Visual feedback - the core */}
      <Animated.View style={[styles.visualizer, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.targetZone, { borderColor: getFeedbackColor(), borderWidth: 4 }]}>

          {/* Pitch indicator - ENLARGED to 60px */}
          <Animated.View style={[
            styles.pitchIndicator,
            {
              backgroundColor: getFeedbackColor(),
              bottom: `${50 + (centsOff / 2)}%`,
              opacity: detectedFrequency > 0 ? 1 : 0.2,
              width: 60,  // ENLARGED from 30px
              height: 60,
              borderRadius: 30,
            }
          ]} />
        </View>

        {/* Direction Arrow - HUGE */}
        {getDirectionArrow() && (
          <View style={styles.directionContainer}>
            <Text style={[styles.directionArrow, { color: getFeedbackColor() }]}>
              {getDirectionArrow()}
            </Text>
            <Text style={[styles.directionText, { color: getFeedbackColor() }]}>
              {getDirectionText()}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Hold Progress - SIMPLIFIED */}
      {holdProgress > 0 && (
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            {
              width: `${holdProgress * 100}%`,
              backgroundColor: getFeedbackColor()
            }
          ]} />
        </View>
      )}

      {/* Minimal stats - just exercises today */}
      {exercisesCompleted > 0 && (
        <Text style={styles.statsText}>
          {exercisesCompleted} notes today
        </Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  // SIMPLIFIED: Just the note
  noteContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  noteText: {
    fontSize: 120,  // HUGE
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -2,
  },
  playingText: {
    fontSize: 32,
    color: '#007AFF',
    marginTop: 10,
  },
  // SIMPLIFIED: Visual feedback
  visualizer: {
    alignItems: 'center',
    width: '100%',
  },
  targetZone: {
    width: 320,  // Slightly wider
    height: 240,  // Slightly taller
    borderRadius: 24,
    position: 'relative',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  pitchIndicator: {
    position: 'absolute',
    // Width/height set inline (60px)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  // HUGE direction arrows
  directionContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  directionArrow: {
    fontSize: 96,  // HUGE - doubled from 48px
    fontWeight: '700',
  },
  directionText: {
    fontSize: 24,  // Larger text
    fontWeight: '600',
    marginTop: 12,
  },
  // SIMPLIFIED: Progress bar
  progressBar: {
    width: 300,
    height: 12,  // Thicker
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 40,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  // SIMPLIFIED: Minimal stats
  statsText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
});