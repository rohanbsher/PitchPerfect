/**
 * Pitch History Graph Component
 *
 * Extracted from PitchPerfectPro.tsx (lines 377-395)
 *
 * Visualizes pitch accuracy over time with color-coded bars
 * showing performance trend during an exercise.
 *
 * @module PitchHistoryGraph
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PitchHistoryPoint } from '../../hooks/usePitchHistory';

interface PitchHistoryGraphProps {
  /** Array of pitch history points to visualize */
  history: PitchHistoryPoint[];
  /** Maximum number of bars to display (defaults to 30) */
  maxBars?: number;
  /** Height of the graph container in pixels */
  height?: number;
  /** Optional title for the graph */
  title?: string;
}

/**
 * Pitch History Graph - Visual Timeline of Accuracy
 *
 * Displays the last N pitch readings as vertical bars:
 * - Bar height = accuracy (taller = better)
 * - Bar color = performance (green > yellow > red)
 * - Bar opacity = recency (more recent = more opaque)
 *
 * Color thresholds (from PitchPerfectPro):
 * - Green (>90%): Excellent pitch matching
 * - Yellow (70-90%): Good, needs minor adjustment
 * - Red (<70%): Needs significant improvement
 */
export const PitchHistoryGraph: React.FC<PitchHistoryGraphProps> = ({
  history,
  maxBars = 30,
  height = 100,
  title = 'Pitch Accuracy Over Time',
}) => {
  // Get recent history (last maxBars readings)
  const recentHistory = history.slice(-maxBars);

  // If no history, show empty state
  if (recentHistory.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pitch data yet</Text>
          <Text style={styles.emptySubtext}>Start singing to see your accuracy</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.graphContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>100%</Text>
          <Text style={styles.yAxisLabel}>50%</Text>
          <Text style={styles.yAxisLabel}>0%</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {recentHistory.map((point, index) => {
            // Calculate bar properties
            const accuracy = point.accuracy;
            const barHeight = Math.max(accuracy * 50, 2); // Min 2px for visibility

            // Color based on accuracy (from PitchPerfectPro lines 384-386)
            const barColor =
              accuracy > 0.9
                ? '#34C759' // Green (iOS system green)
                : accuracy > 0.7
                ? '#FF9500' // Yellow/Orange (iOS system orange)
                : '#FF3B30'; // Red (iOS system red)

            // Opacity increases for more recent bars (from PitchPerfectPro line 388)
            const opacity = (index + 1) / recentHistory.length;

            return (
              <View
                key={`bar-${index}-${point.timestamp}`}
                style={[
                  styles.historyBar,
                  {
                    height: barHeight,
                    backgroundColor: barColor,
                    opacity: opacity,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>Excellent (&gt;90%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.legendText}>Good (70-90%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>Needs Work (&lt;70%)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  graphContainer: {
    flexDirection: 'row',
    height: 60,
    marginBottom: 12,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    width: 40,
  },
  yAxisLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  historyBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    minWidth: 2,
    maxWidth: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
