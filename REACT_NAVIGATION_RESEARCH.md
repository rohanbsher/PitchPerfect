# React Navigation Research Report
**Comprehensive Guide for PitchPerfect Vocal Training App**

**Date:** 2025-10-11
**Target:** Expo SDK 54 + React Navigation Implementation
**Goal:** Implement 3-tab bottom navigation (Home, Practice, Progress) with modal support

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Installation Guide](#installation-guide)
3. [React Navigation v6 vs v7](#react-navigation-v6-vs-v7)
4. [Architecture Overview](#architecture-overview)
5. [Bottom Tab Navigator Implementation](#bottom-tab-navigator-implementation)
6. [Modal Navigation Patterns](#modal-navigation-patterns)
7. [State Management with Tabs](#state-management-with-tabs)
8. [Icon Libraries & Styling](#icon-libraries--styling)
9. [Accessibility Implementation](#accessibility-implementation)
10. [Performance Optimization](#performance-optimization)
11. [Deep Linking & Push Notifications](#deep-linking--push-notifications)
12. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
13. [Testing Strategy](#testing-strategy)
14. [Migration Checklist](#migration-checklist)

---

## Executive Summary

### Current State
- **Expo SDK:** 54 (React Native 0.81.4, React 19.1.0)
- **Architecture:** Single screen app (ExerciseScreenComplete)
- **Dependencies:** Already includes `react-native-safe-area-context` (v5.6.1), `react-native-gesture-handler` (v2.28.0), `react-native-reanimated` (v4.1.1)

### Key Findings
1. **React Navigation v7 is recommended** for Expo SDK 54 (v6 still compatible but deprecated behavior)
2. **Expo SDK 54** requires React Navigation 7+ for optimal compatibility
3. **Breaking change in v7:** `navigate()` now behaves like `push()` (always adds new screen)
4. **Critical for audio apps:** Proper cleanup of audio contexts and animation frames when navigating
5. **State persistence** is straightforward with AsyncStorage integration

### Installation Requirements
- `@react-navigation/native` (core)
- `@react-navigation/bottom-tabs` (for tabs)
- `@react-navigation/native-stack` (for modals)
- `react-native-screens` (already satisfied via Expo)
- `react-native-safe-area-context` (already installed)

---

## Installation Guide

### Step 1: Install Core Dependencies

```bash
# Install React Navigation core and bottom tabs
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack

# Install/update required dependencies using Expo CLI (ensures SDK compatibility)
npx expo install react-native-screens react-native-safe-area-context
```

**Note:** Your project already has `react-native-safe-area-context@5.6.1` and `react-native-screens` (via Expo SDK 54), but running `npx expo install` ensures version compatibility.

### Step 2: Verify package.json Dependencies

After installation, your `package.json` should include:

```json
{
  "dependencies": {
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "react-native-screens": "~4.6.0",
    "react-native-safe-area-context": "~5.6.1",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "~4.1.1"
  }
}
```

### Step 3: Wrap App with NavigationContainer

Update `App.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

### Installation Verification

Test that navigation is working:

```bash
# Clear cache and rebuild
npm run start:dev

# Or for iOS
npm run ios

# Or for Android
npm run android
```

---

## React Navigation v6 vs v7

### Version Timeline
- **Expo SDK 52** (Nov 2024): React Navigation v7 released
- **Expo SDK 54** (2025): React Navigation v7 is the recommended version

### Key Breaking Changes in v7

#### 1. `navigate()` Behavior Change (CRITICAL)

**v6 Behavior:**
```javascript
navigation.navigate('Profile'); // Goes to existing screen if already in stack
navigation.navigate('Profile'); // Second call does nothing (already there)
```

**v7 Behavior:**
```javascript
navigation.navigate('Profile'); // Always pushes new screen instance
navigation.navigate('Profile'); // Pushes ANOTHER Profile screen (stack grows)
```

**Migration Fix:**
```javascript
// OLD (v6): navigation.navigate('Profile')
// NEW (v7): Use navigation.push() or navigation.navigate() + state tracking

// Option 1: Use push explicitly
navigation.push('Profile');

// Option 2: Use popTo for going back to existing screen
navigation.popTo('Profile'); // New in v7

// Option 3: Check if screen exists before navigating
const existingRoute = navigation.getState().routes.find(r => r.name === 'Profile');
if (existingRoute) {
  navigation.navigate('Profile'); // Won't duplicate
}
```

#### 2. Static API (New Recommended Pattern)

**v7 introduces static configuration** for cleaner TypeScript support and deep linking:

```typescript
// OLD (v6): Dynamic configuration
<Stack.Navigator>
  <Stack.Screen name="Home" component={HomeScreen} />
</Stack.Navigator>

// NEW (v7): Static configuration (recommended)
const Stack = createNativeStackNavigator({
  screens: {
    Home: HomeScreen,
    Profile: ProfileScreen,
  },
  groups: {
    Modal: {
      screenOptions: { presentation: 'modal' },
      screens: {
        Settings: SettingsModal,
      },
    },
  },
});
```

#### 3. TypeScript Improvements

v7 has better type inference with static API, reducing boilerplate for route params and navigation props.

### Migration Resources
- Official guide: https://reactnavigation.org/docs/upgrading-from-6.x/
- GitHub PR example: https://github.com/LedgerHQ/ledger-live/pull/11205

### Recommendation for PitchPerfect
**Use React Navigation v7** for Expo SDK 54. The `navigate()` behavior change is the main gotcha - use `push()` or check existing routes when navigating to exercise screens.

---

## Architecture Overview

### Proposed Navigation Structure

```
NavigationContainer (root)
│
└── RootStackNavigator (NativeStack)
    ├── TabNavigator (BottomTabs) ← Main app flow
    │   ├── HomeTab (Screen)
    │   ├── PracticeTab (Screen)
    │   └── ProgressTab (Screen)
    │
    └── Modal Group (presentation: 'modal')
        ├── ExerciseModal (full-screen, cannot navigate away)
        ├── SettingsModal
        └── ResultsModal
```

### Why This Architecture?

1. **Root Stack at Top Level:**
   - Allows modals to appear over tab bar
   - Enables full-screen exercise mode without tab bar interference
   - Supports global actions (e.g., deep links, push notifications)

2. **Tabs Below Root:**
   - Home, Practice, Progress tabs always visible
   - Each tab can have its own stack navigator (if needed for sub-navigation)
   - Tab state preserved when switching tabs

3. **Modals in Root Stack:**
   - Exercise sessions displayed as full-screen modals
   - User cannot accidentally navigate away during exercise
   - Swipe-to-dismiss disabled (use explicit "End" button)
   - Results screen also a modal (prevents back navigation)

### Visual Diagram

```
┌─────────────────────────────────────┐
│  NavigationContainer                │
│  ┌───────────────────────────────┐  │
│  │ RootStack                     │  │
│  │ ┌─────────────────────────┐   │  │
│  │ │ TabNavigator            │   │  │
│  │ │ ┌─────┬─────┬─────┐     │   │  │
│  │ │ │Home │Prac │Prog │     │   │  │  ← Normal flow
│  │ │ └─────┴─────┴─────┘     │   │  │
│  │ └─────────────────────────┘   │  │
│  │                               │  │
│  │ ┌─────────────────────────┐   │  │
│  │ │ ExerciseModal (overlay) │   │  │  ← Covers tabs
│  │ │ [Pitch visualization]   │   │  │
│  │ │ [Cannot swipe away]     │   │  │
│  │ └─────────────────────────┘   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### File Structure

```
src/
├── navigation/
│   ├── RootNavigator.tsx          # Root stack with tabs + modals
│   ├── TabNavigator.tsx           # Bottom tab navigator (Home/Practice/Progress)
│   ├── types.ts                   # TypeScript navigation types
│   └── linking.ts                 # Deep linking configuration
│
├── screens/
│   ├── tabs/
│   │   ├── HomeScreen.tsx         # Refactored from ExerciseScreenComplete
│   │   ├── PracticeScreen.tsx     # List of exercises
│   │   └── ProgressScreen.tsx     # Stats, streaks, history
│   │
│   └── modals/
│       ├── ExerciseModal.tsx      # Full-screen exercise session
│       ├── ResultsModal.tsx       # Post-exercise results
│       └── SettingsModal.tsx      # App settings
│
└── components/                    # Existing components (PitchVisualizer, etc.)
```

---

## Bottom Tab Navigator Implementation

### Basic Setup

#### 1. Create TabNavigator.tsx

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import screens
import { HomeScreen } from '../screens/tabs/HomeScreen';
import { PracticeScreen } from '../screens/tabs/PracticeScreen';
import { ProgressScreen } from '../screens/tabs/ProgressScreen';

// Types
export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Progress: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Tab bar icons
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Practice') {
            iconName = focused ? 'musical-notes' : 'musical-notes-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName!} size={size} color={color} />;
        },

        // Colors
        tabBarActiveTintColor: '#007AFF', // iOS blue
        tabBarInactiveTintColor: 'gray',

        // Tab bar styling
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: Platform.OS === 'ios' ? 88 : 60, // iOS includes safe area
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
        },

        // Tab item styling
        tabBarItemStyle: {
          paddingVertical: 5,
        },

        // Label styling
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

        // Header
        headerShown: false, // Hide header, use custom header in screens

        // Performance
        lazy: true, // Lazy load tabs (default: true)
        detachInactiveScreens: true, // Detach inactive screens (default: true, saves memory)
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarBadge: undefined, // Can add notification badge here
        }}
      />
      <Tab.Screen
        name="Practice"
        component={PracticeScreen}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
      />
    </Tab.Navigator>
  );
}
```

#### 2. Create RootNavigator.tsx

```typescript
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';

// Import modals
import { ExerciseModal } from '../screens/modals/ExerciseModal';
import { ResultsModal } from '../screens/modals/ResultsModal';
import { SettingsModal } from '../screens/modals/SettingsModal';

// Types
export type RootStackParamList = {
  MainTabs: undefined;
  ExerciseModal: { exerciseId: string };
  ResultsModal: { results: any }; // Replace 'any' with ExerciseResults type
  SettingsModal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // No headers by default
      }}
    >
      {/* Main tab flow */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Modal screens */}
      <Stack.Group
        screenOptions={{
          presentation: 'fullScreenModal', // Full-screen modal (iOS/Android)
          gestureEnabled: false, // Disable swipe-to-dismiss (important for exercises!)
          animation: 'slide_from_bottom', // Bottom-to-top animation
        }}
      >
        <Stack.Screen
          name="ExerciseModal"
          component={ExerciseModal}
          options={{
            // Optional: Custom header for modal
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ResultsModal"
          component={ResultsModal}
        />
      </Stack.Group>

      {/* Settings modal (swipe-to-dismiss allowed) */}
      <Stack.Screen
        name="SettingsModal"
        component={SettingsModal}
        options={{
          presentation: 'modal', // Regular modal (can swipe down on iOS)
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
}
```

### Platform-Specific Styling

#### iOS vs Android Differences

| Feature | iOS | Android |
|---------|-----|---------|
| **Tab Bar Height** | 88px (includes safe area) | 60px |
| **Active Indicator** | None (just color change) | Material ripple effect |
| **Icons** | SF Symbols preferred | Material Icons preferred |
| **Blur Effect** | Native blur available | No native blur (use backgroundColor) |
| **Safe Area** | Built-in bottom padding | No built-in padding |

#### Platform-Specific Tab Bar

```typescript
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

// Custom tab bar with platform-specific blur (optional)
function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <BlurView
      intensity={Platform.OS === 'ios' ? 80 : 0} // Blur only on iOS
      tint="light"
      style={styles.tabBar}
    >
      {/* Tab bar content */}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    height: Platform.OS === 'ios' ? 88 : 60,
  },
});
```

### Advanced Tab Bar Customization

#### Custom Tab Bar Component

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tab}
          >
            {options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? '#007AFF' : '#8E8E93',
              size: 24
            })}
            <Text style={[styles.label, { color: isFocused ? '#007AFF' : '#8E8E93' }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

// Use in TabNavigator
<Tab.Navigator tabBar={props => <CustomTabBar {...props} />}>
  {/* Screens */}
</Tab.Navigator>
```

### Tab Bar Badges (Notifications)

```typescript
<Tab.Screen
  name="Progress"
  component={ProgressScreen}
  options={{
    tabBarBadge: 3, // Number badge
    tabBarBadgeStyle: {
      backgroundColor: '#FF3B30', // iOS red
      color: '#FFFFFF',
    },
  }}
/>
```

---

## Modal Navigation Patterns

### Full-Screen Exercise Modal

#### When to Use Full-Screen Modals
- **Exercise sessions:** User must complete or explicitly quit (no accidental dismissal)
- **Critical flows:** Onboarding, payment, permissions
- **Immersive experiences:** Games, video playback, AR/VR

#### Implementation

```typescript
// In RootNavigator.tsx
<Stack.Group
  screenOptions={{
    presentation: 'fullScreenModal', // Cannot swipe away
    gestureEnabled: false, // Disable swipe gesture
    animation: 'slide_from_bottom',
  }}
>
  <Stack.Screen
    name="ExerciseModal"
    component={ExerciseModal}
    options={{
      headerShown: false,
    }}
  />
</Stack.Group>
```

#### ExerciseModal.tsx Example

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { PitchScaleVisualizer } from '../../components/PitchScaleVisualizer';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseModal'>;

export function ExerciseModal({ navigation, route }: Props) {
  const { exerciseId } = route.params;

  // CRITICAL: Clean up audio context on unmount
  useEffect(() => {
    return () => {
      // Clean up audio stream, pitch detector, animation frames, etc.
      console.log('ExerciseModal unmounting - cleaning up resources');
    };
  }, []);

  const handleEndSession = () => {
    // Show confirmation alert
    Alert.alert(
      'End Session?',
      'Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            // Clean up audio resources
            // Then navigate to results
            navigation.replace('ResultsModal', { results: /* ... */ });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Close button (top-left) */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleEndSession}
      >
        <Text style={styles.closeText}>End</Text>
      </TouchableOpacity>

      {/* Exercise content */}
      <PitchScaleVisualizer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Presentation Styles

| Style | iOS Behavior | Android Behavior | Use Case |
|-------|--------------|------------------|----------|
| `card` | Slide from right | Slide from right | Default screen transitions |
| `modal` | Slide from bottom, can swipe down | Slide from bottom | Settings, filters, optional actions |
| `transparentModal` | Slide from bottom, previous screen visible | Slide from bottom | Overlays, pickers |
| `fullScreenModal` | Slide from bottom, cannot swipe away | Slide from bottom | Exercises, critical flows |
| `containedModal` | UIModalPresentationCurrentContext | Same as modal | Context-specific modals |
| `formSheet` | Bottom sheet (iOS), full-screen (Android) | Bottom sheet | Quick actions, forms |

### Disabling Swipe-to-Dismiss

```typescript
// IMPORTANT for exercise screens - prevent accidental exits
<Stack.Screen
  name="ExerciseModal"
  component={ExerciseModal}
  options={{
    presentation: 'fullScreenModal',
    gestureEnabled: false, // Disable swipe gesture
    headerShown: false,
  }}
/>
```

### State Preservation on Modal Dismissal

```typescript
// Option 1: Pass state back via navigation.navigate params
navigation.navigate('MainTabs', {
  screen: 'Home',
  params: { exerciseCompleted: true }
});

// Option 2: Use global state (Context API, Redux)
// Option 3: Use AsyncStorage for persistence

// Example: Using navigation params
type HomeScreenProps = NativeStackScreenProps<TabParamList, 'Home'>;

function HomeScreen({ route }: HomeScreenProps) {
  const { exerciseCompleted } = route.params || {};

  useEffect(() => {
    if (exerciseCompleted) {
      // Show success message, update UI, etc.
    }
  }, [exerciseCompleted]);
}
```

---

## State Management with Tabs

### Tab State Persistence (Scroll Position)

#### Problem
By default, React Navigation unmounts inactive tabs to save memory (`detachInactiveScreens: true`). This means scroll positions and component state are lost when switching tabs.

#### Solution 1: Disable Detaching (Simple, Higher Memory)

```typescript
<Tab.Navigator
  screenOptions={{
    detachInactiveScreens: false, // Keep all tabs mounted
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

**Pros:**
- Simple, no code changes needed
- Scroll position automatically preserved

**Cons:**
- Higher memory usage (all tabs stay in memory)
- Inactive tabs still re-render on state changes

#### Solution 2: Manual Scroll Position Tracking (Recommended)

```typescript
import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

function ProgressScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Restore scroll position when tab becomes focused
  useFocusEffect(
    React.useCallback(() => {
      // Wait for layout, then restore scroll
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
      }, 100);
    }, [scrollPosition])
  );

  const handleScroll = (event) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Content */}
    </ScrollView>
  );
}
```

#### Solution 3: AsyncStorage for Persistent State

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save state when tab loses focus
useFocusEffect(
  React.useCallback(() => {
    return () => {
      // Save scroll position on blur
      AsyncStorage.setItem('progressScrollPosition', scrollPosition.toString());
    };
  }, [scrollPosition])
);

// Restore on mount
useEffect(() => {
  AsyncStorage.getItem('progressScrollPosition').then((value) => {
    if (value) {
      setScrollPosition(Number(value));
    }
  });
}, []);
```

### Preventing Unnecessary Re-Renders

#### Problem
Tab screens re-render when tab bar state changes (e.g., switching tabs).

#### Solution: React.memo + useFocusEffect

```typescript
import React, { memo } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  // Only re-render if 'data' prop changes
  return <View>{/* ... */}</View>;
});

function HomeScreen() {
  const [isTabFocused, setIsTabFocused] = useState(false);

  // Only run effects when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setIsTabFocused(true);

      // Start animations, fetch data, etc.

      return () => {
        setIsTabFocused(false);
        // Clean up animations, cancel requests, etc.
      };
    }, [])
  );

  return (
    <View>
      {isTabFocused && <ExpensiveComponent data={data} />}
    </View>
  );
}
```

### AsyncStorage Integration for Navigation State

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
        const state = savedStateString ? JSON.parse(savedStateString) : undefined;

        if (state !== undefined) {
          setInitialState(state);
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady) {
    return null; // Or <LoadingScreen />
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) =>
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
      }
    >
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### Redux/Context API Integration

#### Using Context API (Recommended for PitchPerfect)

```typescript
// UserProgressContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserProgressContextType = {
  streak: number;
  completedExercises: number;
  updateProgress: (exerciseId: string) => void;
};

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export function UserProgressProvider({ children }) {
  const [streak, setStreak] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(0);

  useEffect(() => {
    // Load from AsyncStorage
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const data = await AsyncStorage.getItem('userProgress');
    if (data) {
      const { streak, completedExercises } = JSON.parse(data);
      setStreak(streak);
      setCompletedExercises(completedExercises);
    }
  };

  const updateProgress = async (exerciseId: string) => {
    // Update state
    setCompletedExercises((prev) => prev + 1);

    // Save to AsyncStorage
    await AsyncStorage.setItem('userProgress', JSON.stringify({
      streak,
      completedExercises: completedExercises + 1,
    }));
  };

  return (
    <UserProgressContext.Provider value={{ streak, completedExercises, updateProgress }}>
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error('useUserProgress must be used within UserProgressProvider');
  }
  return context;
}

// In App.tsx
<UserProgressProvider>
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
</UserProgressProvider>
```

#### Redux Integration (Optional)

React Navigation works with Redux, but it's **not recommended** to store navigation state in Redux. Instead:
- Store app data in Redux (user progress, settings, etc.)
- Let React Navigation manage navigation state internally

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import userProgressReducer from './userProgressSlice';

export const store = configureStore({
  reducer: {
    userProgress: userProgressReducer,
  },
});

// In App.tsx
import { Provider } from 'react-redux';
import { store } from './store';

<Provider store={store}>
  <NavigationContainer>
    <RootNavigator />
  </NavigationContainer>
</Provider>
```

---

## Icon Libraries & Styling

### Icon Libraries Compatible with Expo

#### 1. @expo/vector-icons (Recommended)

**Pre-installed with Expo.** Includes multiple icon sets:
- **Ionicons** (iOS-style, recommended for tabs)
- **MaterialIcons** (Android-style)
- **FontAwesome**
- **Feather**
- **AntDesign**

```typescript
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Usage in tab bar
tabBarIcon: ({ focused, color, size }) => {
  const iconName = focused ? 'home' : 'home-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
}
```

**Icon Search:** https://icons.expo.fyi/

#### 2. SF Symbols (iOS Only)

For native iOS feel, use SF Symbols via `expo-symbols`:

```bash
npx expo install expo-symbols
```

```typescript
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

tabBarIcon: ({ focused, color, size }) => {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name="house.fill"
        tintColor={color}
        size={size}
      />
    );
  } else {
    return <Ionicons name="home" size={size} color={color} />;
  }
}
```

**SF Symbols Browser:** Download Apple's SF Symbols app (macOS only)

### Recommended Icons for PitchPerfect Tabs

| Tab | Ionicons (iOS/Android) | SF Symbol (iOS) |
|-----|------------------------|-----------------|
| **Home** | `home` / `home-outline` | `house.fill` / `house` |
| **Practice** | `musical-notes` / `musical-notes-outline` | `music.note.list` |
| **Progress** | `stats-chart` / `stats-chart-outline` | `chart.bar.fill` / `chart.bar` |

### Tab Bar Styling Examples

#### 1. iOS Native Style

```typescript
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#007AFF', // iOS blue
    tabBarInactiveTintColor: '#8E8E93', // iOS gray
    tabBarStyle: {
      backgroundColor: '#F9F9F9', // iOS light gray
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
      height: 88,
      paddingBottom: 20,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '500',
    },
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

#### 2. Material Design (Android) Style

```typescript
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: '#6200EE', // Material purple
    tabBarInactiveTintColor: '#757575', // Material gray
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 0,
      elevation: 8, // Android shadow
      height: 60,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600',
    },
    tabBarItemStyle: {
      paddingVertical: 8,
    },
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

#### 3. Dark Mode Support

```typescript
import { useColorScheme } from 'react-native';

function TabNavigator() {
  const colorScheme = useColorScheme(); // 'light' or 'dark'

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F9F9F9',
          borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Tabs */}
    </Tab.Navigator>
  );
}
```

---

## Accessibility Implementation

### VoiceOver (iOS) & TalkBack (Android) Support

React Navigation has built-in accessibility, but you need to enhance it for screen readers.

### Key Accessibility Props

```typescript
<Tab.Screen
  name="Home"
  component={HomeScreen}
  options={{
    tabBarLabel: 'Home',
    tabBarAccessibilityLabel: 'Home tab, navigate to home screen', // Screen reader announcement
    tabBarTestID: 'home-tab', // For automated testing
  }}
/>
```

### Custom Tab Bar with Full Accessibility

```typescript
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="tablist" // Announce as tab list
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="tab" // Announce as tab
            accessibilityState={{
              selected: isFocused, // Announce selected state
            }}
            accessibilityLabel={
              options.tabBarAccessibilityLabel ||
              `${route.name} tab, ${index + 1} of ${state.routes.length}`
            }
            accessibilityHint={`Navigates to the ${route.name} screen`} // What happens on tap
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
          >
            {/* Icon and label */}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
```

### Modal Accessibility

```typescript
// ExerciseModal.tsx
<View
  style={styles.container}
  accessibilityViewIsModal={true} // Prevent VoiceOver from reading background
>
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel="End exercise session"
    accessibilityHint="Ends the current exercise and saves your progress"
    onPress={handleEndSession}
  >
    <Text>End</Text>
  </TouchableOpacity>
</View>
```

### Screen Announcements

```typescript
import { AccessibilityInfo } from 'react-native';

// Announce when exercise starts
useEffect(() => {
  AccessibilityInfo.announceForAccessibility(
    'Exercise started. Follow the pitch guide to practice your vocal range.'
  );
}, []);

// Announce score changes
useEffect(() => {
  if (accuracy > 90) {
    AccessibilityInfo.announceForAccessibility('Excellent! You hit 90% accuracy.');
  }
}, [accuracy]);
```

### Testing with Screen Readers

#### iOS (VoiceOver)
1. Enable: Settings > Accessibility > VoiceOver > ON
2. Gestures:
   - Swipe right/left: Navigate elements
   - Double-tap: Activate element
   - Three-finger swipe: Scroll

#### Android (TalkBack)
1. Enable: Settings > Accessibility > TalkBack > ON
2. Gestures:
   - Swipe right/left: Navigate elements
   - Double-tap: Activate element
   - Two-finger swipe: Scroll

### Best Practices
- Always provide `accessibilityLabel` for custom components
- Use `accessibilityHint` to describe what happens after interaction
- Announce dynamic content changes with `AccessibilityInfo.announceForAccessibility()`
- Test with screen readers enabled (don't look at screen!)
- Ensure tap targets are at least 44x44 points (iOS HIG)

---

## Performance Optimization

### 1. Lazy Loading Tabs

**Default behavior:** Tabs are lazily initialized (not rendered until focused).

```typescript
<Tab.Navigator
  screenOptions={{
    lazy: true, // Default: true (lazy load tabs)
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

**Override for specific tabs:**

```typescript
<Tab.Screen
  name="Home"
  component={HomeScreen}
  options={{
    lazy: false, // Always mount Home tab (eager loading)
  }}
/>
```

### 2. Detaching Inactive Screens

**Default behavior:** Inactive screens are detached from view hierarchy to save memory.

```typescript
<Tab.Navigator
  screenOptions={{
    detachInactiveScreens: true, // Default: true (saves memory)
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

**Trade-off:**
- `true`: Lower memory, but loses scroll position/component state
- `false`: Higher memory, preserves state

### 3. Preloading Screens (React Navigation 7+)

**Preload heavy screens before user navigates to them:**

```typescript
import { useNavigation } from '@react-navigation/native';

function HomeScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // Preload Practice tab in background
    navigation.preload('Practice');
  }, [navigation]);

  return <View>{/* ... */}</View>;
}
```

**Use case:** Preload exercise screens while user views instructions.

### 4. Freeze Inactive Screens (React Native Screens)

**Automatically freeze inactive screens to prevent re-renders:**

```typescript
import { enableFreeze } from 'react-native-screens';

// In App.tsx or index.js
enableFreeze(true);

// Then in tab navigator
<Tab.Navigator
  screenOptions={{
    freezeOnBlur: true, // Freeze inactive tabs (React Navigation 7+)
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

**Effect:** Inactive tabs won't re-render when state changes in active tab.

### 5. Optimize Heavy Components

```typescript
import React, { memo, useMemo } from 'react';
import { FlatList } from 'react-native';

// Memoize expensive components
const ExerciseCard = memo(({ exercise }) => {
  return <View>{/* ... */}</View>;
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if exercise ID changes
  return prevProps.exercise.id === nextProps.exercise.id;
});

function PracticeScreen() {
  // Memoize computed values
  const sortedExercises = useMemo(() => {
    return exercises.sort((a, b) => a.difficulty - b.difficulty);
  }, [exercises]);

  return (
    <FlatList
      data={sortedExercises}
      renderItem={({ item }) => <ExerciseCard exercise={item} />}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true} // Unmount off-screen items
      maxToRenderPerBatch={10} // Render 10 items per batch
      windowSize={5} // Render 5 screens worth of items
    />
  );
}
```

### 6. Audio Context Cleanup (CRITICAL for PitchPerfect)

**Problem:** Audio streams and pitch detectors can cause memory leaks if not cleaned up.

**Solution:**

```typescript
import { useFocusEffect } from '@react-navigation/native';

function ExerciseModal() {
  const audioServiceRef = useRef<IAudioService | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up when modal is dismissed
  useEffect(() => {
    return () => {
      console.log('ExerciseModal: Cleaning up audio resources');

      // Stop audio stream
      if (audioServiceRef.current) {
        audioServiceRef.current.stop();
        audioServiceRef.current = null;
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Also clean up when tab loses focus (if exercise is in tab)
  useFocusEffect(
    React.useCallback(() => {
      // Start audio on focus
      audioServiceRef.current = AudioServiceFactory.create();
      audioServiceRef.current.start();

      return () => {
        // Stop audio on blur
        audioServiceRef.current?.stop();
      };
    }, [])
  );

  return <View>{/* ... */}</View>;
}
```

### 7. Animation Frame Cleanup

```typescript
function PitchVisualizer() {
  const animationFrameRef = useRef<number | null>(null);

  const animate = () => {
    // Update visualization
    // ...

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animate();

    return () => {
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <Canvas />;
}
```

### 8. Performance Monitoring

```typescript
import { InteractionManager } from 'react-native';

function HomeScreen() {
  useEffect(() => {
    // Wait for animations to complete before running heavy operations
    const task = InteractionManager.runAfterInteractions(() => {
      // Fetch data, load images, etc.
    });

    return () => task.cancel();
  }, []);

  return <View>{/* ... */}</View>;
}
```

### Performance Checklist for PitchPerfect
- [ ] Enable lazy loading for all tabs (`lazy: true`)
- [ ] Use `detachInactiveScreens: true` for memory savings
- [ ] Preload Exercise modal while user reads instructions
- [ ] Clean up audio streams in `useEffect` cleanup
- [ ] Cancel animation frames when components unmount
- [ ] Use `useFocusEffect` to pause/resume audio on tab switch
- [ ] Memoize expensive components (PitchVisualizer, etc.)
- [ ] Use `freezeOnBlur` to prevent inactive tab re-renders
- [ ] Test memory usage with React DevTools Profiler

---

## Deep Linking & Push Notifications

### Deep Linking Setup

Deep linking allows users to open specific screens from URLs (e.g., `pitchperfect://exercise/scales`).

#### 1. Configure URL Scheme in app.json

```json
{
  "expo": {
    "scheme": "pitchperfect",
    "ios": {
      "bundleIdentifier": "com.yourcompany.pitchperfect"
    },
    "android": {
      "package": "com.yourcompany.pitchperfect"
    }
  }
}
```

#### 2. Configure Linking in NavigationContainer

```typescript
// src/navigation/linking.ts
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './RootNavigator';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'), // Expo Go deep links
    'pitchperfect://', // Production app deep links
    'https://pitchperfect.app', // Universal links (requires domain setup)
  ],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Practice: 'practice',
          Progress: 'progress',
        },
      },
      ExerciseModal: {
        path: 'exercise/:exerciseId', // pitchperfect://exercise/scales
      },
      ResultsModal: 'results',
      SettingsModal: 'settings',
    },
  },
};

export default linking;
```

#### 3. Apply Linking in App.tsx

```typescript
import { NavigationContainer } from '@react-navigation/native';
import linking from './src/navigation/linking';

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

#### 4. Test Deep Links

**Expo Go (Development):**
```bash
# iOS
npx uri-scheme open "exp://192.168.1.100:8081/--/exercise/scales" --ios

# Android
npx uri-scheme open "exp://192.168.1.100:8081/--/exercise/scales" --android
```

**Production Build:**
```bash
# iOS
npx uri-scheme open "pitchperfect://exercise/scales" --ios

# Android
npx uri-scheme open "pitchperfect://exercise/scales" --android
```

### Push Notifications with Navigation

#### Setup (Expo Notifications)

```bash
npx expo install expo-notifications
```

#### Configure Notifications + Deep Links

```typescript
// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Custom linking integration
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['pitchperfect://'],
  config: {
    screens: { /* ... */ },
  },

  // Custom getInitialURL for notifications
  async getInitialURL() {
    // Check if app was opened from notification
    const notification = await Notifications.getLastNotificationResponseAsync();
    if (notification) {
      const deepLink = notification.notification.request.content.data.deepLink;
      return deepLink; // e.g., "pitchperfect://exercise/scales"
    }

    // Default deep link handling
    const url = await Linking.getInitialURL();
    return url;
  },

  // Subscribe to notification taps while app is running
  subscribe(listener) {
    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const deepLink = response.notification.request.content.data.deepLink;
      if (deepLink) {
        listener(deepLink); // Navigate to deep link
      }
    });

    // Handle URL opens (from Safari, etc.)
    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });

    return () => {
      subscription.remove();
      urlSubscription.remove();
    };
  },
};
```

#### Send Notification with Deep Link

```typescript
// Schedule notification (e.g., daily practice reminder)
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Time to practice!',
    body: 'Complete your daily vocal warm-up',
    data: {
      deepLink: 'pitchperfect://exercise/warmup', // Deep link to specific exercise
    },
  },
  trigger: {
    hour: 9, // 9 AM
    minute: 0,
    repeats: true,
  },
});
```

#### Handle Navigation from Notification

```typescript
// In App.tsx or root component
import * as Notifications from 'expo-notifications';

function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Handle notification tap while app is open
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const deepLink = response.notification.request.content.data.deepLink;

      if (deepLink && navigationRef.isReady()) {
        // Parse deep link and navigate
        // e.g., "pitchperfect://exercise/scales"
        const [, screen, param] = deepLink.match(/pitchperfect:\/\/(\w+)\/(\w+)/);

        if (screen === 'exercise') {
          navigationRef.navigate('ExerciseModal', { exerciseId: param });
        }
      }
    });

    return () => subscription.remove();
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### Universal Links (iOS/Android)

For production, use universal links (open app from web links):

**iOS:** Add Associated Domains in Xcode
**Android:** Add intent filters in AndroidManifest.xml

See: https://docs.expo.dev/guides/linking/#universal-links-ios

---

## Common Pitfalls & Solutions

### 1. Memory Leaks in Tab Navigators

**Problem:** Audio contexts, event listeners, or animation frames not cleaned up when switching tabs.

**Solution:**
```typescript
import { useFocusEffect } from '@react-navigation/native';

function ExerciseScreen() {
  const audioServiceRef = useRef<IAudioService | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      // Start audio when tab is focused
      audioServiceRef.current = AudioServiceFactory.create();
      audioServiceRef.current.start();

      return () => {
        // Stop audio when tab loses focus
        console.log('Tab blurred - stopping audio');
        audioServiceRef.current?.stop();
        audioServiceRef.current = null;
      };
    }, [])
  );

  return <View>{/* ... */}</View>;
}
```

### 2. Audio Context Conflicts with Navigation

**Problem:** Multiple audio contexts created when navigating between screens, causing distortion or crashes.

**Solution:** Use a global audio service with singleton pattern:

```typescript
// src/services/audio/AudioServiceSingleton.ts
class AudioServiceSingleton {
  private static instance: IAudioService | null = null;

  static getInstance(): IAudioService {
    if (!this.instance) {
      this.instance = AudioServiceFactory.create();
    }
    return this.instance;
  }

  static destroyInstance() {
    if (this.instance) {
      this.instance.stop();
      this.instance = null;
    }
  }
}

// In components
const audioService = AudioServiceSingleton.getInstance();
```

### 3. Animation Frame Cleanup on Unmount

**Problem:** `requestAnimationFrame` keeps running after component unmounts, causing crashes.

**Solution:**
```typescript
function PitchVisualizer() {
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const animate = () => {
    if (!isMountedRef.current) return; // Guard clause

    // Update visualization
    // ...

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    isMountedRef.current = true;
    animate();

    return () => {
      isMountedRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <Canvas />;
}
```

### 4. Tab Bar Not Showing on Android

**Problem:** Tab bar hidden or cut off on Android.

**Solution:** Check `android.edgeToEdgeEnabled` in app.json:

```json
{
  "expo": {
    "android": {
      "edgeToEdgeEnabled": false // or use SafeAreaView
    }
  }
}
```

Or wrap tab navigator in `SafeAreaView`:

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

function TabNavigator() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <Tab.Navigator>{/* ... */}</Tab.Navigator>
    </SafeAreaView>
  );
}
```

### 5. Modal Not Dismissing on iOS

**Problem:** Modal swipe-to-dismiss gesture not working.

**Solution:**
```typescript
<Stack.Screen
  name="SettingsModal"
  component={SettingsModal}
  options={{
    presentation: 'modal', // Not 'fullScreenModal'
    gestureEnabled: true, // Enable swipe gesture
  }}
/>
```

### 6. Deep Linking Not Working

**Problem:** Deep links don't navigate to correct screen.

**Solution:** Check linking config paths:

```typescript
const linking = {
  prefixes: ['pitchperfect://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: '', // pitchperfect:// (empty path for home)
          Practice: 'practice', // pitchperfect://practice
        },
      },
      ExerciseModal: 'exercise/:exerciseId', // pitchperfect://exercise/scales
    },
  },
};
```

**Test with:**
```bash
npx uri-scheme open "pitchperfect://exercise/scales" --ios
```

### 7. State Not Persisting Between Tab Switches

**Problem:** Scroll position or form data lost when switching tabs.

**Solution:** Disable `detachInactiveScreens` or use manual state management:

```typescript
<Tab.Navigator
  screenOptions={{
    detachInactiveScreens: false, // Keep tabs mounted
  }}
>
  {/* Tabs */}
</Tab.Navigator>
```

### 8. `navigate()` Duplicating Screens (v7)

**Problem:** In React Navigation v7, `navigate()` always pushes new screen (breaking change from v6).

**Solution:**
```typescript
// Instead of navigation.navigate('Profile')
navigation.push('Profile'); // or
navigation.popTo('Profile'); // or
navigation.replace('Profile');
```

### 9. TypeScript Errors with Navigation Props

**Problem:** TypeScript complaining about navigation prop types.

**Solution:** Define types for all navigators:

```typescript
// src/navigation/types.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  MainTabs: undefined;
  ExerciseModal: { exerciseId: string };
  ResultsModal: { results: ExerciseResults };
};

export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Progress: undefined;
};

// Screen props
export type ExerciseModalProps = NativeStackScreenProps<RootStackParamList, 'ExerciseModal'>;
export type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;

// Usage in screens
import { ExerciseModalProps } from '../navigation/types';

function ExerciseModal({ navigation, route }: ExerciseModalProps) {
  const { exerciseId } = route.params; // TypeScript knows this exists
  // ...
}
```

### 10. React Native Reanimated Not Working with Navigation

**Problem:** Reanimated animations not running in navigation screens.

**Solution:** Ensure Reanimated plugin is in `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // Must be last
  };
};
```

---

## Testing Strategy

### Setting Up Jest with React Navigation

#### 1. Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

#### 2. Configure Jest (jest.config.js)

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@testing-library)/)',
  ],
};
```

#### 3. Create Jest Setup File (jest-setup.js)

```javascript
import '@testing-library/jest-native/extend-expect';

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock Audio (for PitchPerfect)
jest.mock('expo-av', () => ({
  Audio: {
    Recording: jest.fn(),
    setAudioModeAsync: jest.fn(),
  },
}));
```

### Unit Testing Examples

#### Test Tab Navigation

```typescript
// __tests__/navigation/TabNavigator.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from '../../src/navigation/TabNavigator';

describe('TabNavigator', () => {
  it('renders all three tabs', () => {
    const { getByText } = render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Practice')).toBeTruthy();
    expect(getByText('Progress')).toBeTruthy();
  });

  it('navigates to Practice tab when tapped', () => {
    const { getByText, getByTestId } = render(
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    );

    const practiceTab = getByText('Practice');
    fireEvent.press(practiceTab);

    // Verify Practice screen is rendered
    expect(getByTestId('practice-screen')).toBeTruthy();
  });
});
```

#### Test Screen with Navigation

```typescript
// __tests__/screens/HomeScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { HomeScreen } from '../../src/screens/tabs/HomeScreen';

// Mock navigation
jest.mock('@react-navigation/native');

describe('HomeScreen', () => {
  it('navigates to ExerciseModal when exercise is tapped', () => {
    const mockNavigate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });

    const { getByTestId } = render(<HomeScreen />);

    const exerciseButton = getByTestId('start-exercise-button');
    fireEvent.press(exerciseButton);

    expect(mockNavigate).toHaveBeenCalledWith('ExerciseModal', {
      exerciseId: 'scales',
    });
  });
});
```

#### Test Modal Dismissal

```typescript
// __tests__/screens/ExerciseModal.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ExerciseModal } from '../../src/screens/modals/ExerciseModal';

describe('ExerciseModal', () => {
  it('cleans up audio when modal is closed', async () => {
    const mockStopAudio = jest.fn();
    const mockNavigation = {
      goBack: jest.fn(),
    };

    const { getByText, unmount } = render(
      <ExerciseModal
        navigation={mockNavigation}
        route={{ params: { exerciseId: 'scales' } }}
      />
    );

    // Simulate closing modal
    unmount();

    // Verify cleanup was called
    await waitFor(() => {
      expect(mockStopAudio).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

#### Test Full Navigation Flow

```typescript
// __tests__/integration/navigation-flow.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../../src/navigation/RootNavigator';

describe('Navigation Flow', () => {
  it('navigates from Home -> Exercise -> Results', async () => {
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    // Start on Home screen
    expect(getByTestId('home-screen')).toBeTruthy();

    // Tap "Start Exercise" button
    fireEvent.press(getByTestId('start-exercise-button'));

    // Should navigate to ExerciseModal
    await waitFor(() => {
      expect(getByTestId('exercise-modal')).toBeTruthy();
    });

    // Complete exercise
    fireEvent.press(getByTestId('complete-exercise-button'));

    // Should navigate to ResultsModal
    await waitFor(() => {
      expect(getByTestId('results-modal')).toBeTruthy();
    });
  });
});
```

### E2E Testing (Detox - Optional)

For end-to-end testing with real navigation:

```bash
npm install --save-dev detox detox-cli
```

See: https://wix.github.io/Detox/

### Testing Checklist
- [ ] Mock `@react-navigation/native` in Jest setup
- [ ] Mock `react-native-reanimated` and `react-native-gesture-handler`
- [ ] Test tab switching
- [ ] Test modal navigation (open/close)
- [ ] Test deep linking navigation
- [ ] Test cleanup functions (audio, animation frames)
- [ ] Test accessibility labels
- [ ] Integration test full navigation flows

---

## Migration Checklist

### Phase 1: Setup (Day 1)

- [ ] **Install React Navigation dependencies**
  ```bash
  npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
  npx expo install react-native-screens react-native-safe-area-context
  ```
- [ ] **Create navigation folder structure**
  ```
  src/navigation/
  ├── RootNavigator.tsx
  ├── TabNavigator.tsx
  ├── types.ts
  └── linking.ts
  ```
- [ ] **Define TypeScript types** (RootStackParamList, TabParamList)
- [ ] **Wrap App.tsx with NavigationContainer**

### Phase 2: Create Tab Structure (Day 2-3)

- [ ] **Create TabNavigator.tsx** with 3 tabs (Home, Practice, Progress)
- [ ] **Configure tab icons** (Ionicons or SF Symbols)
- [ ] **Style tab bar** (platform-specific, colors, heights)
- [ ] **Create placeholder screens:**
  - [ ] `src/screens/tabs/HomeScreen.tsx`
  - [ ] `src/screens/tabs/PracticeScreen.tsx`
  - [ ] `src/screens/tabs/ProgressScreen.tsx`
- [ ] **Test tab switching** on iOS and Android

### Phase 3: Refactor Existing Screen (Day 4-5)

- [ ] **Extract Home content** from ExerciseScreenComplete.tsx
- [ ] **Move recommendation logic** to HomeScreen.tsx
- [ ] **Create PracticeScreen** (list of exercises)
- [ ] **Create ProgressScreen** (stats, streaks, history)
- [ ] **Test state persistence** (AsyncStorage integration)

### Phase 4: Add Modal Navigation (Day 6-7)

- [ ] **Create RootNavigator.tsx** (stack with tabs + modals)
- [ ] **Create ExerciseModal.tsx** (full-screen, no swipe-to-dismiss)
- [ ] **Implement modal navigation** from Home/Practice screens
- [ ] **Add cleanup logic** (audio, animation frames)
- [ ] **Test modal dismissal** and navigation

### Phase 5: Implement Deep Linking (Day 8)

- [ ] **Add URL scheme** to app.json (`scheme: "pitchperfect"`)
- [ ] **Configure linking.ts** (screen paths)
- [ ] **Test deep links** (iOS/Android)
- [ ] **Optional: Setup push notifications** with deep links

### Phase 6: Performance Optimization (Day 9)

- [ ] **Enable lazy loading** for tabs
- [ ] **Configure detachInactiveScreens** (balance memory vs state)
- [ ] **Add `useFocusEffect`** for audio cleanup
- [ ] **Test memory usage** (React DevTools Profiler)
- [ ] **Optional: Add preloading** for heavy screens

### Phase 7: Accessibility (Day 10)

- [ ] **Add accessibilityLabel** to all tabs
- [ ] **Add accessibilityHint** for interactive elements
- [ ] **Test with VoiceOver** (iOS) and TalkBack (Android)
- [ ] **Announce dynamic content** (exercise start/end, scores)

### Phase 8: Testing (Day 11-12)

- [ ] **Setup Jest** with React Navigation mocks
- [ ] **Write unit tests** for tab navigation
- [ ] **Write unit tests** for modal navigation
- [ ] **Write integration tests** (full navigation flows)
- [ ] **Test deep linking** (automated)

### Phase 9: Polish & Documentation (Day 13-14)

- [ ] **Add custom tab bar** (optional)
- [ ] **Dark mode support** (optional)
- [ ] **Update README** with navigation structure
- [ ] **Code review** and cleanup
- [ ] **Final testing** on physical devices (iOS/Android)

### Phase 10: Deployment (Day 15)

- [ ] **Test production build** (EAS Build)
- [ ] **Verify deep links** work in standalone app
- [ ] **Test push notifications** (if implemented)
- [ ] **Submit to App Store / Play Store**

---

## Additional Resources

### Official Documentation
- **React Navigation:** https://reactnavigation.org/
- **Expo Router (alternative):** https://docs.expo.dev/router/introduction/
- **Expo Linking:** https://docs.expo.dev/guides/linking/
- **Expo Notifications:** https://docs.expo.dev/versions/latest/sdk/notifications/

### Icon Resources
- **Expo Vector Icons Search:** https://icons.expo.fyi/
- **SF Symbols App:** https://developer.apple.com/sf-symbols/
- **Material Icons:** https://fonts.google.com/icons

### Community Resources
- **React Navigation GitHub:** https://github.com/react-navigation/react-navigation
- **Expo Forums:** https://forums.expo.dev/
- **React Native Community Discord:** https://www.reactiflux.com/

### Example Projects
- **React Navigation Examples:** https://github.com/react-navigation/react-navigation/tree/main/example
- **Expo Examples:** https://github.com/expo/examples

---

## Conclusion

This research document provides a comprehensive guide for implementing React Navigation in the PitchPerfect vocal training app. Key takeaways:

1. **Use React Navigation v7** for Expo SDK 54 (breaking change: `navigate()` now behaves like `push()`)
2. **Architecture:** Root stack (tabs + modals) allows full-screen exercise sessions without tab bar interference
3. **Performance:** Lazy loading, detaching inactive screens, and proper audio cleanup are critical
4. **Accessibility:** VoiceOver/TalkBack support with accessibilityLabel and accessibilityHint
5. **Deep Linking:** Essential for push notifications and external links
6. **Testing:** Mock navigation in Jest, test full flows with integration tests

**Estimated Timeline:** 2 weeks (15 days) for full implementation.

**Next Steps:**
1. Review migration checklist
2. Start with Phase 1 (setup)
3. Test each phase before moving to next
4. Use this document as reference throughout implementation

Good luck with the implementation!
