import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExerciseScreenComplete } from './src/screens/ExerciseScreenComplete';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ExerciseScreenComplete />
    </SafeAreaProvider>
  );
}
// Force reload
