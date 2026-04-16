import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SavedExam, ExamType, RiskResult, LipidogramaResult, MetabolicResult } from '../types';

const MODULE_CONFIG: Record<ExamType, { label: string; color: string }> = {
  cardio:      { label: 'Risco Cardiovascular', color: '#c0392b' },
  hemograma:   { label: 'Hemograma Completo',   color: '#2980b9' },
  lipidograma: { label: 'Lipidograma',           color: '#8e44ad' },
  metabolico:  { label: 'Perfil Metabólico',     color: '#16a085' },
  tireoide:    { label: 'Tireoide',              color: '#1abc9c' },
};

const RISK_LABELS: Record<string, string> = {
  low: 'Baixo',
  borderline: 'Limítrofe',
  intermediate: 'Intermediário',
  high: 'Alto',
  normal: 'Normal',
  prediabetes: 'Pré-diabetes',
  diabetes: 'Diabetes',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMarkersRows(exam: SavedExam): { label: string; value: string }[] {
  const m = exam.markers;

  if (exam.type === 'cardio') {
    const r = exam.result as RiskResult;
    return [
      { label: 'Framingham (10 anos)', value: `${m.framinghamRisk}% — ${RISK_LABELS[r.framingham.riskCategory] ?? r.framingham.riskCategory}` },
      { label: 'ASCVD (10 anos)', value: `${m.ascvdRisk}% — ${RISK_LABELS[r.ascvd.riskCategory] ?? r.ascvd.riskCategory}` },
      { label: 'Colesterol Total', value: `${m.totalCholesterol} mg/dL` },
      { label: 'LDL', value: `${m.ldl} mg/dL` },
      { label: 'HDL', value: `${m.hdl} mg/dL` },
    ];
  }

  if (exam.type === 'hemograma') {
    const rows = [
      { label: 'Hemoglobina', value: `${m.hemoglobina} g/dL` },
      { label: 'Hematócrito', value: `${m.hematocrito}%` },
      { label: 'Leucócitos', value: `${m.leucocitos} /mm³` },
    ];
    if (m.plaquetas) rows.push({ label: 'Plaquetas', value: `${m.plaquetas} /mm³` });
    return rows;
  }

  if (exam.type === 'lipidograma') {
    const r = exam.result as LipidogramaResult;
    const rows = [
      { label: 'Colesterol Total', value: `${m.totalCholesterol} mg/dL` },
      { label: 'LDL', value: `${m.ldl} mg/dL` },
      { label: 'HDL', value: `${m.hdl} mg/dL` },
      { label: 'Triglicerídeos', value: `${m.triglycerides} mg/dL` },
      { label: 'Castelli I (CT/HDL)', value: `${r.castelliI.toFixed(2)}` },
      { label: 'Castelli II (LDL/HDL)', value: `${r.castelliII.toFixed(2)}` },
    ];
    if (m.tgHdl != null) rows.push({ label: 'TG/HDL', value: `${r.tgHdl.toFixed(2)}` });
    return rows;
  }

  // metabolico
  const r = exam.result as MetabolicResult;
  const rows = [
    { label: 'Glicemia em Jejum', value: `${m.glicemiaJejum} mg/dL — ${RISK_LABELS[r.glicemiaCategory] ?? r.glicemiaCategory}` },
  ];
  if (m.glicemiaPosP != null) rows.push({ label: 'Glicemia 2h pós-prandial', value: `${m.glicemiaPosP} mg/dL` });
  if (m.hbA1c != null) rows.push({ label: 'HbA1c', value: `${m.hbA1c}%` });
  if (m.homaIR != null) rows.push({ label: 'HOMA-IR', value: `${m.homaIR.toFixed(2)}` });
  rows.push({ label: 'Classificação geral', value: RISK_LABELS[r.overallCategory] ?? r.overallCategory });
  return rows;
}

function buildExamSection(exam: SavedExam): string {
  const cfg = MODULE_CONFIG[exam.type];
  const markers = buildMarkersRows(exam);
  const aiText = escapeHtml((exam.result as any).aiInterpretation ?? '');

  const markersHtml = markers
    .map(
      ({ label, value }) => `
      <tr>
        <td class="marker-label">${escapeHtml(label)}</td>
        <td class="marker-value">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('');

  const labLine = exam.labName ? ` &middot; ${escapeHtml(exam.labName)}` : '';

  return `
    <div class="exam-section">
      <div class="exam-header" style="border-left-color: ${cfg.color};">
        <span class="exam-module" style="color: ${cfg.color};">${escapeHtml(cfg.label)}</span>
        <span class="exam-meta">${escapeHtml(exam.examDateDisplay)}${labLine}</span>
      </div>
      <table class="markers-table">
        <tbody>
          ${markersHtml}
        </tbody>
      </table>
      <div class="ai-block">
        <div class="ai-label" style="color: ${cfg.color};">Interpretação por IA</div>
        <div class="ai-text">${aiText}</div>
      </div>
    </div>`;
}

function groupByType(exams: SavedExam[]): Map<ExamType, SavedExam[]> {
  const map = new Map<ExamType, SavedExam[]>();
  for (const exam of exams) {
    const list = map.get(exam.type) ?? [];
    list.push(exam);
    map.set(exam.type, list);
  }
  return map;
}

function buildHtml(exams: SavedExam[], generatedAt: string): string {
  const grouped = groupByType(exams);
  const order: ExamType[] = ['cardio', 'hemograma', 'lipidograma', 'metabolico'];

  const sections = order
    .filter(t => grouped.has(t))
    .flatMap(t => (grouped.get(t) ?? []).map(e => buildExamSection(e)))
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #222;
      background: #fff;
      padding: 36px 40px;
    }

    /* ── Header ── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 3px solid #f39c12;
      padding-bottom: 12px;
      margin-bottom: 28px;
    }
    .report-title { font-size: 22px; font-weight: 700; color: #f39c12; }
    .report-subtitle { font-size: 11px; color: #888; margin-top: 2px; }
    .report-date { font-size: 11px; color: #aaa; text-align: right; }

    /* ── Exam section ── */
    .exam-section {
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      margin-bottom: 24px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .exam-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 10px 14px;
      background: #fafafa;
      border-left: 5px solid #ccc;
      border-bottom: 1px solid #eee;
    }
    .exam-module { font-size: 14px; font-weight: 700; }
    .exam-meta { font-size: 11px; color: #888; }

    /* ── Markers table ── */
    .markers-table {
      width: 100%;
      border-collapse: collapse;
    }
    .markers-table tr:not(:last-child) td {
      border-bottom: 1px solid #f0f0f0;
    }
    .marker-label {
      padding: 8px 14px;
      color: #555;
      width: 55%;
    }
    .marker-value {
      padding: 8px 14px;
      font-weight: 600;
      color: #222;
    }

    /* ── AI block ── */
    .ai-block {
      padding: 12px 14px;
      border-top: 1px solid #eee;
      background: #fdfdf8;
    }
    .ai-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .ai-text {
      font-size: 12px;
      color: #444;
      line-height: 1.65;
      white-space: pre-wrap;
    }

    /* ── Footer ── */
    .report-footer {
      margin-top: 32px;
      padding: 12px 16px;
      background: #fff8e1;
      border-left: 4px solid #f39c12;
      border-radius: 4px;
      font-size: 11px;
      color: #7d5a00;
      line-height: 1.6;
    }
    .report-footer strong { display: block; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-title">⭐ LabIA — Relatório de Exames</div>
      <div class="report-subtitle">Histórico de exames e interpretações por IA</div>
    </div>
    <div class="report-date">Gerado em: ${escapeHtml(generatedAt)}</div>
  </div>

  ${sections}

  <div class="report-footer">
    <strong>⚠️ Aviso importante</strong>
    Este relatório tem caráter exclusivamente educacional e não substitui avaliação médica presencial.
    Os valores e interpretações geradas por IA devem ser discutidos com um profissional de saúde habilitado.
  </div>
</body>
</html>`;
}

export type ExportFilter = {
  types?: ExamType[];
  fromDate?: string; // 'YYYY-MM-DD'
  toDate?: string;   // 'YYYY-MM-DD'
};

export async function exportExamsPdf(
  allExams: SavedExam[],
  filter: ExportFilter = {},
): Promise<void> {
  let exams = [...allExams].sort((a, b) => a.examDate.localeCompare(b.examDate));

  if (filter.types && filter.types.length > 0) {
    exams = exams.filter(e => filter.types!.includes(e.type));
  }
  if (filter.fromDate) {
    exams = exams.filter(e => e.examDate >= filter.fromDate!);
  }
  if (filter.toDate) {
    exams = exams.filter(e => e.examDate <= filter.toDate!);
  }

  if (exams.length === 0) {
    throw new Error('Nenhum exame encontrado para os filtros selecionados.');
  }

  const now = new Date();
  const generatedAt = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = buildHtml(exams, generatedAt);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartilhamento não disponível neste dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Exportar relatório LabIA',
    UTI: 'com.adobe.pdf',
  });
}
