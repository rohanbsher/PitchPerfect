# PitchPerfect - Claude Code Project Memory

> Vocal training app built with React Native (Expo)

## Quick Reference

| Command | What it does |
|---------|--------------|
| `npm start` | Start Expo dev server (web on port 8082) |
| `npm run ios` | Build and run on iOS simulator |
| `npm run android` | Build and run on Android emulator |

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: React Navigation (native-stack + bottom-tabs)
- **Audio**: @mykin-ai/expo-audio-stream, expo-av
- **AI**: Anthropic Claude SDK (@anthropic-ai/sdk)
- **Animations**: React Native Reanimated, Lottie
- **Graphics**: @shopify/react-native-skia

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components (one per route)
├── navigation/     # Navigation configuration
├── hooks/          # Custom React hooks
├── services/       # Business logic and API calls
│   ├── claudeAI.ts        # Claude AI integration
│   ├── voiceAssistant.ts  # Voice coaching logic
│   └── speechRecognition.ts
├── engines/        # Core processing engines
│   ├── ExerciseEngine.ts  # Exercise state management
│   └── RangeCheckEngine.ts # Vocal range detection
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
├── config/         # Feature flags and configuration
└── data/           # Static data (exercises, etc.)
```

## Architecture Patterns

### Service Layer
Services in `src/services/` handle external integrations:
- Keep API calls isolated to service files
- Use TypeScript interfaces for response types
- Handle errors within services, return typed results

### Hooks Pattern
- Custom hooks in `src/hooks/` for reusable stateful logic
- `useNativePitchDetector` - Main pitch detection hook
- `useStorage` - AsyncStorage wrapper

### Engine Pattern
- Engines in `src/engines/` manage complex state machines
- `ExerciseEngine` - Controls exercise flow and scoring
- `RangeCheckEngine` - Handles vocal range analysis

## Common Tasks

### Adding a New Screen
1. Create screen component in `src/screens/`
2. Add to navigation in `src/navigation/`
3. Define types for route params if needed

### Adding a New Service
1. Create file in `src/services/`
2. Export typed interfaces and functions
3. Never import services directly in components - use hooks as intermediaries

## Known Quirks

- Audio streaming requires native rebuild after dependency changes (`expo run:ios`)
- Web mode (`npm start`) doesn't support native audio - use simulator for audio features
- Pitch detection is CPU-intensive - avoid running with other heavy computations

## iOS Simulator Testing (via ios-simulator-skill)

The ios-simulator-skill is installed globally at `~/.claude/skills/ios-simulator-skill/`.
Use it to automatically test the app in the simulator.

### Available Scripts
- `sim_list.py` - List available simulators
- `simctl_boot.py` - Boot a simulator
- `app_launcher.py` - Launch the app
- `screen_mapper.py` - Read current screen elements
- `navigator.py` - Navigate using accessibility labels
- `gesture.py` - Tap, swipe, scroll
- `keyboard.py` - Type text
- `accessibility_audit.py` - Check accessibility issues
- `visual_diff.py` - Compare screenshots

### App Info
- **Bundle ID**: `com.pitchperfect.app` (update if different)
- **Default Simulator**: iPhone 16 Pro

### Testing Workflow
1. Build: `npm run ios` (builds and installs on simulator)
2. Use `screen_mapper.py` to understand current screen
3. Use `navigator.py` or `gesture.py` to interact
4. Verify behavior matches expectations

## Verification Loop (CRITICAL)

When building/fixing features:
1. Run `npm start` to verify no compilation errors
2. For audio features: Build and test on iOS simulator with `npm run ios`
3. For UI changes: Use the simulator skill to navigate and verify
4. Take screenshots or use `visual_diff.py` to confirm changes

## Don't

- Don't modify `patch-package` patches without understanding why they exist
- Don't add new navigation screens without updating types
- Don't use bare `console.log` in production code - use the logging service
