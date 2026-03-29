// ═══════════════════════════════════════════════════════════════════════════════
// ThumbAI — Carousel Maker JS
// Features: generate, CSV bulk, PDF/ZIP export, slide editor with element search,
//           reorder/delete/regenerate, auto-play, copy to clipboard
// ═══════════════════════════════════════════════════════════════════════════════

// ── DOM refs ────────────────────────────────────────────────────────────────────
const form = document.getElementById('carouselForm');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const errorBox = document.getElementById('errorBox');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const previewLoading = document.getElementById('previewLoading');
const previewBox = document.getElementById('previewBox');
const slideImage = document.getElementById('slideImage');
const slideCounter = document.getElementById('slideCounter');
const slideThumbnails = document.getElementById('slideThumbnails');
const prevSlideBtn = document.getElementById('prevSlide');
const nextSlideBtn = document.getElementById('nextSlide');
const slideProgress = document.getElementById('slideProgress');
const slideTotalProgress = document.getElementById('slideTotalProgress');

let slides = [];
let currentSlide = 0;
let autoPlayTimer = null;

// ── Helpers ─────────────────────────────────────────────────────────────────────
function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  btnText.classList.toggle('hidden', isLoading);
  btnLoader.classList.toggle('hidden', !isLoading);
}

function showError(msg) {
  errorBox.textContent = '\u26a0 ' + msg;
  errorBox.classList.remove('hidden');
}

function hideError() { errorBox.classList.add('hidden'); }

function safeName(text) {
  return (text || 'carousel').replace(/[^a-z0-9_\-]/gi, '_');
}

function getSlideDataUrl(slide) {
  return `data:${slide.mime_type};base64,${slide.image}`;
}

function getFormPayload() {
  return {
    topic: document.getElementById('topic').value.trim(),
    description: document.getElementById('description').value.trim(),
    slide_count: parseInt(document.getElementById('slide_count').value),
    platform: document.getElementById('platform').value,
    style: document.getElementById('style').value,
    color_scheme: document.getElementById('color_scheme').value,
    brand_name: document.getElementById('brand_name').value.trim(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: SLIDE NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

function showSlide(index) {
  if (index < 0 || index >= slides.length) return;
  currentSlide = index;
  slideImage.src = getSlideDataUrl(slides[currentSlide]);
  slideCounter.textContent = `${currentSlide + 1} / ${slides.length}`;
  prevSlideBtn.disabled = currentSlide === 0;
  nextSlideBtn.disabled = currentSlide === slides.length - 1;
  document.querySelectorAll('.slide-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === currentSlide);
  });
}

function buildThumbnails() {
  slideThumbnails.innerHTML = '';
  slides.forEach((slide, i) => {
    const div = document.createElement('div');
    div.className = 'slide-thumb' + (i === currentSlide ? ' active' : '');
    div.draggable = true;
    div.dataset.index = i;
    const img = document.createElement('img');
    img.src = getSlideDataUrl(slide);
    img.alt = `Slide ${i + 1}`;
    div.appendChild(img);

    // Click to navigate
    div.addEventListener('click', () => showSlide(i));

    // Drag & drop reorder
    div.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', i);
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    div.addEventListener('dragover', (e) => { e.preventDefault(); div.classList.add('drag-over'); });
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', (e) => {
      e.preventDefault();
      div.classList.remove('drag-over');
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = i;
      if (from !== to) {
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        buildThumbnails();
        showSlide(to);
      }
    });

    slideThumbnails.appendChild(div);
  });
}

function showResult(data) {
  slides = data.slides;
  currentSlide = 0;
  previewLoading.classList.add('hidden');
  previewBox.classList.remove('hidden');
  document.getElementById('autoPlayBtn').disabled = false;
  buildThumbnails();
  showSlide(0);
}

prevSlideBtn.addEventListener('click', () => showSlide(currentSlide - 1));
nextSlideBtn.addEventListener('click', () => showSlide(currentSlide + 1));

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (slides.length === 0) return;
  if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
  if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: MODE TOGGLE & GENERATE
// ═══════════════════════════════════════════════════════════════════════════════

let currentMode = 'form'; // 'form' or 'prompt'

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('formMode').classList.toggle('hidden', currentMode === 'prompt');
    document.getElementById('promptMode').classList.toggle('hidden', currentMode === 'form');
  });
});

// Prompt chips — fill textarea on click
document.querySelectorAll('.prompt-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.getElementById('promptInput').value = chip.dataset.prompt;
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  setLoading(true);

  const isPromptMode = currentMode === 'prompt';
  const promptText = isPromptMode ? document.getElementById('promptInput').value.trim() : '';

  if (isPromptMode && !promptText) {
    showError('Please enter a prompt.');
    setLoading(false);
    return;
  }

  if (!isPromptMode && !document.getElementById('topic').value.trim()) {
    showError('Please enter a topic.');
    setLoading(false);
    return;
  }

  // Build payload based on mode
  let endpoint, body;
  if (isPromptMode) {
    const platformEl = document.getElementById('platform');
    const platform = platformEl ? platformEl.value : 'instagram';
    const platformRatios = { instagram: '1:1', linkedin: '4:5', twitter: '16:9' };
    const slideCountEl = document.getElementById('slide_count');
    const slideCount = slideCountEl ? parseInt(slideCountEl.value) : 5;
    endpoint = '/generate-carousel-prompt';
    body = {
      prompt: promptText,
      slide_count: slideCount,
      aspect_ratio: platformRatios[platform] || '1:1',
    };
  } else {
    endpoint = '/generate-carousel';
    body = getFormPayload();
  }

  previewPlaceholder.classList.add('hidden');
  previewBox.classList.add('hidden');
  slideTotalProgress.textContent = body.slide_count;
  slideProgress.textContent = '0';
  previewLoading.classList.remove('hidden');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      previewLoading.classList.add('hidden');
      previewPlaceholder.classList.remove('hidden');
      showError(data.error || 'Something went wrong.');
      return;
    }
    showResult(data);
    if (data.errors && data.errors.length > 0) {
      showError(`Generated ${data.total} slides. Some failed: ${data.errors.join(', ')}`);
    }
  } catch (err) {
    previewLoading.classList.add('hidden');
    previewPlaceholder.classList.remove('hidden');
    showError('Network error: ' + err.message);
  } finally {
    setLoading(false);
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: SLIDE MANAGEMENT — Delete, Regenerate
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('deleteSlideBtn').addEventListener('click', () => {
  if (slides.length <= 1) { showError('Cannot delete the last slide.'); return; }
  slides.splice(currentSlide, 1);
  if (currentSlide >= slides.length) currentSlide = slides.length - 1;
  buildThumbnails();
  showSlide(currentSlide);
});

document.getElementById('regenSlideBtn').addEventListener('click', async () => {
  if (!slides[currentSlide]) return;
  const idx = currentSlide;
  const payload = getFormPayload();
  payload.slide_count = 1;

  const btn = document.getElementById('regenSlideBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Regen...';

  try {
    const res = await fetch('/generate-carousel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.slides && data.slides.length > 0) {
      slides[idx] = data.slides[0];
      buildThumbnails();
      showSlide(idx);
    } else {
      showError('Regeneration failed. Try again.');
    }
  } catch (err) {
    showError('Network error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔄 Regen';
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: EXPORT — PNG, ZIP, PDF
// ═══════════════════════════════════════════════════════════════════════════════

// Download single PNG
document.getElementById('downloadSlideBtn').addEventListener('click', () => {
  if (!slides[currentSlide]) return;
  const a = document.createElement('a');
  a.href = getSlideDataUrl(slides[currentSlide]);
  a.download = `${safeName(document.getElementById('topic').value)}_slide_${currentSlide + 1}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Download all as ZIP
document.getElementById('downloadZipBtn').addEventListener('click', async () => {
  if (slides.length === 0) return;
  const btn = document.getElementById('downloadZipBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Zipping...';
  try {
    const zip = new JSZip();
    const name = safeName(document.getElementById('topic').value);
    slides.forEach((slide, i) => {
      const binary = atob(slide.image);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
      zip.file(`${name}_slide_${i + 1}.png`, bytes);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${name}_carousel.zip`);
  } catch (err) {
    showError('ZIP export failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ All (ZIP)';
  }
});

// Download all as PDF
document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
  if (slides.length === 0) return;
  const btn = document.getElementById('downloadPdfBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Building PDF...';
  try {
    const { jsPDF } = window.jspdf;
    // Determine page dimensions from first slide
    const firstImg = new Image();
    firstImg.src = getSlideDataUrl(slides[0]);
    await new Promise(r => { firstImg.onload = r; });
    const imgW = firstImg.naturalWidth;
    const imgH = firstImg.naturalHeight;
    const orientation = imgW >= imgH ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [imgW, imgH] });

    for (let i = 0; i < slides.length; i++) {
      if (i > 0) pdf.addPage([imgW, imgH], orientation);
      const src = getSlideDataUrl(slides[i]);
      pdf.addImage(src, 'PNG', 0, 0, imgW, imgH);
    }
    const name = safeName(document.getElementById('topic').value);
    pdf.save(`${name}_carousel.pdf`);
  } catch (err) {
    showError('PDF export failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⬇ PDF';
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: COPY TO CLIPBOARD
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('copySlideBtn').addEventListener('click', async () => {
  if (!slides[currentSlide]) return;
  const btn = document.getElementById('copySlideBtn');
  try {
    const binary = atob(slides[currentSlide].image);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
    const blob = new Blob([bytes], { type: slides[currentSlide].mime_type || 'image/png' });
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
  } catch (err) {
    // Fallback: open in new tab
    showError('Clipboard not supported in this browser. Right-click the image to copy.');
  }
});


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: AUTO-PLAY
// ═══════════════════════════════════════════════════════════════════════════════

const autoPlayBtn = document.getElementById('autoPlayBtn');
autoPlayBtn.addEventListener('click', () => {
  if (autoPlayTimer) {
    stopAutoPlay();
  } else {
    startAutoPlay();
  }
});

function startAutoPlay() {
  if (slides.length <= 1) return;
  autoPlayBtn.textContent = '⏸';
  autoPlayBtn.title = 'Pause auto-play';
  const display = document.getElementById('slideDisplay');
  autoPlayTimer = setInterval(() => {
    const next = (currentSlide + 1) % slides.length;
    display.classList.add('slide-transition');
    setTimeout(() => {
      showSlide(next);
      display.classList.remove('slide-transition');
    }, 250);
  }, 2500);
}

function stopAutoPlay() {
  clearInterval(autoPlayTimer);
  autoPlayTimer = null;
  autoPlayBtn.textContent = '▶';
  autoPlayBtn.title = 'Auto-play slides';
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: CSV BULK UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

const csvInput = document.getElementById('csvInput');
const csvFileName = document.getElementById('csvFileName');
const bulkPanel = document.getElementById('bulkPanel');
const bulkProgressFill = document.getElementById('bulkProgressFill');
const bulkStatus = document.getElementById('bulkStatus');
const bulkResults = document.getElementById('bulkResults');
let bulkCancelled = false;

// Download CSV template
document.getElementById('csvTemplateBtn').addEventListener('click', (e) => {
  e.preventDefault();
  const csv = 'topic,description,slide_count,platform,style,color_scheme,brand_name\n'
    + '"10 Tips for Better Sleep","Health and wellness tips",5,instagram,modern,vibrant,HealthCo\n'
    + '"Marketing 101","Digital marketing basics",7,linkedin,"professional corporate","cool blue tones",BizHub\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'carousel_template.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim().toLowerCase()] = (vals[i] || '').trim(); });
    return obj;
  }).filter(row => row.topic);
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current);
  return result;
}

csvInput.addEventListener('change', async () => {
  const file = csvInput.files[0];
  if (!file) return;
  csvFileName.textContent = file.name;
  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length === 0) { showError('CSV has no valid rows. Ensure "topic" column exists.'); return; }

  bulkCancelled = false;
  bulkPanel.classList.remove('hidden');
  bulkResults.innerHTML = '';
  bulkProgressFill.style.width = '0%';
  bulkStatus.textContent = `0 / ${rows.length} carousels`;

  for (let i = 0; i < rows.length; i++) {
    if (bulkCancelled) break;
    const row = rows[i];
    bulkStatus.textContent = `Generating ${i + 1} / ${rows.length}: ${row.topic}`;
    bulkProgressFill.style.width = `${((i) / rows.length) * 100}%`;

    try {
      const payload = {
        topic: row.topic,
        description: row.description || '',
        slide_count: parseInt(row.slide_count) || 5,
        platform: row.platform || 'instagram',
        style: row.style || 'modern',
        color_scheme: row.color_scheme || 'vibrant',
        brand_name: row.brand_name || '',
      };
      const res = await fetch('/generate-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.slides && data.slides.length > 0) {
        addBulkResult(row.topic, data.slides, true);
      } else {
        addBulkResult(row.topic, null, false);
      }
    } catch {
      addBulkResult(row.topic, null, false);
    }
    bulkProgressFill.style.width = `${((i + 1) / rows.length) * 100}%`;
  }

  bulkStatus.textContent = bulkCancelled ? 'Cancelled' : `Done! ${rows.length} carousels processed`;
  csvInput.value = '';
});

document.getElementById('bulkCancelBtn').addEventListener('click', () => { bulkCancelled = true; });

function addBulkResult(topic, bulkSlides, success) {
  const div = document.createElement('div');
  div.className = 'bulk-result-item ' + (success ? 'success' : 'failed');

  if (success && bulkSlides) {
    const thumb = document.createElement('img');
    thumb.src = getSlideDataUrl(bulkSlides[0]);
    thumb.className = 'bulk-result-thumb';
    div.appendChild(thumb);

    const info = document.createElement('div');
    info.className = 'bulk-result-info';
    info.innerHTML = `<strong>${topic}</strong><span>${bulkSlides.length} slides</span>`;
    div.appendChild(info);

    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn-small btn-outline';
    dlBtn.textContent = '⬇ ZIP';
    dlBtn.addEventListener('click', async () => {
      const zip = new JSZip();
      const name = safeName(topic);
      bulkSlides.forEach((s, idx) => {
        const bin = atob(s.image);
        const bytes = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j);
        zip.file(`${name}_slide_${idx + 1}.png`, bytes);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${name}_carousel.zip`);
    });
    div.appendChild(dlBtn);

    // Load into preview button
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-small btn-primary';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => {
      slides = bulkSlides;
      currentSlide = 0;
      previewPlaceholder.classList.add('hidden');
      previewLoading.classList.add('hidden');
      previewBox.classList.remove('hidden');
      document.getElementById('autoPlayBtn').disabled = false;
      buildThumbnails();
      showSlide(0);
    });
    div.appendChild(viewBtn);
  } else {
    div.innerHTML = `<span class="bulk-result-fail-text">✗ ${topic} — failed</span>`;
  }

  bulkResults.appendChild(div);
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: SLIDE EDITOR MODAL (Full Canva-like editor)
// ═══════════════════════════════════════════════════════════════════════════════

const editorModal = document.getElementById('slideEditorModal');
const slideEditorCanvas = document.getElementById('slideEditorCanvas');
let slideEditor = null;
let editingSlideIndex = -1;
let textBgEnabled = false;

function openSlideEditor(index) {
  if (!slides[index]) return;
  editingSlideIndex = index;
  stopAutoPlay();

  if (!slideEditor) {
    slideEditor = new CanvasEditor(slideEditorCanvas);
    slideEditor.onChange((sel, layers) => {
      refreshProps(sel);
      refreshLayers(layers);
    });
  } else {
    slideEditor.clear();
  }

  const platform = document.getElementById('platform').value;
  const sizes = { instagram: [1080, 1080], linkedin: [1080, 1350], twitter: [1280, 720] };
  const [w, h] = sizes[platform] || [1080, 1080];
  slideEditor.setSize(w, h);

  const src = getSlideDataUrl(slides[index]);
  slideEditor.setBackgroundImage(src).then(() => {
    editorModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    refreshLayers(slideEditor.layers);
  });
}

function closeSlideEditor() {
  editorModal.classList.add('hidden');
  document.body.style.overflow = '';
  editingSlideIndex = -1;
}

// Open editor
document.getElementById('editSlideBtn').addEventListener('click', () => {
  if (slides.length > 0) openSlideEditor(currentSlide);
});

// Save & close
document.getElementById('editorSave').addEventListener('click', () => {
  if (editingSlideIndex < 0 || !slideEditor) return;
  const dataUrl = slideEditor.exportPNG();
  const base64 = dataUrl.split(',')[1];
  slides[editingSlideIndex].image = base64;
  slides[editingSlideIndex].mime_type = 'image/png';
  buildThumbnails();
  showSlide(editingSlideIndex);
  closeSlideEditor();
});

// Cancel
document.getElementById('editorCancel').addEventListener('click', closeSlideEditor);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !editorModal.classList.contains('hidden')) closeSlideEditor();
});

// Toolbar: undo, redo, delete
document.getElementById('editorUndo').addEventListener('click', () => slideEditor && slideEditor.undo());
document.getElementById('editorRedo').addEventListener('click', () => slideEditor && slideEditor.redo());
document.getElementById('editorDelete').addEventListener('click', () => {
  if (slideEditor) { const sel = slideEditor.getSelected(); if (sel) slideEditor.deleteLayer(sel.id); }
});

// ── Text Replace (cover old text + add new editable text) ───────────────────
document.getElementById('textReplaceBtn').addEventListener('click', () => {
  if (!slideEditor) return;
  const cw = slideEditor.canvasW;
  const ch = slideEditor.canvasH;

  // Step 1: Add a cover rectangle (matches common bg colors)
  // Use an eyedropper-like approach: sample the center pixel color for the cover
  const ctx = slideEditor.ctx;
  const centerPixel = ctx.getImageData(Math.floor(cw / 2), Math.floor(ch / 2), 1, 1).data;
  const coverColor = `#${((1 << 24) + (centerPixel[0] << 16) + (centerPixel[1] << 8) + centerPixel[2]).toString(16).slice(1)}`;

  const rectW = Math.round(cw * 0.6);
  const rectH = Math.round(ch * 0.12);
  const rectX = Math.round((cw - rectW) / 2);
  const rectY = Math.round((ch - rectH) / 2);

  slideEditor.addShape('rect', {
    x: rectX, y: rectY, w: rectW, h: rectH,
    fill: coverColor, borderRadius: 8, opacity: 1,
  });

  // Step 2: Add editable text on top
  slideEditor.addText('Double-click to edit', {
    x: rectX + 10, y: rectY + 4,
    w: rectW - 20, h: rectH - 8,
    fontSize: Math.round(rectH * 0.5),
    fontWeight: '700', color: '#ffffff',
    align: 'center',
  });
});

// ── Add Elements ────────────────────────────────────────────────────────────
document.getElementById('addTextBtn').addEventListener('click', () => {
  if (!slideEditor) return;
  slideEditor.addText('Your Text', { fontSize: 32, fontWeight: '600', color: '#ffffff' });
});
document.getElementById('addHeadingBtn').addEventListener('click', () => {
  if (!slideEditor) return;
  slideEditor.addText('Heading', { fontSize: 64, fontWeight: '800', color: '#ffffff', w: 500, h: 90 });
});
document.getElementById('addSubtextBtn').addEventListener('click', () => {
  if (!slideEditor) return;
  slideEditor.addText('Subtext here', { fontSize: 22, fontWeight: '400', color: '#cccccc', w: 300, h: 40 });
});
document.getElementById('addRectBtn').addEventListener('click', () => slideEditor && slideEditor.addShape('rect'));
document.getElementById('addCircleBtn').addEventListener('click', () => slideEditor && slideEditor.addShape('circle'));
document.getElementById('addTriangleBtn').addEventListener('click', () => slideEditor && slideEditor.addShape('triangle'));
document.getElementById('addLineBtn').addEventListener('click', () => slideEditor && slideEditor.addShape('line', { w: 300, h: 6, fill: '#ffffff' }));
document.getElementById('addStarBtn').addEventListener('click', () => slideEditor && slideEditor.addShape('star', { fill: '#f59e0b' }));
document.getElementById('addImageBtn').addEventListener('click', () => document.getElementById('editorImageInput').click());
document.getElementById('editorImageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !slideEditor) return;
  const reader = new FileReader();
  reader.onload = (ev) => slideEditor.addImage(ev.target.result);
  reader.readAsDataURL(file);
  e.target.value = '';
});

// ── Background ──────────────────────────────────────────────────────────────
document.getElementById('bgColorInput').addEventListener('input', (e) => {
  if (slideEditor) slideEditor.setBackground(e.target.value);
});
document.getElementById('bgImageBtn').addEventListener('click', () => document.getElementById('bgImageInput').click());
document.getElementById('bgImageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !slideEditor) return;
  const reader = new FileReader();
  reader.onload = (ev) => slideEditor.setBackgroundImage(ev.target.result);
  reader.readAsDataURL(file);
  e.target.value = '';
});

// ── Element Search (Iconify API) ────────────────────────────────────────────
const elementSearchInput = document.getElementById('elementSearchInput');
const elementResults = document.getElementById('elementResults');

async function searchElements(query) {
  if (!query.trim()) return;
  elementResults.innerHTML = '<div style="text-align:center;padding:0.5rem;"><span class="spinner"></span></div>';
  try {
    const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=30`);
    const data = await res.json();
    elementResults.innerHTML = '';
    if (!data.icons || data.icons.length === 0) {
      elementResults.innerHTML = '<div class="element-empty">No icons found</div>';
      return;
    }
    data.icons.forEach(iconName => {
      const btn = document.createElement('button');
      btn.className = 'element-result-item';
      btn.title = iconName;
      const [prefix, name] = iconName.split(':');
      const imgUrl = `https://api.iconify.design/${prefix}/${name}.svg?height=48`;
      btn.innerHTML = `<img src="${imgUrl}" alt="${iconName}" />`;
      btn.addEventListener('click', () => {
        if (slideEditor) {
          fetch(imgUrl).then(r => r.text()).then(svgText => {
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            slideEditor.addImage(url);
          });
        }
      });
      elementResults.appendChild(btn);
    });
  } catch {
    elementResults.innerHTML = '<div class="element-empty">Search failed. Try again.</div>';
  }
}

document.getElementById('elementSearchBtn').addEventListener('click', () => searchElements(elementSearchInput.value));
elementSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchElements(elementSearchInput.value); } });

document.querySelectorAll('.element-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    elementSearchInput.value = chip.dataset.q;
    searchElements(chip.dataset.q);
  });
});

// ── AI Element Generation ───────────────────────────────────────────────────
const aiElementInput = document.getElementById('aiElementInput');
const aiElementBtn = document.getElementById('aiElementBtn');
const aiElementLoading = document.getElementById('aiElementLoading');

aiElementBtn.addEventListener('click', () => generateAIElement());
aiElementInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); generateAIElement(); } });

async function generateAIElement() {
  const prompt = aiElementInput.value.trim();
  if (!prompt || !slideEditor) return;
  aiElementBtn.disabled = true;
  aiElementLoading.classList.remove('hidden');
  try {
    const res = await fetch('/generate-element', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style: '3d render' }),
    });
    const data = await res.json();
    if (data.image) {
      const src = `data:${data.mime_type || 'image/png'};base64,${data.image}`;
      slideEditor.addImage(src);
    } else {
      showError(data.error || 'Element generation failed.');
    }
  } catch (err) {
    showError('Network error: ' + err.message);
  } finally {
    aiElementBtn.disabled = false;
    aiElementLoading.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: LAYERS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const layersPanel = document.getElementById('layersPanel');

function refreshLayers(layers) {
  if (!layers || layers.length === 0) {
    layersPanel.innerHTML = '<div class="layers-empty">No layers yet</div>';
    return;
  }
  layersPanel.innerHTML = '';
  // Render top-to-bottom (highest layer first)
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    const div = document.createElement('div');
    const isSelected = slideEditor && slideEditor.selectedId === l.id;
    div.className = 'layer-item' + (isSelected ? ' selected' : '') + (!l.visible ? ' hidden-layer' : '');

    const icon = l.type === 'text' ? 'T' : l.type === 'shape' ? '◆' : '🖼';
    const label = l.type === 'text' ? (l.text.length > 15 ? l.text.slice(0, 15) + '...' : l.text) :
                  l.type === 'shape' ? l.shape : 'Image';

    div.innerHTML = `
      <span class="layer-icon">${icon}</span>
      <span class="layer-label">${label}</span>
      <button class="layer-vis-btn" title="${l.visible ? 'Hide' : 'Show'}">${l.visible ? '👁' : '👁‍🗨'}</button>
    `;

    div.addEventListener('click', (e) => {
      if (e.target.classList.contains('layer-vis-btn')) return;
      if (slideEditor) slideEditor.select(l.id);
    });

    div.querySelector('.layer-vis-btn').addEventListener('click', () => {
      if (slideEditor) {
        slideEditor.updateLayer(l.id, { visible: !l.visible });
      }
    });

    layersPanel.appendChild(div);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: ENHANCED PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const propsContent = document.getElementById('propsContent');
const propsEmpty = document.querySelector('.props-empty');

function refreshProps(sel) {
  if (!sel) {
    propsContent.classList.add('hidden');
    propsEmpty.classList.remove('hidden');
    return;
  }
  propsContent.classList.remove('hidden');
  propsEmpty.classList.add('hidden');

  // Position & size
  document.getElementById('propX').value = Math.round(sel.x);
  document.getElementById('propY').value = Math.round(sel.y);
  document.getElementById('propW').value = Math.round(sel.w);
  document.getElementById('propH').value = Math.round(sel.h);

  // Rotation
  const rot = sel.rotation || 0;
  document.getElementById('propRotation').value = rot;
  document.getElementById('propRotationVal').textContent = rot + '\u00B0';

  // Opacity
  const op = sel.opacity ?? 1;
  document.getElementById('propOpacity').value = op;
  document.getElementById('propOpacityVal').textContent = Math.round(op * 100) + '%';

  // Show/hide type-specific sections
  const isText = sel.type === 'text';
  const isShape = sel.type === 'shape';
  const isImage = sel.type === 'image';
  document.getElementById('propTextSection').classList.toggle('hidden', !isText);
  document.getElementById('propShapeSection').classList.toggle('hidden', !isShape);
  document.getElementById('propImageSection').classList.toggle('hidden', !isImage);

  if (isText) {
    document.getElementById('propText').value = sel.text;
    document.getElementById('propFontFamily').value = sel.fontFamily || 'Inter';
    document.getElementById('propFontSize').value = sel.fontSize;
    document.getElementById('propFontWeight').value = sel.fontWeight || '800';
    document.getElementById('propTextColor').value = sel.color;
    textBgEnabled = !!sel.bgColor;
    document.getElementById('propTextBgToggle').textContent = textBgEnabled ? 'On' : 'Off';
    document.getElementById('propTextBgToggle').classList.toggle('btn-primary', textBgEnabled);
    document.getElementById('propTextBgToggle').classList.toggle('btn-outline', !textBgEnabled);
    if (sel.bgColor) document.getElementById('propTextBg').value = sel.bgColor;

    // Update alignment buttons
    document.querySelectorAll('.prop-align-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.align === (sel.align || 'center'));
    });
  } else if (isShape) {
    document.getElementById('propShapeFill').value = sel.fill || '#7c3aed';
    document.getElementById('propShapeStroke').value = sel.stroke || '#ffffff';
    document.getElementById('propStrokeWidth').value = sel.strokeWidth || 0;
    document.getElementById('propBorderRadius').value = sel.borderRadius || 0;
  } else if (isImage) {
    document.getElementById('propImageRadius').value = sel.borderRadius || 0;
  }
}

// ── Property change handlers ────────────────────────────────────────────────

// Position & Size
['propX', 'propY', 'propW', 'propH'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    if (!slideEditor) return;
    const sel = slideEditor.getSelected();
    if (!sel) return;
    const prop = { propX: 'x', propY: 'y', propW: 'w', propH: 'h' }[id];
    slideEditor.updateLayer(sel.id, { [prop]: parseInt(document.getElementById(id).value) || 0 });
  });
});

// Rotation
document.getElementById('propRotation').addEventListener('input', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  const val = parseInt(e.target.value) || 0;
  document.getElementById('propRotationVal').textContent = val + '\u00B0';
  if (sel) slideEditor.updateLayer(sel.id, { rotation: val });
});

// Opacity
document.getElementById('propOpacity').addEventListener('input', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  const val = parseFloat(e.target.value);
  document.getElementById('propOpacityVal').textContent = Math.round(val * 100) + '%';
  if (sel) slideEditor.updateLayer(sel.id, { opacity: val });
});

// ── Text properties ─────────────────────────────────────────────────────────
document.getElementById('propText').addEventListener('input', () => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'text') slideEditor.updateLayer(sel.id, { text: document.getElementById('propText').value });
});

document.getElementById('propFontFamily').addEventListener('change', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'text') slideEditor.updateLayer(sel.id, { fontFamily: e.target.value });
});

document.getElementById('propFontSize').addEventListener('change', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'text') slideEditor.updateLayer(sel.id, { fontSize: parseInt(e.target.value) || 24 });
});

document.getElementById('propFontWeight').addEventListener('change', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'text') slideEditor.updateLayer(sel.id, { fontWeight: e.target.value });
});

document.getElementById('propTextColor').addEventListener('input', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'text') slideEditor.updateLayer(sel.id, { color: e.target.value });
});

document.getElementById('propTextBg').addEventListener('input', (e) => {
  if (!slideEditor || !textBgEnabled) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'text') slideEditor.updateLayer(sel.id, { bgColor: e.target.value });
});

document.getElementById('propTextBgToggle').addEventListener('click', () => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (!sel || sel.type !== 'text') return;
  textBgEnabled = !textBgEnabled;
  const btn = document.getElementById('propTextBgToggle');
  btn.textContent = textBgEnabled ? 'On' : 'Off';
  btn.classList.toggle('btn-primary', textBgEnabled);
  btn.classList.toggle('btn-outline', !textBgEnabled);
  slideEditor.updateLayer(sel.id, { bgColor: textBgEnabled ? document.getElementById('propTextBg').value : null });
});

// Text alignment
document.querySelectorAll('.prop-align-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!slideEditor) return;
    const sel = slideEditor.getSelected();
    if (!sel || sel.type !== 'text') return;
    document.querySelectorAll('.prop-align-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    slideEditor.updateLayer(sel.id, { align: btn.dataset.align });
  });
});

// ── Shape properties ────────────────────────────────────────────────────────
document.getElementById('propShapeFill').addEventListener('input', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'shape') slideEditor.updateLayer(sel.id, { fill: e.target.value });
});

document.getElementById('propShapeStroke').addEventListener('input', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'shape') slideEditor.updateLayer(sel.id, { stroke: e.target.value });
});

document.getElementById('propStrokeWidth').addEventListener('change', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'shape') slideEditor.updateLayer(sel.id, { strokeWidth: parseInt(e.target.value) || 0 });
});

document.getElementById('propBorderRadius').addEventListener('change', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'shape') slideEditor.updateLayer(sel.id, { borderRadius: parseInt(e.target.value) || 0 });
});

// ── Image properties ────────────────────────────────────────────────────────
document.getElementById('propImageRadius').addEventListener('change', (e) => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel && sel.type === 'image') slideEditor.updateLayer(sel.id, { borderRadius: parseInt(e.target.value) || 0 });
});

// ── Actions ─────────────────────────────────────────────────────────────────
document.getElementById('propDuplicate').addEventListener('click', () => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel) slideEditor.duplicateLayer(sel.id);
});

document.getElementById('propLayerUp').addEventListener('click', () => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel) slideEditor.moveUp(sel.id);
});

document.getElementById('propLayerDown').addEventListener('click', () => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel) slideEditor.moveDown(sel.id);
});

document.getElementById('propLayerDelete').addEventListener('click', () => {
  if (!slideEditor) return;
  const sel = slideEditor.getSelected();
  if (sel) slideEditor.deleteLayer(sel.id);
});
