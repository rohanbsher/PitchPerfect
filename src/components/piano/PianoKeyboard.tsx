/**
 * Piano Keyboard Component
 *
 * Full piano keyboard with 2 octaves (C4-C6)
 * Features:
 * - Real-time pitch detection highlighting
 * - Exercise target note indicators
 * - Touch interaction to play notes
 * - Responsive layout
 *
 * @module PianoKeyboard
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { PianoKey } from './PianoKey';
import { useAudio } from '../../contexts/AudioContext';

/**
 * Piano key configuration
 * Defines all keys across 2 octaves with their properties
 */
interface KeyConfig {
  note: string;
  isBlack: boolean;
  /** Offset position for black keys */
  offsetLeft?: number;
}

// Two octaves: C4 to C6 (25 keys total)
const KEYBOARD_LAYOUT: KeyConfig[] = [
  // Octave 4
  { note: 'C4', isBlack: false },
  { note: 'C#4', isBlack: true, offsetLeft: 35 },
  { note: 'D4', isBlack: false },
  { note: 'D#4', isBlack: true, offsetLeft: 87 },
  { note: 'E4', isBlack: false },
  { note: 'F4', isBlack: false },
  { note: 'F#4', isBlack: true, offsetLeft: 189 },
  { note: 'G4', isBlack: false },
  { note: 'G#4', isBlack: true, offsetLeft: 241 },
  { note: 'A4', isBlack: false },
  { note: 'A#4', isBlack: true, offsetLeft: 293 },
  { note: 'B4', isBlack: false },
  // Octave 5
  { note: 'C5', isBlack: false },
  { note: 'C#5', isBlack: true, offsetLeft: 397 },
  { note: 'D5', isBlack: false },
  { note: 'D#5', isBlack: true, offsetLeft: 449 },
  { note: 'E5', isBlack: false },
  { note: 'F5', isBlack: false },
  { note: 'F#5', isBlack: true, offsetLeft: 551 },
  { note: 'G5', isBlack: false },
  { note: 'G#5', isBlack: true, offsetLeft: 603 },
  { note: 'A5', isBlack: false },
  { note: 'A#5', isBlack: true, offsetLeft: 655 },
  { note: 'B5', isBlack: false },
  // Octave 6 start
  { note: 'C6', isBlack: false },
];

export interface PianoKeyboardProps {
  /** Optional style override */
  style?: any;
}

/**
 * Piano Keyboard - Interactive 2-octave piano
 *
 * Connects to AudioContext for:
 * - Real-time pitch detection (green glow on detected notes)
 * - Exercise target notes (blue dots on target notes)
 * - Playing notes on touch
 */
export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ style }) => {
  const {
    pianoReady,
    currentPitch,
    exerciseOverlay,
    playNote,
  } = useAudio();

  const handleKeyPress = (note: string) => {
    if (pianoReady) {
      playNote(note, '1n'); // Play for 1 beat
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={[styles.container, style]}
    >
      <View style={styles.keyboard}>
        {/* White keys */}
        <View style={styles.whiteKeysRow}>
          {KEYBOARD_LAYOUT.filter(key => !key.isBlack).map((key) => {
            const isDetected = currentPitch?.note === key.note;
            const isTarget = exerciseOverlay.isActive &&
              exerciseOverlay.targetNotes.includes(key.note);

            return (
              <PianoKey
                key={key.note}
                note={key.note}
                isBlack={false}
                isDetected={isDetected}
                isTarget={isTarget}
                onPress={() => handleKeyPress(key.note)}
                disabled={!pianoReady}
              />
            );
          })}
        </View>

        {/* Black keys (positioned absolutely over white keys) */}
        <View style={styles.blackKeysRow}>
          {KEYBOARD_LAYOUT.filter(key => key.isBlack).map((key) => {
            const isDetected = currentPitch?.note === key.note;
            const isTarget = exerciseOverlay.isActive &&
              exerciseOverlay.targetNotes.includes(key.note);

            return (
              <View
                key={key.note}
                style={[styles.blackKeyWrapper, { left: key.offsetLeft }]}
              >
                <PianoKey
                  note={key.note}
                  isBlack={true}
                  isDetected={isDetected}
                  isTarget={isTarget}
                  onPress={() => handleKeyPress(key.note)}
                  disabled={!pianoReady}
                />
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  keyboard: {
    position: 'relative',
    height: 220,
    paddingHorizontal: 20,
  },
  whiteKeysRow: {
    flexDirection: 'row',
    height: 200,
  },
  blackKeysRow: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 130,
  },
  blackKeyWrapper: {
    position: 'absolute',
    top: 0,
  },
});
