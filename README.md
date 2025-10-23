# 🎵 PitchPerfect

**Professional Vocal Training & Pitch Detection iOS App**

[![Platform](https://img.shields.io/badge/platform-iOS-blue)](https://github.com/rohanbsher/PitchPerfect)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-brightgreen)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

> Transform your voice with professional vocal training, real-time pitch detection, and an 8-week structured curriculum.

[View Architecture](ARCHITECTURE.md) • [Deployment Guide](APP_STORE_DEPLOYMENT_GUIDE.md) • [Report Bug](https://github.com/rohanbsher/PitchPerfect/issues)

---

## ✨ Features

### 🎯 Core Capabilities

- **Real-Time Pitch Detection** - YIN algorithm with <43ms latency at 48kHz
- **8-Week Curriculum** - Structured progression from foundation to mastery
- **11 Professional Exercises** - 3 breathing techniques + 8 vocal exercises
- **Smart Recommendations** - Personalized exercise suggestions based on progress
- **Progress Tracking** - AsyncStorage-based persistence with session history
- **Professional UI** - iOS Human Interface Guidelines compliant design

### 🎼 Vocal Exercises

- **C Major Scale** - Basic scale practice
- **5-Note Warm-up** - Quick vocal preparation
- **Full Scale (Up & Down)** - Complete octave practice
- **Major Thirds** - Interval accuracy training
- **Octave Jumps** - Range expansion

### 🫁 Breathing Exercises

- **Diaphragmatic Breathing** - Foundation breathing technique
- **Box Breathing** - 4-4-4-4 stress management
- **Farinelli Breathing** - Advanced operatic technique (5-20-10)

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js v20.5.0+
Xcode 14.0+
CocoaPods 1.11+
```

### Installation

```bash
# Clone the repository
git clone https://github.com/rohanbsher/PitchPerfect.git
cd PitchPerfect

# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Start development server
npx expo start --dev-client
```

### Run on iOS

```bash
# Run on simulator
npx expo run:ios

# Or open in Xcode
open ios/PitchPerfect.xcworkspace
```

---

## 📱 Screenshots

> Screenshots coming soon! App is currently in beta testing.

---

## 🏗️ Architecture

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React Native 0.81.4 + Expo SDK 54 |
| **Language** | TypeScript 5.9 |
| **Audio** | expo-av + @mykin-ai/expo-audio-stream |
| **Pitch Detection** | YIN Algorithm (custom implementation) |
| **Graphics** | @shopify/react-native-skia + Lottie |
| **Animations** | react-native-reanimated 4.1.1 |
| **Storage** | @react-native-async-storage/async-storage |

### Project Structure

```
PitchPerfect/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── home/           # Home screen components
│   │   ├── analytics/      # Performance tracking
│   │   ├── BreathingVisualizer.tsx
│   │   └── PitchScaleVisualizer.tsx
│   ├── screens/            # Screen components
│   │   ├── ExerciseScreenComplete.tsx  # Main orchestrator (900+ lines)
│   │   └── ExercisePreview.tsx
│   ├── engines/            # Exercise logic
│   │   ├── ExerciseEngineV2.ts  # Vocal exercise engine
│   │   └── BreathingEngine.ts   # Breathing exercise engine
│   ├── services/           # Business logic
│   │   ├── audio/          # Audio abstraction layer
│   │   ├── progressTracking.ts
│   │   └── recommendationEngine.ts
│   ├── data/               # Data layer
│   │   ├── curriculum.ts   # 8-week program
│   │   ├── userProgress.ts
│   │   └── exercises/
│   └── utils/              # Utilities
│       ├── pitchDetection.ts  # YIN algorithm
│       └── pitchSmoothing.ts
├── assets/audio/piano/     # 49 AIFF piano samples (C3-C6)
├── ios/                    # Native iOS project
└── ARCHITECTURE.md         # Detailed architecture docs
```

For complete architecture details, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🎯 Pitch Detection

### YIN Algorithm

The app uses the YIN algorithm for accurate pitch detection:

```typescript
// Core pitch detection pipeline
Microphone (48kHz)
  → expo-audio-stream
  → Float32Array buffer (2048 samples)
  → YIN Algorithm
  → Smoothing filter
  → UI update
```

**Performance Metrics:**
- Accuracy: ±50 cents (success threshold)
- Latency: ~43ms at 48kHz
- Frequency Range: 80Hz - 1000Hz
- Confidence Threshold: 0.85

---

## 📊 8-Week Curriculum

| Week | Focus | Exercises | Days/Week |
|------|-------|-----------|-----------|
| 1 | Foundation | Breathing basics + simple warm-ups | 3 |
| 2 | Consistency | Daily practice routine | 4 |
| 3 | Range Building | Full octave practice | 4 |
| 4 | Precision | Interval accuracy | 5 |
| 5 | Stamina | Longer exercises | 5 |
| 6 | Refinement | Tone quality | 5 |
| 7 | Challenge | Advanced intervals | 5 |
| 8 | Mastery | Custom workouts | 6 |

---

## 🎨 Design System

Built with iOS Human Interface Guidelines:

- **Typography**: SF Pro (system font)
- **Colors**: Dark theme with brand accents
- **Animations**: 60fps using Reanimated
- **Graphics**: Skia Canvas for complex visualizations
- **Spacing**: 8px grid system

See [src/design/DesignSystem.ts](src/design/DesignSystem.ts) for complete design tokens.

---

## 🧪 Testing

### Manual Testing

```bash
# Run on iPhone 16 Pro Simulator
npx expo run:ios

# Test critical flows:
# 1. Home screen loads without crashes
# 2. JourneyProgress shows "Week 1: Foundation"
# 3. Start breathing exercise
# 4. Start vocal exercise
# 5. Verify progress persistence
```

See [STEP_BY_STEP_TESTING_GUIDE.md](STEP_BY_STEP_TESTING_GUIDE.md) for comprehensive testing instructions.

---

## 📦 Deployment

### App Store Preparation

See [APP_STORE_DEPLOYMENT_GUIDE.md](APP_STORE_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

**Quick summary:**

```bash
# Configure EAS
npm install -g eas-cli
eas login
eas build:configure

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

---

## 🗺️ Roadmap

### ✅ Completed (v1.0)
- [x] Real-time pitch detection (YIN algorithm)
- [x] 8-week structured curriculum
- [x] 11 professional exercises
- [x] Progress tracking & persistence
- [x] iOS native build
- [x] Comprehensive documentation

### 🚧 Phase 1: Visual Enhancements (In Progress)
- [ ] Lottie animations for breathing exercises
- [ ] Posture diagrams in exercise preview
- [ ] Technique tips overlay during exercises

### 📋 Phase 2: Video Demonstrations
- [ ] Professional vocal coach videos
- [ ] Technique breakdowns
- [ ] Common mistakes guide

### 🔮 Phase 3: Advanced Features
- [ ] AR posture correction
- [ ] Vocal range assessment
- [ ] Custom workout builder
- [ ] Social sharing
- [ ] Progress charts
- [ ] Streak tracking

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

**Proprietary License** - All rights reserved.

This code is provided for portfolio and educational purposes only. Commercial use, modification, or distribution requires explicit permission.

---

## 🙏 Acknowledgments

- **University of Iowa** - Piano sample library
- **YIN Algorithm** - de Cheveigné, A., & Kawahara, H. (2002)
- **Expo Team** - Excellent React Native framework
- **React Native Community** - Open source contributions

---

## 📞 Contact

**Rohan Bhandari**
- GitHub: [@rohanbsher](https://github.com/rohanbsher)
- Repository: [github.com/rohanbsher/PitchPerfect](https://github.com/rohanbsher/PitchPerfect)

---

## 🎵 Built with passion for music education and technology

**Star this repo if you find it useful!** ⭐
