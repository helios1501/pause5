// Vercel serverless function: forward mọi request /api/pricesapi/* sang PricesAPI
// và tự đính kèm Authorization header từ env VITE_PRICES_API_KEY (hoặc PRICES_API_KEY).
//
// Cú pháp file [...path].js bắt mọi path con, ví dụ:
//   GET /api/pricesapi/api/v1/products/search?q=...  →  pricesapi.io/api/v1/products/search?q=...
//
// Lý do cần proxy:
//   1. Giấu Authorization key khỏi browser (Network tab, referer leak...)
//   2. Bypass CORS — PricesAPI không cho browser gọi trực tiếp
//   3. Cho phép gộp logic retry / fallback country tùy ý ở server-side

const UPSTREAM = 'https://api.pricesapi.io'
const KEY_ENV_NAMES = ['VITE_PRICES_API_KEY', 'PRICES_API_KEY']

function getApiKey() {
  for (const name of KEY_ENV_NAMES) {
    const v = process.env[name]
    if (v && v !== 'YOUR_KEY_HERE') return v
  }
  return null
}

export default async function handler(req, res) {
  const apiKey = getApiKey()
  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message:
          'Server thiếu VITE_PRICES_API_KEY. Thêm vào Vercel env hoặc .env rồi redeploy.',
      },
    })
    return
  }

  // req.url chứa "/api/v1/products/search?q=..." (Vercel đã strip prefix /api/pricesapi)
  const targetUrl = `${UPSTREAM}${req.url}`

  try {
    // Chỉ forward các method an toàn (GET/HEAD); block POST/PUT... để tránh lạm dụng
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.status(405).json({ success: false, error: { message: 'Method not allowed' } })
      return
    }

    // Forward một số header hữu ích từ client lên upstream
    const forwardHeaders = {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'User-Agent': 'Pause5/1.0 (vercel-proxy)',
    }
    if (req.headers['accept-language']) {
      forwardHeaders['Accept-Language'] = req.headers['accept-language']
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      // Body chỉ áp dụng cho POST/PUT; ở đây chỉ GET nên bỏ qua
    })

    // Forward status + body + một số header về client
    res.status(upstream.status)

    const contentType = upstream.headers.get('content-type') || 'application/json'
    res.setHeader('Content-Type', contentType)

    // Cache public 60s để giảm credit, stale-while-revalidate 5 phút
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

    const body = await upstream.text()
    res.send(body)
  } catch (err) {
    console.error('[pricesapi proxy] error:', err)
    res.status(502).json({
      success: false,
      error: {
        code: 'UPSTREAM_UNREACHABLE',
        message: 'Không kết nối được PricesAPI.',
        details: err?.message || String(err),
      },
    })
  }
}