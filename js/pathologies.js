// pathologies.js — Gestion des pathologies (dossier patient + base globale)

let allPathologiesGlobales = [];

// ---- PATHOLOGIES DU DOSSIER PATIENT ----
async function loadPathoPatient(patientId) {
  const el = document.getElementById('det-patho-list');
  if (!el) return;
  const { data, error } = await sb.from('patient_pathologies').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  const actions = `<div style="margin-bottom:14px"><button class="btn btn-primary btn-sm" onclick="openModal('add-patho-patient')">+ Ajouter une pathologie</button></div>`;
  if (!data.length) {
    el.innerHTML = actions + '<div class="empty"><div class="empty-icon">🩺</div><div class="empty-title">Aucune pathologie enregistrée</div><div class="empty-sub">Ajoutez les antécédents et maladies chroniques du patient</div></div>';
    return;
  }
  const severiteBadge = s => {
    if (s === 'Sévère')    return 'badge-danger';
    if (s === 'Modérée')   return 'badge-warn';
    if (s === 'Chronique') return 'badge-blue';
    return 'badge-ok';
  };
  el.innerHTML = actions + data.map(p => `
    <div class="ordo-item">
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
  `).join('');
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
  renderPathologiesGlobales(allPathologiesGlobales);
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
