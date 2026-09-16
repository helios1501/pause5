export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    })
  }

  const apiKey = process.env.PRICES_API_KEY

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'PRICES_API_KEY is missing',
    })
  }

  try {
    const {
      q,
      country = 'au',
      limit = '4',
      offers_limit = '5',
    } = req.query

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Missing q',
      })
    }

    const params = new URLSearchParams({
      q,
      country,
      limit,
      offers_limit,
    })

    const response = await fetch(
      `https://api.pricesapi.io/api/v1/products/search?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    const body = await response.text()

    res.status(response.status)

    const contentType = response.headers.get('content-type')

    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    return res.send(body)
  } catch (error) {
    console.error('[PricesAPI]', error)

    return res.status(500).json({
      success: false,
      error: error?.message || 'PricesAPI request failed',
    })
  }
}