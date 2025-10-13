import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * AUDIO DEBUG TEST
 * This component tests if microphone input is actually working
 * From Steve Jobs perspective: TEST THE FUNDAMENTALS FIRST
 */
export const AudioDebugTest: React.FC = () => {
  const [status, setStatus] = useState('Not started');
  const [audioLevel, setAudioLevel] = useState(0);
  const [rawData, setRawData] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startTest = async () => {
    try {
      setStatus('Requesting microphone permission...');
      console.log('🎤 Requesting microphone access...');

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      setStatus('Microphone granted ✓');
      console.log('✅ Microphone access granted');
      console.log('Stream tracks:', stream.getTracks());
      streamRef.current = stream;

      // Create audio context
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      console.log('🔊 Audio context created');
      console.log('Sample rate:', audioContext.sampleRate);
      console.log('Audio context state:', audioContext.state);

      // Resume if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('▶️ Audio context resumed');
      }

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      analyserRef.current = analyser;

      console.log('📊 Analyser created, FFT size:', analyser.fftSize);

      // Connect microphone to analyser
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);

      console.log('🔗 Microphone connected to analyser');

      setStatus('Listening...');
      setIsRunning(true);

      // Start monitoring
      const dataArray = new Float32Array(analyser.fftSize);

      const monitor = () => {
        if (!analyserRef.current || !isRunning) {
          console.log('❌ Stopping monitor');
          return;
        }

        // Get time domain data
        analyserRef.current.getFloatTimeDomainData(dataArray);

        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // Get first 10 samples for debugging
        const samples = Array.from(dataArray.slice(0, 10));

        setAudioLevel(rms);
        setRawData(samples);

        // Log every 30 frames (~500ms)
        if (Math.random() < 0.03) {
          console.log('📈 RMS:', rms.toFixed(6));
          console.log('📊 First 10 samples:', samples.map(v => v.toFixed(4)).join(', '));
        }

        animationFrameRef.current = requestAnimationFrame(monitor);
      };

      monitor();

    } catch (error) {
      console.error('❌ Error:', error);
      setStatus(`Error: ${error}`);
    }
  };

  const stopTest = () => {
    console.log('🛑 Stopping test...');
    setIsRunning(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Track stopped:', track.label);
      });
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      console.log('🔌 Audio context closed');
    }

    setStatus('Stopped');
    setAudioLevel(0);
    setRawData([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔬 Audio Debug Test</Text>
      <Text style={styles.subtitle}>Testing microphone fundamentals</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.levelBox}>
        <Text style={styles.levelLabel}>Audio Level (RMS):</Text>
        <Text style={styles.levelValue}>{(audioLevel * 100).toFixed(3)}%</Text>
        <View style={styles.levelBar}>
          <View
            style={[
              styles.levelFill,
              {
                width: `${Math.min(audioLevel * 1000, 100)}%`,
                backgroundColor: audioLevel > 0.01 ? '#4CAF50' : '#FF3B30'
              }
            ]}
          />
        </View>
      </View>

      <View style={styles.dataBox}>
        <Text style={styles.dataLabel}>Raw Samples (first 10):</Text>
        <Text style={styles.dataText}>
          {rawData.map(v => v.toFixed(4)).join('\n')}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={startTest}>
            <Text style={styles.buttonText}>▶️ Start Test</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopTest}>
            <Text style={styles.buttonText}>⏹️ Stop Test</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>📋 Instructions:</Text>
        <Text style={styles.instructionText}>
          1. Click "Start Test"{'\n'}
          2. Grant microphone permission{'\n'}
          3. Say something or make a sound{'\n'}
          4. Watch audio level and raw samples{'\n'}
          5. Open browser console (F12) for detailed logs
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
  },
  statusBox: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  levelBox: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  levelLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 12,
  },
  levelBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 6,
  },
  dataBox: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  dataLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 22,
  },
});