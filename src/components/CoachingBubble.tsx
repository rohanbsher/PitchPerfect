/**
 * CoachingBubble Component
 *
 * Displays AI-generated coaching tips during exercises
 * Appears as a floating bubble with smooth animations
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface CoachingBubbleProps {
  message: string | null;
  visible: boolean;
}

export const CoachingBubble: React.FC<CoachingBubbleProps> = ({ message, visible }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible && message) {
      // Fade in with bounce
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      translateY.value = withSequence(
        withTiming(-10, { duration: 200 }),
        withTiming(0, { duration: 200, easing: Easing.out(Easing.back(1.5)) })
      );
      scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) });

      // Auto-hide after 8 seconds
      const timeout = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-20, { duration: 300 });
        scale.value = withTiming(0.9, { duration: 300 });
      }, 8000);

      return () => clearTimeout(timeout);
    } else {
      // Fade out
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-20, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    }
  }, [visible, message]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.bubble}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎯</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>Coach</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(147, 51, 234, 0.95)', // Purple-600 with opacity
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 21,
  },
});
