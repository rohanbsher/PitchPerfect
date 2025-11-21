/**
 * Settings Screen
 *
 * User preferences and app configuration.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserSettings } from '../hooks/useStorage';
import { clearAllData } from '../services/storage';

export function SettingsScreen() {
  const { settings, isLoading, update } = useUserSettings();

  const handleResetProgress = () => {
    Alert.alert(
      'Reset All Progress?',
      'This will delete all your practice history, streaks, and stats. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All progress has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset progress.');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Display Section */}
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Note Labels</Text>
              <Text style={styles.settingDescription}>
                Display note names on the pitch tracker
              </Text>
            </View>
            <Switch
              value={settings.showNoteLabels}
              onValueChange={(value) => update({ showNoteLabels: value })}
              trackColor={{ false: '#3A3A3A', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Cents</Text>
              <Text style={styles.settingDescription}>
                Display pitch accuracy in cents
              </Text>
            </View>
            <Switch
              value={settings.showCents}
              onValueChange={(value) => update({ showCents: value })}
              trackColor={{ false: '#3A3A3A', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded to practice every day
              </Text>
            </View>
            <Switch
              value={settings.dailyReminderEnabled}
              onValueChange={(value) => update({ dailyReminderEnabled: value })}
              trackColor={{ false: '#3A3A3A', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data Section */}
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleResetProgress}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingLabel, styles.dangerText]}>
              Reset All Progress
            </Text>
            <Text style={styles.settingDescription}>
              Delete all practice history and start fresh
            </Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2024.1</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with 🎵 for singers everywhere
          </Text>
          <Text style={styles.footerSubtext}>
            PitchPerfect - Train Your Voice
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  settingButton: {
    padding: 16,
  },
  dangerText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  aboutValue: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});
