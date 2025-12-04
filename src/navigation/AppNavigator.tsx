/**
 * App Navigator
 *
 * Main navigation structure with bottom tab bar and stack for modals.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavigatorScreenParams } from '@react-navigation/native';

import { HomeScreen } from '../screens/HomeScreen';
import { NativePitchScreen } from '../screens/NativePitchScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { RangeAnalysisScreen } from '../screens/RangeAnalysisScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ResultsScreen } from '../screens/ResultsScreen';

// Tab parameter list
export type TabParamList = {
  Practice: {
    autoStartExerciseId?: string;
    autoStartBreathingId?: string;
  } | undefined;
  Progress: undefined;
  Settings: undefined;
};

// Root stack parameter list
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Results: {
    accuracy: number;
    notesHit: number;
    notesAttempted: number;
    duration: number;
    exerciseName: string;
    lowestNote?: string;
    highestNote?: string;
  };
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Tab bar icon component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Practice: '🎵',
    Progress: '📊',
    Settings: '⚙️',
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name]}
      </Text>
    </View>
  );
};

// Tab Navigator Component
function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Practice"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Practice"
        component={NativePitchScreen}
        options={{
          tabBarLabel: 'Practice',
          tabBarIcon: ({ focused }) => <TabIcon name="Practice" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon name="Progress" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator with Stack
export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
});
