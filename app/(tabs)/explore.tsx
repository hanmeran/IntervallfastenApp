import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { Path, Svg } from 'react-native-svg';

const formatHistoryTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const formatTotalDuration = (seconds) => {
  const totalHours = Math.floor(seconds / 3600);
  const days = Math.floor(totalHours / 24);
  return `${days} Tage, ${totalHours % 24} Stunden`;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const STATUS_CONFIG = {
  completed: { label: 'Erfolgreich', color: '#10B981', bgColor: '#ECFDF5' },
  extended: { label: 'Überzogen', color: '#06B6D4', bgColor: '#E0F7FA' },
  nearly_there: { label: 'Knapp verfehlt', color: '#F59E0B', bgColor: '#FFFBEB' },
  aborted: { label: 'Abgebrochen', color: '#EF4444', bgColor: '#FEF2F2' },
};

const PieChart = ({ data }) => {
  const size = 120;
  const radius = size / 2;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let startAngle = 0;

  const slices = data.map(slice => {
    const angle = (slice.value / total) * 360;
    const endAngle = startAngle + angle;

    const x1 = radius + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = radius + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = radius + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = radius + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = `M ${radius},${radius} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
    startAngle = endAngle;

    return <Path key={slice.label} d={d} fill={slice.color} />;
  });

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {slices}
      </Svg>
      <View style={styles.legendContainer}>
        {data.map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <ThemedText style={styles.legendText}>{item.label} ({item.value})</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  const summaryStats = useMemo(() => {
    if (!history.length) return { count: 0, totalDuration: 0, plans: [] };

    const totalDurationSeconds = history.reduce((sum, fast) => sum + fast.duration, 0);
    const plans = [...new Set(history.map(fast => fast.plan).filter(Boolean))];

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
        try {
          const historyString = await AsyncStorage.getItem('fastingHistory');
          if (historyString) {
            setHistory(JSON.parse(historyString));
          } else {
            setHistory([]); // Setzt den Verlauf zurück, wenn nichts gefunden wird
          }
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
          <PieChart data={chartData} />
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
          history.map((fast) => {
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
                  {fast.plan && <ThemedText style={styles.cardPlan}>{fast.plan}</ThemedText>}
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

const styles = StyleSheet.create({
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
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
