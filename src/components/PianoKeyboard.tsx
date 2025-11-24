/**
 * Piano Keyboard Visualization Component
 *
 * Interactive piano keyboard showing vocal range performance:
 * - Green keys: Comfortable range (70%+ accuracy)
 * - Yellow keys: Extended range (50-70% accuracy)
 * - Red keys: Struggling (<50% accuracy)
 * - Gray keys: Never attempted
 *
 * Tap keys to hear reference pitch.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { FrequencyHeatmapEntry, FrequencyCategory } from '../services/rangeAnalysis';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface PianoKeyboardProps {
  heatmap: FrequencyHeatmapEntry[];
  startNote?: string; // e.g., "C2"
  endNote?: string; // e.g., "C6"
  height?: number;
  pianoVolume?: number; // 0-100, default 85
}

// Note names in one octave
const CHROMATIC_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Determine if note is black key
const isBlackKey = (note: string): boolean => {
  return note.includes('#');
};

// Get category color
const getCategoryColor = (category: FrequencyCategory): string => {
  switch (category) {
    case 'comfortable':
      return '#10B981'; // Green
    case 'extended':
      return '#F59E0B'; // Yellow/Orange
    case 'struggling':
      return '#EF4444'; // Red
    case 'untested':
    default:
      return '#3A3A3A'; // Gray
  }
};

// Generate all notes in range
function generateNoteRange(startNote: string, endNote: string): string[] {
  const startMatch = startNote.match(/^([A-G]#?)(\d+)$/);
  const endMatch = endNote.match(/^([A-G]#?)(\d+)$/);

  if (!startMatch || !endMatch) return [];

  const startNoteName = startMatch[1];
  const startOctave = parseInt(startMatch[2]);
  const endNoteName = endMatch[1];
  const endOctave = parseInt(endMatch[2]);

  const notes: string[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (const noteName of CHROMATIC_SCALE) {
      const fullNote = `${noteName}${octave}`;

      // Skip notes before start
      if (octave === startOctave && CHROMATIC_SCALE.indexOf(noteName) < CHROMATIC_SCALE.indexOf(startNoteName)) {
        continue;
      }

      // Skip notes after end
      if (octave === endOctave && CHROMATIC_SCALE.indexOf(noteName) > CHROMATIC_SCALE.indexOf(endNoteName)) {
        continue;
      }

      notes.push(fullNote);
    }
  }

  return notes;
}

// Piano Key Component
interface PianoKeyProps {
  note: string;
  category: FrequencyCategory;
  accuracy: number;
  isBlack: boolean;
  position: number;
  totalWhiteKeys: number;
  onPress: () => void;
}

const PianoKey: React.FC<PianoKeyProps> = ({
  note,
  category,
  accuracy,
  isBlack,
  position,
  totalWhiteKeys,
  onPress,
}) => {
  const whiteKeyWidth = (SCREEN_WIDTH - 40) / totalWhiteKeys; // Account for padding
  const blackKeyWidth = whiteKeyWidth * 0.6;

  const backgroundColor = useSharedValue(getCategoryColor(category));

  useEffect(() => {
    backgroundColor.value = withTiming(getCategoryColor(category), { duration: 400 });
  }, [category]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  if (isBlack) {
    // Black key positioning (offset from white keys)
    const blackKeyOffset = whiteKeyWidth * position - blackKeyWidth / 2;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.blackKey,
          {
            width: blackKeyWidth,
            left: 20 + blackKeyOffset,
          },
        ]}
      >
        <Animated.View style={[styles.blackKeyInner, animatedStyle]}>
          {category !== 'untested' && (
            <Text style={styles.blackKeyAccuracy}>{accuracy.toFixed(0)}%</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // White key
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.whiteKey,
        {
          width: whiteKeyWidth,
          left: 20 + whiteKeyWidth * position,
        },
      ]}
    >
      <Animated.View style={[styles.whiteKeyInner, animatedStyle]}>
        <Text style={styles.keyLabel}>{note}</Text>
        {category !== 'untested' && (
          <Text style={styles.whiteKeyAccuracy}>{accuracy.toFixed(0)}%</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  heatmap,
  startNote = 'C2',
  endNote = 'C6',
  height = 200,
  pianoVolume = 85,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Generate all notes in range
  const allNotes = generateNoteRange(startNote, endNote);

  // Create heatmap lookup
  const heatmapMap = new Map<string, FrequencyHeatmapEntry>();
  heatmap.forEach((entry) => {
    heatmapMap.set(entry.note, entry);
  });

  // Separate white and black keys with positions
  const whiteKeys: Array<{ note: string; position: number }> = [];
  const blackKeys: Array<{ note: string; position: number }> = [];

  let whiteKeyPosition = 0;
  allNotes.forEach((note) => {
    if (isBlackKey(note)) {
      // Black key position is relative to previous white key
      blackKeys.push({ note, position: whiteKeyPosition });
    } else {
      whiteKeys.push({ note, position: whiteKeyPosition });
      whiteKeyPosition++;
    }
  });

  // Play reference pitch
  const playReferenceNote = async (frequency: number) => {
    try {
      // Unload previous sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Generate simple sine wave tone (using expo-av's built-in sounds as placeholders)
      // In production, use actual piano samples or synthesize tones
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../assets/audio/piano/C4.aiff'),
        { shouldPlay: true, volume: pianoVolume / 100 }
      );

      setSound(newSound);

      // Unload after playing
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (error) {
      console.warn('Failed to play reference note:', error);
    }
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <View style={[styles.container, { height }]}>
      {/* White Keys */}
      {whiteKeys.map(({ note, position }) => {
        const entry = heatmapMap.get(note);
        return (
          <PianoKey
            key={note}
            note={note}
            category={entry?.category || 'untested'}
            accuracy={entry?.averageAccuracy || 0}
            isBlack={false}
            position={position}
            totalWhiteKeys={whiteKeys.length}
            onPress={() => entry && playReferenceNote(entry.frequency)}
          />
        );
      })}

      {/* Black Keys (rendered on top) */}
      {blackKeys.map(({ note, position }) => {
        const entry = heatmapMap.get(note);
        return (
          <PianoKey
            key={note}
            note={note}
            category={entry?.category || 'untested'}
            accuracy={entry?.averageAccuracy || 0}
            isBlack={true}
            position={position}
            totalWhiteKeys={whiteKeys.length}
            onPress={() => entry && playReferenceNote(entry.frequency)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  whiteKey: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRightWidth: 1,
    borderColor: '#1A1A1A',
  },
  whiteKeyInner: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
    borderRadius: 4,
  },
  blackKey: {
    position: 'absolute',
    top: 0,
    height: '60%',
    zIndex: 10,
    borderRadius: 4,
  },
  blackKeyInner: {
    flex: 1,
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  keyLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  whiteKeyAccuracy: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
  blackKeyAccuracy: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
});
