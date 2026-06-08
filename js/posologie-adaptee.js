// ── POSOLOGIES ADAPTÉES ──────────────────────────

function formatMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/#{4}\s(.+)/g, '<h4 style="margin:12px 0 6px;color:var(--teal)">$1</h4>')
    .replace(/#{3}\s(.+)/g, '<h3 style="margin:14px 0 8px;color:var(--text)">$1</h3>')
    .replace(/^- (.+)/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--teal);margin-bottom:4px">$1</div>')
    .replace(/\n---\n/g, '<hr style="border:none;border-top:1px solid var(--border);margin:12px 0"/>')
    .replace(/\n/g, '<br/>');
}

async function calculerPosologie() {
  const medicament = document.getElementById('pa-medicament').value.trim();
  const poids      = document.getElementById('pa-poids').value.trim();
  const dfg        = document.getElementById('pa-dfg').value.trim();
  const age        = document.getElementById('pa-age').value.trim();
  const contexte   = document.getElementById('pa-contexte').value;
  const el         = document.getElementById('posologie-adaptee-result');

  if (!medicament) {
    el.innerHTML = `<div class="card" style="color:var(--red)">⚠️ Veuillez saisir un médicament.</div>`;
    return;
  }

  el.innerHTML = `<div class="card" style="text-align:center;padding:32px">
    <div style="font-size:32px;margin-bottom:12px">⏳</div>
    <div style="font-size:14px;color:var(--text-muted)">Calcul de la posologie adaptée en cours…</div>
  </div>`;

  let prompt = `Tu es un pharmacien clinicien expert. Calcule la posologie adaptée pour :\n\n`;
  prompt += `Médicament : ${medicament}\n`;
  if (poids)    prompt += `Poids : ${poids} kg\n`;
  if (dfg)      prompt += `DFG / Clairance créatinine : ${dfg} ml/min\n`;
  if (age)      prompt += `Âge : ${age} ans\n`;
  if (contexte) prompt += `Contexte particulier : ${contexte}\n`;

  prompt += `\nDonne en français :
1. La posologie standard de référence
2. La posologie adaptée selon les paramètres fournis
3. Les ajustements nécessaires (insuffisance rénale, hépatique, poids, âge)
4. Les contre-indications ou précautions spécifiques
5. La surveillance recommandée

Sois précis, concis et basé sur les RCP et recommandations ANSM/HAS.`;

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
            content: 'Tu es un pharmacien clinicien expert. Réponds uniquement en français avec des recommandations précises basées sur les RCP officiels et les recommandations ANSM/HAS.'
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
                      display:flex;align-items:center;justify-content:center;font-size:20px">⚖️</div>
          <div>
            <div style="font-size:16px;font-weight:700">${medicament}</div>
            <div style="font-size:11px;color:var(--text-muted)">
              ${poids ? `Poids : ${poids} kg` : ''}
              ${dfg ? ` · DFG : ${dfg} ml/min` : ''}
              ${age ? ` · Âge : ${age} ans` : ''}
              ${contexte ? ` · ${contexte}` : ''}
            </div>
          </div>
        </div>

        <div style="font-size:13px;line-height:1.8;color:var(--text)">${formatMarkdown(reponse)}</div>

        <div style="margin-top:16px;padding:10px 14px;background:var(--amber-pale);
                    border-radius:8px;font-size:11px;color:var(--amber)">
          ⚠️ Cette réponse est générée par IA. Toujours vérifier avec le RCP officiel et les recommandations ANSM/HAS.
        </div>
      </div>`;

  } catch(e) {
    el.innerHTML = `<div class="card" style="color:var(--red)">Erreur de connexion : ${e.message}</div>`;
  }
}
