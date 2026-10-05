/**
 * StatLens — Statistical Relationship & Regression Analyzer
 * Application Entrypoint
 */

import { appState } from './state/appState.js';
import { createSidebar } from './components/Sidebar.js';
import { renderDashboardPage } from './pages/DashboardPage.js';
import { renderCorrelationPage } from './pages/CorrelationPage.js';
import { renderRegressionPage } from './pages/RegressionPage.js';
import { renderReportPage } from './pages/ReportPage.js';

function initApp() {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  appElement.innerHTML = '';

  // 1. Create Sidebar
  const sidebar = createSidebar();
  appElement.appendChild(sidebar);

  // 2. Backdrop for mobile view
  const backdrop = document.createElement('div');
  backdrop.className = 'sidebar-backdrop';
  backdrop.addEventListener('click', () => {
    appState.toggleSidebar(false);
  });
  appElement.appendChild(backdrop);

  // 3. Main Content Wrapper
  const mainContent = document.createElement('main');
  mainContent.className = 'main-content';

  // Mobile Top Header Bar
  const mobileHeader = document.createElement('div');
  mobileHeader.className = 'mobile-header';
  mobileHeader.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">STATLENS</span>
      <span style="font-size: 0.75rem; color: var(--text-muted);">Lab</span>
    </div>
    <button class="mobile-menu-btn" id="mobileMenuToggle" aria-label="Toggle Navigation Menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  `;
  mainContent.appendChild(mobileHeader);

  // Page Viewport Container
  const pageWrapper = document.createElement('div');
  pageWrapper.className = 'page-wrapper';
  pageWrapper.id = 'pageWrapper';
  mainContent.appendChild(pageWrapper);

  appElement.appendChild(mainContent);

  // Mobile Menu Toggle Event
  const menuToggle = mobileHeader.querySelector('#mobileMenuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      appState.toggleSidebar();
    });
  }

  // Page Router
  function renderCurrentPage(state) {
    const { currentPage, sidebarOpen } = state;

    // Handle mobile backdrop
    if (sidebarOpen) {
      backdrop.classList.add('open');
    } else {
      backdrop.classList.remove('open');
    }

    pageWrapper.innerHTML = '';

    switch (currentPage) {
      case 'dashboard':
        pageWrapper.appendChild(renderDashboardPage());
        break;
      case 'correlation':
        pageWrapper.appendChild(renderCorrelationPage());
        break;
      case 'regression':
        pageWrapper.appendChild(renderRegressionPage());
        break;
      case 'report':
        pageWrapper.appendChild(renderReportPage());
        break;
      default:
        pageWrapper.appendChild(renderDashboardPage());
    }
  }

  // Handle URL hash on initial load
  const hash = window.location.hash.replace('#', '');
  if (['dashboard', 'correlation', 'regression', 'report'].includes(hash)) {
    appState.navigateTo(hash);
  }

  // Subscribe to state changes for reactivity
  appState.subscribe(renderCurrentPage);

  // Initial render
  renderCurrentPage(appState.getState());
}

// Start application after DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
