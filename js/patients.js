// patients.js — Chargement, rendu, filtrage, ajout, suppression des patients

async function loadPatients() {
  const { data, error } = await sb.from('patients').select('*').eq('pharmacist_id', currentUser.id).order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  allPatients = data || [];
  document.getElementById('stat-patients').textContent = allPatients.length;
  renderPatients(allPatients);
  renderDashPatients(allPatients.slice(0, 5));
}

function renderPatients(list) {
  const grid = document.getElementById('patient-grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">👤</div><div class="empty-title">Aucun patient enregistré</div><div class="empty-sub">Cliquez sur "+ Nouveau patient" pour commencer</div></div>`;
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="patient-card" onclick="openPatient('${p.id}')">
      <div class="p-avatar">${(p.name||'?').charAt(0).toUpperCase()}</div>
      <div class="p-name">${p.name}</div>
      <div class="p-meta">${p.dob ? formatDate(p.dob) : '—'} · ${p.mutuelle || 'Sans mutuelle'}</div>
      <div class="p-tags">
        ${p.pathologies ? p.pathologies.split(',').map(t => `<span class="badge badge-blue">${t.trim()}</span>`).join('') : ''}
        ${p.allergies ? `<span class="badge badge-danger">⚠ ${p.allergies.split(',')[0].trim()}</span>` : ''}
      </div>
      <div class="p-actions">
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openPatient('${p.id}')">Voir dossier</button>
        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deletePatient('${p.id}')">Supprimer</button>
      </div>
    </div>
  `).join('');
}

function renderDashPatients(list) {
  const el = document.getElementById('dash-patients-list');
  if (!list.length) { el.innerHTML = '<div class="empty"><div class="empty-sub">Aucun patient enregistré</div></div>'; return; }
  el.innerHTML = `<table class="table"><thead><tr><th>Nom</th><th>Mutuelle</th><th>Pathologie</th></tr></thead><tbody>
    ${list.map(p => `<tr onclick="openPatient('${p.id}')" style="cursor:pointer"><td>${p.name}</td><td>${p.mutuelle||'—'}</td><td>${p.pathologies ? p.pathologies.split(',')[0].trim() : '—'}</td></tr>`).join('')}
  </tbody></table>`;
}

function filterPatients(q) {
  q = q.toLowerCase();
  const filtered = q ? allPatients.filter(p => (p.name||'').toLowerCase().includes(q) || (p.pathologies||'').toLowerCase().includes(q)) : allPatients;
  renderPatients(filtered);
}

async function savePatient() {
  const name = document.getElementById('p-name').value.trim();
  if (!name) return showToast('Le nom est obligatoire', 'error');
  const { error } = await sb.from('patients').insert({
    pharmacist_id: currentUser.id,
    name, dob: document.getElementById('p-dob').value || null,
    mutuelle: document.getElementById('p-mutuelle').value || null,
    pathologies: document.getElementById('p-patho').value || null,
    allergies: document.getElementById('p-allergies').value || null,
    telephone: document.getElementById('p-tel').value || null,
    notes: document.getElementById('p-notes').value || null
  });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-patient');
  clearForm(['p-name','p-dob','p-mutuelle','p-patho','p-allergies','p-tel','p-notes']);
  showToast('Patient enregistré avec succès', 'success');
  loadPatients();
  loadDashboard();
}

async function deletePatient(id) {
  if (!confirm('Supprimer ce patient et toutes ses ordonnances ?')) return;
  await sb.from('ordonnances').delete().eq('patient_id', id);
  await sb.from('patients').delete().eq('id', id);
  showToast('Patient supprimé', 'success');
  loadPatients();
  loadDashboard();
}

// ---- PATIENT DETAIL ----
