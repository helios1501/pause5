// Service tích hợp PricesAPI (https://pricesapi.io/) để so sánh giá sản phẩm.
// Lưu ý quan trọng: PricesAPI là API trả phí theo credits — key của bạn trong .env
// là dạng `pricesapi_xxx` và PHẢI được truyền qua header Authorization.
//
// Vì gọi trực tiếp từ browser sẽ lộ key (F12 là thấy), đây chỉ phù hợp cho dev/demo.
// Khi đưa lên production, hãy gọi qua backend proxy giấu key.
// Endpoint: GET https://api.pricesapi.io/api/v1/products/search
//            params: q (tên sản phẩm), country (us/vn/gb/...), limit, offers_limit
//            header: Authorization: Bearer <KEY>
// Response:  { success, data: { products: [...] }, meta }
//
// Khi không có key, không có mạng, hoặc lỗi bất kỳ, fallback sang mock data để flow vẫn chạy.

const API_KEY = import.meta.env.VITE_PRICES_API_KEY

// Thử theo thứ tự: VN → US → GB. PricesAPI yêu cầu country hợp lệ.
const COUNTRY_FALLBACK = ['vn', 'us', 'gb']
const DEFAULT_LIMIT = 4 // số sản phẩm trả về / quốc gia
const DEFAULT_OFFERS_LIMIT = 5 // số offer trong mỗi sản phẩm

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Chuẩn hoá 1 product (kèm các offer của nó) thành danh sách phẳng các "lời chào giá".
// Một sản phẩm có thể có nhiều offer (seller khác nhau, giá khác nhau).
//   { source, title, price, currency, url, rating, seller, condition, stock }
function expandProductOffers(product) {
  const out = []
  const baseTitle = product.title || 'Sản phẩm'
  const baseRating = product.rating ?? null
  const baseUrl = product.url || null

  const offers = Array.isArray(product.offers) ? product.offers : []
  if (offers.length === 0) {
    // Không có offer riêng → dùng luôn thông tin sản phẩm làm 1 dòng
    out.push({
      source: (product.source || 'unknown').toLowerCase(),
      title: baseTitle,
      price: Number(product.price || 0),
      currency: product.currency || 'USD',
      url: baseUrl,
      rating: baseRating,
      seller: product.source || 'Unknown',
      condition: product.condition || 'new',
      stock: null,
    })
    return out
  }

  for (const offer of offers) {
    out.push({
      source: (offer.seller || product.source || 'unknown').toLowerCase(),
      title: offer.product_title || baseTitle,
      price: Number(offer.price ?? product.price ?? 0),
      currency: offer.currency || product.currency || 'USD',
      url: offer.url || offer.seller_url || baseUrl || '#',
      rating: baseRating,
      seller: offer.seller || product.source || 'Unknown',
      condition: offer.condition || product.condition || 'new',
      stock: offer.stock_status || null,
    })
  }
  return out
}

// Gọi PricesAPI thật — thử tuần tự các country cho đến khi có data.
// Lưu ý: trong dev, gọi qua Vite proxy (/api/pricesapi) để giấu Authorization header
// và bypass CORS. Khi deploy production, route proxy này cần được handle bởi backend.
async function callRealProvider(query) {
  if (!API_KEY || API_KEY === 'YOUR_KEY_HERE') return null

  for (const country of COUNTRY_FALLBACK) {
    try {
      const params = new URLSearchParams({
        q: query,
        country,
        limit: String(DEFAULT_LIMIT),
        offers_limit: String(DEFAULT_OFFERS_LIMIT),
      })
      const url = `/api/pricesapi/api/v1/products/search?${params.toString()}`
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      })

      // 401/403/429: dừng luôn, đỡ tốn credit
      if (res.status === 401 || res.status === 403) {
        console.warn('[PricesAPI] Auth failed, dừng thử country khác:', res.status)
        return null
      }

      if (!res.ok) throw new Error(`PricesAPI ${country} HTTP ${res.status}`)

      const json = await res.json()
      if (!json || json.success === false) {
        // Country này không có data, thử country tiếp theo
        console.warn(`[PricesAPI] ${country} trả về success=false:`, json?.error)
        await sleep(150)
        continue
      }

      const products = json?.data?.products || []
      if (!products.length) {
        await sleep(150)
        continue
      }

      const flat = products.flatMap(expandProductOffers).filter((r) => r.price > 0)
      if (flat.length) {
        console.info(`[PricesAPI] ${country} trả về ${flat.length} offers từ ${products.length} sản phẩm`)
        return { offers: flat, country }
      }
    } catch (err) {
      console.warn(`[PricesAPI] ${country} failed:`, err.message)
      await sleep(150)
    }
  }
  return null
}

// Mock data dùng khi không có key hoặc API lỗi — giúp demo flow đầy đủ.
function buildMockResults(query) {
  const q = (query || 'sản phẩm').trim()
  const base = (q.length || 1) * 250_000
  return [
    {
      source: 'shopee',
      title: `${q} - phiên bản tiêu chuẩn`,
      price: Math.round(base * 0.92),
      currency: 'VND',
      url: 'https://shopee.vn/',
      rating: 4.6,
      seller: 'Shop Official',
      condition: 'new',
      stock: 'in_stock',
    },
    {
      source: 'lazada',
      title: `${q} - chính hãng`,
      price: Math.round(base * 1.05),
      currency: 'VND',
      url: 'https://lazada.vn/',
      rating: 4.3,
      seller: 'LazMall',
      condition: 'new',
      stock: 'in_stock',
    },
    {
      source: 'tiki',
      title: `${q}`,
      price: Math.round(base * 0.98),
      currency: 'VND',
      url: 'https://tiki.vn/',
      rating: 4.7,
      seller: 'Tiki Trading',
      condition: 'new',
      stock: 'in_stock',
    },
    {
      source: 'amazon',
      title: `${q} (global)`,
      price: Math.round(base * 1.18),
      currency: 'VND',
      url: 'https://amazon.com/',
      rating: 4.5,
      seller: 'Amazon Global',
      condition: 'new',
      stock: 'in_stock',
    },
  ]
}

/**
 * Tìm kiếm & so sánh giá một sản phẩm.
 * @param {string} query - tên sản phẩm hoặc URL sản phẩm
 * @returns {Promise<{query, results, best, average, lowest, highest, currency, isMock, country}>}
 */
export async function searchPrices(query) {
  const trimmed = (query || '').trim()
  if (!trimmed) {
    return {
      query: trimmed,
      results: [],
      best: null,
      average: 0,
      lowest: 0,
      highest: 0,
      currency: 'VND',
      isMock: true,
      country: null,
    }
  }

  let providerResult = await callRealProvider(trimmed)
  let results = providerResult?.offers
  let isMock = false
  let country = providerResult?.country || null
  if (!results) {
    results = buildMockResults(trimmed)
    isMock = true
  }

  const priced = results.filter((r) => r.price > 0)
  // Sort tăng dần theo giá để UI hiển thị từ rẻ → đắt.
  // Ổn định thêm tie-breaker theo tên nguồn để thứ tự không nhảy lung tung
  // giữa các lần refresh cùng một query.
  priced.sort((a, b) => a.price - b.price || String(a.source).localeCompare(String(b.source)))
  const prices = priced.map((r) => r.price)
  const currency = priced[0]?.currency || 'VND'

  const lowest = prices.length ? Math.min(...prices) : 0
  const highest = prices.length ? Math.max(...prices) : 0
  const average = prices.length
    ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
    : 0
  const best = priced.find((r) => r.price === lowest) || null

  return {
    query: trimmed,
    results: priced,
    best,
    average,
    lowest,
    highest,
    currency,
    isMock,
    country,
  }
}

/**
 * Đánh giá mức giá so với trung bình thị trường.
 * @returns {'cheap' | 'fair' | 'expensive' | 'unknown'}
 */
export function evaluatePriceVsMarket(price, average) {
  if (!price || !average) return 'unknown'
  const ratio = price / average
  if (ratio <= 0.9) return 'cheap'
  if (ratio <= 1.1) return 'fair'
  return 'expensive'
}