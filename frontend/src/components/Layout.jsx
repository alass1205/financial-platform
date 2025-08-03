import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, TrendingUp, Settings, BarChart3, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import WalletButton from './WalletButton'

function Layout({ children }) {
  const location = useLocation()
  const [isAssetsMenuOpen, setIsAssetsMenuOpen] = useState(false)
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'Trading', href: '/trading', icon: TrendingUp },
    { name: 'Assets', href: '#', icon: BarChart3, isDropdown: true },
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ]

  const assetsItems = [
    { name: 'CLV - Clove Company', href: '/asset/CLV', price: '10 TRG', type: 'Actions' },
    { name: 'ROO - Rooibos Limited', href: '/asset/ROO', price: '10 TRG', type: 'Actions' },
    { name: 'GOV - Government Bonds', href: '/asset/GOV', price: '200 TRG', type: 'Obligations' }
  ]

  const isActive = (href) => {
    if (href === '#') return false
    return location.pathname === href || location.pathname.startsWith('/asset')
  }

  const handleAssetsClick = (e) => {
    e.preventDefault()
    setIsAssetsMenuOpen(!isAssetsMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DF</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                DeFi Platform
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1 relative">
              {navigation.map((item) => {
                const Icon = item.icon
                
                if (item.isDropdown) {
                  return (
                    <div key={item.name} className="relative">
                      <button
                        onClick={handleAssetsClick}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          isActive(item.href)
                            ? 'bg-primary-50 text-primary-700 font-semibold'
                            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                        <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isAssetsMenuOpen && (
                        <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                          <div className="py-2">
                            {assetsItems.map((asset) => (
                              <Link
                                key={asset.href}
                                to={asset.href}
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={() => setIsAssetsMenuOpen(false)}
                              >
                                <div className="font-medium text-gray-900">{asset.name}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {asset.type} • Prix par défaut: {asset.price}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Navigation mobile */}
      <nav className="md:hidden bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {navigation.map((item) => {
              const Icon = item.icon
              
              if (item.isDropdown) {
                return (
                  <button
                    key={item.name}
                    onClick={handleAssetsClick}
                    className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.href) ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.name}</span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.href) ? 'text-primary-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Menu mobile Assets */}
      {isAssetsMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-2">
            {assetsItems.map((asset) => (
              <Link
                key={asset.href}
                to={asset.href}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
                onClick={() => setIsAssetsMenuOpen(false)}
              >
                <div className="font-medium text-gray-900">{asset.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {asset.type} • Prix par défaut: {asset.price}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Fermer le menu si on clique ailleurs */}
      {isAssetsMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsAssetsMenuOpen(false)}
        ></div>
      )}

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
