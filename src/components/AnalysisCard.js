/**
 * AnalysisCard Component
 * Large analytical launchpad cards used on the Dashboard for Correlation and Regression workflows.
 */

import { appState } from '../state/appState.js';

export function createAnalysisCard({ title, badge, description, concepts = [], targetPage }) {
  const card = document.createElement('div');
  card.className = 'analysis-card';

  card.innerHTML = `
    <div class="analysis-card-top">
      ${badge ? `<div class="analysis-badge">${badge}</div>` : ''}
      <h3 class="analysis-title">${title}</h3>
      <p class="analysis-description">${description}</p>
      
      <div class="concept-pills">
        ${concepts.map(concept => `<span class="concept-pill">${concept}</span>`).join('')}
      </div>
    </div>

    <div class="analysis-card-bottom">
      <button class="btn btn-primary analysis-nav-btn" data-target="${targetPage}">
        Open Analysis →
      </button>
    </div>
  `;

  const btn = card.querySelector('.analysis-nav-btn');
  btn.addEventListener('click', () => {
    appState.navigateTo(targetPage);
  });

  return card;
}
