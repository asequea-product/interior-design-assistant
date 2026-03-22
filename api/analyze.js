export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

async function searchProductImage(query, apiKey, cx) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=1&imgSize=medium&imgType=photo`;
    const res = await fetch(url);
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
      imageUrl: item.link,
      pageUrl: item.image?.contextLink || null,
      title: item.title || query,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const googleCx = process.env.GOOGLE_CX;

  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  if (!googleKey || !googleCx) return res.status(500).json({ error: 'GOOGLE_API_KEY or GOOGLE_CX not configured' });

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
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Enrich each product option with Google Image Search
    for (const room of parsed.rooms || []) {
      for (const item of room.items_to_improve || []) {
        const lc = item.options?.low_cost;
        const hc = item.options?.high_cost;
        if (lc?.search_query) {
          const r = await searchProductImage(lc.search_query, googleKey, googleCx);
          if (r) { lc.image_url = r.imageUrl; lc.product_url = r.pageUrl; }
        }
        if (hc?.search_query) {
          const r = await searchProductImage(hc.search_query, googleKey, googleCx);
          if (r) { hc.image_url = r.imageUrl; hc.product_url = r.pageUrl; }
        }
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
