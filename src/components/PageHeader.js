/**
 * PageHeader Component
 * Renders consistent page headers with titles, academic subtitles, and optional action buttons.
 */

export function createPageHeader({ title, subtitle, actionsHtml = '' }) {
  const header = document.createElement('header');
  header.className = 'page-header';

  header.innerHTML = `
    <div class="page-header-content">
      <h1 class="page-header-title">${title}</h1>
      <p class="page-header-subtitle">${subtitle}</p>
    </div>
    ${actionsHtml ? `<div class="page-header-actions">${actionsHtml}</div>` : ''}
  `;

  return header;
}
