export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
  maxDuration: 30,
};

function buildStoreSearchUrl(store, query) {
  const s = (store || '').toLowerCase();
  const q = encodeURIComponent(query);
  if (s.includes('ikea')) return `https://www.ikea.com/es/es/search/?q=${q}`;
  if (s.includes('zara home')) return `https://www.zarahome.com/es/search.html?term=${q}`;
  if (s.includes('maisons du monde')) return `https://www.maisonsdumonde.com/ES/es/q/${q}`;
  if (s.includes('h&m')) return `https://www2.hm.com/es_es/search-results.html?q=${q}`;
  if (s.includes('el corte inglés')) return `https://www.elcorteingles.es/search/?s=${q}`;
  return `https://www.google.com/search?q=${encodeURIComponent(store + ' ' + query)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) return res.status(claudeRes.status).json(claudeData);

    const rawText = claudeData.content.map(b => b.type === 'text' ? b.text : '').join('');
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    // Build direct store search URLs for all products
    for (const room of parsed.rooms || []) {
      for (const item of room.items_to_improve || []) {
        for (const tier of ['budget_1', 'budget_2', 'premium_1', 'premium_2']) {
          const opt = item.options?.[tier];
          if (opt) opt.store_url = buildStoreSearchUrl(opt.store, opt.search_query || opt.product_name);
        }
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
