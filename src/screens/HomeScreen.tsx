import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Props {
  onSelectCardio: () => void;
  onSelectHemograma: () => void;
  onSelectLipidograma: () => void;
  onSelectMetabolico: () => void;
  onSelectHistory: () => void;
}

export default function HomeScreen({ onSelectCardio, onSelectHemograma, onSelectLipidograma, onSelectMetabolico, onSelectHistory }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MedCalc</Text>
      <Text style={styles.subtitle}>Selecione um módulo para começar</Text>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Ferramenta educacional. Não substitui avaliação médica presencial.
        </Text>
      </View>

      <TouchableOpacity style={[styles.card, styles.cardCardio]} onPress={onSelectCardio}>
        <Text style={styles.cardIcon}>❤️</Text>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>Risco Cardiovascular</Text>
          <Text style={styles.cardDescription}>
            Calcule seu risco de evento cardíaco em 10 anos com as calculadoras Framingham e ACC/AHA ASCVD.
          </Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardHemograma]} onPress={onSelectHemograma}>
        <Text style={styles.cardIcon}>🩸</Text>
        <View style={styles.cardTextContainer}>
          <Text style={[styles.cardTitle, styles.cardTitleHemograma]}>Hemograma Completo</Text>
          <Text style={styles.cardDescription}>
            Interprete seu hemograma com análise da série vermelha, branca e plaquetas por IA.
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.cardArrowHemograma]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardLipid]} onPress={onSelectLipidograma}>
        <Text style={styles.cardIcon}>🧬</Text>
        <View style={styles.cardTextContainer}>
          <Text style={[styles.cardTitle, styles.cardTitleLipid]}>Lipidograma</Text>
          <Text style={styles.cardDescription}>
            Interprete seu perfil lipídico com índices de Castelli I/II e TG/HDL, com correlação ao risco cardiovascular.
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.cardArrowLipid]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardMetabolico]} onPress={onSelectMetabolico}>
        <Text style={styles.cardIcon}>🩺</Text>
        <View style={styles.cardTextContainer}>
          <Text style={[styles.cardTitle, styles.cardTitleMetabolico]}>Perfil Metabólico</Text>
          <Text style={styles.cardDescription}>
            Avalie glicemia, HbA1c e resistência insulínica com classificação SBD e interpretação por IA.
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.cardArrowMetabolico]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardHistory]} onPress={onSelectHistory}>
        <Text style={styles.cardIcon}>📋</Text>
        <View style={styles.cardTextContainer}>
          <Text style={[styles.cardTitle, styles.cardTitleHistory]}>Meu Histórico</Text>
          <Text style={styles.cardDescription}>
            Visualize exames salvos, evolução de marcadores e compare resultados ao longo do tempo.
          </Text>
        </View>
        <Text style={[styles.cardArrow, styles.cardArrowHistory]}>›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24 },
  disclaimerBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 6,
    padding: 12,
    marginBottom: 32,
  },
  disclaimerText: { fontSize: 13, color: '#7d5a00' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCardio: { borderLeftColor: '#c0392b' },
  cardHemograma: { borderLeftColor: '#2980b9' },
  cardLipid: { borderLeftColor: '#8e44ad' },
  cardMetabolico: { borderLeftColor: '#16a085' },
  cardHistory: { borderLeftColor: '#7f8c8d' },
  cardIcon: { fontSize: 32, marginRight: 16 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#c0392b', marginBottom: 4 },
  cardTitleHemograma: { color: '#2980b9' },
  cardDescription: { fontSize: 13, color: '#555', lineHeight: 18 },
  cardArrow: { fontSize: 28, color: '#c0392b', marginLeft: 8 },
  cardArrowHemograma: { color: '#2980b9' },
  cardTitleLipid: { color: '#8e44ad' },
  cardArrowLipid: { color: '#8e44ad' },
  cardTitleMetabolico: { color: '#16a085' },
  cardArrowMetabolico: { color: '#16a085' },
  cardTitleHistory: { color: '#7f8c8d' },
  cardArrowHistory: { color: '#7f8c8d' },
});
