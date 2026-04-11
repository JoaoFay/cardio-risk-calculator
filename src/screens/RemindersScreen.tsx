import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ExamType } from '../types';
import { ReminderConfig, ReminderFrequency, MODULE_LABELS, getAllReminders, updateReminder } from '../storage/reminderStorage';
import { scheduleModuleReminder, cancelModuleReminder, checkNotificationPermissions, requestNotificationPermissions } from '../services/notificationService';

interface Props {
  onBack: () => void;
}

const MODULE_ICONS: Record<ExamType, string> = {
  cardio: '❤️',
  hemograma: '🩸',
  lipidograma: '🧬',
  metabolico: '🩺',
  tireoide: '🦋',
};

const MODULE_COLORS: Record<ExamType, string> = {
  cardio: '#c0392b',
  hemograma: '#2980b9',
  lipidograma: '#8e44ad',
  metabolico: '#16a085',
  tireoide: '#1abc9c',
};

const FREQUENCY_OPTIONS: { label: string; value: ReminderFrequency }[] = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
];

export default function RemindersScreen({ onBack }: Props) {
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ExamType | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    const [configs, perm] = await Promise.all([getAllReminders(), checkNotificationPermissions()]);
    setReminders(configs);
    setHasPermission(perm);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggle(moduleType: ExamType, currentEnabled: boolean) {
    const newEnabled = !currentEnabled;

    if (newEnabled && !hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permissão necessária',
          'Para receber lembretes, habilite as notificações para o LabIA nas configurações do dispositivo.',
          [{ text: 'OK' }],
        );
        return;
      }
      setHasPermission(true);
    }

    setSaving(moduleType);
    try {
      const config = reminders.find(r => r.moduleType === moduleType)!;
      if (newEnabled) {
        await scheduleModuleReminder(moduleType, config.frequencyMonths, config.lastExamDate);
      } else {
        await cancelModuleReminder(moduleType);
      }
      await updateReminder(moduleType, { enabled: newEnabled });
      setReminders(prev => prev.map(r => r.moduleType === moduleType ? { ...r, enabled: newEnabled } : r));
    } finally {
      setSaving(null);
    }
  }

  async function handleFrequencyChange(moduleType: ExamType, frequency: ReminderFrequency) {
    const config = reminders.find(r => r.moduleType === moduleType)!;
    setSaving(moduleType);
    try {
      await updateReminder(moduleType, { frequencyMonths: frequency });
      if (config.enabled) {
        await scheduleModuleReminder(moduleType, frequency, config.lastExamDate);
      }
      setReminders(prev => prev.map(r => r.moduleType === moduleType ? { ...r, frequencyMonths: frequency } : r));
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Voltar" accessibilityRole="button">
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lembretes de Exame</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.intro}>
          Configure lembretes periódicos para refazer seus exames. As notificações são locais e não requerem conexão com a internet.
        </Text>

        {reminders.map(config => {
          const color = MODULE_COLORS[config.moduleType];
          const isSaving = saving === config.moduleType;

          return (
            <View key={config.moduleType} style={[styles.card, { borderLeftColor: color }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardIcon}>{MODULE_ICONS[config.moduleType]}</Text>
                  <Text style={[styles.cardTitle, { color }]}>{MODULE_LABELS[config.moduleType]}</Text>
                </View>
                {isSaving ? (
                  <ActivityIndicator size="small" color={color} />
                ) : (
                  <Switch
                    value={config.enabled}
                    onValueChange={() => handleToggle(config.moduleType, config.enabled)}
                    trackColor={{ false: '#ccc', true: color }}
                    thumbColor="#fff"
                    accessibilityLabel={`Ativar lembrete para ${MODULE_LABELS[config.moduleType]}`}
                  />
                )}
              </View>

              {config.enabled && (
                <View style={styles.frequencyRow}>
                  <Text style={styles.frequencyLabel}>Lembrar a cada:</Text>
                  <View style={styles.frequencyOptions}>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.frequencyBtn,
                          config.frequencyMonths === opt.value && { backgroundColor: color, borderColor: color },
                        ]}
                        onPress={() => handleFrequencyChange(config.moduleType, opt.value)}
                        disabled={isSaving}
                        accessibilityLabel={`Frequência ${opt.label}`}
                        accessibilityRole="button"
                      >
                        <Text style={[
                          styles.frequencyBtnText,
                          config.frequencyMonths === opt.value && styles.frequencyBtnTextActive,
                        ]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {config.enabled && config.lastExamDate && (
                <Text style={styles.lastExamText}>
                  Último exame: {config.lastExamDate.split('-').reverse().join('/')}
                </Text>
              )}
            </View>
          );
        })}

        <Text style={styles.footer}>
          Os lembretes são calculados a partir da data do último exame registrado no histórico, ou a partir de hoje se não houver histórico.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { marginRight: 12 },
  backText: { fontSize: 18, color: '#2c3e50', fontFamily: 'Inter_500Medium' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', fontFamily: 'Inter_700Bold' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  intro: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcon: { fontSize: 24, marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_600SemiBold', flex: 1 },
  frequencyRow: { marginTop: 14 },
  frequencyLabel: { fontSize: 13, color: '#555', marginBottom: 8, fontFamily: 'Inter_400Regular' },
  frequencyOptions: { flexDirection: 'row', gap: 8 },
  frequencyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f8f8',
  },
  frequencyBtnText: { fontSize: 13, color: '#555', fontFamily: 'Inter_400Regular' },
  frequencyBtnTextActive: { color: '#fff', fontFamily: 'Inter_500Medium' },
  lastExamText: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
  },
});
