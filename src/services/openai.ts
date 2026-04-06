import { PatientInput, RiskResult } from '../types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function buildPrompt(input: PatientInput, result: RiskResult): string {
  const sexLabel = input.sex === 'male' ? 'Masculino' : 'Feminino';
  return `Você é um assistente médico especializado em cardiologia preventiva. Analise os dados de risco cardiovascular abaixo e forneça uma interpretação clínica clara, objetiva e em português, adequada para ser lida pelo paciente.

DADOS DO PACIENTE:
- Idade: ${input.age} anos
- Sexo: ${sexLabel}
- Colesterol Total: ${input.totalCholesterol} mg/dL
- LDL: ${input.ldlCholesterol} mg/dL
- HDL: ${input.hdlCholesterol} mg/dL
- Pressão Sistólica: ${input.systolicBP} mmHg
- Em tratamento para hipertensão: ${input.onBPTreatment ? 'Sim' : 'Não'}
- Fumante: ${input.smoker ? 'Sim' : 'Não'}
- Diabético: ${input.diabetic ? 'Sim' : 'Não'}

RESULTADOS DAS CALCULADORAS:
- Framingham (risco CVD em 10 anos): ${result.framingham.tenYearRisk}% — categoria: ${result.framingham.riskCategory}
- ACC/AHA ASCVD (risco em 10 anos): ${result.ascvd.tenYearRisk}% — categoria: ${result.ascvd.riskCategory}

Por favor:
1. Interprete os resultados de forma acessível
2. Destaque os principais fatores de risco presentes
3. Sugira orientações gerais de estilo de vida
4. Recomende buscar avaliação médica presencial

IMPORTANTE: Deixe claro que esta é uma ferramenta de apoio educacional e não substitui consulta médica.`;
}

export async function getAIInterpretation(
  apiKey: string,
  input: PatientInput,
  result: RiskResult
): Promise<string> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: buildPrompt(input, result),
        },
      ],
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Erro ao contactar a API de IA');
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}
