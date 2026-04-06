import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { RiskResult } from '../types';

const categoryColors: Record<string, string> = {
  low: '#27ae60',
  borderline: '#f39c12',
  intermediate: '#e67e22',
  high: '#c0392b',
};

const categoryLabels: Record<string, string> = {
  low: 'Baixo',
  borderline: 'Limítrofe',
  intermediate: 'Intermediário',
  high: 'Alto',
};

interface Props {
  result: RiskResult;
  onBack: () => void;
}

export default function ResultScreen({ result, onBack }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Resultado</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Framingham (10 anos)</Text>
        <Text style={styles.riskValue}>{result.framingham.tenYearRisk}%</Text>
        <View style={[styles.badge, { backgroundColor: categoryColors[result.framingham.riskCategory] }]}>
          <Text style={styles.badgeText}>{categoryLabels[result.framingham.riskCategory]}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ACC/AHA ASCVD (10 anos)</Text>
        <Text style={styles.riskValue}>{result.ascvd.tenYearRisk}%</Text>
        <View style={[styles.badge, { backgroundColor: categoryColors[result.ascvd.riskCategory] }]}>
          <Text style={styles.badgeText}>{categoryLabels[result.ascvd.riskCategory]}</Text>
        </View>
      </View>

      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>Interpretação por IA</Text>
        <Text style={styles.aiText}>{result.aiInterpretation}</Text>
        <Text style={styles.disclaimer}>
          Esta ferramenta é educacional e não substitui avaliação médica presencial.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Nova Consulta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#c0392b', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  riskValue: { fontSize: 48, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  badge: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
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
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  aiText: { fontSize: 14, color: '#444', lineHeight: 22 },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#c0392b',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
