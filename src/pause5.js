// Logic tính điểm & quy tắc khóa PAUSE-5
// Công thức % từ PDF:
//   Điểm % = (trung bình - 1) / 4 * 100
// Quy tắc 1: E < 3  => 🔴 KHÔNG NÊN MUA LÚC NÀY (khoá cứng)
// Quy tắc 2: A < 3 hoặc S < 3 => tối đa 🟢 CẦN XEM THÊM
// Quy tắc 3: U < 3 => 🟢 CẦN XEM THÊM – HÃY TẠM DỪNG
// Quy tắc 4: P < 3 => tối đa 🟢 CẦN XEM THÊM

import { FACTORS } from './questions.js'

export function avgToPercent(avg) {
  // avg từ 1..5, đổi sang % theo (avg-1)/4*100
  return Math.max(0, Math.min(100, ((avg - 1) / 4) * 100))
}

export function factorAverage(answers, factorKey) {
  const factor = FACTORS.find((f) => f.key === factorKey)
  if (!factor) return null
  const values = factor.questions.map((_, idx) => answers[`${factorKey}${idx + 1}`])
  if (values.some((v) => v === undefined || v === null)) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function computeScores(answers) {
  const factorScores = {}
  let sumPct = 0
  let count = 0
  for (const f of FACTORS) {
    const avg = factorAverage(answers, f.key)
    const pct = avgToPercent(avg)
    factorScores[f.key] = { avg, pct }
    sumPct += pct
    count += 1
  }
  const totalPct = count ? sumPct / count : 0
  return { factorScores, totalPct }
}

// Áp dụng 4 quy tắc khóa, trả về kết quả cuối cùng
export function applyRules(scores) {
  const { factorScores, totalPct } = scores
  const E = factorScores.E.avg
  const A = factorScores.A.avg
  const S = factorScores.S.avg
  const U = factorScores.U.avg
  const P = factorScores.P.avg

  // Quy tắc 1 — E là điều kiện cứng
  if (E < 3) {
    return {
      level: 'red',
      title: 'KHÔNG NÊN MUA LÚC NÀY',
      reason:
        'Sản phẩm không thực sự cần hoặc không phù hợp khả năng chi tiêu của bạn. Hãy cân nhắc lại nhu cầu và ngân sách trước khi quyết định.',
      highlights: ['E'],
    }
  }

  // Quy tắc 3 — Urgency thấp
  if (U < 3) {
    return {
      level: 'yellow',
      title: 'CẦN XEM THÊM – HÃY TẠM DỪNG',
      reason:
        'Bạn có thể đang chịu áp lực mua nhanh. Hãy chờ thêm trước khi quyết định và kiểm tra kỹ các yếu tố thúc đẩy.',
      highlights: ['U'],
    }
  }

  // Quy tắc 2 — Assess hoặc Search quá thấp
  if (A < 3 || S < 3) {
    return {
      level: 'yellow',
      title: 'CẦN XEM THÊM',
      reason:
        'Bạn chưa có đủ căn cứ hoặc chưa kiểm chứng thông tin đầy đủ. Hãy dành thêm thời gian tìm hiểu từ nhiều nguồn.',
      highlights: ['A', 'S'].filter((k) => factorScores[k].avg < 3),
    }
  }

  // Quy tắc 4 — Promotion chưa rõ
  if (P < 3) {
    return {
      level: 'yellow',
      title: 'CẦN XEM THÊM',
      reason:
        'Bạn chưa xác định rõ lợi ích thương mại của người giới thiệu. Hãy kiểm tra tài trợ, affiliate, mã giảm giá hoặc link bán hàng.',
      highlights: ['P'],
    }
  }

  // Ngưỡng tổng
  if (totalPct >= 75) {
    return {
      level: 'green',
      title: 'CÓ THỂ CÂN NHẮC MUA',
      reason:
        'Bạn đã nhận diện khá rõ mục đích thương mại, kiểm chứng thông tin và đánh giá sản phẩm dựa trên nhu cầu của bản thân. PAUSE-5 không đảm bảo sản phẩm tốt, nhưng cho thấy quyết định của bạn đã được cân nhắc tương đối đầy đủ.',
      highlights: [],
    }
  }

  if (totalPct >= 50) {
    return {
      level: 'yellow',
      title: 'CẦN XEM THÊM',
      reason:
        'Bạn chưa có đủ thông tin để quyết định. Hãy tập trung vào các bước được đánh dấu màu vàng.',
      highlights: Object.keys(factorScores).filter((k) => factorScores[k].pct < 75),
    }
  }

  return {
    level: 'red',
    title: 'KHÔNG NÊN MUA LÚC NÀY',
    reason:
      'Quyết định hiện tại còn thiếu căn cứ hoặc chịu ảnh hưởng mạnh bởi yếu tố thúc mua. Hãy tạm dừng trước khi thanh toán.',
    highlights: Object.keys(factorScores),
  }
}

export function getResult(answers) {
  const scores = computeScores(answers)
  const result = applyRules(scores)
  return { scores, result }
}
