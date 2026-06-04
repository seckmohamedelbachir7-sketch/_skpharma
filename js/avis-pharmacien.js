// js/avis-pharmacien.js — Onglet "Avis clients" dans SKPharma

async function loadAvis() {
  const el = document.getElementById('avis-list');
  const statsEl = document.getElementById('avis-stats');
  if (!el) return;

  el.innerHTML = '<div class="loading">Chargement…</div>';

  const { data, error } = await sb
    .from('avis')
    .select('*')
    .eq('pharmacist_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    el.innerHTML = '<div class="empty"><div class="empty-sub">Erreur de chargement</div></div>';
    return;
  }

  if (!data.length) {
    if (statsEl) statsEl.innerHTML = '';
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">Aucun avis pour l'instant</div>
        <div class="empty-sub">Partagez votre lien public pour recevoir des avis clients</div>
      </div>`;
    return;
  }

  // ── Stats ──
  const total = data.length;
  const moyenne = data.reduce((s, a) => s + a.note, 0) / total;
  const dist = [5,4,3,2,1].map(n => ({
    note: n,
    count: data.filter(a => a.note === n).length
  }));

  if (statsEl) {
    statsEl.innerHTML = `
      <div class="avis-stats-grid">
        <div class="avis-score-card">
          <div class="avis-score-num">${moyenne.toFixed(1)}</div>
          <div class="avis-score-stars">${renderStarsFloat(moyenne)}</div>
          <div class="avis-score-sub">${total} avis</div>
        </div>
        <div class="avis-dist">
          ${dist.map(d => `
            <div class="avis-dist-row">
              <div class="avis-dist-label">${d.note}★</div>
              <div class="avis-dist-bar-wrap">
                <div class="avis-dist-bar" style="width:${total ? Math.round(d.count/total*100) : 0}%"></div>
              </div>
              <div class="avis-dist-count">${d.count}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  // ── Liste ──
  el.innerHTML = data.map(a => `
    <div class="avis-item">
      <div class="avis-item-top">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avis-item-avatar">${(a.prenom || '?').charAt(0).toUpperCase()}</div>
          <div>
            <div class="avis-item-name">${a.prenom || 'Anonyme'}</div>
            <div class="avis-item-stars">${renderStarsInt(a.note)}</div>
          </div>
        </div>
        <div class="avis-item-date">${formatDateTime(a.created_at)}</div>
      </div>
      ${a.commentaire ? `<div class="avis-item-comment">"${a.commentaire}"</div>` : ''}
    </div>
  `).join('');
}

function renderStarsFloat(avg) {
  return [1,2,3,4,5].map(i => {
    if (avg >= i) return '<span style="color:#1D9E75;font-size:18px">★</span>';
    if (avg >= i - 0.5) return '<span style="color:#1D9E75;opacity:0.5;font-size:18px">★</span>';
    return '<span style="color:#ddd;font-size:18px">★</span>';
  }).join('');
}

function renderStarsInt(note) {
  return [1,2,3,4,5].map(i =>
    `<span style="color:${i <= note ? '#1D9E75' : '#ddd'};font-size:15px">★</span>`
  ).join('');
}
