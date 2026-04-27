// ordonnances.js — Dossier patient complet (v6 + final fusionnés)

// ─────────────────────────────────────────────
//  OUVERTURE DU DOSSIER PATIENT
// ─────────────────────────────────────────────

async function openPatient(id) {
  const p = allPatients.find(x => x.id == id);
  if (!p) return;
  currentPatient = p;
  document.getElementById('det-avatar').textContent = (p.name||'?').charAt(0).toUpperCase();
  document.getElementById('det-name').textContent   = p.name;
  document.getElementById('det-meta').textContent   =
    [p.dob ? formatDate(p.dob) : null, p.mutuelle, p.telephone].filter(Boolean).join(' · ') || 'Aucune information';
  renderPatientInfo(p);
  renderInteractions(p);
  showPage('patient-detail', null);
  loadOrdonnances(id);
}

// ─────────────────────────────────────────────
//  ONGLET INFORMATIONS
// ─────────────────────────────────────────────

function renderPatientInfo(p) {
  const createdAt = p.created_at
    ? `<div class="info-item"><div class="info-label">Dossier créé le</div><div class="info-value">${formatDateTime(p.created_at)}</div></div>`
    : '';
  document.getElementById('det-info-grid').innerHTML = `
    <div class="info-item"><div class="info-label">Date de naissance</div><div class="info-value">${p.dob ? formatDate(p.dob) : '—'}</div></div>
    <div class="info-item"><div class="info-label">Mutuelle</div><div class="info-value">${p.mutuelle||'—'}</div></div>
    <div class="info-item"><div class="info-label">Pathologies</div><div class="info-value">${p.pathologies||'—'}</div></div>
    <div class="info-item"><div class="info-label">Allergies</div><div class="info-value" style="color:var(--red)">${p.allergies||'Aucune connue'}</div></div>
    <div class="info-item"><div class="info-label">Téléphone</div><div class="info-value">${p.telephone||'—'}</div></div>
    <div class="info-item"><div class="info-label">Notes</div><div class="info-value">${p.notes||'—'}</div></div>
    ${createdAt}
    <div style="grid-column:1/-1;margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" onclick="openEditPatient()">✏️ Modifier le dossier</button>
      <button class="btn btn-ghost btn-sm" onclick="scanOrdonnance()">📷 Scanner ordonnance</button>
      <button class="btn btn-ghost btn-sm" style="color:var(--amber);border-color:var(--amber-pale);background:var(--amber-pale)" onclick="archivePatient('${p.id}')">📦 Archiver</button>
      <button class="btn btn-danger btn-sm" onclick="softDeletePatient('${p.id}')">🗑 Mettre à la corbeille</button>
    </div>`;
}

function openEditPatient() {
  const p = currentPatient;
  document.getElementById('ep-name').value      = p.name        || '';
  document.getElementById('ep-dob').value       = p.dob         || '';
  document.getElementById('ep-mutuelle').value  = p.mutuelle    || '';
  document.getElementById('ep-patho').value     = p.pathologies || '';
  document.getElementById('ep-allergies').value = p.allergies   || '';
  document.getElementById('ep-tel').value       = p.telephone   || '';
  document.getElementById('ep-notes').value     = p.notes       || '';
  openModal('edit-patient');
}

async function saveEditPatient() {
  const name = document.getElementById('ep-name').value.trim();
  if (!name) return showToast('Le nom est obligatoire', 'error');
  const updates = {
    name,
    dob:         document.getElementById('ep-dob').value        || null,
    mutuelle:    document.getElementById('ep-mutuelle').value    || null,
    pathologies: document.getElementById('ep-patho').value       || null,
    allergies:   document.getElementById('ep-allergies').value   || null,
    telephone:   document.getElementById('ep-tel').value         || null,
    notes:       document.getElementById('ep-notes').value       || null,
  };
  const { error } = await sb.from('patients').update(updates).eq('id', currentPatient.id);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  Object.assign(currentPatient, updates);
  const idx = allPatients.findIndex(x => x.id === currentPatient.id);
  if (idx !== -1) allPatients[idx] = { ...allPatients[idx], ...updates };
  closeModal('edit-patient');
  showToast('Dossier mis à jour', 'success');
  document.getElementById('det-name').textContent = currentPatient.name;
  document.getElementById('det-meta').textContent =
    [currentPatient.dob ? formatDate(currentPatient.dob) : null,
     currentPatient.mutuelle, currentPatient.telephone].filter(Boolean).join(' · ') || 'Aucune information';
  renderPatientInfo(currentPatient);
  renderInteractions(currentPatient);
  loadDashboard();
}

// ─────────────────────────────────────────────
//  ONGLET INTERACTIONS / ALLERGIES
// ─────────────────────────────────────────────

function renderInteractions(p) {
  const el = document.getElementById('det-interactions-list');
  if (!el) return;
  const items = (p.allergies || '').split(',').map(a => a.trim()).filter(Boolean);
  el.innerHTML = `
    <div class="interaction-header">
      <span style="font-size:13px;font-weight:600;color:var(--text)">
        ${items.length ? `${items.length} allergie${items.length > 1 ? 's' : ''} enregistrée${items.length > 1 ? 's' : ''}` : 'Aucune allergie enregistrée'}
      </span>
    </div>
    ${items.map((allergie, i) => `
      <div class="interaction-item">
        <div class="interaction-icon">⚠️</div>
        <div class="interaction-body">
          <div class="interaction-name">${allergie}</div>
          <div class="interaction-type">Allergie connue</div>
        </div>
        <button class="btn-icon btn-icon-danger" onclick="deleteInteraction(${i})" title="Supprimer">✕</button>
      </div>
    `).join('')}
    <div class="interaction-add-box">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px">+ Ajouter une allergie</div>
      <div style="display:flex;gap:8px">
        <input class="form-input" id="new-allergie-input" placeholder="Ex : Pénicilline, Latex…"
          onkeydown="if(event.key==='Enter') addInteraction()"
          style="flex:1;font-size:13px;padding:8px 12px"/>
        <button class="btn btn-primary btn-sm" onclick="addInteraction()">Ajouter</button>
      </div>
    </div>`;
}

async function addInteraction() {
  const input = document.getElementById('new-allergie-input');
  const val   = (input.value || '').trim();
  if (!val) return showToast('Saisissez une allergie', 'error');
  const existing = (currentPatient.allergies || '').split(',').map(a => a.trim()).filter(Boolean);
  const newItems = val.split(',').map(a => a.trim()).filter(Boolean);
  const newAllergies = [...existing, ...newItems].join(', ');
  const { error } = await sb.from('patients').update({ allergies: newAllergies }).eq('id', currentPatient.id);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  currentPatient.allergies = newAllergies;
  const idx = allPatients.findIndex(x => x.id === currentPatient.id);
  if (idx !== -1) allPatients[idx].allergies = newAllergies;
  input.value = '';
  showToast('Allergie ajoutée', 'success');
  renderInteractions(currentPatient);
  renderPatientInfo(currentPatient);
  loadDashboard();
}

async function deleteInteraction(index) {
  if (!confirm('Supprimer cette allergie ?')) return;
  const items = (currentPatient.allergies || '').split(',').map(a => a.trim()).filter(Boolean);
  items.splice(index, 1);
  const newAllergies = items.length ? items.join(', ') : null;
  const { error } = await sb.from('patients').update({ allergies: newAllergies }).eq('id', currentPatient.id);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  currentPatient.allergies = newAllergies;
  const idx = allPatients.findIndex(x => x.id === currentPatient.id);
  if (idx !== -1) allPatients[idx].allergies = newAllergies;
  showToast('Allergie supprimée', 'success');
  renderInteractions(currentPatient);
  renderPatientInfo(currentPatient);
  loadDashboard();
}

// ─────────────────────────────────────────────
//  CORBEILLE & ARCHIVE (soft delete) — v6
// ─────────────────────────────────────────────
let _pendingPatientId = null;

function _getPatientLabel(id) {
  const p = allPatients.find(x => x.id == id) || (currentPatient && currentPatient.id == id ? currentPatient : null);
  if (!p) return { name: 'Patient', meta: '' };
  const meta = [p.dob ? formatDate(p.dob) : null, p.mutuelle, p.telephone].filter(Boolean).join(' · ') || 'Aucune information';
  return { name: p.name || 'Patient', meta };
}

function softDeletePatient(id) {
  _pendingPatientId = id;
  const { name, meta } = _getPatientLabel(id);
  document.getElementById('confirm-trash-name').textContent = name;
  document.getElementById('confirm-trash-meta').textContent = meta;
  openModal('confirm-trash');
}

async function confirmTrash() {
  const id = _pendingPatientId;
  if (!id) return;
  const btn = document.getElementById('confirm-trash-btn');
  btn.disabled = true; btn.textContent = 'En cours…';
  const { error } = await sb.from('patients').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', id);
  btn.disabled = false; btn.textContent = '🗑 Mettre à la corbeille';
  closeModal('confirm-trash');
  if (error) return showToast('Erreur : ' + error.message, 'error');
  updateTrashBadge();
  showToast('Dossier déplacé vers la corbeille', 'success');
  _pendingPatientId = null;
  const navPatients = document.querySelector('.nav-link[onclick*="patients"]');
  showPage('patients', navPatients);
  loadPatients();
  loadDashboard();
}

function archivePatient(id) {
  _pendingPatientId = id;
  const { name, meta } = _getPatientLabel(id);
  document.getElementById('confirm-archive-name').textContent = name;
  document.getElementById('confirm-archive-meta').textContent = meta;
  openModal('confirm-archive');
}

async function confirmArchive() {
  const id = _pendingPatientId;
  if (!id) return;
  const btn = document.getElementById('confirm-archive-btn');
  btn.disabled = true; btn.textContent = 'En cours…';
  const { error } = await sb.from('patients').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', id);
  btn.disabled = false; btn.textContent = '📦 Archiver le dossier';
  closeModal('confirm-archive');
  if (error) return showToast('Erreur : ' + error.message, 'error');
  showToast('Dossier archivé avec succès', 'success');
  _pendingPatientId = null;
  const navPatients = document.querySelector('.nav-link[onclick*="patients"]');
  showPage('patients', navPatients);
  loadPatients();
  loadDashboard();
}

async function restorePatient(id) {
  const { error } = await sb.from('patients').update({ status: 'active', deleted_at: null, archived_at: null }).eq('id', id);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  updateTrashBadge();
  showToast('Dossier restauré avec succès ✓', 'success');
  loadTrash();
  loadArchive();
  loadPatients();
  loadDashboard();
}

function hardDeletePatient(id, name) {
  _pendingPatientId = id;
  document.getElementById('confirm-harddelete-name').textContent = name || 'Patient';
  document.getElementById('confirm-harddelete-meta').textContent = 'Toutes les ordonnances associées seront supprimées.';
  openModal('confirm-harddelete');
}

async function confirmHardDelete() {
  const id = _pendingPatientId;
  if (!id) return;
  const btn = document.getElementById('confirm-harddelete-btn');
  btn.disabled = true; btn.textContent = 'Suppression…';
  await sb.from('ordonnances').delete().eq('patient_id', id);
  const { error } = await sb.from('patients').delete().eq('id', id);
  btn.disabled = false; btn.textContent = 'Supprimer définitivement';
  closeModal('confirm-harddelete');
  if (error) return showToast('Erreur : ' + error.message, 'error');
  updateTrashBadge();
  showToast('Dossier supprimé définitivement', 'success');
  _pendingPatientId = null;
  loadTrash();
  loadDashboard();
}

// ─────────────────────────────────────────────
//  CHARGEMENT CORBEILLE
// ─────────────────────────────────────────────
async function loadTrash() {
  const el = document.getElementById('trash-list');
  if (!el) return;
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const { data, error } = await sb.from('patients')
    .select('*').eq('pharmacist_id', currentUser.id).eq('status', 'deleted')
    .order('deleted_at', { ascending: false });
  const count = (data||[]).length;
  document.getElementById('trash-count').textContent = count;
  if (error || !count) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🗑</div><div class="empty-title">Corbeille vide</div><div class="empty-sub">Les dossiers supprimés apparaîtront ici</div></div>`;
    return;
  }
  el.innerHTML = data.map(p => `
    <div class="trash-item">
      <div class="trash-avatar">${(p.name||'?').charAt(0).toUpperCase()}</div>
      <div class="trash-info">
        <div class="trash-name">${p.name}</div>
        <div class="trash-meta">Supprimé le ${formatDateTime(p.deleted_at)}${p.created_at ? ` · Créé le ${formatDate(p.created_at)}` : ''}</div>
        ${p.pathologies ? `<div class="trash-meta">${p.pathologies}</div>` : ''}
      </div>
      <div class="trash-actions">
        <button class="btn btn-ghost btn-sm" onclick="restorePatient('${p.id}')">↩ Restaurer</button>
        <button class="btn btn-danger btn-sm" onclick="hardDeletePatient('${p.id}', ${JSON.stringify(p.name||'Patient')})">Supprimer définitivement</button>
      </div>
    </div>`).join('');
}

// ─────────────────────────────────────────────
//  CHARGEMENT ARCHIVE
// ─────────────────────────────────────────────
async function loadArchive() {
  const el = document.getElementById('archive-list');
  if (!el) return;
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const { data, error } = await sb.from('patients')
    .select('*').eq('pharmacist_id', currentUser.id).eq('status', 'archived')
    .order('archived_at', { ascending: false });
  const count = (data||[]).length;
  document.getElementById('archive-count').textContent = count;
  if (error || !count) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📦</div><div class="empty-title">Archive vide</div><div class="empty-sub">Les dossiers archivés apparaîtront ici</div></div>`;
    return;
  }
  el.innerHTML = data.map(p => `
    <div class="trash-item">
      <div class="trash-avatar" style="background:var(--amber-pale);color:var(--amber)">${(p.name||'?').charAt(0).toUpperCase()}</div>
      <div class="trash-info">
        <div class="trash-name">${p.name}</div>
        <div class="trash-meta">Archivé le ${formatDateTime(p.archived_at)}${p.created_at ? ` · Dossier créé le ${formatDate(p.created_at)}` : ''}</div>
        ${p.pathologies ? `<div class="trash-meta">${p.pathologies}</div>` : ''}
        ${p.allergies ? `<div class="trash-meta" style="color:var(--red)">⚠ ${p.allergies}</div>` : ''}
      </div>
      <div class="trash-actions">
        <button class="btn btn-ghost btn-sm" onclick="restorePatient('${p.id}')">↩ Restaurer</button>
        <button class="btn btn-danger btn-sm" onclick="hardDeletePatient('${p.id}', ${JSON.stringify(p.name||'Patient')})">Supprimer définitivement</button>
      </div>
    </div>`).join('');
}

// ─────────────────────────────────────────────
//  ONGLET ORDONNANCES
// ─────────────────────────────────────────────
async function loadOrdonnances(patientId) {
  const el = document.getElementById('det-ordos-list');
  el.innerHTML = '<div class="loading">Chargement…</div>';
  const { data, error } = await sb.from('ordonnances').select('*').eq('patient_id', patientId).order('date', { ascending: false });
  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  if (!data.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Aucune ordonnance</div><div class="empty-sub">Cliquez sur "+ Ordonnance" pour en ajouter une</div></div>`;
    return;
  }
  el.innerHTML = data.map(o => renderOrdoItem(o)).join('');
}

function renderOrdoItem(o) {
  const badgeClass = o.statut === 'Dispensé' ? 'badge-ok' : o.statut === 'En attente' ? 'badge-warn' : 'badge-blue';
  const createdLine = o.created_at
    ? `<div class="ordo-created">Créée le ${formatDateTime(o.created_at)}</div>`
    : '';
  return `
    <div class="ordo-item" id="ordo-${o.id}">
      <div class="ordo-top">
        <div>
          <div class="ordo-date">${formatDate(o.date)} — Dr. ${o.medecin||'—'}</div>
          ${createdLine}
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="badge ${badgeClass}">${o.statut}</span>
          <button class="btn-icon btn-icon-edit"   onclick="openEditOrdo('${o.id}')" title="Modifier">✏️</button>
          <button class="btn-icon btn-icon-danger"  onclick="deleteOrdonnance('${o.id}')" title="Supprimer">🗑️</button>
        </div>
      </div>
      <div class="ordo-meds">${o.medicaments||'—'}</div>
      ${o.renouvellement ? `<div class="ordo-tag ordo-tag-teal">↻ Renouvellement : ${o.renouvellement}</div>` : ''}
      ${o.notes ? `<div class="ordo-tag ordo-tag-gray">${o.notes}</div>` : ''}
    </div>`;
}

// ─────────────────────────────────────────────
//  ORDONNANCE — ajout
// ─────────────────────────────────────────────
async function saveOrdonnance() {
  if (!currentPatient) return;
  const meds = document.getElementById('o-meds').value.trim();
  if (!meds) return showToast('Les médicaments sont obligatoires', 'error');
  const { error } = await sb.from('ordonnances').insert({
    patient_id:     currentPatient.id,
    pharmacist_id:  currentUser.id,
    medecin:        document.getElementById('o-medecin').value        || null,
    date:           document.getElementById('o-date').value           || new Date().toISOString().split('T')[0],
    medicaments:    meds,
    renouvellement: document.getElementById('o-renouvellement').value || null,
    statut:         document.getElementById('o-statut').value         || 'Dispensé',
    notes:          document.getElementById('o-notes').value          || null,
  });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-ordo');
  clearForm(['o-medecin','o-meds','o-notes']);
  showToast('Ordonnance enregistrée', 'success');
  loadOrdonnances(currentPatient.id);
  loadDashboard();
}

// ─────────────────────────────────────────────
//  ORDONNANCE — édition
// ─────────────────────────────────────────────
let currentOrdoId = null;

async function openEditOrdo(ordoId) {
  currentOrdoId = ordoId;
  const { data, error } = await sb.from('ordonnances').select('*').eq('id', ordoId).single();
  if (error || !data) return showToast("Impossible de charger l'ordonnance", 'error');
  document.getElementById('eo-medecin').value        = data.medecin        || '';
  document.getElementById('eo-date').value           = data.date           || '';
  document.getElementById('eo-meds').value           = data.medicaments    || '';
  document.getElementById('eo-renouvellement').value = data.renouvellement || '';
  document.getElementById('eo-statut').value         = data.statut         || 'Dispensé';
  document.getElementById('eo-notes').value          = data.notes          || '';
  openModal('edit-ordo');
}

async function saveEditOrdo() {
  if (!currentOrdoId) return;
  const meds = document.getElementById('eo-meds').value.trim();
  if (!meds) return showToast('Les médicaments sont obligatoires', 'error');
  const { error } = await sb.from('ordonnances').update({
    medecin:        document.getElementById('eo-medecin').value        || null,
    date:           document.getElementById('eo-date').value           || null,
    medicaments:    meds,
    renouvellement: document.getElementById('eo-renouvellement').value || null,
    statut:         document.getElementById('eo-statut').value         || 'Dispensé',
    notes:          document.getElementById('eo-notes').value          || null,
  }).eq('id', currentOrdoId);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('edit-ordo');
  currentOrdoId = null;
  showToast('Ordonnance modifiée', 'success');
  loadOrdonnances(currentPatient.id);
  loadDashboard();
}

// ─────────────────────────────────────────────
//  ORDONNANCE — suppression
// ─────────────────────────────────────────────
async function deleteOrdonnance(ordoId) {
  if (!confirm('Supprimer cette ordonnance définitivement ?')) return;
  const { error } = await sb.from('ordonnances').delete().eq('id', ordoId);
  if (error) return showToast('Erreur : ' + error.message, 'error');
  showToast('Ordonnance supprimée', 'success');
  loadOrdonnances(currentPatient.id);
  loadDashboard();
}
