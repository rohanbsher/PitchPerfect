# PITCHPERFECT: iOS NATIVE APP ARCHITECTURE
## Complete Platform Migration Strategy (Web → iOS)

---

## 📊 EXECUTIVE SUMMARY

**Current State**: Web-only React Native app using Web Audio API
**Target State**: iOS native app using Expo AV + Core Audio
**Timeline**: 2-3 weeks for iOS port
**Complexity**: **HIGH** - Requires complete audio system rewrite

---

## 🚨 CRITICAL BLOCKERS (Must Fix for iOS)

### **1. Web Audio API Dependency** ❌ DOES NOT WORK ON IOS
```typescript
// Current (Web only):
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
const microphone = audioContext.createMediaStreamSource(stream);
```

**Problem**: `AudioContext`, `AnalyserNode`, `MediaStream` are **browser-only APIs**
**Impact**: 100% of pitch detection code won't work on iOS
**Solution**: Complete rewrite using Expo AV + native modules

---

### **2. Tone.js** ❌ DOES NOT WORK ON REACT NATIVE
```typescript
// Current:
import * as Tone from 'tone';
const piano = new Tone.Sampler({...}).toDestination();
```

**Problem**: Tone.js relies on Web Audio API (browser-only)
**Impact**: Piano playback won't work on iOS
**Solution**: Use `expo-av` Sound API or native audio files

---

### **3. navigator.mediaDevices** ❌ DOES NOT WORK ON IOS
```typescript
// Current:
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
```

**Problem**: Web API for microphone access
**Impact**: Cannot record user voice on iOS
**Solution**: Use `expo-av` Audio.Recording API

---

## ✅ WHAT ALREADY WORKS (Good News!)

### **1. YINPitchDetector** ✅ PURE JAVASCRIPT - WORKS EVERYWHERE
```typescript
// src/utils/pitchDetection.ts
class YINPitchDetector {
  detectPitch(buffer: Float32Array): PitchDetectionResult
}
```
**Status**: ✅ **READY FOR iOS**
**Reason**: Pure JavaScript algorithm, no browser dependencies

---

### **2. ExerciseEngine** ✅ LOGIC ONLY - WORKS EVERYWHERE
```typescript
// src/engines/ExerciseEngine.ts
class ExerciseEngine {
  async start() { /* hands-free flow */ }
}
```
**Status**: ✅ **READY FOR iOS** (with audio service swap)
**Reason**: Business logic, just needs platform-specific audio

---

### **3. audioService.ts** ✅ ALREADY USES EXPO AV!
```typescript
// src/services/audioService.ts
import { Audio } from 'expo-av';
```
**Status**: ✅ **MOSTLY READY** (needs real PCM data extraction)
**Reason**: Already designed for React Native!

---

### **4. React Native Components** ✅ CROSS-PLATFORM
All UI components (View, Text, TouchableOpacity, ScrollView) work on iOS
**Status**: ✅ **READY FOR iOS**

---

### **5. Design System** ✅ PLATFORM AGNOSTIC
```typescript
// src/design/DesignSystem.ts
```
**Status**: ✅ **READY FOR iOS**
**Reason**: Just colors, typography, spacing - works everywhere

---

## 🏗️ IOS ARCHITECTURE (What We Need to Build)

### **CURRENT ARCHITECTURE (Web)**
```
┌─────────────────────────────────────────┐
│ ExerciseTestScreen (React Component)    │
└─────────┬───────────────────────────────┘
          │
          ├──► Web Audio API (browser)
          │    ├─ AudioContext
          │    ├─ AnalyserNode
          │    └─ MediaStream (mic)
          │
          ├──► Tone.js (browser)
          │    └─ Sampler (piano sounds)
          │
          └──► YINPitchDetector ✅
               └─ detectPitch(Float32Array)
```

### **TARGET ARCHITECTURE (iOS)**
```
┌─────────────────────────────────────────┐
│ ExerciseTestScreen (React Component)    │
└─────────┬───────────────────────────────┘
          │
          ├──► Platform Audio Service (NEW!)
          │    ├─ AudioServiceInterface
          │    ├─ WebAudioService (web)
          │    └─ NativeAudioService (iOS) ←─ NEW
          │         ├─ expo-av Recording
          │         ├─ PCM data extraction
          │         └─ expo-av Sound (piano)
          │
          └──► YINPitchDetector ✅
               └─ detectPitch(Float32Array)
```

---

## 📋 DETAILED IMPLEMENTATION PLAN

### **PHASE 1: Platform Abstraction Layer** (Week 1)

#### **Step 1.1: Create Audio Service Interface**
```typescript
// src/services/audio/IAudioService.ts
export interface IAudioService {
  // Initialization
  initialize(): Promise<void>;
  requestPermissions(): Promise<boolean>;

  // Microphone input
  startMicrophoneCapture(callback: (buffer: Float32Array) => void): Promise<void>;
  stopMicrophoneCapture(): Promise<void>;

  // Piano playback
  playNote(noteName: string, duration: number): Promise<void>;
  stopNote(): void;

  // Cleanup
  dispose(): void;
}
```

#### **Step 1.2: Web Implementation** (Keep existing)
```typescript
// src/services/audio/WebAudioService.ts
export class WebAudioService implements IAudioService {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private piano: Tone.Sampler;

  async initialize() {
    this.audioContext = new AudioContext();
    this.piano = new Tone.Sampler({...});
  }

  async startMicrophoneCapture(callback) {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    // ... existing Web Audio API code
  }

  async playNote(noteName, duration) {
    this.piano.triggerAttackRelease(noteName, duration);
  }
}
```

#### **Step 1.3: iOS Implementation** (NEW!)
```typescript
// src/services/audio/NativeAudioService.ts
import { Audio } from 'expo-av';

export class NativeAudioService implements IAudioService {
  private recording: Audio.Recording | null = null;
  private sounds: Map<string, Audio.Sound> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  async initialize() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  async requestPermissions(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  async startMicrophoneCapture(callback: (buffer: Float32Array) => void) {
    // Configure for real-time processing
    const recordingOptions = {
      ios: {
        extension: '.wav',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };

    const { recording } = await Audio.Recording.createAsync(
      recordingOptions,
      (status) => this.onRecordingUpdate(status, callback)
    );

    this.recording = recording;
  }

  private onRecordingUpdate(
    status: Audio.RecordingStatus,
    callback: (buffer: Float32Array) => void
  ) {
    // CRITICAL: Extract PCM data from recording
    // This is the hardest part - expo-av doesn't expose raw audio data
    // Options:
    // 1. Use native module to access AVAudioRecorder directly
    // 2. Use expo-audio-stream (community package)
    // 3. Record to file, process chunks periodically
  }

  async playNote(noteName: string, duration: number) {
    // Load piano sample for this note
    const noteFile = this.getNoteFile(noteName); // e.g., 'C4.mp3'
    const { sound } = await Audio.Sound.createAsync(noteFile);

    this.sounds.set(noteName, sound);
    await sound.playAsync();

    // Stop after duration
    setTimeout(async () => {
      await sound.stopAsync();
      await sound.unloadAsync();
      this.sounds.delete(noteName);
    }, duration * 1000);
  }

  private getNoteFile(noteName: string) {
    // Map note names to local audio files
    return require(`../../assets/audio/piano/${noteName}.mp3`);
  }
}
```

#### **Step 1.4: Platform Detection & Factory**
```typescript
// src/services/audio/AudioServiceFactory.ts
import { Platform } from 'react-native';
import { IAudioService } from './IAudioService';
import { WebAudioService } from './WebAudioService';
import { NativeAudioService } from './NativeAudioService';

export class AudioServiceFactory {
  static create(): IAudioService {
    if (Platform.OS === 'web') {
      return new WebAudioService();
    } else {
      return new NativeAudioService();
    }
  }
}
```

---

### **PHASE 2: Real-Time Audio Processing** (Week 2)

**THE HARD PROBLEM**: Getting raw PCM audio data on iOS

#### **Option 1: expo-audio-stream** (Community Package) ✅ RECOMMENDED
```bash
npx expo install expo-audio-stream
```

```typescript
import { AudioStream } from 'expo-audio-stream';

const startAudioStream = async () => {
  await AudioStream.startRecording({
    sampleRate: 44100,
    bitDepth: 16,
    channels: 1,
  });

  AudioStream.on('data', (event) => {
    // event.data = raw PCM data (Float32Array)
    const buffer = new Float32Array(event.data);
    callback(buffer); // Send to YINPitchDetector
  });
};
```

**Pros**:
- ✅ Direct access to PCM data
- ✅ Real-time streaming
- ✅ Works with Expo managed workflow

**Cons**:
- ⚠️ Community package (not official Expo)
- ⚠️ Requires custom dev client (not Expo Go)

---

#### **Option 2: Native Module** (Custom Solution)
Build a custom Expo module using Swift:

```swift
// ios/PitchPerfectModule.swift
import AVFoundation
import ExpoModulesCore

public class PitchPerfectModule: Module {
  private var audioEngine: AVAudioEngine?

  public func definition() -> ModuleDefinition {
    Name("PitchPerfect")

    AsyncFunction("startAudioCapture") { (promise: Promise) in
      audioEngine = AVAudioEngine()
      let inputNode = audioEngine!.inputNode
      let bus = 0

      inputNode.installTap(onBus: bus, bufferSize: 2048, format: nil) { buffer, time in
        // Convert AVAudioPCMBuffer to Float32Array
        let floatArray = self.convertBufferToFloatArray(buffer)

        // Send to React Native
        self.sendEvent("audioData", [
          "data": floatArray
        ])
      }

      try! audioEngine!.start()
      promise.resolve(true)
    }
  }
}
```

**Pros**:
- ✅ Full control over audio pipeline
- ✅ Low latency
- ✅ Professional solution

**Cons**:
- ⚠️ Requires Swift/Objective-C knowledge
- ⚠️ Complex setup
- ⚠️ Requires custom dev client

---

#### **Option 3: File-Based Processing** (Simple but Limited)
Record to file, process chunks:

```typescript
// Record in short chunks (e.g., 100ms)
setInterval(async () => {
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();

  // Load file, extract PCM, process
  const pcmData = await extractPCMFromFile(uri);
  callback(pcmData);

  // Start new recording
  recording = await Audio.Recording.createAsync(...);
}, 100);
```

**Pros**:
- ✅ Uses only Expo APIs
- ✅ No native code needed

**Cons**:
- ❌ High latency (~100-200ms)
- ❌ Choppy real-time experience
- ❌ File I/O overhead

---

### **PHASE 3: Piano Audio Files** (Week 2)

Replace Tone.js with local MP3/WAV files.

#### **Step 3.1: Download Piano Samples**
```bash
# Download Salamander Grand Piano samples (same as Tone.js uses)
wget https://tonejs.github.io/audio/salamander/C4.mp3
wget https://tonejs.github.io/audio/salamander/Ds4.mp3
wget https://tonejs.github.io/audio/salamander/Fs4.mp3
wget https://tonejs.github.io/audio/salamander/A4.mp3
# ... all notes C3-C6
```

Store in: `assets/audio/piano/`

#### **Step 3.2: Update app.json**
```json
{
  "expo": {
    "assetBundlePatterns": [
      "assets/**/*"
    ]
  }
}
```

#### **Step 3.3: Use expo-av Sound**
```typescript
const { sound } = await Audio.Sound.createAsync(
  require('./assets/audio/piano/C4.mp3')
);
await sound.playAsync();
```

---

### **PHASE 4: iOS Configuration** (Week 3)

#### **Step 4.1: Update app.json**
```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.pitchperfect.app",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "PitchPerfect needs microphone access to detect your singing pitch and provide real-time feedback during vocal exercises.",
        "UIBackgroundModes": ["audio"],
        "AVAudioSessionCategory": "PlayAndRecord",
        "AVAudioSessionCategoryOptions": [
          "DefaultToSpeaker",
          "AllowBluetooth"
        ]
      }
    }
  }
}
```

#### **Step 4.2: Request Permissions**
```typescript
import { Audio } from 'expo-av';

const requestMicPermission = async () => {
  const { status } = await Audio.requestPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Microphone Permission Required',
      'PitchPerfect needs access to your microphone to detect your pitch.',
      [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
    );
    return false;
  }

  return true;
};
```

#### **Step 4.3: Build Configuration**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS simulator (testing)
eas build --platform ios --profile development

# Build for TestFlight (beta testing)
eas build --platform ios --profile preview

# Build for App Store (production)
eas build --platform ios --profile production
```

---

### **PHASE 5: Testing & Optimization** (Week 3)

#### **Test Checklist**:
- [ ] Microphone permission flow
- [ ] Real-time pitch detection latency (<100ms)
- [ ] Piano playback quality
- [ ] Background audio (continues when app backgrounded)
- [ ] Bluetooth headphone support
- [ ] AirPods compatibility
- [ ] Memory management (no leaks during long sessions)
- [ ] Battery impact (optimize for efficiency)

---

## 📊 DEPENDENCY AUDIT

### **✅ WORKS ON IOS (Keep)**
| Package | Status | Notes |
|---------|--------|-------|
| `expo` | ✅ | Core framework |
| `react-native` | ✅ | Cross-platform |
| `expo-av` | ✅ | **CRITICAL FOR iOS** |
| `@shopify/react-native-skia` | ✅ | Graphics (cross-platform) |
| `react-native-reanimated` | ✅ | Animations |
| `react-native-safe-area-context` | ✅ | Layout |
| `expo-haptics` | ✅ | Vibration feedback |

### **⚠️ REQUIRES REPLACEMENT (iOS)**
| Package | Status | Replacement |
|---------|--------|-------------|
| `tone` | ❌ | `expo-av` Sound API + local MP3s |

### **🆕 NEW DEPENDENCIES (iOS)**
| Package | Purpose | Priority |
|---------|---------|----------|
| `expo-audio-stream` | Real-time PCM data | **P0** (or custom module) |
| `@react-native-async-storage/async-storage` | ✅ Already installed | Store progress |

---

## 🚀 IMPLEMENTATION ROADMAP

### **WEEK 1: Platform Abstraction**
**Goal**: Code compiles and runs on iOS (even if audio doesn't work)

- [x] Day 1: Create `IAudioService` interface
- [ ] Day 2: Extract `WebAudioService` from screens
- [ ] Day 3: Implement `NativeAudioService` skeleton
- [ ] Day 4: Add `AudioServiceFactory` with Platform detection
- [ ] Day 5: Update all screens to use factory
- [ ] Day 6: Build iOS app, verify it launches
- [ ] Day 7: Test on iOS Simulator

**Success Criteria**: App launches on iOS, shows UI (no audio yet)

---

### **WEEK 2: Audio Implementation**
**Goal**: Pitch detection and piano playback working on iOS

- [ ] Day 8: Install `expo-audio-stream` (or start native module)
- [ ] Day 9: Implement real-time PCM capture
- [ ] Day 10: Wire PCM data to YINPitchDetector
- [ ] Day 11: Test pitch detection accuracy on iOS
- [ ] Day 12: Download piano sample files (C3-C6)
- [ ] Day 13: Implement piano playback with expo-av
- [ ] Day 14: End-to-end testing (sing → detect → play note)

**Success Criteria**: Full exercise flow works on iOS

---

### **WEEK 3: Polish & Deploy**
**Goal**: App Store ready

- [ ] Day 15: Add microphone permission UI
- [ ] Day 16: Configure app.json for iOS
- [ ] Day 17: Optimize audio latency (<100ms)
- [ ] Day 18: Test on physical iPhone
- [ ] Day 19: Build for TestFlight
- [ ] Day 20: Beta testing with 10 users
- [ ] Day 21: Fix critical bugs, submit to App Store

**Success Criteria**: App approved by Apple, live on App Store

---

## 🎯 CRITICAL SUCCESS FACTORS

### **1. Real-Time Audio Latency** (<100ms)
**Requirement**: User sings → sees pitch feedback in <100ms
**Challenge**: File I/O, processing overhead
**Solution**: Use `expo-audio-stream` or native module (not file-based)

### **2. Battery Efficiency**
**Requirement**: 30 min practice session uses <10% battery
**Challenge**: Continuous microphone + pitch processing
**Solution**:
- Lower sample rate (22050 Hz instead of 44100)
- Increase buffer size (4096 instead of 2048)
- Throttle updates (30 FPS instead of 60)

### **3. Audio Interruptions**
**Requirement**: Handle phone calls, notifications gracefully
**Challenge**: iOS audio session management
**Solution**: Properly configure `AVAudioSessionCategory` and handle interruptions

### **4. Background Audio**
**Requirement**: Continue exercise when app backgrounded
**Challenge**: iOS suspends apps after 3 minutes
**Solution**: Enable `UIBackgroundModes: ["audio"]` in app.json

---

## 💰 COST ESTIMATE

### **Development Time**
- Week 1 (Abstraction): 40 hours @ $100/hr = **$4,000**
- Week 2 (Audio): 40 hours @ $100/hr = **$4,000**
- Week 3 (Polish): 40 hours @ $100/hr = **$4,000**
- **Total**: **$12,000** (3 weeks full-time)

### **Ongoing Costs**
- Apple Developer Account: **$99/year**
- EAS Build (Expo): **$29/month** (or free with custom build)
- TestFlight Beta Testing: **Free**

---

## 🚨 RISKS & MITIGATION

### **Risk 1: Real-Time Audio Too Slow**
**Probability**: Medium
**Impact**: High (unusable app)
**Mitigation**:
- Benchmark early (Week 2, Day 10)
- If >100ms latency, switch to native module immediately

### **Risk 2: expo-audio-stream Not Maintained**
**Probability**: Low
**Impact**: Medium
**Mitigation**:
- Check GitHub activity before committing
- Have native module as fallback plan

### **Risk 3: App Store Rejection**
**Probability**: Low
**Impact**: High (delays launch)
**Mitigation**:
- Follow Apple Human Interface Guidelines
- Clear microphone permission explanation
- Test on TestFlight first

---

## 📱 FINAL ARCHITECTURE DIAGRAM

```
┌──────────────────────────────────────────────────────────┐
│                    PITCHPERFECT iOS                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  UI Layer (React Native)                           │ │
│  │  - ExerciseTestScreenProfessional                  │ │
│  │  - PitchScaleVisualizer                            │ │
│  │  - DesignSystem (Apple-inspired)                   │ │
│  └─────────────────┬────────────────────────────────────┘ │
│                    │                                      │
│  ┌─────────────────▼────────────────────────────────────┐ │
│  │  Business Logic Layer                                │ │
│  │  - ExerciseEngine ✅                                 │ │
│  │  - YINPitchDetector ✅                               │ │
│  │  - Progress Tracking                                 │ │
│  └─────────────────┬────────────────────────────────────┘ │
│                    │                                      │
│  ┌─────────────────▼────────────────────────────────────┐ │
│  │  Platform Abstraction (NEW!)                         │ │
│  │  - IAudioService interface                           │ │
│  │  - AudioServiceFactory                               │ │
│  └─────────┬────────────────────┬─────────────────────────┘ │
│            │                    │                        │
│  ┌─────────▼──────────┐  ┌─────▼──────────────────────┐ │
│  │  WebAudioService   │  │  NativeAudioService (iOS) │ │
│  │  (Browser)         │  │  - expo-av Recording      │ │
│  │  - Web Audio API   │  │  - expo-audio-stream      │ │
│  │  - Tone.js         │  │  - expo-av Sound          │ │
│  └────────────────────┘  └───────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎓 KEY TAKEAWAYS

1. **80% of code is reusable** - UI, business logic, pitch detection all work on iOS
2. **Audio layer is 100% rewrite** - Web Audio API → Expo AV + native modules
3. **expo-audio-stream is critical** - Without it, real-time is nearly impossible
4. **3 weeks is realistic** - Assuming no major blockers
5. **TestFlight first** - Don't go straight to App Store, test with beta users

---

## 📞 NEXT STEPS

1. **Decide on audio approach**: expo-audio-stream vs custom native module
2. **Set up iOS development environment**: Xcode, Apple Developer account
3. **Start Week 1 implementation**: Platform abstraction layer
4. **Benchmark early**: Test latency on Day 10, pivot if needed
5. **Beta test heavily**: Get 20+ users on TestFlight before App Store

---

**This plan transforms PitchPerfect from a web-only prototype into a professional iOS app that can compete with Yousician and Vanido in the App Store.**

Ready to build? 🚀
