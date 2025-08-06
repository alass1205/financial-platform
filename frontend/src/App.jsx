import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Trading from './pages/Trading'
import Settings from './pages/Settings'
import AssetPage from './pages/AssetPage'
import FAQPage from './components/FAQPage'
import './index.css'

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/asset/:symbol" element={<AssetPage />} />
            <Route path="/faq" element={<FAQPage />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  )
}

export default App
