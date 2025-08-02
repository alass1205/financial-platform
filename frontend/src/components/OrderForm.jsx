import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Calculator, AlertCircle } from 'lucide-react'
import { useTokens } from '../hooks/useTokens'
import { useTrading } from '../hooks/useTrading'

function OrderForm({ selectedPair = 'CLV/TRG' }) {
  const { balances } = useTokens()
  const { createOrder, isLoading } = useTrading()
  
  const [orderType, setOrderType] = useState('BUY')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [total, setTotal] = useState(0)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parser la paire sélectionnée
  const [baseToken, quoteToken] = selectedPair.split('/')
  
  // Prix suggérés
  const suggestedPrices = {
    'CLV/TRG': { buy: 48, sell: 52 },
    'ROO/TRG': { buy: 43, sell: 47 },
    'GOV/TRG': { buy: 190, sell: 210 }
  }

  // Calculer le total automatiquement
  useEffect(() => {
    const q = parseFloat(quantity)
    const p = parseFloat(price)
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      setTotal(q * p)
    } else {
      setTotal(0)
    }
  }, [quantity, price])

  // NOUVELLE VALIDATION SIMPLIFIÉE
  const isFormValid = () => {
    const q = parseFloat(quantity)
    const p = parseFloat(price)
    
    // Vérifier que les champs sont remplis et valides
    if (!quantity || !price || isNaN(q) || isNaN(p) || q <= 0 || p <= 0) {
      return false
    }
    
    // Vérifier la balance
    const requiredBalance = orderType === 'BUY' ? total : q
    const tokenToCheck = orderType === 'BUY' ? quoteToken : baseToken
    const userBalance = parseFloat(balances.tokens[tokenToCheck]?.formatted || 0)
    
    if (requiredBalance > userBalance) {
      return false
    }
    
    return true
  }

  // Soumettre l'ordre - SIMPLIFIÉ
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('=== DEBUG SOUMISSION ===')
    console.log('Quantité:', quantity, typeof quantity)
    console.log('Prix:', price, typeof price)
    console.log('Total:', total)
    console.log('Form Valid:', isFormValid())
    
    if (!isFormValid()) {
      console.log('❌ Formulaire invalide')
      return
    }

    setIsSubmitting(true)
    setErrors({})
    
    try {
      console.log('🚀 Création ordre...')
      
      const orderData = {
        pair: selectedPair,
        type: orderType,
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        total: total
      }
      
      console.log('📦 Données ordre:', orderData)
      
      await createOrder(orderData)

      // Réinitialiser le formulaire
      setQuantity('')
      setPrice('')
      setTotal(0)
      setErrors({})
      
      alert(`✅ Ordre ${orderType} créé avec succès !`)
      console.log('✅ Ordre créé avec succès')
      
    } catch (error) {
      console.error('❌ Erreur création ordre:', error)
      setErrors({ submit: error.message })
      alert(`❌ Erreur: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remplir prix suggéré
  const fillSuggested = () => {
    const suggested = suggestedPrices[selectedPair]
    if (suggested) {
      setPrice(suggested[orderType.toLowerCase()].toString())
    }
  }

  // Balance disponible
  const getAvailableBalance = () => {
    const tokenToCheck = orderType === 'BUY' ? quoteToken : baseToken
    return parseFloat(balances.tokens[tokenToCheck]?.formatted || 0)
  }

  // Messages d'erreur détaillés
  const getValidationMessage = () => {
    const q = parseFloat(quantity)
    const p = parseFloat(price)
    
    if (!quantity) return 'Veuillez entrer une quantité'
    if (!price) return 'Veuillez entrer un prix'
    if (isNaN(q) || q <= 0) return 'Quantité invalide'
    if (isNaN(p) || p <= 0) return 'Prix invalide'
    
    const requiredBalance = orderType === 'BUY' ? total : q
    const tokenToCheck = orderType === 'BUY' ? quoteToken : baseToken
    const userBalance = parseFloat(balances.tokens[tokenToCheck]?.formatted || 0)
    
    if (requiredBalance > userBalance) {
      return `Balance insuffisante (${userBalance.toFixed(2)} ${tokenToCheck})`
    }
    
    return null
  }

  const validationMessage = getValidationMessage()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">📝 Créer un ordre</h3>
        <div className="text-sm text-gray-600">
          Paire : <span className="font-semibold">{selectedPair}</span>
        </div>
      </div>

      {/* Sélecteur Buy/Sell */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setOrderType('BUY')}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            orderType === 'BUY'
              ? 'border-success-500 bg-success-50 text-success-700'
              : 'border-gray-200 hover:border-success-300'
          }`}
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-2" />
          <div className="font-semibold">ACHETER {baseToken}</div>
          <div className="text-sm">avec {quoteToken}</div>
        </button>

        <button
          type="button"
          onClick={() => setOrderType('SELL')}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            orderType === 'SELL'
              ? 'border-danger-500 bg-danger-50 text-danger-700'
              : 'border-gray-200 hover:border-danger-300'
          }`}
        >
          <TrendingDown className="w-6 h-6 mx-auto mb-2" />
          <div className="font-semibold">VENDRE {baseToken}</div>
          <div className="text-sm">contre {quoteToken}</div>
        </button>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantité ({baseToken})
          </label>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={`Quantité de ${baseToken}`}
            className="input-field"
            required
          />
        </div>

        {/* Prix */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Prix ({quoteToken} par {baseToken})
            </label>
            <button
              type="button"
              onClick={fillSuggested}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Prix suggéré
            </button>
          </div>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={`Prix en ${quoteToken}`}
            className="input-field"
            required
          />
        </div>

        {/* Total calculé */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Total</span>
            </div>
            <span className={`text-lg font-bold ${total > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
              {total > 0 ? total.toFixed(2) : '0.00'} {quoteToken}
            </span>
          </div>
          {quantity && price && total > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {quantity} × {price} = {total.toFixed(2)} {quoteToken}
            </div>
          )}
        </div>

        {/* Balance disponible */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Balance disponible :</span>
          <span className="font-semibold">
            {getAvailableBalance().toFixed(2)} {orderType === 'BUY' ? quoteToken : baseToken}
          </span>
        </div>

        {/* Message de validation */}
        {validationMessage && (
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-warning-500 flex-shrink-0" />
            <span className="text-sm text-warning-700">{validationMessage}</span>
          </div>
        )}

        {/* Erreur de soumission */}
        {errors.submit && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0" />
            <span className="text-sm text-danger-700">{errors.submit}</span>
          </div>
        )}

        {/* Bouton soumettre */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid()}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            orderType === 'BUY'
              ? 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:shadow-medium'
              : 'bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:shadow-medium'
          }`}
        >
          {isSubmitting ? 'Création...' : `${orderType === 'BUY' ? 'Acheter' : 'Vendre'} ${baseToken}`}
        </button>

        {/* Debug info - À SUPPRIMER EN PRODUCTION */}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          Debug: Q={quantity} P={price} T={total.toFixed(2)} Valid={isFormValid() ? '✅' : '❌'}
        </div>
      </form>
    </div>
  )
}

export default OrderForm
