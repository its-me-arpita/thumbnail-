/**
 * ThumbnailEditor
 * Canvas-based editor: drag & resize logo overlay on top of a generated thumbnail.
 */
class ThumbnailEditor {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.bg      = null;   // background Image object (thumbnail)
    this.logo    = null;   // logo Image object

    // Logo layer state
    this.layer = { x: 20, y: 20, w: 120, h: 80 };

    // Interaction state
    this._drag    = null;  // { offsetX, offsetY }
    this._resize  = null;  // { handle, startX, startY, startLayer }
    this._logoSrc = null;

    this._HANDLE  = 10;    // handle square size (half)
    this._MIN     = 30;    // min logo dimension

    this._bindEvents();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Load background thumbnail from data-URL or URL */
  loadBackground(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this.bg = img;
        this._resizeToImage();
        this._draw();
        resolve();
      };
      img.src = src;
    });
  }

  /** Load logo from data-URL (optional – can be called after loadBackground) */
  loadLogo(src) {
    this._logoSrc = src;
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this.logo = img;
        // Default: top-left, 20% of canvas width, keep aspect ratio
        const lw = this.canvas.width * 0.20;
        const lh = lw * (img.naturalHeight / img.naturalWidth);
        this.layer = { x: 20, y: 20, w: lw, h: lh };
        this._draw();
        resolve();
      };
      img.src = src;
    });
  }

  /** Remove logo layer */
  removeLogo() {
    this.logo = null;
    this._logoSrc = null;
    this._draw();
  }

  /** Export merged canvas as PNG data-URL */
  export() {
    // Draw final frame without selection handles
    this._draw(false);
    return this.canvas.toDataURL('image/png');
  }

  // ── Internal rendering ───────────────────────────────────────────────────────

  _resizeToImage() {
    const container = this.canvas.parentElement;
    const w = container ? container.clientWidth : 800;
    const ratio = this.bg ? (this.bg.naturalHeight / this.bg.naturalWidth) : 9 / 16;
    this.canvas.width  = w;
    this.canvas.height = Math.round(w * ratio);
  }

  _draw(showHandles = true) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (this.bg) ctx.drawImage(this.bg, 0, 0, canvas.width, canvas.height);

    // Logo layer
    if (this.logo) {
      const { x, y, w, h } = this.layer;
      ctx.drawImage(this.logo, x, y, w, h);

      if (showHandles) {
        // Selection border
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();

        // Corner + edge handles
        this._getHandles().forEach(h => this._drawHandle(h.hx, h.hy));
      }
    }
  }

  _drawHandle(hx, hy) {
    const s = this._HANDLE;
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle   = '#fff';
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.rect(hx - s / 2, hy - s / 2, s, s);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /** Returns array of { id, hx, hy } for the 8 resize handles */
  _getHandles() {
    const { x, y, w, h } = this.layer;
    const cx = x + w / 2, cy = y + h / 2;
    return [
      { id: 'nw', hx: x,      hy: y      },
      { id: 'n',  hx: cx,     hy: y      },
      { id: 'ne', hx: x + w,  hy: y      },
      { id: 'e',  hx: x + w,  hy: cy     },
      { id: 'se', hx: x + w,  hy: y + h  },
      { id: 's',  hx: cx,     hy: y + h  },
      { id: 'sw', hx: x,      hy: y + h  },
      { id: 'w',  hx: x,      hy: cy     },
    ];
  }

  // ── Hit testing ──────────────────────────────────────────────────────────────

  _hitHandle(mx, my) {
    const s = this._HANDLE;
    return this._getHandles().find(h => (
      mx >= h.hx - s && mx <= h.hx + s &&
      my >= h.hy - s && my <= h.hy + s
    )) || null;
  }

  _hitLogo(mx, my) {
    const { x, y, w, h } = this.layer;
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  _canvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  }

  // ── Event binding ────────────────────────────────────────────────────────────

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('mousedown',  e => this._onDown(e));
    c.addEventListener('mousemove',  e => this._onMove(e));
    c.addEventListener('mouseup',    e => this._onUp(e));
    c.addEventListener('mouseleave', e => this._onUp(e));
    c.addEventListener('touchstart', e => { e.preventDefault(); this._onDown(e); }, { passive: false });
    c.addEventListener('touchmove',  e => { e.preventDefault(); this._onMove(e); }, { passive: false });
    c.addEventListener('touchend',   e => this._onUp(e));

    // Cursor style
    c.addEventListener('mousemove', e => {
      if (!this.logo) return;
      const { x, y } = this._canvasPos(e);
      const h = this._hitHandle(x, y);
      if (h) {
        const cursors = { nw:'nw-resize', ne:'ne-resize', sw:'sw-resize', se:'se-resize', n:'n-resize', s:'s-resize', e:'e-resize', w:'w-resize' };
        c.style.cursor = cursors[h.id] || 'crosshair';
      } else if (this._hitLogo(x, y)) {
        c.style.cursor = 'move';
      } else {
        c.style.cursor = 'default';
      }
    });

    // Redraw on window resize
    window.addEventListener('resize', () => {
      if (this.bg) { this._resizeToImage(); this._draw(); }
    });
  }

  _onDown(e) {
    if (!this.logo) return;
    const { x, y } = this._canvasPos(e);
    const handle = this._hitHandle(x, y);
    if (handle) {
      this._resize = {
        handle: handle.id,
        startX: x, startY: y,
        startLayer: { ...this.layer },
      };
    } else if (this._hitLogo(x, y)) {
      this._drag = { offsetX: x - this.layer.x, offsetY: y - this.layer.y };
    }
  }

  _onMove(e) {
    if (!this.logo) return;
    const { x, y } = this._canvasPos(e);

    if (this._drag) {
      this.layer.x = x - this._drag.offsetX;
      this.layer.y = y - this._drag.offsetY;
      this._draw();
    } else if (this._resize) {
      const { handle, startX, startY, startLayer: sl } = this._resize;
      const dx = x - startX, dy = y - startY;
      let { x: lx, y: ly, w: lw, h: lh } = sl;

      const setSize = (newW, newH) => {
        this.layer.w = Math.max(this._MIN, newW);
        this.layer.h = Math.max(this._MIN, newH);
      };

      switch (handle) {
        case 'se': setSize(lw + dx, lh + dy); break;
        case 'sw': this.layer.x = lx + dx; setSize(lw - dx, lh + dy); break;
        case 'ne': this.layer.y = ly + dy; setSize(lw + dx, lh - dy); break;
        case 'nw': this.layer.x = lx + dx; this.layer.y = ly + dy; setSize(lw - dx, lh - dy); break;
        case 'e':  setSize(lw + dx, lh); break;
        case 'w':  this.layer.x = lx + dx; setSize(lw - dx, lh); break;
        case 's':  setSize(lw, lh + dy); break;
        case 'n':  this.layer.y = ly + dy; setSize(lw, lh - dy); break;
      }
      this._draw();
    }
  }

  _onUp() {
    this._drag   = null;
    this._resize = null;
  }
}
