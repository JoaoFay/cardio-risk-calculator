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
import { HemogramaInput, HemogramaResult, Sex } from '../types';
import { getHemogramaInterpretation } from '../services/hemograma';

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
  onResult: (result: HemogramaResult) => void;
  onBack: () => void;
}

export default function HemogramaFormScreen({ onResult, onBack }: Props) {
  const [sex, setSex] = useState<Sex>('male');
  const [loading, setLoading] = useState(false);

  // Eritrograma
  const [hemacias, setHemacias] = useState('');
  const [hemoglobina, setHemoglobina] = useState('');
  const [hematocrito, setHematocrito] = useState('');
  const [vcm, setVcm] = useState('');
  const [hcm, setHcm] = useState('');
  const [chcm, setChcm] = useState('');
  const [rdw, setRdw] = useState('');

  // Leucograma
  const [leucocitos, setLeucocitos] = useState('');
  const [neutrofilosPct, setNeutrofilosPct] = useState('');
  const [neutrofilosAbs, setNeutrofilosAbs] = useState('');
  const [linfocitosPct, setLinfocitosPct] = useState('');
  const [monocitosPct, setMonocitosPct] = useState('');
  const [eosinofilosPct, setEosinofilosPct] = useState('');
  const [basofilosPct, setBasofilosPct] = useState('');

  // Plaquetas
  const [plaquetas, setPlaquetas] = useState('');
  const [vpm, setVpm] = useState('');

  async function handleSubmit() {
    const requiredEmpty = [hemoglobina, hematocrito, vcm, leucocitos, linfocitosPct].some(
      v => v.trim() === '',
    );
    const neutrofilosProvided = neutrofilosPct.trim() !== '' || neutrofilosAbs.trim() !== '';

    if (requiredEmpty || !neutrofilosProvided) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha: Hemoglobina, Hematócrito, VCM, Leucócitos, Neutrófilos (% ou absoluto) e Linfócitos.',
      );
      return;
    }

    const opt = (v: string) => (v.trim() !== '' ? parseFloat(v) : undefined);

    const input: HemogramaInput = {
      sex,
      hemoglobina: parseFloat(hemoglobina),
      hematocrito: parseFloat(hematocrito),
      vcm: parseFloat(vcm),
      leucocitos: parseFloat(leucocitos),
      linfocitosPct: parseFloat(linfocitosPct),
      hemacias: opt(hemacias),
      hcm: opt(hcm),
      chcm: opt(chcm),
      rdw: opt(rdw),
      neutrofilosPct: opt(neutrofilosPct),
      neutrofilosAbs: opt(neutrofilosAbs),
      monocitosPct: opt(monocitosPct),
      eosinofilosPct: opt(eosinofilosPct),
      basofilosPct: opt(basofilosPct),
      plaquetas: opt(plaquetas),
      vpm: opt(vpm),
    };

    setLoading(true);
    try {
      const aiInterpretation = await getHemogramaInterpretation(input);
      onResult({ aiInterpretation });
    } catch (e: any) {
      Alert.alert('Erro na IA', e.message);
      onResult({ aiInterpretation: 'Não foi possível obter a interpretação da IA.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹ Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Hemograma Completo</Text>
      <Text style={styles.subtitle}>Preencha os valores do exame</Text>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          ⚠️ Ferramenta educacional. Não substitui avaliação médica presencial.
        </Text>
      </View>

      <Text style={styles.requiredLegend}><Text style={styles.required}>*</Text> Campo obrigatório</Text>

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

      {/* ERITROGRAMA */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Eritrograma — Série Vermelha</Text>
      </View>

      <Field label="Hemácias (T/L)" value={hemacias} onChange={setHemacias}
        placeholder={sex === 'male' ? 'Ref: 4,5 – 6,0' : 'Ref: 4,0 – 5,5'} />
      <Field label="Hemoglobina (g/dL)" value={hemoglobina} onChange={setHemoglobina}
        placeholder={sex === 'male' ? 'Ref: 13,5 – 17,5' : 'Ref: 12,0 – 16,0'} required />
      <Field label="Hematócrito (%)" value={hematocrito} onChange={setHematocrito}
        placeholder={sex === 'male' ? 'Ref: 41 – 53' : 'Ref: 36 – 46'} required />
      <Field label="VCM (fL)" value={vcm} onChange={setVcm} placeholder="Ref: 80 – 100" required />
      <Field label="HCM (pg)" value={hcm} onChange={setHcm} placeholder="Ref: 27 – 33" />
      <Field label="CHCM (g/dL)" value={chcm} onChange={setChcm} placeholder="Ref: 32 – 36" />
      <Field label="RDW (%)" value={rdw} onChange={setRdw} placeholder="Ref: 11,5 – 14,5" />

      {/* LEUCOGRAMA */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leucograma — Série Branca</Text>
      </View>

      <Field label="Leucócitos totais (/mm³)" value={leucocitos} onChange={setLeucocitos}
        placeholder="Ref: 4.000 – 10.000" required />
      <Field label="Neutrófilos (%) *" value={neutrofilosPct} onChange={setNeutrofilosPct}
        placeholder="Ref: 45 – 75" />
      <Field label="Neutrófilos absolutos (/mm³) *" value={neutrofilosAbs} onChange={setNeutrofilosAbs}
        placeholder="Ref: 1.800 – 7.500" />
      <Text style={styles.fieldNote}>* Preencha ao menos um dos dois campos de Neutrófilos</Text>
      <Field label="Linfócitos (%)" value={linfocitosPct} onChange={setLinfocitosPct}
        placeholder="Ref: 20 – 40" required />
      <Field label="Monócitos (%)" value={monocitosPct} onChange={setMonocitosPct}
        placeholder="Ref: 2 – 8" />
      <Field label="Eosinófilos (%)" value={eosinofilosPct} onChange={setEosinofilosPct}
        placeholder="Ref: 1 – 5" />
      <Field label="Basófilos (%)" value={basofilosPct} onChange={setBasofilosPct}
        placeholder="Ref: 0 – 1" />

      {/* PLAQUETAS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plaquetas</Text>
      </View>

      <Field label="Plaquetas (/mm³)" value={plaquetas} onChange={setPlaquetas}
        placeholder="Ref: 150.000 – 400.000" />
      <Field label="VPM — Volume Plaquetário Médio (fL)" value={vpm} onChange={setVpm}
        placeholder="Ref: 7,5 – 12,5" />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Interpretando...' : 'Interpretar Hemograma'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#2980b9', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2980b9', marginBottom: 4 },
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
  sexButtonActive: { backgroundColor: '#2980b9', borderColor: '#2980b9' },
  sexButtonText: { color: '#333', fontWeight: '500' },
  sexButtonTextActive: { color: '#fff' },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#2980b9',
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#2980b9' },
  button: {
    marginTop: 32,
    backgroundColor: '#2980b9',
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
  fieldNote: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 4, fontStyle: 'italic' },
});
