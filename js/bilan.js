// ── BILAN PARTAGÉ DE MÉDICATION ──────────────────
 
async function analyserBilan() {
  const meds      = document.getElementById('bilan-meds').value.trim();
  const age       = document.getElementById('bilan-age').value.trim();
  const patho     = document.getElementById('bilan-patho').value.trim();
  const allergies = document.getElementById('bilan-allergies').value.trim();
  const el        = document.getElementById('bilan-result');
 
  if (!meds) {
    el.innerHTML = `<div class="card" style="color:var(--red)">⚠️ Veuillez saisir la liste des médicaments.</div>`;
    return;
  }
 
  el.innerHTML = `<div class="card" style="text-align:center;padding:32px">
    <div style="font-size:32px;margin-bottom:12px">⏳</div>
    <div style="font-size:14px;color:var(--text-muted)">Analyse du bilan de médication en cours…</div>
  </div>`;
 
  let prompt = `Tu es un pharmacien clinicien expert. Réalise un bilan partagé de médication pour ce patient :\n\n`;
  prompt += `Médicaments : ${meds}\n`;
  if (age)       prompt += `Âge : ${age} ans\n`;
  if (patho)     prompt += `Pathologies : ${patho}\n`;
  if (allergies) prompt += `Allergies : ${allergies}\n`;
 
  prompt += `\nAnalyse en français avec exactement cette structure :
 
1. INTERACTIONS DÉTECTÉES : Liste toutes les interactions entre les médicaments (niveau : mineure/modérée/majeure/contre-indication)
 
2. PROBLÈMES IDENTIFIÉS : Médicaments potentiellement inappropriés, redondances, sous-dosages, surdosages
 
3. POINTS DE VIGILANCE : Effets indésirables à surveiller pour cette association
 
4. RECOMMANDATIONS PHARMACIEN : Actions concrètes à proposer au médecin ou au patient
 
5. SURVEILLANCE RECOMMANDÉE : Paramètres biologiques et cliniques à surveiller
 
Sois précis, concis et basé sur les recommandations ANSM/HAS et Thériaque.`;
 
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 286xCNoTND6WY9GeOVW4JqQqgoYGlYnZ'
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        max_tokens: 1500,
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
 
    el.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--teal-pale);
                      display:flex;align-items:center;justify-content:center;font-size:20px">📋</div>
          <div>
            <div style="font-size:16px;font-weight:700">Bilan de médication</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
              ${age ? `Âge : ${age} ans` : ''}
              ${patho ? ` · ${patho}` : ''}
              ${allergies ? ` · Allergie : ${allergies}` : ''}
            </div>
          </div>
        </div>
 
        <div style="background:var(--gray-100);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--text-muted)">
          <strong>Médicaments analysés :</strong> ${meds}
        </div>
 
        <div style="font-size:13px;line-height:1.8;color:var(--text)">${formatBilanText(reponse)}</div>
 
        <div style="margin-top:16px;padding:10px 14px;background:var(--amber-pale);
                    border-radius:8px;font-size:11px;color:var(--amber)">
          ⚠️ Cette analyse est générée par IA. Toujours vérifier avec Thériaque et le médecin prescripteur.
        </div>
      </div>`;
 
  } catch(e) {
    el.innerHTML = `<div class="card" style="color:var(--red)">Erreur de connexion : ${e.message}</div>`;
  }
}
 
function formatBilanText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+\.\s.+)/gm, '<h4 style="margin:14px 0 6px;color:var(--teal);font-size:13px">$1</h4>')
    .replace(/^- (.+)/gm, '<div style="padding:3px 0 3px 12px;border-left:2px solid var(--teal);margin-bottom:4px;font-size:13px">$1</div>')
    .replace(/\n/g, '<br/>');
}
 
