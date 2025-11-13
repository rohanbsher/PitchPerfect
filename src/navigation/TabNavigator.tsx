/**
 * Tab Navigator - Bottom Tab Navigation
 *
 * Three main tabs:
 * 1. Piano (default) - Real-time piano with pitch detection
 * 2. Exercises - Browse and practice vocal exercises
 * 3. Progress - Stats and training history
 *
 * @module TabNavigator
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PianoScreen } from '../screens/PianoScreen';
import { ExercisesScreen } from '../screens/ExercisesScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { DesignSystem as DS } from '../design/DesignSystem';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: DS.colors.accent.primary,
        tabBarInactiveTintColor: DS.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: DS.colors.background.elevated,
          borderTopColor: DS.colors.background.elevated,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          ...DS.typography.caption1,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Piano"
        component={PianoScreen}
        options={{
          tabBarLabel: 'Piano',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🎹" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ExercisesScreen}
        options={{
          tabBarLabel: 'Exercises',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="🎵" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <TabIcon icon="📊" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Simple tab icon component
interface TabIconProps {
  icon: string;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, size }) => {
  return (
    <span style={{ fontSize: size }}>{icon}</span>
  );
};
