/**
 * StatLens Statistical Module — Simple Linear Regression (OLS) Engine
 * Pure mathematical functions for Ordinary Least Squares parameter estimation,
 * residuals, SSE, MAE, MSE, RMSE, point predictions, empirical assumptions evaluation,
 * and equation formatting. Independent of UI components.
 */

import { extractValidPairs, calculateMean, calculateSampleVariance } from './correlation.js';

/**
 * Calculates Ordinary Least Squares (OLS) Slope:
 * β₁ = Σ[(xᵢ − x̄)(yᵢ − ȳ)] / Σ[(xᵢ − x̄)²]
 * 
 * @param {Array<{x: number, y: number}>} pairs
 * @param {number} [meanX]
 * @param {number} [meanY]
 * @returns {{ slope: number | null, isZeroVarianceX: boolean, error?: string }}
 */
export function calculateSlope(pairs, meanX = null, meanY = null) {
  if (!Array.isArray(pairs) || pairs.length < 2) {
    return { slope: null, isZeroVarianceX: false, error: 'At least 2 valid paired observations are required.' };
  }

  const avgX = meanX !== null ? meanX : calculateMean(pairs.map(p => p.x));
  const avgY = meanY !== null ? meanY : calculateMean(pairs.map(p => p.y));

  let numerator = 0; // Σ(xᵢ − x̄)(yᵢ − ȳ)
  let denominator = 0; // Σ(xᵢ − x̄)²

  pairs.forEach(p => {
    const diffX = p.x - avgX;
    const diffY = p.y - avgY;
    numerator += diffX * diffY;
    denominator += diffX * diffX;
  });

  if (denominator === 0 || Math.abs(denominator) < 1e-12) {
    return {
      slope: null,
      isZeroVarianceX: true,
      error: 'Cannot calculate slope because the independent variable (X) has zero variance (all X values are identical).'
    };
  }

  return {
    slope: numerator / denominator,
    isZeroVarianceX: false
  };
}

/**
 * Calculates Ordinary Least Squares (OLS) Intercept:
 * β₀ = ȳ − β₁x̄
 * 
 * @param {number} meanY
 * @param {number} meanX
 * @param {number} slope
 * @returns {number}
 */
export function calculateIntercept(meanY, meanX, slope) {
  if (slope === null || isNaN(slope) || isNaN(meanY) || isNaN(meanX)) {
    return null;
  }
  return meanY - (slope * meanX);
}

/**
 * Calculates predicted value ŷ for a given X using the fitted OLS model:
 * ŷ = β₀ + β₁X
 * 
 * @param {number} xVal
 * @param {number} intercept β₀
 * @param {number} slope β₁
 * @returns {number | null}
 */
export function predictY(xVal, intercept, slope) {
  if (xVal === null || xVal === undefined || isNaN(xVal) || intercept === null || slope === null) {
    return null;
  }
  return intercept + (slope * xVal);
}

/**
 * Computes residuals for each observation: eᵢ = yᵢ − ŷᵢ
 * 
 * @param {Array<{x: number, y: number, rowId?: number}>} pairs
 * @param {number} intercept
 * @param {number} slope
 * @returns {Array<{rowId: number, x: number, y: number, yHat: number, residual: number, residualSq: number, absResidual: number}>}
 */
export function calculateResiduals(pairs, intercept, slope) {
  if (!Array.isArray(pairs) || intercept === null || slope === null) {
    return [];
  }

  return pairs.map((p, idx) => {
    const yHat = intercept + (slope * p.x);
    const residual = p.y - yHat;
    const residualSq = residual * residual;
    const absResidual = Math.abs(residual);

    return {
      rowId: p.rowId || (idx + 1),
      x: p.x,
      y: p.y,
      yHat,
      residual,
      residualSq,
      absResidual
    };
  });
}

/**
 * Calculates Sum of Squared Errors (SSE):
 * SSE = Σ(yᵢ − ŷᵢ)² = Σ eᵢ²
 * 
 * @param {Array<{residual: number}> | Array<{y: number, yHat: number}>} residualList
 * @returns {number}
 */
export function calculateSSE(residualList) {
  if (!Array.isArray(residualList) || residualList.length === 0) {
    return 0;
  }

  const sse = residualList.reduce((acc, item) => {
    const e = item.residual !== undefined ? item.residual : (item.y - item.yHat);
    return acc + (e * e);
  }, 0);

  return Math.max(0, sse);
}

/**
 * Calculates Mean Absolute Error (MAE):
 * MAE = (1/n) Σ |yᵢ − ŷᵢ| = (1/n) Σ |eᵢ|
 * 
 * @param {Array<{residual: number, absResidual?: number}>} residualList
 * @returns {number}
 */
export function calculateMAE(residualList) {
  if (!Array.isArray(residualList) || residualList.length === 0) {
    return 0;
  }

  const sumAbs = residualList.reduce((acc, item) => {
    const absE = item.absResidual !== undefined ? item.absResidual : Math.abs(item.residual);
    return acc + absE;
  }, 0);

  return sumAbs / residualList.length;
}

/**
 * Calculates Mean Squared Error (MSE):
 * MSE = (1/n) Σ (yᵢ − ŷᵢ)² = SSE / n
 * 
 * @param {Array<{residual: number}>} residualList
 * @param {number} [sse] Optional precomputed SSE
 * @returns {number}
 */
export function calculateMSE(residualList, sse = null) {
  if (!Array.isArray(residualList) || residualList.length === 0) {
    return 0;
  }

  const totalSSE = sse !== null ? sse : calculateSSE(residualList);
  return totalSSE / residualList.length;
}

/**
 * Calculates Root Mean Squared Error (RMSE):
 * RMSE = √(MSE)
 * 
 * @param {number} mse
 * @returns {number}
 */
export function calculateRMSE(mse) {
  if (mse === null || mse === undefined || isNaN(mse) || mse < 0) {
    return 0;
  }
  return Math.sqrt(mse);
}

/**
 * Calculates all primary regression error metrics: SSE, MAE, MSE, RMSE
 * 
 * @param {Array<{residual: number}>} residuals
 * @returns {{ sse: number, mae: number, mse: number, rmse: number, n: number }}
 */
export function calculateErrorMetrics(residuals) {
  if (!Array.isArray(residuals) || residuals.length === 0) {
    return { sse: 0, mae: 0, mse: 0, rmse: 0, n: 0 };
  }

  const n = residuals.length;
  const sse = calculateSSE(residuals);
  const mae = calculateMAE(residuals);
  const mse = calculateMSE(residuals, sse);
  const rmse = calculateRMSE(mse);

  return { sse, mae, mse, rmse, n };
}

/**
 * Generates residual diagnostic summary: count, min, max, mean
 * 
 * @param {Array<{residual: number}>} residuals
 * @returns {{ count: number, min: number, max: number, mean: number }}
 */
export function summarizeResiduals(residuals) {
  if (!Array.isArray(residuals) || residuals.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0 };
  }

  const resValues = residuals.map(r => r.residual);
  const count = resValues.length;
  const min = Math.min(...resValues);
  const max = Math.max(...resValues);
  const sum = resValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  return { count, min, max, mean };
}

/**
 * Formats mathematical regression equation string:
 * e.g., ŷ = 12.4500 + 2.3100X or ŷ = 12.4500 − 2.3100X
 * 
 * @param {number} intercept
 * @param {number} slope
 * @param {string} [xName='X']
 * @param {string} [yName='Ŷ']
 * @returns {string}
 */
export function formatRegressionEquation(intercept, slope, xName = 'X', yName = 'Ŷ') {
  if (intercept === null || slope === null || isNaN(intercept) || isNaN(slope)) {
    return `${yName} = —`;
  }

  const b0Formatted = intercept.toFixed(4);
  const absSlope = Math.abs(slope).toFixed(4);
  const sign = slope >= 0 ? '+' : '−';

  return `${yName} = ${b0Formatted} ${sign} ${absSlope}(${xName})`;
}

/**
 * Evaluates empirical conditions for the 4 classical OLS assumptions:
 * 1. Linearity
 * 2. Independence of Errors
 * 3. Homoscedasticity (Equal Error Variance)
 * 4. Normality of Residuals
 * 
 * @param {Array<{x: number, y: number}>} pairs
 * @param {Array<{residual: number, x: number, y: number}>} residuals
 * @param {string} xName
 * @param {string} yName
 * @returns {Array<{name: string, isSatisfied: boolean, status: string, metricName: string, metricValue: string, description: string}>}
 */
export function evaluateAssumptions(pairs, residuals, xName = 'X', yName = 'Y') {
  if (!residuals || residuals.length < 2) {
    return [];
  }

  const n = residuals.length;
  const resVals = residuals.map(r => r.residual);

  // 1. Linearity: Compute correlation coefficient r
  const meanX = calculateMean(pairs.map(p => p.x));
  const meanY = calculateMean(pairs.map(p => p.y));
  let num = 0, denX = 0, denY = 0;
  pairs.forEach(p => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  });
  const r = (denX > 0 && denY > 0) ? num / Math.sqrt(denX * denY) : 0;
  const absR = Math.abs(r);
  const isLinearSatisfied = absR >= 0.25;

  const linearity = {
    name: '1. Linearity',
    isSatisfied: isLinearSatisfied,
    status: isLinearSatisfied ? 'Satisfied' : 'Caution',
    metricName: 'Correlation |r|',
    metricValue: absR.toFixed(4),
    description: isLinearSatisfied
      ? `Pearson correlation |r| = ${absR.toFixed(4)} indicates a clear linear trend between ${xName} and ${yName}.`
      : `Low correlation (|r| = ${absR.toFixed(4)}) suggests weak linear association.`
  };

  // 2. Independence of Errors: Durbin-Watson statistic
  let diffSqSum = 0;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    sse += resVals[i] * resVals[i];
    if (i > 0) {
      const diff = resVals[i] - resVals[i - 1];
      diffSqSum += diff * diff;
    }
  }
  const dw = sse > 1e-12 ? diffSqSum / sse : 2.0;
  const isDwSatisfied = dw >= 1.2 && dw <= 2.8;

  const independence = {
    name: '2. Independence of Errors',
    isSatisfied: isDwSatisfied,
    status: isDwSatisfied ? 'Satisfied' : 'Caution',
    metricName: 'Durbin-Watson (DW)',
    metricValue: dw.toFixed(4),
    description: isDwSatisfied
      ? `Durbin-Watson statistic DW = ${dw.toFixed(4)} (close to 2.0), showing no severe residual autocorrelation.`
      : `Durbin-Watson statistic DW = ${dw.toFixed(4)} indicates possible observation autocorrelation.`
  };

  // 3. Homoscedasticity (Equal Error Variance): Split sorted X pairs and test residual variance ratio
  const sortedByX = [...residuals].sort((a, b) => a.x - b.x);
  const mid = Math.floor(n / 2);
  const lowerHalf = sortedByX.slice(0, mid).map(r => r.residual);
  const upperHalf = sortedByX.slice(mid).map(r => r.residual);

  const varLower = lowerHalf.length > 1 ? calculateSampleVariance(lowerHalf) : 0;
  const varUpper = upperHalf.length > 1 ? calculateSampleVariance(upperHalf) : 0;

  const varRatio = (varLower > 1e-9) ? (varUpper / varLower) : (varUpper > 1e-9 ? 10.0 : 1.0);
  const isHomoSatisfied = varRatio >= 0.15 && varRatio <= 6.5;

  const homoscedasticity = {
    name: '3. Homoscedasticity (Equal Variance)',
    isSatisfied: isHomoSatisfied,
    status: isHomoSatisfied ? 'Satisfied' : 'Caution',
    metricName: 'Variance Ratio',
    metricValue: varRatio.toFixed(3),
    description: isHomoSatisfied
      ? `Residual variance is consistent across lower vs upper values of ${xName} (ratio = ${varRatio.toFixed(3)}).`
      : `Variance differs across the range of ${xName} (variance ratio = ${varRatio.toFixed(3)}).`
  };

  // 4. Normality of Residuals: Skewness check
  let m2 = 0, m3 = 0;
  resVals.forEach(e => {
    m2 += e * e;
    m3 += e * e * e;
  });
  m2 /= n;
  m3 /= n;
  const skewness = (m2 > 1e-12) ? m3 / Math.pow(m2, 1.5) : 0;
  const isNormSatisfied = Math.abs(skewness) <= 1.5;

  const normality = {
    name: '4. Normality of Residuals',
    isSatisfied: isNormSatisfied,
    status: isNormSatisfied ? 'Satisfied' : 'Caution',
    metricName: 'Residual Skewness',
    metricValue: skewness.toFixed(4),
    description: isNormSatisfied
      ? `Residual skewness is ${skewness.toFixed(4)} with mean residual = 0.0000 (symmetrical residual spread).`
      : `Residual distribution exhibits noticeable asymmetry (skewness = ${skewness.toFixed(4)}).`
  };

  return [linearity, independence, homoscedasticity, normality];
}

/**
 * Generates dynamic educational interpretation of error metrics.
 * 
 * @param {Object} metrics { mae, mse, rmse, sse, yName }
 * @returns {{ summary: string, detail: string, rmseNote: string }}
 */
export function generateErrorInterpretation(metrics) {
  const { mae, mse, rmse, sse, yName = 'Y' } = metrics;

  const summary = `On average, the Simple Linear Regression model estimates <strong>${yName}</strong> with an absolute error of <strong>${mae.toFixed(4)}</strong> (MAE) and a root mean squared error of <strong>${rmse.toFixed(4)}</strong> (RMSE).`;

  const detail = `Mean Absolute Error (MAE = ${mae.toFixed(4)}) represents the average magnitude of absolute residuals without penalizing outliers disproportionately. Mean Squared Error (MSE = ${mse.toFixed(4)}) penalizes larger deviations more heavily due to squaring.`;

  const rmseNote = `Root Mean Squared Error (RMSE = ${rmse.toFixed(4)}) is expressed in the same physical units as <strong>${yName}</strong>, representing the standard deviation of residuals around the fitted regression line. Total unexplained residual sum of squares is SSE = ${sse.toFixed(4)}.`;

  return { summary, detail, rmseNote };
}

/**
 * Master workflow function to perform complete Simple Linear Regression analysis on dataset.
 * 
 * @param {Array<Object>} rows Raw dataset rows
 * @param {string} xCol Selected independent variable (X)
 * @param {string} yCol Selected dependent variable (Y)
 * @returns {Object} Full regression result model including OLS parameters, residuals, error metrics, and assumptions
 */
export function performRegressionAnalysis(rows, xCol, yCol) {
  if (!xCol || !yCol) {
    return {
      isValid: false,
      error: 'Please select both an Independent Variable (X) and a Dependent Variable (Y).'
    };
  }

  if (xCol === yCol) {
    return {
      isValid: false,
      error: 'Independent Variable (X) and Dependent Variable (Y) must be two distinct numerical variables.'
    };
  }

  const { pairs, totalRows, validCount, missingCount } = extractValidPairs(rows, xCol, yCol);

  if (validCount < 2) {
    return {
      isValid: false,
      error: `Insufficient paired observations. Found only ${validCount} valid complete numerical pair(s) for ${xCol} and ${yCol}. At least 2 observations are required.`
    };
  }

  const xVals = pairs.map(p => p.x);
  const yVals = pairs.map(p => p.y);

  const meanX = calculateMean(xVals);
  const meanY = calculateMean(yVals);

  // Compute OLS parameters
  const slopeResult = calculateSlope(pairs, meanX, meanY);

  if (slopeResult.isZeroVarianceX) {
    return {
      isValid: false,
      xName: xCol,
      yName: yCol,
      n: validCount,
      totalRows,
      missingPairs: missingCount,
      isZeroVarianceX: true,
      error: slopeResult.error
    };
  }

  const slope = slopeResult.slope;
  const intercept = calculateIntercept(meanY, meanX, slope);

  // Calculate residuals and all error metrics (SSE, MAE, MSE, RMSE)
  const residuals = calculateResiduals(pairs, intercept, slope);
  const errorMetrics = calculateErrorMetrics(residuals);
  const residualSummary = summarizeResiduals(residuals);
  const equation = formatRegressionEquation(intercept, slope, xCol, 'Ŷ');
  const errorInterpretation = generateErrorInterpretation({
    ...errorMetrics,
    yName: yCol
  });
  const assumptions = evaluateAssumptions(pairs, residuals, xCol, yCol);

  return {
    isValid: true,
    xName: xCol,
    yName: yCol,
    n: validCount,
    totalRows,
    missingPairs: missingCount,
    pairs,
    stats: {
      meanX,
      meanY,
      slope,
      intercept,
      sse: errorMetrics.sse,
      mae: errorMetrics.mae,
      mse: errorMetrics.mse,
      rmse: errorMetrics.rmse,
      equation,
      isZeroVarianceX: false
    },
    errorMetrics,
    residuals,
    residualSummary,
    errorInterpretation,
    assumptions,
    error: null
  };
}
