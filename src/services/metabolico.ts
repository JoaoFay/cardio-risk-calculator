import { MetabolicInput, MetabolicResult, SavedExam } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function getMetabolicoInterpretation(
  input: MetabolicInput,
  result: Omit<MetabolicResult, 'aiInterpretation'>,
  previousExam?: SavedExam,
): Promise<string> {
  const response = await fetch(`${API_URL}/api/metabolico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, result, previousExam }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error || 'Erro ao contactar a API de IA');
  }

  const data = await response.json();
  return data.interpretation as string;
}
