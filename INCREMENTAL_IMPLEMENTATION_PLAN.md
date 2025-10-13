# Incremental Implementation Plan - Guided Vocal Workouts
**Date**: October 6, 2025
**Approach**: Build one feature at a time, test thoroughly, then move to next
**Goal**: Transform app from random exercise list → guided vocal workout

---

## Current Architecture Analysis

### What We Have (Reusable):
✅ **DesignSystem** - Colors, typography, spacing (keep!)
✅ **Audio Services** - NativeAudioService, AudioServiceFactory (keep!)
✅ **Data Models** - Exercise, Note, ExerciseResults (extend!)
✅ **ExerciseEngineV2** - Automatic progression engine (adapt!)
✅ **CelebrationConfetti** - Celebration system (keep!)
✅ **Piano Samples** - 37 AIFF files (keep!)

### What We Need to Build (New):
❌ **Guided Session System** - Data structure for multi-step workouts
❌ **Session Engine** - Auto-progress through workout steps
❌ **Breathing Exercise Components** - Farinelli, S-sound timer
❌ **Timer Components** - Visual countdown, phase indicators
❌ **New Home Screen** - "Start Workout" not "Choose Exercise"
❌ **Session Progress UI** - Show step X of Y, time remaining

---

## Incremental Implementation Strategy

### The Plan:
1. **Feature #1**: Farinelli Breathing Exercise (Foundation)
2. **Feature #2**: S-Sound Hold Timer (Breath Control)
3. **Feature #3**: Guided Session Engine (Flow System)
4. **Feature #4**: Complete First Workout (Integration)
5. **Feature #5**: Fix Pitch Detection (Make It Actually Work)

**Why This Order**:
- Start with simplest, most critical feature (breathing)
- Build confidence with quick wins
- Each feature is independently testable
- Foundation supports later features
- Pitch detection last (most complex, depends on other features working)

---

## Feature #1: Farinelli Breathing Exercise

### Goal
Build a single, working breathing exercise that users can practice immediately.

### Why First?
- Simplest feature (just a timer + visual)
- No pitch detection needed
- Foundation of all vocal training
- Quick win to build momentum
- Users can actually use it TODAY

### What to Build

**Component**: `FarinelliBreathingExercise.tsx`

**Functionality**:
1. Visual breathing guide (expanding/contracting circle)
2. Beat counter (5...4...3...2...1...)
3. Phase indicator (INHALE / HOLD / EXHALE)
4. Auto-progression through 4 rounds (5-5-5 → 8-8-8)
5. Completion celebration

**User Flow**:
```
Open App
  ↓
[New Button] "Practice Breathing"
  ↓
Farinelli Breathing Screen
  ↓
Round 1: 5-5-5
  • Visual circle expands (INHALE)
  • Circle stays full (HOLD)
  • Circle contracts (EXHALE)
  ↓
Round 2: 6-6-6
  ↓
Round 3: 7-7-7
  ↓
Round 4: 8-8-8
  ↓
"Great work! 🎉"
  • Confetti + haptics
  • Back to home
```

---

### Implementation Steps

#### Step 1.1: Create Data Model (30 min)
**File**: `src/data/models.ts` (extend existing)

```typescript
export interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  rounds: BreathingRound[];
  totalDuration: number; // seconds
}

export interface BreathingRound {
  number: number; // 1, 2, 3, 4
  inhaleBeats: number; // 5, 6, 7, 8
  holdBeats: number; // 5, 6, 7, 8
  exhaleBeats: number; // 5, 6, 7, 8
}

export interface BreathingResult {
  exerciseId: string;
  completedAt: Date;
  roundsCompleted: number;
  totalDuration: number;
}
```

**Data**:
```typescript
export const farinelliBreathing: BreathingExercise = {
  id: 'farinelli-breathing',
  name: 'Farinelli Breathing',
  description: 'Build breath capacity with the legendary technique',
  rounds: [
    { number: 1, inhaleBeats: 5, holdBeats: 5, exhaleBeats: 5 },
    { number: 2, inhaleBeats: 6, holdBeats: 6, exhaleBeats: 6 },
    { number: 3, inhaleBeats: 7, holdBeats: 7, exhaleBeats: 7 },
    { number: 4, inhaleBeats: 8, holdBeats: 8, exhaleBeats: 8 },
  ],
  totalDuration: 156, // 39 beats * 4 rounds at ~1 sec/beat
};
```

**Test**: Can import and access data ✅

---

#### Step 1.2: Create Breathing Visual Component (1 hour)
**File**: `src/components/BreathingCircle.tsx`

```typescript
interface BreathingCircleProps {
  phase: 'inhale' | 'hold' | 'exhale';
  beatsRemaining: number;
  totalBeats: number;
}

export const BreathingCircle: React.FC<BreathingCircleProps> = ({
  phase,
  beatsRemaining,
  totalBeats
}) => {
  // Animated circle that expands/contracts based on phase
  // Uses React Native Animated API

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle]}>
        {/* Inner content */}
        <Text style={styles.phaseText}>
          {phase === 'inhale' ? 'BREATHE IN' :
           phase === 'hold' ? 'HOLD' :
           'BREATHE OUT'}
        </Text>
        <Text style={styles.counterText}>{beatsRemaining}</Text>
      </Animated.View>
    </View>
  );
};
```

**Visual Behavior**:
- **INHALE**: Circle grows from 100px → 250px
- **HOLD**: Circle stays at 250px, pulses subtly
- **EXHALE**: Circle shrinks from 250px → 100px

**Test**: Component renders, animations work ✅

---

#### Step 1.3: Create Farinelli Exercise Screen (2 hours)
**File**: `src/screens/FarinelliBreathingScreen.tsx`

```typescript
export const FarinelliBreathingScreen: React.FC = () => {
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [beatsRemaining, setBeatsRemaining] = useState(5);
  const [isComplete, setIsComplete] = useState(false);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (beatsRemaining > 0) {
        setBeatsRemaining(prev => prev - 1);
        // Play haptic on each beat
        Haptics.selectionAsync();
      } else {
        // Move to next phase
        advancePhase();
      }
    }, 1000); // 1 beat per second

    return () => clearInterval(timer);
  }, [beatsRemaining, currentPhase, currentRound]);

  const advancePhase = () => {
    const round = farinelliBreathing.rounds[currentRound];

    if (currentPhase === 'inhale') {
      setCurrentPhase('hold');
      setBeatsRemaining(round.holdBeats);
    } else if (currentPhase === 'hold') {
      setCurrentPhase('exhale');
      setBeatsRemaining(round.exhaleBeats);
    } else if (currentPhase === 'exhale') {
      // Move to next round
      if (currentRound < farinelliBreathing.rounds.length - 1) {
        setCurrentRound(prev => prev + 1);
        setCurrentPhase('inhale');
        setBeatsRemaining(farinelliBreathing.rounds[currentRound + 1].inhaleBeats);
      } else {
        // Exercise complete!
        setIsComplete(true);
      }
    }
  };

  if (isComplete) {
    return (
      <View style={styles.container}>
        <CelebrationConfetti trigger={true} accuracy={100} />
        <Text style={styles.completeTitle}>Breathing Complete! 🎉</Text>
        <Text style={styles.completeText}>
          You completed 4 rounds of Farinelli breathing!
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Done</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Farinelli Breathing</Text>
      <Text style={styles.roundText}>Round {currentRound + 1} of 4</Text>

      {/* Breathing Visual */}
      <BreathingCircle
        phase={currentPhase}
        beatsRemaining={beatsRemaining}
        totalBeats={farinelliBreathing.rounds[currentRound][`${currentPhase}Beats`]}
      />

      {/* Instructions */}
      <Text style={styles.instructionText}>
        {currentPhase === 'inhale' && 'Breathe in through nose and mouth'}
        {currentPhase === 'hold' && 'Hold gently, stay relaxed'}
        {currentPhase === 'exhale' && 'Release slowly and completely'}
      </Text>
    </View>
  );
};
```

**Test Checklist**:
- [ ] Screen renders correctly
- [ ] Timer counts down properly
- [ ] Circle animates on each phase
- [ ] Haptics fire on each beat
- [ ] Automatically advances through phases
- [ ] Automatically advances through rounds
- [ ] Shows completion celebration
- [ ] "Done" button returns to home

---

#### Step 1.4: Add Entry Point in Main App (30 min)
**File**: `App.tsx` (modify existing)

```typescript
import { FarinelliBreathingScreen } from './src/screens/FarinelliBreathingScreen';
import { useState } from 'react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'breathing'>('home');

  if (currentScreen === 'breathing') {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <FarinelliBreathingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.title}>PitchPerfect</Text>

        {/* NEW: Breathing Exercise Button */}
        <TouchableOpacity onPress={() => setCurrentScreen('breathing')}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🫁 Breathing Exercise</Text>
            <Text style={styles.cardDesc}>
              Farinelli Breathing - Build lung capacity
            </Text>
            <Text style={styles.cardDuration}>4 minutes</Text>
          </View>
        </TouchableOpacity>

        {/* OLD: Exercise list (keep for now) */}
        <ExerciseScreenComplete />
      </View>
    </SafeAreaProvider>
  );
}
```

**Test Checklist**:
- [ ] Button appears on home screen
- [ ] Tapping button navigates to breathing exercise
- [ ] Exercise works correctly
- [ ] Done button returns to home
- [ ] Can repeat exercise multiple times

---

### Feature #1 Testing Protocol

**Manual Tests on iPhone**:
1. **Tap "Breathing Exercise"** → Screen loads ✅
2. **Watch Round 1 (5-5-5)** → Circle expands/holds/contracts ✅
3. **Feel haptics** → Phone vibrates on each beat ✅
4. **Read instructions** → Text changes for each phase ✅
5. **Wait through all 4 rounds** → Automatically progresses ✅
6. **See celebration** → Confetti + "Breathing Complete!" ✅
7. **Tap "Done"** → Returns to home ✅
8. **Repeat** → Works again ✅

**Success Criteria**:
- ✅ User can complete full Farinelli breathing exercise
- ✅ Timer is accurate (1 second per beat)
- ✅ Visual guide is clear and helpful
- ✅ Haptics feel good
- ✅ Celebration feels rewarding
- ✅ No bugs or crashes

---

### Feature #1 Documentation

**After completing Feature #1, document**:
1. What worked perfectly
2. What needed adjustments
3. User feedback (if tested with real user)
4. Code that can be reused for Feature #2
5. Lessons learned

---

## Feature #2: S-Sound Hold Timer

### Goal
Build breath control exercise with timer and progress tracking.

### Why Second?
- Builds on breathing foundation
- Introduces performance measurement
- Still no pitch detection needed
- Adds progress tracking concept

### What to Build

**Component**: `SSoundHoldTimer.tsx`

**Functionality**:
1. Start/stop timer
2. Audio cue (play "sssss" reference sound)
3. Visual waveform (shows consistent airflow)
4. Result screen (shows duration achieved)
5. Progress tracking (10s → 15s → 20s goals)

**User Flow**:
```
Tap "S-Sound Exercise"
  ↓
Instructions: "Sustain 'ssss' as long as possible"
  ↓
Tap "Start"
  ↓
Timer starts: 00:00
  • User makes "sssss" sound
  • Waveform shows audio input
  ↓
Tap "Stop" (or audio stops)
  ↓
Result: "Great! You held for 17 seconds!"
  • Show goal: "Next goal: 20 seconds"
  • Chart showing improvement
  ↓
Tap "Done" or "Try Again"
```

### Implementation Steps

#### Step 2.1: Create Timer Component (1.5 hours)
#### Step 2.2: Add Audio Detection (1 hour)
#### Step 2.3: Create Results Screen (1 hour)
#### Step 2.4: Add Progress Tracking (1 hour)
#### Step 2.5: Integration & Testing (1 hour)

**Total**: ~5.5 hours

---

## Feature #3: Guided Session Engine

### Goal
Build system that auto-progresses through multiple exercises.

### Why Third?
- Combines Features #1 and #2
- Introduces session concept
- Foundation for complete workouts
- Tests multi-step flow

### What to Build

**Engine**: `GuidedSessionEngine.ts`

**Functionality**:
1. Load session definition (list of steps)
2. Auto-progress through steps
3. Track progress (step X of Y)
4. Pass data between steps
5. Complete session with results

**User Flow**:
```
Tap "Start Beginner Workout"
  ↓
Session Starts
  ↓
Step 1: Farinelli Breathing (4 min)
  ↓
[Auto-advance]
  ↓
Step 2: S-Sound Hold (2 min)
  ↓
[Auto-advance]
  ↓
... (more steps)
  ↓
Session Complete!
  • Show all results
  • Celebration
```

### Implementation Steps

#### Step 3.1: Define Session Data Structure (1 hour)
#### Step 3.2: Build Session Engine (2 hours)
#### Step 3.3: Create Session Progress UI (1.5 hours)
#### Step 3.4: Integration & Testing (1.5 hours)

**Total**: ~6 hours

---

## Feature #4: Complete First Workout

### Goal
Build complete 10-minute beginner workout (simplified version).

### Why Fourth?
- Integrates all previous features
- Creates end-to-end experience
- Validates session engine
- Gives users complete value

### What to Build

**Workout**: "Beginner Quick Workout" (10 minutes)
1. Farinelli Breathing (4 min) [Feature #1]
2. S-Sound Hold (2 min) [Feature #2]
3. Lip Trills (2 min) [NEW - simple timer]
4. Humming (2 min) [NEW - with piano reference]

### Implementation Steps

#### Step 4.1: Build Lip Trill Exercise (1 hour)
#### Step 4.2: Build Humming Exercise (1.5 hours)
#### Step 4.3: Assemble Complete Workout (1 hour)
#### Step 4.4: End-to-End Testing (1.5 hours)

**Total**: ~5 hours

---

## Feature #5: Fix Pitch Detection

### Goal
Make pitch detection actually work for humming/singing exercises.

### Why Last?
- Most complex feature
- Depends on other features working
- Requires real device testing
- Can iterate on accuracy

### What to Fix

**Current Problem**: Uses simulated data (440Hz)

**What to Implement**:
1. expo-av Recording API integration
2. PCM audio data extraction
3. YIN algorithm integration (already exists!)
4. Real-time frequency detection
5. Accuracy calculation

### Implementation Steps

#### Step 5.1: Research expo-av Recording (1 hour)
#### Step 5.2: Implement Audio Capture (2 hours)
#### Step 5.3: Integrate YIN Algorithm (2 hours)
#### Step 5.4: Test & Calibrate (2 hours)
#### Step 5.5: Refine Accuracy (2 hours)

**Total**: ~9 hours

---

## Summary Timeline

| Feature | Time Estimate | Test Time | Total |
|---------|---------------|-----------|-------|
| Feature #1: Farinelli Breathing | 4 hours | 1 hour | 5 hours |
| Feature #2: S-Sound Timer | 5.5 hours | 1.5 hours | 7 hours |
| Feature #3: Session Engine | 6 hours | 1.5 hours | 7.5 hours |
| Feature #4: Complete Workout | 5 hours | 1.5 hours | 6.5 hours |
| Feature #5: Pitch Detection | 9 hours | 2 hours | 11 hours |
| **TOTAL** | **29.5 hours** | **7.5 hours** | **37 hours** |

**At 4 hours/day**: 9-10 days
**At 6 hours/day**: 6-7 days
**At 8 hours/day**: 4-5 days

---

## Next Step: Feature #1

**Ready to implement**: Farinelli Breathing Exercise

**Implementation order**:
1. Create data model (30 min)
2. Build BreathingCircle component (1 hour)
3. Build FarinelliBreathingScreen (2 hours)
4. Add entry point in App (30 min)
5. Test on iPhone (1 hour)

**Total**: 5 hours for Feature #1

**After completion**: Test thoroughly, document results, get user feedback, then proceed to Feature #2.

---

**Should I start implementing Feature #1 now?** 🎯
