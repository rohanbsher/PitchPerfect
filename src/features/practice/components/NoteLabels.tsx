/**
 * NoteLabels Component
 *
 * Renders the note labels (C2, D2, E2, etc.) along the left side of the pitch tracker.
 * Memoized to prevent re-renders when pitch updates.
 */

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants
const MIN_MIDI = 36; // C2
const MAX_MIDI = 84; // C6
const TOTAL_NOTES = MAX_MIDI - MIN_MIDI + 1;
const TRACKER_HEIGHT = SCREEN_HEIGHT - 100;
const NOTE_HEIGHT = TRACKER_HEIGHT / TOTAL_NOTES;
const LABEL_WIDTH = 35;

// Note names
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface NoteLabelProps {
  midi: number;
}

const NoteLabel: React.FC<NoteLabelProps> = memo(({ midi }) => {
  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  const isNatural = !noteName.includes('#');
  const isCNote = noteName === 'C';

  // Only show labels for natural notes
  if (!isNatural) return null;

  const y = ((MAX_MIDI - midi) / (TOTAL_NOTES - 1)) * (TRACKER_HEIGHT - NOTE_HEIGHT);

  return (
    <View style={[styles.labelContainer, { top: y }]}>
      <Text style={[styles.label, isCNote && styles.cNoteLabel]}>
        {noteName}
        <Text style={styles.octaveLabel}>{octave}</Text>
      </Text>
    </View>
  );
});

NoteLabel.displayName = 'NoteLabel';

interface NoteLabelsProps {
  style?: object;
}

/**
 * NoteLabels renders all note labels for the pitch tracker
 */
export const NoteLabels: React.FC<NoteLabelsProps> = memo(({ style }) => {
  // Generate labels once and memoize
  const labels = useMemo(() => {
    const result = [];
    for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
      result.push(<NoteLabel key={midi} midi={midi} />);
    }
    return result;
  }, []);

  return <View style={[styles.container, style]}>{labels}</View>;
});

NoteLabels.displayName = 'NoteLabels';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LABEL_WIDTH,
    height: TRACKER_HEIGHT,
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    width: LABEL_WIDTH,
    height: NOTE_HEIGHT,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  cNoteLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
  },
  octaveLabel: {
    fontSize: 8,
  },
});

export default NoteLabels;
