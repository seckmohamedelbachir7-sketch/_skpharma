
// trash-auto.js — Vidage automatique de la corbeille
// Paramètre stocké en localStorage : pharmaref_trash_delay
// Valeurs : 3, 7, 10, 14, 30, 0 (jamais)

const TRASH_DELAY_KEY = 'pharmaref_trash_delay'; // en jours
const TRASH_LAST_KEY  = 'pharmaref_trash_last';  // timestamp dernière exécution

// Délais disponibles
const TRASH_OPTIONS = [
  { label: 'Jamais',    value: 0  },
  { label: '3 jours',  value: 3  },
  { label: '7 jours',  value: 7  },
  { label: '10 jours', value: 10 },
  { label: '14 jours', value: 14 },
  { label: '30 jours', value: 30 },
];

// ─── Lire / écrire le délai ───────────────────

function getTrashDelay() {
  const v = localStorage.getItem(TRASH_DELAY_KEY);
  return v !== null ? parseInt(v) : 30; // défaut : 30 jours
}

function setTrashDelay(days) {
  localStorage.setItem(TRASH_DELAY_KEY, String(days));
  updateTrashSettingsUI();
  if (days > 0) runAutoTrash(); // vérifier immédiatement après changement
}

// ─── Moteur principal ─────────────────────────

async function runAutoTrash() {
  const delay = getTrashDelay();
  if (delay === 0 || !currentUser) return; // vidage désactivé

  const now     = Date.now();
  const lastRun = parseInt(localStorage.getItem(TRASH_LAST_KEY) || '0');

  // Ne tourner qu'une fois par heure maximum
  if (now - lastRun < 3600 * 1000) return;
  localStorage.setItem(TRASH_LAST_KEY, String(now));

  // Calculer la date limite : tout ce qui est dans la corbeille depuis plus de X jours
  const cutoff = new Date(now - delay * 24 * 3600 * 1000).toISOString();

  const { data: toDelete } = await sb
    .from('patients')
    .select('id')
    .eq('pharmacist_id', currentUser.id)
    .eq('status', 'deleted')
    .lt('deleted_at', cutoff);

  if (!toDelete || !toDelete.length) return;

  // Supprimer les ordonnances puis les patients
  for (const p of toDelete) {
    await sb.from('ordonnances').delete().eq('patient_id', p.id);
    await sb.from('patients').delete().eq('id', p.id);
  }

  console.info(`[PharmaRef] Corbeille : ${toDelete.length} dossier(s) supprimé(s) automatiquement`);
  showToast(`🗑 Corbeille vidée automatiquement (${toDelete.length} dossier${toDelete.length > 1 ? 's' : ''})`, 'success');

  // Rafraîchir si on est sur la page corbeille
  const trashEl = document.getElementById('trash-list');
  if (trashEl) loadTrash();
  updateTrashBadge();
}

// Lance la vérification au démarrage + toutes les heures
function initAutoTrash() {
  runAutoTrash();
  setInterval(runAutoTrash, 3600 * 1000);
  updateTrashSettingsUI();
}

// ─── Badge corbeille (compteur dans nav) ──────

async function updateTrashBadge() {
  if (!currentUser) return;
  const { count } = await sb
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('pharmacist_id', currentUser.id)
    .eq('status', 'deleted');
  const badge = document.getElementById('trash-badge');
  if (badge) badge.textContent = count > 0 ? count : '';
}

// ─── UI des paramètres de vidage ─────────────

function updateTrashSettingsUI() {
  const current = getTrashDelay();
  const container = document.getElementById('trash-delay-options');
  if (!container) return;

  container.innerHTML = TRASH_OPTIONS.map(opt => `
    <button
      class="trash-delay-btn ${opt.value === current ? 'active' : ''}"
      onclick="setTrashDelay(${opt.value})">
      ${opt.label}
    </button>
  `).join('');

  // Afficher le résumé
  const summary = document.getElementById('trash-delay-summary');
  if (summary) {
    summary.textContent = current === 0
      ? 'Vidage automatique désactivé.'
      : `La corbeille se vide automatiquement après ${current} jour${current > 1 ? 's' : ''}.`;
  }
}

// Vider manuellement tout de suite
async function emptyTrashNow() {
  if (!confirm('Vider la corbeille maintenant ? Tous les dossiers seront supprimés définitivement.')) return;

  const { data: toDelete } = await sb
    .from('patients')
    .select('id')
    .eq('pharmacist_id', currentUser.id)
    .eq('status', 'deleted');

  if (!toDelete || !toDelete.length) return showToast('La corbeille est déjà vide', 'success');

  for (const p of toDelete) {
    await sb.from('ordonnances').delete().eq('patient_id', p.id);
    await sb.from('patients').delete().eq('id', p.id);
  }

  showToast(`Corbeille vidée — ${toDelete.length} dossier(s) supprimé(s)`, 'success');
  loadTrash();
  updateTrashBadge();
  loadDashboard();
}
// ─── Charger la corbeille ─────────────────────

async function loadTrash() {
  if (!currentUser) return;
  const { data } = await sb
    .from('patients')
    .select('*')
    .eq('pharmacist_id', currentUser.id)
    .eq('status', 'deleted')
    .order('deleted_at', { ascending: false });

  const list = data || [];
  document.getElementById('trash-count').textContent = list.length;

  const el = document.getElementById('trash-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🗑</div><div class="empty-title">Corbeille vide</div><div class="empty-sub">Aucun dossier supprimé</div></div>`;
    return;
  }

  el.innerHTML = list.map(p => `
    <div class="patient-card">
      <div class="p-avatar">${(p.name||'?').charAt(0).toUpperCase()}</div>
      <div class="p-name">${p.name}</div>
      <div class="p-meta">Supprimé le ${formatDate(p.deleted_at)}</div>
      <div class="p-actions">
        <button class="btn btn-ghost btn-sm" onclick="restorePatient('${p.id}')">♻️ Restaurer</button>
        <button class="btn btn-danger btn-sm" onclick="openHardDelete('${p.id}','${p.name}',${p.dob ? `'${p.dob}'` : 'null'})">🗑 Supprimer définitivement</button>
      </div>
    </div>
  `).join('');
}

// ─── Charger l'archive ────────────────────────

async function loadArchive() {
  if (!currentUser) return;
  const { data } = await sb
    .from('patients')
    .select('*')
    .eq('pharmacist_id', currentUser.id)
    .eq('status', 'archived')
    .order('created_at', { ascending: false });

  const list = data || [];
  document.getElementById('archive-count').textContent = list.length;

  const el = document.getElementById('archive-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📦</div><div class="empty-title">Archive vide</div><div class="empty-sub">Aucun dossier archivé</div></div>`;
    return;
  }

  el.innerHTML = list.map(p => `
    <div class="patient-card">
      <div class="p-avatar">${(p.name||'?').charAt(0).toUpperCase()}</div>
      <div class="p-name">${p.name}</div>
      <div class="p-meta">${p.dob ? formatDate(p.dob) : '—'} · ${p.mutuelle || 'Sans mutuelle'}</div>
      <div class="p-tags">
        ${p.pathologies ? p.pathologies.split(',').map(t => `<span class="badge badge-blue">${t.trim()}</span>`).join('') : ''}
      </div>
      <div class="p-actions">
        <button class="btn btn-ghost btn-sm" onclick="restorePatient('${p.id}')">♻️ Restaurer</button>
        <button class="btn btn-danger btn-sm" onclick="openTrashFromArchive('${p.id}','${p.name}',${p.dob ? `'${p.dob}'` : 'null'})">🗑 Corbeille</button>
      </div>
    </div>
  `).join('');
}

// ─── Restaurer un patient (corbeille ou archive → actif) ──

async function restorePatient(id) {
  await sb.from('patients').update({
    status: 'active',
    deleted_at: null
  }).eq('id', id);
  showToast('Dossier restauré avec succès', 'success');
  loadTrash();
  loadArchive();
  updateTrashBadge();
  loadPatients();
}

// ─── Ouvrir modal archivage ───────────────────

function openArchiveModal(id, name, dob) {
  document.getElementById('confirm-archive-name').textContent = name;
  document.getElementById('confirm-archive-meta').textContent = dob ? formatDate(dob) : '—';
  document.getElementById('confirm-archive-btn').onclick = () => confirmArchive(id);
  openModal('confirm-archive');
}

async function confirmArchive(id) {
  await sb.from('patients').update({ status: 'archived' }).eq('id', id);
  closeModal('confirm-archive');
  showToast('Dossier archivé', 'success');
  loadPatients();
  loadArchive();
}

// ─── Ouvrir modal corbeille ───────────────────

function openTrashFromArchive(id, name, dob) {
  document.getElementById('confirm-trash-name').textContent = name;
  document.getElementById('confirm-trash-meta').textContent = dob ? formatDate(dob) : '—';
  document.getElementById('confirm-trash-btn').onclick = () => confirmTrash(id);
  openModal('confirm-trash');
}

async function confirmTrash(id) {
  await sb.from('patients').update({
    status: 'deleted',
    deleted_at: new Date().toISOString()
  }).eq('id', id);
  closeModal('confirm-trash');
  showToast('Dossier déplacé dans la corbeille', 'success');
  loadPatients();
  loadTrash();
  loadArchive();
  updateTrashBadge();
}

// ─── Ouvrir modal suppression définitive ─────

function openHardDelete(id, name, dob) {
  document.getElementById('confirm-harddelete-name').textContent = name;
  document.getElementById('confirm-harddelete-meta').textContent = dob ? formatDate(dob) : '—';
  document.getElementById('confirm-harddelete-btn').onclick = () => confirmHardDelete(id);
  openModal('confirm-harddelete');
}

async function confirmHardDelete(id) {
  await sb.from('ordonnances').delete().eq('patient_id', id);
  await sb.from('patients').delete().eq('id', id);
  closeModal('confirm-harddelete');
  showToast('Dossier supprimé définitivement', 'success');
  loadTrash();
  updateTrashBadge();
  loadDashboard();
}
