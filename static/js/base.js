// ── Theme toggle (light / dark) ───────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ── Sidebar toggle (mobile) ───────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ── Disabled nav items — show coming soon toast ──────────────────────────────
document.querySelectorAll('.nav-item.disabled').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const label = item.querySelector('.nav-item-label')?.textContent || 'Feature';
    showToast(`${label} — Coming Soon!`);
  });
});

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%) translateY(20px);
      background:#1e1b3a; border:1px solid rgba(124,58,237,0.3);
      color:#f0eeff; padding:0.6rem 1.3rem; border-radius:30px;
      font-size:0.82rem; font-weight:500; font-family:Inter,sans-serif;
      backdrop-filter:blur(20px); z-index:9999;
      opacity:0; transition:opacity 0.2s, transform 0.2s;
      pointer-events:none; box-shadow:0 4px 20px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
  }, 2200);
}
