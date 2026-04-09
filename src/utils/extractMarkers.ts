import {
  ExamType,
  PatientInput,
  HemogramaInput,
  LipidogramaInput,
  MetabolicInput,
  RiskResult,
  HemogramaResult,
  LipidogramaResult,
  MetabolicResult,
} from '../types';

export function extractMarkers(
  type: ExamType,
  input: PatientInput | HemogramaInput | LipidogramaInput | MetabolicInput,
  result: RiskResult | HemogramaResult | LipidogramaResult | MetabolicResult,
): Record<string, number> {
  if (type === 'cardio') {
    const i = input as PatientInput;
    const r = result as RiskResult;
    return {
      framinghamRisk: r.framingham.tenYearRisk,
      ascvdRisk: r.ascvd.tenYearRisk,
      totalCholesterol: i.totalCholesterol,
      ldl: i.ldlCholesterol,
      hdl: i.hdlCholesterol,
    };
  } else if (type === 'hemograma') {
    const i = input as HemogramaInput;
    const markers: Record<string, number> = {
      hemoglobina: i.hemoglobina,
      hematocrito: i.hematocrito,
      leucocitos: i.leucocitos,
    };
    if (i.plaquetas != null) markers.plaquetas = i.plaquetas;
    return markers;
  } else if (type === 'lipidograma') {
    const i = input as LipidogramaInput;
    const r = result as LipidogramaResult;
    return {
      totalCholesterol: i.totalCholesterol,
      ldl: i.ldl,
      hdl: i.hdl,
      triglycerides: i.triglycerides,
      castelliI: r.castelliI,
    };
  } else {
    const i = input as MetabolicInput;
    const r = result as MetabolicResult;
    const markers: Record<string, number> = { glicemiaJejum: i.glicemiaJejum };
    if (i.hbA1c != null) markers.hbA1c = i.hbA1c;
    if (r.homaIR != null) markers.homaIR = r.homaIR;
    return markers;
  }
}
