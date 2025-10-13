# PitchPerfect iOS Implementation Plan - Comprehensive Guide

**Document Version:** 1.0
**Date:** October 3, 2025
**Current Status:** Web-only (React Native with Expo SDK 54)
**Target:** Full iOS support with <100ms latency

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [iOS Audio Technology Decision Matrix](#ios-audio-technology-decision-matrix)
4. [Recommended Implementation Strategy](#recommended-implementation-strategy)
5. [Piano Sample Library Implementation](#piano-sample-library-implementation)
6. [Exercise Library Design](#exercise-library-design)
7. [Performance Requirements & Optimization](#performance-requirements--optimization)
8. [App Store Requirements Checklist](#app-store-requirements-checklist)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Timeline](#implementation-timeline)
11. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
12. [Code Examples](#code-examples)

---

## Executive Summary

### Key Findings

**CRITICAL DECISION: Stay in Expo Managed Workflow**

Based on comprehensive research, you can achieve full iOS functionality **WITHOUT ejecting from Expo** by using `@siteed/expo-audio-studio` for real-time audio streaming combined with your existing YIN pitch detection algorithm.

### Technology Stack Recommendation

| Component | Technology | Why |
|-----------|-----------|-----|
| **Audio Recording** | `@siteed/expo-audio-studio` | ✅ Expo managed workflow compatible<br>✅ Real-time PCM streaming on iOS<br>✅ 16kHz/44.1kHz sample rates<br>✅ Active development (v2.18.1, updated 2 months ago) |
| **Pitch Detection** | Your existing YIN algorithm | ✅ Pure JavaScript (already implemented)<br>✅ Proven accuracy<br>✅ Zero dependencies<br>✅ Works on all platforms |
| **Piano Playback** | `expo-av` (current) or `expo-audio` (new) | ✅ Built into Expo<br>✅ Plays MP3/WAV samples<br>✅ Acceptable latency for reference notes (50-100ms) |
| **Piano Samples** | Freesound.org C3-C6 Pack | ✅ Free Creative Commons license<br>✅ Exact range needed (37 notes)<br>✅ MP3 format |

### Timeline Estimate

- **Phase 1: Core Audio (2 weeks)** - Real-time recording + YIN integration
- **Phase 2: Piano Samples (1 week)** - Download, convert, optimize
- **Phase 3: iOS Testing (1-2 weeks)** - Real device testing, latency optimization
- **Phase 4: Exercise Library (1 week)** - 15-20 exercises
- **Phase 5: TestFlight Beta (1 week)** - Beta testing with users
- **Total: 6-7 weeks to iOS launch**

### Investment Required

- **Developer Account:** $99/year (Apple Developer Program)
- **Testing Device:** iPhone (any model with iOS 15+)
- **Piano Samples:** Free (Creative Commons)
- **Total Cost:** ~$100 + 1 iPhone

---

## Current Architecture Analysis

### What You Have Built (Web Version)

```typescript
// Your current architecture (EXCELLENT foundation!)
┌─────────────────────────────────────────────────┐
│         ExerciseEngineV2 (Core Logic)           │
│  - Exercise progression                         │
│  - Timing control                               │
│  - Results calculation                          │
└─────────────────────┬───────────────────────────┘
                      │
                      ↓
          ┌───────────────────────┐
          │   IAudioService       │ ← Platform abstraction layer
          └───────────────────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
┌─────────────────┐     ┌─────────────────┐
│ WebAudioService │     │NativeAudioService│ ← Placeholder
│ (Working ✅)     │     │ (TODO ❌)        │
└─────────────────┘     └─────────────────┘
          │
          ↓
┌─────────────────┐
│  YIN Detector   │ ← Pure JS (works everywhere!)
│  (Working ✅)    │
└─────────────────┘
```

### Strengths of Your Current Implementation

1. **IAudioService Abstraction**: You already have the perfect interface designed
2. **YIN Algorithm**: Pure JavaScript implementation (no native dependencies!)
3. **ExerciseEngineV2**: Platform-agnostic exercise logic
4. **Clean Separation**: Web vs Native code paths already planned

### What Needs Implementation

1. **NativeAudioService** - Replace placeholder with real implementation
2. **Piano Sample Loading** - Asset bundling for 37 notes
3. **Real Device Testing** - iOS simulator has no microphone
4. **App Store Compliance** - Privacy manifest, permissions

---

## iOS Audio Technology Decision Matrix

### Option 1: @siteed/expo-audio-studio (RECOMMENDED ⭐)

**Pros:**
- ✅ **Expo Managed Workflow**: No ejecting required
- ✅ **Real-time PCM Streaming**: Exactly what you need for YIN
- ✅ **Cross-Platform**: iOS, Android, Web
- ✅ **Active Development**: v2.18.1 (updated Nov 2024)
- ✅ **Audio Features**: Built-in pitch detection (can complement YIN)
- ✅ **Sample Rate Flexibility**: 16kHz, 44.1kHz configurable

**Cons:**
- ⚠️ Relatively new library (community support growing)
- ⚠️ Documentation still developing
- ⚠️ Additional dependency (~500KB)

**Latency Estimate:** 50-100ms (acceptable for vocal training)

**Installation:**
```bash
npx expo install @siteed/expo-audio-studio
```

**Code Compatibility with Your Architecture:**
```typescript
// Fits perfectly into your NativeAudioService!
import { AudioRecorder } from '@siteed/expo-audio-studio';

export class NativeAudioService implements IAudioService {
  private recorder: AudioRecorder;

  async startMicrophoneCapture(callback: PitchDetectionCallback) {
    await this.recorder.start({
      sampleRate: 44100,
      channels: 1,
      onAudioStream: (audioData) => {
        // audioData.buffer is Float32Array - perfect for YIN!
        callback(audioData.buffer, 44100);
      }
    });
  }
}
```

---

### Option 2: expo-av (Current) + Custom PCM Extraction

**Pros:**
- ✅ Already installed in your project
- ✅ Official Expo package
- ✅ Good documentation

**Cons:**
- ❌ **No real-time PCM streaming** (major blocker!)
- ❌ Recording.getStatusAsync() doesn't provide audio data
- ❌ Would need periodic snapshots (100ms+) instead of continuous stream
- ❌ Lower accuracy for pitch detection

**Verdict:** Not suitable for real-time pitch detection

---

### Option 3: react-native-pitchy

**Pros:**
- ✅ Dedicated pitch detection library
- ✅ Uses ACF2+ algorithm
- ✅ iOS support confirmed

**Cons:**
- ❌ **Requires native modules** (CocoaPods)
- ❌ **Requires ejecting from Expo** or using bare workflow
- ❌ Replaces your YIN algorithm (you'd lose your implementation)
- ❌ Less control over audio pipeline

**Verdict:** Not recommended (requires ejecting + you already have YIN)

---

### Option 4: react-native-pitch-detector

**Pros:**
- ✅ iOS support (uses Beethoven library)
- ✅ Real-time pitch detection

**Cons:**
- ❌ **Requires native modules** (Swift for iOS, Java for Android)
- ❌ **Requires ejecting from Expo**
- ❌ Replaces your YIN algorithm
- ❌ Less active development

**Verdict:** Not recommended (same issues as react-native-pitchy)

---

### Decision: Option 1 (@siteed/expo-audio-studio)

**Why this is the best choice:**

1. **Preserves Your Work**: Uses your existing YIN algorithm
2. **Stay in Managed Workflow**: No ejecting from Expo
3. **Real-time PCM**: Exactly what YIN needs
4. **Future-Proof**: Active development, growing community
5. **Minimal Risk**: Easy to install, easy to test

---

## Recommended Implementation Strategy

### Phase 1: Core Audio Implementation (Week 1-2)

#### Step 1: Install @siteed/expo-audio-studio

```bash
# Install the audio studio package
npx expo install @siteed/expo-audio-studio

# Update app.json for audio permissions
```

#### Step 2: Update NativeAudioService

Replace the placeholder implementation in `/src/services/audio/NativeAudioService.ts`:

**Key Changes:**
1. Import AudioRecorder from @siteed/expo-audio-studio
2. Replace simulated PCM data with real audio stream
3. Configure sample rate (44100 Hz recommended for YIN)
4. Handle audio buffer format conversion if needed

See [Code Examples](#code-examples) section for full implementation.

#### Step 3: Configure app.json

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "PitchPerfect needs microphone access to analyze your singing voice and provide real-time pitch feedback during vocal training exercises."
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ]
  }
}
```

#### Step 4: Test on Real iOS Device

**CRITICAL:** iOS Simulator does NOT have microphone support.

```bash
# Build development client
npx expo run:ios --device

# Or use Expo Go (if library supports it)
npx expo start --ios
```

### Phase 2: Piano Sample Implementation (Week 3)

#### Step 1: Download Piano Samples

**Source:** Freesound.org - Piano Keys C3-C6 Pack
- **URL:** https://freesound.org/people/Tesabob2001/packs/12995/
- **Format:** MP3
- **License:** Creative Commons
- **Notes Needed:** 37 (C3 through C6, chromatic)

**Download Process:**
1. Create Freesound account (free)
2. Download individual samples or entire pack
3. Verify all 37 notes are present

#### Step 2: Optimize Audio Files

```bash
# Convert to optimal format for iOS
# Option A: Keep as MP3 (smaller size, ~50KB each)
# Option B: Convert to WAV (lower latency, ~500KB each)

# Using ffmpeg for optimization:
for file in *.mp3; do
  ffmpeg -i "$file" -ar 44100 -ac 1 -b:a 128k "optimized/$file"
done

# Total size estimate:
# MP3: 37 notes × 50KB = ~2MB
# WAV: 37 notes × 500KB = ~18MB
# Recommendation: Use MP3 (acceptable latency for reference notes)
```

#### Step 3: Add to Assets

```bash
# Create asset directory
mkdir -p assets/audio/piano

# Move optimized samples
mv optimized/*.mp3 assets/audio/piano/

# Naming convention: C3.mp3, C#3.mp3, D3.mp3, ..., C6.mp3
```

#### Step 4: Update NativeAudioService Piano Playback

```typescript
// Update noteSamples mapping in NativeAudioService
private readonly noteSamples: Record<string, any> = {
  'C3': require('../../assets/audio/piano/C3.mp3'),
  'C#3': require('../../assets/audio/piano/C-sharp-3.mp3'),
  'D3': require('../../assets/audio/piano/D3.mp3'),
  // ... all 37 notes
  'C6': require('../../assets/audio/piano/C6.mp3'),
};
```

**Implementation Strategy for playNote():**
1. Preload all samples on initialization (faster playback)
2. Use Audio.Sound.createAsync() from expo-av
3. Cache Sound objects to avoid reloading
4. Use replayAsync() for instant playback

### Phase 3: iOS-Specific Testing (Week 4-5)

#### Real Device Testing Requirements

**Minimum Requirements:**
- iPhone 8 or newer (iOS 15+)
- Lightning cable for debugging
- macOS with Xcode 16+ (for building)
- Apple Developer Account ($99/year)

**Testing Checklist:**
- [ ] Microphone permission prompt appears
- [ ] Real-time pitch detection works (<100ms latency)
- [ ] Piano samples play with acceptable latency
- [ ] Exercise progression works end-to-end
- [ ] Results screen shows accurate data
- [ ] No crashes or memory leaks
- [ ] Battery usage is reasonable

#### Latency Optimization

**Target: <100ms end-to-end latency**

**Latency Breakdown:**
- Microphone capture: 10-20ms
- PCM buffer delivery: 10-30ms
- YIN pitch detection: 20-40ms (depends on buffer size)
- UI update: 5-10ms
- **Total: 45-100ms** ✅

**Optimization Techniques:**

1. **Buffer Size Tuning:**
```typescript
// Smaller buffer = lower latency, but less accuracy
const BUFFER_SIZES = {
  LOW_LATENCY: 1024,   // ~23ms at 44.1kHz (use for feedback)
  BALANCED: 2048,      // ~46ms (recommended)
  HIGH_ACCURACY: 4096, // ~93ms (use for analysis)
};

// Start with BALANCED, adjust based on testing
this.pitchDetector = new YINPitchDetector(44100, 2048);
```

2. **Sample Rate Selection:**
```typescript
// 44100 Hz is the sweet spot for iOS
// Higher sample rates (48000) = more processing overhead
// Lower sample rates (16000) = insufficient for music (vocal range up to ~1000Hz)
const RECOMMENDED_SAMPLE_RATE = 44100;
```

3. **Audio Session Configuration:**
```typescript
// Low-latency audio session (in NativeAudioService.initialize())
await AudioRecorder.configure({
  sampleRate: 44100,
  channels: 1,
  audioMode: 'playAndRecord', // Simultaneous playback + recording
  enableProcessing: false, // Disable extra iOS audio processing
});
```

### Phase 4: Exercise Library Expansion (Week 6)

#### Minimum Viable Exercise Library (15-20 exercises)

Based on vocal pedagogy research, here's a structured progression:

**Beginner Level (5 exercises):**
1. **3-Note Warmup** (C4-D4-E4-D4-C4)
   - Duration: 10 seconds
   - Tempo: 60 BPM
   - Purpose: Gentle introduction, build confidence

2. **5-Note Scale** (already implemented ✅)
   - C4-D4-E4-F4-G4-F4-E4-D4-C4
   - Duration: 15 seconds
   - Tempo: 60 BPM

3. **Octave Jump** (C4-C5-C4)
   - Duration: 8 seconds
   - Tempo: 50 BPM
   - Purpose: Range development

4. **Major Third Interval** (C4-E4-C4)
   - Duration: 10 seconds
   - Tempo: 60 BPM
   - Purpose: Interval training

5. **Descending 5-Note Scale** (G4-F4-E4-D4-C4)
   - Duration: 12 seconds
   - Tempo: 60 BPM

**Intermediate Level (5 exercises):**
6. **C Major Scale Full** (already implemented ✅)
   - C4-D4-E4-F4-G4-A4-B4-C5 (ascending)
   - Duration: 20 seconds

7. **Major Arpeggio** (C4-E4-G4-C5-G4-E4-C4)
   - Duration: 15 seconds
   - Purpose: Chord tone accuracy

8. **Perfect 5th Intervals** (C4-G4-C4-G4-C4)
   - Duration: 12 seconds
   - Tempo: 70 BPM

9. **Stepwise Chromatic** (C4-C#4-D4-D#4-E4-D#4-D4-C#4-C4)
   - Duration: 18 seconds
   - Purpose: Precise pitch control

10. **Siren Exercise** (C4 up to C5 and back, sustained)
    - Duration: 20 seconds
    - Purpose: Smooth transitions

**Advanced Level (5 exercises):**
11. **Two-Octave Scale** (C4-C6 ascending)
    - Duration: 30 seconds
    - Tempo: 80 BPM
    - Purpose: Full range development

12. **Diminished Arpeggio** (C4-Eb4-Gb4-A4)
    - Duration: 15 seconds
    - Purpose: Complex intervals

13. **Melodic Pattern** (C4-D4-C4-E4-D4-E4-F4-G4)
    - Duration: 18 seconds
    - Purpose: Musical phrasing

14. **Octave Leaps** (C4-C5-D4-D5-E4-E5)
    - Duration: 20 seconds
    - Purpose: Register transitions

15. **Staccato Exercise** (C4-D4-E4-F4-G4, short notes)
    - Duration: 15 seconds
    - Tempo: 100 BPM

**Bonus: Specialty Exercises (Optional):**
16. **Vocal Fry Exercise** (C3-E3-G3, very low)
17. **Falsetto Training** (C5-E5-G5, very high)
18. **Vibrato Practice** (Sustained A4 with vibrato)
19. **Portamento Slides** (C4 to G4, smooth glide)
20. **Rhythm Patterns** (C4 quarter, eighth, sixteenth notes)

#### Exercise Data Structure

```typescript
// Create new file: src/data/exercises/intervals.ts
export const intervalExercises: Exercise[] = [
  {
    id: 'major-third-interval',
    name: 'Major Third Interval',
    category: 'interval',
    difficulty: 'beginner',
    duration: 10,
    description: 'Practice jumping between C and E (major third)',
    instructions: [
      'Focus on hitting the E cleanly',
      'Listen for the major chord sound',
      'Keep your tone consistent',
    ],
    notes: [
      { note: 'C4', frequency: 261.63 },
      { note: 'E4', frequency: 329.63 },
      { note: 'C4', frequency: 261.63 },
    ],
    defaultTempo: 60,
    defaultStartingNote: 'C4',
    allowTempoChange: true,
    allowKeyChange: true,
  },
  // ... more interval exercises
];

// Create: src/data/exercises/arpeggios.ts
// Create: src/data/exercises/warmups.ts
// Create: src/data/exercises/advanced.ts

// Update: src/data/exercises/index.ts
export * from './scales';
export * from './intervals';
export * from './arpeggios';
export * from './warmups';
export * from './advanced';

export const allExercises = [
  ...scaleExercises,
  ...intervalExercises,
  ...arpeggioExercises,
  ...warmupExercises,
  ...advancedExercises,
];
```

### Phase 5: TestFlight Beta Distribution (Week 7)

#### Step 1: Prepare for TestFlight

**Required:**
1. Apple Developer Account ($99/year)
2. App Store Connect access
3. Privacy manifest file
4. Screenshots for App Store listing (optional for beta)

#### Step 2: Create Privacy Manifest

Create `ios/PrivacyInfo.xcprivacy` (if using bare workflow) or configure via app.json:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <!-- Required for @siteed/expo-audio-studio -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>C617.1</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <!-- Audio data is processed locally, not collected -->
    </array>
    <key>NSPrivacyTracking</key>
    <false/>
</dict>
</plist>
```

#### Step 3: Build with EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS Build
eas build:configure

# Create iOS build for TestFlight
eas build --platform ios --profile production
```

#### Step 4: Submit to TestFlight

```bash
# EAS can auto-submit to TestFlight
eas submit --platform ios
```

#### Step 5: Invite Beta Testers

**Internal Testing (up to 100 testers):**
- Instant access
- No App Review required
- Great for initial testing

**External Testing (up to 10,000 testers):**
- Requires App Review (1-2 days)
- Public or invite-only
- Use for wider beta testing

**Beta Testing Checklist:**
- [ ] 5-10 internal testers (friends, family)
- [ ] Test on various iPhone models (8, X, 12, 14, 15)
- [ ] Test on iOS 15, 16, 17, 18
- [ ] Collect feedback on:
  - Pitch detection accuracy
  - Piano note clarity
  - Exercise difficulty progression
  - UI/UX intuitiveness
  - Battery usage
  - Bugs/crashes

---

## Piano Sample Library Implementation

### Complete Note Mapping (C3-C6, 37 notes)

```typescript
// Comprehensive note-to-file mapping
const NOTE_FREQUENCIES = {
  // Octave 3 (12 notes)
  'C3': 130.81,  'C#3': 138.59, 'D3': 146.83,  'D#3': 155.56,
  'E3': 164.81,  'F3': 174.61,  'F#3': 185.00, 'G3': 196.00,
  'G#3': 207.65, 'A3': 220.00,  'A#3': 233.08, 'B3': 246.94,

  // Octave 4 (12 notes)
  'C4': 261.63,  'C#4': 277.18, 'D4': 293.66,  'D#4': 311.13,
  'E4': 329.63,  'F4': 349.23,  'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00,  'A#4': 466.16, 'B4': 493.88,

  // Octave 5 (12 notes)
  'C5': 523.25,  'C#5': 554.37, 'D5': 587.33,  'D#5': 622.25,
  'E5': 659.25,  'F5': 698.46,  'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00,  'A#5': 932.33, 'B5': 987.77,

  // Octave 6 (1 note)
  'C6': 1046.50,
};

// Asset loading strategy
export class PianoSampleLoader {
  private samples: Map<string, Audio.Sound> = new Map();

  async preloadAllSamples(): Promise<void> {
    const notes = Object.keys(NOTE_FREQUENCIES);

    console.log(`Preloading ${notes.length} piano samples...`);

    for (const note of notes) {
      try {
        const filename = this.noteToFilename(note);
        const { sound } = await Audio.Sound.createAsync(
          require(`../../assets/audio/piano/${filename}`)
        );
        this.samples.set(note, sound);
      } catch (error) {
        console.warn(`Failed to load ${note}:`, error);
      }
    }

    console.log(`✅ Loaded ${this.samples.size}/${notes.length} samples`);
  }

  private noteToFilename(note: string): string {
    // Convert "C#4" to "C-sharp-4.mp3"
    return note.replace('#', '-sharp-') + '.mp3';
  }

  async playNote(note: string, duration: number): Promise<void> {
    const sound = this.samples.get(note);
    if (!sound) {
      console.warn(`No sample for ${note}`);
      return;
    }

    await sound.replayAsync();

    setTimeout(async () => {
      await sound.stopAsync();
    }, duration * 1000);
  }
}
```

### Alternative: Tone.js Replacement for iOS

If expo-av latency is too high, consider generating piano tones synthetically:

```typescript
// Synthetic piano using Web Audio API polyfill
export class SyntheticPianoService {
  playNote(frequency: number, duration: number) {
    // Use additive synthesis to create piano-like timbre
    // Harmonics: fundamental + overtones at 2x, 3x, 4x, 5x, 6x frequencies
    // Envelope: fast attack (10ms), slow decay (1s), sustain, release (500ms)

    // This is more complex but removes sample loading overhead
    // Total size: ~10KB of code vs 2MB of samples
  }
}
```

**Trade-offs:**
- Synthetic: Smaller app size, faster loading, sounds "digital"
- Samples: Larger app size, realistic piano sound, better for music

**Recommendation:** Start with samples (realistic), optimize later if needed.

---

## Exercise Library Design

### Exercise Progression Algorithm

```typescript
// Intelligent exercise recommendation
export class ExerciseProgressionEngine {
  recommendNextExercise(userLevel: 'beginner' | 'intermediate' | 'advanced'): Exercise {
    // Filter exercises by user level
    const suitable = allExercises.filter(ex => ex.difficulty === userLevel);

    // Sort by category: warmups first, then scales, intervals, arpeggios
    const ordered = this.sortByCategory(suitable);

    return ordered[0];
  }

  shouldPromoteToNextLevel(history: ExerciseResults[]): boolean {
    // Promotion criteria:
    // - Completed 5+ exercises at current level
    // - Average accuracy >= 85%
    // - No recent exercises with accuracy < 70%

    const recent = history.slice(-5);
    const avgAccuracy = recent.reduce((sum, r) => sum + r.overallAccuracy, 0) / recent.length;

    return recent.length >= 5 && avgAccuracy >= 85;
  }
}
```

### Category-Based Organization

```typescript
// Exercise categories with pedagogical purpose
export const EXERCISE_CATEGORIES = {
  'warm-up': {
    name: 'Warm-Ups',
    description: 'Gentle exercises to prepare your voice',
    color: '#4CAF50',
    icon: '🌅',
    exercises: warmupExercises,
  },
  'scale': {
    name: 'Scales',
    description: 'Practice ascending and descending pitch patterns',
    color: '#2196F3',
    icon: '🎵',
    exercises: scaleExercises,
  },
  'interval': {
    name: 'Intervals',
    description: 'Jump accurately between different pitches',
    color: '#FF9800',
    icon: '🎯',
    exercises: intervalExercises,
  },
  'arpeggio': {
    name: 'Arpeggios',
    description: 'Master chord tones and harmony',
    color: '#9C27B0',
    icon: '🎼',
    exercises: arpeggioExercises,
  },
};
```

---

## Performance Requirements & Optimization

### Target Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Audio Latency** | <100ms | Mic to pitch display |
| **Piano Latency** | <50ms | Button press to sound |
| **Pitch Accuracy** | ±10 cents | 85% of readings |
| **Frame Rate** | 60 FPS | Pitch visualization |
| **Battery Usage** | <5%/hour | Background audio off |
| **Memory Usage** | <150MB | With all samples loaded |
| **App Size** | <30MB | Download size |

### iOS-Specific Optimizations

#### 1. Audio Session Management

```typescript
// Configure low-latency audio session
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  staysActiveInBackground: false, // Save battery
  shouldDuckAndroid: false,
  playThroughEarpieceAndroid: false,
  interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
});
```

#### 2. Buffer Size Optimization

```typescript
// Dynamically adjust based on device capability
const getOptimalBufferSize = () => {
  const device = Device.modelName;

  // Newer devices can handle smaller buffers
  if (device.includes('iPhone 13') || device.includes('iPhone 14') || device.includes('iPhone 15')) {
    return 1024; // ~23ms latency
  } else if (device.includes('iPhone 11') || device.includes('iPhone 12')) {
    return 2048; // ~46ms latency
  } else {
    return 4096; // ~93ms latency (older devices)
  }
};
```

#### 3. Memory Management

```typescript
// Lazy-load piano samples (on-demand instead of preload)
export class LazyPianoLoader {
  private cache = new Map<string, Audio.Sound>();

  async playNote(note: string) {
    if (!this.cache.has(note)) {
      // Load only when needed
      const { sound } = await Audio.Sound.createAsync(
        this.getSamplePath(note)
      );
      this.cache.set(note, sound);

      // Limit cache size (keep only last 12 notes)
      if (this.cache.size > 12) {
        const oldest = this.cache.keys().next().value;
        const sound = this.cache.get(oldest);
        await sound?.unloadAsync();
        this.cache.delete(oldest);
      }
    }

    await this.cache.get(note)!.replayAsync();
  }
}
```

#### 4. YIN Algorithm Optimization

```typescript
// Use Web Workers for pitch detection (offload main thread)
// Note: React Native doesn't have Web Workers, use alternative:

// Option A: Reduce YIN computation frequency
let lastPitchDetection = 0;
const MIN_DETECTION_INTERVAL = 50; // ms

if (Date.now() - lastPitchDetection > MIN_DETECTION_INTERVAL) {
  const pitch = detector.detectPitch(buffer);
  lastPitchDetection = Date.now();
  updateUI(pitch);
}

// Option B: Use smaller buffer for faster computation
// Trade-off: Lower accuracy for lower latency
const FAST_BUFFER_SIZE = 1024; // instead of 2048
```

---

## App Store Requirements Checklist

### Pre-Submission Requirements

#### 1. Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Complete identity verification
- [ ] Accept latest agreements in App Store Connect

#### 2. App Metadata
- [ ] App name: "PitchPerfect - Vocal Trainer"
- [ ] Subtitle: "Real-time Singing Practice"
- [ ] Primary category: Music
- [ ] Secondary category: Education
- [ ] Age rating: 4+
- [ ] Privacy policy URL (create simple page)

#### 3. Privacy Manifest (CRITICAL for May 2024+)

```json
// app.json additions
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "PitchPerfect needs microphone access to analyze your singing voice in real-time and provide accurate pitch feedback during vocal training exercises. Your audio is processed locally and never recorded or shared.",
        "ITSAppUsesNonExemptEncryption": false
      },
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
          }
        ],
        "NSPrivacyTracking": false,
        "NSPrivacyTrackingDomains": [],
        "NSPrivacyCollectedDataTypes": []
      }
    }
  }
}
```

#### 4. Build Requirements

- [ ] Built with Xcode 16+ (iOS 18 SDK requirement starting April 2025)
- [ ] Minimum deployment target: iOS 15.1 (recommended)
- [ ] Supports iPhone and iPad (Universal app)
- [ ] No compiler warnings
- [ ] No missing assets or resources

#### 5. Testing Requirements

- [ ] Test on real devices (not just simulator)
- [ ] Test on iOS 15, 16, 17, 18
- [ ] Test on various screen sizes (iPhone SE, 14 Pro Max, iPad)
- [ ] No crashes during 10-minute session
- [ ] Handle microphone permission denial gracefully
- [ ] Handle background audio interruptions (phone calls, Siri)

#### 6. App Store Assets

**Screenshots Required (per device type):**
- [ ] iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796 px (3 required)
- [ ] iPhone 6.5" (iPhone 11 Pro Max): 1242 x 2688 px
- [ ] iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 px
- [ ] iPad Pro 12.9" (6th gen): 2048 x 2732 px

**App Icon:**
- [ ] 1024 x 1024 px PNG (no transparency, no alpha channel)

**Optional but Recommended:**
- [ ] App preview video (15-30 seconds)
- [ ] Promotional text (170 characters)

### Submission Process

```bash
# Step 1: Build release version
eas build --platform ios --profile production

# Step 2: Submit to App Store Connect
eas submit --platform ios

# Step 3: In App Store Connect
# - Add screenshots
# - Write app description
# - Set pricing (free)
# - Submit for review

# Typical review time: 1-3 days
```

---

## Testing Strategy

### Phase 1: Unit Testing (Automated)

```typescript
// Test YIN pitch detection accuracy
describe('YINPitchDetector', () => {
  it('should detect A4 (440 Hz) within ±5 cents', () => {
    const detector = new YINPitchDetector(44100, 2048);
    const testSignal = generateSineWave(440, 44100, 2048);

    const result = detector.detectPitch(testSignal);

    expect(result.frequency).toBeCloseTo(440, 1);
    expect(Math.abs(result.cents)).toBeLessThan(5);
  });
});

// Test exercise progression
describe('ExerciseEngineV2', () => {
  it('should advance to next note after duration', async () => {
    const mockAudioService = createMockAudioService();
    const engine = new ExerciseEngineV2(
      fiveNoteWarmup,
      { tempo: 120, startingNote: 'C4', repeatCount: 1, tolerance: 70 },
      mockAudioService,
      new YINPitchDetector()
    );

    let currentNote = 0;
    engine.setOnNoteChange((index) => { currentNote = index; });

    await engine.start();

    // After exercise completes, should have progressed through all notes
    expect(currentNote).toBe(4); // 5th note (0-indexed)
  });
});
```

### Phase 2: Integration Testing (Manual)

**Test Device Setup:**
- iPhone 12 or newer (iOS 16+)
- AirPods or wired headphones (prevent audio feedback)
- Guitar tuner app (for frequency verification)

**Test Scenarios:**

1. **Microphone Capture Test**
   - [ ] Start app, grant microphone permission
   - [ ] Sing steady "Ahhh" at A4 (440 Hz)
   - [ ] Verify pitch display shows 440 Hz ± 5 Hz
   - [ ] Check latency feels <100ms

2. **Piano Playback Test**
   - [ ] Tap C4 note
   - [ ] Sound plays within 50ms
   - [ ] Sound is clear, no distortion
   - [ ] Test all 37 notes (C3-C6)

3. **Exercise Flow Test**
   - [ ] Start "5-Note Warmup"
   - [ ] Piano plays first note (C4)
   - [ ] Sing along, see real-time feedback
   - [ ] Automatically advances to next note
   - [ ] Completes all 5 notes
   - [ ] Shows results screen with accuracy

4. **Edge Cases**
   - [ ] Deny microphone permission → shows error message
   - [ ] Background app (home button) → pauses exercise
   - [ ] Incoming phone call → handles gracefully
   - [ ] Low battery mode → still functions
   - [ ] Airplane mode → works (no network needed)

### Phase 3: Beta Testing (TestFlight)

**Beta Testing Goals:**
- 10-20 testers (mix of singers and non-singers)
- 7-day testing period
- Collect feedback via form

**Feedback Collection Form:**
```
PitchPerfect Beta Feedback

1. Device & iOS version?
2. Microphone accuracy (1-5 stars):
3. Pitch detection latency (too slow / just right / very fast):
4. Piano note sound quality (1-5 stars):
5. Exercise difficulty (too easy / balanced / too hard):
6. Bugs encountered (describe):
7. Feature requests:
8. Would you recommend to a friend? (Yes/No)
```

**Success Criteria:**
- Average rating: 4+ stars
- <5 critical bugs reported
- Latency feedback: "just right" or "very fast" (80%+ testers)
- Would recommend: 70%+ say "Yes"

---

## Implementation Timeline

### Week-by-Week Breakdown

#### Week 1: Core Audio Setup
**Goal:** Get real-time pitch detection working on iOS

- **Day 1-2:**
  - Install @siteed/expo-audio-studio
  - Update NativeAudioService.ts
  - Configure app.json permissions

- **Day 3-4:**
  - Test on real iPhone
  - Debug audio streaming
  - Verify YIN detector receives Float32Array

- **Day 5:**
  - Optimize buffer size for latency
  - Test with different sample rates

**Deliverable:** Real-time pitch detection working on iOS with <100ms latency

---

#### Week 2: Piano Sample Integration
**Goal:** Play piano reference notes on iOS

- **Day 1-2:**
  - Download C3-C6 samples from Freesound
  - Optimize files (convert, normalize, reduce size)

- **Day 3-4:**
  - Add samples to assets/audio/piano/
  - Update NativeAudioService playNote() method
  - Implement sample preloading

- **Day 5:**
  - Test all 37 notes on device
  - Measure playback latency
  - Fix any loading issues

**Deliverable:** All piano notes play cleanly with <50ms latency

---

#### Week 3: Exercise Integration
**Goal:** Complete end-to-end exercise flow

- **Day 1-2:**
  - Test existing exercises (5-Note Warmup, C Major Scale)
  - Debug any iOS-specific issues

- **Day 3-4:**
  - Add 5 new beginner exercises
  - Add 5 new intermediate exercises

- **Day 5:**
  - End-to-end testing of all exercises
  - Fix any progression bugs

**Deliverable:** 12+ exercises working perfectly on iOS

---

#### Week 4: Performance Optimization
**Goal:** Meet all performance targets

- **Day 1-2:**
  - Measure current latency (mic to display)
  - Optimize YIN algorithm (reduce buffer size)
  - Profile memory usage

- **Day 3-4:**
  - Implement lazy loading for piano samples
  - Optimize React Native re-renders
  - Test battery usage (1-hour session)

- **Day 5:**
  - Final performance testing
  - Document all metrics

**Deliverable:** All performance targets met (see table above)

---

#### Week 5: iOS Polish & Bug Fixes
**Goal:** Production-ready quality

- **Day 1-2:**
  - Handle edge cases (permissions, interruptions)
  - Add error messages for all failure modes
  - Test on older devices (iPhone 8, X)

- **Day 3-4:**
  - Fix any discovered bugs
  - Improve loading states
  - Add haptic feedback

- **Day 5:**
  - Final QA pass
  - Prepare for TestFlight

**Deliverable:** Zero known critical bugs

---

#### Week 6: App Store Preparation
**Goal:** Ready for TestFlight beta

- **Day 1-2:**
  - Create Apple Developer account
  - Set up App Store Connect
  - Write app description

- **Day 3-4:**
  - Create screenshots (all required sizes)
  - Design app icon (1024x1024)
  - Create privacy policy page

- **Day 5:**
  - Build production app with EAS
  - Submit to TestFlight

**Deliverable:** App live on TestFlight

---

#### Week 7: Beta Testing
**Goal:** Validate with real users

- **Day 1:**
  - Invite 10-20 beta testers
  - Send testing instructions

- **Day 2-6:**
  - Monitor feedback
  - Fix critical bugs (if any)
  - Push updated builds to TestFlight

- **Day 7:**
  - Analyze feedback
  - Plan App Store launch

**Deliverable:** Beta feedback with 4+ star average

---

### Total Timeline: 7 weeks (1.75 months)

**Critical Path Dependencies:**
1. Week 1 → Week 2 (need audio working before piano)
2. Week 2 → Week 3 (need piano before exercises)
3. Week 3 → Week 4 (need working features before optimization)
4. Week 5 → Week 6 (need quality before submission)

**Parallel Work Opportunities:**
- Piano sample preparation (Week 2) can start during Week 1
- Exercise design (Week 3) can be written in parallel with Week 2
- App Store assets (Week 6) can be created during Week 4-5

**Buffer Time:** Add 1-2 weeks buffer for unexpected issues (total: 8-9 weeks to be safe)

---

## Risk Assessment & Mitigation

### High-Risk Items

#### Risk 1: Audio Latency Too High (>100ms)
**Probability:** Medium (30%)
**Impact:** High (core feature unusable)

**Mitigation:**
1. Test early (Week 1) on real device
2. Have backup plan: synthetic audio instead of samples
3. Use smallest buffer size that maintains accuracy (1024 samples)
4. Consider ejecting to bare workflow if latency unacceptable (last resort)

**Fallback:** If @siteed/expo-audio-studio doesn't work, eject to bare React Native and use native AVAudioEngine directly

---

#### Risk 2: @siteed/expo-audio-studio Compatibility Issues
**Probability:** Medium (25%)
**Impact:** High (blocks iOS development)

**Mitigation:**
1. Test library in isolated project first (Week 1, Day 1)
2. Check GitHub issues for known bugs
3. Have alternative ready (expo-audio with workarounds)

**Fallback:** Use expo-audio's onAudioSampleReceived + periodic polling (lower accuracy but functional)

---

#### Risk 3: Piano Samples Not Available or Poor Quality
**Probability:** Low (10%)
**Impact:** Medium (can use synthetic)

**Mitigation:**
1. Download samples early (Week 2, Day 1)
2. Have backup source (Freepats, MusOpen)
3. Test sample quality before committing

**Fallback:** Generate synthetic piano tones using additive synthesis

---

#### Risk 4: App Store Rejection
**Probability:** Low (15%)
**Impact:** Medium (delays launch)

**Mitigation:**
1. Follow all privacy manifest guidelines
2. Test thoroughly before submission
3. Provide clear microphone usage description
4. No use of private APIs

**Fallback:** Address rejection reasons and resubmit (typically 24-48 hour turnaround)

---

### Medium-Risk Items

#### Risk 5: YIN Algorithm Performance on iOS
**Probability:** Low (10%)
**Impact:** Medium (slower pitch detection)

**Mitigation:**
1. Profile YIN on real device early
2. Optimize algorithm if needed (reduce buffer size)
3. Consider switching to ACF2+ if YIN is too slow

**Fallback:** Use @siteed/expo-audio-studio's built-in pitch detection

---

#### Risk 6: Battery Drain Issues
**Probability:** Low (10%)
**Impact:** Low (user complaint, not blocking)

**Mitigation:**
1. Test battery usage in Week 4
2. Disable background audio
3. Reduce screen refresh rate during exercises

**Fallback:** Add "Low Power Mode" toggle in settings

---

### Low-Risk Items

#### Risk 7: Exercise Difficulty Balance
**Probability:** High (60%)
**Impact:** Low (easy to adjust)

**Mitigation:**
1. Beta test with singers of different skill levels
2. Collect feedback on difficulty
3. Adjust tempo, range, tolerance settings

**Fallback:** Add difficulty customization in settings

---

#### Risk 8: UI/UX Confusion
**Probability:** Medium (30%)
**Impact:** Low (can iterate)

**Mitigation:**
1. Beta testing feedback
2. Watch users interact with app
3. Add onboarding tutorial if needed

**Fallback:** Add help text, tooltips, tutorial video

---

### Risk Matrix

| Risk | Probability | Impact | Priority | Mitigation Week |
|------|-------------|--------|----------|-----------------|
| Audio Latency | Medium | High | 🔴 P0 | Week 1 |
| Library Compatibility | Medium | High | 🔴 P0 | Week 1 |
| Piano Samples | Low | Medium | 🟡 P1 | Week 2 |
| App Store Rejection | Low | Medium | 🟡 P1 | Week 6 |
| YIN Performance | Low | Medium | 🟡 P1 | Week 4 |
| Battery Drain | Low | Low | 🟢 P2 | Week 4 |
| Exercise Difficulty | High | Low | 🟢 P2 | Week 7 |
| UI/UX Confusion | Medium | Low | 🟢 P2 | Week 7 |

---

## Code Examples

### Complete NativeAudioService Implementation

```typescript
/**
 * Native audio implementation for iOS/Android
 * Uses @siteed/expo-audio-studio for real-time PCM streaming
 * Works on: iOS, Android
 */

import { Audio } from 'expo-av';
import { AudioRecorder, RecordingConfig } from '@siteed/expo-audio-studio';
import { IAudioService, PitchDetectionCallback, AudioServiceConfig } from './IAudioService';

export class NativeAudioService implements IAudioService {
  private recorder: AudioRecorder | null = null;
  private sounds: Map<string, Audio.Sound> = new Map();
  private sampleRate: number = 44100;
  private bufferSize: number = 2048;
  private pitchCallback: PitchDetectionCallback | null = null;
  private isCapturing: boolean = false;

  // Piano sample paths
  private readonly noteSamples: Record<string, any> = {
    'C3': require('../../assets/audio/piano/C3.mp3'),
    'C#3': require('../../assets/audio/piano/C-sharp-3.mp3'),
    'D3': require('../../assets/audio/piano/D3.mp3'),
    'D#3': require('../../assets/audio/piano/D-sharp-3.mp3'),
    'E3': require('../../assets/audio/piano/E3.mp3'),
    'F3': require('../../assets/audio/piano/F3.mp3'),
    'F#3': require('../../assets/audio/piano/F-sharp-3.mp3'),
    'G3': require('../../assets/audio/piano/G3.mp3'),
    'G#3': require('../../assets/audio/piano/G-sharp-3.mp3'),
    'A3': require('../../assets/audio/piano/A3.mp3'),
    'A#3': require('../../assets/audio/piano/A-sharp-3.mp3'),
    'B3': require('../../assets/audio/piano/B3.mp3'),

    'C4': require('../../assets/audio/piano/C4.mp3'),
    'C#4': require('../../assets/audio/piano/C-sharp-4.mp3'),
    'D4': require('../../assets/audio/piano/D4.mp3'),
    'D#4': require('../../assets/audio/piano/D-sharp-4.mp3'),
    'E4': require('../../assets/audio/piano/E4.mp3'),
    'F4': require('../../assets/audio/piano/F4.mp3'),
    'F#4': require('../../assets/audio/piano/F-sharp-4.mp3'),
    'G4': require('../../assets/audio/piano/G4.mp3'),
    'G#4': require('../../assets/audio/piano/G-sharp-4.mp3'),
    'A4': require('../../assets/audio/piano/A4.mp3'),
    'A#4': require('../../assets/audio/piano/A-sharp-4.mp3'),
    'B4': require('../../assets/audio/piano/B4.mp3'),

    'C5': require('../../assets/audio/piano/C5.mp3'),
    'C#5': require('../../assets/audio/piano/C-sharp-5.mp3'),
    'D5': require('../../assets/audio/piano/D5.mp3'),
    'D#5': require('../../assets/audio/piano/D-sharp-5.mp3'),
    'E5': require('../../assets/audio/piano/E5.mp3'),
    'F5': require('../../assets/audio/piano/F5.mp3'),
    'F#5': require('../../assets/audio/piano/F-sharp-5.mp3'),
    'G5': require('../../assets/audio/piano/G5.mp3'),
    'G#5': require('../../assets/audio/piano/G-sharp-5.mp3'),
    'A5': require('../../assets/audio/piano/A5.mp3'),
    'A#5': require('../../assets/audio/piano/A-sharp-5.mp3'),
    'B5': require('../../assets/audio/piano/B5.mp3'),

    'C6': require('../../assets/audio/piano/C6.mp3'),
  };

  constructor(private config: AudioServiceConfig = {}) {
    this.sampleRate = config.sampleRate || 44100;
    this.bufferSize = config.bufferSize || 2048;
  }

  async initialize(): Promise<void> {
    console.log('🎹 NativeAudioService: Initializing...');

    // Set audio mode for iOS (using expo-av)
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
    });

    // Initialize AudioRecorder from @siteed/expo-audio-studio
    this.recorder = new AudioRecorder();

    // Preload piano samples for faster playback
    await this.preloadSamples();

    console.log('✅ NativeAudioService: Initialized');
  }

  async requestPermissions(): Promise<boolean> {
    console.log('🎤 NativeAudioService: Requesting microphone permissions...');

    try {
      const { status } = await Audio.requestPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ NativeAudioService: Microphone permission granted');
        return true;
      } else {
        console.error('❌ NativeAudioService: Microphone permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ NativeAudioService: Permission request failed', error);
      return false;
    }
  }

  async startMicrophoneCapture(callback: PitchDetectionCallback): Promise<void> {
    console.log('🎤 NativeAudioService: Starting microphone capture...');

    if (!this.recorder) {
      throw new Error('AudioRecorder not initialized. Call initialize() first.');
    }

    this.pitchCallback = callback;
    this.isCapturing = true;

    try {
      const recordingConfig: RecordingConfig = {
        sampleRate: this.sampleRate,
        channels: 1,
        encoding: 'pcm_16bit',
      };

      // Start recording with real-time audio stream callback
      await this.recorder.start({
        ...recordingConfig,
        onAudioStream: (audioData) => {
          if (!this.isCapturing || !this.pitchCallback) return;

          // audioData.buffer is Float32Array - perfect for YIN!
          // audioData.sampleRate is the actual sample rate
          this.pitchCallback(audioData.buffer, audioData.sampleRate);
        },
      });

      console.log('✅ NativeAudioService: Recording started with real-time PCM streaming');

    } catch (error) {
      console.error('❌ NativeAudioService: Failed to start recording', error);
      this.isCapturing = false;
      throw error;
    }
  }

  async stopMicrophoneCapture(): Promise<void> {
    console.log('🛑 NativeAudioService: Stopping microphone capture...');

    this.isCapturing = false;
    this.pitchCallback = null;

    if (this.recorder) {
      try {
        await this.recorder.stop();
        console.log('✅ NativeAudioService: Recording stopped');
      } catch (error) {
        console.error('❌ NativeAudioService: Failed to stop recording', error);
      }
    }
  }

  async playNote(noteName: string, duration: number): Promise<void> {
    console.log(`🎹 NativeAudioService: Playing ${noteName} for ${duration}s`);

    // Check if sample exists
    const samplePath = this.noteSamples[noteName];
    if (!samplePath) {
      console.warn(`⚠️ NativeAudioService: No sample for ${noteName}`);
      return;
    }

    try {
      // Get or load sound
      let sound = this.sounds.get(noteName);

      if (!sound) {
        console.warn(`⚠️ Sample for ${noteName} not preloaded, loading now...`);
        const { sound: newSound } = await Audio.Sound.createAsync(samplePath);
        sound = newSound;
        this.sounds.set(noteName, sound);
      }

      // Play note (replayAsync restarts from beginning)
      await sound.replayAsync();

      // Stop after duration
      setTimeout(async () => {
        await sound?.stopAsync();
      }, duration * 1000);

    } catch (error) {
      console.error(`❌ NativeAudioService: Failed to play ${noteName}`, error);
    }
  }

  stopNote(): void {
    // Stop all playing sounds
    this.sounds.forEach(async (sound) => {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error('❌ NativeAudioService: Failed to stop sound', error);
      }
    });
  }

  dispose(): void {
    console.log('🗑️ NativeAudioService: Disposing...');

    this.stopMicrophoneCapture();

    // Unload all sounds
    this.sounds.forEach(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('❌ NativeAudioService: Failed to unload sound', error);
      }
    });

    this.sounds.clear();

    console.log('✅ NativeAudioService: Disposed');
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  /**
   * Preload all piano samples for faster playback
   */
  private async preloadSamples(): Promise<void> {
    console.log('🎹 Preloading piano samples...');

    const notes = Object.keys(this.noteSamples);
    let loaded = 0;

    for (const note of notes) {
      try {
        const { sound } = await Audio.Sound.createAsync(this.noteSamples[note]);
        this.sounds.set(note, sound);
        loaded++;
      } catch (error) {
        console.error(`❌ Failed to preload ${note}:`, error);
      }
    }

    console.log(`✅ Preloaded ${loaded}/${notes.length} piano samples`);
  }
}
```

### Exercise Screen Integration Example

```typescript
// Example: How to use NativeAudioService in your Exercise Screen
import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { ExerciseEngineV2 } from '../engines/ExerciseEngineV2';
import { YINPitchDetector } from '../utils/pitchDetection';
import { NativeAudioService } from '../services/audio/NativeAudioService';
import { fiveNoteWarmup } from '../data/exercises/scales';

export function ExerciseScreenComplete() {
  const [engine, setEngine] = useState<ExerciseEngineV2 | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('-');
  const [frequency, setFrequency] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);

  useEffect(() => {
    // Initialize audio service and engine
    const audioService = new NativeAudioService({ sampleRate: 44100, bufferSize: 2048 });
    const pitchDetector = new YINPitchDetector(44100, 2048);

    const exerciseEngine = new ExerciseEngineV2(
      fiveNoteWarmup,
      { tempo: 60, startingNote: 'C4', repeatCount: 1, tolerance: 70 },
      audioService,
      pitchDetector
    );

    // Set up callbacks
    exerciseEngine.setOnNoteChange((index, note) => {
      setCurrentNote(note.note);
    });

    exerciseEngine.setOnPitchDetected((freq, note, acc, confidence) => {
      setFrequency(freq);
      setAccuracy(acc);
    });

    exerciseEngine.setOnComplete((results) => {
      console.log('Exercise complete!', results);
      alert(`Exercise complete! Accuracy: ${results.overallAccuracy}%`);
    });

    // Initialize audio service
    audioService.initialize().then(() => {
      audioService.requestPermissions();
    });

    setEngine(exerciseEngine);

    return () => {
      audioService.dispose();
    };
  }, []);

  const startExercise = async () => {
    if (engine) {
      await engine.start();
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Current Note: {currentNote}</Text>
      <Text style={{ fontSize: 18 }}>Your Pitch: {frequency.toFixed(1)} Hz</Text>
      <Text style={{ fontSize: 18 }}>Accuracy: {accuracy.toFixed(0)}%</Text>

      <Button title="Start Exercise" onPress={startExercise} />
    </View>
  );
}
```

### app.json Configuration

```json
{
  "expo": {
    "name": "PitchPerfect",
    "slug": "pitchperfect",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.pitchperfect",
      "buildNumber": "1",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "PitchPerfect needs microphone access to analyze your singing voice in real-time and provide accurate pitch feedback during vocal training exercises. Your audio is processed locally and never recorded or shared.",
        "ITSAppUsesNonExemptEncryption": false,
        "UIBackgroundModes": []
      },
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
          }
        ],
        "NSPrivacyTracking": false,
        "NSPrivacyTrackingDomains": [],
        "NSPrivacyCollectedDataTypes": []
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

---

## Conclusion

### What Makes This Plan Work

1. **Preserves Your Existing Work**: Uses your YIN algorithm, ExerciseEngineV2, IAudioService architecture
2. **Stay in Managed Workflow**: No ejecting from Expo required
3. **Proven Technology**: @siteed/expo-audio-studio is actively developed and tested
4. **Realistic Timeline**: 6-7 weeks with built-in buffer time
5. **Clear Success Metrics**: Specific targets for latency, accuracy, performance

### Next Steps (This Week)

1. **Test @siteed/expo-audio-studio in isolation** (1 day)
   - Create minimal test app
   - Verify PCM streaming works on iOS
   - Measure latency

2. **Download Piano Samples** (1 day)
   - Get Freesound account
   - Download C3-C6 pack
   - Test sample quality

3. **Implement NativeAudioService** (2-3 days)
   - Copy code example above
   - Test on real iPhone
   - Integrate with ExerciseEngineV2

### Success Indicators

**Week 1 Success:**
- ✅ Real-time pitch detection working on iPhone
- ✅ Latency measured at <100ms
- ✅ YIN algorithm receiving correct Float32Array data

**Week 2 Success:**
- ✅ All 37 piano notes playing on iOS
- ✅ Playback latency <50ms
- ✅ No audio glitches or distortion

**Week 7 Success:**
- ✅ App live on TestFlight
- ✅ 10+ beta testers providing feedback
- ✅ Average rating 4+ stars
- ✅ Ready for App Store submission

### Questions or Issues?

If you encounter any blockers:
1. Check GitHub issues for @siteed/expo-audio-studio
2. Test on multiple iOS devices (latency varies by model)
3. Consider ejecting to bare workflow only if absolutely necessary (last resort)
4. Reach out to Expo community forums for Expo-specific issues

---

**Document Status:** Ready for Implementation
**Last Updated:** October 3, 2025
**Next Review:** After Week 1 completion

Good luck with your iOS launch! 🎤🎵
