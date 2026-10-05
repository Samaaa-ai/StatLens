/**
 * DashboardPage Component
 * Features dataset upload handling, 1-click sample dataset loader, overview metrics, dataset preview, and analysis launchpads.
 */

import { createPageHeader } from '../components/PageHeader.js';
import { createMetricCard } from '../components/MetricCard.js';
import { createAnalysisCard } from '../components/AnalysisCard.js';
import { createDatasetPreview } from '../components/DatasetPreview.js';
import { appState } from '../state/appState.js';
import { analyzeCSV } from '../utils/csvParser.js';
import { SAMPLE_DATASET_CSV, SAMPLE_DATASET_FILENAME } from '../utils/sampleData.js';

export function renderDashboardPage() {
  const container = document.createElement('div');
  container.className = 'dashboard-page';

  const { dataset, loading, error } = appState.getState();

  // Hidden File Input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'csvFileInput';
  fileInput.accept = '.csv,text/csv,application/vnd.ms-excel';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  });

  function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('excel')) {
      appState.setError('Please upload a valid CSV (.csv) file format.');
      return;
    }

    appState.setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const result = analyzeCSV(file, text);
        if (result.isValid) {
          appState.setDataset(result);
        } else {
          appState.setError(result.error || 'Failed to parse CSV file.');
        }
      } catch (err) {
        console.error('CSV Parsing Error:', err);
        appState.setError('An unexpected error occurred while parsing the CSV: ' + err.message);
      }
    };

    reader.onerror = () => {
      appState.setError('Failed to read the file. Please check file permissions and try again.');
    };

    reader.readAsText(file);
  }

  function loadSample() {
    appState.setLoading(true);
    try {
      const mockFile = {
        name: SAMPLE_DATASET_FILENAME,
        size: new Blob([SAMPLE_DATASET_CSV]).size,
        type: 'text/csv'
      };
      const result = analyzeCSV(mockFile, SAMPLE_DATASET_CSV);
      if (result.isValid) {
        appState.setDataset(result);
      } else {
        appState.setError(result.error || 'Failed to load sample dataset.');
      }
    } catch (err) {
      console.error('Sample load error:', err);
      appState.setError('Failed to load sample dataset: ' + err.message);
    } finally {
      appState.setLoading(false);
    }
  }

  // Header Actions HTML
  const uploadBtnText = loading 
    ? `<span class="spinner"></span> Processing...` 
    : (dataset.isUploaded ? `Change CSV Dataset` : `Upload CSV`);

  const headerActionsHtml = `
    <button class="btn btn-sample" id="dashboardSampleBtn" ${loading ? 'disabled' : ''} title="Load built-in student dataset">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      Load Sample Dataset
    </button>
    <button class="btn btn-primary" id="dashboardUploadBtn" ${loading ? 'disabled' : ''}>
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      ${uploadBtnText}
    </button>
  `;

  // 1. Page Header
  const header = createPageHeader({
    title: 'Statistical Dashboard',
    subtitle: 'Upload your CSV or load sample data to analyze bivariate relationships and linear regression.',
    actionsHtml: headerActionsHtml
  });
  container.appendChild(header);

  // 2. Error / Warning Alerts (if any)
  if (error) {
    const errorAlert = document.createElement('div');
    errorAlert.className = 'validation-alert alert-error';
    errorAlert.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${error}</span>
      <button class="alert-close-btn" id="dismissErrorBtn" aria-label="Dismiss">✕</button>
    `;
    const dismissBtn = errorAlert.querySelector('#dismissErrorBtn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        appState.clearError();
      });
    }
    container.appendChild(errorAlert);
  }

  if (dataset.isUploaded && dataset.warnings && dataset.warnings.length > 0) {
    dataset.warnings.forEach(warn => {
      const warnAlert = document.createElement('div');
      warnAlert.className = 'validation-alert alert-warning';
      warnAlert.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>${warn}</span>
      `;
      container.appendChild(warnAlert);
    });
  }

  // 3. Dataset Overview Metric Grid
  const metricGrid = document.createElement('div');
  metricGrid.className = 'metric-grid';

  const overviewMetrics = [
    { 
      label: 'Rows', 
      value: dataset.isUploaded ? dataset.rows.toLocaleString() : '—', 
      subtext: dataset.isUploaded ? 'Total observations' : 'Total records', 
      tooltip: 'Number of observations/samples in the dataset' 
    },
    { 
      label: 'Columns', 
      value: dataset.isUploaded ? dataset.columns.toLocaleString() : '—', 
      subtext: dataset.isUploaded ? `${dataset.numericalVars} numerical, ${dataset.columns - dataset.numericalVars} text` : 'Total features', 
      tooltip: 'Total number of features/columns' 
    },
    { 
      label: 'Numerical Variables', 
      value: dataset.isUploaded ? dataset.numericalVars.toLocaleString() : '—', 
      subtext: dataset.isUploaded ? 'Eligible for correlation & regression' : 'Quantitative fields', 
      tooltip: 'Variables available for correlation and regression' 
    },
    { 
      label: 'Missing Values', 
      value: dataset.isUploaded ? dataset.missingValues.toLocaleString() : '—', 
      subtext: dataset.isUploaded ? (dataset.missingValues === 0 ? 'Dataset is complete' : 'Empty cells detected') : 'Null / empty values', 
      tooltip: 'Entries with missing statistical data' 
    }
  ];

  overviewMetrics.forEach(metric => {
    metricGrid.appendChild(createMetricCard(metric));
  });
  container.appendChild(metricGrid);

  // 4. Dropzone / Upload state if not uploaded yet
  if (!dataset.isUploaded && !loading) {
    const dropzone = document.createElement('div');
    dropzone.className = 'upload-dropzone';
    dropzone.innerHTML = `
      <div class="upload-dropzone-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 16 12 12 8 16"></polyline>
          <line x1="12" y1="12" x2="12" y2="21"></line>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
          <polyline points="16 16 12 12 8 16"></polyline>
        </svg>
      </div>
      <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
        Upload CSV Dataset
      </h4>
      <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px;">
        Drag & drop your CSV file here, or browse from your computer
      </p>
      <div style="display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-primary btn-sm" id="dropzoneBrowseBtn">
          Browse File
        </button>
        <span style="font-size: 0.8rem; color: var(--text-muted);">or</span>
        <button class="btn btn-sample btn-sm" id="dropzoneSampleBtn">
          ⚡ Load Sample Dataset
        </button>
      </div>
    `;

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        processFile(file);
      }
    });

    const dropBrowseBtn = dropzone.querySelector('#dropzoneBrowseBtn');
    if (dropBrowseBtn) {
      dropBrowseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    const dropSampleBtn = dropzone.querySelector('#dropzoneSampleBtn');
    if (dropSampleBtn) {
      dropSampleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loadSample();
      });
    }

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    container.appendChild(dropzone);
  }

  // 5. Dataset Preview (when uploaded)
  if (dataset.isUploaded) {
    const preview = createDatasetPreview();
    container.appendChild(preview);
  }

  // 6. Analysis Cards Section
  const analysisGrid = document.createElement('div');
  analysisGrid.className = 'analysis-grid';

  const correlationCard = createAnalysisCard({
    title: 'Correlation Analysis',
    badge: 'Bivariate Relationship',
    description: 'Explore the direction and strength of the relationship between two numerical variables.',
    concepts: ['Covariance', 'Pearson Correlation', 'Scatter Plot'],
    targetPage: 'correlation'
  });

  const regressionCard = createAnalysisCard({
    title: 'Regression Analysis',
    badge: 'Ordinary Least Squares',
    description: 'Build a Simple Linear Regression model using Ordinary Least Squares.',
    concepts: ['SLR', 'OLS', 'Prediction', 'Error Metrics'],
    targetPage: 'regression'
  });

  analysisGrid.appendChild(correlationCard);
  analysisGrid.appendChild(regressionCard);
  container.appendChild(analysisGrid);

  // Hook Header Buttons
  const uploadBtn = container.querySelector('#dashboardUploadBtn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  const sampleBtn = container.querySelector('#dashboardSampleBtn');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      loadSample();
    });
  }

  container.appendChild(fileInput);
  return container;
}
