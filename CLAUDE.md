# PitchPerfect

Professional vocal training app with real-time pitch detection and AI coaching.

## Quick Start

```bash
npm install              # Install dependencies
npm start                # Start web dev server on port 8082
npx expo run:ios         # Run on iOS
npx expo run:android     # Run on Android
```

## Architecture Overview

```
App.tsx                           # Entry point
  └── ExerciseScreenComplete.tsx  # Main orchestrator (1100+ lines)
        ├── Home Screen           # Recommendations, streak, journey
        ├── Exercise Preview      # Pre-exercise info
        ├── Running Exercise      # Pitch visualizer or breathing
        └── Results Screen        # Analytics, AI feedback
```

## Key Directories

```
src/
├── components/          # UI components
│   ├── home/           # Home screen (Header, Greeting, HeroCard)
│   ├── analytics/      # PitchHistoryGraph, SessionStatsCards
│   └── results/        # AICoachCard
├── screens/            # Full screens
├── engines/            # Exercise execution
│   ├── ExerciseEngineV2.ts   # Vocal exercises
│   └── BreathingEngine.ts    # Breathing exercises
├── services/           # Business logic
│   ├── audio/          # Cross-platform audio (Factory pattern)
│   │   ├── AudioServiceFactory.ts
│   │   ├── WebAudioService.ts
│   │   └── NativeAudioService.ts
│   ├── ai/             # Claude integration
│   │   └── vocalCoachService.ts
│   └── recommendationEngine.ts
├── data/               # Models and exercises
│   ├── models.ts       # TypeScript interfaces
│   ├── exercises/      # Exercise definitions
│   ├── userProgress.ts # AsyncStorage persistence
│   └── curriculum.ts   # 8-week program
├── utils/              # Utilities
│   └── pitchDetection.ts  # YIN algorithm
└── design/             # Design system tokens
    └── DesignSystem.ts
```

## Core Technologies

| Category | Technology |
|----------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript 5.9 (strict mode) |
| Audio | expo-av, @mykin-ai/expo-audio-stream, Tone.js |
| Pitch Detection | YIN algorithm (custom implementation) |
| Graphics | @shopify/react-native-skia |
| AI | Claude 3.5 Haiku via @anthropic-ai/sdk |
| Storage | AsyncStorage |

## Audio Architecture

**Platform Abstraction (Factory Pattern):**
- Web: `WebAudioService` - Tone.js + Web Audio API
- Native: `NativeAudioService` - expo-av + expo-audio-stream

**Pitch Detection Pipeline:**
```
Microphone (48kHz) → expo-audio-stream → Float32Array (2048 samples)
  → YIN Algorithm → Smoothing → UI Update (~43ms latency)
```

## AI Vocal Coach

**Location:** `src/services/ai/vocalCoachService.ts`

- Model: `claude-3-5-haiku-20241022`
- Analyzes pitch accuracy, tendency (sharp/flat), stability
- Generates personalized feedback with strengths, improvements, tips
- Requires `EXPO_PUBLIC_ANTHROPIC_API_KEY` in `.env`

## Data Models

**Key interfaces in `src/data/models.ts`:**
- `Exercise` - Exercise definition with notes, settings
- `ExerciseResults` - Completion data with accuracy, duration
- `NoteResult` - Per-note accuracy and pitch readings
- `UserProgress` - Streak, level, completed exercises

## Environment Variables

```bash
# .env (create from .env.example)
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

## Build & Deploy

```bash
# Development
npm start                    # Web dev server
npx expo run:ios            # iOS simulator

# Production (EAS Build)
eas build --platform ios --profile production
eas submit --platform ios
```

## Code Patterns

- **Factory Pattern**: AudioServiceFactory for platform abstraction
- **Engine Pattern**: ExerciseEngineV2/BreathingEngine for exercise execution
- **Callbacks**: Engines use callbacks (onNoteChange, onPitchDetected, onComplete)
- **AsyncStorage**: All user progress persisted locally

## Common Tasks

### Add a new exercise
1. Create definition in `src/data/exercises/`
2. Add to exports in index file
3. Exercise engine handles execution automatically

### Modify AI feedback
1. Edit prompt in `vocalCoachService.ts` (lines 61-95)
2. Adjust `VocalCoachFeedback` interface if adding fields

### Update design tokens
1. Edit `src/design/DesignSystem.ts`
2. Components import as `DS` for consistency

## Testing

Currently manual testing only. See `STEP_BY_STEP_TESTING_GUIDE.md`.

Critical flows to test:
1. Home screen loads with recommendations
2. Exercise preview → countdown → execution
3. Pitch detection accuracy
4. Results display with AI feedback
5. Progress persistence across sessions

## Known Issues

- ExerciseScreenComplete.tsx is large (1100+ lines) - consider splitting
- No automated tests
- 80+ documentation files (many stale)
