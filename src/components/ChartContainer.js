/**
 * ChartContainer Component
 * Renders statistical visualization frame with axes grid and empty state indicators.
 */

import { createEmptyState } from './EmptyState.js';

export function createChartContainer({
  title = 'Scatter Plot',
  badge = 'Bivariate Plot',
  emptyTitle = 'Plot Visualization Pending',
  emptyMessage = 'Select X and Y variables to display the data distribution and trend.'
}) {
  const container = document.createElement('div');
  container.className = 'chart-container';

  const chartIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;

  container.innerHTML = `
    <div class="chart-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
        ${title}
      </h3>
      <span class="badge badge-neutral">${badge}</span>
    </div>
    <div class="chart-viewport" id="chartViewport">
      <div class="chart-grid-preview"></div>
      <div class="chart-content-slot"></div>
    </div>
  `;

  const emptyState = createEmptyState({
    title: emptyTitle,
    message: emptyMessage,
    icon: chartIcon
  });

  container.querySelector('.chart-content-slot').appendChild(emptyState);

  return container;
}
