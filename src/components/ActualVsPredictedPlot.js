/**
 * ActualVsPredictedPlot Component
 * High-precision SVG visualization comparing Observed Actual Y versus Model Predicted Ŷ.
 * Features an identity reference line (Actual = Predicted), residual inspection tooltips,
 * and dynamic domain scaling.
 */

export function createActualVsPredictedPlot({
  residuals = [],
  yLabel = 'Y',
  width = 700,
  height = 360
}) {
  const container = document.createElement('div');
  container.className = 'actual-vs-predicted-plot-container';
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.height = '100%';

  if (!residuals || residuals.length === 0) {
    return container;
  }

  // Margin conventions
  const margin = { top: 24, right: 30, bottom: 50, left: 65 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Compute common domain across both Actual (y) and Predicted (yHat) for proportional square scaling
  const allVals = residuals.flatMap(r => [r.y, r.yHat]);
  let minVal = Math.min(...allVals);
  let maxVal = Math.max(...allVals);

  const span = maxVal - minVal || 1;
  minVal -= span * 0.08;
  maxVal += span * 0.08;

  // Scale functions
  const scaleX = (val) => margin.left + ((val - minVal) / (maxVal - minVal)) * plotWidth;
  const scaleY = (val) => margin.top + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight;

  // Ticks
  const numTicks = 5;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(minVal + (i / numTicks) * (maxVal - minVal));
  }

  function formatTick(num) {
    if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.01 && num !== 0)) {
      return num.toExponential(1);
    }
    return parseFloat(num.toFixed(2)).toString();
  }

  // Build SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'analytical-svg-plot');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Actual versus Predicted plot for ${yLabel}`);

  // Grid Lines
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('class', 'plot-grid');

  ticks.forEach(tickVal => {
    const xPos = scaleX(tickVal);
    const yPos = scaleY(tickVal);

    const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    vLine.setAttribute('x1', xPos);
    vLine.setAttribute('y1', margin.top);
    vLine.setAttribute('x2', xPos);
    vLine.setAttribute('y2', margin.top + plotHeight);
    vLine.setAttribute('stroke', '#e2e8f0');
    vLine.setAttribute('stroke-dasharray', '3 3');
    gridGroup.appendChild(vLine);

    const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hLine.setAttribute('x1', margin.left);
    hLine.setAttribute('y1', yPos);
    hLine.setAttribute('x2', margin.left + plotWidth);
    hLine.setAttribute('y2', yPos);
    hLine.setAttribute('stroke', '#e2e8f0');
    hLine.setAttribute('stroke-dasharray', '3 3');
    gridGroup.appendChild(hLine);
  });

  svg.appendChild(gridGroup);

  // Identity Reference Line (Actual = Predicted)
  const identityLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  identityLine.setAttribute('x1', scaleX(minVal));
  identityLine.setAttribute('y1', scaleY(minVal));
  identityLine.setAttribute('x2', scaleX(maxVal));
  identityLine.setAttribute('y2', scaleY(maxVal));
  identityLine.setAttribute('stroke', '#059669'); // Emerald green identity reference
  identityLine.setAttribute('stroke-width', '2');
  identityLine.setAttribute('stroke-dasharray', '5 4');
  svg.appendChild(identityLine);

  // Axes
  const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  axesGroup.setAttribute('class', 'plot-axes');

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', margin.top + plotHeight);
  xAxis.setAttribute('x2', margin.left + plotWidth);
  xAxis.setAttribute('y2', margin.top + plotHeight);
  xAxis.setAttribute('stroke', '#64748b');
  xAxis.setAttribute('stroke-width', '1.5');
  axesGroup.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', margin.left);
  yAxis.setAttribute('y1', margin.top);
  yAxis.setAttribute('x2', margin.left);
  yAxis.setAttribute('y2', margin.top + plotHeight);
  yAxis.setAttribute('stroke', '#64748b');
  yAxis.setAttribute('stroke-width', '1.5');
  axesGroup.appendChild(yAxis);

  // Tick Labels
  const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelsGroup.setAttribute('class', 'plot-tick-labels');

  ticks.forEach(tickVal => {
    const xPos = scaleX(tickVal);
    const yPos = scaleY(tickVal);

    const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xText.setAttribute('x', xPos);
    xText.setAttribute('y', margin.top + plotHeight + 18);
    xText.setAttribute('text-anchor', 'middle');
    xText.setAttribute('fill', '#64748b');
    xText.setAttribute('font-size', '11');
    xText.setAttribute('font-family', 'var(--font-mono)');
    xText.textContent = formatTick(tickVal);
    labelsGroup.appendChild(xText);

    const yText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yText.setAttribute('x', margin.left - 10);
    yText.setAttribute('y', yPos + 4);
    yText.setAttribute('text-anchor', 'end');
    yText.setAttribute('fill', '#64748b');
    yText.setAttribute('font-size', '11');
    yText.setAttribute('font-family', 'var(--font-mono)');
    yText.textContent = formatTick(tickVal);
    labelsGroup.appendChild(yText);
  });

  // Axis Titles
  const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xTitle.setAttribute('x', margin.left + plotWidth / 2);
  xTitle.setAttribute('y', height - 10);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('fill', '#1e293b');
  xTitle.setAttribute('font-size', '12');
  xTitle.setAttribute('font-weight', '600');
  xTitle.textContent = `Predicted ${yLabel} (Ŷ)`;
  labelsGroup.appendChild(xTitle);

  const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yTitle.setAttribute('transform', `rotate(-90, 18, ${margin.top + plotHeight / 2})`);
  yTitle.setAttribute('x', 18);
  yTitle.setAttribute('y', margin.top + plotHeight / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('fill', '#1e293b');
  yTitle.setAttribute('font-size', '12');
  yTitle.setAttribute('font-weight', '600');
  yTitle.textContent = `Actual ${yLabel} (Y)`;
  labelsGroup.appendChild(yTitle);

  svg.appendChild(axesGroup);
  svg.appendChild(labelsGroup);

  // Data Points
  const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'plot-points');

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'plot-tooltip';
  tooltip.style.display = 'none';
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.backgroundColor = '#0f172a';
  tooltip.style.color = '#ffffff';
  tooltip.style.padding = '8px 12px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.fontSize = '11px';
  tooltip.style.fontFamily = 'var(--font-mono)';
  tooltip.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.2)';
  tooltip.style.zIndex = '100';
  tooltip.style.transform = 'translate(-50%, -120%)';
  tooltip.style.whiteSpace = 'nowrap';
  container.appendChild(tooltip);

  residuals.forEach((p) => {
    const cx = scaleX(p.yHat);
    const cy = scaleY(p.y);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '4.5');
    circle.setAttribute('fill', '#2563eb');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '1.5');
    circle.setAttribute('class', 'plot-dot');
    circle.style.transition = 'r 0.15s ease, fill 0.15s ease';
    circle.style.cursor = 'crosshair';

    circle.addEventListener('mouseenter', () => {
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', '#1d4ed8');

      const rect = container.getBoundingClientRect();
      const ptX = (cx / width) * rect.width;
      const ptY = (cy / height) * rect.height;

      tooltip.innerHTML = `
        <div style="color: #94a3b8; font-size: 10px; margin-bottom: 3px;">Observation #${p.rowId}</div>
        <div>Predicted Ŷ: <strong>${p.yHat.toFixed(4)}</strong></div>
        <div>Actual Y: <strong>${p.y.toFixed(4)}</strong></div>
        <div>Residual (e): <strong>${p.residual >= 0 ? '+' : ''}${p.residual.toFixed(4)}</strong></div>
      `;
      tooltip.style.left = `${ptX}px`;
      tooltip.style.top = `${ptY}px`;
      tooltip.style.display = 'block';
    });

    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', '4.5');
      circle.setAttribute('fill', '#2563eb');
      tooltip.style.display = 'none';
    });

    pointsGroup.appendChild(circle);
  });

  svg.appendChild(pointsGroup);
  container.appendChild(svg);

  return container;
}
