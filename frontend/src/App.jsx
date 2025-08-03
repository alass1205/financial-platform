import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Trading from './pages/Trading'
import Settings from './pages/Settings'
import AssetPage from './components/AssetPage'
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
            
            {/* Pages assets individuelles - NOUVEAU */}
            <Route path="/asset/CLV" element={<AssetPage />} />
            <Route path="/asset/ROO" element={<AssetPage />} />
            <Route path="/asset/GOV" element={<AssetPage />} />
            
            {/* FAQ */}
            <Route path="/faq" element={<FAQPage />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  )
}

export default App
