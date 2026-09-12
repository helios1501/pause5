// 10 câu hỏi PAUSE-5 theo 5 yếu tố P-A-U-S-E
// Mỗi câu chọn mức 1-5 (1: Hoàn toàn không đúng, 5: Hoàn toàn đúng)
// Tham chiếu: nội dung "forms hoặc app.pdf"

export const SCALE_LABELS = {
  1: 'Hoàn toàn không đúng',
  2: 'Không đúng',
  3: 'Chưa chắc / Phân vân',
  4: 'Khá đúng',
  5: 'Hoàn toàn đúng',
}

export const FACTORS = [
  {
    key: 'P',
    title: 'Promotion',
    subtitle: 'Quảng cáo & lợi ích thương mại',
    icon: '🏷️',
    color: '#f59e0b',
    questions: [
      'Tôi đã xác định được nội dung này có quảng cáo, tài trợ, affiliate hoặc mục đích bán hàng hay không.',
      'Tôi hiểu người đăng có thể nhận tiền, quà tặng, hoa hồng hoặc lợi ích khác nếu tôi mua sản phẩm.',
    ],
  },
  {
    key: 'A',
    title: 'Assess',
    subtitle: 'Đánh giá bằng chứng',
    icon: '🔍',
    color: '#3b82f6',
    questions: [
      'Thông tin về sản phẩm có bằng chứng, trải nghiệm cụ thể hoặc cơ sở rõ ràng chứ không chỉ là lời khen.',
      'Tôi đã thấy hoặc tìm được cả ưu điểm và hạn chế của sản phẩm trước khi quyết định.',
    ],
  },
  {
    key: 'U',
    title: 'Urgency',
    subtitle: 'Kiểm soát áp lực mua nhanh',
    icon: '⏱️',
    color: '#ef4444',
    questions: [
      'Tôi nhận ra các cách thúc mua nhanh như "chỉ hôm nay", "sắp hết", "đang viral", "ai cũng mua".',
      'Nếu không còn giảm giá, countdown hoặc hiệu ứng "đang hot", tôi vẫn muốn cân nhắc sản phẩm này.',
    ],
  },
  {
    key: 'S',
    title: 'Search',
    subtitle: 'Kiểm chứng độc lập',
    icon: '🌐',
    color: '#10b981',
    questions: [
      'Tôi đã kiểm tra sản phẩm từ ít nhất một hoặc hai nguồn khác ngoài KOL/KOC đang giới thiệu.',
      'Tôi đã kiểm tra hoặc so sánh giá, thông tin chính thức, đánh giá người mua hay chính sách của sản phẩm.',
    ],
  },
  {
    key: 'E',
    title: 'Evaluate',
    subtitle: 'Đánh giá nhu cầu & ngân sách',
    icon: '💡',
    color: '#8b5cf6',
    questions: [
      'Sản phẩm này đáp ứng một nhu cầu thực sự của tôi, không chỉ vì tôi vừa xem nội dung giới thiệu.',
      'Mức giá của sản phẩm phù hợp với khả năng chi trả / ngân sách của tôi.',
    ],
  },
]
