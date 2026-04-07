import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LipidogramaResult, LipidogramaInput, SavedExam } from '../types';
import SaveExamModal from '../components/SaveExamModal';

interface Props {
  result: LipidogramaResult;
  input: LipidogramaInput;
  onBack: () => void;
}

interface IndexRow {
  label: string;
  value: number;
  refs: { good: number; risk: number };
  refLabel: string;
}

function getIndexColor(value: number, refs: { good: number; risk: number }): string {
  if (value <= refs.good) return '#27ae60';
  if (value <= refs.risk) return '#e67e22';
  return '#c0392b';
}

const INDEX_ROWS: IndexRow[] = [
  {
    label: 'Castelli I (CT/HDL)',
    value: 0,
    refs: { good: 4.5, risk: 5.5 },
    refLabel: 'ótimo < 4,5 ♂ / < 4,0 ♀',
  },
  {
    label: 'Castelli II (LDL/HDL)',
    value: 0,
    refs: { good: 3.0, risk: 3.5 },
    refLabel: 'ótimo < 3,0 ♂ / < 2,5 ♀',
  },
  {
    label: 'TG/HDL',
    value: 0,
    refs: { good: 2.0, risk: 3.0 },
    refLabel: 'ótimo < 2,0 ♂ / < 1,5 ♀',
  },
];

export default function LipidogramaResultScreen({ result, input, onBack }: Props) {
  const [savedExam, setSavedExam] = useState<SavedExam | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const indices = [
    { ...INDEX_ROWS[0], value: result.castelliI },
    { ...INDEX_ROWS[1], value: result.castelliII },
    { ...INDEX_ROWS[2], value: result.tgHdl },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resultado — Lipidograma</Text>

      {/* Valores medidos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧬 Valores Medidos</Text>
        <Row label="Colesterol Total" value={`${input.totalCholesterol} mg/dL`} />
        <Row label="LDL" value={`${input.ldl} mg/dL`} />
        <Row label="HDL" value={`${input.hdl} mg/dL`} />
        <Row label="Triglicerídeos" value={`${input.triglycerides} mg/dL`} last={input.vldl == null} />
        {input.vldl != null && <Row label="VLDL" value={`${input.vldl} mg/dL`} last />}
      </View>

      {/* Índices calculados */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Índices Calculados</Text>
        {indices.map((idx, i) => {
          const color = getIndexColor(idx.value, idx.refs);
          return (
            <View key={idx.label} style={[styles.indexRow, i < indices.length - 1 && styles.rowBorder]}>
              <View style={styles.indexLeft}>
                <Text style={styles.indexLabel}>{idx.label}</Text>
                <Text style={styles.indexRef}>{idx.refLabel}</Text>
              </View>
              <Text style={[styles.indexValue, { color }]}>{idx.value}</Text>
            </View>
          );
        })}
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
        type="lipidograma"
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8e44ad', marginBottom: 20 },

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
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#8e44ad', padding: 16, paddingBottom: 8 },

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

  indexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  indexLeft: { flex: 1 },
  indexLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  indexRef: { fontSize: 11, color: '#aaa', marginTop: 2 },
  indexValue: { fontSize: 22, fontWeight: 'bold', marginLeft: 12 },

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
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#8e44ad', marginBottom: 12 },
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
    borderColor: '#8e44ad',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: { color: '#8e44ad', fontSize: 15, fontWeight: '600' },
  savedBadge: {
    backgroundColor: '#eafaf1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  savedText: { color: '#27ae60', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: '#8e44ad',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
