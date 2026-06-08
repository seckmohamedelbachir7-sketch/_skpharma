// pathologies.js — Gestion des pathologies (dossier patient + base globale)
// v2 — Design repensé + Modal IA au clic

let allPathologiesGlobales = [];

// ---- ICÔNES PAR CATÉGORIE ----
const PATHO_ICONS = {
  Cardiovasculaire: '🫀',
  Métabolique: '🧬',
  Respiratoire: '🫁',
  Neurologique: '🧠',
  Infectieuse: '🦠',
  Rhumatologique: '🦴',
  Autre: '🩺',
};

const PATHO_COLORS = {
  Cardiovasculaire: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)',  text: '#dc2626', accent: '#ef4444' },
  Métabolique:      { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', text: '#b45309', accent: '#f59e0b' },
  Respiratoire:     { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.22)', text: '#1d4ed8', accent: '#3b82f6' },
  Neurologique:     { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)', text: '#6d28d9', accent: '#8b5cf6' },
  Infectieuse:      { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)', text: '#065f46', accent: '#10b981' },
  Rhumatologique:   { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.22)', text: '#be185d', accent: '#ec4899' },
  Autre:            { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)', text: '#475569', accent: '#64748b' },
};

// ---- DONNÉES DE RÉFÉRENCE ----
const PATHOLOGIES_REFERENCE = [
  { nom: 'Hypertension artérielle', categorie: 'Cardiovasculaire', description: 'Pression artérielle systolique ≥ 140 mmHg et/ou diastolique ≥ 90 mmHg de façon chronique.', traitements_reference: 'IEC, ARA2, inhibiteurs calciques, diurétiques thiazidiques, bêta-bloquants', vigilance: 'Surveiller la kaliémie sous IEC/ARA2/diurétiques. Contrôler la PA à chaque délivrance.' },
  { nom: 'Diabète de type 2', categorie: 'Métabolique', description: 'Hyperglycémie chronique par insulinorésistance et déficit progressif en insuline.', traitements_reference: 'Metformine, inhibiteurs DPP-4, agonistes GLP-1, iSGLT2, insulines', vigilance: 'Risque hypoglycémie sous sulfamides/insuline. Adapter les doses si IRC. Automesure glycémique.' },
  { nom: 'Diabète de type 1', categorie: 'Métabolique', description: 'Destruction auto-immune des cellules bêta pancréatiques entraînant un déficit absolu en insuline.', traitements_reference: 'Insulinothérapie basale-bolus, pompe à insuline', vigilance: 'Risque hypoglycémie sévère. Vérifier technique injection, sites de rotation, conservation insuline.' },
  { nom: 'Asthme', categorie: 'Respiratoire', description: 'Inflammation chronique des voies aériennes avec hyperréactivité bronchique et obstruction variable.', traitements_reference: 'Bronchodilatateurs SABA (Ventoline), CSI, LABA, antagonistes leucotriènes, biothérapies', vigilance: 'Vérifier technique inhalatoire à chaque délivrance. CI aux AINS et bêta-bloquants dans asthme sévère.' },
  { nom: 'BPCO', categorie: 'Respiratoire', description: 'Obstruction bronchique chronique non complètement réversible, liée principalement au tabac.', traitements_reference: 'LABA, LAMA, CSI, mucolytiques, oxygénothérapie', vigilance: 'Technique inhalatoire. Vaccinations grippe/pneumocoque. Surveillance exacerbations.' },
  { nom: 'Insuffisance cardiaque', categorie: 'Cardiovasculaire', description: 'Incapacité du cœur à assurer un débit sanguin suffisant aux besoins de l\'organisme.', traitements_reference: 'IEC/ARA2/ARNI, bêta-bloquants, diurétiques de l\'anse, iSGLT2, antialdostérones', vigilance: 'Surveiller poids quotidien, œdèmes, dyspnée. Contrôler kaliémie et créatinine. Éviter AINS.' },
  { nom: 'Fibrillation atriale', categorie: 'Cardiovasculaire', description: 'Trouble du rythme cardiaque supraventriculaire le plus fréquent, avec risque thromboembolique.', traitements_reference: 'AOD (rivaroxaban, apixaban, dabigatran), AVK, antiarythmiques, contrôle de fréquence', vigilance: 'Vérifier score CHA₂DS₂-VASc. INR si AVK. Adhérence AOD cruciale. Risque hémorragique.' },
  { nom: 'Coronaropathie / Angor', categorie: 'Cardiovasculaire', description: 'Réduction du flux coronarien par athérosclérose entraînant une ischémie myocardique.', traitements_reference: 'Aspirine, statines, bêta-bloquants, dérivés nitrés, inhibiteurs calciques, IEC', vigilance: 'Double antiagrégation post-SCA. Pas d\'arrêt brusque des bêta-bloquants. Statines au long cours.' },
  { nom: 'Dyslipidémie', categorie: 'Métabolique', description: 'Anomalie du bilan lipidique (LDL élevé, HDL bas, hypertriglycéridémie).', traitements_reference: 'Statines, ézétimibe, inhibiteurs PCSK9, fibrates', vigilance: 'Surveiller CPK si myalgies sous statines. Contrôle hépatique initial. Interactions médicamenteuses (CYP3A4).' },
  { nom: 'Hypothyroïdie', categorie: 'Métabolique', description: 'Déficit en hormones thyroïdiennes, le plus souvent d\'origine auto-immune (Hashimoto).', traitements_reference: 'Lévothyroxine (L-Thyroxine)', vigilance: 'Prise à jeun 30 min avant le repas. Interactions avec sels de fer, calcium, IPP. Contrôle TSH régulier.' },
  { nom: 'Hyperthyroïdie', categorie: 'Métabolique', description: 'Excès de production d\'hormones thyroïdiennes (Basedow, nodule toxique).', traitements_reference: 'Antithyroïdiens de synthèse (carbimazole, propylthiouracile), bêta-bloquants, iode radioactif', vigilance: 'Risque d\'agranulocytose sous ATS : consulter si fièvre/angine. Surveillance NFS.' },
  { nom: 'Insuffisance rénale chronique', categorie: 'Autre', description: 'Réduction progressive et irréversible du DFG en dessous de 60 mL/min/1,73 m².', traitements_reference: 'Traitement de la cause, IEC/ARA2, EPO, chélateurs du phosphore, dialyse', vigilance: 'Adapter les posologies selon DFG (nombreux médicaments). Éviter AINS et produits néphrotoxiques. Surveiller kaliémie.' },
  { nom: 'Épilepsie', categorie: 'Neurologique', description: 'Prédisposition cérébrale à générer des crises épileptiques récurrentes non provoquées.', traitements_reference: 'Valproate, lévétiracétam, lamotrigine, carbamazépine, phénytoïne', vigilance: 'Nombreuses interactions médicamenteuses (inducteurs enzymatiques). Contraception. Ne jamais arrêter brutalement.' },
  { nom: 'Maladie de Parkinson', categorie: 'Neurologique', description: 'Dégénérescence progressive des neurones dopaminergiques de la substance noire.', traitements_reference: 'Lévodopa/carbidopa, agonistes dopaminergiques, IMAO-B, ICOMT', vigilance: 'CI aux neuroleptiques. Fenêtres thérapeutiques strictes. Hypotension orthostatique. Dyskinésies.' },
  { nom: 'Alzheimer / Démence', categorie: 'Neurologique', description: 'Dégénérescence cognitive progressive affectant mémoire, langage et autonomie.', traitements_reference: 'Inhibiteurs cholinestérases (donépézil, rivastigmine), mémantine', vigilance: 'Observance difficile (aidant). Anticholinergiques à éviter. Surveiller troubles comportementaux.' },
  { nom: 'Dépression', categorie: 'Neurologique', description: 'Trouble de l\'humeur caractérisé par tristesse persistante, anhédonie et altération du fonctionnement.', traitements_reference: 'ISRS, IRSN, mirtazapine, tricycliques, IMAO', vigilance: 'Risque suicidaire en début de traitement. Syndrome sérotoninergique. Sevrage progressif obligatoire.' },
  { nom: 'Schizophrénie', categorie: 'Neurologique', description: 'Trouble psychotique chronique avec hallucinations, délires et désorganisation cognitive.', traitements_reference: 'Antipsychotiques typiques et atypiques (rispéridone, olanzapine, clozapine)', vigilance: 'Syndrome métabolique. Allongement QT. Clozapine : NFS hebdomadaire. Observance.' },
  { nom: 'Polyarthrite rhumatoïde', categorie: 'Rhumatologique', description: 'Rhumatisme inflammatoire chronique auto-immun touchant synoviales des articulations.', traitements_reference: 'Méthotrexate, léflunomide, biothérapies (anti-TNF, anti-IL-6), corticoïdes', vigilance: 'Immunosuppression : risque infectieux. Bilan pré-thérapeutique. Surveillance hépatique sous MTX.' },
  { nom: 'Spondylarthrite ankylosante', categorie: 'Rhumatologique', description: 'Rhumatisme inflammatoire chronique du squelette axial, lié au gène HLA-B27.', traitements_reference: 'AINS, corticoïdes, anti-TNF, inhibiteurs IL-17 (sécukinumab)', vigilance: 'Uvéite associée. Bilan pré-biothérapie (TB, hépatites). Vaccination à mettre à jour.' },
  { nom: 'Ostéoporose', categorie: 'Rhumatologique', description: 'Fragilisation du tissu osseux avec risque accru de fractures (vertèbres, hanche, poignet).', traitements_reference: 'Bisphosphonates, dénosumab, tériparatide, romosozumab, calcium + vitamine D', vigilance: 'Bisphosphonates : prise à jeun, rester debout 30 min. Ostéonécrose mâchoire (soins dentaires). Calcium+VitD systématique.' },
  { nom: 'Maladie de Crohn', categorie: 'Autre', description: 'Maladie inflammatoire chronique de l\'intestin pouvant toucher tout le tube digestif.', traitements_reference: 'Mésalazine, corticoïdes, immunosuppresseurs (azathioprine), biothérapies (anti-TNF)', vigilance: 'Risque infectieux sous immunosuppresseurs. Carences nutritionnelles à supplémenter. Vaccinations.' },
  { nom: 'Rectocolite hémorragique', categorie: 'Autre', description: 'Maladie inflammatoire chronique limitée au côlon et au rectum.', traitements_reference: 'Mésalazine, corticoïdes, immunosuppresseurs, biothérapies', vigilance: 'Surveillance coloscopique (risque cancer colorectal). Supplémentation folates sous mésalazine.' },
  { nom: 'Reflux gastro-œsophagien', categorie: 'Autre', description: 'Remontée du contenu gastrique acide dans l\'œsophage causant brûlures et régurgitations.', traitements_reference: 'IPP (oméprazole, ésoméprazole), anti-H2, alginates', vigilance: 'Interactions IPP (clopidogrel, méthotrexate). Réévaluer l\'indication régulièrement. Règles hygiéno-diététiques.' },
  { nom: 'Ulcère gastroduodénal', categorie: 'Autre', description: 'Perte de substance de la muqueuse gastrique ou duodénale, souvent liée à H. pylori ou AINS.', traitements_reference: 'IPP, triple thérapie anti-H. pylori (amoxicilline + clarithromycine + IPP)', vigilance: 'Éviter AINS/aspirine sans protection gastrique. Vérifier éradication H. pylori. Alcool à limiter.' },
  { nom: 'Insuffisance veineuse chronique', categorie: 'Cardiovasculaire', description: 'Défaillance du retour veineux des membres inférieurs avec varices, œdèmes, troubles trophiques.', traitements_reference: 'Veinotoniques, compression élastique, anticoagulants si TVP', vigilance: 'Compression à enfiler le matin avant lever. Surveiller plaies chez le diabétique.' },
  { nom: 'Anémie ferriprive', categorie: 'Autre', description: 'Anémie par carence en fer due à des pertes excessives ou un apport insuffisant.', traitements_reference: 'Sels ferreux (sulfate, gluconate, fumarate), fer IV si intolérance orale', vigilance: 'Prise à jeun ou avec vitamine C pour absorption. Selles noires normales. Interactions avec IPP, levothyroxine.' },
  { nom: 'Psoriasis', categorie: 'Autre', description: 'Dermatose inflammatoire chronique caractérisée par des plaques érythémato-squameuses.', traitements_reference: 'Dermocorticoïdes, analogues vitamine D, rétinoïdes, méthotrexate, biothérapies (anti-IL-17, anti-IL-23)', vigilance: 'Méthotrexate : surveillance hépatique et NFS. Biothérapies : bilan infectieux pré-thérapeutique.' },
  { nom: 'Migraine', categorie: 'Neurologique', description: 'Céphalée récurrente, unilatérale, pulsatile, avec nausées, photophobie et phonophobie.', traitements_reference: 'Triptans (sumatriptan), AINS, antiémétiques, bêta-bloquants (prophylaxie), anti-CGRP', vigilance: 'Triptans CI si antécédents vasculaires. Risque de céphalée par abus d\'antalgiques (>10 j/mois).' },
  { nom: 'Goutte', categorie: 'Rhumatologique', description: 'Arthropathie microcristalline liée au dépôt de cristaux d\'urate monosodique dans les articulations.', traitements_reference: 'Colchicine, AINS (crise), allopurinol, fébuxostat (traitement de fond)', vigilance: 'Colchicine : adapter à la fonction rénale. Interactions allopurinol + azathioprine (risque toxicité majeure).' },
  { nom: 'Anxiété généralisée', categorie: 'Neurologique', description: 'Trouble anxieux caractérisé par une inquiétude excessive et persistante sur de multiples sujets.', traitements_reference: 'ISRS, IRSN, buspirone, hydroxyzine, prégabaline, TCC', vigilance: 'Benzodiazépines : usage limité (dépendance). Sevrage progressif. Interactions SNC (alcool, opioïdes).' },
];

// ---- PATHOLOGIES DU DOSSIER PATIENT ----
async function loadPathoPatient(patientId) {
  const el = document.getElementById('det-patho-list');
  if (!el) return;

  const { data, error } = await sb.from('patient_pathologies').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }

  const { data: globales } = await sb.from('pathologies').select('nom').eq('pharmacist_id', currentUser.id).order('nom');
  const nomsGlobaux = (globales || []).map(p => p.nom);
  window._pathoNomsSuggestions = nomsGlobaux;

  const severiteBadge = s => {
    if (s === 'Sévère')    return 'badge-danger';
    if (s === 'Modérée')   return 'badge-warn';
    if (s === 'Chronique') return 'badge-blue';
    return 'badge-ok';
  };

  const chipClass = s => {
    if (!s) return 'patho-chip--chronique';
    return 'patho-chip--' + s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  };

  el.innerHTML = `
    <div class="patho-chips-zone" id="patho-chips-zone">
      ${data.length === 0
        ? '<span style="font-size:13px;color:var(--text-muted);font-style:italic">Aucune pathologie enregistrée</span>'
        : data.map(p => `
          <span class="patho-chip ${chipClass(p.severite)}"
            title="${p.severite||''}${p.date_diagnostic ? ' · diagnostiqué le '+formatDate(p.date_diagnostic) : ''}${p.traitements ? ' · '+p.traitements : ''}">
            ${p.nom}
            <button class="patho-chip-remove" onclick="event.stopPropagation();deletePathoPatient('${p.id}')" title="Supprimer">×</button>
          </span>
        `).join('')
      }
    </div>
    <div class="patho-add-bar" style="margin-top:14px">
      <div style="position:relative;flex:1">
        <input class="form-input" id="patho-quick-input"
          placeholder="Ajouter une pathologie… (tapez pour chercher)"
          autocomplete="off"
          oninput="showPathoSuggestions(this.value)"
          onkeydown="pathoInputKeydown(event)"
          style="width:100%"/>
        <div id="patho-suggestions" class="patho-suggestions" style="display:none"></div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="openModal('add-patho-patient')" style="flex-shrink:0">+ Détails</button>
    </div>
    ${data.length > 0 ? `
    <details style="margin-top:16px">
      <summary style="font-size:12px;color:var(--text-muted);cursor:pointer;user-select:none;list-style:none;display:flex;align-items:center;gap:6px">
        <span>▸</span> Voir les détails (${data.length} pathologie${data.length > 1 ? 's' : ''})
      </summary>
      <div style="margin-top:10px">
        ${data.map(p => `
          <div class="ordo-item" style="margin-bottom:8px">
            <div class="ordo-top">
              <div class="ordo-date" style="font-size:14px">${p.nom}</div>
              <div style="display:flex;gap:6px;align-items:center">
                <span class="badge ${severiteBadge(p.severite)}">${p.severite||'—'}</span>
                <button class="btn btn-danger btn-sm" onclick="deletePathoPatient('${p.id}')">✕</button>
              </div>
            </div>
            ${p.date_diagnostic ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Diagnostiqué le ${formatDate(p.date_diagnostic)}</div>` : ''}
            ${p.traitements ? `<div style="font-size:12px;margin-top:6px"><strong>Traitements :</strong> ${p.traitements}</div>` : ''}
            ${p.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">${p.notes}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </details>` : ''}
    <datalist id="patho-datalist">${nomsGlobaux.map(n => `<option value="${n}"/>`).join('')}</datalist>
  `;
}

// ---- AUTOCOMPLETE ----
function showPathoSuggestions(val) {
  const box = document.getElementById('patho-suggestions');
  if (!box) return;
  const list = (window._pathoNomsSuggestions || []).filter(n => n.toLowerCase().includes(val.toLowerCase()) && val.trim().length > 0);
  if (!list.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = list.map(n => `<div class="patho-suggestion-item" onmousedown="selectPathoSuggestion('${n.replace(/'/g,"\\'")}')"> ${n}</div>`).join('');
}

function selectPathoSuggestion(nom) {
  const input = document.getElementById('patho-quick-input');
  if (input) input.value = nom;
  const box = document.getElementById('patho-suggestions');
  if (box) box.style.display = 'none';
  quickAddPatho();
}

function pathoInputKeydown(e) {
  if (e.key === 'Enter') quickAddPatho();
  if (e.key === 'Escape') { const box = document.getElementById('patho-suggestions'); if (box) box.style.display = 'none'; }
}

document.addEventListener('click', e => {
  if (!e.target.closest('#patho-quick-input') && !e.target.closest('#patho-suggestions')) {
    const box = document.getElementById('patho-suggestions');
    if (box) box.style.display = 'none';
  }
});

async function quickAddPatho() {
  if (!currentPatient) return;
  const input = document.getElementById('patho-quick-input');
  if (!input) return;
  const nom = input.value.trim();
  if (!nom) return;
  const box = document.getElementById('patho-suggestions');
  if (box) box.style.display = 'none';
  const { error } = await sb.from('patient_pathologies').insert({ patient_id: currentPatient.id, pharmacist_id: currentUser.id, nom, severite: 'Chronique' });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  input.value = '';
  showToast('Pathologie ajoutée', 'success');
  loadPathoPatient(currentPatient.id);
}

async function savePathoPatient() {
  if (!currentPatient) return;
  const nom = document.getElementById('pp-nom').value.trim();
  if (!nom) return showToast('Le nom de la pathologie est obligatoire', 'error');
  const { error } = await sb.from('patient_pathologies').insert({
    patient_id: currentPatient.id, pharmacist_id: currentUser.id, nom,
    date_diagnostic: document.getElementById('pp-date').value || null,
    severite: document.getElementById('pp-severite').value,
    traitements: document.getElementById('pp-traitements').value || null,
    notes: document.getElementById('pp-notes').value || null
  });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-patho-patient');
  clearForm(['pp-nom','pp-date','pp-traitements','pp-notes']);
  showToast('Pathologie enregistrée', 'success');
  loadPathoPatient(currentPatient.id);
}

async function deletePathoPatient(id) {
  if (!confirm('Supprimer cette pathologie ?')) return;
  await sb.from('patient_pathologies').delete().eq('id', id);
  showToast('Pathologie supprimée', 'success');
  loadPathoPatient(currentPatient.id);
}

// ---- BASE GLOBALE ----
async function loadPathologiesGlobales() {
  const el = document.getElementById('patho-global-list');
  if (!el) return;
  const { data, error } = await sb.from('pathologies').select('*').eq('pharmacist_id', currentUser.id).order('nom');
  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  allPathologiesGlobales = data || [];
  if (allPathologiesGlobales.length === 0) { await seedPathologiesReference(); return; }
  renderPathologiesGlobales(allPathologiesGlobales);
}

async function seedPathologiesReference() {
  const el = document.getElementById('patho-global-list');
  if (el) el.innerHTML = '<div class="loading">Initialisation du référentiel…</div>';
  const rows = PATHOLOGIES_REFERENCE.map(p => ({ pharmacist_id: currentUser.id, nom: p.nom, categorie: p.categorie, description: p.description||null, traitements_reference: p.traitements_reference||null, vigilance: p.vigilance||null }));
  const { error } = await sb.from('pathologies').insert(rows);
  if (error) { showToast('Erreur initialisation : ' + error.message, 'error'); return; }
  showToast(`${rows.length} pathologies de référence ajoutées`, 'success');
  loadPathologiesGlobales();
}

function renderPathologiesGlobales(list) {
  const el = document.getElementById('patho-global-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📚</div><div class="empty-title">Aucune pathologie dans votre base</div><div class="empty-sub">Construisez votre référentiel personnalisé</div></div>`;
    return;
  }

  // Grouper par catégorie
  const groups = {};
  list.forEach(p => {
    const cat = p.categorie || 'Autre';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });

  el.innerHTML = Object.entries(groups).map(([cat, items]) => {
    const col = PATHO_COLORS[cat] || PATHO_COLORS['Autre'];
    const icon = PATHO_ICONS[cat] || '🩺';
    return `
      <div class="patho-group" style="margin-bottom:28px">
        <div class="patho-group-header">
          <span class="patho-group-icon" style="background:${col.bg};color:${col.accent};border-color:${col.border}">${icon}</span>
          <span class="patho-group-title" style="color:${col.text}">${cat}</span>
          <span class="patho-group-count">${items.length}</span>
        </div>
        <div class="patho-grid">
          ${items.map(p => `
            <div class="patho-card" onclick="openPathoModal('${p.id}')" style="--patho-bg:${col.bg};--patho-border:${col.border};--patho-accent:${col.accent};--patho-text:${col.text}">
              <div class="patho-card-top">
                <div class="patho-card-nom">${p.nom}</div>
                <button class="patho-card-del" onclick="event.stopPropagation();deletePathologieGlobale('${p.id}')" title="Supprimer">×</button>
              </div>
              ${p.description ? `<div class="patho-card-desc">${p.description}</div>` : ''}
              <div class="patho-card-footer">
                ${p.traitements_reference ? `<span class="patho-card-tag">💊 Traitements</span>` : ''}
                ${p.vigilance ? `<span class="patho-card-tag patho-card-tag--warn">⚠ Vigilance</span>` : ''}
                <span class="patho-card-cta">Voir conseils IA →</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function filterPathologies(q) {
  q = q.toLowerCase();
  renderPathologiesGlobales(q ? allPathologiesGlobales.filter(p =>
    (p.nom||'').toLowerCase().includes(q) || (p.categorie||'').toLowerCase().includes(q)
  ) : allPathologiesGlobales);
}

async function savePathologieGlobale() {
  const nom = document.getElementById('glob-nom').value.trim();
  if (!nom) return showToast('Le nom est obligatoire', 'error');
  const { error } = await sb.from('pathologies').insert({
    pharmacist_id: currentUser.id, nom,
    categorie: document.getElementById('glob-categorie').value,
    description: document.getElementById('glob-desc').value || null,
    traitements_reference: document.getElementById('glob-traitements').value || null,
    vigilance: document.getElementById('glob-vigilance').value || null
  });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-pathologie');
  clearForm(['glob-nom','glob-desc','glob-traitements','glob-vigilance']);
  showToast('Pathologie ajoutée à votre base', 'success');
  loadPathologiesGlobales();
}

async function deletePathologieGlobale(id) {
  if (!confirm('Supprimer cette pathologie ?')) return;
  await sb.from('pathologies').delete().eq('id', id);
  showToast('Pathologie supprimée', 'success');
  loadPathologiesGlobales();
}

// ---- MODAL IA — CONSEILS PATHOLOGIE ----
function openPathoModal(id) {
  const p = allPathologiesGlobales.find(x => x.id === id);
  if (!p) return;

  const col = PATHO_COLORS[p.categorie] || PATHO_COLORS['Autre'];
  const icon = PATHO_ICONS[p.categorie] || '🩺';

  // Injecter le modal dans le DOM s'il n'existe pas encore
  let modal = document.getElementById('modal-patho-conseil');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-patho-conseil';
    modal.innerHTML = `
      <div class="modal patho-conseil-modal" style="max-width:680px">
        <div class="modal-header patho-conseil-header" id="pc-header">
          <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:0">
            <div class="pc-icon" id="pc-icon"></div>
            <div style="min-width:0">
              <div class="modal-title pc-nom" id="pc-nom"></div>
              <div class="pc-cat" id="pc-cat"></div>
            </div>
          </div>
          <button class="modal-close" onclick="closeModal('patho-conseil')">×</button>
        </div>
        <div class="modal-body" style="padding:0">

          <!-- Infos fixes -->
          <div class="pc-infos" id="pc-infos"></div>

          <!-- Zone IA -->
          <div class="pc-ai-zone">
            <div class="pc-ai-header">
              <div class="ai-dot"></div>
              <span>Conseils IA — Vue pharmacien</span>
              <button class="pc-ai-refresh" id="pc-ai-refresh-btn" onclick="loadPathoConseils()" title="Régénérer">↻</button>
            </div>
            <div class="pc-ai-body" id="pc-ai-body">
              <div class="pc-ai-placeholder">Cliquez sur <strong>Générer les conseils</strong> pour obtenir une analyse clinique complète.</div>
            </div>
            <div style="padding:12px 16px;border-top:var(--border)">
              <button class="btn btn-primary btn-sm" id="pc-generate-btn" onclick="loadPathoConseils()" style="width:100%">
                ✨ Générer les conseils IA
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Remplir les infos
  document.getElementById('pc-icon').textContent = icon;
  document.getElementById('pc-icon').style.cssText = `background:${col.bg};color:${col.accent};border-color:${col.border}`;
  document.getElementById('pc-nom').textContent = p.nom;
  document.getElementById('pc-cat').textContent = p.categorie || 'Autre';
  document.getElementById('pc-cat').style.color = col.text;
  document.getElementById('pc-header').style.borderBottom = `2px solid ${col.border}`;

  document.getElementById('pc-infos').innerHTML = `
    ${p.description ? `<div class="pc-info-block"><div class="pc-info-label">📋 Description</div><div class="pc-info-val">${p.description}</div></div>` : ''}
    ${p.traitements_reference ? `<div class="pc-info-block"><div class="pc-info-label">💊 Traitements de référence</div><div class="pc-info-val">${p.traitements_reference}</div></div>` : ''}
    ${p.vigilance ? `<div class="pc-info-block pc-info-block--warn"><div class="pc-info-label">⚠ Points de vigilance</div><div class="pc-info-val">${p.vigilance}</div></div>` : ''}
  `;

  // Réinitialiser la zone IA
  document.getElementById('pc-ai-body').innerHTML = `<div class="pc-ai-placeholder">Cliquez sur <strong>Générer les conseils</strong> pour obtenir une analyse clinique complète.</div>`;
  document.getElementById('pc-generate-btn').style.display = '';
  document.getElementById('pc-ai-refresh-btn').style.display = 'none';

  // Stocker la pathologie courante pour la génération
  window._currentPathoConseil = p;

  openModal('patho-conseil');
}

async function loadPathoConseils() {
  const p = window._currentPathoConseil;
  if (!p) return;

  const body = document.getElementById('pc-ai-body');
  const genBtn = document.getElementById('pc-generate-btn');
  const refreshBtn = document.getElementById('pc-ai-refresh-btn');

  body.innerHTML = `<div class="pc-ai-loading"><div class="pc-ai-spinner"></div><span>Analyse en cours…</span></div>`;
  genBtn.style.display = 'none';
  refreshBtn.style.display = 'none';

  const prompt = `Tu es un assistant clinique pour pharmacien d'officine. Pour la pathologie "${p.nom}" (catégorie : ${p.categorie||'Non précisée'}), donne une fiche de conseils pratiques structurée en 4 sections :

1. **Risques principaux** — Les 3-5 risques cliniques les plus importants à surveiller pour cette pathologie
2. **Conseils au comptoir** — Ce que le pharmacien doit vérifier / dire au patient à chaque délivrance (3-5 points)  
3. **Interactions médicamenteuses clés** — Les 3-4 interactions les plus importantes à connaître
4. **Éducation thérapeutique** — 3-4 messages essentiels à transmettre au patient

Sois précis, concis et directement utilisable au comptoir. Utilise des bullet points courts. Ne répète pas les informations déjà connues (traitements : ${p.traitements_reference||'non précisé'}).`;

  try {
    const response = await fetch(window.AI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || data.text || data.result || '';
    if (!text) throw new Error('Réponse vide');

    // Formatter le markdown en HTML propre
    const html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^#{1,3} (.+)$/gm, '<div class="pc-section-title">$1</div>')
      .replace(/^\d+\. \*\*(.+?)\*\*/gm, '<div class="pc-section-title">$1</div>')
      .replace(/^\d+\. (.+)$/gm, '<div class="pc-section-title">$1</div>')
      .replace(/^[•\-\*] (.+)$/gm, '<div class="pc-bullet">$1</div>')
      .replace(/\n{2,}/g, '<div class="pc-spacer"></div>');

    body.innerHTML = `<div class="pc-ai-content">${html}</div>`;
    refreshBtn.style.display = '';
  } catch (e) {
    body.innerHTML = `<div class="pc-ai-error">❌ Erreur lors de la génération : ${e.message}</div>`;
    genBtn.style.display = '';
  }
}
