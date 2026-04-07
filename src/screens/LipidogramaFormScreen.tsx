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
import { LipidogramaInput, LipidogramaResult } from '../types';
import { getLipidogramaInterpretation } from '../services/lipidograma';
import { getLastExamByType } from '../storage/examStorage';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}

function Field({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
      />
    </>
  );
}

interface Props {
  onResult: (result: LipidogramaResult, input: LipidogramaInput) => void;
  onBack: () => void;
}

export default function LipidogramaFormScreen({ onResult, onBack }: Props) {
  const [loading, setLoading] = useState(false);

  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [ldl, setLdl] = useState('');
  const [hdl, setHdl] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [vldl, setVldl] = useState('');

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

    setLoading(true);
    try {
      const cardioExam = await getLastExamByType('cardio');
      const aiInterpretation = await getLipidogramaInterpretation(input, partialResult, cardioExam ?? undefined);
      onResult({ ...partialResult, aiInterpretation }, input);
    } catch (e: any) {
      Alert.alert('Erro na IA', e.message);
      onResult({ ...partialResult, aiInterpretation: 'Não foi possível obter a interpretação da IA.' }, input);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
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

      <Field label="Colesterol Total (mg/dL)" value={totalCholesterol} onChange={setTotalCholesterol}
        placeholder="Ex: 210 (ref. < 200 desejável)" required />
      <Field label="LDL (mg/dL)" value={ldl} onChange={setLdl}
        placeholder="Ex: 130 (ref. < 130 desejável)" required />
      <Field label="HDL (mg/dL)" value={hdl} onChange={setHdl}
        placeholder="Ex: 50 (ref. > 60 ótimo)" required />
      <Field label="Triglicerídeos (mg/dL)" value={triglycerides} onChange={setTriglycerides}
        placeholder="Ex: 150 (ref. < 150 normal)" required />
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
      >
        <Text style={styles.buttonText}>{loading ? 'Interpretando...' : 'Interpretar Lipidograma'}</Text>
      </TouchableOpacity>
    </ScrollView>
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
