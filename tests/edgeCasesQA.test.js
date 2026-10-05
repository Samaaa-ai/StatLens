/**
 * StatLens Phase 7 QA Edge-Case & Numerical Formatting Test Suite
 * Systematically tests all 8 CSV input edge cases (A through H) and verifies zero NaN/Infinity.
 */

import { analyzeCSV } from '../src/utils/csvParser.js';
import { performCorrelationAnalysis } from '../src/stats/correlation.js';
import { performRegressionAnalysis, predictY } from '../src/stats/regression.js';

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

function isValidFiniteNumber(val) {
  return typeof val === 'number' && !isNaN(val) && isFinite(val);
}

console.log('========================================================');
console.log('Running Phase 7 Edge-Case & Numerical QA Tests');
console.log('========================================================\n');

// Case A — Normal Dataset
const csvA = `Hours,Marks
2,45
3,50
4,58
5,65
6,72`;
const resA = analyzeCSV({ name: 'caseA.csv', size: 100 }, csvA);
assert(resA.isValid === true, 'Case A: Normal CSV parsed successfully');
const corrA = performCorrelationAnalysis(resA.data, 'Hours', 'Marks');
const regA = performRegressionAnalysis(resA.data, 'Hours', 'Marks');
assert(corrA.isValid && isValidFiniteNumber(corrA.stats.r), 'Case A: Correlation r is valid finite number');
assert(regA.isValid && isValidFiniteNumber(regA.stats.slope) && isValidFiniteNumber(regA.stats.mae), 'Case A: Regression slope & MAE are valid finite numbers');

// Case B — Decimal Values
const csvB = `Hours,Marks
1.5,42.5
2.7,51.2
3.8,60.4
4.6,68.1`;
const resB = analyzeCSV({ name: 'caseB.csv', size: 100 }, csvB);
const corrB = performCorrelationAnalysis(resB.data, 'Hours', 'Marks');
const regB = performRegressionAnalysis(resB.data, 'Hours', 'Marks');
assert(resB.isValid && corrB.isValid && regB.isValid, 'Case B: Decimal dataset parsed and analyzed without error');
assert(isValidFiniteNumber(regB.stats.rmse) && isValidFiniteNumber(regB.stats.sse), 'Case B: Decimal RMSE & SSE are valid finite numbers');

// Case C — Negative Values
const csvC = `Temperature,Sales_Change
-10.5,-35.0
-5.0,-20.0
0.0,-5.0
5.5,12.0
12.0,28.0`;
const resC = analyzeCSV({ name: 'caseC.csv', size: 100 }, csvC);
const corrC = performCorrelationAnalysis(resC.data, 'Temperature', 'Sales_Change');
const regC = performRegressionAnalysis(resC.data, 'Temperature', 'Sales_Change');
assert(resC.isValid && corrC.isValid && regC.isValid, 'Case C: Negative numbers parsed and analyzed correctly');
assert(isValidFiniteNumber(corrC.stats.covariance) && isValidFiniteNumber(regC.stats.slope), 'Case C: Negative covariance and slope are valid finite numbers');

// Case D — Missing Values
const csvD = `Hours,Marks
2,45
3,
4,58
,65
6,72`;
const resD = analyzeCSV({ name: 'caseD.csv', size: 100 }, csvD);
const corrD = performCorrelationAnalysis(resD.data, 'Hours', 'Marks');
const regD = performRegressionAnalysis(resD.data, 'Hours', 'Marks');
assert(resD.isValid === true, 'Case D: CSV with missing values parsed');
assert(corrD.n === 3 && corrD.missingPairs === 2, 'Case D: Exactly 3 complete pairs used, 2 incomplete rows omitted');
assert(regD.n === 3 && regD.missingPairs === 2, 'Case D: Regression uses identical effective sample size (n=3)');

// Case E — Invalid CSV Structures
// E1: Empty file
const resEmpty = analyzeCSV({ name: 'empty.csv', size: 0 }, '');
assert(resEmpty.isValid === false && !resEmpty.error.includes('undefined'), 'Case E1: Empty file produces clean error message');

// E2: Header-only file
const resHeaderOnly = analyzeCSV({ name: 'headers.csv', size: 20 }, 'ColA,ColB\n');
assert(resHeaderOnly.isValid === false && !resHeaderOnly.error.includes('undefined'), 'Case E2: Header-only file produces clean error message');

// E3: No usable numerical columns
const csvTextOnly = `Name,City,Country
Alice,Paris,France
Bob,London,UK
Charlie,Rome,Italy`;
const resTextOnly = analyzeCSV({ name: 'text.csv', size: 100 }, csvTextOnly);
assert(resTextOnly.isValid === true && resTextOnly.numericalColumns.length === 0, 'Case E3: Categorical-only dataset detected with 0 numerical columns');

// Case F — Only 1 Numerical Column
const csvOneNum = `Name,Score,City
Alice,95,Paris
Bob,80,London
Charlie,75,Rome`;
const resOneNum = analyzeCSV({ name: 'oneNum.csv', size: 100 }, csvOneNum);
assert(resOneNum.isValid === true && resOneNum.numericalColumns.length === 1, 'Case F: Detected exactly 1 numerical column');
const corrOneNum = performCorrelationAnalysis(resOneNum.data, 'Score', 'Score');
assert(corrOneNum.isValid === false && corrOneNum.error.includes('distinct'), 'Case F: Prevented single-variable correlation with clean explanation');

// Case G — Constant X (Zero Variance in X)
const csvConstX = `Level,Score
5,50
5,60
5,70
5,80`;
const resConstX = analyzeCSV({ name: 'constX.csv', size: 100 }, csvConstX);
const corrConstX = performCorrelationAnalysis(resConstX.data, 'Level', 'Score');
const regConstX = performRegressionAnalysis(resConstX.data, 'Level', 'Score');
assert(corrConstX.stats.isZeroVariance === true && corrConstX.stats.r === null, 'Case G: Correlation safely handles zero variance without NaN');
assert(regConstX.isZeroVarianceX === true && regConstX.error.includes('zero variance'), 'Case G: Regression safely prevents zero denominator slope');

// Case H — Small Datasets
// H1: n = 1 observation
const csvN1 = `X,Y\n10,20`;
const resN1 = analyzeCSV({ name: 'n1.csv', size: 20 }, csvN1);
const corrN1 = performCorrelationAnalysis(resN1.data, 'X', 'Y');
assert(corrN1.isValid === false && corrN1.error.includes('Insufficient'), 'Case H1: n=1 cleanly rejected with insufficient observations message');

// H2: n = 2 observations (minimal valid paired sample)
const csvN2 = `X,Y\n1,10\n2,20`;
const resN2 = analyzeCSV({ name: 'n2.csv', size: 20 }, csvN2);
const corrN2 = performCorrelationAnalysis(resN2.data, 'X', 'Y');
const regN2 = performRegressionAnalysis(resN2.data, 'X', 'Y');
assert(corrN2.isValid === true && corrN2.n === 2, 'Case H2: n=2 calculates valid correlation');
assert(regN2.isValid === true && regN2.n === 2 && regN2.stats.slope === 10, 'Case H2: n=2 calculates valid regression parameters');

// Prediction Edge Cases
assert(predictY(null, 10, 2) === null, 'Prediction: Null input safely returns null');
assert(predictY(NaN, 10, 2) === null, 'Prediction: NaN input safely returns null');
assert(predictY(0, 10, 2) === 10, 'Prediction: X=0 correctly returns intercept β₀=10');
assert(predictY(-5, 10, 2) === 0, 'Prediction: Negative X=-5 correctly computes 10 + 2(-5) = 0');

console.log(`\n========================================================`);
console.log(`Phase 7 Edge-Case QA Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================================`);

if (failed > 0) process.exit(1);
