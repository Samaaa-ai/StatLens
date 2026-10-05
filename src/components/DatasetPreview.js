/**
 * DatasetPreview Component
 * Displays a clean, compact analytical table preview with column type badges,
 * pagination controls, and horizontal scroll capability.
 */

import { appState } from '../state/appState.js';

export function createDatasetPreview() {
  const container = document.createElement('div');
  container.className = 'card dataset-preview-card';

  const { dataset } = appState.getState();
  if (!dataset.isUploaded) {
    return container;
  }

  let currentPage = 1;
  const rowsPerPage = 8;
  const totalRows = dataset.data.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function renderTable() {
    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    const visibleRows = dataset.data.slice(startIdx, endIdx);

    container.innerHTML = `
      <div class="card-header dataset-preview-header">
        <div class="dataset-meta-group">
          <div class="dataset-meta-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="mono-text" style="font-weight: 600; font-size: 0.95rem;">${dataset.fileName}</span>
            <span class="badge badge-ready">● Ready</span>
          </div>
          <div class="dataset-meta-sub">
            <span>Size: ${formatBytes(dataset.fileSizeBytes)}</span>
            <span>•</span>
            <span>${dataset.rows} Observations</span>
            <span>•</span>
            <span>${dataset.columns} Attributes</span>
          </div>
        </div>

        <button class="btn btn-secondary btn-sm" id="changeDatasetBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Change CSV
        </button>
      </div>

      <div class="card-body dataset-table-container">
        <div class="dataset-table-scroll">
          <table class="analytical-table">
            <thead>
              <tr>
                <th class="table-index-col">#</th>
                ${dataset.columnAnalysis.map(col => `
                  <th>
                    <div class="table-header-cell">
                      <span>${col.name}</span>
                      <span class="col-type-tag ${col.type === 'numerical' ? 'type-num' : 'type-text'}">
                        ${col.type === 'numerical' ? 'NUM' : 'TEXT'}
                      </span>
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${visibleRows.map((row, idx) => `
                <tr>
                  <td class="table-index-col mono-text">${startIdx + idx + 1}</td>
                  ${dataset.headers.map(h => {
                    const val = row[h];
                    const isMissing = val === '' || val === null || val === undefined;
                    return `
                      <td class="${isMissing ? 'cell-missing' : ''}">
                        ${isMissing ? '<span class="missing-chip">NA</span>' : `<span class="cell-value">${val}</span>`}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="dataset-pagination">
          <div class="pagination-info">
            Showing <strong class="mono-text">${startIdx + 1}–${endIdx}</strong> of <strong class="mono-text">${totalRows}</strong> records
          </div>
          <div class="pagination-controls">
            <button class="btn btn-secondary btn-sm" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''}>
              ← Previous
            </button>
            <span class="pagination-page-indicator mono-text">Page ${currentPage} of ${totalPages || 1}</span>
            <button class="btn btn-secondary btn-sm" id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''}>
              Next →
            </button>
          </div>
        </div>
      </div>
    `;

    // Pagination events
    const prevBtn = container.querySelector('#prevPageBtn');
    const nextBtn = container.querySelector('#nextPageBtn');
    const changeBtn = container.querySelector('#changeDatasetBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      });
    }

    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
          fileInput.click();
        }
      });
    }
  }

  renderTable();
  return container;
}
