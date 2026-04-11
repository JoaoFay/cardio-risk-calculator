import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';

interface GlossaryEntry {
  term: string;
  abbreviation?: string;
  category: string;
  categoryColor: string;
  simpleDefinition: string;
  normalRange?: string;
  clinicalNote?: string;
}

const GLOSSARY: GlossaryEntry[] = [
  // Hemograma
  {
    term: 'Hemoglobina',
    abbreviation: 'Hb',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Proteína dentro dos glóbulos vermelhos que carrega oxigênio dos pulmões para os tecidos do corpo. Valores baixos indicam anemia.',
    normalRange: 'Homens: 13,5–17,5 g/dL · Mulheres: 12,0–16,0 g/dL',
    clinicalNote: 'Reduzida em anemias, hemorragias e doenças crônicas. Elevada em desidratação e policitemia.',
  },
  {
    term: 'Hematócrito',
    abbreviation: 'Ht',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Porcentagem do volume total do sangue ocupada pelos glóbulos vermelhos. Reflete a concentração de células sanguíneas.',
    normalRange: 'Homens: 41–53% · Mulheres: 36–46%',
    clinicalNote: 'Segue o comportamento da hemoglobina. Elevado em desidratação.',
  },
  {
    term: 'Volume Corpuscular Médio',
    abbreviation: 'VCM',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Tamanho médio dos glóbulos vermelhos. Ajuda a classificar o tipo de anemia: microcítica (VCM baixo) ou macrocítica (VCM alto).',
    normalRange: '80–100 fL',
    clinicalNote: 'Baixo: deficiência de ferro ou talassemia. Alto: deficiência de B12/folato ou hepatopatia.',
  },
  {
    term: 'Leucócitos',
    abbreviation: 'WBC',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Glóbulos brancos — as células de defesa do organismo. Elevados em infecções e inflamações; baixos podem indicar problemas na medula óssea.',
    normalRange: '4.000–11.000 /mm³',
    clinicalNote: 'Leucocitose: infecção bacteriana, inflamação, stress. Leucopenia: viral, quimioterapia, aplasia.',
  },
  {
    term: 'Neutrófilos',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'O tipo mais comum de glóbulo branco. São a primeira linha de defesa contra bactérias e fungos.',
    normalRange: '45–70% dos leucócitos (1.800–7.700 /mm³)',
    clinicalNote: 'Elevados em infecções bacterianas, stress e corticoides. Baixos (neutropenia) aumentam o risco de infecções graves.',
  },
  {
    term: 'Linfócitos',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Glóbulos brancos especializados em combater vírus e células cancerosas. Produzem anticorpos.',
    normalRange: '20–45% dos leucócitos (1.000–4.800 /mm³)',
    clinicalNote: 'Elevados em infecções virais (mononucleose, COVID-19). Baixos em HIV e uso de corticoides.',
  },
  {
    term: 'Plaquetas',
    abbreviation: 'PLT',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Pequenas células responsáveis pela coagulação do sangue. Impedem sangramentos ao formar tampões nos vasos lesados.',
    normalRange: '150.000–400.000 /mm³',
    clinicalNote: 'Baixas (trombocitopenia): dengue, púrpura, hiperesplenismo. Altas (trombocitose): inflamação, anemia ferropriva.',
  },
  // Lipidograma
  {
    term: 'Colesterol Total',
    abbreviation: 'CT',
    category: 'Lipidograma',
    categoryColor: '#8e44ad',
    simpleDefinition: 'Soma de todo o colesterol no sangue (LDL + HDL + VLDL). O colesterol é essencial para células e hormônios, mas em excesso se deposita nas artérias.',
    normalRange: 'Desejável: < 200 mg/dL',
    clinicalNote: 'Isoladamente tem valor limitado — a distribuição entre LDL e HDL é mais importante.',
  },
  {
    term: 'LDL',
    abbreviation: 'LDL',
    category: 'Lipidograma',
    categoryColor: '#8e44ad',
    simpleDefinition: 'Chamado de "colesterol ruim". Transporta colesterol do fígado para os tecidos; em excesso, deposita-se nas paredes das artérias formando placas.',
    normalRange: 'Ótimo: < 100 mg/dL · Desejável: < 130 mg/dL',
    clinicalNote: 'Principal alvo do tratamento com estatinas. Meta varia conforme o risco cardiovascular do paciente.',
  },
  {
    term: 'HDL',
    abbreviation: 'HDL',
    category: 'Lipidograma',
    categoryColor: '#8e44ad',
    simpleDefinition: 'Chamado de "colesterol bom". Remove o excesso de colesterol das artérias e leva de volta ao fígado para ser eliminado.',
    normalRange: 'Homens: ≥ 40 mg/dL · Mulheres: ≥ 50 mg/dL',
    clinicalNote: 'Valores elevados são protetores. Elevado por exercício, dieta e ômega-3. Reduzido por tabagismo e sedentarismo.',
  },
  {
    term: 'Triglicerídeos',
    abbreviation: 'TG',
    category: 'Lipidograma',
    categoryColor: '#8e44ad',
    simpleDefinition: 'Tipo de gordura armazenada no sangue proveniente de carboidratos e gorduras da dieta. Elevados aumentam o risco cardiovascular e de pancreatite.',
    normalRange: 'Ótimo: < 150 mg/dL',
    clinicalNote: 'Muito sensíveis à dieta e ao álcool. Requerem jejum de 12h para dosagem precisa.',
  },
  {
    term: 'Índice de Castelli I',
    category: 'Lipidograma',
    categoryColor: '#8e44ad',
    simpleDefinition: 'Relação CT/HDL. Avalia o risco cardiovascular considerando a proporção entre colesterol total e o "colesterol bom".',
    normalRange: 'Homens: < 5,0 · Mulheres: < 4,4',
    clinicalNote: 'Quanto maior, maior o risco. Mais informativo que o colesterol total isolado.',
  },
  // Metabólico
  {
    term: 'Glicemia de Jejum',
    category: 'Perfil Metabólico',
    categoryColor: '#16a085',
    simpleDefinition: 'Nível de açúcar (glicose) no sangue após pelo menos 8 horas sem comer. Principal exame de triagem para diabetes.',
    normalRange: 'Normal: < 100 mg/dL · Pré-diabetes: 100–125 mg/dL · Diabetes: ≥ 126 mg/dL',
    clinicalNote: 'Um resultado elevado isolado deve ser confirmado com segunda dosagem ou HbA1c.',
  },
  {
    term: 'Hemoglobina Glicada',
    abbreviation: 'HbA1c',
    category: 'Perfil Metabólico',
    categoryColor: '#16a085',
    simpleDefinition: 'Reflete a média da glicemia nos últimos 2–3 meses. Não precisa de jejum e é mais estável que a glicemia de jejum.',
    normalRange: 'Normal: < 5,7% · Pré-diabetes: 5,7–6,4% · Diabetes: ≥ 6,5%',
    clinicalNote: 'Padrão ouro para monitoramento do diabetes. Pode ser falsamente baixa em anemias hemolíticas.',
  },
  {
    term: 'HOMA-IR',
    category: 'Perfil Metabólico',
    categoryColor: '#16a085',
    simpleDefinition: 'Índice que estima a resistência à insulina — quanto o corpo precisa de insulina para manter a glicemia normal. Calculado a partir da glicemia e da insulina de jejum.',
    normalRange: '< 2,7 (varia por laboratório)',
    clinicalNote: 'Elevado na síndrome metabólica, pré-diabetes e SOP. Não é diagnóstico isolado.',
  },
  {
    term: 'Insulina de Jejum',
    category: 'Perfil Metabólico',
    categoryColor: '#16a085',
    simpleDefinition: 'Nível do hormônio insulina no sangue em jejum. Elevado quando há resistência à insulina; o pâncreas compensa produzindo mais.',
    normalRange: '2–25 μUI/mL (varia por laboratório)',
    clinicalNote: 'Usada junto à glicemia para calcular o HOMA-IR. Não padronizada entre laboratórios.',
  },
  // Tireoide
  {
    term: 'TSH',
    abbreviation: 'TSH',
    category: 'Tireoide',
    categoryColor: '#1abc9c',
    simpleDefinition: 'Hormônio que a hipófise (no cérebro) libera para estimular a tireoide. É o melhor exame inicial para avaliar a função tireoidiana.',
    normalRange: '0,4–4,0 mIU/L',
    clinicalNote: 'Elevado no hipotireoidismo; reduzido no hipertireoidismo. Varia ao longo do dia (maior pela manhã).',
  },
  {
    term: 'T4 Livre',
    abbreviation: 'T4L',
    category: 'Tireoide',
    categoryColor: '#1abc9c',
    simpleDefinition: 'Hormônio tireoidiano ativo que circula livremente no sangue. Regula o metabolismo, temperatura e energia.',
    normalRange: '0,8–1,8 ng/dL',
    clinicalNote: 'Baixo no hipotireoidismo; elevado no hipertireoidismo. Não afetado por proteínas transportadoras como o T4 total.',
  },
  {
    term: 'T3 Total',
    abbreviation: 'T3',
    category: 'Tireoide',
    categoryColor: '#1abc9c',
    simpleDefinition: 'Forma mais ativa dos hormônios tireoidianos. Em grande parte produzido pela conversão do T4 nos tecidos.',
    normalRange: '80–200 ng/dL',
    clinicalNote: 'Útil para confirmar hipertireoidismo quando T4 livre é normal. Pode ser baixo em doenças graves não tireoidianas.',
  },
  {
    term: 'Anti-TPO',
    abbreviation: 'Anti-TPO',
    category: 'Tireoide',
    categoryColor: '#1abc9c',
    simpleDefinition: 'Anticorpos que atacam uma enzima da tireoide (tireoperoxidase). Presença indica doença autoimune da tireoide, como Hashimoto.',
    normalRange: '< 35 IU/mL (varia por laboratório)',
    clinicalNote: 'Marcador da tireoidite de Hashimoto e doença de Graves. Positivo em ~10% da população sem doença evidente.',
  },
  {
    term: 'Anti-Tireoglobulina',
    abbreviation: 'Anti-Tg',
    category: 'Tireoide',
    categoryColor: '#1abc9c',
    simpleDefinition: 'Anticorpos contra a tireoglobulina (proteína produzida pela tireoide). Marcador de autoimunidade tireoidiana, complementar ao Anti-TPO.',
    normalRange: '< 115 IU/mL (varia por laboratório)',
    clinicalNote: 'Usado em conjunto com Anti-TPO no diagnóstico de Hashimoto e monitoramento pós-tireoidectomia.',
  },
  // Cardiovascular
  {
    term: 'Pressão Sistólica',
    abbreviation: 'PAS',
    category: 'Cardiovascular',
    categoryColor: '#c0392b',
    simpleDefinition: 'O número maior na medição de pressão (ex.: 120/80). Representa a pressão nas artérias quando o coração se contrai e bombeia sangue.',
    normalRange: '< 120 mmHg (ótima)',
    clinicalNote: 'Hipertensão: ≥ 140 mmHg. Principal fator de risco cardiovascular modificável.',
  },
  {
    term: 'RDW',
    abbreviation: 'RDW',
    category: 'Hemograma',
    categoryColor: '#2980b9',
    simpleDefinition: 'Índice de variação do tamanho dos glóbulos vermelhos. Elevado indica que os eritrócitos têm tamanhos muito diferentes entre si (anisocitose).',
    normalRange: '11,5–14,5%',
    clinicalNote: 'Elevado em deficiência de ferro, B12 ou folato. Útil para diferenciar anemias.',
  },
];

const CATEGORIES = ['Todos', 'Hemograma', 'Lipidograma', 'Perfil Metabólico', 'Tireoide', 'Cardiovascular'];

interface Props {
  onBack: () => void;
}

export default function GlossaryScreen({ onBack }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedEntry, setSelectedEntry] = useState<GlossaryEntry | null>(null);

  const filtered = GLOSSARY.filter((entry) => {
    const matchesCategory = activeCategory === 'Todos' || entry.category === activeCategory;
    const query = search.toLowerCase();
    const matchesSearch =
      query === '' ||
      entry.term.toLowerCase().includes(query) ||
      (entry.abbreviation?.toLowerCase().includes(query) ?? false) ||
      entry.simpleDefinition.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityRole="button" accessibilityLabel="Voltar para início">
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>Início</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Glossário de Marcadores</Text>
        <Text style={styles.pageSubtitle}>
          Toque em qualquer marcador para ver uma explicação em linguagem simples.
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar marcador..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Buscar marcador no glossário"
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${cat}`}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>Nenhum marcador encontrado para "{search}".</Text>
        )}

        {filtered.map((entry) => (
          <TouchableOpacity
            key={entry.term}
            style={[styles.entryCard, { borderLeftColor: entry.categoryColor }]}
            onPress={() => setSelectedEntry(entry)}
            accessibilityRole="button"
            accessibilityLabel={`Ver definição de ${entry.term}`}
          >
            <View style={styles.entryCardContent}>
              <View style={styles.entryCardHeader}>
                <Text style={[styles.entryTerm, { color: entry.categoryColor }]}>
                  {entry.term}
                  {entry.abbreviation ? ` (${entry.abbreviation})` : ''}
                </Text>
                <View style={[styles.categoryTag, { backgroundColor: entry.categoryColor + '18' }]}>
                  <Text style={[styles.categoryTagText, { color: entry.categoryColor }]}>{entry.category}</Text>
                </View>
              </View>
              <Text style={styles.entryPreview} numberOfLines={2}>{entry.simpleDefinition}</Text>
            </View>
            <Text style={[styles.entryArrow, { color: entry.categoryColor }]}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedEntry !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedEntry && (
              <>
                <View style={[styles.modalColorBar, { backgroundColor: selectedEntry.categoryColor }]} />
                <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalTerm, { color: selectedEntry.categoryColor }]}>
                        {selectedEntry.term}
                        {selectedEntry.abbreviation ? ` (${selectedEntry.abbreviation})` : ''}
                      </Text>
                      <View style={[styles.categoryTag, { backgroundColor: selectedEntry.categoryColor + '18', alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={[styles.categoryTagText, { color: selectedEntry.categoryColor }]}>{selectedEntry.category}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedEntry(null)} style={styles.modalClose} accessibilityRole="button" accessibilityLabel="Fechar">
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalSectionLabel}>O que é?</Text>
                  <Text style={styles.modalDefinition}>{selectedEntry.simpleDefinition}</Text>

                  {selectedEntry.normalRange && (
                    <>
                      <Text style={styles.modalSectionLabel}>Valores de referência</Text>
                      <View style={[styles.modalRangeBox, { borderLeftColor: selectedEntry.categoryColor }]}>
                        <Text style={styles.modalRangeText}>{selectedEntry.normalRange}</Text>
                      </View>
                    </>
                  )}

                  {selectedEntry.clinicalNote && (
                    <>
                      <Text style={styles.modalSectionLabel}>Nota clínica</Text>
                      <Text style={styles.modalClinicalNote}>{selectedEntry.clinicalNote}</Text>
                    </>
                  )}

                  <View style={styles.modalDisclaimer}>
                    <Text style={styles.modalDisclaimerText}>
                      ⚠️ Valores de referência podem variar entre laboratórios. Consulte sempre seu médico.
                    </Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backArrow: { fontSize: 24, color: '#2c3e50', marginRight: 4 },
  backText: { fontSize: 15, color: '#2c3e50', fontFamily: 'Inter_500Medium' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', fontFamily: 'Inter_700Bold', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#666', fontFamily: 'Inter_400Regular', marginBottom: 16, lineHeight: 20 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryScroll: { marginBottom: 16 },
  categoryContent: { paddingRight: 8, gap: 8, flexDirection: 'row' },
  categoryChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryChipActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  categoryChipText: { fontSize: 13, color: '#555', fontFamily: 'Inter_400Regular' },
  categoryChipTextActive: { color: '#fff', fontFamily: 'Inter_500Medium' },
  emptyText: { textAlign: 'center', color: '#aaa', fontFamily: 'Inter_400Regular', marginTop: 32, fontSize: 15 },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  entryCardContent: { flex: 1 },
  entryCardHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4, gap: 6 },
  entryTerm: { fontSize: 15, fontWeight: 'bold', fontFamily: 'Inter_600SemiBold' },
  categoryTag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  categoryTagText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  entryPreview: { fontSize: 13, color: '#666', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  entryArrow: { fontSize: 24, marginLeft: 8 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalColorBar: { height: 5 },
  modalScroll: { flexGrow: 0 },
  modalContent: { padding: 20, paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  modalTerm: { fontSize: 20, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  modalClose: { padding: 4 },
  modalCloseText: { fontSize: 18, color: '#aaa' },
  modalSectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
  },
  modalDefinition: { fontSize: 16, color: '#333', fontFamily: 'Inter_400Regular', lineHeight: 24 },
  modalRangeBox: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 12,
  },
  modalRangeText: { fontSize: 14, color: '#444', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  modalClinicalNote: { fontSize: 14, color: '#555', fontFamily: 'Inter_400Regular', lineHeight: 22 },
  modalDisclaimer: {
    backgroundColor: '#fff8e1',
    borderRadius: 6,
    padding: 10,
    marginTop: 20,
  },
  modalDisclaimerText: { fontSize: 12, color: '#7d5a00', fontFamily: 'Inter_400Regular' },
});
