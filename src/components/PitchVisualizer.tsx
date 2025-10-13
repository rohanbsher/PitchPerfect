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
  useValue,
  useTiming,
  useComputedValue,
} from '@shopify/react-native-skia';
import { PitchDetectionResult } from '../utils/pitchDetection';

interface PitchVisualizerProps {
  pitchResult: PitchDetectionResult | null;
  targetNote?: { frequency: number; name: string };
  mode: 'line' | 'staff' | 'piano';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PitchVisualizer: React.FC<PitchVisualizerProps> = ({
  pitchResult,
  targetNote,
  mode = 'line'
}) => {
  const canvasWidth = screenWidth - 40;
  const canvasHeight = 200;

  // Animation values
  const animatedPitch = useValue(0);
  const time = useTiming({ loop: true }, { duration: 1000 });

  useEffect(() => {
    if (pitchResult && pitchResult.frequency > 0) {
      animatedPitch.current = pitchResult.frequency;
    }
  }, [pitchResult]);

  // Compute visual position based on frequency
  const pitchY = useComputedValue(() => {
    if (!pitchResult || pitchResult.frequency === 0) return canvasHeight / 2;

    // Map frequency to Y position (log scale for musical perception)
    const minFreq = 100; // ~G2
    const maxFreq = 1000; // ~B5
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    const logFreq = Math.log(Math.max(minFreq, Math.min(maxFreq, animatedPitch.current)));

    const normalized = (logFreq - logMin) / (logMax - logMin);
    return canvasHeight - (normalized * canvasHeight * 0.8 + canvasHeight * 0.1);
  }, [animatedPitch]);

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

  const renderLineMode = () => {
    const path = Skia.Path.Make();

    // Create a simple line graph
    path.moveTo(0, canvasHeight / 2);

    // Add current pitch point
    if (pitchResult && pitchResult.frequency > 0) {
      path.lineTo(canvasWidth / 2, pitchY.current);
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
            cy={pitchY.current}
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
          />
        )}

        {/* Frequency display */}
        {pitchResult && pitchResult.frequency > 0 && (
          <SkiaText
            x={canvasWidth / 2 - 30}
            y={canvasHeight - 10}
            text={`${Math.round(pitchResult.frequency)} Hz`}
            color="#666666"
          />
        )}

        {/* Cents indicator */}
        {pitchResult && pitchResult.cents !== 0 && (
          <SkiaText
            x={canvasWidth - 60}
            y={30}
            text={`${pitchResult.cents > 0 ? '+' : ''}${pitchResult.cents}¢`}
            color={pitchColor}
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
          text="𝄞"
          color="#333333"
        />

        {/* Note on staff */}
        {pitchResult && pitchResult.frequency > 0 && (
          <Group>
            {/* Note head */}
            <Circle
              cx={canvasWidth / 2}
              cy={pitchY.current}
              r={6}
              color={pitchColor}
            />

            {/* Note stem */}
            <Line
              p1={vec(canvasWidth / 2 + 6, pitchY.current)}
              p2={vec(canvasWidth / 2 + 6, pitchY.current - 40)}
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
            />
            <SkiaText
              x={20}
              y={50}
              text={`Confidence: ${Math.round(pitchResult.confidence * 100)}%`}
              color="#666666"
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