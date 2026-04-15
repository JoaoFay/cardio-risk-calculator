import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SavedExam, RiskResult } from '../types';
import { getAIInterpretation } from '../services/openai';
import { getHemogramaInterpretation } from '../services/hemograma';
import { getLipidogramaInterpretation } from '../services/lipidograma';
import { getMetabolicoInterpretation } from '../services/metabolico';
import { getTireoideInterpretation } from '../services/tireoide';
import { getTodayCount } from '../storage/usageStorage';
import { isPremium } from '../storage/premiumStorage';
import { updateExam } from '../storage/examStorage';

interface Props {
  exam: SavedExam;
  onBack: () => void;
  onEdit: (exam: SavedExam) => void;
  showStaleWarning?: boolean;
  onRefresh?: (exam: SavedExam) => void;
  onClearStale?: (examId: string) => void;
}

const MODULE_CONFIG = {
  cardio:      { label: 'Risco Cardiovascular', color: '#c0392b' },
  hemograma:   { label: 'Hemograma Completo',   color: '#2980b9' },
  lipidograma: { label: 'Lipidograma',           color: '#8e44ad' },
  metabolico:  { label: 'Perfil Metabólico',     color: '#16a085' },
  tireoide:    { label: 'Tireoide',              color: '#1abc9c' },
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

export default function HistoryDetailScreen({ exam, onBack, onEdit, showStaleWarning = false, onRefresh, onClearStale }: Props) {
  const cfg = MODULE_CONFIG[exam.type];
  const markers = renderMarkers(exam);
  const aiInterpretation = (exam.result as any).aiInterpretation as string;
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefetch() {
    setRefreshing(true);
    setError(null);
    try {
      const premium = await isPremium();
      if (!premium) {
        const count = await getTodayCount();
        if (count >= 3) {
          setError('Limite diário atingido. Atualize para Premium para refazer análises ilimitadas.');
          setRefreshing(false);
          return;
        }
      }
      let newAI = '';
      if (exam.type === 'cardio') {
        const input = exam.input as any;
        const result = exam.result as RiskResult;
        newAI = await getAIInterpretation(input, result);
      } else if (exam.type === 'hemograma') {
        newAI = await getHemogramaInterpretation(exam.input as any);
      } else if (exam.type === 'lipidograma') {
        newAI = await getLipidogramaInterpretation(exam.input as any, exam.result as any);
      } else if (exam.type === 'metabolico') {
        newAI = await getMetabolicoInterpretation(exam.input as any, exam.result as any);
      } else if (exam.type === 'tireoide') {
        newAI = await getTireoideInterpretation(exam.input as any, exam.result as any);
      }
      const updatedResult = { ...exam.result, aiInterpretation: newAI } as SavedExam['result'];
      const updatedExam = { ...exam, result: updatedResult };
      await updateExam(exam.id, { result: updatedResult });
      if (onRefresh) {
        onRefresh(updatedExam);
      }
      if (onClearStale) {
        onClearStale(exam.id);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao refazer análise');
    } finally {
      setRefreshing(false);
    }
  }

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
      {showStaleWarning && (
        <>
          <View style={styles.staleWarning}>
            <Text 
              style={styles.staleWarningText}
              accessibilityLabel="Aviso: interpretação pode estar desatualizada"
              accessibilityRole="text"
            >⚠️ Esta interpretação foi gerada antes da sua edição e pode estar desatualizada.</Text>
          </View>
          <TouchableOpacity
            style={[styles.refetchButton, { borderColor: cfg.color }]}
            onPress={handleRefetch}
            disabled={refreshing}
            accessibilityLabel="Refazer interpretação da IA"
            accessibilityRole="button"
          >
            {refreshing
              ? <ActivityIndicator size="small" color={cfg.color} />
              : <Text style={[styles.refetchButtonText, { color: cfg.color }]}>🔄 Refazer interpretação da IA</Text>
            }
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </>
      )}
      <View style={styles.aiCard}>
        <Text style={[styles.aiTitle, { color: cfg.color }]}>Interpretação por IA</Text>
        <Text style={styles.aiText}>{aiInterpretation}</Text>
      </View>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimer}>
          ⚠️ Esta ferramenta tem caráter exclusivamente educacional e não substitui avaliação médica presencial.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => onEdit(exam)}
        accessibilityLabel="Editar exame"
        accessibilityRole="button"
      >
        <Text style={[styles.editButtonText, { color: cfg.color }]}>✏️  Editar exame</Text>
      </TouchableOpacity>
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
  staleWarning: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  staleWarningText: { fontSize: 13, color: '#856404', lineHeight: 18 },
  editButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  editButtonText: { fontSize: 15, fontWeight: '600' },
  refetchButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  refetchButtonText: { fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 12, color: '#c0392b', marginTop: 4, textAlign: 'center' },
});
