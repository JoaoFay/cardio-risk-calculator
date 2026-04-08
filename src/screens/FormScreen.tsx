import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { PatientInput, RiskResult, LipidogramaInput } from '../types';
import { calculateFramingham, framinghamCategory } from '../calculators/framingham';
import { calculateASCVD, ascvdCategory } from '../calculators/ascvd';
import { getAIInterpretation } from '../services/openai';
import { getLastExamByType } from '../storage/examStorage';

interface Props {
  onResult: (result: RiskResult, input: PatientInput) => void;
  onBack: () => void;
}

const LIMITS = {
  totalCholesterol: { min: 50, max: 500, label: '50–500 mg/dL' },
  ldl:              { min: 10, max: 400, label: '10–400 mg/dL' },
  hdl:              { min: 10, max: 200, label: '10–200 mg/dL' },
  systolicBP:       { min: 70, max: 250, label: '70–250 mmHg' },
};

function outOfRange(value: number, min: number, max: number) {
  return !isNaN(value) && value !== 0 && (value < min || value > max);
}

export default function FormScreen({ onResult, onBack }: Props) {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [totalCholesterol, setTotalCholesterol] = useState('');
  const [ldl, setLdl] = useState('');
  const [hdl, setHdl] = useState('');
  const [systolicBP, setSystolicBP] = useState('');
  const [onBPTreatment, setOnBPTreatment] = useState(false);
  const [smoker, setSmoker] = useState(false);
  const [diabetic, setDiabetic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoFillDate, setAutoFillDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getLastExamByType('lipidograma').then(exam => {
      if (!exam) return;
      const i = exam.input as LipidogramaInput;
      setTotalCholesterol(String(i.totalCholesterol));
      setLdl(String(i.ldl));
      setHdl(String(i.hdl));
      setAutoFillDate(exam.examDateDisplay);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const tcN = parseFloat(totalCholesterol);
    const ldlN = parseFloat(ldl);
    const hdlN = parseFloat(hdl);
    const sbpN = parseFloat(systolicBP);

    if (outOfRange(tcN, LIMITS.totalCholesterol.min, LIMITS.totalCholesterol.max))
      newErrors.totalCholesterol = `Valor fora do intervalo esperado (${LIMITS.totalCholesterol.label})`;
    if (outOfRange(ldlN, LIMITS.ldl.min, LIMITS.ldl.max))
      newErrors.ldl = `Valor fora do intervalo esperado (${LIMITS.ldl.label})`;
    if (outOfRange(hdlN, LIMITS.hdl.min, LIMITS.hdl.max))
      newErrors.hdl = `Valor fora do intervalo esperado (${LIMITS.hdl.label})`;
    if (outOfRange(sbpN, LIMITS.systolicBP.min, LIMITS.systolicBP.max))
      newErrors.systolicBP = `Valor fora do intervalo esperado (${LIMITS.systolicBP.label})`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleCalculate() {
    const ageN = parseInt(age);
    const tcN = parseFloat(totalCholesterol);
    const ldlN = parseFloat(ldl);
    const hdlN = parseFloat(hdl);
    const sbpN = parseFloat(systolicBP);

    if (!ageN || !tcN || !ldlN || !hdlN || !sbpN) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos antes de calcular.');
      return;
    }

    if (ageN < 30 || ageN > 79) {
      Alert.alert('Idade fora do intervalo', 'As calculadoras são validadas para idades entre 30 e 79 anos.');
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

    const input: PatientInput = {
      age: ageN,
      sex,
      totalCholesterol: tcN,
      ldlCholesterol: ldlN,
      hdlCholesterol: hdlN,
      systolicBP: sbpN,
      onBPTreatment,
      smoker,
      diabetic,
    };

    const framRisk = calculateFramingham(input);
    const ascvdRisk = calculateASCVD(input);

    const partialResult: RiskResult = {
      framingham: { tenYearRisk: framRisk, riskCategory: framinghamCategory(framRisk) },
      ascvd: { tenYearRisk: ascvdRisk, riskCategory: ascvdCategory(ascvdRisk) },
      aiInterpretation: '',
    };

    setLoading(true);
    try {
      const previousExam = await getLastExamByType('cardio');
      const interpretation = await getAIInterpretation(input, partialResult, previousExam ?? undefined);
      onResult({ ...partialResult, aiInterpretation: interpretation }, input);
    } catch (e: any) {
      Alert.alert('Erro na IA', e.message);
      onResult({ ...partialResult, aiInterpretation: 'Não foi possível obter a interpretação da IA.' }, input);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Voltar" accessibilityRole="button">
        <Text style={styles.backText}>‹ Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Risco Cardiovascular</Text>
      <Text style={styles.subtitle}>Preencha os dados do paciente</Text>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Ferramenta educacional. Não substitui avaliação médica presencial.
        </Text>
      </View>

      {autoFillDate && (
        <View style={styles.autoFillBanner}>
          <Text style={styles.autoFillText}>
            Colesterol, LDL e HDL preenchidos do lipidograma de {autoFillDate}
          </Text>
          <TouchableOpacity onPress={() => {
            setTotalCholesterol('');
            setLdl('');
            setHdl('');
            setAutoFillDate(null);
          }}>
            <Text style={styles.autoFillClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.label}>Sexo</Text>
      <View style={styles.sexRow}>
        <TouchableOpacity
          style={[styles.sexButton, sex === 'male' && styles.sexButtonActive]}
          onPress={() => setSex('male')}
          accessibilityLabel="Sexo masculino"
          accessibilityRole="button"
        >
          <Text style={[styles.sexButtonText, sex === 'male' && styles.sexButtonTextActive]}>
            Masculino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sexButton, sex === 'female' && styles.sexButtonActive]}
          onPress={() => setSex('female')}
          accessibilityLabel="Sexo feminino"
          accessibilityRole="button"
        >
          <Text style={[styles.sexButtonText, sex === 'female' && styles.sexButtonTextActive]}>
            Feminino
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Idade (30–79 anos)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
        placeholder="Ex: 55"
        accessibilityLabel="Idade em anos"
      />

      <Text style={styles.label}>Colesterol Total (mg/dL)</Text>
      <TextInput
        style={[styles.input, errors.totalCholesterol ? styles.inputError : null]}
        keyboardType="numeric"
        value={totalCholesterol}
        onChangeText={v => { setTotalCholesterol(v); setErrors(e => ({ ...e, totalCholesterol: '' })); }}
        placeholder="Ex: 210"
        accessibilityLabel="Colesterol total em miligramas por decilitro"
      />
      {errors.totalCholesterol ? <Text style={styles.fieldError}>{errors.totalCholesterol}</Text> : null}

      <Text style={styles.label}>LDL (mg/dL)</Text>
      <TextInput
        style={[styles.input, errors.ldl ? styles.inputError : null]}
        keyboardType="numeric"
        value={ldl}
        onChangeText={v => { setLdl(v); setErrors(e => ({ ...e, ldl: '' })); }}
        placeholder="Ex: 130"
        accessibilityLabel="LDL em miligramas por decilitro"
      />
      {errors.ldl ? <Text style={styles.fieldError}>{errors.ldl}</Text> : null}

      <Text style={styles.label}>HDL (mg/dL)</Text>
      <TextInput
        style={[styles.input, errors.hdl ? styles.inputError : null]}
        keyboardType="numeric"
        value={hdl}
        onChangeText={v => { setHdl(v); setErrors(e => ({ ...e, hdl: '' })); }}
        placeholder="Ex: 45"
        accessibilityLabel="HDL em miligramas por decilitro"
      />
      {errors.hdl ? <Text style={styles.fieldError}>{errors.hdl}</Text> : null}

      <Text style={styles.label}>Pressão Sistólica (mmHg)</Text>
      <TextInput
        style={[styles.input, errors.systolicBP ? styles.inputError : null]}
        keyboardType="numeric"
        value={systolicBP}
        onChangeText={v => { setSystolicBP(v); setErrors(e => ({ ...e, systolicBP: '' })); }}
        placeholder="Ex: 130"
        accessibilityLabel="Pressão arterial sistólica em milímetros de mercúrio"
      />
      {errors.systolicBP ? <Text style={styles.fieldError}>{errors.systolicBP}</Text> : null}

      <View style={styles.switchRow}>
        <Text style={styles.label}>Em tratamento para hipertensão</Text>
        <Switch value={onBPTreatment} onValueChange={setOnBPTreatment} accessibilityLabel="Em tratamento para hipertensão" />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Fumante</Text>
        <Switch value={smoker} onValueChange={setSmoker} accessibilityLabel="Fumante" />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Diabético</Text>
        <Switch value={diabetic} onValueChange={setDiabetic} accessibilityLabel="Diabético" />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCalculate}
        disabled={loading}
        accessibilityLabel="Calcular risco cardiovascular"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{loading ? 'Calculando...' : 'Calcular Risco'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#c0392b', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#c0392b', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  label: { fontSize: 14, color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: { borderColor: '#c0392b' },
  fieldError: { fontSize: 12, color: '#c0392b', marginTop: 4 },
  sexRow: { flexDirection: 'row', gap: 12 },
  sexButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  sexButtonActive: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  sexButtonText: { color: '#333', fontWeight: '500' },
  sexButtonTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  button: {
    marginTop: 32,
    backgroundColor: '#c0392b',
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
  autoFillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#8e44ad',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  autoFillText: { flex: 1, fontSize: 12, color: '#6a1b9a' },
  autoFillClose: { fontSize: 20, color: '#8e44ad', paddingLeft: 8 },
});
