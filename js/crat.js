// ── CRAT — AGENTS TÉRATOGÈNES ──────────────────

let currentCratTab = 'grossesse';

function switchCratTab(tab) {
  currentCratTab = tab;

  // Mettre à jour les boutons
  ['grossesse', 'allaitement', 'fertilite', 'exposition'].forEach(t => {
    const btn = document.getElementById('crat-tab-' + t);
    if (btn) {
      btn.className = t === tab ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
    }
  });

  // Mettre à jour le champ extra et le bouton
  const extraField = document.getElementById('crat-extra-field');
  const btn = document.getElementById('crat-btn');

  if (tab === 'grossesse') {
    extraField.innerHTML = `
      <label class="form-label">Trimestre de grossesse</label>
      <select class="form-input" id="crat-trimestre">
        <option value="">— Choisir —</option>
        <option>1er trimestre (1-12 semaines)</option>
        <option>2ème trimestre (13-26 semaines)</option>
        <option>3ème trimestre (27-40 semaines)</option>
        <option>Période périconceptionnelle</option>
      </select>`;
    btn.innerHTML = '🤰 Analyser le risque grossesse';
  } else if (tab === 'allaitement') {
    extraField.innerHTML = `
      <label class="form-label">Age du nourrisson</label>
      <select class="form-input" id="crat-trimestre">
        <option value="">— Choisir —</option>
        <option>Nouveau-né (0-1 mois)</option>
        <option>Nourrisson (1-6 mois)</option>
        <option>Nourrisson (6-12 mois)</option>
        <option>Enfant > 1 an</option>
        <option>Prématuré</option>
      </select>`;
    btn.innerHTML = '🍼 Analyser le risque allaitement';
  } else if (tab === 'fertilite') {
    extraField.innerHTML = `
      <label class="form-label">Sexe du patient</label>
      <select class="form-input" id="crat-trimestre">
        <option value="">— Choisir —</option>
        <option>Femme</option>
        <option>Homme</option>
        <option>Les deux</option>
      </select>`;
    btn.innerHTML = '👨 Analyser le risque fertilité';
  } else if (tab === 'exposition') {
    extraField.innerHTML = `
      <label class="form-label">Moment de l'exposition</label>
      <select class="form-input" id="crat-trimestre">
        <option value="">— Choisir —</option>
        <option>Avant grossesse connue</option>
        <option>1er trimestre</option>
        <option>2ème trimestre</option>
        <option>3ème trimestre</option>
      </select>`;
    btn.innerHTML = '☢️ Analyser l\'exposition accidentelle';
  }

  // Vider le résultat
  document.getElementById('crat-result').innerHTML = '';
}

async function analyserCrat() {
  const medicament = document.getElementById('crat-medicament').value.trim();
  const contexte   = document.getElementById('crat-trimestre')?.value || '';
  const el         = document.getElementById('crat-result');

  if (!medicament) {
    el.innerHTML = `<div class="card" style="color:var(--red)">⚠️ Veuillez saisir un médicament.</div>`;
    return;
  }

  el.innerHTML = `<div class="card" style="text-align:center;padding:32px">
    <div style="font-size:32px;margin-bottom:12px">⏳</div>
    <div style="font-size:14px;color:var(--text-muted)">Analyse CRAT en cours…</div>
  </div>`;

  let prompt = '';
  let icon = '🤰';

  if (currentCratTab === 'grossesse') {
    icon = '🤰';
    prompt = `Tu es un expert en tératologie (comme le CRAT - Centre de Référence sur les Agents Tératogènes).
    
Analyse le risque de ${medicament} pendant la grossesse${contexte ? ` au ${contexte}` : ''}.

Réponds en français avec cette structure :

1. NIVEAU DE RISQUE : (Compatible / Utilisable avec précaution / Déconseillé / Contre-indiqué)

2. RISQUES FOETAUX : Décris les risques potentiels pour le foetus selon le trimestre

3. DONNÉES DISPONIBLES : Résume les données cliniques et épidémiologiques disponibles

4. CONDUITE À TENIR : Que faire si la patiente est enceinte et prend ce médicament

5. ALTERNATIVES PLUS SÛRES : Propose des alternatives thérapeutiques si disponibles

6. SURVEILLANCE : Examens ou surveillance à mettre en place

Bases-toi sur les données du CRAT (lecrat.fr) et les recommandations ANSM.`;

  } else if (currentCratTab === 'allaitement') {
    icon = '🍼';
    prompt = `Tu es un expert en pharmacologie de l'allaitement (comme le CRAT).

Analyse la compatibilité de ${medicament} avec l'allaitement${contexte ? ` pour un ${contexte}` : ''}.

Réponds en français avec cette structure :

1. COMPATIBILITÉ : (Compatible / Utilisable avec précaution / Déconseillé / Contre-indiqué)

2. PASSAGE DANS LE LAIT : Taux de passage dans le lait maternel, RID (Relative Infant Dose) si connu

3. RISQUES POUR LE NOURRISSON : Effets potentiels sur le nourrisson

4. CONDUITE À TENIR : Peut-on allaiter ? Faut-il interrompre l'allaitement ?

5. ALTERNATIVES : Médicaments compatibles avec l'allaitement pour la même indication

6. SURVEILLANCE DU NOURRISSON : Signes à surveiller chez le bébé

Bases-toi sur les données du CRAT (lecrat.fr) et LactMed.`;

  } else if (currentCratTab === 'fertilite') {
    icon = '👨';
    prompt = `Tu es un expert en pharmacologie de la reproduction (comme le CRAT).

Analyse l'impact de ${medicament} sur la fertilité${contexte ? ` chez la ${contexte.toLowerCase()}` : ''}.

Réponds en français avec cette structure :

1. IMPACT SUR LA FERTILITÉ : (Aucun impact / Impact possible / Impact démontré / Contre-indiqué en désir de grossesse)

2. MÉCANISME : Comment ce médicament peut affecter la fertilité

3. DONNÉES DISPONIBLES : Données cliniques et précliniques disponibles

4. RÉVERSIBILITÉ : L'impact est-il réversible à l'arrêt du traitement ?

5. CONDUITE À TENIR : Délai recommandé avant conception, arrêt du traitement...

6. ALTERNATIVES : Alternatives thérapeutiques si désir de grossesse

Bases-toi sur les données du CRAT (lecrat.fr) et les recommandations ANSM.`;

  } else if (currentCratTab === 'exposition') {
    icon = '☢️';
    prompt = `Tu es un expert en tératologie (comme le CRAT).

Une femme enceinte a été exposée à ${medicament}${contexte ? ` au ${contexte}` : ''} de façon accidentelle.

Réponds en français avec cette structure :

1. ÉVALUATION DU RISQUE : (Rassurant / Surveillance recommandée / Risque avéré / Interruption à discuter)

2. RISQUES POTENTIELS : Quels sont les risques selon le moment de l'exposition

3. DONNÉES ÉPIDÉMIOLOGIQUES : Ce qu'on sait des expositions accidentelles à ce médicament

4. CONDUITE À TENIR IMMÉDIATE : Que faire maintenant (arrêt, suivi, examens...)

5. SURVEILLANCE PRÉNATALE : Echographies et examens recommandés

6. INFORMATION À DONNER À LA PATIENTE : Comment rassurer ou informer la patiente

Bases-toi sur les données du CRAT (lecrat.fr).`;
  }

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 286xCNoTND6WY9GeOVW4JqQqgoYGlYnZ'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 1200,
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en tératologie et pharmacologie de la reproduction. Réponds uniquement en français avec des informations précises basées sur les données du CRAT (lecrat.fr), ANSM et LactMed.'
          },
          {
            role: 'user',
            content: prompt
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
                      display:flex;align-items:center;justify-content:center;font-size:20px">${icon}</div>
          <div>
            <div style="font-size:16px;font-weight:700">${medicament}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
              ${currentCratTab === 'grossesse' ? 'Risque grossesse' : ''}
              ${currentCratTab === 'allaitement' ? 'Compatibilité allaitement' : ''}
              ${currentCratTab === 'fertilite' ? 'Impact fertilité' : ''}
              ${currentCratTab === 'exposition' ? 'Exposition accidentelle' : ''}
              ${contexte ? ` — ${contexte}` : ''}
              · Source : CRAT / ANSM
            </div>
          </div>
        </div>

        <div style="font-size:13px;line-height:1.8;color:var(--text)">${formatCratText(reponse)}</div>

        <div style="margin-top:16px;padding:10px 14px;background:var(--amber-pale);
                    border-radius:8px;font-size:11px;color:var(--amber)">
          ⚠️ Cette réponse est générée par IA et ne remplace pas le CRAT officiel. 
          Consultez <strong>lecrat.fr</strong> pour les informations officielles et à jour.
        </div>
      </div>`;

  } catch(e) {
    el.innerHTML = `<div class="card" style="color:var(--red)">Erreur de connexion : ${e.message}</div>`;
  }
}

function formatCratText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/#{4}\s(.+)/g, '<h4 style="margin:12px 0 6px;color:var(--teal)">$1</h4>')
    .replace(/#{3}\s(.+)/g, '<h3 style="margin:14px 0 8px;color:var(--text)">$1</h3>')
    .replace(/^(\d+\.\s.+)/gm, '<h4 style="margin:14px 0 6px;color:var(--teal);font-size:13px">$1</h4>')
    .replace(/^- (.+)/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--teal);margin-bottom:4px;font-size:13px">$1</div>')
    .replace(/\n---\n/g, '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0"/>')
    .replace(/\n/g, '<br/>');
}
