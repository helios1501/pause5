import { SCALE_LABELS } from '../questions.js'

const TOTAL_FACTORS = 5

export default function FactorScreen({
  factor,
  factorIndex,
  answers,
  onAnswer,
  onPrev,
  onNext,
}) {
  const allAnswered = factor.questions.every((_, i) => answers[`${factor.key}${i + 1}`])

  return (
    <div className="pause5-card">
      <div className="pause5-factor-pill">
        <span className="dot-icon">{factor.icon}</span>
        <span>
          {factor.title} — {factor.subtitle}
        </span>
      </div>
      <h3 className="pause5-screen-title">
        Bước {factorIndex + 1} / {TOTAL_FACTORS}
      </h3>
      <p className="pause5-screen-sub">
        Chọn mức 1–5 phù hợp nhất với tình huống hiện tại của bạn.
      </p>
      {factor.questions.map((q, qIdx) => {
        const id = `${factor.key}${qIdx + 1}`
        const value = answers[id]
        return (
          <div className="pause5-question" key={id}>
            <div className="q-label">CÂU {id}</div>
            <div className="q-text">{q}</div>
            <div className="pause5-scale" role="radiogroup" aria-label={q}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={value === n ? 'selected' : ''}
                  onClick={() => onAnswer(id, n)}
                  aria-pressed={value === n}
                  aria-label={`${n} - ${SCALE_LABELS[n]}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="pause5-scale-legend">
              <span>1 — Hoàn toàn không đúng</span>
              <span>5 — Hoàn toàn đúng</span>
            </div>
          </div>
        )
      })}
      <div className="pause5-nav">
        <button className="pause5-btn pause5-btn-ghost" onClick={onPrev}>
          ← Quay lại
        </button>
        <button
          className="pause5-btn pause5-btn-primary"
          onClick={onNext}
          disabled={!allAnswered}
        >
          {factorIndex === TOTAL_FACTORS - 1 ? 'Xem kết quả →' : 'Tiếp theo →'}
        </button>
      </div>
    </div>
  )
}
