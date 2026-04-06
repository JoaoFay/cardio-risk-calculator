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
