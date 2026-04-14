// dashboard.js — Tableau de bord (stats, dernières ordonnances)

async function loadDashOrdos() {
  const { data } = await sb.from('ordonnances').select('*, patients(name)').eq('pharmacist_id', currentUser.id).order('date', { ascending: false }).limit(5);
  const el = document.getElementById('dash-ordos-list');
  if (!data || !data.length) { el.innerHTML = '<div class="empty"><div class="empty-sub">Aucune ordonnance enregistrée</div></div>'; return; }
  el.innerHTML = `<table class="table"><thead><tr><th>Patient</th><th>Médicaments</th><th>Statut</th></tr></thead><tbody>
    ${data.map(o => `<tr><td>${o.patients?.name||'—'}</td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.medicaments}</td><td><span class="badge ${o.statut==='Dispensé'?'badge-ok':o.statut==='En attente'?'badge-warn':'badge-blue'}">${o.statut}</span></td></tr>`).join('')}
  </tbody></table>`;
}

async function loadDashboard() {
  // Stat 1 : nombre de patients vus aujourd'hui (créés aujourd'hui)
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const { count: countToday } = await sb
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacist_id', currentUser.id)
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');
  document.getElementById('stat-today').textContent = countToday ?? 0;

  // Stat 2 : nombre d'ordonnances créées ce mois-ci (tous patients confondus)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const { count: countOrdos } = await sb
    .from('ordonnances')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacist_id', currentUser.id)
    .gte('date', firstDay)
    .lte('date', lastDay);
  document.getElementById('stat-ordos').textContent = countOrdos ?? 0;
// Stat 3 : alertes = patients ayant au moins une allergie enregistrée
  const { data: patientsAvecAllergies } = await sb
    .from('patients')
    .select('id')
    .eq('pharmacist_id', currentUser.id)
    .not('allergies', 'is', null)
    .neq('allergies', '');

  const alertCount = (patientsAvecAllergies || []).length;
  const statAlertsEl = document.getElementById('stat-alerts');
  if (statAlertsEl) {
    statAlertsEl.textContent = alertCount;
    // Changer la couleur si > 0
    statAlertsEl.style.color = alertCount > 0 ? 'var(--red)' : 'var(--teal)';
  }

  // Mettre à jour le libellé de la stat
  const alertCard = statAlertsEl?.closest('.stat-card');
  if (alertCard) {
    const lbl = alertCard.querySelector('.stat-lbl');
    if (lbl) lbl.textContent = alertCount > 0
      ? `Patient${alertCount > 1 ? 's' : ''} avec allergie${alertCount > 1 ? 's' : ''}`
      : 'Aucune allergie enregistrée';
  }

  loadDashOrdos();
}

