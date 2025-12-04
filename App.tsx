import React, { useRef, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, useNavigation, NavigationContainerRef } from '@react-navigation/native';
import { AppNavigator, RootStackParamList } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useOnboardingStatus } from './src/hooks/useStorage';
import { VoiceAssistantProvider, useVoiceAssistantContext } from './src/hooks/useVoiceAssistant';
import { VoiceAssistantButton } from './src/components/VoiceAssistantButton';
import { VoiceAssistantOverlay } from './src/components/VoiceAssistantOverlay';
import { appController } from './src/services/appController';

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

// Voice Assistant UI wrapper component
function VoiceAssistantUI() {
  const {
    state,
    isActive,
    transcript,
    response,
    conversationHistory,
    isConversationMode,
    toggle,
    endConversation,
    setNavigationCallback,
    setGoBackCallback,
  } = useVoiceAssistantContext();

  console.log('[VoiceAssistantUI] Rendering with state:', state, 'isConversationMode:', isConversationMode);

  return (
    <>
      {/* Floating mic button */}
      <VoiceAssistantButton
        state={state}
        onPress={toggle}
      />

      {/* Full screen overlay when active */}
      <VoiceAssistantOverlay
        visible={isActive}
        state={state}
        transcript={transcript}
        response={response}
        conversationHistory={conversationHistory}
        isConversationMode={isConversationMode}
        onClose={endConversation}
      />
    </>
  );
}

// Navigation wrapper to set up app controller
function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const { setNavigationCallback, setGoBackCallback } = useVoiceAssistantContext();

  useEffect(() => {
    // Set up navigation callbacks for voice assistant
    setNavigationCallback((screen: string) => {
      if (navigationRef.current) {
        // Map screen names to navigation routes
        const screenMap: Record<string, { name: string; params?: any }> = {
          Home: { name: 'Main', params: { screen: 'Practice' } },
          Progress: { name: 'Main', params: { screen: 'Progress' } },
          Settings: { name: 'Main', params: { screen: 'Settings' } },
          NativePitch: { name: 'Main', params: { screen: 'Practice' } },
          Practice: { name: 'Main', params: { screen: 'Practice' } },
        };

        const route = screenMap[screen];
        if (route) {
          navigationRef.current.navigate(route.name as any, route.params);
        }
      }
    });

    setGoBackCallback(() => {
      if (navigationRef.current?.canGoBack()) {
        navigationRef.current.goBack();
      }
    });

    // Track current screen for app controller
    const unsubscribe = navigationRef.current?.addListener('state', () => {
      const currentRoute = navigationRef.current?.getCurrentRoute();
      if (currentRoute) {
        appController.setCurrentScreen(currentRoute.name);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [setNavigationCallback, setGoBackCallback]);

  return (
    <NavigationContainer ref={navigationRef} theme={DarkTheme}>
      {children}
    </NavigationContainer>
  );
}

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
    <VoiceAssistantProvider>
      <NavigationWrapper>
        <StatusBar style="light" />
        <AppNavigator />
        <VoiceAssistantUI />
      </NavigationWrapper>
    </VoiceAssistantProvider>
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
