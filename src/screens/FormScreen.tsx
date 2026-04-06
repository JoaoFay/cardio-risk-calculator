import React, { useState } from 'react';
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
import { PatientInput, RiskResult } from '../types';
import { calculateFramingham, framinghamCategory } from '../calculators/framingham';
import { calculateASCVD, ascvdCategory } from '../calculators/ascvd';
import { getAIInterpretation } from '../services/openai';

// TODO: move API key to secure storage in production
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';

interface Props {
  onResult: (result: RiskResult) => void;
}

export default function FormScreen({ onResult }: Props) {
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
      const interpretation = await getAIInterpretation(OPENAI_API_KEY, input, partialResult);
      onResult({ ...partialResult, aiInterpretation: interpretation });
    } catch (e: any) {
      Alert.alert('Erro na IA', e.message);
      onResult({ ...partialResult, aiInterpretation: 'Não foi possível obter a interpretação da IA.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Risco Cardiovascular</Text>
      <Text style={styles.subtitle}>Preencha os dados do paciente</Text>

      <Text style={styles.label}>Sexo</Text>
      <View style={styles.sexRow}>
        <TouchableOpacity
          style={[styles.sexButton, sex === 'male' && styles.sexButtonActive]}
          onPress={() => setSex('male')}
        >
          <Text style={[styles.sexButtonText, sex === 'male' && styles.sexButtonTextActive]}>
            Masculino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sexButton, sex === 'female' && styles.sexButtonActive]}
          onPress={() => setSex('female')}
        >
          <Text style={[styles.sexButtonText, sex === 'female' && styles.sexButtonTextActive]}>
            Feminino
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Idade (30–79 anos)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} placeholder="Ex: 55" />

      <Text style={styles.label}>Colesterol Total (mg/dL)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={totalCholesterol} onChangeText={setTotalCholesterol} placeholder="Ex: 210" />

      <Text style={styles.label}>LDL (mg/dL)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={ldl} onChangeText={setLdl} placeholder="Ex: 130" />

      <Text style={styles.label}>HDL (mg/dL)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={hdl} onChangeText={setHdl} placeholder="Ex: 45" />

      <Text style={styles.label}>Pressão Sistólica (mmHg)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={systolicBP} onChangeText={setSystolicBP} placeholder="Ex: 130" />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Em tratamento para hipertensão</Text>
        <Switch value={onBPTreatment} onValueChange={setOnBPTreatment} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Fumante</Text>
        <Switch value={smoker} onValueChange={setSmoker} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Diabético</Text>
        <Switch value={diabetic} onValueChange={setDiabetic} />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCalculate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Calculando...' : 'Calcular Risco'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
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
});
