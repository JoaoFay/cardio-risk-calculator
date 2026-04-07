import { HemogramaInput } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function getHemogramaInterpretation(input: HemogramaInput): Promise<string> {
  const response = await fetch(`${API_URL}/api/hemograma`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    let errorMsg = 'Erro ao contactar a API de IA';
    try {
      const error = await response.json();
      errorMsg = error?.error || errorMsg;
    } catch {
      // response body is not JSON — use default message
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.interpretation as string;
}
