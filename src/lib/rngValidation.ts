export interface ChiSquareResult {
  statistic: number;
  degreesOfFreedom: number;
  pValue: number;
  isRandom: boolean;
}
export interface RunsTestResult {
  zScore: number;
  isRandom: boolean;
  runsCount: number;
  expectedRuns: number;
}

// Chi-Square Goodness of Fit Test for categorical frequencies
export function chiSquareTest(observed: number[], expected: number[]): ChiSquareResult {
  if (observed.length !== expected.length) {
    throw new Error('Observed and expected arrays must have same length');
  }
  if (expected.some(e => e <= 0)) {
    throw new Error('Expected frequencies must be > 0');
  }
  let chiSq = 0;
  for (let i = 0; i < observed.length; i++) {
    chiSq += Math.pow(observed[i] - expected[i], 2) / expected[i];
  }
  const df = Math.max(1, observed.length - 1);
  const pValue = chiSquareCDF(chiSq, df);
  const isRandom = pValue > 0.05; // 95% confidence threshold

  return {
    statistic: +chiSq.toFixed(6),
    degreesOfFreedom: df,
    pValue: +pValue.toFixed(6),
    isRandom
  };
}

// Wald–Wolfowitz Runs Test around the median for binary-like sequences (or H/D/V treating first outcome as baseline)
export function runsTest(sequence: (string | number)[]): RunsTestResult {
  if (sequence.length < 10) {
    throw new Error('Sequence too short for runs test (min 10)');
  }

  // Normalize to two categories relative to the first value
  const a = sequence[0];
  const binSeq = sequence.map(x => x === a ? 1 : 0);
  let runsCount = 1;
  for (let i = 1; i < binSeq.length; i++) {
    if (binSeq[i] !== binSeq[i - 1]) runsCount++;
  }
  const n1 = binSeq.filter(x => x === 1).length;
  const n0 = binSeq.length - n1;

  // Expected runs and variance under randomness
  const expectedRuns = 2 * n1 * n0 / (n1 + n0) + 1;
  const variance = 2 * n1 * n0 * (2 * n1 * n0 - n1 - n0) / (Math.pow(n1 + n0, 2) * (n1 + n0 - 1));
  const zScore = (runsCount - expectedRuns) / Math.sqrt(variance);
  return {
    zScore,
    isRandom: Math.abs(zScore) < 1.96,
    runsCount,
    expectedRuns
  };
}

// Simple anomaly detection using Z-score thresholding
export function detectAnomalies(values: number[], threshold = 3): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance) || 1;
  return values.map((v, i) => ({
    i,
    z: Math.abs((v - mean) / stdDev)
  })).filter(p => p.z > threshold).map(p => p.i);
}

// --- Helpers: approximate Chi-square CDF using Wilson-Hilferty transform ---
function chiSquareCDF(x: number, df: number): number {
  if (df <= 0) return 0;
  const z = Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df));
  const std = z / Math.sqrt(2 / (9 * df));
  return standardNormalCDF(std);
}
function standardNormalCDF(x: number): number {
  // Approximation using error function
  return 0.5 * (1 + erf(x / Math.SQRT2));
}
function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}