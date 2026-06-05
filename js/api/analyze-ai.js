export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages, system, max_tokens } = req.body;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 1000,
      system,
      messages
    })
  });
  const d = await r.json();
  if (d.error) return res.status(500).json({ error: d.error.message });
  return res.status(200).json({ text: d.content?.[0]?.text || '' });
}
