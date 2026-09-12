export default function LoadingScreen() {
  return (
    <div className="pause5-card pause5-loading">
      <div className="spinner" aria-hidden="true" />
      <h3>PAUSE-5 đang phân tích quyết định của bạn…</h3>
      <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
        Đang tính điểm từng yếu tố và áp dụng các quy tắc khóa.
      </p>
    </div>
  )
}
