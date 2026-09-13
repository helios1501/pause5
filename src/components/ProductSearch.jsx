import { useState } from 'react'
import { searchPrices } from '../services/pricesApi.js'
import LoadingScreen from './LoadingScreen.jsx'

const SUGGESTIONS = [
  'iPhone 18 pro max',
  'Sony WH-1000XM5',
  'Tai nghe Bluetooth',
  'Máy xay sinh tố',
  'Dyson V15 Detect',
]

function formatPrice(value, currency = 'VND') {
  if (value == null || isNaN(value)) return '—'
  const symbolMap = {
    VND: '₫', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', SGD: 'S$',
  }
  const symbol = symbolMap[currency] || currency
  const digits = currency === 'VND' || currency === 'JPY' ? 0 : 2
  return `${Number(value).toLocaleString('vi-Vn', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} ${symbol}`
}

// Chỉ cho phép URL http/https — chặn javascript:/data:/# để tránh XSS khi mở tab mới.
function safeExternalUrl(url) {
  if (!url || typeof url !== 'string') return null
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

export default function ProductSearch({ onConfirm, onSkip }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  const handleSearch = async (e) => {
    e?.preventDefault?.()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await searchPrices(query)
      setPreview(data)
      if (data.results.length === 0) {
        setError('Không tìm thấy kết quả. Thử từ khoá khác (tiếng Anh thường match tốt hơn).')
      }
    } catch (err) {
      setError(err.message || 'Không thể tra cứu giá lúc này.')
    } finally {
      setLoading(false)
    }
  }

  const handleUsePrice = () => {
    if (!preview) return
    onConfirm({
      query: preview.query,
      best: preview.best,
      average: preview.average,
      lowest: preview.lowest,
      highest: preview.highest,
      currency: preview.currency,
      country: preview.country,
      isMock: preview.isMock,
      results: preview.results,
    })
  }

  // Khi đang tra giá → hiện LoadingScreen thay cho cả card để UX rõ ràng
  if (loading) {
    return (
      <LoadingScreen
        title="Đang tra giá sản phẩm…"
        subtitle={`PricesAPI đang tìm kiếm "${query.trim()}" trên Shopee, Lazada, Tiki, Walmart, Amazon…`}
      />
    )
  }

  return (
    <div className="pause5-card pause5-search">
      <span className="badge">BƯỚC 0 — TRA GIÁ</span>
      <h2>Sản phẩm bạn đang cân nhắc?</h2>
      <p className="hint">
        Nhập tên sản phẩm để hệ thống so sánh giá từ nhiều nguồn (PricesAPI) trước khi bạn làm bài
        tự đánh giá PAUSE-5. Có thể bỏ qua nếu bạn không cần so sánh giá.
      </p>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="VD: iPhone 15 128GB, Sony WH-1000XM5..."
          aria-label="Tên sản phẩm"
        />
        <button
          type="submit"
          className="pause5-btn pause5-btn-primary"
          disabled={!query.trim()}
        >
          Tra giá
        </button>
      </form>

      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            onClick={() => setQuery(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="search-error">{error}</div>}

      {preview && preview.results.length > 0 && (
        <div className="price-preview">
          <div className="price-summary">
            <div className="price-best">
              <div className="lbl">Giá tốt nhất</div>
              <div className="val">
                {preview.best
                  ? formatPrice(preview.best.price, preview.currency)
                  : '—'}
              </div>
              <div className="src">
                {preview.best
                  ? `${preview.best.source} · ${preview.best.title}`
                  : 'Không tìm thấy'}
              </div>
            </div>
            <div className="price-avg">
              <div className="lbl">Trung bình</div>
              <div className="val">
                {preview.average
                  ? formatPrice(preview.average, preview.currency)
                  : '—'}
              </div>
              <div className="src">
                {preview.results.length} nguồn
                {preview.isMock
                  ? ' · dữ liệu mẫu'
                  : preview.country
                    ? ` · PricesAPI ${preview.country.toUpperCase()}`
                    : ' · PricesAPI'}
              </div>
            </div>
          </div>

          <ul className="price-list">
            {preview.results.map((r, i) => {
              const safeUrl = safeExternalUrl(r.url)
              const Wrapper = safeUrl ? 'a' : 'div'
              const wrapperProps = safeUrl
                ? {
                    href: safeUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    'aria-label': `Mở ${r.title} tại ${r.source} trong tab mới`,
                  }
                : { role: 'listitem' }
              return (
                <Wrapper
                  key={`${r.source}-${i}`}
                  className="price-row-link"
                  {...wrapperProps}
                >
                  <span className={`src src-${(r.source || 'unknown').split('.')[0]}`}>
                    {r.source}
                  </span>
                  <span className="title">
                    {r.title}
                    {r.stock && r.stock !== 'in_stock' && (
                      <small style={{ marginLeft: 6, color: 'var(--text-muted)' }}>
                        ({r.stock})
                      </small>
                    )}
                  </span>
                  <span className="price">
                    {formatPrice(r.price, r.currency || preview.currency)}
                  </span>
                  {safeUrl && <span className="ext" aria-hidden="true">↗</span>}
                </Wrapper>
              )
            })}
          </ul>

          <div className="search-actions">
            <button
              type="button"
              className="pause5-btn pause5-btn-ghost"
              onClick={() => setPreview(null)}
            >
              ← Tìm lại
            </button>
            <button
              type="button"
              className="pause5-btn pause5-btn-primary"
              onClick={handleUsePrice}
              disabled={!preview.best}
            >
              Dùng giá này & làm PAUSE-5 →
            </button>
          </div>
        </div>
      )}

      {!preview && (
        <div className="search-actions">
          <button
            type="button"
            className="pause5-btn pause5-btn-ghost"
            onClick={onSkip}
          >
            Bỏ qua, làm PAUSE-5 trước
          </button>
        </div>
      )}
    </div>
  )
}