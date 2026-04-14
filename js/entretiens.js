// entretiens.js — Entretiens pharmaceutiques (création, suivi, facturation)

let allEntretiens = [];

async function loadEntretiens() {
  const el = document.getElementById('entretien-list');
  if (!el) return;

  // Peupler la datalist patients
  const dl = document.getElementById('ent-patients-list');
  if (dl) dl.innerHTML = allPatients.map(p => `<option value="${p.name}">`).join('');

  const { data, error } = await sb.from('entretiens')
    .select('*')
    .eq('pharmacist_id', currentUser.id)
    .order('date', { ascending: false });

  if (error) { el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>'; return; }
  allEntretiens = data || [];
  renderStats();
  renderEntretiens(allEntretiens);
}

function renderStats() {
  const el = document.getElementById('entretien-stats');
  if (!el) return;
  const total     = allEntretiens.length;
  const factures  = allEntretiens.filter(e => e.facturation && e.facturation !== 'Non facturé' && e.facturation !== 'Non facturable');
  const montant   = factures.reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
  const ceМois    = allEntretiens.filter(e => {
    const now = new Date(); const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">Entretiens total</div></div>
      <div class="stat-card"><div class="stat-val">${ceМois}</div><div class="stat-lbl">Ce mois-ci</div></div>
      <div class="stat-card"><div class="stat-val">${montant.toFixed(2)} €</div><div class="stat-lbl">Facturé total</div></div>
    </div>`;
}

function renderEntretiens(list) {
  const el = document.getElementById('entretien-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🤝</div><div class="empty-title">Aucun entretien enregistré</div><div class="empty-sub">Les entretiens pharmaceutiques sont des actes remboursables — commencez à les tracer</div></div>`;
    return;
  }
  const factBadge = f => {
    if (f === 'Facturé Assurance Maladie' || f === 'Facturé mutuelle') return 'badge-ok';
    if (f === 'Non facturé') return 'badge-warn';
    return 'badge-blue';
  };
  el.innerHTML = list.map(e => `
    <div class="card" style="margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            <div style="font-size:14px;font-weight:600">${e.patient_nom||'Patient inconnu'}</div>
            <span class="badge badge-blue" style="font-size:10px">${e.type||'—'}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">
            ${formatDate(e.date)} · ${e.duree||30} min
          </div>
          ${e.notes ? `<div style="font-size:12px;color:var(--text);margin-bottom:8px">${e.notes}</div>` : ''}
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span class="badge ${factBadge(e.facturation)}">${e.facturation||'Non facturé'}</span>
            ${e.montant ? `<span style="font-size:12px;font-weight:600;color:var(--teal)">${parseFloat(e.montant).toFixed(2)} €</span>` : ''}
            ${e.prochain_entretien ? `<span style="font-size:11px;color:var(--text-muted)">Prochain : ${formatDate(e.prochain_entretien)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteEntretien('${e.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

function filterEntretiens(q) {
  q = q.toLowerCase();
  renderEntretiens(q ? allEntretiens.filter(e =>
    (e.patient_nom||'').toLowerCase().includes(q) ||
    (e.type||'').toLowerCase().includes(q)
  ) : allEntretiens);
}

async function saveEntretien() {
  const patientNom = document.getElementById('ent-patient').value.trim();
  const type       = document.getElementById('ent-type').value;
  const date       = document.getElementById('ent-date').value;
  if (!patientNom || !type || !date) return showToast('Patient, type et date sont obligatoires', 'error');

  const { error } = await sb.from('entretiens').insert({
    pharmacist_id: currentUser.id,
    patient_nom: patientNom,
    type,
    date,
    duree: parseInt(document.getElementById('ent-duree').value) || 30,
    notes: document.getElementById('ent-notes').value || null,
    facturation: document.getElementById('ent-facturation').value || 'Non facturé',
    montant: parseFloat(document.getElementById('ent-montant').value) || null,
    prochain_entretien: document.getElementById('ent-prochain').value || null
  });
  if (error) return showToast('Erreur : ' + error.message, 'error');
  closeModal('add-entretien');
  clearForm(['ent-patient','ent-type','ent-notes','ent-montant','ent-prochain']);
  showToast('Entretien enregistré', 'success');
  loadEntretiens();
}

async function deleteEntretien(id) {
  if (!confirm('Supprimer cet entretien ?')) return;
  await sb.from('entretiens').delete().eq('id', id);
  showToast('Entretien supprimé', 'success');
  loadEntretiens();
}
