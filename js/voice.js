// ============================================================
// voice.js — Saisie vocale SKPharma
// Mode 1 : micro par champ (Web Speech API)
// Mode 2 : assistant vocal IA (parole libre → remplissage auto)
// ============================================================

// ── Vérification support navigateur ─────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const VOICE_SUPPORTED = !!SpeechRecognition;

// ── État global ──────────────────────────────────────────────
let voiceRecognizer     = null;   // instance Web Speech
let voiceActiveField    = null;   // champ en cours de dictée
let voiceAssistantActive = false; // mode assistant vocal IA
let voiceTranscriptFull = '';     // transcription complète pour l'IA

// ============================================================
// MODE 1 — MICRO PAR CHAMP
// ============================================================

/**
 * Injecte un bouton micro 🎤 à côté d'un champ donné.
 * Usage : addVoiceToField('trame_inr_dernier', { lang:'fr-FR', type:'number' })
 */
function addVoiceToField(fieldId, opts = {}) {
  if (!VOICE_SUPPORTED) return;
  const field = document.getElementById(fieldId);
  if (!field || field.dataset.voiceAdded) return;
  field.dataset.voiceAdded = '1';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'voice-mic-btn';
  btn.title = 'Dicter ce champ';
  btn.innerHTML = '🎤';
  btn.setAttribute('data-field', fieldId);
  btn.onclick = (e) => { e.preventDefault(); startFieldVoice(fieldId, btn, opts); };

  // Wrapper
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;display:flex;align-items:center;gap:6px';
  field.parentNode.insertBefore(wrap, field);
  wrap.appendChild(field);
  wrap.appendChild(btn);
}

function startFieldVoice(fieldId, btn, opts = {}) {
  if (!VOICE_SUPPORTED) {
    showToast('Dictée vocale non supportée sur ce navigateur', 'error');
    return;
  }

  // Arrêter si déjà en cours sur ce champ
  if (voiceActiveField === fieldId && voiceRecognizer) {
    voiceRecognizer.stop();
    return;
  }

  // Arrêter tout recognizer en cours
  if (voiceRecognizer) voiceRecognizer.stop();

  voiceActiveField = fieldId;
  const field = document.getElementById(fieldId);

  // Feedback visuel
  btn.innerHTML = '🔴';
  btn.classList.add('voice-recording');
  field.style.borderColor = '#e03c52';
  field.placeholder = 'Parlez…';

  const recognizer = new SpeechRecognition();
  recognizer.lang = opts.lang || 'fr-FR';
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;
  recognizer.continuous = false;
  voiceRecognizer = recognizer;

  recognizer.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    // Nettoyage selon le type de champ
    if (opts.type === 'number') {
      transcript = transcript.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    } else if (opts.type === 'date') {
      transcript = parseVoiceDate(transcript);
    } else {
      transcript = transcript.trim();
    }

    field.value = transcript;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  };

  recognizer.onend = () => {
    btn.innerHTML = '🎤';
    btn.classList.remove('voice-recording');
    if (field) {
      field.style.borderColor = '';
      field.placeholder = opts.placeholder || '';
    }
    voiceActiveField = null;
    voiceRecognizer = null;
  };

  recognizer.onerror = (event) => {
    btn.innerHTML = '🎤';
    btn.classList.remove('voice-recording');
    if (field) field.style.borderColor = '';
    voiceActiveField = null;
    voiceRecognizer = null;
    if (event.error !== 'no-speech') {
      showToast('Erreur micro : ' + event.error, 'error');
    }
  };

  recognizer.start();
}

// Parser vocal pour les dates (ex: "le quinze mars deux mille vingt-cinq")
function parseVoiceDate(transcript) {
  const months = {
    'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
  };
  const t = transcript.toLowerCase().trim();

  // Format "JJ/MM/AAAA" ou "JJ-MM-AAAA"
  const direct = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (direct) return `${direct[3]}-${direct[2].padStart(2,'0')}-${direct[1].padStart(2,'0')}`;

  // Format textuel "le X mois AAAA"
  for (const [mname, mnum] of Object.entries(months)) {
    const re = new RegExp(`(\\d{1,2})\\s+${mname}\\s+(\\d{4})`);
    const m = t.match(re);
    if (m) return `${m[2]}-${String(mnum).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }

  return transcript; // retour brut si non parsé
}

// ── Injecter les micros sur tous les champs de la trame active ──
function injectVoiceOnTrame(typeKey) {
  if (!VOICE_SUPPORTED) return;
  const typeInfo = ENTRETIEN_TYPES[typeKey];
  if (!typeInfo) return;

  setTimeout(() => {
    typeInfo.trame.forEach(field => {
      if (['text','number','date'].includes(field.type)) {
        addVoiceToField(`trame_${field.id}`, {
          type: field.type,
          placeholder: field.placeholder || '',
          lang: 'fr-FR'
        });
      }
    });
    // Champs notes
    addVoiceToField('ent-notes', { lang: 'fr-FR' });
  }, 300);
}

// ============================================================
// MODE 2 — ASSISTANT VOCAL IA
// ============================================================

/**
 * Lance l'assistant vocal IA dans la modale entretien.
 * La pharmacienne parle librement, l'IA analyse et remplit les champs.
 */
function startVoiceAssistant() {
  if (!VOICE_SUPPORTED) {
    showToast('Dictée vocale non supportée sur ce navigateur', 'error');
    return;
  }

  const typeKey = document.getElementById('ent-type-hidden')?.value;
  if (!typeKey) {
    showToast('Sélectionnez d\'abord le type d\'entretien', 'error');
    return;
  }

  voiceAssistantActive = true;
  voiceTranscriptFull  = '';

  renderVoiceAssistantUI('listening');

  const recognizer = new SpeechRecognition();
  recognizer.lang = 'fr-FR';
  recognizer.interimResults = true;
  recognizer.continuous = true;
  recognizer.maxAlternatives = 1;
  voiceRecognizer = recognizer;

  recognizer.onresult = (event) => {
    let interim = '';
    let final   = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
      else interim += event.results[i][0].transcript;
    }
    voiceTranscriptFull += final;
    updateVoiceTranscriptDisplay(voiceTranscriptFull + interim);
  };

  recognizer.onerror = (e) => {
    if (e.error !== 'no-speech') {
      renderVoiceAssistantUI('error', e.error);
    }
  };

  recognizer.start();
}

function stopVoiceAssistant() {
  if (voiceRecognizer) {
    voiceRecognizer.stop();
    voiceRecognizer = null;
  }
  if (!voiceTranscriptFull.trim()) {
    renderVoiceAssistantUI('idle');
    return;
  }
  renderVoiceAssistantUI('analyzing');
  analyzeVoiceWithAI(voiceTranscriptFull.trim());
}

async function analyzeVoiceWithAI(transcript) {
  const typeKey  = document.getElementById('ent-type-hidden')?.value;
  const typeInfo = ENTRETIEN_TYPES[typeKey] || {};

  // Construire la liste des champs attendus
  const fieldsDesc = (typeInfo.trame || [])
    .filter(f => ['text','number','date','select'].includes(f.type))
    .map(f => `"${f.id}": ${f.label}${f.options ? ' (valeurs possibles: '+f.options.join(', ')+')' : ''}${f.unit ? ' ['+f.unit+']' : ''}`)
    .join('\n');

  const patientEl = document.getElementById('ent-patient');
  const notesEl   = document.getElementById('ent-notes');

  const prompt = `Tu es assistant pharmacien. Voici la transcription d'un entretien pharmaceutique oral :

"${transcript}"

Type d'entretien : ${typeInfo.label || typeKey}

Extrais les informations et retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec ces champs :
{
  "patient_nom": "nom du patient si mentionné, sinon null",
  "notes": "résumé structuré de l'entretien en 2-3 phrases",
  "date": "date au format YYYY-MM-DD si mentionnée, sinon null",
  "trame": {
${fieldsDesc ? fieldsDesc.split('\n').map(l => `    ${l}`).join(',\n') : '    "notes": "observations"'}
  }
}

Règles :
- Pour les champs "select", utilise EXACTEMENT une des valeurs possibles listées
- Pour les dates, format YYYY-MM-DD obligatoire
- Pour les nombres, retourne uniquement le chiffre
- Si une info n'est pas mentionnée, mets null
- Sois précis et clinique`;

  try {
    const res = await fetch('/api/analyze-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: 1200 })
    });
    const raw  = await res.json();
    const text = (raw.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = null; }

    if (parsed) {
      fillFormFromVoiceAI(parsed, typeKey);
      renderVoiceAssistantUI('done', null, parsed, transcript);
    } else {
      renderVoiceAssistantUI('error', 'Réponse IA non parsable');
    }
  } catch (err) {
    renderVoiceAssistantUI('error', err.message);
  }
}

function fillFormFromVoiceAI(parsed, typeKey) {
  // Champs principaux
  if (parsed.patient_nom) {
    const el = document.getElementById('ent-patient');
    if (el) el.value = parsed.patient_nom;
  }
  if (parsed.notes) {
    const el = document.getElementById('ent-notes');
    if (el) el.value = parsed.notes;
  }
  if (parsed.date) {
    const el = document.getElementById('ent-date');
    if (el) el.value = parsed.date;
  }

  // Champs de la trame
  if (parsed.trame) {
    const typeInfo = ENTRETIEN_TYPES[typeKey] || {};
    (typeInfo.trame || []).forEach(field => {
      const val = parsed.trame[field.id];
      if (val === null || val === undefined) return;

      const el = document.getElementById(`trame_${field.id}`);
      if (!el) return;

      if (field.type === 'select') {
        // Trouver la valeur la plus proche
        const opts = Array.from(el.options).map(o => o.value);
        const match = opts.find(o => o.toLowerCase().includes(String(val).toLowerCase()))
                   || opts.find(o => String(val).toLowerCase().includes(o.toLowerCase()));
        if (match) el.value = match;
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  showToast('✅ Formulaire rempli par dictée vocale', 'success');
}

// ============================================================
// UI ASSISTANT VOCAL
// ============================================================

function renderVoiceAssistantButton() {
  if (!VOICE_SUPPORTED) return '';
  return `
    <div id="voice-assistant-zone" style="margin:12px 0;border:1.5px dashed var(--teal-border);
      border-radius:10px;padding:12px 14px;background:var(--teal-pale)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--teal);margin-bottom:2px">
            🎤 Saisie vocale intelligente
          </div>
          <div style="font-size:11px;color:var(--text-muted)">
            Dictez l'entretien librement — l'IA remplit le formulaire automatiquement
          </div>
        </div>
        <button class="btn btn-sm btn-primary" id="voice-assistant-btn"
          onclick="startVoiceAssistant()" style="white-space:nowrap;flex-shrink:0">
          🎤 Démarrer la dictée
        </button>
      </div>
      <div id="voice-assistant-feedback" style="margin-top:0"></div>
    </div>`;
}

function renderVoiceAssistantUI(state, error, parsed, transcript) {
  const zone = document.getElementById('voice-assistant-feedback');
  const btn  = document.getElementById('voice-assistant-btn');
  if (!zone) return;

  if (state === 'listening') {
    if (btn) { btn.textContent = '⏹ Terminer'; btn.onclick = stopVoiceAssistant; }
    zone.innerHTML = `
      <div style="margin-top:10px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:10px;height:10px;border-radius:50%;background:#e03c52;
            animation:aipulse 1s ease-in-out infinite"></div>
          <span style="font-size:12px;font-weight:600;color:#e03c52">Enregistrement en cours…</span>
          <span style="font-size:11px;color:var(--text-muted)">Parlez naturellement</span>
        </div>
        <div id="voice-transcript-live" style="font-size:12px;color:var(--text);
          background:rgba(255,255,255,0.6);border-radius:6px;padding:8px 10px;
          min-height:36px;line-height:1.6;font-style:italic">
          En attente de la parole…
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
          💡 Ex: "Patient Marie Lambert, entretien AVK, dernier INR à 2.4 le 10 juin, 
          pas d'oubli de prise, pas de saignement, alimentation stable"
        </div>
      </div>`;
  }

  else if (state === 'analyzing') {
    if (btn) { btn.textContent = '🎤 Démarrer la dictée'; btn.onclick = startVoiceAssistant; }
    zone.innerHTML = `
      <div style="margin-top:10px;display:flex;align-items:center;gap:10px;
        font-size:12px;color:var(--teal)">
        <div style="width:14px;height:14px;border:2px solid rgba(14,158,130,0.2);
          border-top-color:var(--teal);border-radius:50%;animation:spin .7s linear infinite"></div>
        Analyse IA en cours — remplissage du formulaire…
      </div>`;
  }

  else if (state === 'done') {
    if (btn) { btn.textContent = '🎤 Nouvelle dictée'; btn.onclick = startVoiceAssistant; }
    const fields = parsed?.trame ? Object.entries(parsed.trame).filter(([,v])=>v!==null).length : 0;
    zone.innerHTML = `
      <div style="margin-top:10px">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;
          background:rgba(14,158,130,0.1);border-radius:6px;margin-bottom:8px">
          <span style="color:var(--teal)">✅</span>
          <span style="font-size:12px;font-weight:600;color:var(--teal)">
            Formulaire rempli — ${fields} champ${fields>1?'s':''} détecté${fields>1?'s':''}
          </span>
        </div>
        <details style="font-size:11px;color:var(--text-muted)">
          <summary style="cursor:pointer;color:var(--text-muted)">Voir la transcription</summary>
          <div style="margin-top:6px;padding:8px;background:var(--bg);border-radius:6px;
            font-style:italic;line-height:1.6">${transcript || ''}</div>
        </details>
      </div>`;
  }

  else if (state === 'error') {
    if (btn) { btn.textContent = '🎤 Réessayer'; btn.onclick = startVoiceAssistant; }
    zone.innerHTML = `
      <div style="margin-top:10px;font-size:12px;color:#e03c52;padding:8px 10px;
        background:rgba(224,60,82,0.08);border-radius:6px">
        ⚠️ Erreur : ${error || 'problème inconnu'}
      </div>`;
  }

  else if (state === 'idle') {
    if (btn) { btn.textContent = '🎤 Démarrer la dictée'; btn.onclick = startVoiceAssistant; }
    zone.innerHTML = '';
  }
}

function updateVoiceTranscriptDisplay(text) {
  const el = document.getElementById('voice-transcript-live');
  if (el) el.textContent = text || 'En attente de la parole…';
}

// ============================================================
// CSS DYNAMIQUE
// ============================================================
(function injectVoiceCSS() {
  if (document.getElementById('voice-css')) return;
  const style = document.createElement('style');
  style.id = 'voice-css';
  style.textContent = `
    .voice-mic-btn {
      background: none;
      border: 1.5px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      padding: 6px 8px;
      cursor: pointer;
      font-size: 14px;
      flex-shrink: 0;
      transition: all .15s;
      line-height: 1;
    }
    .voice-mic-btn:hover {
      background: var(--teal-pale, rgba(14,158,130,0.1));
      border-color: var(--teal, #0e9e82);
    }
    .voice-mic-btn.voice-recording {
      background: rgba(224,60,82,0.1);
      border-color: #e03c52;
      animation: aipulse 1s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
})();

// ============================================================
// HOOK : injecter les micros après sélection du type
// ============================================================
// Surcharge de selectEntretienType pour ajouter les micros automatiquement.
// IMPORTANT : on utilise window.selectEntretienType explicitement pour éviter
// que le hoisting d'une déclaration "function selectEntretienType" plus bas
// dans ce même fichier ne capture la nouvelle fonction au lieu de l'originale
// (ce qui provoquait une récursion infinie / Maximum call stack size exceeded).
(function patchSelectEntretienType() {
  const original = window.selectEntretienType;
  if (typeof original !== 'function') return; // entretiens.js pas encore chargé

  window.selectEntretienType = function(typeKey) {
    original(typeKey);
    // Injecter micros sur les champs de la trame après rendu
    setTimeout(() => injectVoiceOnTrame(typeKey), 400);
  };
})();
