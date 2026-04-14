// ordonnances.js — Dossier patient, chargement et sauvegarde des ordonnances

async function openPatient(id) {
  const p = allPatients.find(x => x.id == id);
  if (!p) return;
  currentPatient = p;
  const initials = (p.name||'?').charAt(0).toUpperCase();
  document.getElementById('det-avatar').textContent = initials;
  document.getElementById('det-name').textContent = p.name;
  document.getElementById('det-meta').textContent = [p.dob ? formatDate(p.dob) : null, p.mutuelle, p.telephone].filter(Boolean).join(' · ') || 'Aucune information';
  document.getElementById('det-info-grid').innerHTML = `
    <div class="info-item"><div class="info-label">Date de naissance</div><div class="info-value">${p.dob ? formatDate(p.dob) : '—'}</div></div>
    <div class="info-item"><div class="info-label">Mutuelle</div><div class="info-value">${p.mutuelle||'—'}</div></div>
    <div class="info-item"><div class="info-label">Pathologies</div><div class="info-value">${p.pathologies||'—'}</div></div>
    <div class="info-item"><div class="info-label">Allergies</div><div class="info-value" style="color:var(--red)">${p.allergies||'Aucune connue'}</div></div>
    <div class="info-item"><div class="info-label">Téléphone</div><div class="info-value">${p.telephone||'—'}</div></div>
    <div class="info-item"><div class="info-label">Notes</div><div class="info-value">${p.notes||'—'}</div></div>
  `;
  document.getElementById('det-interactions-list').innerHTML = p.allergies
    ? `<div class="ordo-item" style="background:var(--red-pale);border-color:var(--red)"><div style="font-size:13px;font-weight:600;color:var(--red)">⚠ Allergies connues</div><div style="font-size:12px;color:var(--text-muted);margin-top:4px">${p.allergies}</div></div>`
    : '<div class="empty"><div class="empty-sub">Aucune allergie ou interaction enregistrée</div></div>';
  showPage('patient-detail', null);
  loadOrdonnances(id);
}

async function loadOrdonnances(patientId) {
  const el = document.getElementById('det-ordos-list');
  const { data, error } = await sb.from('ordonnances').select('*').eq('patient_id', patientId).order('date', { ascending: false });
  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  if (!data.length) { el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Aucune ordonnance</div><div class="empty-sub">Cliquez sur "+ Ordonnance" pour en ajouter une</div></div>'; return; }
  el.innerHTML = data.map(o => `
    <div class="ordo-item">
      <div class="ordo-top">
        <div class="ordo-date">${formatDate(o.date)} — Dr. ${o.medecin||'—'}</div>
        <span class="badge ${o.statut==='Dispensé'?'badge-ok':o.statut==='En attente'?'badge-warn':'badge-blue'}">${o.statut}</span>
      </div>
      <div class="ordo-meds">${o.medicaments||'—'}</div>
      ${o.renouvellement ? `<div style="font-size:11px;color:var(--teal);margin-top:4px">Renouvellement : ${o.renouvellement}</div>` : ''}
      ${o.notes ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">${o.notes}</div>` : ''}
    </div>
  `).join('');
  // stat-ordos est géré globalement dans loadDashboard() — ne pas l'écraser ici
}

async function saveOrdonnance() {
  if (!currentPatient) return;
  const meds = document.getElementById('o-meds').value.trim();
  if (!meds) return showToast('Les médicaments sont obligatoires', 'error');
  const { error } = await sb.from('ordonnances').insert({
    patient_id: currentPatient.id,
    pharmacist_id: currentUser.id,
    medecin: document.getElementById('o-medecin').value || null,
    date: document.getElementById('o-date').value || new Date().toISOString().split('T')[0],
    medicaments: meds,
    renouvellement: document.getElementById('o-renouvellement').value || null,
    statut: document.getElementById('o-statut').value || 'Dispensé',
    notes: document.getElementById('o-notes').value || null
  });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-ordo');
  clearForm(['o-medecin','o-meds','o-notes']);
  showToast('Ordonnance enregistrée', 'success');
  loadOrdonnances(currentPatient.id);
  loadDashOrdos();
}
