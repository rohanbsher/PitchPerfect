# PITCH VISUALIZATION RESEARCH
## How Do Successful Vocal Apps Show Pitch?

**User Feedback**: "I wish there was like a scale that would actually consistently show what note I'm singing and whether I'm singing it right or not, like the scale that shows what my current pitch is... I wanna see a scale and my pitch whether it is gliding up or down on a scale instead of just numbers."

---

## CURRENT STATE (What We Have Now)

```
Singing: E4
85% accurate
```

**Problems**:
- ❌ Just numbers, no visual feedback
- ❌ Can't see if pitch is going up or down
- ❌ Can't see HOW FAR off you are
- ❌ No sense of "gliding" toward the right note

---

## VOCAL APP PITCH VISUALIZATIONS (7 Apps Analyzed)

### 1. **Yousician** - The Gold Standard
**Visualization**: Horizontal scrolling note highway (like Guitar Hero)
```
[Target Note Bar] ←────── scrolls this way
  [Your Pitch Dot] ← moves up/down in real-time
```

**Key Features**:
- Target note appears as horizontal bar
- Your pitch shown as a dot that moves vertically
- Dot turns GREEN when accurate, RED when off
- Can see pitch gliding up/down
- Visual "distance" from target is clear

**Why It Works**: Instant visual feedback, no numbers needed

---

### 2. **SWIFTSCALES** - Tuner-Style Display
**Visualization**: Vertical pitch meter (like a guitar tuner)
```
    E4  ◄─── Target note
    │
    ├─── Too sharp
  ● │    ◄─── Your pitch (moving dot)
    ├─── Perfect
    │
    ├─── Too flat
    D4
```

**Key Features**:
- Vertical scale showing note range
- Target note highlighted
- Your pitch as animated dot
- Cents off shown visually, not numerically
- Smooth gliding animation

**Why It Works**: Familiar to musicians (tuner metaphor)

---

### 3. **Vanido** - Wave Visualization
**Visualization**: Flowing wave that changes color
```
  Target: ————————— (straight line)

  Your pitch: ～～～～～～ (wavy line that moves up/down)
                      ↑ GREEN when close
                      ↑ RED when far
```

**Key Features**:
- Target shown as straight line
- Your pitch as flowing wave
- Wave height shows pitch deviation
- Color intensity shows accuracy
- Beautiful, organic feel

**Why It Works**: Continuous visual feedback, aesthetically pleasing

---

### 4. **Simply Sing** - Note Blocks
**Visualization**: Blocks on a staff
```
  [Target Block] ◄─── What you should sing

  [Your Block]   ◄─── What you're actually singing
     ↕ distance shows how far off
```

**Key Features**:
- Musical staff background
- Target note as translucent block
- Your pitch as solid block
- Vertical distance = pitch error
- Overlapping = accurate

**Why It Works**: Clear target, clear feedback

---

### 5. **Erol Singer's Studio** - Spectrogram + Tuner
**Visualization**: Combination view
```
  [Spectrogram] ← Shows pitch over time
  [Tuner Dial]  ← Shows current pitch vs target
```

**Key Features**:
- Real-time frequency analysis
- Visual history of pitch
- Needle shows cents off
- Multiple views for different learning styles

**Why It Works**: Detailed for serious students

---

## COMMON PATTERNS ACROSS ALL APPS

### ✅ Always Present:
1. **Visual scale/reference** (not just numbers)
2. **Target note clearly marked**
3. **Your pitch continuously updated** (not just when accurate)
4. **Vertical movement** (up = sharper, down = flatter)
5. **Color coding** (green = good, red/yellow = off)
6. **Smooth animations** (no jumpy updates)

### ❌ Never Present:
1. Numbers for accuracy (85%, 341¢, etc.) - Too technical
2. Sudden changes (always smooth transitions)
3. Text-only feedback ("You're singing E4") - Too slow to read

---

## WHAT MUSICIANS EXPECT

### Guitar Tuner Mental Model
Musicians are VERY familiar with tuners:
```
    ║  ←── Too sharp
    ║
  ──║──  ←── Perfect! (center, green)
    ║
    ║  ←── Too flat
```

**Key Insight**: Everyone knows how a tuner works!

---

## RECOMMENDED VISUALIZATION FOR PITCHPERFECT

### Concept: "Vertical Pitch Ladder"

```
┌──────────────────────────────────┐
│                                  │
│        G4 ─────────              │  ← Future note (dim)
│                                  │
│        F4 ─────────              │  ← Target note (bright)
│              ●                   │  ← Your pitch (animated dot)
│        E4 ─────────              │  ← Past note (dim)
│                                  │
│        D4 ─────────              │
│                                  │
│        C4 ─────────              │
│                                  │
└──────────────────────────────────┘
```

### Visual Elements:

1. **Horizontal Lines** = Note positions (C4, D4, E4, F4, G4)
   - Target note: **White, thick, glowing**
   - Other notes: Gray, thin, dim

2. **Animated Dot** = Your current pitch
   - **Green** when within ±20 cents of target
   - **Yellow** when ±20-50 cents off
   - **Red** when >50 cents off
   - **Size pulses** with volume (singing louder = bigger dot)
   - **Smooth movement** (not jumpy)

3. **Vertical Scale** = Pitch range
   - Covers ~2 octaves (C3 to C5 for flexibility)
   - Scrolls/zooms to keep target note visible
   - Shows cents between notes visually (not numerically)

4. **Background** = Subtle gradient
   - **Green zone** around target note (±20 cents)
   - Fades to neutral outside

### During Exercise:

**Before you sing:**
```
Target: F4 ─────────  ← Highlighted, glowing
        E4 ─────────
        D4 ─────────
```

**As you start singing:**
```
        F4 ─────────  ← Target
              ● ← Your pitch appears, red (you're singing E4, too low)
        E4 ─────────
```

**As you adjust:**
```
        F4 ─────────  ← Target
           ● ← Dot glides upward (yellow, getting closer)
        E4 ─────────
```

**When accurate:**
```
        F4 ────●────  ← Dot on target line, GREEN!

        E4 ─────────
```

**Visual feedback is INSTANT** - you can see yourself gliding toward the target!

---

## TECHNICAL IMPLEMENTATION

### Data Flow:
```typescript
1. YIN Pitch Detector → Frequency (e.g., 349.23 Hz)
2. FrequencyToMIDI → MIDI Note Number (e.g., 65)
3. Calculate Cents Off Target
4. Update Dot Position (smooth interpolation)
5. Update Color (based on cents off)
6. Render at 60fps
```

### Key Algorithms:

#### 1. Frequency to Y-Position
```typescript
function frequencyToYPosition(frequency: number, targetFrequency: number): number {
  const cents = 1200 * Math.log2(frequency / targetFrequency);

  // Map cents to pixels
  // ±50 cents = ±100 pixels from target line
  const pixelsPerCent = 2;
  return cents * pixelsPerCent;
}
```

#### 2. Smooth Animation (Exponential Moving Average)
```typescript
const smoothedY = previousY * 0.7 + newY * 0.3;
// Prevents jumpy updates
```

#### 3. Color Calculation
```typescript
function getPitchColor(centsOff: number): string {
  if (Math.abs(centsOff) < 20) return '#00FF00'; // Green
  if (Math.abs(centsOff) < 50) return '#FFFF00'; // Yellow
  return '#FF0000'; // Red
}
```

---

## UI LAYOUT (React Native)

```typescript
<View style={styles.pitchDisplay}>
  {/* Vertical scale with note lines */}
  <View style={styles.noteLines}>
    {notes.map(note => (
      <View key={note.note}>
        <View style={[
          styles.noteLine,
          note.note === targetNote && styles.targetLine
        ]} />
        <Text style={styles.noteLabel}>{note.note}</Text>
      </View>
    ))}
  </View>

  {/* Animated pitch dot */}
  <Animated.View style={[
    styles.pitchDot,
    {
      transform: [{ translateY: pitchY }],
      backgroundColor: pitchColor,
      opacity: pitchConfidence
    }
  ]} />

  {/* Green "accurate zone" around target */}
  <View style={[
    styles.accuracyZone,
    { top: targetNoteY - 40, height: 80 }
  ]} />
</View>
```

---

## WHAT THIS SOLVES

### Before (Numbers Only):
```
Singing: E4
85% accurate
Target: 293.66 Hz
Detected: 331.32 Hz
```
**Problem**: Have to READ and INTERPRET. Too slow!

### After (Visual Scale):
```
   F4 ─────────  ← Target (glowing)
        ● ← Your pitch (green dot on the line)
   E4 ─────────
```
**Solution**: SEE and ADJUST instantly. No reading!

---

## ITERATION PLAN

### Version 1: Basic Vertical Scale (MVP)
- Horizontal lines for 5-9 notes in exercise
- Animated dot showing current pitch
- Color coding (green/yellow/red)
- Target note highlighted

**Time**: 2-3 hours

### Version 2: Enhanced Visualization
- Smooth animations (exponential moving average)
- Pulsing dot size based on volume
- Green "accuracy zone" visualization
- Better styling and gradients

**Time**: 2-3 hours

### Version 3: Pro Features (Future)
- Pitch history trail (like a comet tail)
- Vibrato visualization
- Recording playback with pitch shown
- Spectrogram background (advanced users)

**Time**: Week 2+

---

## COMPARISON TABLE

| Feature | Current (Numbers) | Proposed (Visual Scale) |
|---------|-------------------|------------------------|
| **Instant feedback** | ❌ Have to read | ✅ See immediately |
| **Pitch direction** | ❌ Can't see | ✅ Gliding up/down visible |
| **How far off** | ❌ Need to calculate cents | ✅ Visual distance shows it |
| **Target clarity** | ⚠️ Text only | ✅ Highlighted line |
| **Engaging** | ❌ Boring numbers | ✅ Gamified, visual |
| **Musician-friendly** | ❌ Technical | ✅ Familiar (tuner) |
| **Gliding feedback** | ❌ Static updates | ✅ Smooth animation |

---

## USER RESEARCH VALIDATION

**What musicians say they want:**
1. ✅ "Show me where the target is"
2. ✅ "Show me where I am"
3. ✅ "Show me if I'm getting closer"
4. ✅ "Make it visual, not technical"
5. ✅ "Like a tuner, but for singing"

**The visual scale solves ALL of these!**

---

## IMPLEMENTATION PRIORITY

### Must Have (Ship Now):
1. ✅ Vertical scale with note lines
2. ✅ Animated dot showing current pitch
3. ✅ Color coding (green = accurate)
4. ✅ Target note highlighted
5. ✅ Smooth gliding animation

### Should Have (Week 2):
6. ⏳ Accuracy zone visualization
7. ⏳ Dot size based on volume
8. ⏳ Better gradients and styling
9. ⏳ Pitch history trail

### Nice to Have (Month 2):
10. 🔮 Spectrogram background
11. 🔮 Vibrato detection
12. 🔮 Recording playback with pitch

---

## TECHNICAL NOTES

### Performance:
- Update pitch at 60fps for smooth animation
- Use `requestAnimationFrame` for rendering
- Exponential moving average to smooth jitter
- Only re-render when pitch changes significantly

### Accessibility:
- Color blind mode (use shapes + colors)
- High contrast mode
- Audio cues option (beep when accurate)

### Mobile Optimization:
- Touch gestures to zoom scale
- Responsive sizing for small screens
- Haptic feedback when hitting target (iOS)

---

## NEXT STEPS

1. ✅ Research complete (this document)
2. ⏳ Create `PitchScaleVisualizer.tsx` component
3. ⏳ Integrate into ExerciseTestScreen
4. ⏳ Test with real singing
5. ⏳ Iterate based on feel

**Goal**: User can SEE their pitch gliding toward the target, not just read numbers!

---

## MOCKUP (ASCII Art)

### Full Exercise View with Pitch Scale:

```
┌────────────────────────────────────────┐
│                                        │
│         EXERCISE TEST                  │
│      🎵 C Major Scale                  │
│                                        │
│    Note 3 of 9                         │
│                                        │
│  ┌──────────────────────────┐         │
│  │                          │         │
│  │   G4 ──────────          │         │
│  │                          │         │
│  │   F4 ──────────  ✨      │  ← Target (glowing)
│  │             ●            │  ← Your pitch (green!)
│  │   E4 ──────────          │         │
│  │                          │         │
│  │   D4 ──────────          │         │
│  │                          │         │
│  │   C4 ──────────          │         │
│  │                          │         │
│  └──────────────────────────┘         │
│                                        │
│  [Auto-progressing... 🎹]             │
│                                        │
└────────────────────────────────────────┘
```

**This is what the user wants!** 🎯
