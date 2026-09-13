export default function LoadingScreen({
  title = 'PAUSE-5 đang phân tích quyết định của bạn…',
  subtitle = 'Đang tính điểm từng yếu tố và áp dụng các quy tắc khóa.',
}) {
  return (
    <div className="pause5-card pause5-loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <h3>{title}</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{subtitle}</p>
    </div>
  )
}