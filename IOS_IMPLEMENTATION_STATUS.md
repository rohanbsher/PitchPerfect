# iOS Implementation Status

**Date**: 2025-10-02
**Phase**: Week 1 - Platform Abstraction Layer (In Progress)

## ✅ Completed Tasks

### 1. Platform Abstraction Architecture

**IAudioService Interface** (`/src/services/audio/IAudioService.ts`)
- ✅ Created platform-agnostic interface
- ✅ Defined methods: `initialize()`, `requestPermissions()`, `startMicrophoneCapture()`, `stopMicrophoneCapture()`, `playNote()`, `stopNote()`, `dispose()`, `getSampleRate()`
- ✅ Added `PitchDetectionCallback` type for real-time audio data
- ✅ Added `AudioServiceConfig` for configuration options

**WebAudioService** (`/src/services/audio/WebAudioService.ts`)
- ✅ Extracted Web Audio API code from ExerciseTestScreenProfessional
- ✅ Implemented IAudioService interface
- ✅ Uses `navigator.mediaDevices.getUserMedia()` for microphone
- ✅ Uses `AudioContext` + `AnalyserNode` for PCM extraction
- ✅ Uses Tone.js for piano playback
- ✅ Implements `requestAnimationFrame()` loop for real-time pitch detection
- ✅ Platform: Web only (Chrome, Safari, Firefox)

**NativeAudioService** (`/src/services/audio/NativeAudioService.ts`)
- ✅ Created skeleton implementation for iOS/Android
- ✅ Uses Expo AV (`expo-av`) for recording and playback
- ✅ Implements IAudioService interface
- ✅ Configured iOS audio mode: `allowsRecordingIOS: true`, `playsInSilentModeIOS: true`
- ✅ Configured recording options: `LINEARPCM`, `44100 Hz`, mono
- ⚠️ **Limitation**: Currently uses simulated PCM data (periodic status checks)
- 🚧 **TODO**: Implement real-time PCM extraction using expo-audio-stream

**AudioServiceFactory** (`/src/services/audio/AudioServiceFactory.ts`)
- ✅ Created factory with Platform.OS detection
- ✅ Returns WebAudioService for `Platform.OS === 'web'`
- ✅ Returns NativeAudioService for `Platform.OS === 'ios'` or `'android'`
- ✅ Added helper methods: `isWebPlatform()`, `isNativePlatform()`, `getRecommendedConfig()`

### 2. App Configuration

**app.json** (`/app.json`)
- ✅ Added iOS microphone permission: `NSMicrophoneUsageDescription`
- ✅ Added iOS background audio mode: `UIBackgroundModes: ["audio"]`
- ✅ Added iOS bundle identifier: `com.yourcompany.pitchperfect`
- ✅ Added Android microphone permission: `RECORD_AUDIO`
- ✅ Added Android package: `com.yourcompany.pitchperfect`

### 3. Dependencies

**package.json**
- ✅ Installed `expo-audio-stream` (community package for real-time PCM)
- ✅ Existing: `expo-av ~16.0.7` (recording/playback)
- ✅ Existing: `tone ^15.1.22` (Web only - piano playback)

### 4. Cross-Platform Test Screen

**ExerciseTestScreenV2** (`/src/screens/ExerciseTestScreenV2.tsx`)
- ✅ Created new screen using AudioServiceFactory
- ✅ Uses `AudioServiceFactory.create()` to get platform-specific service
- ✅ Calls `initialize()` → `requestPermissions()` → `startMicrophoneCapture()`
- ✅ Wired pitch detection callback to YINPitchDetector
- ✅ Professional UI with DesignSystem
- ✅ Displays: Status, Detected Note, Frequency, Confidence
- ⚠️ **Limitation**: ExerciseEngine integration pending (needs refactor to use IAudioService)

**App.tsx**
- ✅ Updated to use ExerciseTestScreenV2

---

## 🚧 Pending Tasks

### Phase 1: Complete Platform Abstraction (Current Week)

#### 1. Real-Time PCM Extraction on iOS
**Priority**: 🔴 Critical
**File**: `/src/services/audio/NativeAudioService.ts`

**Problem**: Expo AV doesn't provide real-time PCM data out of the box. Current implementation uses simulated data.

**Solution Options**:

**Option A: expo-audio-stream (Recommended)**
- ✅ Already installed
- Community package for real-time audio streaming
- Provides `AudioAnalysis` with PCM buffers
- Estimated effort: 4-6 hours

**Option B: Custom Native Module**
- Write Swift code using AVFoundation
- Create React Native bridge
- More control but higher complexity
- Estimated effort: 2-3 days

**Option C: Periodic Audio Snapshots**
- Use Expo AV to record short clips (100ms)
- Extract PCM from saved files
- Lower accuracy, higher latency
- Estimated effort: 2-4 hours

**Recommendation**: Use **Option A (expo-audio-stream)** for MVP.

**Implementation Steps**:
```typescript
import { AudioAnalysis } from 'expo-audio-stream';

// In NativeAudioService.startMicrophoneCapture():
AudioAnalysis.startAnalysis({
  sampleRate: 44100,
  channels: 1,
  bitsPerSample: 16,
  onDataAvailable: (data) => {
    const pcmBuffer = new Float32Array(data.buffer);
    this.pitchCallback?.(pcmBuffer, 44100);
  },
});
```

#### 2. Piano Sample Assets
**Priority**: 🟡 Medium
**Files**: `/assets/audio/piano/*.mp3`

**Required**: Download or generate piano samples for C3-C6 (37 notes)

**Options**:
1. Download from Tonejs.github.io/audio/salamander/
2. Use Apple's GarageBand to export samples
3. Purchase from freesound.org or sample libraries

**Steps**:
```bash
mkdir -p assets/audio/piano
# Download samples C3.mp3, C#3.mp3, D3.mp3, ..., B5.mp3, C6.mp3
```

**Update NativeAudioService.ts**:
```typescript
private readonly noteSamples: Record<string, any> = {
  'C3': require('../../assets/audio/piano/C3.mp3'),
  'C#3': require('../../assets/audio/piano/C#3.mp3'),
  // ... 37 notes total
};
```

#### 3. Refactor ExerciseEngine
**Priority**: 🔴 Critical
**File**: `/src/engines/ExerciseEngine.ts`

**Problem**: ExerciseEngine currently uses Tone.js directly, which doesn't work on iOS.

**Solution**: Update ExerciseEngine to accept IAudioService in constructor.

**Current**:
```typescript
class ExerciseEngine {
  constructor(exercise: Exercise, piano: Tone.Sampler, callbacks: Callbacks) {
    // ...
  }
}
```

**Target**:
```typescript
class ExerciseEngine {
  constructor(
    exercise: Exercise,
    audioService: IAudioService,
    pitchDetector: YINPitchDetector,
    callbacks: Callbacks
  ) {
    // ...
  }

  async playPianoNote(note: Note) {
    await this.audioService.playNote(note.name, note.duration);
  }
}
```

**Estimated effort**: 2-3 hours

#### 4. Test on Web
**Priority**: 🟢 High
**Command**: `npm run web`

**Steps**:
1. Start web server: `npm run web`
2. Open http://localhost:8081
3. Click "Start Test"
4. Verify microphone permission prompt
5. Verify pitch detection works
6. Check console logs for errors

**Expected**: WebAudioService should work identically to old implementation.

#### 5. Test on iOS Simulator
**Priority**: 🔴 Critical
**Command**: `npx expo run:ios`

**Prerequisites**:
- Xcode installed
- iOS Simulator running
- Real-time PCM extraction implemented

**Steps**:
1. Build for iOS: `npx expo run:ios`
2. Wait for build (5-10 minutes first time)
3. App launches in simulator
4. Click "Start Test"
5. Verify microphone permission dialog
6. Verify pitch detection works
7. Check console for "NativeAudioService" logs

**Expected Issues**:
- Simulator doesn't have real microphone (will fail)
- **Solution**: Test on real device using `npx expo run:ios --device`

#### 6. Optimize Audio Latency
**Priority**: 🟡 Medium
**Target**: <100ms end-to-end latency

**Metrics to measure**:
- Microphone capture latency
- Pitch detection computation time
- UI update latency

**Optimization strategies**:
- Reduce buffer size (2048 → 1024 samples)
- Use lower sample rate (44100 → 22050 Hz)
- Optimize YINPitchDetector (skip autocorrelation for silent input)
- Use React Native's `InteractionManager` for non-blocking updates

---

## 📊 Implementation Progress

| Task | Status | Estimated Time | Actual Time |
|------|--------|----------------|-------------|
| IAudioService interface | ✅ Complete | 1h | 1h |
| WebAudioService | ✅ Complete | 2h | 2h |
| NativeAudioService skeleton | ✅ Complete | 2h | 2h |
| AudioServiceFactory | ✅ Complete | 0.5h | 0.5h |
| app.json configuration | ✅ Complete | 0.5h | 0.5h |
| expo-audio-stream install | ✅ Complete | 0.5h | 0.5h |
| ExerciseTestScreenV2 | ✅ Complete | 2h | 2h |
| Real-time PCM (iOS) | 🚧 Pending | 4-6h | - |
| Piano sample assets | 🚧 Pending | 2h | - |
| ExerciseEngine refactor | 🚧 Pending | 2-3h | - |
| Test on web | 🚧 Pending | 1h | - |
| Test on iOS simulator | 🚧 Pending | 1h | - |
| Optimize latency | 🚧 Pending | 3-4h | - |

**Total Completed**: 8.5 hours
**Total Remaining**: 13-17 hours
**Week 1 Progress**: ~35% complete

---

## 🎯 Next Steps (Priority Order)

1. **Implement real-time PCM extraction using expo-audio-stream** (4-6h)
   - Research expo-audio-stream API
   - Update NativeAudioService.startMicrophoneCapture()
   - Test PCM data flow to YINPitchDetector

2. **Test on web** (1h)
   - Verify WebAudioService works correctly
   - Ensure no regressions from refactor

3. **Refactor ExerciseEngine** (2-3h)
   - Accept IAudioService instead of Tone.js
   - Update playPianoNote() method
   - Wire to ExerciseTestScreenV2

4. **Download piano samples** (2h)
   - Download 37 piano samples (C3-C6)
   - Add to `/assets/audio/piano/`
   - Update NativeAudioService.noteSamples

5. **Test on iOS simulator** (1h)
   - Build for iOS
   - Test microphone capture
   - Verify pitch detection

6. **Optimize latency** (3-4h)
   - Measure current latency
   - Implement optimizations
   - Test on device

---

## 🔧 Technical Decisions

### Why expo-audio-stream?
- ✅ Maintained by community (last update: 2024)
- ✅ Provides real-time PCM data
- ✅ Works with Expo managed workflow
- ✅ No native code required
- ⚠️ Not official Expo package (risk)

### Why not Tone.js on iOS?
- ❌ Tone.js requires Web Audio API
- ❌ Web Audio API not available in React Native
- ❌ No official React Native port

### Why Expo AV for playback?
- ✅ Official Expo package
- ✅ Works on iOS, Android, Web
- ✅ Supports MP3, WAV, etc.
- ⚠️ Requires pre-loaded audio files (no synth)

---

## 📝 Notes

- **YINPitchDetector**: Already iOS-compatible (pure JavaScript, no dependencies)
- **ExerciseEngine**: Business logic is platform-agnostic, only audio layer needs changes
- **DesignSystem**: Already works on iOS (React Native primitives)
- **PitchScaleVisualizer**: Uses React Native Reanimated (iOS-compatible)

---

## 🚨 Risks & Blockers

### Risk 1: expo-audio-stream compatibility
**Severity**: 🔴 High
**Mitigation**: Test early, have fallback to native module

### Risk 2: Piano sample quality
**Severity**: 🟡 Medium
**Mitigation**: Use high-quality samples from reputable source

### Risk 3: iOS Simulator microphone
**Severity**: 🟢 Low
**Mitigation**: Test on real device instead

### Risk 4: Audio latency on iOS
**Severity**: 🟡 Medium
**Mitigation**: Optimize buffer sizes, use CoreAudio if needed

---

## 📚 Resources

- [Expo AV Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [expo-audio-stream GitHub](https://github.com/deeeed/expo-audio-stream)
- [React Native Platform Detection](https://reactnative.dev/docs/platform-specific-code)
- [iOS Audio Session Guide](https://developer.apple.com/documentation/avfoundation/avaudiosession)
- [YIN Pitch Detection Algorithm](https://web.archive.org/web/20130105161427/http://recherche.ircam.fr/equipes/pcm/cheveign/pss/2002_JASA_YIN.pdf)

---

**Last Updated**: 2025-10-02 (Day 1 of Week 1)
