// ── INTERACTIONS MÉDICAMENTEUSES ──────────────────

async function verifierInteractions() {
  const med1 = document.getElementById('inter-med1').value.trim();
  const med2 = document.getElementById('inter-med2').value.trim();
  const el   = document.getElementById('interactions-result');

  if (!med1 || !med2) {
    el.innerHTML = `<div class="card" style="color:var(--red)">⚠️ Veuillez saisir deux médicaments.</div>`;
    return;
  }

  el.innerHTML = `<div class="card" style="text-align:center;padding:32px">
    <div style="font-size:32px;margin-bottom:12px">⏳</div>
    <div style="font-size:14px;color:var(--text-muted)">Analyse des interactions en cours…</div>
  </div>`;

  const prompt = `Tu es un pharmacien clinicien expert en interactions médicamenteuses.

Analyse l'interaction entre : ${med1} et ${med2}

Réponds en français avec exactement cette structure :

1. NIVEAU D'INTERACTION : (Aucune / Mineure / Modérée / Majeure / Contre-indication absolue)

2. MÉCANISME : Explique brièvement le mécanisme de l'interaction

3. CONSÉQUENCES CLINIQUES : Quels sont les effets attendus sur le patient

4. CONDUITE À TENIR : Que doit faire le pharmacien (surveiller, espacer les prises, contre-indiquer, alternative...)

5. SURVEILLANCE RECOMMANDÉE : Paramètres à surveiller si association maintenue

Sois précis et basé sur les recommandations ANSM/HAS et Thériaque.`;

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 286xCNoTND6WY9GeOVW4JqQqgoYGlYnZ'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'Tu es un pharmacien clinicien expert. Réponds uniquement en français avec des recommandations précises basées sur les RCP officiels, ANSM/HAS et Thériaque.'
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

    // Déterminer le niveau d'interaction pour la couleur
    const niveau = reponse.toLowerCase();
    let niveauColor = 'var(--teal)';
    let niveauBg = 'var(--teal-pale)';
    let niveauIcon = '✅';

    if (niveau.includes('contre-indication absolue')) {
      niveauColor = 'var(--red)'; niveauBg = 'var(--red-pale)'; niveauIcon = '🚫';
    } else if (niveau.includes('majeure')) {
      niveauColor = 'var(--red)'; niveauBg = 'var(--red-pale)'; niveauIcon = '❌';
    } else if (niveau.includes('modérée')) {
      niveauColor = 'var(--amber)'; niveauBg = 'var(--amber-pale)'; niveauIcon = '⚠️';
    } else if (niveau.includes('mineure')) {
      niveauColor = 'var(--teal)'; niveauBg = 'var(--teal-pale)'; niveauIcon = '⚡';
    } else if (niveau.includes('aucune')) {
      niveauColor = 'var(--teal)'; niveauBg = 'var(--teal-pale)'; niveauIcon = '✅';
    }

    el.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="font-size:28px">${niveauIcon}</div>
          <div>
            <div style="font-size:16px;font-weight:700;color:var(--text)">${med1} + ${med2}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Analyse d'interaction — Source : ANSM / Thériaque</div>
          </div>
        </div>

        <div style="font-size:13px;line-height:1.8;color:var(--text)">${formatInteractionText(reponse)}</div>

        <div style="margin-top:16px;padding:10px 14px;background:var(--amber-pale);
                    border-radius:8px;font-size:11px;color:var(--amber)">
          ⚠️ Cette réponse est générée par IA. Toujours vérifier avec Thériaque ou le RCP officiel.
        </div>
      </div>`;

  } catch(e) {
    el.innerHTML = `<div class="card" style="color:var(--red)">Erreur de connexion : ${e.message}</div>`;
  }
}

function formatInteractionText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+\.\s.+)/gm, '<h4 style="margin:14px 0 6px;color:var(--teal);font-size:13px">$1</h4>')
    .replace(/^- (.+)/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--teal);margin-bottom:4px;font-size:13px">$1</div>')
    .replace(/\n/g, '<br/>');
}
