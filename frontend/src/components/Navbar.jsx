import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAssetsMenuOpen, setIsAssetsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Financial Platform</h1>
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Accueil
                </Link>
                
                {user && (
                  <>
                    <Link
                      to="/portfolio"
                      className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Portfolio
                    </Link>
                    <Link
                      to="/trading"
                      className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Trading
                    </Link>
                    
                    {/* Menu déroulant Assets - NOUVEAU */}
                    <div className="relative">
                      <button
                        onClick={() => setIsAssetsMenuOpen(!isAssetsMenuOpen)}
                        className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                      >
                        Assets
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isAssetsMenuOpen && (
                        <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                          <div className="py-1">
                            <Link
                              to="/asset/CLV"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setIsAssetsMenuOpen(false)}
                            >
                              <div className="font-medium">CLV - Clove Company</div>
                              <div className="text-xs text-gray-500">Actions • 10 TRG</div>
                            </Link>
                            <Link
                              to="/asset/ROO"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setIsAssetsMenuOpen(false)}
                            >
                              <div className="font-medium">ROO - Rooibos Limited</div>
                              <div className="text-xs text-gray-500">Actions • 10 TRG</div>
                            </Link>
                            <Link
                              to="/asset/GOV"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                              onClick={() => setIsAssetsMenuOpen(false)}
                            >
                              <div className="font-medium">GOV - Government Bonds</div>
                              <div className="text-xs text-gray-500">Obligations • 200 TRG</div>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                <Link
                  to="/faq"
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                  Bienvenue, {user.walletAddress ? 
                    `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 
                    user.email
                  }
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="text-white hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Fermer le menu si on clique ailleurs */}
      {isAssetsMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsAssetsMenuOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
