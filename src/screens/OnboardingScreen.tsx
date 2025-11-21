/**
 * Onboarding Screen
 *
 * 3-screen intro explaining the app in under 30 seconds.
 * Jobs: "If you have to explain it, you've already failed" - but we do it anyway, briefly.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  visual: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'See Your Voice',
    subtitle: 'Sing and watch your pitch move in real-time. The green bar is you.',
    visual: '🎵',
  },
  {
    id: '2',
    title: 'Match the Target',
    subtitle: 'During exercises, match the purple target note. Get feedback instantly.',
    visual: '🎯',
  },
  {
    id: '3',
    title: 'Track Progress',
    subtitle: 'Build your streak, improve accuracy, and expand your range.',
    visual: '📈',
  },
];

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <Animated.Text
        entering={FadeIn.delay(200)}
        style={styles.visual}
      >
        {item.visual}
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(400)}
        style={styles.title}
      >
        {item.title}
      </Animated.Text>
      <Animated.Text
        entering={FadeInUp.delay(600)}
        style={styles.subtitle}
      >
        {item.subtitle}
      </Animated.Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
      />

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  visual: {
    fontSize: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#10B981',
    width: 24,
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
