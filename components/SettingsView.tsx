import { DEFAULT_FASTING_HOURS, MAX_PLANS } from '@/constants/app';
import { clearFastingHistory, loadFastingHistory, saveFastingHistory } from '@/constants/fastingHistoryService';
import { FastingPlan, saveFastingPlans, setActiveFastingPlan } from '@/constants/fastingPlanService';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PlanEditModal from './PlanEditModal';

interface SettingsViewProps {
  plans: FastingPlan[];
  setPlans: React.Dispatch<React.SetStateAction<FastingPlan[]>>;
  activePlanId: number | null;
  setActivePlanId: React.Dispatch<React.SetStateAction<number | null>>;
  onClose: () => void;
}

const SettingsView = ({ plans, setPlans, activePlanId, setActivePlanId, onClose }: SettingsViewProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FastingPlan | null>(null);
  const [isLinked, setIsLinked] = useState(true);
  const [isNewPlan, setIsNewPlan] = useState(false);

  const handleSavePlan = async (planToSave: FastingPlan, isNew: boolean) => {
    let updatedPlans;
    if (isNew) {
      updatedPlans = [...plans, planToSave].sort((a, b) => a.id - b.id);
    } else {
      updatedPlans = plans.map(p => p.id === planToSave.id ? planToSave : p);
    }
    setPlans(updatedPlans);
    await saveFastingPlans(updatedPlans);
    setIsModalVisible(false);
    setEditingPlan(null);
  };

  const handleAddPlanPress = () => {
    const newPlanId = (plans.length > 0 ? Math.max(...plans.map(p => p.id)) : 0) + 1;
    setEditingPlan({
      id: newPlanId,
      name: `${DEFAULT_FASTING_HOURS}:${24 - DEFAULT_FASTING_HOURS} Mein Plan`,
      fastingHours: DEFAULT_FASTING_HOURS,
      eatingHours: 24 - DEFAULT_FASTING_HOURS,
    });
    setIsNewPlan(true);
    setIsLinked(true);
    setIsModalVisible(true);
  };

  const handleDeletePlan = (planToDelete: FastingPlan) => {
    if (planToDelete.id === activePlanId) {
      Alert.alert('Aktion nicht möglich', 'Der aktive Plan kann nicht gelöscht werden.');
      return;
    }
    if (plans.length <= 1) {
      Alert.alert('Aktion nicht möglich', 'Der letzte verbleibende Plan kann nicht gelöscht werden.');
      return;
    }

    Alert.alert(
      'Plan löschen',
      `Möchtest du den Plan "${planToDelete.name}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
            const updatedPlans = plans.filter(p => p.id !== planToDelete.id);
            setPlans(updatedPlans);
            await saveFastingPlans(updatedPlans);
        }},
      ]
    );
  };

  const handleGenerateTestData = async () => {
    try {
      const today = new Date();
      const fastingGoal = DEFAULT_FASTING_HOURS * 3600;

      const statusesToGenerate = [
        ...Array(12).fill('completed'),
        ...Array(4).fill('aborted'),
        ...Array(3).fill('nearly_there'),
        ...Array(5).fill('extended'),
      ];
      for (let i = statusesToGenerate.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [statusesToGenerate[i], statusesToGenerate[j]] = [statusesToGenerate[j], statusesToGenerate[i]];
      }

      const mockFasts = statusesToGenerate.map((status, i) => {
        const fastDate = new Date();
        fastDate.setDate(today.getDate() - (i + 1));
        fastDate.setHours(18, 30, 0, 0);

        let duration;
        switch (status) {
          case 'completed': duration = fastingGoal + Math.floor(Math.random() * (fastingGoal * 0.09)); break;
          case 'aborted': duration = Math.floor(Math.random() * (fastingGoal * 0.8)); break;
          case 'nearly_there': duration = fastingGoal * 0.9 + Math.floor(Math.random() * (fastingGoal * 0.09)); break;
          case 'extended': duration = fastingGoal * 1.1 + Math.floor(Math.random() * 7200); break;
          default: duration = fastingGoal; // Fallback
        }

        return {
          id: fastDate.getTime(),
          startTime: fastDate.getTime(),
          duration,
          status,
          plan: { name: `${DEFAULT_FASTING_HOURS}:${24 - DEFAULT_FASTING_HOURS} Leangains`, fastingHours: DEFAULT_FASTING_HOURS },
        };
      });

      const existingHistory = await loadFastingHistory();
      const nonMockHistory = existingHistory.filter(f => !mockFasts.some(m => m.id === f.id));
      const combinedHistory = [...nonMockHistory, ...mockFasts].sort((a, b) => b.startTime - a.startTime);
      
      await saveFastingHistory(combinedHistory);
      Alert.alert('Erfolg', `${statusesToGenerate.length} neue Test-Einträge wurden zum Verlauf hinzugefügt.`);
    } catch (e) {
      Alert.alert('Fehler', 'Testdaten konnten nicht erstellt werden.');
    }
  };

  const handleClearHistory = async () => {
    Alert.alert(
      'Verlauf löschen',
      'Bist du sicher, dass du den gesamten Fastenverlauf unwiderruflich löschen möchtest?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
            await clearFastingHistory();
            Alert.alert('Erfolg', 'Der Verlauf wurde gelöscht.');
        }},
      ]
    );
  };

  return (
    <View style={styles.contentContainer}>
      <PlanEditModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        editingPlan={editingPlan}
        setEditingPlan={setEditingPlan}
        isLinked={isLinked}
        setIsLinked={setIsLinked}
        isNewPlan={isNewPlan}
        onSave={handleSavePlan}
      />

      <View style={[styles.header, { justifyContent: 'flex-start' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
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
                await setActiveFastingPlan(plan.id);
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
                    onPress={() => handleDeletePlan(plan)}
                  >
                    <Feather name="trash-2" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {plans.length < MAX_PLANS && (
            <TouchableOpacity
              style={[styles.planRow, styles.addPlanButton]}
              onPress={handleAddPlanPress}
            >
              <Text style={styles.addPlanButtonText}>+ Neuen Plan hinzufügen</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>ENTWICKLER</Text>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={handleGenerateTestData}
            style={styles.planRow}>
            <Text style={styles.planLabel}>Testdaten generieren</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClearHistory}
            style={styles.planRow}>
            <Text style={[styles.planLabel, { color: '#EF4444' }]}>Verlauf löschen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Placeholder for styles that will be moved from index.tsx
  contentContainer: { flex: 1, padding: 24, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, marginTop: 10 },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, marginTop: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  activePlanRow: { backgroundColor: '#F0FDFA' },
  planLabel: { fontSize: 16, fontWeight: '600', color: '#334155' },
  activePlanLabel: { color: '#0F766E' },
  planDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  addPlanButton: { justifyContent: 'center', backgroundColor: '#F0F9FF', borderBottomWidth: 0 },
  addPlanButtonText: { fontSize: 16, fontWeight: '600', color: '#0EA5E9', textAlign: 'center', paddingVertical: 4 },
});

export default SettingsView;