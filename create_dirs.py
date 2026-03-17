#!/usr/bin/env python3
"""
Run this script once to set up the project structure.
Usage: python create_dirs.py
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# ── Create directories ────────────────────────────────────────────────────────
for d in ["templates", os.path.join("static", "css"), os.path.join("static", "js")]:
    os.makedirs(os.path.join(BASE, d), exist_ok=True)
    print(f"✓ Directory: {d}")

# ── templates/index.html ─────────────────────────────────────────────────────
INDEX_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AI Thumbnail Maker</title>
  <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}" />
</head>
<body>
  <div class="container">
    <header>
      <h1>&#127912; AI Thumbnail Maker</h1>
      <p>Generate stunning thumbnails powered by Gemini AI</p>
    </header>

    <main>
      <section class="form-section">
        <form id="thumbnailForm">
          <div class="form-group">
            <label for="title">Thumbnail Title <span class="required">*</span></label>
            <input type="text" id="title" name="title"
                   placeholder="e.g. Top 10 Python Tips" required />
          </div>

          <div class="form-group">
            <label for="description">Description / Context</label>
            <textarea id="description" name="description" rows="3"
                      placeholder="e.g. A beginner-friendly tutorial about Python tricks"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="style">Style</label>
              <select id="style" name="style">
                <option value="modern">Modern</option>
                <option value="minimalist">Minimalist</option>
                <option value="bold and dramatic">Bold &amp; Dramatic</option>
                <option value="retro">Retro</option>
                <option value="neon cyberpunk">Neon Cyberpunk</option>
                <option value="professional corporate">Professional</option>
              </select>
            </div>

            <div class="form-group">
              <label for="color_scheme">Color Scheme</label>
              <select id="color_scheme" name="color_scheme">
                <option value="vibrant">Vibrant</option>
                <option value="dark and moody">Dark &amp; Moody</option>
                <option value="light and airy">Light &amp; Airy</option>
                <option value="monochrome">Monochrome</option>
                <option value="warm tones">Warm Tones</option>
                <option value="cool blue tones">Cool Blue</option>
              </select>
            </div>
          </div>

          <button type="submit" id="generateBtn">
            <span id="btnText">&#10024; Generate Thumbnail</span>
            <span id="btnLoader" class="hidden">&#9203; Generating...</span>
          </button>
        </form>
      </section>

      <section class="result-section" id="resultSection">
        <div id="errorBox" class="error-box hidden"></div>

        <div id="previewBox" class="preview-box hidden">
          <h2>Generated Thumbnail</h2>
          <div class="image-wrapper">
            <img id="previewImage" src="" alt="Generated Thumbnail" />
          </div>
          <button id="downloadBtn" class="download-btn">&#11015; Download Thumbnail</button>
        </div>
      </section>
    </main>
  </div>

  <script src="{{ url_for('static', filename='js/main.js') }}"></script>
</body>
</html>
"""

# ── static/css/style.css ─────────────────────────────────────────────────────
STYLE_CSS = """\
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #0f0f1a;
  color: #e0e0e0;
  min-height: 100vh;
}

.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Header */
header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1e1e3a 0%, #2a1a4a 100%);
  border-radius: 16px;
  border: 1px solid #3a3a6a;
}

header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.4rem;
}

header p {
  color: #9ca3af;
  font-size: 1rem;
}

/* Form Section */
.form-section {
  background: #1a1a2e;
  border: 1px solid #2d2d50;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.4rem;
  flex: 1;
}

.form-row {
  display: flex;
  gap: 1.2rem;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #c4b5fd;
  margin-bottom: 0.5rem;
}

.required {
  color: #f87171;
}

input[type="text"],
textarea,
select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0f0f1a;
  border: 1px solid #3a3a6a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

input[type="text"]:focus,
textarea:focus,
select:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

textarea {
  resize: vertical;
  min-height: 80px;
}

select option {
  background: #1a1a2e;
}

/* Generate Button */
button[type="submit"] {
  width: 100%;
  padding: 0.9rem;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

button[type="submit"]:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hidden {
  display: none !important;
}

/* Error Box */
.error-box {
  background: #2a1515;
  border: 1px solid #dc2626;
  color: #fca5a5;
  border-radius: 10px;
  padding: 1rem 1.2rem;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

/* Preview Box */
.preview-box {
  background: #1a1a2e;
  border: 1px solid #2d2d50;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}

.preview-box h2 {
  font-size: 1.3rem;
  color: #a78bfa;
  margin-bottom: 1.2rem;
}

.image-wrapper {
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #3a3a6a;
  margin-bottom: 1.2rem;
}

.image-wrapper img {
  width: 100%;
  display: block;
}

.download-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #059669, #0284c7);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.download-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 560px) {
  .form-row {
    flex-direction: column;
  }

  header h1 {
    font-size: 1.6rem;
  }
}
"""

# ── static/js/main.js ────────────────────────────────────────────────────────
MAIN_JS = """\
const form = document.getElementById('thumbnailForm');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const btnLoader = document.getElementById('btnLoader');
const errorBox = document.getElementById('errorBox');
const previewBox = document.getElementById('previewBox');
const previewImage = document.getElementById('previewImage');
const downloadBtn = document.getElementById('downloadBtn');

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  btnText.classList.toggle('hidden', isLoading);
  btnLoader.classList.toggle('hidden', !isLoading);
}

function showError(message) {
  errorBox.textContent = '⚠ ' + message;
  errorBox.classList.remove('hidden');
  previewBox.classList.add('hidden');
}

function hideError() {
  errorBox.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  setLoading(true);
  previewBox.classList.add('hidden');

  const payload = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    style: document.getElementById('style').value,
    color_scheme: document.getElementById('color_scheme').value,
  };

  try {
    const response = await fetch('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    const mimeType = data.mime_type || 'image/png';
    const src = `data:${mimeType};base64,${data.image}`;
    previewImage.src = src;
    previewBox.classList.remove('hidden');

    // Store for download
    downloadBtn.dataset.src = src;
    downloadBtn.dataset.title = payload.title || 'thumbnail';

  } catch (err) {
    showError('Network error: ' + err.message);
  } finally {
    setLoading(false);
  }
});

downloadBtn.addEventListener('click', () => {
  const src = downloadBtn.dataset.src;
  const title = downloadBtn.dataset.title || 'thumbnail';

  if (!src) return;

  const a = document.createElement('a');
  a.href = src;
  a.download = title.replace(/[^a-z0-9_\\-]/gi, '_') + '_thumbnail.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});
"""

# ── Write all files ───────────────────────────────────────────────────────────
files = {
    os.path.join("templates", "index.html"): INDEX_HTML,
    os.path.join("static", "css", "style.css"): STYLE_CSS,
    os.path.join("static", "js", "main.js"): MAIN_JS,
}

for rel_path, content in files.items():
    full_path = os.path.join(BASE, rel_path)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✓ File:      {rel_path}")

print("\n✅ Setup complete!")
print("   1. Edit .env and add your Gemini API key")
print("   2. Run:  pip install -r requirements.txt")
print("   3. Run:  python app.py")
print("   4. Open: http://localhost:5000")
