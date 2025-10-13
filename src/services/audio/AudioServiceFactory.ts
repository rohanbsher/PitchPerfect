/**
 * Factory for creating platform-specific audio services
 * Uses React Native Platform API to detect web vs iOS/Android
 * CRITICAL: Uses dynamic imports to prevent Tone.js from loading on iOS/Android
 */

import { Platform } from 'react-native';
import { IAudioService, AudioServiceConfig } from './IAudioService';
import { NativeAudioService } from './NativeAudioService';

export class AudioServiceFactory {
  /**
   * Create appropriate audio service based on current platform
   * @param config Optional audio service configuration
   * @returns IAudioService implementation (WebAudioService or NativeAudioService)
   */
  static create(config?: AudioServiceConfig): IAudioService {
    console.log(`🎵 AudioServiceFactory: Creating service for platform: ${Platform.OS}`);

    switch (Platform.OS) {
      case 'web':
        console.log('🌐 AudioServiceFactory: Using WebAudioService');
        // Dynamic import to prevent Tone.js from loading on iOS/Android
        const { WebAudioService } = require('./WebAudioService');
        return new WebAudioService(config);

      case 'ios':
        console.log('🍎 AudioServiceFactory: Using NativeAudioService (iOS)');
        return new NativeAudioService(config);

      case 'android':
        console.log('🤖 AudioServiceFactory: Using NativeAudioService (Android)');
        return new NativeAudioService(config);

      default:
        console.warn(`⚠️ AudioServiceFactory: Unknown platform ${Platform.OS}, defaulting to NativeAudioService`);
        return new NativeAudioService(config);
    }
  }

  /**
   * Check if current platform supports Web Audio API
   */
  static isWebPlatform(): boolean {
    return Platform.OS === 'web';
  }

  /**
   * Check if current platform supports native audio (iOS/Android)
   */
  static isNativePlatform(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Get recommended configuration for current platform
   */
  static getRecommendedConfig(): AudioServiceConfig {
    if (this.isWebPlatform()) {
      return {
        sampleRate: 44100,
        bufferSize: 2048,
      };
    } else {
      return {
        sampleRate: 44100,
        bufferSize: 2048,
        iosAudioCategory: 'playAndRecord',
      };
    }
  }
}
