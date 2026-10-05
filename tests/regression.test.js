/**
 * StatLens Unit Test Suite: Simple Linear Regression & Error Metrics Engine
 * Verifies all required statistical conditions for OLS parameters and Phase 5 Error Metrics.
 */

import {
  calculateSlope,
  calculateIntercept,
  predictY,
  calculateResiduals,
  calculateSSE,
  calculateMAE,
  calculateMSE,
  calculateRMSE,
  calculateErrorMetrics,
  summarizeResiduals,
  formatRegressionEquation,
  performRegressionAnalysis
} from '../src/stats/regression.js';

import { calculateMean } from '../src/stats/correlation.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ FAIL: ${message}`);
  }
}

function approxEqual(a, b, epsilon = 1e-4) {
  if (a === null || b === null) return a === b;
  return Math.abs(a - b) < epsilon;
}

console.log('========================================================');
console.log('Running Statistical Unit Tests — Regression & Error Metrics');
console.log('========================================================\n');

// 1. Mean Compatibility Test
const xSample = [1, 2, 3, 4, 5];
const ySample = [2, 4, 5, 4, 5];
const mx = calculateMean(xSample);
const my = calculateMean(ySample);
assert(approxEqual(mx, 3.0), '1. Mean of X is 3.0');
assert(approxEqual(my, 4.0), '1b. Mean of Y is 4.0');

// 2. Slope Calculation Test
// Pairs: (1,2), (2,4), (3,5), (4,4), (5,5)
// Σ(x - 3)(y - 4) = 6.0, Σ(x - 3)² = 10.0 -> Slope β₁ = 0.60
const pairs1 = [
  { x: 1, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 5 },
  { x: 4, y: 4 },
  { x: 5, y: 5 }
];
const slopeRes = calculateSlope(pairs1, mx, my);
assert(approxEqual(slopeRes.slope, 0.6), '2. OLS Slope β₁ = 0.60');

// 3. Intercept Calculation Test
// β₀ = 4.0 - (0.6 * 3.0) = 2.20
const intercept = calculateIntercept(my, mx, slopeRes.slope);
assert(approxEqual(intercept, 2.2), '3. OLS Intercept β₀ = 2.20');

// 4. Regression Equation Formatting Test
const eqStr = formatRegressionEquation(intercept, slopeRes.slope, 'Hours', 'Score');
assert(eqStr.includes('2.2000') && eqStr.includes('+') && eqStr.includes('0.6000'), '4. Regression Equation string formatted');

// 5. Perfect Positive Linear Dataset (y = 10 + 2x)
const perfPos = [
  { x: 1, y: 12 },
  { x: 2, y: 14 },
  { x: 3, y: 16 },
  { x: 4, y: 18 }
];
const resPerfPos = performRegressionAnalysis(perfPos, 'x', 'y');
assert(approxEqual(resPerfPos.stats.slope, 2.0), '5. Perfect positive slope β₁ = 2.0');
assert(approxEqual(resPerfPos.stats.intercept, 10.0), '5b. Perfect positive intercept β₀ = 10.0');
assert(approxEqual(resPerfPos.stats.sse, 0.0), '5c. Perfect positive SSE = 0.0');
assert(approxEqual(resPerfPos.stats.mae, 0.0), '5d. Perfect positive MAE = 0.0');
assert(approxEqual(resPerfPos.stats.mse, 0.0), '5e. Perfect positive MSE = 0.0');
assert(approxEqual(resPerfPos.stats.rmse, 0.0), '5f. Perfect positive RMSE = 0.0');

// 6. Perfect Negative Linear Dataset (y = 50 - 5x)
const perfNeg = [
  { x: 2, y: 40 },
  { x: 4, y: 30 },
  { x: 6, y: 20 },
  { x: 8, y: 10 }
];
const resPerfNeg = performRegressionAnalysis(perfNeg, 'x', 'y');
assert(approxEqual(resPerfNeg.stats.slope, -5.0), '6. Perfect negative slope β₁ = -5.0');
assert(approxEqual(resPerfNeg.stats.intercept, 50.0), '6b. Perfect negative intercept β₀ = 50.0');
assert(approxEqual(resPerfNeg.stats.sse, 0.0), '6c. Perfect negative SSE = 0.0');
assert(approxEqual(resPerfNeg.stats.mae, 0.0), '6d. Perfect negative MAE = 0.0');

// 7. Known Non-Zero Residual Dataset & SSE Calculation
// Residuals for pairs1: e = [-0.8, 0.6, 1.0, -0.6, -0.2]
// e² = [0.64, 0.36, 1.00, 0.36, 0.04] -> SSE = 2.40
const residuals1 = calculateResiduals(pairs1, 2.2, 0.6);
const sse1 = calculateSSE(residuals1);
assert(approxEqual(sse1, 2.40), '7. Sum of Squared Errors (SSE) = 2.40');

// 8. Mean Absolute Error (MAE) Test on pairs1
// |e| = [0.8, 0.6, 1.0, 0.6, 0.2] -> sum(|e|) = 3.2
// MAE = 3.2 / 5 = 0.64
const mae1 = calculateMAE(residuals1);
assert(approxEqual(mae1, 0.64), '8. Mean Absolute Error (MAE) = 0.64');

// 9. Mean Squared Error (MSE) Test & Relationship with SSE
// MSE = SSE / n = 2.40 / 5 = 0.48
const mse1 = calculateMSE(residuals1, sse1);
assert(approxEqual(mse1, 0.48), '9. Mean Squared Error (MSE) = 0.48');
assert(approxEqual(mse1, sse1 / pairs1.length), '9b. Consistent relationship: MSE = SSE / n');

// 10. Root Mean Squared Error (RMSE) Test
// RMSE = sqrt(0.48) ≈ 0.69282
const rmse1 = calculateRMSE(mse1);
assert(approxEqual(rmse1, Math.sqrt(0.48)), '10. Root Mean Squared Error (RMSE) ≈ 0.6928');

// 11. Point Prediction Calculation Test
const pred10 = predictY(10, 2.2, 0.6);
assert(approxEqual(pred10, 8.2), '11. Point prediction for X=10 is 8.2');

// 12. Residual Summary Diagnostics Test
const summaryRes = summarizeResiduals(residuals1);
assert(summaryRes.count === 5, '12. Residual count is 5');
assert(approxEqual(summaryRes.min, -0.8), '12b. Min residual is -0.8');
assert(approxEqual(summaryRes.max, 1.0), '12c. Max residual is 1.0');
assert(approxEqual(summaryRes.mean, 0.0), '12d. Mean residual is 0.0 (OLS Σe = 0)');

// 13. Missing Paired Observations & Consistent Effective Sample Size
const rowsMissing = [
  { X: 1, Y: 10 },
  { X: 'NA', Y: 20 },
  { X: 2, Y: null },
  { X: 3, Y: 30 },
  { X: 4, Y: 40 }
];
const resMissing = performRegressionAnalysis(rowsMissing, 'X', 'Y');
assert(resMissing.isValid === true, '13. Handles missing rows successfully');
assert(resMissing.n === 3, '13b. Effective sample size n = 3');
assert(resMissing.missingPairs === 2, '13c. Tracks 2 missing pairs');
assert(approxEqual(resMissing.stats.mse, resMissing.stats.sse / 3), '13d. Missing data maintains MSE = SSE / n');

// 14. Insufficient Observations Test (n < 2)
const resSingle = performRegressionAnalysis([{ X: 5, Y: 10 }], 'X', 'Y');
assert(resSingle.isValid === false, '14. Rejects n < 2 observations');
assert(resSingle.error.includes('Insufficient paired observations'), '14b. Returns informative error');

// 15. Zero-Variance X Handling Test
const zeroVarXRows = [
  { X: 4, Y: 10 },
  { X: 4, Y: 20 },
  { X: 4, Y: 30 }
];
const resZeroVarX = performRegressionAnalysis(zeroVarXRows, 'X', 'Y');
assert(resZeroVarX.isValid === false, '15. Correctly flags zero variance in X');
assert(resZeroVarX.isZeroVarianceX === true, '15b. isZeroVarianceX is true');

console.log(`\n========================================================`);
console.log(`Phase 5 Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================================`);

if (failed > 0) process.exit(1);
