import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SavedExam, RiskResult } from '../types';

interface Props {
  exam: SavedExam;
  onBack: () => void;
}

const MODULE_CONFIG = {
  cardio: { label: 'Risco Cardiovascular', color: '#c0392b' },
  hemograma: { label: 'Hemograma Completo', color: '#2980b9' },
  lipidograma: { label: 'Lipidograma', color: '#8e44ad' },
};

function renderMarkers(exam: SavedExam) {
  const m = exam.markers;
  if (exam.type === 'cardio') {
    const r = exam.result as RiskResult;
    return [
      { label: 'Framingham (10 anos)', value: `${m.framinghamRisk}%`, sub: r.framingham.riskCategory },
      { label: 'ASCVD (10 anos)', value: `${m.ascvdRisk}%`, sub: r.ascvd.riskCategory },
      { label: 'Colesterol Total', value: `${m.totalCholesterol} mg/dL` },
      { label: 'LDL', value: `${m.ldl} mg/dL` },
      { label: 'HDL', value: `${m.hdl} mg/dL` },
    ];
  } else if (exam.type === 'hemograma') {
    const rows = [
      { label: 'Hemoglobina', value: `${m.hemoglobina} g/dL` },
      { label: 'Hematócrito', value: `${m.hematocrito}%` },
      { label: 'Leucócitos', value: `${m.leucocitos} /mm³` },
    ];
    if (m.plaquetas) rows.push({ label: 'Plaquetas', value: `${m.plaquetas} /mm³` });
    return rows;
  } else {
    return [
      { label: 'Colesterol Total', value: `${m.totalCholesterol} mg/dL` },
      { label: 'LDL', value: `${m.ldl} mg/dL` },
      { label: 'HDL', value: `${m.hdl} mg/dL` },
      { label: 'Triglicerídeos', value: `${m.triglycerides} mg/dL` },
      { label: 'Castelli I (CT/HDL)', value: `${m.castelliI}` },
    ];
  }
}

const riskLabels: Record<string, string> = {
  low: 'Baixo', borderline: 'Limítrofe', intermediate: 'Intermediário', high: 'Alto',
};

export default function HistoryDetailScreen({ exam, onBack }: Props) {
  const cfg = MODULE_CONFIG[exam.type];
  const markers = renderMarkers(exam);
  const aiInterpretation = (exam.result as any).aiInterpretation as string;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={[styles.backText, { color: cfg.color }]}>‹ Voltar ao Histórico</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cfg.color }]}>{cfg.label}</Text>
      <Text style={styles.meta}>
        {exam.examDateDisplay}{exam.labName ? `  ·  ${exam.labName}` : ''}
      </Text>

      {/* Markers */}
      <View style={styles.markersCard}>
        {markers.map((row, i) => (
          <View key={i} style={[styles.markerRow, i < markers.length - 1 && styles.markerRowBorder]}>
            <Text style={styles.markerLabel}>{row.label}</Text>
            <View style={styles.markerRight}>
              <Text style={styles.markerValue}>{row.value}</Text>
              {'sub' in row && row.sub ? (
                <Text style={styles.markerSub}>{riskLabels[row.sub] ?? row.sub}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* AI interpretation */}
      <View style={styles.aiCard}>
        <Text style={[styles.aiTitle, { color: cfg.color }]}>Interpretação por IA</Text>
        <Text style={styles.aiText}>{aiInterpretation}</Text>
      </View>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimer}>
          ⚠️ Esta ferramenta tem caráter exclusivamente educacional e não substitui avaliação médica presencial.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 20 },

  markersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  markerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  markerRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  markerLabel: { fontSize: 14, color: '#555' },
  markerRight: { alignItems: 'flex-end' },
  markerValue: { fontSize: 15, fontWeight: '600', color: '#222' },
  markerSub: { fontSize: 11, color: '#888', marginTop: 2 },

  aiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  aiTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  aiText: { fontSize: 14, color: '#444', lineHeight: 22 },

  disclaimerBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 6,
    padding: 12,
  },
  disclaimer: { fontSize: 12, color: '#7d5a00', lineHeight: 18 },
});
