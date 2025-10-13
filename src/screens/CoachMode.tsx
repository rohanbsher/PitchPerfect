import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { detectPitch } from '../utils/pitchDetection';
import { progressTracker } from '../services/progressTracking';
import { ProgressDashboard } from '../components/ProgressDashboard';
import { referencePitchService } from '../services/referencePitchService';
import { recordingService, type RecordingData } from '../services/recordingService';

const { width, height } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  description: string;
  targetNotes: string[];
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 'warmup_scales',
    name: 'Warm-up Scales',
    description: 'Gentle scales to warm up your voice',
    targetNotes: ['C4', 'D4', 'E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'],
    duration: 30,
    difficulty: 'beginner',
    icon: '🎹'
  },
  {
    id: 'interval_jumps',
    name: 'Interval Training',
    description: 'Practice jumping between notes',
    targetNotes: ['C4', 'E4', 'C4', 'G4', 'C4', 'C5', 'G4', 'E4', 'C4'],
    duration: 45,
    difficulty: 'intermediate',
    icon: '🦘'
  },
  {
    id: 'sustained_notes',
    name: 'Long Tones',
    description: 'Hold notes for 5 seconds each',
    targetNotes: ['G4', 'A4', 'B4', 'C5'],
    duration: 60,
    difficulty: 'beginner',
    icon: '⏱️'
  },
  {
    id: 'chromatic_run',
    name: 'Chromatic Challenge',
    description: 'Hit every semitone in sequence',
    targetNotes: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5'],
    duration: 60,
    difficulty: 'advanced',
    icon: '🎯'
  },
  {
    id: 'vibrato_practice',
    name: 'Vibrato Control',
    description: 'Practice controlled vibrato on sustained notes',
    targetNotes: ['A4', 'A4', 'A4', 'A4'],
    duration: 45,
    difficulty: 'advanced',
    icon: '〰️'
  }
];

export const CoachMode = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [detectedNote, setDetectedNote] = useState<string>('--');
  const [score, setScore] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [mode, setMode] = useState<'exercises' | 'freeplay' | 'record'>('exercises');
  const [recordedNotes, setRecordedNotes] = useState<string[]>([]);
  const [currentRecording, setCurrentRecording] = useState<RecordingData | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const recording = useRef<Audio.Recording | null>(null);
  const animationFrame = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startExercise = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentNoteIndex(0);
    setScore(0);
    progressTracker.startSession();
    await startListening();
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 4096;
      analyser.current.smoothingTimeConstant = 0.8;

      microphone.current = audioContext.current.createMediaStreamSource(stream);
      microphone.current.connect(analyser.current);

      setIsListening(true);
      detectPitchContinuously();
    } catch (error) {
      Alert.alert('Microphone Error', 'Please allow microphone access to use this feature');
    }
  };

  const detectPitchContinuously = () => {
    if (!analyser.current || !audioContext.current) return;

    const dataArray = new Float32Array(analyser.current.fftSize);

    const detect = () => {
      if (!isListening || !analyser.current) return;

      analyser.current.getFloatTimeDomainData(dataArray);
      const pitch = detectPitch(dataArray, audioContext.current!.sampleRate);

      if (pitch && pitch.note) {
        setDetectedNote(pitch.note);

        if (selectedExercise && currentNoteIndex < selectedExercise.targetNotes.length) {
          const targetNote = selectedExercise.targetNotes[currentNoteIndex];
          const isCorrect = pitch.note === targetNote;

          progressTracker.recordNote(targetNote, pitch.note, isCorrect);

          if (isCorrect) {
            setScore(prev => prev + 1);
            setTimeout(() => {
              setCurrentNoteIndex(prev => prev + 1);
            }, 500);
          }
        }

        if (mode === 'record') {
          setRecordedNotes(prev => [...prev, pitch.note]);
        }
      }

      animationFrame.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const stopListening = () => {
    setIsListening(false);

    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    if (microphone.current) {
      microphone.current.disconnect();
    }

    if (audioContext.current) {
      audioContext.current.close();
    }

    if (selectedExercise) {
      const session = progressTracker.endSession();
      if (session) {
        Alert.alert(
          'Exercise Complete!',
          `Accuracy: ${session.accuracy.toFixed(1)}%\nNotes Hit: ${session.notesHit.length}`,
          [{ text: 'View Progress', onPress: () => setShowProgress(true) }]
        );
      }
      setSelectedExercise(null);
    }
  };

  const playReferenceNote = async (note: string) => {
    // Play the reference pitch using Web Audio API
    await referencePitchService.playNote(note, 1000, 'sine', 0.3);
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await recordingService.startRecording();
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const recording = await recordingService.stopRecording();
      setCurrentRecording(recording);
      setIsRecording(false);
      recordingService.saveRecording(recording);

      Alert.alert(
        'Recording Saved!',
        `Duration: ${recording.duration.toFixed(1)}s\nNotes detected: ${recording.noteSequence.length}`,
        [
          { text: 'Play Back', onPress: () => playRecording(recording) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to save recording.');
      setIsRecording(false);
    }
  };

  const playRecording = (recording: RecordingData) => {
    if (recording.audioUrl) {
      // Create audio element to play recording
      const audio = new Audio(recording.audioUrl);
      audio.play();
    }
  };

  if (showProgress) {
    return <ProgressDashboard onClose={() => setShowProgress(false)} />;
  }

  if (selectedExercise) {
    return (
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseTitle}>{selectedExercise.name}</Text>
          <TouchableOpacity onPress={stopListening} style={styles.stopButton}>
            <Text style={styles.stopText}>Stop</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.targetNoteContainer}>
          <Text style={styles.targetLabel}>Target Note</Text>
          <Text style={styles.targetNote}>
            {selectedExercise.targetNotes[currentNoteIndex] || 'Complete!'}
          </Text>
          <TouchableOpacity
            onPress={() => playReferenceNote(selectedExercise.targetNotes[currentNoteIndex])}
            style={styles.playButton}
          >
            <Text style={styles.playText}>🔊 Play Reference</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detectionContainer}>
          <Text style={styles.detectedLabel}>You're Singing</Text>
          <Text style={[
            styles.detectedNote,
            { color: detectedNote === selectedExercise.targetNotes[currentNoteIndex] ? '#4ADE80' : '#F87171' }
          ]}>
            {detectedNote}
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${(currentNoteIndex / selectedExercise.targetNotes.length) * 100}%` }
          ]} />
        </View>

        <Text style={styles.score}>
          Score: {score}/{selectedExercise.targetNotes.length}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Coach Mode</Text>
        <TouchableOpacity onPress={() => setShowProgress(true)} style={styles.progressButton}>
          <Text style={styles.progressButtonText}>📊 Progress</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          onPress={() => setMode('exercises')}
          style={[styles.modeButton, mode === 'exercises' && styles.modeButtonActive]}
        >
          <Text style={styles.modeText}>Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('freeplay')}
          style={[styles.modeButton, mode === 'freeplay' && styles.modeButtonActive]}
        >
          <Text style={styles.modeText}>Free Play</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('record')}
          style={[styles.modeButton, mode === 'record' && styles.modeButtonActive]}
        >
          <Text style={styles.modeText}>Record</Text>
        </TouchableOpacity>
      </View>

      {mode === 'exercises' && (
        <ScrollView style={styles.exerciseList}>
          <Text style={styles.sectionTitle}>Today's Exercises</Text>
          {EXERCISES.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              onPress={() => startExercise(exercise)}
              style={styles.exerciseCard}
            >
              <LinearGradient
                colors={
                  exercise.difficulty === 'beginner' ? ['#10B981', '#34D399'] :
                  exercise.difficulty === 'intermediate' ? ['#F59E0B', '#FCD34D'] :
                  ['#EF4444', '#F87171']
                }
                style={styles.exerciseGradient}
              >
                <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                  <View style={styles.exerciseMeta}>
                    <Text style={styles.exerciseDuration}>⏱️ {exercise.duration}s</Text>
                    <Text style={styles.exerciseDifficulty}>{exercise.difficulty}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {mode === 'freeplay' && (
        <View style={styles.freePlayContainer}>
          <Text style={styles.freePlayTitle}>Free Play Mode</Text>
          <Text style={styles.freePlayDesc}>
            Sing freely and see your pitch in real-time
          </Text>
          <TouchableOpacity
            onPress={isListening ? stopListening : startListening}
            style={styles.bigButton}
          >
            <LinearGradient
              colors={isListening ? ['#EF4444', '#F87171'] : ['#6366F1', '#8B5CF6']}
              style={styles.bigButtonGradient}
            >
              <Text style={styles.bigButtonText}>
                {isListening ? 'Stop' : 'Start'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {isListening && (
            <View style={styles.freePlayNote}>
              <Text style={styles.freePlayNoteText}>{detectedNote}</Text>
            </View>
          )}
        </View>
      )}

      {mode === 'record' && (
        <View style={styles.recordContainer}>
          <Text style={styles.recordTitle}>Record & Compare</Text>
          <Text style={styles.recordDesc}>
            Record yourself singing, then play it back to analyze
          </Text>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={styles.bigButton}
          >
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#F87171'] : ['#EC4899', '#F43F5E']}
              style={styles.bigButtonGradient}
            >
              <Text style={styles.bigButtonText}>
                {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {recordedNotes.length > 0 && (
            <View style={styles.recordedNotes}>
              <Text style={styles.recordedTitle}>Recorded Notes:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recordedNotes.map((note, index) => (
                  <View key={index} style={styles.noteChip}>
                    <Text style={styles.noteChipText}>{note}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressButton: {
    padding: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
  },
  progressButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  modeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  exerciseCard: {
    marginBottom: 15,
  },
  exerciseGradient: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIcon: {
    fontSize: 36,
    marginRight: 15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#F3F4F6',
    marginBottom: 10,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseDuration: {
    fontSize: 12,
    color: '#F3F4F6',
    marginRight: 15,
  },
  exerciseDifficulty: {
    fontSize: 12,
    color: '#F3F4F6',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stopButton: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
  },
  stopText: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '600',
  },
  targetNoteContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  targetLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 10,
  },
  targetNote: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 20,
  },
  playButton: {
    padding: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
  },
  playText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  detectionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  detectedLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 10,
  },
  detectedNote: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  score: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  freePlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freePlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  freePlayDesc: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 40,
    textAlign: 'center',
  },
  bigButton: {
    marginBottom: 40,
  },
  bigButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 30,
  },
  bigButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  freePlayNote: {
    alignItems: 'center',
  },
  freePlayNoteText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  recordContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  recordDesc: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  recordedNotes: {
    width: '100%',
    padding: 20,
  },
  recordedTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  noteChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  noteChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});