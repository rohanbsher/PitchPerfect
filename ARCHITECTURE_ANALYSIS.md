# PitchPerfect Architecture Analysis
## Deep Dive Before Redesign Implementation

---

## Current Architecture Overview

### Entry Point
```
App.tsx → ExerciseScreenComplete.tsx (HOME SCREEN)
```

**Key Insight:** The app has ONE main screen currently. No navigation, no tabs, just a single screen showing exercises.

---

## File Structure Analysis

```
src/
├── components/          # Reusable UI components (6 files)
│   ├── BreathingCircle.tsx        # Breathing exercise visualization
│   ├── CelebrationConfetti.tsx   # Success animation
│   ├── PitchComparison.tsx       # Shows pitch vs target
│   ├── PitchScaleVisualizer.tsx  # Musical scale visualization
│   ├── PitchVisualizer.tsx       # Real-time pitch feedback (Skia canvas)
│   └── ProgressDashboard.tsx     # Stats/progress display
│
├── constants/          # Static data (1 file)
│   └── music.ts                   # Note frequencies, intervals
│
├── data/               # Exercise definitions
│   ├── exercises/
│   │   ├── breathing.ts           # 3 breathing exercises (NEW)
│   │   └── scales.ts              # 5 vocal exercises (EXISTING)
│   └── models.ts                  # TypeScript interfaces
│
├── design/             # Design system (1 file)
│   └── DesignSystem.ts           # Current DS (WILL UPDATE)
│
├── engines/            # Business logic
│   ├── ExerciseEngine.ts         # Old engine (web only)
│   └── ExerciseEngineV2.ts       # NEW: Cross-platform engine
│
├── screens/            # Screen components (11 screens!)
│   ├── ExerciseScreenComplete.tsx  # CURRENT HOME (will rewrite)
│   ├── AudioDebugTest.tsx         # Debug screen
│   ├── CoachMode.tsx              # Coach features
│   ├── ExerciseTestScreen.tsx     # Various test screens (legacy)
│   ├── ExerciseTestScreenProfessional.tsx
│   ├── ExerciseTestScreenV2.tsx
│   ├── FarinelliBreathingScreen.tsx
│   ├── PitchDebug.tsx
│   ├── PitchMatchPro.tsx
│   ├── PitchPerfectPro.tsx
│   ├── PitchPerfectRedesign.tsx   # Previous redesign attempt
│   ├── PitchPerfectSimple.tsx
│   ├── SimplifiedVocalTrainer.tsx
│   └── VocalCoachingSession.tsx
│
├── services/           # Platform services
│   ├── audio/
│   │   ├── IAudioService.ts       # Interface
│   │   ├── NativeAudioService.ts  # iOS/Android implementation
│   │   ├── WebAudioService.ts     # Web implementation
│   │   └── AudioServiceFactory.ts # Factory pattern
│   ├── audioService.ts            # Legacy audio service
│   ├── progressTracking.ts        # Streak/achievement tracking
│   ├── recordingService.ts        # Audio recording
│   ├── referencePitchService.ts   # Piano note playback
│   └── webAudioService.ts         # Web audio (legacy)
│
└── utils/              # Utility functions
    ├── encouragingMessages.ts     # Motivational messages
    └── pitchDetection.ts          # YIN pitch detection algorithm
```

---

## Key Findings

### 1. **Multiple Legacy Screens (Code Smell)**
There are **11 different screen files**, suggesting the app has been refactored multiple times without cleanup:
- ExerciseTestScreen (3 versions)
- PitchPerfect (Simple, Pro, Redesign)
- CoachMode, VocalCoachingSession

**Action:** We should focus ONLY on `ExerciseScreenComplete.tsx` and ignore legacy screens.

---

### 2. **Dual Audio Architecture**
The app has TWO audio service implementations:
- **Old:** `audioService.ts`, `webAudioService.ts` (web-only)
- **New:** `audio/` folder with `IAudioService` interface (cross-platform)

**Current Usage:**
- `ExerciseScreenComplete.tsx` uses **NEW** architecture (`AudioServiceFactory`)
- `ExerciseEngineV2.ts` uses **NEW** architecture (accepts `IAudioService`)

**Action:** Stick with new architecture, ignore old services.

---

### 3. **Progress Tracking Exists But May Need Updates**
`progressTracking.ts` already has:
- ✅ Session tracking
- ✅ Achievement system
- ✅ Streak calculation
- ⚠️ Uses `localStorage` (web-only, needs AsyncStorage for iOS)

**Action:** Need to adapt for React Native (use `@react-native-async-storage/async-storage`).

---

### 4. **Design System Exists But Different from New Design**
Current `DesignSystem.ts`:
- Dark theme: `#121212` (warmer grey)
- Accent: `#00D9FF` (cyan)
- Typography: iOS HIG compliant
- Spacing: 8px base unit

New Design System (from DESIGN_SYSTEM_V2.md):
- Dark theme: `#0F172A` (navy)
- Accent: `#3B82F6` (blue)
- Same typography structure
- 4px base unit

**Action:** Update DS constants to match new design, maintain backward compatibility.

---

### 5. **ExerciseScreenComplete.tsx Structure (Current State)**

```typescript
// Current implementation (simplified)
export function ExerciseScreenComplete() {
  // State
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(allExercises[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [pitchResult, setPitchResult] = useState<PitchDetectionResult | null>(null);
  const [results, setResults] = useState<ExerciseResults | null>(null);

  // Services
  const audioService = AudioServiceFactory.create();
  const pitchDetector = new YINPitchDetector();

  // Exercise engine
  const engine = new ExerciseEngineV2(...);

  // UI Structure
  return (
    <SafeAreaView>
      {!isRunning && !results && (
        // EXERCISE SELECTION VIEW
        <FlatList
          data={allExercises}
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              isSelected={item.id === selectedExercise.id}
              onPress={() => setSelectedExercise(item)}
            />
          )}
        />
        <FAB onPress={startExercise} />
      )}

      {isRunning && (
        // EXERCISE IN PROGRESS VIEW
        <PitchVisualizer
          pitchResult={pitchResult}
          targetNote={currentNote}
        />
        <StopButton onPress={stopExercise} />
      )}

      {results && (
        // RESULTS VIEW
        <ResultsDisplay results={results} />
        <TryAgainButton />
      )}
    </SafeAreaView>
  );
}
```

**Key Observations:**
- ✅ Already has FAB (Floating Action Button)
- ✅ Already combines breathing + vocal exercises
- ✅ Already uses ExerciseEngineV2 (good architecture)
- ❌ No personalization/recommendation logic
- ❌ No greeting/streak display
- ❌ No progressive disclosure (all exercises shown at once)
- ❌ No tab navigation
- ❌ No onboarding flow

---

## Data Flow Analysis

### Current Flow: Exercise Execution

```
User taps START
    ↓
startExercise() called
    ↓
Initialize AudioServiceFactory (native iOS)
    ↓
Create ExerciseEngineV2 instance
    ↓
engine.setOnNoteChange(callback) - updates UI with current note
engine.setOnPitchDetected(callback) - updates pitch visualizer
engine.setOnComplete(callback) - shows results
    ↓
engine.start()
    ↓
[AUTOMATIC LOOP IN ENGINE]
    ↓
For each note:
  1. Play piano note (AudioService.playNote)
  2. Listen to microphone (AudioService.startMicrophoneCapture)
  3. Detect pitch (YINPitchDetector)
  4. Calculate accuracy
  5. Auto-advance to next note
    ↓
All notes complete
    ↓
engine.onComplete() → show results
```

**Key Insight:** Exercise execution is well-architected and SHOULD NOT BE CHANGED.

---

### New Flow: Recommendation System (To Implement)

```
App Launch
    ↓
Load user data from AsyncStorage
  - completedExercises: Exercise[]
  - streak: number
  - lastPracticeDate: Date
  - weeksSinceFirstUse: number
    ↓
Recommendation Algorithm:
  IF (completedExercises.length === 0)
    → Recommend: Diaphragmatic Breathing (first lesson)

  ELSE IF (hour >= 6 && hour < 12)
    → Recommend: Gentle warmup (5-Note Warm-Up)

  ELSE IF (weekNumber <= 2)
    → Recommend: Foundation exercises (breathing + simple scales)

  ELSE IF (weekNumber <= 4)
    → Recommend: Basic coordination (major thirds, short scales)

  ELSE
    → Recommend: Next in progression OR user's weakest exercise
    ↓
Display hero card with recommended exercise
    ↓
User taps START → existing exercise flow
    ↓
Exercise completes
    ↓
Save result to AsyncStorage
  - Update completedExercises
  - Update streak (if practiced today)
  - Update lastPracticeDate
    ↓
Show results + update home screen
```

---

## Component Architecture Plan

### New Component Hierarchy

```
App.tsx
  └── HomeScreen (NEW - rewritten ExerciseScreenComplete)
      ├── Header
      │   ├── ProfileIcon (left)
      │   ├── AppTitle (center)
      │   └── StreakIndicator (right)
      │
      ├── Greeting
      │   ├── TimeBasedGreeting ("Good morning, Sarah")
      │   └── MotivationalSubtext ("Ready for your daily warmup?")
      │
      ├── HeroCard
      │   ├── BackgroundAnimation (subtle pulse)
      │   ├── ExerciseLabel ("YOUR PRACTICE FOR TODAY")
      │   ├── ExerciseName ("5-Note Warm-Up")
      │   ├── Metadata
      │   │   ├── NoteCount ("🎵 5 notes")
      │   │   ├── Duration ("⏱ 5 min")
      │   │   └── Difficulty ("🟢 Beginner")
      │   ├── Description ("Perfect way to start your morning")
      │   └── CTAButton ("▶ START PRACTICE")
      │
      ├── ExploreSection (collapsible)
      │   ├── SectionHeader ("Explore More →")
      │   └── ExerciseGrid (when expanded)
      │       └── ExerciseCard (multiple)
      │           ├── ExerciseName
      │           ├── Metadata (compact)
      │           ├── DifficultyBadge
      │           └── LockIcon (if locked)
      │
      └── TabBar (future - Phase 2)
          ├── TodayTab (active)
          ├── ProgressTab
          └── MoreTab

ExerciseInProgressScreen (separate, future)
  ├── PitchVisualizer (existing component, keep as-is)
  ├── CurrentNoteDisplay
  ├── ProgressBar
  └── StopButton

ResultsScreen (separate, future)
  ├── StarRating (1-3 stars)
  ├── Accuracy ("87% accurate!")
  ├── Strengths ("Great pitch on C4!")
  ├── Improvements ("Practice E4 next time")
  ├── CTAButtons
  │   ├── TryAgainButton
  │   └── NextExerciseButton
  └── StreakUpdate ("3 day streak! 🔥")
```

---

## Data Models

### New Models to Create

```typescript
// User progression data
interface UserProgress {
  userId: string;
  userName: string;
  createdAt: Date;
  lastPracticeDate: Date | null;

  // Completed exercises
  completedExercises: CompletedExercise[];

  // Streak tracking
  currentStreak: number;
  longestStreak: number;

  // Progression
  weeksSinceFirstUse: number;
  currentLevel: 'foundation' | 'basic' | 'intermediate' | 'advanced';

  // Weaknesses (for smart recommendations)
  weakestNotes: string[]; // e.g., ["E4", "G4"]
}

interface CompletedExercise {
  exerciseId: string;
  completedAt: Date;
  accuracy: number; // 0-100
  stars: 1 | 2 | 3;
  noteResults: NoteResult[];
}

// Recommendation context
interface RecommendationContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  userProgress: UserProgress;
  availableExercises: Exercise[];
  lastExerciseId: string | null;
}
```

### Update Existing Models

```typescript
// Exercise model (in models.ts) - ALREADY UPDATED
export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType; // ✅ Already added
  category: ExerciseCategory;
  difficulty: ExerciseDifficulty;
  duration: number;
  description: string;
  instructions: string[];

  // Vocal fields (optional)
  notes?: Note[];
  defaultTempo?: number;
  defaultStartingNote?: string;
  allowTempoChange?: boolean;
  allowKeyChange?: boolean;

  // Breathing fields (optional)
  breathingRounds?: BreathingRound[]; // ✅ Already added

  // NEW: Progression metadata
  unlockRequirements?: {
    minimumWeek: number; // Week 1, 2, 3, etc.
    prerequisiteExerciseIds?: string[]; // Must complete these first
  };
}
```

---

## Implementation Strategy

### Phase 1: Design System & Data Models (Foundation)
**Files to create:**
1. `src/data/userProgress.ts` - UserProgress data model + AsyncStorage functions
2. `src/services/recommendationEngine.ts` - Smart recommendation algorithm
3. Update `src/design/DesignSystem.ts` - Match new color/spacing values

**Files to update:**
1. `src/data/models.ts` - Add `unlockRequirements` to Exercise interface

**Estimated effort:** 2-3 hours

---

### Phase 2: New Components (Building Blocks)
**Files to create:**
1. `src/components/home/Header.tsx` - Top bar with streak
2. `src/components/home/Greeting.tsx` - Personalized greeting
3. `src/components/home/HeroCard.tsx` - Main recommendation card
4. `src/components/home/ExploreSection.tsx` - Expandable exercise library
5. `src/components/home/ExerciseCardCompact.tsx` - Small card for grid

**Estimated effort:** 4-5 hours

---

### Phase 3: Rewrite Home Screen (Integration)
**Files to update:**
1. `src/screens/ExerciseScreenComplete.tsx` - Complete rewrite using new components

**What to keep:**
- Exercise execution logic (startExercise, engine setup)
- Results display (for now)
- Existing imports for PitchVisualizer, ExerciseEngine

**What to replace:**
- FlatList of exercises → HeroCard + ExploreSection
- Static exercise selection → Smart recommendation
- No greeting → Dynamic greeting
- No streak tracking → Streak display

**Estimated effort:** 3-4 hours

---

### Phase 4: Testing & Polish (Refinement)
1. Test on iPhone (verify layout, animations)
2. Fix AsyncStorage implementation (ensure iOS compatibility)
3. Add haptic feedback
4. Polish animations (hero card pulse, expand/collapse)
5. Edge case handling

**Estimated effort:** 2-3 hours

---

## Total Estimated Effort
**12-15 hours** of focused implementation

---

## Critical Decisions

### 1. **Keep ExerciseScreenComplete.tsx or Rename?**
**Decision:** KEEP the filename, rewrite contents.
**Rationale:** App.tsx already imports it, avoid breaking changes.

### 2. **Separate Screens or Single Screen States?**
**Decision:** Start with single screen (3 states: Home, InProgress, Results)
**Rationale:**
- Simpler to implement
- No navigation setup needed yet
- Can refactor to separate screens later (Phase 2 of redesign)

### 3. **AsyncStorage vs LocalStorage?**
**Decision:** Use AsyncStorage
**Rationale:**
- Cross-platform (iOS, Android, Web with polyfill)
- Async API (won't block UI)
- React Native standard

**Package to install:**
```bash
npm install @react-native-async-storage/async-storage
```

### 4. **Animation Library?**
**Decision:** Use React Native Animated API (built-in)
**Rationale:**
- Already available, no new dependency
- Performant (uses native driver)
- Hero card pulse animation is simple (opacity loop)
- Expand/collapse uses height animation

**Future consideration:** Reanimated 2 for complex gestures (Phase 2)

---

## Risk Mitigation

### Risk 1: Breaking Existing Exercise Flow
**Mitigation:**
- Keep ALL exercise execution logic unchanged
- Only change UI/layout of home screen
- Test thoroughly on iPhone before proceeding

### Risk 2: AsyncStorage Not Working on iOS
**Mitigation:**
- Test AsyncStorage immediately after setup
- Have fallback to in-memory state if storage fails
- Log all storage operations for debugging

### Risk 3: Performance Issues with Animations
**Mitigation:**
- Use `useNativeDriver: true` for transforms/opacity
- Avoid animating layout properties (height, width) on large components
- Test on actual device, not simulator

---

## Next Steps

**Immediate actions:**
1. ✅ Complete architecture analysis (this document)
2. Review all 3 design documents one more time
3. Create detailed component wireframes (pseudo-code)
4. Begin Phase 1 implementation (design system + data models)

---

*Analysis completed: 2025-10-08*
*Ready to begin implementation*
