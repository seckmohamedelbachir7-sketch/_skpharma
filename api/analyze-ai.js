export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages, system, max_tokens } = req.body;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: max_tokens || 1000,
        system,
        messages
      })
    });

    const d = await r.json();

    if (d.error) {
      return res.status(500).json({ error: d.error.message });
    }

    // IMPORTANT : on renvoie le format brut Anthropic { content: [...] }
    // car entretiens.js et voice.js font tous deux raw.content?.[0]?.text
    return res.status(200).json(d);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
