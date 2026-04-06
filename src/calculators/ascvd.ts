import { PatientInput } from '../types';

// ACC/AHA 2013 Pooled Cohort Equations
// Goff et al., JACC 2014;63:2935-2959 — formulas publicly published, no copyright on algorithm

export function calculateASCVD(p: PatientInput): number {
  const ln_age = Math.log(p.age);
  const ln_tc = Math.log(p.totalCholesterol);
  const ln_hdl = Math.log(p.hdlCholesterol);
  const ln_sbp = Math.log(p.systolicBP);
  const smoking = p.smoker ? 1 : 0;
  const diabetes = p.diabetic ? 1 : 0;

  let indSum: number;
  let baseline: number;
  let meanCoef: number;

  if (p.sex === 'male') {
    // White male coefficients
    indSum =
      12.344 * ln_age +
      11.853 * ln_tc +
      -2.664 * Math.log(p.age) * ln_tc +
      -7.99 * ln_hdl +
      1.769 * ln_age * ln_hdl +
      (p.onBPTreatment ? 1.797 : 1.764) * ln_sbp +
      7.837 * smoking +
      -1.795 * ln_age * smoking +
      0.661 * diabetes;
    baseline = 0.9144;
    meanCoef = 61.18;
  } else {
    // White female coefficients
    indSum =
      -29.799 * ln_age +
      4.884 * ln_age * ln_age +
      13.54 * ln_tc +
      -3.114 * ln_age * ln_tc +
      -13.578 * ln_hdl +
      3.149 * ln_age * ln_hdl +
      (p.onBPTreatment ? 2.019 : 1.957) * ln_sbp +
      7.574 * smoking +
      -1.665 * ln_age * smoking +
      0.661 * diabetes;
    baseline = 0.9665;
    meanCoef = -29.18;
  }

  const risk = 1 - Math.pow(baseline, Math.exp(indSum - meanCoef));
  return Math.round(risk * 1000) / 10;
}

export function ascvdCategory(risk: number): 'low' | 'borderline' | 'intermediate' | 'high' {
  if (risk < 5) return 'low';
  if (risk < 7.5) return 'borderline';
  if (risk < 20) return 'intermediate';
  return 'high';
}
