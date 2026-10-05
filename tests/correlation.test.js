/**
 * StatLens Unit Test Suite: Covariance & Pearson Correlation Engine
 * Verifies all 13 required statistical conditions with verifiable analytical datasets.
 */

import {
  calculateMean,
  calculateSampleVariance,
  calculateSampleStdDev,
  calculateSampleCovariance,
  calculatePearsonCorrelation,
  classifyDirection,
  classifyStrength,
  extractValidPairs,
  performCorrelationAnalysis
} from '../src/stats/correlation.js';

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

console.log('=====================================================');
console.log('Running Statistical Unit Tests — Phase 3 Correlation');
console.log('=====================================================\n');

// 1. Mean Test
// Data: [2, 4, 6, 8, 10] -> Mean = 30 / 5 = 6.0
const meanTest = calculateMean([2, 4, 6, 8, 10]);
assert(approxEqual(meanTest, 6.0), '1. Mean of [2, 4, 6, 8, 10] is 6.0');

// 2. Variance Test
// Data: [2, 4, 6, 8, 10], n=5
// Diffs: [-4, -2, 0, 2, 4], Squared Diffs: [16, 4, 0, 4, 16], Sum = 40
// Sample Variance = 40 / (5 - 1) = 10.0
const varTest = calculateSampleVariance([2, 4, 6, 8, 10]);
assert(approxEqual(varTest, 10.0), '2. Sample Variance of [2, 4, 6, 8, 10] is 10.0');

// 3. Standard Deviation Test
// Sample SD = sqrt(10.0) ≈ 3.162277
const sdTest = calculateSampleStdDev([2, 4, 6, 8, 10]);
assert(approxEqual(sdTest, Math.sqrt(10.0)), '3. Sample Standard Deviation is √10 ≈ 3.1623');

// 4. Covariance Test
// X: [1, 2, 3, 4, 5], meanX = 3
// Y: [2, 4, 5, 4, 5], meanY = 4
// (x - 3): [-2, -1, 0, 1, 2]
// (y - 4): [-2,  0, 1, 0, 1]
// products: [4, 0, 0, 0, 2] -> sum = 6
// Sample Covariance = 6 / (5 - 1) = 1.5
const pairsCov = [
  { x: 1, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 5 },
  { x: 4, y: 4 },
  { x: 5, y: 5 }
];
const covTest = calculateSampleCovariance(pairsCov);
assert(approxEqual(covTest, 1.5), '4. Sample Covariance is 1.5');

// 5. Pearson Correlation Test
// Sx² = 10/4 = 2.5 => Sx = sqrt(2.5) ≈ 1.5811
// Sy: [2,4,5,4,5] -> sumSqDiff = (4 + 0 + 1 + 0 + 1) = 6 -> Sy² = 6/4 = 1.5 => Sy = sqrt(1.5) ≈ 1.2247
// r = 1.5 / (sqrt(2.5) * sqrt(1.5)) = 1.5 / sqrt(3.75) = 1.5 / 1.93649 ≈ 0.7745966
const rTest = calculatePearsonCorrelation(1.5, Math.sqrt(2.5), Math.sqrt(1.5));
assert(approxEqual(rTest.r, 0.7745966), '5. Pearson Correlation r = 0.7746');

// 6. Positive Correlation Test
assert(classifyDirection(0.7746) === 'Positive', '6. Direction is Positive for r > 0');
assert(classifyStrength(0.7746) === 'Strong', '6b. Strength is Strong for r = 0.7746');

// 7. Negative Correlation Test
const pairsNeg = [
  { x: 1, y: 10 },
  { x: 2, y: 8 },
  { x: 3, y: 6 },
  { x: 4, y: 4 },
  { x: 5, y: 1 }
];
const covNeg = calculateSampleCovariance(pairsNeg);
const sdXNeg = calculateSampleStdDev(pairsNeg.map(p => p.x));
const sdYNeg = calculateSampleStdDev(pairsNeg.map(p => p.y));
const rNeg = calculatePearsonCorrelation(covNeg, sdXNeg, sdYNeg);
assert(rNeg.r < 0, '7. Negative correlation coefficient calculated (r < 0)');
assert(classifyDirection(rNeg.r) === 'Negative', '7b. Direction correctly classified as Negative');

// 8. Near-Zero Correlation Test
// Orthogonal data: symmetrical circle / diamond pattern
const pairsZero = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 }
];
const covZero = calculateSampleCovariance(pairsZero);
const sdXZ = calculateSampleStdDev(pairsZero.map(p => p.x));
const sdYZ = calculateSampleStdDev(pairsZero.map(p => p.y));
const rZero = calculatePearsonCorrelation(covZero, sdXZ, sdYZ);
assert(approxEqual(rZero.r, 0.0), '8. Symmetrical data yields r = 0.0');
assert(classifyDirection(rZero.r) === 'No linear relationship', '8b. Direction classified as "No linear relationship"');
assert(classifyStrength(rZero.r) === 'Very weak', '8c. Strength classified as "Very weak"');

// 9. Perfect Positive Correlation (+1.0)
const pairsPerfPos = [
  { x: 10, y: 20 },
  { x: 20, y: 40 },
  { x: 30, y: 60 },
  { x: 40, y: 80 }
];
const covPP = calculateSampleCovariance(pairsPerfPos);
const sdXPP = calculateSampleStdDev(pairsPerfPos.map(p => p.x));
const sdYPP = calculateSampleStdDev(pairsPerfPos.map(p => p.y));
const rPP = calculatePearsonCorrelation(covPP, sdXPP, sdYPP);
assert(approxEqual(rPP.r, 1.0), '9. Perfect positive line yields r = 1.0');
assert(classifyStrength(rPP.r) === 'Very strong', '9b. Perfect correlation classified as "Very strong"');

// 10. Perfect Negative Correlation (-1.0)
const pairsPerfNeg = [
  { x: 1, y: 100 },
  { x: 2, y: 80 },
  { x: 3, y: 60 },
  { x: 4, y: 40 }
];
const covPN = calculateSampleCovariance(pairsPerfNeg);
const sdXPN = calculateSampleStdDev(pairsPerfNeg.map(p => p.x));
const sdYPN = calculateSampleStdDev(pairsPerfNeg.map(p => p.y));
const rPN = calculatePearsonCorrelation(covPN, sdXPN, sdYPN);
assert(approxEqual(rPN.r, -1.0), '10. Perfect negative line yields r = -1.0');
assert(classifyDirection(rPN.r) === 'Negative', '10b. Direction is Negative');

// 11. Missing-Value Pair Handling Test
const rowsWithMissing = [
  { A: '10', B: '20' },
  { A: 'NA', B: '30' }, // missing X
  { A: '20', B: null }, // missing Y
  { A: '30', B: '40' },
  { A: '40', B: '50' }
];
const extracted = extractValidPairs(rowsWithMissing, 'A', 'B');
assert(extracted.validCount === 3, '11. Extracts only 3 complete pairs, skips 2 incomplete rows');
assert(extracted.missingCount === 2, '11b. Tracks 2 missing pairs');
assert(extracted.pairs[0].x === 10 && extracted.pairs[0].y === 20, '11c. Parses numeric values properly');

// 12. Zero-Variance Handling Test
const zeroVarRows = [
  { X: 5, Y: 10 },
  { X: 5, Y: 20 },
  { X: 5, Y: 30 }
];
const zeroVarAnalysis = performCorrelationAnalysis(zeroVarRows, 'X', 'Y');
assert(zeroVarAnalysis.isValid === true, '12. Zero-variance dataset parsed without crashing');
assert(zeroVarAnalysis.stats.isZeroVariance === true, '12b. Correctly flags isZeroVariance');
assert(zeroVarAnalysis.stats.r === null, '12c. Pearson r is null due to zero denominator');
assert(zeroVarAnalysis.error.includes('zero variance'), '12d. Returns explanatory error message');

// 13. Insufficient Observations Test (n < 2)
const singleRow = [{ X: 10, Y: 20 }];
const singleResult = performCorrelationAnalysis(singleRow, 'X', 'Y');
assert(singleResult.isValid === false, '13. Analysis with n=1 rejected');
assert(singleResult.error.includes('Insufficient paired observations'), '13b. Helpful error message returned');

console.log(`\n=====================================================`);
console.log(`Phase 3 Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`=====================================================`);

if (failed > 0) process.exit(1);
