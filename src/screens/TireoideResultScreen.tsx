import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TireoideResult, TireoideInput, TireoideCategory, SavedExam } from '../types';
import SaveExamModal from '../components/SaveExamModal';

interface Props {
  result: TireoideResult;
  input: TireoideInput;
  onBack: () => void;
  onGoToPremium: () => void;
  onHistoryLimitReached: () => void;
}

const CATEGORY_LABEL: Record<TireoideCategory, string> = {
  hipotireoidismo: 'Sugestivo de Hipotireoidismo',
  normal: 'Normal',
  hipertireoidismo: 'Sugestivo de Hipertireoidismo',
  indeterminado: 'Indeterminado',
};

const CATEGORY_COLOR: Record<TireoideCategory, string> = {
  hipotireoidismo: '#2980b9',
  normal: '#27ae60',
  hipertireoidismo: '#c0392b',
  indeterminado: '#7f8c8d',
};

export default function TireoideResultScreen({ result, input, onBack, onGoToPremium, onHistoryLimitReached }: Props) {
  const [savedExam, setSavedExam] = useState<SavedExam | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resultado — Tireoide</Text>

      {/* Valores medidos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🦋 Valores Medidos</Text>
        <Row label="TSH" value={`${input.tsh} mIU/L`} last={input.t4livre == null && input.t3total == null && input.t4total == null && input.antiTPO == null && input.antiTg == null} />
        {input.t4livre != null && (
          <Row label="T4 Livre" value={`${input.t4livre} ng/dL`} last={input.t3total == null && input.t4total == null && input.antiTPO == null && input.antiTg == null} />
        )}
        {input.t3total != null && (
          <Row label="T3 Total" value={`${input.t3total} ng/dL`} last={input.t4total == null && input.antiTPO == null && input.antiTg == null} />
        )}
        {input.t4total != null && (
          <Row label="T4 Total" value={`${input.t4total} μg/dL`} last={input.antiTPO == null && input.antiTg == null} />
        )}
        {input.antiTPO != null && (
          <Row label="Anti-TPO" value={`${input.antiTPO} IU/mL`} last={input.antiTg == null} />
        )}
        {input.antiTg != null && (
          <Row label="Anti-Tg" value={`${input.antiTg} IU/mL`} last />
        )}
      </View>

      {/* Classificação TSH */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Classificação do TSH</Text>
        <View style={styles.classRow}>
          <View style={styles.classLeft}>
            <Text style={styles.classLabel}>TSH</Text>
            <Text style={styles.classRef}>Hipo &gt;4,0 · Normal 0,4–4,0 · Hiper &lt;0,4 mIU/L</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: CATEGORY_COLOR[result.tshCategory] }]}>
            <Text style={styles.badgeText}>{CATEGORY_LABEL[result.tshCategory]}</Text>
          </View>
        </View>
      </View>

      {/* AI */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>🤖 Interpretação por IA</Text>
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
        type="tireoide"
        input={input}
        result={result}
      />
    </ScrollView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.dataRow, !last && styles.rowBorder]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const ACCENT = '#1abc9c';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: ACCENT, marginBottom: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: ACCENT, padding: 16, paddingBottom: 8 },

  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dataLabel: { fontSize: 14, color: '#555' },
  dataValue: { fontSize: 15, fontWeight: '600', color: '#222' },

  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  classLeft: { flex: 1, marginRight: 12 },
  classLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  classRef: { fontSize: 11, color: '#aaa', marginTop: 2 },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

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
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: ACCENT, marginBottom: 12 },
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
    borderColor: ACCENT,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: { color: ACCENT, fontSize: 15, fontWeight: '600' },
  savedBadge: {
    backgroundColor: '#eafaf1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  savedText: { color: '#27ae60', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: ACCENT,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
