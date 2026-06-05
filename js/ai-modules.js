/* ============================================================
   SKPharma — AI Modules
   Fichier : js/ai-modules.js
   À inclure APRÈS tous les autres scripts dans index.html :
   <script src="js/ai-modules.js"></script>
   ============================================================ */

/* ---------- Clé API ----------
   Stocke ta clé dans js/config.js comme variable globale :
   const ANTHROPIC_KEY = 'sk-ant-...';
   OU directement ici si fichier non versionné :              */
// const ANTHROPIC_KEY = 'sk-ant-...'; // ← décommenter si pas dans config.js

const AI_MODEL = 'claude-sonnet-4-20250514';

/* ============================================================
   UTILITAIRES COMMUNS
   ============================================================ */

function aiFormatMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,3} (.+)$/gm, '<br><strong style="font-size:14px;color:var(--teal)">$1</strong>')
    .replace(/^(\d+\.) /gm, '<br><strong>$1</strong> ')
    .replace(/^- /gm, '&nbsp;&nbsp;• ')
    .replace(/\n/g, '<br>');
}

async function aiCall(messages, systemPrompt) {
  const key = (typeof ANTHROPIC_KEY !== 'undefined') ? ANTHROPIC_KEY : null;
  if (!key) {
    throw new Error('Clé API manquante — définis ANTHROPIC_KEY dans js/config.js');
  }
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages
    })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erreur API (${resp.status})`);
  }
  const data = await resp.json();
  return data.content?.find(b => b.type === 'text')?.text || '';
}

function aiSetLoading(el, isLoading, originalHTML) {
  if (isLoading) {
    el.disabled = true;
    el.dataset.original = el.innerHTML;
    el.innerHTML = '<span class="ai-spinner"></span> Analyse…';
  } else {
    el.disabled = false;
    el.innerHTML = originalHTML || el.dataset.original || el.innerHTML;
  }
}

function aiShowResult(containerId, html) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = html;
}

/* ============================================================
   1. PAGE MÉDICAMENTS — Bloc IA
   Injecte un bloc IA en haut de #page-medicaments
   ============================================================ */

function initAIMedicaments() {
  const page = document.getElementById('page-medicaments');
  if (!page || document.getElementById('ai-med-block')) return;

  const block = document.createElement('div');
  block.id = 'ai-med-block';
  block.className = 'ai-bar';
  block.style.cssText = 'margin-bottom:20px';
  block.innerHTML = `
    <div class="ai-top">
      <div class="ai-dot"></div>
      <div class="ai-title">Assistant IA — Médicaments</div>
      <div class="ai-sub">Posologie · Alternatives · Équivalences</div>
    </div>
    <div class="ai-row">
      <input class="ai-input" id="ai-med-q" type="text"
        placeholder="Ex : Doliprane 1g adulte, alternatives à l'Ibuprofène, équivalence Metformine…"
        onkeydown="if(event.key==='Enter')askAIMed()"/>
      <button class="ai-btn" id="ai-med-btn" onclick="askAIMed()">Analyser</button>
    </div>
    <div class="ai-response" id="ai-med-resp" style="display:none"></div>
  `;

  // Insère après le page-header
  const header = page.querySelector('.page-header');
  if (header && header.nextSibling) {
    page.insertBefore(block, header.nextSibling);
  } else {
    page.insertBefore(block, page.firstChild);
  }
}

async function askAIMed() {
  const input = document.getElementById('ai-med-q');
  const btn = document.getElementById('ai-med-btn');
  const resp = document.getElementById('ai-med-resp');
  const q = input?.value?.trim();
  if (!q) { input?.focus(); return; }

  aiSetLoading(btn, true);
  resp.style.display = 'block';
  resp.innerHTML = '<em style="color:var(--text-muted)">Analyse en cours…</em>';

  try {
    const text = await aiCall(
      [{ role: 'user', content: `Médicament ou question : "${q}"` }],
      `Tu es un pharmacien expert. Réponds de façon structurée en français avec :
1. **Posologie standard** (adulte / enfant si pertinent)
2. **Indications principales**
3. **Alternatives thérapeutiques** (2-3 équivalents)
4. **Équivalences de doses** si applicable
5. **Points de vigilance** essentiels (interactions, CI, effets secondaires notables)
Sois précis, concis et professionnel. Tu t'adresses à un pharmacien.`
    );
    resp.innerHTML = aiFormatMd(text);
  } catch (e) {
    resp.innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`;
  }

  aiSetLoading(btn, false, 'Analyser');
}

/* ============================================================
   2. PAGE PATHOLOGIES — Bloc IA
   Injecte un bloc IA en haut de #page-pathologies
   ============================================================ */

function initAIPathologies() {
  const page = document.getElementById('page-pathologies');
  if (!page || document.getElementById('ai-path-block')) return;

  const block = document.createElement('div');
  block.id = 'ai-path-block';
  block.className = 'ai-bar';
  block.style.cssText = 'margin-bottom:20px';
  block.innerHTML = `
    <div class="ai-top">
      <div class="ai-dot"></div>
      <div class="ai-title">Assistant IA — Pathologies</div>
      <div class="ai-sub">Traitements · Conduite à tenir · Conseils patient</div>
    </div>
    <div class="ai-row">
      <input class="ai-input" id="ai-path-q" type="text"
        placeholder="Ex : Hypertension artérielle, diabète type 2, insuffisance cardiaque…"
        onkeydown="if(event.key==='Enter')askAIPath()"/>
      <button class="ai-btn" id="ai-path-btn" onclick="askAIPath()">Rechercher</button>
    </div>
    <div class="ai-response" id="ai-path-resp" style="display:none"></div>
  `;

  const header = page.querySelector('.page-header');
  if (header && header.nextSibling) {
    page.insertBefore(block, header.nextSibling);
  } else {
    page.insertBefore(block, page.firstChild);
  }
}

async function askAIPath() {
  const input = document.getElementById('ai-path-q');
  const btn = document.getElementById('ai-path-btn');
  const resp = document.getElementById('ai-path-resp');
  const q = input?.value?.trim();
  if (!q) { input?.focus(); return; }

  aiSetLoading(btn, true);
  resp.style.display = 'block';
  resp.innerHTML = '<em style="color:var(--text-muted)">Recherche en cours…</em>';

  try {
    const text = await aiCall(
      [{ role: 'user', content: `Pathologie : "${q}"` }],
      `Tu es un pharmacien expert. Pour cette pathologie, fournis en français :
1. **Médicaments de 1ère intention** (DCI + classe thérapeutique)
2. **Médicaments de 2ème intention**
3. **Conduite à tenir** pratique pour le pharmacien
4. **Conseils hygiéno-diététiques** à transmettre au patient
5. **Signaux d'alarme** nécessitant un avis médical urgent
Sois structuré, précis et professionnel.`
    );
    resp.innerHTML = aiFormatMd(text);
  } catch (e) {
    resp.innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`;
  }

  aiSetLoading(btn, false, 'Rechercher');
}

/* ============================================================
   3. MODAL SCAN ORDONNANCE — Analyse IA intégrée
   Remplace / enrichit processScan() existant
   ============================================================ */

let _scanFileData = null;
let _scanFileType = null;

// Override de previewScan pour stocker les données base64
const _origPreviewScan = window.previewScan;
window.previewScan = function(input) {
  if (_origPreviewScan) _origPreviewScan(input);
  const file = input.files[0];
  if (!file) return;
  _scanFileType = file.type;
  const reader = new FileReader();
  reader.onload = () => { _scanFileData = reader.result.split(',')[1]; };
  reader.readAsDataURL(file);
};

// Override de processScan pour y injecter l'IA
window.processScan = async function() {
  const status = document.getElementById('scan-status');
  const preview = document.getElementById('scan-preview');

  if (!_scanFileData) {
    if (status) {
      status.style.display = 'block';
      status.style.background = 'var(--red-pale)';
      status.style.color = 'var(--red)';
      status.textContent = '⚠️ Veuillez d\'abord choisir une image.';
    }
    return;
  }

  const btn = document.querySelector('#modal-scan-ordo .modal-footer .btn-primary');
  aiSetLoading(btn, true);

  if (status) {
    status.style.display = 'block';
    status.style.background = 'var(--teal-pale)';
    status.style.color = 'var(--teal)';
    status.textContent = '🔍 Analyse de l\'ordonnance en cours…';
  }

  try {
    const text = await aiCall(
      [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: _scanFileType || 'image/jpeg', data: _scanFileData }
          },
          {
            type: 'text',
            text: `Analyse cette ordonnance médicale et retourne un JSON strict (sans markdown, sans backticks) :
{
  "medecin": "Nom du médecin prescripteur",
  "date": "YYYY-MM-DD ou vide",
  "medicaments": "Liste complète des médicaments avec posologie, un par ligne",
  "renouvellement": "",
  "statut": "Dispensé",
  "interactions": "Liste des interactions ou contre-indications détectées (vide si aucune)",
  "notes": "Conseils pharmacien ou observations importantes"
}
Si une information n'est pas lisible, laisse le champ vide. Ne retourne QUE le JSON.`
          }
        ]
      }],
      `Tu es un pharmacien expert en lecture d'ordonnances. Tu analyses des images d'ordonnances médicales françaises et extrais les informations structurées. Tu retournes uniquement du JSON valide, sans aucun texte autour.`
    );

    // Parse JSON
    let data = {};
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      data = JSON.parse(clean);
    } catch (e) {
      throw new Error('Impossible de lire la réponse IA. Réessayez.');
    }

    // Pré-remplir le modal ordonnance
    if (data.medecin) {
      const f = document.getElementById('o-medecin');
      if (f) f.value = data.medecin;
    }
    if (data.date) {
      const f = document.getElementById('o-date');
      if (f) f.value = data.date;
    }
    if (data.medicaments) {
      const f = document.getElementById('o-meds');
      if (f) f.value = data.medicaments;
    }
    if (data.renouvellement) {
      const f = document.getElementById('o-renouvellement');
      if (f) {
        [...f.options].forEach(o => { if (o.value === data.renouvellement || o.text === data.renouvellement) f.value = o.value; });
      }
    }
    if (data.statut) {
      const f = document.getElementById('o-statut');
      if (f) {
        [...f.options].forEach(o => { if (o.text === data.statut) f.value = o.value; });
      }
    }

    // Notes = interactions + notes
    const notesField = document.getElementById('o-notes');
    if (notesField) {
      let notes = '';
      if (data.interactions) notes += `⚠️ Interactions détectées : ${data.interactions}\n`;
      if (data.notes) notes += data.notes;
      notesField.value = notes.trim();
    }

    if (status) {
      status.textContent = '✅ Ordonnance analysée — vérifiez et complétez les champs ci-dessous.';
    }

    // Fermer le modal scan et ouvrir le modal ordonnance après 1.2s
    setTimeout(() => {
      closeModal('scan-ordo');
      _scanFileData = null;
      _scanFileType = null;
      // Réinitialise le dropzone
      const zone = document.getElementById('scan-dropzone');
      if (zone) zone.style.borderColor = '';
      const prev = document.getElementById('scan-preview');
      if (prev) { prev.style.display = 'none'; prev.src = ''; }
      if (status) status.style.display = 'none';
      openModal('add-ordo');
    }, 1200);

  } catch (e) {
    if (status) {
      status.style.background = 'var(--red-pale)';
      status.style.color = 'var(--red)';
      status.textContent = `❌ ${e.message}`;
    }
  }

  aiSetLoading(btn, false, '🔍 Analyser et pré-remplir');
};

/* ============================================================
   CSS SPINNER (injecté dynamiquement)
   ============================================================ */
(function injectSpinnerCSS() {
  if (document.getElementById('ai-modules-style')) return;
  const style = document.createElement('style');
  style.id = 'ai-modules-style';
  style.textContent = `
    .ai-spinner {
      display: inline-block;
      width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: ai-spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 4px;
    }
    @keyframes ai-spin { to { transform: rotate(360deg); } }
    #ai-med-resp, #ai-path-resp {
      margin-top: 12px;
      font-size: 13px;
      line-height: 1.7;
      color: var(--text);
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
    }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   INIT — appelé automatiquement au chargement
   Les blocs IA sont injectés quand on navigue vers les pages
   ============================================================ */

// Hook sur showPage pour injecter les blocs au bon moment
const _origShowPage = window.showPage;
window.showPage = function(page, el) {
  if (_origShowPage) _origShowPage(page, el);
  if (page === 'medicaments') setTimeout(initAIMedicaments, 50);
  if (page === 'pathologies') setTimeout(initAIPathologies, 50);
};

// Init si déjà sur ces pages au chargement
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-medicaments')?.classList.contains('active')) initAIMedicaments();
  if (document.getElementById('page-pathologies')?.classList.contains('active')) initAIPathologies();
});
