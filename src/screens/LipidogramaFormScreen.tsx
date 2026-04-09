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
import { LipidogramaInput, LipidogramaResult } from '../types';
import { getLipidogramaInterpretation } from '../services/lipidograma';
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
  onResult: (result: LipidogramaResult, input: LipidogramaInput) => void;
  onBack: () => void;
  onGoToPremium: () => void;
}

const LIMITS = {
  totalCholesterol: { min: 50,  max: 500,  label: '50–500 mg/dL' },
  ldl:              { min: 10,  max: 400,  label: '10–400 mg/dL' },
  hdl:              { min: 10,  max: 200,  label: '10–200 mg/dL' },
  triglycerides:    { min: 10,  max: 3000, label: '10–3.000 mg/dL' },
};

function outOfRange(value: number, min: number, max: number) {
  return !isNaN(value) && value !== 0 && (value < min || value > max);
}

export default function LipidogramaFormScreen({ onResult, onBack, onGoToPremium }: Props) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [ldl, setLdl] = useState('');
  const [hdl, setHdl] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [vldl, setVldl] = useState('');

  function clearError(field: string) {
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const tcN = parseFloat(totalCholesterol);
    const ldlN = parseFloat(ldl);
    const hdlN = parseFloat(hdl);
    const tgN = parseFloat(triglycerides);

    if (outOfRange(tcN, LIMITS.totalCholesterol.min, LIMITS.totalCholesterol.max))
      newErrors.totalCholesterol = `Valor fora do intervalo esperado (${LIMITS.totalCholesterol.label})`;
    if (outOfRange(ldlN, LIMITS.ldl.min, LIMITS.ldl.max))
      newErrors.ldl = `Valor fora do intervalo esperado (${LIMITS.ldl.label})`;
    if (outOfRange(hdlN, LIMITS.hdl.min, LIMITS.hdl.max))
      newErrors.hdl = `Valor fora do intervalo esperado (${LIMITS.hdl.label})`;
    if (outOfRange(tgN, LIMITS.triglycerides.min, LIMITS.triglycerides.max))
      newErrors.triglycerides = `Valor fora do intervalo esperado (${LIMITS.triglycerides.label})`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    const tcN = parseFloat(totalCholesterol);
    const ldlN = parseFloat(ldl);
    const hdlN = parseFloat(hdl);
    const tgN = parseFloat(triglycerides);

    if (!tcN || !ldlN || !hdlN || !tgN) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha: Colesterol Total, LDL, HDL e Triglicerídeos.',
      );
      return;
    }

    if (hdlN <= 0) {
      Alert.alert('Valor inválido', 'HDL deve ser maior que zero para calcular os índices.');
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

    const input: LipidogramaInput = {
      totalCholesterol: tcN,
      ldl: ldlN,
      hdl: hdlN,
      triglycerides: tgN,
      vldl: vldl.trim() !== '' ? parseFloat(vldl) : undefined,
    };

    const castelliI  = Math.round((tcN / hdlN) * 100) / 100;
    const castelliII = Math.round((ldlN / hdlN) * 100) / 100;
    const tgHdl      = Math.round((tgN / hdlN) * 100) / 100;

    const partialResult = { castelliI, castelliII, tgHdl };

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
      const cardioExam = await getLastExamByType('cardio');
      const aiInterpretation = await getLipidogramaInterpretation(input, partialResult, cardioExam ?? undefined);
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

      <Text style={styles.title}>Lipidograma</Text>
      <Text style={styles.subtitle}>Preencha os valores do exame</Text>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Ferramenta educacional. Não substitui avaliação médica presencial.
        </Text>
      </View>

      <Text style={styles.requiredLegend}><Text style={styles.required}>*</Text> Campo obrigatório</Text>

      <Field label="Colesterol Total (mg/dL)" value={totalCholesterol}
        onChange={v => { setTotalCholesterol(v); clearError('totalCholesterol'); }}
        placeholder="Ex: 210 (ref. < 200 desejável)" required error={errors.totalCholesterol} />
      <Field label="LDL (mg/dL)" value={ldl}
        onChange={v => { setLdl(v); clearError('ldl'); }}
        placeholder="Ex: 130 (ref. < 130 desejável)" required error={errors.ldl} />
      <Field label="HDL (mg/dL)" value={hdl}
        onChange={v => { setHdl(v); clearError('hdl'); }}
        placeholder="Ex: 50 (ref. > 60 ótimo)" required error={errors.hdl} />
      <Field label="Triglicerídeos (mg/dL)" value={triglycerides}
        onChange={v => { setTriglycerides(v); clearError('triglycerides'); }}
        placeholder="Ex: 150 (ref. < 150 normal)" required error={errors.triglycerides} />
      <Field label="VLDL (mg/dL)" value={vldl} onChange={setVldl}
        placeholder="Ex: 30 (ref. < 40) — opcional" />

      <View style={styles.indicesInfo}>
        <Text style={styles.indicesInfoText}>
          Os índices de Castelli I/II e TG/HDL serão calculados automaticamente.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityLabel="Interpretar lipidograma"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Interpretando...' : 'Interpretar Lipidograma'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#8e44ad', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8e44ad', marginBottom: 4 },
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
    backgroundColor: '#8e44ad',
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
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#8e44ad',
    borderRadius: 6,
    padding: 12,
    marginTop: 20,
  },
  indicesInfoText: { fontSize: 13, color: '#6a1b9a' },
});
