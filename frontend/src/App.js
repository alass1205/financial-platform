import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import PortfolioPage from './components/PortfolioPage';
import TradingPage from './components/TradingPage';
import AssetPage from './components/AssetPage';
import FAQPage from './components/FAQPage';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Page d'accueil */}
            <Route path="/" element={<HomePage />} />
            
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Pages principales */}
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/trading" element={<TradingPage />} />
            
            {/* Pages assets individuelles - NOUVEAU */}
            <Route path="/asset/CLV" element={<AssetPage />} />
            <Route path="/asset/ROO" element={<AssetPage />} />
            <Route path="/asset/GOV" element={<AssetPage />} />
            
            {/* FAQ */}
            <Route path="/faq" element={<FAQPage />} />
            
            {/* Redirection pour routes non trouvées */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
