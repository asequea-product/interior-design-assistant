export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
  maxDuration: 60,
};

const STORE_DOMAINS = {
  'ikea': 'ikea.com',
  'zara home': 'zarahome.com',
  'maisons du monde': 'maisonsdumonde.com',
  'h&m home': 'hm.com',
  'el corte inglés': 'elcorteingles.es',
};

function getDomain(store) {
  if (!store) return null;
  const key = store.toLowerCase();
  for (const [k, v] of Object.entries(STORE_DOMAINS)) {
    if (key.includes(k)) return v;
  }
  return null;
}

async function searchProduct(query, store, apiKey, cx) {
  try {
    const domain = getDomain(store);
    const q = domain ? `${query} site:${domain}` : query;
    const encoded = encodeURIComponent(q);

    // Run web search and image search in parallel
    const [webRes, imgRes] = await Promise.all([
      fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encoded}&num=3`),
      fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encoded}&searchType=image&num=1`),
    ]);

    const [webData, imgData] = await Promise.all([webRes.json(), imgRes.json()]);

    let productUrl = null;
    let imageUrl = null;

    // Best product URL: prefer domain match
    for (const item of webData.items || []) {
      if (domain && item.link?.includes(domain)) {
        productUrl = item.link;
        imageUrl = item.pagemap?.cse_image?.[0]?.src
          || item.pagemap?.product?.[0]?.image
          || null;
        break;
      }
    }
    if (!productUrl && webData.items?.[0]) {
      productUrl = webData.items[0].link;
      imageUrl = webData.items[0].pagemap?.cse_image?.[0]?.src || null;
    }

    // Image from image search (better quality)
    if (imgData.items?.[0]?.link) {
      imageUrl = imgData.items[0].link;
    }

    return { productUrl, imageUrl };
  } catch (err) {
    console.error('searchProduct error:', err.message);
    return { productUrl: null, imageUrl: null };
  }
}

async function proxyImage(imageUrl, res) {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.google.com/',
        'Accept': 'image/*,*/*',
      },
    });
    if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new Error('Not an image');
    const buffer = await imgRes.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
    return true;
  } catch (err) {
    console.error('proxyImage error:', err.message);
    return false;
  }
}

export default async function handler(req, res) {
  // GET /api/analyze?proxy=<encoded_url>  →  image proxy
  if (req.method === 'GET' && req.query.proxy) {
    const imageUrl = decodeURIComponent(req.query.proxy);
    const ok = await proxyImage(imageUrl, res);
    if (!ok) res.status(404).json({ error: 'Image unavailable' });
    return;
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const googleCx = process.env.GOOGLE_CX;

  if (!anthropicKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  if (!googleKey || !googleCx) return res.status(500).json({ error: 'GOOGLE_API_KEY or GOOGLE_CX not configured' });

  try {
    // Step 1: Claude vision analysis
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

    // Step 2: Collect all product searches and run in parallel
    const searchTasks = [];

    for (const room of parsed.rooms || []) {
      for (const item of room.items_to_improve || []) {
        for (const tier of ['low_cost', 'high_cost']) {
          const opt = item.options?.[tier];
          if (!opt?.search_query) continue;
          searchTasks.push(
            searchProduct(opt.search_query, opt.store, googleKey, googleCx)
              .then(({ productUrl, imageUrl }) => {
                if (productUrl) opt.product_url = productUrl;
                if (imageUrl) opt.image_url = `/api/analyze?proxy=${encodeURIComponent(imageUrl)}`;
              })
          );
        }
      }
    }

    // All Google searches fire at the same time
    await Promise.allSettled(searchTasks);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
