/**
 * Progress Screen - Redesigned
 *
 * Comprehensive progress tracking with:
 * - Enhanced header with streak prominence
 * - Weekly summary
 * - Accuracy trend chart
 * - Interactive calendar
 * - Achievements
 * - Vocal range visualization
 * - Expandable session cards
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStorage } from '../hooks/useStorage';
import { SessionRecord } from '../types/userProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SESSIONS_PER_PAGE = 10;

// ============== DESIGN TOKENS ==============
const colors = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  background: '#0A0A0A',
  card: '#1A1A1A',
  cardHighlight: '#242424',
  border: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  gold: '#F59E0B',
  silver: '#9CA3AF',
  bronze: '#CD7F32',
  flame: '#FF6B35',
};

// ============== UTILITY FUNCTIONS ==============
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 90) return colors.success;
  if (accuracy >= 70) return colors.warning;
  return colors.error;
};

// ============== STREAK DISPLAY COMPONENT ==============
const StreakDisplay = ({
  currentStreak,
  longestStreak
}: {
  currentStreak: number;
  longestStreak: number;
}) => {
  const isOnFire = currentStreak >= 3;

  return (
    <View style={streakStyles.container}>
      <View style={streakStyles.mainStreak}>
        <Text style={streakStyles.flameIcon}>{isOnFire ? '🔥' : '✨'}</Text>
        <View style={streakStyles.streakInfo}>
          <Text style={streakStyles.streakValue}>{currentStreak}</Text>
          <Text style={streakStyles.streakLabel}>Day Streak</Text>
        </View>
      </View>
      {longestStreak > currentStreak && (
        <View style={streakStyles.bestStreak}>
          <Text style={streakStyles.bestLabel}>Best: {longestStreak} days</Text>
        </View>
      )}
      {currentStreak === longestStreak && currentStreak > 0 && (
        <View style={[streakStyles.bestStreak, streakStyles.recordBadge]}>
          <Text style={streakStyles.recordText}>Personal Best!</Text>
        </View>
      )}
    </View>
  );
};

const streakStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  mainStreak: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.textPrimary,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: -4,
  },
  bestStreak: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bestLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  recordBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 0,
    marginTop: 12,
  },
  recordText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
    textAlign: 'center',
  },
});

// ============== QUICK STATS ROW ==============
const QuickStats = ({
  accuracy,
  totalTime,
  sessionsThisWeek,
  improvementRate,
}: {
  accuracy: number;
  totalTime: number;
  sessionsThisWeek: number;
  improvementRate: number;
}) => {
  const trendIcon = improvementRate >= 0 ? '↑' : '↓';
  const trendColor = improvementRate >= 0 ? colors.success : colors.error;

  return (
    <View style={quickStatsStyles.container}>
      <View style={quickStatsStyles.stat}>
        <Text style={quickStatsStyles.value}>{accuracy}%</Text>
        <Text style={quickStatsStyles.label}>Accuracy</Text>
        {improvementRate !== 0 && (
          <Text style={[quickStatsStyles.trend, { color: trendColor }]}>
            {trendIcon} {Math.abs(improvementRate)}%
          </Text>
        )}
      </View>
      <View style={quickStatsStyles.divider} />
      <View style={quickStatsStyles.stat}>
        <Text style={quickStatsStyles.value}>{formatTime(totalTime)}</Text>
        <Text style={quickStatsStyles.label}>Total Practice</Text>
      </View>
      <View style={quickStatsStyles.divider} />
      <View style={quickStatsStyles.stat}>
        <Text style={quickStatsStyles.value}>{sessionsThisWeek}</Text>
        <Text style={quickStatsStyles.label}>This Week</Text>
      </View>
    </View>
  );
};

const quickStatsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});

// ============== WEEKLY SUMMARY COMPONENT ==============
const WeeklySummary = ({
  sessions,
  currentStreak,
}: {
  sessions: SessionRecord[];
  currentStreak: number;
}) => {
  // Calculate days practiced this week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const practicedDays = new Set<number>();

  sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= weekStart) {
      practicedDays.add(sessionDate.getDay());
    }
  });

  // Calculate streak goal message
  const daysUntilGoal = 7 - currentStreak;
  let goalMessage = '';
  if (currentStreak === 0) {
    goalMessage = 'Start practicing to build your streak!';
  } else if (currentStreak < 7) {
    goalMessage = `${daysUntilGoal} more day${daysUntilGoal > 1 ? 's' : ''} for a week streak!`;
  } else if (currentStreak < 30) {
    const daysUntil30 = 30 - currentStreak;
    goalMessage = `${daysUntil30} more for a 30-day streak!`;
  } else {
    goalMessage = 'Amazing consistency! Keep it up!';
  }

  return (
    <View style={weeklySummaryStyles.container}>
      <Text style={weeklySummaryStyles.title}>This Week</Text>
      <View style={weeklySummaryStyles.daysRow}>
        {weekDays.map((day, index) => {
          const isPracticed = practicedDays.has(index);
          const isToday = index === today.getDay();
          return (
            <View key={index} style={weeklySummaryStyles.dayContainer}>
              <Text style={weeklySummaryStyles.dayLabel}>{day}</Text>
              <View style={[
                weeklySummaryStyles.dayDot,
                isPracticed && weeklySummaryStyles.dayDotActive,
                isToday && weeklySummaryStyles.dayDotToday,
              ]}>
                {isPracticed && <Text style={weeklySummaryStyles.checkmark}>✓</Text>}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={weeklySummaryStyles.goalMessage}>{goalMessage}</Text>
    </View>
  );
};

const weeklySummaryStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardHighlight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayDotToday: {
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  goalMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

// ============== ACCURACY CHART COMPONENT ==============
const AccuracyChart = ({ sessions }: { sessions: SessionRecord[] }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  // Get sessions for the selected time range
  const chartData = useMemo(() => {
    const now = new Date();
    const cutoffDays = timeRange === 'week' ? 7 : 30;
    const cutoff = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);

    return sessions
      .filter(s => new Date(s.date) >= cutoff)
      .slice(0, timeRange === 'week' ? 7 : 30)
      .reverse(); // Oldest first
  }, [sessions, timeRange]);

  if (chartData.length < 2) {
    return (
      <View style={chartStyles.container}>
        <View style={chartStyles.header}>
          <Text style={chartStyles.title}>Accuracy Trend</Text>
        </View>
        <View style={chartStyles.emptyChart}>
          <Text style={chartStyles.emptyText}>
            Complete more sessions to see your trend
          </Text>
        </View>
      </View>
    );
  }

  // Calculate chart dimensions
  const chartWidth = SCREEN_WIDTH - 72; // Padding
  const chartHeight = 100;
  const maxAcc = Math.max(...chartData.map(s => s.accuracy), 100);
  const minAcc = Math.min(...chartData.map(s => s.accuracy), 0);
  const range = maxAcc - minAcc || 1;

  // Generate path points
  const points = chartData.map((session, index) => {
    const x = (index / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - ((session.accuracy - minAcc) / range) * chartHeight;
    return { x, y, accuracy: session.accuracy };
  });

  // Calculate trend
  const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
  const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
  const firstAvg = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / (secondHalf.length || 1);
  const trend = Math.round(secondAvg - firstAvg);
  const trendColor = trend >= 0 ? colors.success : colors.error;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.header}>
        <Text style={chartStyles.title}>Accuracy Trend</Text>
        <View style={chartStyles.toggleRow}>
          <TouchableOpacity
            style={[chartStyles.toggle, timeRange === 'week' && chartStyles.toggleActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[chartStyles.toggleText, timeRange === 'week' && chartStyles.toggleTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[chartStyles.toggle, timeRange === 'month' && chartStyles.toggleActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[chartStyles.toggleText, timeRange === 'month' && chartStyles.toggleTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={chartStyles.chartArea}>
        {/* Y-axis labels */}
        <View style={chartStyles.yAxis}>
          <Text style={chartStyles.axisLabel}>{maxAcc}%</Text>
          <Text style={chartStyles.axisLabel}>{Math.round((maxAcc + minAcc) / 2)}%</Text>
          <Text style={chartStyles.axisLabel}>{minAcc}%</Text>
        </View>

        {/* Chart */}
        <View style={chartStyles.chart}>
          {/* Grid lines */}
          <View style={[chartStyles.gridLine, { top: 0 }]} />
          <View style={[chartStyles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[chartStyles.gridLine, { top: chartHeight }]} />

          {/* Line connecting points */}
          {points.map((point, index) => {
            if (index === 0) return null;
            const prevPoint = points[index - 1];
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <View
                key={`line-${index}`}
                style={[
                  chartStyles.line,
                  {
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: length,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}

          {/* Data points */}
          {points.map((point, index) => (
            <View
              key={`point-${index}`}
              style={[
                chartStyles.point,
                {
                  left: point.x - 4,
                  top: point.y - 4,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Trend indicator */}
      <View style={chartStyles.trendRow}>
        <Text style={[chartStyles.trendText, { color: trendColor }]}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trend >= 0 ? 'improvement' : 'decline'}
        </Text>
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardHighlight,
    borderRadius: 8,
    padding: 2,
  },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  chartArea: {
    flexDirection: 'row',
    height: 120,
  },
  yAxis: {
    width: 32,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'right',
  },
  chart: {
    flex: 1,
    height: 100,
    marginTop: 4,
    marginLeft: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.primary,
    transformOrigin: 'left center',
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
  },
  emptyChart: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  trendRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

// ============== INTERACTIVE CALENDAR ==============
const InteractiveCalendar = ({
  sessions,
  onDayPress,
}: {
  sessions: SessionRecord[];
  onDayPress: (date: string, daySessions: SessionRecord[]) => void;
}) => {
  const [monthOffset, setMonthOffset] = useState(0);

  const { days, monthLabel, practiceCounts } = useMemo(() => {
    const today = new Date();
    const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);

    // Get all days in month
    const allDays: Date[] = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      allDays.push(new Date(d));
    }

    // Add padding for week alignment
    const startPadding = monthStart.getDay();
    const paddedDays: (Date | null)[] = Array(startPadding).fill(null).concat(allDays);

    // Count sessions per day
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      const dateKey = s.date.split('T')[0];
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });

    return {
      days: paddedDays,
      monthLabel: viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      practiceCounts: counts,
    };
  }, [monthOffset, sessions]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={calendarStyles.container}>
      <View style={calendarStyles.header}>
        <TouchableOpacity
          onPress={() => setMonthOffset(prev => prev - 1)}
          style={calendarStyles.navButton}
        >
          <Text style={calendarStyles.navText}>←</Text>
        </TouchableOpacity>
        <Text style={calendarStyles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={() => setMonthOffset(prev => Math.min(prev + 1, 0))}
          style={calendarStyles.navButton}
          disabled={monthOffset >= 0}
        >
          <Text style={[calendarStyles.navText, monthOffset >= 0 && calendarStyles.navDisabled]}>
            →
          </Text>
        </TouchableOpacity>
      </View>

      <View style={calendarStyles.weekDaysRow}>
        {weekDays.map((day, i) => (
          <Text key={i} style={calendarStyles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={calendarStyles.grid}>
        {days.map((date, i) => {
          if (!date) {
            return <View key={`empty-${i}`} style={calendarStyles.dayEmpty} />;
          }

          const dateStr = date.toISOString().split('T')[0];
          const count = practiceCounts[dateStr] || 0;
          const isToday = dateStr === today;
          const daySessions = sessions.filter(s => s.date.split('T')[0] === dateStr);

          // Intensity based on session count
          const intensity = Math.min(count / 3, 1); // Max intensity at 3 sessions

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                calendarStyles.day,
                count > 0 && { backgroundColor: `rgba(16, 185, 129, ${0.3 + intensity * 0.7})` },
                isToday && calendarStyles.dayToday,
              ]}
              onPress={() => count > 0 && onDayPress(dateStr, daySessions)}
              disabled={count === 0}
            >
              <Text style={[
                calendarStyles.dayText,
                count > 0 && calendarStyles.dayTextPracticed,
              ]}>
                {date.getDate()}
              </Text>
              {count > 1 && (
                <View style={calendarStyles.countBadge}>
                  <Text style={calendarStyles.countText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={calendarStyles.legend}>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]} />
          <Text style={calendarStyles.legendText}>1 session</Text>
        </View>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: 'rgba(16, 185, 129, 0.7)' }]} />
          <Text style={calendarStyles.legendText}>2 sessions</Text>
        </View>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={calendarStyles.legendText}>3+ sessions</Text>
        </View>
      </View>
    </View>
  );
};

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  navText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '600',
  },
  navDisabled: {
    color: colors.textMuted,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayEmpty: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  dayTextPracticed: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  countBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  countText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

// ============== VOCAL RANGE DISPLAY ==============
const VocalRangeDisplay = ({
  lowest,
  highest
}: {
  lowest: string;
  highest: string;
}) => {
  // Simple note to position mapping (simplified)
  const noteToPosition = (note: string): number => {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = note.match(/([A-G]#?)(\d)/);
    if (!match) return 50;
    const [, noteName, octaveStr] = match;
    const octave = parseInt(octaveStr);
    const noteIndex = noteOrder.indexOf(noteName);
    return ((octave - 2) * 12 + noteIndex) / 48 * 100; // C2 to C6 range
  };

  const lowPos = noteToPosition(lowest);
  const highPos = noteToPosition(highest);

  // Determine voice type estimate
  const getVoiceType = (low: string, high: string): string => {
    const lowMatch = low.match(/(\d)/);
    const highMatch = high.match(/(\d)/);
    if (!lowMatch || !highMatch) return '';

    const lowOctave = parseInt(lowMatch[1]);
    const highOctave = parseInt(highMatch[1]);

    if (lowOctave <= 2) {
      return highOctave >= 4 ? 'Bass-Baritone Range' : 'Bass Range';
    } else if (lowOctave === 3) {
      return highOctave >= 5 ? 'Tenor Range' : 'Baritone Range';
    } else {
      return highOctave >= 5 ? 'Soprano Range' : 'Alto Range';
    }
  };

  const voiceType = getVoiceType(lowest, highest);

  return (
    <View style={rangeStyles.container}>
      <Text style={rangeStyles.title}>Your Vocal Range</Text>

      <View style={rangeStyles.rangeBar}>
        <View
          style={[
            rangeStyles.rangeFill,
            { left: `${lowPos}%`, right: `${100 - highPos}%` },
          ]}
        />
        <View style={[rangeStyles.marker, rangeStyles.markerLow, { left: `${lowPos}%` }]}>
          <Text style={rangeStyles.markerText}>{lowest}</Text>
        </View>
        <View style={[rangeStyles.marker, rangeStyles.markerHigh, { left: `${highPos}%` }]}>
          <Text style={rangeStyles.markerText}>{highest}</Text>
        </View>
      </View>

      <View style={rangeStyles.referenceRow}>
        <Text style={rangeStyles.referenceLabel}>C2</Text>
        <Text style={rangeStyles.referenceLabel}>C3</Text>
        <Text style={rangeStyles.referenceLabel}>C4</Text>
        <Text style={rangeStyles.referenceLabel}>C5</Text>
        <Text style={rangeStyles.referenceLabel}>C6</Text>
      </View>

      {voiceType && (
        <View style={rangeStyles.voiceTypeBadge}>
          <Text style={rangeStyles.voiceTypeText}>{voiceType}</Text>
        </View>
      )}
    </View>
  );
};

const rangeStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  rangeBar: {
    height: 24,
    backgroundColor: colors.cardHighlight,
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
  },
  rangeFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  marker: {
    position: 'absolute',
    top: -8,
    transform: [{ translateX: -20 }],
    alignItems: 'center',
  },
  markerLow: {},
  markerHigh: {},
  markerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  referenceLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  voiceTypeBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  voiceTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});

// ============== SESSION CARD ==============
const SessionCard = ({
  session,
  isExpanded,
  onToggle
}: {
  session: SessionRecord;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const accuracyColor = getAccuracyColor(session.accuracy);

  return (
    <TouchableOpacity
      style={sessionStyles.card}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={sessionStyles.header}>
        <View style={sessionStyles.headerLeft}>
          <View style={[sessionStyles.accuracyBadge, { backgroundColor: accuracyColor }]}>
            <Text style={sessionStyles.accuracyText}>{session.accuracy}%</Text>
          </View>
          <View style={sessionStyles.info}>
            <Text style={sessionStyles.name}>{session.exerciseName}</Text>
            <Text style={sessionStyles.date}>{formatDate(session.date)}</Text>
          </View>
        </View>
        <Text style={sessionStyles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
      </View>

      {isExpanded && (
        <View style={sessionStyles.details}>
          <View style={sessionStyles.detailRow}>
            <Text style={sessionStyles.detailLabel}>Duration</Text>
            <Text style={sessionStyles.detailValue}>{formatTime(session.duration)}</Text>
          </View>
          <View style={sessionStyles.detailRow}>
            <Text style={sessionStyles.detailLabel}>Notes Hit</Text>
            <Text style={sessionStyles.detailValue}>
              {session.notesHit}/{session.notesAttempted}
            </Text>
          </View>
          {session.lowestNote && session.highestNote && (
            <View style={sessionStyles.detailRow}>
              <Text style={sessionStyles.detailLabel}>Range Used</Text>
              <Text style={sessionStyles.detailValue}>
                {session.lowestNote} → {session.highestNote}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const sessionStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accuracyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  accuracyText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  expandIcon: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

// ============== DAY DETAIL MODAL ==============
const DayDetailModal = ({
  visible,
  date,
  sessions,
  onClose,
}: {
  visible: boolean;
  date: string;
  sessions: SessionRecord[];
  onClose: () => void;
}) => {
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const avgAccuracy = Math.round(
    sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.date}>{formattedDate}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={modalStyles.summary}>
            <View style={modalStyles.summaryItem}>
              <Text style={modalStyles.summaryValue}>{sessions.length}</Text>
              <Text style={modalStyles.summaryLabel}>Sessions</Text>
            </View>
            <View style={modalStyles.summaryDivider} />
            <View style={modalStyles.summaryItem}>
              <Text style={modalStyles.summaryValue}>{avgAccuracy}%</Text>
              <Text style={modalStyles.summaryLabel}>Avg Accuracy</Text>
            </View>
            <View style={modalStyles.summaryDivider} />
            <View style={modalStyles.summaryItem}>
              <Text style={modalStyles.summaryValue}>{formatTime(totalTime)}</Text>
              <Text style={modalStyles.summaryLabel}>Total Time</Text>
            </View>
          </View>

          <ScrollView style={modalStyles.sessionsList}>
            {sessions.map((session, index) => (
              <View key={session.id || index} style={modalStyles.sessionItem}>
                <View style={[
                  modalStyles.sessionAccuracy,
                  { backgroundColor: getAccuracyColor(session.accuracy) }
                ]}>
                  <Text style={modalStyles.sessionAccuracyText}>{session.accuracy}%</Text>
                </View>
                <View style={modalStyles.sessionInfo}>
                  <Text style={modalStyles.sessionName}>{session.exerciseName}</Text>
                  <Text style={modalStyles.sessionMeta}>
                    {formatTime(session.duration)} · {session.notesHit}/{session.notesAttempted} notes
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  summary: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sessionsList: {
    padding: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionAccuracy: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  sessionAccuracyText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  sessionMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

// ============== EMPTY STATE ==============
const EmptyState = ({ onStartPractice }: { onStartPractice: () => void }) => (
  <View style={emptyStyles.container}>
    <Text style={emptyStyles.icon}>🎤</Text>
    <Text style={emptyStyles.title}>Start Your Journey</Text>
    <Text style={emptyStyles.subtitle}>
      Complete your first practice session to start tracking your progress!
    </Text>
    <TouchableOpacity style={emptyStyles.button} onPress={onStartPractice}>
      <Text style={emptyStyles.buttonText}>Start Practicing</Text>
    </TouchableOpacity>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

// ============== MAIN SCREEN ==============
export function ProgressScreen() {
  const navigation = useNavigation<any>();
  const { progress, stats, isLoading, refreshProgress } = useStorage();
  const [displayCount, setDisplayCount] = useState(SESSIONS_PER_PAGE);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ date: string; sessions: SessionRecord[] } | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshProgress();
      setDisplayCount(SESSIONS_PER_PAGE);
    });
    return unsubscribe;
  }, [navigation, refreshProgress]);

  const displayedSessions = useMemo(() => {
    return progress?.sessionHistory.slice(0, displayCount) || [];
  }, [progress?.sessionHistory, displayCount]);

  const hasMoreSessions = (progress?.sessionHistory.length || 0) > displayCount;

  const loadMore = () => {
    setDisplayCount(prev => prev + SESSIONS_PER_PAGE);
  };

  const handleStartPractice = () => {
    navigation.navigate('NativePitch');
  };

  const handleDayPress = useCallback((date: string, sessions: SessionRecord[]) => {
    setSelectedDay({ date, sessions });
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const hasSessions = progress && progress.sessionHistory.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Your Progress</Text>

        {hasSessions ? (
          <>
            {/* Streak Display - Hero Section */}
            <StreakDisplay
              currentStreak={stats?.currentStreak || 0}
              longestStreak={stats?.longestStreak || 0}
            />

            {/* Quick Stats Row */}
            <QuickStats
              accuracy={stats?.averageAccuracy || 0}
              totalTime={stats?.totalPracticeTime || 0}
              sessionsThisWeek={stats?.sessionsThisWeek || 0}
              improvementRate={stats?.improvementRate || 0}
            />

            {/* Weekly Summary */}
            <WeeklySummary
              sessions={progress?.sessionHistory || []}
              currentStreak={stats?.currentStreak || 0}
            />

            {/* Accuracy Chart */}
            <AccuracyChart sessions={progress?.sessionHistory || []} />

            {/* Vocal Range */}
            {progress?.vocalRange && progress.vocalRange.lowest && progress.vocalRange.highest && (
              <VocalRangeDisplay
                lowest={progress.vocalRange.lowest}
                highest={progress.vocalRange.highest}
              />
            )}

            {/* Interactive Calendar */}
            <Text style={styles.sectionTitle}>Practice History</Text>
            <InteractiveCalendar
              sessions={progress?.sessionHistory || []}
              onDayPress={handleDayPress}
            />

            {/* Recent Sessions */}
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {displayedSessions.map((session, index) => (
              <SessionCard
                key={session.id || index}
                session={session}
                isExpanded={expandedSessionId === (session.id || String(index))}
                onToggle={() => setExpandedSessionId(
                  expandedSessionId === (session.id || String(index))
                    ? null
                    : (session.id || String(index))
                )}
              />
            ))}

            {hasMoreSessions && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMore}
                activeOpacity={0.7}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <EmptyState onStartPractice={handleStartPractice} />
        )}
      </ScrollView>

      {/* Day Detail Modal */}
      <DayDetailModal
        visible={selectedDay !== null}
        date={selectedDay?.date || ''}
        sessions={selectedDay?.sessions || []}
        onClose={() => setSelectedDay(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  loadMoreButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
