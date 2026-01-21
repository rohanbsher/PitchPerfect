/**
 * App Navigator
 *
 * Main navigation structure with bottom tab bar and stack for modals.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
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

// Icon mapping for tabs
type TabIconName = 'Practice' | 'Progress' | 'Settings';
const tabIcons: Record<TabIconName, { outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }> = {
  Practice: { outline: 'mic-outline', filled: 'mic' },
  Progress: { outline: 'stats-chart-outline', filled: 'stats-chart' },
  Settings: { outline: 'settings-outline', filled: 'settings' },
};

// Tab bar icon component
const TabIcon = ({ name, focused }: { name: TabIconName; focused: boolean }) => {
  const iconConfig = tabIcons[name];
  const iconName = focused ? iconConfig.filled : iconConfig.outline;

  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? colors.tabActive : colors.tabInactive}
      />
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
          backgroundColor: colors.background,
          borderTopColor: colors.card,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
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
});
