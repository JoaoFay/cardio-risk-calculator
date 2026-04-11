import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { TireoideInput, TireoideResult, TireoideCategory } from '../types';
import { getTireoideInterpretation } from '../services/tireoide';
import { getLastExamByType } from '../storage/examStorage';
import { isPremium } from '../storage/premiumStorage';
import { getTodayCount, incrementUsage } from '../storage/usageStorage';
import UpgradeModal from '../components/UpgradeModal';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
}

function Field({ label, value, onChange, placeholder, required, error }: FieldProps) {
  return (
    <>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </>
  );
}

interface Props {
  onResult: (result: TireoideResult, input: TireoideInput) => void;
  onBack: () => void;
  onGoToPremium: () => void;
}

function classifyTSH(tsh: number): TireoideCategory {
  if (tsh < 0.4) return 'hipertireoidismo';
  if (tsh <= 4.0) return 'normal';
  return 'hipotireoidismo';
}

const LIMITS = {
  tsh:      { min: 0.01, max: 100,  label: '0,01–100 mIU/L' },
  t4livre:  { min: 0.1,  max: 10,   label: '0,1–10 ng/dL' },
  t3total:  { min: 10,   max: 600,  label: '10–600 ng/dL' },
  t4total:  { min: 0.5,  max: 30,   label: '0,5–30 μg/dL' },
  antiTPO:  { min: 0,    max: 5000, label: '0–5000 IU/mL' },
  antiTg:   { min: 0,    max: 5000, label: '0–5000 IU/mL' },
};

function outOfRange(value: number, min: number, max: number) {
  return !isNaN(value) && (value < min || value > max);
}

export default function TireoideFormScreen({ onResult, onBack, onGoToPremium }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [tsh, setTsh] = useState('');
  const [t4livre, setT4livre] = useState('');
  const [t3total, setT3total] = useState('');
  const [t4total, setT4total] = useState('');
  const [antiTPO, setAntiTPO] = useState('');
  const [antiTg, setAntiTg] = useState('');

  function clearError(field: string) {
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const tshN = parseFloat(tsh);
    const t4livreN = parseFloat(t4livre);
    const t3N = parseFloat(t3total);
    const t4totalN = parseFloat(t4total);
    const antiTPON = parseFloat(antiTPO);
    const antiTgN = parseFloat(antiTg);

    if (outOfRange(tshN, LIMITS.tsh.min, LIMITS.tsh.max))
      newErrors.tsh = `Valor fora do intervalo esperado (${LIMITS.tsh.label})`;
    if (t4livre.trim() !== '' && outOfRange(t4livreN, LIMITS.t4livre.min, LIMITS.t4livre.max))
      newErrors.t4livre = `Valor fora do intervalo esperado (${LIMITS.t4livre.label})`;
    if (t3total.trim() !== '' && outOfRange(t3N, LIMITS.t3total.min, LIMITS.t3total.max))
      newErrors.t3total = `Valor fora do intervalo esperado (${LIMITS.t3total.label})`;
    if (t4total.trim() !== '' && outOfRange(t4totalN, LIMITS.t4total.min, LIMITS.t4total.max))
      newErrors.t4total = `Valor fora do intervalo esperado (${LIMITS.t4total.label})`;
    if (antiTPO.trim() !== '' && outOfRange(antiTPON, LIMITS.antiTPO.min, LIMITS.antiTPO.max))
      newErrors.antiTPO = `Valor fora do intervalo esperado (${LIMITS.antiTPO.label})`;
    if (antiTg.trim() !== '' && outOfRange(antiTgN, LIMITS.antiTg.min, LIMITS.antiTg.max))
      newErrors.antiTg = `Valor fora do intervalo esperado (${LIMITS.antiTg.label})`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    const tshN = parseFloat(tsh);

    if (!tsh.trim() || isNaN(tshN)) {
      Alert.alert('Campo obrigatório', 'Preencha o TSH.');
      return;
    }

    if (tshN <= 0) {
      Alert.alert('Valor inválido', 'TSH deve ser maior que zero.');
      return;
    }

    if (!validate()) return;

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert(
        'Sem conexão',
        'A análise por IA requer conexão com a internet. Seus dados foram preservados — tente novamente quando estiver conectado.'
      );
      return;
    }

    const input: TireoideInput = {
      tsh: tshN,
      t4livre: t4livre.trim() !== '' ? parseFloat(t4livre) : undefined,
      t3total: t3total.trim() !== '' ? parseFloat(t3total) : undefined,
      t4total: t4total.trim() !== '' ? parseFloat(t4total) : undefined,
      antiTPO: antiTPO.trim() !== '' ? parseFloat(antiTPO) : undefined,
      antiTg: antiTg.trim() !== '' ? parseFloat(antiTg) : undefined,
    };

    const tshCategory = classifyTSH(tshN);
    const partialResult = { tshCategory };

    const premium = await isPremium();
    if (!premium) {
      const count = await getTodayCount();
      if (count >= 3) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setLoading(true);
    try {
      const previousExam = await getLastExamByType('tireoide');
      const aiInterpretation = await getTireoideInterpretation(input, partialResult, previousExam ?? undefined);
      await incrementUsage();
      onResult({ ...partialResult, aiInterpretation }, input);
    } catch (e: any) {
      Alert.alert('Erro na IA', e.message);
      onResult({ ...partialResult, aiInterpretation: 'Não foi possível obter a interpretação da IA.' }, input);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onLearnMore={() => { setShowUpgradeModal(false); onGoToPremium(); }}
        reason="analyses"
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Voltar" accessibilityRole="button">
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Tireoide</Text>
        <Text style={styles.subtitle}>Preencha os valores do exame</Text>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️ Ferramenta educacional. Não substitui avaliação médica presencial.
          </Text>
        </View>

        <View style={styles.refBox}>
          <Text style={styles.refText}>
            As faixas de referência podem variar por laboratório e método. Os intervalos abaixo são valores típicos.
          </Text>
        </View>

        <Text style={styles.requiredLegend}><Text style={styles.required}>*</Text> Campo obrigatório</Text>

        <Field
          label="TSH (mIU/L)"
          value={tsh}
          onChange={v => { setTsh(v); clearError('tsh'); }}
          placeholder="Ex: 2.5 (ref. 0,4–4,0 mIU/L)"
          required
          error={errors.tsh}
        />
        <Field
          label="T4 Livre (ng/dL)"
          value={t4livre}
          onChange={v => { setT4livre(v); clearError('t4livre'); }}
          placeholder="Ex: 1.2 (ref. 0,8–1,8 ng/dL) — opcional"
          error={errors.t4livre}
        />
        <Field
          label="T3 Total (ng/dL)"
          value={t3total}
          onChange={v => { setT3total(v); clearError('t3total'); }}
          placeholder="Ex: 120 (ref. 80–200 ng/dL) — opcional"
          error={errors.t3total}
        />

        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(v => !v)}
          accessibilityRole="button"
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? '▲ Ocultar campos avançados' : '▼ Exibir campos avançados (T4 total, anticorpos)'}
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <>
            <Field
              label="T4 Total (μg/dL)"
              value={t4total}
              onChange={v => { setT4total(v); clearError('t4total'); }}
              placeholder="Ex: 8.0 (ref. 5,0–12,0 μg/dL) — opcional"
              error={errors.t4total}
            />
            <Field
              label="Anti-TPO (IU/mL)"
              value={antiTPO}
              onChange={v => { setAntiTPO(v); clearError('antiTPO'); }}
              placeholder="Ex: 15 (ref. < 35 IU/mL) — opcional"
              error={errors.antiTPO}
            />
            <Field
              label="Anti-Tg (IU/mL)"
              value={antiTg}
              onChange={v => { setAntiTg(v); clearError('antiTg'); }}
              placeholder="Ex: 20 (ref. < 40 IU/mL) — opcional"
              error={errors.antiTg}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityLabel="Interpretar exame de tireoide"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{loading ? 'Interpretando...' : 'Interpretar Tireoide'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const ACCENT = '#1abc9c';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: ACCENT, fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: ACCENT, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  label: { fontSize: 14, color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: { borderColor: '#c0392b' },
  fieldError: { fontSize: 12, color: '#c0392b', marginTop: 4 },
  button: {
    marginTop: 32,
    backgroundColor: ACCENT,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disclaimerBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  disclaimerText: { fontSize: 13, color: '#7d5a00' },
  refBox: {
    backgroundColor: '#e8f8f5',
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  refText: { fontSize: 13, color: '#0e6655' },
  required: { color: '#c0392b', fontWeight: 'bold' },
  requiredLegend: { fontSize: 12, color: '#888', marginBottom: 8 },
  advancedToggle: {
    marginTop: 20,
    paddingVertical: 10,
  },
  advancedToggleText: { fontSize: 13, color: ACCENT, fontWeight: '500' },
});
