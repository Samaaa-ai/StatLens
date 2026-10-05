/**
 * SectionCard Component
 * Analytical white container for sections, interpretations, tables, and metric breakdowns.
 */

export function createSectionCard({ title, subtitle = '', badge = '', contentHtml = '', footerHtml = '', className = '' }) {
  const card = document.createElement('div');
  card.className = `card ${className}`.trim();

  card.innerHTML = `
    ${title ? `
      <div class="card-header">
        <div>
          <h3 class="card-title">${title}</h3>
          ${subtitle ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${subtitle}</p>` : ''}
        </div>
        ${badge ? `<div class="card-header-badge">${badge}</div>` : ''}
      </div>
    ` : ''}
    <div class="card-body">
      ${contentHtml}
    </div>
    ${footerHtml ? `<div class="card-footer">${footerHtml}</div>` : ''}
  `;

  return card;
}
