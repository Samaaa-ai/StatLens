/**
 * MetricCard Component
 * Displays statistical indicators with academic clarity, monospace values, and clean styling without distracting icons.
 */

export function createMetricCard({ label, value = '—', subtext = '' }) {
  const card = document.createElement('div');
  card.className = 'metric-card';

  const isPlaceholder = value === '—' || value === null || value === undefined;

  card.innerHTML = `
    <div class="metric-header">
      <span class="metric-label">${label}</span>
    </div>
    <div class="metric-value ${isPlaceholder ? 'metric-placeholder' : ''}">
      ${value ?? '—'}
    </div>
    ${subtext ? `<div class="metric-subtext">${subtext}</div>` : ''}
  `;

  return card;
}
