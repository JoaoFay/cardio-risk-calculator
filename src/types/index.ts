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
  // Eritrograma
  hemacias: number;        // T/L
  hemoglobina: number;     // g/dL
  hematocrito: number;     // %
  vcm: number;             // fL
  hcm: number;             // pg
  chcm: number;            // g/dL
  rdw: number;             // %
  // Leucograma
  leucocitos: number;      // /mm³
  neutrofilosPct: number;  // %
  neutrofilosAbs: number;  // /mm³
  linfocitosPct: number;   // %
  monocitosPct: number;    // %
  eosinofilosPct: number;  // %
  basofilosPct: number;    // %
  // Plaquetas
  plaquetas: number;       // /mm³
  vpm: number;             // fL
}

export interface HemogramaResult {
  aiInterpretation: string;
}
