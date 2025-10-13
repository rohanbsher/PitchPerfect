# Implementation Roadmap - PitchPerfect App Redesign
**Based on**: CURRENT_STATE_AUDIT.md + VOCAL_TRAINING_UX_RESEARCH.md
**Goal**: Transform working prototype into App Store-ready product
**Timeline**: 6 weeks

---

## 🎯 Overview

### Current State
- ✅ Core tech works: Pitch detection, playback, exercise engine
- ❌ UX is poor: Confusing navigation, no progress tracking, flat exercise list

### Target State
- ✅ Beginner-friendly onboarding (<3 min to value)
- ✅ Structured practice sessions (guided flow)
- ✅ Progress tracking & motivation (streaks, charts, achievements)
- ✅ Professional polish (navigation, settings, App Store ready)

---

## 📅 Phase Breakdown

### Phase 1: Critical UX Fixes (Week 1-2)
**Goal**: Make app immediately usable and valuable
**Effort**: 40 hours (2 weeks × 20 hrs/week)

### Phase 2: Engagement & Retention (Week 3-4)
**Goal**: Make users want to come back daily
**Effort**: 40 hours

### Phase 3: Growth & Polish (Week 5-6)
**Goal**: Professional quality for App Store
**Effort**: 40 hours

---

# Phase 1: Critical UX Fixes (Week 1-2)

## Week 1 Tasks

### Task 1.1: Fix Exercise Selection UX ⏱️ 6 hours
**Problem**: Start button at bottom, requires scrolling, poor hierarchy

**Changes**:
1. **Floating Action Button**
   - Create fixed-position FAB at bottom-right
   - Shows selected exercise name
   - Always visible (no scrolling)
   - Example: `[🎵 Start: 5-Note Warm-Up]`

2. **Exercise Card Improvements**
   - Add difficulty badge (pill shape, colored)
     - Beginner: Green
     - Intermediate: Yellow
     - Advanced: Red
   - Add duration estimate (e.g., "~2 min")
   - Add category icon (🎵 warm-up, 🎹 scale, 📏 interval)

3. **Visual Hierarchy**
   - Bold selected exercise
   - Dim unselected exercises
   - Add checkmark icon on selected card

**Files to modify**:
- `src/screens/ExerciseScreenComplete.tsx` (lines 249-348)

**Acceptance criteria**:
- [x] Start button visible without scrolling
- [x] Selected exercise clearly highlighted
- [x] Difficulty/duration visible at a glance

---

### Task 1.2: Integrate Breathing Exercises ⏱️ 8 hours
**Problem**: Breathing screen exists but not integrated. Research shows 80% of vocal problems are breathing-related.

**Changes**:
1. **Update Exercise Data Model**
   - Add `type: 'vocal' | 'breathing'` to Exercise interface
   - Create `breathingExercises.ts` in `src/data/exercises/`
   - Define 3 breathing exercises:
     - Box Breathing (4-4-4-4)
     - Farinelli Breathing (existing)
     - Diaphragmatic Breathing

2. **Update ExerciseEngineV2**
   - Add breathing exercise mode
   - Skip pitch detection for breathing exercises
   - Use timer-based progression instead

3. **Add to Exercise List**
   - Breathing exercises appear first (category: "Foundation")
   - Vocal exercises second (category: "Practice")

4. **Create BreathingExerciseFlow Component**
   - Reuse existing BreathingCircle component
   - Add voice guidance ("Breathe in... hold... exhale...")
   - Add haptic feedback on transitions

**Files to modify**:
- `src/data/models.ts` (add `type` field)
- `src/data/exercises/breathing.ts` (new file)
- `src/data/exercises/scales.ts` (add `type: 'vocal'`)
- `src/engines/ExerciseEngineV2.ts` (add breathing mode)
- `src/screens/ExerciseScreenComplete.tsx` (render breathing UI)

**Acceptance criteria**:
- [x] 3 breathing exercises in list
- [x] Breathing exercises work without pitch detection
- [x] Visual/haptic feedback during breathing
- [x] Results screen adapted for breathing exercises

---

### Task 1.3: Enlarge & Improve PitchScaleVisualizer ⏱️ 6 hours
**Problem**: Pitch feedback too small, not clear during singing

**Changes**:
1. **Make 2x Larger**
   - Current: ~200px height
   - Target: ~400px height
   - Full width of screen

2. **Add Directional Arrows**
   - ↑ "Sing Higher" (red) when below target
   - ↓ "Sing Lower" (red) when above target
   - ✓ "Perfect!" (green) when within ±20 cents

3. **Add Cents Display**
   - Show difference from target in cents
   - Example: "+15¢" or "-8¢"
   - Color coded: Green (±20), Yellow (±50), Red (>50)

4. **Add Color Zones**
   - Green zone: ±20 cents (on pitch)
   - Yellow zone: ±20-50 cents (close)
   - Red zone: >±50 cents (off pitch)

5. **Add Pitch Trail**
   - Show last 2 seconds of pitch history
   - Fading line showing pitch movement
   - Helps users see trends

**Files to modify**:
- `src/components/PitchScaleVisualizer.tsx`

**Acceptance criteria**:
- [x] Visualizer is 2x larger
- [x] Arrows show sing higher/lower
- [x] Cents display visible
- [x] Color zones clear
- [x] Pitch trail shows history

---

## Week 2 Tasks

### Task 1.4: Add Tab Navigation Structure ⏱️ 8 hours
**Problem**: Single-screen app feels incomplete

**Changes**:
1. **Install React Navigation**
   ```bash
   npm install @react-navigation/native @react-navigation/bottom-tabs
   npm install react-native-screens react-native-safe-area-context
   ```

2. **Create Tab Structure**
   - Tab 1: Practice (existing ExerciseScreenComplete)
   - Tab 2: History (placeholder)
   - Tab 3: Settings (placeholder)

3. **Create Navigation Files**
   - `src/navigation/AppNavigator.tsx`
   - `src/navigation/types.ts`

4. **Update App.tsx**
   - Replace ExerciseScreenComplete with AppNavigator
   - Wrap in NavigationContainer

5. **Create Placeholder Screens**
   - `src/screens/HistoryScreen.tsx` - "Coming Soon" with practice history list
   - `src/screens/SettingsScreen.tsx` - "Coming Soon" with settings options

**Files to create**:
- `src/navigation/AppNavigator.tsx` (new)
- `src/navigation/types.ts` (new)
- `src/screens/HistoryScreen.tsx` (new)
- `src/screens/SettingsScreen.tsx` (new)

**Files to modify**:
- `App.tsx` (replace ExerciseScreenComplete with navigator)
- `package.json` (add navigation dependencies)

**Acceptance criteria**:
- [x] Tab bar appears at bottom
- [x] Can switch between Practice/History/Settings
- [x] Active tab highlighted
- [x] Practice tab shows existing exercise screen

---

### Task 1.5: Save Exercise Results to AsyncStorage ⏱️ 6 hours
**Problem**: No progress saved, can't track improvement

**Changes**:
1. **Create Storage Service**
   - `src/services/storage/StorageService.ts`
   - Methods:
     - `saveResult(result: ExerciseResults)`
     - `getResults(limit?: number): ExerciseResults[]`
     - `getResultsByExercise(exerciseId: string): ExerciseResults[]`
     - `getStreak(): number`

2. **Update ExerciseScreenComplete**
   - Call `StorageService.saveResult()` after exercise completes
   - Show "Progress Saved" toast/checkmark

3. **Update HistoryScreen**
   - Load results from storage
   - Display as list:
     ```
     📅 Oct 7, 2025
     🎵 5-Note Warm-Up • 85% accuracy

     📅 Oct 6, 2025
     🎹 Major Thirds • 72% accuracy
     ```

**Files to create**:
- `src/services/storage/StorageService.ts` (new)

**Files to modify**:
- `src/screens/ExerciseScreenComplete.tsx` (save results)
- `src/screens/HistoryScreen.tsx` (load and display results)

**Acceptance criteria**:
- [x] Results save to AsyncStorage
- [x] History screen shows past results
- [x] Results persist across app restarts

---

### Task 1.6: Add Streak Tracking ⏱️ 6 hours
**Problem**: No daily practice motivation

**Changes**:
1. **Update StorageService**
   - Track last practice date
   - Calculate streak (consecutive days)
   - Reset if >24 hours gap

2. **Add Streak Header Component**
   - `src/components/StreakHeader.tsx`
   - Shows: "🔥 5 Day Streak!"
   - Animates when practicing daily
   - Positioned at top of Practice screen

3. **Add Streak Celebration**
   - Fire emoji animation when completing exercise
   - Special message for 7-day, 30-day, 100-day streaks
   - Haptic feedback

**Files to create**:
- `src/components/StreakHeader.tsx` (new)

**Files to modify**:
- `src/services/storage/StorageService.ts` (add streak logic)
- `src/screens/ExerciseScreenComplete.tsx` (show streak header)
- `src/utils/encouragingMessages.ts` (add streak milestones)

**Acceptance criteria**:
- [x] Streak counter visible on Practice screen
- [x] Streak increments when practicing daily
- [x] Streak resets if skip a day
- [x] Special celebration for milestone streaks

---

## Phase 1 Deliverables

**By end of Week 2:**
- ✅ Exercise selection UX improved (FAB, badges, hierarchy)
- ✅ 3 breathing exercises integrated
- ✅ Pitch visualizer 2x larger with arrows/cents
- ✅ Tab navigation structure (Practice/History/Settings)
- ✅ Results saving to AsyncStorage
- ✅ Streak tracking working

**Testing checklist:**
- [ ] Can select and start exercise without scrolling
- [ ] Breathing exercises work (no pitch detection)
- [ ] Pitch feedback is clear and prominent
- [ ] Can navigate between tabs
- [ ] Results save and appear in History
- [ ] Streak increments when practicing daily

---

# Phase 2: Engagement & Retention (Week 3-4)

## Week 3 Tasks

### Task 2.1: Build Onboarding Flow ⏱️ 12 hours
**Goal**: Get new users to value in <3 minutes

**Flow**:
1. **Welcome Screen** (30 seconds)
   - Title: "Welcome to PitchPerfect"
   - Subtitle: "Your personal vocal coach"
   - 3 value props:
     - 🎵 Real-time pitch feedback
     - 📈 Track your progress
     - 🔥 Build a daily habit
   - CTA: "Get Started"

2. **Vocal Range Test** (1 minute)
   - Instructions: "Let's find your vocal range"
   - Play ascending notes C3 → C6
   - User sings along
   - Detect lowest and highest comfortable note
   - Save range to profile

3. **First Practice** (1 minute)
   - Auto-select "5-Note Warm-Up" in user's range
   - Guide: "Now let's try your first exercise"
   - Complete exercise
   - Show results + celebration

4. **Welcome Complete** (30 seconds)
   - "You're all set!"
   - Set practice reminder (optional)
   - Enter app

**Files to create**:
- `src/screens/onboarding/WelcomeScreen.tsx`
- `src/screens/onboarding/VocalRangeTest.tsx`
- `src/screens/onboarding/FirstPractice.tsx`
- `src/screens/onboarding/OnboardingComplete.tsx`
- `src/navigation/OnboardingNavigator.tsx`

**Files to modify**:
- `App.tsx` (show onboarding if first launch)
- `src/services/storage/StorageService.ts` (save vocal range, onboarding state)

**Acceptance criteria**:
- [x] Onboarding appears on first launch
- [x] Vocal range detected and saved
- [x] First exercise completes successfully
- [x] User lands in main app after onboarding

---

### Task 2.2: Create "Quick Start" Guided Session ⏱️ 10 hours
**Goal**: One-tap practice session (10 minutes)

**Flow**:
1. **Add "Quick Start" Button**
   - Large button at top of Practice screen
   - "🚀 Quick Start (10 min)"
   - Below streak counter

2. **Session Structure**:
   - 2 min: Box Breathing
   - 2 min: 5-Note Warm-Up
   - 3 min: Major Thirds
   - 3 min: C Major Scale

3. **Auto-Advance Between Exercises**
   - No returning to selection screen
   - Progress bar shows session progress
   - "3 of 4 complete" indicator

4. **Session Summary Screen**
   - Overall session score
   - Time practiced: 10 min
   - Exercises completed: 4/4
   - Best performance: Major Thirds (92%)
   - CTA: "Done" (return to Practice screen)

**Files to create**:
- `src/screens/GuidedSessionScreen.tsx`
- `src/data/sessions/quickStart.ts`

**Files to modify**:
- `src/screens/ExerciseScreenComplete.tsx` (add Quick Start button)
- `src/engines/ExerciseEngineV2.ts` (support auto-advance)

**Acceptance criteria**:
- [x] Quick Start button visible on Practice screen
- [x] Session auto-advances through 4 exercises
- [x] Progress bar shows current exercise
- [x] Session summary appears at end

---

### Task 2.3: Improve Results Screen ⏱️ 8 hours
**Goal**: Make results actionable, not just informational

**Changes**:
1. **Add Comparison to Previous**
   - "Your best: 85% (Oct 5)"
   - "Today: 78% (↓7%)" - show if worse
   - "Today: 92% (↑7%)" - show if better

2. **Add "Next Exercise" Recommendation**
   - Based on:
     - What exercises they've done today
     - What they struggle with
     - Progression path (beginner → intermediate)
   - Example: "Try Major Thirds next to improve interval accuracy"

3. **Replace "Try Again" with Better CTAs**
   - Primary: "Continue Practicing" (goes to recommended next exercise)
   - Secondary: "View Progress" (goes to History tab)
   - Tertiary: "Done for Now" (returns to Practice screen)

4. **Add Social Proof**
   - "You're in the top 20% of users today!" (if applicable)
   - "10,000 singers practiced today"

**Files to modify**:
- `src/screens/ExerciseScreenComplete.tsx` (results screen section)
- `src/services/storage/StorageService.ts` (get previous results)
- `src/utils/recommendationEngine.ts` (new file - recommend next exercise)

**Acceptance criteria**:
- [x] Results compare to previous attempts
- [x] Next exercise recommended
- [x] Multiple CTA options
- [x] Social proof shown (if applicable)

---

## Week 4 Tasks

### Task 2.4: Add Daily Practice Reminders ⏱️ 6 hours
**Goal**: Bring users back daily

**Changes**:
1. **Install Expo Notifications**
   ```bash
   npx expo install expo-notifications
   ```

2. **Create Notification Service**
   - `src/services/NotificationService.ts`
   - Methods:
     - `scheduleDaily(time: Date)`
     - `cancelAll()`
     - `requestPermissions()`

3. **Add Settings UI**
   - In SettingsScreen
   - Toggle: "Daily Reminders"
   - Time picker: Default 7:00 PM
   - Save to AsyncStorage

4. **Notification Content**
   - Title: "Time to practice! 🎵"
   - Body: "Keep your 5-day streak going!"
   - Or: "Don't break your streak!"
   - Or: "10 minutes a day makes a difference"

**Files to create**:
- `src/services/NotificationService.ts` (new)

**Files to modify**:
- `src/screens/SettingsScreen.tsx` (add reminder settings)
- `package.json` (add expo-notifications)

**Acceptance criteria**:
- [x] Can enable/disable reminders in Settings
- [x] Can set reminder time
- [x] Notification appears daily at chosen time
- [x] Notification mentions current streak

---

### Task 2.5: Build Basic Progress Charts ⏱️ 10 hours
**Goal**: Show improvement over time

**Changes**:
1. **Install Charting Library**
   ```bash
   npm install react-native-chart-kit react-native-svg
   ```

2. **Update History Screen**
   - Replace simple list with tabs:
     - Tab 1: Recent (list view)
     - Tab 2: Charts (charts view)

3. **Create 3 Charts**:
   - **Chart 1: Accuracy Trend**
     - Line chart
     - X-axis: Last 30 days
     - Y-axis: Average accuracy %
     - Shows improvement trend

   - **Chart 2: Practice Frequency**
     - Bar chart
     - X-axis: Days of week
     - Y-axis: Number of exercises
     - Shows which days you practice most

   - **Chart 3: Exercise Distribution**
     - Pie chart
     - Shows % of time on each exercise category
     - (Breathing, Warm-ups, Scales, Intervals)

4. **Add Stats Summary**
   - Total exercises completed
   - Total practice time
   - Average accuracy
   - Current streak
   - Longest streak

**Files to modify**:
- `src/screens/HistoryScreen.tsx` (add tabs + charts)
- `src/services/storage/StorageService.ts` (add query methods for charts)

**Acceptance criteria**:
- [x] Charts appear in History tab
- [x] Accuracy trend shows improvement
- [x] Practice frequency shows weekly pattern
- [x] Exercise distribution shows balance
- [x] Stats summary accurate

---

### Task 2.6: Add Achievement Badges ⏱️ 4 hours
**Goal**: Celebrate milestones

**Badges to Implement**:
1. First Steps 🎵 - Complete first exercise
2. Week Warrior 🔥 - 7-day streak
3. Perfect Pitch 🎯 - Score 100% on any exercise
4. Century Club 💯 - Complete 100 exercises
5. Range Expander 📈 - Sing 2 octaves in vocal range test
6. Early Bird 🌅 - Practice before 9 AM
7. Night Owl 🦉 - Practice after 9 PM
8. Dedicated 🏆 - 30-day streak

**Changes**:
1. **Create Badge System**
   - `src/data/achievements.ts` (badge definitions)
   - `src/services/AchievementService.ts` (unlock logic)

2. **Add to History Screen**
   - New tab: Achievements
   - Grid of badges (unlocked + locked)
   - Unlocked: Full color + date achieved
   - Locked: Grayscale + "???" + hint

3. **Add Badge Unlock Celebration**
   - After exercise completes, check if unlocked
   - Show modal: "Achievement Unlocked! 🎉"
   - Badge icon + title + description
   - CTA: "Awesome!"

**Files to create**:
- `src/data/achievements.ts` (new)
- `src/services/AchievementService.ts` (new)
- `src/components/AchievementUnlockModal.tsx` (new)

**Files to modify**:
- `src/screens/HistoryScreen.tsx` (add Achievements tab)
- `src/screens/ExerciseScreenComplete.tsx` (check achievements after exercise)

**Acceptance criteria**:
- [x] 8 achievements defined
- [x] Achievements unlock correctly
- [x] Badge unlock modal appears
- [x] Achievements tab shows all badges

---

## Phase 2 Deliverables

**By end of Week 4:**
- ✅ Onboarding flow (3 min to first value)
- ✅ Quick Start guided session (10 min)
- ✅ Results screen with next exercise recommendation
- ✅ Daily practice reminders
- ✅ Progress charts (3 charts + stats)
- ✅ Achievement badge system (8 badges)

**Testing checklist:**
- [ ] New user can complete onboarding in <3 min
- [ ] Quick Start session works start to finish
- [ ] Results show comparison to previous
- [ ] Reminders appear daily
- [ ] Charts show accurate data
- [ ] Badges unlock correctly

---

# Phase 3: Growth & Polish (Week 5-6)

## Week 5 Tasks

### Task 3.1: Add 15 More Exercises ⏱️ 10 hours
**Goal**: Rich exercise library

**Exercise Categories**:

**Breathing (add 2 more)**:
- Alternate Nostril Breathing
- 4-7-8 Breathing

**Warm-Ups (add 5 more)**:
- Lip Trills
- Sirens (low to high)
- Humming Scales
- Tongue Twisters
- Vowel Slides

**Scales (add 3 more)**:
- D Major Scale
- E Major Scale
- Chromatic Scale

**Intervals (add 3 more)**:
- Perfect Fourths
- Perfect Fifths
- Minor Thirds

**Advanced (add 2 more)**:
- Arpeggios
- Vocal Runs

**Changes**:
1. Create exercise definition files
2. Add to exercise list with categories
3. Update UI to group by category

**Files to create/modify**:
- `src/data/exercises/breathing.ts` (add 2)
- `src/data/exercises/warmups.ts` (new file, 5 exercises)
- `src/data/exercises/scales.ts` (add 3)
- `src/data/exercises/intervals.ts` (new file, 3 exercises)
- `src/data/exercises/advanced.ts` (new file, 2 exercises)

**Acceptance criteria**:
- [x] 20 total exercises available
- [x] Exercises grouped by category
- [x] Each exercise has clear instructions
- [x] Difficulty levels assigned correctly

---

### Task 3.2: Add Exercise Filtering & Search ⏱️ 6 hours
**Goal**: Easy exercise discovery

**Changes**:
1. **Add Filter Pills**
   - All | Breathing | Warm-Ups | Scales | Intervals | Advanced
   - Tappable pills at top of exercise list
   - Active pill highlighted

2. **Add Search Bar**
   - Search by exercise name
   - Search by note (e.g., "C4")
   - Filter results in real-time

3. **Add Sort Options**
   - Sort by: Recently Practiced, Difficulty, Duration, Name
   - Dropdown or segmented control

**Files to modify**:
- `src/screens/ExerciseScreenComplete.tsx` (add filters/search UI)

**Acceptance criteria**:
- [x] Can filter by category
- [x] Can search by name
- [x] Can sort by criteria
- [x] Filters work correctly

---

### Task 3.3: Build Settings Screen ⏱️ 8 hours
**Goal**: Complete settings functionality

**Settings Sections**:

**1. Audio**
- Microphone Sensitivity (slider)
- Piano Volume (slider)
- Pitch Detection Threshold (slider)

**2. Practice**
- Daily Reminder (toggle + time picker)
- Auto-Advance Exercises (toggle)
- Default Starting Key (picker: C, D, E, F, G, A, B)

**3. Display**
- Dark Mode (toggle) - already dark, make optional light mode
- Show Cents Display (toggle)
- Show Confidence Meter (toggle)

**4. Account**
- Vocal Range: [Low] - [High] (from onboarding)
- Reset Vocal Range (button → re-run test)
- Export Data (button → download JSON)

**5. About**
- Version: 1.0.0
- Contact Support (button → email)
- Privacy Policy (button → web)
- Terms of Service (button → web)

**Files to modify**:
- `src/screens/SettingsScreen.tsx` (build full settings UI)
- `src/services/storage/StorageService.ts` (save settings)
- Create settings context for global access

**Acceptance criteria**:
- [x] All settings functional
- [x] Settings persist across app restarts
- [x] Audio settings affect playback/detection
- [x] About section shows correct info

---

### Task 3.4: Add Haptic Feedback Throughout ⏱️ 4 hours
**Goal**: Polished iOS feel

**Haptic Events**:
1. **Selection**
   - Tap exercise card
   - Switch tabs
   - Toggle settings

2. **Success**
   - Complete exercise
   - Unlock achievement
   - Hit 100% on note

3. **Notification**
   - Start new note in exercise
   - Reach milestone streak

4. **Impact**
   - Singing off-pitch (light impact)
   - Singing on-pitch (medium impact)

**Changes**:
- Add `expo-haptics` import
- Add `Haptics.impactAsync()` at key moments

**Files to modify**:
- `src/screens/ExerciseScreenComplete.tsx`
- `src/components/PitchScaleVisualizer.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/screens/SettingsScreen.tsx`

**Acceptance criteria**:
- [x] Haptics on all taps
- [x] Success haptics on achievements
- [x] Notification haptics on events
- [x] Can disable haptics in Settings

---

## Week 6 Tasks

### Task 3.5: App Icon & Splash Screen ⏱️ 4 hours
**Goal**: Professional branding

**Deliverables**:
1. **App Icon Design**
   - 1024×1024 px
   - Concept: Musical note + pitch waveform
   - Colors: Match app theme (blue/purple gradient)
   - Create in Figma/Illustrator

2. **Splash Screen**
   - Match app icon style
   - App name: "PitchPerfect"
   - Tagline: "Your Personal Vocal Coach"

3. **Generate All Sizes**
   - Use `expo-icon` to generate all iOS sizes
   - Test on device

**Files to create**:
- `assets/icon.png` (1024×1024)
- `assets/splash.png` (2048×2048)

**Files to modify**:
- `app.json` (update icon/splash paths)

**Acceptance criteria**:
- [x] App icon shows on home screen
- [x] Splash screen shows on launch
- [x] Icon looks professional
- [x] All sizes generated correctly

---

### Task 3.6: App Store Screenshots & Description ⏱️ 6 hours
**Goal**: Prepare App Store listing

**Screenshots** (5 required):
1. **Welcome/Onboarding** - "Your Personal Vocal Coach"
2. **Quick Start** - "10-Minute Daily Practice"
3. **Exercise in Progress** - "Real-Time Pitch Feedback"
4. **Results Screen** - "Track Your Progress"
5. **Charts/Achievements** - "Celebrate Milestones"

**App Store Description**:
- **Title**: PitchPerfect - Vocal Coach
- **Subtitle**: Learn to sing on pitch
- **Description**: (write compelling copy)
- **Keywords**: vocal training, pitch perfect, singing lessons, vocal coach, pitch detection
- **Category**: Music > Education

**Files to create**:
- `docs/app-store/screenshots/` (5 screenshots)
- `docs/app-store/description.txt`
- `docs/app-store/keywords.txt`

**Acceptance criteria**:
- [x] 5 high-quality screenshots
- [x] Compelling app description
- [x] Keywords researched
- [x] Category selected

---

### Task 3.7: Performance Optimization ⏱️ 6 hours
**Goal**: Smooth experience

**Optimizations**:
1. **React Performance**
   - Add `React.memo()` to heavy components
   - Use `useMemo()` for expensive calculations
   - Use `useCallback()` for callbacks

2. **Audio Performance**
   - Reduce pitch detection buffer size if lagging
   - Optimize YIN algorithm threshold

3. **Storage Performance**
   - Batch AsyncStorage writes
   - Limit history to last 1000 exercises
   - Add loading states

4. **Bundle Size**
   - Remove unused dependencies
   - Optimize image assets
   - Enable Hermes engine

**Files to modify**:
- All component files (add memoization)
- `src/utils/pitchDetection.ts` (optimize)
- `src/services/storage/StorageService.ts` (batch writes)

**Acceptance criteria**:
- [x] 60 FPS during exercises
- [x] No stutters on tab switches
- [x] Fast app launch (<2 sec)
- [x] Low battery usage (<10%/30min)

---

### Task 3.8: Bug Fixes & Testing ⏱️ 14 hours
**Goal**: Production quality

**Testing Matrix**:
1. **Functional Testing**
   - [ ] All exercises work
   - [ ] All navigation works
   - [ ] All settings work
   - [ ] Onboarding works
   - [ ] Streaks work
   - [ ] Notifications work
   - [ ] Charts work
   - [ ] Achievements work

2. **Edge Cases**
   - [ ] No internet connection
   - [ ] Microphone permission denied
   - [ ] App backgrounded during exercise
   - [ ] Headphones connected/disconnected
   - [ ] Low battery mode
   - [ ] iPhone in silent mode

3. **Performance**
   - [ ] No memory leaks
   - [ ] No crashes
   - [ ] Smooth animations
   - [ ] Fast load times

4. **Accessibility**
   - [ ] VoiceOver compatible
   - [ ] Dynamic type support
   - [ ] Color contrast (WCAG AA)
   - [ ] Haptics available

**Bug Fixes**:
- Create GitHub Issues for all bugs found
- Fix all P0 bugs (blocking)
- Fix all P1 bugs (high priority)
- Document P2/P3 bugs for future

**Acceptance criteria**:
- [x] All functional tests pass
- [x] All edge cases handled
- [x] No P0/P1 bugs
- [x] Accessibility audit complete

---

## Phase 3 Deliverables

**By end of Week 6:**
- ✅ 20 total exercises
- ✅ Filter/search for exercises
- ✅ Complete settings functionality
- ✅ Haptic feedback throughout
- ✅ App icon & splash screen
- ✅ App Store screenshots & description
- ✅ Performance optimized
- ✅ All bugs fixed

**Final Testing checklist:**
- [ ] End-to-end user flow works
- [ ] All features accessible
- [ ] Performance meets standards
- [ ] No crashes or critical bugs
- [ ] Ready for TestFlight

---

## 🚀 Launch Preparation

### Week 7: App Store Submission
1. Create App Store Connect listing
2. Upload build via Xcode
3. Submit for TestFlight beta
4. Get 5-10 beta testers
5. Collect feedback
6. Fix any critical issues
7. Submit for App Store review

### Week 8: Launch
1. App Store approval
2. Launch announcement
3. Monitor reviews
4. Respond to user feedback
5. Plan v1.1 features

---

## 📊 Success Metrics

### Technical Metrics
- [ ] Build size < 50 MB
- [ ] App launch < 2 seconds
- [ ] 60 FPS during exercises
- [ ] <10% battery drain per 30 min
- [ ] 0 crashes in TestFlight

### User Metrics (Target)
- [ ] Day 1 retention: 60%+
- [ ] Day 7 retention: 40%+
- [ ] Average session: 10+ minutes
- [ ] Average exercises: 3+ per session
- [ ] App Store rating: 4.5+ stars

### Business Metrics
- [ ] 100 downloads in Week 1
- [ ] 1000 downloads in Month 1
- [ ] 5% free-to-paid conversion (future)

---

## 🎯 Summary

**Total Timeline**: 6 weeks + 2 weeks launch prep = 8 weeks to App Store

**Effort Distribution**:
- Phase 1: 40 hours (Critical UX)
- Phase 2: 50 hours (Engagement)
- Phase 3: 50 hours (Polish)
- Launch: 20 hours (Submission)
- **Total**: 160 hours (~8 weeks at 20 hrs/week)

**Confidence**: HIGH
- Core technology proven
- Clear roadmap
- Manageable scope
- Research-backed decisions

**Next Steps**:
1. ✅ Audit complete (CURRENT_STATE_AUDIT.md)
2. ✅ Roadmap complete (this document)
3. ⏭️ User validates current app on iPhone
4. ⏭️ Begin Phase 1, Task 1.1 (Fix Exercise Selection UX)
