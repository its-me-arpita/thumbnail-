const form = document.getElementById('thumbnailForm');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const errorBox = document.getElementById('errorBox');
const previewBox = document.getElementById('previewBox');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const previewImage = document.getElementById('previewImage');
const downloadBtn = document.getElementById('downloadBtn');
const editSection = document.getElementById('editSection');
const editBtn = document.getElementById('editBtn');
const editBtnText = document.getElementById('editBtnText');
const editBtnLoader = document.getElementById('editBtnLoader');
const editPrompt = document.getElementById('editPrompt');

// Editor canvas
const editorCanvas  = document.getElementById('editorCanvas');
const editorToolbar = document.getElementById('editorToolbar');
const resetLogoBtn  = document.getElementById('resetLogoBtn');
const removeLogoEditorBtn = document.getElementById('removeLogoEditorBtn');
const editor = new ThumbnailEditor(editorCanvas);

// Logo upload
const logoInput = document.getElementById('logo');
const logoPreview = document.getElementById('logoPreview');
const logoPreviewWrap = document.getElementById('logoPreviewWrap');
const uploadLabel = document.getElementById('uploadLabel');
const removeLogoBtn = document.getElementById('removeLogoBtn');

// Reference image upload
const refInput = document.getElementById('reference_image');
const refPreview = document.getElementById('refPreview');
const refPreviewWrap = document.getElementById('refPreviewWrap');
const refUploadLabel = document.getElementById('refUploadLabel');
const removeRefBtn = document.getElementById('removeRefBtn');

// ── Color pickers (3 swatches) ──────────────────────────────────────────────
const NUM_COLORS = 3;
for (let i = 0; i < NUM_COLORS; i++) {
  const picker = document.getElementById(`color_picker_${i}`);
  const hex = document.getElementById(`color_hex_${i}`);
  hex.value = picker.value;
  picker.addEventListener('input', () => { hex.value = picker.value; });
  hex.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) {
      picker.value = hex.value;
    }
  });
}

function getThemeColors() {
  return Array.from({ length: NUM_COLORS }, (_, i) => {
    const v = document.getElementById(`color_hex_${i}`).value.trim();
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '';
  }).filter(Boolean);
}

// ── Logo ────────────────────────────────────────────────────────────────────
logoInput.addEventListener('change', () => {
  const file = logoInput.files[0];
  if (!file) return;
  uploadLabel.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => { logoPreview.src = e.target.result; logoPreviewWrap.classList.remove('hidden'); };
  reader.readAsDataURL(file);
});
removeLogoBtn.addEventListener('click', () => {
  logoInput.value = '';
  logoPreview.src = '';
  logoPreviewWrap.classList.add('hidden');
  uploadLabel.textContent = 'Upload Logo';
});

// ── Reference Image ─────────────────────────────────────────────────────────
refInput.addEventListener('change', () => {
  const file = refInput.files[0];
  if (!file) return;
  refUploadLabel.textContent = file.name;
  const reader = new FileReader();
  reader.onload = (e) => { refPreview.src = e.target.result; refPreviewWrap.classList.remove('hidden'); };
  reader.readAsDataURL(file);
});
removeRefBtn.addEventListener('click', () => {
  refInput.value = '';
  refPreview.src = '';
  refPreviewWrap.classList.add('hidden');
  refUploadLabel.textContent = 'Style Reference';
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  btnText.classList.toggle('hidden', isLoading);
  btnLoader.classList.toggle('hidden', !isLoading);
}

function setEditLoading(isLoading) {
  editBtn.disabled = isLoading;
  editBtnText.classList.toggle('hidden', isLoading);
  editBtnLoader.classList.toggle('hidden', !isLoading);
}

function showError(message) {
  errorBox.textContent = '⚠ ' + message;
  errorBox.classList.remove('hidden');
}

function hideError() { errorBox.classList.add('hidden'); }

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => { resolve({ base64: e.target.result.split(',')[1], mime: file.type || 'image/png' }); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showResult(data, promptSettings) {
  const mimeType = data.mime_type || 'image/png';
  const src = `data:${mimeType};base64,${data.image}`;

  previewPlaceholder.classList.add('hidden');
  previewBox.classList.remove('hidden');
  editSection.classList.remove('hidden');

  editor.loadBackground(src).then(() => {
    const logoFile = logoInput.files[0];
    if (logoFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        editor.loadLogo(e.target.result);
        editorToolbar.classList.remove('hidden');
      };
      reader.readAsDataURL(logoFile);
    } else {
      editorToolbar.classList.add('hidden');
    }
  });

  downloadBtn.dataset.src  = src;
  downloadBtn.dataset.mime = mimeType;

  // Auto-save to history
  saveToHistory(data, promptSettings);
}

function saveToHistory(data, promptSettings) {
  const title = document.getElementById('title').value.trim() || 'Untitled';
  fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: title,
      prompt_settings: promptSettings || {},
      image: data.image,
      mime_type: data.mime_type || 'image/png',
      model: data.model || '',
    }),
  }).catch(() => {});
}

// ── Generate ─────────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  setLoading(true);

  const payload = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    style: document.getElementById('style').value,
    color_scheme: document.getElementById('color_scheme').value,
    aspect_ratio: document.getElementById('aspect_ratio').value,
    brand_name: document.getElementById('brand_name').value.trim(),
    theme_colors: getThemeColors(),
  };

  if (logoInput.files[0]) {
    try { const r = await readFileAsBase64(logoInput.files[0]); payload.logo = r.base64; payload.logo_mime = r.mime; } catch (_) {}
  }
  if (refInput.files[0]) {
    try { const r = await readFileAsBase64(refInput.files[0]); payload.reference_image = r.base64; payload.reference_mime = r.mime; } catch (_) {}
  }

  try {
    const response = await fetch('/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok || data.error) { showError(data.error || 'Something went wrong.'); return; }
    showResult(data, { style: payload.style, color_scheme: payload.color_scheme, aspect_ratio: payload.aspect_ratio });
  } catch (err) {
    showError('Network error: ' + err.message);
  } finally {
    setLoading(false);
  }
});

// ── Edit ──────────────────────────────────────────────────────────────────────
editBtn.addEventListener('click', async () => {
  const instruction = editPrompt.value.trim();
  if (!instruction) { editPrompt.focus(); return; }

  const currentSrc = downloadBtn.dataset.src;
  if (!currentSrc) return;

  hideError();
  setEditLoading(true);

  const base64 = currentSrc.split(',')[1];
  const mime = downloadBtn.dataset.mime || 'image/png';

  try {
    const response = await fetch('/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edit_instruction: instruction, base_image: base64, base_mime: mime }),
    });
    const data = await response.json();
    if (!response.ok || data.error) { showError(data.error || 'Edit failed.'); return; }
    showResult(data, { style: 'edited' });
    editPrompt.value = '';
  } catch (err) {
    showError('Network error: ' + err.message);
  } finally {
    setEditLoading(false);
  }
});

// ── Download ──────────────────────────────────────────────────────────────────
downloadBtn.addEventListener('click', () => {
  const title = document.getElementById('title').value.trim() || 'thumbnail';
  const src = editor.bg ? editor.export() : downloadBtn.dataset.src;
  if (!src) return;
  const a = document.createElement('a');
  a.href = src;
  a.download = title.replace(/[^a-z0-9_\-]/gi, '_') + '_thumbnail.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// ── Editor toolbar buttons ────────────────────────────────────────────────────
if (resetLogoBtn) {
  resetLogoBtn.addEventListener('click', () => {
    if (editor.logo) {
      const lw = editorCanvas.width * 0.20;
      const lh = lw * (editor.logo.naturalHeight / editor.logo.naturalWidth);
      editor.layer = { x: 20, y: 20, w: lw, h: lh };
      editor._draw();
    }
  });
}

if (removeLogoEditorBtn) {
  removeLogoEditorBtn.addEventListener('click', () => {
    editor.removeLogo();
    editorToolbar.classList.add('hidden');
  });
}
