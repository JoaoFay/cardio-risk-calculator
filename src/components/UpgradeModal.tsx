import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLearnMore: () => void;
  reason: 'analyses' | 'history';
}

export default function UpgradeModal({ visible, onClose, onLearnMore, reason }: Props) {
  const message = reason === 'analyses'
    ? 'Você atingiu o limite de 3 análises gratuitas por dia.\nFaça upgrade para o LabIA Premium e tenha análises ilimitadas, histórico completo e muito mais.'
    : 'Você atingiu o limite de 5 exames salvos no plano gratuito.\nFaça upgrade para o LabIA Premium e salve exames ilimitados.';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={styles.title}>Recurso Premium</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={onLearnMore}>
            <Text style={styles.primaryButtonText}>Saiba mais sobre o Premium</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 12 },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#c0392b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelButton: { alignItems: 'center', padding: 8 },
  cancelText: { color: '#888', fontSize: 14 },
});
