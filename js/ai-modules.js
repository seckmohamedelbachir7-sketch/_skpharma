/* ============================================================
   SKPharma — AI Modules v2
   js/ai-modules.js
   Ajouter à la fin de index.html :
   <script src="js/ai-modules.js"></script>
   ============================================================ */

/* ─────────────────────────────────────────────────────────────
   APPEL API (via proxy Vercel sécurisé)
   Le endpoint /api/analyze-ordo est déjà dans ton projet.
   On crée un second endpoint /api/analyze-ai pour les autres
   appels, OU on appelle l'API directement avec ANTHROPIC_KEY
   défini dans config.js
   ───────────────────────────────────────────────────────────── */

async function aiModuleCall(messages, systemPrompt, maxTokens = 1000) {
  /* Priorité 1 : proxy Vercel (plus sécurisé, clé côté serveur) */
  if (window.AI_PROXY_URL) {
    const r = await fetch(window.AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system: systemPrompt, max_tokens: maxTokens })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d.text || '';
  }
  /* Priorité 2 : clé directe dans config.js */
  if (typeof ANTHROPIC_KEY === 'undefined' || !ANTHROPIC_KEY) {
    throw new Error('Clé API manquante — définis ANTHROPIC_KEY dans config.js');
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'Erreur API');
  return d.content?.find(b => b.type === 'text')?.text || '';
}

/* ─────────────────────────────────────────────────────────────
   RENDU MARKDOWN SIMPLE
   ───────────────────────────────────────────────────────────── */
function aiMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,3} (.+)$/gm, '<strong style="font-size:13px;color:var(--teal)">$1</strong>')
    .replace(/^(\d+\.) /gm, '<br><strong>$1</strong> ')
    .replace(/^[-•] /gm, '<br>&nbsp;&nbsp;• ')
    .replace(/\n/g, '<br>');
}

/* ─────────────────────────────────────────────────────────────
   PANEL D'ALERTE IA — injecté dans l'onglet ordonnances
   ───────────────────────────────────────────────────────────── */
function showAIAnalysisPanel(html, isError = false) {
  let panel = document.getElementById('ai-ordo-analysis');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'ai-ordo-analysis';
    // Insérer avant la liste des ordonnances
    const list = document.getElementById('det-ordos-list');
    if (list && list.parentNode) {
      list.parentNode.insertBefore(panel, list);
    }
  }
  panel.innerHTML = `
    <div style="
      background:${isError ? 'var(--red-pale)' : 'var(--teal-pale)'};
      border:1px solid ${isError ? 'var(--red)' : 'var(--teal)'};
      border-radius:var(--radius-lg);
      padding:14px 16px;
      margin-bottom:16px;
      position:relative;
    ">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:${isError ? 'var(--red)' : 'var(--teal)'};
          display:flex;align-items:center;justify-content:center;
          font-size:14px;flex-shrink:0
        ">${isError ? '⚠️' : '🤖'}</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:${isError ? 'var(--red)' : 'var(--teal)'}">
            ${isError ? 'Erreur analyse IA' : 'Analyse IA — Ordonnance'}
          </div>
          <div style="font-size:11px;color:var(--text-muted)">Basée sur le dossier patient</div>
        </div>
        <button onclick="document.getElementById('ai-ordo-analysis').remove()"
          style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-muted);padding:0;line-height:1"
          title="Fermer">×</button>
      </div>
      <div style="font-size:13px;line-height:1.7;color:var(--text)">${html}</div>
    </div>
  `;
}

function showAIAnalysisLoading() {
  showAIAnalysisPanel(`
    <div style="display:flex;align-items:center;gap:8px;color:var(--text-muted)">
      <div style="
        width:14px;height:14px;border-radius:50%;
        border:2px solid var(--teal);border-top-color:transparent;
        animation:ai-spin 0.7s linear infinite;flex-shrink:0
      "></div>
      Analyse en cours…
    </div>
  `);
}

/* ─────────────────────────────────────────────────────────────
   ANALYSE ORDONNANCE + DOSSIER PATIENT
   Appelée après saveOrdonnance() et saveEditOrdo()
   ───────────────────────────────────────────────────────────── */
async function analyzeOrdonnanceIA(medicaments) {
  if (!currentPatient || !medicaments) return;

  // Switcher sur l'onglet ordonnances si nécessaire
  const ordoTab = document.querySelector('.detail-tab[onclick*="ordos"]');
  if (ordoTab && !ordoTab.classList.contains('active')) {
    switchDetailTab('ordos', ordoTab);
  }

  showAIAnalysisLoading();

  const allergies   = currentPatient.allergies   || 'Aucune allergie connue';
  const pathologies = currentPatient.pathologies || 'Aucune pathologie connue';

  const prompt = `Tu es un pharmacien expert. Analyse cette ordonnance pour le patient suivant :

**Dossier patient :**
- Allergies : ${allergies}
- Pathologies connues : ${pathologies}

**Médicaments prescrits :**
${medicaments}

Fournis une analyse structurée en français :

1. **⚠️ Alertes allergies** — Y a-t-il un médicament prescrit qui correspond ou croise une allergie connue du patient ? Si oui, alerte immédiate avec explication.
 2. **🔄 Interactions médicamenteuses** — Liste toutes les interactions entre les médicaments prescrits en utilisant obligatoirement ces préfixes :
- 🔴 MAJEURE : [médicament A + médicament B] : explication
- 🟠 MODÉRÉE : [médicament A + médicament B] : explication  
- 🟡 MINEURE : [médicament A + médicament B] : explication
- ✅ Aucune interaction détectée (si aucune)
3. **🩺 Cohérence avec les pathologies** — Les médicaments sont-ils adaptés aux pathologies connues du patient ? Y a-t-il des contre-indications ?

4. **💊 Effets indésirables à surveiller** — Les principaux effets indésirables à signaler au patient pour cette ordonnance.

5. **✅ Conseils de dispensation** — 2-3 conseils pratiques à donner au patient.

Sois précis, concis et cliniquement rigoureux. Si tout est OK sans problème, dis-le clairement.`;

  try {
    const text = await aiModuleCall(
      [{ role: 'user', content: prompt }],
      'Tu es un pharmacien expert clinicien. Tu t\'adresses à un professionnel de santé. Tes analyses sont précises, structurées et cliniquement pertinentes. En français.',
      1200
    );
    showAIAnalysisPanel(aiMd(text));
  } catch (e) {
    showAIAnalysisPanel(`Erreur : ${e.message}`, true);
  }
}

/* ─────────────────────────────────────────────────────────────
   HOOK SUR saveOrdonnance — déclenche l'analyse après save
   ───────────────────────────────────────────────────────────── */
const _origSaveOrdonnance = window.saveOrdonnance;
window.saveOrdonnance = async function () {
  // Récupère les médicaments AVANT que le form soit vidé
  const meds = document.getElementById('o-meds')?.value?.trim();
  await _origSaveOrdonnance();
  // Lance l'analyse après fermeture du modal
  if (meds && currentPatient) {
    setTimeout(() => analyzeOrdonnanceIA(meds), 400);
  }
};

/* ─────────────────────────────────────────────────────────────
   HOOK SUR saveEditOrdo — idem pour modification
   ───────────────────────────────────────────────────────────── */
const _origSaveEditOrdo = window.saveEditOrdo;
window.saveEditOrdo = async function () {
  const meds = document.getElementById('eo-meds')?.value?.trim();
  await _origSaveEditOrdo();
  if (meds && currentPatient) {
    setTimeout(() => analyzeOrdonnanceIA(meds), 400);
  }
};

/* ─────────────────────────────────────────────────────────────
   HOOK SUR loadPathoPatient — bloc IA en haut de l'onglet
   ───────────────────────────────────────────────────────────── */
const _origLoadPathoPatient = window.loadPathoPatient;
window.loadPathoPatient = async function (patientId) {
  await _origLoadPathoPatient(patientId);
  injectAIPathoBlock(patientId);
};

function injectAIPathoBlock(patientId) {
  const el = document.getElementById('det-patho-list');
  if (!el || document.getElementById('ai-patho-block')) return;

  const block = document.createElement('div');
  block.id = 'ai-patho-block';
  block.style.cssText = 'margin-bottom:16px';
  block.innerHTML = `
    <div style="
      background:var(--bg-card,#fff);
      border:var(--border);
      border-radius:var(--radius-lg);
      padding:14px 16px;
    ">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="
          width:28px;height:28px;border-radius:50%;background:var(--teal);
          display:flex;align-items:center;justify-content:center;font-size:14px
        ">🤖</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--teal)">Assistant IA — Pathologies</div>
          <div style="font-size:11px;color:var(--text-muted)">Conseils thérapeutiques personnalisés</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <input class="form-input" id="ai-patho-q" placeholder="Ex : conduite à tenir, médicaments indiqués, surveillance…"
          style="flex:1;font-size:13px;padding:8px 12px"
          onkeydown="if(event.key==='Enter')askAIPathoPatient()"/>
        <button class="btn btn-primary btn-sm" id="ai-patho-btn" onclick="askAIPathoPatient()">Analyser</button>
      </div>
      <div id="ai-patho-resp" style="display:none;margin-top:10px;font-size:13px;line-height:1.7;color:var(--text);max-height:280px;overflow-y:auto"></div>
    </div>
  `;

  el.insertBefore(block, el.firstChild);
}

async function askAIPathoPatient() {
  const input = document.getElementById('ai-patho-q');
  const btn   = document.getElementById('ai-patho-btn');
  const resp  = document.getElementById('ai-patho-resp');
  const q     = input?.value?.trim();
  if (!q || !currentPatient) { input?.focus(); return; }

  btn.disabled = true;
  btn.textContent = '…';
  resp.style.display = 'block';
  resp.innerHTML = '<em style="color:var(--text-muted)">Analyse en cours…</em>';

  const allergies   = currentPatient.allergies   || 'Aucune';
  const pathologies = currentPatient.pathologies || 'Non renseignées';

  try {
    const text = await aiModuleCall(
      [{ role: 'user', content:
        `Patient — Allergies : ${allergies} | Pathologies connues : ${pathologies}\n\nQuestion : ${q}`
      }],
      `Tu es un pharmacien expert. Tu réponds à des questions sur les pathologies d'un patient en tenant compte de son dossier (allergies, antécédents). Réponses structurées, précises, en français, destinées à un pharmacien professionnel.`,
      900
    );
    resp.innerHTML = aiMd(text);
  } catch (e) {
    resp.innerHTML = `<span style="color:var(--red)">❌ ${e.message}</span>`;
  }

  btn.disabled = false;
  btn.textContent = 'Analyser';
}

/* ─────────────────────────────────────────────────────────────
   CSS SPINNER
   ───────────────────────────────────────────────────────────── */
(function () {
  if (document.getElementById('ai-modules-css')) return;
  const s = document.createElement('style');
  s.id = 'ai-modules-css';
  s.textContent = `@keyframes ai-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
})();
