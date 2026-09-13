import { useEffect, useState } from 'react'
import { FACTORS } from './questions.js'
import {
  SCREEN_INTRO,
  SCREEN_SEARCH,
  SCREEN_FACTOR,
  SCREEN_LOADING,
  SCREEN_RESULT,
} from './components/constants.js'
import IntroScreen from './components/IntroScreen.jsx'
import ProductSearch from './components/ProductSearch.jsx'
import FactorScreen from './components/FactorScreen.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import './App.css'

const TOTAL_FACTORS = FACTORS.length // 5

function App() {
  // state
  const [screen, setScreen] = useState(SCREEN_INTRO) // intro | search | factor | loading | result
  const [factorIndex, setFactorIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  // Thông tin sản phẩm & giá từ PricesAPI (có thể null nếu người dùng bỏ qua)
  const [product, setProduct] = useState(null)

  const onAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const goToFactor = (idx) => {
    setFactorIndex(idx)
    setScreen(SCREEN_FACTOR)
  }

  const handleNext = () => {
    if (factorIndex === TOTAL_FACTORS - 1) {
      setScreen(SCREEN_LOADING)
    } else {
      setFactorIndex((i) => i + 1)
    }
  }

  const handlePrev = () => {
    if (factorIndex === 0) {
      // Quay lại bước tra giá thay vì intro
      setScreen(SCREEN_SEARCH)
    } else {
      setFactorIndex((i) => i - 1)
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setFactorIndex(0)
    setProduct(null)
    setScreen(SCREEN_INTRO)
  }

  const handleSkipSearch = () => {
    setProduct(null)
    goToFactor(0)
  }

  const handleConfirmSearch = (priceData) => {
    setProduct(priceData)
    goToFactor(0)
  }

  useEffect(() => {
    if (screen === SCREEN_LOADING) {
      const t = setTimeout(() => setScreen(SCREEN_RESULT), 1200)
      return () => clearTimeout(t)
    }
  }, [screen])

  const currentFactor = FACTORS[factorIndex]

  return (
    <div className="pause5-app">
      <div className="pause5-container">
        <header className="pause5-header">
          <h1>BỘ LỌC QUYẾT ĐỊNH SỐ PAUSE-5</h1>
          <p>
            Người tiêu dùng thông minh<br/>Tự kiểm tra quyết định mua hàng — Phát triển từ dự án nghiên cứu khoa học cấp trường THPT Long Trường.
          </p>
        </header>

        {screen === SCREEN_INTRO && <IntroScreen onStart={() => setScreen(SCREEN_SEARCH)} />}

        {screen === SCREEN_SEARCH && (
          <ProductSearch
            onConfirm={handleConfirmSearch}
            onSkip={handleSkipSearch}
          />
        )}

        {screen === SCREEN_FACTOR && currentFactor && (
          <>
            <ProgressBar factorIndex={factorIndex} factors={FACTORS} answers={answers} />
            <FactorScreen
              factor={currentFactor}
              factorIndex={factorIndex}
              answers={answers}
              onAnswer={onAnswer}
              onPrev={handlePrev}
              onNext={handleNext}
            />
          </>
        )}

        {screen === SCREEN_LOADING && <LoadingScreen />}

        {screen === SCREEN_RESULT && (
          <ResultScreen
            answers={answers}
            product={product}
            onRestart={handleRestart}
          />
        )}

        <footer className="pause5-footer">
          Điểm số chỉ phản ánh mức độ bạn đã cân nhắc — không phải chất lượng sản phẩm.
          <br />
          © {new Date().getFullYear()} PAUSE-5 Decision Readiness Tool
        </footer>
      </div>
    </div>
  )
}

export default App