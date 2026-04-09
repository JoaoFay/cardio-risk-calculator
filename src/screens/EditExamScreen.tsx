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
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  SavedExam,
  PatientInput,
  HemogramaInput,
  LipidogramaInput,
  MetabolicInput,
  RiskResult,
  LipidogramaResult,
  MetabolicResult,
  GlicemiaCategory,
  Sex,
} from '../types';
import { updateExam } from '../storage/examStorage';
import { extractMarkers } from '../utils/extractMarkers';
import { getAIInterpretation } from '../services/openai';
import { getHemogramaInterpretation } from '../services/hemograma';
import { getLipidogramaInterpretation } from '../services/lipidograma';
import { getMetabolicoInterpretation } from '../services/metabolico';
import { calculateFramingham, framinghamCategory } from '../calculators/framingham';
import { calculateASCVD, ascvdCategory } from '../calculators/ascvd';

// ── Helpers ──────────────────────────────────────────────────────────────────

function displayToISO(display: string): string | null {
  const parts = display.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function outOfRange(value: number, min: number, max: number) {
  return !isNaN(value) && value !== 0 && (value < min || value > max);
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

// ── Field component ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  color: string;
}

function Field({ label, value, onChange, placeholder, required, error, color }: FieldProps) {
  return (
    <>
      <Text style={[fieldStyles.label, { color: '#333' }]}>
        {label}
        {required && <Text style={{ color: '#c0392b' }}> *</Text>}
      </Text>
      <TextInput
        style={[fieldStyles.input, error ? fieldStyles.inputError : null]}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#aaa"
        accessibilityLabel={label}
      />
      {error ? <Text style={fieldStyles.fieldError}>{error}</Text> : null}
    </>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 14, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  inputError: { borderColor: '#c0392b' },
  fieldError: { fontSize: 12, color: '#c0392b', marginTop: 4 },
});

// ── LIMITS ────────────────────────────────────────────────────────────────────

const LIMITS_CARDIO = {
  totalCholesterol: { min: 50, max: 500, label: '50–500 mg/dL' },
  ldl:              { min: 10, max: 400, label: '10–400 mg/dL' },
  hdl:              { min: 10, max: 200, label: '10–200 mg/dL' },
  systolicBP:       { min: 70, max: 250, label: '70–250 mmHg' },
};

const LIMITS_HEMOGRAMA = {
  hemoglobina:   { min: 1,   max: 25,     label: '1–25 g/dL' },
  hematocrito:   { min: 5,   max: 75,     label: '5–75%' },
  vcm:           { min: 40,  max: 150,    label: '40–150 fL' },
  leucocitos:    { min: 500, max: 100000, label: '500–100.000 /mm³' },
  neutrofilosPct:{ min: 0,   max: 100,    label: '0–100%' },
  linfocitosPct: { min: 0,   max: 100,    label: '0–100%' },
};

const LIMITS_LIPIDO = {
  totalCholesterol: { min: 50,  max: 500,  label: '50–500 mg/dL' },
  ldl:              { min: 10,  max: 400,  label: '10–400 mg/dL' },
  hdl:              { min: 10,  max: 200,  label: '10–200 mg/dL' },
  triglycerides:    { min: 10,  max: 3000, label: '10–3.000 mg/dL' },
};

const LIMITS_METABOLICO = {
  glicemiaJejum: { min: 30,  max: 600, label: '30–600 mg/dL' },
  hbA1c:         { min: 3,   max: 20,  label: '3–20%' },
  insulinaJejum: { min: 0,   max: 300, label: '0–300 μUI/mL' },
};

// ── Module config ─────────────────────────────────────────────────────────────

const MODULE_CONFIG = {
  cardio:      { label: 'Risco Cardiovascular', color: '#c0392b' },
  hemograma:   { label: 'Hemograma Completo',   color: '#2980b9' },
  lipidograma: { label: 'Lipidograma',           color: '#8e44ad' },
  metabolico:  { label: 'Perfil Metabólico',     color: '#16a085' },
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  exam: SavedExam;
  onBack: () => void;
  onSaved: (updated: SavedExam, isStale: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditExamScreen({ exam, onBack, onSaved }: Props) {
  const cfg = MODULE_CONFIG[exam.type];

  // Common fields
  const [dateDisplay, setDateDisplay] = useState(exam.examDateDisplay);
  const [labName, setLabName] = useState(exam.labName);

  // Cardio
  const cardioInput = exam.type === 'cardio' ? (exam.input as PatientInput) : null;
  const [age, setAge] = useState(cardioInput ? String(cardioInput.age) : '');
  const [sex, setSex] = useState<Sex>(cardioInput ? cardioInput.sex : 'male');
  const [totalCholesterol, setTotalCholesterol] = useState(cardioInput ? String(cardioInput.totalCholesterol) : '');
  const [ldl, setLdl] = useState(cardioInput ? String(cardioInput.ldlCholesterol) : '');
  const [hdl, setHdl] = useState(cardioInput ? String(cardioInput.hdlCholesterol) : '');
  const [systolicBP, setSystolicBP] = useState(cardioInput ? String(cardioInput.systolicBP) : '');
  const [onBPTreatment, setOnBPTreatment] = useState(cardioInput ? cardioInput.onBPTreatment : false);
  const [smoker, setSmoker] = useState(cardioInput ? cardioInput.smoker : false);
  const [diabetic, setDiabetic] = useState(cardioInput ? cardioInput.diabetic : false);

  // Hemograma
  const hemoInput = exam.type === 'hemograma' ? (exam.input as HemogramaInput) : null;
  const [hSex, setHSex] = useState<Sex>(hemoInput ? hemoInput.sex : 'male');
  const [hemoglobina, setHemoglobina] = useState(hemoInput ? String(hemoInput.hemoglobina) : '');
  const [hematocrito, setHematocrito] = useState(hemoInput ? String(hemoInput.hematocrito) : '');
  const [vcm, setVcm] = useState(hemoInput ? String(hemoInput.vcm) : '');
  const [leucocitos, setLeucocitos] = useState(hemoInput ? String(hemoInput.leucocitos) : '');
  const [neutrofilosPct, setNeutrofilosPct] = useState(hemoInput?.neutrofilosPct != null ? String(hemoInput.neutrofilosPct) : '');
  const [linfocitosPct, setLinfocitosPct] = useState(hemoInput ? String(hemoInput.linfocitosPct) : '');

  // Lipidograma
  const lipidInput = exam.type === 'lipidograma' ? (exam.input as LipidogramaInput) : null;
  const [lipidTC, setLipidTC] = useState(lipidInput ? String(lipidInput.totalCholesterol) : '');
  const [lipidLdl, setLipidLdl] = useState(lipidInput ? String(lipidInput.ldl) : '');
  const [lipidHdl, setLipidHdl] = useState(lipidInput ? String(lipidInput.hdl) : '');
  const [lipidTg, setLipidTg] = useState(lipidInput ? String(lipidInput.triglycerides) : '');

  // Metabolico
  const metabInput = exam.type === 'metabolico' ? (exam.input as MetabolicInput) : null;
  const [glicemiaJejum, setGlicemiaJejum] = useState(metabInput ? String(metabInput.glicemiaJejum) : '');
  const [hbA1c, setHbA1c] = useState(metabInput?.hbA1c != null ? String(metabInput.hbA1c) : '');
  const [insulinaJejum, setInsulinaJejum] = useState(metabInput?.insulinaJejum != null ? String(metabInput.insulinaJejum) : '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function clearError(field: string) {
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (exam.type === 'cardio') {
      const tcN = parseFloat(totalCholesterol);
      const ldlN = parseFloat(ldl);
      const hdlN = parseFloat(hdl);
      const sbpN = parseFloat(systolicBP);
      if (outOfRange(tcN, LIMITS_CARDIO.totalCholesterol.min, LIMITS_CARDIO.totalCholesterol.max))
        newErrors.totalCholesterol = `Valor fora do intervalo esperado (${LIMITS_CARDIO.totalCholesterol.label})`;
      if (outOfRange(ldlN, LIMITS_CARDIO.ldl.min, LIMITS_CARDIO.ldl.max))
        newErrors.ldl = `Valor fora do intervalo esperado (${LIMITS_CARDIO.ldl.label})`;
      if (outOfRange(hdlN, LIMITS_CARDIO.hdl.min, LIMITS_CARDIO.hdl.max))
        newErrors.hdl = `Valor fora do intervalo esperado (${LIMITS_CARDIO.hdl.label})`;
      if (outOfRange(sbpN, LIMITS_CARDIO.systolicBP.min, LIMITS_CARDIO.systolicBP.max))
        newErrors.systolicBP = `Valor fora do intervalo esperado (${LIMITS_CARDIO.systolicBP.label})`;

    } else if (exam.type === 'hemograma') {
      const hgb = parseFloat(hemoglobina);
      const hct = parseFloat(hematocrito);
      const vcmN = parseFloat(vcm);
      const leuN = parseFloat(leucocitos);
      const neutPct = parseFloat(neutrofilosPct);
      const linfPct = parseFloat(linfocitosPct);
      if (outOfRange(hgb, LIMITS_HEMOGRAMA.hemoglobina.min, LIMITS_HEMOGRAMA.hemoglobina.max))
        newErrors.hemoglobina = `Valor fora do intervalo esperado (${LIMITS_HEMOGRAMA.hemoglobina.label})`;
      if (outOfRange(hct, LIMITS_HEMOGRAMA.hematocrito.min, LIMITS_HEMOGRAMA.hematocrito.max))
        newErrors.hematocrito = `Valor fora do intervalo esperado (${LIMITS_HEMOGRAMA.hematocrito.label})`;
      if (outOfRange(vcmN, LIMITS_HEMOGRAMA.vcm.min, LIMITS_HEMOGRAMA.vcm.max))
        newErrors.vcm = `Valor fora do intervalo esperado (${LIMITS_HEMOGRAMA.vcm.label})`;
      if (outOfRange(leuN, LIMITS_HEMOGRAMA.leucocitos.min, LIMITS_HEMOGRAMA.leucocitos.max))
        newErrors.leucocitos = `Valor fora do intervalo esperado (${LIMITS_HEMOGRAMA.leucocitos.label})`;
      if (neutrofilosPct.trim() !== '' && outOfRange(neutPct, LIMITS_HEMOGRAMA.neutrofilosPct.min, LIMITS_HEMOGRAMA.neutrofilosPct.max))
        newErrors.neutrofilosPct = `Valor fora do intervalo esperado (${LIMITS_HEMOGRAMA.neutrofilosPct.label})`;
      if (outOfRange(linfPct, LIMITS_HEMOGRAMA.linfocitosPct.min, LIMITS_HEMOGRAMA.linfocitosPct.max))
        newErrors.linfocitosPct = `Valor fora do intervalo esperado (${LIMITS_HEMOGRAMA.linfocitosPct.label})`;

    } else if (exam.type === 'lipidograma') {
      const tcN = parseFloat(lipidTC);
      const ldlN = parseFloat(lipidLdl);
      const hdlN = parseFloat(lipidHdl);
      const tgN = parseFloat(lipidTg);
      if (outOfRange(tcN, LIMITS_LIPIDO.totalCholesterol.min, LIMITS_LIPIDO.totalCholesterol.max))
        newErrors.lipidTC = `Valor fora do intervalo esperado (${LIMITS_LIPIDO.totalCholesterol.label})`;
      if (outOfRange(ldlN, LIMITS_LIPIDO.ldl.min, LIMITS_LIPIDO.ldl.max))
        newErrors.lipidLdl = `Valor fora do intervalo esperado (${LIMITS_LIPIDO.ldl.label})`;
      if (outOfRange(hdlN, LIMITS_LIPIDO.hdl.min, LIMITS_LIPIDO.hdl.max))
        newErrors.lipidHdl = `Valor fora do intervalo esperado (${LIMITS_LIPIDO.hdl.label})`;
      if (outOfRange(tgN, LIMITS_LIPIDO.triglycerides.min, LIMITS_LIPIDO.triglycerides.max))
        newErrors.lipidTg = `Valor fora do intervalo esperado (${LIMITS_LIPIDO.triglycerides.label})`;

    } else if (exam.type === 'metabolico') {
      const gjN = parseFloat(glicemiaJejum);
      const hbN = parseFloat(hbA1c);
      const insN = parseFloat(insulinaJejum);
      if (outOfRange(gjN, LIMITS_METABOLICO.glicemiaJejum.min, LIMITS_METABOLICO.glicemiaJejum.max))
        newErrors.glicemiaJejum = `Valor fora do intervalo esperado (${LIMITS_METABOLICO.glicemiaJejum.label})`;
      if (hbA1c.trim() !== '' && outOfRange(hbN, LIMITS_METABOLICO.hbA1c.min, LIMITS_METABOLICO.hbA1c.max))
        newErrors.hbA1c = `Valor fora do intervalo esperado (${LIMITS_METABOLICO.hbA1c.label})`;
      if (insulinaJejum.trim() !== '' && outOfRange(insN, LIMITS_METABOLICO.insulinaJejum.min, LIMITS_METABOLICO.insulinaJejum.max))
        newErrors.insulinaJejum = `Valor fora do intervalo esperado (${LIMITS_METABOLICO.insulinaJejum.label})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    const examDate = displayToISO(dateDisplay.trim());
    if (!examDate) {
      Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }

    if (!validate()) return;

    // Build new input and result based on type
    let newInput: SavedExam['input'];
    let newResult: SavedExam['result'];

    if (exam.type === 'cardio') {
      const ageN = parseInt(age);
      const tcN = parseFloat(totalCholesterol);
      const ldlN = parseFloat(ldl);
      const hdlN = parseFloat(hdl);
      const sbpN = parseFloat(systolicBP);
      if (!ageN || !tcN || !ldlN || !hdlN || !sbpN) {
        Alert.alert('Campos obrigatórios', 'Preencha todos os campos.');
        return;
      }
      if (ageN < 30 || ageN > 79) {
        Alert.alert('Idade fora do intervalo', 'As calculadoras são validadas para idades entre 30 e 79 anos.');
        return;
      }
      const input: PatientInput = {
        age: ageN, sex, totalCholesterol: tcN, ldlCholesterol: ldlN,
        hdlCholesterol: hdlN, systolicBP: sbpN, onBPTreatment, smoker, diabetic,
      };
      const framRisk = calculateFramingham(input);
      const ascvdRisk = calculateASCVD(input);
      newInput = input;
      newResult = {
        ...(exam.result as RiskResult),
        framingham: { tenYearRisk: framRisk, riskCategory: framinghamCategory(framRisk) },
        ascvd: { tenYearRisk: ascvdRisk, riskCategory: ascvdCategory(ascvdRisk) },
      };

    } else if (exam.type === 'hemograma') {
      const hgbN = parseFloat(hemoglobina);
      const hctN = parseFloat(hematocrito);
      const vcmN = parseFloat(vcm);
      const leuN = parseFloat(leucocitos);
      const linfN = parseFloat(linfocitosPct);
      if (!hgbN || !hctN || !vcmN || !leuN || !linfN || neutrofilosPct.trim() === '') {
        Alert.alert('Campos obrigatórios', 'Preencha: Hemoglobina, Hematócrito, VCM, Leucócitos, Neutrófilos e Linfócitos.');
        return;
      }
      const hemoExisting = exam.input as HemogramaInput;
      newInput = {
        ...hemoExisting,
        sex: hSex,
        hemoglobina: hgbN,
        hematocrito: hctN,
        vcm: vcmN,
        leucocitos: leuN,
        linfocitosPct: linfN,
        neutrofilosPct: neutrofilosPct.trim() !== '' ? parseFloat(neutrofilosPct) : undefined,
      };
      newResult = exam.result;

    } else if (exam.type === 'lipidograma') {
      const tcN = parseFloat(lipidTC);
      const ldlN = parseFloat(lipidLdl);
      const hdlN = parseFloat(lipidHdl);
      const tgN = parseFloat(lipidTg);
      if (!tcN || !ldlN || !hdlN || !tgN) {
        Alert.alert('Campos obrigatórios', 'Preencha: Colesterol Total, LDL, HDL e Triglicerídeos.');
        return;
      }
      if (hdlN <= 0) {
        Alert.alert('Valor inválido', 'HDL deve ser maior que zero.');
        return;
      }
      newInput = { ...(exam.input as LipidogramaInput), totalCholesterol: tcN, ldl: ldlN, hdl: hdlN, triglycerides: tgN };
      const castelliI  = Math.round((tcN / hdlN) * 100) / 100;
      const castelliII = Math.round((ldlN / hdlN) * 100) / 100;
      const tgHdl      = Math.round((tgN / hdlN) * 100) / 100;
      newResult = { ...(exam.result as LipidogramaResult), castelliI, castelliII, tgHdl };

    } else {
      const gjN = parseFloat(glicemiaJejum);
      if (!gjN || gjN <= 0) {
        Alert.alert('Campo obrigatório', 'Preencha a Glicemia em Jejum.');
        return;
      }
      const metabExisting = exam.input as MetabolicInput;
      const hbVal = hbA1c.trim() !== '' ? parseFloat(hbA1c) : undefined;
      const insVal = insulinaJejum.trim() !== '' ? parseFloat(insulinaJejum) : undefined;
      newInput = { ...metabExisting, glicemiaJejum: gjN, hbA1c: hbVal, insulinaJejum: insVal };
      const glicemiaCategory = classifyGlicemia(gjN);
      const hbA1cCategory = hbVal != null ? classifyHbA1c(hbVal) : undefined;
      const overallCategory = worstCategory(glicemiaCategory, hbA1cCategory);
      const homaIR = insVal != null ? Math.round((gjN * insVal) / 405 * 100) / 100 : undefined;
      newResult = { ...(exam.result as MetabolicResult), homaIR, glicemiaCategory, hbA1cCategory, overallCategory };
    }

    const newMarkers = extractMarkers(exam.type, newInput, newResult);

    // Save structural updates (input, markers, date, lab)
    await updateExam(exam.id, {
      examDate,
      examDateDisplay: dateDisplay.trim(),
      labName: labName.trim(),
      input: newInput,
      result: newResult,
      markers: newMarkers,
    });

    Alert.alert(
      'Deseja atualizar a análise da IA?',
      'Os valores foram salvos. Deseja refazer a análise com os novos dados?',
      [
        {
          text: 'Não',
          onPress: () => {
            const updated: SavedExam = { ...exam, examDate, examDateDisplay: dateDisplay.trim(), labName: labName.trim(), input: newInput, result: newResult, markers: newMarkers };
            onSaved(updated, true);
          },
        },
        {
          text: 'Sim',
          onPress: () => reanalyze(newInput, newResult, examDate, newMarkers),
        },
      ],
    );
  }

  async function reanalyze(
    newInput: SavedExam['input'],
    newResult: SavedExam['result'],
    examDate: string,
    newMarkers: Record<string, number>,
  ) {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert('Sem conexão', 'A análise por IA requer conexão com a internet.');
      const updated: SavedExam = { ...exam, examDate, examDateDisplay: dateDisplay.trim(), labName: labName.trim(), input: newInput, result: newResult, markers: newMarkers };
      onSaved(updated, true);
      return;
    }

    setLoading(true);
    try {
      let newAI: string;

      if (exam.type === 'cardio') {
        newAI = await getAIInterpretation(newInput as PatientInput, newResult as RiskResult);
      } else if (exam.type === 'hemograma') {
        newAI = await getHemogramaInterpretation(newInput as HemogramaInput);
      } else if (exam.type === 'lipidograma') {
        const lr = newResult as LipidogramaResult;
        newAI = await getLipidogramaInterpretation(newInput as LipidogramaInput, { castelliI: lr.castelliI, castelliII: lr.castelliII, tgHdl: lr.tgHdl });
      } else {
        const mr = newResult as MetabolicResult;
        newAI = await getMetabolicoInterpretation(newInput as MetabolicInput, { homaIR: mr.homaIR, glicemiaCategory: mr.glicemiaCategory, hbA1cCategory: mr.hbA1cCategory, overallCategory: mr.overallCategory });
      }

      const updatedResult = { ...newResult, aiInterpretation: newAI } as SavedExam['result'];
      await updateExam(exam.id, { result: updatedResult });

      const updated: SavedExam = { ...exam, examDate, examDateDisplay: dateDisplay.trim(), labName: labName.trim(), input: newInput, result: updatedResult, markers: newMarkers };
      onSaved(updated, false);
    } catch (e: any) {
      Alert.alert('Erro na IA', e.message ?? 'Não foi possível obter a análise.');
      const updated: SavedExam = { ...exam, examDate, examDateDisplay: dateDisplay.trim(), labName: labName.trim(), input: newInput, result: newResult, markers: newMarkers };
      onSaved(updated, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityLabel="Voltar" accessibilityRole="button">
        <Text style={[styles.backText, { color: cfg.color }]}>‹ Voltar</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: cfg.color }]}>Editar — {cfg.label}</Text>
      <Text style={styles.subtitle}>Corrija os valores e salve</Text>

      {/* Common fields */}
      <Text style={fieldStyles.label}>Data do exame</Text>
      <TextInput
        style={fieldStyles.input}
        value={dateDisplay}
        onChangeText={setDateDisplay}
        placeholder="DD/MM/AAAA"
        keyboardType="numeric"
        maxLength={10}
        accessibilityLabel="Data do exame"
      />

      <Text style={fieldStyles.label}>Laboratório (opcional)</Text>
      <TextInput
        style={fieldStyles.input}
        value={labName}
        onChangeText={setLabName}
        placeholder="Ex: Lab São Lucas"
        maxLength={60}
        accessibilityLabel="Nome do laboratório"
      />

      {/* ── Cardio fields ── */}
      {exam.type === 'cardio' && (
        <>
          <View style={[styles.sectionHeader, { borderBottomColor: cfg.color }]}>
            <Text style={[styles.sectionTitle, { color: cfg.color }]}>Dados do paciente</Text>
          </View>

          <Text style={fieldStyles.label}>Sexo</Text>
          <View style={styles.sexRow}>
            <TouchableOpacity style={[styles.sexButton, sex === 'male' && { backgroundColor: cfg.color, borderColor: cfg.color }]} onPress={() => setSex('male')}>
              <Text style={[styles.sexButtonText, sex === 'male' && styles.sexButtonTextActive]}>Masculino</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sexButton, sex === 'female' && { backgroundColor: cfg.color, borderColor: cfg.color }]} onPress={() => setSex('female')}>
              <Text style={[styles.sexButtonText, sex === 'female' && styles.sexButtonTextActive]}>Feminino</Text>
            </TouchableOpacity>
          </View>

          <Text style={fieldStyles.label}>Idade (30–79 anos)</Text>
          <TextInput style={fieldStyles.input} keyboardType="numeric" value={age} onChangeText={setAge} placeholder="Ex: 55" accessibilityLabel="Idade" />

          <Field label="Colesterol Total (mg/dL)" value={totalCholesterol} onChange={v => { setTotalCholesterol(v); clearError('totalCholesterol'); }} placeholder="Ex: 210" required error={errors.totalCholesterol} color={cfg.color} />
          <Field label="LDL (mg/dL)" value={ldl} onChange={v => { setLdl(v); clearError('ldl'); }} placeholder="Ex: 130" required error={errors.ldl} color={cfg.color} />
          <Field label="HDL (mg/dL)" value={hdl} onChange={v => { setHdl(v); clearError('hdl'); }} placeholder="Ex: 45" required error={errors.hdl} color={cfg.color} />
          <Field label="Pressão Sistólica (mmHg)" value={systolicBP} onChange={v => { setSystolicBP(v); clearError('systolicBP'); }} placeholder="Ex: 130" required error={errors.systolicBP} color={cfg.color} />

          <View style={styles.switchRow}>
            <Text style={fieldStyles.label}>Em tratamento para hipertensão</Text>
            <Switch value={onBPTreatment} onValueChange={setOnBPTreatment} />
          </View>
          <View style={styles.switchRow}>
            <Text style={fieldStyles.label}>Fumante</Text>
            <Switch value={smoker} onValueChange={setSmoker} />
          </View>
          <View style={styles.switchRow}>
            <Text style={fieldStyles.label}>Diabético</Text>
            <Switch value={diabetic} onValueChange={setDiabetic} />
          </View>
        </>
      )}

      {/* ── Hemograma fields ── */}
      {exam.type === 'hemograma' && (
        <>
          <View style={[styles.sectionHeader, { borderBottomColor: cfg.color }]}>
            <Text style={[styles.sectionTitle, { color: cfg.color }]}>Dados principais</Text>
          </View>

          <Text style={fieldStyles.label}>Sexo</Text>
          <View style={styles.sexRow}>
            <TouchableOpacity style={[styles.sexButton, hSex === 'male' && { backgroundColor: cfg.color, borderColor: cfg.color }]} onPress={() => setHSex('male')}>
              <Text style={[styles.sexButtonText, hSex === 'male' && styles.sexButtonTextActive]}>Masculino</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sexButton, hSex === 'female' && { backgroundColor: cfg.color, borderColor: cfg.color }]} onPress={() => setHSex('female')}>
              <Text style={[styles.sexButtonText, hSex === 'female' && styles.sexButtonTextActive]}>Feminino</Text>
            </TouchableOpacity>
          </View>

          <Field label="Hemoglobina (g/dL)" value={hemoglobina} onChange={v => { setHemoglobina(v); clearError('hemoglobina'); }} placeholder="Ex: 14.5" required error={errors.hemoglobina} color={cfg.color} />
          <Field label="Hematócrito (%)" value={hematocrito} onChange={v => { setHematocrito(v); clearError('hematocrito'); }} placeholder="Ex: 42" required error={errors.hematocrito} color={cfg.color} />
          <Field label="VCM (fL)" value={vcm} onChange={v => { setVcm(v); clearError('vcm'); }} placeholder="Ex: 88" required error={errors.vcm} color={cfg.color} />
          <Field label="Leucócitos (/mm³)" value={leucocitos} onChange={v => { setLeucocitos(v); clearError('leucocitos'); }} placeholder="Ex: 7000" required error={errors.leucocitos} color={cfg.color} />
          <Field label="Neutrófilos (%)" value={neutrofilosPct} onChange={v => { setNeutrofilosPct(v); clearError('neutrofilosPct'); }} placeholder="Ex: 60" required error={errors.neutrofilosPct} color={cfg.color} />
          <Field label="Linfócitos (%)" value={linfocitosPct} onChange={v => { setLinfocitosPct(v); clearError('linfocitosPct'); }} placeholder="Ex: 30" required error={errors.linfocitosPct} color={cfg.color} />
        </>
      )}

      {/* ── Lipidograma fields ── */}
      {exam.type === 'lipidograma' && (
        <>
          <View style={[styles.sectionHeader, { borderBottomColor: cfg.color }]}>
            <Text style={[styles.sectionTitle, { color: cfg.color }]}>Valores do lipidograma</Text>
          </View>
          <Field label="Colesterol Total (mg/dL)" value={lipidTC} onChange={v => { setLipidTC(v); clearError('lipidTC'); }} placeholder="Ex: 210" required error={errors.lipidTC} color={cfg.color} />
          <Field label="LDL (mg/dL)" value={lipidLdl} onChange={v => { setLipidLdl(v); clearError('lipidLdl'); }} placeholder="Ex: 130" required error={errors.lipidLdl} color={cfg.color} />
          <Field label="HDL (mg/dL)" value={lipidHdl} onChange={v => { setLipidHdl(v); clearError('lipidHdl'); }} placeholder="Ex: 50" required error={errors.lipidHdl} color={cfg.color} />
          <Field label="Triglicerídeos (mg/dL)" value={lipidTg} onChange={v => { setLipidTg(v); clearError('lipidTg'); }} placeholder="Ex: 150" required error={errors.lipidTg} color={cfg.color} />
        </>
      )}

      {/* ── Metabolico fields ── */}
      {exam.type === 'metabolico' && (
        <>
          <View style={[styles.sectionHeader, { borderBottomColor: cfg.color }]}>
            <Text style={[styles.sectionTitle, { color: cfg.color }]}>Valores metabólicos</Text>
          </View>
          <Field label="Glicemia em Jejum (mg/dL)" value={glicemiaJejum} onChange={v => { setGlicemiaJejum(v); clearError('glicemiaJejum'); }} placeholder="Ex: 95" required error={errors.glicemiaJejum} color={cfg.color} />
          <Field label="HbA1c — Hemoglobina Glicada (%) — opcional" value={hbA1c} onChange={v => { setHbA1c(v); clearError('hbA1c'); }} placeholder="Ex: 5.5" error={errors.hbA1c} color={cfg.color} />
          <Field label="Insulina em Jejum (μUI/mL) — opcional" value={insulinaJejum} onChange={v => { setInsulinaJejum(v); clearError('insulinaJejum'); }} placeholder="Ex: 8.0" error={errors.insulinaJejum} color={cfg.color} />
        </>
      )}

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: loading ? '#aaa' : cfg.color }]}
        onPress={handleSave}
        disabled={loading}
        accessibilityLabel="Salvar alterações"
        accessibilityRole="button"
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveButtonText}>Salvar alterações</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 48 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  sectionHeader: { marginTop: 28, marginBottom: 4, borderBottomWidth: 2, paddingBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold' },
  sexRow: { flexDirection: 'row', gap: 12 },
  sexButton: {
    flex: 1, padding: 12, borderRadius: 8, borderWidth: 1,
    borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center',
  },
  sexButtonText: { color: '#333', fontWeight: '500' },
  sexButtonTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  saveButton: { marginTop: 32, padding: 16, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
