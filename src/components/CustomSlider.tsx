/**
 * Custom Slider Component
 *
 * A slider component compatible with React Native's new architecture (Fabric).
 * Uses react-native-gesture-handler and react-native-reanimated for smooth animations.
 */

import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: object;
}

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;

export function CustomSlider({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  minimumTrackTintColor = '#10B981',
  maximumTrackTintColor = '#3A3A3A',
  thumbTintColor = '#FFFFFF',
  style,
}: CustomSliderProps) {
  const trackWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const isSliding = useSharedValue(false);

  // Convert value to position
  const valueToPosition = useCallback(
    (val: number, width: number) => {
      const range = maximumValue - minimumValue;
      const normalizedValue = (val - minimumValue) / range;
      return normalizedValue * width;
    },
    [minimumValue, maximumValue]
  );

  // Convert position to value
  const positionToValue = useCallback(
    (pos: number, width: number) => {
      if (width === 0) return minimumValue;
      const range = maximumValue - minimumValue;
      let normalizedPos = Math.max(0, Math.min(pos / width, 1));
      let newValue = minimumValue + normalizedPos * range;

      // Apply step
      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      // Clamp to range
      return Math.max(minimumValue, Math.min(maximumValue, newValue));
    },
    [minimumValue, maximumValue, step]
  );

  // Update thumb position when value changes externally
  useEffect(() => {
    if (!isSliding.value && trackWidth.value > 0) {
      thumbX.value = valueToPosition(value, trackWidth.value);
    }
  }, [value, valueToPosition]);

  const handleValueChange = useCallback(
    (newValue: number) => {
      onValueChange(newValue);
    },
    [onValueChange]
  );

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      isSliding.value = true;
      thumbX.value = Math.max(0, Math.min(event.x, trackWidth.value));
    })
    .onUpdate((event) => {
      thumbX.value = Math.max(0, Math.min(event.x, trackWidth.value));
      const newValue = positionToValue(thumbX.value, trackWidth.value);
      runOnJS(handleValueChange)(newValue);
    })
    .onEnd(() => {
      isSliding.value = false;
    });

  const tapGesture = Gesture.Tap().onEnd((event) => {
    thumbX.value = withSpring(Math.max(0, Math.min(event.x, trackWidth.value)), {
      damping: 15,
      stiffness: 150,
    });
    const newValue = positionToValue(event.x, trackWidth.value);
    runOnJS(handleValueChange)(newValue);
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      trackWidth.value = width;
      thumbX.value = valueToPosition(value, width);
    },
    [value, valueToPosition]
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  const filledTrackStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.trackContainer} onLayout={handleLayout}>
          {/* Background track */}
          <View
            style={[
              styles.track,
              { backgroundColor: maximumTrackTintColor },
            ]}
          />
          {/* Filled track */}
          <Animated.View
            style={[
              styles.filledTrack,
              { backgroundColor: minimumTrackTintColor },
              filledTrackStyle,
            ]}
          />
          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              { backgroundColor: thumbTintColor },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    width: '100%',
  },
  filledTrack: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
