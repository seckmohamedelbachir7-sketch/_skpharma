

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mediaType } = req.body;
  if (!base64 || !mediaType) {
    return res.status(400).json({ error: 'base64 et mediaType requis' });
  }

  const prompt = `Tu es un pharmacien expert spécialisé dans la lecture d'ordonnances médicales françaises, y compris les écritures manuscrites difficiles, raturées ou mal formées.

Analyse cette ordonnance avec le maximum de précision. Même si l'écriture est illisible ou difficile, essaie de deviner le médicament le plus probable d'après le contexte médical (classe thérapeutique, forme pharmaceutique, dosage habituel).

Règles :
- Pour les médicaments manuscrits illisibles → indique ta meilleure hypothèse entre parenthèses ex: "(probable: Amoxicilline 500mg)"
- Pour les dosages partiellement lisibles → complète avec la forme standard la plus courante
- La date : si absente ou illisible, utilise la date du jour au format YYYY-MM-DD
- Les médicaments : sépare chaque ligne par une virgule, inclus dosage et posologie si visibles
- Renouvellement : indique "1 mois", "3 mois", "6 mois" si mentionné, sinon chaîne vide

Réponds UNIQUEMENT avec ce JSON strict sans markdown ni commentaire :
{"medecin":"nom complet du médecin","date":"YYYY-MM-DD","medicaments":"méd1 dosage posologie, méd2 dosage posologie, ...","renouvellement":"durée ou chaîne vide","notes":"informations complémentaires ou chaîne vide"}`;

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,   // ← clé sécurisée côté serveur
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await claudeRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || JSON.stringify(data.error) });
    }

    const raw = (data.content?.[0]?.text || '').trim().replace(/```json|```/g, '').trim();
    if (!raw) return res.status(500).json({ error: 'Réponse vide du modèle' });

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return res.status(500).json({ error: 'JSON invalide : ' + raw.substring(0, 120) });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
