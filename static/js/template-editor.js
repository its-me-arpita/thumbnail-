// ── Init Editor ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('editorCanvas');
const editor = new CanvasEditor(canvas);
const propPanel = document.getElementById('propPanel');
const layersList = document.getElementById('layersList');

// ── Preset templates ────────────────────────────────────────────────────────
const TEMPLATES = {
  blank: { bg: '#1a1a2e', layers: [] },
  youtube: {
    bg: '#0f0f23',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: 'linear', bgGrad: ['#1a0533','#0f0f23'], opacity: 1 },
      { type: 'shape', shape: 'rect', x: 0, y: 560, w: 1280, h: 160, fill: '#7c3aed', opacity: 0.85 },
      { type: 'text', text: 'YOUR TITLE HERE', x: 60, y: 180, w: 800, h: 120, fontSize: 72, fontWeight: '800', color: '#ffffff' },
      { type: 'text', text: 'Subtitle or description', x: 60, y: 310, w: 600, h: 50, fontSize: 28, fontWeight: '500', color: '#a78bfa' },
      { type: 'text', text: 'WATCH NOW', x: 60, y: 590, w: 260, h: 55, fontSize: 26, fontWeight: '800', color: '#ffffff', bgColor: '#ef4444', borderRadius: 12 },
    ],
  },
  gaming: {
    bg: '#0a0a0a',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#1a0a2e', opacity: 1 },
      { type: 'shape', shape: 'rect', x: 40, y: 40, w: 1200, h: 640, fill: 'transparent', stroke: '#f59e0b', strokeWidth: 4, borderRadius: 20 },
      { type: 'text', text: 'EPIC GAMING', x: 100, y: 120, w: 700, h: 130, fontSize: 84, fontWeight: '800', color: '#f59e0b' },
      { type: 'text', text: 'MOMENTS', x: 100, y: 260, w: 500, h: 80, fontSize: 64, fontWeight: '800', color: '#ffffff' },
      { type: 'shape', shape: 'circle', x: 900, y: 200, w: 280, h: 280, fill: '#f59e0b', opacity: 0.15 },
      { type: 'text', text: 'TOP 10', x: 950, y: 290, w: 180, h: 60, fontSize: 36, fontWeight: '800', color: '#f59e0b', align: 'center' },
    ],
  },
  tutorial: {
    bg: '#f8fafc',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 500, h: 720, fill: '#7c3aed', opacity: 1 },
      { type: 'text', text: 'HOW TO', x: 40, y: 200, w: 420, h: 70, fontSize: 48, fontWeight: '800', color: '#ffffff', align: 'left' },
      { type: 'text', text: 'MASTER\nTHIS SKILL', x: 40, y: 280, w: 420, h: 140, fontSize: 56, fontWeight: '800', color: '#e9d5ff', align: 'left' },
      { type: 'text', text: 'Step-by-step guide', x: 540, y: 580, w: 400, h: 40, fontSize: 22, fontWeight: '500', color: '#64748b', align: 'left' },
      { type: 'text', text: 'TUTORIAL', x: 540, y: 200, w: 300, h: 60, fontSize: 42, fontWeight: '800', color: '#1e293b', align: 'left' },
      { type: 'shape', shape: 'circle', x: 540, y: 300, w: 200, h: 200, fill: '#f3f0ff', opacity: 1 },
      { type: 'text', text: '▶', x: 580, y: 350, w: 120, h: 100, fontSize: 60, fontWeight: '400', color: '#7c3aed', align: 'center' },
    ],
  },
  podcast: {
    bg: '#18181b',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#18181b' },
      { type: 'shape', shape: 'circle', x: 80, y: 160, w: 400, h: 400, fill: '#27272a' },
      { type: 'text', text: '🎙', x: 200, y: 280, w: 160, h: 160, fontSize: 100, fontWeight: '400', color: '#ffffff', align: 'center' },
      { type: 'text', text: 'THE PODCAST', x: 560, y: 180, w: 640, h: 80, fontSize: 52, fontWeight: '800', color: '#ffffff', align: 'left' },
      { type: 'text', text: 'Episode Title Here', x: 560, y: 280, w: 640, h: 50, fontSize: 30, fontWeight: '500', color: '#a1a1aa', align: 'left' },
      { type: 'shape', shape: 'rect', x: 560, y: 370, w: 200, h: 45, fill: '#ef4444', borderRadius: 8 },
      { type: 'text', text: 'NEW EPISODE', x: 570, y: 373, w: 180, h: 40, fontSize: 18, fontWeight: '700', color: '#ffffff', align: 'center' },
    ],
  },
  minimal: {
    bg: '#fafaf9',
    layers: [
      { type: 'text', text: 'Clean &\nSimple', x: 100, y: 200, w: 500, h: 200, fontSize: 80, fontWeight: '800', color: '#1c1917', align: 'left' },
      { type: 'shape', shape: 'rect', x: 100, y: 450, w: 80, h: 6, fill: '#7c3aed', borderRadius: 3 },
      { type: 'text', text: 'A minimalist approach', x: 100, y: 490, w: 400, h: 40, fontSize: 22, fontWeight: '500', color: '#78716c', align: 'left' },
    ],
  },
};

// ── Load template from URL params or default ────────────────────────────────
function loadTemplate(name) {
  const tpl = TEMPLATES[name] || TEMPLATES.blank;
  editor.clear();
  editor.setBackground(tpl.bg);
  for (const l of (tpl.layers || [])) {
    if (l.type === 'text') {
      editor.addText(l.text, l);
    } else if (l.type === 'shape') {
      editor.addShape(l.shape, l);
    } else if (l.type === 'image' && l.src) {
      editor.addImage(l.src, l);
    }
  }
  editor.deselect();
}

// Check URL for template param
const urlParams = new URLSearchParams(window.location.search);
const templateName = urlParams.get('tpl') || 'blank';
loadTemplate(templateName);

// Template selector buttons
document.querySelectorAll('[data-template]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.template;
    loadTemplate(name);
    document.querySelectorAll('[data-template]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// ── Toolbar Actions ─────────────────────────────────────────────────────────

// Add Text
document.getElementById('addTextBtn').addEventListener('click', () => {
  editor.addText('New Text');
  refreshProps();
  refreshLayers();
});

// Add Shape buttons
document.querySelectorAll('[data-shape]').forEach(btn => {
  btn.addEventListener('click', () => {
    editor.addShape(btn.dataset.shape);
    refreshProps();
    refreshLayers();
  });
});

// Add Image
document.getElementById('addImageBtn').addEventListener('click', () => {
  document.getElementById('imageUploadInput').click();
});
document.getElementById('imageUploadInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    await editor.addImage(ev.target.result);
    refreshProps();
    refreshLayers();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

// Background color
document.getElementById('bgColorPicker').addEventListener('input', (e) => {
  editor.setBackground(e.target.value);
});

// Background image
document.getElementById('bgImageBtn').addEventListener('click', () => {
  document.getElementById('bgImageInput').click();
});
document.getElementById('bgImageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    editor.setBackgroundImage(ev.target.result);
    document.getElementById('bgColorPicker').value = '#000000';
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

// Undo / Redo
document.getElementById('undoBtn').addEventListener('click', () => editor.undo());
document.getElementById('redoBtn').addEventListener('click', () => editor.redo());

// Delete selected
document.getElementById('deleteBtn').addEventListener('click', () => {
  const sel = editor.getSelected();
  if (sel) { editor.deleteLayer(sel.id); refreshProps(); refreshLayers(); }
});

// Duplicate selected
document.getElementById('duplicateBtn').addEventListener('click', () => {
  const sel = editor.getSelected();
  if (sel) { editor.duplicateLayer(sel.id); refreshProps(); refreshLayers(); }
});

// Layer ordering
document.getElementById('moveUpBtn')?.addEventListener('click', () => {
  const sel = editor.getSelected();
  if (sel) { editor.moveUp(sel.id); refreshLayers(); }
});
document.getElementById('moveDownBtn')?.addEventListener('click', () => {
  const sel = editor.getSelected();
  if (sel) { editor.moveDown(sel.id); refreshLayers(); }
});

// Canvas size
document.getElementById('canvasSize').addEventListener('change', (e) => {
  const [w, h] = e.target.value.split('x').map(Number);
  editor.setSize(w, h);
});

// Export
document.getElementById('exportBtn').addEventListener('click', () => {
  const url = editor.exportPNG();
  const a = document.createElement('a');
  a.href = url;
  a.download = 'thumbnail.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Clear
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Clear all layers?')) {
    editor.clear();
    document.getElementById('bgColorPicker').value = '#1a1a2e';
    refreshProps();
    refreshLayers();
  }
});

// ── Properties Panel ────────────────────────────────────────────────────────

function refreshProps() {
  const sel = editor.getSelected();
  propPanel.innerHTML = '';
  if (!sel) {
    propPanel.innerHTML = '<div class="prop-empty">Select an element to edit its properties</div>';
    return;
  }

  let html = `<div class="prop-section-title">${sel.type.charAt(0).toUpperCase() + sel.type.slice(1)} Properties</div>`;

  // Common: position & size
  html += `
    <div class="prop-row">
      <label>X</label><input type="number" class="prop-input" data-prop="x" value="${Math.round(sel.x)}">
      <label>Y</label><input type="number" class="prop-input" data-prop="y" value="${Math.round(sel.y)}">
    </div>
    <div class="prop-row">
      <label>W</label><input type="number" class="prop-input" data-prop="w" value="${Math.round(sel.w)}">
      <label>H</label><input type="number" class="prop-input" data-prop="h" value="${Math.round(sel.h)}">
    </div>
    <div class="prop-row">
      <label>Opacity</label>
      <input type="range" class="prop-range" data-prop="opacity" min="0" max="1" step="0.05" value="${sel.opacity}">
      <span class="prop-val">${Math.round(sel.opacity * 100)}%</span>
    </div>
  `;

  if (sel.type === 'text') {
    html += `
      <div class="prop-divider"></div>
      <div class="prop-group">
        <label>Text</label>
        <textarea class="prop-textarea" data-prop="text">${sel.text}</textarea>
      </div>
      <div class="prop-row">
        <label>Size</label>
        <input type="number" class="prop-input" data-prop="fontSize" value="${sel.fontSize}" min="8" max="200">
      </div>
      <div class="prop-row">
        <label>Font</label>
        <select class="prop-select" data-prop="fontFamily">
          ${['Inter','Arial','Georgia','Courier New','Impact','Comic Sans MS','Verdana','Trebuchet MS','Palatino'].map(f =>
            `<option value="${f}" ${sel.fontFamily === f ? 'selected' : ''}>${f}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row">
        <label>Weight</label>
        <select class="prop-select" data-prop="fontWeight">
          ${['400','500','600','700','800','900'].map(w =>
            `<option value="${w}" ${sel.fontWeight === w ? 'selected' : ''}>${w}</option>`
          ).join('')}
        </select>
      </div>
      <div class="prop-row">
        <label>Color</label>
        <input type="color" class="prop-color" data-prop="color" value="${sel.color}">
        <label>BG</label>
        <input type="color" class="prop-color" data-prop="bgColor" value="${sel.bgColor || '#000000'}">
        <button class="prop-btn-sm" data-clear-bg>✕</button>
      </div>
      <div class="prop-row">
        <label>Align</label>
        <div class="prop-btn-group">
          <button class="prop-btn ${sel.align === 'left' ? 'active' : ''}" data-align="left">◧</button>
          <button class="prop-btn ${sel.align === 'center' ? 'active' : ''}" data-align="center">◫</button>
          <button class="prop-btn ${sel.align === 'right' ? 'active' : ''}" data-align="right">◨</button>
        </div>
      </div>
      <div class="prop-row">
        <label>Radius</label>
        <input type="range" class="prop-range" data-prop="borderRadius" min="0" max="40" value="${sel.borderRadius || 0}">
      </div>
    `;
  } else if (sel.type === 'shape') {
    html += `
      <div class="prop-divider"></div>
      <div class="prop-row">
        <label>Fill</label>
        <input type="color" class="prop-color" data-prop="fill" value="${sel.fill || '#7c3aed'}">
      </div>
      <div class="prop-row">
        <label>Stroke</label>
        <input type="color" class="prop-color" data-prop="stroke" value="${sel.stroke || '#000000'}">
        <label>Width</label>
        <input type="number" class="prop-input sm" data-prop="strokeWidth" value="${sel.strokeWidth || 2}" min="0" max="20">
        <button class="prop-btn-sm" data-clear-stroke>✕</button>
      </div>
      <div class="prop-row">
        <label>Radius</label>
        <input type="range" class="prop-range" data-prop="borderRadius" min="0" max="100" value="${sel.borderRadius || 0}">
      </div>
    `;
  } else if (sel.type === 'image') {
    html += `
      <div class="prop-divider"></div>
      <div class="prop-row">
        <label>Radius</label>
        <input type="range" class="prop-range" data-prop="borderRadius" min="0" max="100" value="${sel.borderRadius || 0}">
      </div>
    `;
  }

  propPanel.innerHTML = html;

  // Bind events
  propPanel.querySelectorAll('.prop-input, .prop-range').forEach(inp => {
    inp.addEventListener('input', () => {
      const prop = inp.dataset.prop;
      let val = inp.type === 'number' || inp.type === 'range' ? parseFloat(inp.value) : inp.value;
      editor.updateLayer(sel.id, { [prop]: val });
      // Update range display
      if (inp.type === 'range' && prop === 'opacity') {
        inp.nextElementSibling.textContent = Math.round(val * 100) + '%';
      }
    });
  });

  propPanel.querySelectorAll('.prop-color').forEach(inp => {
    inp.addEventListener('input', () => {
      editor.updateLayer(sel.id, { [inp.dataset.prop]: inp.value });
    });
  });

  propPanel.querySelectorAll('.prop-select').forEach(sel2 => {
    sel2.addEventListener('change', () => {
      editor.updateLayer(sel.id, { [sel2.dataset.prop]: sel2.value });
    });
  });

  propPanel.querySelector('.prop-textarea')?.addEventListener('input', (e) => {
    editor.updateLayer(sel.id, { text: e.target.value });
  });

  propPanel.querySelectorAll('[data-align]').forEach(btn => {
    btn.addEventListener('click', () => {
      editor.updateLayer(sel.id, { align: btn.dataset.align });
      refreshProps();
    });
  });

  propPanel.querySelector('[data-clear-bg]')?.addEventListener('click', () => {
    editor.updateLayer(sel.id, { bgColor: null });
    refreshProps();
  });

  propPanel.querySelector('[data-clear-stroke]')?.addEventListener('click', () => {
    editor.updateLayer(sel.id, { stroke: null });
    refreshProps();
  });
}

// ── Layers Panel ────────────────────────────────────────────────────────────

function refreshLayers() {
  layersList.innerHTML = '';
  const layers = [...editor.layers].reverse();
  if (layers.length === 0) {
    layersList.innerHTML = '<div class="layer-empty">No layers yet</div>';
    return;
  }
  layers.forEach(l => {
    const el = document.createElement('div');
    el.className = `layer-item ${editor.selectedId === l.id ? 'selected' : ''}`;
    const icon = l.type === 'text' ? 'T' : l.type === 'shape' ? '◆' : '🖼';
    const label = l.type === 'text' ? (l.text.substring(0, 20) + (l.text.length > 20 ? '...' : '')) :
                  l.type === 'shape' ? l.shape : 'Image';
    el.innerHTML = `
      <span class="layer-icon">${icon}</span>
      <span class="layer-label">${label}</span>
      <button class="layer-vis-btn" title="${l.visible ? 'Hide' : 'Show'}">${l.visible ? '👁' : '👁‍🗨'}</button>
    `;
    el.addEventListener('click', (e) => {
      if (e.target.closest('.layer-vis-btn')) {
        l.visible = !l.visible;
        editor.render();
        refreshLayers();
        return;
      }
      editor.select(l.id);
      refreshProps();
      refreshLayers();
    });
    layersList.appendChild(el);
  });
}

// ── Editor change callback ──────────────────────────────────────────────────
editor.onChange(() => {
  refreshProps();
  refreshLayers();
});

// ── AI Element Generation ────────────────────────────────────────────────────
const aiPromptInput = document.getElementById('aiElementPrompt');
const aiStyleSelect = document.getElementById('aiElementStyle');
const aiGenerateBtn = document.getElementById('aiGenerateBtn');
const aiGenText = document.getElementById('aiGenText');
const aiGenLoader = document.getElementById('aiGenLoader');
const aiError = document.getElementById('aiElementError');
const aiGrid = document.getElementById('aiGeneratedElements');

function setAiLoading(loading) {
  aiGenerateBtn.disabled = loading;
  aiGenText.classList.toggle('hidden', loading);
  aiGenLoader.classList.toggle('hidden', !loading);
  if (loading) {
    aiError.classList.add('hidden');
  }
}

async function generateAiElement(prompt, style) {
  if (!prompt) { aiPromptInput.focus(); return; }
  setAiLoading(true);

  try {
    const res = await fetch('/generate-element', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, style }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      aiError.textContent = data.error || 'Generation failed';
      aiError.classList.remove('hidden');
      return;
    }

    const src = `data:${data.mime_type || 'image/png'};base64,${data.image}`;

    // Add to generated grid as a reusable element
    addToAiGrid(src, prompt);

    // Auto-place on canvas
    await editor.addImage(src, { w: 200 });
    refreshProps();
    refreshLayers();

  } catch (err) {
    aiError.textContent = 'Network error: ' + err.message;
    aiError.classList.remove('hidden');
  } finally {
    setAiLoading(false);
  }
}

function addToAiGrid(src, label) {
  const item = document.createElement('div');
  item.className = 'ai-grid-item';
  item.title = label;
  item.innerHTML = `<img src="${src}" alt="${label}" />`;

  // Click to re-add to canvas
  item.addEventListener('click', async () => {
    await editor.addImage(src, { w: 200 });
    refreshProps();
    refreshLayers();
  });

  // Insert at the beginning
  aiGrid.insertBefore(item, aiGrid.firstChild);
}

// Generate button
aiGenerateBtn.addEventListener('click', () => {
  generateAiElement(aiPromptInput.value.trim(), aiStyleSelect.value);
});

// Enter key in prompt
aiPromptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    generateAiElement(aiPromptInput.value.trim(), aiStyleSelect.value);
  }
});

// Quick prompt chips
document.querySelectorAll('.ai-chip[data-prompt]').forEach(chip => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    aiPromptInput.value = prompt;
    generateAiElement(prompt, aiStyleSelect.value);
  });
});

// Initial render
refreshProps();
refreshLayers();
