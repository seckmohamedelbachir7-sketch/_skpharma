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
      const dci  = d.dci  || '';
      return `<div style="padding:10px 14px;cursor:pointer;
                border-bottom:1px solid #eee;
                background:#fff;color:#1a1a1a;"
                onmouseover="this.style.background='#f0faf8'"
                onmouseout="this.style.background='#fff'"
                onmousedown="pickSuggestion('${inputId}', '${name.replace(/'/g, "\\'")}')">
                <div style="font-size:13px;font-weight:600;color:#1a1a1a">💊 ${name}</div>
                ${dci ? `<div style="font-size:11px;color:#888;margin-top:2px">${dci}</div>` : ''}
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
 
