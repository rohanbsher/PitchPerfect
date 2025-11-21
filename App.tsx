import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useOnboardingStatus } from './src/hooks/useStorage';

// Dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10B981',
    background: '#0A0A0A',
    card: '#0A0A0A',
    text: '#FFFFFF',
    border: '#1A1A1A',
    notification: '#10B981',
  },
};

function AppContent() {
  const { hasCompletedOnboarding, isLoading, completeOnboarding } = useOnboardingStatus();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
