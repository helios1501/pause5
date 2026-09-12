export default function BarRow({ factor, score, highlighted }) {
  const pct = Math.round(score.pct)
  const level = pct >= 75 ? 'green' : pct >= 50 ? 'yellow' : 'red'
  const color = level === 'green' ? '#10b981' : level === 'yellow' ? '#f59e0b' : '#ef4444'
  const dotEmoji = level === 'green' ? '🟢' : level === 'yellow' ? '🟡' : '🔴'
  return (
    <div className={`bar-row ${highlighted ? 'highlighted' : ''}`}>
      <span className="ic">{factor.icon}</span>
      <span className="nm">{factor.title}</span>
      <span className="bg">
        <span
          className="fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <span className="val">{pct}%</span>
      <span className="st">{dotEmoji}</span>
    </div>
  )
}
