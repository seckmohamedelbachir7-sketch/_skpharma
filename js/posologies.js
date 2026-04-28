// posologies.js — Gestion des posologies par patient

let allPosologies = [];

// ────────────────────────────────────────────────
// POSOLOGIES DU DOSSIER PATIENT
// ────────────────────────────────────────────────

async function loadPosologiesPatient(patientId) {
  const el = document.getElementById('det-poso-list');
  if (!el) return;

  const { data, error } = await sb
    .from('posologies')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>';
    return;
  }

  const actions = `<div style="margin-bottom:14px">
    <button class="btn btn-primary btn-sm" onclick="openModal('add-posologie')">+ Ajouter une posologie</button>
  </div>`;

  if (!data || !data.length) {
    el.innerHTML = actions + `<div class="empty">
      <div class="empty-icon">💊</div>
      <div class="empty-title">Aucune posologie enregistrée</div>
      <div class="empty-sub">Ajoutez les schémas posologiques du patient pour un suivi précis</div>
    </div>`;
    return;
  }

  allPosologies = data;

  const statutBadge = s => {
    if (s === 'En cours')   return 'badge-ok';
    if (s === 'Terminé')    return 'badge-blue';
    if (s === 'Suspendu')   return 'badge-warn';
    if (s === 'À surveiller') return 'badge-danger';
    return 'badge-ok';
  };

  el.innerHTML = actions + data.map(p => `
    <div class="ordo-item" style="margin-bottom:10px">
      <div class="ordo-top">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div style="font-size:15px;font-weight:600">${p.medicament}</div>
          ${p.dosage ? `<span class="badge badge-blue" style="font-size:11px">${p.dosage}</span>` : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge ${statutBadge(p.statut)}">${p.statut || 'En cours'}</span>
          <button class="btn btn-danger btn-sm" onclick="deletePosologie('${p.id}')">✕</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:10px">
        ${p.frequence ? `
          <div style="background:var(--gray-100);border-radius:8px;padding:8px 10px">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Fréquence</div>
            <div style="font-size:13px;font-weight:500">${p.frequence}</div>
          </div>` : ''}
        ${p.horaires ? `
          <div style="background:var(--gray-100);border-radius:8px;padding:8px 10px">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Horaires</div>
            <div style="font-size:13px;font-weight:500">${p.horaires}</div>
          </div>` : ''}
        ${p.duree ? `
          <div style="background:var(--gray-100);border-radius:8px;padding:8px 10px">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Durée</div>
            <div style="font-size:13px;font-weight:500">${p.duree}</div>
          </div>` : ''}
        ${p.voie ? `
          <div style="background:var(--gray-100);border-radius:8px;padding:8px 10px">
            <div style="font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Voie</div>
            <div style="font-size:13px;font-weight:500">${p.voie}</div>
          </div>` : ''}
      </div>

      ${p.conditions_prise ? `
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
          <strong>Conditions :</strong> ${p.conditions_prise}
        </div>` : ''}
      ${p.effets_surveiller ? `
        <div style="margin-top:6px;padding:7px 10px;background:var(--amber-pale);border-radius:6px;font-size:12px;color:var(--amber)">
          ⚠ <strong>Effets à surveiller :</strong> ${p.effets_surveiller}
        </div>` : ''}
      ${p.notes ? `<div style="margin-top:6px;font-size:12px;color:var(--text-muted)">${p.notes}</div>` : ''}

      <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
        ${p.date_debut ? `Début : ${formatDate(p.date_debut)}` : ''}
        ${p.date_fin ? ` · Fin : ${formatDate(p.date_fin)}` : ''}
        ${p.prescripteur ? ` · Dr. ${p.prescripteur}` : ''}
      </div>
    </div>
  `).join('');
}

async function savePosologie() {
  if (!currentPatient) return;
  const medicament = document.getElementById('pos-medicament').value.trim();
  if (!medicament) return showToast('Le nom du médicament est obligatoire', 'error');

  const { error } = await sb.from('posologies').insert({
    patient_id: currentPatient.id,
    pharmacist_id: currentUser.id,
    medicament,
    dosage:           document.getElementById('pos-dosage').value || null,
    frequence:        document.getElementById('pos-frequence').value || null,
    horaires:         document.getElementById('pos-horaires').value || null,
    voie:             document.getElementById('pos-voie').value || null,
    duree:            document.getElementById('pos-duree').value || null,
    date_debut:       document.getElementById('pos-debut').value || null,
    date_fin:         document.getElementById('pos-fin').value || null,
    conditions_prise: document.getElementById('pos-conditions').value || null,
    effets_surveiller:document.getElementById('pos-effets').value || null,
    prescripteur:     document.getElementById('pos-prescripteur').value || null,
    statut:           document.getElementById('pos-statut').value || 'En cours',
    notes:            document.getElementById('pos-notes').value || null
  });

  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-posologie');
  clearForm(['pos-medicament','pos-dosage','pos-frequence','pos-horaires','pos-voie',
             'pos-duree','pos-debut','pos-fin','pos-conditions','pos-effets','pos-prescripteur','pos-notes']);
  showToast('Posologie enregistrée', 'success');
  loadPosologiesPatient(currentPatient.id);
}

async function deletePosologie(id) {
  if (!confirm('Supprimer cette posologie ?')) return;
  await sb.from('posologies').delete().eq('id', id);
  showToast('Posologie supprimée', 'success');
  loadPosologiesPatient(currentPatient.id);
}

// ────────────────────────────────────────────────
// PAGE POSOLOGIES GLOBALE (toutes les posologies
// de tous les patients du pharmacien)
// ────────────────────────────────────────────────

let allPosoGlobales = [];

async function loadPosologiesGlobales() {
  const el = document.getElementById('poso-global-list');
  if (!el) return;

  const { data, error } = await sb
    .from('posologies')
    .select('*, patients(name)')
    .eq('pharmacist_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>';
    return;
  }

  allPosoGlobales = data || [];
  updatePosoStats();
  renderPosologiesGlobales(allPosoGlobales);
}

function updatePosoStats() {
  const total    = allPosoGlobales.length;
  const enCours  = allPosoGlobales.filter(p => p.statut === 'En cours' || !p.statut).length;
  const surveill = allPosoGlobales.filter(p => p.statut === 'À surveiller').length;

  const statsEl = document.getElementById('poso-stats');
  if (!statsEl) return;
  statsEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Posologies totales</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--teal)">${enCours}</div><div class="stat-lbl">En cours</div></div>
      <div class="stat-card"><div class="stat-val" style="color:var(--amber)">${surveill}</div><div class="stat-lbl">À surveiller</div></div>
    </div>`;
}

function renderPosologiesGlobales(list) {
  const el = document.getElementById('poso-global-list');
  if (!el) return;

  if (!list.length) {
    el.innerHTML = `<div class="empty">
      <div class="empty-icon">💊</div>
      <div class="empty-title">Aucune posologie enregistrée</div>
      <div class="empty-sub">Les posologies sont ajoutées depuis le dossier de chaque patient</div>
    </div>`;
    return;
  }

  const statutBadge = s => {
    if (s === 'En cours')     return 'badge-ok';
    if (s === 'Terminé')      return 'badge-blue';
    if (s === 'Suspendu')     return 'badge-warn';
    if (s === 'À surveiller') return 'badge-danger';
    return 'badge-ok';
  };

  // Grouper par patient
  const byPatient = new Map();
  for (const p of list) {
    const pName = p.patients?.name || 'Patient inconnu';
    const pid   = p.patient_id;
    if (!byPatient.has(pid)) byPatient.set(pid, { name: pName, items: [] });
    byPatient.get(pid).items.push(p);
  }

  let html = '';
  for (const [pid, group] of byPatient) {
    html += `
      <div style="margin-bottom:24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--teal);color:#fff;
                      display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;flex-shrink:0">
            ${(group.name||'?').charAt(0).toUpperCase()}
          </div>
          <div style="font-size:15px;font-weight:600">${group.name}</div>
          <span class="badge badge-blue">${group.items.length} posologie${group.items.length>1?'s':''}</span>
          <button class="btn btn-ghost btn-sm" onclick="openPatient('${pid}')" style="margin-left:auto">Voir dossier →</button>
        </div>
        <div style="padding-left:42px">
          ${group.items.map(p => `
            <div class="ordo-item" style="margin-bottom:8px">
              <div class="ordo-top">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span style="font-size:14px;font-weight:600">${p.medicament}</span>
                  ${p.dosage ? `<span class="badge badge-blue" style="font-size:10px">${p.dosage}</span>` : ''}
                  ${p.frequence ? `<span style="font-size:12px;color:var(--text-muted)">${p.frequence}</span>` : ''}
                  ${p.horaires  ? `<span style="font-size:12px;color:var(--text-muted)">· ${p.horaires}</span>` : ''}
                </div>
                <span class="badge ${statutBadge(p.statut)}">${p.statut||'En cours'}</span>
              </div>
              ${p.effets_surveiller ? `
                <div style="margin-top:6px;padding:6px 10px;background:var(--amber-pale);border-radius:6px;font-size:12px;color:var(--amber)">
                  ⚠ ${p.effets_surveiller}
                </div>` : ''}
              ${p.voie || p.duree ? `
                <div style="margin-top:4px;font-size:11px;color:var(--text-muted)">
                  ${p.voie ? `Voie : ${p.voie}` : ''} ${p.duree ? `· Durée : ${p.duree}` : ''}
                </div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`;
  }
  el.innerHTML = html;
}

function filterPosologies(q) {
  q = q.toLowerCase();
  renderPosologiesGlobales(q ? allPosoGlobales.filter(p =>
    (p.medicament   || '').toLowerCase().includes(q) ||
    (p.patients?.name || '').toLowerCase().includes(q) ||
    (p.dosage       || '').toLowerCase().includes(q)
  ) : allPosoGlobales);
}
