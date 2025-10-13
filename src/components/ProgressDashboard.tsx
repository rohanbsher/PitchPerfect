import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { progressTracker, type StudentProgress, type Achievement } from '../services/progressTracking';

const { width } = Dimensions.get('window');

export const ProgressDashboard = ({ onClose }: { onClose: () => void }) => {
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    const report = progressTracker.getProgressReport();
    setProgress(report);
  }, []);

  if (!progress) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutes`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#4ADE80';
    if (accuracy >= 70) return '#FCD34D';
    return '#F87171';
  };

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress Report</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>
              {progress.overallAccuracy.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>Accuracy</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#EC4899', '#F43F5E']}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>
              {progress.currentStreak}
            </Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#10B981', '#34D399']}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>
              {formatTime(progress.totalPracticeTime)}
            </Text>
            <Text style={styles.metricLabel}>Total Practice</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#F59E0B', '#FCD34D']}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>
              {progress.sessions.length}
            </Text>
            <Text style={styles.metricLabel}>Sessions</Text>
          </LinearGradient>
        </View>

        {/* Vocal Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vocal Range</Text>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeBar}>
              <LinearGradient
                colors={['#6366F1', '#EC4899']}
                style={styles.rangeIndicator}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeText}>{progress.currentRange.lowest}</Text>
              <Text style={styles.rangeDash}>━━━</Text>
              <Text style={styles.rangeText}>{progress.currentRange.highest}</Text>
            </View>
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {progress.sessions.slice(-5).reverse().map((session, index) => (
            <View key={index} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>
                  {new Date(session.date).toLocaleDateString()}
                </Text>
                <Text style={[
                  styles.sessionAccuracy,
                  { color: getAccuracyColor(session.accuracy) }
                ]}>
                  {session.accuracy.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionDetail}>
                  Duration: {Math.floor(session.duration / 60)}m
                </Text>
                <Text style={styles.sessionDetail}>
                  Notes: {session.notesHit.length}
                </Text>
                <Text style={styles.sessionDetail}>
                  Range: {session.rangeLowest} - {session.rangeHighest}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {progress.achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Coach Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas of Improvement</Text>
          <View style={styles.improvementCard}>
            <Text style={styles.improvementText}>
              • Focus on sustaining notes in the upper register
            </Text>
            <Text style={styles.improvementText}>
              • Practice interval jumps between G4 and C5
            </Text>
            <Text style={styles.improvementText}>
              • Work on breath control for longer phrases
            </Text>
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportButton}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.exportGradient}
          >
            <Text style={styles.exportText}>Export PDF Report</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    color: '#94A3B8',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 14,
    color: '#E2E8F0',
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  rangeContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 20,
    borderRadius: 12,
  },
  rangeBar: {
    height: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    borderRadius: 4,
    marginBottom: 15,
  },
  rangeIndicator: {
    height: '100%',
    width: '70%',
    borderRadius: 4,
  },
  rangeLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rangeDash: {
    fontSize: 18,
    color: '#64748B',
    marginHorizontal: 10,
  },
  sessionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionDate: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sessionAccuracy: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sessionDetail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  achievementDesc: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  improvementCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 20,
    borderRadius: 12,
  },
  improvementText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginBottom: 10,
    lineHeight: 20,
  },
  exportButton: {
    marginTop: 20,
    marginBottom: 40,
  },
  exportGradient: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});