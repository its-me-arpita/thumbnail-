// ── Init Editor ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('editorCanvas');
const editor = new CanvasEditor(canvas);
const propPanel = document.getElementById('propPanel');
const layersList = document.getElementById('layersList');

// ── Preset templates ────────────────────────────────────────────────────────
const TEMPLATES = {
  // ── Blank ─────────────────────────────────────
  blank: { bg: '#1a1a2e', layers: [] },

  // ── YouTube: Dark Cinematic ───────────────────
  'yt-cinematic': {
    bg: '#0a0010',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0a0010' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 6, h: 720, fill: '#7c3aed' },
      { type: 'shape', shape: 'rect', x: 580, y: 0, w: 700, h: 720, fill: '#7c3aed', opacity: 0.08 },
      { type: 'text', text: 'EXCLUSIVE', x: 60, y: 180, w: 500, h: 40, fontSize: 22, fontWeight: '800', color: '#a78bfa', align: 'left' },
      { type: 'text', text: 'UNTOLD\nSECRETS', x: 60, y: 240, w: 700, h: 220, fontSize: 110, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'shape', shape: 'rect', x: 60, y: 490, w: 180, h: 6, fill: '#7c3aed', borderRadius: 3 },
      { type: 'text', text: 'Watch before it\'s removed', x: 60, y: 514, w: 500, h: 40, fontSize: 22, fontWeight: '500', color: '#c4b5fd', align: 'left' },
      { type: 'text', text: '👁 2.4M VIEWS', x: 60, y: 620, w: 260, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#7c3aed', borderRadius: 22 },
    ],
  },

  // ── YouTube: Bold Reaction ────────────────────
  'yt-reaction': {
    bg: '#0f0f0f',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0f0f0f' },
      { type: 'shape', shape: 'rect', x: 700, y: 0, w: 580, h: 720, fill: '#dc2626' },
      { type: 'shape', shape: 'rect', x: 0, y: 706, w: 1280, h: 14, fill: '#dc2626' },
      { type: 'text', text: 'I CAN\'T', x: 50, y: 60, w: 620, h: 180, fontSize: 130, fontWeight: '900', color: '#ef4444', align: 'left' },
      { type: 'text', text: 'BELIEVE\nTHIS', x: 50, y: 280, w: 580, h: 220, fontSize: 110, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'text', text: '😱', x: 760, y: 200, w: 360, h: 360, fontSize: 220, fontWeight: '400', color: '#ffffff', align: 'center' },
      { type: 'text', text: '🔥 TRENDING', x: 50, y: 620, w: 240, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#dc2626', borderRadius: 22 },
    ],
  },

  // ── Tech: Neon Code ───────────────────────────
  'tech-code': {
    bg: '#060d1a',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#060d1a' },
      { type: 'shape', shape: 'rect', x: 760, y: 60, w: 460, h: 600, fill: '#0d1f33', borderRadius: 12 },
      { type: 'shape', shape: 'rect', x: 760, y: 60, w: 460, h: 600, fill: 'transparent', stroke: '#00ffc8', strokeWidth: 1, borderRadius: 12, opacity: 0.25 },
      { type: 'text', text: '● ● ●', x: 780, y: 82, w: 100, h: 20, fontSize: 14, fontWeight: '400', color: '#ef4444', align: 'left' },
      { type: 'text', text: 'const ai = buildApp();\n// 🚀 launch it', x: 780, y: 120, w: 420, h: 120, fontSize: 26, fontWeight: '400', color: '#00ffc8', align: 'left' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 4, h: 720, fill: '#00ffc8' },
      { type: 'text', text: 'TUTORIAL', x: 50, y: 150, w: 400, h: 40, fontSize: 22, fontWeight: '800', color: '#00ffc8', align: 'left' },
      { type: 'text', text: 'Build an AI\nApp in\n30 Minutes', x: 50, y: 210, w: 660, h: 300, fontSize: 100, fontWeight: '900', color: '#e0f7ff', align: 'left' },
      { type: 'text', text: '⚡ TECH', x: 50, y: 620, w: 160, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#0080ff', borderRadius: 22 },
    ],
  },

  // ── Business: Corporate Split ─────────────────
  'biz-split': {
    bg: '#0f172a',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0f172a' },
      { type: 'shape', shape: 'rect', x: 860, y: 0, w: 420, h: 720, fill: '#2563eb' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 4, h: 720, fill: '#2563eb' },
      { type: 'text', text: 'STRATEGY', x: 50, y: 120, w: 450, h: 40, fontSize: 22, fontWeight: '800', color: '#60a5fa', align: 'left' },
      { type: 'text', text: 'Scale Your\nBusiness\n10× Faster', x: 50, y: 175, w: 750, h: 320, fontSize: 100, fontWeight: '900', color: '#f0f9ff', align: 'left' },
      { type: 'shape', shape: 'rect', x: 50, y: 530, w: 180, h: 6, fill: '#2563eb', borderRadius: 3 },
      { type: 'text', text: 'Proven growth frameworks', x: 50, y: 554, w: 500, h: 36, fontSize: 22, fontWeight: '500', color: '#93c5fd', align: 'left' },
      { type: 'text', text: '💼 BUSINESS', x: 50, y: 628, w: 240, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#1d4ed8', borderRadius: 22 },
    ],
  },

  // ── Business: Finance Growth ──────────────────
  finance: {
    bg: '#050e05',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#050e05' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 4, h: 720, fill: '#22c55e' },
      { type: 'text', text: 'INVESTING', x: 50, y: 120, w: 400, h: 40, fontSize: 22, fontWeight: '800', color: '#4ade80', align: 'left' },
      { type: 'text', text: 'How I Made\n$10K Passive\nIncome', x: 50, y: 175, w: 720, h: 320, fontSize: 96, fontWeight: '900', color: '#f0fdf4', align: 'left' },
      { type: 'shape', shape: 'rect', x: 50, y: 530, w: 160, h: 6, fill: '#22c55e', borderRadius: 3 },
      { type: 'text', text: 'Step-by-step breakdown →', x: 50, y: 554, w: 500, h: 36, fontSize: 22, fontWeight: '500', color: '#86efac', align: 'left' },
      { type: 'text', text: '💰 FINANCE', x: 50, y: 628, w: 220, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#15803d', borderRadius: 22 },
    ],
  },

  // ── Lifestyle: Fitness Energy ─────────────────
  fitness: {
    bg: '#0a0a0a',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0a0a0a' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 4, h: 720, fill: '#fb923c' },
      { type: 'text', text: '30-DAY', x: 50, y: 100, w: 400, h: 40, fontSize: 24, fontWeight: '800', color: '#fb923c', align: 'left' },
      { type: 'text', text: 'BODY\nTRANSFORM-\nATION', x: 50, y: 155, w: 720, h: 360, fontSize: 110, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'shape', shape: 'rect', x: 50, y: 550, w: 200, h: 6, fill: '#fb923c', borderRadius: 3 },
      { type: 'text', text: 'No gym · Beginner friendly', x: 50, y: 574, w: 500, h: 36, fontSize: 22, fontWeight: '500', color: '#fed7aa', align: 'left' },
      { type: 'text', text: '💪 FITNESS', x: 50, y: 632, w: 210, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#ea580c', borderRadius: 22 },
      { type: 'text', text: '🔥', x: 950, y: 210, w: 240, h: 240, fontSize: 200, fontWeight: '400', color: '#ffffff', align: 'center' },
    ],
  },

  // ── Lifestyle: Travel Scenic ──────────────────
  travel: {
    bg: '#0ea5e9',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0ea5e9' },
      { type: 'shape', shape: 'rect', x: 0, y: 280, w: 1280, h: 440, fill: '#065f46' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#000000', opacity: 0.4 },
      { type: 'text', text: 'TRAVEL GUIDE', x: 60, y: 80, w: 500, h: 40, fontSize: 22, fontWeight: '800', color: '#7dd3fc', align: 'left' },
      { type: 'text', text: 'Top 10 Hidden\nGems in Europe', x: 60, y: 140, w: 800, h: 250, fontSize: 100, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'text', text: '✈ Must-visit spots 2025', x: 60, y: 560, w: 500, h: 36, fontSize: 22, fontWeight: '500', color: '#bae6fd', align: 'left' },
      { type: 'text', text: '🌍 TRAVEL', x: 60, y: 624, w: 200, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#0369a1', borderRadius: 22 },
    ],
  },

  // ── Gaming: Neon Hex ──────────────────────────
  'gaming-neon': {
    bg: '#07001a',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#07001a' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 3, fill: '#a855f7' },
      { type: 'shape', shape: 'rect', x: 0, y: 717, w: 1280, h: 3, fill: '#a855f7' },
      { type: 'shape', shape: 'circle', x: 800, y: 60, w: 560, h: 560, fill: 'transparent', stroke: '#a855f7', strokeWidth: 2, opacity: 0.18 },
      { type: 'shape', shape: 'circle', x: 860, y: 140, w: 400, h: 400, fill: 'transparent', stroke: '#7c3aed', strokeWidth: 1.5, opacity: 0.12 },
      { type: 'text', text: 'GAMEPLAY', x: 50, y: 110, w: 400, h: 38, fontSize: 20, fontWeight: '800', color: '#c084fc', align: 'left' },
      { type: 'text', text: 'EPIC WIN\nImpossible\nBoss Fight', x: 50, y: 160, w: 720, h: 340, fontSize: 110, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'text', text: '⚔️', x: 950, y: 220, w: 240, h: 240, fontSize: 190, fontWeight: '400', color: '#ffffff', align: 'center' },
      { type: 'text', text: '🎮 GAMING', x: 50, y: 630, w: 220, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#7c3aed', borderRadius: 22 },
    ],
  },

  // ── Business: Podcast Studio Dark ────────────
  podcast: {
    bg: '#0e0e10',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0e0e10' },
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 500, h: 720, fill: '#4c1d95' },
      { type: 'shape', shape: 'rect', x: 500, y: 0, w: 2, h: 720, fill: '#7c3aed', opacity: 0.6 },
      { type: 'text', text: '🎙️', x: 130, y: 240, w: 240, h: 240, fontSize: 160, fontWeight: '400', color: '#ffffff', align: 'center' },
      { type: 'text', text: 'EP. 42', x: 540, y: 120, w: 400, h: 38, fontSize: 22, fontWeight: '800', color: '#a78bfa', align: 'left' },
      { type: 'text', text: 'The Future of\nAI & Creativity', x: 540, y: 175, w: 680, h: 200, fontSize: 74, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'text', text: 'with Guest Name', x: 540, y: 415, w: 400, h: 36, fontSize: 24, fontWeight: '500', color: '#a1a1aa', align: 'left' },
      { type: 'text', text: '🎧 PODCAST', x: 540, y: 628, w: 230, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#7c3aed', borderRadius: 22 },
    ],
  },

  // ── Education: Bright Course ──────────────────
  edu: {
    bg: '#eff6ff',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#eff6ff' },
      { type: 'shape', shape: 'rect', x: 740, y: 0, w: 540, h: 720, fill: '#2563eb' },
      { type: 'shape', shape: 'rect', x: 60, y: 130, w: 600, h: 420, fill: '#ffffff', borderRadius: 16 },
      { type: 'text', text: "WHAT YOU'LL LEARN", x: 90, y: 160, w: 540, h: 36, fontSize: 18, fontWeight: '900', color: '#1d4ed8', align: 'left' },
      { type: 'text', text: '✅ Basics & Fundamentals', x: 90, y: 214, w: 540, h: 36, fontSize: 22, fontWeight: '500', color: '#374151', align: 'left' },
      { type: 'text', text: '✅ Advanced Techniques', x: 90, y: 262, w: 540, h: 36, fontSize: 22, fontWeight: '500', color: '#374151', align: 'left' },
      { type: 'text', text: '⬜ Expert Mastery', x: 90, y: 310, w: 540, h: 36, fontSize: 22, fontWeight: '500', color: '#9ca3af', align: 'left' },
      { type: 'text', text: 'COURSE', x: 790, y: 120, w: 400, h: 40, fontSize: 22, fontWeight: '800', color: '#bfdbfe', align: 'left' },
      { type: 'text', text: 'Complete\nPython\nBootcamp', x: 790, y: 175, w: 440, h: 300, fontSize: 90, fontWeight: '900', color: '#ffffff', align: 'left' },
      { type: 'text', text: 'Beginner → Expert', x: 790, y: 510, w: 420, h: 36, fontSize: 22, fontWeight: '500', color: '#bfdbfe', align: 'left' },
      { type: 'text', text: '📚 COURSE', x: 790, y: 624, w: 210, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#1d4ed8', borderRadius: 22 },
    ],
  },

  // ── YouTube: Cinematic Quote ──────────────────
  motivation: {
    bg: '#1e1b4b',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#1e1b4b' },
      { type: 'shape', shape: 'circle', x: 340, y: 60, w: 600, h: 600, fill: '#818cf8', opacity: 0.08 },
      { type: 'shape', shape: 'rect', x: 240, y: 290, w: 800, h: 2, fill: '#a5b4fc', opacity: 0.4 },
      { type: 'shape', shape: 'rect', x: 240, y: 428, w: 800, h: 2, fill: '#a5b4fc', opacity: 0.4 },
      { type: 'text', text: '"', x: 60, y: 20, w: 200, h: 180, fontSize: 200, fontWeight: '900', color: '#818cf8', align: 'left', opacity: 0.12 },
      { type: 'text', text: 'Your only limit\nis your mind.', x: 240, y: 304, w: 800, h: 120, fontSize: 72, fontWeight: '900', color: '#e0e7ff', align: 'center' },
      { type: 'text', text: '— DAILY MOTIVATION', x: 390, y: 448, w: 500, h: 36, fontSize: 20, fontWeight: '600', color: '#a5b4fc', align: 'center' },
      { type: 'text', text: '💡 MOTIVATION', x: 490, y: 620, w: 300, h: 44, fontSize: 18, fontWeight: '800', color: '#ffffff', bgColor: '#6366f1', borderRadius: 22 },
    ],
  },

  // ── Legacy aliases (old template names still work) ────
  youtube: {
    bg: '#0f0f23',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#0f0f23' },
      { type: 'shape', shape: 'rect', x: 0, y: 560, w: 1280, h: 160, fill: '#7c3aed', opacity: 0.85 },
      { type: 'text', text: 'YOUR TITLE HERE', x: 60, y: 180, w: 800, h: 120, fontSize: 72, fontWeight: '800', color: '#ffffff' },
      { type: 'text', text: 'Subtitle or description', x: 60, y: 310, w: 600, h: 50, fontSize: 28, fontWeight: '500', color: '#a78bfa' },
      { type: 'text', text: 'WATCH NOW', x: 60, y: 590, w: 260, h: 55, fontSize: 26, fontWeight: '800', color: '#ffffff', bgColor: '#ef4444', borderRadius: 12 },
    ],
  },
  gaming: {
    bg: '#0a0a0a',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 1280, h: 720, fill: '#1a0a2e' },
      { type: 'shape', shape: 'rect', x: 40, y: 40, w: 1200, h: 640, fill: 'transparent', stroke: '#f59e0b', strokeWidth: 4, borderRadius: 20 },
      { type: 'text', text: 'EPIC GAMING', x: 100, y: 120, w: 700, h: 130, fontSize: 84, fontWeight: '800', color: '#f59e0b' },
      { type: 'text', text: 'MOMENTS', x: 100, y: 260, w: 500, h: 80, fontSize: 64, fontWeight: '800', color: '#ffffff' },
    ],
  },
  tutorial: {
    bg: '#f8fafc',
    layers: [
      { type: 'shape', shape: 'rect', x: 0, y: 0, w: 500, h: 720, fill: '#7c3aed' },
      { type: 'text', text: 'HOW TO', x: 40, y: 200, w: 420, h: 70, fontSize: 48, fontWeight: '800', color: '#ffffff', align: 'left' },
      { type: 'text', text: 'MASTER\nTHIS SKILL', x: 40, y: 280, w: 420, h: 140, fontSize: 56, fontWeight: '800', color: '#e9d5ff', align: 'left' },
      { type: 'text', text: 'TUTORIAL', x: 540, y: 200, w: 300, h: 60, fontSize: 42, fontWeight: '800', color: '#1e293b', align: 'left' },
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

// ── Detect & Edit Text ───────────────────────────────────────────────────────
const _fontSizeMap = { small: 0.03, medium: 0.055, large: 0.08, xlarge: 0.12 };

document.getElementById('detectTextEditorBtn').addEventListener('click', async () => {
  const btnText = document.getElementById('detectTextEditorBtnText');
  const btnLoader = document.getElementById('detectTextEditorLoader');
  const statusEl = document.getElementById('detectTextEditorStatus');

  // Export the current canvas (background only — render without layers temporarily)
  // We use exportPNG which includes bgImage + layers, but we need just the bg image.
  // If no bgImage, nothing to detect.
  if (!editor.bgImage) {
    statusEl.textContent = 'Load a generated image as background first.';
    statusEl.classList.remove('hidden');
    return;
  }

  btnText.classList.add('hidden');
  btnLoader.classList.remove('hidden');
  document.getElementById('detectTextEditorBtn').disabled = true;
  statusEl.classList.add('hidden');

  try {
    // Export just the background image as base64 by drawing it onto a temp canvas
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = editor.canvasW;
    tmpCanvas.height = editor.canvasH;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(editor.bgImage, 0, 0, editor.canvasW, editor.canvasH);
    const dataUrl = tmpCanvas.toDataURL('image/png');
    const b64 = dataUrl.split(',')[1];

    const res = await fetch('/detect-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: b64, mime_type: 'image/png' }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      statusEl.textContent = '⚠ ' + (data.error || 'Detection failed');
      statusEl.classList.remove('hidden');
      return;
    }

    const regions = data.regions || [];
    if (regions.length === 0) {
      statusEl.textContent = 'No text found in the image.';
      statusEl.classList.remove('hidden');
      return;
    }

    const cw = editor.canvasW;
    const ch = editor.canvasH;

    regions.forEach(region => {
      const pad = 6;
      const x = Math.max(0, Math.round((region.x / 100) * cw) - pad);
      const y = Math.max(0, Math.round((region.y / 100) * ch) - pad);
      const w = Math.min(cw - x, Math.round((region.w / 100) * cw) + pad * 2);
      const h = Math.min(ch - y, Math.round((region.h / 100) * ch) + pad * 2);

      // Sample edge pixels (not center) to get background color without text interference
      const samplePoints = [
        [x + 2, y + 2], [x + w - 2, y + 2],
        [x + 2, y + h - 2], [x + w - 2, y + h - 2],
        [x + Math.floor(w / 2), y + 2], [x + Math.floor(w / 2), y + h - 2],
      ];
      let rSum = 0, gSum = 0, bSum = 0;
      samplePoints.forEach(([sx, sy]) => {
        const px = tmpCtx.getImageData(Math.max(0, Math.min(cw - 1, sx)), Math.max(0, Math.min(ch - 1, sy)), 1, 1).data;
        rSum += px[0]; gSum += px[1]; bSum += px[2];
      });
      const n = samplePoints.length;
      const bgHex = `#${((1 << 24) + (Math.round(rSum/n) << 16) + (Math.round(gSum/n) << 8) + Math.round(bSum/n)).toString(16).slice(1)}`;

      editor.addShape('rect', { x, y, w, h, fill: bgHex, borderRadius: 0, opacity: 1 });

      const fsRatio = _fontSizeMap[region.fontSize] || 0.055;
      const fontSize = Math.max(12, Math.round(ch * fsRatio));
      editor.addText(region.text, {
        x, y, w, h,
        fontSize,
        fontWeight: region.fontWeight === 'bold' ? '800' : '500',
        color: region.color || '#ffffff',
        align: 'center',
      });
    });

    statusEl.textContent = `✓ ${regions.length} text element${regions.length > 1 ? 's' : ''} detected — double-click any to edit`;
    statusEl.classList.remove('hidden');
    refreshLayers();

  } catch (err) {
    statusEl.textContent = '⚠ Error: ' + err.message;
    statusEl.classList.remove('hidden');
  } finally {
    btnText.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    document.getElementById('detectTextEditorBtn').disabled = false;
  }
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
