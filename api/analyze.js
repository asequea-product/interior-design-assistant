export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

async function searchProductImage(query, apiKey, cx) {
  const queries = [
    query,
    query + " product",
    query + " buy",
    query + " ikea zara home maisons du monde",
  ];

  for (const q of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=1`;
      const res = await fetch(url);
      const data = await res.json();

      const item = data.items?.[0];
      if (item?.link) {
        return {
          imageUrl: item.link,
          title: item.title || q,
        };
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

// 👉 NUEVA FUNCIÓN (búsqueda de producto real)
async function searchProductPage(query, apiKey, cx) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=1`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items?.[0]?.link || null;
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

  export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

async function searchProductImage(query, apiKey, cx) {
  const queries = [
    query,
    query + " product",
    query + " buy",
    query + " ikea zara home maisons du monde",
  ];

  for (const q of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&searchType=image&num=1`;
      const res = await fetch(url);
      const data = await res.json();

      const item = data.items?.[0];
      if (item?.link) {
        return {
          imageUrl: item.link,
          title: item.title || q,
        };
      }
    } catch (e) {
      continue;
    }
  }

  return null;
}

// 👉 NUEVA FUNCIÓN (búsqueda de producto real)
async function searchProductPage(query, apiKey, cx) {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=1`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items?.[0]?.link || null;
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

    // 👉 ENRIQUECER PRODUCTOS CON IMAGEN + LINK REAL
    for (const room of parsed.rooms || []) {
      for (const item of room.items_to_improve || []) {
        const lc = item.options?.low_cost;
        const hc = item.options?.high_cost;

        // LOW COST

