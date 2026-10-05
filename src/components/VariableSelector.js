/**
 * VariableSelector Component
 * Provides clean academic dropdown selectors for independent/dependent (X/Y) numerical variables,
 * with validation enforcing X ≠ Y and numerical-only selection.
 */

export function createVariableSelector({
  xLabel = 'X Variable',
  xTag = 'X',
  yLabel = 'Y Variable',
  yTag = 'Y',
  buttonText = 'Analyze Relationship',
  options = [],
  selectedX = '',
  selectedY = '',
  onChange = null,
  onAction = null,
  disabled = false
}) {
  const container = document.createElement('div');
  container.className = 'variable-selection-card';

  const hasEnoughOptions = options.length >= 2;
  const isFormDisabled = disabled || options.length === 0;

  // Validation state: are valid distinct variables selected?
  const isSelectionValid = Boolean(selectedX && selectedY && selectedX !== selectedY && !isFormDisabled);
  const isSameVariable = Boolean(selectedX && selectedY && selectedX === selectedY);

  container.innerHTML = `
    <div class="variable-selection-grid">
      <div class="form-group">
        <label class="form-label" for="varSelectX">
          ${xLabel} <span class="form-label-tag">${xTag}</span>
        </label>
        <select id="varSelectX" class="form-select" ${isFormDisabled ? 'disabled' : ''}>
          <option value="">[ Select variable ]</option>
          ${options.map(opt => `
            <option value="${opt}" ${selectedX === opt ? 'selected' : ''}>
              ${opt}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="varSelectY">
          ${yLabel} <span class="form-label-tag">${yTag}</span>
        </label>
        <select id="varSelectY" class="form-select" ${isFormDisabled ? 'disabled' : ''}>
          <option value="">[ Select variable ]</option>
          ${options.map(opt => `
            <option value="${opt}" ${selectedY === opt ? 'selected' : ''} ${opt === selectedX ? 'disabled style="color: var(--text-muted);"' : ''}>
              ${opt} ${opt === selectedX ? '(Selected as ' + xTag + ')' : ''}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="form-action-group">
        <button class="btn btn-primary" id="varActionBtn" ${!isSelectionValid ? 'disabled' : ''}>
          ${buttonText}
        </button>
      </div>
    </div>

    ${isSameVariable ? `
      <div class="validation-alert alert-warning" style="margin-top: 14px;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>The ${xTag} and ${yTag} variables must be different numerical fields.</span>
      </div>
    ` : ''}

    ${!isFormDisabled && !hasEnoughOptions ? `
      <div class="validation-alert alert-warning" style="margin-top: 14px;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>At least two numerical variables are required for bivariate analysis. Current dataset has ${options.length}.</span>
      </div>
    ` : ''}
  `;

  const selectX = container.querySelector('#varSelectX');
  const selectY = container.querySelector('#varSelectY');
  const actionBtn = container.querySelector('#varActionBtn');

  if (selectX) {
    selectX.addEventListener('change', (e) => {
      const newX = e.target.value;
      if (onChange) {
        onChange({ x: newX, y: selectY.value });
      }
    });
  }

  if (selectY) {
    selectY.addEventListener('change', (e) => {
      const newY = e.target.value;
      if (onChange) {
        onChange({ x: selectX.value, y: newY });
      }
    });
  }

  if (actionBtn && onAction) {
    actionBtn.addEventListener('click', () => {
      if (isSelectionValid) {
        onAction({ x: selectX.value, y: selectY.value });
      }
    });
  }

  return container;
}
