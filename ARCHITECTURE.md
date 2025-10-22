# PitchPerfect - Application Architecture

**Version:** 1.0.0
**Last Updated:** 2025-10-21
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
5. [Data Flow](#data-flow)
6. [Key Components](#key-components)
7. [State Management](#state-management)
8. [Audio Pipeline](#audio-pipeline)
9. [Exercise Engine](#exercise-engine)
10. [Deployment](#deployment)

---

## Overview

**PitchPerfect** is a professional vocal training iOS application built with React Native and Expo. It provides an 8-week structured curriculum combining breathing exercises and vocal training with real-time pitch detection and feedback.

### Key Features

- **Real-time Pitch Detection** - Accurate frequency analysis using YIN algorithm
- **8-Week Curriculum** - Structured progression from foundation to mastery
- **Breathing Exercises** - Professional techniques (Diaphragmatic, Box, Farinelli)
- **Vocal Exercises** - Scales, intervals, and pitch matching
- **Progress Tracking** - AsyncStorage-based persistence
- **Professional UI** - iOS Human Interface Guidelines compliant
- **Smart Recommendations** - Personalized exercise suggestions

---

## Technology Stack

### Frontend
- **React Native** 0.81.4
- **Expo SDK** 54
- **TypeScript** 5.x
- **React** 18.2.0

### Audio Processing
- **expo-av** - Audio playback and recording
- **@mykin-ai/expo-audio-stream** - Real-time audio streaming
- **YIN Algorithm** - Pitch detection (custom implementation)

### State & Storage
- **@react-native-async-storage/async-storage** - Persistence
- **React Hooks** - Local state management

### UI Libraries
- **react-native-reanimated** 4.1.1 - Advanced animations
- **expo-linear-gradient** - Gradients
- **react-native-safe-area-context** - Safe area handling
- **@shopify/react-native-skia** - 2D graphics (pitch visualization)
- **lottie-react-native** 7.3.1 - Professional animations

### Navigation & Gestures
- **react-native-gesture-handler** - Touch interactions

---

## Project Structure

```
PitchPerfect/
├── App.tsx                          # Root component
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── home/                   # Home screen components
│   │   │   ├── Header.tsx
│   │   │   ├── Greeting.tsx
│   │   │   ├── JourneyProgress.tsx # Week progress card
│   │   │   ├── HeroCard.tsx        # Main CTA
│   │   │   └── ExploreSection.tsx  # Exercise browser
│   │   ├── analytics/              # Performance tracking
│   │   │   ├── PitchHistoryGraph.tsx
│   │   │   └── SessionStatsCards.tsx
│   │   ├── BreathingVisualizer.tsx # Breathing animation
│   │   ├── PitchScaleVisualizer.tsx # Musical scale display
│   │   └── CelebrationConfetti.tsx # Success animations
│   │
│   ├── screens/                    # Screen components
│   │   ├── ExerciseScreenComplete.tsx  # Main app orchestrator (900+ lines)
│   │   └── ExercisePreview.tsx         # Pre-exercise info screen
│   │
│   ├── engines/                    # Exercise logic
│   │   ├── ExerciseEngineV2.ts    # Vocal exercise engine
│   │   └── BreathingEngine.ts     # Breathing exercise engine
│   │
│   ├── services/                   # Business logic
│   │   ├── audio/                 # Audio abstraction layer
│   │   │   ├── IAudioService.ts   # Interface
│   │   │   ├── NativeAudioService.ts  # iOS/Android impl
│   │   │   ├── WebAudioService.ts     # Web impl
│   │   │   └── AudioServiceFactory.ts # Platform detection
│   │   ├── progressTracking.ts    # User progress management
│   │   ├── recommendationEngine.ts # Exercise recommendations
│   │   └── sessionContext.ts      # Session state
│   │
│   ├── data/                       # Data layer
│   │   ├── models.ts              # TypeScript interfaces
│   │   ├── curriculum.ts          # 8-week program
│   │   ├── userProgress.ts        # Progress persistence
│   │   └── exercises/
│   │       ├── breathing.ts       # 3 breathing exercises
│   │       └── scales.ts          # 8 vocal exercises
│   │
│   ├── utils/                      # Utilities
│   │   ├── pitchDetection.ts      # YIN algorithm
│   │   ├── pitchSmoothing.ts      # Signal processing
│   │   └── encouragingMessages.ts # Motivational text
│   │
│   ├── hooks/                      # Custom React hooks
│   │   └── usePitchHistory.ts     # Pitch tracking
│   │
│   ├── design/                     # Design system
│   │   └── DesignSystem.ts        # Colors, typography, spacing
│   │
│   └── constants/
│       └── music.ts                # Musical constants (A4=440Hz, etc.)
│
├── assets/                         # Static resources
│   └── audio/
│       └── piano/                  # 49 AIFF piano samples (C3-C6)
│
├── ios/                            # Native iOS project
├── android/                        # Native Android project (future)
└── package.json                    # Dependencies
```

---

## Core Systems

### 1. Screen Orchestration

**`ExerciseScreenComplete.tsx`** - Main app coordinator (~900 lines)

```typescript
States:
- 'home'           → Home screen with recommendations
- 'preview'        → Exercise preview (What/Why/How)
- 'countdown'      → 3-2-1 countdown
- 'breathing'      → Breathing exercise active
- 'exercise'       → Vocal exercise active
- 'results'        → Post-exercise results
- 'analytics'      → Session analytics
```

**Responsibilities:**
- State machine management
- Audio service lifecycle
- Exercise engine coordination
- Progress tracking
- Navigation flow

### 2. Audio Pipeline

**Three-Layer Architecture:**

1. **Interface Layer** - `IAudioService.ts`
   - Platform-agnostic API
   - Methods: `initialize()`, `startMicrophoneCapture()`, `playNote()`, etc.

2. **Implementation Layer**
   - `NativeAudioService.ts` - iOS/Android (expo-av + expo-audio-stream)
   - `WebAudioService.ts` - Web (Web Audio API)

3. **Factory** - `AudioServiceFactory.ts`
   - Platform detection
   - Service instantiation

**Audio Flow:**
```
Microphone → expo-audio-stream (48kHz PCM)
          → Float32Array buffer (2048 samples)
          → Pitch Detection (YIN)
          → Exercise Engine
          → UI Update
```

### 3. Exercise Engine

**Two Engine Types:**

#### Vocal Engine (`ExerciseEngineV2.ts`)
```typescript
interface VocalExercise {
  notes: Note[];           // Musical notes to sing
  defaultTempo: number;    // BPM
  noteDuration: number;    // Seconds per note
}

Note States:
- pending  → Not yet played
- playing  → Currently active
- success  → Hit correctly (within 50 cents)
- missed   → Failed to hit
```

**Accuracy Calculation:**
- ±50 cents (half semitone) = Success
- Continuous 500ms on-pitch = Note completion
- Real-time visual feedback (green = good, red = off)

#### Breathing Engine (`BreathingEngine.ts`)
```typescript
interface BreathingRound {
  inhale: number;   // Duration (seconds)
  hold1?: number;   // Optional hold
  exhale: number;
  hold2?: number;   // Optional hold
}

Phases:
1. inhale  → Circle expands
2. hold1   → Pause at max
3. exhale  → Circle contracts
4. hold2   → Pause at min
5. rest    → Between rounds
```

### 4. Pitch Detection

**YIN Algorithm Implementation** (`pitchDetection.ts`)

```typescript
detectPitch(buffer: Float32Array, sampleRate: number): {
  frequency: number;
  confidence: number;
}

Steps:
1. Autocorrelation (difference function)
2. Cumulative mean normalized difference
3. Absolute threshold (0.15)
4. Parabolic interpolation
5. Frequency calculation: f = sampleRate / tau

Optimizations:
- Min/max frequency bounds (80Hz - 1000Hz)
- Confidence thresholding (>0.85)
- Smoothing via moving average
```

### 5. Progress Tracking

**Storage: AsyncStorage**

```typescript
interface UserProgress {
  createdAt: string;                 // ISO date (user start)
  completedExercises: {
    [exerciseId: string]: number;    // Completion count
  };
  lastActiveDate: string;            // ISO date
  totalSessions: number;
  totalMinutes: number;
}

Keys:
- 'user_progress'           → UserProgress object
- 'session_history'         → Session[] array
- 'todays_exercises_DATE'   → string[] (completed IDs)
```

**Curriculum Progression:**

```typescript
getCurrentWeek(createdAt: string): number {
  // Calculate days since start
  // Week = floor(days / 7) + 1
  // Capped at Week 8
}
```

---

## Data Flow

### Exercise Flow

```
1. HOME SCREEN
   ↓
   User taps "Start Today's Lesson"
   ↓
2. PREVIEW SCREEN (ExercisePreview.tsx)
   - Show: What, Why, How
   - User taps "Start Exercise"
   ↓
3. COUNTDOWN (3-2-1)
   ↓
4. EXERCISE EXECUTION
   ├─ Breathing: BreathingEngine + BreathingVisualizer
   └─ Vocal: ExerciseEngineV2 + PitchScaleVisualizer
   ↓
5. RESULTS SCREEN
   - Accuracy score
   - Encouraging message
   - "Continue" button
   ↓
6. BACK TO HOME
   - Progress saved
   - JourneyProgress updated
```

### Pitch Detection Flow

```
Microphone (48kHz)
   ↓
NativeAudioService.startMicrophoneCapture()
   ↓
onAudioStream callback (every ~43ms)
   ↓
base64 → Float32Array conversion
   ↓
detectPitch(buffer, sampleRate)
   ↓
smoothPitch(frequency, history)
   ↓
ExerciseEngineV2.updatePitch(frequency)
   ↓
Note state update (success/missed)
   ↓
UI re-render (PitchScaleVisualizer)
```

---

## Key Components

### Home Screen Components

#### JourneyProgress.tsx
```typescript
Props:
- currentWeek: number (1-8)
- daysThisWeek: number (0-N)

Features:
- Progress bar (gradient fill)
- Week badge + title
- Days completed counter
- Motivational emoji (🎯/🔥/✅)
```

#### HeroCard.tsx
```typescript
Purpose: Main CTA for recommended exercise

Features:
- Exercise title + category
- Duration estimate
- "Start" button (gradient)
- Subtle animation
```

### Exercise Screen Components

#### BreathingVisualizer.tsx
```typescript
Technology: React Native Animated API

Animation:
- Circle scales from 30% → 100% (inhale)
- Smooth easing (Easing.inOut)
- Text prompts ("Breathe In", "Hold", "Breathe Out")
- Round counter
```

#### PitchScaleVisualizer.tsx
```typescript
Technology: @shopify/react-native-skia (Canvas)

Features:
- Musical staff lines
- Note circles (pending/playing/success/missed)
- Real-time pitch indicator (green/red)
- Cent deviation display (±50)
- Note names (C4, D4, E4, etc.)
```

---

## State Management

### Local State (React Hooks)

```typescript
// ExerciseScreenComplete.tsx
const [screen, setScreen] = useState<ScreenState>('home');
const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
const [exerciseResults, setExerciseResults] = useState<Results | null>(null);
const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

// Exercise engines maintain own state
const [noteStates, setNoteStates] = useState<NoteState[]>([]);
const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
const [accuracy, setAccuracy] = useState(0);
```

### Persistence Layer

```typescript
// userProgress.ts
export async function loadUserProgress(): Promise<UserProgress>
export async function saveUserProgress(progress: UserProgress): Promise<void>
export async function markExerciseComplete(exerciseId: string): Promise<void>
export async function getTodaysCompletedExercises(): Promise<string[]>
```

---

## Audio Pipeline

### Sample Rate Handling

**Issue:** iOS returns 48kHz even when 44.1kHz requested

**Solution:**
```typescript
// NativeAudioService.ts
const { recordingResult } = await ExpoPlayAudioStream.startRecording({
  sampleRate: 44100,  // Requested
  ...
});

// Use ACTUAL sample rate from device
const actualSampleRate = recordingResult.sampleRate; // 48000
this.pitchCallback(buffer, actualSampleRate); // Pass actual rate!
```

### Piano Sample Playback

**University of Iowa AIFF Samples:**
- 49 samples (C3 to C6)
- Professional quality
- Loaded on-demand
- Cached after first use

```typescript
// NativeAudioService.ts
private readonly noteSamples = {
  'C3': require('../../../assets/audio/piano/C3.aiff'),
  'C#3': require('../../../assets/audio/piano/Db3.aiff'),
  ...
};

async playNote(noteName: string, duration: number) {
  let sound = this.sounds.get(noteName);
  if (!sound) {
    const { sound: newSound } = await Audio.Sound.createAsync(
      this.noteSamples[noteName]
    );
    sound = newSound;
    this.sounds.set(noteName, sound);
  }
  await sound.replayAsync();
  setTimeout(() => sound?.stopAsync(), duration * 1000);
}
```

---

## Exercise Engine

### Vocal Exercise Lifecycle

```typescript
1. INITIALIZATION
   - Load exercise data (notes, tempo, duration)
   - Initialize note states (all 'pending')
   - Start audio service

2. EXECUTION
   - Play reference note
   - Start pitch detection
   - Monitor user's voice (every 43ms)
   - Calculate cent deviation
   - Update note state (playing → success/missed)
   - Move to next note when complete

3. COMPLETION
   - Stop audio capture
   - Calculate overall accuracy
   - Generate results
   - Save progress
```

### Breathing Exercise Lifecycle

```typescript
1. INITIALIZATION
   - Load breathing pattern (rounds, durations)
   - Calculate total duration
   - Prepare visualizer

2. EXECUTION
   - For each round:
     - Phase 1: Inhale (circle expands)
     - Phase 2: Hold (optional, circle steady)
     - Phase 3: Exhale (circle contracts)
     - Phase 4: Hold (optional, circle steady)
     - Phase 5: Rest (brief pause)
   - Update round counter
   - Update phase text

3. COMPLETION
   - Final round complete
   - Show results (always 100% for breathing)
   - Save progress
```

---

## Deployment

### Current Status
- **Platform:** iOS (Expo Dev Client)
- **Environment:** Development
- **Testing:** iPhone 16 Pro Simulator + Physical devices

### Production Checklist

#### 1. App Store Preparation
- [ ] Create App Store Connect listing
- [ ] Prepare screenshots (6.7", 6.5", 5.5")
- [ ] Write App Store description
- [ ] Privacy policy URL
- [ ] Support URL

#### 2. Build Configuration
- [ ] Update `app.json`:
  - Bundle identifier: `com.rohanbhandari.pitchperfect`
  - Version: `1.0.0`
  - Build number: `1`
  - App Store icon (1024x1024)
- [ ] Configure EAS Build
- [ ] Set up code signing

#### 3. Testing
- [ ] Test on physical iOS devices
- [ ] Verify microphone permissions
- [ ] Test all 11 exercises
- [ ] Verify progress persistence
- [ ] Test 8-week curriculum flow

#### 4. Submission
```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

---

## Performance Considerations

### Optimization Strategies

1. **Audio Processing**
   - Buffer size: 2048 samples (~43ms latency at 48kHz)
   - Pitch detection runs on callback thread
   - Minimal computation per frame

2. **React Re-renders**
   - Memoized components where possible
   - Reanimated for 60fps animations
   - Skia Canvas for complex graphics (pitch visualizer)

3. **Memory Management**
   - Piano samples cached after first load
   - Audio service properly disposed
   - No memory leaks in useEffect cleanup

4. **Storage**
   - AsyncStorage for small data (<1MB)
   - Atomic writes for progress
   - Daily exercise cache

---

## Known Issues & Future Improvements

### Known Issues
1. Sample rate mismatch warning (requested 44.1kHz, got 48kHz)
   - **Status:** Non-critical, handled correctly
   - **Impact:** None (we use actual sample rate)

2. Occasional "Recording is not active" on rapid navigation
   - **Status:** Mitigated with defensive checks
   - **Impact:** Minimal (graceful degradation)

### Future Improvements

#### Phase 1: Visual Enhancements (Current)
- [ ] Add Lottie animations for breathing exercises
- [ ] Add posture diagrams to exercise preview
- [ ] Add technique tips overlay during exercises

#### Phase 2: Video Demonstrations
- [ ] Professional vocal coach videos
- [ ] Technique breakdowns
- [ ] Common mistakes guide

#### Phase 3: Advanced Features
- [ ] AR posture correction
- [ ] Vocal range assessment
- [ ] Custom workout builder
- [ ] Social sharing
- [ ] Progress charts
- [ ] Streak tracking

---

## Development Workflow

### Setup
```bash
# Install dependencies
npm install

# Start dev server
npx expo start --dev-client

# Run on iOS
npx expo run:ios
```

### Key Commands
```bash
# TypeScript check
npx tsc --noEmit

# Clear cache
npx expo start --clear

# Rebuild iOS
cd ios && pod install && cd ..
npx expo run:ios
```

---

## Architecture Principles

1. **Separation of Concerns**
   - UI components separate from business logic
   - Audio service abstraction for cross-platform support
   - Exercise engines independent of UI

2. **Type Safety**
   - Full TypeScript coverage
   - Strict mode enabled
   - Interface-driven design

3. **Performance First**
   - 60fps animations
   - Optimized re-renders
   - Lazy loading where possible

4. **User Experience**
   - iOS Human Interface Guidelines
   - Smooth transitions
   - Clear feedback
   - Encouraging messaging

5. **Maintainability**
   - Clear file structure
   - Comprehensive documentation
   - Modular components
   - Reusable utilities

---

## Support & Maintenance

**Author:** Rohan Bhandari
**GitHub:** (To be added)
**Contact:** (To be added)

**License:** Proprietary

---

**End of Architecture Documentation**
