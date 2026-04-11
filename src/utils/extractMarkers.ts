import {
  ExamType,
  PatientInput,
  HemogramaInput,
  LipidogramaInput,
  MetabolicInput,
  TireoideInput,
  RiskResult,
  HemogramaResult,
  LipidogramaResult,
  MetabolicResult,
  TireoideResult,
} from '../types';

export function extractMarkers(
  type: ExamType,
  input: PatientInput | HemogramaInput | LipidogramaInput | MetabolicInput | TireoideInput,
  result: RiskResult | HemogramaResult | LipidogramaResult | MetabolicResult | TireoideResult,
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
  } else if (type === 'metabolico') {
    const i = input as MetabolicInput;
    const r = result as MetabolicResult;
    const markers: Record<string, number> = { glicemiaJejum: i.glicemiaJejum };
    if (i.hbA1c != null) markers.hbA1c = i.hbA1c;
    if (r.homaIR != null) markers.homaIR = r.homaIR;
    return markers;
  } else {
    const i = input as TireoideInput;
    const markers: Record<string, number> = { tsh: i.tsh };
    if (i.t4livre != null) markers.t4livre = i.t4livre;
    if (i.t3total != null) markers.t3total = i.t3total;
    if (i.t4total != null) markers.t4total = i.t4total;
    if (i.antiTPO != null) markers.antiTPO = i.antiTPO;
    if (i.antiTg != null) markers.antiTg = i.antiTg;
    return markers;
  }
}
