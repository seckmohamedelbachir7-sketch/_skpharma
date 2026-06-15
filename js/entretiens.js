// ============================================================
// entretiens.js — Entretiens pharmaceutiques SKPharma
// Version complète : trames, scores, workflow, IA, facturation
// ============================================================

let allEntretiens = [];
let currentEntretienId = null;

// ── Types d'entretiens avec trames structurées ──────────────
const ENTRETIEN_TYPES = {
  "AVK": {
    label: "Anticoagulants AVK",
    icon: "🩸",
    color: "#e03c52",
    colorPale: "rgba(224,60,82,0.1)",
    tarif: 40,
    code_acte: "EP-AVK",
    description: "Suivi des patients sous anticoagulants oraux (warfarine, acénocoumarol)",
    trame: [
      { id: "inr_dernier", label: "Dernier INR", type: "number", unit: "INR", placeholder: "ex: 2.4", important: true },
      { id: "inr_date", label: "Date du dernier INR", type: "date" },
      { id: "inr_cible", label: "Zone cible INR", type: "select", options: ["2.0-3.0","2.5-3.5","3.0-4.5"] },
      { id: "oublis", label: "Oubli de prise (7 derniers jours)", type: "select", options: ["Aucun","1 oubli","2 oublis","3 oublis ou plus"] },
      { id: "saignements", label: "Saignements/hématomes observés", type: "select", options: ["Non","Saignements mineurs","Saignements importants","Hématomes récurrents"] },
      { id: "alimentation", label: "Changement alimentaire récent (vit. K)", type: "select", options: ["Non","Oui – légumes verts","Oui – autre"] },
      { id: "medicaments", label: "Nouveau médicament / automédication", type: "select", options: ["Non","Oui (préciser dans notes)"] },
      { id: "alcool", label: "Consommation d'alcool", type: "select", options: ["Nulle","Modérée (<2 verres/j)","Importante"] },
      { id: "carnet_suivi", label: "Carnet de suivi à jour", type: "select", options: ["Oui","Non","Perdu"] },
      { id: "observance_score", label: "Score observance (Morisky 4 items)", type: "score_morisky" },
      { id: "prochain_inr", label: "Prochain contrôle INR prévu", type: "date" }
    ]
  },
  "AOD": {
    label: "Anticoagulants AOD",
    icon: "💊",
    color: "#c47800",
    colorPale: "rgba(196,120,0,0.1)",
    tarif: 40,
    code_acte: "EP-AOD",
    description: "Suivi des patients sous anticoagulants oraux directs (rivaroxaban, apixaban, dabigatran)",
    trame: [
      { id: "molecule", label: "Molécule AOD", type: "select", options: ["Rivaroxaban (Xarelto)","Apixaban (Eliquis)","Dabigatran (Pradaxa)","Edoxaban (Lixiana)"] },
      { id: "indication", label: "Indication", type: "select", options: ["Fibrillation atriale","TVP/EP curatif","TVP/EP préventif","Autre"] },
      { id: "oublis", label: "Oubli de prise (7 derniers jours)", type: "select", options: ["Aucun","1 oubli","2 oublis","3 oublis ou plus"] },
      { id: "prise_repas", label: "Prise avec le repas (si requis)", type: "select", options: ["Oui systématiquement","Parfois","Non"] },
      { id: "saignements", label: "Signes hémorragiques", type: "select", options: ["Aucun","Saignements mineurs","Saignements inquiétants"] },
      { id: "fonction_renale", label: "Fonction rénale connue (DFG)", type: "number", unit: "mL/min", placeholder: "ex: 65" },
      { id: "poids", label: "Poids actuel", type: "number", unit: "kg", placeholder: "ex: 72" },
      { id: "interactions", label: "Médicaments à risque d'interaction", type: "select", options: ["Non","Anti-inflammatoires","Antifongiques azolés","Autre"] },
      { id: "observance_score", label: "Score observance (Morisky 4 items)", type: "score_morisky" }
    ]
  },
  "Asthme": {
    label: "Asthme / Corticoïdes inhalés",
    icon: "🫁",
    color: "#2563eb",
    colorPale: "rgba(37,99,235,0.1)",
    tarif: 40,
    code_acte: "EP-ASTHME",
    description: "Suivi des patients asthmatiques sous corticoïdes inhalés",
    trame: [
      { id: "traitement", label: "Traitement de fond actuel", type: "text", placeholder: "ex: Fostair 100/6 µg" },
      { id: "dispositif", label: "Dispositif inhalateur", type: "select", options: ["Spray pressurisé (pMDI)","Turbuhaler","Diskus/Accuhaler","Breezhaler","Ellipta","Respimat"] },
      { id: "technique_ok", label: "Technique d'inhalation correcte", type: "select", options: ["Correcte","Quelques erreurs","Technique incorrecte — rééducation nécessaire"] },
      { id: "spacer", label: "Utilisation d'une chambre d'inhalation", type: "select", options: ["Oui","Non – conseillée","Non – non nécessaire"] },
      { id: "score_act", label: "Score de contrôle asthme (ACT 5 items)", type: "score_act" },
      { id: "crises_semaine", label: "Nombre de crises/semaine", type: "number", unit: "crises", placeholder: "ex: 2" },
      { id: "beta2_usage", label: "Utilisation β2 courte durée / semaine", type: "select", options: ["0","1-2","3-4","≥5 (non contrôlé)"] },
      { id: "nuit", label: "Réveils nocturnes / semaine", type: "select", options: ["0","1","2-3","≥4"] },
      { id: "activite", label: "Limitation de l'activité physique", type: "select", options: ["Aucune","Légère","Modérée","Sévère"] },
      { id: "tabac", label: "Tabac", type: "select", options: ["Non fumeur","Ex-fumeur","Fumeur actif"] },
      { id: "allergenes", label: "Allergènes identifiés évités", type: "select", options: ["Oui","Partiellement","Non"] },
      { id: "rinçage_bouche", label: "Rinçage de bouche après CI", type: "select", options: ["Oui systématiquement","Parfois","Non"] }
    ]
  },
  "Bilan_prevention": {
    label: "Bilan de prévention",
    icon: "🏥",
    color: "#0e9e82",
    colorPale: "rgba(14,158,130,0.1)",
    tarif: 30,
    code_acte: "BP-PREV",
    description: "Entretien de prévention (25, 45, 65 ans) – campagne nationale",
    trame: [
      { id: "tranche_age", label: "Tranche d'âge cible", type: "select", options: ["18-25 ans","45-50 ans","60-65 ans"] },
      { id: "tabac", label: "Tabac", type: "select", options: ["Non fumeur","Ex-fumeur","Fumeur – paquet/jour:"] },
      { id: "alcool", label: "Alcool (verres/semaine)", type: "number", unit: "verres/sem", placeholder: "ex: 7" },
      { id: "activite_physique", label: "Activité physique", type: "select", options: ["≥150 min/semaine","30-149 min/semaine","<30 min/semaine","Sédentaire"] },
      { id: "alimentation", label: "Alimentation équilibrée", type: "select", options: ["Oui","Partiellement","Non"] },
      { id: "imc", label: "IMC calculé", type: "number", unit: "kg/m²", placeholder: "ex: 24.5" },
      { id: "tension", label: "Tension artérielle (si mesurée)", type: "text", placeholder: "ex: 125/80 mmHg" },
      { id: "vaccins_a_jour", label: "Vaccinations à jour", type: "select", options: ["Oui","Partiellement","Non – liste à vérifier"] },
      { id: "depistages", label: "Dépistages réalisés (cancer, diabète…)", type: "select", options: ["À jour","Partiellement","Aucun récent"] },
      { id: "sommeil", label: "Qualité du sommeil", type: "select", options: ["Bon","Troubles légers","Troubles importants"] },
      { id: "stress", label: "Niveau de stress perçu", type: "select", options: ["Faible","Modéré","Élevé"] },
      { id: "score_prevention", label: "Score de prévention global", type: "score_prevention" }
    ]
  },
  "Bilan_medication": {
    label: "Bilan partagé de médication",
    icon: "📋",
    color: "#7c3aed",
    colorPale: "rgba(124,58,237,0.1)",
    tarif: 60,
    code_acte: "BPM",
    description: "Bilan partagé de médication (patient ≥65 ans sous ≥5 médicaments ou ≥75 ans)",
    trame: [
      { id: "nb_medicaments", label: "Nombre de médicaments", type: "number", unit: "médicaments", placeholder: "ex: 7" },
      { id: "automeds", label: "Automédication identifiée", type: "select", options: ["Non","Oui – mineure","Oui – potentiellement risquée"] },
      { id: "adherence_globale", label: "Adhérence thérapeutique globale", type: "select", options: ["Bonne","Modérée","Mauvaise"] },
      { id: "difficultes_prise", label: "Difficultés de prise", type: "select", options: ["Aucune","Difficultés à avaler","Comprimés à sécabilité complexe","Oublis fréquents","Autre"] },
      { id: "interactions_identifiees", label: "Interactions médicamenteuses détectées", type: "select", options: ["Aucune","Mineures","Cliniquement significatives"] },
      { id: "chevauchements", label: "Chevauchements thérapeutiques", type: "select", options: ["Non","Suspectés","Confirmés"] },
      { id: "medicaments_inappropries", label: "Médicaments potentiellement inappropriés (liste Laroche)", type: "select", options: ["Non","1 médicament","≥2 médicaments"] },
      { id: "pilulier", label: "Pilulier recommandé/utilisé", type: "select", options: ["Non nécessaire","Déjà utilisé","Recommandé ce jour"] },
      { id: "aides_prise", label: "Aide à la prise (infirmier, aidant)", type: "select", options: ["Autonome","Aidé partiellement","Dépendant"] },
      { id: "effets_secondaires", label: "Effets secondaires rapportés", type: "text", placeholder: "Description libre…" },
      { id: "score_medication", label: "Score observance médicaments (Morisky 8)", type: "score_morisky8" }
    ]
  },
  "Opioides": {
    label: "Opioïdes forts",
    icon: "⚠️",
    color: "#dc2626",
    colorPale: "rgba(220,38,38,0.1)",
    tarif: 40,
    code_acte: "EP-OPIO",
    description: "Suivi renforcé des patients sous opioïdes forts (morphine, oxycodone, fentanyl…)",
    trame: [
      { id: "molecule", label: "Opioïde prescrit", type: "select", options: ["Morphine LP","Morphine LI","Oxycodone LP","Oxycodone LI","Fentanyl transdermique","Hydromorphone","Buprénorphine","Autre"] },
      { id: "dose_journaliere", label: "Dose journalière", type: "text", placeholder: "ex: 60 mg/j morphine" },
      { id: "indication", label: "Indication", type: "select", options: ["Douleur chronique non cancéreuse","Douleur cancéreuse","Post-opératoire","Autre"] },
      { id: "duree_traitement", label: "Durée de traitement", type: "select", options: ["< 1 mois","1-3 mois","3-12 mois","> 12 mois"] },
      { id: "efficacite_douleur", label: "Efficacité analgésique (EVA)", type: "number", unit: "/10", placeholder: "0-10" },
      { id: "effets_secondaires", label: "Effets secondaires", type: "select", options: ["Aucun","Constipation","Nausées/vomissements","Somnolence","Prurit","Dysurie","Plusieurs"] },
      { id: "constipation_traitement", label: "Traitement laxatif associé", type: "select", options: ["Oui","Non – à prescrire","Non nécessaire"] },
      { id: "signes_dependance", label: "Signes de dépendance/mésusage", type: "select", options: ["Aucun","À surveiller","Présents – à signaler"] },
      { id: "ordonnances_securisees", label: "Ordonnances sécurisées vérifiées", type: "select", options: ["Oui","Non – signaler"] },
      { id: "equivalence_morphine", label: "Équivalence morphine orale calculée", type: "number", unit: "mg/j EqM", placeholder: "ex: 60" }
    ]
  },
  "Diabete": {
    label: "Diabète / Observance",
    icon: "🩺",
    color: "#0891b2",
    colorPale: "rgba(8,145,178,0.1)",
    tarif: 40,
    code_acte: "EP-DIA",
    description: "Suivi du patient diabétique de type 1 ou 2",
    trame: [
      { id: "type_diabete", label: "Type de diabète", type: "select", options: ["Type 1","Type 2","MODY","Gestationnel"] },
      { id: "hba1c", label: "Dernier HbA1c", type: "number", unit: "%", placeholder: "ex: 7.2" },
      { id: "hba1c_date", label: "Date du dernier HbA1c", type: "date" },
      { id: "glycemie_jeun", label: "Glycémie à jeun récente", type: "number", unit: "g/L", placeholder: "ex: 1.1" },
      { id: "traitement", label: "Traitement antidiabétique", type: "text", placeholder: "ex: Metformine 850mg + Jardiance 10mg" },
      { id: "autosurveillance", label: "Autosurveillance glycémique", type: "select", options: ["Régulière","Irrégulière","Absente"] },
      { id: "hypoglycemies", label: "Hypoglycémies (7 derniers jours)", type: "select", options: ["Aucune","1-2","≥3"] },
      { id: "pieds", label: "Examen des pieds réalisé", type: "select", options: ["Oui","Non – à recommander"] },
      { id: "ophtalmo", label: "Suivi ophtalmologique à jour", type: "select", options: ["Oui","Non"] },
      { id: "activite_physique", label: "Activité physique", type: "select", options: ["≥150 min/sem","30-149 min/sem","<30 min/sem"] },
      { id: "regime", label: "Régime alimentaire adapté", type: "select", options: ["Oui","Partiel","Non"] }
    ]
  },
  "Grossesse": {
    label: "Femme enceinte",
    icon: "🤰",
    color: "#db2777",
    colorPale: "rgba(219,39,119,0.1)",
    tarif: 30,
    code_acte: "EP-GROS",
    description: "Entretien femme enceinte – médicaments et prévention",
    trame: [
      { id: "terme", label: "Terme (semaines d'aménorrhée)", type: "number", unit: "SA", placeholder: "ex: 22" },
      { id: "medicaments_actuels", label: "Médicaments pris actuellement", type: "text", placeholder: "Liste complète…" },
      { id: "medicaments_contre_indiques", label: "Médicaments contre-indiqués identifiés", type: "select", options: ["Non","Oui – à signaler au prescripteur"] },
      { id: "acide_folique", label: "Acide folique pris en préconceptionnel", type: "select", options: ["Oui","Non","Non applicable"] },
      { id: "supplements", label: "Suppléments recommandés", type: "text", placeholder: "ex: Fer, vit D, Oméga-3…" },
      { id: "nausees", label: "Nausées/vomissements", type: "select", options: ["Non","Légères","Importantes – prise en charge"] },
      { id: "automeds", label: "Automédication à risque", type: "select", options: ["Non","Oui – AINS","Oui – autre"] },
      { id: "tabac", label: "Tabac", type: "select", options: ["Non","A arrêté","En cours d'arrêt","Fumeur – accompagnement proposé"] },
      { id: "alcool", label: "Alcool", type: "select", options: ["Aucun","Consommation à risque – éduquer"] },
      { id: "vaccins_grossesse", label: "Vaccins recommandés grossesse (coqueluche, grippe)", type: "select", options: ["À jour","Partiellement","Non vaccinée"] }
    ]
  }
};

// ── Scores validés cliniquement ─────────────────────────────
const SCORES = {
  morisky4: {
    label: "Morisky 4 items",
    questions: [
      "Vous arrive-t-il d'oublier de prendre votre médicament ?",
      "Avez-vous des difficultés à vous souvenir de prendre votre traitement ?",
      "Lorsque vous vous sentez bien, cessez-vous parfois de prendre votre traitement ?",
      "Lorsque vous vous sentez mal après avoir pris le médicament, cessez-vous de le prendre ?"
    ],
    options: ["Non (0)","Oui (1)"],
    interpret: s => s === 0 ? {label:"Bonne observance",color:"#0e9e82"} : s <= 1 ? {label:"Observance moyenne",color:"#c47800"} : {label:"Mauvaise observance",color:"#e03c52"}
  },
  act: {
    label: "ACT – Contrôle asthme (5 items)",
    questions: [
      "Votre asthme a-t-il limité vos activités au travail/à l'école/à la maison ?",
      "Avez-vous eu des difficultés respiratoires ?",
      "L'asthme vous a-t-il réveillé la nuit ?",
      "Avez-vous utilisé votre bronchodilatateur de secours ?",
      "Comment évaluez-vous votre contrôle de l'asthme ?"
    ],
    options: ["Tout le temps (1)","Souvent (2)","Parfois (3)","Rarement (4)","Jamais (5)"],
    interpret: s => s >= 20 ? {label:"Asthme bien contrôlé",color:"#0e9e82"} : s >= 16 ? {label:"Partiellement contrôlé",color:"#c47800"} : {label:"Non contrôlé",color:"#e03c52"}
  }
};

// ── Statuts workflow ────────────────────────────────────────
const STATUTS = {
  "planifie":  { label: "Planifié",  color: "#2563eb",  bg: "rgba(37,99,235,0.1)",  icon: "📅" },
  "en_cours":  { label: "En cours",  color: "#c47800",  bg: "rgba(196,120,0,0.1)",   icon: "⏳" },
  "realise":   { label: "Réalisé",   color: "#0e9e82",  bg: "rgba(14,158,130,0.1)",  icon: "✅" },
  "facture":   { label: "Facturé",   color: "#7c3aed",  bg: "rgba(124,58,237,0.1)",  icon: "💶" },
  "annule":    { label: "Annulé",    color: "#6b7c8d",  bg: "rgba(107,124,141,0.1)", icon: "✕"  }
};

// ── Facturation ──────────────────────────────────────────────
const FACTURATION_OPTIONS = [
  "Non facturé",
  "Facturé Assurance Maladie",
  "Facturé mutuelle",
  "Non facturable",
  "En attente paiement"
];

// ============================================================
// CHARGEMENT & RENDU
// ============================================================
async function loadEntretiens() {
  const el = document.getElementById('entretien-list');
  if (!el) return;

  const dl = document.getElementById('ent-patients-list');
  if (dl) dl.innerHTML = allPatients.map(p => `<option value="${p.name}">`).join('');

  const { data, error } = await sb.from('entretiens')
    .select('*')
    .eq('pharmacist_id', currentUser.id)
    .order('date', { ascending: false });

  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  allEntretiens = data || [];
  renderEntretienStats();
  renderEntretiens(allEntretiens);
}

function renderEntretienStats() {
  const el = document.getElementById('entretien-stats');
  if (!el) return;

  const total    = allEntretiens.length;
  const factures = allEntretiens.filter(e => e.facturation === 'Facturé Assurance Maladie' || e.facturation === 'Facturé mutuelle');
  const montant  = allEntretiens.reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
  const now = new Date();
  const ceMois   = allEntretiens.filter(e => { const d = new Date(e.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).length;
  const planifies = allEntretiens.filter(e => e.statut === 'planifie').length;
  const realises  = allEntretiens.filter(e => e.statut === 'realise').length;

  // Répartition par type
  const parType = {};
  allEntretiens.forEach(e => { if(e.type) parType[e.type] = (parType[e.type]||0)+1; });
  const topType = Object.entries(parType).sort((a,b)=>b[1]-a[1]).slice(0,3);

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--teal),var(--teal-light))"></div>
        <div class="stat-val" style="font-size:26px">${total}</div>
        <div class="stat-lbl">Total entretiens</div>
      </div>
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#2563eb"></div>
        <div class="stat-val" style="font-size:26px;color:#2563eb">${planifies}</div>
        <div class="stat-lbl">Planifiés</div>
      </div>
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#0e9e82"></div>
        <div class="stat-val" style="font-size:26px;color:#0e9e82">${ceMois}</div>
        <div class="stat-lbl">Ce mois-ci</div>
      </div>
      <div class="stat-card" style="position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:#7c3aed"></div>
        <div class="stat-val" style="font-size:26px;color:#7c3aed">${montant.toFixed(0)} €</div>
        <div class="stat-lbl">Facturé total</div>
      </div>
    </div>
    ${topType.length ? `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;align-self:center">Répartition :</span>
      ${topType.map(([type,count])=>{
        const t = ENTRETIEN_TYPES[type];
        return `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:600;background:${t?.colorPale||'rgba(14,158,130,0.1)'};color:${t?.color||'var(--teal)'}">
          ${t?.icon||'📋'} ${t?.label||type} <span style="opacity:.6">(${count})</span>
        </span>`;
      }).join('')}
    </div>` : ''}`;
}

function renderEntretiens(list) {
  const el = document.getElementById('entretien-list');
  if (!list.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🤝</div>
        <div class="empty-title">Aucun entretien enregistré</div>
        <div class="empty-sub">Les entretiens pharmaceutiques sont des actes remboursables — commencez à les tracer</div>
      </div>`;
    return;
  }

  el.innerHTML = list.map(e => {
    const typeInfo = ENTRETIEN_TYPES[e.type] || { icon:'📋', color:'var(--teal)', colorPale:'var(--teal-pale)', label: e.type||'Entretien' };
    const statutInfo = STATUTS[e.statut] || STATUTS['realise'];
    const trame = e.trame_data ? tryParseJSON(e.trame_data) : null;

    // Indicateurs visuels issus de la trame
    let indicators = '';
    if (trame) {
      if (trame.inr_dernier) {
        const inr = parseFloat(trame.inr_dernier);
        const inrColor = (inr >= 2 && inr <= 3) ? '#0e9e82' : '#e03c52';
        indicators += `<span style="font-size:11px;font-weight:700;color:${inrColor};background:${inrColor}22;padding:2px 8px;border-radius:99px">INR ${inr}</span> `;
      }
      if (trame.score_act_total !== undefined) {
        const actInfo = SCORES.act.interpret(trame.score_act_total);
        indicators += `<span style="font-size:11px;font-weight:700;color:${actInfo.color};background:${actInfo.color}22;padding:2px 8px;border-radius:99px">ACT ${trame.score_act_total}/25 – ${actInfo.label}</span> `;
      }
      if (trame.observance_score_total !== undefined) {
        const morInfo = SCORES.morisky4.interpret(trame.observance_score_total);
        indicators += `<span style="font-size:11px;font-weight:700;color:${morInfo.color};background:${morInfo.color}22;padding:2px 8px;border-radius:99px">Morisky ${trame.observance_score_total}/4</span> `;
      }
      if (trame.hba1c) {
        const hba1cColor = parseFloat(trame.hba1c) <= 7 ? '#0e9e82' : parseFloat(trame.hba1c) <= 8 ? '#c47800' : '#e03c52';
        indicators += `<span style="font-size:11px;font-weight:700;color:${hba1cColor};background:${hba1cColor}22;padding:2px 8px;border-radius:99px">HbA1c ${trame.hba1c}%</span> `;
      }
    }

    return `
    <div class="card" style="margin-bottom:10px;cursor:pointer;border-left:3px solid ${typeInfo.color}" onclick="openEntretienDetail('${e.id}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="display:flex;gap:12px;flex:1;min-width:0">
          <!-- Icône type -->
          <div style="width:42px;height:42px;border-radius:12px;background:${typeInfo.colorPale};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${typeInfo.icon}</div>
          <div style="flex:1;min-width:0">
            <!-- Ligne 1 : patient + type -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap">
              <span style="font-size:14px;font-weight:700;color:var(--text)">${e.patient_nom||'Patient inconnu'}</span>
              <span style="padding:2px 9px;border-radius:99px;font-size:11px;font-weight:700;background:${typeInfo.colorPale};color:${typeInfo.color}">${typeInfo.icon} ${typeInfo.label||e.type}</span>
              <!-- Statut -->
              <span style="padding:2px 9px;border-radius:99px;font-size:11px;font-weight:700;background:${statutInfo.bg};color:${statutInfo.color}">${statutInfo.icon} ${statutInfo.label}</span>
            </div>
            <!-- Ligne 2 : date, durée, pharmacien -->
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">
              ${formatDate(e.date)} · ${e.duree||30} min
              ${e.pharmacien ? ` · <span style="color:var(--teal)">👤 ${e.pharmacien}</span>` : ''}
            </div>
            <!-- Indicateurs scores -->
            ${indicators ? `<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">${indicators}</div>` : ''}
            <!-- Notes courtes -->
            ${e.notes ? `<div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:500px">${e.notes}</div>` : ''}
            <!-- Facturation + montant + prochain -->
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">
              ${renderFactBadge(e.facturation)}
              ${e.montant ? `<span style="font-size:12px;font-weight:700;color:var(--teal)">💶 ${parseFloat(e.montant).toFixed(2)} €</span>` : ''}
              ${e.prochain_entretien ? `<span style="font-size:11px;color:var(--text-dim)">📅 Prochain : ${formatDate(e.prochain_entretien)}</span>` : ''}
              ${e.code_acte ? `<span style="font-size:10px;color:var(--text-dim);font-family:monospace">${e.code_acte}</span>` : ''}
            </div>
          </div>
        </div>
        <!-- Actions -->
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-ghost" onclick="openEntretienDetail('${e.id}')" title="Voir le détail">📄</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEntretien('${e.id}')" title="Supprimer">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderFactBadge(f) {
  if (f === 'Facturé Assurance Maladie') return `<span class="badge badge-ok">✅ ${f}</span>`;
  if (f === 'Facturé mutuelle') return `<span class="badge badge-ok">✅ ${f}</span>`;
  if (f === 'Non facturé') return `<span class="badge badge-warn">⏳ Non facturé</span>`;
  if (f === 'En attente paiement') return `<span class="badge badge-blue">⏳ En attente</span>`;
  return `<span class="badge">${f||'Non facturé'}</span>`;
}

// ============================================================
// MODAL — NOUVEL ENTRETIEN
// ============================================================
function openAddEntretien() {
  openModal('add-entretien');
  renderTypeSelector();
  // Date par défaut = aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('ent-date');
  if (dateEl) dateEl.value = today;
}

function renderTypeSelector() {
  const container = document.getElementById('ent-type-selector');
  if (!container) return;
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      ${Object.entries(ENTRETIEN_TYPES).map(([key, t]) => `
        <div class="ent-type-card" onclick="selectEntretienType('${key}')"
          style="padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:10px">
          <div style="font-size:22px;flex-shrink:0">${t.icon}</div>
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text)">${t.label}</div>
            <div style="font-size:10px;color:var(--text-muted)">${t.tarif} € · ${t.code_acte}</div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function selectEntretienType(typeKey) {
  // Highlight
  document.querySelectorAll('.ent-type-card').forEach(c => {
    c.style.border = '1.5px solid var(--border)';
    c.style.background = '';
  });
  const t = ENTRETIEN_TYPES[typeKey];
  event?.currentTarget?.style && (event.currentTarget.style.border = `1.5px solid ${t.color}`);
  event?.currentTarget?.style && (event.currentTarget.style.background = t.colorPale);

  document.getElementById('ent-type-hidden').value = typeKey;
  document.getElementById('ent-montant').value = t.tarif;
  document.getElementById('ent-code-acte').value = t.code_acte;

  // Afficher la trame
  renderTrame(typeKey);
}

function renderTrame(typeKey) {
  const container = document.getElementById('ent-trame-container');
  if (!container) return;
  const t = ENTRETIEN_TYPES[typeKey];
  if (!t) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div style="background:${t.colorPale};border:1px solid ${t.color}33;border-radius:10px;padding:14px 16px;margin-top:8px">
      <div style="font-size:12px;font-weight:700;color:${t.color};margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em">
        ${t.icon} Trame — ${t.label}
      </div>
      ${t.trame.map(field => renderTrameField(field)).join('')}
    </div>`;
}

function renderTrameField(field) {
  if (field.type === 'score_morisky') return renderScoreMorisky(field.id, 'morisky4');
  if (field.type === 'score_morisky8') return renderScoreMorisky(field.id, 'morisky8');
  if (field.type === 'score_act') return renderScoreACT(field.id);
  if (field.type === 'score_prevention') return renderScorePrevention(field.id);

  const req = field.important ? '*' : '';
  if (field.type === 'select') {
    return `
      <div style="margin-bottom:10px">
        <label class="form-label">${field.label}${req}</label>
        <select class="form-input" id="trame_${field.id}">
          <option value="">— Sélectionner —</option>
          ${(field.options||[]).map(o=>`<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>`;
  }
  if (field.type === 'text' || field.type === 'number' || field.type === 'date') {
    return `
      <div style="margin-bottom:10px">
        <label class="form-label">${field.label}${field.unit?` (${field.unit})`:''}${req}</label>
        <input class="form-input" type="${field.type}" id="trame_${field.id}"
          placeholder="${field.placeholder||''}" step="${field.type==='number'?'0.1':''}"/>
      </div>`;
  }
  return '';
}

function renderScoreMorisky(id, variant) {
  const score = SCORES.morisky4;
  return `
    <div style="margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.5);border-radius:8px;border:1px solid rgba(0,0,0,0.06)" id="score_container_${id}">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
        📊 ${score.label}
      </div>
      ${score.questions.map((q,i) => `
        <div style="margin-bottom:8px">
          <div style="font-size:12px;color:var(--text);margin-bottom:4px">${i+1}. ${q}</div>
          <div style="display:flex;gap:8px">
            ${score.options.map((opt,j)=>`
              <label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer">
                <input type="radio" name="${id}_q${i}" value="${j}" onchange="updateScoreMorisky('${id}')"> ${opt}
              </label>`).join('')}
          </div>
        </div>`).join('')}
      <div id="${id}_result" style="margin-top:8px;font-size:12px;color:var(--text-muted)">Score : —</div>
    </div>`;
}

function updateScoreMorisky(id) {
  const score = SCORES.morisky4;
  let total = 0; let allAnswered = true;
  score.questions.forEach((q,i) => {
    const checked = document.querySelector(`input[name="${id}_q${i}"]:checked`);
    if (checked) total += parseInt(checked.value);
    else allAnswered = false;
  });
  const resultEl = document.getElementById(`${id}_result`);
  if (!resultEl) return;
  if (!allAnswered) { resultEl.textContent = 'Score : répondre à toutes les questions'; return; }
  const interp = SCORES.morisky4.interpret(total);
  resultEl.innerHTML = `<span style="font-weight:700;color:${interp.color}">Score ${total}/4 — ${interp.label}</span>`;
  document.getElementById(`trame_${id}_total`) || (() => {
    const inp = document.createElement('input'); inp.type='hidden'; inp.id=`trame_${id}_total`; inp.value=total;
    document.getElementById(`score_container_${id}`)?.appendChild(inp);
  })();
  const el = document.getElementById(`trame_${id}_total`);
  if (el) el.value = total; else {
    const h = document.createElement('input'); h.type='hidden'; h.id=`trame_${id}_total`; h.value=total;
    document.getElementById(`score_container_${id}`)?.appendChild(h);
  }
}

function renderScoreACT(id) {
  const score = SCORES.act;
  return `
    <div style="margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.5);border-radius:8px;border:1px solid rgba(0,0,0,0.06)" id="score_container_${id}">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
        📊 ${score.label}
      </div>
      ${score.questions.map((q,i) => `
        <div style="margin-bottom:8px">
          <div style="font-size:12px;color:var(--text);margin-bottom:4px">${i+1}. ${q}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${score.options.map((opt,j)=>`
              <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;padding:3px 8px;border-radius:6px;border:1px solid var(--border);background:var(--bg)">
                <input type="radio" name="${id}_q${i}" value="${j+1}" onchange="updateScoreACT('${id}')"> ${opt}
              </label>`).join('')}
          </div>
        </div>`).join('')}
      <div id="${id}_result" style="margin-top:8px;font-size:12px;color:var(--text-muted)">Score ACT : —</div>
    </div>`;
}

function updateScoreACT(id) {
  let total = 0; let allAnswered = true;
  SCORES.act.questions.forEach((q,i) => {
    const checked = document.querySelector(`input[name="${id}_q${i}"]:checked`);
    if (checked) total += parseInt(checked.value);
    else allAnswered = false;
  });
  const resultEl = document.getElementById(`${id}_result`);
  if (!resultEl) return;
  if (!allAnswered) { resultEl.textContent = 'Score ACT : répondre à toutes les questions'; return; }
  const interp = SCORES.act.interpret(total);
  resultEl.innerHTML = `<span style="font-weight:700;color:${interp.color}">ACT ${total}/25 — ${interp.label}</span>`;
  const existing = document.getElementById(`trame_${id}_total`);
  if (existing) existing.value = total;
  else {
    const h = document.createElement('input'); h.type='hidden'; h.id=`trame_${id}_total`; h.value=total;
    document.getElementById(`score_container_${id}`)?.appendChild(h);
  }
}

function renderScorePrevention(id) {
  return `
    <div style="margin-bottom:12px;padding:12px;background:rgba(255,255,255,0.5);border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
        📊 Score prévention global
      </div>
      <div style="font-size:12px;color:var(--text-muted)">Calculé automatiquement à partir des réponses du questionnaire</div>
      <input type="hidden" id="trame_${id}_total" value="0">
    </div>`;
}

// ============================================================
// SAUVEGARDE
// ============================================================
async function saveEntretien() {
  const patientNom = document.getElementById('ent-patient')?.value.trim();
  const typeKey    = document.getElementById('ent-type-hidden')?.value;
  const date       = document.getElementById('ent-date')?.value;

  if (!patientNom || !typeKey || !date) return showToast('Patient, type et date sont obligatoires', 'error');

  // Collecter données trame
  const trameData = {};
  const typeInfo  = ENTRETIEN_TYPES[typeKey];
  if (typeInfo) {
    typeInfo.trame.forEach(field => {
      const el = document.getElementById(`trame_${field.id}`);
      if (el) trameData[field.id] = el.value;
      // Scores
      const scoreEl = document.getElementById(`trame_${field.id}_total`);
      if (scoreEl) trameData[`${field.id}_total`] = parseInt(scoreEl.value) || 0;
    });
  }

  const payload = {
    pharmacist_id: currentUser.id,
    patient_nom: patientNom,
    type: typeKey,
    date,
    duree: parseInt(document.getElementById('ent-duree')?.value) || 30,
    notes: document.getElementById('ent-notes')?.value || null,
    facturation: document.getElementById('ent-facturation')?.value || 'Non facturé',
    montant: parseFloat(document.getElementById('ent-montant')?.value) || (typeInfo?.tarif || null),
    prochain_entretien: document.getElementById('ent-prochain')?.value || null,
    statut: document.getElementById('ent-statut')?.value || 'realise',
    code_acte: document.getElementById('ent-code-acte')?.value || typeInfo?.code_acte || null,
    pharmacien: document.getElementById('ent-pharmacien')?.value || null,
    trame_data: JSON.stringify(trameData)
  };

  const { error } = await sb.from('entretiens').insert(payload);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-entretien');
  showToast('Entretien enregistré ✅', 'success');
  loadEntretiens();
}

// ============================================================
// DÉTAIL ENTRETIEN
// ============================================================
async function openEntretienDetail(id) {
  currentEntretienId = id;
  const e = allEntretiens.find(x => x.id === id);
  if (!e) return;

  const typeInfo = ENTRETIEN_TYPES[e.type] || { icon:'📋', color:'var(--teal)', colorPale:'var(--teal-pale)', label:e.type||'Entretien', trame:[] };
  const statutInfo = STATUTS[e.statut] || STATUTS['realise'];
  const trame = e.trame_data ? tryParseJSON(e.trame_data) : {};

  // Construire le HTML de la trame remplie
  let trameHTML = '';
  if (typeInfo.trame && typeInfo.trame.length) {
    trameHTML = `<div style="margin-top:16px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">Données de l'entretien</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${typeInfo.trame.filter(f => !f.type.startsWith('score')).map(field => {
          const val = trame[field.id];
          if (!val) return '';
          return `<div style="background:var(--bg);border:var(--border);border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">${field.label}</div>
            <div style="font-size:13px;color:var(--text);font-weight:500">${val}${field.unit?' '+field.unit:''}</div>
          </div>`;
        }).filter(Boolean).join('')}
      </div>
      ${renderScoresDetail(trame, typeInfo)}
    </div>`;
  }

  const detailHTML = `
    <div class="modal-header" style="background:${typeInfo.colorPale};border-bottom:1px solid ${typeInfo.color}33">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="font-size:28px">${typeInfo.icon}</div>
        <div>
          <div class="modal-title">${e.patient_nom||'Patient inconnu'}</div>
          <div style="font-size:12px;color:${typeInfo.color};font-weight:600;margin-top:2px">${typeInfo.label} · ${formatDate(e.date)}</div>
        </div>
      </div>
      <button class="modal-close" onclick="closeModal('entretien-detail')">×</button>
    </div>
    <div class="modal-body" style="max-height:70vh;overflow-y:auto">
      <!-- Statut & facturation -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:14px;border-bottom:var(--border)">
        <span style="padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;background:${statutInfo.bg};color:${statutInfo.color}">${statutInfo.icon} ${statutInfo.label}</span>
        ${renderFactBadge(e.facturation)}
        ${e.montant ? `<span style="padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;background:rgba(124,58,237,0.1);color:#7c3aed">💶 ${parseFloat(e.montant).toFixed(2)} €</span>` : ''}
        ${e.code_acte ? `<span style="padding:4px 12px;border-radius:99px;font-size:11px;font-weight:600;background:var(--bg);color:var(--text-muted);font-family:monospace">${e.code_acte}</span>` : ''}
      </div>
      <!-- Infos générales -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:var(--bg);border:var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Durée</div>
          <div style="font-size:13px;font-weight:500">${e.duree||30} min</div>
        </div>
        ${e.pharmacien ? `<div style="background:var(--bg);border:var(--border);border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Pharmacien</div>
          <div style="font-size:13px;font-weight:500">${e.pharmacien}</div>
        </div>` : ''}
        ${e.prochain_entretien ? `<div style="background:var(--teal-pale);border:1px solid var(--teal-border);border-radius:8px;padding:10px 12px">
          <div style="font-size:10px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px">Prochain entretien</div>
          <div style="font-size:13px;font-weight:500;color:var(--teal)">${formatDate(e.prochain_entretien)}</div>
        </div>` : ''}
      </div>
      <!-- Notes -->
      ${e.notes ? `
        <div style="background:var(--bg);border:var(--border);border-radius:8px;padding:14px;margin-bottom:14px">
          <div style="font-size:10px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Observations / Compte-rendu</div>
          <div style="font-size:13px;color:var(--text);line-height:1.7">${e.notes}</div>
        </div>` : ''}
      <!-- Données trame -->
      ${trameHTML}
      <!-- Analyse IA -->
      <div style="margin-top:18px;border:1.5px solid var(--teal-border);border-radius:10px;overflow:hidden">
        <div style="background:var(--navy);padding:12px 16px;display:flex;align-items:center;gap:8px">
          <div style="width:7px;height:7px;border-radius:50%;background:#4ecdb4;box-shadow:0 0 8px #4ecdb4;animation:aipulse 2.4s ease-in-out infinite"></div>
          <span style="font-size:13px;font-weight:700;color:#fff">Analyse IA — Conseils pharmacien</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.3);margin-left:auto">Claude</span>
        </div>
        <div id="detail-ai-result" style="padding:16px">
          <button class="btn btn-primary btn-sm" onclick="runDetailAI('${id}')">✨ Générer l'analyse IA</button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost btn-sm" onclick="closeModal('entretien-detail')">Fermer</button>
      <button class="btn btn-primary btn-sm" onclick="changeStatut('${id}')">✏️ Changer le statut</button>
      <button class="btn btn-danger btn-sm" onclick="deleteEntretien('${id}');closeModal('entretien-detail')">Supprimer</button>
    </div>`;

  document.getElementById('entretien-detail-content').innerHTML = detailHTML;
  openModal('entretien-detail');
}

function renderScoresDetail(trame, typeInfo) {
  let html = '';
  if (trame.observance_score_total !== undefined) {
    const interp = SCORES.morisky4.interpret(trame.observance_score_total);
    html += `<div style="margin-top:12px;padding:12px;background:${interp.color}15;border:1px solid ${interp.color}33;border-radius:8px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Score Morisky (observance)</div>
      <div style="font-size:18px;font-weight:700;color:${interp.color}">${trame.observance_score_total}/4 — ${interp.label}</div>
    </div>`;
  }
  if (trame.score_act_total !== undefined) {
    const interp = SCORES.act.interpret(trame.score_act_total);
    html += `<div style="margin-top:8px;padding:12px;background:${interp.color}15;border:1px solid ${interp.color}33;border-radius:8px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Score ACT (contrôle asthme)</div>
      <div style="font-size:18px;font-weight:700;color:${interp.color}">${trame.score_act_total}/25 — ${interp.label}</div>
    </div>`;
  }
  return html;
}

// ============================================================
// ANALYSE IA CONTEXTUELLE
// ============================================================
async function runDetailAI(id) {
  const e = allEntretiens.find(x => x.id === id);
  if (!e) return;
  const el = document.getElementById('detail-ai-result');
  if (!el) return;

  el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:var(--teal);font-size:13px;padding:8px 0">
    <div style="width:16px;height:16px;border:2px solid rgba(14,158,130,0.2);border-top-color:var(--teal);border-radius:50%;animation:spin .7s linear infinite"></div>
    Analyse en cours…
  </div>`;

  const typeInfo = ENTRETIEN_TYPES[e.type] || {};
  const trame    = e.trame_data ? tryParseJSON(e.trame_data) : {};
  const trameStr = Object.entries(trame).map(([k,v])=>`${k}: ${v}`).join(', ');

  const prompt = `Tu es pharmacien clinicien expert en ${typeInfo.label||e.type}. 
Patient : ${e.patient_nom}
Type d'entretien : ${typeInfo.label||e.type} (${typeInfo.description||''})
Date : ${e.date}
Données collectées : ${trameStr || 'Non renseignées'}
Notes : ${e.notes||'Aucune'}

Génère une analyse clinique structurée. Réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) :
{
  "bilan_clinique": "2-3 phrases résumant l'état du patient selon les données",
  "points_attention": ["point 1","point 2","point 3"],
  "recommandations_pharmacien": ["action 1","action 2","action 3"],
  "medicaments_a_proposer": ["médicament ou conseil 1","médicament ou conseil 2"],
  "prochain_entretien_delai": "délai recommandé pour le prochain entretien",
  "alerte": "alerte principale à communiquer au patient ou au prescripteur (null si aucune)"
}`;

  try {
    const res  = await fetch('/api/analyze-ai', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ messages:[{role:'user',content:prompt}], max_tokens:900 }) });
    const raw  = await res.json();
    const text = (raw.content?.[0]?.text||raw.choices?.[0]?.message?.content||'').replace(/```json|```/g,'').trim();
    let parsed; try { parsed=JSON.parse(text); } catch { parsed=null; }
    renderDetailAI(parsed, text, el);
  } catch(err) {
    el.innerHTML = `<div style="color:var(--red);font-size:13px">Erreur connexion IA. <button class="btn btn-sm btn-ghost" onclick="runDetailAI('${id}')">Réessayer</button></div>`;
  }
}

function renderDetailAI(parsed, raw, el) {
  if (!parsed) { el.innerHTML = `<pre style="font-size:12px;white-space:pre-wrap">${raw}</pre>`; return; }
  const ptHTML  = (parsed.points_attention||[]).map(p=>`<div style="display:flex;gap:8px;padding:5px 0;font-size:13px;color:var(--text)"><span style="color:var(--amber);flex-shrink:0">⚠️</span>${p}</div>`).join('');
  const recHTML = (parsed.recommandations_pharmacien||[]).map(r=>`<div style="display:flex;gap:8px;padding:5px 0;font-size:13px;color:var(--text)"><span style="color:var(--teal);flex-shrink:0">›</span>${r}</div>`).join('');
  const medHTML = (parsed.medicaments_a_proposer||[]).map(m=>`<span style="display:inline-block;padding:3px 10px;background:var(--teal-pale);color:var(--teal);border:1px solid var(--teal-border);border-radius:99px;font-size:11px;font-weight:600;margin:2px">${m}</span>`).join('');
  el.innerHTML = `
    ${parsed.alerte ? `<div style="display:flex;gap:8px;padding:10px 12px;background:var(--red-pale);border:1px solid #f5b8b8;border-radius:8px;font-size:13px;color:var(--red);margin-bottom:12px">🔴 <strong>Alerte :</strong> ${parsed.alerte}</div>` : ''}
    <div style="font-size:10px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Bilan clinique</div>
    <div style="font-size:13px;color:var(--text);line-height:1.65;margin-bottom:12px">${parsed.bilan_clinique||''}</div>
    ${ptHTML ? `<div style="font-size:10px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Points d'attention</div>${ptHTML}<div style="margin-bottom:12px"></div>` : ''}
    ${recHTML ? `<div style="font-size:10px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Recommandations</div>${recHTML}<div style="margin-bottom:12px"></div>` : ''}
    ${medHTML ? `<div style="font-size:10px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">À proposer</div><div style="margin-bottom:12px">${medHTML}</div>` : ''}
    ${parsed.prochain_entretien_delai ? `<div style="font-size:12px;color:var(--text-muted);padding:8px 10px;background:var(--bg);border-radius:6px;margin-top:4px">📅 Prochain entretien recommandé : <strong>${parsed.prochain_entretien_delai}</strong></div>` : ''}
    <div style="font-size:10px;color:var(--text-dim);margin-top:10px;padding-top:8px;border-top:var(--border)">✨ Analyse IA — à valider par le pharmacien · Claude</div>`;
}

// ============================================================
// FILTRES & RECHERCHE
// ============================================================
function filterEntretiens(q) {
  q = q.toLowerCase();
  renderEntretiens(q ? allEntretiens.filter(e =>
    (e.patient_nom||'').toLowerCase().includes(q) ||
    (e.type||'').toLowerCase().includes(q) ||
    (e.notes||'').toLowerCase().includes(q) ||
    (e.statut||'').toLowerCase().includes(q)
  ) : allEntretiens);
}

function filterEntretiensByType(typeKey) {
  document.querySelectorAll('.ent-filter-btn').forEach(b => b.classList.remove('active'));
  event?.currentTarget?.classList.add('active');
  if (!typeKey) { renderEntretiens(allEntretiens); return; }
  renderEntretiens(allEntretiens.filter(e => e.type === typeKey));
}

function filterEntretiensByStatut(statut) {
  if (!statut) { renderEntretiens(allEntretiens); return; }
  renderEntretiens(allEntretiens.filter(e => e.statut === statut));
}

// ============================================================
// CHANGEMENT DE STATUT
// ============================================================
async function changeStatut(id) {
  const e = allEntretiens.find(x => x.id === id);
  if (!e) return;
  const statutKeys = Object.keys(STATUTS);
  const currentIdx = statutKeys.indexOf(e.statut || 'realise');
  const nextStatut = statutKeys[(currentIdx + 1) % statutKeys.length];
  const { error } = await sb.from('entretiens').update({ statut: nextStatut }).eq('id', id);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  showToast(`Statut → ${STATUTS[nextStatut].label}`, 'success');
  await loadEntretiens();
  openEntretienDetail(id);
}

// ============================================================
// SUPPRESSION
// ============================================================
async function deleteEntretien(id) {
  if (!confirm('Supprimer cet entretien ?')) return;
  await sb.from('entretiens').delete().eq('id', id);
  showToast('Entretien supprimé', 'success');
  loadEntretiens();
}

// ============================================================
// UTILITAIRES
// ============================================================
function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

// Rétrocompatibilité
function renderStats() { renderEntretienStats(); }
JSEOF
echo "Done"
