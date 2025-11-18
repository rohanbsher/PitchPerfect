/**
 * Audio Context Provider
 *
 * Provides global audio state management for the piano-first experience
 * Manages:
 * - Tone.js piano sampler (Web platform)
 * - Microphone input and pitch detection
 * - Real-time note highlighting state
 * - Exercise overlay state
 *
 * @module AudioContext
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { YINPitchDetector } from '../utils/pitchDetection';
import { ExpoPlayAudioStream, AudioDataEvent } from '@mykin-ai/expo-audio-stream';
import type { EventSubscription } from 'expo-modules-core';

// Dynamic import for Tone.js (web-only)
let Tone: any = null;
if (Platform.OS === 'web') {
  import('tone').then(module => {
    Tone = module;
  });
}

// ============================================================================
// Types
// ============================================================================

export interface PitchData {
  note: string;
  frequency: number;
  confidence: number;
  centsOff: number;
  accuracy: number; // 0-100%
}

export interface ExerciseOverlayState {
  isActive: boolean;
  exerciseId: string | null;
  targetNotes: string[]; // Array of note names like ['C4', 'D4', 'E4']
}

interface AudioContextValue {
  // Piano state
  pianoReady: boolean;
  isPlaying: boolean;

  // Pitch detection state
  isListening: boolean;
  currentPitch: PitchData | null;

  // Exercise overlay state
  exerciseOverlay: ExerciseOverlayState;

  // Actions
  playNote: (note: string, duration?: string) => Promise<void>;
  startPitchDetection: () => Promise<void>;
  stopPitchDetection: () => void;
  setExerciseOverlay: (state: ExerciseOverlayState) => void;

  // Cleanup
  cleanup: () => void;
}

// ============================================================================
// Context
// ============================================================================

const AudioContext = createContext<AudioContextValue | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

// ============================================================================
// Provider Component
// ============================================================================

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  // Piano state
  const [pianoReady, setPianoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pitch detection state
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);

  // Exercise overlay state
  const [exerciseOverlay, setExerciseOverlay] = useState<ExerciseOverlayState>({
    isActive: false,
    exerciseId: null,
    targetNotes: [],
  });

  // Refs for audio objects (persist across renders)
  const pianoRef = useRef<any>(null); // Tone.Sampler on web, Audio.Sound map on native
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const soundsRef = useRef<Map<string, Audio.Sound>>(new Map()); // Native audio sounds
  const audioSubscriptionRef = useRef<EventSubscription | null>(null); // Native audio stream

  // Smoothing for pitch stability
  const smoothedCentsRef = useRef<number>(0);
  const smoothingFactor = 0.3;

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    initializePiano();

    return () => {
      cleanup();
    };
  }, []);

  const initializePiano = async () => {
    try {
      console.log('🎹 Initializing piano...');

      if (Platform.OS === 'web') {
        // Wait for Tone.js to load
        await new Promise((resolve) => {
          const checkTone = setInterval(() => {
            if (Tone) {
              clearInterval(checkTone);
              resolve(null);
            }
          }, 100);
        });

        // Create Tone.js Sampler with Salamander Grand Piano samples
        const piano = new Tone.Sampler({
          urls: {
            C4: 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            A4: 'A4.mp3',
          },
          baseUrl: 'https://tonejs.github.io/audio/salamander/',
          onload: () => {
            console.log('✅ Piano loaded successfully (Web)');
            setPianoReady(true);
          },
        }).toDestination();

        pianoRef.current = piano;
      } else {
        // iOS/Android: Use Expo AV with simple sine wave synthesizer
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        console.log('✅ Piano ready (Native - on-demand synthesis)');
        setPianoReady(true);
      }
    } catch (error) {
      console.error('❌ Piano initialization error:', error);
    }
  };

  const initializeMicrophone = async () => {
    try {
      console.log('🎤 Requesting microphone access...');

      if (Platform.OS === 'web') {
        // Web platform: Use Web Audio API
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        streamRef.current = stream;

        // Create Web Audio context
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Get actual sample rate from audio context
        const actualSampleRate = audioContext.sampleRate;
        console.log('📊 Audio Context Sample Rate:', actualSampleRate);

        // Initialize YIN pitch detector with actual sample rate
        pitchDetectorRef.current = new YINPitchDetector(actualSampleRate, 2048, 0.1);
        console.log('✅ Pitch detector initialized');

        // Create analyser node
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.3;
        analyserRef.current = analyser;

        // Connect microphone to analyser
        const microphone = audioContext.createMediaStreamSource(stream);
        microphoneRef.current = microphone;
        microphone.connect(analyser);

        console.log('✅ Microphone initialized and connected');

        setIsListening(true);
        startPitchDetectionLoop();
      } else {
        // iOS/Android: Use expo-audio-stream
        console.log('🎤 Initializing native microphone...');

        // Request permissions first
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.error('❌ Microphone permission denied');
          setIsListening(false);
          return;
        }

        // Initialize YIN pitch detector with requested sample rate
        const requestedSampleRate = 44100;
        pitchDetectorRef.current = new YINPitchDetector(requestedSampleRate, 2048, 0.1);
        console.log('✅ Pitch detector initialized (Native)');

        // Calculate interval for buffer size (2048 samples / 44100 Hz = ~46ms)
        const intervalMs = Math.floor((2048 / requestedSampleRate) * 1000);

        try {
          // Start real-time audio streaming
          const { recordingResult, subscription } = await ExpoPlayAudioStream.startRecording({
            sampleRate: requestedSampleRate,
            channels: 1,
            encoding: 'pcm_16bit',
            interval: intervalMs,
            onAudioStream: async (event: AudioDataEvent) => {
              try {
                // Handle both string (base64) and Float32Array data
                let pcmBuffer: Float32Array;
                if (typeof event.data === 'string') {
                  // Convert base64 PCM to Float32Array
                  pcmBuffer = base64ToFloat32Array(event.data, 'pcm_16bit');
                } else {
                  // Already Float32Array
                  pcmBuffer = event.data;
                }

                // Process audio buffer (same as web)
                if (pitchDetectorRef.current && pcmBuffer.length > 0) {
                  processAudioBuffer(pcmBuffer);
                }
              } catch (error) {
                console.error('❌ Error processing audio stream:', error);
              }
            }
          });

          // Store subscription for cleanup
          audioSubscriptionRef.current = subscription || null;

          // CRITICAL: Update sample rate if iOS changed it
          const actualSampleRate = recordingResult.sampleRate || requestedSampleRate;
          if (actualSampleRate !== requestedSampleRate) {
            console.warn(`⚠️ Sample rate adjusted: ${requestedSampleRate} → ${actualSampleRate} Hz`);
            pitchDetectorRef.current?.updateSampleRate(actualSampleRate);
          }

          console.log('✅ Native microphone initialized', {
            sampleRate: actualSampleRate,
            bufferSize: 2048,
            interval: intervalMs
          });

          setIsListening(true);

        } catch (error) {
          console.error('❌ Native microphone initialization error:', error);
          setIsListening(false);
        }
      }
    } catch (error) {
      console.error('❌ Microphone initialization error:', error);
      setIsListening(false);
    }
  };

  // ============================================================================
  // Pitch Detection Loop
  // ============================================================================

  const startPitchDetectionLoop = () => {
    if (!analyserRef.current || !pitchDetectorRef.current) {
      console.warn('⚠️ Cannot start pitch detection - analyser or detector not ready');
      return;
    }

    const dataArray = new Float32Array(analyserRef.current.fftSize);

    const detect = () => {
      if (!analyserRef.current || !pitchDetectorRef.current || !isListening) {
        return;
      }

      // Get audio data from microphone
      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Process audio using shared function
      processAudioBuffer(dataArray);

      // Continue loop
      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // ============================================================================
  // Actions
  // ============================================================================

  const playNote = async (note: string, duration: string = '2n') => {
    if (!pianoReady || isPlaying) {
      console.warn('⚠️ Cannot play note - piano not ready or already playing');
      return;
    }

    try {
      setIsPlaying(true);

      if (Platform.OS === 'web') {
        // Web: Use Tone.js
        if (!pianoRef.current || !Tone) {
          console.warn('⚠️ Piano not ready (web)');
          setIsPlaying(false);
          return;
        }

        // Start Tone.js audio context if needed
        if (Tone.context.state !== 'running') {
          await Tone.start();
        }

        // Play piano note
        pianoRef.current.triggerAttackRelease(note, duration);

        // Reset playing state after note duration
        const durationMs = Tone.Time(duration).toMilliseconds();
        setTimeout(() => {
          setIsPlaying(false);
        }, durationMs);
      } else {
        // iOS/Android: Play simple tone using Expo AV
        const frequency = noteToFrequency(note);
        const durationMs = 500; // 500ms default for native

        // Generate simple sine wave tone
        // Note: This is a simplified version - for production you'd want actual piano samples
        const { sound } = await Audio.Sound.createAsync(
          { uri: `https://tonejs.github.io/audio/salamander/${note}.mp3` },
          { shouldPlay: true, volume: 0.5 }
        );

        soundsRef.current.set(note, sound);

        setTimeout(async () => {
          await sound.unloadAsync();
          soundsRef.current.delete(note);
          setIsPlaying(false);
        }, durationMs);
      }
    } catch (error) {
      console.error('❌ Error playing note:', error);
      setIsPlaying(false);
    }
  };

  const startPitchDetection = async () => {
    if (isListening) {
      console.log('ℹ️ Pitch detection already active');
      return;
    }

    await initializeMicrophone();
  };

  const stopPitchDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop native audio stream (iOS/Android)
    if (Platform.OS !== 'web' && audioSubscriptionRef.current) {
      ExpoPlayAudioStream.stopRecording().catch(error => {
        console.error('❌ Error stopping recording:', error);
      });
      audioSubscriptionRef.current.remove();
      audioSubscriptionRef.current = null;
    }

    setIsListening(false);
    setCurrentPitch(null);
  };

  /**
   * Process audio buffer and detect pitch
   * Shared between web (AnalyserNode) and native (expo-audio-stream)
   */
  const lastValidPitchRef = useRef<{ pitch: any; timestamp: number } | null>(null);
  const frameCountRef = useRef(0);

  const processAudioBuffer = (dataArray: Float32Array) => {
    if (!pitchDetectorRef.current) return;

    // Calculate RMS (volume) to detect if user is making sound
    let rms = 0;
    for (let i = 0; i < dataArray.length; i++) {
      rms += dataArray[i] * dataArray[i];
    }
    rms = Math.sqrt(rms / dataArray.length);

    // Log every 30 frames (~0.5 second) for debugging
    frameCountRef.current++;
    const shouldLog = frameCountRef.current % 30 === 0;

    if (shouldLog) {
      console.log(`🎤 Audio: RMS=${rms.toFixed(4)}`);
    }

    // Only detect pitch if sufficient volume (lowered from 0.005)
    if (rms > 0.003) {
      const pitch = pitchDetectorRef.current.detectPitch(dataArray);

      if (shouldLog) {
        console.log(`🎵 Pitch: ${pitch.frequency.toFixed(1)}Hz, conf=${pitch.confidence.toFixed(2)}, note=${pitch.note}`);
      }

      // Lowered confidence threshold from 0.5 to 0.3 for speaking voices
      if (pitch && pitch.confidence > 0.3) {
        // Calculate cents off from nearest note
        const nearestFreq = noteToFrequency(pitch.note);
        const cents = calculateCentsOff(pitch.frequency, nearestFreq);

        // Apply exponential smoothing for stability
        smoothedCentsRef.current =
          smoothedCentsRef.current * (1 - smoothingFactor) + cents * smoothingFactor;
        const smoothedCents = Math.round(smoothedCentsRef.current);

        // Calculate accuracy percentage (0-100%)
        const absCents = Math.abs(smoothedCents);
        const accuracyPercent = Math.max(0, Math.min(100, 100 - absCents * 2));

        const newPitch = {
          note: pitch.note,
          frequency: pitch.frequency,
          confidence: pitch.confidence,
          centsOff: smoothedCents,
          accuracy: Math.round(accuracyPercent),
        };

        setCurrentPitch(newPitch);

        // Store as last valid pitch for hysteresis
        lastValidPitchRef.current = {
          pitch: newPitch,
          timestamp: Date.now(),
        };
      } else if (shouldLog) {
        console.log(`⚠️ Below confidence threshold: ${pitch.confidence.toFixed(2)} < 0.3`);
      }
    } else {
      // No sound detected - but use hysteresis (keep pitch for 200ms)
      const now = Date.now();
      if (lastValidPitchRef.current && now - lastValidPitchRef.current.timestamp < 200) {
        // Keep last valid pitch (prevents flickering)
        if (shouldLog) {
          console.log(`🔄 Holding last pitch (hysteresis)`);
        }
      } else {
        // Clear pitch after 200ms of silence
        setCurrentPitch(null);
        lastValidPitchRef.current = null;
        if (shouldLog) {
          console.log(`🔇 Below RMS threshold: ${rms.toFixed(4)} < 0.003`);
        }
      }
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up audio resources...');

    // Stop pitch detection
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Dispose piano
    if (pianoRef.current) {
      pianoRef.current.dispose();
    }

    // Disconnect microphone (web)
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    // Close audio context (web)
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Stop media stream (web)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Clean up native audio (iOS/Android)
    if (Platform.OS !== 'web') {
      ExpoPlayAudioStream.stopRecording().catch(() => {
        // Ignore errors during cleanup
      });
      if (audioSubscriptionRef.current) {
        audioSubscriptionRef.current.remove();
        audioSubscriptionRef.current = null;
      }
    }
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AudioContextValue = {
    pianoReady,
    isPlaying,
    isListening,
    currentPitch,
    exerciseOverlay,
    playNote,
    startPitchDetection,
    stopPitchDetection,
    setExerciseOverlay,
    cleanup,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate cents off between detected frequency and target frequency
 */
function calculateCentsOff(detected: number, target: number): number {
  if (detected === 0 || target === 0) return 999;
  return Math.round(1200 * Math.log2(detected / target));
}

/**
 * Convert note name to frequency (A4 = 440 Hz standard)
 */
function noteToFrequency(note: string): number {
  const noteMap: { [key: string]: number } = {
    'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4,
    'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2,
  };

  // Parse note (e.g., "C#4" -> note="C#", octave=4)
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 440; // Default to A4

  const [, noteName, octaveStr] = match;
  const octave = parseInt(octaveStr);

  // Calculate semitones from A4
  const semitonesFromA4 = noteMap[noteName] + (octave - 4) * 12;

  // Convert semitones to frequency using equal temperament
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Convert base64 encoded PCM audio to Float32Array
 * Used for native iOS/Android audio from expo-audio-stream
 */
function base64ToFloat32Array(
  base64: string,
  encoding: 'pcm_16bit' | 'pcm_32bit' | 'pcm_8bit'
): Float32Array {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert based on encoding type
    if (encoding === 'pcm_32bit') {
      // 32-bit float - direct conversion
      return new Float32Array(bytes.buffer);
    } else if (encoding === 'pcm_16bit') {
      // 16-bit signed integer - normalize to -1.0 to 1.0
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      return float32Array;
    } else if (encoding === 'pcm_8bit') {
      // 8-bit unsigned integer - normalize to -1.0 to 1.0
      const float32Array = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32Array[i] = (bytes[i] - 128) / 128.0;
      }
      return float32Array;
    }

    return new Float32Array(0);
  } catch (error) {
    console.error('❌ Error converting base64 to Float32Array:', error);
    return new Float32Array(0);
  }
}
