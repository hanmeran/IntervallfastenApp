import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'; // Standard Icons in Expo
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75; // Kreisgröße relativ zum Bildschirm
const RADIUS = CIRCLE_SIZE / 2 - 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function App() {
  const [isFasting, setIsFasting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in Sekunden
  const [startTime, setStartTime] = useState(0); // timestamp
  const [view, setView] = useState('timer'); // 'timer' oder 'settings'

  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isLinked, setIsLinked] = useState(true);
  const [isNewPlan, setIsNewPlan] = useState(false);

  const activePlan = plans.find(p => p.id === activePlanId) || null;
  const fastingGoal = (activePlan?.fastingHours || 16) * 3600;

  // Load plans from storage on initial mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        let plansString = await AsyncStorage.getItem('fastingPlans');
        let activeIdString = await AsyncStorage.getItem('activePlanId');

        if (!plansString) {
          // Create default plan if none exist
          const defaultPlan = { id: 1, name: '16:8 Leangains', fastingHours: 16, eatingHours: 8 };
          const defaultPlans = [defaultPlan];
          await AsyncStorage.setItem('fastingPlans', JSON.stringify(defaultPlans));
          await AsyncStorage.setItem('activePlanId', '1');
          setPlans(defaultPlans);
          setActivePlanId(1);
        } else {
          setPlans(JSON.parse(plansString));
          setActivePlanId(activeIdString ? parseInt(activeIdString, 10) : 1);
        }
      } catch (e) {
        console.error("Failed to load plans.", e);
      }
    };
    loadPlans();
  }, []);

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
    // Wenn das Fasten aktiv ist, aber die Zeit noch 0 ist,
    // geben wir einen minimalen Wert zurück, um den Start des Kreises sofort sichtbar zu machen.
    if (isFasting && elapsedTime === 0) {
      return 0.001;
    }
    return Math.min(elapsedTime / fastingGoal, 1);
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
          {/* Always render goalText to maintain layout, but make it transparent if not fasting */}
          <Text style={[styles.goalText, !isFasting && { opacity: 0 }]}>
            Ziel: {fastingGoal / 3600} Stunden
          </Text>
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
              const GRACE_PERIOD_SECONDS = 300; // 5 Minuten Karenzzeit
              if (elapsedTime < GRACE_PERIOD_SECONDS) { // Speichert nicht, wenn es WENIGER als 5 Minuten sind
                // Fasten war zu kurz, wird nicht gespeichert. Nur der aktive Zustand wird zurückgesetzt.
                await AsyncStorage.removeItem('isFasting');
                await AsyncStorage.removeItem('startTime');
                return; // Funktion hier beenden
              }

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

              const planSnapshot = {
                name: activePlan?.name || 'Unbekannter Plan',
                fastingHours: activePlan?.fastingHours || 16,
              };

              const newFast = { id: Date.now(), startTime, duration: elapsedTime, status, plan: planSnapshot };
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
          if (newFastingState) { // Starting a fast
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
        <Feather name={isFasting ? "square" : "play"} size={24} color={"#FFFFFF"} />
        <Text style={[styles.btnText, isFasting ? styles.textStop : styles.textStart]}>
          {isFasting ? "Fasten beenden" : "Fasten starten"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingsView = () => (
    <View style={styles.contentContainer}>
      {/* Edit Plan Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible && editingPlan !== null}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isNewPlan ? 'Neuen Plan erstellen' : 'Plan bearbeiten'}</Text>

            <View style={styles.inputRow}>
              <Text style={[styles.modalLabel, styles.nameTimeLabel]}>
                {editingPlan?.fastingHours || 0}:{editingPlan?.eatingHours || 0}
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Mein Plan"
                  value={editingPlan?.name.split(' ').slice(1).join(' ')}
                  onChangeText={(customName) => {
                    const filteredName = customName.replace(/[^a-zA-Z0-9 ]/g, ''); // Erlaubt nur Buchstaben, Zahlen und Leerzeichen
                    const prefix = `${editingPlan?.fastingHours || 0}:${editingPlan?.eatingHours || 0}`; // Keep prefix
                    setEditingPlan(prev => ({ ...prev, name: `${prefix} ${filteredName}` })); // Do NOT trim here
                  }}
                />
                <View style={styles.unitSpacer} />
              </View>
            </View>
            <Text style={styles.inputHint}>Nur Buchstaben, Zahlen und Leerzeichen.</Text>
            
            <View style={styles.inputRow}>
              <Text style={styles.modalLabel}>Fastenzeit</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={String(editingPlan?.fastingHours || '')}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const hours = parseInt(text, 10);
                    if (!isNaN(hours) && hours >= 1 && (isLinked ? hours <= 23 : true)) {
                      const newValues = { fastingHours: hours };
                      if (isLinked) newValues.eatingHours = 24 - hours;
                      setEditingPlan(prev => ({ ...prev, ...newValues }));
                    } else if (text === '') {
                      setEditingPlan(prev => ({ ...prev, fastingHours: '' }));
                    }
                  }}
                />
                <Text style={styles.modalUnitLabel}>h</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.linkButton} onPress={() => setIsLinked(!isLinked)}>
              <MaterialCommunityIcons
                name={isLinked ? "link-variant" : "link-variant-off"}
                size={24}
                color={isLinked ? "#14B8A6" : "#94A3B8"} />
            </TouchableOpacity>

            <View style={styles.inputRow}>
              <Text style={styles.modalLabel}>Essenszeit</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={String(editingPlan?.eatingHours || '')}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const hours = parseInt(text, 10);
                    if (!isNaN(hours) && hours >= 1 && (isLinked ? hours <= 23 : true)) {
                      const newValues = { eatingHours: hours };
                      if (isLinked) newValues.fastingHours = 24 - hours;
                      setEditingPlan(prev => ({ ...prev, ...newValues }));
                    } else if (text === '') {
                      setEditingPlan(prev => ({ ...prev, eatingHours: '' }));
                    }
                  }}
                />
                <Text style={styles.modalUnitLabel}>h</Text>
              </View>
            </View>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={async () => {
                  let updatedPlans;
                  const planToSave = { ...editingPlan, name: editingPlan.name.trim() }; // Trim name before saving
                  if (isNewPlan) {
                    updatedPlans = [...plans, planToSave];
                  } else {
                    updatedPlans = plans.map(p => p.id === editingPlan.id ? planToSave : p);
                  }
                  setPlans(updatedPlans);
                  await AsyncStorage.setItem('fastingPlans', JSON.stringify(updatedPlans));
                  setIsModalVisible(false);
                  setEditingPlan(null);
                }}
              >
                <Text style={styles.saveButtonText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { justifyContent: 'flex-start' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setView('timer')} style={styles.iconButton}>
            <Feather name="chevron-left" size={28} color="#475569" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { marginLeft: 10 }]}>EINSTELLUNGEN</Text>
        </View>
      </View>

      <ScrollView style={{ width: '100%' }}>
        <Text style={styles.sectionTitle}>FASTENPLAN</Text>
        <View style={styles.card}>
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.id}
              onPress={async () => {
                setActivePlanId(plan.id);
                await AsyncStorage.setItem('activePlanId', String(plan.id));
              }}
            >
              <View style={[styles.planRow, plan.id === activePlanId && styles.activePlanRow]}>
                <View>
                  <Text style={[styles.planLabel, plan.id === activePlanId && styles.activePlanLabel]}>{plan.name}</Text>
                  <Text style={styles.planDesc}>{plan.fastingHours}h Fasten, {plan.eatingHours}h Essen</Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      // Reset states when opening modal
                      setEditingPlan({ ...plan }); 
                      setIsNewPlan(false);
                      setIsLinked(true);
                      setIsModalVisible(true);
                    }}
                  >
                    <Feather name="edit-2" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      if (plan.id === activePlanId) {
                        Alert.alert('Aktion nicht möglich', 'Der aktive Plan kann nicht gelöscht werden.');
                        return;
                      }
                      if (plans.length <= 1) {
                        Alert.alert('Aktion nicht möglich', 'Der letzte verbleibende Plan kann nicht gelöscht werden.');
                        return;
                      }

                      Alert.alert(
                        'Plan löschen',
                        `Möchtest du den Plan "${plan.name}" wirklich löschen?`,
                        [
                          { text: 'Abbrechen', style: 'cancel' },
                          { text: 'Löschen', style: 'destructive', onPress: async () => {
                              const updatedPlans = plans.filter(p => p.id !== plan.id);
                              setPlans(updatedPlans);
                              await AsyncStorage.setItem('fastingPlans', JSON.stringify(updatedPlans));
                          }},
                        ]
                      );
                    }}
                  >
                    <Feather name="trash-2" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {plans.length < 7 && (
            <TouchableOpacity
              style={[styles.planRow, styles.addPlanButton]}
              onPress={() => {
                const newPlanId = Date.now(); // Simple unique ID
                setEditingPlan({
                  id: newPlanId,
                  name: '16:8 Mein Plan',
                  fastingHours: 16,
                  eatingHours: 8,
                });
                setIsNewPlan(true);
                setIsLinked(true);
                setIsModalVisible(true);
              }}
            >
              <Text style={styles.addPlanButtonText}>+ Neuen Plan hinzufügen</Text>
            </TouchableOpacity>
          )}
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
                    plan: { name: '16:8 Leangains', fastingHours: 16 },
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

const baseInputStyle = {
  backgroundColor: '#F8FAFC',
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
};

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
  iconBadge: { // TODO: Farben umkehren
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
    backgroundColor: '#14B8A6', // Teal 500
  },
  btnStop: {
    backgroundColor: '#FB923C', // Orange 400
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  textStart: { color: '#FFFFFF' },
  textStop: { color: '#FFFFFF' },
  
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
    color: '#0F766E', // Teal-800
  },
  planDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  planHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#14B8A6',
  },
  addPlanButton: {
    justifyContent: 'center',
    backgroundColor: '#F0F9FF', // Light blue background
    borderBottomWidth: 0, // No bottom border for the last item
  },
  addPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0EA5E9', // Sky 500
    textAlign: 'center',
    paddingVertical: 4,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  modalLabel: { // Base style for all labels in modal
    fontSize: 16,
    color: '#475569',
    width: 90, // Fixed width for label to align inputs
  },
  nameTimeLabel: { // Specific style for the dynamic time label
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  linkButton: {
    padding: 8,
    alignSelf: 'center',
    marginVertical: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  inputWrapper: {
    ...baseInputStyle,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginBottom: 0,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  modalUnitLabel: {
    fontSize: 16,
    color: '#475569',
    marginLeft: 10,
  },
  unitSpacer: {
    width: 30, // Corresponds to modalUnitLabel width (20) + marginLeft (10)
    height: '100%', // Match height of input
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44, // Explicit height
    marginBottom: 4, // Small gap between rows
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#0F172A',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
});