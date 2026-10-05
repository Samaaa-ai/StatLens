/**
 * CorrelationPage Component
 * Interactive Bivariate Covariance and Pearson Correlation analysis workspace.
 * Requires user to click "Analyze Relationship" to compute and display results.
 */

import { createPageHeader } from '../components/PageHeader.js';
import { createMetricCard } from '../components/MetricCard.js';
import { createVariableSelector } from '../components/VariableSelector.js';
import { createScatterPlot } from '../components/ScatterPlot.js';
import { createSectionCard } from '../components/SectionCard.js';
import { appState } from '../state/appState.js';

export function renderCorrelationPage() {
  const container = document.createElement('div');
  container.className = 'correlation-page';

  const { dataset, selectedVars, correlationResult } = appState.getState();
  const currentSelection = selectedVars.correlation || { x: '', y: '' };

  // 1. Page Header
  const header = createPageHeader({
    title: 'Correlation Analysis',
    subtitle: 'Measure the direction and strength of the linear relationship between two numerical variables.'
  });
  container.appendChild(header);

  // 2. Validation / Status Alerts
  if (!dataset.isUploaded) {
    const noDatasetAlert = document.createElement('div');
    noDatasetAlert.className = 'validation-alert alert-info';
    noDatasetAlert.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>No dataset loaded. Please <strong><a href="#dashboard" id="goToDashboardLink" style="text-decoration: underline; cursor: pointer;">upload a CSV dataset</a></strong> on the Dashboard to begin.</span>
    `;
    const link = noDatasetAlert.querySelector('#goToDashboardLink');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        appState.navigateTo('dashboard');
      });
    }
    container.appendChild(noDatasetAlert);
  } else if (dataset.numericalColumns.length < 2) {
    const numWarning = document.createElement('div');
    numWarning.className = 'validation-alert alert-warning';
    numWarning.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>Bivariate correlation requires at least 2 numerical variables. This dataset contains ${dataset.numericalColumns.length}.</span>
    `;
    container.appendChild(numWarning);
  }

  // 3. Variable Selection Card
  const variableSelector = createVariableSelector({
    xLabel: 'X Variable',
    xTag: 'X',
    yLabel: 'Y Variable',
    yTag: 'Y',
    buttonText: 'Analyze Relationship',
    options: dataset.isUploaded ? dataset.numericalColumns : [],
    selectedX: currentSelection.x,
    selectedY: currentSelection.y,
    disabled: !dataset.isUploaded || dataset.numericalColumns.length < 2,
    onChange: ({ x, y }) => {
      appState.setVariables('correlation', { x, y });
    },
    onAction: ({ x, y }) => {
      appState.runCorrelationAnalysis(x, y);
    }
  });
  container.appendChild(variableSelector);

  // Check if we have an active valid calculation result
  const hasResult = Boolean(correlationResult && correlationResult.isValid && correlationResult.stats);
  const stats = hasResult ? correlationResult.stats : null;
  const errorMsg = correlationResult && !correlationResult.isValid ? correlationResult.error : null;

  if (errorMsg) {
    const errorBanner = document.createElement('div');
    errorBanner.className = 'validation-alert alert-error';
    errorBanner.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>${errorMsg}</span>
    `;
    container.appendChild(errorBanner);
  }

  if (correlationResult && correlationResult.stats?.isZeroVariance) {
    const zeroVarBanner = document.createElement('div');
    zeroVarBanner.className = 'validation-alert alert-warning';
    zeroVarBanner.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>${correlationResult.error || 'Zero variance detected in one or both variables. Pearson r denominator is zero.'}</span>
    `;
    container.appendChild(zeroVarBanner);
  }

  // 4. Result Metric Cards Grid (Covariance, Pearson r, Direction, Strength) - No i symbols
  const metricGrid = document.createElement('div');
  metricGrid.className = 'metric-grid';

  const covValue = stats ? stats.covariance.toFixed(4) : '—';
  const rValue = stats && stats.r !== null ? stats.r.toFixed(4) : (stats?.isZeroVariance ? 'Undefined' : '—');
  const dirValue = stats ? stats.direction : '—';
  const strValue = stats ? stats.strength : '—';

  const metrics = [
    { 
      label: 'Covariance', 
      value: covValue, 
      subtext: hasResult ? `Cov(${correlationResult.xName}, ${correlationResult.yName})` : 'Joint variability'
    },
    { 
      label: 'Pearson r', 
      value: rValue, 
      subtext: hasResult ? (stats.r !== null ? `Linear coefficient (−1 ≤ r ≤ +1)` : 'Zero variance') : 'Correlation index'
    },
    { 
      label: 'Direction', 
      value: dirValue, 
      subtext: hasResult ? `Slope orientation` : 'Positive / Negative / None'
    },
    { 
      label: 'Strength', 
      value: strValue, 
      subtext: hasResult ? `Magnitude category` : 'Weak / Moderate / Strong'
    }
  ];

  metrics.forEach(metric => {
    metricGrid.appendChild(createMetricCard(metric));
  });
  container.appendChild(metricGrid);

  // 5. Main Scatter Plot Card (using n = 15 instead of Effective n = 15)
  const plotCard = document.createElement('div');
  plotCard.className = 'chart-container';

  const plotTitle = hasResult
    ? `Scatter Plot: ${correlationResult.xName} vs ${correlationResult.yName}`
    : 'Scatter Plot';

  const nBadge = hasResult 
    ? `<span class="sample-size-pill">n = ${correlationResult.n}${correlationResult.missingPairs > 0 ? ` (${correlationResult.missingPairs} missing omitted)` : ''}</span>`
    : '';

  plotCard.innerHTML = `
    <div class="chart-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="8" cy="8" r="2"></circle>
          <circle cx="16" cy="16" r="2"></circle>
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="18" cy="6" r="2"></circle>
          <circle cx="6" cy="18" r="2"></circle>
        </svg>
        ${plotTitle}
      </h3>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${nBadge}
        <span class="badge badge-neutral">Bivariate Plot</span>
      </div>
    </div>
    <div class="chart-viewport" id="scatterPlotViewport" style="padding: 16px; background-color: #ffffff; min-height: 380px;">
    </div>
  `;

  const viewport = plotCard.querySelector('#scatterPlotViewport');

  if (hasResult && correlationResult.pairs && correlationResult.pairs.length > 0) {
    const plot = createScatterPlot({
      pairs: correlationResult.pairs,
      xLabel: correlationResult.xName,
      yLabel: correlationResult.yName,
      width: 760,
      height: 380
    });
    viewport.appendChild(plot);
  } else {
    viewport.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h4 class="empty-state-title">${dataset.isUploaded ? 'Ready to Analyze' : 'Dataset Required'}</h4>
        <p class="empty-state-text">
          ${dataset.isUploaded 
            ? 'Select distinct X and Y variables above and click "Analyze Relationship" to view the scatter plot and metrics.' 
            : 'Upload a CSV dataset and select numerical variables to view the scatter distribution.'}
        </p>
      </div>
    `;
  }

  container.appendChild(plotCard);

  // 6. Supporting Statistics Table Card
  const supportingStatsHtml = hasResult ? `
    <table class="supporting-stats-table">
      <tbody>
        <tr>
          <td class="supporting-stats-label">Mean of ${correlationResult.xName} (x̄)</td>
          <td class="supporting-stats-value">${stats.meanX.toFixed(4)}</td>
          <td class="supporting-stats-label">Mean of ${correlationResult.yName} (ȳ)</td>
          <td class="supporting-stats-value">${stats.meanY.toFixed(4)}</td>
        </tr>
        <tr>
          <td class="supporting-stats-label">Sample Variance S²(${correlationResult.xName})</td>
          <td class="supporting-stats-value">${stats.varianceX.toFixed(4)}</td>
          <td class="supporting-stats-label">Sample Variance S²(${correlationResult.yName})</td>
          <td class="supporting-stats-value">${stats.varianceY.toFixed(4)}</td>
        </tr>
        <tr>
          <td class="supporting-stats-label">Standard Deviation S(${correlationResult.xName})</td>
          <td class="supporting-stats-value">${stats.stdDevX.toFixed(4)}</td>
          <td class="supporting-stats-label">Standard Deviation S(${correlationResult.yName})</td>
          <td class="supporting-stats-value">${stats.stdDevY.toFixed(4)}</td>
        </tr>
        <tr>
          <td class="supporting-stats-label">Sample Covariance Cov(X,Y)</td>
          <td class="supporting-stats-value">${stats.covariance.toFixed(4)}</td>
          <td class="supporting-stats-label">Pearson Correlation (r)</td>
          <td class="supporting-stats-value">${stats.r !== null ? stats.r.toFixed(4) : 'Undefined'}</td>
        </tr>
      </tbody>
    </table>
  ` : `
    <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
      Supporting descriptive statistics will display here after clicking "Analyze Relationship".
    </div>
  `;

  const supportingCard = createSectionCard({
    title: 'Supporting Descriptive Statistics',
    subtitle: 'Sample moments and univariate parameters for X and Y',
    contentHtml: supportingStatsHtml
  });
  container.appendChild(supportingCard);

  return container;
}
