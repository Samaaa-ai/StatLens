/**
 * ReportPage Component
 * Clean, executive Statistical Analysis Report summarizing dataset parameters, bivariate correlation,
 * scatter visualizations, Simple Linear Regression parameters, regression plot, error metrics with
 * solved formulas on hover, Actual vs Predicted plot, residual diagnostics, and empirical assumptions.
 * Supports instant client-side print / PDF export.
 */

import { createPageHeader } from '../components/PageHeader.js';
import { createSectionCard } from '../components/SectionCard.js';
import { createScatterPlot } from '../components/ScatterPlot.js';
import { createRegressionPlot } from '../components/RegressionPlot.js';
import { createActualVsPredictedPlot } from '../components/ActualVsPredictedPlot.js';
import { createEmptyState } from '../components/EmptyState.js';
import { appState } from '../state/appState.js';

export function renderReportPage() {
  const container = document.createElement('div');
  container.className = 'report-page';

  const { dataset, selectedVars, correlationResult, regressionResult } = appState.getState();
  const corrStats = correlationResult?.isValid ? correlationResult.stats : null;
  const regStats = regressionResult?.isValid ? regressionResult.stats : null;

  // Handle empty state: No dataset loaded
  if (!dataset.isUploaded) {
    const header = createPageHeader({
      title: 'Statistical Analysis Report',
      subtitle: 'Summary of bivariate relationship and regression model.'
    });
    container.appendChild(header);

    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'card';
    emptyContainer.style.padding = '40px 20px';

    const emptyState = createEmptyState({
      title: 'No Dataset Loaded',
      message: 'Upload a CSV dataset or load sample data on the Dashboard to generate the report.',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    });

    const actionBtn = document.createElement('button');
    actionBtn.className = 'btn btn-primary';
    actionBtn.style.marginTop = '16px';
    actionBtn.textContent = 'Go to Dashboard →';
    actionBtn.addEventListener('click', () => {
      appState.navigateTo('dashboard');
    });

    emptyState.appendChild(actionBtn);
    emptyContainer.appendChild(emptyState);
    container.appendChild(emptyContainer);
    return container;
  }

  // Format report timestamp
  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 1. Report Header & Export Action Button
  const exportBtnHtml = `
    <button class="btn btn-primary" id="exportReportBtn">
      <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Export Report / Print
    </button>
  `;

  const header = createPageHeader({
    title: 'Statistical Analysis Report',
    subtitle: `Generated on ${formattedDate} for dataset: ${dataset.fileName}`,
    actionsHtml: exportBtnHtml
  });
  container.appendChild(header);

  // Hook export button click to trigger browser print
  const exportBtn = header.querySelector('#exportReportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Report Section List Container
  const sectionList = document.createElement('div');
  sectionList.className = 'report-section-list';

  // 2. Dataset Summary Section (Section 1)
  const nVal = correlationResult?.n || regressionResult?.n || dataset.rows;

  const datasetSummaryHtml = `
    <table class="supporting-stats-table">
      <tbody>
        <tr>
          <td class="supporting-stats-label">Dataset Filename</td>
          <td class="supporting-stats-value mono-text">${dataset.fileName}</td>
          <td class="supporting-stats-label">Total Observations (N)</td>
          <td class="supporting-stats-value mono-text">${dataset.rows.toLocaleString()}</td>
        </tr>
        <tr>
          <td class="supporting-stats-label">Total Columns</td>
          <td class="supporting-stats-value mono-text">${dataset.columns}</td>
          <td class="supporting-stats-label">Numerical Variables</td>
          <td class="supporting-stats-value mono-text">${dataset.numericalVars}</td>
        </tr>
        <tr>
          <td class="supporting-stats-label">Missing Values</td>
          <td class="supporting-stats-value mono-text">${dataset.missingValues}</td>
          <td class="supporting-stats-label">Effective Sample Size (n)</td>
          <td class="supporting-stats-value mono-text">${nVal}</td>
        </tr>
        <tr>
          <td class="supporting-stats-label">Independent Variable (X)</td>
          <td class="supporting-stats-value mono-text">${selectedVars.regression.x || selectedVars.correlation.x || '—'}</td>
          <td class="supporting-stats-label">Dependent Variable (Y)</td>
          <td class="supporting-stats-value mono-text">${selectedVars.regression.y || selectedVars.correlation.y || '—'}</td>
        </tr>
      </tbody>
    </table>
  `;

  const datasetSection = createSectionCard({
    title: '1. Dataset Summary',
    subtitle: 'Observation counts, variables, and sample parameters',
    contentHtml: datasetSummaryHtml
  });
  sectionList.appendChild(datasetSection);

  // 3. Correlation Analysis Section (Section 2)
  if (correlationResult && correlationResult.isValid && corrStats) {
    const correlationSummaryHtml = `
      <div style="margin-bottom: 0;">
        <table class="supporting-stats-table">
          <tbody>
            <tr>
              <td class="supporting-stats-label">Independent (X)</td>
              <td class="supporting-stats-value mono-text">${correlationResult.xName}</td>
              <td class="supporting-stats-label">Dependent (Y)</td>
              <td class="supporting-stats-value mono-text">${correlationResult.yName}</td>
            </tr>
            <tr>
              <td class="supporting-stats-label">Mean of X (x̄)</td>
              <td class="supporting-stats-value mono-text">${corrStats.meanX.toFixed(4)}</td>
              <td class="supporting-stats-label">Mean of Y (ȳ)</td>
              <td class="supporting-stats-value mono-text">${corrStats.meanY.toFixed(4)}</td>
            </tr>
            <tr>
              <td class="supporting-stats-label">Sample Variance S²(X)</td>
              <td class="supporting-stats-value mono-text">${corrStats.varianceX.toFixed(4)}</td>
              <td class="supporting-stats-label">Sample Variance S²(Y)</td>
              <td class="supporting-stats-value mono-text">${corrStats.varianceY.toFixed(4)}</td>
            </tr>
            <tr>
              <td class="supporting-stats-label">Std Dev S(X)</td>
              <td class="supporting-stats-value mono-text">${corrStats.stdDevX.toFixed(4)}</td>
              <td class="supporting-stats-label">Std Dev S(Y)</td>
              <td class="supporting-stats-value mono-text">${corrStats.stdDevY.toFixed(4)}</td>
            </tr>
            <tr>
              <td class="supporting-stats-label">Sample Covariance Cov(X,Y)</td>
              <td class="supporting-stats-value mono-text">${corrStats.covariance.toFixed(4)}</td>
              <td class="supporting-stats-label">Pearson Correlation (r)</td>
              <td class="supporting-stats-value mono-text">${corrStats.r !== null ? corrStats.r.toFixed(4) : 'Undefined'}</td>
            </tr>
            <tr>
              <td class="supporting-stats-label">Direction</td>
              <td class="supporting-stats-value">${corrStats.direction}</td>
              <td class="supporting-stats-label">Strength</td>
              <td class="supporting-stats-value">${corrStats.strength}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const correlationSection = createSectionCard({
      title: '2. Bivariate Correlation Analysis',
      subtitle: `Sample covariance and Pearson r (n = ${correlationResult.n})`,
      contentHtml: correlationSummaryHtml
    });
    sectionList.appendChild(correlationSection);

    // 4. Correlation Visualization (Scatter Plot)
    const scatterCard = document.createElement('div');
    scatterCard.className = 'card';
    scatterCard.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="8" r="2"></circle>
            <circle cx="16" cy="16" r="2"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="18" cy="6" r="2"></circle>
            <circle cx="6" cy="18" r="2"></circle>
          </svg>
          Scatter Plot
        </h3>
        <span class="badge badge-neutral">${correlationResult.xName} vs ${correlationResult.yName}</span>
      </div>
      <div class="card-body" style="padding: 12px; background: #ffffff;" id="reportScatterSlot">
      </div>
    `;
    const scatterSlot = scatterCard.querySelector('#reportScatterSlot');
    const plot = createScatterPlot({
      pairs: correlationResult.pairs,
      xLabel: correlationResult.xName,
      yLabel: correlationResult.yName,
      width: 760,
      height: 340
    });
    scatterSlot.appendChild(plot);
    sectionList.appendChild(scatterCard);
  } else {
    const corrPlaceholder = createSectionCard({
      title: '2. Bivariate Correlation Analysis',
      subtitle: 'Linear association summary',
      contentHtml: `<div style="text-align: center; color: var(--text-muted); padding: 16px;">Perform analysis on the Correlation page to include in this report.</div>`
    });
    sectionList.appendChild(corrPlaceholder);
  }

  // 5. Simple Linear Regression Summary Section (Section 3)
  if (regressionResult && regressionResult.isValid && regStats) {
    const regressionSummaryHtml = `
      <div style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">Fitted Regression Equation</div>
          <div class="mono-text" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-top: 3px;">${regStats.equation}</div>
        </div>
        <span class="badge badge-neutral">OLS Best Fit</span>
      </div>

      <table class="supporting-stats-table" style="margin-bottom: 16px;">
        <tbody>
          <tr>
            <td class="supporting-stats-label">Slope Coefficient (β₁)</td>
            <td class="supporting-stats-value mono-text">${regStats.slope.toFixed(4)}</td>
            <td class="supporting-stats-label">Intercept (β₀)</td>
            <td class="supporting-stats-value mono-text">${regStats.intercept.toFixed(4)}</td>
          </tr>
          <tr>
            <td class="supporting-stats-label">Sum of Squared Errors (SSE)</td>
            <td class="supporting-stats-value mono-text">${regStats.sse.toFixed(4)}</td>
            <td class="supporting-stats-label">Estimation Method</td>
            <td class="supporting-stats-value">Ordinary Least Squares</td>
          </tr>
          <tr>
            <td class="supporting-stats-label">Independent Variable (X)</td>
            <td class="supporting-stats-value mono-text">${regressionResult.xName}</td>
            <td class="supporting-stats-label">Dependent Variable (Y)</td>
            <td class="supporting-stats-value mono-text">${regressionResult.yName}</td>
          </tr>
          <tr>
            <td class="supporting-stats-label">Sample Size (n)</td>
            <td class="supporting-stats-value mono-text">${regressionResult.n}</td>
            <td class="supporting-stats-label">Degrees of Freedom (n − 2)</td>
            <td class="supporting-stats-value mono-text">${Math.max(0, regressionResult.n - 2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="padding: 12px 16px; background-color: var(--bg-muted); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
        <strong>Model Interpretation:</strong> For every 1-unit increase in <strong>${regressionResult.xName}</strong>, the expected value of <strong>${regressionResult.yName}</strong> changes by <strong>${regStats.slope.toFixed(4)}</strong> units, with a baseline intercept of <strong>${regStats.intercept.toFixed(4)}</strong> when ${regressionResult.xName} = 0.
      </div>
    `;

    const regressionSection = createSectionCard({
      title: '3. Simple Linear Regression (OLS Model)',
      subtitle: `Ordinary Least Squares parameter estimates`,
      contentHtml: regressionSummaryHtml
    });
    sectionList.appendChild(regressionSection);

    // 6. Regression Visualization (Fitted Line Plot)
    const regPlotCard = document.createElement('div');
    regPlotCard.className = 'card';
    regPlotCard.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="21" x2="21" y2="3"></line>
            <circle cx="7" cy="14" r="1.5"></circle>
            <circle cx="11" cy="9" r="1.5"></circle>
            <circle cx="17" cy="6" r="1.5"></circle>
            <circle cx="15" cy="13" r="1.5"></circle>
          </svg>
          Fitted Regression Line
        </h3>
        <span class="badge badge-neutral">ŷ = β₀ + β₁X</span>
      </div>
      <div class="card-body" style="padding: 12px; background: #ffffff;" id="reportRegPlotSlot">
      </div>
    `;
    const regSlot = regPlotCard.querySelector('#reportRegPlotSlot');
    const regPlot = createRegressionPlot({
      pairs: regressionResult.pairs,
      intercept: regStats.intercept,
      slope: regStats.slope,
      xLabel: regressionResult.xName,
      yLabel: regressionResult.yName,
      width: 760,
      height: 340
    });
    regSlot.appendChild(regPlot);
    sectionList.appendChild(regPlotCard);

    // 7. Regression Error Metrics Section (SSE, MAE, MSE, RMSE) with solved hover tooltips
    const sumAbsE = (regStats.mae * regressionResult.n).toFixed(4);

    const errorSummaryHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">MAE</span>
            <div class="error-info-trigger" aria-label="MAE Formula">
              i
              <div class="error-formula-popover">
                <div class="popover-title">Mean Absolute Error (MAE)</div>
                <div class="popover-formula">MAE = (1/n) Σ |yᵢ − ŷᵢ|</div>
                <div class="popover-step">
                  • Sum of absolute residuals = ${sumAbsE}<br/>
                  • n = ${regressionResult.n}<br/>
                  • MAE = <strong>${regStats.mae.toFixed(4)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="metric-value">${regStats.mae.toFixed(4)}</div>
          <div class="metric-subtext">Mean Absolute Error</div>
        </div>

        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">MSE</span>
            <div class="error-info-trigger" aria-label="MSE Formula">
              i
              <div class="error-formula-popover">
                <div class="popover-title">Mean Squared Error (MSE)</div>
                <div class="popover-formula">MSE = SSE / n</div>
                <div class="popover-step">
                  • SSE = ${regStats.sse.toFixed(4)}<br/>
                  • n = ${regressionResult.n}<br/>
                  • MSE = <strong>${regStats.mse.toFixed(4)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="metric-value">${regStats.mse.toFixed(4)}</div>
          <div class="metric-subtext">Mean Squared Error</div>
        </div>

        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">RMSE</span>
            <div class="error-info-trigger" aria-label="RMSE Formula">
              i
              <div class="error-formula-popover">
                <div class="popover-title">Root Mean Squared Error (RMSE)</div>
                <div class="popover-formula">RMSE = √(MSE)</div>
                <div class="popover-step">
                  • MSE = ${regStats.mse.toFixed(4)}<br/>
                  • RMSE = <strong>${regStats.rmse.toFixed(4)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="metric-value">${regStats.rmse.toFixed(4)}</div>
          <div class="metric-subtext">Root Mean Squared Error</div>
        </div>

        <div class="metric-card error-metric-card" style="margin-bottom: 0; box-shadow: none; border-color: var(--border-subtle);">
          <div class="metric-header">
            <span class="metric-label">SSE</span>
            <div class="error-info-trigger" aria-label="SSE Formula">
              i
              <div class="error-formula-popover">
                <div class="popover-title">Sum of Squared Errors (SSE)</div>
                <div class="popover-formula">SSE = Σ (yᵢ − ŷᵢ)²</div>
                <div class="popover-step">
                  • Total squared residual sum across n = ${regressionResult.n}<br/>
                  • SSE = <strong>${regStats.sse.toFixed(4)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div class="metric-value">${regStats.sse.toFixed(4)}</div>
          <div class="metric-subtext">Sum of Squared Errors</div>
        </div>
      </div>
    `;

    const errorSection = createSectionCard({
      title: '4. Regression Error Metrics',
      subtitle: 'Residual accuracy and fit statistics (hover ⓘ for formulas & solutions)',
      contentHtml: errorSummaryHtml
    });
    sectionList.appendChild(errorSection);

    // 8. Actual vs Predicted Visualization (without Identity badge)
    const actPredCard = document.createElement('div');
    actPredCard.className = 'card';
    actPredCard.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          Actual vs Predicted
        </h3>
      </div>
      <div class="card-body" style="padding: 12px; background: #ffffff;" id="reportActPredSlot">
      </div>
    `;
    const actSlot = actPredCard.querySelector('#reportActPredSlot');
    const actPlot = createActualVsPredictedPlot({
      residuals: regressionResult.residuals,
      yLabel: regressionResult.yName,
      width: 760,
      height: 320
    });
    actSlot.appendChild(actPlot);
    sectionList.appendChild(actPredCard);

    // 9. Residual Diagnostics Section
    const resSummary = regressionResult.residualSummary;
    const residualHtml = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 12px;">
        <div style="background: var(--bg-subtle); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600;">Count (n)</div>
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
    `;

    const residualSection = createSectionCard({
      title: '5. Residual Diagnostics',
      subtitle: 'Diagnostic properties of residuals (eᵢ = yᵢ − ŷᵢ)',
      contentHtml: residualHtml
    });
    sectionList.appendChild(residualSection);

    // 10. Empirical Assumptions Evaluation Section
    const assumptionsList = regressionResult.assumptions || [];
    const assumptionsContent = assumptionsList.length > 0 ? `
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
      <div style="text-align: center; color: var(--text-muted); padding: 12px;">Assumptions evaluation pending.</div>
    `;

    const assumptionsSection = createSectionCard({
      title: '6. Regression Assumptions Evaluation',
      subtitle: 'Empirical condition checks based on current dataset values',
      contentHtml: assumptionsContent
    });
    sectionList.appendChild(assumptionsSection);

  } else {
    const regPlaceholder = createSectionCard({
      title: '3. Simple Linear Regression (OLS Model)',
      subtitle: 'Model parameters and diagnostics',
      contentHtml: `<div style="text-align: center; color: var(--text-muted); padding: 16px;">Build the model on the Regression page to include in this report.</div>`
    });
    sectionList.appendChild(regPlaceholder);
  }

  container.appendChild(sectionList);
  return container;
}
