# Breathing Exercise Implementation Plan

## Current State

We have 3 breathing exercises defined in data:
1. **Diaphragmatic Breathing** (Beginner, 90s, 6 rounds, 5-0-5 pattern)
2. **Box Breathing** (Beginner, 64s, 4 rounds, 4-4-4-4 pattern)
3. **Farinelli Breathing** (Intermediate, 120s, 4 rounds, progressive 5-5-5 to 8-8-8)

**Current issue:** When user taps START on a breathing exercise, they get: `alert('Breathing exercises coming soon!')`

---

## Why Breathing Exercises Matter

**Vocal pedagogy research:**
> "80% of vocal problems are breathing-related. Without proper breath support, everything else falls apart."

**Value for our app:**
- **Session Flow Mode** starts with Diaphragmatic Breathing
- Users hitting alert immediately = terrible UX
- This is the FOUNDATION exercise - must work perfectly

---

## Design Philosophy (Jobs/Ive Approach)

### What would Jobs say?
> "The breathing visualization should be so intuitive that you don't need to think. You just look at it and your body knows what to do."

### What would Ive say?
> "The animation should feel like breathing itself - organic, fluid, calming. Not mechanical."

### Key Principles:
1. **Visual over text** - Show, don't tell
2. **Rhythm as feedback** - The animation IS the instruction
3. **Calm and focused** - No clutter, no distraction
4. **Progress visibility** - Clear indication of rounds completed

---

## UX Design

### Screen Layout

```
┌─────────────────────────────────┐
│ Diaphragmatic Breathing         │ ← Title
│ Round 2 of 6                    │ ← Progress
├─────────────────────────────────┤
│                                 │
│                                 │
│         ◯                       │ ← Animated circle
│        ╱ ╲                      │   (expands/contracts)
│       ╱   ╲                     │
│      ╱     ╲                    │
│     ╱       ╲                   │
│    ╱         ╲                  │
│   ╱           ╲                 │
│  ╱             ╲                │
│ ╱               ╲               │
│╱                 ╲              │
│                                 │
│                                 │
│      INHALE                     │ ← Current phase (large text)
│      3...                       │ ← Countdown
│                                 │
├─────────────────────────────────┤
│ [████████░░░░] 50%              │ ← Overall progress bar
│                                 │
│ [⏹ End Exercise]                │ ← Stop button
└─────────────────────────────────┘
```

### Animation States

**1. INHALE (5 seconds)**
- Circle expands from small to large
- Text: "INHALE" + countdown "5... 4... 3... 2... 1..."
- Color: Gradient blue (calming)
- Breathing cue sound (optional)

**2. HOLD (0 seconds for diaphragmatic)**
- Circle stays at max size
- Text: "HOLD" + countdown
- Color: Gradient purple
- (Skipped if holdBeats = 0)

**3. EXHALE (5 seconds)**
- Circle contracts from large to small
- Text: "EXHALE" + countdown "5... 4... 3... 2... 1..."
- Color: Gradient green (releasing)

**4. TRANSITION (1 second)**
- Circle pulses briefly
- Text: "Ready..." or "Next round..."
- Prepare for next cycle

### Visual Feedback

**Circle Size:**
- Min: 60px diameter
- Max: 240px diameter (4x expansion)
- Smooth easing (not linear)

**Text:**
- Phase name: Large, bold, centered
- Countdown: Huge numbers (80px), ticking down
- Round indicator: Small, top of screen

**Colors:**
- Inhale: Blue (#3B82F6) → Light Blue (#60A5FA)
- Hold: Purple (#8B5CF6) → Light Purple (#A78BFA)
- Exhale: Green (#10B981) → Light Green (#34D399)

**Sound (Optional):**
- Gentle chime at phase transitions
- Can be muted in settings

---

## Technical Implementation

### 1. BreathingEngine Class

**Purpose:** Execute breathing exercise logic (like ExerciseEngineV2 for vocal exercises)

**Key Methods:**
```typescript
class BreathingEngine {
  private exercise: Exercise;
  private currentRound: number = 0;
  private currentPhase: 'inhale' | 'hold' | 'exhale' | 'transition' = 'inhale';
  private phaseTimeRemaining: number = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(exercise: Exercise) {
    this.exercise = exercise;
  }

  start(): void {
    // Begin first round, first phase
    this.currentRound = 0;
    this.startPhase('inhale');
  }

  private startPhase(phase: 'inhale' | 'hold' | 'exhale' | 'transition'): void {
    this.currentPhase = phase;
    const round = this.exercise.breathingRounds![this.currentRound];

    switch (phase) {
      case 'inhale':
        this.phaseTimeRemaining = round.inhaleBeats;
        break;
      case 'hold':
        if (round.holdBeats === 0) {
          // Skip hold phase
          this.startPhase('exhale');
          return;
        }
        this.phaseTimeRemaining = round.holdBeats;
        break;
      case 'exhale':
        this.phaseTimeRemaining = round.exhaleBeats;
        break;
      case 'transition':
        this.phaseTimeRemaining = 1;
        break;
    }

    this.onPhaseChange?.(phase, this.phaseTimeRemaining, this.currentRound);
    this.tick();
  }

  private tick(): void {
    this.timer = setTimeout(() => {
      this.phaseTimeRemaining -= 1;

      this.onTick?.(this.currentPhase, this.phaseTimeRemaining, this.currentRound);

      if (this.phaseTimeRemaining <= 0) {
        this.advancePhase();
      } else {
        this.tick();
      }
    }, 1000);
  }

  private advancePhase(): void {
    const round = this.exercise.breathingRounds![this.currentRound];

    if (this.currentPhase === 'inhale') {
      this.startPhase('hold');
    } else if (this.currentPhase === 'hold') {
      this.startPhase('exhale');
    } else if (this.currentPhase === 'exhale') {
      // Check if more rounds
      if (this.currentRound < this.exercise.breathingRounds!.length - 1) {
        this.currentRound += 1;
        this.startPhase('transition');
      } else {
        // Exercise complete
        this.onComplete?.();
      }
    } else if (this.currentPhase === 'transition') {
      this.startPhase('inhale');
    }
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Callbacks
  onPhaseChange?: (phase: string, duration: number, round: number) => void;
  onTick?: (phase: string, timeRemaining: number, round: number) => void;
  onComplete?: () => void;
}
```

### 2. BreathingVisualizer Component

**Purpose:** Animated circle that expands/contracts with breathing

```typescript
interface BreathingVisualizerProps {
  phase: 'inhale' | 'hold' | 'exhale' | 'transition';
  progress: number; // 0-1 (percentage through phase)
  timeRemaining: number;
}

export const BreathingVisualizer: React.FC<BreathingVisualizerProps> = ({
  phase,
  progress,
  timeRemaining,
}) => {
  const circleSize = useRef(new Animated.Value(60)).current;
  const circleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === 'inhale') {
      // Expand circle
      Animated.timing(circleSize, {
        toValue: 240,
        duration: timeRemaining * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else if (phase === 'exhale') {
      // Contract circle
      Animated.timing(circleSize, {
        toValue: 60,
        duration: timeRemaining * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    } else if (phase === 'hold') {
      // Subtle pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(circleOpacity, {
            toValue: 0.8,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(circleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [phase, timeRemaining]);

  const getPhaseColor = () => {
    if (phase === 'inhale') return ['#3B82F6', '#60A5FA']; // Blue
    if (phase === 'hold') return ['#8B5CF6', '#A78BFA']; // Purple
    if (phase === 'exhale') return ['#10B981', '#34D399']; // Green
    return ['#6B7280', '#9CA3AF']; // Gray (transition)
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: 999,
          opacity: circleOpacity,
        }}
      >
        <LinearGradient
          colors={getPhaseColor()}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.textOverlay}>
        <Text style={styles.phaseText}>
          {phase.toUpperCase()}
        </Text>
        <Text style={styles.countdownText}>
          {timeRemaining}
        </Text>
      </View>
    </View>
  );
};
```

### 3. Integration with ExerciseScreenComplete

**Modify the breathing check:**

```typescript
const startExercise = async () => {
  setIsRunning(true);
  setResults(null);

  // BREATHING EXERCISE
  if (selectedExercise.type === 'breathing') {
    console.log('🫁 Starting breathing exercise:', selectedExercise.name);

    const engine = new BreathingEngine(selectedExercise);
    breathingEngineRef.current = engine;

    engine.onPhaseChange = (phase, duration, round) => {
      setBreathingPhase(phase);
      setBreathingTimeRemaining(duration);
      setCurrentRoundIndex(round);
    };

    engine.onTick = (phase, timeRemaining, round) => {
      setBreathingTimeRemaining(timeRemaining);
    };

    engine.onComplete = () => {
      const results: ExerciseResults = {
        exerciseId: selectedExercise.id,
        completedAt: new Date(),
        duration: selectedExercise.duration,
        overallAccuracy: 100, // Breathing exercises are always "100%" (completed)
        noteResults: [],
        strengths: ['Completed all rounds'],
        improvements: [],
      };

      setIsRunning(false);
      setResults(results);

      // Save progress
      saveCompletedExercise(selectedExercise.id, selectedExercise.name, results);
      loadUserProgressData();

      // Flow Mode auto-transition logic (same as vocal exercises)
      if (activeSession && activeSession.isActive) {
        // ... auto-transition code
      }
    };

    engine.start();
    return;
  }

  // VOCAL EXERCISE (existing code)
  // ...
};
```

---

## Implementation Steps

### Step 1: Create BreathingEngine (1 hour)
- File: `src/engines/BreathingEngine.ts`
- Implement timer logic
- Phase transitions (inhale → hold → exhale → transition)
- Round progression
- Callbacks for UI updates

### Step 2: Create BreathingVisualizer Component (1 hour)
- File: `src/components/BreathingVisualizer.tsx`
- Animated circle (expand/contract)
- Phase text + countdown
- Color gradient by phase
- Smooth easing

### Step 3: Integrate with ExerciseScreenComplete (1 hour)
- Add breathing-specific state
- Modify `startExercise()` to handle breathing type
- Add new render section for breathing in-progress
- Wire up callbacks
- Handle Flow Mode auto-transition

### Step 4: Test & Polish (30 min)
- Test all 3 breathing exercises
- Verify timing is accurate
- Check Flow Mode transitions
- Polish animations

**Total: ~3.5 hours**

---

## Expected Results

### User Experience:

**Before:**
```
User: Taps "START SESSION"
App: "Breathing exercises coming soon!"
User: 😞 (Frustrated, app feels incomplete)
```

**After:**
```
User: Taps "START SESSION"
App: Shows Diaphragmatic Breathing
      Animated circle expands/contracts
      "INHALE... 5... 4... 3..."
      "EXHALE... 5... 4... 3..."
User: 😌 (Calming experience, app feels polished)
      Completes breathing → Auto-transitions to vocal warmup
      Stays in flow state
```

### Benefits:

1. **Completes the Flow Mode experience** - No more alerts interrupting sessions
2. **Professional polish** - Shows we care about every detail
3. **Pedagogically correct** - Breathing SHOULD come first in vocal training
4. **Calming UX** - Breathing exercises should feel meditative, not rushed
5. **Reusable system** - Works for all 3 breathing exercises automatically

---

## Alternative: Quick Hack vs Proper Implementation

### Quick Hack (30 min):
- Just show text instructions
- Countdown timer
- No animation
- Works but feels cheap

### Proper Implementation (3.5 hours):
- Animated breathing visualization
- Professional polish
- Meditative experience
- Jobs/Ive would approve

**Recommendation:** Proper implementation. We're building a product that vocal coaches will recommend - it needs to feel premium.

---

## Next Steps

1. Create BreathingEngine class
2. Create BreathingVisualizer component
3. Integrate with ExerciseScreenComplete
4. Test on iPhone
5. Verify Flow Mode works end-to-end

This will complete the core user journey and make the app production-ready for the breathing → warmup → technique flow.
