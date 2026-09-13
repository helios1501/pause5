import { FACTORS } from '../questions.js'

export default function IntroScreen({ onStart }) {
  return (
    <div className="pause5-card pause5-intro">
      <span className="badge">PAUSE-5</span>
      <h2>TỰ KIỂM TRA TRƯỚC KHI QUYẾT ĐỊNH MUA</h2>
      <p>
        Hãy dành khoảng 60–90 giây để kiểm tra quyết định của bạn. Không có câu trả lời đúng hay sai.
        Hãy trả lời đúng với tình huống hiện tại của bạn.
      </p>
      <div className="factors">
        {FACTORS.map((f) => (
          <div className="f" key={f.key}>
            <div className="ic">{f.icon}</div>
            <div>
              <strong>{f.title}</strong>
            </div>
            <div className="lb">{f.subtitle}</div>
          </div>
        ))}
      </div>
      <button className="pause5-btn pause5-btn-primary" onClick={onStart}>
        TRA GIÁ & BẮT ĐẦU →
      </button>
      <p className="hint" style={{ marginTop: 12, fontSize: 12 }}>
        Bước tiếp theo: nhập sản phẩm để so sánh giá, sau đó làm bài tự đánh giá 5 yếu tố P-A-U-S-E.
      </p>
    </div>
  )
}