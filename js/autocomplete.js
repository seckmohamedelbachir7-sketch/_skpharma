// ── AUTOCOMPLÉTION MÉDICAMENTS ──────────────────

function initAutocomplete(inputId) {
  const input = document.getElementById(inputId);
  if (!input || !window.drugs) return;
 
  let box = document.getElementById('autocomplete-box-' + inputId);
  if (!box) {
    box = document.createElement('div');
    box.id = 'autocomplete-box-' + inputId;
    box.style.cssText = `
      position:absolute;z-index:9999;background:var(--card);
      border:var(--border);border-radius:var(--radius);
      box-shadow:0 4px 16px rgba(0,0,0,0.12);
      max-height:200px;overflow-y:auto;display:none;width:100%
    `;
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(box);
  }
 
  input.addEventListener('input', () => {
    const val = input.value;
    const lastWord = val.split(/[\n,;]/g).pop().trim().toLowerCase();
    if (lastWord.length < 2) { box.style.display = 'none'; return; }
 
    const matches = window.drugs
      .filter(d => (d.name || d.nom || '').toLowerCase().startsWith(lastWord))
      .slice(0, 8);
 
    if (!matches.length) { box.style.display = 'none'; return; }
 
    box.innerHTML = matches.map(d => {
      const name = d.name || d.nom || '';
      return `<div style="padding:8px 12px;cursor:pointer;font-size:13px;
                border-bottom:var(--border);color:var(--text)"
                onmousedown="pickSuggestion('${inputId}', '${name.replace(/'/g, "\\'")}')">
                💊 ${name}
              </div>`;
    }).join('');
    box.style.display = 'block';
  });
 
  input.addEventListener('blur', () => {
    setTimeout(() => { box.style.display = 'none'; }, 150);
  });
}
 
function pickSuggestion(inputId, name) {
  const input = document.getElementById(inputId);
  if (!input) return;
 
  if (input.tagName.toLowerCase() === 'textarea') {
    const val = input.value;
    const lastSep = Math.max(
      val.lastIndexOf('\n'),
      val.lastIndexOf(','),
      val.lastIndexOf(';')
    );
    if (lastSep === -1) {
      input.value = name + ' ';
    } else {
      input.value = val.substring(0, lastSep + 1) + ' ' + name + ' ';
    }
  } else {
    input.value = name;
  }
 
  const box = document.getElementById('autocomplete-box-' + inputId);
  if (box) box.style.display = 'none';
  input.focus();
}
 
function initAllAutocompletes() {
  initAutocomplete('o-meds');
  initAutocomplete('eo-meds');
  initAutocomplete('pos-medicament');
}
 
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initAllAutocompletes, 1000);
});
 
