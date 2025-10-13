import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecordingData, PitchPoint } from '../services/recordingService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PitchComparisonProps {
  teacherRecording: RecordingData;
  studentRecording: RecordingData | null;
  onClose: () => void;
  onRecord: () => void;
}

export const PitchComparison: React.FC<PitchComparisonProps> = ({
  teacherRecording,
  studentRecording,
  onClose,
  onRecord
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [comparison, setComparison] = useState<{
    similarity: number;
    pitchAccuracy: number;
    timingAccuracy: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (studentRecording) {
      calculateComparison();
    }
    drawComparison();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [teacherRecording, studentRecording]);

  const calculateComparison = () => {
    if (!studentRecording) return;

    const maxTime = Math.min(teacherRecording.duration, studentRecording.duration);
    let matchedFrames = 0;
    let totalFrames = 0;
    let pitchDifferences: number[] = [];

    // Sample every 100ms
    for (let t = 0; t < maxTime; t += 0.1) {
      const teacherPitch = getPitchAtTime(teacherRecording.pitchData, t);
      const studentPitch = getPitchAtTime(studentRecording.pitchData, t);

      if (teacherPitch && studentPitch) {
        totalFrames++;

        // Check if notes match
        if (teacherPitch.note === studentPitch.note) {
          matchedFrames++;
        }

        // Calculate pitch difference
        const freqRatio = studentPitch.frequency / teacherPitch.frequency;
        const centsDiff = Math.abs(1200 * Math.log2(freqRatio));
        pitchDifferences.push(centsDiff);
      }
    }

    const timingAccuracy = totalFrames > 0 ? (matchedFrames / totalFrames) * 100 : 0;
    const avgCentsDiff = pitchDifferences.length > 0
      ? pitchDifferences.reduce((a, b) => a + b, 0) / pitchDifferences.length
      : 100;
    const pitchAccuracy = Math.max(0, 100 - avgCentsDiff);
    const similarity = (timingAccuracy + pitchAccuracy) / 2;

    setComparison({
      similarity,
      pitchAccuracy,
      timingAccuracy
    });
  };

  const getPitchAtTime = (pitchData: PitchPoint[], time: number): PitchPoint | null => {
    let closest: PitchPoint | null = null;
    let minDiff = Infinity;

    for (const point of pitchData) {
      const diff = Math.abs(point.time - time);
      if (diff < minDiff && diff < 0.1) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  };

  const drawComparison = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current as any;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = screenWidth - 40;
    const height = 300;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    // Horizontal lines (pitch)
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (time)
    const duration = Math.max(
      teacherRecording.duration,
      studentRecording?.duration || 0
    );
    const timeStep = Math.ceil(duration / 10);

    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw teacher pitch line
    drawPitchLine(ctx, teacherRecording.pitchData, '#6366F1', 2, width, height, duration);

    // Draw student pitch line if available
    if (studentRecording) {
      drawPitchLine(ctx, studentRecording.pitchData, '#10B981', 2, width, height, duration);
    }

    // Draw current time indicator
    if (isPlaying) {
      const x = (currentTime / duration) * width;
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const drawPitchLine = (
    ctx: CanvasRenderingContext2D,
    pitchData: PitchPoint[],
    color: string,
    lineWidth: number,
    canvasWidth: number,
    canvasHeight: number,
    duration: number
  ) => {
    if (pitchData.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    // Find min and max frequencies for scaling
    const frequencies = pitchData.map(p => p.frequency);
    const minFreq = Math.min(...frequencies) * 0.9;
    const maxFreq = Math.max(...frequencies) * 1.1;

    let started = false;
    for (const point of pitchData) {
      const x = (point.time / duration) * canvasWidth;
      const y = canvasHeight - ((point.frequency - minFreq) / (maxFreq - minFreq)) * canvasHeight;

      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  const playComparison = () => {
    if (teacherRecording.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(teacherRecording.audioUrl);
      audioRef.current.play();
      setIsPlaying(true);

      // Update current time indicator
      const updateTime = () => {
        if (audioRef.current && isPlaying) {
          setCurrentTime(audioRef.current.currentTime);
          animationRef.current = requestAnimationFrame(updateTime);
        }
      };
      updateTime();

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pitch Comparison</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
          <Text style={styles.legendText}>Teacher</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Student</Text>
        </View>
      </View>

      <View style={styles.canvasContainer}>
        <canvas
          ref={canvasRef as any}
          style={styles.canvas}
        />
      </View>

      {comparison && studentRecording && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{comparison.similarity.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Overall Match</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{comparison.pitchAccuracy.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Pitch Accuracy</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{comparison.timingAccuracy.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Timing</Text>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        {studentRecording ? (
          <>
            <TouchableOpacity onPress={isPlaying ? stopPlayback : playComparison} style={styles.playButton}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>
                  {isPlaying ? '⏹ Stop' : '▶️ Play Teacher'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRecord} style={styles.recordButton}>
              <LinearGradient colors={['#10B981', '#34D399']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>🎙 Record Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={onRecord} style={styles.fullWidthButton}>
            <LinearGradient colors={['#EC4899', '#F43F5E']} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>🎤 Record Your Version</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {studentRecording && (
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Feedback</Text>
          {comparison && comparison.similarity >= 80 ? (
            <Text style={styles.feedbackText}>
              🎉 Excellent! Your pitch accuracy is very close to the teacher's demonstration.
            </Text>
          ) : comparison && comparison.similarity >= 60 ? (
            <Text style={styles.feedbackText}>
              👍 Good job! Focus on matching the pitch more precisely in the highlighted areas.
            </Text>
          ) : (
            <Text style={styles.feedbackText}>
              💪 Keep practicing! Try to match both the pitch and timing of the teacher's version.
            </Text>
          )}
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    color: '#94A3B8',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  canvasContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  canvas: {
    width: screenWidth - 60,
    height: 300,
    borderRadius: 8,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 15,
    borderRadius: 12,
    minWidth: 100,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  playButton: {
    flex: 1,
    marginRight: 10,
  },
  recordButton: {
    flex: 1,
    marginLeft: 10,
  },
  fullWidthButton: {
    flex: 1,
  },
  buttonGradient: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackSection: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 20,
    borderRadius: 12,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
  },
});