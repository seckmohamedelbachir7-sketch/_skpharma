// drugs-ui.js — Base médicamenteuse avec groupement par molécule et filtres

// ---- Catégorisation des formes galéniques ----
const FORME_CATEGORIES = [
  { label: "Comprimé / Gélule", icon: "💊", match: ["comprimé","gélule","capsule","cachet","dragée"] },
  { label: "Liquide oral",      icon: "🧴", match: ["solution buvable","suspension buvable","sirop","gouttes buvable","poudre pour suspension buvable","émulsion buvable"] },
  { label: "Injectable",        icon: "💉", match: ["injectable","perfusion","intraveineuse","sous-cutané"] },
  { label: "Topique / Patch",   icon: "🩹", match: ["crème","gel","pommade","patch","emplâtre","dispositif transdermique","lotion","mousse"] },
  { label: "Inhalation",        icon: "💨", match: ["inhalation","aérosol","spray nasal","nébuliseur","pulvérisation","inhalée"] },
  { label: "Ophtalmique",       icon: "👁", match: ["collyre","ophtalmique"] },
  { label: "Rectal / Vaginal",  icon: "🔹", match: ["suppositoire","rectal","vaginal"] },
];

function getFormeCategory(forme) {
  const f = (forme || "").toLowerCase();
  for (const cat of FORME_CATEGORIES) {
    if (cat.match.some(m => f.includes(m))) return cat;
  }
  return { label: "Autre", icon: "🔸" };
}

// ---- Groupement par molécule (DCI principale) ----
function groupByMolecule(list) {
  const map = new Map();
  for (const drug of list) {
    const dciKey = (drug.dci || drug.name).split(",")[0].trim().toUpperCase();
    if (!map.has(dciKey)) {
      map.set(dciKey, { key: dciKey, dci: drug.dci || "—", classe: drug.classe || "",
        alerte: drug.alerte || "", posologie: drug.posologie || "", ci: drug.ci || "", meds: [] });
    }
    const g = map.get(dciKey);
    g.meds.push(drug);
    if (!g.posologie && drug.posologie) g.posologie = drug.posologie;
    if (!g.ci        && drug.ci)        g.ci        = drug.ci;
    if (!g.alerte    && drug.alerte)    g.alerte    = drug.alerte;
    if (!g.classe    && drug.classe)    g.classe    = drug.classe;
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

// ---- État des filtres ----
let currentFormeFilter = "";
let currentQuery       = "";
let expandedGroups     = new Set();

// ---- Rendu d'un groupe ----
function renderGroup(group) {
  const isExpanded = expandedGroups.has(group.key);
  const count      = group.meds.length;
  const formesInGroup = [...new Set(group.meds.map(m => getFormeCategory(m.forme).label))];
  const keyEsc = group.key.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const variantesHTML = isExpanded ? `
    <div class="med-variantes">
      <div style="font-size:11px;font-weight:600;color:var(--gray-500);text-transform:uppercase;
                  letter-spacing:.05em;margin-bottom:8px">${count} spécialité${count>1?"s":""}</div>
      ${group.meds.map(m => `
        <div class="med-variant-row">
          <span class="med-variant-name">${m.name}</span>
          <span class="badge" style="background:var(--gray-200);color:var(--gray-700);font-size:10px">
            ${getFormeCategory(m.forme).icon} ${m.forme || "—"}
          </span>
          ${m.dosage ? `<span style="font-size:11px;color:var(--text-muted)">${m.dosage}</span>` : ""}
        </div>`).join("")}
    </div>` : "";

  return `
    <div class="med-group-card">
      <div class="med-group-header">
        <div style="flex:1;min-width:0">
          <div class="med-group-title">${group.key}</div>
          ${group.dci !== group.key ? `<div class="med-group-dci">${group.dci}</div>` : ""}
          <div class="med-group-tags">
            ${group.classe ? `<span class="badge badge-ok">${group.classe}</span>` : ""}
            ${group.alerte ? `<span class="badge badge-warn">⚠ ${group.alerte}</span>` : ""}
            ${formesInGroup.map(f => {
              const cat = FORME_CATEGORIES.find(c => c.label === f) || {icon:"🔸"};
              return `<span class="badge" style="background:var(--gray-200);color:var(--gray-700)">${cat.icon} ${f}</span>`;
            }).join("")}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" style="white-space:nowrap;flex-shrink:0"
          onclick="toggleVariantes('${keyEsc}')">
          ${isExpanded ? "▲ Réduire" : `${count > 1 ? count+" variantes" : "1 spécialité"} ▼`}
        </button>
      </div>

      ${group.posologie || group.ci ? `
        <div class="med-info-grid">
          ${group.posologie ? `
            <div class="med-info-box">
              <div class="med-info-label">Posologie</div>
              <div class="med-info-value">${group.posologie}</div>
            </div>` : ""}
          ${group.ci ? `
            <div class="med-info-box med-info-ci">
              <div class="med-info-label" style="color:var(--red)">Contre-indications</div>
              <div class="med-info-value">${group.ci}</div>
            </div>` : ""}
        </div>` : `
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;font-style:italic">
          Posologie et CI : consultez le RCP sur
          <a href="https://base-donnees-publique.medicaments.gouv.fr" target="_blank"
             style="color:var(--teal)">medicaments.gouv.fr</a>
        </div>`}

      ${variantesHTML}
    </div>`;
}

// ---- Rendu liste complète ----
function renderMedicaments(groups) {
  const container = document.getElementById("drug-list");
  if (!groups.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>
      <div class="empty-title">Aucun résultat</div>
      <div class="empty-sub">Essayez un autre nom, DCI ou retirez un filtre</div></div>`;
    return;
  }
  const total = groups.reduce((s,g) => s + g.meds.length, 0);
  container.innerHTML = `
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">
      ${groups.length} molécule${groups.length>1?"s":""} · ${total} spécialité${total>1?"s":""}
    </div>
    ${groups.map(g => renderGroup(g)).join("")}`;
}

// ---- Filtrage ----
function applyFilters() {
  const q = currentQuery.toLowerCase().trim();
  let filtered = drugs;
  if (q.length >= 2) {
    filtered = drugs.filter(d =>
      (d.name   || "").toLowerCase().includes(q) ||
      (d.dci    || "").toLowerCase().includes(q) ||
      (d.classe || "").toLowerCase().includes(q)
    );
  }
  let groups = groupByMolecule(filtered);
  if (currentFormeFilter) {
    groups = groups
      .map(g => ({ ...g, meds: g.meds.filter(m => getFormeCategory(m.forme).label === currentFormeFilter) }))
      .filter(g => g.meds.length > 0);
  }
  renderMedicaments(groups);
}

function filterDrugs(q) {
  currentQuery = q;
  if (q.length === 0) expandedGroups.clear();
  applyFilters();
}

function setFormeFilter(label, el) {
  if (currentFormeFilter === label) {
    currentFormeFilter = "";
    document.querySelectorAll(".forme-filter-btn").forEach(b => b.classList.remove("active"));
  } else {
    currentFormeFilter = label;
    document.querySelectorAll(".forme-filter-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
  }
  applyFilters();
}

function toggleVariantes(key) {
  expandedGroups.has(key) ? expandedGroups.delete(key) : expandedGroups.add(key);
  applyFilters();
}

function renderFiltresForme() {
  const container = document.getElementById("forme-filters");
  if (!container) return;
  container.innerHTML = FORME_CATEGORIES.map(cat =>
    `<button class="forme-filter-btn" onclick="setFormeFilter('${cat.label}', this)">${cat.icon} ${cat.label}</button>`
  ).join("") + `<button class="forme-filter-btn" onclick="setFormeFilter('Autre', this)">🔸 Autre</button>`;
}

function initMedicaments() {
  renderFiltresForme();
  renderMedicaments(groupByMolecule(drugs));
}

// Alias pour compatibilité avec showApp dans auth.js
function renderDrugs(list) {
  renderMedicaments(groupByMolecule(list));
}
