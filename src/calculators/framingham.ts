import { PatientInput } from '../types';

// Framingham Risk Score (2008 - D'Agostino et al., Circulation 2008;117:743-753)
// General cardiovascular disease risk (not just coronary) — freely published, no copyright on formula

export function calculateFramingham(p: PatientInput): number {
  // Coefficients from the published paper (Table 2)
  // Using the general CVD model (men and women separate)

  const ln_age = Math.log(p.age);
  const ln_tc = Math.log(p.totalCholesterol);
  const ln_hdl = Math.log(p.hdlCholesterol);
  const ln_sbp = Math.log(p.systolicBP);
  const smoking = p.smoker ? 1 : 0;
  const diabetes = p.diabetic ? 1 : 0;

  let sum: number;
  let baseline: number;
  let meanCoef: number;

  if (p.sex === 'male') {
    sum =
      3.06117 * ln_age +
      1.12370 * ln_tc +
      -0.93263 * ln_hdl +
      (p.onBPTreatment ? 1.99881 : 1.93303) * ln_sbp +
      0.65451 * smoking +
      0.57367 * diabetes;
    baseline = 0.88936;
    meanCoef = 23.9802;
  } else {
    sum =
      2.32888 * ln_age +
      1.20904 * ln_tc +
      -0.70833 * ln_hdl +
      (p.onBPTreatment ? 2.82263 : 2.76157) * ln_sbp +
      0.52873 * smoking +
      0.69154 * diabetes;
    baseline = 0.95012;
    meanCoef = 26.1931;
  }

  const risk = 1 - Math.pow(baseline, Math.exp(sum - meanCoef));
  return Math.round(risk * 1000) / 10; // percentage with 1 decimal
}

export function framinghamCategory(risk: number): 'low' | 'intermediate' | 'high' {
  if (risk < 10) return 'low';
  if (risk < 20) return 'intermediate';
  return 'high';
}
