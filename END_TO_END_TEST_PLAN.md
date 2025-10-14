# End-to-End Test Plan - PitchPerfect App

**Date:** 2025-10-14
**Version:** Post Quick Win 4
**Tester:** User on Physical iPhone
**Estimated Time:** 20-25 minutes

---

## Overview

This document provides a comprehensive testing checklist to validate all core features of the PitchPerfect vocal training app. Each test includes expected results and what to verify.

---

## Pre-Test Setup

### ✅ Environment Check
- [ ] Metro bundler is running (`npx expo start --dev-client --clear`)
- [ ] iPhone is connected to same WiFi network as Mac
- [ ] Expo Dev Client app is installed on iPhone
- [ ] iPhone can access Metro at: `http://192.168.0.5:8081`
- [ ] Metro logs are visible in terminal

### ✅ Fresh Start (Optional but Recommended)
To test streak and progress systems properly:
```bash
# Clear AsyncStorage for fresh test
# In app: Close and reopen to reset
```

---

## Test Suite

## 1. Home Screen UI ✅

**Purpose:** Verify the simplified, guided UX redesign

### Test Steps:
1. Open the app
2. Observe the home screen layout

### Expected Results:
- [ ] **Header** displays at top with profile button
- [ ] **Greeting** shows time-appropriate message (Good morning/afternoon/evening)
- [ ] **JourneyProgress card** appears below greeting
  - Shows "Week 1: Foundation"
  - Shows "Start Week 1" or "X more days this week"
  - Shows 0/3 days (or current progress)
  - Progress bar at top (empty or partially filled)
  - 🎯 emoji visible (or 🔥 if in progress)
- [ ] **HeroCard** shows recommended exercise
  - Label: "Today's Lesson" (not "YOUR PRACTICE FOR TODAY")
  - Exercise name displayed (e.g., "Diaphragmatic Breathing")
  - Metadata: Duration, difficulty badge
  - Single button: "Start Today's Lesson" (not two buttons)
- [ ] **Browse All Exercises** section at bottom
  - Subtle styling (tertiary colors)
  - Shows "Browse All Exercises" with subtext
  - Dots (···) on right side (not arrow)
  - Currently collapsed

### Metro Logs to Check:
```
✅ User progress loaded: {...}
💡 Recommendation: [Exercise Name] - [Reason]
```

---

## 2. Journey Progress Component ✅

**Purpose:** Verify 8-week curriculum tracking

### Test Steps:
1. Tap on JourneyProgress card to observe details
2. Note the week number, title, and focus

### Expected Results:
- [ ] Week badge shows "Week 1" (or current week)
- [ ] Week title: "Foundation" (Week 1) or appropriate title
- [ ] Focus text explains week's goal
- [ ] Right side shows emoji status
- [ ] Days count shows "0/3" (or current progress)
- [ ] Progress bar matches completion percentage

### Validation:
First-time users should see:
- Week 1: Foundation
- 0/3 days
- "Start Week 1" message
- 🎯 emoji

---

## 3. Exercise Preview Screen ✅

**Purpose:** Verify preparation screen before exercise starts

### Test Steps:
1. Tap "Start Today's Lesson" button
2. Observe the Exercise Preview screen
3. Read through the sections
4. Tap "I'm Ready - Start Exercise"

### Expected Results:
- [ ] **Preview screen opens** (doesn't start exercise immediately)
- [ ] Large exercise icon at top (emoji, e.g., 🫁)
- [ ] Exercise name displayed prominently
- [ ] Difficulty badge (BEGINNER/INTERMEDIATE/ADVANCED)
- [ ] Duration shown (~X min)
- [ ] **Three information cards:**
  1. "What You'll Do" - Clear instructions
  2. "Why This Matters" - Motivation
  3. "How to Succeed" - Tips with bullet points
- [ ] Back button works (← Back)
- [ ] Single CTA: "I'm Ready - Start Exercise"

### Metro Logs to Check:
None expected (pure UI screen)

---

## 4. Pre-Exercise Countdown ✅

**Purpose:** Verify 3-2-1 countdown prevents missing first note

### Test Steps:
1. From Preview screen, tap "I'm Ready - Start Exercise"
2. Watch the countdown

### Expected Results:
- [ ] **Full-screen countdown appears**
- [ ] Shows "3" with message "Get ready..."
- [ ] Shows "2" with message "First note: [Note]" (for vocal) or breathing instruction
- [ ] Shows "1" with message "Listen, then sing!" (for vocal)
- [ ] Countdown hint: "🎧 Have your headphones on"
- [ ] After countdown reaches 0, exercise starts automatically

### Timing:
- Each number displays for 1 second
- Total countdown: 3 seconds
- No interaction required (automatic)

---

## 5. Breathing Exercise Complete Flow ✅

**Purpose:** Verify breathing exercises work end-to-end

### Test Steps:
1. From home, start "Diaphragmatic Breathing"
2. Complete the preview and countdown
3. Follow the breathing visualizer
4. Complete at least 1 full round
5. Stop exercise (or let it complete)

### Expected Results:

**During Exercise:**
- [ ] **Breathing visualizer** animates on screen
- [ ] Shows current phase: "INHALE", "EXHALE", "HOLD" (if applicable)
- [ ] Timer counts down for each phase
- [ ] Round counter shows progress (e.g., "Round 1/6")
- [ ] Visual circle/animation expands (inhale) and contracts (exhale)
- [ ] Can tap "Stop Exercise" to end early

**After Completion:**
- [ ] Results screen appears
- [ ] Shows "100% Complete" (breathing exercises always 100%)
- [ ] Celebration confetti animation
- [ ] "What's Next?" card with recommendation
- [ ] Progress text: "You completed all breathing rounds"
- [ ] "Try Again" button works
- [ ] "Back to Home" button works

### Metro Logs to Check:
```
🫁 Starting breathing exercise: Diaphragmatic Breathing
🫁 BreathingEngine: Starting exercise...
🫁 Phase: INHALE, Duration: 5s, Round: 1/6
🫁 Phase: EXHALE, Duration: 5s, Round: 1/6
✅ Round 1/6 complete
...
🎉 Breathing exercise complete!
```

---

## 6. Vocal Exercise with Pitch Detection ✅

**Purpose:** Verify pitch detection accuracy and sample rate fix

### Test Steps:
1. From home, browse exercises and select "5-Note Warm-Up" or "C Major Scale"
2. Complete preview and countdown
3. **IMPORTANT:** Wear headphones
4. Listen to each piano note
5. Sing back the note you hear
6. Complete at least 3 notes
7. Observe real-time pitch feedback

### Expected Results:

**Before Exercise Starts:**
- [ ] Metro logs show sample rate initialization
- [ ] Microphone permission granted

**During Exercise:**
- [ ] **Piano note plays** (hear it through headphones)
- [ ] **Pitch visualizer** shows current target note
- [ ] **Real-time feedback:**
  - Detected note displayed (e.g., "C4", "D4")
  - Detected frequency (e.g., "261.63 Hz")
  - Accuracy percentage (0-100%)
  - Cents off indicator (-50 to +50 cents)
- [ ] **Visual feedback:**
  - Green/yellow/red colors based on accuracy
  - Scale visualization shows target vs detected
  - Note name updates in real-time
- [ ] Current note counter: "Note 1/5", "Note 2/5", etc.
- [ ] Can stop exercise early

**After Completion:**
- [ ] Results screen shows
- [ ] Overall accuracy percentage
- [ ] Progress text: "You hit X out of Y notes accurately"
- [ ] Pitch history graph (visual timeline)
- [ ] Session stats cards (avg accuracy, best note, etc.)
- [ ] Results by note breakdown
- [ ] Strengths and improvements listed
- [ ] "What's Next?" recommendation based on accuracy

### Metro Logs to Check (CRITICAL):
```
🎤 NativeAudioService: Starting microphone capture...
✅ NativeAudioService: Real-time audio capture started {
  "sampleRate": 48000  ⬅️ MUST BE 48000, NOT 44100!
}
📍 Note 1: C4
🎵 Note 1/5: C4
🎹 NativeAudioService: Playing C4 for 0.92s
```

**⚠️ CRITICAL CHECK:**
- Sample rate MUST show **48000 Hz** (not 44100)
- If you see 44100, the sample rate fix isn't working
- Pitch detection will be ~150 cents flat if sample rate is wrong

---

## 7. Results Screen with Storytelling ✅

**Purpose:** Verify enhanced results narrative

### Test Steps:
1. Complete any vocal exercise
2. Observe results screen carefully

### Expected Results:
- [ ] **Celebration title** (varies by accuracy):
  - "Outstanding!" (90-100%)
  - "Great Job!" (70-89%)
  - "Nice Try!" (50-69%)
  - "Keep Practicing!" (<50%)
- [ ] **Confetti animation** (if accuracy > 70%)
- [ ] **Overall score** prominent and large
- [ ] **Progress story:** "You hit X out of Y notes accurately"
- [ ] **Pitch History Graph** (for vocal exercises)
  - Visual timeline of performance
  - Color-coded by accuracy
  - Shows trend over time
- [ ] **Session Stats Cards:**
  - Average Accuracy
  - Best Note
  - Total Readings
  - Time Spent
- [ ] **Results by Note** table
  - Each note listed with accuracy
  - ✓ or ✗ indicator
  - Average accuracy per note
- [ ] **Strengths** section (if any)
- [ ] **Areas to Improve** section (if any)
- [ ] **"What's Next?" card** with smart recommendation:
  - If 85%+: "Ready for: Try an intermediate exercise"
  - If 70-84%: "Practice again: [Exercise Name]"
  - If <70%: "Foundation: Start with Diaphragmatic Breathing"

---

## 8. Browse All Exercises Section ✅

**Purpose:** Verify de-emphasized explore section

### Test Steps:
1. From home screen, scroll to "Browse All Exercises"
2. Tap on the header to expand
3. Browse available exercises
4. Tap an exercise card
5. Collapse section

### Expected Results:

**Collapsed State:**
- [ ] Header shows "Browse All Exercises"
- [ ] Subtext: "View complete exercise library"
- [ ] Dots (···) on right (not arrow)
- [ ] Subtle styling (tertiary colors, smaller text)
- [ ] Doesn't compete with main CTA

**Expanded State:**
- [ ] Two categories visible:
  - "💨 Breathing" section
  - "🎵 Vocal Training" section
- [ ] Exercises shown in 2-column grid
- [ ] Each exercise card shows:
  - Exercise icon (emoji)
  - Exercise name
  - Difficulty badge
  - Duration
- [ ] Tapping exercise opens Preview screen
- [ ] Selected exercise highlighted (border/background)

**Exercise Icons to Verify:**
- 🫁 Diaphragmatic Breathing
- ⏱️ Box Breathing
- 🧘 Farinelli Breathing
- 🎹 C Major Scale
- 🎵 5-Note Warm-Up
- 🦘 Octave Jumps
- 🎯 Major Thirds
- 🎼 Full Scale Up & Down

---

## 9. User Progress Persistence ✅

**Purpose:** Verify AsyncStorage saves/loads correctly

### Test Steps:
1. Complete a breathing exercise
2. Wait for "Saved!" confirmation in logs
3. Close app completely (swipe up in app switcher)
4. Reopen app
5. Check if progress persisted

### Expected Results:

**After Completing Exercise:**
- [ ] Results screen appears
- [ ] Metro logs show save operation

**After Reopening App:**
- [ ] User progress loads successfully
- [ ] JourneyProgress shows updated count (e.g., 1/3 instead of 0/3)
- [ ] Progress bar reflects completion
- [ ] Streak may update if it's a new day
- [ ] "Today's Lesson" may recommend next exercise

### Metro Logs to Check:
```
# After exercise completion:
💾 Saving completed exercise...
✅ Exercise saved: [Exercise Name]

# After reopening app:
✅ User progress loaded: {
  "currentStreak": 1,
  "lastPracticeDate": "2025-10-14",
  ...
}
✅ Loaded 1 completed exercises
```

---

## 10. Streak Tracking ✅

**Purpose:** Verify streak system works across sessions

### Test Steps:
1. Note current streak in header
2. Complete an exercise (if haven't today)
3. Check if streak incremented
4. Close and reopen app
5. Verify streak persists

### Expected Results:

**Initial State:**
- [ ] Header shows "🔥 [Number] day streak"
- [ ] First-time users: "🔥 0 day streak"

**After First Exercise Today:**
- [ ] Streak increments by 1
- [ ] Metro logs confirm streak update
- [ ] Header updates immediately

**After Reopening:**
- [ ] Streak number persists
- [ ] Doesn't reset on app restart

**Edge Cases to Test (Optional):**
- If you practice tomorrow: Streak should continue
- If you skip a day: Streak should reset to 0
- Multiple exercises same day: Streak increments once only

### Metro Logs to Check:
```
✅ User progress loaded: {
  "currentStreak": 1,
  "longestStreak": 1,
  "lastPracticeDate": "2025-10-14"
}
```

---

## 11. Sample Rate Fix Verification ✅

**Purpose:** Verify CRITICAL sample rate bug is fixed

### Test Steps:
1. Start any vocal exercise
2. Monitor Metro logs CAREFULLY
3. Look for sample rate messages

### Expected Results:

**MUST SEE in Metro logs:**
```
🎤 NativeAudioService: Starting microphone capture...
✅ NativeAudioService: Real-time audio capture started {
  "sampleRate": 48000  ⬅️ CRITICAL: Must be 48000!
}
```

**If Sample Rate Fix is Working:**
- [ ] Logs show **48000 Hz** (not 44100)
- [ ] No warning: "⚠️ Sample rate mismatch"
- [ ] Pitch detection is accurate (within ±20 cents)
- [ ] Singing C4 detects ~261.63 Hz

**If Sample Rate Fix is NOT Working:**
- ❌ Logs show 44100 Hz
- ❌ Warning appears: "⚠️ Sample rate mismatch"
- ❌ Pitch detection is ~150 cents flat
- ❌ Singing C4 detects ~240 Hz

**Validation Test:**
- Sing or hum a steady note
- Check detected frequency matches expected
- Example: A4 = 440 Hz (should be within 440 ± 10 Hz)

---

## 12. Visual Polish & Icons ✅

**Purpose:** Verify all visual improvements

### Test Steps:
1. Browse all exercises
2. Check each icon displays
3. Verify design consistency

### Expected Results:
- [ ] All 8 exercises have emoji icons
- [ ] Icons render correctly (not boxes/missing)
- [ ] Colors consistent with design system
- [ ] Typography uses Design System tokens
- [ ] Spacing is consistent
- [ ] Shadows/elevation work
- [ ] Dark mode compatible (if applicable)

---

## Post-Test Summary

### ✅ Success Criteria

Mark each area as PASS/FAIL:

| Feature | Status | Notes |
|---------|--------|-------|
| Home Screen UI | ⬜ | Single CTA, JourneyProgress, subtle browse |
| JourneyProgress Component | ⬜ | Week tracking, progress bar, emoji status |
| Exercise Preview Screen | ⬜ | What/Why/How cards, motivation |
| Pre-Exercise Countdown | ⬜ | 3-2-1, contextual messages |
| Breathing Exercise Flow | ⬜ | Visualizer, phases, completion |
| Vocal Exercise + Pitch Detection | ⬜ | Piano, real-time feedback, accuracy |
| Results Screen Storytelling | ⬜ | Progress text, graph, recommendations |
| Browse All Exercises | ⬜ | Collapsible, icons, grid layout |
| User Progress Persistence | ⬜ | AsyncStorage save/load |
| Streak Tracking | ⬜ | Increments, persists, displays |
| Sample Rate Fix (CRITICAL) | ⬜ | 48000 Hz, accurate pitch detection |
| Visual Polish & Icons | ⬜ | All icons, consistent design |

---

## Known Issues to Monitor

### 1. Sample Rate Bug (Should be Fixed)
- **Symptom:** Pitch detection 150 cents flat
- **Expected:** Should see 48000 Hz in logs
- **Action if broken:** Report immediately

### 2. Recording Not Active Error
- **Symptom:** Red error in Metro logs
- **Expected:** Shouldn't happen during normal flow
- **Action if seen:** Note when it occurs (usually on rapid back/forth)

### 3. Breathing Animation Warnings
- **Symptom:** "Style property 'width' is not supported by native animated module"
- **Expected:** Visual works despite warning
- **Action:** Can ignore if visual looks correct

---

## Test Report Template

After completing all tests, fill out:

```markdown
# Test Report - [Date]

## Environment
- Device: [iPhone model]
- iOS Version: [version]
- App Version: Post Quick Win 4
- Metro Bundler: Running at 192.168.0.5:8081

## Summary
- Total Tests: 12
- Passed: [X]
- Failed: [Y]
- Blocked: [Z]

## Detailed Results

### PASS ✅
- [List passing tests]

### FAIL ❌
- [List failing tests with details]

### BLOCKED ⚠️
- [List blocked tests with reasons]

## Critical Findings

### Sample Rate Fix
- Status: [WORKING / BROKEN]
- Evidence: [Screenshot or log excerpt]

### User Experience
- Navigation: [Smooth / Issues]
- Performance: [Good / Laggy]
- Visual Polish: [Professional / Needs Work]

## Recommendations
1. [Priority fixes needed]
2. [Nice-to-have improvements]
3. [Future enhancements]

## Overall Assessment
[Ready for deployment / Needs fixes / Major issues]
```

---

## Ready for Testing? ✅

**Before you start testing, confirm:**

- [ ] Metro bundler is running
- [ ] iPhone is connected
- [ ] App loads on device
- [ ] You have headphones ready
- [ ] You're in a quiet environment
- [ ] You have 20-25 minutes available

**Metro Bundler Status:**
Run this to confirm: `lsof -i :8081`

If port 8081 is busy, the bundler is running. You should see Metro output in your terminal.

---

## Start Testing!

Begin with Test #1 (Home Screen UI) and work through each section systematically. Take notes on any issues and refer to the expected results for each test.

Good luck! 🎉
