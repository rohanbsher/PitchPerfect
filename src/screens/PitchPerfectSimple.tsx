import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { YINPitchDetector } from '../utils/pitchDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PitchPerfectSimple: React.FC = () => {
  // Core state - just what we need
  const [isListening, setIsListening] = useState(false);
  const [currentNote, setCurrentNote] = useState('—');
  const [pitchAccuracy, setPitchAccuracy] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // For debugging

  // Simple animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const breathingAnim = useRef(new Animated.Value(1)).current;

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pitchDetectorRef = useRef<YINPitchDetector | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Initialize pitch detector
    pitchDetectorRef.current = new YINPitchDetector(44100, 2048, 0.1);

    // AUTO-START pitch detection after a short delay
    setTimeout(() => {
      console.log('Auto-starting pitch detection...');
      startListening();
    }, 500);

    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    try {
      console.log('Starting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log('Microphone access granted');
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

      // Animate start
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Start pitch detection after a small delay to ensure everything is initialized
      setTimeout(() => {
        detectPitchContinuously();
        console.log('Pitch detection started');
      }, 100);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Microphone error: ' + error);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setCurrentNote('—');
    setPitchAccuracy(0);

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

    // Animate stop
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const detectPitchContinuously = () => {
    const dataArray = new Float32Array(analyserRef.current?.fftSize || 4096);

    const detect = () => {
      if (!analyserRef.current || !pitchDetectorRef.current) {
        console.log('Waiting for audio context...', {
          analyser: !!analyserRef.current,
          detector: !!pitchDetectorRef.current
        });
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS for volume level
      let rms = 0;
      for (let i = 0; i < dataArray.length; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / dataArray.length);

      // Update audio level for display
      setAudioLevel(rms);

      // Only try pitch detection if there's sufficient volume
      if (rms > 0.01) {
        console.log('Audio detected, RMS:', rms);
        const pitch = pitchDetectorRef.current.detectPitch(dataArray);

        if (pitch && pitch.confidence > 0.5) { // Lower threshold for testing
          console.log('Detected pitch:', pitch.note, 'Frequency:', pitch.frequency, 'Confidence:', pitch.confidence);
          setCurrentNote(pitch.note);

          // Simple accuracy calculation
          const accuracy = Math.max(0, 1 - Math.abs(pitch.cents) / 50);
          setPitchAccuracy(accuracy);
        } else if (pitch) {
          console.log('Low confidence pitch:', pitch.confidence);
          // Show note even with low confidence for testing
          setCurrentNote(pitch.note + '?');
        }
      } else {
        // No audio detected
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
          console.log('No audio detected, RMS:', rms);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  // Get color based on accuracy
  const getNoteColor = () => {
    if (!isListening) return '#000000';
    if (pitchAccuracy > 0.9) return '#30D158'; // Green
    if (pitchAccuracy > 0.7) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  // Get background color with transparency
  const getBackgroundColor = () => {
    if (!isListening) return 'rgba(0, 0, 0, 0.02)';
    if (pitchAccuracy > 0.9) return 'rgba(48, 209, 88, 0.05)';
    if (pitchAccuracy > 0.7) return 'rgba(255, 149, 0, 0.05)';
    return 'rgba(255, 59, 48, 0.05)';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Breathing background circle */}
      <Animated.View
        style={[
          styles.backgroundCircle,
          {
            transform: [
              { scale: breathingAnim },
              { scale: scaleAnim }
            ],
            backgroundColor: getBackgroundColor(),
          }
        ]}
      />

      {/* Main content - NO TOUCH REQUIRED */}
      <View style={styles.mainArea}>
        {/* Note display - ALWAYS VISIBLE */}
        <Text style={[styles.noteDisplay, { color: getNoteColor() }]}>
          {currentNote}
        </Text>

        {/* Simple status text */}
        <Text style={styles.statusText}>
          {pitchAccuracy > 0.9 ? 'Perfect!' :
           pitchAccuracy > 0.7 ? 'Close' :
           isListening ? 'Sing any note' : 'Starting...'}
        </Text>

        {/* Accuracy bar */}
        {isListening && (
          <View style={styles.accuracyContainer}>
            <View style={styles.accuracyTrack}>
              <Animated.View
                style={[
                  styles.accuracyFill,
                  {
                    width: `${pitchAccuracy * 100}%`,
                    backgroundColor: getNoteColor(),
                  }
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Minimal indicator when listening */}
      {isListening && (
        <View style={styles.listeningIndicator}>
          <Text style={styles.listeningDot}>● Recording</Text>
          <Text style={styles.debugText}>
            Audio Level: {(audioLevel * 100).toFixed(2)}%
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  mainArea: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  noteDisplay: {
    fontSize: 120,
    fontWeight: '100',
    letterSpacing: -3,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 17,
    color: '#8E8E93',
    height: 30,
  },
  accuracyContainer: {
    position: 'absolute',
    bottom: 100,
    width: 200,
  },
  accuracyTrack: {
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 1,
  },
  listeningIndicator: {
    position: 'absolute',
    top: 50,
    alignItems: 'center',
  },
  listeningDot: {
    fontSize: 12,
    color: '#30D158',
  },
  debugText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 5,
  },
});