import { useMemo } from 'react'
import { FACTORS } from '../questions.js'
import { computeScores } from '../pause5.js'
import { getFinalRecommendation, DECISION_META } from '../recommendation.js'
import BarRow from './BarRow.jsx'

// Format số theo locale Việt Nam kèm currency symbol. PricesAPI trả về currency
// code (USD, VND, AUD, GBP...) — chuyển sang symbol cho dễ đọc.
const CURRENCY_SYMBOL = {
  VND: '₫',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  SGD: 'S$',
}

function formatPrice(value, currency = 'VND') {
  if (value == null || isNaN(value)) return '—'
  const symbol = CURRENCY_SYMBOL[currency] || currency
  // VND không cần phần thập phân; các loại khác giữ 2 chữ số
  const fractionDigits = currency === 'VND' || currency === 'JPY' ? 0 : 2
  return `${Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
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

export default function ResultScreen({ answers, product, onRestart }) {
  const scores = useMemo(() => computeScores(answers), [answers])
  const total = Math.round(scores.totalPct)

  // Khuyến nghị cuối — kết hợp PAUSE-5 + dữ liệu giá (nếu có)
  const reco = useMemo(() => {
    const priceData = product
      ? {
          best: { price: product.best?.price ?? 0 },
          average: product.average,
          results: product.results || [],
        }
      : { best: null, average: 0, results: [] }
    return getFinalRecommendation(scores, priceData)
  }, [scores, product])

  const cls = scores.factorScores
  const meta = DECISION_META[reco.decision]
  const highlights = reco.decision === 'hold'
    ? Object.keys(cls)
    : reco.decision === 'consider'
      ? Object.keys(cls).filter((k) => cls[k].pct < 75)
      : []

  const currency = product?.currency || 'VND'

  return (
    <div className="pause5-card pause5-result">
      <div className={`pause5-result-final ${meta.color}`}>
        <div className="final-label">{meta.title}</div>
        <div className="final-short">{meta.short}</div>
        <div className="total-row">
          <div className="pause5-score">
            <div className="lbl">PAUSE-5</div>
            <div className="val">{total}%</div>
          </div>
          {product && (
            <div className="pause5-score">
              <div className="lbl">
                Giá tốt nhất {reco.priceEmoji}
              </div>
              <div className="val">
                {product.best?.price
                  ? formatPrice(product.best.price, currency)
                  : '—'}
              </div>
              <div className="sub">{reco.priceLabel}</div>
            </div>
          )}
        </div>
      </div>

      {product && (
        <div className="product-card">
          <div className="product-card-title">
            🛒 {product.query}
          </div>
          <div className="product-card-grid">
            <div>
              <div className="lbl">Nguồn tốt nhất</div>
              <div className="val">
                {product.best?.source?.toUpperCase() || '—'}
              </div>
            </div>
            <div>
              <div className="lbl">Trung bình</div>
              <div className="val">
                {product.average
                  ? formatPrice(product.average, currency)
                  : '—'}
              </div>
            </div>
            <div>
              <div className="lbl">Chênh lệch</div>
              <div className="val">
                {product.best && product.average
                  ? `${Math.round(
                      ((product.best.price - product.average) / product.average) * 100,
                    )}%`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="lbl">Nguồn dữ liệu</div>
              <div className="val">
                {product.isMock
                  ? 'Demo (mock)'
                  : `PricesAPI · ${(product.country || 'auto').toUpperCase()}`}
              </div>
            </div>
          </div>
          {product.results?.length > 0 && (
            <ul className="product-card-list">
              {product.results.slice(0, 6).map((r, i) => {
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
                    key={i}
                    className="price-row-link"
                    {...wrapperProps}
                  >
                    <span className={`src src-${r.source?.split('.')[0] || 'unknown'}`}>
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
                      {formatPrice(r.price, r.currency || currency)}
                    </span>
                    {safeUrl && <span className="ext" aria-hidden="true">↗</span>}
                  </Wrapper>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <ul className="reasons">
        {reco.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <div className="pause5-bars">
        {FACTORS.map((f) => (
          <BarRow
            key={f.key}
            factor={f}
            score={cls[f.key]}
            highlighted={highlights.includes(f.key)}
          />
        ))}
      </div>

      <button className="pause5-btn pause5-btn-primary" onClick={onRestart}>
        Làm lại
      </button>
      <div className="pause5-disclaimer">
        PAUSE-5 không đánh giá chất lượng sản phẩm và không dự đoán xác suất mua hàng thành công.
        Đây là chỉ số mức độ sẵn sàng ra quyết định — phản ánh bạn đã nhận diện, kiểm chứng và
        cân nhắc đủ trước khi mua hay chưa. Phần so sánh giá chỉ mang tính tham khảo từ
        PricesAPI; vui lòng kiểm tra lại trên trang bán trước khi thanh toán.
      </div>
    </div>
  )
}