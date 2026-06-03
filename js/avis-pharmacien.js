// avis-pharmacien.js — Onglet "Avis clients" dans SKPharma

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
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">⭐</div>
        <div class="empty-title">Aucun avis pour l'instant</div>
        <div class="empty-sub">Partagez votre lien public pour recevoir des avis</div>
      </div>`;
    if (statsEl) statsEl.innerHTML = '';
    return;
  }

  // Calcul stats
  const total = data.length;
  const moyenne = data.reduce((s, a) => s + a.note, 0) / total;
  const dist = [1,2,3,4,5].map(n => ({
    note: n,
    count: data.filter(a => a.note === n).length
  }));

  // Rendu stats
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="avis-stats-grid">
        <div class="avis-score-card">
          <div class="avis-score-num">${moyenne.toFixed(1)}</div>
          <div class="avis-score-stars">${renderStars(moyenne)}</div>
          <div class="avis-score-sub">${total} avis</div>
        </div>
        <div class="avis-dist">
          ${dist.reverse().map(d => `
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

  // Rendu liste
  el.innerHTML = data.map(a => `
    <div class="avis-item">
      <div class="avis-item-stars">${renderStarsInt(a.note)}</div>
      <div class="avis-item-date">${formatDateTime(a.created_at)}</div>
    </div>
  `).join('');
}

function renderStars(avg) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (avg >= i) html += '<span style="color:#1D9E75">★</span>';
    else if (avg >= i - 0.5) html += '<span style="color:#1D9E75;opacity:0.5">★</span>';
    else html += '<span style="color:#ddd">★</span>';
  }
  return html;
}

function renderStarsInt(note) {
  return [1,2,3,4,5].map(i =>
    `<span style="color:${i <= note ? '#1D9E75' : '#ddd'}">★</span>`
  ).join('');
}
