import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import HistoryPieChart from '@/components/HistoryPieChart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { STATUS_CONFIG } from '@/constants/app';
import { FastingEntry, loadFastingHistory } from '@/constants/fastingHistoryService';
import { formatDate, formatHistoryTime, formatTotalDuration } from '@/constants/formatters';
import { Fonts } from '@/constants/theme';

/*
 * Extracted PieChart component to its own file: components/HistoryPieChart.tsx
 */

export default function HistoryScreen() {
  const [history, setHistory] = useState<FastingEntry[]>([]);

  const summaryStats = useMemo(() => {
    if (!history.length) return { count: 0, totalDuration: 0, plans: [] };

    const totalDurationSeconds = history.reduce((sum, fast) => sum + fast.duration, 0);
    // Handle both old string plans and new object plans for compatibility
    const plans = [...new Set(history.map(fast => (typeof fast.plan === 'string' ? fast.plan : fast.plan?.name)).filter(Boolean))];

    return {
      count: history.length,
      totalDuration: totalDurationSeconds,
      plans,
    };
  }, [history]);

  const chartData = useMemo(() => {
    if (!history.length) return [];

    const statusCounts = history.reduce((acc, fast) => {
      acc[fast.status] = (acc[fast.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        label: STATUS_CONFIG[status]?.label || 'Unbekannt',
        value: count,
        color: STATUS_CONFIG[status]?.color || '#94A3B8',
      }))
      .sort((a, b) => b.value - a.value);
  }, [history]);

  // useFocusEffect runs every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        try { // Use the service to load history
          const loadedHistory = await loadFastingHistory();
          setHistory(loadedHistory);
          // Ensure plan objects are correctly parsed if they were strings
          setHistory(prev => prev.map(entry => ({
            ...entry,
            plan: typeof entry.plan === 'string' ? { name: entry.plan, fastingHours: 0 } : entry.plan, // Default fastingHours if not present
          })));
        } catch (e) {
          console.error('Failed to load history.', e);
        }
      };
      loadHistory();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Verlauf
        </ThemedText>
      </ThemedView>

      {history.length > 0 && (
        <View style={styles.card}>
          <View style={styles.summaryHeader}>
            <ThemedText style={styles.summaryTitle}>Übersicht</ThemedText>
            <View style={styles.summaryTotals}>
              <ThemedText style={styles.summaryTotalLabel}>Gesamt</ThemedText>
              <ThemedText style={styles.summaryTotalValue}>{summaryStats.count}</ThemedText>
            </View>
          </View>
          <HistoryPieChart data={chartData} />
          <View style={styles.totalDurationContainer}>
            {summaryStats.plans.length > 0 && (
              <ThemedText style={styles.summaryPlanText}>Statistik für: {summaryStats.plans.join(', ')}</ThemedText>
            )}
            <ThemedText style={styles.totalDurationText}>Gesamte Fastenzeit: {formatTotalDuration(summaryStats.totalDuration)}</ThemedText>
          </View>
        </View>
      )}

      <ScrollView style={{ width: '100%' }}>
        {history.length > 0 ? (
          history.map((fast: FastingEntry) => {
            const config = STATUS_CONFIG[fast.status] || {};
            return (
              <View key={fast.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.cardDate}>{formatDate(fast.startTime)}</ThemedText>
                  {fast.status && (
                    <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                      <ThemedText style={[styles.statusText, { color: config.color }]}>{config.label}</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <ThemedText style={styles.cardDuration}>Dauer: {formatHistoryTime(fast.duration)}</ThemedText>
                  {fast.plan && <ThemedText style={styles.cardPlan}>{fast.plan.name}</ThemedText>}
                </View>
              </View>
            );
          })
        ) : (
          <ThemedText style={styles.emptyText}>Noch keine abgeschlossenen Fasten vorhanden.</ThemedText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({ // Renamed to localStyles to avoid conflicts if moved
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    padding: 24,
    paddingTop: 10, // Add some top padding
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginHorizontal: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  cardDuration: {
    fontSize: 14,
    color: '#64748B',
  },
  cardPlan: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryHeader: { // This style is fine
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Align to bottom
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  summaryTotals: {
    alignItems: 'flex-end',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  legendContainer: {
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Space between legend items
  },
  legendDot: {
    width: 10, // Dot size
    height: 10,
    borderRadius: 5, // Make it a circle
    marginRight: 8, // Space between dot and text
  },
  legendText: {
    fontSize: 14,
    color: '#475569',
  },
  summaryTotalLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '700',
  },
  totalDurationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  summaryPlanText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  totalDurationText: {
    textAlign: 'center',
    color: '#475569',
    fontWeight: '600',
  },
});

// Export styles for use in HistoryPieChart
export const styles = {
  ...localStyles,
  chartContainer: localStyles.chartContainer,
  legendContainer: localStyles.legendContainer,
};
