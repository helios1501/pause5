import { useMemo } from 'react'
import { FACTORS } from '../questions.js'
import { getResult } from '../pause5.js'
import BarRow from './BarRow.jsx'

export default function ResultScreen({ answers, onRestart }) {
  const data = useMemo(() => getResult(answers), [answers])
  const { scores, result } = data
  const total = Math.round(scores.totalPct)
  const cls = result.level

  return (
    <div className="pause5-card pause5-result">
      <div className={`pause5-result ${cls}`}>
        <div className="label">{result.title}</div>
        <div className="total">{total}%</div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
          ĐIỂM SẴN SÀNG RA QUYẾT ĐỊNH PAUSE-5
        </p>
      </div>
      <p className="reason">{result.reason}</p>
      <div className="pause5-bars">
        {FACTORS.map((f) => (
          <BarRow
            key={f.key}
            factor={f}
            score={scores.factorScores[f.key]}
            highlighted={result.highlights.includes(f.key)}
          />
        ))}
      </div>
      <button className="pause5-btn pause5-btn-primary" onClick={onRestart}>
        Làm lại
      </button>
      <div className="pause5-disclaimer">
        PAUSE-5 không đánh giá chất lượng sản phẩm và không dự đoán xác suất mua hàng thành công.
        Đây là chỉ số mức độ sẵn sàng ra quyết định — phản ánh bạn đã nhận diện, kiểm chứng và
        cân nhắc đủ trước khi mua hay chưa.
      </div>
    </div>
  )
}
