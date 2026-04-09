import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { saveExam, getAllExams } from '../storage/examStorage';
import { isPremium } from '../storage/premiumStorage';
import {
  ExamType,
  PatientInput, HemogramaInput, LipidogramaInput, MetabolicInput,
  RiskResult, HemogramaResult, LipidogramaResult, MetabolicResult,
  SavedExam,
} from '../types';
import { extractMarkers } from '../utils/extractMarkers';

function todayDisplay(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function displayToISO(display: string): string | null {
  const parts = display.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm}-${dd}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (exam: SavedExam) => void;
  onUpgradeNeeded: () => void;
  type: ExamType;
  input: PatientInput | HemogramaInput | LipidogramaInput | MetabolicInput;
  result: RiskResult | HemogramaResult | LipidogramaResult | MetabolicResult;
}

export default function SaveExamModal({ visible, onClose, onSaved, onUpgradeNeeded, type, input, result }: Props) {
  const [dateDisplay, setDateDisplay] = useState(todayDisplay());
  const [labName, setLabName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const examDate = displayToISO(dateDisplay.trim());
    if (!examDate) {
      Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }

    const premium = await isPremium();
    if (!premium) {
      const all = await getAllExams();
      if (all.length >= 5) {
        onClose();
        onUpgradeNeeded();
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await saveExam({
        type,
        examDate,
        examDateDisplay: dateDisplay.trim(),
        labName: labName.trim(),
        input,
        result,
        markers: extractMarkers(type, input, result),
      });
      onSaved(saved);
      setLabName('');
      setDateDisplay(todayDisplay());
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o exame.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Salvar exame</Text>

          <Text style={styles.label}>Data do exame</Text>
          <TextInput
            style={styles.input}
            value={dateDisplay}
            onChangeText={setDateDisplay}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
          />

          <Text style={styles.label}>Laboratório (opcional)</Text>
          <TextInput
            style={styles.input}
            value={labName}
            onChangeText={setLabName}
            placeholder="Ex: Lab São Lucas"
            maxLength={60}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 20 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#2c3e50',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelButton: { alignItems: 'center', marginTop: 12, padding: 8 },
  cancelText: { color: '#888', fontSize: 14 },
});
