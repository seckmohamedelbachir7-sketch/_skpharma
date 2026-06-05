// ui.js — Helpers UI : navigation, modals, toasts, formats, IA, scan ordonnance

// ─────────────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────────────

function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  if (el) {
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
  }
  if (name === 'dashboard') loadDashboard();
  if (name === 'pathologies') loadPathologiesGlobales();
  if (name === 'entretiens') loadEntretiens();
  if (name === 'posologies') loadPosologiesGlobales();
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-login').style.display = tab==='login'?'block':'none';
  document.getElementById('tab-register').style.display = tab==='register'?'block':'none';
  event.currentTarget.classList.add('active');
}

function switchDetailTab(name, el) {
  document.querySelectorAll('.detail-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('dtab-'+name).classList.add('active');
  el.classList.add('active');
  if (name === 'patho' && currentPatient) loadPathoPatient(currentPatient.id);
  if (name === 'posologies' && currentPatient) loadPosologiesPatient(currentPatient.id);
}

// ─────────────────────────────────────────────
//  MODALS & TOASTS
// ─────────────────────────────────────────────

function openModal(name) {
  document.getElementById('modal-'+name).classList.add('open');
  setTodayDate();
  if (name === 'add-ordo' || name === 'edit-ordo') {
    setTimeout(() => initAutocomplete('o-meds'), 100);
    setTimeout(() => initAutocomplete('eo-meds'), 100);
  }
  if (name === 'add-posologie') {
    setTimeout(() => initAutocomplete('pos-medicament'), 100);
  }
}

function closeModal(name) {
  document.getElementById('modal-'+name).classList.remove('open');
}

function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg; el.className = 'auth-msg ' + type;
  el.style.display = msg ? 'block' : 'none';
}

function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function clearForm(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

// ─────────────────────────────────────────────
//  FORMATS DATE
// ─────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─────────────────────────────────────────────
//  THEME TOGGLE
// ─────────────────────────────────────────────

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('skpharma-theme', isDark ? 'dark' : 'light');
}

function applyStoredTheme() {
  const saved = localStorage.getItem('skpharma-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = '☀️';
  }
}

// ─────────────────────────────────────────────
//  ASSISTANT IA (Mistral — inchangé)
// ─────────────────────────────────────────────

async function askAI() {
  const q = document.getElementById('ai-q').value.trim();
  const resp = document.getElementById('ai-resp');
  if (!q) return;
  resp.style.display = 'block';
  resp.textContent = 'Analyse en cours…';
  document.getElementById('ai-q').value = '';
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer 286xCNoTND6WY9GeOVW4JqQqgoYGlYnZ' },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: 'Tu es un assistant clinique pour pharmaciens professionnels. Réponds en français, de manière concise et rigoureuse. Cite les doses précises, contre-indications, et recommandations ANSM/HAS.' },
          { role: 'user', content: q }
        ]
      })
    });
    const data = await res.json();
    resp.textContent = data.choices?.[0]?.message?.content || 'Erreur de réponse.';
  } catch(e) {
    resp.textContent = 'Erreur de connexion : ' + e.message;
  }
}

// ─────────────────────────────────────────────
//  SCAN ORDONNANCE — appel via route API /api/scan-ordonnance
//  (la clé Anthropic reste sécurisée côté serveur Vercel)
// ─────────────────────────────────────────────

function previewScan(input) {
  const f = input.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  const img = document.getElementById('scan-preview');
  img.src = url;
  img.style.display = 'block';
  document.getElementById('scan-dropzone').style.borderColor = 'var(--teal)';
}

function scanOrdonnance() {
  document.getElementById('scan-file').value = '';
  document.getElementById('scan-preview').style.display = 'none';
  document.getElementById('scan-status').style.display = 'none';
  document.getElementById('scan-dropzone').style.borderColor = 'var(--gray-300)';
  openModal('scan-ordo');
}

async function processScan() {
  const fileInput = document.getElementById('scan-file');
  const statusEl  = document.getElementById('scan-status');
  const file = fileInput.files[0];
  if (!file) { showToast('Veuillez choisir une image', 'error'); return; }

  statusEl.style.display = 'block';
  statusEl.textContent = "Analyse de l'ordonnance en cours…";

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    let mediaType = file.type || 'image/jpeg';
    if (!['image/jpeg','image/png','image/gif','image/webp'].includes(mediaType)) {
      mediaType = 'image/jpeg';
    }

    try {
      // Appel vers la route API serveur — la clé Anthropic n'est jamais côté client
      const res = await fetch('/api/scan-ordonnance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType })
      });

      const parsed = await res.json();

      if (!res.ok || parsed.error) {
        statusEl.textContent = 'Erreur API : ' + (parsed.error || res.statusText);
        return;
      }

      // Pré-remplissage formulaire
      if (parsed.medecin)     document.getElementById('o-medecin').value = parsed.medecin;
      if (parsed.date)        document.getElementById('o-date').value    = parsed.date;
      if (parsed.medicaments) document.getElementById('o-meds').value    = parsed.medicaments;
      if (parsed.notes)       document.getElementById('o-notes').value   = parsed.notes;
      if (parsed.renouvellement) {
        const sel = document.getElementById('o-renouvellement');
        for (let opt of sel.options) {
          if (opt.value && parsed.renouvellement.toLowerCase().includes(opt.value.toLowerCase())) {
            sel.value = opt.value;
            break;
          }
        }
      }

      closeModal('scan-ordo');
      statusEl.style.display = 'none';
      showToast('✅ Ordonnance analysée et formulaire pré-rempli', 'success');
      openModal('add-ordo');

    } catch (err) {
      statusEl.textContent = 'Erreur : ' + err.message;
    }
  };
  reader.readAsDataURL(file);
}

// ─────────────────────────────────────────────
//  LISTENERS & INIT
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  applyStoredTheme();
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
  init();
});
