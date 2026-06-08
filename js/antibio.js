// ── AIDE À L'ANTIBIOTHÉRAPIE ──────────────────

const ANTIBIO_DATA = [
  {
    infection: ['pneumonie', 'pneumopathie', 'infection pulmonaire'],
    titre: 'Pneumonie communautaire',
    premier_choix: 'Amoxicilline 1g × 3/j pendant 5-7 jours',
    alternatives: ['Amoxicilline-acide clavulanique 1g × 3/j (si comorbidités)', 'Pristinamycine 1g × 3/j (si allergie pénicilline)'],
    duree: '5 à 7 jours',
    remarques: 'Hospitalisation si score PSI élevé. Réévaluation à 48-72h.',
    ci: 'Allergie pénicilline → utiliser macrolide ou pristinamycine'
  },
  {
    infection: ['cystite', 'infection urinaire', 'iu simple'],
    titre: 'Cystite aiguë simple',
    premier_choix: 'Fosfomycine-trométamol 3g en dose unique',
    alternatives: ['Pivmécillinam 400mg × 2/j pendant 5j', 'Nitrofurantoïne 100mg × 3/j pendant 5j'],
    duree: 'Dose unique à 5 jours selon molécule',
    remarques: 'Ne pas utiliser fluoroquinolones en 1ère intention. ECBU non obligatoire en cystite simple.',
    ci: 'Insuffisance rénale sévère (fosfomycine, nitrofurantoïne contre-indiquées)'
  },
  {
    infection: ['pyélonéphrite', 'pyelonephrite', 'infection rénale'],
    titre: 'Pyélonéphrite aiguë',
    premier_choix: 'Ciprofloxacine 500mg × 2/j pendant 7 jours',
    alternatives: ['Céfixime 200mg × 2/j pendant 10j', 'Amoxicilline-acide clavulanique 1g × 3/j pendant 10j (après antibiogramme)'],
    duree: '7 à 10 jours',
    remarques: 'ECBU obligatoire avant traitement. Réévaluation à 72h avec antibiogramme.',
    ci: 'Grossesse → ne pas utiliser fluoroquinolones'
  },
  {
    infection: ['angine', 'pharyngite', 'mal de gorge'],
    titre: 'Angine bactérienne (TDR positif)',
    premier_choix: 'Amoxicilline 1g × 2/j pendant 6 jours',
    alternatives: ['Azithromycine 500mg/j pendant 3j (si allergie pénicilline)', 'Clarithromycine 250mg × 2/j pendant 5j'],
    duree: '6 jours',
    remarques: 'Antibiotique uniquement si TDR positif. TDR négatif = traitement symptomatique.',
    ci: 'Mononucléose infectieuse (contre-indication absolue amoxicilline)'
  },
  {
    infection: ['otite', 'otite moyenne', 'oma'],
    titre: 'Otite moyenne aiguë',
    premier_choix: 'Amoxicilline 80-90 mg/kg/j en 2-3 prises pendant 5 jours',
    alternatives: ['Amoxicilline-acide clavulanique (si échec à 48h)', 'Céfuroxime-axétil (si allergie pénicilline sans anaphylaxie)'],
    duree: '5 jours (enfant > 2 ans) — 8-10 jours (enfant < 2 ans)',
    remarques: 'Abstention possible > 2 ans si symptômes peu sévères. Réévaluation à 48-72h si pas d\'amélioration.',
    ci: 'Allergie pénicilline sévère → céfuroxime ou azithromycine'
  },
  {
    infection: ['sinusite', 'sinusite bactérienne', 'rhinosinusite'],
    titre: 'Sinusite bactérienne aiguë',
    premier_choix: 'Amoxicilline 1g × 3/j pendant 5 jours',
    alternatives: ['Amoxicilline-acide clavulanique 1g × 3/j', 'Pristinamycine 1g × 3/j (si allergie pénicilline)'],
    duree: '5 jours',
    remarques: 'Antibiotique si critères bactériens : fièvre > 38.5°C, douleur unilatérale intense, rhinorrhée purulente.',
    ci: 'Allergie pénicilline → pristinamycine ou doxycycline'
  },
  {
    infection: ['bronchite', 'bronchite aiguë', 'toux'],
    titre: 'Bronchite aiguë',
    premier_choix: 'Pas d\'antibiotique recommandé (viral dans 90% des cas)',
    alternatives: ['Si surinfection bactérienne suspectée : Amoxicilline 1g × 3/j pendant 5j'],
    duree: 'Non applicable en règle générale',
    remarques: 'Traitement symptomatique en 1ère intention. Antibiotique uniquement si signes de surinfection (fièvre > 38.5°C, expectorations purulentes persistantes > 7j).',
    ci: 'Éviter antibiotiques systématiques — résistance bactérienne'
  },
  {
    infection: ['infection cutanée', 'érysipèle', 'cellulite'],
    titre: 'Érysipèle / Infection cutanée',
    premier_choix: 'Amoxicilline 3-4,5 g/j en 3 prises pendant 7 jours',
    alternatives: ['Pristinamycine 1g × 3/j (si allergie pénicilline)', 'Clindamycine 600mg × 3/j'],
    duree: '7 jours minimum',
    remarques: 'Repos, surélévation du membre. Hospitalisation si signes de gravité (sepsis, nécrose).',
    ci: 'Allergie pénicilline → pristinamycine ou clindamycine'
  },
  {
    infection: ['prostatite', 'infection prostate'],
    titre: 'Prostatite aiguë',
    premier_choix: 'Ciprofloxacine 500mg × 2/j pendant 14-21 jours',
    alternatives: ['Ofloxacine 200mg × 2/j', 'Cotrimoxazole forte × 2/j (après antibiogramme)'],
    duree: '14 à 21 jours',
    remarques: 'ECBU obligatoire. Hospitalisation si forme sévère. Réévaluation à 72h.',
    ci: 'Insuffisance rénale → adapter posologie fluoroquinolones'
  },
  {
    infection: ['méningite', 'méningite bactérienne'],
    titre: 'Méningite bactérienne',
    premier_choix: 'Céfotaxime 200-300 mg/kg/j IV ou Ceftriaxone 100 mg/kg/j IV',
    alternatives: ['Amoxicilline IV si Listeria suspectée (+ céfotaxime)', 'Vancomycine si pneumocoque résistant suspecté'],
    duree: '7 à 21 jours selon germe',
    remarques: '⚠️ URGENCE ABSOLUE — Hospitalisation immédiate. Ne pas attendre pour débuter le traitement.',
    ci: 'Ne jamais traiter en ambulatoire'
  },
  {
    infection: ['endocardite', 'infection cardiaque'],
    titre: 'Endocardite infectieuse',
    premier_choix: 'Amoxicilline 12g/j IV + Gentamicine (selon protocole)',
    alternatives: ['Vancomycine IV (si SARM ou allergie)', 'Selon antibiogramme'],
    duree: '4 à 6 semaines',
    remarques: '⚠️ URGENCE — Hospitalisation obligatoire. Hémocultures avant tout traitement.',
    ci: 'Traitement ambulatoire contre-indiqué'
  },
  {
    infection: ['isg', 'infection sexuellement transmissible', 'ist', 'chlamydia'],
    titre: 'IST — Chlamydia',
    premier_choix: 'Azithromycine 1g en dose unique',
    alternatives: ['Doxycycline 100mg × 2/j pendant 7 jours'],
    duree: 'Dose unique ou 7 jours',
    remarques: 'Traiter le/la partenaire. Dépistage autres IST recommandé.',
    ci: 'Grossesse → azithromycine préférée à doxycycline'
  },
  {
    infection: ['gonorrhée', 'gonocoque', 'neisseria'],
    titre: 'Gonorrhée (gonocoque)',
    premier_choix: 'Ceftriaxone 500mg IM en dose unique',
    alternatives: ['Céfixime 400mg per os (si IM impossible)'],
    duree: 'Dose unique',
    remarques: 'Association azithromycine 1g si co-infection chlamydia non exclue. Traiter le/la partenaire.',
    ci: 'Allergie céphalosporines → avis infectiologue'
  },
  {
    infection: ['tuberculose', 'tb'],
    titre: 'Tuberculose pulmonaire',
    premier_choix: 'Isoniazide + Rifampicine + Pyrazinamide + Éthambutol pendant 2 mois',
    alternatives: ['Puis Isoniazide + Rifampicine pendant 4 mois'],
    duree: '6 mois minimum',
    remarques: '⚠️ Déclaration obligatoire. Prise en charge spécialisée. Surveillance hépatique.',
    ci: 'Insuffisance hépatique sévère — adapter selon tolérance'
  },
];

let antibioSearchTimeout = null;

function searchAntibio(query) {
  clearTimeout(antibioSearchTimeout);
  antibioSearchTimeout = setTimeout(() => {
    const el = document.getElementById('antibio-result');
    if (!el) return;

    const q = query.trim().toLowerCase();

    if (q.length < 2) {
      el.innerHTML = `
        <div style="text-align:center;padding:48px 24px;color:var(--text-muted)">
          <div style="font-size:48px;margin-bottom:16px">🦠</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:8px">Aide à l'antibiothérapie</div>
          <div style="font-size:13px;line-height:1.6">Tapez le nom d'une infection pour obtenir<br/>les recommandations antibiotiques ANSM/HAS</div>
        </div>`;
      return;
    }

    const results = ANTIBIO_DATA.filter(d =>
      d.infection.some(i => i.includes(q)) ||
      d.titre.toLowerCase().includes(q)
    );

    if (!results.length) {
      // Pas de résultat local → appel IA
      el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted)">
        <div style="font-size:24px;margin-bottom:8px">🤖</div>
        <div style="font-size:13px">Infection non trouvée dans la base locale — Consultation de l'IA…</div>
      </div>`;
      askAntibioIA(query);
      return;
    }

    el.innerHTML = results.map(r => `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--teal-pale);
                      display:flex;align-items:center;justify-content:center;font-size:20px">🦠</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:var(--text)">${r.titre}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Source : ANSM/HAS</div>
          </div>
        </div>

        <div style="background:var(--teal-pale);border-radius:var(--radius);padding:14px 16px;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">✅ 1er choix</div>
          <div style="font-size:14px;font-weight:600;color:var(--text)">${r.premier_choix}</div>
        </div>

        ${r.alternatives.length ? `
        <div style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Alternatives</div>
          ${r.alternatives.map(a => `
            <div style="padding:8px 12px;background:var(--gray-100);border-radius:8px;
                        font-size:13px;color:var(--text);margin-bottom:6px">
              💊 ${a}
            </div>`).join('')}
        </div>` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="background:var(--gray-100);border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">⏱ Durée</div>
            <div style="font-size:13px;font-weight:600">${r.duree}</div>
          </div>
          <div style="background:var(--red-pale);border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:4px">⚠️ CI / Précautions</div>
            <div style="font-size:12px;color:var(--text)">${r.ci}</div>
          </div>
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

async function askAntibioIA(query) {
  const el = document.getElementById('antibio-result');
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 286xCNoTND6WY9GeOVW4JqQqgoYGlYnZ'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant clinique pour pharmaciens. Pour l'infection demandée, donne :
1. L'antibiotique de 1er choix avec posologie et durée
2. Les alternatives
3. Les contre-indications principales
4. Les remarques importantes
Réponds en français, de façon structurée et concise. Base-toi sur les recommandations ANSM/HAS 2024.`
          },
          {
            role: 'user',
            content: `Quelle antibiothérapie recommandes-tu pour : ${query} ?`
          }
        ]
      })
    });

    const data = await res.json();
    const reponse = data.choices?.[0]?.message?.content || 'Erreur de réponse.';

    el.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--teal-pale);
                      display:flex;align-items:center;justify-content:center;font-size:20px">🤖</div>
          <div>
            <div style="font-size:16px;font-weight:700">Réponse IA — ${query}</div>
            <div style="font-size:11px;color:var(--text-muted)">Alimenté par Mistral AI · Vérifier avec les recommandations officielles</div>
          </div>
        </div>
        <div style="font-size:13px;line-height:1.8;color:var(--text);white-space:pre-wrap">${reponse}</div>
        <div style="margin-top:12px;padding:10px;background:var(--amber-pale);border-radius:8px;font-size:11px;color:var(--amber)">
          ⚠️ Cette réponse est générée par IA. Toujours vérifier avec les recommandations ANSM/HAS officielles.
        </div>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div class="card" style="color:var(--red)">Erreur de connexion : ${e.message}</div>`;
  }
}
