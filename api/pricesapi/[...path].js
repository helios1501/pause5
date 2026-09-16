export default async function handler(req, res) {
  // Cho phép frontend gọi API này
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const apiKey = process.env.PRICES_API_KEY

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing PRICES_API_KEY',
      })
    }

    const { q, country = 'au', limit = '4', offers_limit = '5' } = req.query

    const params = new URLSearchParams({
      q,
      country,
      limit,
      offers_limit,
    })

    const response = await fetch(
      `https://api.pricesapi.io/api/v1/products/search?${params}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    const data = await response.json()

    return res.status(response.status).json(data)
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}