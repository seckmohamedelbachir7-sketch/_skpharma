// ── DURÉES DE TRAITEMENT ──────────────────────────

const DUREES_DATA = [
  {
    infection: ['angine', 'pharyngite'],
    titre: 'Angine bactérienne',
    duree_standard: '6 jours',
    antibiotique: 'Amoxicilline',
    details: [
      { terrain: 'Adulte', duree: '6 jours', dose: '1g × 2/j' },
      { terrain: 'Enfant', duree: '6 jours', dose: '50 mg/kg/j en 2 prises' },
    ],
    remarques: 'Uniquement si TDR positif. Pas d\'antibiotique si TDR négatif.',
    source: 'ANSM 2024'
  },
  {
    infection: ['otite', 'otite moyenne', 'oma'],
    titre: 'Otite moyenne aiguë',
    duree_standard: '5 à 10 jours',
    antibiotique: 'Amoxicilline',
    details: [
      { terrain: 'Enfant > 2 ans', duree: '5 jours', dose: '80-90 mg/kg/j en 2 prises' },
      { terrain: 'Enfant < 2 ans', duree: '8-10 jours', dose: '80-90 mg/kg/j en 2 prises' },
      { terrain: 'Adulte', duree: '5 jours', dose: '1g × 3/j' },
    ],
    remarques: 'Abstention possible chez l\'enfant > 2 ans si symptômes peu sévères.',
    source: 'HAS 2024'
  },
  {
    infection: ['sinusite', 'rhinosinusite'],
    titre: 'Sinusite bactérienne aiguë',
    duree_standard: '5 jours',
    antibiotique: 'Amoxicilline',
    details: [
      { terrain: 'Adulte', duree: '5 jours', dose: '1g × 3/j' },
      { terrain: 'Enfant', duree: '7 jours', dose: '80-90 mg/kg/j en 3 prises' },
    ],
    remarques: 'Antibiotique uniquement si critères bactériens présents.',
    source: 'ANSM 2024'
  },
  {
    infection: ['bronchite', 'bronchite aiguë'],
    titre: 'Bronchite aiguë',
    duree_standard: 'Pas d\'antibiotique',
    antibiotique: 'Aucun en règle générale',
    details: [
      { terrain: 'Adulte sain', duree: 'Pas d\'antibiotique', dose: 'Traitement symptomatique' },
      { terrain: 'Surinfection bactérienne', duree: '5 jours', dose: 'Amoxicilline 1g × 3/j' },
    ],
    remarques: 'Viral dans 90% des cas. Antibiotique uniquement si surinfection confirmée.',
    source: 'HAS 2024'
  },
  {
    infection: ['pneumonie', 'pneumopathie'],
    titre: 'Pneumonie communautaire',
    duree_standard: '5 à 7 jours',
    antibiotique: 'Amoxicilline',
    details: [
      { terrain: 'Adulte sans comorbidité', duree: '5 jours', dose: '1g × 3/j' },
      { terrain: 'Adulte avec comorbidités', duree: '7 jours', dose: 'Amox-clav 1g × 3/j' },
      { terrain: 'Légionellose', duree: '8-21 jours', dose: 'Fluoroquinolone' },
    ],
    remarques: 'Réévaluation clinique à 48-72h obligatoire.',
    source: 'ANSM/HAS 2024'
  },
  {
    infection: ['cystite', 'infection urinaire'],
    titre: 'Cystite aiguë simple',
    duree_standard: 'Dose unique à 5 jours',
    antibiotique: 'Fosfomycine ou Pivmécillinam',
    details: [
      { terrain: 'Femme adulte', duree: 'Dose unique', dose: 'Fosfomycine 3g' },
      { terrain: 'Femme adulte (alternative)', duree: '5 jours', dose: 'Pivmécillinam 400mg × 2/j' },
      { terrain: 'Femme adulte (alternative)', duree: '5 jours', dose: 'Nitrofurantoïne 100mg × 3/j' },
    ],
    remarques: 'Ne pas utiliser fluoroquinolones en 1ère intention.',
    source: 'HAS 2024'
  },
  {
    infection: ['pyélonéphrite', 'pyelonephrite'],
    titre: 'Pyélonéphrite aiguë',
    duree_standard: '7 à 10 jours',
    antibiotique: 'Ciprofloxacine ou Céfixime',
    details: [
      { terrain: 'Forme simple (fluoroquinolone)', duree: '7 jours', dose: 'Ciprofloxacine 500mg × 2/j' },
      { terrain: 'Forme simple (céphalosporine)', duree: '10 jours', dose: 'Céfixime 200mg × 2/j' },
      { terrain: 'Forme grave (hospitalisation)', duree: '10-14 jours', dose: 'C3G IV' },
    ],
    remarques: 'ECBU obligatoire avant traitement. Réévaluation à 72h avec antibiogramme.',
    source: 'HAS 2024'
  },
  {
    infection: ['prostatite'],
    titre: 'Prostatite aiguë',
    duree_standard: '14 à 21 jours',
    antibiotique: 'Ciprofloxacine',
    details: [
      { terrain: 'Forme légère à modérée', duree: '14 jours', dose: 'Ciprofloxacine 500mg × 2/j' },
      { terrain: 'Forme sévère', duree: '21 jours', dose: 'Ciprofloxacine 500mg × 2/j' },
    ],
    remarques: 'ECBU obligatoire. Hospitalisation si forme sévère.',
    source: 'ANSM 2024'
  },
  {
    infection: ['érysipèle', 'cellulite', 'infection cutanée'],
    titre: 'Érysipèle',
    duree_standard: '7 jours',
    antibiotique: 'Amoxicilline',
    details: [
      { terrain: 'Adulte', duree: '7 jours minimum', dose: 'Amoxicilline 3-4,5g/j en 3 prises' },
      { terrain: 'Allergie pénicilline', duree: '7 jours', dose: 'Pristinamycine 1g × 3/j' },
    ],
    remarques: 'Repos et surélévation du membre. Hospitalisation si signes de gravité.',
    source: 'HAS 2024'
  },
  {
    infection: ['tuberculose', 'tb'],
    titre: 'Tuberculose pulmonaire',
    duree_standard: '6 mois',
    antibiotique: 'Quadrithérapie',
    details: [
      { terrain: 'Phase initiale', duree: '2 mois', dose: 'INH + RIF + PZA + EMB' },
      { terrain: 'Phase de continuation', duree: '4 mois', dose: 'INH + RIF' },
    ],
    remarques: '⚠️ Déclaration obligatoire. Prise en charge spécialisée obligatoire.',
    source: 'HAS 2024'
  },
  {
    infection: ['endocardite'],
    titre: 'Endocardite infectieuse',
    duree_standard: '4 à 6 semaines',
    antibiotique: 'Selon germe',
    details: [
      { terrain: 'Streptocoque sensible', duree: '4 semaines', dose: 'Amoxicilline IV 12g/j' },
      { terrain: 'Staphylocoque', duree: '4-6 semaines', dose: 'Oxacilline IV ou Vancomycine' },
      { terrain: 'Entérocoque', duree: '4-6 semaines', dose: 'Amoxicilline + Gentamicine' },
    ],
    remarques: '⚠️ Hospitalisation obligatoire. Hémocultures avant traitement.',
    source: 'ESC 2023'
  },
  {
    infection: ['méningite', 'meningite'],
    titre: 'Méningite bactérienne',
    duree_standard: '7 à 21 jours',
    antibiotique: 'Céfotaxime ou Ceftriaxone IV',
    details: [
      { terrain: 'Méningocoque', duree: '7 jours', dose: 'Céfotaxime 200mg/kg/j IV' },
      { terrain: 'Pneumocoque', duree: '10-14 jours', dose: 'Céfotaxime + Vancomycine IV' },
      { terrain: 'Listéria', duree: '21 jours', dose: 'Amoxicilline IV + Gentamicine' },
    ],
    remarques: '⚠️ URGENCE ABSOLUE — Ne jamais traiter en ambulatoire.',
    source: 'SPILF 2024'
  },
];

let dureesSearchTimeout = null;

function searchDurees(query) {
  clearTimeout(dureesSearchTimeout);
  dureesSearchTimeout = setTimeout(() => {
    const el = document.getElementById('durees-result');
    if (!el) return;

    const q = query.trim().toLowerCase();

    if (q.length < 2) {
      el.innerHTML = `
        <div style="text-align:center;padding:48px 24px;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:16px">⏱</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:8px">Durées de traitement recommandées</div>
          <div style="font-size:13px;line-height:1.6">Tapez le nom d'une infection pour obtenir<br/>la durée de traitement recommandée par l'ANSM/HAS</div>
        </div>`;
      return;
    }

    const results = DUREES_DATA.filter(d =>
      d.infection.some(i => i.includes(q)) ||
      d.titre.toLowerCase().includes(q)
    );

    if (!results.length) {
      el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">
        <div style="font-size:24px;margin-bottom:8px">🔍</div>
        <div style="font-size:13px">Infection non trouvée. Essayez un autre terme.</div>
      </div>`;
      return;
    }

    el.innerHTML = results.map(r => `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--teal-pale);
                      display:flex;align-items:center;justify-content:center;font-size:20px">⏱</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:var(--text)">${r.titre}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Source : ${r.source}</div>
          </div>
          <div style="margin-left:auto;background:var(--teal);color:#fff;padding:6px 14px;
                      border-radius:20px;font-size:13px;font-weight:600">
            ${r.duree_standard}
          </div>
        </div>

        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;
                      letter-spacing:0.05em;margin-bottom:8px">Détail par terrain</div>
          ${r.details.map(d => `
            <div style="display:grid;grid-template-columns:1fr 120px 1fr;gap:8px;
                        padding:10px 12px;background:var(--gray-100);border-radius:8px;
                        margin-bottom:6px;align-items:center">
              <div style="font-size:12px;color:var(--text-muted)">${d.terrain}</div>
              <div style="font-size:13px;font-weight:700;color:var(--teal);text-align:center">${d.duree}</div>
              <div style="font-size:12px;color:var(--text)">${d.dose}</div>
            </div>`).join('')}
        </div>

        ${r.remarques ? `
        <div style="padding:10px 14px;background:var(--amber-pale);border-radius:8px;
                    font-size:12px;color:var(--text);line-height:1.6">
          📋 <strong>Remarques :</strong> ${r.remarques}
        </div>` : ''}
      </div>
    `).join('');
  }, 300);
}
