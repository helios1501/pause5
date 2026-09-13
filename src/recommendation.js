// Kết hợp điểm PAUSE-5 với dữ liệu so sánh giá để ra khuyến nghị cuối cùng.
// Quy tắc:
//   1. Nếu PAUSE-5 = RED (không nên mua) => HOÃN LẠI, bất kể giá.
//   2. Nếu giá best > average * 1.1 (đắt hơn thị trường 10%) => CÂN NHẮC.
//   3. Nếu PAUSE-5 = GREEN và giá cheap/fair => NÊN MUA.
//   4. Còn lại => CÂN NHẮC.

import { applyRules } from './pause5.js'
import { evaluatePriceVsMarket } from './services/pricesApi.js'

export const RECOMMEND_BUY = 'buy'
export const RECOMMEND_CONSIDER = 'consider'
export const RECOMMEND_HOLD = 'hold'

const PRICE_LABEL = {
  cheap: { label: 'Rẻ hơn thị trường', emoji: '💸' },
  fair: { label: 'Giá hợp lý', emoji: '✅' },
  expensive: { label: 'Đắt hơn thị trường', emoji: '⚠️' },
  unknown: { label: 'Chưa đủ dữ liệu giá', emoji: 'ℹ️' },
}

/**
 * @param {object} pauseScores - từ pause5.computeScores
 * @param {object} priceData - từ pricesApi.searchPrices
 */
export function getFinalRecommendation(pauseScores, priceData) {
  const pauseResult = applyRules(pauseScores)
  const bestPrice = priceData?.best?.price ?? 0
  const avgPrice = priceData?.average ?? 0
  const priceEval = evaluatePriceVsMarket(bestPrice, avgPrice)

  let decision = RECOMMEND_CONSIDER
  let reasons = []

  // Quy tắc 1 — PAUSE-5 RED khoá cứng
  if (pauseResult.level === 'red') {
    decision = RECOMMEND_HOLD
    reasons.push('PAUSE-5 đánh giá bạn chưa sẵn sàng ra quyết định.')
  } else if (pauseResult.level === 'green') {
    if (priceEval === 'cheap' || priceEval === 'fair') {
      decision = RECOMMEND_BUY
      reasons.push('Bạn đã cân nhắc kỹ (PAUSE-5 đạt) và giá tốt so với thị trường.')
    } else if (priceEval === 'expensive') {
      decision = RECOMMEND_CONSIDER
      reasons.push('Bạn đã cân nhắc kỹ, nhưng giá đang cao hơn thị trường ~10% trở lên.')
    } else {
      decision = RECOMMEND_CONSIDER
      reasons.push('Bạn đã cân nhắc kỹ, nhưng chưa có dữ liệu giá để so sánh.')
    }
  } else {
    // PAUSE-5 YELLOW
    if (priceEval === 'expensive') {
      decision = RECOMMEND_HOLD
      reasons.push('PAUSE-5 còn cảnh báo và giá đang cao hơn thị trường.')
    } else {
      decision = RECOMMEND_CONSIDER
      reasons.push('PAUSE-5 còn một số yếu tố cần xem thêm.')
    }
  }

  return {
    decision,
    pauseLevel: pauseResult.level,
    pauseTitle: pauseResult.title,
    priceEval,
    priceLabel: PRICE_LABEL[priceEval].label,
    priceEmoji: PRICE_LABEL[priceEval].emoji,
    reasons,
  }
}

export const DECISION_META = {
  [RECOMMEND_BUY]: {
    title: '🟢 NÊN MUA',
    color: 'green',
    short: 'Bạn đã sẵn sàng và giá tốt — có thể tiến hành mua.',
  },
  [RECOMMEND_CONSIDER]: {
    title: '🟡 CÂN NHẮC',
    color: 'yellow',
    short: 'Có tín hiệu tốt nhưng còn điểm cần kiểm thêm trước khi thanh toán.',
  },
  [RECOMMEND_HOLD]: {
    title: '🔴 HOÃN LẠI',
    color: 'red',
    short: 'Chưa phải lúc — hãy tạm dừng và cân nhắc thêm.',
  },
}