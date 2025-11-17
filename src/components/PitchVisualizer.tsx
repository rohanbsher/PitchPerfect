import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  Circle,
  Text as SkiaText,
  useFont,
  Line,
  Group,
  vec,
  Skia,
} from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';
import { PitchDetectionResult } from '../utils/pitchDetection';

interface PitchVisualizerProps {
  pitchResult: PitchDetectionResult | null;
  targetNote?: { frequency: number; name: string };
  mode: 'line' | 'staff' | 'piano';
}

const { width: screenWidth } = Dimensions.get('window');

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({
  pitchResult,
  targetNote,
  mode = 'line'
}) => {
  const canvasWidth = screenWidth - 40;
  const canvasHeight = 200;

  // Load a basic font for text rendering
  const font = useFont(require('../../assets/fonts/SpaceMono-Regular.ttf'), 14);
  const largeFont = useFont(require('../../assets/fonts/SpaceMono-Regular.ttf'), 20);

  // Animation values using Reanimated
  const animatedFrequency = useSharedValue(0);

  useEffect(() => {
    if (pitchResult && pitchResult.frequency > 0) {
      animatedFrequency.value = withTiming(pitchResult.frequency, { duration: 100 });
    }
  }, [pitchResult, animatedFrequency]);

  // Compute visual position based on frequency
  const pitchYValue = useDerivedValue(() => {
    if (animatedFrequency.value === 0) return canvasHeight / 2;

    // Map frequency to Y position (log scale for musical perception)
    const minFreq = 100; // ~G2
    const maxFreq = 1000; // ~B5
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    const clampedFreq = Math.max(minFreq, Math.min(maxFreq, animatedFrequency.value));
    const logFreq = Math.log(clampedFreq);

    const normalized = (logFreq - logMin) / (logMax - logMin);
    return canvasHeight - (normalized * canvasHeight * 0.8 + canvasHeight * 0.1);
  }, [canvasHeight]);

  // Calculate static pitch Y for immediate rendering
  const pitchY = useMemo(() => {
    if (!pitchResult || pitchResult.frequency === 0) return canvasHeight / 2;

    const minFreq = 100;
    const maxFreq = 1000;
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    const clampedFreq = Math.max(minFreq, Math.min(maxFreq, pitchResult.frequency));
    const logFreq = Math.log(clampedFreq);

    const normalized = (logFreq - logMin) / (logMax - logMin);
    return canvasHeight - (normalized * canvasHeight * 0.8 + canvasHeight * 0.1);
  }, [pitchResult, canvasHeight]);

  // Color based on pitch accuracy
  const pitchColor = useMemo(() => {
    if (!pitchResult || !targetNote) return '#999999';

    const cents = Math.abs(pitchResult.cents);
    if (cents <= 5) return '#4CAF50';
    if (cents <= 10) return '#8BC34A';
    if (cents <= 20) return '#FFC107';
    if (cents <= 30) return '#FF9800';
    return '#F44336';
  }, [pitchResult, targetNote]);

  // Don't render text if fonts aren't loaded
  if (!font || !largeFont) {
    return (
      <View style={styles.container}>
        <Canvas style={{ width: canvasWidth, height: canvasHeight }} />
      </View>
    );
  }

  const renderLineMode = () => {
    const path = Skia.Path.Make();

    // Create a simple line graph
    path.moveTo(0, canvasHeight / 2);

    // Add current pitch point
    if (pitchResult && pitchResult.frequency > 0) {
      path.lineTo(canvasWidth / 2, pitchY);
    }

    path.lineTo(canvasWidth, canvasHeight / 2);

    return (
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Background grid */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Line
            key={i}
            p1={vec(0, (canvasHeight / 4) * i)}
            p2={vec(canvasWidth, (canvasHeight / 4) * i)}
            color="#E0E0E0"
            style="stroke"
            strokeWidth={1}
          />
        ))}

        {/* Target note line */}
        {targetNote && (
          <Line
            p1={vec(0, canvasHeight / 2)}
            p2={vec(canvasWidth, canvasHeight / 2)}
            color="#2196F3"
            style="stroke"
            strokeWidth={2}
          />
        )}

        {/* Pitch line */}
        <Path
          path={path}
          color={pitchColor}
          style="stroke"
          strokeWidth={3}
        />

        {/* Current pitch indicator */}
        {pitchResult && pitchResult.frequency > 0 && (
          <Circle
            cx={canvasWidth / 2}
            cy={pitchY}
            r={8}
            color={pitchColor}
          />
        )}

        {/* Note label */}
        {pitchResult && pitchResult.note !== '-' && (
          <SkiaText
            x={canvasWidth / 2 - 20}
            y={30}
            text={pitchResult.note}
            color="#333333"
            font={largeFont}
          />
        )}

        {/* Frequency display */}
        {pitchResult && pitchResult.frequency > 0 && (
          <SkiaText
            x={canvasWidth / 2 - 30}
            y={canvasHeight - 10}
            text={`${Math.round(pitchResult.frequency)} Hz`}
            color="#666666"
            font={font}
          />
        )}

        {/* Cents indicator */}
        {pitchResult && pitchResult.cents !== 0 && (
          <SkiaText
            x={canvasWidth - 60}
            y={30}
            text={`${pitchResult.cents > 0 ? '+' : ''}${pitchResult.cents}¢`}
            color={pitchColor}
            font={font}
          />
        )}
      </Canvas>
    );
  };

  const renderStaffMode = () => {
    const staffLineSpacing = 20;
    const staffStartY = canvasHeight / 2 - staffLineSpacing * 2;

    return (
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Staff lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <Line
            key={i}
            p1={vec(20, staffStartY + staffLineSpacing * i)}
            p2={vec(canvasWidth - 20, staffStartY + staffLineSpacing * i)}
            color="#333333"
            style="stroke"
            strokeWidth={1}
          />
        ))}

        {/* Treble clef placeholder */}
        <SkiaText
          x={25}
          y={staffStartY + staffLineSpacing * 2.5}
          text="G"
          color="#333333"
          font={largeFont}
        />

        {/* Note on staff */}
        {pitchResult && pitchResult.frequency > 0 && (
          <Group>
            {/* Note head */}
            <Circle
              cx={canvasWidth / 2}
              cy={pitchY}
              r={6}
              color={pitchColor}
            />

            {/* Note stem */}
            <Line
              p1={vec(canvasWidth / 2 + 6, pitchY)}
              p2={vec(canvasWidth / 2 + 6, pitchY - 40)}
              color={pitchColor}
              style="stroke"
              strokeWidth={2}
            />
          </Group>
        )}

        {/* Note name */}
        {pitchResult && pitchResult.note !== '-' && (
          <SkiaText
            x={canvasWidth / 2 - 20}
            y={canvasHeight - 20}
            text={pitchResult.note}
            color="#333333"
            font={largeFont}
          />
        )}
      </Canvas>
    );
  };

  const renderPianoMode = () => {
    const keyWidth = canvasWidth / 12;
    const whiteKeyHeight = 80;
    const blackKeyHeight = 50;

    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = ['C#', 'D#', null, 'F#', 'G#', 'A#'];

    const getCurrentKeyIndex = () => {
      if (!pitchResult || pitchResult.note === '-') return -1;

      const noteName = pitchResult.note.replace(/[0-9]/g, '');
      const whiteIndex = whiteKeys.indexOf(noteName);

      if (whiteIndex !== -1) return whiteIndex;

      const blackIndex = blackKeys.indexOf(noteName);
      if (blackIndex !== -1) return blackIndex + 0.5;

      return -1;
    };

    const currentKeyIndex = getCurrentKeyIndex();

    return (
      <Canvas style={{ width: canvasWidth, height: canvasHeight }}>
        {/* White keys */}
        {whiteKeys.map((key, i) => {
          const x = i * keyWidth * 1.7;
          const isActive = Math.floor(currentKeyIndex) === i;

          return (
            <Group key={`white-${i}`}>
              <Path
                path={`M ${x} ${canvasHeight - whiteKeyHeight}
                       L ${x + keyWidth * 1.5} ${canvasHeight - whiteKeyHeight}
                       L ${x + keyWidth * 1.5} ${canvasHeight}
                       L ${x} ${canvasHeight} Z`}
                color={isActive ? pitchColor : '#FFFFFF'}
                style="fill"
              />
              <Path
                path={`M ${x} ${canvasHeight - whiteKeyHeight}
                       L ${x + keyWidth * 1.5} ${canvasHeight - whiteKeyHeight}
                       L ${x + keyWidth * 1.5} ${canvasHeight}
                       L ${x} ${canvasHeight} Z`}
                color="#333333"
                style="stroke"
                strokeWidth={1}
              />
              <SkiaText
                x={x + keyWidth * 0.5}
                y={canvasHeight - 10}
                text={key}
                color={isActive ? '#FFFFFF' : '#666666'}
                font={font}
              />
            </Group>
          );
        })}

        {/* Black keys */}
        {blackKeys.map((key, i) => {
          if (!key) return null;

          const x = (i + 0.7) * keyWidth * 1.7;
          const isActive = currentKeyIndex === i + 0.5;

          return (
            <Group key={`black-${i}`}>
              <Path
                path={`M ${x} ${canvasHeight - whiteKeyHeight}
                       L ${x + keyWidth} ${canvasHeight - whiteKeyHeight}
                       L ${x + keyWidth} ${canvasHeight - whiteKeyHeight + blackKeyHeight}
                       L ${x} ${canvasHeight - whiteKeyHeight + blackKeyHeight} Z`}
                color={isActive ? pitchColor : '#333333'}
                style="fill"
              />
            </Group>
          );
        })}

        {/* Frequency and confidence indicators */}
        {pitchResult && (
          <Group>
            <SkiaText
              x={20}
              y={30}
              text={`${Math.round(pitchResult.frequency)} Hz`}
              color="#666666"
              font={font}
            />
            <SkiaText
              x={20}
              y={50}
              text={`Confidence: ${Math.round(pitchResult.confidence * 100)}%`}
              color="#666666"
              font={font}
            />
          </Group>
        )}
      </Canvas>
    );
  };

  return (
    <View style={styles.container}>
      {mode === 'line' && renderLineMode()}
      {mode === 'staff' && renderStaffMode()}
      {mode === 'piano' && renderPianoMode()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
  },
});
