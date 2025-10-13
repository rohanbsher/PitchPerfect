import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Tone from 'tone';
import { YINPitchDetector } from '../utils/pitchDetection';

/**
 * PITCHPERFECT REDESIGN
 * Beautiful UI with warm piano sound and musical scale visualization
 */

interface Note {
  id: string;
  note: string;
  frequency: number;
}

const PRACTICE_NOTES: Note[] = [
  { id: 'c4', note: 'C4', frequency: 261.63 },
  { id: 'd4', note: 'D4', frequency: 293.66 },
  { id: 'e4', note: 'E4', frequency: 329.63 },
  { id: 'f4', note: 'F4', frequency: 349.23 },
  { id: 'g4', note: 'G4', frequency: 392.00 },
  { id: 'a4', note: 'A4', frequency: 440.00 },
  { id: 'b4', note: 'B4', frequency: 493.88 },
  { id: 'c5', note: 'C5', frequency: 523.25 },
];

type NoteState = 'upcoming' | 'current' | 'completed';

export const PitchPerfectRedesign: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedNotes, setCompletedNotes] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [pianoReady, setPianoReady] = useState(false);

  // Pitch detection state
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState('—');
  const [detectedFrequency, setDetectedFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  // Tone.js piano sampler
  const pianoRef = useRef<Tone.Sampler | null>(null);

  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Smoothing for pitch
  const smoothedCentsRef = useRef<number>(0);
  const smoothingFactor = 0.3;

  // Auto-detection of correct pitch
  const holdStartTimeRef = useRef<number | null>(null);
  const requiredHoldDuration = 1500; // Hold for 1.5 seconds

  useEffect(() => {
    initializePiano();
    initializeMicrophone();
    // NOTE: Don't initialize pitch detector here!
    // We need to wait for audio context to get actual sample rate

    return () => {
      cleanup();
    };
  }, []);

  const initializePiano = async () => {
    try {
      console.log('🎹 Initializing piano...');

      // Create beautiful piano sampler with Salamander Grand Piano samples
      const piano = new Tone.Sampler({
        urls: {
          C4: 'C4.mp3',
          'D#4': 'Ds4.mp3',
          'F#4': 'Fs4.mp3',
          A4: 'A4.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        onload: () => {
          console.log('✅ Piano loaded - warm sound ready');
          setPianoReady(true);
        },
      }).toDestination();

      pianoRef.current = piano;
    } catch (error) {
      console.error('❌ Piano initialization error:', error);
    }
  };

  const initializeMicrophone = async () => {
    try {
      console.log('🎤 Initializing microphone...');

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

      // CRITICAL FIX: Get actual sample rate from audio context
      const actualSampleRate = audioContext.sampleRate;
      console.log('📊 Audio Context Sample Rate:', actualSampleRate);

      // Initialize pitch detector with ACTUAL sample rate (not hardcoded 44100!)
      pitchDetectorRef.current = new YINPitchDetector(actualSampleRate, 2048, 0.1);
      console.log('✅ Pitch detector initialized with sample rate:', actualSampleRate);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      console.log('✅ Microphone initialized');

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

      // Calculate RMS (volume)
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

          // Calculate cents off from target note
          const targetFreq = PRACTICE_NOTES[currentIndex].frequency;
          const cents = calculateCentsOff(pitch.frequency, targetFreq);

          // Apply smoothing
          smoothedCentsRef.current =
            smoothedCentsRef.current * (1 - smoothingFactor) + cents * smoothingFactor;
          const smoothedCents = Math.round(smoothedCentsRef.current);

          setCentsOff(smoothedCents);

          // Calculate accuracy (0-100%)
          const absCents = Math.abs(smoothedCents);
          const accuracyPercent = Math.max(0, Math.min(100, 100 - absCents * 2));
          setAccuracy(Math.round(accuracyPercent));

          // AUTO-DETECT: Check if user is singing the correct note
          if (absCents <= 20) {
            // Within acceptable range - start or continue hold
            if (!holdStartTimeRef.current) {
              holdStartTimeRef.current = Date.now();
            }

            const elapsed = Date.now() - holdStartTimeRef.current;
            if (elapsed >= requiredHoldDuration) {
              // User held the note correctly for 1.5 seconds - AUTO COMPLETE!
              completeNote();
              holdStartTimeRef.current = null;
            }
          } else {
            // Out of range - reset hold timer
            holdStartTimeRef.current = null;
          }
        }
      } else {
        // Not singing - reset hold timer
        holdStartTimeRef.current = null;
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const calculateCentsOff = (detected: number, target: number): number => {
    if (detected === 0 || target === 0) return 999;
    return Math.round(1200 * Math.log2(detected / target));
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (pianoRef.current) {
      pianoRef.current.dispose();
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
  };

  const playNote = async (note: string) => {
    if (!pianoRef.current || !pianoReady || isPlaying) return;

    try {
      setIsPlaying(true);

      // Start Tone.js audio context if needed
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Play beautiful piano note
      pianoRef.current.triggerAttackRelease(note, '2n');

      // Button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Stop playing after 2 seconds
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);
    } catch (error) {
      console.error('Error playing note:', error);
      setIsPlaying(false);
    }
  };

  const completeNote = () => {
    // Add current note to completed
    const newCompleted = new Set(completedNotes);
    newCompleted.add(currentIndex);
    setCompletedNotes(newCompleted);

    // Celebration animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Move to next note after delay
    setTimeout(() => {
      if (currentIndex < PRACTICE_NOTES.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 1000);
  };

  // VERIFICATION: Test pitch detection accuracy
  const verifyPitchDetection = async () => {
    if (!pianoReady) return;

    console.log('🧪 TESTING PITCH DETECTION ACCURACY');
    console.log('Playing A4 (440 Hz) - should detect as A4, not G#4 or A#4');

    // Play A4
    await playNote('A4');

    // Wait 1 second, then check detection
    setTimeout(() => {
      console.log('Expected: A4 (440 Hz)');
      console.log('Detected:', detectedNote, `(${detectedFrequency.toFixed(2)} Hz)`);

      const error = Math.abs(detectedFrequency - 440);
      if (error < 5) {
        console.log('✅ PITCH DETECTION ACCURATE! Error:', error.toFixed(2), 'Hz');
      } else {
        console.error('❌ PITCH DETECTION OFF! Error:', error.toFixed(2), 'Hz');
      }
    }, 1500);
  };

  const getNoteState = (index: number): NoteState => {
    if (completedNotes.has(index)) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };

  const currentNote = PRACTICE_NOTES[currentIndex];
  const visibleNotes = PRACTICE_NOTES.slice(
    Math.max(0, currentIndex - 2),
    Math.min(PRACTICE_NOTES.length, currentIndex + 3)
  );

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* App Title */}
      <View style={styles.header}>
        <Text style={styles.title}>PITCH PERFECT</Text>
        <Text style={styles.subtitle}>Match the note</Text>
      </View>

      {/* Musical Scale Visualization */}
      <View style={styles.scaleContainer}>
        {visibleNotes.map((note, idx) => {
          const globalIndex = PRACTICE_NOTES.findIndex(n => n.id === note.id);
          const state = getNoteState(globalIndex);

          return (
            <ScaleNote
              key={note.id}
              note={note}
              state={state}
              onPress={() => state === 'current' && playNote(note.note)}
              isPlaying={isPlaying && state === 'current'}
            />
          );
        })}
      </View>

      {/* Current Note Display */}
      <Animated.View style={[styles.currentNoteContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.currentNoteText}>{currentNote.note}</Text>
        <Text style={styles.frequencyText}>{currentNote.frequency.toFixed(2)} Hz</Text>
      </Animated.View>

      {/* Pitch Detection Feedback */}
      {detectedFrequency > 0 && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.detectedNoteText}>
            You're singing: {detectedNote}
          </Text>
          <Text style={styles.frequencyDebugText}>
            Target: {currentNote.frequency.toFixed(2)} Hz | Detected: {detectedFrequency.toFixed(2)} Hz
          </Text>
          <Text style={styles.centsText}>
            {centsOff > 0 ? `${centsOff}¢ sharp` : centsOff < 0 ? `${Math.abs(centsOff)}¢ flat` : 'Perfect!'}
          </Text>
          <View style={styles.accuracyBar}>
            <View style={[styles.accuracyFill, {
              width: `${accuracy}%`,
              backgroundColor: accuracy > 70 ? '#4CAF50' : accuracy > 50 ? '#FFC107' : '#F44336'
            }]} />
          </View>
          <Text style={styles.accuracyText}>{accuracy}% accurate</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => playNote(currentNote.note)}
          disabled={!pianoReady || isPlaying}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} style={styles.button}>
            <Text style={styles.buttonText}>
              {!pianoReady ? '⏳ Loading...' : isPlaying ? '♪ Playing' : '▶ PLAY NOTE'}
            </Text>
          </BlurView>
        </TouchableOpacity>

        {/* Demo: Complete Note button (will be replaced with recording) */}
        <TouchableOpacity
          onPress={completeNote}
          activeOpacity={0.8}
          style={{ marginTop: 12 }}
        >
          <BlurView intensity={20} style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.buttonText}>✓ COMPLETE (Demo)</Text>
          </BlurView>
        </TouchableOpacity>

        {/* TEST: Verify pitch detection accuracy */}
        <TouchableOpacity
          onPress={verifyPitchDetection}
          activeOpacity={0.8}
          style={{ marginTop: 12 }}
        >
          <BlurView intensity={20} style={[styles.button, styles.secondaryButton]}>
            <Text style={styles.buttonText}>🧪 TEST PITCH (Console)</Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {PRACTICE_NOTES.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              completedNotes.has(idx) && styles.progressDotCompleted,
              idx === currentIndex && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      <Text style={styles.progressText}>
        {completedNotes.size} of {PRACTICE_NOTES.length} notes
      </Text>
    </LinearGradient>
  );
};

// Scale Note Component
interface ScaleNoteProps {
  note: Note;
  state: NoteState;
  onPress: () => void;
  isPlaying: boolean;
}

const ScaleNote: React.FC<ScaleNoteProps> = ({ note, state, onPress, isPlaying }) => {
  const opacity = state === 'upcoming' ? 0.4 : 1;
  const scale = state === 'current' ? 1.1 : 1;

  return (
    <Animated.View style={[styles.scaleNote, { opacity, transform: [{ scale }] }]}>
      <View style={styles.scaleNoteLine}>
        {/* Note indicator */}
        <View style={[styles.noteIndicator, styles[`noteIndicator${state}`]]}>
          {state === 'completed' && <Text style={styles.checkmark}>✓</Text>}
          {state === 'current' && isPlaying && <Text style={styles.musicNote}>♪</Text>}
        </View>

        {/* Line */}
        <View style={styles.noteLine} />
      </View>

      {/* Note label */}
      <Text style={[styles.noteLabel, state === 'current' && styles.noteLabelCurrent]}>
        {note.note}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  // Musical Scale
  scaleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  scaleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  scaleNoteLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteIndicatorupcoming: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  noteIndicatorcurrent: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  noteIndicatorcompleted: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  musicNote: {
    fontSize: 20,
    color: '#000000',
  },
  noteLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  noteLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 12,
    minWidth: 50,
  },
  noteLabelCurrent: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  // Current Note Display
  currentNoteContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  currentNoteText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  frequencyText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  // Buttons (Glass Morphism)
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButton: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressDotCurrent: {
    backgroundColor: '#FFD700',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Pitch Feedback
  feedbackContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  detectedNoteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  frequencyDebugText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  centsText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  accuracyBar: {
    width: 200,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  accuracyFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
