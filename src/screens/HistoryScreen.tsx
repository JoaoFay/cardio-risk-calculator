import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SavedExam } from '../types';
import { getAllExams, deleteExam } from '../storage/examStorage';
import { isPremium } from '../storage/premiumStorage';
import { exportExamsPdf } from '../services/pdfExport';
import MarkerChart from '../components/MarkerChart';

interface Props {
  onViewDetail: (exam: SavedExam) => void;
  onEdit: (exam: SavedExam) => void;
  onBack: () => void;
  onGoToPremium: () => void;
}

const MODULE_CONFIG = {
  cardio: {
    label: 'Risco Cardiovascular',
    color: '#c0392b',
    chartMarker: 'framinghamRisk' as const,
    chartLabel: 'Framingham 10 anos',
    chartUnit: '%',
  },
  hemograma: {
    label: 'Hemograma Completo',
    color: '#2980b9',
    chartMarker: 'hemoglobina' as const,
    chartLabel: 'Hemoglobina',
    chartUnit: 'g/dL',
  },
  lipidograma: {
    label: 'Lipidograma',
    color: '#8e44ad',
    chartMarker: 'ldl' as const,
    chartLabel: 'LDL',
    chartUnit: 'mg/dL',
  },
  metabolico: {
    label: 'Perfil Metabólico',
    color: '#16a085',
    chartMarker: 'glicemiaJejum' as const,
    chartLabel: 'Glicemia Jejum',
    chartUnit: 'mg/dL',
  },
};

function formatMarkersSummary(exam: SavedExam): string {
  const m = exam.markers;
  if (exam.type === 'cardio') {
    return `Framingham: ${m.framinghamRisk}% · LDL: ${m.ldl} · HDL: ${m.hdl}`;
  } else if (exam.type === 'hemograma') {
    const parts = [`Hb: ${m.hemoglobina}`, `Ht: ${m.hematocrito}%`, `Leuc: ${m.leucocitos}`];
    if (m.plaquetas) parts.push(`Plaq: ${m.plaquetas}`);
    return parts.join(' · ');
  } else if (exam.type === 'lipidograma') {
    return `CT: ${m.totalCholesterol} · LDL: ${m.ldl} · HDL: ${m.hdl} · TG: ${m.triglycerides}`;
  } else {
    const parts = [`Glicemia: ${m.glicemiaJejum} mg/dL`];
    if (m.hbA1c != null) parts.push(`HbA1c: ${m.hbA1c}%`);
    if (m.homaIR != null) parts.push(`HOMA-IR: ${m.homaIR}`);
    return parts.join(' · ');
  }
}

export default function HistoryScreen({ onViewDetail, onEdit, onBack, onGoToPremium }: Props) {
  const [exams, setExams] = useState<SavedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllExams();
    setExams(all);
    setLoading(false);
  }, []);

  async function handleExportPdf() {
    const premium = await isPremium();
    if (!premium) {
      onGoToPremium();
      return;
    }
    if (exams.length === 0) {
      Alert.alert('Sem exames', 'Não há exames salvos para exportar.');
      return;
    }
    try {
      setExporting(true);
      await exportExamsPdf(exams);
    } catch (err: any) {
      Alert.alert('Erro ao exportar', err?.message ?? 'Tente novamente.');
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => { load(); }, [load]);

  function handleDelete(exam: SavedExam) {
    Alert.alert(
      'Excluir exame',
      `Excluir o exame de ${exam.examDateDisplay}${exam.labName ? ` (${exam.labName})` : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteExam(exam.id);
            load();
          },
        },
      ],
    );
  }

  const groups = {
    cardio: exams.filter(e => e.type === 'cardio'),
    hemograma: exams.filter(e => e.type === 'hemograma'),
    lipidograma: exams.filter(e => e.type === 'lipidograma'),
    metabolico: exams.filter(e => e.type === 'metabolico'),
  } as const;

  const isEmpty = exams.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Voltar</Text>
      </TouchableOpacity>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Meu Histórico</Text>
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExportPdf}
          disabled={exporting}
          accessibilityLabel="Exportar PDF"
          accessibilityRole="button"
        >
          {exporting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.exportButtonText}>⭐ PDF</Text>
          }
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#555" style={{ marginTop: 40 }} />}

      {!loading && isEmpty && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>Nenhum exame salvo</Text>
          <Text style={styles.emptyText}>
            Após calcular ou interpretar um exame, toque em "Salvar este exame" para que ele apareça aqui.
          </Text>
        </View>
      )}

      {!loading && (Object.keys(groups) as (keyof typeof groups)[]).map(type => {
        const list = groups[type];
        if (list.length === 0) return null;
        const cfg = MODULE_CONFIG[type];

        const chartData = [...list]
          .sort((a, b) => a.examDate.localeCompare(b.examDate))
          .filter(e => e.markers[cfg.chartMarker] != null)
          .map(e => ({ date: e.examDateDisplay, value: e.markers[cfg.chartMarker] }));

        return (
          <View key={type} style={styles.group}>
            <View style={[styles.groupHeader, { borderLeftColor: cfg.color }]}>
              <Text style={[styles.groupTitle, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={styles.groupCount}>{list.length} registro{list.length > 1 ? 's' : ''}</Text>
            </View>

            {chartData.length >= 2 && (
              <MarkerChart
                data={chartData}
                label={cfg.chartLabel}
                color={cfg.color}
                unit={cfg.chartUnit}
              />
            )}

            {list.map(exam => (
              <TouchableOpacity
                key={exam.id}
                style={styles.examItem}
                onPress={() => onViewDetail(exam)}
                activeOpacity={0.7}
              >
                <View style={styles.examInfo}>
                  <Text style={styles.examDate}>{exam.examDateDisplay}</Text>
                  {exam.labName ? <Text style={styles.examLab}>{exam.labName}</Text> : null}
                  <Text style={styles.examMarkers}>{formatMarkersSummary(exam)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onEdit(exam)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Editar exame de ${exam.type} de ${exam.examDateDisplay}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(exam)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteIcon}>🗑</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#555', fontWeight: '500' },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50' },
  exportButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  exportButtonDisabled: { opacity: 0.6 },
  exportButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupTitle: { fontSize: 15, fontWeight: 'bold' },
  groupCount: { fontSize: 12, color: '#aaa' },

  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  examInfo: { flex: 1 },
  examDate: { fontSize: 14, fontWeight: '600', color: '#222' },
  examLab: { fontSize: 12, color: '#888', marginTop: 2 },
  examMarkers: { fontSize: 11, color: '#777', marginTop: 4 },
  editButton: { padding: 4, marginRight: 12 },
  editIcon: { fontSize: 18, color: '#2980b9' },
  deleteButton: { padding: 4 },
  deleteIcon: { fontSize: 18 },
});
