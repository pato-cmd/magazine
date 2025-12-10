/* Utility: focus trap for modal accessibility */
function trapFocus(modal) {
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  let first = focusable[0];
  let last = focusable[focusable.length - 1];

  function handleTab(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  modal.addEventListener('keydown', handleTab);
  return () => modal.removeEventListener('keydown', handleTab);
}

/* Lightbox: photos.html */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const triggers = document.querySelectorAll('.lightbox-trigger');
  let releaseFocusTrap = null;

  function openLightbox(src, alt) {
    imgEl.src = src;
    imgEl.alt = alt || '';
    captionEl.textContent = alt || '';
    lightbox.setAttribute('aria-hidden', 'false');
    releaseFocusTrap = trapFocus(lightbox);
    closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    imgEl.src = '';
    captionEl.textContent = '';
    if (releaseFocusTrap) releaseFocusTrap();
    document.body.style.overflow = '';
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const img = btn.querySelector('img');
      openLightbox(img.src, img.alt);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') closeLightbox();
  });
})();

/* Poems: dynamic loading from /poems/*.txt
   - Title = first non-empty line
   - Body = remaining lines
*/
(function loadPoems() {
  const container = document.getElementById('poems-container');
  const status = document.getElementById('poems-status');
  if (!container) return;

  // Configure your poems list here
  const poemFiles = [
    'poems/fire.txt',
    'poems/presence.txt',
    'poems/youstay.txt',
    'poems/inthenight.txt',
    'poems/quiet.txt',
    'poems/gravity.txt',
    // Add up to 20+ entries as needed
  ];

  if (status) status.textContent = 'Loading poems…';

  Promise.all(
    poemFiles.map(async (path, idx) => {
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();

        const lines = txt.split(/\r?\n/).map(l => l.trim());
        const titleLine = lines.find(l => l.length > 0) || `Poem ${idx + 1}`;
        const bodyLines = [];
        let started = false;
        for (const l of lines) {
          if (!started && l === titleLine) { started = true; continue; }
          bodyLines.push(l);
        }
        const bodyText = bodyLines.join('\n').trim();

        const card = document.createElement('article');
        card.className = 'card card-poem';

        const content = document.createElement('div');
        content.className = 'card-content';

        const title = document.createElement('h3');
        title.className = 'poem-title';
        title.textContent = titleLine;

        const body = document.createElement('div');
        body.className = 'poem-body';
        body.textContent = bodyText || '(No content)';

        content.appendChild(title);
        content.appendChild(body);
        card.appendChild(content);
        container.appendChild(card);
      } catch (err) {
        const errorCard = document.createElement('article');
        errorCard.className = 'card';
        errorCard.innerHTML = `
          <div class="card-content">
            <h3>Poem could not load</h3>
            <p class="status">File: ${path} · ${err.message}</p>
          </div>`;
        container.appendChild(errorCard);
      }
    })
  ).finally(() => {
    if (status) status.textContent = '';
  });
})();