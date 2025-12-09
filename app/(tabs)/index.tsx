import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'; // Standard Icons in Expo
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75; // Kreisgröße relativ zum Bildschirm
const RADIUS = CIRCLE_SIZE / 2 - 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function App() {
  const [isFasting, setIsFasting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in Sekunden
  const [startTime, setStartTime] = useState(0); // timestamp
  const [fastingGoal, setFastingGoal] = useState(16 * 3600); // 16 Stunden Standard
  const [view, setView] = useState('timer'); // 'timer' oder 'settings'

  // Load initial state from storage
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedIsFasting = await AsyncStorage.getItem('isFasting');
        const savedStartTime = await AsyncStorage.getItem('startTime');

        if (savedIsFasting === 'true' && savedStartTime) {
          const start = parseInt(savedStartTime, 10);
          const now = Date.now();
          const elapsed = Math.floor((now - start) / 1000);

          setIsFasting(true);
          setStartTime(start);
          setElapsedTime(elapsed);
        }
      } catch (e) {
        console.error("Failed to load state.", e);
      }
    };

    loadState();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isFasting) {
      interval = setInterval(() => {
        // We calculate elapsed time from startTime for accuracy
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isFasting, startTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHoursMinutes = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getProgress = () => {
    // Fortschritt berechnen, maximal 100% (1.0)
    return Math.min((elapsedTime / fastingGoal), 1);
  };

  const strokeDashoffset = CIRCUMFERENCE - getProgress() * CIRCUMFERENCE;

  // --- UI VIEW KOMPONENTEN ---

  const renderTimerView = () => (
    <View style={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HEUTE</Text>
        <TouchableOpacity onPress={() => setView('settings')} style={styles.iconButton}>
          <Feather name="settings" size={24} color="#475569" />
        </TouchableOpacity>
      </View>

      {/* Hauptkreis */}
      <View style={styles.timerWrapper}>
        <Svg height={CIRCLE_SIZE} width={CIRCLE_SIZE} style={styles.svg}>
          {/* Hintergrundkreis */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#F1F5F9"
            strokeWidth="15"
            fill="transparent"
          />
          {/* Fortschrittskreis */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={isFasting ? "#FB923C" : "#14B8A6"} // Orange oder Türkis
            strokeWidth="15"
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>

        {/* Text in der Mitte */}
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
          {isFasting && (
            <Text style={styles.goalText}>Ziel: {fastingGoal / 3600} Stunden</Text>
          )}
        </View>
      </View>

      {/* Statistik Boxen */}
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

      {/* Start/Stop Button */}
      <TouchableOpacity
        onPress={() => {
          const stopFasting = async () => {
            try {
              const historyString = await AsyncStorage.getItem('fastingHistory');
              const history = historyString ? JSON.parse(historyString) : [];
              
              let status = 'aborted';
              if (elapsedTime >= fastingGoal * 1.1) {
                status = 'extended';
              } else if (elapsedTime >= fastingGoal) {
                status = 'completed';
              } else if (elapsedTime >= fastingGoal * 0.9) {
                status = 'nearly_there';
              }

              const newFast = { id: Date.now(), startTime, duration: elapsedTime, status, plan: '16:8 Leangains' };
              history.unshift(newFast); // Add to the beginning of the array
              await AsyncStorage.setItem('fastingHistory', JSON.stringify(history));

              // Clear active fast state
              await AsyncStorage.removeItem('isFasting');
              await AsyncStorage.removeItem('startTime');
            } catch (e) {
              console.error("Failed to save fast to history.", e);
            }
          };

          const newFastingState = !isFasting;
          setIsFasting(newFastingState);
          if (newFastingState) {
            const now = Date.now();
            setStartTime(now);
            setElapsedTime(0);
            AsyncStorage.setItem('isFasting', 'true');
            AsyncStorage.setItem('startTime', now.toString());
          } else {
            stopFasting();
          }
        }}
        style={[styles.actionButton, isFasting ? styles.btnStop : styles.btnStart]}
      >
        <Feather name={isFasting ? "square" : "play"} size={24} color={isFasting ? "#EF4444" : "#FFFFFF"} />
        <Text style={[styles.btnText, isFasting ? styles.textStop : styles.textStart]}>
          {isFasting ? "Fasten beenden" : "Fasten starten"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingsView = () => (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('timer')} style={styles.iconButton}>
          <Feather name="chevron-left" size={28} color="#475569" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginLeft: 10 }]}>EINSTELLUNGEN</Text>
      </View>

      <ScrollView style={{ width: '100%' }}>
        <Text style={styles.sectionTitle}>FASTENPLAN</Text>
        <View style={styles.card}>
          <View style={[styles.planRow, styles.activePlanRow]}>
            <View>
              <Text style={[styles.planLabel, styles.activePlanLabel]}>16:8 Leangains</Text>
              <Text style={styles.planDesc}>16h Fasten, 8h Essen</Text>
            </View>
            <View style={styles.activeDot} />
          </View>
        </View>

        {/* Developer Section */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>ENTWICKLER</Text>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={async () => {
              try {
                const today = new Date();
                const fastingGoal = 16 * 3600; // Ensure fastingGoal is defined here

                // Define the exact counts for each status
                const statusesToGenerate = [
                  ...Array(12).fill('completed'),
                  ...Array(4).fill('aborted'),
                  ...Array(3).fill('nearly_there'),
                  ...Array(5).fill('extended'),
                ];

                // Shuffle the array to make the history look more natural
                for (let i = statusesToGenerate.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [statusesToGenerate[i], statusesToGenerate[j]] = [statusesToGenerate[j], statusesToGenerate[i]];
                }

                const mockFasts = statusesToGenerate.map((status, i) => {
                  const fastDate = new Date();
                  fastDate.setDate(today.getDate() - (i + 1)); // Go back in time
                  fastDate.setHours(18, 30, 0, 0);

                  let duration;
                  switch (status) {
                    case 'completed':
                      duration = fastingGoal + Math.floor(Math.random() * (fastingGoal * 0.09));
                      break;
                    case 'aborted':
                      duration = Math.floor(Math.random() * (fastingGoal * 0.8));
                      break;
                    case 'nearly_there':
                      duration = fastingGoal * 0.9 + Math.floor(Math.random() * (fastingGoal * 0.09));
                      break;
                    case 'extended': // "Überzogen"
                      duration = fastingGoal * 1.1 + Math.floor(Math.random() * 7200); // up to 2 hours longer
                      break;
                  }

                  return {
                    id: fastDate.getTime(),
                    startTime: fastDate.getTime(),
                    duration,
                    status,
                    plan: '16:8 Leangains',
                  };
                });

                const existingHistoryString = await AsyncStorage.getItem('fastingHistory');
                const existingHistory = existingHistoryString ? JSON.parse(existingHistoryString) : [];
                // Keep only non-mock data if regenerating
                const nonMockHistory = existingHistory.filter(f => !mockFasts.some(m => m.id === f.id));
                const combinedHistory = [...nonMockHistory, ...mockFasts].sort((a, b) => b.startTime - a.startTime);

                await AsyncStorage.setItem('fastingHistory', JSON.stringify(combinedHistory));
                Alert.alert('Erfolg', `${statusesToGenerate.length} neue Test-Einträge wurden zum Verlauf hinzugefügt.`);
              } catch (e) {
                Alert.alert('Fehler', 'Testdaten konnten nicht erstellt werden.');
              }
            }}
            style={styles.planRow}>
            <Text style={styles.planLabel}>Testdaten generieren</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              Alert.alert(
                'Verlauf löschen',
                'Bist du sicher, dass du den gesamten Fastenverlauf unwiderruflich löschen möchtest?',
                [
                  { text: 'Abbrechen', style: 'cancel' },
                  { text: 'Löschen', style: 'destructive', onPress: async () => {
                      await AsyncStorage.removeItem('fastingHistory');
                      Alert.alert('Erfolg', 'Der Verlauf wurde gelöscht.');
                  }},
                ]);
            }}
            style={styles.planRow}>
            <Text style={[styles.planLabel, { color: '#EF4444' }]}>Verlauf löschen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {view === 'timer' ? renderTimerView() : renderSettingsView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8', // Slate 400
    letterSpacing: 1.5,
  },
  iconButton: {
    padding: 8,
  },
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  svg: {
    position: 'absolute',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    padding: 12,
    borderRadius: 50,
    marginBottom: 10,
  },
  bgTeal: { backgroundColor: '#CCFBF1' },
  bgOrange: { backgroundColor: '#FFEDD5' },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  goalText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  btnStart: {
    backgroundColor: '#0F172A', // Slate 900
  },
  btnStop: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFE4E6',
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  textStart: { color: '#FFFFFF' },
  textStop: { color: '#EF4444' },
  
  // Settings Styles
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activePlanRow: {
    backgroundColor: '#F0FDFA',
  },
  planLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  activePlanLabel: {
    color: '#0F766E',
  },
  planDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#14B8A6',
  },
});