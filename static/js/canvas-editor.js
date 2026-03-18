/**
 * CanvasEditor — Canva-like multi-layer canvas editor
 * Supports: text, images, shapes, background, drag, resize, rotate, z-order
 */
class CanvasEditor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.layers = [];       // ordered array of layer objects
    this.selectedId = null;
    this.bgColor = '#1a1a2e';
    this.bgImage = null;
    this.canvasW = 1280;
    this.canvasH = 720;
    this._idCounter = 0;
    this._drag = null;
    this._resize = null;
    this._history = [];
    this._historyIdx = -1;
    this._maxHistory = 40;
    this._HANDLE = 8;
    this._onChange = null;  // callback

    this._initCanvas();
    this._bindEvents();
    this._saveState();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setSize(w, h) {
    this.canvasW = w;
    this.canvasH = h;
    this._initCanvas();
    this.render();
  }

  setBackground(color) {
    this.bgColor = color;
    this.bgImage = null;
    this.render();
    this._saveState();
  }

  setBackgroundImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.bgImage = img;
        this.render();
        this._saveState();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });
  }

  addText(text = 'Your Text', opts = {}) {
    const layer = {
      id: this._nextId(),
      type: 'text',
      text,
      x: opts.x ?? this.canvasW / 2 - 150,
      y: opts.y ?? this.canvasH / 2 - 30,
      w: opts.w ?? 300,
      h: opts.h ?? 60,
      fontSize: opts.fontSize ?? 42,
      fontFamily: opts.fontFamily ?? 'Inter',
      fontWeight: opts.fontWeight ?? '800',
      color: opts.color ?? '#ffffff',
      align: opts.align ?? 'center',
      bgColor: opts.bgColor ?? null,
      borderRadius: opts.borderRadius ?? 0,
      opacity: opts.opacity ?? 1,
      rotation: 0,
      locked: false,
      visible: true,
    };
    this.layers.push(layer);
    this.selectedId = layer.id;
    this.render();
    this._saveState();
    this._notify();
    return layer;
  }

  addShape(shape = 'rect', opts = {}) {
    const layer = {
      id: this._nextId(),
      type: 'shape',
      shape,
      x: opts.x ?? this.canvasW / 2 - 75,
      y: opts.y ?? this.canvasH / 2 - 75,
      w: opts.w ?? 150,
      h: opts.h ?? 150,
      fill: opts.fill ?? '#7c3aed',
      stroke: opts.stroke ?? null,
      strokeWidth: opts.strokeWidth ?? 2,
      opacity: opts.opacity ?? 1,
      rotation: 0,
      borderRadius: opts.borderRadius ?? 0,
      locked: false,
      visible: true,
    };
    this.layers.push(layer);
    this.selectedId = layer.id;
    this.render();
    this._saveState();
    this._notify();
    return layer;
  }

  addImage(src, opts = {}) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ratio = img.naturalHeight / img.naturalWidth;
        const w = opts.w ?? Math.min(300, this.canvasW * 0.4);
        const h = opts.h ?? w * ratio;
        const layer = {
          id: this._nextId(),
          type: 'image',
          image: img,
          src,
          x: opts.x ?? (this.canvasW - w) / 2,
          y: opts.y ?? (this.canvasH - h) / 2,
          w, h,
          opacity: opts.opacity ?? 1,
          rotation: 0,
          borderRadius: opts.borderRadius ?? 0,
          locked: false,
          visible: true,
        };
        this.layers.push(layer);
        this.selectedId = layer.id;
        this.render();
        this._saveState();
        this._notify();
        resolve(layer);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  updateLayer(id, props) {
    const layer = this.getLayer(id);
    if (!layer) return;
    Object.assign(layer, props);
    if (props.fontSize || props.text || props.fontFamily) {
      this._autoSizeText(layer);
    }
    this.render();
    this._saveState();
    this._notify();
  }

  deleteLayer(id) {
    this.layers = this.layers.filter(l => l.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.render();
    this._saveState();
    this._notify();
  }

  duplicateLayer(id) {
    const src = this.getLayer(id);
    if (!src) return;
    const clone = JSON.parse(JSON.stringify(src));
    clone.id = this._nextId();
    clone.x += 20;
    clone.y += 20;
    // Restore image reference
    if (src.type === 'image' && src.image) {
      clone.image = src.image;
    }
    this.layers.push(clone);
    this.selectedId = clone.id;
    this.render();
    this._saveState();
    this._notify();
    return clone;
  }

  getLayer(id) {
    return this.layers.find(l => l.id === id);
  }

  getSelected() {
    return this.selectedId ? this.getLayer(this.selectedId) : null;
  }

  select(id) {
    this.selectedId = id;
    this.render();
    this._notify();
  }

  deselect() {
    this.selectedId = null;
    this.render();
    this._notify();
  }

  moveUp(id) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx < this.layers.length - 1) {
      [this.layers[idx], this.layers[idx + 1]] = [this.layers[idx + 1], this.layers[idx]];
      this.render();
      this._saveState();
      this._notify();
    }
  }

  moveDown(id) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx > 0) {
      [this.layers[idx], this.layers[idx - 1]] = [this.layers[idx - 1], this.layers[idx]];
      this.render();
      this._saveState();
      this._notify();
    }
  }

  moveToTop(id) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx >= 0 && idx < this.layers.length - 1) {
      const [layer] = this.layers.splice(idx, 1);
      this.layers.push(layer);
      this.render();
      this._saveState();
      this._notify();
    }
  }

  moveToBottom(id) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx > 0) {
      const [layer] = this.layers.splice(idx, 1);
      this.layers.unshift(layer);
      this.render();
      this._saveState();
      this._notify();
    }
  }

  undo() {
    if (this._historyIdx > 0) {
      this._historyIdx--;
      this._restoreState(this._history[this._historyIdx]);
    }
  }

  redo() {
    if (this._historyIdx < this._history.length - 1) {
      this._historyIdx++;
      this._restoreState(this._history[this._historyIdx]);
    }
  }

  clear() {
    this.layers = [];
    this.selectedId = null;
    this.bgImage = null;
    this.bgColor = '#1a1a2e';
    this.render();
    this._saveState();
    this._notify();
  }

  exportPNG() {
    const sel = this.selectedId;
    this.selectedId = null;
    this.render();
    const url = this.canvas.toDataURL('image/png');
    this.selectedId = sel;
    this.render();
    return url;
  }

  exportJSON() {
    return JSON.stringify({
      canvasW: this.canvasW,
      canvasH: this.canvasH,
      bgColor: this.bgColor,
      layers: this.layers.map(l => {
        const clone = { ...l };
        if (clone.image) { clone.image = null; }
        return clone;
      }),
    });
  }

  onChange(fn) { this._onChange = fn; }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = this.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, canvas.width, canvas.height);
    }

    // Layers
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity ?? 1;

      if (layer.rotation) {
        const cx = layer.x + layer.w / 2;
        const cy = layer.y + layer.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (layer.type === 'text') this._renderText(layer);
      else if (layer.type === 'shape') this._renderShape(layer);
      else if (layer.type === 'image') this._renderImage(layer);

      ctx.restore();
    }

    // Selection handles
    if (this.selectedId) {
      const sel = this.getLayer(this.selectedId);
      if (sel) this._renderSelection(sel);
    }
  }

  _renderText(l) {
    const { ctx } = this;
    if (l.bgColor) {
      ctx.fillStyle = l.bgColor;
      if (l.borderRadius > 0) {
        this._roundRect(l.x, l.y, l.w, l.h, l.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(l.x, l.y, l.w, l.h);
      }
    }
    ctx.fillStyle = l.color;
    ctx.font = `${l.fontWeight} ${l.fontSize}px ${l.fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = l.align || 'center';
    let tx = l.x + l.w / 2;
    if (l.align === 'left') tx = l.x + 8;
    else if (l.align === 'right') tx = l.x + l.w - 8;

    // Word wrap
    const lines = this._wrapText(l.text, l.w - 16, ctx);
    const lineH = l.fontSize * 1.25;
    const totalH = lines.length * lineH;
    const startY = l.y + (l.h - totalH) / 2 + lineH / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, tx, startY + i * lineH);
    });
  }

  _renderShape(l) {
    const { ctx } = this;
    ctx.fillStyle = l.fill || '#7c3aed';
    if (l.shape === 'rect') {
      if (l.borderRadius > 0) {
        this._roundRect(l.x, l.y, l.w, l.h, l.borderRadius);
        ctx.fill();
      } else {
        ctx.fillRect(l.x, l.y, l.w, l.h);
      }
    } else if (l.shape === 'circle') {
      ctx.beginPath();
      ctx.ellipse(l.x + l.w / 2, l.y + l.h / 2, l.w / 2, l.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (l.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(l.x + l.w / 2, l.y);
      ctx.lineTo(l.x + l.w, l.y + l.h);
      ctx.lineTo(l.x, l.y + l.h);
      ctx.closePath();
      ctx.fill();
    } else if (l.shape === 'line') {
      ctx.strokeStyle = l.fill;
      ctx.lineWidth = l.strokeWidth || 3;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y + l.h / 2);
      ctx.lineTo(l.x + l.w, l.y + l.h / 2);
      ctx.stroke();
    } else if (l.shape === 'star') {
      this._drawStar(l.x + l.w / 2, l.y + l.h / 2, 5, l.w / 2, l.w / 4);
      ctx.fill();
    }
    if (l.stroke && l.shape !== 'line') {
      ctx.strokeStyle = l.stroke;
      ctx.lineWidth = l.strokeWidth || 2;
      ctx.stroke();
    }
  }

  _renderImage(l) {
    if (!l.image) return;
    const { ctx } = this;
    if (l.borderRadius > 0) {
      ctx.save();
      this._roundRect(l.x, l.y, l.w, l.h, l.borderRadius);
      ctx.clip();
      ctx.drawImage(l.image, l.x, l.y, l.w, l.h);
      ctx.restore();
    } else {
      ctx.drawImage(l.image, l.x, l.y, l.w, l.h);
    }
  }

  _renderSelection(l) {
    const { ctx } = this;
    ctx.save();
    // Border
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(l.x - 1, l.y - 1, l.w + 2, l.h + 2);
    ctx.setLineDash([]);
    // Handles
    const handles = this._getHandles(l);
    handles.forEach(h => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.hx, h.hy, this._HANDLE / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _roundRect(x, y, w, h, r) {
    const { ctx } = this;
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _drawStar(cx, cy, spikes, outerR, innerR) {
    const { ctx } = this;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  }

  _wrapText(text, maxWidth, ctx) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [''];
  }

  _autoSizeText(l) {
    const { ctx } = this;
    ctx.font = `${l.fontWeight} ${l.fontSize}px ${l.fontFamily}`;
    const m = ctx.measureText(l.text);
    const textW = m.width + 24;
    if (textW > l.w) l.w = Math.min(textW, this.canvasW - 40);
    l.h = Math.max(l.h, l.fontSize * 1.5);
  }

  _nextId() { return ++this._idCounter; }

  _notify() {
    if (this._onChange) this._onChange(this.getSelected(), this.layers);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  _initCanvas() {
    this.canvas.width = this.canvasW;
    this.canvas.height = this.canvasH;
  }

  // ── Hit testing ───────────────────────────────────────────────────────────

  _getHandles(l) {
    const { x, y, w, h } = l;
    return [
      { id: 'nw', hx: x, hy: y },
      { id: 'ne', hx: x + w, hy: y },
      { id: 'se', hx: x + w, hy: y + h },
      { id: 'sw', hx: x, hy: y + h },
    ];
  }

  _hitHandle(mx, my) {
    const sel = this.getSelected();
    if (!sel) return null;
    const s = this._HANDLE + 4;
    return this._getHandles(sel).find(h =>
      mx >= h.hx - s && mx <= h.hx + s && my >= h.hy - s && my <= h.hy + s
    ) || null;
  }

  _hitLayer(mx, my) {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const l = this.layers[i];
      if (!l.visible || l.locked) continue;
      if (mx >= l.x && mx <= l.x + l.w && my >= l.y && my <= l.y + l.h) return l;
    }
    return null;
  }

  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown', e => this._onDown(e));
    c.addEventListener('mousemove', e => this._onMove(e));
    c.addEventListener('mouseup', () => this._onUp());
    c.addEventListener('mouseleave', () => this._onUp());
    c.addEventListener('touchstart', e => { e.preventDefault(); this._onDown(e); }, { passive: false });
    c.addEventListener('touchmove', e => { e.preventDefault(); this._onMove(e); }, { passive: false });
    c.addEventListener('touchend', () => this._onUp());
    c.addEventListener('dblclick', e => this._onDblClick(e));

    // Cursor
    c.addEventListener('mousemove', e => {
      const { x, y } = this._canvasPos(e);
      const h = this._hitHandle(x, y);
      if (h) {
        const map = { nw: 'nw-resize', ne: 'ne-resize', se: 'se-resize', sw: 'sw-resize' };
        c.style.cursor = map[h.id] || 'crosshair';
      } else if (this._hitLayer(x, y)) {
        c.style.cursor = 'move';
      } else {
        c.style.cursor = 'default';
      }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      const sel = this.getSelected();
      if (!sel) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.deleteLayer(sel.id);
      } else if (e.key === 'Escape') {
        this.deselect();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo(); else this.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        this.duplicateLayer(sel.id);
      }
    });
  }

  _onDown(e) {
    const { x, y } = this._canvasPos(e);

    // Check handles first
    const handle = this._hitHandle(x, y);
    if (handle) {
      const sel = this.getSelected();
      this._resize = {
        handle: handle.id,
        startX: x, startY: y,
        startLayer: { x: sel.x, y: sel.y, w: sel.w, h: sel.h },
      };
      return;
    }

    // Check layer hit
    const hit = this._hitLayer(x, y);
    if (hit) {
      this.selectedId = hit.id;
      this._drag = { offsetX: x - hit.x, offsetY: y - hit.y };
      this.render();
      this._notify();
    } else {
      this.selectedId = null;
      this.render();
      this._notify();
    }
  }

  _onMove(e) {
    const { x, y } = this._canvasPos(e);
    const sel = this.getSelected();
    if (!sel) return;

    if (this._drag) {
      sel.x = Math.round(x - this._drag.offsetX);
      sel.y = Math.round(y - this._drag.offsetY);
      this.render();
    } else if (this._resize) {
      const { handle, startX, startY, startLayer: sl } = this._resize;
      const dx = x - startX, dy = y - startY;
      const MIN = 20;
      switch (handle) {
        case 'se': sel.w = Math.max(MIN, sl.w + dx); sel.h = Math.max(MIN, sl.h + dy); break;
        case 'sw': sel.x = sl.x + dx; sel.w = Math.max(MIN, sl.w - dx); sel.h = Math.max(MIN, sl.h + dy); break;
        case 'ne': sel.y = sl.y + dy; sel.w = Math.max(MIN, sl.w + dx); sel.h = Math.max(MIN, sl.h - dy); break;
        case 'nw': sel.x = sl.x + dx; sel.y = sl.y + dy; sel.w = Math.max(MIN, sl.w - dx); sel.h = Math.max(MIN, sl.h - dy); break;
      }
      this.render();
    }
  }

  _onUp() {
    if (this._drag || this._resize) {
      this._saveState();
    }
    this._drag = null;
    this._resize = null;
  }

  _onDblClick(e) {
    const { x, y } = this._canvasPos(e);
    const hit = this._hitLayer(x, y);
    if (hit && hit.type === 'text') {
      const newText = prompt('Edit text:', hit.text);
      if (newText !== null) {
        this.updateLayer(hit.id, { text: newText });
      }
    }
  }

  // ── History (undo/redo) ───────────────────────────────────────────────────

  _saveState() {
    const state = {
      bgColor: this.bgColor,
      layers: this.layers.map(l => {
        const c = { ...l };
        if (c.image) c._hasSrc = c.src;
        c.image = undefined;
        return c;
      }),
    };
    // Truncate future states
    this._history = this._history.slice(0, this._historyIdx + 1);
    this._history.push(JSON.stringify(state));
    if (this._history.length > this._maxHistory) this._history.shift();
    this._historyIdx = this._history.length - 1;
  }

  _restoreState(json) {
    const state = JSON.parse(json);
    this.bgColor = state.bgColor;
    this.layers = state.layers.map(l => {
      if (l._hasSrc) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = l._hasSrc;
        l.image = img;
        l.src = l._hasSrc;
        delete l._hasSrc;
        img.onload = () => this.render();
      }
      return l;
    });
    this.render();
    this._notify();
  }
}
