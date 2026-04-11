import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ExamType } from '../types';

interface PrepSection {
  title: string;
  items: string[];
}

interface ExamPrepGuide {
  label: string;
  icon: string;
  color: string;
  sections: PrepSection[];
}

const PREP_GUIDES: Record<ExamType, ExamPrepGuide> = {
  cardio: {
    label: 'Risco Cardiovascular',
    icon: '❤️',
    color: '#c0392b',
    sections: [
      {
        title: 'Jejum',
        items: [
          'Não é necessário jejum para o cálculo de risco cardiovascular.',
          'Se inclui colesterol ou glicemia, siga as orientações do Lipidograma ou Perfil Metabólico.',
        ],
      },
      {
        title: 'Antes da coleta',
        items: [
          'Evite exercícios intensos nas 24h anteriores à medição da pressão arterial.',
          'Não fume pelo menos 30 minutos antes.',
          'Evite cafeína 1–2h antes da aferição de PA.',
          'Permaneça sentado e em repouso por 5 minutos antes de medir a pressão.',
        ],
      },
      {
        title: 'Medicamentos',
        items: [
          'Informe ao médico todos os medicamentos em uso, especialmente anti-hipertensivos, estatinas e antidiabéticos.',
          'Não interrompa medicamentos sem orientação médica.',
        ],
      },
      {
        title: 'Observações',
        items: [
          'O risco cardiovascular é um cálculo educativo — não substitui avaliação médica.',
          'Leve os resultados anteriores de colesterol e pressão para comparação.',
        ],
      },
    ],
  },
  hemograma: {
    label: 'Hemograma Completo',
    icon: '🩸',
    color: '#2980b9',
    sections: [
      {
        title: 'Jejum',
        items: [
          'Geralmente não é obrigatório, mas muitos laboratórios recomendam 4–8h de jejum.',
          'Confirme com seu laboratório, pois as políticas variam.',
        ],
      },
      {
        title: 'Antes da coleta',
        items: [
          'Mantenha hidratação normal — a desidratação pode concentrar células sanguíneas e alterar resultados.',
          'Evite exercícios físicos intensos nas 24h anteriores (podem elevar leucócitos transitoriamente).',
          'Informe se tiver infecção recente, vacinação nas últimas 2 semanas ou uso de corticoides.',
        ],
      },
      {
        title: 'Medicamentos',
        items: [
          'Corticoides e quimioterápicos alteram significativamente o hemograma.',
          'Anticoagulantes podem influenciar a contagem de plaquetas.',
          'Informe todos os medicamentos ao médico solicitante.',
        ],
      },
      {
        title: 'Observações',
        items: [
          'Estresse físico ou emocional agudo pode elevar leucócitos temporariamente.',
          'Menstruação pode reduzir temporariamente hemoglobina e hematócrito em mulheres.',
        ],
      },
    ],
  },
  lipidograma: {
    label: 'Lipidograma',
    icon: '🧬',
    color: '#8e44ad',
    sections: [
      {
        title: 'Jejum',
        items: [
          '12 horas de jejum são necessárias para dosagem de triglicerídeos.',
          'Para colesterol total e HDL isolados, o jejum não é obrigatório em algumas diretrizes, mas é preferível.',
          'Beba apenas água durante o jejum.',
        ],
      },
      {
        title: 'Antes da coleta',
        items: [
          'Evite álcool nas 72h anteriores ao exame — eleva triglicerídeos significativamente.',
          'Evite refeições gordurosas no dia anterior.',
          'Evite exercícios intensos nas 24h anteriores.',
          'Não fume no dia do exame.',
        ],
      },
      {
        title: 'Medicamentos',
        items: [
          'Estatinas (sinvastatina, atorvastatina) reduzem LDL — não interrompa sem orientação.',
          'Fibratos e ômega-3 reduzem triglicerídeos.',
          'Corticoides e diuréticos tiazídicos podem elevar colesterol e triglicerídeos.',
          'Informe todos os medicamentos ao médico.',
        ],
      },
      {
        title: 'Observações',
        items: [
          'Gravidez e hipotireoidismo alteram o perfil lipídico.',
          'Doenças agudas (infarto, infecção grave) reduzem temporariamente LDL.',
          'Repita o exame em 2 semanas se suspeitar de erro na preparação.',
        ],
      },
    ],
  },
  metabolico: {
    label: 'Perfil Metabólico',
    icon: '🩺',
    color: '#16a085',
    sections: [
      {
        title: 'Jejum',
        items: [
          'Glicemia de jejum: 8–12 horas de jejum obrigatório.',
          'HbA1c (hemoglobina glicada): não exige jejum.',
          'Insulina de jejum: 8–12 horas de jejum.',
          'Glicemia pós-prandial: coleta 2h após refeição padrão, sem jejum prévio.',
        ],
      },
      {
        title: 'Antes da coleta',
        items: [
          'Mantenha sua rotina alimentar normal nos dias anteriores.',
          'Evite exercícios intensos nas 12h anteriores — podem reduzir a glicemia.',
          'Não consuma álcool no dia anterior.',
          'Faça o exame preferencialmente pela manhã, após jejum noturno.',
        ],
      },
      {
        title: 'Medicamentos',
        items: [
          'Corticoides elevam a glicemia — informe ao médico.',
          'Metformina e insulina reduzem a glicemia — não interrompa sem orientação.',
          'Betabloqueadores podem mascarar hipoglicemia.',
          'Informe todos os medicamentos e suplementos.',
        ],
      },
      {
        title: 'Observações',
        items: [
          'Estresse agudo (doença, cirurgia) pode elevar temporariamente a glicemia.',
          'A HbA1c reflete a média glicêmica dos últimos 2–3 meses e não é afetada pelo jejum do dia.',
          'Anemias hemolíticas podem falsear a HbA1c.',
        ],
      },
    ],
  },
  tireoide: {
    label: 'Tireoide',
    icon: '🦋',
    color: '#1abc9c',
    sections: [
      {
        title: 'Jejum',
        items: [
          'Jejum não é necessário para TSH, T4 livre ou T3.',
          'Faça o exame preferencialmente pela manhã: o TSH é mais elevado pela manhã e cai à tarde.',
        ],
      },
      {
        title: 'Antes da coleta',
        items: [
          'Colete sempre no mesmo horário para comparações ao longo do tempo.',
          'Evite biotina (vitamina B7) por pelo menos 72h antes — interfere em muitos ensaios de tireoide.',
          'Informe uso de contraste iodado recente (tomografias).',
        ],
      },
      {
        title: 'Medicamentos',
        items: [
          'Levotiroxina (T4): tome após a coleta, não antes, para não elevar artificialmente o T4 livre.',
          'Amiodarona e corticoides interferem nos hormônios tireoidianos.',
          'Lítio pode elevar TSH.',
          'Estrógenos (pílula, TRH) elevam TBG e podem alterar T4 total.',
        ],
      },
      {
        title: 'Observações',
        items: [
          'O TSH varia naturalmente ao longo do dia e entre estações do ano.',
          'Doenças graves não tireoidianas podem alterar T3 e T4 transitoriamente (síndrome do eutireóideo doente).',
          'Anticorpos anti-TPO e anti-Tg são úteis no diagnóstico de tireoidite autoimune (Hashimoto).',
        ],
      },
    ],
  },
};

const EXAM_ORDER: ExamType[] = ['cardio', 'hemograma', 'lipidograma', 'metabolico', 'tireoide'];

interface Props {
  onBack: () => void;
}

export default function ExamPrepGuideScreen({ onBack }: Props) {
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null);

  const guide = selectedExam ? PREP_GUIDES[selectedExam] : null;

  if (guide && selectedExam) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setSelectedExam(null)} style={styles.backRow} accessibilityRole="button" accessibilityLabel="Voltar para lista de exames">
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Guia de Preparação</Text>
        </TouchableOpacity>

        <View style={[styles.examHeader, { borderLeftColor: guide.color }]}>
          <Text style={styles.examHeaderIcon}>{guide.icon}</Text>
          <Text style={[styles.examHeaderTitle, { color: guide.color }]}>{guide.label}</Text>
        </View>

        {guide.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: guide.color }]}>{section.title}</Text>
            {section.items.map((item, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ⚠️ Estas orientações são educativas. Siga sempre as instruções específicas do seu laboratório e médico.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button" accessibilityLabel="Voltar para início">
        <Text style={styles.backArrow}>‹</Text>
        <Text style={styles.backText}>Início</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Guia de Preparação</Text>
      <Text style={styles.pageSubtitle}>
        Saiba como se preparar corretamente para cada tipo de exame.
      </Text>

      {EXAM_ORDER.map((examType) => {
        const g = PREP_GUIDES[examType];
        return (
          <TouchableOpacity
            key={examType}
            style={[styles.card, { borderLeftColor: g.color }]}
            onPress={() => setSelectedExam(examType)}
            accessibilityRole="button"
            accessibilityLabel={`Ver preparo para ${g.label}`}
          >
            <Text style={styles.cardIcon}>{g.icon}</Text>
            <View style={styles.cardTextContainer}>
              <Text style={[styles.cardTitle, { color: g.color }]}>{g.label}</Text>
              <Text style={styles.cardHint}>
                {g.sections.map(s => s.title).join(' · ')}
              </Text>
            </View>
            <Text style={[styles.cardArrow, { color: g.color }]}>›</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backArrow: { fontSize: 24, color: '#2c3e50', marginRight: 4 },
  backText: { fontSize: 15, color: '#2c3e50', fontFamily: 'Inter_500Medium' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', fontFamily: 'Inter_700Bold', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#666', fontFamily: 'Inter_400Regular', marginBottom: 24, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: { fontSize: 28, marginRight: 14 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  cardHint: { fontSize: 12, color: '#888', fontFamily: 'Inter_400Regular' },
  cardArrow: { fontSize: 26, marginLeft: 8 },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  examHeaderIcon: { fontSize: 32, marginRight: 12 },
  examHeaderTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bullet: { fontSize: 14, color: '#555', marginRight: 8, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 14, color: '#444', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  disclaimerBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: { fontSize: 13, color: '#7d5a00', fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
