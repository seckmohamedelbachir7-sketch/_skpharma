// ============================================================
// eligibilite.js — Détection auto des patients éligibles
// SKPharma · Convention pharmaceutique 2026
// ============================================================

// ── Règles de détection par entretien ──────────────────────
// Chaque règle contient les mots-clés à chercher dans
// posologies.medicament et ordonnances.medicaments (texte libre)

const ELIGIBILITE_RULES = {
  "AVK": {
    keywords: ["warfarine","coumadine","previscan","sintrom","acenocoumarol","fluindione","coumafene"],
    label: "Anticoagulants AVK",
    icon: "🩸",
    color: "#e03c52",
    colorPale: "rgba(224,60,82,0.1)",
    tarif: 40,
    description: "Traitement anticoagulant AVK détecté (>6 mois recommandé)",
    source_check: ["posologies","ordonnances"]
  },
  "AOD": {
    keywords: ["xarelto","eliquis","pradaxa","lixiana","rivaroxaban","apixaban","dabigatran","edoxaban"],
    label: "Anticoagulants AOD",
    icon: "💊",
    color: "#c47800",
    colorPale: "rgba(196,120,0,0.1)",
    tarif: 40,
    description: "Anticoagulant oral direct détecté",
    source_check: ["posologies","ordonnances"]
  },
  "Asthme": {
    keywords: ["fostair","symbicort","seretide","ventoline","beclometasone","fluticasone","budesonide",
               "salmeterol","formoterol","salbutamol","becotide","flixotide","innovair","trimbow",
               "spiriva","atrovent","relvar","incruse","anoro"],
    label: "Asthme / Corticoïdes inhalés",
    icon: "🫁",
    color: "#2563eb",
    colorPale: "rgba(37,99,235,0.1)",
    tarif: 40,
    description: "Corticoïde inhalé ou bronchodilatateur détecté",
    source_check: ["posologies","ordonnances"]
  },
  "Opioides": {
    keywords: ["morphine","oxycodone","oxycontin","fentanyl","durogesic","actiq","hydromorphone",
               "sophidone","buprenorphine","subutex","temgesic","methadone","tapentadol","palexia",
               "tramadol","codeine","lamaline"],
    label: "Opioïdes forts",
    icon: "⚠️",
    color: "#dc2626",
    colorPale: "rgba(220,38,38,0.1)",
    tarif: 40,
    description: "Opioïde fort détecté — suivi renforcé recommandé",
    source_check: ["posologies","ordonnances"]
  },
  "Diabete": {
    keywords: ["metformine","glucophage","stagid","insuline","lantus","toujeo","levemir","novorapid",
               "humalog","apidra","jardiance","empagliflozine","forxiga","dapagliflozine","invokana",
               "ozempic","semaglutide","victoza","liraglutide","trulicity","dulaglutide",
               "januvia","sitagliptine","galvus","vildagliptine","glipizide","gliclazide","diamicron","amaryl"],
    label: "Diabète",
    icon: "🩺",
    color: "#0891b2",
    colorPale: "rgba(8,145,178,0.1)",
    tarif: 40,
    description: "Traitement antidiabétique détecté",
    source_check: ["posologies","ordonnances"]
  },
  "Grossesse": {
    keywords: ["acide folique","speciafoldine","gynefam","maternea","elevit","iode grossesse",
               "progesterone","utrogestan","duphaston","clexane grossesse","lovenox grossesse"],
    label: "Femme enceinte",
    icon: "🤰",
    color: "#db2777",
    colorPale: "rgba(219,39,119,0.1)",
    tarif: 30,
    description: "Médicament de suivi grossesse détecté",
    source_check: ["posologies","ordonnances"]
  },
  "Bilan_medication": {
    keywords: [], // Règle basée sur l'âge + nombre de médicaments, pas sur keywords
    label: "Bilan partagé de médication",
    icon: "📋",
    color: "#7c3aed",
    colorPale: "rgba(124,58,237,0.1)",
    tarif: 60,
    description: "Patient ≥65 ans avec ≥5 médicaments actifs",
    source_check: ["patients","posologies"],
    special: "bpm"
  },
  "Bilan_prevention": {
    keywords: [],
    label: "Bilan de prévention",
    icon: "🏥",
    color: "#0e9e82",
    colorPale: "rgba(14,158,130,0.1)",
    tarif: 30,
    description: "Tranche d'âge 25, 45 ou 65 ans (±2 ans)",
    source_check: ["patients"],
    special: "prevention"
  }
};

// ── État global ──────────────────────────────────────────────
let eligibiliteData = [];   // [{patient, eligibilites:[{type,rule,reason,alreadyDone}]}]
let eligibiliteLoaded = false;

// ── Fonction principale ──────────────────────────────────────
async function detecterPatientsEligibles() {
  const container = document.getElementById('eligibilite-container');
  if (!container) return;

  container.innerHTML = renderEligibiliteLoader();

  try {
    // 1. Charger tous les patients actifs
    const { data: patients, error: errP } = await sb
      .from('patients')
      .select('id, name, dob, pathologies')
      .eq('pharmacist_id', currentUser.id)
      .eq('status', 'active');
    if (errP) throw errP;

    // 2. Charger toutes les posologies actives (En cours)
    const { data: posologies, error: errPos } = await sb
      .from('posologies')
      .select('patient_id, medicament, statut, date_debut, date_fin')
      .eq('pharmacist_id', currentUser.id)
      .eq('statut', 'En cours');
    if (errPos) throw errPos;

    // 3. Charger toutes les ordonnances récentes (12 derniers mois)
    const dateLimit = new Date();
    dateLimit.setFullYear(dateLimit.getFullYear() - 1);
    const { data: ordonnances, error: errO } = await sb
      .from('ordonnances')
      .select('patient_id, medicaments, date')
      .eq('pharmacist_id', currentUser.id)
      .gte('date', dateLimit.toISOString().split('T')[0]);
    if (errO) throw errO;

    // 4. Charger les entretiens déjà réalisés (12 derniers mois) pour éviter doublons
    const { data: entretiens, error: errE } = await sb
      .from('entretiens')
      .select('patient_nom, type, date')
      .eq('pharmacist_id', currentUser.id)
      .gte('date', dateLimit.toISOString().split('T')[0]);
    if (errE) throw errE;

    // 5. Grouper posologies et ordonnances par patient
    const posByPatient = {};
    (posologies || []).forEach(p => {
      if (!posByPatient[p.patient_id]) posByPatient[p.patient_id] = [];
      posByPatient[p.patient_id].push(p.medicament?.toLowerCase() || '');
    });

    const ordoByPatient = {};
    (ordonnances || []).forEach(o => {
      if (!ordoByPatient[o.patient_id]) ordoByPatient[o.patient_id] = [];
      ordoByPatient[o.patient_id].push((o.medicaments || '').toLowerCase());
    });

    // Entretiens déjà faits par nom patient
    const entretiensFaits = {};
    (entretiens || []).forEach(e => {
      const key = (e.patient_nom || '').toLowerCase().trim();
      if (!entretiensFaits[key]) entretiensFaits[key] = [];
      entretiensFaits[key].push(e.type);
    });

    // 6. Analyser chaque patient
    eligibiliteData = [];

    for (const patient of (patients || [])) {
      const meds_pos  = posByPatient[patient.id]  || [];
      const meds_ordo = ordoByPatient[patient.id] || [];
      const allMeds   = [...meds_pos, ...meds_ordo].join(' ');

      const age = patient.dob ? calcAge(patient.dob) : null;
      const nbMeds = (posByPatient[patient.id] || []).length;

      const eligibilites = [];
      const patientKey = (patient.name || '').toLowerCase().trim();

      for (const [typeKey, rule] of Object.entries(ELIGIBILITE_RULES)) {
        let matched = false;
        let matchedKeyword = null;

        // Règle spéciale BPM
        if (rule.special === 'bpm') {
          if (age !== null && age >= 65 && nbMeds >= 5) {
            matched = true;
            matchedKeyword = `${age} ans · ${nbMeds} médicaments actifs`;
          }
        }
        // Règle spéciale Bilan prévention (25±2, 45±2, 65±2)
        else if (rule.special === 'prevention') {
          if (age !== null && ([23,24,25,26,27,43,44,45,46,47,63,64,65,66,67].includes(age))) {
            matched = true;
            const tranche = age <= 27 ? '25 ans' : age <= 47 ? '45 ans' : '65 ans';
            matchedKeyword = `Tranche ${tranche} — ${age} ans`;
          }
        }
        // Règle par mots-clés
        else if (rule.keywords.length > 0) {
          for (const kw of rule.keywords) {
            if (allMeds.includes(kw)) {
              matched = true;
              matchedKeyword = kw;
              break;
            }
          }
        }

        if (matched) {
          const alreadyDone = (entretiensFaits[patientKey] || []).includes(typeKey);
          eligibilites.push({
            type: typeKey,
            rule,
            reason: matchedKeyword,
            alreadyDone,
            nbMeds,
            age
          });
        }
      }

      if (eligibilites.length > 0) {
        eligibiliteData.push({ patient, eligibilites });
      }
    }

    eligibiliteLoaded = true;
    renderEligibiliteList(eligibiliteData);

  } catch (err) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Erreur de chargement</div>
        <div class="empty-sub">${err.message}</div>
      </div>`;
  }
}

// ── Rendu liste ──────────────────────────────────────────────
function renderEligibiliteList(data, filterType = null) {
  const container = document.getElementById('eligibilite-container');
  if (!container) return;

  let filtered = data;
  if (filterType === 'todo') {
    filtered = data.map(d => ({ ...d, eligibilites: d.eligibilites.filter(e => !e.alreadyDone) }))
                   .filter(d => d.eligibilites.length > 0);
  } else if (filterType === 'done') {
    filtered = data.map(d => ({ ...d, eligibilites: d.eligibilites.filter(e => e.alreadyDone) }))
                   .filter(d => d.eligibilites.length > 0);
  }

  // Stats
  const totalPatients = data.length;
  const totalEligibles = data.reduce((s, d) => s + d.eligibilites.filter(e => !e.alreadyDone).length, 0);
  const totalFaits = data.reduce((s, d) => s + d.eligibilites.filter(e => e.alreadyDone).length, 0);
  const gainPotentiel = data.reduce((s, d) =>
    s + d.eligibilites.filter(e => !e.alreadyDone).reduce((ss, e) => ss + (e.rule.tarif || 0), 0), 0);

  container.innerHTML = `
    <!-- Stats bar -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--teal)"></div>
        <div class="stat-val" style="font-size:26px">${totalPatients}</div>
        <div class="stat-lbl">Patients concernés</div>
      </div>
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#e03c52"></div>
        <div class="stat-val" style="font-size:26px;color:#e03c52">${totalEligibles}</div>
        <div class="stat-lbl">Entretiens à planifier</div>
      </div>
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#0e9e82"></div>
        <div class="stat-val" style="font-size:26px;color:#0e9e82">${totalFaits}</div>
        <div class="stat-lbl">Déjà réalisés</div>
      </div>
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#7c3aed"></div>
        <div class="stat-val" style="font-size:26px;color:#7c3aed">${gainPotentiel} €</div>
        <div class="stat-lbl">Gain potentiel</div>
      </div>
    </div>

    <!-- Filtres -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn btn-sm ${!filterType ? 'btn-primary' : 'btn-ghost'}"
        onclick="renderEligibiliteList(eligibiliteData, null)">Tous</button>
      <button class="btn btn-sm ${filterType==='todo' ? 'btn-primary' : 'btn-ghost'}"
        onclick="renderEligibiliteList(eligibiliteData, 'todo')">🔴 À planifier (${totalEligibles})</button>
      <button class="btn btn-sm ${filterType==='done' ? 'btn-primary' : 'btn-ghost'}"
        onclick="renderEligibiliteList(eligibiliteData, 'done')">✅ Déjà réalisés (${totalFaits})</button>
      <div style="flex:1"></div>
      <button class="btn btn-sm btn-ghost" onclick="detecterPatientsEligibles()" title="Rafraîchir">
        🔄 Actualiser
      </button>
    </div>

    <!-- Liste patients -->
    ${filtered.length === 0 ? `
      <div class="empty">
        <div class="empty-icon">🎉</div>
        <div class="empty-title">Aucun entretien en attente</div>
        <div class="empty-sub">Tous les entretiens détectés ont été réalisés</div>
      </div>` :
      filtered.map(d => renderEligibiliteCard(d)).join('')
    }

    <!-- Légende -->
    <div style="margin-top:20px;padding:12px 14px;background:var(--bg);border-radius:8px;border:var(--border);font-size:11px;color:var(--text-muted)">
      <strong style="color:var(--text)">Comment ça marche ?</strong>
      Détection automatique basée sur les posologies actives et ordonnances des 12 derniers mois.
      Les mots-clés sont comparés aux noms de médicaments saisis (DCI et spécialités).
      Un entretien est marqué "déjà réalisé" s'il a été enregistré dans les 12 derniers mois pour ce patient.
    </div>`;
}

function renderEligibiliteCard(d) {
  const { patient, eligibilites } = d;
  const age = patient.dob ? calcAge(patient.dob) : null;
  const ageStr = age !== null ? `${age} ans` : '';

  const nonFaits = eligibilites.filter(e => !e.alreadyDone);
  const faits    = eligibilites.filter(e => e.alreadyDone);

  return `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <!-- Identité patient -->
        <div style="display:flex;gap:12px;flex:1;min-width:0">
          <div style="width:42px;height:42px;border-radius:50%;background:var(--teal-pale);display:flex;
            align-items:center;justify-content:center;font-size:16px;font-weight:700;
            color:var(--teal);flex-shrink:0">
            ${(patient.name||'?').charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
              <span style="font-size:14px;font-weight:700;color:var(--text)">${patient.name||'Patient inconnu'}</span>
              ${ageStr ? `<span style="font-size:11px;color:var(--text-muted);background:var(--bg);padding:2px 8px;border-radius:99px;border:var(--border)">${ageStr}</span>` : ''}
              ${nonFaits.length > 0 ? `<span style="font-size:11px;font-weight:700;color:#e03c52;background:rgba(224,60,82,0.1);padding:2px 8px;border-radius:99px">
                ${nonFaits.length} entretien${nonFaits.length>1?'s':''} à planifier
              </span>` : ''}
            </div>

            <!-- Entretiens à planifier -->
            ${nonFaits.length > 0 ? `
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                ${nonFaits.map(e => `
                  <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;
                    border-radius:8px;background:${e.rule.colorPale};border:1px solid ${e.rule.color}33;
                    cursor:pointer" onclick="planifierEntretienDepuisEligibilite('${patient.name}','${e.type}')"
                    title="Cliquer pour planifier">
                    <span style="font-size:14px">${e.rule.icon}</span>
                    <div>
                      <div style="font-size:11px;font-weight:700;color:${e.rule.color}">${e.rule.label}</div>
                      <div style="font-size:10px;color:var(--text-muted)">${e.reason||''} · ${e.rule.tarif}€</div>
                    </div>
                    <span style="font-size:10px;color:${e.rule.color};margin-left:4px;font-weight:700">+ Planifier →</span>
                  </div>`).join('')}
              </div>` : ''}

            <!-- Entretiens déjà faits -->
            ${faits.length > 0 ? `
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                ${faits.map(e => `
                  <span style="font-size:10px;font-weight:600;color:var(--text-muted);
                    background:var(--bg);border:var(--border);padding:2px 8px;border-radius:99px;
                    text-decoration:line-through">
                    ${e.rule.icon} ${e.rule.label}
                  </span>`).join('')}
              </div>` : ''}
          </div>
        </div>

        <!-- Gain potentiel -->
        ${nonFaits.length > 0 ? `
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:16px;font-weight:700;color:#7c3aed">
              ${nonFaits.reduce((s,e)=>s+(e.rule.tarif||0),0)} €
            </div>
            <div style="font-size:10px;color:var(--text-muted)">gain potentiel</div>
          </div>` : ''}
      </div>
    </div>`;
}

// ── Loader ───────────────────────────────────────────────────
function renderEligibiliteLoader() {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px">
      <div style="width:36px;height:36px;border:3px solid rgba(14,158,130,0.15);
        border-top-color:var(--teal);border-radius:50%;animation:spin .7s linear infinite"></div>
      <div style="font-size:13px;color:var(--text-muted)">Analyse des ordonnances et posologies en cours…</div>
    </div>`;
}

// ── Action : pré-remplir le formulaire d'entretien ──────────
function planifierEntretienDepuisEligibilite(patientNom, typeKey) {
  // Ouvrir la modale add-entretien pré-remplie
  openAddEntretien();
  setTimeout(() => {
    const patEl = document.getElementById('ent-patient');
    if (patEl) patEl.value = patientNom;
    selectEntretienType(typeKey);
    // Sélectionner visuellement la carte du bon type
    document.querySelectorAll('.ent-type-card').forEach((c, i) => {
      const key = Object.keys(ENTRETIEN_TYPES)[i];
      if (key === typeKey) {
        const t = ENTRETIEN_TYPES[typeKey];
        c.style.border = `1.5px solid ${t.color}`;
        c.style.background = t.colorPale;
      }
    });
    showToast(`Entretien ${ELIGIBILITE_RULES[typeKey]?.label} pré-rempli pour ${patientNom}`, 'success');
  }, 200);
}

// ── Utilitaire âge ───────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Recherche dans la liste ──────────────────────────────────
function filterEligibilite(q) {
  if (!eligibiliteLoaded) return;
  q = q.toLowerCase();
  if (!q) { renderEligibiliteList(eligibiliteData); return; }
  const filtered = eligibiliteData.filter(d =>
    (d.patient.name||'').toLowerCase().includes(q) ||
    d.eligibilites.some(e => (e.rule.label||'').toLowerCase().includes(q) || (e.reason||'').toLowerCase().includes(q))
  );
  renderEligibiliteList(filtered);
}
