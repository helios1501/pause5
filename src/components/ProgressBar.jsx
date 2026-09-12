export default function ProgressBar({ factorIndex, factors, answers }) {
  return (
    <div className="pause5-progress" aria-hidden="true">
      {factors.map((f, i) => {
        const answered = f.questions.filter((_, qIdx) => answers[`${f.key}${qIdx + 1}`]).length
        const total = f.questions.length
        const pct = Math.round((answered / total) * 100)
        let state = ''
        if (i < factorIndex) state = 'done'
        else if (i === factorIndex) state = 'current'
        return (
          <div key={f.key} className={`dot ${state}`} title={`${pct}%`}>
            {i === factorIndex && (
              <span className="dot-fill" style={{ width: `${pct}%` }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
