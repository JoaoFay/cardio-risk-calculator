import { MetabolicInput, MetabolicResult, SavedExam } from '../types';
import * as Sentry from '@sentry/react-native';

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
    if (response.status === 429) {
      throw new Error('Você atingiu o limite de análises por hora. Aguarde alguns minutos e tente novamente.');
    }
    let errorMsg = 'Erro ao contactar a API de IA';
    try {
      const error = await response.json();
      errorMsg = error?.error || errorMsg;
    } catch {
      // response body is not JSON — use default message
    }
    const err = new Error(errorMsg);
    Sentry.captureException(err, { extra: { status: response.status, endpoint: '/api/metabolico' } });
    throw err;
  }

  const data = await response.json();
  return data.interpretation as string;
}
