import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
} from 'react-native';

export const PitchDebug: React.FC = () => {
  const [status, setStatus] = useState('Not started');
  const [currentNote, setCurrentNote] = useState('--');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Auto-start
    setTimeout(() => {
      startAudio();
    }, 1000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startAudio = async () => {
    try {
      setStatus('Requesting microphone...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      setStatus('Microphone granted!');

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setStatus('Audio connected!');
      startDetection();

    } catch (error: any) {
      setStatus('Error!');
      setErrorMsg(error.toString());
      Alert.alert('Error', error.toString());
    }
  };

  const startDetection = () => {
    if (!analyserRef.current) return;

    const dataArray = new Float32Array(analyserRef.current.fftSize);
    let noteCounter = 0;

    const detect = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);

      // Calculate RMS
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setAudioLevel(rms);

      // Simple test - just cycle through notes when audio detected
      if (rms > 0.01) {
        const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        setCurrentNote(notes[noteCounter % notes.length] + '4');
        noteCounter++;
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pitch Debug</Text>

      <Text style={styles.status}>Status: {status}</Text>

      <Text style={styles.noteDisplay}>{currentNote}</Text>

      <Text style={styles.level}>
        Audio Level: {(audioLevel * 100).toFixed(2)}%
      </Text>

      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : null}

      <Button title="Manual Start" onPress={startAudio} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
  noteDisplay: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#007AFF',
    marginVertical: 20,
  },
  level: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});