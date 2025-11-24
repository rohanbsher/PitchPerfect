/**
 * Range Analysis Screen
 *
 * Comprehensive vocal range analysis with:
 * - Interactive piano keyboard visualization
 * - AI-powered range insights and coaching
 * - Comfortable vs extended range breakdown
 * - Range expansion tracking
 * - Weakness analysis and technique tips
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList } from '../navigation/AppNavigator';
import { useStorage } from '../hooks/useStorage';
import { getUserSettings } from '../services/storage';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { analyzeVocalRange, RangeAnalysisResult } from '../services/rangeAnalysis';
import { generateRangeAnalysisReport } from '../../services/claudeAI';
import { SessionRecord } from '../types/userProgress';

type NavigationProp = BottomTabNavigationProp<TabParamList>;

export function RangeAnalysisScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { getSessions, isLoading } = useStorage();

  const [rangeAnalysis, setRangeAnalysis] = useState<RangeAnalysisResult | null>(null);
  const [aiReport, setAiReport] = useState<{
    rangeAssessment: string;
    comfortableRangeInsight: string;
    weaknessAnalysis: string;
    expansionCoaching: string;
    recommendedExercises: string[];
    techniqueTips: string[];
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiReportError, setAiReportError] = useState<string | null>(null);
  const [analysisLoaded, setAnalysisLoaded] = useState(false);
  const [pianoVolume, setPianoVolume] = useState(85);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getUserSettings();
      setPianoVolume(settings.pianoVolume);
    };
    loadSettings();
    loadRangeAnalysis();
  }, []);

  useEffect(() => {
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadRangeAnalysis();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRangeAnalysis = async () => {
    try {
      const sessions = await getSessions();

      if (sessions.length < 3) {
        // Not enough data
        setAnalysisLoaded(true);
        return;
      }

      // Analyze range
      const analysis = analyzeVocalRange(sessions);
      setRangeAnalysis(analysis);
      setAnalysisLoaded(true);

      // Generate AI report
      await loadAIReport(analysis, sessions);
    } catch (error) {
      console.error('Failed to load range analysis:', error);
      setAnalysisLoaded(true);
    }
  };

  const loadAIReport = async (analysis: RangeAnalysisResult, sessions: SessionRecord[]) => {
    if (loadingAI) return;

    try {
      setLoadingAI(true);
      setAiReportError(null); // Clear previous errors

      const recentSessions = sessions.slice(0, 10);
      const report = await generateRangeAnalysisReport(analysis, recentSessions);

      if (report) {
        setAiReport(report);
        setAiReportError(null); // Success - clear error
      } else {
        // API returned null (rate limited or other issue)
        setAiReportError('Unable to generate AI analysis');
      }
    } catch (error) {
      console.error('Failed to load AI report:', error);

      let errorMessage = 'Unable to generate AI analysis at this time.';

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'AI analysis timed out. Your range data was saved.';
        } else if (error.message.includes('network')) {
          errorMessage = 'No internet connection. AI analysis will be available when online.';
        }
      }

      setAiReportError(errorMessage);
      setAiReport(null); // Clear stale report on error
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRetryReport = async () => {
    if (!rangeAnalysis) return;

    try {
      setLoadingAI(true);
      setAiReportError(null);

      const sessions = await getSessions();
      const recentSessions = sessions.slice(0, 10);

      const report = await generateRangeAnalysisReport(rangeAnalysis, recentSessions);
      if (report) {
        setAiReport(report);
        setAiReportError(null);
      } else {
        setAiReportError('AI analysis still unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to retry AI report:', error);
      setAiReportError('Retry failed. Please check your connection and try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleStartRangeTest = () => {
    // Navigate to Practice screen with range_test exercise
    navigation.navigate('Practice');
    // TODO: Auto-start range_test exercise
  };

  if (isLoading || !analysisLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state - not enough data
  if (!rangeAnalysis) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Vocal Range Analysis</Text>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎹</Text>
            <Text style={styles.emptyTitle}>Not Enough Data</Text>
            <Text style={styles.emptySubtitle}>
              Complete at least 3 practice sessions to see your vocal range analysis.
            </Text>

            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Practice')}>
              <Text style={styles.emptyButtonText}>Start Practice</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.header}>
          <Text style={styles.title}>Vocal Range Analysis</Text>
          <Text style={styles.rangeDisplay}>
            {rangeAnalysis.currentRange.lowest} - {rangeAnalysis.currentRange.highest}
          </Text>
        </View>

        {/* Piano Keyboard Visualization */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.keyboardCard}>
          <PianoKeyboard
            heatmap={rangeAnalysis.heatmap}
            startNote="C2"
            endNote="C6"
            height={200}
            pianoVolume={pianoVolume}
          />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Comfortable (70%+)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Extended (50-70%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Struggling (&lt;50%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3A3A3A' }]} />
              <Text style={styles.legendText}>Untested</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Comfortable Range</Text>
            <Text style={styles.statValue}>
              {rangeAnalysis.comfortableRange.spanSemitones} semitones
            </Text>
            <Text style={styles.statDetail}>
              {rangeAnalysis.comfortableRange.lowest} - {rangeAnalysis.comfortableRange.highest}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Expansion (30d)</Text>
            <Text style={styles.statValue}>
              {rangeAnalysis.expansion.last30Days.semitones > 0
                ? `+${rangeAnalysis.expansion.last30Days.semitones}`
                : rangeAnalysis.expansion.last30Days.semitones}
            </Text>
            <Text style={styles.statDetail}>
              {rangeAnalysis.expansion.last30Days.direction !== 'none'
                ? rangeAnalysis.expansion.last30Days.direction
                : 'No change'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Strongest Note</Text>
            <Text style={styles.statValue}>
              {rangeAnalysis.strongestNote?.note || 'N/A'}
            </Text>
            <Text style={styles.statDetail}>
              {rangeAnalysis.strongestNote
                ? `${rangeAnalysis.strongestNote.accuracy.toFixed(0)}% accuracy`
                : 'Keep practicing'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Range</Text>
            <Text style={styles.statValue}>
              {rangeAnalysis.expansion.allTime.semitones} semitones
            </Text>
            <Text style={styles.statDetail}>
              {rangeAnalysis.currentRange.lowest} - {rangeAnalysis.currentRange.highest}
            </Text>
          </View>
        </View>

        {/* Weaknesses */}
        {rangeAnalysis.weaknesses.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.weaknessCard}>
            <Text style={styles.weaknessTitle}>Areas for Improvement</Text>
            {rangeAnalysis.weaknesses.map((weakness, index) => (
              <View key={index} style={styles.weaknessItem}>
                <Text style={styles.weaknessBand}>{weakness.frequencyBand.toUpperCase()} Range</Text>
                <Text style={styles.weaknessNotes}>{weakness.notes.join(', ')}</Text>
                <Text style={styles.weaknessAccuracy}>
                  {weakness.averageAccuracy.toFixed(0)}% average accuracy
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* AI Report */}
        {aiReport && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.aiReportCard}>
            <Text style={styles.aiReportTitle}>🎯 AI Vocal Coach Analysis</Text>

            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>Range Assessment</Text>
              <Text style={styles.reportText}>{aiReport.rangeAssessment}</Text>
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>Comfortable Range Insight</Text>
              <Text style={styles.reportText}>{aiReport.comfortableRangeInsight}</Text>
            </View>

            {aiReport.weaknessAnalysis && (
              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Weakness Analysis</Text>
                <Text style={styles.reportText}>{aiReport.weaknessAnalysis}</Text>
              </View>
            )}

            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>Expansion Coaching</Text>
              <Text style={styles.reportText}>{aiReport.expansionCoaching}</Text>
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>Recommended Exercises</Text>
              {aiReport.recommendedExercises.map((exercise, index) => (
                <Text key={index} style={styles.reportListItem}>
                  • {exercise}
                </Text>
              ))}
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.reportSectionTitle}>Technique Tips</Text>
              {aiReport.techniqueTips.map((tip, index) => (
                <Text key={index} style={styles.reportListItem}>
                  • {tip}
                </Text>
              ))}
            </View>
          </Animated.View>
        )}

        {/* AI Report Error */}
        {aiReportError && !loadingAI && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.reportErrorCard}>
            <Text style={styles.reportErrorIcon}>ℹ️</Text>
            <Text style={styles.reportErrorTitle}>AI Analysis Unavailable</Text>
            <Text style={styles.reportErrorMessage}>{aiReportError}</Text>
            <TouchableOpacity
              style={styles.reportRetryButton}
              onPress={handleRetryReport}
              activeOpacity={0.7}
            >
              <Text style={styles.reportRetryText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {loadingAI && (
          <View style={styles.aiLoadingCard}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.aiLoadingText}>Generating AI analysis...</Text>
          </View>
        )}

        {/* Range Test Button */}
        <TouchableOpacity style={styles.rangeTestButton} onPress={handleStartRangeTest}>
          <Text style={styles.rangeTestButtonText}>📊 Check Full Range</Text>
          <Text style={styles.rangeTestButtonSubtext}>
            Run systematic range test (C3-C6)
          </Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rangeDisplay: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '600',
  },
  keyboardCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  weaknessCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    padding: 16,
    marginBottom: 16,
  },
  weaknessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  weaknessItem: {
    marginBottom: 12,
  },
  weaknessBand: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weaknessNotes: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  weaknessAccuracy: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  aiReportCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    padding: 16,
    marginBottom: 16,
  },
  aiReportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 16,
  },
  reportSection: {
    marginBottom: 16,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  reportText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  reportListItem: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginLeft: 8,
  },
  aiLoadingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  aiLoadingText: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  rangeTestButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
  },
  rangeTestButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  rangeTestButtonSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reportErrorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  reportErrorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  reportErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  reportErrorMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  reportRetryButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  reportRetryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
