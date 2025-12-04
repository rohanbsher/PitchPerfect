import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExerciseScreenComplete } from './src/screens/ExerciseScreenComplete';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ExerciseScreenComplete />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
