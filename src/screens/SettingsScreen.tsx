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
import { CustomSlider } from '../components/CustomSlider';
import { useUserSettings } from '../hooks/useStorage';
import { clearAllData } from '../services/storage';
import { colors } from '../theme';
import { SkeletonLoader } from '../components/SkeletonLoader';

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Settings</Text>
          <SkeletonLoader width="60%" height={20} style={{ marginBottom: 12 }} />
          <SkeletonLoader height={120} style={{ marginBottom: 24 }} />
          <SkeletonLoader width="60%" height={20} style={{ marginBottom: 12 }} />
          <SkeletonLoader height={200} style={{ marginBottom: 24 }} />
          <SkeletonLoader width="60%" height={20} style={{ marginBottom: 12 }} />
          <SkeletonLoader height={280} />
        </ScrollView>
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
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

        </View>

        {/* Audio Section */}
        <Text style={styles.sectionTitle}>Audio</Text>
        <View style={styles.section}>
          {/* Piano Volume */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Piano Volume</Text>
              <Text style={styles.settingDescription}>
                Reference note playback volume
              </Text>
            </View>
            <Text style={styles.volumeValue}>{settings.pianoVolume}%</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={settings.pianoVolume}
              onValueChange={(value) => update({ pianoVolume: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.textPrimary}
            />
          </View>

          <View style={styles.divider} />

          {/* Voice Volume */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Voice Volume</Text>
              <Text style={styles.settingDescription}>
                AI voice guidance volume
              </Text>
            </View>
            <Text style={styles.volumeValue}>{settings.voiceVolume}%</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={settings.voiceVolume}
              onValueChange={(value) => update({ voiceVolume: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.textPrimary}
            />
          </View>
        </View>

        {/* Voice Coach Section */}
        <Text style={styles.sectionTitle}>Voice Coach</Text>
        <View style={styles.section}>
          {/* Voice Coach Enabled */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Voice Coach</Text>
              <Text style={styles.settingDescription}>
                Get natural, AI-powered voice guidance during workouts
              </Text>
            </View>
            <Switch
              value={settings.voiceCoachEnabled}
              onValueChange={(value) => update({ voiceCoachEnabled: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbTintColor={colors.textPrimary}
            />
          </View>

          <View style={styles.divider} />

          {/* Voice Speed */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Voice Speed</Text>
              <Text style={styles.settingDescription}>
                Adjust how fast the voice coach speaks
              </Text>
            </View>
            <Text style={styles.volumeValue}>{settings.voiceCoachSpeed.toFixed(1)}x</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSlider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={settings.voiceCoachSpeed}
              onValueChange={(value) => update({ voiceCoachSpeed: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.textPrimary}
            />
          </View>

          <View style={styles.divider} />

          {/* Voice Pitch */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Voice Pitch</Text>
              <Text style={styles.settingDescription}>
                Adjust the voice coach pitch (higher or lower)
              </Text>
            </View>
            <Text style={styles.volumeValue}>{settings.voiceCoachPitch.toFixed(1)}x</Text>
          </View>
          <View style={styles.sliderContainer}>
            <CustomSlider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={2.0}
              step={0.1}
              value={settings.voiceCoachPitch}
              onValueChange={(value) => update({ voiceCoachPitch: value })}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.textPrimary}
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
            Made for <Text style={styles.footerAccent}>singers</Text> everywhere
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
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textMuted,
  },
  settingButton: {
    padding: 16,
  },
  dangerText: {
    color: colors.error,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  volumeValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
    color: colors.textPrimary,
  },
  aboutValue: {
    fontSize: 16,
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  footerAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});
