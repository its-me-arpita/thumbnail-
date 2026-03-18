const historyGrid = document.getElementById('historyGrid');
const emptyState = document.getElementById('emptyState');
const historyCount = document.getElementById('historyCount');
const clearAllBtn = document.getElementById('clearAllBtn');

// Modal elements
const modal = document.getElementById('imageModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalImage = document.getElementById('modalImage');
const modalMeta = document.getElementById('modalMeta');
const modalDownload = document.getElementById('modalDownload');
const modalReuse = document.getElementById('modalReuse');
const modalDelete = document.getElementById('modalDelete');

let currentModalItem = null;

// ── Load history ─────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    const items = await res.json();

    historyCount.textContent = `${items.length} thumbnail${items.length !== 1 ? 's' : ''}`;

    if (items.length === 0) {
      emptyState.classList.remove('hidden');
      historyGrid.classList.add('hidden');
      clearAllBtn.style.display = 'none';
      return;
    }

    emptyState.classList.add('hidden');
    historyGrid.classList.remove('hidden');
    clearAllBtn.style.display = '';
    historyGrid.innerHTML = '';

    items.forEach(item => {
      const card = createCard(item);
      historyGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load history:', err);
  }
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'history-card';
  card.dataset.id = item.id;

  const date = formatDate(item.created_at);
  const style = item.prompt_settings?.style || '';

  card.innerHTML = `
    <div class="history-card-thumb">
      <div class="loading-placeholder">Loading...</div>
      <button class="history-card-delete" title="Delete" data-id="${item.id}">✕</button>
    </div>
    <div class="history-card-info">
      <div class="history-card-title">${escapeHtml(item.title)}</div>
      <div class="history-card-meta">
        <span class="history-card-date">${date}</span>
        ${style ? `<span class="history-card-style">${escapeHtml(style)}</span>` : ''}
      </div>
    </div>
  `;

  // Load thumbnail image
  loadCardImage(card, item);

  // Click to open modal
  card.addEventListener('click', (e) => {
    if (e.target.closest('.history-card-delete')) return;
    openModal(item);
  });

  // Delete button
  card.querySelector('.history-card-delete').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this thumbnail?')) return;
    await deleteItem(item.id);
    card.remove();
    updateCount(-1);
  });

  return card;
}

async function loadCardImage(card, item) {
  try {
    const res = await fetch(`/api/history/${item.id}/image`);
    const data = await res.json();
    if (data.image) {
      const thumb = card.querySelector('.history-card-thumb');
      const img = document.createElement('img');
      img.src = `data:${data.mime_type};base64,${data.image}`;
      img.alt = item.title;
      thumb.querySelector('.loading-placeholder')?.remove();
      thumb.insertBefore(img, thumb.firstChild);
    }
  } catch (err) {
    console.error('Failed to load image:', err);
  }
}

// ── Modal ────────────────────────────────────────────────────────────────────
async function openModal(item) {
  currentModalItem = item;
  modalTitle.textContent = item.title;
  modalImage.src = '';
  modalImage.alt = item.title;

  // Meta info
  const parts = [];
  if (item.created_at) parts.push(`Created: ${formatDate(item.created_at)}`);
  if (item.model) parts.push(`Model: ${item.model}`);
  if (item.prompt_settings?.style) parts.push(`Style: ${item.prompt_settings.style}`);
  if (item.prompt_settings?.color_scheme) parts.push(`Color: ${item.prompt_settings.color_scheme}`);
  modalMeta.textContent = parts.join('  ·  ');

  modal.classList.remove('hidden');

  // Load full image
  try {
    const res = await fetch(`/api/history/${item.id}/image`);
    const data = await res.json();
    if (data.image) {
      modalImage.src = `data:${data.mime_type};base64,${data.image}`;
      currentModalItem._imageSrc = modalImage.src;
      currentModalItem._mime = data.mime_type;
    }
  } catch (err) {
    console.error('Failed to load image:', err);
  }
}

function closeModal() {
  modal.classList.add('hidden');
  currentModalItem = null;
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// Download
modalDownload.addEventListener('click', () => {
  if (!currentModalItem?._imageSrc) return;
  const a = document.createElement('a');
  a.href = currentModalItem._imageSrc;
  a.download = (currentModalItem.title || 'thumbnail').replace(/[^a-z0-9_\-]/gi, '_') + '_thumbnail.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Reuse as reference — redirect to generator with image stored in sessionStorage
modalReuse.addEventListener('click', () => {
  if (!currentModalItem?._imageSrc) return;
  sessionStorage.setItem('referenceImage', currentModalItem._imageSrc);
  window.location.href = '/';
});

// Delete from modal
modalDelete.addEventListener('click', async () => {
  if (!currentModalItem) return;
  if (!confirm('Delete this thumbnail?')) return;
  await deleteItem(currentModalItem.id);
  closeModal();
  loadHistory();
});

// ── Clear all ────────────────────────────────────────────────────────────────
clearAllBtn.addEventListener('click', async () => {
  if (!confirm('Delete all history? This cannot be undone.')) return;
  try {
    await fetch('/api/history/clear', { method: 'DELETE' });
    loadHistory();
  } catch (err) {
    console.error('Failed to clear history:', err);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
async function deleteItem(id) {
  try {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.error('Failed to delete:', err);
  }
}

function updateCount(delta) {
  const current = parseInt(historyCount.textContent) || 0;
  const next = Math.max(0, current + delta);
  historyCount.textContent = `${next} thumbnail${next !== 1 ? 's' : ''}`;
  if (next === 0) {
    emptyState.classList.remove('hidden');
    historyGrid.classList.add('hidden');
    clearAllBtn.style.display = 'none';
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ─────────────────────────────────────────────────────────────────────
loadHistory();
