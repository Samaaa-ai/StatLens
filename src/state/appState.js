/**
 * StatLens Application State Store
 * Manages active route, navigation events, dataset metadata, variable selections,
 * and statistical calculation outputs for Correlation and Simple Linear Regression.
 */

import { performCorrelationAnalysis } from '../stats/correlation.js';
import { performRegressionAnalysis, predictY } from '../stats/regression.js';

class AppState {
  constructor() {
    this.state = {
      currentPage: 'dashboard',
      sidebarOpen: false,
      loading: false,
      error: null,
      dataset: {
        isUploaded: false,
        fileName: null,
        fileSizeBytes: null,
        rows: null,
        columns: null,
        numericalVars: null,
        missingValues: null,
        headers: [],
        columnAnalysis: [],
        numericalColumns: [],
        data: [],
        warnings: []
      },
      selectedVars: {
        correlation: { x: '', y: '' },
        regression: { x: '', y: '' }
      },
      correlationResult: null,
      regressionResult: null,
      predictionInput: '',
      predictionOutput: null
    };

    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  navigateTo(pageId) {
    const validPages = ['dashboard', 'correlation', 'regression', 'report'];
    if (validPages.includes(pageId)) {
      this.state.currentPage = pageId;
      this.state.sidebarOpen = false; // close mobile sidebar on navigation
      this.notify();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleSidebar(isOpen) {
    this.state.sidebarOpen = typeof isOpen === 'boolean' ? isOpen : !this.state.sidebarOpen;
    this.notify();
  }

  setLoading(isLoading) {
    this.state.loading = Boolean(isLoading);
    this.notify();
  }

  setError(errorMessage) {
    this.state.error = errorMessage;
    this.state.loading = false;
    this.notify();
  }

  clearError() {
    this.state.error = null;
    this.notify();
  }

  setDataset(analysisResult) {
    this.state.loading = false;
    this.state.error = null;

    if (!analysisResult || !analysisResult.isValid) {
      this.state.error = analysisResult?.error || 'Invalid dataset format.';
      this.notify();
      return;
    }

    this.state.dataset = {
      isUploaded: true,
      fileName: analysisResult.fileName,
      fileSizeBytes: analysisResult.fileSizeBytes,
      rows: analysisResult.rowCount,
      columns: analysisResult.columnCount,
      numericalVars: analysisResult.numericalColumns.length,
      missingValues: analysisResult.missingValueCount,
      headers: analysisResult.headers,
      columnAnalysis: analysisResult.columnAnalysis,
      numericalColumns: analysisResult.numericalColumns,
      data: analysisResult.data,
      warnings: analysisResult.warnings || []
    };

    // Initialize distinct numerical variables if available
    const numCols = analysisResult.numericalColumns;
    const initialX = numCols.length > 0 ? numCols[0] : '';
    const initialY = numCols.length > 1 ? numCols[1] : '';

    this.state.selectedVars = {
      correlation: { x: initialX, y: initialY },
      regression: { x: initialX, y: initialY }
    };

    this.state.predictionInput = '';
    this.state.predictionOutput = null;

    // Do NOT auto-compute: results remain null until user explicitly clicks the analysis buttons
    this.state.correlationResult = null;
    this.state.regressionResult = null;

    this.notify();
  }

  clearDataset() {
    this.state.dataset = {
      isUploaded: false,
      fileName: null,
      fileSizeBytes: null,
      rows: null,
      columns: null,
      numericalVars: null,
      missingValues: null,
      headers: [],
      columnAnalysis: [],
      numericalColumns: [],
      data: [],
      warnings: []
    };
    this.state.selectedVars = {
      correlation: { x: '', y: '' },
      regression: { x: '', y: '' }
    };
    this.state.correlationResult = null;
    this.state.regressionResult = null;
    this.state.predictionInput = '';
    this.state.predictionOutput = null;
    this.state.error = null;
    this.notify();
  }

  setVariables(module, { x, y }) {
    if (this.state.selectedVars[module]) {
      const newX = x !== undefined ? x : this.state.selectedVars[module].x;
      const newY = y !== undefined ? y : this.state.selectedVars[module].y;

      this.state.selectedVars[module] = { x: newX, y: newY };

      // Reset result when variables change so calculation is triggered on button click
      if (module === 'correlation') {
        this.state.correlationResult = null;
      } else if (module === 'regression') {
        this.state.regressionResult = null;
        this.state.predictionOutput = null;
      }

      this.notify();
    }
  }

  runCorrelationAnalysis(x, y) {
    if (!this.state.dataset.isUploaded) return;
    const targetX = x || this.state.selectedVars.correlation.x;
    const targetY = y || this.state.selectedVars.correlation.y;

    if (targetX && targetY && targetX !== targetY) {
      this.state.selectedVars.correlation = { x: targetX, y: targetY };
      this.state.correlationResult = performCorrelationAnalysis(
        this.state.dataset.data,
        targetX,
        targetY
      );
      this.notify();
    }
  }

  runRegressionAnalysis(x, y) {
    if (!this.state.dataset.isUploaded) return;
    const targetX = x || this.state.selectedVars.regression.x;
    const targetY = y || this.state.selectedVars.regression.y;

    if (targetX && targetY && targetX !== targetY) {
      this.state.selectedVars.regression = { x: targetX, y: targetY };
      this.state.regressionResult = performRegressionAnalysis(
        this.state.dataset.data,
        targetX,
        targetY
      );
      if (this.state.predictionInput !== '' && this.state.regressionResult?.isValid) {
        const numX = parseFloat(this.state.predictionInput);
        if (!isNaN(numX)) {
          this.state.predictionOutput = predictY(
            numX,
            this.state.regressionResult.stats.intercept,
            this.state.regressionResult.stats.slope
          );
        }
      }
      this.notify();
    }
  }

  calculatePrediction(inputXVal, shouldNotify = false) {
    this.state.predictionInput = inputXVal;
    if (inputXVal === '' || inputXVal === null || isNaN(Number(inputXVal))) {
      this.state.predictionOutput = null;
      if (shouldNotify) this.notify();
      return null;
    }

    const numX = parseFloat(inputXVal);
    if (this.state.regressionResult && this.state.regressionResult.isValid) {
      const { intercept, slope } = this.state.regressionResult.stats;
      this.state.predictionOutput = predictY(numX, intercept, slope);
    } else {
      this.state.predictionOutput = null;
    }
    if (shouldNotify) this.notify();
    return this.state.predictionOutput;
  }
}

export const appState = new AppState();
