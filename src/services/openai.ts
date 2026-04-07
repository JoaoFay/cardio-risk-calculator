import { PatientInput, RiskResult, SavedExam } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function getAIInterpretation(
  input: PatientInput,
  result: RiskResult,
  previousExam?: SavedExam,
): Promise<string> {
  const response = await fetch(`${API_URL}/api/interpret`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input, result, previousExam }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error || 'Erro ao contactar a API de IA');
  }

  const data = await response.json();
  return data.interpretation as string;
}
