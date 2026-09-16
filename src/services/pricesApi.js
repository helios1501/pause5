const COUNTRY_FALLBACK = ['vn', 'us', 'au']

const DEFAULT_LIMIT = 4
const DEFAULT_OFFERS_LIMIT = 5
const REQUEST_TIMEOUT = 95_000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Chuẩn hóa một product thành danh sách các offer.
 *
 * @param {Object} product
 * @returns {Array}
 */
function expandProductOffers(product) {
  const out = []

  const baseTitle = product?.title || 'Sản phẩm'
  const baseRating = product?.rating ?? null
  const baseUrl = product?.url || null

  const offers = Array.isArray(product?.offers)
    ? product.offers
    : []

  // Không có offer riêng -> sử dụng thông tin product.
  if (offers.length === 0) {
    const price = Number(product?.price ?? 0)

    if (price > 0) {
      out.push({
        source: String(product?.source || 'unknown').toLowerCase(),
        title: baseTitle,
        price,
        currency: product?.currency || 'USD',
        url: baseUrl || '#',
        rating: baseRating,
        seller: product?.source || 'Unknown',
        condition: product?.condition || 'new',
        stock: product?.stock_status || null,
      })
    }

    return out
  }

  for (const offer of offers) {
    const price = Number(
      offer?.price ??
      product?.price ??
      0
    )

    if (price <= 0) continue

    out.push({
      source: String(
        offer?.seller ||
        product?.source ||
        'unknown'
      ).toLowerCase(),

      title:
        offer?.product_title ||
        baseTitle,

      price,

      currency:
        offer?.currency ||
        product?.currency ||
        'USD',

      url:
        offer?.url ||
        offer?.seller_url ||
        baseUrl ||
        '#',

      rating: baseRating,

      seller:
        offer?.seller ||
        product?.source ||
        'Unknown',

      condition:
        offer?.condition ||
        product?.condition ||
        'new',

      stock:
        offer?.stock_status ||
        null,
    })
  }

  return out
}

/**
 * Gọi PricesAPI thông qua backend proxy.
 *
 * Thử lần lượt:
 * VN -> US -> AU
 *
 * @param {string} query
 * @returns {Promise<{offers: Array, country: string} | null>}
 */
async function callRealProvider(query) {
  for (const country of COUNTRY_FALLBACK) {
    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
    }, REQUEST_TIMEOUT)

    try {
      const params = new URLSearchParams({
        q: query,
        country,
        limit: String(DEFAULT_LIMIT),
        offers_limit: String(DEFAULT_OFFERS_LIMIT),
      })

      // Gọi qua backend/proxy để không làm lộ API key.
      const endpoint =
        `/api/pricesapi?${params.toString()}`

      const res = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      })

      // Sai key / hết quota.
      // Không tiếp tục country khác để tránh request không cần thiết.
      if (res.status === 401 || res.status === 403) {
        console.warn(
          `[PricesAPI] Authentication/quota failed: HTTP ${res.status}`
        )

        return null
      }

      // Country không có data hoặc server lỗi.
      if (!res.ok) {
        console.warn(
          `[PricesAPI] ${country}: HTTP ${res.status} - thử country tiếp theo`
        )

        await sleep(150)
        continue
      }

      const json = await res.json()

      if (!json || json.success === false) {
        console.warn(
          `[PricesAPI] ${country}: success=false`,
          json?.error || ''
        )

        await sleep(150)
        continue
      }

      const products = Array.isArray(json?.data?.products)
        ? json.data.products
        : []

      if (products.length === 0) {
        console.info(
          `[PricesAPI] ${country}: không tìm thấy sản phẩm`
        )

        await sleep(150)
        continue
      }

      const flat = products
        .flatMap(expandProductOffers)
        .filter((item) => Number(item.price) > 0)

      if (flat.length > 0) {
        console.info(
          `[PricesAPI] ${country}: ${flat.length} offers từ ${products.length} sản phẩm`
        )

        return {
          offers: flat,
          country,
        }
      }

      await sleep(150)
    } catch (err) {
      if (err?.name === 'AbortError') {
        console.warn(
          `[PricesAPI] ${country}: request timeout`
        )
      } else {
        console.warn(
          `[PricesAPI] ${country} failed:`,
          err?.message || err
        )
      }

      await sleep(150)
    } finally {
      clearTimeout(timeout)
    }
  }

  return null
}

/**
 * Mock data dùng khi API không hoạt động.
 *
 * @param {string} query
 * @returns {Array}
 */
function buildMockResults(query) {
  const q = (query || 'sản phẩm').trim()

  const base = Math.max(q.length, 1) * 250_000

  return [
    {
      source: 'shopeeMock',
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
      url: 'https://www.lazada.vn/',
      rating: 4.3,
      seller: 'LazMall',
      condition: 'new',
      stock: 'in_stock',
    },

    {
      source: 'tiki',
      title: q,
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
      url: 'https://www.amazon.com/',
      rating: 4.5,
      seller: 'Amazon Global',
      condition: 'new',
      stock: 'in_stock',
    },
  ]
}

/**
 * Tìm kiếm và so sánh giá sản phẩm.
 *
 * @param {string} query Tên hoặc URL sản phẩm.
 *
 * @returns {Promise<{
 *   query: string,
 *   results: Array,
 *   best: Object|null,
 *   average: number,
 *   lowest: number,
 *   highest: number,
 *   currency: string,
 *   isMock: boolean,
 *   country: string|null
 * }>}
 */
export async function searchPrices(query) {
  const trimmed = (query || '').trim()

  if (!trimmed) {
    return {
      query: '',
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

  const providerResult = await callRealProvider(trimmed)

  let results
  let isMock
  let country

  if (
    providerResult?.offers &&
    providerResult.offers.length > 0
  ) {
    results = providerResult.offers
    isMock = false
    country = providerResult.country
  } else {
    results = buildMockResults(trimmed)
    isMock = true
    country = null
  }

  const priced = results
    .filter((item) => Number(item.price) > 0)
    .sort(
      (a, b) =>
        Number(a.price) - Number(b.price) ||
        String(a.source).localeCompare(String(b.source))
    )

  if (priced.length === 0) {
    return {
      query: trimmed,
      results: [],
      best: null,
      average: 0,
      lowest: 0,
      highest: 0,
      currency: 'VND',
      isMock,
      country,
    }
  }

  const prices = priced.map((item) =>
    Number(item.price)
  )

  const currency =
    priced[0]?.currency ||
    'VND'

  const lowest = Math.min(...prices)
  const highest = Math.max(...prices)

  const average = Math.round(
    prices.reduce(
      (sum, price) => sum + price,
      0
    ) / prices.length
  )

  const best =
    priced.find(
      (item) => Number(item.price) === lowest
    ) || null

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
 * Đánh giá giá sản phẩm so với giá trung bình thị trường.
 *
 * @param {number} price
 * @param {number} average
 *
 * @returns {'cheap'|'fair'|'expensive'|'unknown'}
 */
export function evaluatePriceVsMarket(price, average) {
  const currentPrice = Number(price)
  const marketAverage = Number(average)

  if (
    currentPrice <= 0 ||
    marketAverage <= 0
  ) {
    return 'unknown'
  }

  const ratio =
    currentPrice / marketAverage

  if (ratio <= 0.9) {
    return 'cheap'
  }

  if (ratio <= 1.1) {
    return 'fair'
  }

  return 'expensive'
}