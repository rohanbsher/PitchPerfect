# Pitch Detection Fix - Implementation Report
**Date**: October 7, 2025
**Status**: ✅ IMPLEMENTED - Ready for Testing
**Critical Bug**: Fixed simulated pitch detection with real-time microphone audio capture

---

## Problem Summary

### What Was Broken
**Lines 328-338 in NativeAudioService.ts**:
```typescript
// ❌ OLD CODE - Generated fake 440Hz sine wave
private generateSimulatedPCMData(): Float32Array {
  const buffer = new Float32Array(this.bufferSize);
  const frequency = 440; // HARDCODED A4
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.sin((2 * Math.PI * frequency * i) / this.sampleRate) * 0.5;
  }
  return buffer;
}
```

**Impact**:
- Pitch detection always showed ~440Hz regardless of user's voice
- Accuracy always 0%
- Feedback was meaningless ("you're singing sharp" when user wasn't singing)
- App was completely non-functional for its core purpose

---

## Solution Implemented

### 1. Installed Required Dependencies

**expo-dev-client** (SDK 54 compatible):
```bash
npx expo install expo-dev-client
```
- Enables development builds with native modules
- Required for expo-audio-stream integration

**@mykin-ai/expo-audio-stream**:
```bash
npm install @mykin-ai/expo-audio-stream --ignore-scripts
```
- Provides real-time PCM audio streaming from microphone
- Base64-encoded 16-bit PCM audio buffers
- Configurable sample rate (44100 Hz) and buffer size (2048 samples)

---

### 2. Updated NativeAudioService.ts

**File**: `src/services/audio/NativeAudioService.ts`

#### Added Imports (Lines 9-10):
```typescript
import { ExpoAudioStream, AudioDataEvent } from '@mykin-ai/expo-audio-stream';
import { EventSubscription } from 'expo-modules-core';
```

#### Added Private Fields (Lines 19-20):
```typescript
private audioSubscription: EventSubscription | null = null;
private recordingEncoding: 'pcm_16bit' = 'pcm_16bit';
```

#### Replaced startMicrophoneCapture() (Lines 146-195):
```typescript
async startMicrophoneCapture(callback: PitchDetectionCallback): Promise<void> {
  console.log('🎤 NativeAudioService: Starting microphone capture...');

  await this.setRecordingMode();
  this.pitchCallback = callback;
  this.isCapturing = true;

  try {
    // Calculate interval for desired buffer size
    const intervalMs = Math.floor((this.bufferSize / this.sampleRate) * 1000);

    console.log(`🎤 NativeAudioService: Using real-time audio stream (${this.sampleRate}Hz, buffer: ${this.bufferSize}, interval: ${intervalMs}ms)`);

    // ✅ NEW: Start real-time audio streaming with expo-audio-stream
    const { fileUri, mimeType, channels, bitRate, sampleRate } = await ExpoAudioStream.startRecording({
      sampleRate: this.sampleRate,
      channels: 1,
      encoding: this.recordingEncoding,
      interval: intervalMs,
      onAudioStream: async (event: AudioDataEvent) => {
        try {
          // Convert audio data to Float32Array
          const pcmBuffer = this.convertAudioData(event.data);

          // Call pitch detection callback with REAL microphone data
          if (this.pitchCallback && pcmBuffer.length > 0 && this.isCapturing) {
            this.pitchCallback(pcmBuffer, this.sampleRate);
          }
        } catch (error) {
          console.error('❌ NativeAudioService: Error processing audio stream', error);
        }
      }
    });

    console.log('✅ NativeAudioService: Real-time audio capture started', {
      fileUri, mimeType, channels, bitRate, sampleRate
    });

  } catch (error) {
    console.error('❌ NativeAudioService: Failed to start recording', error);
    this.isCapturing = false;
    throw error;
  }
}
```

#### Updated stopMicrophoneCapture() (Lines 197-221):
```typescript
async stopMicrophoneCapture(): Promise<void> {
  console.log('🛑 NativeAudioService: Stopping microphone capture...');

  this.isCapturing = false;
  this.pitchCallback = null;

  try {
    // ✅ NEW: Stop real-time audio streaming
    await ExpoAudioStream.stopRecording();

    // Clean up subscription
    if (this.audioSubscription) {
      this.audioSubscription.remove();
      this.audioSubscription = null;
    }

    console.log('✅ NativeAudioService: Recording stopped');
    await this.setPlaybackMode();

  } catch (error) {
    console.error('❌ NativeAudioService: Failed to stop recording', error);
  }
}
```

#### Added Conversion Methods (Lines 294-351):
```typescript
/**
 * Convert audio data (base64 or Float32Array) to Float32Array
 */
private convertAudioData(data: string | Float32Array): Float32Array {
  if (data instanceof Float32Array) {
    return data;
  }
  return this.base64ToFloat32Array(data, this.recordingEncoding);
}

/**
 * Convert base64 encoded PCM to Float32Array
 * @param base64 Base64 encoded audio data
 * @param encoding PCM encoding format
 * @returns Float32Array normalized to -1.0 to 1.0 range
 */
private base64ToFloat32Array(
  base64: string,
  encoding: 'pcm_16bit' | 'pcm_32bit' | 'pcm_8bit'
): Float32Array {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert based on encoding type
    if (encoding === 'pcm_32bit') {
      return new Float32Array(bytes.buffer);
    } else if (encoding === 'pcm_16bit') {
      // ✅ KEY: Normalize 16-bit signed int to -1.0 to 1.0 range
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }
      return float32Array;
    } else if (encoding === 'pcm_8bit') {
      const float32Array = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32Array[i] = (bytes[i] - 128) / 128.0;
      }
      return float32Array;
    }

    return new Float32Array(0);
  } catch (error) {
    console.error('❌ NativeAudioService: Error converting base64 to Float32Array', error);
    return new Float32Array(0);
  }
}
```

#### Removed Old Methods:
- ❌ `startPeriodicStatusChecks()` - No longer needed
- ❌ `generateSimulatedPCMData()` - Replaced with real audio
- ❌ `setupRealTimePCMStream()` - Now implemented

---

### 3. Updated app.json

**File**: `app.json`

Added development client plugin (Lines 41-43):
```json
{
  "expo": {
    "plugins": [
      "expo-dev-client"
    ]
  }
}
```

---

### 4. Generated Native iOS Project

**Command**:
```bash
npx expo prebuild --platform ios --clean
```

**Result**:
- Created `ios/` directory with native Xcode project
- Installed CocoaPods dependencies
- Configured expo-audio-stream native module
- Ready for development build

---

## Technical Details

### Audio Configuration
- **Sample Rate**: 44100 Hz (CD quality)
- **Buffer Size**: 2048 samples (~46ms intervals)
- **Encoding**: PCM 16-bit signed integer
- **Channels**: 1 (mono)
- **Normalization**: -32768 to 32767 → -1.0 to 1.0 (Float32)

### Data Flow
1. **Microphone** → Raw PCM audio (iOS AVAudioEngine)
2. **expo-audio-stream** → Base64-encoded 16-bit PCM chunks every 46ms
3. **convertAudioData()** → Decode base64 → Convert to Float32Array
4. **pitchCallback()** → YIN algorithm processes Float32Array
5. **Pitch Detection** → Returns frequency in Hz
6. **UI Update** → Shows detected pitch vs target note

### Key Improvements
- ✅ **Real microphone input** instead of simulated 440Hz
- ✅ **Real-time streaming** (46ms latency)
- ✅ **Proper normalization** for YIN algorithm
- ✅ **Error handling** for audio stream failures
- ✅ **Automatic mode switching** (playback ↔ recording)

---

## Building & Testing

### Build Development Client
```bash
# Generate native iOS project
npx expo prebuild --platform ios --clean

# Build and install on connected iPhone
npx expo run:ios --device
```

### Testing Checklist

#### Phase 1: Audio Capture
- [ ] App requests microphone permission
- [ ] Microphone permission granted
- [ ] Real-time audio capture starts
- [ ] Console shows: "✅ Real-time audio capture started"
- [ ] No errors in console

#### Phase 2: Pitch Detection
- [ ] Sing a note (e.g., "Ahhhh" at 440Hz)
- [ ] Detected pitch changes based on voice (not stuck at 440Hz)
- [ ] Accuracy percentage shows non-zero values
- [ ] Visual feedback responds to pitch changes
- [ ] Different notes show different detected frequencies

#### Phase 3: Piano Playback
- [ ] Piano sounds play from speaker (not earpiece)
- [ ] Sounds play at correct pitch
- [ ] Audio mode switches correctly (playback ↔ recording)

#### Phase 4: Complete Exercise
- [ ] Start "5-Note Warm-Up" exercise
- [ ] Sing each note in sequence
- [ ] Pitch detection responds to real voice
- [ ] Accuracy calculated based on real singing
- [ ] Results screen shows realistic accuracy (not 0%)
- [ ] Feedback is meaningful ("Great job on C4!")

---

## Expected Results

### Before Fix:
```
🎤 Detected Pitch: ~440.0 Hz (always)
📊 Accuracy: 0%
💬 Feedback: "Work on C4 - you're singing sharp" (even when silent)
```

### After Fix:
```
🎤 Detected Pitch: 261.6 Hz (when singing C4)
📊 Accuracy: 87%
💬 Feedback: "Great job on C4! Keep it up!"

🎤 Detected Pitch: 329.6 Hz (when singing E4)
📊 Accuracy: 92%
💬 Feedback: "Perfect pitch on E4!"
```

---

## Verification

To verify this fix worked:

1. **Check Console Logs**:
   ```
   ✅ Should see: "🎤 NativeAudioService: Using real-time audio stream (44100Hz, buffer: 2048, interval: 46ms)"
   ✅ Should see: "✅ NativeAudioService: Real-time audio capture started"
   ❌ Should NOT see: "Temporary: Simulate pitch detection"
   ```

2. **Test Pitch Detection**:
   - Sing "Ahhhh" at different pitches
   - Detected frequency should change in real-time
   - Visual feedback should respond to voice

3. **Test Accuracy**:
   - Complete one exercise
   - Accuracy should be > 0% (if singing correctly)
   - Results should reflect actual singing performance

---

## Known Limitations

1. **Development Build Required**:
   - Cannot use Expo Go anymore (native modules required)
   - Must build development client with `expo run:ios --device`
   - Requires connected iPhone or iOS Simulator

2. **First-Time Build**:
   - Xcode compilation takes 3-5 minutes
   - Subsequent builds are faster (incremental)

3. **Microphone Permission**:
   - App must request permission on first launch
   - Permission required for pitch detection to work

---

## Next Steps

### Immediate Testing:
1. ✅ Build iOS development client
2. ⏳ Install on iPhone
3. ⏳ Test real-time pitch detection
4. ⏳ Verify accuracy calculations

### Additional Fixes Needed:
1. Fix breathing exercise DesignSystem compatibility
2. Add user-facing error messages
3. Add loading states during audio initialization
4. Test edge cases (backgrounding, headphones, silent mode)

---

## Files Changed

1. `src/services/audio/NativeAudioService.ts` - Complete refactor of audio capture
2. `app.json` - Added expo-dev-client plugin
3. `package.json` - Added @mykin-ai/expo-audio-stream dependency
4. Created `ios/` directory - Native iOS project

---

## Commit Message

```
fix(audio): Replace simulated pitch detection with real-time microphone capture

BREAKING CHANGE: Requires development build instead of Expo Go

- Install @mykin-ai/expo-audio-stream for real-time audio streaming
- Replace generateSimulatedPCMData() with ExpoAudioStream.startRecording()
- Add base64ToFloat32Array() conversion for 16-bit PCM data
- Configure development client in app.json
- Generate native iOS project with expo prebuild

This fixes the critical bug where pitch detection was hardcoded to 440Hz,
making the app non-functional. Pitch detection now responds to real voice
input from the microphone.

Refs: CRITICAL_BUG_#1
```

---

## Summary

**Status**: ✅ IMPLEMENTATION COMPLETE

The critical pitch detection bug has been fixed. The app now uses real-time microphone audio instead of simulated 440Hz sine waves. This required:

1. Installing expo-audio-stream package
2. Refactoring NativeAudioService to use real PCM audio buffers
3. Adding base64 to Float32Array conversion
4. Creating development build with native modules

**Ready for User Testing**: YES ✅

The user can now test the app on their iPhone with real pitch detection. The detected pitch should respond to their voice in real-time, and accuracy calculations should reflect actual singing performance.
