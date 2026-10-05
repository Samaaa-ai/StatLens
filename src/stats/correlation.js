/**
 * StatLens Statistical Module — Covariance & Pearson Correlation Engine
 * Pure mathematical functions for bivariate linear association analysis.
 * Independent of UI and framework components.
 */

import { isNumeric, isMissingValue } from '../utils/csvParser.js';

/**
 * Centralized Threshold Configuration for Correlation Classification
 */
export const CORRELATION_THRESHOLDS = {
  DIRECTION_EPSILON: 0.0001, // Magnitude below which direction is considered zero
  STRENGTH: {
    VERY_STRONG: 0.90,
    STRONG: 0.70,
    MODERATE: 0.40,
    WEAK: 0.20
  }
};

/**
 * Extracts valid paired numerical observations from dataset rows.
 * Discards rows where either X or Y is missing, null, or non-numeric.
 * 
 * @param {Array<Object>} rows Raw dataset rows
 * @param {string} xCol Key name for X variable
 * @param {string} yCol Key name for Y variable
 * @returns {{ pairs: Array<{x: number, y: number, rowId: number}>, totalRows: number, validCount: number, missingCount: number }}
 */
export function extractValidPairs(rows, xCol, yCol) {
  if (!Array.isArray(rows) || !xCol || !yCol) {
    return { pairs: [], totalRows: 0, validCount: 0, missingCount: 0 };
  }

  const pairs = [];
  let missingCount = 0;

  rows.forEach((row, idx) => {
    const rawX = row[xCol];
    const rawY = row[yCol];

    if (isNumeric(rawX) && isNumeric(rawY)) {
      pairs.push({
        x: parseFloat(rawX),
        y: parseFloat(rawY),
        rowId: row._rowId || (idx + 1)
      });
    } else {
      missingCount++;
    }
  });

  return {
    pairs,
    totalRows: rows.length,
    validCount: pairs.length,
    missingCount
  };
}

/**
 * Calculates arithmetic sample mean: x̄ = Σxᵢ / n
 * @param {Array<number>} values 
 * @returns {number}
 */
export function calculateMean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates sample variance: S² = Σ(xᵢ − x̄)² / (n − 1)
 * @param {Array<number>} values 
 * @param {number} [mean] Optional precomputed mean
 * @returns {number}
 */
export function calculateSampleVariance(values, mean = null) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const avg = mean !== null ? mean : calculateMean(values);
  const sumSquaredDiffs = values.reduce((acc, val) => {
    const diff = val - avg;
    return acc + (diff * diff);
  }, 0);
  return sumSquaredDiffs / (values.length - 1);
}

/**
 * Calculates sample standard deviation: S = √(S²)
 * @param {Array<number>} values 
 * @param {number} [variance] Optional precomputed variance
 * @returns {number}
 */
export function calculateSampleStdDev(values, variance = null) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const v = variance !== null ? variance : calculateSampleVariance(values);
  return Math.sqrt(Math.max(0, v));
}

/**
 * Calculates sample covariance: Cov(X,Y) = Σ[(xᵢ − x̄)(yᵢ − ȳ)] / (n − 1)
 * @param {Array<{x: number, y: number}>} pairs
 * @param {number} [meanX]
 * @param {number} [meanY]
 * @returns {number}
 */
export function calculateSampleCovariance(pairs, meanX = null, meanY = null) {
  if (!Array.isArray(pairs) || pairs.length < 2) return 0;
  const n = pairs.length;
  const avgX = meanX !== null ? meanX : calculateMean(pairs.map(p => p.x));
  const avgY = meanY !== null ? meanY : calculateMean(pairs.map(p => p.y));

  const sumProductDiffs = pairs.reduce((acc, p) => {
    return acc + ((p.x - avgX) * (p.y - avgY));
  }, 0);

  return sumProductDiffs / (n - 1);
}

/**
 * Calculates Pearson Correlation Coefficient: r = Cov(X,Y) / (Sx * Sy)
 * Clamps result strictly to [-1, +1].
 * Returns null / error if either variable has zero variance.
 * 
 * @param {number} covariance 
 * @param {number} stdDevX 
 * @param {number} stdDevY 
 * @returns {{ r: number | null, isZeroVariance: boolean, error?: string }}
 */
export function calculatePearsonCorrelation(covariance, stdDevX, stdDevY) {
  if (stdDevX === 0 || stdDevY === 0 || isNaN(stdDevX) || isNaN(stdDevY)) {
    return {
      r: null,
      isZeroVariance: true,
      error: 'Pearson correlation cannot be calculated because one or both variables have zero variance (standard deviation = 0).'
    };
  }

  const denominator = stdDevX * stdDevY;
  let rawR = covariance / denominator;

  // Clamp to [-1.0, 1.0] to prevent floating point inaccuracies beyond theoretical bounds
  let r = Math.max(-1.0, Math.min(1.0, rawR));

  return {
    r,
    isZeroVariance: false
  };
}

/**
 * Classifies direction of linear association.
 * @param {number | null} r 
 * @returns {'Positive' | 'Negative' | 'No linear relationship' | 'Undefined'}
 */
export function classifyDirection(r) {
  if (r === null || r === undefined || isNaN(r)) return 'Undefined';
  if (Math.abs(r) <= CORRELATION_THRESHOLDS.DIRECTION_EPSILON) {
    return 'No linear relationship';
  }
  return r > 0 ? 'Positive' : 'Negative';
}

/**
 * Classifies strength of linear association magnitude based on |r|.
 * @param {number | null} r 
 * @returns {'Very strong' | 'Strong' | 'Moderate' | 'Weak' | 'Very weak' | 'Undefined'}
 */
export function classifyStrength(r) {
  if (r === null || r === undefined || isNaN(r)) return 'Undefined';
  const absR = Math.abs(r);
  const { STRENGTH } = CORRELATION_THRESHOLDS;

  if (absR >= STRENGTH.VERY_STRONG) return 'Very strong';
  if (absR >= STRENGTH.STRONG) return 'Strong';
  if (absR >= STRENGTH.MODERATE) return 'Moderate';
  if (absR >= STRENGTH.WEAK) return 'Weak';
  return 'Very weak';
}

/**
 * Generates an academic statistical interpretation of covariance and Pearson r.
 * Avoids any claim of causation.
 * 
 * @param {Object} stats
 * @returns {{ summary: string, detail: string, covarianceNote: string }}
 */
export function generateCorrelationInterpretation(stats) {
  const { r, covariance, n, xName, yName, direction, strength, isZeroVariance } = stats;

  if (isZeroVariance) {
    return {
      summary: `Undefined correlation between ${xName} and ${yName}.`,
      detail: `One of the variables has identical values across all observations (zero variance), meaning its standard deviation is 0. Division by zero prevents calculating the Pearson r coefficient.`,
      covarianceNote: `Covariance is ${covariance?.toFixed(4) || 0}, but standardized correlation cannot be established.`
    };
  }

  if (r === null) {
    return {
      summary: 'Insufficient data for statistical interpretation.',
      detail: 'At least two valid paired observations are required to compute covariance and correlation.',
      covarianceNote: 'Covariance cannot be computed.'
    };
  }

  const absR = Math.abs(r);
  const covDirection = covariance > 0 ? 'positive' : (covariance < 0 ? 'negative' : 'neutral');
  
  let relText = '';
  if (direction === 'Positive') {
    relText = `as <strong>${xName}</strong> increases, <strong>${yName}</strong> tends to increase linearly.`;
  } else if (direction === 'Negative') {
    relText = `as <strong>${xName}</strong> increases, <strong>${yName}</strong> tends to decrease linearly.`;
  } else {
    relText = `there is no discernible linear trend between <strong>${xName}</strong> and <strong>${yName}</strong>.`;
  }

  const summary = `The data exhibits a <strong>${strength.toLowerCase()} ${direction.toLowerCase()}</strong> linear relationship (r = ${r.toFixed(4)}) based on n = ${n} paired observations.`;

  const detail = `The Pearson correlation coefficient indicates that ${relText} Because |r| = ${absR.toFixed(4)}, the linear association is categorized as <em>${strength.toLowerCase()}</em>.`;

  const covarianceNote = `Sample covariance is <strong>${covariance.toFixed(4)}</strong>, which reflects a ${covDirection} joint variability between the two variables before normalization by their standard deviations.`;

  return { summary, detail, covarianceNote };
}

/**
 * Master workflow function to perform complete correlation analysis on dataset.
 * 
 * @param {Array<Object>} rows Raw dataset rows
 * @param {string} xCol Selected X column name
 * @param {string} yCol Selected Y column name
 * @returns {Object} Full analysis result including stats, valid pairs, and interpretations
 */
export function performCorrelationAnalysis(rows, xCol, yCol) {
  if (!xCol || !yCol) {
    return {
      isValid: false,
      error: 'Please select both an X variable and a Y variable.'
    };
  }

  if (xCol === yCol) {
    return {
      isValid: false,
      error: 'X and Y must be two distinct numerical variables.'
    };
  }

  const { pairs, totalRows, validCount, missingCount } = extractValidPairs(rows, xCol, yCol);

  if (validCount < 2) {
    return {
      isValid: false,
      error: `Insufficient paired observations. Found only ${validCount} valid pair(s) with complete numerical values for ${xCol} and ${yCol}. At least 2 pairs are required.`
    };
  }

  const xVals = pairs.map(p => p.x);
  const yVals = pairs.map(p => p.y);

  const meanX = calculateMean(xVals);
  const meanY = calculateMean(yVals);

  const varianceX = calculateSampleVariance(xVals, meanX);
  const varianceY = calculateSampleVariance(yVals, meanY);

  const stdDevX = calculateSampleStdDev(xVals, varianceX);
  const stdDevY = calculateSampleStdDev(yVals, varianceY);

  const covariance = calculateSampleCovariance(pairs, meanX, meanY);

  const pearsonResult = calculatePearsonCorrelation(covariance, stdDevX, stdDevY);

  const direction = classifyDirection(pearsonResult.r);
  const strength = classifyStrength(pearsonResult.r);

  const interpretation = generateCorrelationInterpretation({
    r: pearsonResult.r,
    covariance,
    n: validCount,
    xName: xCol,
    yName: yCol,
    direction,
    strength,
    isZeroVariance: pearsonResult.isZeroVariance
  });

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
      varianceX,
      varianceY,
      stdDevX,
      stdDevY,
      covariance,
      r: pearsonResult.r,
      isZeroVariance: pearsonResult.isZeroVariance,
      direction,
      strength
    },
    interpretation,
    error: pearsonResult.error || null
  };
}
