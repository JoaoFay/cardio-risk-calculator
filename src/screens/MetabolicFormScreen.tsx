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
import { MetabolicInput, MetabolicResult, GlicemiaCategory } from '../types';
import { getMetabolicoInterpretation } from '../services/metabolico';
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
  onResult: (result: MetabolicResult, input: MetabolicInput) => void;
  onBack: () => void;
  onGoToPremium: () => void;
}

function classifyGlicemia(value: number): GlicemiaCategory {
  if (value < 100) return 'normal';
  if (value < 126) return 'prediabetes';
  return 'diabetes';
}

function classifyHbA1c(value: number): GlicemiaCategory {
  if (value < 5.7) return 'normal';
  if (value < 6.5) return 'prediabetes';
  return 'diabetes';
}

const CATEGORY_ORDER: GlicemiaCategory[] = ['normal', 'prediabetes', 'diabetes'];

function worstCategory(a: GlicemiaCategory, b?: GlicemiaCategory): GlicemiaCategory {
  if (!b) return a;
  return CATEGORY_ORDER.indexOf(a) >= CATEGORY_ORDER.indexOf(b) ? a : b;
}

const LIMITS = {
  glicemiaJejum: { min: 30,  max: 600, label: '30–600 mg/dL' },
  hbA1c:         { min: 3,   max: 20,  label: '3–20%' },
  insulinaJejum: { min: 0,   max: 300, label: '0–300 μUI/mL' },
};

function outOfRange(value: number, min: number, max: number) {
  return !isNaN(value) && value !== 0 && (value < min || value > max);
}

export default function MetabolicFormScreen({ onResult, onBack, onGoToPremium }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [glicemiaJejum, setGlicemiaJejum] = useState('');
  const [glicemiaPosP, setGlicemiaPosP] = useState('');
  const [hbA1c, setHbA1c] = useState('');
  const [insulinaJejum, setInsulinaJejum] = useState('');

  function clearError(field: string) {
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const gjN = parseFloat(glicemiaJejum);
    const hbN = parseFloat(hbA1c);
    const insN = parseFloat(insulinaJejum);

    if (outOfRange(gjN, LIMITS.glicemiaJejum.min, LIMITS.glicemiaJejum.max))
      newErrors.glicemiaJejum = `Valor fora do intervalo esperado (${LIMITS.glicemiaJejum.label})`;
    if (hbA1c.trim() !== '' && outOfRange(hbN, LIMITS.hbA1c.min, LIMITS.hbA1c.max))
      newErrors.hbA1c = `Valor fora do intervalo esperado (${LIMITS.hbA1c.label})`;
    if (insulinaJejum.trim() !== '' && outOfRange(insN, LIMITS.insulinaJejum.min, LIMITS.insulinaJejum.max))
      newErrors.insulinaJejum = `Valor fora do intervalo esperado (${LIMITS.insulinaJejum.label})`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    const gjN = parseFloat(glicemiaJejum);

    if (!gjN) {
      Alert.alert('Campo obrigatório', 'Preencha a Glicemia em Jejum.');
      return;
    }

    if (gjN <= 0) {
      Alert.alert('Valor inválido', 'Glicemia deve ser maior que zero.');
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

    const input: MetabolicInput = {
      glicemiaJejum: gjN,
      glicemiaPosP: glicemiaPosP.trim() !== '' ? parseFloat(glicemiaPosP) : undefined,
      hbA1c: hbA1c.trim() !== '' ? parseFloat(hbA1c) : undefined,
      insulinaJejum: insulinaJejum.trim() !== '' ? parseFloat(insulinaJejum) : undefined,
    };

    const glicemiaCategory = classifyGlicemia(gjN);
    const hbA1cCategory = input.hbA1c != null ? classifyHbA1c(input.hbA1c) : undefined;
    const overallCategory = worstCategory(glicemiaCategory, hbA1cCategory);

    let homaIR: number | undefined;
    if (input.insulinaJejum != null) {
      homaIR = Math.round((gjN * input.insulinaJejum) / 405 * 100) / 100;
    }

    const partialResult = { homaIR, glicemiaCategory, hbA1cCategory, overallCategory };

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
      const previousExam = await getLastExamByType('metabolico');
      const aiInterpretation = await getMetabolicoInterpretation(input, partialResult, previousExam ?? undefined);
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

      <Text style={styles.title}>Perfil Metabólico</Text>
      <Text style={styles.subtitle}>Preencha os valores do exame</Text>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Ferramenta educacional. Não substitui avaliação médica presencial.
        </Text>
      </View>

      <Text style={styles.requiredLegend}><Text style={styles.required}>*</Text> Campo obrigatório</Text>

      <Field
        label="Glicemia em Jejum (mg/dL)"
        value={glicemiaJejum}
        onChange={v => { setGlicemiaJejum(v); clearError('glicemiaJejum'); }}
        placeholder="Ex: 95 (ref. < 100 normal)"
        required
        error={errors.glicemiaJejum}
      />
      <Field
        label="Glicemia Pós-Prandial 2h (mg/dL)"
        value={glicemiaPosP}
        onChange={setGlicemiaPosP}
        placeholder="Ex: 130 (ref. < 140 normal) — opcional"
      />
      <Field
        label="HbA1c — Hemoglobina Glicada (%)"
        value={hbA1c}
        onChange={v => { setHbA1c(v); clearError('hbA1c'); }}
        placeholder="Ex: 5.5 (ref. < 5,7% normal) — opcional"
        error={errors.hbA1c}
      />
      <Field
        label="Insulina em Jejum (μUI/mL)"
        value={insulinaJejum}
        onChange={v => { setInsulinaJejum(v); clearError('insulinaJejum'); }}
        placeholder="Ex: 8.0 (ref. 2–25) — opcional"
        error={errors.insulinaJejum}
      />

      <View style={styles.indicesInfo}>
        <Text style={styles.indicesInfoText}>
          O HOMA-IR será calculado automaticamente se Glicemia e Insulina forem fornecidos.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityLabel="Interpretar perfil metabólico"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Interpretando...' : 'Interpretar Perfil Metabólico'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#16a085', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#16a085', marginBottom: 4 },
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
    backgroundColor: '#16a085',
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
    marginBottom: 4,
  },
  disclaimerText: { fontSize: 13, color: '#7d5a00' },
  required: { color: '#c0392b', fontWeight: 'bold' },
  requiredLegend: { fontSize: 12, color: '#888', marginBottom: 8 },
  indicesInfo: {
    backgroundColor: '#e8f8f5',
    borderLeftWidth: 4,
    borderLeftColor: '#16a085',
    borderRadius: 6,
    padding: 12,
    marginTop: 20,
  },
  indicesInfoText: { fontSize: 13, color: '#0e6655' },
});
