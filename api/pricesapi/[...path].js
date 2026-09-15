export default async function handler(req, res) {
  const apiKey = process.env.PRICES_API_KEY

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'PRICES_API_KEY is missing on Vercel',
    })
  }

  try {
    const path = Array.isArray(req.query.path)
      ? req.query.path.join('/')
      : req.query.path

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Missing API path',
      })
    }

    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'path') continue

      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item)
        }
      } else if (value !== undefined) {
        params.append(key, value)
      }
    }

    const targetUrl =
      `https://api.pricesapi.io/${path}?${params.toString()}`

    console.log('[PricesAPI] Calling:', targetUrl)

    const response = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    })

    const body = await response.text()

    console.log(
      '[PricesAPI] Response:',
      response.status
    )

    res.status(response.status)

    const contentType =
      response.headers.get('content-type')

    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    return res.send(body)
  } catch (error) {
    console.error('[PricesAPI] Proxy error:', error)

    return res.status(500).json({
      success: false,
      error: error?.message || 'Proxy request failed',
    })
  }
}