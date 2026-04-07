export type Sex = 'male' | 'female';

export interface PatientInput {
  age: number;
  sex: Sex;
  totalCholesterol: number; // mg/dL
  hdlCholesterol: number;   // mg/dL
  ldlCholesterol: number;   // mg/dL
  systolicBP: number;       // mmHg
  onBPTreatment: boolean;
  smoker: boolean;
  diabetic: boolean;
}

export interface RiskResult {
  framingham: {
    tenYearRisk: number; // percentage
    riskCategory: 'low' | 'intermediate' | 'high';
  };
  ascvd: {
    tenYearRisk: number; // percentage
    riskCategory: 'low' | 'borderline' | 'intermediate' | 'high';
  };
  aiInterpretation: string;
}

export interface HemogramaInput {
  sex: Sex;
  // Eritrograma — obrigatorios
  hemoglobina: number;     // g/dL
  hematocrito: number;     // %
  vcm: number;             // fL
  // Eritrograma — opcionais
  hemacias?: number;       // T/L
  hcm?: number;            // pg
  chcm?: number;           // g/dL
  rdw?: number;            // %
  // Leucograma — obrigatorios
  leucocitos: number;      // /mm³
  linfocitosPct: number;   // %
  // Leucograma — ao menos um obrigatorio
  neutrofilosPct?: number; // %
  neutrofilosAbs?: number; // /mm³
  // Leucograma — opcionais
  monocitosPct?: number;   // %
  eosinofilosPct?: number; // %
  basofilosPct?: number;   // %
  // Plaquetas — opcionais
  plaquetas?: number;      // /mm³
  vpm?: number;            // fL
}

export interface HemogramaResult {
  aiInterpretation: string;
}
