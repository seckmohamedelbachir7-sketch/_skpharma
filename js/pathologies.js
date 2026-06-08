// pathologies.js — Gestion des pathologies (dossier patient + base globale)

let allPathologiesGlobales = [];

// ---- DONNÉES DE RÉFÉRENCE (pré-remplissage) ----
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

  // Charger aussi la base globale pour l'autocomplete
  const { data: globales } = await sb.from('pathologies').select('nom').eq('pharmacist_id', currentUser.id).order('nom');
  const nomsGlobaux = (globales || []).map(p => p.nom);

  const severiteBadge = s => {
    if (s === 'Sévère')    return 'badge-danger';
    if (s === 'Modérée')   return 'badge-warn';
    if (s === 'Chronique') return 'badge-blue';
    return 'badge-ok';
  };

  el.innerHTML = `
    <!-- Zone chips -->
    <div class="patho-chips-zone" id="patho-chips-zone">
      ${data.length === 0
        ? '<span style="font-size:13px;color:var(--text-muted);font-style:italic">Aucune pathologie enregistrée</span>'
        : data.map(p => `
          <span class="patho-chip patho-chip--${(p.severite||'Légère').toLowerCase().replace('é','e').replace('è','e')}" title="${p.severite||''}${p.date_diagnostic ? ' · diagnostiqué le '+formatDate(p.date_diagnostic) : ''}${p.traitements ? ' · '+p.traitements : ''}">
            ${p.nom}
            <button class="patho-chip-remove" onclick="deletePathoPatient('${p.id}')" title="Supprimer">×</button>
          </span>
        `).join('')
      }
    </div>

    <!-- Barre d'ajout avec autocomplete -->
    <div class="patho-add-bar" style="margin-top:14px">
      <div style="position:relative;flex:1">
        <input
          class="form-input"
          id="patho-quick-input"
          placeholder="Ajouter une pathologie… (tapez pour chercher dans votre base)"
          autocomplete="off"
          oninput="showPathoSuggestions(this.value)"
          onkeydown="pathoInputKeydown(event)"
          style="width:100%;padding-right:36px"
        />
        <div id="patho-suggestions" class="patho-suggestions" style="display:none"></div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="openModal('add-patho-patient')" title="Formulaire complet" style="flex-shrink:0">
        + Détails
      </button>
    </div>

    <!-- Liste détaillée (dépliable) -->
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

    <datalist id="patho-datalist">
      ${nomsGlobaux.map(n => `<option value="${n}"/>`).join('')}
    </datalist>
  `;

  // Stocker les noms disponibles pour l'autocomplete
  window._pathoNomsSuggestions = nomsGlobaux;
}

// ---- AUTOCOMPLETE SUGGESTIONS ----
function showPathoSuggestions(val) {
  const box = document.getElementById('patho-suggestions');
  if (!box) return;
  const suggestions = (window._pathoNomsSuggestions || []).filter(n =>
    n.toLowerCase().includes(val.toLowerCase()) && val.trim().length > 0
  );
  if (!suggestions.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = suggestions.map((n, i) => `
    <div class="patho-suggestion-item" tabindex="0"
      onmousedown="selectPathoSuggestion('${n.replace(/'/g,"\\'")}')">
      ${n}
    </div>
  `).join('');
}

function selectPathoSuggestion(nom) {
  const input = document.getElementById('patho-quick-input');
  if (input) input.value = nom;
  const box = document.getElementById('patho-suggestions');
  if (box) box.style.display = 'none';
  quickAddPatho();
}

function pathoInputKeydown(e) {
  if (e.key === 'Enter') { quickAddPatho(); }
  if (e.key === 'Escape') {
    const box = document.getElementById('patho-suggestions');
    if (box) box.style.display = 'none';
  }
}

// Fermer suggestions si clic ailleurs
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

  const { error } = await sb.from('patient_pathologies').insert({
    patient_id: currentPatient.id,
    pharmacist_id: currentUser.id,
    nom,
    severite: 'Chronique',
  });
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
    patient_id: currentPatient.id,
    pharmacist_id: currentUser.id,
    nom,
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

// ---- BASE GLOBALE PATHOLOGIES ----
async function loadPathologiesGlobales() {
  const el = document.getElementById('patho-global-list');
  if (!el) return;
  const { data, error } = await sb.from('pathologies').select('*').eq('pharmacist_id', currentUser.id).order('nom');
  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  allPathologiesGlobales = data || [];

  // Pré-remplissage automatique si la base est vide
  if (allPathologiesGlobales.length === 0) {
    await seedPathologiesReference();
    return; // seedPathologiesReference rappelle loadPathologiesGlobales
  }

  renderPathologiesGlobales(allPathologiesGlobales);
}

// Pré-remplit la base avec les pathologies de référence
async function seedPathologiesReference() {
  const el = document.getElementById('patho-global-list');
  if (el) el.innerHTML = '<div class="loading">Initialisation du référentiel de pathologies…</div>';

  const rows = PATHOLOGIES_REFERENCE.map(p => ({
    pharmacist_id: currentUser.id,
    nom: p.nom,
    categorie: p.categorie,
    description: p.description || null,
    traitements_reference: p.traitements_reference || null,
    vigilance: p.vigilance || null,
  }));

  const { error } = await sb.from('pathologies').insert(rows);
  if (error) {
    showToast('Erreur lors de l\'initialisation : ' + error.message, 'error');
    if (el) el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur d\'initialisation</div></div>';
    return;
  }
  showToast(`${rows.length} pathologies de référence ajoutées à votre base`, 'success');
  loadPathologiesGlobales();
}

function renderPathologiesGlobales(list) {
  const el = document.getElementById('patho-global-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📚</div><div class="empty-title">Aucune pathologie dans votre base</div><div class="empty-sub">Construisez votre référentiel personnalisé</div></div>`;
    return;
  }
  const catColors = { Cardiovasculaire:'badge-danger', Métabolique:'badge-warn', Respiratoire:'badge-blue', Neurologique:'badge-blue', Infectieuse:'badge-ok', Rhumatologique:'badge-warn', Autre:'badge-ok' };
  el.innerHTML = list.map(p => `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600;margin-bottom:4px">${p.nom}</div>
          <span class="badge ${catColors[p.categorie]||'badge-ok'}" style="margin-bottom:8px">${p.categorie||'Autre'}</span>
          ${p.description ? `<div style="font-size:12px;color:var(--text-muted);margin-top:6px">${p.description}</div>` : ''}
          ${p.traitements_reference ? `<div style="font-size:12px;margin-top:8px"><strong>Traitements ref. :</strong> ${p.traitements_reference}</div>` : ''}
          ${p.vigilance ? `<div style="font-size:12px;margin-top:6px;padding:8px;background:var(--amber-pale);border-radius:6px;color:var(--amber)">⚠ ${p.vigilance}</div>` : ''}
        </div>
        <button class="btn btn-danger btn-sm" onclick="deletePathologieGlobale('${p.id}')">✕</button>
      </div>
    </div>
  `).join('');
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
    pharmacist_id: currentUser.id,
    nom,
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
