/**
 * StatLens Unit Test Suite: Report & Integration Engine
 * Verifies dynamic report assembly, state reactivity, and data integrity across modules.
 */

import { appState } from '../src/state/appState.js';
import { analyzeCSV } from '../src/utils/csvParser.js';
import { performCorrelationAnalysis } from '../src/stats/correlation.js';
import { performRegressionAnalysis } from '../src/stats/regression.js';

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
console.log('Running Statistical Unit Tests — Phase 6 Report & State');
console.log('========================================================\n');

// Sample test CSV dataset
const sampleCSV = `Study_Hours,Exam_Score,Subject
2.0,60.0,Math
4.0,70.0,Math
6.0,80.0,Math
8.0,90.0,Math
10.0,100.0,Math`;

const fileMock = { name: 'study_data.csv', size: 2048 };
const analysisResult = analyzeCSV(fileMock, sampleCSV);

// 1. Dataset Analysis Verification
assert(analysisResult.isValid === true, '1. Dataset parsed successfully');
assert(analysisResult.rowCount === 5, '1b. Correct row count (5)');
assert(analysisResult.numericalColumns.length === 2, '1c. Exactly 2 numerical variables detected');

// 2. Set Dataset in AppState
appState.setDataset(analysisResult);
const state = appState.getState();
assert(state.dataset.isUploaded === true, '2. Dataset state is marked uploaded');
assert(state.dataset.fileName === 'study_data.csv', '2b. Correct dataset filename stored');
assert(state.dataset.rows === 5, '2c. Correct observation count in state');

// 3. Correlation Analysis on Trigger
appState.runCorrelationAnalysis('Study_Hours', 'Exam_Score');
const corrState = appState.getState();
assert(corrState.correlationResult !== null, '3. Correlation calculated on trigger');
assert(corrState.correlationResult.isValid === true, '3b. Correlation result is valid');
assert(approxEqual(corrState.correlationResult.stats.r, 1.0), '3c. Perfect correlation r = 1.0');
assert(corrState.correlationResult.stats.direction === 'Positive', '3d. Direction is Positive');
assert(corrState.correlationResult.stats.strength === 'Very strong', '3e. Strength is Very strong');

// 4. Regression Analysis on Trigger
appState.runRegressionAnalysis('Study_Hours', 'Exam_Score');
const regState = appState.getState();
assert(regState.regressionResult !== null, '4. Regression calculated on trigger');
assert(regState.regressionResult.isValid === true, '4b. Regression result is valid');
// y = 50 + 5x:
// x=2 -> y=60, x=4 -> y=70, x=6 -> y=80, x=8 -> y=90, x=10 -> y=100
assert(approxEqual(regState.regressionResult.stats.slope, 5.0), '4c. OLS slope β₁ = 5.0');
assert(approxEqual(regState.regressionResult.stats.intercept, 50.0), '4d. OLS intercept β₀ = 50.0');
assert(approxEqual(regState.regressionResult.stats.sse, 0.0), '4e. SSE = 0.0');

// 5. Error Metrics in State
assert(approxEqual(regState.regressionResult.stats.mae, 0.0), '5. MAE = 0.0 for perfect line');
assert(approxEqual(regState.regressionResult.stats.mse, 0.0), '5b. MSE = 0.0 for perfect line');
assert(approxEqual(regState.regressionResult.stats.rmse, 0.0), '5c. RMSE = 0.0 for perfect line');

// 6. Point Prediction Integration
const predResult = appState.calculatePrediction(12);
assert(approxEqual(predResult, 110.0), '6. Point prediction for X=12 is 50 + 5(12) = 110.0');

// 7. Residual Diagnostics in State
const resSummary = regState.regressionResult.residualSummary;
assert(resSummary.count === 5, '7. Residual count is 5');
assert(approxEqual(resSummary.min, 0.0), '7b. Min residual is 0.0');
assert(approxEqual(resSummary.max, 0.0), '7c. Max residual is 0.0');
assert(approxEqual(resSummary.mean, 0.0), '7d. Mean residual is 0.0');

// 8. Dynamic Variable Change Reactivity
appState.setVariables('regression', { x: 'Exam_Score', y: 'Study_Hours' });
appState.runRegressionAnalysis('Exam_Score', 'Study_Hours');
const invertedState = appState.getState();
assert(invertedState.selectedVars.regression.x === 'Exam_Score', '8. X variable updated to Exam_Score');
assert(invertedState.selectedVars.regression.y === 'Study_Hours', '8b. Y variable updated to Study_Hours');
// Inverse model: x = (y - 50)/5 = -10 + 0.2y
assert(approxEqual(invertedState.regressionResult.stats.slope, 0.2), '8c. Inverted slope β₁ = 0.20');
assert(approxEqual(invertedState.regressionResult.stats.intercept, -10.0), '8d. Inverted intercept β₀ = -10.0');

// 9. Clear Dataset & Empty State Behavior
appState.clearDataset();
const clearedState = appState.getState();
assert(clearedState.dataset.isUploaded === false, '9. Dataset cleared');
assert(clearedState.correlationResult === null, '9b. Correlation result reset to null');
assert(clearedState.regressionResult === null, '9c. Regression result reset to null');
assert(clearedState.dataset.fileName === null, '9d. Filename reset to null');

console.log(`\n========================================================`);
console.log(`Phase 6 Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================================`);

if (failed > 0) process.exit(1);
