import { FastingPlan } from '@/constants/fastingPlanService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';

interface PlanEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  editingPlan: FastingPlan | null;
  setEditingPlan: React.Dispatch<React.SetStateAction<FastingPlan | null>>;
  isLinked: boolean;
  setIsLinked: React.Dispatch<React.SetStateAction<boolean>>;
  isNewPlan: boolean;
  onSave: (plan: FastingPlan, isNew: boolean) => Promise<void>;
}

const baseInputStyle: ViewStyle = {
  backgroundColor: '#F8FAFC',
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 16,
};

const PlanEditModal = ({
  isVisible,
  onClose,
  editingPlan,
  setEditingPlan,
  isLinked,
  setIsLinked,
  isNewPlan,
  onSave,
}: PlanEditModalProps) => {
  if (!editingPlan) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{isNewPlan ? 'Neuen Plan erstellen' : 'Plan bearbeiten'}</Text>

          <View style={styles.inputRow}>
            <Text style={[styles.modalLabel, styles.nameTimeLabel]}>
              {`${editingPlan?.fastingHours || 0}:${editingPlan?.eatingHours || 0}`}
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Name des Plans"
                value={editingPlan.name.split(' ').slice(1).join(' ')}
                onChangeText={(customName) => {
                  const filteredName = customName.replace(/[^a-zA-Z0-9 ]/g, ''); // Erlaubt nur Buchstaben, Zahlen und Leerzeichen
                  const prefix = `${editingPlan?.fastingHours || 0}:${editingPlan?.eatingHours || 0}`; // Keep prefix
                  setEditingPlan(prev => prev ? { ...prev, name: `${prefix} ${filteredName}` } : null); // Do NOT trim here
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
                    setEditingPlan(prev => prev ? { ...prev, ...newValues } : null);
                  } else if (text === '') {
                    setEditingPlan(prev => prev ? { ...prev, fastingHours: '' } : null);
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
                    setEditingPlan(prev => prev ? { ...prev, ...newValues } : null);
                  } else if (text === '') {
                    setEditingPlan(prev => prev ? { ...prev, eatingHours: '' } : null);
                  }
                }}
              />
              <Text style={styles.modalUnitLabel}>h</Text>
            </View>
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => editingPlan && onSave(editingPlan, isNewPlan)}
            >
              <Text style={styles.saveButtonText}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ... (Modal styles moved from index.tsx)
  // Placeholder for styles that will be moved from index.tsx
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 44, marginBottom: 4 },
  modalLabel: { fontSize: 16, color: '#475569', width: 90 },
  nameTimeLabel: { fontSize: 16, fontWeight: '700', color: '#334155' },
  inputWrapper: { ...baseInputStyle, flexDirection: 'row', alignItems: 'center', flex: 1, marginBottom: 0 },
  textInput: { flex: 1, height: '100%', fontSize: 16 },
  unitSpacer: { width: 30, height: '100%' },
  inputHint: { fontSize: 12, color: '#94A3B8', alignSelf: 'flex-end', marginBottom: 12 },
  modalUnitLabel: { fontSize: 16, color: '#475569', marginLeft: 10 },
  linkButton: { padding: 8, alignSelf: 'center', marginVertical: 4 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  saveButton: { backgroundColor: '#0F172A' },
  saveButtonText: { color: 'white', fontWeight: '600' },
  cancelButton: { backgroundColor: '#F1F5F9' },
  cancelButtonText: { color: '#475569', fontWeight: '600' },
});

export default PlanEditModal;