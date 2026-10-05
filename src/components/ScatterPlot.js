/**
 * ScatterPlot Component
 * High-precision, zero-dependency SVG bivariate scatter plot for analytical data exploration.
 * Features auto-scaling, formatted axes, grid lines, and interactive point inspection tooltips.
 */

export function createScatterPlot({
  pairs = [],
  xLabel = 'X Variable',
  yLabel = 'Y Variable',
  width = 700,
  height = 380
}) {
  const container = document.createElement('div');
  container.className = 'scatter-plot-container';
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.height = '100%';

  if (!pairs || pairs.length === 0) {
    return container;
  }

  // Margin conventions
  const margin = { top: 24, right: 30, bottom: 50, left: 65 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Compute domains
  const xValues = pairs.map(p => p.x);
  const yValues = pairs.map(p => p.y);

  let minX = Math.min(...xValues);
  let maxX = Math.max(...xValues);
  let minY = Math.min(...yValues);
  let maxY = Math.max(...yValues);

  // Add 8% padding to domains so points don't clip on the boundary edges
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;
  minX -= xSpan * 0.08;
  maxX += xSpan * 0.08;
  minY -= ySpan * 0.08;
  maxY += ySpan * 0.08;

  // Scale mapping functions
  const scaleX = (val) => margin.left + ((val - minX) / (maxX - minX)) * plotWidth;
  const scaleY = (val) => margin.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;

  // Generate 5-6 clean tick intervals
  const numTicks = 5;
  const xTicks = [];
  const yTicks = [];

  for (let i = 0; i <= numTicks; i++) {
    const frac = i / numTicks;
    xTicks.push(minX + frac * (maxX - minX));
    yTicks.push(minY + frac * (maxY - minY));
  }

  function formatTick(num) {
    if (Math.abs(num) >= 1000 || (Math.abs(num) < 0.01 && num !== 0)) {
      return num.toExponential(1);
    }
    return parseFloat(num.toFixed(2)).toString();
  }

  // Build SVG XML
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'analytical-svg-plot');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Scatter plot of ${xLabel} versus ${yLabel}`);

  // Background Grid Lines
  const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  gridGroup.setAttribute('class', 'plot-grid');

  // Vertical grid lines
  xTicks.forEach(tickVal => {
    const xPos = scaleX(tickVal);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', xPos);
    line.setAttribute('y1', margin.top);
    line.setAttribute('x2', xPos);
    line.setAttribute('y2', margin.top + plotHeight);
    line.setAttribute('stroke', '#e2e8f0');
    line.setAttribute('stroke-dasharray', '3 3');
    gridGroup.appendChild(line);
  });

  // Horizontal grid lines
  yTicks.forEach(tickVal => {
    const yPos = scaleY(tickVal);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', margin.left);
    line.setAttribute('y1', yPos);
    line.setAttribute('x2', margin.left + plotWidth);
    line.setAttribute('y2', yPos);
    line.setAttribute('stroke', '#e2e8f0');
    line.setAttribute('stroke-dasharray', '3 3');
    gridGroup.appendChild(line);
  });

  svg.appendChild(gridGroup);

  // Axes lines
  const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  axesGroup.setAttribute('class', 'plot-axes');

  // X Axis Line
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', margin.left);
  xAxis.setAttribute('y1', margin.top + plotHeight);
  xAxis.setAttribute('x2', margin.left + plotWidth);
  xAxis.setAttribute('y2', margin.top + plotHeight);
  xAxis.setAttribute('stroke', '#64748b');
  xAxis.setAttribute('stroke-width', '1.5');
  axesGroup.appendChild(xAxis);

  // Y Axis Line
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

  // X Ticks
  xTicks.forEach(tickVal => {
    const xPos = scaleX(tickVal);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', xPos);
    text.setAttribute('y', margin.top + plotHeight + 18);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#64748b');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.textContent = formatTick(tickVal);
    labelsGroup.appendChild(text);
  });

  // Y Ticks
  yTicks.forEach(tickVal => {
    const yPos = scaleY(tickVal);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', margin.left - 10);
    text.setAttribute('y', yPos + 4);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', '#64748b');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-family', 'var(--font-mono)');
    text.textContent = formatTick(tickVal);
    labelsGroup.appendChild(text);
  });

  // Axis Title: X Axis
  const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xTitle.setAttribute('x', margin.left + plotWidth / 2);
  xTitle.setAttribute('y', height - 10);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('fill', '#1e293b');
  xTitle.setAttribute('font-size', '12');
  xTitle.setAttribute('font-weight', '600');
  xTitle.textContent = `${xLabel} (X)`;
  labelsGroup.appendChild(xTitle);

  // Axis Title: Y Axis (rotated)
  const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yTitle.setAttribute('transform', `rotate(-90, 18, ${margin.top + plotHeight / 2})`);
  yTitle.setAttribute('x', 18);
  yTitle.setAttribute('y', margin.top + plotHeight / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('fill', '#1e293b');
  yTitle.setAttribute('font-size', '12');
  yTitle.setAttribute('font-weight', '600');
  yTitle.textContent = `${yLabel} (Y)`;
  labelsGroup.appendChild(yTitle);

  svg.appendChild(axesGroup);
  svg.appendChild(labelsGroup);

  // Data Points
  const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'plot-points');

  // Tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'plot-tooltip';
  tooltip.style.display = 'none';
  tooltip.style.position = 'absolute';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.backgroundColor = '#0f172a';
  tooltip.style.color = '#ffffff';
  tooltip.style.padding = '6px 10px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.fontSize = '11px';
  tooltip.style.fontFamily = 'var(--font-mono)';
  tooltip.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.2)';
  tooltip.style.zIndex = '100';
  tooltip.style.transform = 'translate(-50%, -120%)';
  tooltip.style.whiteSpace = 'nowrap';
  container.appendChild(tooltip);

  pairs.forEach((p) => {
    const cx = scaleX(p.x);
    const cy = scaleY(p.y);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '4.5');
    circle.setAttribute('fill', '#1e40af');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '1.5');
    circle.setAttribute('class', 'plot-dot');
    circle.style.transition = 'r 0.15s ease, fill 0.15s ease';
    circle.style.cursor = 'crosshair';

    circle.addEventListener('mouseenter', (evt) => {
      circle.setAttribute('r', '7');
      circle.setAttribute('fill', '#2563eb');
      
      const rect = container.getBoundingClientRect();
      const ptX = (cx / width) * rect.width;
      const ptY = (cy / height) * rect.height;

      tooltip.innerHTML = `
        <div style="color: #94a3b8; font-size: 10px; margin-bottom: 2px;">Observation #${p.rowId}</div>
        <div>${xLabel}: <strong>${p.x}</strong></div>
        <div>${yLabel}: <strong>${p.y}</strong></div>
      `;
      tooltip.style.left = `${ptX}px`;
      tooltip.style.top = `${ptY}px`;
      tooltip.style.display = 'block';
    });

    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', '4.5');
      circle.setAttribute('fill', '#1e40af');
      tooltip.style.display = 'none';
    });

    pointsGroup.appendChild(circle);
  });

  svg.appendChild(pointsGroup);
  container.appendChild(svg);

  return container;
}
