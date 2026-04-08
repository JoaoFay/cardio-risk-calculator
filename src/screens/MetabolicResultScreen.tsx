import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MetabolicResult, MetabolicInput, GlicemiaCategory, SavedExam } from '../types';
import SaveExamModal from '../components/SaveExamModal';

interface Props {
  result: MetabolicResult;
  input: MetabolicInput;
  onBack: () => void;
}

const CATEGORY_LABEL: Record<GlicemiaCategory, string> = {
  normal: 'Normal',
  prediabetes: 'Pré-diabetes',
  diabetes: 'Sugestivo de Diabetes',
};

const CATEGORY_COLOR: Record<GlicemiaCategory, string> = {
  normal: '#27ae60',
  prediabetes: '#e67e22',
  diabetes: '#c0392b',
};

function getHomaColor(value: number): string {
  if (value <= 2.0) return '#27ae60';
  if (value <= 4.0) return '#e67e22';
  return '#c0392b';
}

function getHomaLabel(value: number): string {
  if (value <= 2.0) return 'Normal';
  if (value <= 4.0) return 'Resistência leve';
  return 'Resistência significativa';
}

export default function MetabolicResultScreen({ result, input, onBack }: Props) {
  const [savedExam, setSavedExam] = useState<SavedExam | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resultado — Perfil Metabólico</Text>

      {/* Valores medidos */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🩺 Valores Medidos</Text>
        <Row label="Glicemia em Jejum" value={`${input.glicemiaJejum} mg/dL`} last={input.glicemiaPosP == null && input.hbA1c == null && input.insulinaJejum == null} />
        {input.glicemiaPosP != null && (
          <Row label="Glicemia Pós-Prandial (2h)" value={`${input.glicemiaPosP} mg/dL`} last={input.hbA1c == null && input.insulinaJejum == null} />
        )}
        {input.hbA1c != null && (
          <Row label="HbA1c" value={`${input.hbA1c}%`} last={input.insulinaJejum == null} />
        )}
        {input.insulinaJejum != null && (
          <Row label="Insulina em Jejum" value={`${input.insulinaJejum} μUI/mL`} last />
        )}
      </View>

      {/* Classificação SBD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Classificação SBD</Text>
        <View style={[styles.classRow, result.hbA1cCategory == null && styles.rowBorder === undefined ? {} : styles.rowBorder]}>
          <View style={styles.classLeft}>
            <Text style={styles.classLabel}>Glicemia em Jejum</Text>
            <Text style={styles.classRef}>Normal &lt;100 · Pré 100–125 · DM ≥126 mg/dL</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: CATEGORY_COLOR[result.glicemiaCategory] }]}>
            <Text style={styles.badgeText}>{CATEGORY_LABEL[result.glicemiaCategory]}</Text>
          </View>
        </View>
        {result.hbA1cCategory != null && (
          <View style={styles.classRow}>
            <View style={styles.classLeft}>
              <Text style={styles.classLabel}>HbA1c</Text>
              <Text style={styles.classRef}>Normal &lt;5,7% · Pré 5,7–6,4% · DM ≥6,5%</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: CATEGORY_COLOR[result.hbA1cCategory] }]}>
              <Text style={styles.badgeText}>{CATEGORY_LABEL[result.hbA1cCategory]}</Text>
            </View>
          </View>
        )}
      </View>

      {/* HOMA-IR */}
      {result.homaIR != null && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ HOMA-IR — Resistência Insulínica</Text>
          <View style={styles.homaRow}>
            <View style={styles.homaLeft}>
              <Text style={[styles.homaValue, { color: getHomaColor(result.homaIR) }]}>
                {result.homaIR}
              </Text>
              <Text style={[styles.homaStatus, { color: getHomaColor(result.homaIR) }]}>
                {getHomaLabel(result.homaIR)}
              </Text>
            </View>
            <Text style={styles.homaRef}>ref: ≤2,0 normal{'\n'}2,0–4,0 leve{'\n'}&gt;4,0 significativa</Text>
          </View>
        </View>
      )}

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
        type="metabolico"
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#16a085', marginBottom: 20 },

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
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#16a085', padding: 16, paddingBottom: 8 },

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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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

  homaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  homaLeft: { flex: 1 },
  homaValue: { fontSize: 36, fontWeight: 'bold' },
  homaStatus: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  homaRef: { fontSize: 11, color: '#aaa', textAlign: 'right', lineHeight: 17 },

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
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#16a085', marginBottom: 12 },
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
    borderColor: '#16a085',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: { color: '#16a085', fontSize: 15, fontWeight: '600' },
  savedBadge: {
    backgroundColor: '#eafaf1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  savedText: { color: '#27ae60', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: '#16a085',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
