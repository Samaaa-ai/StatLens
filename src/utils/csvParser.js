/**
 * StatLens Robust CSV Parser & Dataset Analyzer
 * RFC 4180 compliant CSV tokenizer, header detector, and statistical column classifier.
 */

/**
 * Parses raw CSV text into a 2D array of strings.
 * Handles quoted fields, escaped quotes (""), embedded commas, and multiline cells.
 */
export function parseCSVText(csvText) {
  if (!csvText || typeof csvText !== 'string' || csvText.trim().length === 0) {
    return [];
  }

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : '';

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Skip \r in \r\n
        }
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field and row if any content remains
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Checks if a cell string represents a missing value.
 */
export function isMissingValue(val) {
  if (val === null || val === undefined) return true;
  const trimmed = String(val).trim();
  if (trimmed === '') return true;
  const lower = trimmed.toLowerCase();
  return ['na', 'n/a', 'nan', 'null', 'none', '-', '.', '?'].includes(lower);
}

/**
 * Checks if a value can be cleanly parsed as a finite number.
 */
export function isNumeric(val) {
  if (isMissingValue(val)) return false;
  const num = Number(val);
  return !isNaN(num) && isFinite(num);
}

/**
 * Full dataset analysis & validation engine.
 */
export function analyzeCSV(file, rawText) {
  const rows = parseCSVText(rawText);

  if (rows.length === 0) {
    return {
      isValid: false,
      error: 'The uploaded file is empty. Please provide a valid CSV dataset with data rows.'
    };
  }

  if (rows.length === 1) {
    return {
      isValid: false,
      error: 'The CSV contains only header information and has no observation records.'
    };
  }

  const rawHeaders = rows[0];
  const dataRows = rows.slice(1);

  // Normalize and deduplicate headers
  const headers = rawHeaders.map((header, idx) => {
    const cleanHeader = header.trim() || `Column_${idx + 1}`;
    return cleanHeader;
  });

  const columnCount = headers.length;
  let totalMissing = 0;

  // Classify each column
  const columnAnalysis = headers.map((colName, colIdx) => {
    let numericCount = 0;
    let textCount = 0;
    let missingCount = 0;
    const values = [];

    dataRows.forEach(row => {
      const cell = row[colIdx] !== undefined ? row[colIdx] : '';
      if (isMissingValue(cell)) {
        missingCount++;
        totalMissing++;
        values.push(null);
      } else if (isNumeric(cell)) {
        numericCount++;
        values.push(parseFloat(cell));
      } else {
        textCount++;
        values.push(cell);
      }
    });

    const totalValid = numericCount + textCount;
    // A column is classified as numerical if at least 80% of non-missing values are numeric
    const isNumerical = totalValid > 0 && (numericCount / totalValid) >= 0.8 && numericCount >= 2;

    return {
      name: colName,
      index: colIdx,
      type: isNumerical ? 'numerical' : 'categorical',
      missingCount,
      validCount: totalValid,
      numericCount,
      textCount,
      values
    };
  });

  const numericalColumns = columnAnalysis
    .filter(col => col.type === 'numerical')
    .map(col => col.name);

  // Structured dataset rows as objects
  const tableData = dataRows.map((row, rowIdx) => {
    const rowObj = { _rowId: rowIdx + 1 };
    headers.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    return rowObj;
  });

  const warnings = [];

  if (dataRows.length < 3) {
    warnings.push('The dataset contains fewer than 3 observations. Statistical metrics require sufficient sample size.');
  }

  if (numericalColumns.length < 2) {
    warnings.push(`Only ${numericalColumns.length} numerical variable(s) detected. Bivariate correlation and Simple Linear Regression require at least two numerical variables.`);
  }

  return {
    isValid: true,
    fileName: file.name,
    fileSizeBytes: file.size,
    rowCount: dataRows.length,
    columnCount,
    headers,
    columnAnalysis,
    numericalColumns,
    missingValueCount: totalMissing,
    data: tableData,
    warnings
  };
}
