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

export interface LipidogramaInput {
  totalCholesterol: number;  // mg/dL
  ldl: number;               // mg/dL
  hdl: number;               // mg/dL
  triglycerides: number;     // mg/dL
  vldl?: number;             // mg/dL
}

export interface LipidogramaResult {
  castelliI: number;    // CT / HDL
  castelliII: number;   // LDL / HDL
  tgHdl: number;        // TG / HDL
  aiInterpretation: string;
}

export interface MetabolicInput {
  glicemiaJejum: number;      // mg/dL
  glicemiaPosP?: number;      // mg/dL — opcional
  hbA1c?: number;             // % — opcional
  insulinaJejum?: number;     // μUI/mL — opcional
}

export type GlicemiaCategory = 'normal' | 'prediabetes' | 'diabetes';

export interface MetabolicResult {
  homaIR?: number;
  glicemiaCategory: GlicemiaCategory;
  hbA1cCategory?: GlicemiaCategory;
  overallCategory: GlicemiaCategory;
  aiInterpretation: string;
}

export interface TireoideInput {
  tsh: number;             // mIU/L — obrigatório
  t4livre?: number;        // ng/dL — opcional
  t3total?: number;        // ng/dL — opcional
  t4total?: number;        // μg/dL — opcional (avançado)
  antiTPO?: number;        // IU/mL — opcional (avançado)
  antiTg?: number;         // IU/mL — opcional (avançado)
}

export type TireoideCategory = 'hipotireoidismo' | 'normal' | 'hipertireoidismo' | 'indeterminado';

export interface TireoideResult {
  tshCategory: TireoideCategory;
  aiInterpretation: string;
}

export type ExamType = 'cardio' | 'hemograma' | 'lipidograma' | 'metabolico' | 'tireoide';

export interface SavedExam {
  id: string;              // Date.now().toString()
  type: ExamType;
  examDate: string;        // 'YYYY-MM-DD' — para ordenação
  examDateDisplay: string; // 'DD/MM/YYYY' — para exibição
  labName: string;         // '' se não informado
  savedAt: string;         // ISO timestamp
  input: PatientInput | HemogramaInput | LipidogramaInput | MetabolicInput | TireoideInput;
  result: RiskResult | HemogramaResult | LipidogramaResult | MetabolicResult | TireoideResult;
  markers: Record<string, number>;
}
