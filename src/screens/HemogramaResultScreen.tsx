import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HemogramaResult, HemogramaInput, SavedExam } from '../types';
import SaveExamModal from '../components/SaveExamModal';

interface Props {
  result: HemogramaResult;
  input: HemogramaInput;
  onBack: () => void;
  onGoToPremium: () => void;
  onHistoryLimitReached: () => void;
}

export default function HemogramaResultScreen({ result, input, onBack, onGoToPremium, onHistoryLimitReached }: Props) {
  const [savedExam, setSavedExam] = useState<SavedExam | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resultado — Hemograma</Text>

      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>🩸 Interpretação por IA</Text>
        <Text style={styles.aiText}>{result.aiInterpretation}</Text>
      </View>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimer}>
          ⚠️ Esta ferramenta tem caráter exclusivamente educacional e não substitui avaliação médica presencial. Consulte um profissional de saúde para diagnóstico e tratamento.
        </Text>
      </View>

      {savedExam ? (
        <View style={styles.savedBadge}>
          <Text style={styles.savedText}>✓ Exame salvo em {savedExam.examDateDisplay}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.saveButtonText}>Salvar este exame</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Nova Consulta</Text>
      </TouchableOpacity>

      <SaveExamModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={(exam) => { setSavedExam(exam); setModalVisible(false); }}
        onUpgradeNeeded={onHistoryLimitReached}
        type="hemograma"
        input={input}
        result={result}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2980b9', marginBottom: 20 },
  aiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#2980b9', marginBottom: 12 },
  aiText: { fontSize: 14, color: '#444', lineHeight: 22 },
  disclaimerBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  disclaimer: { fontSize: 12, color: '#7d5a00', lineHeight: 18 },
  saveButton: {
    borderWidth: 2,
    borderColor: '#2980b9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: { color: '#2980b9', fontSize: 15, fontWeight: '600' },
  savedBadge: {
    backgroundColor: '#eafaf1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  savedText: { color: '#27ae60', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: '#2980b9',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
