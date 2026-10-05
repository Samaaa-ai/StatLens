/**
 * Sidebar Component
 * Renders the persistent brand identity, exactly 4 navigation sections, and dataset status.
 */

import { appState } from '../state/appState.js';

export function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'mainSidebar';

  // SVG Icons
  const icons = {
    brand: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    correlation: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2"></circle><circle cx="16" cy="16" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="6" cy="18" r="2"></circle></svg>`,
    regression: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="3"></line><circle cx="7" cy="14" r="1.5"></circle><circle cx="11" cy="9" r="1.5"></circle><circle cx="17" cy="6" r="1.5"></circle><circle cx="15" cy="13" r="1.5"></circle></svg>`,
    report: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'correlation', label: 'Correlation', icon: icons.correlation },
    { id: 'regression', label: 'Regression', icon: icons.regression },
    { id: 'report', label: 'Report', icon: icons.report }
  ];

  function render() {
    const { currentPage, dataset, sidebarOpen } = appState.getState();
    
    if (sidebarOpen) {
      sidebar.classList.add('open');
    } else {
      sidebar.classList.remove('open');
    }

    const isReady = dataset.isUploaded;

    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="brand">
          <div class="brand-icon-wrapper">
            ${icons.brand}
          </div>
          <div class="brand-info">
            <span class="brand-title">STATLENS</span>
            <span class="brand-subtitle">Statistical Lab</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Primary Navigation">
        ${navItems.map(item => `
          <a href="#${item.id}" class="nav-item ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="dataset-status-box ${isReady ? 'ready' : ''}">
          <div class="dataset-status-label">Dataset</div>
          <div class="dataset-status-value" title="${isReady ? dataset.fileName : 'Not uploaded'}">
            <span class="dataset-status-dot"></span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
              ${isReady ? dataset.fileName : 'Not uploaded'}
            </span>
          </div>
          ${isReady ? '<div style="font-size: 0.725rem; color: var(--status-ready); margin-top: 3px; font-weight: 600;">● Ready</div>' : ''}
        </div>
      </div>
    `;

    // Event listeners
    sidebar.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('data-page');
        appState.navigateTo(pageId);
      });
    });
  }

  // Subscribe to state changes
  appState.subscribe(render);
  render();

  return sidebar;
}
