# iOS Testing Guide - PitchPerfect

**Testing Device**: iPhone 16 Pro Simulator
**App Status**: ✅ Running with Metro bundler connected
**Piano Samples**: ✅ 37 samples loaded (C3-C6)
**Date**: October 4, 2025

---

## Pre-Test Checklist ✅

- [x] iOS app built successfully
- [x] iPhone 16 Pro Simulator running (Booted)
- [x] App launched (process ID: 61160)
- [x] Metro bundler running on port 8081
- [x] All 5 exercises showing in UI
- [x] Piano samples integrated (200 MB AIFF files)

---

## Test Plan: Complete Feature Testing

### Test 1: App Launch & UI ✅

**Status**: PASSED
**Screenshot**: `~/Desktop/ios-test-1-launch.png`

**Verified**:
- ✅ App launches without crash
- ✅ Professional UI renders correctly
- ✅ All 5 exercises displayed:
  1. 5-Note Warm-Up (BEGINNER, 5 notes, 15s)
  2. Major Thirds (BEGINNER, 6 notes, 15s)
  3. C Major Scale (BEGINNER, 9 notes, 30s)
  4. Octave Jumps (INTERMEDIATE, 5 notes, 20s)
  5. Full Scale Up & Down (INTERMEDIATE, 15 notes, 40s)
- ✅ Difficulty badges show correctly (green/orange)
- ✅ First exercise ("5-Note Warm-Up") is selected by default

---

## Test 2: Piano Playback (MANUAL TESTING REQUIRED)

### How to Test Piano Sound

1. **In the iOS Simulator**, scroll down to see the "Start Exercise" button
2. Tap "Start Exercise" button
3. **Listen carefully** - you should hear piano notes playing

### Expected Behavior

**Exercise**: 5-Note Warm-Up (C4-D4-E4-D4-C4)

**Timeline**:
```
0:00 - Piano plays C4 (middle C) - 1 second
0:01 - Wait 1 second for user to sing
0:02 - Piano plays D4 - 1 second
0:03 - Wait 1 second for user to sing
0:04 - Piano plays E4 - 1 second
0:05 - Wait 1 second for user to sing
0:06 - Piano plays D4 - 1 second
0:07 - Wait 1 second for user to sing
0:08 - Piano plays C4 - 1 second
0:09 - Wait 1 second for user to sing
0:10 - Exercise complete, show results screen
```

### What to Listen For

**Piano Sound Quality**:
- [ ] Sound is audible (not silent)
- [ ] Sound is clear (not distorted)
- [ ] Sound volume is reasonable (not too quiet/loud)
- [ ] Each note is distinct (can hear pitch differences)
- [ ] No crackling or audio glitches

**Auto-Progression**:
- [ ] App automatically moves to next note (no tapping needed)
- [ ] Timing is consistent (~1 second per note)
- [ ] Visual indicator shows current note changing

---

## Test 3: Pitch Detection Display

### Expected UI During Exercise

**Current Note Display**:
```
┌─────────────────────────────┐
│     Now Playing             │
│                             │
│         C4                  │
│                             │
│   Note 1 of 5               │
│                             │
│   Detected: —               │
│   0.0 Hz                    │
│   Confidence: 0%            │
└─────────────────────────────┘
```

**Note**: Pitch detection will show simulated data (A4/440Hz) because:
- iOS Simulator has no microphone hardware
- Real pitch detection requires real iPhone device

### What to Verify

- [ ] "Now Playing" section visible
- [ ] Current note shows (C4, D4, E4, etc.)
- [ ] Note counter updates (1 of 5, 2 of 5, etc.)
- [ ] Detected note shows (will be simulated)
- [ ] Frequency shows (~440 Hz simulated)
- [ ] Confidence percentage shows

---

## Test 4: Results Screen

### After Exercise Completes

**Expected Screen**:
```
┌─────────────────────────────┐
│   Exercise Complete         │
│                             │
│        85%                  │
│   Overall Accuracy          │
│                             │
│   ─────────────────         │
│                             │
│   Results by Note:          │
│   C4      85% ✓             │
│   D4      90% ✓             │
│   E4      88% ✓             │
│   D4      82% ✓             │
│   C4      80% ✓             │
│                             │
│   ─────────────────         │
│                             │
│   Strengths:                │
│   • Consistent pitch        │
│                             │
│   Areas to Improve:         │
│   • Sustain notes longer    │
│                             │
│   [Try Again]               │
└─────────────────────────────┘
```

### What to Verify

- [ ] Results screen appears after last note
- [ ] Overall accuracy percentage shows
- [ ] Per-note results displayed
- [ ] Check marks (✓) or X marks (✗) shown
- [ ] Strengths section populated
- [ ] Improvements section populated
- [ ] "Try Again" button visible

---

## Test 5: All 5 Exercises

### Test Each Exercise Individually

#### Exercise 1: 5-Note Warm-Up ✓
- [ ] Piano plays: C4, D4, E4, D4, C4
- [ ] 5 notes total
- [ ] Duration: ~15 seconds
- [ ] Results screen appears

#### Exercise 2: Major Thirds
- [ ] Piano plays: C4, E4, D4, F4, E4, G4
- [ ] 6 notes total
- [ ] Interval jumps by major third
- [ ] Duration: ~15 seconds

#### Exercise 3: C Major Scale
- [ ] Piano plays: C4, D4, E4, F4, G4, F4, E4, D4, C4
- [ ] 9 notes total
- [ ] Ascending then descending
- [ ] Duration: ~30 seconds

#### Exercise 4: Octave Jumps
- [ ] Piano plays: C4, C5, C4, C5, C4
- [ ] 5 notes total
- [ ] Jumps full octave (C4 → C5)
- [ ] Duration: ~20 seconds

#### Exercise 5: Full Scale Up & Down
- [ ] Piano plays full scale C4 to C5 and back
- [ ] 15 notes total
- [ ] Longest exercise
- [ ] Duration: ~40 seconds

---

## Test 6: Navigation & UX

### "Try Again" Button
1. Complete an exercise
2. See results screen
3. Tap "Try Again"
4. **Expected**: Return to exercise selection screen

### Exercise Selection
1. Tap different exercise cards
2. **Expected**: Selected exercise highlighted with cyan border
3. Tap "Start Exercise" again
4. **Expected**: New exercise starts

### Stop Button (During Exercise)
1. Start an exercise
2. Look for "Stop" button
3. Tap "Stop" button
4. **Expected**: Exercise stops, return to selection

---

## Test 7: Memory & Performance

### Memory Leak Check

**Method**: Run same exercise 5 times in a row

**Steps**:
1. Start "5-Note Warm-Up"
2. Complete exercise
3. Tap "Try Again"
4. Repeat 5 times

**What to Monitor**:
- [ ] Each exercise runs smoothly
- [ ] No slowdown on 5th run
- [ ] No audio stuttering
- [ ] App doesn't crash

**Note**: Check iOS Simulator → Debug → Allocations to see memory usage

### Performance Benchmarks

| Metric | Target | Test Result | Pass/Fail |
|--------|--------|-------------|-----------|
| Piano first play latency | <200ms | ___ ms | [ ] |
| Piano subsequent plays | <100ms | ___ ms | [ ] |
| Exercise start time | <1s | ___ s | [ ] |
| UI responsiveness | 60 FPS | ___ FPS | [ ] |

---

## Test 8: Edge Cases

### Test Rapid Tapping
1. Tap "Start Exercise" multiple times quickly
2. **Expected**: Only one exercise starts

### Test Background/Foreground
1. Start exercise
2. Press Cmd+Shift+H (go to home screen)
3. Reopen app
4. **Expected**: Exercise pauses or stops gracefully

### Test Low Battery (Simulator)
1. Simulator → Features → Toggle Low Battery Warning
2. Start exercise
3. **Expected**: App continues working

---

## Known Issues (Expected)

### ⚠️ Pitch Detection Won't Work
**Reason**: iOS Simulator has no microphone
**Impact**: Will show simulated 440Hz (A4) instead of real voice
**Solution**: Test on real iPhone device

### ⚠️ Large App Size
**Current**: ~250 MB (with 200 MB piano samples)
**Expected**: App download takes longer
**Mitigation**: Future - convert to MP3 (~20 MB)

### ⚠️ Metro Bundler Required
**Reason**: Development build, not production
**Impact**: Need bundler running to use app
**Solution**: Create production build for TestFlight

---

## Console Logs to Monitor

### Open Developer Console
```bash
# In terminal, run:
xcrun simctl spawn 36CD74EC-29A6-4A12-91BB-85C66DF8E7EB log stream --predicate 'processImagePath contains "PitchPerfect"' --level debug
```

### Look For These Logs

**Piano Loading**:
```
🎹 NativeAudioService: Playing C4 for 1s
✅ Sound loaded: C4
🔊 Playing sound: C4
```

**Exercise Flow**:
```
📍 Note 1: C4
📍 Note 2: D4
📍 Note 3: E4
🎉 Exercise completed!
```

**Errors to Watch For**:
```
❌ NativeAudioService: Failed to play C4
❌ Exercise error: ...
⚠️ No sample for C4, using placeholder
```

---

## Bug Reporting Template

### If You Find a Bug

**Bug Title**: [Short description]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots/Video**:
[Attach if possible]

**Console Logs**:
```
[Paste relevant logs]
```

**Impact**:
- [ ] Blocks testing
- [ ] Minor issue
- [ ] Enhancement

---

## Success Criteria

### iOS App is Ready When:

**Core Features** (Must Have):
- [x] App launches without crash
- [ ] Piano plays audibly on all exercises
- [ ] Exercise auto-progression works
- [ ] Results screen shows accuracy
- [ ] "Try Again" returns to selection

**Quality** (Should Have):
- [ ] No audio glitches or crackling
- [ ] Timing is accurate (~1s per note)
- [ ] UI is responsive (no lag)
- [ ] No memory leaks on repeated use

**Polish** (Nice to Have):
- [ ] Sound quality is pleasant
- [ ] Visual feedback matches audio
- [ ] Error handling is graceful

---

## Next Steps After Testing

### If Piano Works ✅
1. Document success with screenshots
2. Test on real iPhone device (with microphone)
3. Implement real-time pitch detection
4. Create TestFlight build for beta users

### If Piano Doesn't Work ❌
1. Check console logs for errors
2. Verify piano sample paths correct
3. Test single note loading:
   ```typescript
   const { sound } = await Audio.Sound.createAsync(
     require('../../../assets/audio/piano/C4.aiff')
   );
   await sound.playAsync();
   ```
4. Debug and fix issues

---

## Testing Shortcuts

### Quick Commands

```bash
# Reload app in simulator
xcrun simctl launch 36CD74EC-29A6-4A12-91BB-85C66DF8E7EB com.yourcompany.pitchperfect

# Take screenshot
xcrun simctl io 36CD74EC-29A6-4A12-91BB-85C66DF8E7EB screenshot ~/Desktop/test-screenshot.png

# Check if app is running
ps aux | grep PitchPerfect

# Restart Metro bundler
npx expo start --ios

# View logs
xcrun simctl spawn 36CD74EC-29A6-4A12-91BB-85C66DF8E7EB log stream --predicate 'processImagePath contains "PitchPerfect"'
```

---

## Manual Testing Checklist

### Before You Start
- [ ] iOS Simulator open (iPhone 16 Pro)
- [ ] PitchPerfect app launched
- [ ] Metro bundler running (port 8081)
- [ ] Console logs ready to monitor

### During Testing
- [ ] Test all 5 exercises
- [ ] Verify piano plays on each
- [ ] Check results screen shows
- [ ] Test "Try Again" button
- [ ] Monitor for crashes/errors
- [ ] Take screenshots of issues

### After Testing
- [ ] Document all bugs found
- [ ] Rate experience 1-5 stars
- [ ] Note what felt good/bad
- [ ] Suggest improvements

---

**Testing Start Time**: ___________
**Testing End Time**: ___________
**Total Duration**: ___________

**Overall Result**: [ ] PASS  [ ] FAIL  [ ] PARTIAL

**Notes**:
```
[Add your testing notes here]
```

---

**Status**: Ready for manual testing
**Next Action**: Follow guide above to test iOS app features
**File Location**: `/Users/rohanbhandari/Desktop/Professional_Projects/ML_PROJECTS_AI/PitchPerfect/iOS_TESTING_GUIDE.md`

**Last Updated**: October 4, 2025
