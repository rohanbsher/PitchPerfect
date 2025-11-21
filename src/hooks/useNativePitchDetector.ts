/**
 * Native Pitch Detector Hook
 *
 * Connects to the Swift native module for high-performance pitch detection.
 * Uses Reanimated shared values for smooth 60fps animations without React re-renders.
 *
 * Benefits:
 * - <15ms audio latency (vs 100ms+ in JavaScript)
 * - SIMD-optimized YIN algorithm (Accelerate framework)
 * - No React Native bridge overhead for pitch data
 * - Direct GPU-animated UI updates
 */

import { useEffect, useRef, useCallback } from 'react';
import { NativeModules, NativeEventEmitter, Platform, AppState, AppStateStatus } from 'react-native';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

// Native module interface
interface PitchDetectorModuleInterface {
  startPitchDetection: (callback: (error: string | null, result?: string) => void) => void;
  stopPitchDetection: () => void;
  requestPermissions: () => Promise<string>;
}

// Pitch data from native module
export interface NativePitchData {
  frequency: number;
  confidence: number;
  note: string;
  rms: number;
  centsOff: number;
  timestamp: number;
}

// Hook options
interface UseNativePitchDetectorOptions {
  onPitchUpdate?: (data: NativePitchData) => void;
  autoStart?: boolean;
}

const { PitchDetectorModule } = NativeModules as {
  PitchDetectorModule: PitchDetectorModuleInterface;
};

/**
 * Hook for native pitch detection
 *
 * Returns shared values that can be used directly in Reanimated worklets
 * for smooth, 60fps animations without React re-renders.
 */
export const useNativePitchDetector = (options: UseNativePitchDetectorOptions = {}) => {
  const { onPitchUpdate, autoStart = false } = options;

  // Shared values for Reanimated (no React re-renders!)
  // Note: Only use shared values for numeric types to avoid crashes
  const frequency = useSharedValue(0);
  const confidence = useSharedValue(0);
  const centsOff = useSharedValue(0);
  const rms = useSharedValue(0);
  const isListening = useSharedValue(false);
  const hasPermission = useSharedValue(false);

  // Regular React state for UI elements that need to re-render
  const eventEmitterRef = useRef<NativeEventEmitter | null>(null);
  const subscriptionRef = useRef<any>(null);
  const wasListeningBeforeBackgroundRef = useRef(false);

  // Request microphone permission
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      console.warn('Native pitch detector only available on iOS');
      return false;
    }

    try {
      console.log('🔐 Requesting microphone permissions...');
      const result = await PitchDetectorModule.requestPermissions();
      console.log('🔐 Permission result:', result);
      hasPermission.value = result === 'granted';
      return result === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      hasPermission.value = false;
      return false;
    }
  }, []);

  // Start pitch detection
  const startDetection = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      console.warn('Native pitch detector only available on iOS');
      return;
    }

    // Request permission first
    const granted = await requestPermissions();
    if (!granted) {
      console.error('Microphone permission not granted');
      return;
    }

    // Set up event emitter
    if (!eventEmitterRef.current) {
      eventEmitterRef.current = new NativeEventEmitter(PitchDetectorModule as any);
    }

    // Subscribe to pitch events
    console.log('📡 Setting up pitch event listener...');
    subscriptionRef.current = eventEmitterRef.current.addListener(
      'onPitchDetected',
      (data: NativePitchData) => {
        // Log incoming data periodically (5% of events)
        if (Math.random() < 0.05) {
          console.log('🎵 Pitch:', data.frequency.toFixed(1), 'Hz', data.note, 'conf:', data.confidence.toFixed(2));
        }

        // Update shared values (no React re-render!)
        frequency.value = data.frequency;
        confidence.value = data.confidence;
        centsOff.value = data.centsOff;
        rms.value = data.rms;

        // Optional callback for additional processing (note is passed here, not via shared value)
        if (onPitchUpdate) {
          runOnJS(onPitchUpdate)(data);
        }
      }
    );
    console.log('✅ Pitch event listener ready');

    // Start the native audio engine
    PitchDetectorModule.startPitchDetection((error, result) => {
      if (error) {
        console.error('Failed to start pitch detection:', error);
        isListening.value = false;
      } else {
        console.log('✅ Native pitch detection started:', result);
        isListening.value = true;
      }
    });
  }, [onPitchUpdate, requestPermissions]);

  // Stop pitch detection
  const stopDetection = useCallback(() => {
    if (Platform.OS !== 'ios') return;

    // Remove event subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    // Stop native audio engine
    PitchDetectorModule.stopPitchDetection();
    isListening.value = false;

    // Reset values
    frequency.value = 0;
    confidence.value = 0;
    centsOff.value = 0;
    rms.value = 0;

    console.log('🛑 Native pitch detection stopped');
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (Platform.OS !== 'ios') return;

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Stop audio when app goes to background to preserve battery
        if (isListening.value) {
          wasListeningBeforeBackgroundRef.current = true;
          PitchDetectorModule.stopPitchDetection();
          isListening.value = false;
          console.log('🛑 Pitch detection paused (app background)');
        }
      } else if (nextAppState === 'active') {
        // Resume if we were listening before going to background
        if (wasListeningBeforeBackgroundRef.current) {
          wasListeningBeforeBackgroundRef.current = false;
          // Small delay to let iOS audio session settle
          setTimeout(() => {
            try {
              PitchDetectorModule.startPitchDetection((error, result) => {
                if (error) {
                  // Audio session errors on resume are non-fatal, just log
                  console.warn('Could not resume pitch detection:', error);
                } else {
                  isListening.value = true;
                  console.log('✅ Pitch detection resumed:', result);
                }
              });
            } catch (e) {
              // Catch any synchronous errors from the native module
              console.warn('Pitch detection resume skipped:', e);
            }
          }, 500); // Increased delay for better reliability
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart && Platform.OS === 'ios') {
      startDetection();
    }

    // Cleanup on unmount only (empty dependency array to avoid re-running)
    return () => {
      if (Platform.OS !== 'ios') return;

      // Remove event subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      // Stop native audio engine
      PitchDetectorModule.stopPitchDetection();
      console.log('🛑 Native pitch detection stopped (unmount cleanup)');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Shared values for Reanimated (60fps animations)
    frequency,
    confidence,
    centsOff,
    rms,
    isListening,
    hasPermission,

    // Control methods
    startDetection,
    stopDetection,
    requestPermissions,

    // Check if native module is available
    isAvailable: Platform.OS === 'ios' && !!PitchDetectorModule,
  };
};

export default useNativePitchDetector;
