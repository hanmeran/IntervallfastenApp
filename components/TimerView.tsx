import { formatHoursMinutes, formatTime } from '@/constants/formatters';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const RADIUS = CIRCLE_SIZE / 2 - 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerViewProps {
  isFasting: boolean;
  elapsedTime: number;
  startTime: number;
  fastingGoal: number;
  onToggleFasting: () => void;
  onOpenSettings: () => void;
}

const TimerView = ({
  isFasting,
  elapsedTime,
  startTime,
  fastingGoal,
  onToggleFasting,
  onOpenSettings,
}: TimerViewProps) => {
  const getProgress = () => {
    if (isFasting && elapsedTime === 0) {
      return 0.001;
    }
    return Math.min(elapsedTime / fastingGoal, 1);
  };

  const strokeDashoffset = CIRCUMFERENCE - getProgress() * CIRCUMFERENCE;

  return (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HEUTE</Text>
        <TouchableOpacity onPress={onOpenSettings} style={styles.iconButton}>
          <Feather name="settings" size={24} color="#475569" />
        </TouchableOpacity>
      </View>

      <View style={styles.timerWrapper}>
        <Svg height={CIRCLE_SIZE} width={CIRCLE_SIZE} style={styles.svg}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#F1F5F9"
            strokeWidth="15"
            fill="transparent"
          />
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={isFasting ? "#FB923C" : "#14B8A6"}
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>

        <View style={styles.innerCircle}>
          <View style={[styles.iconBadge, isFasting ? styles.bgOrange : styles.bgTeal]}>
            {isFasting ? (
              <MaterialCommunityIcons name="food-off" size={24} color="#EA580C" />
            ) : (
              <MaterialCommunityIcons name="food-fork-drink" size={24} color="#0D9488" />
            )}
          </View>
          <Text style={styles.statusLabel}>
            {isFasting ? 'Fastenzeit' : 'Essenszeit'}
          </Text>
          <Text style={styles.timerText}>
            {formatTime(elapsedTime)}
          </Text>
          <Text style={[styles.goalText, !isFasting && { opacity: 0 }]}>
            Ziel: {fastingGoal / 3600} Stunden
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>START</Text>
          <Text style={styles.statValue}>{isFasting ? formatHoursMinutes(startTime) : '--:--'}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>ENDE (ZIEL)</Text>
          <Text style={styles.statValue}>{isFasting ? formatHoursMinutes(startTime + fastingGoal * 1000) : '--:--'}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onToggleFasting}
        style={[styles.actionButton, isFasting ? styles.btnStop : styles.btnStart]}
      >
        <Feather name={isFasting ? "square" : "play"} size={24} color={"#FFFFFF"} />
        <Text style={[styles.btnText, isFasting ? styles.textStop : styles.textStart]}>
          {isFasting ? "Fasten beenden" : "Fasten starten"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Placeholder for styles that will be moved from index.tsx
  contentContainer: { flex: 1, padding: 24, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, marginTop: 10 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5 },
  iconButton: { padding: 8 },
  timerWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  svg: { position: 'absolute' },
  innerCircle: { alignItems: 'center', justifyContent: 'center' },
  iconBadge: { padding: 12, borderRadius: 50, marginBottom: 10 },
  bgTeal: { backgroundColor: '#CCFBF1' },
  bgOrange: { backgroundColor: '#FFEDD5' },
  statusLabel: { fontSize: 16, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  timerText: { fontSize: 48, fontWeight: '800', color: '#1E293B', fontVariant: ['tabular-nums'] },
  goalText: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  statBox: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, width: '48%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '600', color: '#334155' },
  actionButton: { width: '100%', paddingVertical: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  btnStart: { backgroundColor: '#14B8A6' },
  btnStop: { backgroundColor: '#FB923C' },
  btnText: { fontSize: 18, fontWeight: '700', marginLeft: 12 },
  textStart: { color: '#FFFFFF' },
  textStop: { color: '#FFFFFF' },
});

export default TimerView;