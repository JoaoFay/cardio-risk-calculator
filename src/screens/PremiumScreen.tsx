import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';

interface Props {
  onBack: () => void;
}

const BENEFITS = [
  'Análises de IA ilimitadas',
  'Histórico ilimitado de exames',
  'Gráficos de evolução completos',
  'Análise comparativa entre exames',
  'Exportação de relatório em PDF',
  'Lembretes de check-up',
];

export default function PremiumScreen({ onBack }: Props) {
  async function handleNotify() {
    const url = 'mailto:labia.appsaude@gmail.com?subject=Quero%20o%20LabIA%20Premium';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erro', 'Não foi possível abrir o app de e-mail.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Voltar" accessibilityRole="button">
        <Text style={styles.backText}>‹ Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.starIcon}>⭐</Text>
        <Text style={styles.title}>LabIA Premium</Text>
        <Text style={styles.subtitle}>Em breve</Text>
      </View>

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>O que você terá:</Text>
        {BENEFITS.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.checkMark}>✅</Text>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.notifyButton} onPress={handleNotify}>
        <Text style={styles.notifyButtonText}>Avise-me quando lançar</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        O Premium está em desenvolvimento.{'\n'}Obrigado por usar o LabIA!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 48 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#f39c12', fontWeight: '500' },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 28 },
  starIcon: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#f39c12', marginBottom: 4 },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  benefitsTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkMark: { fontSize: 18, marginRight: 12 },
  benefitText: { fontSize: 15, color: '#444' },
  notifyButton: {
    backgroundColor: '#f39c12',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  notifyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
  },
});
