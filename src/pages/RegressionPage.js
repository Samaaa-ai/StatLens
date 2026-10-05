/**
 * RegressionPage Component
 * Full interactive Simple Linear Regression workspace with OLS parameters,
 * equation highlight, regression line visualization, streamlined prediction workbench,
 * error metrics with interactive hover formula/solution popovers, Actual vs Predicted plot,
 * residual diagnostics, and empirical dataset assumptions validation.
 */

import { createPageHeader } from '../components/PageHeader.js';
import { createMetricCard } from '../components/MetricCard.js';
import { createVariableSelector } from '../components/VariableSelector.js';
import { createRegressionPlot } from '../components/RegressionPlot.js';
import { createActualVsPredictedPlot } from '../components/ActualVsPredictedPlot.js';
import { createSectionCard } from '../components/SectionCard.js';
import { appState } from '../state/appState.js';

export function renderRegressionPage() {
  const container = document.createElement('div');
  container.className = 'regression-page';

  const { dataset, selectedVars, regressionResult, predictionInput, predictionOutput } = appState.getState();
  const currentSelection = selectedVars.regression || { x: '', y: '' };

  // 1. Page Header
  const header = createPageHeader({
    title: 'Simple Linear Regression',
    subtitle: 'Model the linear relationship between one independent variable (X) and one dependent variable (Y) using Ordinary Least Squares.'
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
      <span>No dataset loaded. Please <strong><a href="#dashboard" id="goToDashboardLinkReg" style="text-decoration: underline; cursor: pointer;">upload a CSV dataset</a></strong> on the Dashboard to build a regression model.</span>
    `;
    const link = noDatasetAlert.querySelector('#goToDashboardLinkReg');
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
      <span>Simple Linear Regression requires at least 2 numerical variables. Current dataset contains ${dataset.numericalColumns.length}.</span>
    `;
    container.appendChild(numWarning);
  }

  // 3. Variable Selection Card
  const variableSelector = createVariableSelector({
    xLabel: 'Independent Variable',
    xTag: 'X',
    yLabel: 'Dependent Variable',
    yTag: 'Y',
    buttonText: 'Build Model',
    options: dataset.isUploaded ? dataset.numericalColumns : [],
    selectedX: currentSelection.x,
    selectedY: currentSelection.y,
    disabled: !dataset.isUploaded || dataset.numericalColumns.length < 2,
    onChange: ({ x, y }) => {
      appState.setVariables('regression', { x, y });
    },
    onAction: ({ x, y }) => {
      appState.runRegressionAnalysis(x, y);
    }
  });
  container.appendChild(variableSelector);

  // Check if we have an active valid calculation result
  const hasResult = Boolean(regressionResult && regressionResult.isValid && regressionResult.stats);
  const stats = hasResult ? regressionResult.stats : null;
  const errorMsg = regressionResult && !regressionResult.isValid ? regressionResult.error : null;

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

  // 4. Prominent Regression Equation Card
  const equationCard = document.createElement('div');
  equationCard.className = 'equation-card';

  const equationTitle = hasResult
    ? `Fitted Equation: Predicting ${regressionResult.yName}`
    : 'Regression Equation (OLS Model)';

  const equationValue = hasResult
    ? stats.equation
    : 'Ŷ = —';

  equationCard.innerHTML = `
    <div class="equation-label">${equationTitle}</div>
    <div class="equation-display">
      <span class="mono-text">${equationValue}</span>
    </div>
    <div class="equation-sub">Model: Ŷ = β₀ + β₁X (β₁ = slope, β₀ = intercept)</div>
  `;
  container.appendChild(equationCard);

  // 5. Main OLS Parameters Grid (Slope β₁, Intercept β₀, SSE) - No i icons
  const metricGrid = document.createElement('div');
  metricGrid.className = 'metric-grid';

  const slopeValue = stats ? stats.slope.toFixed(4) : '—';
  const interceptValue = stats ? stats.intercept.toFixed(4) : '—';
  const sseValue = stats ? stats.sse.toFixed(4) : '—';

  const primaryMetrics = [
    { 
      label: 'Slope β₁', 
      value: slopeValue, 
      subtext: hasResult ? `Rate of change per unit ${regressionResult.xName}` : 'Rate of change in Y per unit X'
    },
    { 
      label: 'Intercept β₀', 
      value: interceptValue, 
      subtext: hasResult ? `Baseline ${regressionResult.yName} when X = 0` : 'Baseline value of Y when X = 0'
    },
    { 
      label: 'Sum of Squared Errors (SSE)', 
      value: sseValue, 
      subtext: hasResult ? `Unexplained residual variation (n = ${regressionResult.n})` : 'Total residual sum of squares'
    }
  ];

  primaryMetrics.forEach(metric => {
    metricGrid.appendChild(createMetricCard(metric));
  });
  container.appendChild(metricGrid);

  // 6. Regression Visualization Card (using n = 15)
  const plotCard = document.createElement('div');
  plotCard.className = 'chart-container';

  const plotTitle = hasResult
    ? `Regression Plot: ${regressionResult.yName} on ${regressionResult.xName}`
    : 'Regression Line';

  const nBadge = hasResult 
    ? `<span class="sample-size-pill">n = ${regressionResult.n}${regressionResult.missingPairs > 0 ? ` (${regressionResult.missingPairs} missing omitted)` : ''}</span>`
    : '';

  plotCard.innerHTML = `
    <div class="chart-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="21" x2="21" y2="3"></line>
          <circle cx="7" cy="14" r="1.5"></circle>
          <circle cx="11" cy="9" r="1.5"></circle>
          <circle cx="17" cy="6" r="1.5"></circle>
          <circle cx="15" cy="13" r="1.5"></circle>
        </svg>
        ${plotTitle}
      </h3>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${nBadge}
        <span class="badge badge-neutral">OLS Best Fit</span>
      </div>
    </div>
    <div class="chart-viewport" id="regressionPlotViewport" style="padding: 16px; background-color: #ffffff; min-height: 380px;">
    </div>
  `;

  const viewport = plotCard.querySelector('#regressionPlotViewport');

  if (hasResult && regressionResult.pairs && regressionResult.pairs.length > 0) {
    const plot = createRegressionPlot({
      pairs: regressionResult.pairs,
      intercept: stats.intercept,
      slope: stats.slope,
      xLabel: regressionResult.xName,
      yLabel: regressionResult.yName,
      width: 760,
      height: 380
    });
    viewport.appendChild(plot);
  } else {
    viewport.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
        </div>
        <h4 class="empty-state-title">${dataset.isUploaded ? 'Ready to Build Model' : 'Dataset Required'}</h4>
        <p class="empty-state-text">
          ${dataset.isUploaded 
            ? 'Select distinct X and Y variables and click "Build Model" to fit the OLS regression line.' 
            : 'Upload a CSV dataset and build a Simple Linear Regression model to view the regression plot.'}
        </p>
      </div>
    `;
  }

  container.appendChild(plotCard);

  // 7. Error Metrics Section (MAE, MSE, RMSE, SSE) with Rich Hover Tooltip Formula + Step-by-Step Solution
  const errorMetricsCard = document.createElement('div');
  errorMetricsCard.className = 'card';
  errorMetricsCard.style.marginBottom = '28px';

  const nVal = hasResult ? regressionResult.n : 1;
  const sseNum = stats ? stats.sse : 0;
  const maeNum = stats ? stats.mae : 0;
  const mseNum = stats ? stats.mse : 0;
  const rmseNum = stats ? stats.rmse : 0;
  const sumAbsE = hasResult ? (maeNum * nVal).toFixed(4) : '0.0000';

  const maePopover = hasResult ? `
    <div class="error-formula-popover">
      <div class="popover-title">Mean Absolute Error (MAE)</div>
      <div class="popover-formula">MAE = (1/n) Σ |yᵢ − ŷᵢ| = (1/n) Σ |eᵢ|</div>
      <div class="popover-step">
        <strong>Solved with dataset:</strong><br/>
        • Sum of absolute residuals Σ|eᵢ| = ${sumAbsE}<br/>
        • Sample size n = ${nVal}<br/>
        • MAE = ${sumAbsE} / ${nVal} = <strong>${maeNum.toFixed(4)}</strong>
      </div>
    </div>
  ` : `
    <div class="error-formula-popover">
      <div class="popover-title">Mean Absolute Error (MAE)</div>
      <div class="popover-formula">MAE = (1/n) Σ |yᵢ − ŷᵢ|</div>
      <div class="popover-step">Computes average absolute magnitude of residuals.</div>
    </div>
  `;

  const msePopover = hasResult ? `
    <div class="error-formula-popover">
      <div class="popover-title">Mean Squared Error (MSE)</div>
      <div class="popover-formula">MSE = (1/n) Σ (yᵢ − ŷᵢ)² = SSE / n</div>
      <div class="popover-step">
        <strong>Solved with dataset:</strong><br/>
        • Total squared error SSE = ${sseNum.toFixed(4)}<br/>
        • Sample size n = ${nVal}<br/>
        • MSE = ${sseNum.toFixed(4)} / ${nVal} = <strong>${mseNum.toFixed(4)}</strong>
      </div>
    </div>
  ` : `
    <div class="error-formula-popover">
      <div class="popover-title">Mean Squared Error (MSE)</div>
      <div class="popover-formula">MSE = SSE / n</div>
      <div class="popover-step">Average of squared errors, penalizing larger deviations.</div>
    </div>
  `;

  const rmsePopover = hasResult ? `
    <div class="error-formula-popover">
      <div class="popover-title">Root Mean Squared Error (RMSE)</div>
      <div class="popover-formula">RMSE = √(MSE)</div>
      <div class="popover-step">
        <strong>Solved with dataset:</strong><br/>
        • Mean Squared Error MSE = ${mseNum.toFixed(4)}<br/>
        • RMSE = √(${mseNum.toFixed(4)}) = <strong>${rmseNum.toFixed(4)}</strong><br/>
        • Expressed in units of ${regressionResult.yName}
      </div>
    </div>
  ` : `
    <div class="error-formula-popover">
      <div class="popover-title">Root Mean Squared Error (RMSE)</div>
      <div class="popover-formula">RMSE = √(MSE)</div>
      <div class="popover-step">Standard deviation of unexplained residuals in original Y units.</div>
    </div>
  `;

  const ssePopover = hasResult ? `
    <div class="error-formula-popover">
      <div class="popover-title">Sum of Squared Errors (SSE)</div>
      <div class="popover-formula">SSE = Σ (yᵢ − ŷᵢ)² = Σ eᵢ²</div>
      <div class="popover-step">
        <strong>Solved with dataset:</strong><br/>
        • Sum of all squared residuals across ${nVal} pairs<br/>
        • SSE = <strong>${sseNum.toFixed(4)}</strong>
      </div>
    </div>
  ` : `
    <div class="error-formula-popover">
      <div class="popover-title">Sum of Squared Errors (SSE)</div>
      <div class="popover-formula">SSE = Σ (yᵢ − ŷᵢ)²</div>
      <div class="popover-step">Total unexplained residual variation minimized by OLS.</div>
    </div>
  `;

  errorMetricsCard.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Model Error Metrics
      </h3>
      <span class="badge badge-neutral">Hover ⓘ for Solved Formulas</span>
    </div>
    <div class="card-body">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">MAE</span>
            <div class="error-info-trigger" aria-label="MAE Formula">
              i
              ${maePopover}
            </div>
          </div>
          <div class="metric-value ${!hasResult ? 'metric-placeholder' : ''}">${hasResult ? maeNum.toFixed(4) : '—'}</div>
          <div class="metric-subtext">Mean Absolute Error</div>
        </div>

        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">MSE</span>
            <div class="error-info-trigger" aria-label="MSE Formula">
              i
              ${msePopover}
            </div>
          </div>
          <div class="metric-value ${!hasResult ? 'metric-placeholder' : ''}">${hasResult ? mseNum.toFixed(4) : '—'}</div>
          <div class="metric-subtext">Mean Squared Error</div>
        </div>

        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">RMSE</span>
            <div class="error-info-trigger" aria-label="RMSE Formula">
              i
              ${rmsePopover}
            </div>
          </div>
          <div class="metric-value ${!hasResult ? 'metric-placeholder' : ''}">${hasResult ? rmseNum.toFixed(4) : '—'}</div>
          <div class="metric-subtext">Root Mean Squared Error</div>
        </div>

        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">SSE</span>
            <div class="error-info-trigger" aria-label="SSE Formula">
              i
              ${ssePopover}
            </div>
          </div>
          <div class="metric-value ${!hasResult ? 'metric-placeholder' : ''}">${hasResult ? sseNum.toFixed(4) : '—'}</div>
          <div class="metric-subtext">Sum of Squared Errors</div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(errorMetricsCard);

  // 8. Streamlined Two-Column Grid: Prediction Workbench & Actual vs Predicted Visualization
  const twoColGrid = document.createElement('div');
  twoColGrid.className = 'two-col-grid';

  // Section: Clean Prediction Workbench without dropdowns or excess space
  const xInputPlaceholder = hasResult ? `Enter ${regressionResult.xName} value...` : 'Enter X value...';
  const predictionHtml = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 0.85rem; color: var(--text-secondary);">
        Enter a value for <strong>${hasResult ? regressionResult.xName : 'X'}</strong> and click <strong>Calculate Ŷ</strong> to compute the estimated outcome for <strong>${hasResult ? regressionResult.yName : 'Y'}</strong>.
      </div>
      <div class="prediction-box">
        <input type="number" step="any" id="predXInput" class="form-input" placeholder="${xInputPlaceholder}" value="${predictionInput}" ${!hasResult ? 'disabled style="cursor: not-allowed;"' : ''} style="flex: 1;" />
        <button class="btn btn-primary" id="calculatePredBtn" ${!hasResult ? 'disabled' : ''}>Calculate Ŷ</button>
      </div>
      <div style="padding: 12px 14px; background: var(--bg-subtle); border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border-subtle);">
        <span>Predicted ${hasResult ? regressionResult.yName : 'Outcome'} (Ŷ):</span>
        <strong class="mono-text" style="color: var(--text-primary); font-size: 1.25rem;" id="predResultDisplay">
          ${predictionOutput !== null ? predictionOutput.toFixed(4) : '—'}
        </strong>
      </div>
    </div>
  `;

  const predictionCard = createSectionCard({
    title: 'Prediction Workbench',
    subtitle: 'Point estimation for specified X values',
    contentHtml: predictionHtml
  });

  // Section: Actual vs Predicted Visualization Card (without "Identity: y = ŷ")
  const actualVsPredCard = document.createElement('div');
  actualVsPredCard.className = 'card';
  actualVsPredCard.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 14 14"></polyline>
        </svg>
        Actual vs Predicted
      </h3>
    </div>
    <div class="card-body" style="padding: 12px; min-height: 220px; display: flex; align-items: center; justify-content: center;" id="actualVsPredViewport">
    </div>
  `;

  const actViewport = actualVsPredCard.querySelector('#actualVsPredViewport');
  if (hasResult && regressionResult.residuals && regressionResult.residuals.length > 0) {
    const actPlot = createActualVsPredictedPlot({
      residuals: regressionResult.residuals,
      yLabel: regressionResult.yName,
      width: 540,
      height: 250
    });
    actViewport.appendChild(actPlot);
  } else {
    actViewport.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 20px;">
        Actual vs Predicted plot will display points against the reference line once the model is built.
      </div>
    `;
  }

  twoColGrid.appendChild(predictionCard);
  twoColGrid.appendChild(actualVsPredCard);
  container.appendChild(twoColGrid);

  // Attach Prediction input events
  const predInput = predictionCard.querySelector('#predXInput');
  const calcBtn = predictionCard.querySelector('#calculatePredBtn');
  const predDisplay = predictionCard.querySelector('#predResultDisplay');

  function handlePrediction() {
    if (!predInput || !hasResult) return;
    const val = predInput.value.trim();
    const result = appState.calculatePrediction(val, false);
    if (predDisplay) {
      predDisplay.textContent = result !== null ? result.toFixed(4) : '—';
    }
  }

  if (calcBtn) {
    calcBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handlePrediction();
    });
  }
  if (predInput) {
    predInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePrediction();
      }
    });
  }

  // 9. Residual Diagnostics Section
  const resSummary = hasResult ? regressionResult.residualSummary : null;
  const residualHtml = hasResult ? `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 12px;">
      <div style="background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Residual Count (n)</div>
        <div class="mono-text" style="font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin-top: 4px;">${resSummary.count}</div>
      </div>
      <div style="background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Min Residual</div>
        <div class="mono-text" style="font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin-top: 4px;">${resSummary.min.toFixed(4)}</div>
      </div>
      <div style="background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Max Residual</div>
        <div class="mono-text" style="font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin-top: 4px;">${resSummary.max.toFixed(4)}</div>
      </div>
      <div style="background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
        <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Mean Residual</div>
        <div class="mono-text" style="font-size: 1.15rem; font-weight: 600; color: var(--text-primary); margin-top: 4px;">${resSummary.mean.toFixed(4)} ≈ 0</div>
      </div>
    </div>
    <div style="font-size: 0.8rem; color: var(--text-muted);">
      Residuals: <strong>eᵢ = yᵢ − ŷᵢ</strong>. By OLS properties, sum of residuals equals zero.
    </div>
  ` : `
    <div style="padding: 16px; background-color: var(--bg-muted); border-radius: var(--radius-sm); border: 1px dashed var(--border-strong); text-align: center; color: var(--text-muted); font-size: 0.85rem;">
      Residual metrics will populate after clicking "Build Model".
    </div>
  `;

  const residualCard = createSectionCard({
    title: 'Residual Diagnostics',
    subtitle: 'Observed vs. predicted difference parameters',
    contentHtml: residualHtml
  });
  container.appendChild(residualCard);

  // 10. Dynamic Empirical Assumptions Validation (Checked with Dataset)
  const assumptionsList = hasResult && regressionResult.assumptions ? regressionResult.assumptions : [];
  
  const assumptionsContent = hasResult && assumptionsList.length > 0 ? `
    <div class="assumptions-grid">
      ${assumptionsList.map(a => `
        <div class="assumption-item ${a.isSatisfied ? 'satisfied' : 'caution'}">
          <div class="assumption-header">
            <span class="assumption-title">${a.name}</span>
            <span class="assumption-badge ${a.isSatisfied ? 'badge-satisfied' : 'badge-caution'}">
              ${a.isSatisfied ? '✓ Satisfied' : '⚠ Caution'}
            </span>
          </div>
          <div class="assumption-metric">${a.metricName}: <strong>${a.metricValue}</strong></div>
          <div class="assumption-desc">${a.description}</div>
        </div>
      `).join('')}
    </div>
  ` : `
    <div class="assumptions-grid">
      <div class="assumption-item">
        <div class="assumption-header">
          <span class="assumption-title">1. Linearity</span>
        </div>
        <div class="assumption-desc">Evaluates linear correlation (|r| ≥ 0.25) between X and Y.</div>
      </div>
      <div class="assumption-item">
        <div class="assumption-header">
          <span class="assumption-title">2. Independence of Errors</span>
        </div>
        <div class="assumption-desc">Tests residual autocorrelation via Durbin-Watson statistic (DW ≈ 2.0).</div>
      </div>
      <div class="assumption-item">
        <div class="assumption-header">
          <span class="assumption-title">3. Homoscedasticity</span>
        </div>
        <div class="assumption-desc">Validates equal error variance across different ranges of X.</div>
      </div>
      <div class="assumption-item">
        <div class="assumption-header">
          <span class="assumption-title">4. Normality of Residuals</span>
        </div>
        <div class="assumption-desc">Checks symmetrical residual distribution via skewness analysis.</div>
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">
      Click "Build Model" to evaluate empirical assumption conditions for the selected dataset variables.
    </div>
  `;

  const assumptionsCard = createSectionCard({
    title: 'Regression Assumptions Validation',
    subtitle: 'Empirical verification of classical OLS conditions for the uploaded dataset',
    contentHtml: assumptionsContent
  });
  container.appendChild(assumptionsCard);

  return container;
}
