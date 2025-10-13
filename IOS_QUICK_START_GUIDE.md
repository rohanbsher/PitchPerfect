# PitchPerfect iOS - Quick Start Guide

**Time to iOS Launch: 6-7 weeks**

## TL;DR - Critical Decisions

### Stay in Expo Managed Workflow ✅
**No ejecting required!** Use `@siteed/expo-audio-studio` for real-time audio.

### Technology Stack
- **Recording:** `@siteed/expo-audio-studio` (real-time PCM streaming)
- **Pitch Detection:** Your existing YIN algorithm (keep it!)
- **Piano Playback:** `expo-av` (already installed)
- **Piano Samples:** Freesound.org C3-C6 pack (free, Creative Commons)

### Installation (5 minutes)

```bash
# Install audio studio
npx expo install @siteed/expo-audio-studio

# Update app.json
{
  "ios": {
    "infoPlist": {
      "NSMicrophoneUsageDescription": "PitchPerfect needs microphone access to analyze your singing voice and provide real-time pitch feedback."
    }
  }
}
```

---

## Week 1: Get Audio Working on iOS

### Day 1: Test @siteed/expo-audio-studio

```bash
# Install
npx expo install @siteed/expo-audio-studio

# Test on iPhone
npx expo run:ios --device
```

**Success Criteria:** Real-time pitch detection with <100ms latency

### Day 2-5: Implement NativeAudioService

Replace placeholder in `/src/services/audio/NativeAudioService.ts`:

```typescript
import { AudioRecorder } from '@siteed/expo-audio-studio';

async startMicrophoneCapture(callback: PitchDetectionCallback) {
  await this.recorder.start({
    sampleRate: 44100,
    channels: 1,
    onAudioStream: (audioData) => {
      // audioData.buffer is Float32Array - YIN ready!
      callback(audioData.buffer, 44100);
    }
  });
}
```

---

## Week 2: Piano Samples

### Download Samples

1. Go to https://freesound.org/people/Tesabob2001/packs/12995/
2. Create free account
3. Download C3-C6 piano samples (37 notes)

### Add to Project

```bash
mkdir -p assets/audio/piano
# Copy MP3 files to assets/audio/piano/
# Naming: C3.mp3, C-sharp-3.mp3, D3.mp3, etc.
```

### Update NativeAudioService

```typescript
private readonly noteSamples = {
  'C3': require('../../assets/audio/piano/C3.mp3'),
  'C#3': require('../../assets/audio/piano/C-sharp-3.mp3'),
  // ... all 37 notes
};
```

---

## Week 3-5: Testing & Optimization

### Test on Real Device

**CRITICAL:** iOS Simulator has NO microphone!

```bash
npx expo run:ios --device
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Audio Latency | <100ms |
| Piano Latency | <50ms |
| Pitch Accuracy | ±10 cents |
| Memory Usage | <150MB |

---

## Week 6-7: TestFlight Beta

### Build for TestFlight

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build
eas build --platform ios --profile production

# Submit
eas submit --platform ios
```

### Beta Testing

- Invite 10-20 testers
- Collect feedback for 7 days
- Fix critical bugs
- Launch!

---

## Quick Troubleshooting

### Audio Not Working?
- Check microphone permission granted
- Test on real iPhone (not simulator)
- Verify @siteed/expo-audio-studio version (v2.18.1+)

### High Latency?
- Reduce buffer size to 1024
- Use sample rate 44100 (not 48000)
- Test on newer iPhone (12+)

### Piano Not Playing?
- Check files in assets/audio/piano/
- Verify file naming matches code
- Preload samples on initialization

---

## Cost Breakdown

- Apple Developer Account: $99/year
- iPhone for testing: $400-800 (one-time)
- Piano samples: FREE
- **Total: ~$500**

---

## Resources

- Full Plan: `IOS_IMPLEMENTATION_PLAN_COMPREHENSIVE.md`
- @siteed/expo-audio-studio: https://github.com/deeeed/expo-audio-stream
- Expo Docs: https://docs.expo.dev/
- Apple Developer: https://developer.apple.com/

---

## Success Checklist

Week 1:
- [ ] @siteed/expo-audio-studio installed
- [ ] Real-time pitch detection working
- [ ] Latency <100ms

Week 2:
- [ ] 37 piano samples downloaded
- [ ] All notes playing on iOS
- [ ] Playback latency <50ms

Week 5:
- [ ] Zero critical bugs
- [ ] Performance targets met
- [ ] Ready for TestFlight

Week 7:
- [ ] App on TestFlight
- [ ] 10+ beta testers
- [ ] 4+ star feedback

**Good luck! You've got this!** 🎤🎵
